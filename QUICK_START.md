# Quick Start Guide - Supabase Integration

Get your Proultima application running with Supabase in 5 minutes.

## Prerequisites

- Supabase account (free tier works)
- Project created on https://app.supabase.com

## Step 1: Get Supabase Credentials (2 min)

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (long string starting with `eyJ`)

## Step 2: Configure Environment (1 min)

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Run Database Migrations (2 min)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy contents from `supabase/migrations/001_unified_schema.sql`
4. Paste and click **Run**
5. Wait for success message
6. Repeat with `supabase/migrations/002_seed_data.sql`

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 4: Verify Setup (30 sec)

Run this query in Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM projects;
-- Should return: 3
```

## Step 5: Start Development Server (30 sec)

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## ✅ You're Done!

Your application is now connected to Supabase and serving real data.

## Test Pages

- `/login` - User authentication
- `/dashboard` - Dashboard with metrics
- `/projects` - Project management
- `/billing` - Invoices
- `/submissions` - Submissions list

## Troubleshooting

### "No projects found"
- Check if seed script ran successfully
- Verify environment variables in `.env.local`

### "Authentication error"
- Create a test user in Supabase → Authentication → Users
- Or disable RLS temporarily for testing

### "Connection error"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon** key, not service_role

## Next Steps

Read the full guide: [`SUPABASE_MIGRATION_GUIDE.md`](SUPABASE_MIGRATION_GUIDE.md)

## Need Help?

- Check browser console for detailed errors
- Review Supabase logs in dashboard
- Verify all migrations ran successfully

