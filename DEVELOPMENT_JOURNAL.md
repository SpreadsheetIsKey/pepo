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

### T-06: Transaction Deduplication ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **API Enhancement (Two-Step Import Process):**
   - Modified upload API to support "check" and "import" modes
   - "Check" mode: Analyzes CSV for duplicates without importing
   - "Import" mode: Saves only user-selected transactions
   - Fetches all existing row_hashes for user to compare against new transactions

2. **Duplicate Detection Logic:**
   - Uses existing row_hash field (MD5 of user_id|date|amount|description)
   - Queries user's transactions and compares hashes in memory
   - Separates transactions into "new" and "duplicate" lists
   - Returns counts and full transaction details for review

3. **Duplicate Review Component:**
   - Interactive modal displaying statistics and transaction lists
   - Summary cards: new count, duplicate count, selected count
   - Color-coded tables: green for new, yellow for duplicates
   - Individual checkbox selection per transaction
   - Bulk actions: select all / deselect all
   - Default behavior: auto-selects new, deselects duplicates
   - Manual override capability for all transactions

4. **Updated Upload Flow:**
   - Step 1: User uploads file
   - Step 2: Column mapping
   - Step 3: Duplicate check runs automatically
   - Step 4: If duplicates found, show review screen
   - Step 5: User selects transactions to import
   - Step 6: Import only selected transactions

**Files created:**
- `components/duplicate-review.tsx` - Interactive duplicate review UI

**Files modified:**
- `app/api/upload-csv/route.ts` - Added two-step import with duplicate detection
- `components/csv-upload.tsx` - Added review state and handlers

**Testing:**
- Successfully tested with real DNB Excel file
- Confirmed duplicate detection works when uploading same file twice
- Verified user can manually select/deselect any transaction
- Tested bulk selection actions

**Key decisions:**
- In-memory hash comparison instead of complex SQL queries
  - Rationale: Simpler, avoids Supabase .in() query issues with large arrays
  - Performance: Acceptable for typical user transaction volumes (< 10k)
- Auto-select new, auto-deselect duplicates
  - Rationale: Most common use case, reduces clicks for users
  - Override available for edge cases
- Show all transactions in review, not just duplicates
  - Rationale: Gives user complete control, transparency about what will be imported

**Challenges overcome:**
1. **Supabase query error with .in() clause:**
   - Problem: "Bad Request" error when using .in() with row_hash array
   - Solution: Fetch all user hashes, compare in memory (simpler and more reliable)

2. **State management for multi-step flow:**
   - Problem: Need to maintain csvContent, columnMapping, and transaction lists across states
   - Solution: Added all necessary state variables and proper reset handlers

**User feedback:**
- Request: Add sorting and filtering to duplicate dialogue for easier navigation
- Status: Noted in technical debt for future enhancement

---

### T-07: Category Data Model & Seed ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **Categories Table Schema:**
   - Created comprehensive category taxonomy structure
   - Main category + sub-category hierarchy
   - Support for system-provided (free) and user-custom (premium) categories
   - Loan tracking metadata (is_loan, loan_type fields)
   - RLS policies for category access control

2. **Category Taxonomy (Seeded):**
   - **14 main categories:** Income, Housing, Transportation, Food and Dining, Health and Wellness, Personal Care, Insurance, Subscriptions and Entertainment, Education, Clothing, Family/Child, Miscellaneous, Debt (3 pressure levels), Investing
   - **100+ sub-categories** covering comprehensive spending areas
   - **Loan classification:** Hi-Pressure, Lo-Pressure, No-Pressure debt types
   - **Income identification:** is_income flag for income categories

3. **Premium Features Planning:**
   - Documented free vs premium feature split
   - Created PREMIUM_FEATURES.md with full roadmap
   - Planned custom category management (rename, create, delete)
   - Planned loan tracking system (automatic balance reduction from payments)

4. **Category Structure:**
   ```
   - Income (6 sub-categories)
   - Housing (5 sub-categories)
   - Transportation (7 sub-categories)
   - Food and Dining (5 sub-categories)
   - Health and Wellness (6 sub-categories)
   - Personal Care (3 sub-categories)
   - Insurance (4 sub-categories)
   - Subscriptions and Entertainment (18 sub-categories)
   - Education (4 sub-categories)
   - Clothing (4 sub-categories)
   - Family/Child (7 sub-categories)
   - Miscellaneous (5 sub-categories)
   - Hi-Pressure Debt (3 loan categories)
   - Lo-Pressure Debt (4 loan categories)
   - No-Pressure Debt (16 loan categories)
   - Investing (1 sub-category)
   ```

**Files created:**
- `supabase/migrations/20260331_create_categories.sql` - Categories table with full seed data
- `PREMIUM_FEATURES.md` - Comprehensive premium features roadmap

**Database Schema:**
```sql
categories:
  - id (UUID primary key)
  - user_id (NULL for system, UUID for custom)
  - main_category (TEXT)
  - sub_category (TEXT)
  - is_system (BOOLEAN - free vs premium)
  - is_income (BOOLEAN - income vs expense)
  - is_loan (BOOLEAN - enables loan tracking)
  - loan_type (TEXT - hi/lo/no pressure)
  - display_order (INTEGER - UI sorting)
```

**Key decisions:**
- System categories (user_id = NULL, is_system = true) are read-only and free
- User custom categories (user_id = current_user, is_system = false) are premium
- Loose coupling with transactions table (TEXT field, not FK)
  - Rationale: More flexible for MVP, allows category renaming without breaking history
  - Future: Can add FK if needed for referential integrity
- Loan categories have metadata for future premium loan tracking feature
- Main categories are fixed; only sub-categories are customizable (premium)

**Premium Features Planned:**
1. **Custom Categories (Premium):**
   - Rename generic sub-categories (e.g., "Income 2" → "Freelance Work")
   - Create new sub-categories under existing main categories
   - Delete unused sub-categories
   - Reorder categories

2. **Loan Tracking (Premium):**
   - Create loan accounts with initial balance
   - Auto-detect payments and reduce loan balance
   - Track payoff progress and interest paid
   - Debt snowball/avalanche calculators
   - Projected payoff dates

**User Requirements Met:**
- ✅ Main categories are free and system-provided
- ✅ Sub-categories support customization (infrastructure ready, UI planned for premium)
- ✅ Loan categories prepared for balance tracking (premium feature)
- ✅ Generic placeholders (Income 2, Subscription 1, etc.) can be renamed (premium)

**Testing:**
- Migration ready to run in Supabase
- 100+ categories seeded
- RLS policies ensure proper access control

---

### T-08: Rule-based Categorization Engine ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **Categorization Rules Database:**
   - Created categorization_rules table with pattern matching support
   - Supports 3 pattern types: contains, regex, exact
   - Priority-based rule ordering (lower = higher priority)
   - Confidence scores (0.00-1.00) for categorization quality
   - RLS policies for system and user-specific rules
   - Usage tracking (match_count, last_matched_at)

2. **Seeded 80+ Norwegian Merchant Rules:**
   - Grocery stores: REMA 1000, KIWI, COOP, MENY, BUNNPRIS, EXTRA, JOKER, SPAR
   - Restaurants/Fast food: McDonald's, Burger King, Peppes, Dolly Dimple
   - Cafés: Starbucks, Kaffebrenneriet, Espresso House
   - Gas stations: Circle K, Shell, YX, ESSO
   - Public transit: Ruter, VY, Skyss, ATB, Kolumbus, NSB
   - Toll roads: Autopass, Fjellinjen, Bomring
   - Streaming: Netflix, Spotify, HBO, Disney+, Viaplay
   - Clothing: H&M, Zara, Cubus, Lindex, KappAhl, Dressmann
   - Utilities: Fjordkraft, Tibber, Hafslund
   - Gyms: SATS, EVO, Elixia, Fresh Fitness
   - Bank fees: Gebyr, Kortavgift, Årsavgift

3. **Pattern Matching Engine (lib/categorization.ts):**
   - categorizeTransaction() - Matches description against rules
   - Case-sensitive/insensitive matching support
   - Returns matched category with confidence score
   - Fetches both system and user-specific rules
   - Priority-based rule evaluation

4. **CSV Upload Integration:**
   - Automatically categorizes transactions during import
   - Runs pattern matching on each transaction description
   - Stores category and confidence in database
   - Graceful fallback if categorization fails

**Files created:**
- `supabase/migrations/20260331_create_categorization_rules.sql` - Rules table with 80+ merchant patterns
- `lib/categorization.ts` - Pattern matching engine

**Files modified:**
- `app/api/upload-csv/route.ts` - Added auto-categorization during CSV import

**Key decisions:**
- Contains pattern type for most rules (simplest, fastest)
- Generic "Abonnement 1" for streaming services (users can rename in premium)
- Priority system allows specific rules to override generic ones
- User rules can be added later (premium feature)
- Confidence scores track categorization quality

**Testing:**
- Migration successfully run in Supabase
- 80+ rules seeded
- Ready to auto-categorize on next CSV upload

**Future enhancements ready:**
- Users can create custom rules (premium feature)
- Machine learning from manual corrections (T-09)
- Rule match analytics for improving categorization

---

### T-09: Category Correction UI ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **Transaction List Component:**
   - Interactive table displaying last 100 transactions
   - Columns: date, description, bank, amount, category
   - Sorted by transaction date (newest first)
   - Norwegian date/currency formatting
   - Loading states and empty state handling
   - Responsive design with horizontal scroll

2. **Inline Category Editing:**
   - Click on category to edit
   - Dropdown with all available categories
   - Categories grouped by main category (optgroup)
   - Auto-focus on dropdown for better UX
   - Click outside to cancel editing

3. **Confidence Indicators:**
   - Green dot (●) for high confidence (≥ 0.95)
   - Yellow dot (●) for medium confidence (≥ 0.85)
   - Red dot (●) for low confidence (< 0.85)
   - No indicator for manually corrected categories

4. **Optimistic UI Updates:**
   - Instant visual feedback when changing category
   - Database update happens in background
   - Automatic revert if save fails

5. **Undo Functionality:**
   - Snackbar notification for 5 seconds after change
   - Shows old and new category
   - "Angre" (Undo) button to revert
   - Auto-dismiss after 5 seconds

**Files created:**
- `components/transaction-list.tsx` - Main transaction list component

**Files modified:**
- `app/dashboard/page.tsx` - Added transaction list to dashboard

**Key decisions:**
- Direct Supabase client usage instead of API route
  - Rationale: RLS policies handle security, simpler architecture
  - Performance: Reduces server round-trip
- Optimistic UI updates for better UX
  - Rationale: Instant feedback, network delay hidden
- Manual corrections remove confidence score
  - Rationale: User override is absolute, not probabilistic
- Limited to 100 transactions for MVP
  - Rationale: Performance, pagination can be added later
- No "learn from corrections" yet
  - Rationale: Deferred to future enhancement, MVP focuses on manual correction

**Testing:**
- TypeScript compilation successful
- Component renders without errors
- Ready for user testing

**Future enhancements (not MVP):**
- Pagination for large transaction sets
- Filters: date range, category, amount, bank
- Search by description
- Bulk category updates (select multiple transactions)
- Keyboard shortcuts (arrow keys, Enter to save)
- Learn from corrections (auto-create rules)
- Sort by any column
- Export filtered transactions

---

### T-10: Transaction List View ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **Month Grouping:**
   - Transactions automatically grouped by month
   - Month headers with Norwegian month names (e.g., "mars 2026")
   - Sorted descending (newest first)
   - Gray background for month headers

2. **Category Filtering:**
   - Dropdown showing all categories present in transactions
   - Special "Ukategorisert" option to show only uncategorized
   - Shows count of uncategorized transactions in dropdown
   - Filters update transaction display instantly

3. **Month Filtering:**
   - Dropdown showing all months with transactions
   - Norwegian month formatting
   - Sorted newest to oldest
   - Combined with category filter for precise viewing

4. **Uncategorized Transaction Highlighting:**
   - Amber/yellow background on uncategorized rows (bg-amber-50)
   - Warning icon (⚠️) next to "Ikke kategorisert" label
   - Badge in header showing total uncategorized count
   - One-click filter to show only uncategorized transactions

5. **Filter Counter:**
   - Shows "X av Y transaksjoner" below filters
   - Updates dynamically as filters change
   - Empty state message when no matches

**Files modified:**
- `components/transaction-list.tsx` - Enhanced with filtering and grouping

**Key decisions:**
- Client-side filtering for instant response
  - Rationale: Already fetching all transactions (limit 100), no server round-trip needed
- Month grouping with headers instead of column
  - Rationale: Better visual separation, clearer monthly context
- Amber/yellow for uncategorized instead of red
  - Rationale: Not an error, just needs attention
- Combined filters instead of tabs
  - Rationale: More flexible (can combine month + category)

**Testing:**
- TypeScript compilation successful
- Renders without errors
- Filters work correctly (tested in dev mode)
- Month grouping displays properly

**User Experience:**
- Quick access to uncategorized transactions (one click)
- Easy month-by-month review
- Filter by specific category to see spending patterns
- Visual hierarchy makes scanning easy

**Future enhancements (not MVP):**
- Search by description text
- Date range picker (start/end date)
- Amount range filter (min/max)
- Multiple category selection
- Export filtered transactions to CSV
- Sort by amount or description

---

### T-11: Spending Category Dashboard ✅
**Date:** March 31, 2026
**Status:** Complete

**What was done:**
1. **Visual Category Breakdown:**
   - Categories ranked by total spending (highest first)
   - Color-coded progress bars (blue, indigo, purple, gray)
   - Percentage calculation for each category
   - Amount spent formatted in Norwegian kroner

2. **Total Spending Card:**
   - Prominent card with gradient background (blue/indigo)
   - Shows total for selected period
   - Includes uncategorized expenses indicator
   - Norwegian currency formatting (rounded)

3. **Category Details:**
   - Three data points per category:
     - Category name with transaction count
     - Amount spent with percentage
     - Visual progress bar showing relative spending
   - Top 3 categories highlighted with distinct colors
   - Responsive spacing and layout

4. **Month Filtering:**
   - Dropdown to select specific month or all months
   - Norwegian month names (e.g., "mars 2026")
   - Defaults to most recent month on page load
   - Updates all statistics when changed

5. **Smart Calculations:**
   - Only counts expenses (negative amounts)
   - Filters out income transactions
   - Tracks uncategorized expense total
   - Shows transaction count per category

**Files created:**
- `components/spending-dashboard.tsx` - Main dashboard component

**Files modified:**
- `app/dashboard/page.tsx` - Added spending dashboard above transaction list

**Key decisions:**
- Expenses only in dashboard (income excluded)
  - Rationale: Spending insights are primary use case, income is separate concern
- Rounded currency amounts (no decimals)
  - Rationale: Easier scanning at high level, decimals matter more in detail view
- Default to latest month instead of "all"
  - Rationale: Most users care about current/recent month first
- Progress bars instead of pie chart
  - Rationale: Easier to scan, better for mobile, no library dependency
- Color coding top 3 categories
  - Rationale: Visual hierarchy, highlights biggest spending areas

**Testing:**
- TypeScript compilation successful
- Renders without errors
- Calculations verified (percentages sum to 100%)
- Month filtering works correctly

**User Experience:**
- Clear visual hierarchy (biggest spenders stand out)
- Quick monthly overview at a glance
- Transaction counts provide context
- Uncategorized expenses are tracked separately

**Future enhancements (not MVP):**
- Trend comparison (this month vs last month)
- Budget limits per category
- Spending alerts when approaching limits
- Category drill-down (click to see transactions)
- Export dashboard as image/PDF
- Custom date range (not just month)
- Income vs expense comparison chart

---

## Upcoming Work

### T-05: PDF Upload & Parse (Optional - "Should")
- Extract transactions from PDF bank statements
- Use PDF parsing library (pdf-parse or similar)
- Map to same transaction structure
- Lower priority than other tickets

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
- [ ] **T-06 Enhancement:** Add sorting and filtering to duplicate review dialogue for easier navigation with large transaction sets

---

## Notes

- All authentication flows use server-side Supabase client for security
- RLS policies enforce data isolation at database level
- CSV/Excel upload works entirely client-side until final POST to API
- Development environment uses `npm run dev` with Turbopack
- Git commits follow conventional commit style
- Norwegian language used in UI (except some technical terms)
