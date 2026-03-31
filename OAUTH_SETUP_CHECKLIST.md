# OAuth Redirect URLs - Setup Checklist

**Date:** March 31, 2026
**Production URL:** https://ucuncupersonalfinanceapp.vercel.app

---

## ✅ Current Status

- ✅ Environment variables configured in Vercel
- ✅ Supabase connection working in production
- ⏳ OAuth redirect URLs need verification/update

---

## Google OAuth Configuration

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project (Financial Clarity Engine or similar)
3. Navigate to: **APIs & Services → Credentials**

### Step 2: Update OAuth 2.0 Client ID

Find your OAuth 2.0 Client ID and add these redirect URIs:

#### Required Redirect URIs:

```
# Production Vercel URL
https://ucuncupersonalfinanceapp.vercel.app/auth/callback

# Supabase Auth Callback
https://weivmnsonkkocnsovnjw.supabase.co/auth/v1/callback

# Localhost (for development - should already be there)
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### Step 3: Verify in Google Cloud Console

After adding the URIs:
- Click **Save**
- Wait 5 minutes for Google to propagate changes
- Verify no typos in the URLs

---

## Supabase OAuth Configuration

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/weivmnsonkkocnsovnjw
2. Navigate to: **Authentication → URL Configuration**

### Step 2: Update Site URL

Set the Site URL to production:
```
https://ucuncupersonalfinanceapp.vercel.app
```

### Step 3: Add Redirect URLs

In **Redirect URLs** section, add:
```
https://ucuncupersonalfinanceapp.vercel.app/**
http://localhost:3000/**
http://localhost:3001/**
```

---

## Testing Checklist

After configuration:

### Test 1: Production OAuth Flow
- [ ] Visit: https://ucuncupersonalfinanceapp.vercel.app/login
- [ ] Click "Sign in with Google"
- [ ] Complete Google consent screen
- [ ] Verify redirect to /dashboard
- [ ] Check no "redirect_uri_mismatch" error

### Test 2: Development OAuth Flow (verify still works)
- [ ] Visit: http://localhost:3000/login
- [ ] Click "Sign in with Google"
- [ ] Verify redirect works locally

---

## Common Issues

### Issue: "redirect_uri_mismatch" Error

**Cause:** Redirect URI not added to Google OAuth configuration

**Solution:**
1. Check the error message for the actual redirect URI being used
2. Add that exact URI to Google Cloud Console
3. Wait 5 minutes
4. Try again

### Issue: "Invalid redirect URL"

**Cause:** URL not whitelisted in Supabase

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Add production URL to Redirect URLs
3. Save and try again

---

## Verification Commands

```bash
# Test production homepage
curl -I https://ucuncupersonalfinanceapp.vercel.app/

# Test login page loads
curl -I https://ucuncupersonalfinanceapp.vercel.app/login

# Check Supabase connection
curl https://ucuncupersonalfinanceapp.vercel.app/test-connection
```

---

## Next Steps After OAuth Configuration

1. Run Smoke Test 2 (Google OAuth Login)
2. Run Smoke Test 3 (CSV Upload)
3. Run Smoke Test 8 (RLS Security - create 2nd user)
4. Complete all 10 smoke tests
5. Proceed with Phase 1 post-MVP features

---

**Status:** ⏳ Awaiting OAuth redirect URL configuration

