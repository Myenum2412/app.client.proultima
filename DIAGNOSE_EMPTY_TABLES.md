# Diagnose Empty Tables Issue

## Problem
Data is in Supabase but not showing on frontend tables.

## Step-by-Step Diagnosis

### Step 1: Verify Data in Supabase

Run in Supabase SQL Editor:

```sql
-- Quick check all tables
SELECT 'projects' as table_name, COUNT(*) FROM projects
UNION ALL SELECT 'drawing_log', COUNT(*) FROM drawing_log
UNION ALL SELECT 'drawings_yet_to_release', COUNT(*) FROM drawings_yet_to_release
UNION ALL SELECT 'drawings_yet_to_return', COUNT(*) FROM drawings_yet_to_return
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'material_lists', COUNT(*) FROM material_lists;
```

**✅ If you see counts > 0**, data exists. Move to Step 2.  
**❌ If counts are 0**, re-run seed script.

### Step 2: Check RLS Policies

Run in Supabase SQL Editor:

```sql
-- Check if RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**✅ If you see policies for each table**, RLS is configured.  
**❌ If no policies**, RLS might be blocking access.

### Step 3: Test API Manually

Get a project ID first:

```sql
SELECT id, project_number FROM projects LIMIT 1;
```

Copy the `id` (UUID), then test in browser:

```
http://localhost:3000/api/projects
```

**✅ If you see JSON with projects**, API works.  
**❌ If error or empty array**, check console for errors.

### Step 4: Test Specific Section

```
http://localhost:3000/api/projects/[PASTE_UUID_HERE]/sections?section=drawing_log
```

**✅ If you see paginated data**, API is working.  
**❌ If 400/500 error**, check server logs.

### Step 5: Check Authentication

The app requires authentication. Make sure:

1. You're logged in
2. Supabase auth is working
3. Check browser Application tab > Cookies > supabase-auth-token

**✅ If cookie exists**, auth is working.  
**❌ If no cookie**, login again.

### Step 6: Check Browser Console

Open DevTools (F12) > Console tab:

Look for errors like:
- ❌ "Failed to fetch"
- ❌ "401 Unauthorized"
- ❌ "Network error"
- ❌ "PostgrestError"

### Step 7: Check Network Tab

Open DevTools > Network tab > Reload page:

Look for:
- Red (failed) requests
- Check Status codes (200 = OK, 400 = Bad Request, 500 = Server Error)
- Click on failed request > Response tab to see error

---

## Common Root Causes & Solutions

### Cause 1: Authentication Not Set Up
**Symptoms:** All API calls return 401 Unauthorized

**Solution:**
```bash
# Check .env.local has correct values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
```

### Cause 2: RLS Policies Blocking Access
**Symptoms:** Data in DB but API returns empty arrays

**Solution:** Temporarily disable RLS to test:
```sql
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings_yet_to_release DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings_yet_to_return DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lists DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANT:** Re-enable after testing!

### Cause 3: Project ID Format Mismatch
**Symptoms:** 400 Bad Request on /api/projects/[id]/sections

**Solution:** The app now uses UUID format (`35ae25a4-...`), not old format (`proj-1`).

If you see old format in URLs, check if `projects` state has correct IDs.

### Cause 4: Missing await in Supabase Client
**Symptoms:** Random errors, sometimes works sometimes doesn't

**Solution:** Ensure all Supabase client creations use `await`:
```typescript
const supabase = await createSupabaseServerClient();
```

### Cause 5: CORS or Network Issues
**Symptoms:** Failed to fetch, network errors

**Solution:**
1. Restart dev server: `npm run dev`
2. Clear browser cache
3. Check Supabase project is not paused

---

## Quick Fix Commands

### Restart Everything
```bash
# Stop dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Reinstall if needed
npm install

# Start fresh
npm run dev
```

### Check Server Logs
Look at your terminal where `npm run dev` is running.

Look for errors like:
- `Error fetching projects:`
- `PostgrestError:`
- `Failed to fetch`

---

## Test with curl

Test API without browser:

```bash
# Test projects endpoint
curl http://localhost:3000/api/projects

# Test sections endpoint (replace UUID)
curl 'http://localhost:3000/api/projects/35ae25a4-b8a2-4e1c-8f33-825e29d6b334/sections?section=drawing_log'
```

**✅ If you see JSON**, API works. Issue is in frontend.  
**❌ If you see HTML error page**, API has issues.

---

## Final Checklist

- [ ] Data exists in Supabase (verified with SQL queries)
- [ ] RLS policies exist and allow access
- [ ] `.env.local` has correct Supabase credentials
- [ ] User is logged in (check cookies)
- [ ] API returns data when tested in browser
- [ ] No errors in browser console
- [ ] No failed requests in Network tab
- [ ] Dev server is running without errors

If all checked ✅ and still empty tables, check frontend component logic.

---

## Get Help

If still stuck, provide:
1. Screenshot of Network tab showing failed requests
2. Error messages from browser console
3. Error messages from terminal (server logs)
4. Result of SQL query showing data exists

