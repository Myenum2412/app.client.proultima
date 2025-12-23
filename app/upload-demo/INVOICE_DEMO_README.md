# Invoice Upload Demo - JSON File

## File Location
`app/upload-demo/demo-invoices.json`

## How to Use

1. **Navigate to Upload Page**: Go to `/upload-demo` in your browser

2. **Select Table**: Choose "Invoices" from the table dropdown

3. **Select Format**: Choose "JSON" from the format dropdown

4. **Load Demo Data**: 
   - Option A: Open `demo-invoices.json` file, copy all contents, and paste into the textarea
   - Option B: Upload the `demo-invoices.json` file directly using the file input

5. **Configure Options**:
   - **Project Selection**: Leave empty (the system will auto-resolve project_id from "Job Number")
   - **Skip Duplicates**: Check this box to avoid inserting duplicate invoices

6. **Upload**: Click "Upload to Supabase" button

## JSON Structure

The demo file contains 11 invoice records with the following structure:

```json
{
  "Job Number": "PRO-2025-001",        // Auto-resolves to project_id
  "Invoice #": "INV-1001",             // Required: Unique invoice number
  "Billed Tonnage": 12.4,              // Optional: Numeric
  "Unit Price / Lump Sum": "$150 / Ton", // Optional: Text
  "Tons Billed Amount": 1860.0,        // Optional: Numeric
  "CO Hours": 6.5,                     // Optional: Numeric (Change Order hours)
  "CO Price": 975.0,                   // Optional: Numeric
  "CO Billed Amount": 975.0,           // Optional: Numeric
  "Total Amount Billed": 2835.0        // Optional: Numeric
}
```

## Column Mappings

The upload system automatically recognizes these column name variations:

| JSON Column Name | Database Column | Required |
|-----------------|----------------|----------|
| `Job Number` | `project_id` (resolved) | Yes* |
| `Invoice #`, `Invoice No`, `Invoice Number` | `invoice_no` | Yes |
| `Billed Tonnage`, `Tonnage` | `billed_tonnage` | No |
| `Unit Price / Lump Sum`, `Unit Price` | `unit_price_or_lump_sum` | No |
| `Tons Billed Amount` | `tons_billed_amount` | No |
| `CO Hours` | `billed_hours_co` | No |
| `CO Price` | `co_price` | No |
| `CO Billed Amount` | `co_billed_amount` | No |
| `Total Amount Billed`, `Total` | `total_amount_billed` | No |

*Required for invoices (can be resolved from Job Number or provided as Project ID)

## Demo Data Overview

The demo file includes invoices for 5 different projects:
- **PRO-2025-001**: 3 invoices
- **PRO-2025-002**: 2 invoices
- **PRO-2025-003**: 2 invoices
- **PRO-2025-004**: 2 invoices
- **PRO-2025-005**: 2 invoices

Each invoice includes:
- Different pricing models ($150/Ton, $145/Ton, $155/Ton, $160/Ton, $148/Ton, Lump Sum)
- Various tonnage amounts
- Some with Change Order (CO) hours and amounts
- Some without CO components

## Expected Results

After uploading, you should see:
- ✅ **11 rows inserted** (if projects exist)
- ✅ **0 errors** (if all Job Numbers match existing projects)
- ✅ **0 skipped** (if skipDuplicates is enabled and no duplicates exist)

## Troubleshooting

### "project_id is required" Error
- **Solution**: Make sure the "Job Number" values in the JSON match existing project job numbers in your database
- **Alternative**: Select a project from the dropdown to apply to all rows

### "Validation failed" Error
- **Solution**: Check that "Invoice #" is provided for all records
- **Solution**: Ensure numeric fields contain valid numbers

### "Insert failed" Error
- **Solution**: Check if invoice numbers already exist (if skipDuplicates is not enabled)
- **Solution**: Verify the project exists and belongs to your user account

## Notes

- All numeric values can be provided as numbers or strings (e.g., `12.4` or `"12.4"`)
- Empty or zero values are acceptable for optional fields
- The system automatically converts data types
- Project ID is resolved from Job Number automatically
- All invoices are linked to the authenticated user's projects via RLS

