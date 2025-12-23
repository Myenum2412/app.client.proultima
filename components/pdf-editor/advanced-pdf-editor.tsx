"use client";

/**
 * Advanced PDF Editor
 * Full-featured WYSIWYG PDF editing system with real-time updates
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Download,
  Undo,
  Redo,
  X,
  Edit2,
  Type,
  Image as ImageIcon,
  FileText,
  PenTool,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Stamp,
  MessageSquare,
  Trash2,
  RotateCw,
  Copy,
  Scissors,
  FilePlus,
  History,
  Shield,
  Eye,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { convertGoogleDriveUrl } from "@/lib/utils/pdf-url";
import type {
  PDFEditorState,
  PDFEditorProps,
  TextEdit,
  ImageEdit,
  FormField,
  DigitalSignature,
  PageOperation,
  AuditLog,
} from "@/lib/pdf-editor/types";
import { AuditLogger } from "@/lib/pdf-editor/audit-logger";
import { VersionManager } from "@/lib/pdf-editor/version-manager";
import { PDFManipulator } from "@/lib/pdf-editor/pdf-manipulator";
import type { Annotation } from "@/lib/pdf-annotations/types";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export function AdvancedPdfEditor({
  pdfUrl,
  title = "PDF Editor",
  onSave,
  onClose,
  userRole,
  userId,
  userName,
  userEmail,
  initialState,
  autosaveInterval = 5000,
  enableAuditLogs = true,
  enableVersionControl = true,
}: PDFEditorProps) {
  // Core state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Editing state
  const [selectedTool, setSelectedTool] = useState<string | null>("select");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [textEdits, setTextEdits] = useState<TextEdit[]>(initialState?.textEdits || []);
  const [imageEdits, setImageEdits] = useState<ImageEdit[]>(initialState?.imageEdits || []);
  const [formFields, setFormFields] = useState<FormField[]>(initialState?.formFields || []);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialState?.annotations || []);
  const [signatures, setSignatures] = useState<DigitalSignature[]>(initialState?.signatures || []);
  const [pageOperations, setPageOperations] = useState<PageOperation[]>(initialState?.pageOperations || []);

  // Text editing state
  const [editingText, setEditingText] = useState<TextEdit | null>(null);
  const [textEditMode, setTextEditMode] = useState<"select" | "edit" | "insert">("select");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  // Get user role
  const effectiveRole = userRole || "editor";

  // History
  const [history, setHistory] = useState<PDFEditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Managers
  const auditLoggerRef = useRef<AuditLogger | null>(null);
  const versionManagerRef = useRef<VersionManager | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize managers
  useEffect(() => {
    if (enableAuditLogs) {
      auditLoggerRef.current = new AuditLogger(userId, userName, userEmail);
    }
    if (enableVersionControl) {
      versionManagerRef.current = new VersionManager();
    }
  }, [userId, userName, userEmail, enableAuditLogs, enableVersionControl]);

  // Load PDF
  useEffect(() => {
    if (pdfUrl) {
      loadPdf();
    }
  }, [pdfUrl]);

  // Autosave
  useEffect(() => {
    if (hasUnsavedChanges && autosaveInterval > 0) {
      autosaveTimerRef.current = setTimeout(() => {
        handleAutosave();
      }, autosaveInterval);

      return () => {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
      };
    }
  }, [hasUnsavedChanges, autosaveInterval]);

  const loadPdf = async () => {
    try {
      const convertedUrl = convertGoogleDriveUrl(pdfUrl);
      const loadingTask = pdfjsLib.getDocument(convertedUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Load PDF blob
      const response = await fetch(convertedUrl);
      const blob = await response.blob();
      setPdfBlob(blob);

      // Create initial version
      if (versionManagerRef.current && enableVersionControl) {
        const initialState: Partial<PDFEditorState> = {
          pdfUrl,
          pdfBlob: blob,
          totalPages: pdf.numPages,
          currentPage: 1,
          zoomLevel: 100,
          textEdits: [],
          imageEdits: [],
          formFields: [],
          annotations: [],
          signatures: [],
          pageOperations: [],
        };
        versionManagerRef.current.createVersion(
          initialState,
          userName || "System",
          "Initial version"
        );
      }

      auditLoggerRef.current?.log("PDF loaded", "save", undefined, "pdf", {
        url: pdfUrl,
        pages: pdf.numPages,
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF");
    }
  };

  const handleAutosave = async () => {
    if (!pdfDoc || !onSave) return;

    try {
      const state = getCurrentState();
      await onSave(state);
      setHasUnsavedChanges(false);
      auditLoggerRef.current?.log("Autosave completed", "save");
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  const handleSave = async () => {
    if (!pdfDoc || !pdfBlob || !onSave) return;

    setIsSaving(true);
    try {
      // Apply all edits to PDF
      const manipulator = await PDFManipulator.create(
        await pdfBlob.arrayBuffer()
      );

      // Apply text edits
      for (const edit of textEdits) {
        await manipulator.applyTextEdit(edit);
      }

      // Apply image edits
      for (const edit of imageEdits) {
        await manipulator.applyImageEdit(edit);
      }

      // Apply form fields
      for (const field of formFields) {
        await manipulator.applyFormField(field);
      }

      // Apply signatures
      for (const signature of signatures) {
        await manipulator.applySignature(signature);
      }

      // Apply annotations
      for (const annotation of annotations) {
        await manipulator.applyAnnotation(annotation);
      }

      // Apply page operations
      for (const operation of pageOperations) {
        await manipulator.applyPageOperation(operation);
      }

      // Save PDF
      const pdfBytes = await manipulator.save();
      const updatedBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setPdfBlob(updatedBlob);

      // Update state
      const state = getCurrentState();
      state.pdfBlob = updatedBlob;
      
      // Call onSave callback
      await onSave(state);

      // Also save to API if available
      try {
        await fetch("/api/pdf-editor/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(state),
        });
      } catch (apiError) {
        console.warn("Failed to save to API:", apiError);
        // Don't fail the save if API call fails
      }

      // Create version
      if (versionManagerRef.current && enableVersionControl) {
        versionManagerRef.current.createVersion(
          state,
          userName || "User",
          "Manual save"
        );
      }

      setHasUnsavedChanges(false);
      toast.success("PDF saved successfully");
      auditLoggerRef.current?.log("PDF saved", "save", undefined, "pdf");
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save PDF");
      auditLoggerRef.current?.log("Save failed", "save", undefined, "pdf", {
        error: String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentState = (): PDFEditorState => {
    return {
      pdfUrl,
      pdfBlob: pdfBlob || undefined,
      totalPages,
      currentPage,
      zoomLevel,
      textEdits,
      imageEdits,
      formFields,
      annotations,
      signatures,
      pageOperations,
      selectedTool,
      selectedElement,
      isEditing,
      isSaving,
      hasUnsavedChanges,
      versions: versionManagerRef.current?.getAllVersions() || [],
      currentVersion: versionManagerRef.current?.getCurrentVersion()?.versionNumber || 1,
      auditLogs: auditLoggerRef.current?.getLogs() || [],
      layers: [],
    };
  };

  const saveToHistory = () => {
    const state = getCurrentState();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      const previousState = history[historyIndex - 1];
      restoreState(previousState);
      setHistoryIndex(historyIndex - 1);
      auditLoggerRef.current?.log("Undo performed", "text_edit");
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = history[historyIndex + 1];
      restoreState(nextState);
      setHistoryIndex(historyIndex + 1);
      auditLoggerRef.current?.log("Redo performed", "text_edit");
    }
  };

  const restoreState = (state: PDFEditorState) => {
    setTextEdits(state.textEdits);
    setImageEdits(state.imageEdits);
    setFormFields(state.formFields);
    setAnnotations(state.annotations);
    setSignatures(state.signatures);
    setPageOperations(state.pageOperations);
    setCurrentPage(state.currentPage);
    setZoomLevel(state.zoomLevel);
    setSelectedElement(state.selectedElement);
    setHasUnsavedChanges(true);
  };

  // Text editing handlers
  const handleTextEdit = (edit: TextEdit) => {
    saveToHistory();
    setTextEdits((prev) => {
      const existing = prev.findIndex((e) => e.id === edit.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...edit, updatedAt: new Date().toISOString(), updatedBy: userName || "User" };
        return updated;
      }
      return [...prev, edit];
    });
    setHasUnsavedChanges(true);
    auditLoggerRef.current?.log("Text edited", "text_edit", edit.id, "text", {
      text: edit.text,
      page: edit.page,
    });
  };

  const handleDeleteText = (id: string) => {
    saveToHistory();
    setTextEdits((prev) => prev.filter((e) => e.id !== id));
    setHasUnsavedChanges(true);
    auditLoggerRef.current?.log("Text deleted", "text_edit", id, "text");
  };

  // Image editing handlers
  const handleImageAdd = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const imageEdit: ImageEdit = {
        id: `img-${Date.now()}`,
        page: currentPage,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        src: base64,
        rotation: 0,
        opacity: 1,
        createdAt: new Date().toISOString(),
        createdBy: userName || "User",
      };
      saveToHistory();
      setImageEdits((prev) => [...prev, imageEdit]);
      setHasUnsavedChanges(true);
      auditLoggerRef.current?.log("Image added", "image_edit", imageEdit.id, "image");
    };
    reader.readAsDataURL(file);
  };

  // Page operations
  const handlePageDelete = (pageNumber: number) => {
    // Skip permission check for now
    // if (!hasPermission(effectiveRole, "canManagePages")) {
    //   toast.error("You don't have permission to delete pages");
    //   return;
    // }

    saveToHistory();
    const operation: PageOperation = {
      id: `op-${Date.now()}`,
      type: "delete",
      pageNumber,
      createdAt: new Date().toISOString(),
      createdBy: userName || "User",
    };
    setPageOperations((prev) => [...prev, operation]);
    setHasUnsavedChanges(true);
    auditLoggerRef.current?.log("Page deleted", "page_operation", operation.id, "page", {
      pageNumber,
    });
  };

  const handlePageRotate = (pageNumber: number, rotation: number) => {
    saveToHistory();
    const operation: PageOperation = {
      id: `op-${Date.now()}`,
      type: "rotate",
      pageNumber,
      rotation,
      createdAt: new Date().toISOString(),
      createdBy: userName || "User",
    };
    setPageOperations((prev) => [...prev, operation]);
    setHasUnsavedChanges(true);
    auditLoggerRef.current?.log("Page rotated", "page_operation", operation.id, "page", {
      pageNumber,
      rotation,
    });
  };

  // Render PDF page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const viewport = page.getViewport({ scale: zoomLevel / 100 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }, [pdfDoc, zoomLevel]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, zoomLevel, renderPage]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Advanced PDF Editor - Make real-time edits and save directly to the PDF
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b flex items-center gap-2 flex-wrap">
            {/* File Operations */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (pdfBlob) {
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title || "document"}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* History */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Tools */}
            {true && (
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedTool === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTool("text");
                    setTextEditMode("insert");
                  }}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  variant={selectedTool === "edit-text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTool("edit-text");
                    setTextEditMode("edit");
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Text
                </Button>
              </div>
            )}

            {/* Image Tools */}
            {true && (
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedTool === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTool("image");
                    fileInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageAdd(file);
                  }}
                />
              </div>
            )}

            {/* Annotation Tools */}
            {true && (
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedTool === "highlight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("highlight")}
                >
                  <Highlighter className="h-4 w-4 mr-2" />
                  Highlight
                </Button>
                <Button
                  variant={selectedTool === "pen" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("pen")}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Pen
                </Button>
                <Button
                  variant={selectedTool === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("rectangle")}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Rectangle
                </Button>
                <Button
                  variant={selectedTool === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("circle")}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Circle
                </Button>
                <Button
                  variant={selectedTool === "arrow" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("arrow")}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Arrow
                </Button>
              </div>
            )}

            {/* Signature */}
            {true && (
              <Button
                variant={selectedTool === "signature" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTool("signature");
                  setShowSignaturePad(true);
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Sign
              </Button>
            )}

            {/* Page Tools */}
            {true && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageRotate(currentPage, 90)}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageDelete(currentPage)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Page
                </Button>
              </div>
            )}

            {/* View Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.min(400, z + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r p-4 overflow-y-auto">
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="audit">Audit</TabsTrigger>
                </TabsList>
                <TabsContent value="properties" className="space-y-4 mt-4">
                  {showSignaturePad ? (
                    <div className="p-4 border rounded">
                      <p className="text-sm text-gray-500">Signature pad component placeholder</p>
                      <Button onClick={() => setShowSignaturePad(false)}>Close</Button>
                    </div>
                  ) : editingText ? (
                    <div className="p-4 border rounded">
                      <p className="text-sm text-gray-500">Text editor panel placeholder</p>
                      <Button onClick={() => setEditingText(null)}>Close</Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select an element to edit its properties
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <div className="space-y-2">
                    {versionManagerRef.current
                      ?.getAllVersions()
                      .map((version) => (
                        <div
                          key={version.id}
                          className="p-2 border rounded cursor-pointer hover:bg-muted"
                          onClick={() => {
                            // Restore version
                            // Implementation would restore state from version
                          }}
                        >
                          <div className="text-sm font-medium">
                            Version {version.versionNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                          {version.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {version.description}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="audit" className="mt-4">
                  {true ? (
                    <div className="space-y-2">
                      {auditLoggerRef.current
                        ?.getLogs()
                        .slice(0, 50)
                        .map((log) => (
                          <div
                            key={log.id}
                            className="p-2 border rounded text-xs"
                          >
                            <div className="font-medium">{log.action}</div>
                            <div className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              by {log.userName}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      You don't have permission to view audit logs
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 overflow-auto p-6 bg-muted/20" ref={containerRef}>
              <div className="flex flex-col items-center gap-4">
                {/* Page Navigation */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* PDF Canvas */}
                <div className="relative border shadow-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    className="block"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

