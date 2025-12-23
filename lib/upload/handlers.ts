/**
 * Upload handlers for inserting data into Supabase tables
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TableType,
  UploadResult,
  TableConfig,
} from "./types";
import { getTableConfig } from "./table-configs";
import { mapColumns } from "./parsers";

/**
 * Convert row data to database format
 */
function prepareRowData(
  row: Record<string, unknown>,
  config: TableConfig,
  ownerId: string,
  projectId?: string
): Record<string, unknown> {
  // Map columns
  const mapped = mapColumns(row, config.columnMappings);

  // Add owner_id/user_id for user-owned tables
  if (config.tableName === "projects") {
    mapped.owner_id = ownerId;
  } else if (config.tableName === "payments") {
    mapped.user_id = ownerId;
  } else if (config.tableName === "chat_messages") {
    mapped.user_id = ownerId;
  }

  // Add project_id if provided or if it's in the row
  if (projectId) {
    mapped.project_id = projectId;
  } else if (mapped.project_id && typeof mapped.project_id === "string") {
    // project_id is already in the row, keep it
  } else if (
    config.tableName !== "projects" &&
    config.tableName !== "payments" &&
    config.tableName !== "chat_messages"
  ) {
    // For project-dependent tables, project_id is required
    throw new Error(
      `project_id is required for table "${config.tableName}"`
    );
  }

  // Convert numeric fields
  const numericFields = [
    "estimated_tons",
    "total_weight_tons",
    "billed_tonnage",
    "tons_billed_amount",
    "billed_hours_co",
    "co_price",
    "co_billed_amount",
    "total_amount_billed",
    "hours",
    "amount",
    "weight_lbs",
  ];

  for (const field of numericFields) {
    if (mapped[field] !== undefined && mapped[field] !== null && mapped[field] !== "") {
      const num = Number(mapped[field]);
      mapped[field] = isNaN(num) ? null : num;
    }
  }

  // Convert date fields
  const dateFields = [
    "latest_submitted_date",
    "submission_date",
    "date",
    "created_at",
  ];

  for (const field of dateFields) {
    if (mapped[field] !== undefined && mapped[field] !== null && mapped[field] !== "") {
      const dateStr = String(mapped[field]);
      // Try to parse as date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        mapped[field] = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      }
    }
  }

  return mapped;
}

/**
 * Check for duplicates
 */
async function checkDuplicate(
  supabase: SupabaseClient,
  config: TableConfig,
  row: Record<string, unknown>,
  ownerId: string
): Promise<boolean> {
  if (!config.duplicateCheck) {
    return false;
  }

  const checkFields = config.duplicateCheck(row);
  const query = supabase.from(config.tableName).select("id").limit(1);

  // Build query with check fields
  for (const [field, value] of Object.entries(checkFields)) {
    query.eq(field, value);
  }

  // Add owner_id/user_id check for user-owned tables
  if (config.tableName === "projects") {
    query.eq("owner_id", ownerId);
  } else if (config.tableName === "payments" || config.tableName === "chat_messages") {
    query.eq("user_id", ownerId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

/**
 * Resolve project_id from job_number
 */
async function resolveProjectId(
  supabase: SupabaseClient,
  ownerId: string,
  jobNumber?: string | unknown,
  projectId?: string
): Promise<string | undefined> {
  if (projectId) {
    return projectId;
  }

  if (jobNumber && typeof jobNumber === "string") {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("job_number", jobNumber)
      .maybeSingle();

    return data?.id ? String(data.id) : undefined;
  }

  return undefined;
}

/**
 * Upload data to a specific table
 */
export async function uploadToTable(
  supabase: SupabaseClient,
  tableType: TableType,
  rows: Record<string, unknown>[],
  ownerId: string,
  options: {
    skipDuplicates?: boolean;
    updateOnConflict?: boolean;
    projectId?: string;
  } = {}
): Promise<UploadResult> {
  const config = getTableConfig(tableType);
  const result: UploadResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    message: "",
  };

  const rowsToInsert: Record<string, unknown>[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      // Resolve project_id if needed (for project-dependent tables)
      let resolvedProjectId = options.projectId;
      if (
        !resolvedProjectId &&
        config.tableName !== "projects" &&
        config.tableName !== "payments" &&
        config.tableName !== "chat_messages"
      ) {
        // Try to resolve from job_number in the row
        const mapped = mapColumns(rows[i], config.columnMappings);
        const jobNumber = mapped.job_number || rows[i].job_number || rows[i]["Job Number"] || rows[i]["Job #"];
        const resolved = await resolveProjectId(supabase, ownerId, jobNumber ?? undefined);
        resolvedProjectId = resolved;
        
        if (!resolvedProjectId && !mapped.project_id) {
          throw new Error(
            `project_id is required. Provide projectId in options or include "Job Number" in data to auto-resolve.`
          );
        }
      }

      // Prepare row data
      const preparedRow = prepareRowData(
        rows[i],
        config,
        ownerId,
        resolvedProjectId || undefined
      );

      // Check for duplicates if enabled
      if (options.skipDuplicates) {
        const isDuplicate = await checkDuplicate(
          supabase,
          config,
          preparedRow,
          ownerId
        );
        if (isDuplicate) {
          result.skipped++;
          continue;
        }
      }

      rowsToInsert.push(preparedRow);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({ row: i + 1, error: errorMessage });
    }
  }

  if (rowsToInsert.length === 0 && errors.length === 0) {
    result.message = "No valid rows to insert";
    return result;
  }

  // Insert rows in batches (Supabase has limits)
  const batchSize = 100;
  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from(config.tableName)
        .insert(batch)
        .select();

      if (error) {
        // Handle individual row errors
        for (let j = 0; j < batch.length; j++) {
          errors.push({
            row: i + j + 1,
            error: error.message || "Insert failed",
          });
        }
        result.success = false;
      } else {
        result.inserted += data?.length ?? 0;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      for (let j = 0; j < batch.length; j++) {
        errors.push({ row: i + j + 1, error: errorMessage });
      }
      result.success = false;
    }
  }

  result.errors = errors;
  result.message = `Inserted ${result.inserted} rows, skipped ${result.skipped} duplicates, ${errors.length} errors`;

  return result;
}

