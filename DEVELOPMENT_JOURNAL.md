# Development Journal - Financial Clarity Engine

## Project Overview
Personal finance application for tracking expenses, categorizing transactions, and gaining spending insights.
Target users: Norwegian bank customers (DNB, Nordea, Sparebank 1).

**Tech Stack:**
- Next.js 16.2.1 (App Router, Turbopack)
- TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- XLSX for Excel parsing

---

## Phase 1: MVP Development

### T-01: Project Setup & Scaffolding ✅
**Date:** March 29, 2026
**Status:** Complete

**What was done:**
- Initialized Next.js 16 project with TypeScript and Tailwind CSS
- Configured project structure using App Router
- Set up Git repository
- Created initial documentation (README.md)

**Files created:**
- Standard Next.js project scaffolding
- `package.json` with core dependencies
- `tsconfig.json` for TypeScript configuration
- Tailwind configuration

**Key decisions:**
- Chose Next.js 16 App Router over Pages Router for modern patterns
- Used TypeScript for type safety
- Selected Tailwind CSS for rapid UI development

---

### T-02: Implement Google OAuth ✅
**Date:** March 29, 2026
**Status:** Complete

**What was done:**
- Configured Supabase project with Google OAuth provider
- Set up OAuth consent screen in Google Cloud Console
- Implemented server-side Supabase client (`lib/supabase/server.ts`)
- Implemented browser-side Supabase client (`lib/supabase/client.ts`)
- Created login page with Google OAuth button (`app/login/page.tsx`)
- Built authentication callback handler (`app/auth/callback/route.ts`)

**Files created:**
- `lib/supabase/server.ts` - Server-side Supabase client with cookie handling
- `lib/supabase/client.ts` - Browser-side Supabase client
- `app/login/page.tsx` - Login page with Google OAuth
- `app/auth/callback/route.ts` - OAuth callback handler
- `.env.local` - Environment variables (not committed)

**Configuration:**
- Google Cloud Console: OAuth 2.0 Client ID created
- Supabase: Google provider configured with client ID and secret
- Authorized redirect URIs configured

**Key decisions:**
- Used server-side rendering with `@supabase/ssr` for secure session handling
- Separated client/server Supabase utilities to prevent SSR issues
- Implemented proper cookie-based session management

---

### T-03: Implement Magic Link Authentication ✅
**Date:** March 29, 2026
**Status:** Complete

**What was done:**
- Added email/magic link authentication to login page
- Created email input form with loading states
- Implemented server action for sending magic links
- Added confirmation message after magic link sent
- Configured Supabase email templates

**Files modified:**
- `app/login/page.tsx` - Added magic link form alongside Google OAuth

**Features:**
- Email validation before submission
- Loading states during magic link request
- Success/error messaging
- Fallback to magic link if Google OAuth unavailable

**Key decisions:**
- Kept both auth methods on same page for better UX
- Used Supabase's built-in magic link functionality
- No custom email templates needed for MVP

---

### T-04: CSV & Excel Upload with Column Mapping ✅
**Date:** March 30, 2026
**Status:** Complete

**What was done:**
1. **Database Schema:**
   - Created transactions table with comprehensive fields
   - Implemented Row-Level Security (RLS) policies
   - Added indexes for performance (user_id, date, category, row_hash)
   - Set up auto-updating timestamp triggers

2. **Column Mapping System:**
   - Built interactive CSV column mapper dialog
   - Auto-detection of common column names (date, beskrivelse, beløp, inn, ut)
   - Preview table showing first 3 rows of data
   - Manual column selection overrides
   - Support for separate In/Out or combined amount columns

3. **File Upload Component:**
   - CSV and Excel (.xlsx, .xls) file support
   - File validation (type and 10MB size limit)
   - Browser-side Excel to CSV conversion using XLSX library
   - Progress states: idle → uploading → mapping → processing → success/error
   - Integration with column mapper

4. **Backend Parser:**
   - Flexible CSV parser using column mapping
   - Intelligent date parsing supporting multiple formats:
     - DD.MM.YYYY (Norwegian standard)
     - M/D/YYYY (Excel export format)
     - D/M/YYYY (European format)
     - YYYY-MM-DD (ISO format)
   - Amount calculation for both separate In/Out and combined columns
   - Bank name detection from filename
   - Row hash generation for deduplication (T-06 preparation)
   - Proper error handling and validation

**Files created:**
- `supabase/migrations/20260330_create_transactions.sql` - Database schema
- `components/csv-column-mapper.tsx` - Interactive column mapping dialog
- `components/csv-upload.tsx` - Main upload component
- `app/api/upload-csv/route.ts` - Server-side CSV parser and database inserter

**Files modified:**
- `app/dashboard/page.tsx` - Added CSV upload component
- `package.json` - Added xlsx@0.18.5 dependency

**Testing:**
- Successfully tested with real DNB Excel export (60+ transactions)
- Verified date parsing for M/D/YYYY format (Excel default)
- Confirmed RLS policies prevent cross-user data access
- Validated both separate and combined amount column handling

**Key decisions:**
- User-controlled column mapping instead of bank-specific parsers
  - Rationale: More flexible, works with any CSV format, not just Norwegian banks
- Browser-side Excel conversion rather than server-side
  - Rationale: Reduces server load, immediate processing, no file upload needed
- Intelligent date format detection instead of single format
  - Rationale: Excel exports vary by locale, ambiguous dates need smart parsing
- Row hash using MD5 of user_id|date|amount|description
  - Rationale: Enables future duplicate detection in T-06

**Challenges overcome:**
1. **Date parsing bug:** Excel exports dates as M/D/YYYY, but initial parser expected D/M/YYYY
   - Solution: Added format detection logic examining day/month values
2. **Variable naming error:** `useSepar ateAmountColumns` had a space breaking compilation
   - Solution: Fixed variable name, restarted dev server to clear cache
3. **Amount calculation:** Banks use different column structures (In/Out vs combined)
   - Solution: Toggle checkbox + conditional logic handling both patterns

**Performance notes:**
- XLSX library parses client-side, no network delay
- CSV parsing uses efficient string splitting (no regex overhead)
- Database indexes on user_id and transaction_date for fast queries
- RLS policies use indexed user_id for security without performance cost

---

## Upcoming Work

### T-05: PDF Upload & Parse (Optional - "Should")
- Extract transactions from PDF bank statements
- Use PDF parsing library (pdf-parse or similar)
- Map to same transaction structure
- Lower priority than other tickets

### T-06: Transaction Deduplication
- Implement duplicate detection using row_hash
- Show user which transactions are duplicates before import
- Allow manual override of deduplication
- Prevent accidental double-imports

### T-07: Category Data Model & Seed
- Define category taxonomy (income, housing, food, transport, etc.)
- Create categories table
- Seed database with standard Norwegian expense categories
- Support custom user categories

### T-08: Rule-based Categorization Engine
- Create categorization rules table
- Implement pattern matching (regex on description)
- Merchant name recognition
- Amount-based rules
- Auto-categorize on import with confidence score

### T-09: Category Correction UI
- Allow users to review and correct auto-categorized transactions
- Learn from corrections (update rules or add new ones)
- Bulk category updates
- Keyboard shortcuts for efficiency

### T-10: Transaction List View
- Paginated transaction table
- Filters: date range, category, bank, amount range
- Search by description
- Sort by date, amount, category
- Responsive design

### T-11: Spending Category Dashboard
- Visual breakdown by category (pie chart or bar chart)
- Time period selector (month, quarter, year)
- Top spending categories
- Trend analysis

### T-12: Monthly Income/Expense Summary (Optional - "Should")
- Monthly totals for income vs expenses
- Net savings calculation
- Month-over-month comparison
- Export to CSV

### T-13: Row-Level Security Hardening
- Audit all RLS policies
- Ensure users can only access their own data
- Test with multiple user accounts
- Document security model

### T-14: Deploy to Vercel & Smoke Test
- Configure production environment variables
- Set up Vercel project
- Run smoke tests on production
- Document deployment process

---

## Technical Debt & Future Improvements

- [ ] Add TypeScript strict mode
- [ ] Implement proper error boundaries
- [ ] Add loading skeletons for better UX
- [ ] Consider optimistic UI updates
- [ ] Add comprehensive test suite (unit + integration)
- [ ] Implement proper logging (Sentry, LogRocket, etc.)
- [ ] Add analytics (PostHog, Plausible, etc.)
- [ ] Consider i18n for other Nordic countries
- [ ] Mobile-responsive testing and improvements
- [ ] Accessibility audit (WCAG 2.1 AA compliance)

---

## Notes

- All authentication flows use server-side Supabase client for security
- RLS policies enforce data isolation at database level
- CSV/Excel upload works entirely client-side until final POST to API
- Development environment uses `npm run dev` with Turbopack
- Git commits follow conventional commit style
- Norwegian language used in UI (except some technical terms)
