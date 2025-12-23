/**
 * Centralized upload API endpoint
 * Handles CSV, JSON, and Excel file uploads for all tables
 * 
 * POST /upload-demo/api/upload
 * Body: {
 *   table: "projects" | "drawings" | "submissions" | "invoices" | "change_orders" | "payments",
 *   format: "csv" | "json",
 *   data: string | object | array,
 *   options?: {
 *     skipDuplicates?: boolean,
 *     updateOnConflict?: boolean,
 *     projectId?: string
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseFile } from "@/lib/upload/parsers";
import { validateDataset } from "@/lib/upload/validators";
import { uploadToTable } from "@/lib/upload/handlers";
import { getTableConfig } from "@/lib/upload/table-configs";
import type { UploadRequest, UploadFormat, TableType } from "@/lib/upload/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for large uploads

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => null)) as UploadRequest | null;

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { table, format, data, options = {} } = body;

    // Validate table type
    const validTables: TableType[] = [
      "projects",
      "drawings",
      "submissions",
      "invoices",
      "change_orders",
      "payments",
      "chat_messages",
    ];

    if (!validTables.includes(table as TableType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid table type. Must be one of: ${validTables.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats: UploadFormat[] = ["csv", "json"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse file content
    let rows: Record<string, unknown>[];
    try {
      rows = parseFile(data, format);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to parse file content",
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No data rows found in file" },
        { status: 400 }
      );
    }

    // Get table configuration
    const config = getTableConfig(table);

    // Validate data
    const validation = validateDataset(rows, config);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Upload to database
    const result = await uploadToTable(
      supabase,
      table as TableType,
      rows,
      user.id,
      options
    );

    if (!result.success && result.inserted === 0) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for upload information
 */
export async function GET() {
  return NextResponse.json({
    message: "Upload API endpoint",
    supportedTables: [
      "projects",
      "drawings",
      "submissions",
      "invoices",
      "change_orders",
      "payments",
      "chat_messages",
    ],
    supportedFormats: ["csv", "json"],
    usage: {
      method: "POST",
      endpoint: "/upload-demo/api/upload",
      body: {
        table: "string (required)",
        format: "csv | json (required)",
        data: "string | object | array (required)",
        options: {
          skipDuplicates: "boolean (optional)",
          updateOnConflict: "boolean (optional)",
          projectId: "string (optional, for project-specific tables)",
        },
      },
    },
  });
}

