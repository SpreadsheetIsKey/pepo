# Supabase Migrations

This directory contains SQL migration files for the Financial Clarity Engine database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended for now)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of each migration file in the `migrations/` directory
4. Paste and run them in order (by filename)

### Option 2: Supabase CLI (For later)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Available Migrations

### 20260329_create_waitlist.sql

Creates the `waitlist` table for storing email signups from the landing page.

**To run manually:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `migrations/20260329_create_waitlist.sql`
3. Click "Run"

This will create:
- `waitlist` table with email and timestamp
- Indexes for performance
- Row Level Security policies
- Public insert access (anyone can sign up)
- Authenticated read access (for admin viewing)
