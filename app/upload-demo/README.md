# Upload Demo System

This folder contains the centralized upload system for handling data uploads to Supabase tables. This is a **backend/utility layer only** and is **not visible in the app sidebar navigation**.

## Overview

The upload system provides a unified API for uploading structured data (CSV, JSON) to various database tables with:
- ✅ Automatic column mapping
- ✅ Data validation
- ✅ Duplicate detection
- ✅ Transactional safety
- ✅ Error handling and reporting
- ✅ Extensible architecture for future tables

## API Endpoint

### POST `/upload-demo/api/upload`

Upload data to any supported table.

#### Request Body

```json
{
  "table": "projects" | "drawings" | "submissions" | "invoices" | "change_orders" | "payments" | "chat_messages",
  "format": "csv" | "json",
  "data": "string (for CSV) | object | array (for JSON)",
  "options": {
    "skipDuplicates": boolean,
    "updateOnConflict": boolean,
    "projectId": "string (for project-specific tables)"
  }
}
```

#### Response

```json
{
  "success": true,
  "message": "Inserted 10 rows, skipped 2 duplicates, 0 errors",
  "inserted": 10,
  "updated": 0,
  "skipped": 2,
  "errors": [],
  "warnings": []
}
```

## Supported Tables

1. **projects** - Project master records
2. **drawings** - Drawing records (all sections)
3. **submissions** - RFI and Submittal records
4. **invoices** - Invoice records
5. **change_orders** - Change order records
6. **payments** - Payment records
7. **chat_messages** - Chat message records

## Column Mapping

The system automatically maps common column name variations to database columns. For example:

- `Job Number`, `Job #` → `job_number`
- `Project Name`, `Name` → `name`
- `DWG #`, `DWG No`, `Drawing Number` → `dwg_no`
- `Total Weight (Tons)`, `Weight` → `total_weight_tons`

See `lib/upload/table-configs.ts` for complete mapping configurations.

## Usage Examples

### CSV Upload

```typescript
const csvData = `Job Number,Name,Contractor,Location
PRO-2025-001,Valley View Business Park,ABC Construction,PA
PRO-2025-002,Mid-Way Logistics Center,XYZ Builders,TX`;

const response = await fetch('/upload-demo/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'projects',
    format: 'csv',
    data: csvData,
    options: { skipDuplicates: true }
  })
});
```

### JSON Upload

```typescript
const jsonData = [
  {
    "Job Number": "PRO-2025-001",
    "Name": "Valley View Business Park",
    "Contractor": "ABC Construction",
    "Location": "PA"
  }
];

const response = await fetch('/upload-demo/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'projects',
    format: 'json',
    data: jsonData,
    options: { skipDuplicates: true }
  })
});
```

## Validation

Each table has specific validation rules:

- **Required fields** - Must be present and non-empty
- **Data types** - Numbers, dates, emails are validated
- **Enumerated values** - Status fields must match allowed values
- **Foreign keys** - Project IDs are validated against existing projects

## Error Handling

The system provides detailed error reporting:

- **Row-level errors** - Specific errors for each row with row number
- **Validation errors** - Pre-upload validation failures
- **Database errors** - Insert failures with error messages
- **Warnings** - Non-critical issues that don't block upload

## Security

- ✅ Authentication required (Supabase Auth)
- ✅ Row Level Security (RLS) enforced
- ✅ User can only upload to their own projects
- ✅ Input validation and sanitization
- ✅ Transactional safety (batch inserts)

## Architecture

```
app/upload-demo/
  └── api/
      └── upload/
          └── route.ts          # Main API endpoint

lib/upload/
  ├── types.ts                  # Type definitions
  ├── parsers.ts                # CSV/JSON parsing
  ├── validators.ts             # Data validation
  ├── table-configs.ts         # Table configurations
  └── handlers.ts               # Database insertion logic
```

## Extending for New Tables

To add support for a new table:

1. Add table type to `lib/upload/types.ts`
2. Add table configuration to `lib/upload/table-configs.ts`
3. Update API route validation in `app/upload-demo/api/upload/route.ts`

## Notes

- Excel format support requires additional library (xlsx) - currently returns error suggesting CSV/JSON
- Large uploads are processed in batches of 100 rows
- Duplicate checking uses table-specific unique constraints
- All dates are normalized to YYYY-MM-DD format
- Numeric fields are automatically converted

