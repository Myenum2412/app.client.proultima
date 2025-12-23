# API Testing Checklist

## Test in Supabase SQL Editor

Run these queries to verify data exists:

### 1. Check Projects
```sql
SELECT COUNT(*) as count, project_number, project_name 
FROM public.projects 
GROUP BY project_number, project_name;
```
**Expected:** 3 projects (U2524, U2532, U3223P)

### 2. Check Drawing Log
```sql
SELECT COUNT(*) as count 
FROM public.drawing_log;
```
**Expected:** 28 records

### 3. Check Drawings Yet to Release
```sql
SELECT COUNT(*) as count 
FROM public.drawings_yet_to_release;
```
**Expected:** 16 records

### 4. Check Drawings Yet to Return
```sql
SELECT COUNT(*) as count 
FROM public.drawings_yet_to_return;
```
**Expected:** 12 records

### 5. Check Submissions
```sql
SELECT COUNT(*) as count 
FROM public.submissions;
```
**Expected:** 5 records

### 6. Check Invoices
```sql
SELECT COUNT(*) as count 
FROM public.invoices;
```
**Expected:** 4 records

### 7. Check Material Lists
```sql
SELECT COUNT(*) as count 
FROM public.material_lists;
```
**Expected:** 2 records

---

## Test API Endpoints in Browser

Open these URLs in your browser (replace with actual project ID from Supabase):

### Get Projects List
```
http://localhost:3000/api/projects
```
**Expected:** Array of projects with id, jobNumber, name

### Get Project Drawing Sections
```
http://localhost:3000/api/projects/[PROJECT_ID]/sections?section=drawing_log
```
Replace `[PROJECT_ID]` with actual UUID from projects table.

**Expected:** Paginated response with drawings data

---

## Common Issues & Fixes

### Issue 1: No Data in Frontend but Data in Supabase
**Cause:** API not finding data because of wrong project ID format
**Fix:** Check if you're using UUID project IDs, not old `proj-1` format

### Issue 2: 400 Bad Request Errors
**Cause:** API route expecting old ID format
**Fix:** Verify all API routes use UUID projectId parameter

### Issue 3: Empty Tables
**Cause:** Data structure mismatch or RLS policies blocking access
**Fix:** 
1. Check RLS policies allow authenticated users
2. Verify data structure matches expected format

### Issue 4: Material Lists Not Loading
**Cause:** API route not updated
**Fix:** Already fixed in latest update

---

## Quick Debug Steps

1. **Open Browser Console** (F12)
2. **Go to Network Tab**
3. **Reload the page**
4. **Look for failed requests** (red entries)
5. **Click on failed request** to see error details
6. **Check Response tab** for error messages

---

## Get Actual Project IDs

Run this in Supabase SQL Editor to get real project IDs:

```sql
SELECT id, project_number, project_name 
FROM public.projects 
ORDER BY project_number;
```

Copy one of the `id` values (UUID) to test API endpoints.

