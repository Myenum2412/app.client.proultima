/**
 * PDF Annotation Types and Utilities
 * Comprehensive type definitions for PDF markup and annotation system
 */

export type AnnotationType =
  | "highlight"
  | "underline"
  | "strikethrough"
  | "pen"
  | "rectangle"
  | "circle"
  | "arrow"
  | "text"
  | "stamp"
  | "note";

export type StampType = "approved" | "revise" | "rejected" | "reviewed" | "draft";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  revisionNumber?: number;
  color?: string;
  createdAt: string;
  createdBy: string;
};

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  page: number;
  layerId?: string;
  revisionNumber?: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  title?: string;
  description?: string;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
}

export interface UnderlineAnnotation extends BaseAnnotation {
  type: "underline";
  x: number;
  y: number;
  width: number;
  color: string;
  thickness?: number;
}

export interface StrikethroughAnnotation extends BaseAnnotation {
  type: "strikethrough";
  x: number;
  y: number;
  width: number;
  color: string;
  thickness?: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: "pen";
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  arrowHeadSize?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  backgroundColor?: string;
}

export interface StampAnnotation extends BaseAnnotation {
  type: "stamp";
  x: number;
  y: number;
  stampType: StampType;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface NoteAnnotation extends BaseAnnotation {
  type: "note";
  x: number;
  y: number;
  text: string;
  color: string;
  width?: number;
  height?: number;
}

export type Annotation =
  | HighlightAnnotation
  | UnderlineAnnotation
  | StrikethroughAnnotation
  | PenAnnotation
  | RectangleAnnotation
  | CircleAnnotation
  | ArrowAnnotation
  | TextAnnotation
  | StampAnnotation
  | NoteAnnotation;

export interface AnnotationVersion {
  id: string;
  versionNumber: number;
  annotations: Annotation[];
  createdAt: string;
  createdBy: string;
  description?: string;
}

export interface AnnotationState {
  annotations: Annotation[];
  layers: Layer[];
  currentLayerId?: string;
  currentRevisionNumber?: number;
  versionHistory: AnnotationVersion[];
  zoomLevel: number;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canCreateLayers: boolean;
  canManageRevisions: boolean;
  isViewOnly: boolean;
}

