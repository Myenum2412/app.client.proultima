"use client";

/**
 * PDF Editing Toolbar for Drawing Log PDF Viewer
 * Comprehensive markup and annotation tools for PDF review
 */

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Move,
  Highlighter,
  Underline,
  Strikethrough,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Type,
  Stamp,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
  Save,
  History,
  Lock,
  Unlock,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type ToolMode =
  | "select"
  | "move"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "pen"
  | "rectangle"
  | "circle"
  | "arrow"
  | "text"
  | "stamp"
  | "eraser";

export type StampType = "approved" | "revise" | "rejected" | "reviewed" | "draft";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  revisionNumber?: number;
  color?: string;
};

export interface PDFToolbarProps {
  className?: string;
  selectedTool: ToolMode | null;
  onToolSelect: (tool: ToolMode | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onSave?: () => void;
  onHistory?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  zoomLevel?: number;
  // Pen tool settings
  penColor?: string;
  penStrokeWidth?: number;
  onPenColorChange?: (color: string) => void;
  onPenStrokeWidthChange?: (width: number) => void;
  // Shape settings
  shapeColor?: string;
  shapeStrokeWidth?: number;
  onShapeColorChange?: (color: string) => void;
  onShapeStrokeWidthChange?: (width: number) => void;
  // Layer management
  layers?: Layer[];
  selectedLayerId?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerToggleVisibility?: (layerId: string) => void;
  onLayerToggleLock?: (layerId: string) => void;
  onLayerCreate?: (name: string, revisionNumber?: number) => void;
  // Revision
  currentRevisionNumber?: number;
  onRevisionSelect?: (revisionNumber: number) => void;
  availableRevisions?: number[];
  // Stamps
  selectedStamp?: StampType;
  onStampSelect?: (stamp: StampType) => void;
  // Access control
  canEdit?: boolean;
  isViewOnly?: boolean;
  // Autosave status
  autosaveStatus?: "saved" | "saving" | "unsaved";
}

const toolItems: Array<{
  id: ToolMode;
  title: string;
  icon: LucideIcon;
  shortcut?: string;
  requiresEdit?: boolean;
}> = [
  { id: "select", title: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "move", title: "Move", icon: Move, shortcut: "M" },
  { id: "highlight", title: "Highlight", icon: Highlighter, shortcut: "H", requiresEdit: true },
  { id: "underline", title: "Underline", icon: Underline, shortcut: "U", requiresEdit: true },
  { id: "strikethrough", title: "Strikethrough", icon: Strikethrough, shortcut: "S", requiresEdit: true },
  { id: "pen", title: "Pen", icon: Pen, shortcut: "P", requiresEdit: true },
  { id: "rectangle", title: "Rectangle", icon: Square, shortcut: "R", requiresEdit: true },
  { id: "circle", title: "Circle", icon: Circle, shortcut: "C", requiresEdit: true },
  { id: "arrow", title: "Arrow", icon: ArrowRight, shortcut: "A", requiresEdit: true },
  { id: "text", title: "Text", icon: Type, shortcut: "T", requiresEdit: true },
  { id: "stamp", title: "Stamp", icon: Stamp, shortcut: "D", requiresEdit: true },
  { id: "eraser", title: "Eraser", icon: Eraser, shortcut: "E", requiresEdit: true },
];

const stampTypes: Array<{ type: StampType; label: string; color: string }> = [
  { type: "approved", label: "Approved", color: "bg-green-500" },
  { type: "revise", label: "Revise", color: "bg-yellow-500" },
  { type: "rejected", label: "Rejected", color: "bg-red-500" },
  { type: "reviewed", label: "Reviewed", color: "bg-blue-500" },
  { type: "draft", label: "Draft", color: "bg-gray-500" },
];

const colors = [
  "#FFEB3B", // Yellow
  "#F44336", // Red
  "#2196F3", // Blue
  "#4CAF50", // Green
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#000000", // Black
  "#FFFFFF", // White
];

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring", bounce: 0, duration: 0.3 };

export function PDFToolbar({
  className,
  selectedTool,
  onToolSelect,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSave,
  onHistory,
  canUndo = false,
  canRedo = false,
  isSaving = false,
  zoomLevel = 100,
  penColor = "#000000",
  penStrokeWidth = 2,
  onPenColorChange,
  onPenStrokeWidthChange,
  shapeColor = "#F44336",
  shapeStrokeWidth = 2,
  onShapeColorChange,
  onShapeStrokeWidthChange,
  layers = [],
  selectedLayerId,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerCreate,
  currentRevisionNumber,
  onRevisionSelect,
  availableRevisions = [],
  selectedStamp,
  onStampSelect,
  canEdit = true,
  isViewOnly = false,
  autosaveStatus = "saved",
}: PDFToolbarProps) {
  const [showPenSettings, setShowPenSettings] = React.useState(false);
  const [showShapeSettings, setShowShapeSettings] = React.useState(false);
  const [showLayers, setShowLayers] = React.useState(false);
  const [showRevisions, setShowRevisions] = React.useState(false);
  const [showStamps, setShowStamps] = React.useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (isViewOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            if (e.shiftKey && onRedo) {
              e.preventDefault();
              onRedo();
            } else if (onUndo) {
              e.preventDefault();
              onUndo();
            }
            break;
          case "s":
            if (onSave) {
              e.preventDefault();
              onSave();
            }
            break;
        }
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tool = toolItems.find((t) => t.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (tool && (!tool.requiresEdit || canEdit)) {
        e.preventDefault();
        onToolSelect(tool.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, isViewOnly, onToolSelect, onUndo, onRedo, onSave]);

  const handleToolClick = (tool: ToolMode) => {
    if (isViewOnly && tool !== "select" && tool !== "move") return;
    if (!canEdit && toolItems.find((t) => t.id === tool)?.requiresEdit) return;
    onToolSelect(selectedTool === tool ? null : tool);
  };

  const editableTools = toolItems.filter((t) => !t.requiresEdit || canEdit);
  const viewOnlyTools = toolItems.filter((t) => !t.requiresEdit);

  const displayTools = isViewOnly ? viewOnlyTools : editableTools;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 p-2 relative",
          "bg-background border rounded-xl",
          "transition-all duration-200"
        )}
      >
        {/* Main Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          {displayTools.map((tool) => {
            const isSelected = selectedTool === tool.id;
            const isDisabled = isViewOnly && tool.requiresEdit;

            return (
              <motion.button
                key={tool.id}
                variants={buttonVariants as any}
                initial={false}
                animate="animate"
                custom={isSelected}
                transition={transition as any}
                onClick={() => handleToolClick(tool.id)}
                disabled={isDisabled}
                className={cn(
                  "relative flex items-center rounded-lg px-3 py-2",
                  "text-sm font-medium transition-colors duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected
                    ? "bg-[#1F9CFE] text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={tool.shortcut ? `${tool.title} (${tool.shortcut})` : tool.title}
              >
                <tool.icon
                  size={16}
                  className={cn(isSelected && "text-white")}
                />
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.span
                      variants={spanVariants as any}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={transition as any}
                      className="overflow-hidden ml-2"
                    >
                      {tool.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Tool Settings */}
        {(selectedTool === "pen" || selectedTool === "rectangle" || selectedTool === "circle" || selectedTool === "arrow") && (
          <Popover
            open={
              (selectedTool === "pen" && showPenSettings) ||
              ((selectedTool === "rectangle" || selectedTool === "circle" || selectedTool === "arrow") && showShapeSettings)
            }
            onOpenChange={(open) => {
              if (selectedTool === "pen") setShowPenSettings(open);
              else setShowShapeSettings(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Slider className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                {selectedTool === "pen" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => onPenColorChange?.(color)}
                            className={cn(
                              "w-8 h-8 rounded border-2 transition-all",
                              penColor === color
                                ? "border-foreground scale-110"
                                : "border-border hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Stroke Width: {penStrokeWidth}px</Label>
                      <Slider
                        value={[penStrokeWidth]}
                        onValueChange={([value]) => onPenStrokeWidthChange?.(value)}
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => onShapeColorChange?.(color)}
                            className={cn(
                              "w-8 h-8 rounded border-2 transition-all",
                              shapeColor === color
                                ? "border-foreground scale-110"
                                : "border-border hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Stroke Width: {shapeStrokeWidth}px</Label>
                      <Slider
                        value={[shapeStrokeWidth]}
                        onValueChange={([value]) => onShapeStrokeWidthChange?.(value)}
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Stamp Selector */}
        {selectedTool === "stamp" && (
          <DropdownMenu open={showStamps} onOpenChange={setShowStamps}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Stamp className="h-4 w-4 mr-2" />
                {selectedStamp ? (
                  <span className="capitalize">{selectedStamp}</span>
                ) : (
                  "Select Stamp"
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Stamp Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stampTypes.map((stamp) => (
                <DropdownMenuItem
                  key={stamp.type}
                  onClick={() => {
                    onStampSelect?.(stamp.type);
                    setShowStamps(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", stamp.color)} />
                    <span className="capitalize">{stamp.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo || isViewOnly}
            className="h-8"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo || isViewOnly}
            className="h-8"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomOut}
            className="h-8"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomIn}
            className="h-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetZoom}
            className="h-8"
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Layer Management */}
        <DropdownMenu open={showLayers} onOpenChange={setShowLayers}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Layers className="h-4 w-4 mr-2" />
              Layers
              {layers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {layers.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Layers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {layers.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No layers
              </div>
            ) : (
              layers.map((layer) => (
                <div key={layer.id} className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLayerToggleVisibility?.(layer.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {layer.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => onLayerToggleLock?.(layer.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {layer.locked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onLayerSelect?.(layer.id)}
                      className={cn(
                        "flex-1 text-left px-2 py-1 rounded hover:bg-muted",
                        selectedLayerId === layer.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {layer.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: layer.color }}
                          />
                        )}
                        <span className="text-sm">{layer.name}</span>
                        {layer.revisionNumber && (
                          <Badge variant="outline" className="ml-auto">
                            R{layer.revisionNumber}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              ))
            )}
            {canEdit && !isViewOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const name = prompt("Layer name:");
                    if (name) {
                      const rev = prompt("Revision number (optional):");
                      onLayerCreate?.(name, rev ? parseInt(rev) : undefined);
                    }
                  }}
                >
                  Create New Layer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Revision Selector */}
        {availableRevisions.length > 0 && (
          <DropdownMenu open={showRevisions} onOpenChange={setShowRevisions}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <History className="h-4 w-4 mr-2" />
                Rev {currentRevisionNumber || 1}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Revisions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableRevisions.map((rev) => (
                <DropdownMenuItem
                  key={rev}
                  onClick={() => {
                    onRevisionSelect?.(rev);
                    setShowRevisions(false);
                  }}
                >
                  Revision {rev}
                  {rev === currentRevisionNumber && (
                    <Badge variant="secondary" className="ml-2">
                      Current
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Save & History */}
        <div className="flex items-center gap-1">
          {autosaveStatus === "saving" && (
            <Badge variant="outline" className="text-xs">
              Saving...
            </Badge>
          )}
          {autosaveStatus === "unsaved" && (
            <Badge variant="outline" className="text-xs text-amber-600">
              Unsaved
            </Badge>
          )}
          {autosaveStatus === "saved" && (
            <Badge variant="outline" className="text-xs text-green-600">
              Saved
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || isViewOnly}
            className="h-8"
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onHistory}
            className="h-8"
            title="Version History"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>

        {/* View Only Indicator */}
        {isViewOnly && (
          <Badge variant="secondary" className="ml-2">
            View Only
          </Badge>
        )}
      </div>
    </div>
  );
}

export default PDFToolbar;

