/**
 * File parsing utilities for CSV, JSON, and Excel
 */

import type { UploadFormat } from "./types";

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(",")
      .map((v) => v.trim().replace(/^"|"$/g, ""));
    
    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse JSON string or object into array of objects
 */
export function parseJSON(jsonData: unknown): Record<string, unknown>[] {
  if (typeof jsonData === "string") {
    const parsed = JSON.parse(jsonData);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  
  if (typeof jsonData === "object" && jsonData !== null) {
    return [jsonData as Record<string, unknown>];
  }

  throw new Error("Invalid JSON format");
}

/**
 * Parse file content based on format
 */
export function parseFile(
  content: string | unknown,
  format: UploadFormat
): Record<string, unknown>[] {
  switch (format) {
    case "csv":
      if (typeof content !== "string") {
        throw new Error("CSV content must be a string");
      }
      return parseCSV(content);
    
    case "json":
      return parseJSON(content);
    
    case "excel":
      // Excel parsing would require a library like xlsx
      // For now, throw an error suggesting CSV/JSON
      throw new Error(
        "Excel format not yet supported. Please export as CSV or JSON."
      );
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Normalize column names (remove spaces, convert to lowercase, handle common variations)
 */
export function normalizeColumnName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Map CSV columns to database columns using a mapping configuration
 */
export function mapColumns(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [csvCol, dbCol] of Object.entries(mapping)) {
    const normalizedCsvCol = normalizeColumnName(csvCol);
    
    // Try exact match first
    if (row[csvCol] !== undefined) {
      mapped[dbCol] = row[csvCol];
      continue;
    }
    
    // Try normalized match
    const foundKey = Object.keys(row).find(
      (key) => normalizeColumnName(key) === normalizedCsvCol
    );
    
    if (foundKey) {
      mapped[dbCol] = row[foundKey];
    }
  }

  return mapped;
}

