/**
 * Advanced PDF Editor Types
 * Comprehensive type definitions for full PDF editing capabilities
 */

import type { Annotation, Layer } from "@/lib/pdf-annotations/types";

export type TextEditMode = "select" | "edit" | "insert";

export interface TextEdit {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  originalText: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  alignment: "left" | "center" | "right" | "justify";
  lineHeight: number;
  letterSpacing: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ImageEdit {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string; // Base64 or URL
  rotation: number;
  opacity: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FormField {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "text" | "checkbox" | "radio" | "dropdown" | "signature" | "date";
  name: string;
  value: string | boolean | string[];
  defaultValue?: string | boolean | string[];
  required: boolean;
  readOnly: boolean;
  options?: string[]; // For dropdown/radio
  placeholder?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export interface DigitalSignature {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  image: string; // Base64 signature image
  signerName: string;
  signerEmail: string;
  signedAt: string;
  certificate?: string;
  verified: boolean;
  reason?: string;
  location?: string;
}

export interface PageOperation {
  id: string;
  type: "reorder" | "delete" | "insert" | "duplicate" | "rotate";
  pageNumber: number;
  newPageNumber?: number; // For reorder
  rotation?: number; // For rotate (90, 180, 270)
  insertedPdfUrl?: string; // For insert
  createdAt: string;
  createdBy: string;
}

export interface DocumentMerge {
  id: string;
  sourcePdfUrl: string;
  targetPage: number;
  insertAfter: boolean;
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  type: "text_edit" | "image_edit" | "annotation" | "form_field" | "signature" | "page_operation" | "merge" | "save" | "delete";
  targetId?: string;
  targetType?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  timestamp: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface PDFVersion {
  id: string;
  versionNumber: number;
  pdfBlob: Blob;
  annotations: Annotation[];
  textEdits: TextEdit[];
  imageEdits: ImageEdit[];
  formFields: FormField[];
  signatures: DigitalSignature[];
  pageOperations: PageOperation[];
  createdAt: string;
  createdBy: string;
  description?: string;
  size: number;
}

export interface PDFEditorState {
  // Document state
  pdfUrl: string;
  pdfBlob?: Blob;
  totalPages: number;
  currentPage: number;
  zoomLevel: number;
  
  // Editing state
  textEdits: TextEdit[];
  imageEdits: ImageEdit[];
  formFields: FormField[];
  annotations: Annotation[];
  signatures: DigitalSignature[];
  pageOperations: PageOperation[];
  
  // UI state
  selectedTool: string | null;
  selectedElement: string | null;
  isEditing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Version control
  versions: PDFVersion[];
  currentVersion: number;
  
  // Audit
  auditLogs: AuditLog[];
  
  // Layers
  layers: Layer[];
  selectedLayerId?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: {
    canEditText: boolean;
    canEditImages: boolean;
    canEditForms: boolean;
    canAddAnnotations: boolean;
    canAddSignatures: boolean;
    canManagePages: boolean;
    canMergeDocuments: boolean;
    canDeleteContent: boolean;
    canViewAuditLogs: boolean;
    canManageVersions: boolean;
    canExport: boolean;
  };
}

export interface PDFEditorProps {
  pdfUrl: string;
  title?: string;
  onSave?: (state: PDFEditorState) => Promise<void>;
  onClose?: () => void;
  userRole?: UserRole;
  userId?: string;
  userName?: string;
  userEmail?: string;
  initialState?: Partial<PDFEditorState>;
  autosaveInterval?: number;
  enableAuditLogs?: boolean;
  enableVersionControl?: boolean;
}

