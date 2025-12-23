# Invoice Data Script

## File: `invoice-data.sql`

This script inserts **25 invoice records** into Supabase that will appear in the **Billing page** invoice table.

## What It Does

- ✅ Finds all your existing projects
- ✅ Inserts 25 invoices distributed across your projects
- ✅ Invoices automatically appear in `/billing` page table
- ✅ Works with any number of projects (cycles through them)

## Invoice Data Included

The script creates 25 invoices with:
- **Various pricing models**: $150/Ton, $145/Ton, $155/Ton, $160/Ton, $148/Ton, $152/Ton, $158/Ton, Lump Sum
- **Different tonnage amounts**: 8.2 to 38.6 tons
- **Mix of invoices**: Some with Change Order (CO) components, some without
- **Realistic amounts**: Total amounts ranging from $1,200 to $8,712

## How to Use

1. **Prerequisites**: Make sure you have at least one project created
   - Run `supabase/seed.sql` first if you don't have projects yet

2. **Open Supabase SQL Editor**
   - Go to your Supabase project
   - Navigate to SQL Editor

3. **Run the Script**
   - Open `supabase/demo/invoice-data.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

4. **Auto-Detection**
   - The script automatically uses your most recent Auth user
   - No need to manually set UUIDs

5. **View Results**
   - Go to `/billing` page in your app
   - You should see 25 invoices in the table

## Invoice Distribution

The script cycles through your projects:
- If you have 1 project: All 25 invoices go to that project
- If you have 2 projects: Invoices alternate between projects
- If you have 5 projects: Each project gets ~5 invoices
- And so on...

## Invoice Details

Each invoice includes:
- **Invoice #**: INV-1001 through INV-1025
- **Billed Tonnage**: Numeric value in tons
- **Unit Price / Lump Sum**: Pricing model
- **Tons Billed Amount**: Calculated amount
- **CO Hours**: Change Order hours (if applicable)
- **CO Price**: Change Order price per hour
- **CO Billed Amount**: Total CO amount
- **Total Amount Billed**: Final invoice total

## Where Data Appears

| Location | What You'll See |
|----------|----------------|
| **Billing Page** (`/billing`) | Invoice History table with 25 invoices |
| **Project Pages** (`/projects/[id]`) | Invoice History section shows invoices for that project |

## Example Invoice Data

```sql
Invoice #: INV-1001
Billed Tonnage: 12.4
Unit Price: $150 / Ton
Tons Billed Amount: $1,860.00
CO Hours: 6.5
CO Price: $975.00
CO Billed Amount: $975.00
Total Amount Billed: $2,835.00
```

## Troubleshooting

### "No projects found"
- **Solution**: Run `supabase/seed.sql` first to create projects
- Or create projects manually in your app

### "No Auth user found"
- **Solution**: Create a user in Supabase Auth → Users first
- Or set `owner_email` in the script to your email

### Invoices not showing
- **Solution**: Refresh the billing page (Ctrl+R or Cmd+R)
- **Solution**: Check that you're logged in as the same user
- **Solution**: Verify RLS policies are enabled

### Duplicate invoices
- **Solution**: The script doesn't check for duplicates
- If you run it multiple times, you'll get duplicate invoice numbers
- Delete existing invoices first if needed

## Notes

- All invoices are linked to your projects via `project_id`
- Invoices respect Row Level Security (RLS)
- Data is ordered by `created_at` (newest first) in the billing page
- The script works with any number of projects (1 or more)

