# Upload Demo Page - Quick Start Guide

## Access the Page

Navigate to: `/upload-demo`

The page is **protected** and requires authentication. It is **not visible in the sidebar navigation** (as requested).

## Features

✅ **7 Tables Supported:**
- Projects
- Drawings
- Submissions
- Invoices
- Change Orders
- Payments
- Chat Messages

✅ **2 Formats:**
- CSV (Comma-separated values)
- JSON (JavaScript Object Notation)

✅ **Smart Features:**
- Automatic column mapping (recognizes variations like "Job Number" → "job_number")
- Project ID resolution from Job Number
- Duplicate detection
- Row-level error reporting
- Validation feedback

## How to Use

### Step 1: Select Table
Choose which table you want to upload data to from the dropdown.

### Step 2: Select Format
Choose CSV or JSON format.

### Step 3: Provide Data
Either:
- **Upload a file** using the file input
- **Paste data** directly into the textarea

### Step 4: Configure Options
- **Project Selection** (for project-dependent tables): Select a project or leave empty to auto-resolve from "Job Number" column
- **Skip Duplicates**: Check to avoid inserting duplicate records

### Step 5: Upload
Click "Upload to Supabase" button and wait for results.

## Example CSV Data

### Projects
```csv
Job Number,Name,Contractor,Location,Estimated Tons
PRO-2025-001,Valley View Business Park,ABC Construction,PA,398.9
PRO-2025-002,Mid-Way Logistics Center,XYZ Builders,TX,540.5
```

### Drawings
```csv
Job Number,Section,DWG #,Status,Description,Total Weight (Tons),Latest Submitted Date,Release Status
PRO-2025-001,drawing_log,R-71,APP,AREA-H STAIR-H2 SOG,29.55,2024-05-13,Released
PRO-2025-001,drawings_yet_to_return,R-16,APP/R&R,FOUNDATION PANELS,24.64,2024-12-01,Pending
```

### Invoices
```csv
Invoice #,Job Number,Billed Tonnage,Unit Price / Lump Sum,Tons Billed Amount,Total Amount Billed
INV-1001,PRO-2025-001,12.4,$150 / Ton,1860.0,1860.0
INV-1002,PRO-2025-001,8.2,$150 / Ton,1230.0,1230.0
```

## Example JSON Data

### Projects
```json
[
  {
    "Job Number": "PRO-2025-001",
    "Name": "Valley View Business Park",
    "Contractor": "ABC Construction",
    "Location": "PA",
    "Estimated Tons": 398.9
  }
]
```

### Drawings
```json
[
  {
    "Job Number": "PRO-2025-001",
    "Section": "drawing_log",
    "DWG #": "R-71",
    "Status": "APP",
    "Description": "AREA-H STAIR-H2 SOG",
    "Total Weight (Tons)": 29.55,
    "Latest Submitted Date": "2024-05-13",
    "Release Status": "Released"
  }
]
```

## Column Name Variations

The system automatically recognizes these variations:

| Database Column | Accepted Variations |
|----------------|-------------------|
| `job_number` | Job Number, Job # |
| `dwg_no` | DWG #, DWG No, Drawing Number |
| `invoice_no` | Invoice #, Invoice No, Invoice Number |
| `drawing_no` | Drawing #, Drawing No |
| `total_weight_tons` | Total Weight (Tons), Weight |
| `latest_submitted_date` | Latest Submitted Date, Submitted Date, Date |

## Tips

1. **For project-dependent tables** (drawings, submissions, invoices, etc.):
   - Include "Job Number" column in your data to auto-resolve project_id
   - OR select a project from the dropdown to apply to all rows

2. **Dates**: Use YYYY-MM-DD format (e.g., 2024-05-13)

3. **Numbers**: Will be automatically converted (can be strings in CSV/JSON)

4. **Empty values**: Treated as null for optional fields

5. **Errors**: Check the results section for row-level error details

## Troubleshooting

- **"project_id is required"**: Add "Job Number" column or select a project
- **"Invalid JSON format"**: Check your JSON syntax
- **"Validation failed"**: Review required columns and data types
- **"Insert failed"**: Check for foreign key constraints or RLS policies

