# Deployment Guide - Financial Clarity Engine

**T-14: Deploy to Vercel & Smoke Test**
**Date:** March 31, 2026
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Prerequisites Completed

- [x] All MVP features implemented (T-01 through T-13)
- [x] Security audit passed (SECURITY_AUDIT.md)
- [x] RLS policies enabled and tested
- [x] TypeScript compilation successful
- [x] No console errors in development
- [x] All required environment variables documented

### 🚀 Ready to Deploy

- [ ] Production environment variables set in Vercel
- [ ] OAuth redirect URLs updated for production domain
- [ ] Database migrations run in Supabase production
- [ ] Smoke tests passed
- [ ] Production URL verified end-to-end

---

## Environment Variables

### Required in Vercel

Create these in Vercel Project Settings → Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# These should already be set from T-02 Google OAuth setup
```

### How to Get Values

1. **Supabase URL and Keys:**
   - Go to Supabase Dashboard
   - Select your project
   - Navigate to Project Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Verify `.env.local` (Development Only):**
   ```bash
   # .env.local should contain the same values for local development
   # DO NOT commit this file to git
   ```

---

## Deployment Steps

### Step 1: Connect to Vercel

**If not already connected:**

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

**If project already exists on Vercel:**
- Push to GitHub main branch (already configured)
- Vercel will auto-deploy

### Step 2: Configure Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project
2. Navigate to Settings → Environment Variables
3. Add each environment variable:
   - Variable name
   - Value
   - Select environments: Production, Preview, Development
4. Save each variable

### Step 3: Update Google OAuth Redirect URLs

**CRITICAL: Must be done before first production login**

1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Select your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-production-domain.vercel.app/auth/callback
   ```
5. Save changes

### Step 4: Deploy to Production

**Manual Deploy (if needed):**

```bash
# Deploy to production
vercel --prod
```

**Automatic Deploy (recommended):**

```bash
# Push to main branch
git push origin main

# Vercel will automatically deploy
# Check deployment status at: https://vercel.com/dashboard
```

### Step 5: Verify Deployment

Wait for deployment to complete (usually 1-2 minutes)

Check deployment log in Vercel dashboard for any errors.

---

## Smoke Test Procedures

### Test 1: Homepage Load

```
URL: https://your-domain.vercel.app/
Expected: Homepage loads with login button
Status: [ ]
```

### Test 2: Google OAuth Login

```
Action: Click "Sign in with Google"
Expected:
  - Redirects to Google OAuth consent screen
  - After approval, redirects to /dashboard
  - User sees dashboard with their email
Status: [ ]
```

### Test 3: CSV Upload

```
Action: Upload a CSV file from dashboard
Expected:
  - File upload successful
  - Column mapper appears
  - Can map columns
  - Transactions imported
Status: [ ]
```

### Test 4: Category Correction

```
Action: Click on a transaction category
Expected:
  - Dropdown appears with categories
  - Can change category
  - Undo snackbar appears
  - Change persists on page reload
Status: [ ]
```

### Test 5: Spending Dashboard

```
Action: View spending dashboard section
Expected:
  - Total spending card shows correctly
  - Categories ranked by amount
  - Progress bars render
  - Month selector works
Status: [ ]
```

### Test 6: Income/Expense Summary

```
Action: View income vs expense summary
Expected:
  - Income card shows green
  - Expenses card shows red
  - Net savings calculated correctly
  - Savings rate shows percentage
Status: [ ]
```

### Test 7: Transaction List

```
Action: View transaction list
Expected:
  - Transactions grouped by month
  - Filters work (category and month)
  - Uncategorized transactions highlighted
Status: [ ]
```

### Test 8: RLS Security (Critical)

```
Action: Create second user account, login
Expected:
  - New user sees NO transactions from first user
  - Each user only sees their own data
Status: [ ]
```

### Test 9: Sign Out

```
Action: Click sign out button
Expected:
  - Redirects to login page
  - Cannot access /dashboard (redirects to /login)
Status: [ ]
```

### Test 10: Mobile Responsive

```
Action: View on mobile device or resize browser
Expected:
  - Layout adapts responsively
  - All features accessible on mobile
Status: [ ]
```

---

## Post-Deployment Verification

### Database Check

Run these queries in Supabase SQL Editor to verify production state:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('transactions', 'categories', 'categorization_rules');
-- Expected: All should show rowsecurity = true

-- Check system categories are seeded
SELECT COUNT(*) FROM categories WHERE is_system = true;
-- Expected: 100+ categories

-- Check system rules are seeded
SELECT COUNT(*) FROM categorization_rules WHERE is_system = true;
-- Expected: 80+ rules
```

### Performance Check

- [ ] Page load time < 3 seconds
- [ ] Time to Interactive (TTI) < 5 seconds
- [ ] No console errors in browser
- [ ] No build errors in Vercel logs

### Security Check

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] RLS policies active (verified in smoke test 8)
- [ ] No secrets exposed in client-side code
- [ ] OAuth redirects configured correctly

---

## Rollback Procedure

**If smoke tests fail:**

1. Identify the issue in Vercel deployment logs
2. Fix the issue in code
3. Commit and push fix
4. Vercel auto-deploys the fix

**For critical issues:**

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. This instantly rolls back to previous version

---

## Domain Configuration (Optional)

**To use custom domain:**

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., finansklarhet.no)
3. Configure DNS records as instructed by Vercel
4. Wait for DNS propagation (up to 48 hours)
5. Update Google OAuth redirect URLs with custom domain
6. Re-run smoke tests with custom domain

---

## Monitoring & Alerts

### Vercel Analytics

- Automatically enabled for all deployments
- View at: Vercel Dashboard → Your Project → Analytics

### Supabase Dashboard

- Monitor database queries at: Supabase → Database → Query Performance
- Check API usage at: Supabase → Settings → Usage

### Error Tracking (Future)

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

---

## Common Issues & Solutions

### Issue: "Invalid Redirect URI" Error

**Cause:** OAuth redirect URL not configured in Google Cloud Console

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Add production URL to Authorized redirect URIs
3. Save and wait 5 minutes for Google to propagate changes

### Issue: "Failed to Fetch" on API Calls

**Cause:** Environment variables not set in Vercel

**Solution:**
1. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel
2. Redeploy if variables were just added

### Issue: "Row Level Security" Error

**Cause:** RLS policies not applied in production database

**Solution:**
1. Run all migrations in Supabase SQL Editor (production)
2. Verify RLS is enabled: Check with query in Post-Deployment Verification section

### Issue: Transactions Not Showing

**Cause:** Different Supabase project for dev vs prod

**Solution:**
1. Ensure NEXT_PUBLIC_SUPABASE_URL points to production project
2. Run migrations in production database
3. Seed categories and rules in production

---

## Success Criteria

### T-14 is COMPLETE when:

- [x] Application deployed to Vercel
- [ ] Production URL is accessible
- [ ] All smoke tests pass (1-10)
- [ ] RLS cross-user test passes
- [ ] No console errors
- [ ] Google OAuth works in production
- [ ] CSV upload and categorization works
- [ ] Performance is acceptable (< 3s page load)

### MVP is SHIPPED when:

T-14 is complete + User acceptance:

**Definition of Done (from MVP Tracker):**
> A real person can visit the deployed URL, sign in with Google, upload a CSV or PDF bank statement from a Norwegian bank, see their transactions automatically categorized, correct any wrong categories in two taps, and view a visual summary of where their money went that month.

(Note: PDF parsing is optional/deprioritized, so CSV is sufficient for MVP)

---

## Next Steps After Deployment

1. **User Testing:** Share URL with beta testers
2. **Feedback Collection:** Create feedback form
3. **Bug Fixes:** Address any issues reported by users
4. **Phase 2 Planning:** Review PREMIUM_FEATURES.md for next features

**Congratulations!** 🎉

The MVP is deployed and ready for real users!
