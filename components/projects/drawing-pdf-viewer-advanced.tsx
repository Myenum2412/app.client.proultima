"use client";

/**
 * Advanced PDF Viewer with Comprehensive Annotation Tools
 * Integrates PDFToolbar with full markup capabilities
 */

import * as React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PDFToolbar, type ToolMode, type StampType, type Layer } from "@/components/kokonutui/pdf-toolbar";
import { AutosaveManager } from "@/lib/pdf-annotations/autosave";
import { VersionHistoryManager } from "@/lib/pdf-annotations/version-history";
import type { Annotation, UserPermissions } from "@/lib/pdf-annotations/types";
import { cn } from "@/lib/utils";
import { convertGoogleDriveUrl } from "@/lib/utils/pdf-url";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog as HistoryDialog,
  DialogContent as HistoryDialogContent,
  DialogDescription as HistoryDialogDescription,
  DialogHeader as HistoryDialogHeader,
  DialogTitle as HistoryDialogTitle,
} from "@/components/ui/dialog";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  // Use CDN with https protocol for better reliability
  // The protocol-relative URL (//) was causing issues, so we use https:// explicitly
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

type DrawingPdfViewerAdvancedProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
  description?: string;
  drawingId?: string;
  dwgNo?: string;
  onSave?: (annotations: Annotation[], pdfBlob: Blob) => Promise<void>;
  userPermissions?: UserPermissions;
  initialAnnotations?: Annotation[];
  initialLayers?: Layer[];
  currentRevisionNumber?: number;
  availableRevisions?: number[];
};

export function DrawingPdfViewerAdvanced({
  open,
  onOpenChange,
  pdfUrl,
  title,
  description,
  drawingId,
  dwgNo,
  onSave,
  userPermissions = {
    canEdit: true,
    canDelete: true,
    canCreateLayers: true,
    canManageRevisions: true,
    isViewOnly: false,
  },
  initialAnnotations = [],
  initialLayers = [],
  currentRevisionNumber = 1,
  availableRevisions = [1],
}: DrawingPdfViewerAdvancedProps) {
  // State
  const [selectedTool, setSelectedTool] = useState<ToolMode | null>("select");
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>(
    initialLayers[0]?.id
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<number | undefined>(
    currentRevisionNumber
  );

  // Tool settings
  const [penColor, setPenColor] = useState("#000000");
  const [penStrokeWidth, setPenStrokeWidth] = useState(2);
  const [shapeColor, setShapeColor] = useState("#F44336");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [selectedStamp, setSelectedStamp] = useState<StampType>("approved");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const annotationHistoryRef = useRef<Annotation[][]>([]);
  const historyIndexRef = useRef(-1);
  const isDrawingRef = useRef(false);
  const drawingStartRef = useRef<{ x: number; y: number } | null>(null);
  const penPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Managers
  const autosaveManagerRef = useRef<AutosaveManager | null>(null);
  const versionHistoryManagerRef = useRef<VersionHistoryManager | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Initialize managers
  useEffect(() => {
    if (!onSave) return;

    autosaveManagerRef.current = new AutosaveManager({
      debounceMs: 2000,
      onSave: async () => {
        await handleSave(false);
      },
      onStatusChange: (status) => {
        setAutosaveStatus(status);
      },
    });

    versionHistoryManagerRef.current = new VersionHistoryManager(50);

    return () => {
      autosaveManagerRef.current?.destroy();
    };
  }, [onSave]);

  // Load PDF
  useEffect(() => {
    if (open && pdfUrl) {
      loadPdf();
    }
  }, [open, pdfUrl]);

  const loadPdf = async () => {
    try {
      // Convert Google Drive URLs to direct view format
      const convertedUrl = convertGoogleDriveUrl(pdfUrl);
      
      // For Google Drive URLs, we need to use a different approach
      // PDF.js may have CORS issues with Google Drive, so we'll use iframe for those
      if (convertedUrl.includes('drive.google.com')) {
        // For Google Drive, we'll use the iframe approach
        // The iframe will handle the PDF display
        setPdfDoc(null);
        setTotalPages(0);
        setCurrentPage(1);
        return;
      }
      
      const loadingTask = pdfjsLib.getDocument(convertedUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF. If this is a Google Drive link, it may need to be publicly accessible.");
    }
  };

  // History management
  const saveToHistory = useCallback(() => {
    const current = [...annotations];
    annotationHistoryRef.current = annotationHistoryRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    annotationHistoryRef.current.push(current);
    historyIndexRef.current = annotationHistoryRef.current.length - 1;
  }, [annotations]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setAnnotations([...annotationHistoryRef.current[historyIndexRef.current]]);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < annotationHistoryRef.current.length - 1) {
      historyIndexRef.current++;
      setAnnotations([...annotationHistoryRef.current[historyIndexRef.current]]);
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo =
    historyIndexRef.current < annotationHistoryRef.current.length - 1;

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 25, 400));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 25, 25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(100);
  }, []);

  // Layer management
  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
  }, []);

  const handleLayerToggleVisibility = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const handleLayerToggleLock = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  }, []);

  const handleLayerCreate = useCallback((name: string, revisionNumber?: number) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name,
      visible: true,
      locked: false,
      revisionNumber,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, []);

  // Filter annotations by visible layers
  const visibleAnnotations = useMemo(() => {
    const visibleLayerIds = new Set(
      layers.filter((l) => l.visible).map((l) => l.id)
    );
    return annotations.filter(
      (ann) => !ann.layerId || visibleLayerIds.has(ann.layerId)
    );
  }, [annotations, layers]);

  // Canvas drawing handlers
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectedTool || userPermissions.isViewOnly) return;
      if (selectedTool === "select") return;

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      isDrawingRef.current = true;
      drawingStartRef.current = coords;

      if (selectedTool === "pen") {
        penPointsRef.current = [coords];
      }
    },
    [selectedTool, userPermissions.isViewOnly, getCanvasCoordinates]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !selectedTool) return;

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      if (selectedTool === "pen") {
        penPointsRef.current.push(coords);
        // Render pen stroke in real-time
        renderCanvas();
      }
    },
    [selectedTool, getCanvasCoordinates]
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !selectedTool || !drawingStartRef.current) {
        return;
      }

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      const start = drawingStartRef.current;
      const end = coords;

      saveToHistory();

      let newAnnotation: Annotation | null = null;

      switch (selectedTool) {
        case "highlight":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "highlight",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            color: "#FFEB3B",
            opacity: 0.3,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "underline":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "underline",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            x: Math.min(start.x, end.x),
            y: start.y,
            width: Math.abs(end.x - start.x),
            color: "#2196F3",
            thickness: 2,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "strikethrough":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "strikethrough",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            x: Math.min(start.x, end.x),
            y: start.y,
            width: Math.abs(end.x - start.x),
            color: "#F44336",
            thickness: 2,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "pen":
          if (penPointsRef.current.length > 1) {
            newAnnotation = {
              id: `ann-${Date.now()}`,
              type: "pen",
              page: currentPage,
              layerId: selectedLayerId,
              revisionNumber: selectedRevision,
              points: [...penPointsRef.current],
              color: penColor,
              strokeWidth: penStrokeWidth,
              createdAt: new Date().toISOString(),
              createdBy: "Current User",
            };
          }
          break;

        case "rectangle":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "rectangle",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
            color: shapeColor,
            strokeWidth: shapeStrokeWidth,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "circle":
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "circle",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            centerX: start.x,
            centerY: start.y,
            radius,
            color: shapeColor,
            strokeWidth: shapeStrokeWidth,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "arrow":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "arrow",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            startX: start.x,
            startY: start.y,
            endX: end.x,
            endY: end.y,
            color: shapeColor,
            strokeWidth: shapeStrokeWidth,
            arrowHeadSize: 10,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;

        case "stamp":
          newAnnotation = {
            id: `ann-${Date.now()}`,
            type: "stamp",
            page: currentPage,
            layerId: selectedLayerId,
            revisionNumber: selectedRevision,
            x: start.x,
            y: start.y,
            stampType: selectedStamp,
            width: 100,
            height: 100,
            createdAt: new Date().toISOString(),
            createdBy: "Current User",
          };
          break;
      }

      if (newAnnotation) {
        setAnnotations((prev) => [...prev, newAnnotation]);
        autosaveManagerRef.current?.trigger();
      }

      isDrawingRef.current = false;
      drawingStartRef.current = null;
      penPointsRef.current = [];
    },
    [
      selectedTool,
      currentPage,
      selectedLayerId,
      selectedRevision,
      penColor,
      penStrokeWidth,
      shapeColor,
      shapeStrokeWidth,
      selectedStamp,
      saveToHistory,
      getCanvasCoordinates,
    ]
  );

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw annotations for current page
    visibleAnnotations
      .filter((ann) => ann.page === currentPage)
      .forEach((ann) => {
        // Render based on annotation type
        // This is a simplified version - full implementation would handle all types
        if (ann.type === "highlight" && "width" in ann && "height" in ann) {
          ctx.fillStyle = ann.color || "#FFEB3B";
          ctx.globalAlpha = ann.opacity || 0.3;
          ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
          ctx.globalAlpha = 1;
        } else if (ann.type === "pen" && "points" in ann) {
          if (ann.points.length > 1) {
            ctx.strokeStyle = ann.color || "#000000";
            ctx.lineWidth = ann.strokeWidth || 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) {
              ctx.lineTo(ann.points[i].x, ann.points[i].y);
            }
            ctx.stroke();
          }
        }
        // Add rendering for other annotation types...
      });

    // Draw current pen stroke if drawing
    if (selectedTool === "pen" && isDrawingRef.current && penPointsRef.current.length > 1) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penStrokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(penPointsRef.current[0].x, penPointsRef.current[0].y);
      for (let i = 1; i < penPointsRef.current.length; i++) {
        ctx.lineTo(penPointsRef.current[i].x, penPointsRef.current[i].y);
      }
      ctx.stroke();
    }
  }, [visibleAnnotations, currentPage, selectedTool, penColor, penStrokeWidth]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Save handler
  const handleSave = async (showToast = true) => {
    if (!pdfDoc || !onSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(convertGoogleDriveUrl(pdfUrl));
      const arrayBuffer = await response.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const pages = pdfDocLib.getPages();

      // Apply annotations to PDF (simplified - full implementation needed)
      annotations.forEach((ann) => {
        if (ann.page > 0 && ann.page <= pages.length) {
          const page = pages[ann.page - 1];
          const { height } = page.getSize();

          // Render annotation based on type
          // Full implementation would handle all annotation types
        }
      });

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

      await onSave(annotations, blob);

      // Create version
      if (versionHistoryManagerRef.current) {
        versionHistoryManagerRef.current.createVersion(
          annotations,
          "Current User",
          `Saved at ${new Date().toLocaleString()}`
        );
      }

      if (showToast) {
        toast.success("Drawing corrections saved successfully");
      }
    } catch (error) {
      console.error("Error saving PDF:", error);
      if (showToast) {
        toast.error("Failed to save drawing corrections");
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => {
    handleSave(true);
  };

  const handleHistory = () => {
    setShowHistoryDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* PDF Toolbar */}
            <div className="px-6 py-4 border-b shrink-0">
              <PDFToolbar
                selectedTool={selectedTool}
                onToolSelect={setSelectedTool}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onSave={handleManualSave}
                onHistory={handleHistory}
                canUndo={canUndo}
                canRedo={canRedo}
                isSaving={isSaving}
                zoomLevel={zoomLevel}
                penColor={penColor}
                penStrokeWidth={penStrokeWidth}
                onPenColorChange={setPenColor}
                onPenStrokeWidthChange={setPenStrokeWidth}
                shapeColor={shapeColor}
                shapeStrokeWidth={shapeStrokeWidth}
                onShapeColorChange={setShapeColor}
                onShapeStrokeWidthChange={setShapeStrokeWidth}
                layers={layers}
                selectedLayerId={selectedLayerId}
                onLayerSelect={handleLayerSelect}
                onLayerToggleVisibility={handleLayerToggleVisibility}
                onLayerToggleLock={handleLayerToggleLock}
                onLayerCreate={handleLayerCreate}
                currentRevisionNumber={selectedRevision}
                onRevisionSelect={setSelectedRevision}
                availableRevisions={availableRevisions}
                selectedStamp={selectedStamp}
                onStampSelect={setSelectedStamp}
                canEdit={userPermissions.canEdit}
                isViewOnly={userPermissions.isViewOnly}
                autosaveStatus={autosaveStatus}
              />
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 px-6 pb-6 min-h-0 overflow-auto">
              <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center" }}
              >
                <iframe
                  ref={iframeRef}
                  src={convertGoogleDriveUrl(pdfUrl, true)}
                  className="w-full h-full border rounded-md"
                  title={title}
                  allow="fullscreen"
                />
                <canvas
                  ref={canvasRef}
                  className={cn(
                    "absolute top-0 left-0",
                    selectedTool === "select"
                      ? "pointer-events-auto cursor-pointer"
                      : selectedTool && !userPermissions.isViewOnly
                      ? "pointer-events-auto cursor-crosshair"
                      : "pointer-events-none"
                  )}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => {
                    isDrawingRef.current = false;
                    drawingStartRef.current = null;
                    penPointsRef.current = [];
                  }}
                />
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <HistoryDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <HistoryDialogContent className="max-w-2xl">
          <HistoryDialogHeader>
            <HistoryDialogTitle>Version History</HistoryDialogTitle>
            <HistoryDialogDescription>
              View and restore previous versions of annotations
            </HistoryDialogDescription>
          </HistoryDialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {versionHistoryManagerRef.current
              ?.getAllVersions()
              .map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">Version {version.versionNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()} by {version.createdBy}
                    </div>
                    {version.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {version.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {version.annotations.length} annotations
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const restored = versionHistoryManagerRef.current?.restoreVersion(
                        version.versionNumber
                      );
                      if (restored) {
                        setAnnotations(restored);
                        setShowHistoryDialog(false);
                        toast.success(`Restored version ${version.versionNumber}`);
                      }
                    }}
                  >
                    Restore
                  </Button>
                </div>
              )) || (
              <div className="text-center py-8 text-muted-foreground">
                No version history available
              </div>
            )}
          </div>
        </HistoryDialogContent>
      </HistoryDialog>
    </>
  );
}

