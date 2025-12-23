/**
 * Upload system types and interfaces
 */

export type TableType =
  | "projects"
  | "drawings"
  | "submissions"
  | "invoices"
  | "change_orders"
  | "material_lists"
  | "material_list_bar_items"
  | "material_list_fields"
  | "payments"
  | "chat_messages";

export type UploadFormat = "csv" | "json" | "excel";

export interface UploadRequest {
  table: TableType;
  format: UploadFormat;
  data: unknown; // Will be parsed based on format
  options?: {
    skipDuplicates?: boolean;
    updateOnConflict?: boolean;
    projectId?: string; // For project-specific tables
  };
}

export interface ColumnMapping {
  [csvColumn: string]: string; // Maps CSV column name to database column name
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UploadResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  message: string;
}

export interface TableConfig {
  tableName: string;
  requiredColumns: string[];
  optionalColumns: string[];
  columnMappings: ColumnMapping;
  validators: Array<(row: Record<string, unknown>) => string | null>;
  duplicateCheck?: (row: Record<string, unknown>) => Record<string, unknown>;
}

