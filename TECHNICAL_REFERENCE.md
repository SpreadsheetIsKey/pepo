# Technical Reference - Financial Clarity Engine

**Purpose:** Complete technical documentation for reverse engineering, debugging, and understanding the system architecture.

**Last Updated:** March 31, 2026
**Version:** MVP Phase 1 - T-08 Complete

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [File Structure](#file-structure)
4. [Data Flow](#data-flow)
5. [Key Technical Decisions](#key-technical-decisions)
6. [Known Issues & Limitations](#known-issues--limitations)
7. [Migration History](#migration-history)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Environment Setup](#environment-setup)

---

## System Architecture

### Tech Stack
```
Frontend:
├── Next.js 16.2.1 (App Router)
├── TypeScript
├── Tailwind CSS
└── React Server Components

Backend:
├── Supabase (PostgreSQL + Auth)
├── Next.js API Routes
└── Server-Side Rendering (SSR)

Libraries:
├── @supabase/ssr (authentication)
├── xlsx@0.18.5 (Excel parsing)
└── crypto (Node.js built-in for hashing)
```

### Architecture Pattern
- **Monolithic Next.js app** with API routes
- **Server-side Supabase client** for auth and database operations
- **Client-side Supabase client** for browser operations
- **Row-Level Security (RLS)** enforces data isolation at database level

### Authentication Flow
```
1. User visits /login
2. Chooses Google OAuth OR Magic Link
3. Supabase handles authentication
4. Callback to /auth/callback
5. Session stored in cookies (httpOnly)
6. Protected routes check auth status
7. Redirect to /dashboard on success
```

---

## Database Schema

### Tables Overview
```
auth.users (Supabase managed)
├── transactions (user transaction data)
├── categories (expense/income categories)
├── categorization_rules (pattern matching rules)
└── waitlist (pre-launch email collection)
```

### `transactions` Table
**Purpose:** Store all user financial transactions from CSV/Excel uploads

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,  -- Negative = expense, Positive = income
  description TEXT NOT NULL,

  -- Bank metadata
  bank_name TEXT,                  -- 'DNB', 'Nordea', 'Sparebank 1'
  account_number TEXT,

  -- Categorization (populated by T-08 auto-categorization)
  category TEXT,                   -- Format: "Main Category: Sub Category"
  category_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- Deduplication (T-06)
  file_name TEXT,
  file_uploaded_at TIMESTAMPTZ,
  row_hash TEXT,                   -- MD5(user_id|date|amount|description)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_row_hash ON transactions(row_hash);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
```

**RLS Policies:**
- Users can only SELECT/INSERT/UPDATE/DELETE their own transactions
- Enforced via `auth.uid() = user_id` checks

### `categories` Table
**Purpose:** Define the category taxonomy (14 main categories, 100+ sub-categories)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,

  is_system BOOLEAN NOT NULL DEFAULT true,    -- true = free, false = premium
  is_income BOOLEAN NOT NULL DEFAULT false,   -- true = income category
  display_order INTEGER,                      -- UI sorting

  -- Loan tracking (premium feature - future)
  is_loan BOOLEAN NOT NULL DEFAULT false,
  loan_type TEXT,                             -- 'hi-pressure', 'lo-pressure', 'no-pressure'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, main_category, sub_category)
);
```

**Key Categories:**
- **Inntekt** (Income): 5 sub-categories
- **Bolig** (Housing): 5 sub-categories
- **Transport**: 7 sub-categories
- **Mat og Servering** (Food & Dining): 5 sub-categories
- **Helse og Velvære** (Health & Wellness): 6 sub-categories
- **Personlig Pleie** (Personal Care): 3 sub-categories
- **Forsikring** (Insurance): 4 sub-categories
- **Abonnement og Underholdning** (Subscriptions & Entertainment): 18 sub-categories
- **Utdanning** (Education): 4 sub-categories
- **Klær** (Clothing): 4 sub-categories
- **Familie/Barn** (Family/Children): 7 sub-categories
- **Diverse** (Miscellaneous): 5 sub-categories
- **Høyrente Gjeld** (High-interest Debt): 5 sub-categories
- **Lavrente Gjeld** (Low-interest Debt): 5 sub-categories
- **Ingen Press Gjeld** (No-pressure Debt): 10 sub-categories
- **Investering** (Investment): 3 sub-categories

**RLS Policies:**
- Users can view all system categories (user_id = NULL)
- Users can view/edit/delete only their own custom categories

### `categorization_rules` Table
**Purpose:** Store pattern matching rules for auto-categorization

```sql
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern matching
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL DEFAULT 'contains', -- 'contains', 'regex', 'exact'
  case_sensitive BOOLEAN NOT NULL DEFAULT false,

  -- Category assignment
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,

  -- Rule metadata
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.95,
  priority INTEGER NOT NULL DEFAULT 100,          -- Lower = higher priority
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Usage tracking
  match_count INTEGER NOT NULL DEFAULT 0,
  last_matched_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**80+ Seeded Rules Examples:**
- `REMA 1000` → Mat og Servering: Dagligvarer (0.99 confidence)
- `CIRCLE K` → Transport: Drivstoff (0.95 confidence)
- `NETFLIX` → Abonnement og Underholdning: Abonnement 1 (0.99 confidence)

**Pattern Types:**
- **contains**: Case-insensitive substring match (most common)
- **regex**: Full regex pattern matching
- **exact**: Exact string match

---

## File Structure

```
/
├── app/                          # Next.js 16 App Router
│   ├── page.tsx                  # Landing page
│   ├── login/
│   │   └── page.tsx              # Login with Google OAuth + Magic Link
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (protected)
│   └── api/
│       └── upload-csv/
│           └── route.ts          # CSV upload + parsing + categorization
│
├── components/
│   ├── csv-upload.tsx            # File upload UI component
│   ├── csv-column-mapper.tsx    # Interactive column mapping dialog
│   ├── duplicate-review.tsx     # Duplicate transaction review UI
│   └── sign-out-button.tsx      # Sign out button component
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── client.ts             # Browser-side Supabase client
│   └── categorization.ts         # Pattern matching engine (T-08)
│
├── supabase/
│   └── migrations/
│       ├── 20260329_create_waitlist.sql
│       ├── 20260330_create_transactions.sql
│       ├── 20260331_create_categories.sql
│       └── 20260331_create_categorization_rules.sql
│
├── docs/
│   ├── mvp_tracker.html          # Visual MVP progress tracker
│   └── development-journal.html  # Development journal (HTML)
│
├── DEVELOPMENT_JOURNAL.md        # Markdown development log
├── PREMIUM_FEATURES.md           # Premium features roadmap
├── TECHNICAL_REFERENCE.md        # This file
└── README.md                     # Project overview
```

---

## Data Flow

### CSV Upload & Categorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects CSV/Excel file                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Browser: xlsx library converts Excel → CSV (if needed)  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User maps columns (Date, Description, Amount, In/Out)   │
│    Component: csv-column-mapper.tsx                         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. POST /api/upload-csv with mode="check"                  │
│    - Parse CSV using column mapping                         │
│    - Generate row_hash for each transaction                 │
│    - Fetch existing user hashes from database               │
│    - Identify new vs duplicate transactions                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. If duplicates found: Show duplicate-review.tsx          │
│    - Display new (green) and duplicate (yellow) lists      │
│    - User selects which transactions to import             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. POST /api/upload-csv with mode="import"                 │
│    - For each selected transaction:                         │
│      a. Run categorizeTransaction() (lib/categorization.ts) │
│      b. Fetch active categorization_rules                   │
│      c. Test patterns in priority order                     │
│      d. Return matched category + confidence                │
│    - Insert transactions with category data                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Success! Transactions stored in database                │
│    - category: "Mat og Servering: Dagligvarer"             │
│    - category_confidence: 0.99                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Google OAuth:
1. User clicks "Sign in with Google"
2. Supabase redirects to Google OAuth consent screen
3. Google redirects to /auth/callback with code
4. Supabase exchanges code for session
5. Session stored in httpOnly cookies
6. Redirect to /dashboard

Magic Link:
1. User enters email
2. Supabase sends magic link email
3. User clicks link → redirects to /auth/callback
4. Supabase validates token
5. Session stored in httpOnly cookies
6. Redirect to /dashboard
```

---

## Key Technical Decisions

### 1. **User-Controlled Column Mapping** (T-04)
**Decision:** Let users manually map CSV columns instead of bank-specific parsers

**Rationale:**
- Works with ANY CSV format (not just Norwegian banks)
- More flexible than hardcoded parsers
- Handles format variations (Excel exports, different locales)

**Trade-off:** Extra step for user, but gained flexibility

### 2. **Browser-Side Excel Conversion** (T-04)
**Decision:** Use `xlsx` library to convert Excel → CSV in browser

**Rationale:**
- No server-side file upload needed
- Instant processing
- Reduced server load
- No file storage required

**Trade-off:** Larger client bundle size

### 3. **In-Memory Duplicate Detection** (T-06)
**Decision:** Fetch all user row_hashes and compare in memory

**Rationale:**
- Simpler than complex SQL queries
- Avoids Supabase `.in()` issues with large arrays
- Acceptable performance for typical user volumes (<10k transactions)

**Trade-off:** Memory usage grows with transaction count (not a problem for MVP)

### 4. **Generic Category Placeholders** (T-07)
**Decision:** System categories use generic names ("Inntekt 1", "Lån 1", "Abonnement 1")

**Rationale:**
- Free users get system categories
- Premium users can rename to specific names ("Inntekt 1" → "Freelance Work")
- Enables freemium business model

**Trade-off:** Generic names less intuitive, but enables monetization

### 5. **Loose Coupling: Categories as TEXT** (T-07)
**Decision:** Store category as TEXT field instead of foreign key

**Rationale:**
- More flexible for renaming categories
- No cascade issues when editing categories
- Simpler schema

**Trade-off:** No referential integrity, but acceptable for MVP

### 6. **Contains Pattern Type** (T-08)
**Decision:** Most rules use "contains" instead of regex

**Rationale:**
- Faster execution
- Easier to maintain
- Case-insensitive by default
- 99% of use cases covered

**Trade-off:** Less precise, but good enough for merchant matching

### 7. **Priority-Based Rule Matching** (T-08)
**Decision:** Rules have priority field (lower = higher priority)

**Rationale:**
- Specific rules can override generic ones
- e.g., "REMA 1000 Majorstuen" (priority 5) overrides "REMA 1000" (priority 10)

**Trade-off:** Need to manage priorities, but adds flexibility

---

## Known Issues & Limitations

### Current Issues

#### 1. **Duplicate Detection Not Working (T-06)**
**Status:** ⚠️ BROKEN
**Error:** `Duplicate check error: { message: 'Bad Request' }`
**Location:** `app/api/upload-csv/route.ts:222`

**Symptoms:**
- CSV upload fails with "Kunne ikke sjekke for duplikater"
- Console shows `Duplicate check error: {}`

**Possible Causes:**
- Supabase RLS policy blocking SELECT on transactions table
- Missing row_hash index
- Auth session not properly passed to database query

**Debug Steps:**
1. Check RLS policies on transactions table in Supabase
2. Verify user is authenticated in API route
3. Test SELECT query manually in Supabase SQL editor
4. Check if row_hash column exists and has index

**Workaround:** None currently - upload is blocked

---

#### 2. **No UI for Viewing Transactions** (T-10 not started)
**Status:** ⏳ NOT IMPLEMENTED

**Impact:**
- Users can upload transactions
- Transactions are auto-categorized
- **BUT**: No way to view them in the UI!
- Must check Supabase dashboard directly

**Next Step:** Implement T-10 (Transaction List View)

---

### Limitations

#### 1. **CSV-Only Upload**
- PDF parsing (T-05) was deprioritized
- Users must export CSV from their bank
- No direct bank integration

#### 2. **No Category Editing**
- Auto-categorization works
- Users cannot correct wrong categories yet (T-09 not started)

#### 3. **No Visualizations**
- No spending dashboard (T-11)
- No monthly summaries (T-12)

#### 4. **Single-Account**
- Cannot track multiple bank accounts
- All transactions in one pool

#### 5. **Norwegian-Only**
- All categories in Norwegian
- Merchant rules focused on Norwegian stores
- No i18n support

---

## Migration History

### Timeline
```
20260329_create_waitlist.sql           ✅ Applied
20260330_create_transactions.sql       ✅ Applied
20260331_create_categories.sql         ✅ Applied
20260331_create_categorization_rules.sql ✅ Applied
```

### How to Apply Migrations

**Option 1: Supabase SQL Editor (Recommended for MVP)**
```sql
-- Copy contents of migration file
-- Paste into Supabase SQL Editor
-- Run query
```

**Option 2: Supabase CLI (Future)**
```bash
supabase db push
```

### Migration Dependencies
```
categorization_rules → categories (references main_category, sub_category)
transactions → auth.users (references user_id)
categories → auth.users (references user_id for custom categories)
```

### Rollback Plan
⚠️ **WARNING:** No rollback migrations exist yet!

To rollback manually:
```sql
-- Reverse order of creation
DROP TABLE IF EXISTS categorization_rules CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_rule_match_count(UUID) CASCADE;
```

---

## Troubleshooting Guide

### Problem: CSV Upload Fails with "Kunne ikke sjekke for duplikater"

**Symptoms:**
- Error message in UI after column mapping
- Console shows `Duplicate check error: { message: 'Bad Request' }`

**Debug Steps:**
1. Check if user is authenticated:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser()
   console.log('User:', user, 'Error:', error)
   ```

2. Test SELECT query manually in Supabase:
   ```sql
   SELECT row_hash FROM transactions WHERE user_id = '<your-user-id>';
   ```

3. Check RLS policies on transactions table:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'transactions';
   ```

4. Verify transactions table exists:
   ```sql
   \dt transactions
   ```

---

### Problem: Auto-Categorization Not Working

**Symptoms:**
- Transactions upload successfully
- `category` field is NULL
- `category_confidence` is NULL

**Debug Steps:**
1. Check if categorization_rules table exists:
   ```sql
   SELECT COUNT(*) FROM categorization_rules WHERE is_system = true;
   ```
   Should return 80+

2. Test pattern matching manually:
   ```typescript
   import { categorizeTransaction } from '@/lib/categorization'
   const result = await categorizeTransaction('REMA 1000 OSLO', userId)
   console.log(result)
   ```

3. Check if rules are active:
   ```sql
   SELECT * FROM categorization_rules WHERE pattern = 'REMA 1000' AND is_active = true;
   ```

---

### Problem: Google OAuth Redirect Loop

**Symptoms:**
- Clicking "Sign in with Google" redirects back to login page
- No error message shown

**Debug Steps:**
1. Check OAuth redirect URIs in Google Cloud Console:
   - Should include: `https://<project-id>.supabase.co/auth/v1/callback`

2. Verify Supabase Google OAuth is enabled:
   - Supabase Dashboard → Authentication → Providers → Google

3. Check environment variables:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

---

### Problem: "Migration syntax error"

**Symptoms:**
- SQL error when running migration
- Error mentions "syntax error at or near..."

**Common Causes:**
1. **Missing comma:** Check line before error
2. **Comment with quotes:** Remove inline comments with quotes
3. **Function doesn't exist:** Run `update_updated_at_column()` creation first

**Fix:**
```sql
-- Bad:
priority INTEGER NOT NULL DEFAULT 100
is_system BOOLEAN NOT NULL DEFAULT true,

-- Good:
priority INTEGER NOT NULL DEFAULT 100,
is_system BOOLEAN NOT NULL DEFAULT true,
```

---

## Environment Setup

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
Supabase account
```

### Environment Variables
```bash
# .env.local (DO NOT COMMIT!)
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Local Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open browser
http://localhost:3000
```

### Supabase Setup
1. Create project at https://supabase.com
2. Run migrations in SQL Editor (in order)
3. Enable Google OAuth in Authentication settings
4. Copy URL and anon key to `.env.local`

### Vercel Deployment
```bash
# Link project
vercel link

# Set environment variables in Vercel dashboard
# Deploy
vercel --prod
```

---

## Quick Reference

### Important File Locations
| File | Purpose |
|------|---------|
| `app/api/upload-csv/route.ts` | CSV parsing + categorization logic |
| `lib/categorization.ts` | Pattern matching engine |
| `lib/supabase/server.ts` | Server-side DB client |
| `components/csv-upload.tsx` | File upload UI |
| `supabase/migrations/*` | Database schema |

### Database Tables
| Table | Purpose | Rows |
|-------|---------|------|
| `transactions` | User transaction data | ~thousands |
| `categories` | Category taxonomy | 100+ |
| `categorization_rules` | Pattern matching rules | 80+ |
| `waitlist` | Pre-launch emails | Variable |

### Key Functions
| Function | Location | Purpose |
|----------|----------|---------|
| `categorizeTransaction()` | `lib/categorization.ts` | Match transaction to category |
| `parseCSVWithMapping()` | `app/api/upload-csv/route.ts` | Parse CSV using column map |
| `generateRowHash()` | `app/api/upload-csv/route.ts` | Create MD5 hash for dedup |
| `createClient()` | `lib/supabase/server.ts` | Get authenticated DB client |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload-csv?mode=check` | POST | Check for duplicates |
| `/api/upload-csv?mode=import` | POST | Import transactions |
| `/auth/callback` | GET | OAuth callback handler |

---

## Debugging Checklist

Before seeking help, check:
- [ ] Are all environment variables set?
- [ ] Are all migrations applied in Supabase?
- [ ] Is the user authenticated? (check `supabase.auth.getUser()`)
- [ ] Are RLS policies enabled on all tables?
- [ ] Is the dev server running? (`npm run dev`)
- [ ] Are there any console errors in browser DevTools?
- [ ] Did you check the Next.js dev server logs?
- [ ] Did you test the query manually in Supabase SQL Editor?

---

## Contact & Support

- **Development Journal:** See `DEVELOPMENT_JOURNAL.md` for full implementation history
- **Premium Features:** See `PREMIUM_FEATURES.md` for future roadmap
- **Git History:** Use `git log --oneline` to see commit history
- **Supabase Logs:** Check Supabase Dashboard → Database → Logs

---

**End of Technical Reference**
