# Upload System Usage Examples

## Example 1: Upload Projects (CSV)

```typescript
const csvData = `Job Number,Name,Contractor,Location,Estimated Tons
PRO-2025-001,Valley View Business Park,ABC Construction,PA,398.9
PRO-2025-002,Mid-Way Logistics Center,XYZ Builders,TX,540.5`;

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

const result = await response.json();
console.log(result);
// {
//   success: true,
//   inserted: 2,
//   skipped: 0,
//   errors: [],
//   message: "Inserted 2 rows, skipped 0 duplicates, 0 errors"
// }
```

## Example 2: Upload Drawings (JSON)

```typescript
const drawingsData = [
  {
    "Job Number": "PRO-2025-001",
    "Section": "drawing_log",
    "DWG #": "R-71",
    "Status": "APP",
    "Description": "AREA-H STAIR-H2 SOG",
    "Total Weight (Tons)": 29.55,
    "Latest Submitted Date": "2024-05-13",
    "Release Status": "Released"
  },
  {
    "Job Number": "PRO-2025-001",
    "Section": "drawings_yet_to_return",
    "DWG #": "R-16",
    "Status": "APP/R&R",
    "Description": "FOUNDATION PANELS F1 TO F8",
    "Total Weight (Tons)": 24.64,
    "Latest Submitted Date": "2024-12-01",
    "Release Status": "Pending"
  }
];

const response = await fetch('/upload-demo/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'drawings',
    format: 'json',
    data: drawingsData,
    options: { skipDuplicates: true }
  })
});
```

## Example 3: Upload Invoices (CSV with Project ID)

```typescript
const invoicesData = `Invoice #,Project ID,Billed Tonnage,Unit Price / Lump Sum,Tons Billed Amount,Total Amount Billed
INV-1001,<project-uuid>,12.4,$150 / Ton,1860.0,1860.0
INV-1002,<project-uuid>,8.2,$150 / Ton,1230.0,1230.0`;

const response = await fetch('/upload-demo/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'invoices',
    format: 'csv',
    data: invoicesData,
    options: {
      skipDuplicates: true,
      projectId: '<project-uuid>' // Optional: if all invoices are for same project
    }
  })
});
```

## Example 4: Upload Submissions (JSON with Job Number)

```typescript
const submissionsData = [
  {
    "Job Number": "PRO-2025-001",
    "PROULTIMA PM": "PROULTIMA PM",
    "Submission Type": "RFI",
    "Work Description": "Anchor bolt plan update",
    "Drawing #": "R-71",
    "Submission Date": "2024-12-22"
  }
];

const response = await fetch('/upload-demo/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'submissions',
    format: 'json',
    data: submissionsData,
    options: { skipDuplicates: true }
  })
});
```

## Example 5: Error Handling

```typescript
try {
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

  const result = await response.json();

  if (!result.success) {
    console.error('Upload failed:', result.message);
    if (result.errors && result.errors.length > 0) {
      console.error('Row errors:', result.errors);
    }
  } else {
    console.log(`Successfully inserted ${result.inserted} rows`);
    if (result.skipped > 0) {
      console.log(`Skipped ${result.skipped} duplicates`);
    }
    if (result.errors && result.errors.length > 0) {
      console.warn('Some rows had errors:', result.errors);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Column Name Variations

The system automatically recognizes these column name variations:

### Projects
- `Job Number`, `Job #` → `job_number`
- `Project Name`, `Name` → `name`
- `Contractor`, `Contractor Name` → `contractor_name`
- `Fabricator`, `Fabricator Name` → `fabricator_name`
- `Location` → `location`
- `Estimated Tons`, `Tons` → `estimated_tons`

### Drawings
- `DWG #`, `DWG No`, `Drawing Number` → `dwg_no`
- `Section` → `section`
- `Status` → `status`
- `Description` → `description`
- `Total Weight (Tons)`, `Weight` → `total_weight_tons`
- `Latest Submitted Date`, `Submitted Date`, `Date` → `latest_submitted_date`
- `Release Status` → `release_status`

### Invoices
- `Invoice #`, `Invoice No`, `Invoice Number` → `invoice_no`
- `Billed Tonnage`, `Tonnage` → `billed_tonnage`
- `Unit Price / Lump Sum`, `Unit Price` → `unit_price_or_lump_sum`
- `Total Amount Billed`, `Total` → `total_amount_billed`

## Notes

- All dates should be in `YYYY-MM-DD` format
- Numeric fields are automatically converted
- Empty strings are treated as null for optional fields
- Project ID can be resolved from Job Number automatically
- Duplicate checking uses table-specific unique constraints

