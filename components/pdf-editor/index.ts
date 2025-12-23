/**
 * PDF Editor Module Exports
 */

export { AdvancedPdfEditor } from "./advanced-pdf-editor";
export { TextEditorPanel } from "./text-editor-panel";
export { SignaturePad } from "./signature-pad";

export type {
  PDFEditorState,
  PDFEditorProps,
  TextEdit,
  ImageEdit,
  FormField,
  DigitalSignature,
  PageOperation,
  AuditLog,
  UserRole,
} from "@/lib/pdf-editor/types";

export { AuditLogger } from "@/lib/pdf-editor/audit-logger";
export { VersionManager } from "@/lib/pdf-editor/version-manager";
export { PDFManipulator } from "@/lib/pdf-editor/pdf-manipulator";
export { getRole, hasPermission, DEFAULT_ROLES } from "@/lib/pdf-editor/roles";

