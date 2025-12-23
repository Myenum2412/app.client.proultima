/**
 * Validation utilities for uploaded data
 */

import type { ValidationResult, TableConfig } from "./types";

/**
 * Validate a single row against table configuration
 */
export function validateRow(
  row: Record<string, unknown>,
  config: TableConfig,
  rowIndex: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required columns
  for (const requiredCol of config.requiredColumns) {
    const value = row[requiredCol];
    if (value === undefined || value === null || value === "") {
      errors.push(
        `Row ${rowIndex + 1}: Missing required column "${requiredCol}"`
      );
    }
  }

  // Run custom validators
  for (const validator of config.validators) {
    const error = validator(row);
    if (error) {
      errors.push(`Row ${rowIndex + 1}: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all rows in a dataset
 */
export function validateDataset(
  rows: Record<string, unknown>[],
  config: TableConfig
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = validateRow(rows[i], config, i);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Common validators
 */
export const validators = {
  required: (field: string) => (row: Record<string, unknown>) => {
    const value = row[field];
    if (value === undefined || value === null || value === "") {
      return `Field "${field}" is required`;
    }
    return null;
  },

  numeric: (field: string) => (row: Record<string, unknown>) => {
    const value = row[field];
    if (value !== undefined && value !== null && value !== "") {
      const num = Number(value);
      if (isNaN(num)) {
        return `Field "${field}" must be a valid number`;
      }
    }
    return null;
  },

  date: (field: string) => (row: Record<string, unknown>) => {
    const value = row[field];
    if (value !== undefined && value !== null && value !== "") {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) {
        return `Field "${field}" must be a valid date (YYYY-MM-DD)`;
      }
    }
    return null;
  },

  email: (field: string) => (row: Record<string, unknown>) => {
    const value = String(row[field] || "");
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `Field "${field}" must be a valid email address`;
    }
    return null;
  },

  oneOf: (field: string, allowedValues: string[]) => (
    row: Record<string, unknown>
  ) => {
    const value = String(row[field] || "");
    if (value && !allowedValues.includes(value)) {
      return `Field "${field}" must be one of: ${allowedValues.join(", ")}`;
    }
    return null;
  },
};

