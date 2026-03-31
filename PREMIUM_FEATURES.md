# Premium Features Plan

## Overview
Financial Clarity Engine will offer a free tier with core functionality and a premium tier with advanced features for power users.

---

## Free Tier Features

### ✅ Already Implemented
- Google OAuth & Magic Link authentication
- CSV & Excel upload from Norwegian banks (DNB, Nordea, Sparebank 1)
- Flexible column mapping for any CSV format
- Transaction deduplication with review UI
- Row-Level Security (RLS) for data privacy

### 🎯 Planned (Free)
- **Basic Categorization:**
  - System-provided category taxonomy (14 main categories, 100+ sub-categories)
  - Rule-based auto-categorization
  - Manual category assignment to transactions
  - Category-based spending breakdown

- **Transaction Management:**
  - Transaction list view with filters
  - Search by description, date range, amount
  - Basic spending dashboard by category

- **Reporting:**
  - Monthly income vs expense summary
  - Category spending pie chart
  - Basic export to CSV

---

## Premium Tier Features

### 💎 Custom Categories
**Status:** Planned (T-07 foundation complete)

- Create custom sub-categories under any main category
- Rename generic categories (e.g., "Income 2" → "Freelance Work")
- Rename generic loan categories (e.g., "Subscription 1" → "Netflix")
- Delete unused categories
- Reorder categories for personal preference

**Use Cases:**
- User has multiple income sources: Rename "Salary 2" to "Consulting Income"
- User has multiple hobbies: Rename "Hobby 1" to "Photography", "Hobby 2" to "Gaming"
- User has specific subscriptions: Rename "Subscription 1" to "Netflix", "Subscription 2" to "Spotify"

**Implementation Notes:**
- System categories (is_system = true) cannot be edited
- User categories (is_system = false, user_id = current_user) can be fully customized
- Main categories remain fixed; only sub-categories are customizable

---

### 💰 Loan Tracking & Balance Management
**Status:** Planned (T-07 foundation with is_loan & loan_type fields)

**Feature Set:**
1. **Automatic Payment Detection:**
   - System detects transactions categorized as loan payments
   - Automatically reduces the associated loan balance
   - Tracks payment history over time

2. **Loan Account Setup:**
   - User creates loan accounts with:
     - Initial balance
     - Interest rate (optional)
     - Minimum payment (optional)
     - Due date (optional)
   - Loan types: Hi-Pressure, Lo-Pressure, No-Pressure

3. **Loan Dashboard:**
   - Total debt by pressure type
   - Payoff progress visualization
   - Projected payoff dates based on payment history
   - Interest paid calculations
   - "Debt snowball" vs "Debt avalanche" comparison

4. **Smart Insights:**
   - "You're paying NOK X in interest per month"
   - "At current rate, this loan will be paid off in Y months"
   - "Paying NOK Z extra would save NOK W in interest"

**Example Flow:**
```
1. User uploads CSV with transaction: "DNB - FL Payment, -5000 NOK"
2. System auto-categorizes as "Hi-Pressure Debt: DNB - FL"
3. System finds matching loan account "DNB - FL" with balance NOK 50,000
4. System reduces balance to NOK 45,000
5. Dashboard updates: "You paid NOK 5,000 toward DNB - FL. Balance: NOK 45,000"
```

**Database Schema (Already in place):**
- `categories.is_loan` - identifies loan categories
- `categories.loan_type` - classifies pressure level
- Future table: `loan_accounts` - stores balances and metadata

---

### 📊 Advanced Analytics (Future)
**Status:** Ideas for later expansion

- Multi-month trend analysis
- Budget vs actual spending comparison
- Predictive spending forecasts
- Custom date range reports
- Year-over-year comparisons
- Net worth tracking (assets - liabilities)

---

### 🔄 Recurring Transaction Detection (Future)
**Status:** Ideas for later expansion

- Auto-detect subscriptions and recurring bills
- Alert when recurring transaction is missing
- Suggest optimizations ("You haven't used Netflix in 2 months")

---

### 📧 Bank Integration (Future - Advanced)
**Status:** Ideas for later expansion

- Direct bank API integration (requires PSD2 compliance)
- Automatic transaction sync
- Real-time balance updates
- Multi-bank aggregation

---

## Pricing Strategy (TBD)

**Free Tier:**
- Unlimited transactions
- System categories only
- Basic reporting
- CSV/Excel upload only

**Premium Tier (Suggested):**
- NOK 49/month or NOK 490/year (~15% discount)
- Custom categories
- Loan tracking
- Advanced analytics
- Priority support

**Freemium Conversion Triggers:**
- User reaches 50+ manual category corrections → Suggest custom categories
- User has 3+ loan categories → Suggest loan tracking
- User exports data frequently → Suggest advanced reports

---

## Implementation Roadmap

### Phase 1: MVP (Free Tier)
- ✅ T-01 to T-03: Auth & Setup
- ✅ T-04: CSV Upload
- ✅ T-06: Deduplication
- ✅ T-07: Categories (foundation for premium)
- 🔄 T-08: Auto-categorization
- 🔄 T-09: Category correction UI
- 🔄 T-10: Transaction list
- 🔄 T-11: Spending dashboard
- 🔄 T-13: RLS hardening
- 🔄 T-14: Deploy MVP

### Phase 2: Premium Features (Post-MVP)
- Custom category management UI
- Loan account creation & management
- Payment-to-loan mapping logic
- Loan dashboard & visualizations
- Paywall implementation
- Stripe/Vipps payment integration

### Phase 3: Advanced Features (Long-term)
- Advanced analytics
- Recurring transaction detection
- Budget planning tools
- Bank API integration (if feasible)

---

## Technical Notes

### Category System Architecture
```
categories table:
  - is_system = true, user_id = NULL → System categories (free, read-only)
  - is_system = false, user_id = UUID → User custom categories (premium)

RLS ensures users only see:
  1. All system categories (is_system = true)
  2. Their own custom categories (user_id = current_user)
```

### Loan Tracking Architecture
```
Future tables:
  loan_accounts:
    - id, user_id, category_id (FK to categories)
    - name, initial_balance, current_balance
    - interest_rate, minimum_payment, due_date
    - created_at, updated_at

  loan_payments (materialized view or tracking table):
    - id, loan_account_id, transaction_id
    - payment_date, amount, balance_after

Logic:
  - When transaction is categorized as loan (category.is_loan = true)
  - Find matching loan_account by category
  - Create loan_payment record
  - Reduce loan_account.current_balance
  - Trigger recalculation of payoff projections
```

---

## User Feedback Integration

**From initial user request:**
> "income 2 should be for ie name of second job. same with loans. if there are more than one loans, it should be easy to edit sub category. this should premium. main categories is free."

**Interpretation:**
- ✅ Main categories are system-provided and free
- ✅ Sub-categories can be renamed/customized (premium)
- ✅ Loan categories should support tracking with balance reduction (premium)
- ✅ User wants ability to rename generic placeholders like "Income 2", "Subscription 1", etc.

**Implementation Status:**
- Database foundation: ✅ Complete (T-07)
- UI for custom categories: 🔄 Planned (post-MVP)
- Loan tracking logic: 🔄 Planned (post-MVP)
- Payment integration: 🔄 Planned (post-MVP)
