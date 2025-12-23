"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toolbar } from "@/components/kokonutui/toolbar";
import {
  Save,
  Download,
  Undo,
  Redo,
  X,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { convertGoogleDriveUrl } from "@/lib/utils/pdf-url";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  // Use CDN with https protocol for better reliability
  // The protocol-relative URL (//) was causing issues, so we use https:// explicitly
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

type Annotation = {
  id: string;
  type: "highlight" | "strikethrough" | "note";
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
  color?: string;
  text?: string;
  title?: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
};

type DrawingPdfViewerEnhancedProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
  description?: string;
  drawingId?: string;
  dwgNo?: string;
  onSave?: (annotations: Annotation[], pdfBlob: Blob) => Promise<void>;
};

type ToolMode = "select" | "highlight" | "strikethrough" | "note" | "move";

export function DrawingPdfViewerEnhanced({
  open,
  onOpenChange,
  pdfUrl,
  title,
  description,
  drawingId,
  dwgNo,
  onSave,
}: DrawingPdfViewerEnhancedProps) {
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [isEditing, setIsEditing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [notePosition, setNotePosition] = useState<{ x: number; y: number } | null>(null);
  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const annotationHistoryRef = useRef<Annotation[][]>([]);
  const historyIndexRef = useRef(-1);

  // Load PDF when dialog opens
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

  const handleToolbarAction = (toolId: string) => {
    switch (toolId) {
      case "select":
        setToolMode("select");
        break;
      case "move":
        setToolMode("move");
        break;
      case "shapes":
        // Could be used for drawing shapes
        break;
      case "export":
        handleExport();
        break;
      default:
        break;
    }
  };

  const handleAnnotationTool = (type: "highlight" | "strikethrough" | "note") => {
    setToolMode(type);
    setIsEditing(true);
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on an existing annotation (in select mode)
      if (toolMode === "select") {
        const clickedAnnotation = annotations
          .filter((ann) => ann.page === currentPage)
          .find((ann) => {
            if (ann.type === "highlight" && ann.width && ann.height) {
              return (
                x >= ann.x &&
                x <= ann.x + ann.width &&
                y >= ann.y &&
                y <= ann.y + ann.height
              );
            } else if (ann.type === "strikethrough" && ann.width) {
              return (
                x >= ann.x &&
                x <= ann.x + ann.width &&
                Math.abs(y - ann.y) < 10
              );
            } else if (ann.type === "note") {
              return Math.abs(x - ann.x) < 10 && Math.abs(y - ann.y) < 10;
            }
            return false;
          });

        if (clickedAnnotation) {
          setSelectedAnnotation(clickedAnnotation);
          return;
        } else {
          setSelectedAnnotation(null);
        }
      }

      if (!isEditing) return;

      if (toolMode === "note" && !isEditingAnnotation) {
        setNotePosition({ x, y });
        setNoteText("");
        setNoteTitle("");
        setNoteDescription("");
        setIsEditingAnnotation(false);
        setShowNoteDialog(true);
        return;
      }

      if (toolMode === "highlight" || toolMode === "strikethrough") {
        const newAnnotation: Annotation = {
          id: `ann-${Date.now()}`,
          type: toolMode,
          x,
          y,
          width: 100,
          height: toolMode === "highlight" ? 20 : 2,
          page: currentPage,
          color: toolMode === "highlight" ? "#FFEB3B" : "#F44336",
          createdAt: new Date().toISOString(),
          createdBy: "Current User", // Get from auth context
        };

        saveToHistory();
        setAnnotations((prev) => [...prev, newAnnotation]);
        setIsEditing(false);
        setToolMode("select");
      }
    },
    [toolMode, isEditing, currentPage, annotations, isEditingAnnotation]
  );

  const handleAddNote = () => {
    if (!notePosition || (!noteText.trim() && !noteTitle.trim())) return;

    if (isEditingAnnotation && selectedAnnotation && !selectedAnnotation.id.startsWith("temp")) {
      // Update existing annotation
      saveToHistory();
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === selectedAnnotation.id
            ? {
                ...ann,
                text: noteText,
                title: noteTitle,
                description: noteDescription,
                updatedAt: new Date().toISOString(),
                updatedBy: "Current User",
              }
            : ann
        )
      );
    } else {
      // Create new annotation
      const annotationType = selectedAnnotation?.type || "note";
      const newAnnotation: Annotation = {
        id: selectedAnnotation?.id.startsWith("temp") 
          ? `ann-${Date.now()}` 
          : `ann-${Date.now()}`,
        type: annotationType,
        x: notePosition.x,
        y: notePosition.y,
        width: selectedAnnotation?.width || (annotationType === "highlight" ? 100 : annotationType === "strikethrough" ? 100 : undefined),
        height: selectedAnnotation?.height || (annotationType === "highlight" ? 20 : annotationType === "strikethrough" ? 2 : undefined),
        page: currentPage,
        text: noteText,
        title: noteTitle,
        description: noteDescription,
        color: selectedAnnotation?.color || (annotationType === "highlight" ? "#FFEB3B" : annotationType === "strikethrough" ? "#F44336" : "#2196F3"),
        createdAt: new Date().toISOString(),
        createdBy: "Current User",
      };

      saveToHistory();
      if (selectedAnnotation?.id.startsWith("temp")) {
        // Replace temp annotation
        setAnnotations((prev) => prev.filter(ann => ann.id !== selectedAnnotation.id).concat(newAnnotation));
      } else {
        setAnnotations((prev) => [...prev, newAnnotation]);
      }
    }

    setNoteText("");
    setNoteTitle("");
    setNoteDescription("");
    setNotePosition(null);
    setShowNoteDialog(false);
    setIsEditing(false);
    setIsEditingAnnotation(false);
    setSelectedAnnotation(null);
    setToolMode("select");
  };

  const saveToHistory = () => {
    const current = [...annotations];
    annotationHistoryRef.current = annotationHistoryRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    annotationHistoryRef.current.push(current);
    historyIndexRef.current = annotationHistoryRef.current.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setAnnotations([...annotationHistoryRef.current[historyIndexRef.current]]);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < annotationHistoryRef.current.length - 1) {
      historyIndexRef.current++;
      setAnnotations([...annotationHistoryRef.current[historyIndexRef.current]]);
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    saveToHistory();
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    setSelectedAnnotation(null);
    setIsEditingAnnotation(false);
  };

  const handleEditAnnotation = (annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    if (annotation.type === "note") {
      setNoteText(annotation.text || "");
      setNoteTitle(annotation.title || "");
      setNoteDescription(annotation.description || "");
      setNotePosition({ x: annotation.x, y: annotation.y });
      setIsEditingAnnotation(true);
      setShowNoteDialog(true);
    } else {
      // For highlight and strikethrough, show edit dialog with title/description
      setNoteTitle(annotation.title || "");
      setNoteDescription(annotation.description || "");
      setNoteText("");
      setIsEditingAnnotation(true);
      setShowNoteDialog(true);
    }
  };

  const handleSave = async () => {
    if (!pdfDoc || !onSave) return;

    setIsSaving(true);
    try {
      // Load original PDF
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const pages = pdfDocLib.getPages();

      // Apply annotations to PDF
      annotations.forEach((ann) => {
        if (ann.page > 0 && ann.page <= pages.length) {
          const page = pages[ann.page - 1];
          const { width, height } = page.getSize();

          if (ann.type === "highlight" && ann.width && ann.height) {
            page.drawRectangle({
              x: ann.x,
              y: height - ann.y - ann.height,
              width: ann.width,
              height: ann.height,
              color: rgb(1, 0.92, 0.23), // Yellow highlight
              opacity: 0.3,
            });
            // Add title and description for highlight
            if (ann.title || ann.description) {
              const fontSize = 10;
              let yOffset = height - ann.y - ann.height - 5;
              if (ann.title) {
                page.drawText(ann.title, {
                  x: ann.x,
                  y: yOffset,
                  size: fontSize,
                  color: rgb(0, 0, 0),
                });
                yOffset -= fontSize + 2;
              }
              if (ann.description) {
                page.drawText(ann.description.substring(0, 100), {
                  x: ann.x,
                  y: yOffset,
                  size: fontSize - 2,
                  color: rgb(0.3, 0.3, 0.3),
                });
              }
            }
          } else if (ann.type === "strikethrough" && ann.width) {
            page.drawLine({
              start: { x: ann.x, y: height - ann.y },
              end: { x: ann.x + ann.width, y: height - ann.y },
              thickness: 2,
              color: rgb(0.96, 0.26, 0.21), // Red
            });
          } else if (ann.type === "note") {
            page.drawRectangle({
              x: ann.x - 5,
              y: height - ann.y - 15,
              width: 10,
              height: 10,
              color: rgb(0.13, 0.59, 0.95), // Blue
            });
            // Add title and description as text annotations if available
            if (ann.title || ann.text) {
              const fontSize = 10;
              let yOffset = height - ann.y - 25;
              if (ann.title) {
                page.drawText(ann.title, {
                  x: ann.x + 15,
                  y: yOffset,
                  size: fontSize,
                  color: rgb(0, 0, 0),
                });
                yOffset -= fontSize + 2;
              }
              if (ann.text) {
                page.drawText(ann.text, {
                  x: ann.x + 15,
                  y: yOffset,
                  size: fontSize - 2,
                  color: rgb(0.3, 0.3, 0.3),
                });
              }
            }
          }
        }
      });

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

      await onSave(annotations, blob);
      toast.success("Drawing corrections saved successfully");
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save drawing corrections");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!pdfDoc) return;

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${dwgNo || "drawing"}-annotated.pdf`;
    link.click();
  };

  // Render annotations on canvas overlay
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match iframe
    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw annotations for current page
    annotations
      .filter((ann) => ann.page === currentPage)
      .forEach((ann) => {
        if (ann.type === "highlight" && ann.width && ann.height) {
          ctx.fillStyle = ann.color || "#FFEB3B";
          ctx.globalAlpha = 0.3;
          ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
          ctx.globalAlpha = 1;
          
          // Draw title and description if available
          if (ann.title || ann.description) {
            ctx.fillStyle = "#000";
            ctx.font = "12px Arial";
            let yOffset = ann.y - 5;
            if (ann.title) {
              ctx.fillText(ann.title, ann.x, yOffset);
              yOffset -= 15;
            }
            if (ann.description) {
              ctx.fillStyle = "#666";
              ctx.font = "10px Arial";
              ctx.fillText(ann.description.substring(0, 50), ann.x, yOffset);
            }
          }
        } else if (ann.type === "strikethrough" && ann.width) {
          ctx.strokeStyle = ann.color || "#F44336";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ann.x, ann.y);
          ctx.lineTo(ann.x + ann.width, ann.y);
          ctx.stroke();
          
          // Draw title and description if available
          if (ann.title || ann.description) {
            ctx.fillStyle = "#000";
            ctx.font = "12px Arial";
            let yOffset = ann.y - 5;
            if (ann.title) {
              ctx.fillText(ann.title, ann.x, yOffset);
              yOffset -= 15;
            }
            if (ann.description) {
              ctx.fillStyle = "#666";
              ctx.font = "10px Arial";
              ctx.fillText(ann.description.substring(0, 50), ann.x, yOffset);
            }
          }
        } else if (ann.type === "note") {
          ctx.fillStyle = ann.color || "#2196F3";
          ctx.fillRect(ann.x - 5, ann.y - 5, 10, 10);
        }
      });
  }, [annotations, currentPage]);

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndexRef.current <= 0}
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={
                    historyIndexRef.current >= annotationHistoryRef.current.length - 1
                  }
                >
                  <Redo className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!pdfDoc}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || annotations.length === 0}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Corrections"}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b shrink-0">
              <Toolbar
                className="w-full"
                onSearch={(value) => {
                  // Handle search if needed
                }}
              />
              <div className="mt-3 flex items-center gap-2">
                {selectedAnnotation && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAnnotation(selectedAnnotation)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* PDF Viewer with Annotation Overlay */}
            <div className="flex-1 px-6 pb-6 min-h-0 overflow-auto">
              <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center"
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
                    toolMode === "select" ? "pointer-events-auto cursor-pointer" : 
                    isEditing && toolMode !== "move" ? "pointer-events-auto cursor-crosshair" :
                    "pointer-events-none"
                  )}
                  onClick={handleCanvasClick}
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
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Annotation Dialog */}
      {showNoteDialog && (
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditingAnnotation ? "Edit Correction" : "Add Correction"}
              </DialogTitle>
              <DialogDescription>
                {isEditingAnnotation
                  ? "Update the correction details"
                  : "Enter details for this correction at the selected location"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title *</Label>
                <Input
                  id="note-title"
                  placeholder="Enter correction title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-description">Description</Label>
                <Textarea
                  id="note-description"
                  placeholder="Enter detailed description of the correction..."
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  rows={4}
                />
              </div>
              {(!selectedAnnotation || selectedAnnotation.type === "note") && (
                <div className="space-y-2">
                  <Label htmlFor="note-text">Note Text</Label>
                  <Textarea
                    id="note-text"
                    placeholder="Enter correction note text..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNoteDialog(false);
                    setIsEditingAnnotation(false);
                    setSelectedAnnotation(null);
                    setNoteText("");
                    setNoteTitle("");
                    setNoteDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={!noteTitle.trim() && !noteText.trim()}
                >
                  {isEditingAnnotation ? "Update Correction" : "Add Correction"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

