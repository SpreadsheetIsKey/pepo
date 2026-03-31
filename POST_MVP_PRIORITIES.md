# Post-MVP Priority Features

**Date:** March 31, 2026
**Status:** Planning for immediate post-MVP iteration

---

## Critical UX Improvements (Priority 1)

These features significantly improve the user experience and should be implemented before wider launch:

### 1. Live Update on Transaction Amounts ⚡
**Problem:** When user changes a category, totals don't update immediately
**Impact:** Confusing UX, users don't see the effect of their changes
**Implementation:**
- Update `IncomeExpenseSummary` component to recalculate on category changes
- Update `SpendingDashboard` to recalculate on category changes
- Use React state lifting or context to share transaction updates
- Optimistic UI updates (update before server confirms)

**Estimated Effort:** 2-3 hours
**Files to modify:**
- `components/transaction-list.tsx` (already has optimistic updates)
- `components/income-expense-summary.tsx` (needs refresh trigger)
- `components/spending-dashboard.tsx` (needs refresh trigger)
- `app/dashboard/page.tsx` (coordinate state)

---

### 2. Searchable Transaction Description 🔍
**Problem:** No way to find specific transactions by merchant/description
**Impact:** Hard to find specific purchases, especially with many transactions
**Implementation:**
- Add search input above transaction list
- Filter transactions by description (case-insensitive)
- Show "X av Y transaksjoner" count updates
- Clear search button

**Estimated Effort:** 1-2 hours
**Files to modify:**
- `components/transaction-list.tsx` (add search state and filter)

**UI Placement:**
```
┌─────────────────────────────────────┐
│ [Søk i transaksjoner...] [X]       │
│ [Kategori ▼] [Måned ▼]  15 av 100  │
└─────────────────────────────────────┘
```

---

### 3. Mass Categorization (Bulk Edit) 📦
**Problem:** Manually categorizing similar transactions one-by-one is tedious
**Impact:** Major time-saver, especially after first CSV upload
**Implementation:**
- Checkbox column for multi-select
- "Select all visible" option
- Bulk category assignment dropdown
- Show count of selected transactions
- Confirmation dialog before applying

**Estimated Effort:** 4-5 hours
**Files to modify:**
- `components/transaction-list.tsx` (add selection state)
- `app/api/bulk-categorize/route.ts` (new API endpoint)

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ [✓] Select alle (5 selected)               │
│ Kategoriser valgte: [Velg kategori ▼] [→]  │
└─────────────────────────────────────────────┘
│ [✓] | 15.03.2026 | REMA 1000 | -450.00 kr  │
│ [✓] | 14.03.2026 | REMA 1000 | -320.00 kr  │
│ [ ] | 12.03.2026 | Circle K  | -180.00 kr  │
```

---

### 4. Show All Transactions (Pagination/Infinite Scroll) 📜
**Problem:** Currently limited to 100 transactions
**Impact:** Users can't see their full history
**Implementation Options:**

**Option A: Simple "Load More" Button**
- Fetch in batches of 100
- Append to existing list
- Easiest to implement
- **Recommended for first iteration**

**Option B: Infinite Scroll**
- Auto-load when scrolling near bottom
- Better UX but more complex
- Consider for future

**Option C: Virtual Scrolling**
- Render only visible rows
- Best performance for 1000+ transactions
- Most complex

**Estimated Effort:** 2-3 hours (Option A)
**Files to modify:**
- `components/transaction-list.tsx` (add load more state)
- Consider adding offset/limit to transaction fetch

---

### 5. Filter by Transaction Type (Quick Filters) 🎯
**Problem:** Can't quickly filter by income/expense/uncategorized
**Impact:** Hard to focus on specific transaction types
**Implementation:**
- Pill/chip buttons above transaction list
- "Alle" | "Inntekt" | "Utgift" | "Ukategorisert"
- Active state styling
- Can combine with category and month filters

**Estimated Effort:** 1-2 hours
**Files to modify:**
- `components/transaction-list.tsx` (add type filter state)

**UI Mockup:**
```
┌──────────────────────────────────────────┐
│ [Alle] [Inntekt] [Utgift] [Ukategorisert]│
│                                          │
│ [Kategori ▼] [Måned ▼]                  │
└──────────────────────────────────────────┘
```

---

### 6. Click Category in Dashboard to Filter List 🔗
**Problem:** Can't drill down from spending dashboard to see actual transactions
**Impact:** Missing the connection between summary and details
**Implementation:**
- Make category names in `SpendingDashboard` clickable
- On click, scroll to `TransactionList` and apply category filter
- Highlight the filtered state
- "Clear filter" button to reset

**Estimated Effort:** 2-3 hours
**Files to modify:**
- `components/spending-dashboard.tsx` (add onClick handlers)
- `components/transaction-list.tsx` (accept filter from props)
- `app/dashboard/page.tsx` (coordinate filter state)

**User Flow:**
1. User sees "Mat & Dagligvarer - 8,500 kr" in dashboard
2. Clicks on category name
3. Page scrolls down to transaction list
4. List automatically filters to show only "Mat & Dagligvarer"
5. Shows "Viser 'Mat & Dagligvarer' (32 transaksjoner) [Fjern filter]"

---

### 7. Decision Backup Info (Categorization Rationale) 🧠
**Problem:** Users don't know WHY a transaction was categorized a certain way
**Impact:** Reduces trust in auto-categorization
**Implementation:**
- Show categorization source in tooltip/badge
- Display confidence score
- Show matching rule if applicable
- Help users understand the system

**Estimated Effort:** 2-3 hours
**Files to modify:**
- `components/transaction-list.tsx` (add info icon with tooltip)
- May need to fetch rule info from database

**UI Example:**
```
┌────────────────────────────────────────────┐
│ REMA 1000  |  Mat & Dagligvarer  [ℹ]      │
│                                            │
│ Tooltip on hover:                          │
│ ┌──────────────────────────────────────┐  │
│ │ Auto-kategorisert                    │  │
│ │ Regel: "REMA" → Mat & Dagligvarer    │  │
│ │ Konfidens: 95%                       │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## Implementation Order (Recommendation)

**Phase 1 (Quick Wins - 1 week):**
1. ✅ Searchable description (2h)
2. ✅ Quick filters (Income/Expense/Uncategorized) (2h)
3. ✅ Live update on amounts (3h)
4. ✅ Show all transactions (Load More button) (3h)

**Phase 2 (High Value - 1 week):**
5. ✅ Click category to filter list (3h)
6. ✅ Decision backup info (3h)

**Phase 3 (Power User - 1-2 weeks):**
7. ✅ Mass categorization (5h)

---

## Technical Considerations

### State Management
Current approach uses local component state. For these features, consider:
- **Option A:** Continue with prop drilling (simple, works for MVP+1)
- **Option B:** Use React Context for shared state
- **Option C:** Add Zustand or similar (if state gets complex)

**Recommendation:** Start with Option A, refactor to B if needed.

### Performance
- Current: Fetching 100 transactions works fine
- With "Show All": May need to optimize for 1000+ transactions
- Consider: Virtual scrolling library (react-window) if performance degrades

### Database Queries
- Add indexes if filtering becomes slow
- Current RLS policies should handle all these features
- No schema changes needed!

---

## Testing Checklist

For each feature:
- [ ] Works with empty state (no transactions)
- [ ] Works with 1 transaction
- [ ] Works with 100+ transactions
- [ ] Filters combine correctly (search + category + month + type)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] RLS still working (user isolation)

---

## Breaking These Into Tickets

**T-15: Transaction Search & Quick Filters**
- Searchable description field
- Quick filter pills (All/Income/Expense/Uncategorized)
- Update transaction count display

**T-16: Live Dashboard Updates**
- Coordinate state between transaction list and dashboards
- Real-time recalculation of totals
- Optimistic UI updates

**T-17: Show All Transactions**
- "Load More" button
- Pagination or offset/limit
- Loading state

**T-18: Category Drill-Down**
- Clickable categories in spending dashboard
- Auto-scroll and filter transaction list
- Clear filter UI

**T-19: Categorization Transparency**
- Show why transaction was categorized
- Display confidence score
- Show matching rule

**T-20: Mass Categorization**
- Multi-select checkboxes
- Bulk category assignment
- Confirmation dialog

---

## Questions to Answer

1. **Pagination strategy:** Load More button vs. Infinite scroll vs. "Show 100/500/All" selector?
2. **Mass categorization scope:** Should it create a custom rule for future transactions?
3. **Mobile UX:** How do bulk actions work on mobile? Long-press to select?
4. **Filter persistence:** Should filters persist across page reloads? (localStorage?)

---

**Next Steps:**
1. Review and prioritize with user feedback
2. Create detailed tickets for Phase 1
3. Implement in order of impact vs. effort
4. Test with real users after each phase

