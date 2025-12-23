/**
 * Table configurations for upload system
 * Defines column mappings, validators, and duplicate checks for each table
 */

import type { TableConfig } from "./types";
import { validators } from "./validators";

/**
 * Get table configuration for a given table type
 */
export function getTableConfig(tableType: string): TableConfig {
  switch (tableType) {
    case "projects":
      return {
        tableName: "projects",
        requiredColumns: ["job_number", "name"],
        optionalColumns: [
          "fabricator_name",
          "contractor_name",
          "location",
          "estimated_tons",
          "detailing_status",
          "revision_status",
          "release_status",
        ],
        columnMappings: {
          "Job Number": "job_number",
          "Job #": "job_number",
          "Project Name": "name",
          "Name": "name",
          "Fabricator": "fabricator_name",
          "Fabricator Name": "fabricator_name",
          "Contractor": "contractor_name",
          "Contractor Name": "contractor_name",
          "Location": "location",
          "Estimated Tons": "estimated_tons",
          "Tons": "estimated_tons",
          "Detailing Status": "detailing_status",
          "Revision Status": "revision_status",
          "Release Status": "release_status",
        },
        validators: [
          validators.required("job_number"),
          validators.required("name"),
          validators.numeric("estimated_tons"),
        ],
        duplicateCheck: (row) => ({
          job_number: String(row.job_number || ""),
        }),
      };

    case "drawings":
      return {
        tableName: "drawings",
        requiredColumns: ["project_id", "section", "dwg_no"],
        optionalColumns: [
          "status",
          "description",
          "total_weight_tons",
          "latest_submitted_date",
          "release_status",
        ],
        columnMappings: {
          "Project ID": "project_id",
          "Project": "project_id",
          "Section": "section",
          "DWG #": "dwg_no",
          "DWG No": "dwg_no",
          "Drawing Number": "dwg_no",
          "Status": "status",
          "Description": "description",
          "Total Weight (Tons)": "total_weight_tons",
          "Weight": "total_weight_tons",
          "Latest Submitted Date": "latest_submitted_date",
          "Submitted Date": "latest_submitted_date",
          "Date": "latest_submitted_date",
          "Release Status": "release_status",
        },
        validators: [
          validators.required("project_id"),
          validators.required("section"),
          validators.required("dwg_no"),
          validators.oneOf("section", [
            "drawings_yet_to_return",
            "drawings_yet_to_release",
            "drawing_log",
          ]),
          validators.numeric("total_weight_tons"),
          validators.date("latest_submitted_date"),
        ],
      };

    case "submissions":
      return {
        tableName: "submissions",
        requiredColumns: ["project_id"],
        optionalColumns: [
          "proultima_pm",
          "submission_type",
          "work_description",
          "drawing_no",
          "submission_date",
        ],
        columnMappings: {
          "Project ID": "project_id",
          "Project": "project_id",
          "PROULTIMA PM": "proultima_pm",
          "PM": "proultima_pm",
          "Submission Type": "submission_type",
          "Type": "submission_type",
          "Work Description": "work_description",
          "Description": "work_description",
          "Drawing #": "drawing_no",
          "Drawing No": "drawing_no",
          "Submission Date": "submission_date",
          "Date": "submission_date",
        },
        validators: [
          validators.required("project_id"),
          validators.date("submission_date"),
        ],
      };

    case "invoices":
      return {
        tableName: "invoices",
        requiredColumns: ["project_id", "invoice_no"],
        optionalColumns: [
          "billed_tonnage",
          "unit_price_or_lump_sum",
          "tons_billed_amount",
          "billed_hours_co",
          "co_price",
          "co_billed_amount",
          "total_amount_billed",
        ],
        columnMappings: {
          "Project ID": "project_id",
          "Project": "project_id",
          "Invoice #": "invoice_no",
          "Invoice No": "invoice_no",
          "Invoice Number": "invoice_no",
          "Billed Tonnage": "billed_tonnage",
          "Tonnage": "billed_tonnage",
          "Unit Price / Lump Sum": "unit_price_or_lump_sum",
          "Unit Price": "unit_price_or_lump_sum",
          "Tons Billed Amount": "tons_billed_amount",
          "CO Hours": "billed_hours_co",
          "CO Price": "co_price",
          "CO Billed Amount": "co_billed_amount",
          "Total Amount Billed": "total_amount_billed",
          "Total": "total_amount_billed",
        },
        validators: [
          validators.required("project_id"),
          validators.required("invoice_no"),
          validators.numeric("billed_tonnage"),
          validators.numeric("tons_billed_amount"),
          validators.numeric("billed_hours_co"),
          validators.numeric("co_price"),
          validators.numeric("co_billed_amount"),
          validators.numeric("total_amount_billed"),
        ],
      };

    case "change_orders":
      return {
        tableName: "change_orders",
        requiredColumns: ["project_id", "change_order_id"],
        optionalColumns: ["description", "hours", "date", "status"],
        columnMappings: {
          "Project ID": "project_id",
          "Project": "project_id",
          "Change Order ID": "change_order_id",
          "Change Order #": "change_order_id",
          "CO ID": "change_order_id",
          "Description": "description",
          "Hours": "hours",
          "Date": "date",
          "Status": "status",
        },
        validators: [
          validators.required("project_id"),
          validators.required("change_order_id"),
          validators.numeric("hours"),
          validators.date("date"),
        ],
      };

    case "payments":
      return {
        tableName: "payments",
        requiredColumns: ["amount", "status"],
        optionalColumns: ["email"],
        columnMappings: {
          "Amount": "amount",
          "Status": "status",
          "Email": "email",
        },
        validators: [
          validators.required("amount"),
          validators.required("status"),
          validators.numeric("amount"),
          validators.oneOf("status", ["success", "processing", "failed"]),
          validators.email("email"),
        ],
      };

    default:
      throw new Error(`Unknown table type: ${tableType}`);
  }
}

