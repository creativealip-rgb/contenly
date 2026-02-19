# Deployment Environment Variables Guide

**Project:** Contently / Camedia  
**Last Updated:** February 19, 2026  
**Target Platform:** Dokploy VPS

---

## Overview

Dokumen ini berisi daftar lengkap environment variables yang diperlukan untuk deployment ke production di VPS Dokploy.

---

## Backend Environment Variables

### ✅ Already Configured (Do Not Change)

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:q3otjr334rlbndxw@contenly-database-qfjn3j:5432/postgres
REDIS_HOST=redis:contenly-dbredis-2i72yu
REDIS_PASSWORD=ls2n7kbxg9dqgbz8
REDIS_PORT=6379
API_URL=https://api.contenly.web.id
FRONTEND_URL=https://contenly.web.id
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-5.2
GOOGLE_CLIENT_ID=69294903405-br21qi1d00laitm0135q91v619jl6egk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
BETTER_AUTH_SECRET=35050aa3e9482c6ac8f05ffb6371d0413cf6e5749ffc070dbf596797856e4b56
```

---

### ❌ Missing - MUST ADD

#### 1. ENCRYPTION_KEY

**Purpose:** Encrypt WordPress app passwords  
**Required for:** WordPress integration

**Generate with:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
```

**Add to Dokploy:**
```
ENCRYPTION_KEY=<paste-generated-key-here>
```

---

### ⚠️ Incorrect - MUST FIX

#### 1. BETTER_AUTH_URL

**Current (WRONG):**
```
BETTER_AUTH_URL=https://api.contenly.web.id/api/auth
```

**Correct (CHANGE TO):**
```
BETTER_AUTH_URL=https://api.contenly.web.id/api/v1/auth
```

**Reason:** Backend global prefix is `api/v1`, not `api`

---

## Frontend Environment Variables

### ❌ Missing - MUST ADD

#### 1. NEXT_PUBLIC_API_URL

**Purpose:** Tell frontend where backend API is located  
**Required for:** All API calls from browser

**Add to Dokploy:**
```
NEXT_PUBLIC_API_URL=https://api.contenly.web.id/api/v1
```

**Note:** This is for the **frontend container**, not backend!

---

## Complete Configuration Checklist

### Backend Container

- [x] `NODE_ENV=production`
- [x] `PORT=3001`
- [x] `DATABASE_URL`
- [x] `REDIS_HOST`, `REDIS_PASSWORD`, `REDIS_PORT`
- [x] `API_URL=https://api.contenly.web.id`
- [x] `FRONTEND_URL=https://contenly.web.id`
- [x] `OPENROUTER_API_KEY`
- [x] `OPENROUTER_MODEL=openai/gpt-5.2`
- [x] `GOOGLE_CLIENT_ID`
- [x] `GOOGLE_CLIENT_SECRET`
- [x] `BETTER_AUTH_SECRET`
- [ ] `ENCRYPTION_KEY` ← **ADD THIS**
- [ ] `BETTER_AUTH_URL=https://api.contenly.web.id/api/v1/auth` ← **FIX THIS**

### Frontend Container

- [ ] `NEXT_PUBLIC_API_URL=https://api.contenly.web.id/api/v1` ← **ADD THIS**

---

## Step-by-Step Deployment Instructions

### Step 1: Generate ENCRYPTION_KEY

Run this command in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 characters hex string).

---

### Step 2: Update Backend Environment Variables in Dokploy

1. Go to **Dokploy Dashboard**
2. Select **Backend Container**
3. Go to **Environment Variables** tab
4. Add/Update:

```bash
ENCRYPTION_KEY=<paste-generated-key-from-step-1>
BETTER_AUTH_URL=https://api.contenly.web.id/api/v1/auth
```

5. Click **Save**

---

### Step 3: Add Frontend Environment Variables in Dokploy

1. Go to **Dokploy Dashboard**
2. Select **Frontend Container**
3. Go to **Environment Variables** tab
4. Add:

```bash
NEXT_PUBLIC_API_URL=https://api.contenly.web.id/api/v1
```

5. Click **Save**

---

### Step 4: Restart Containers

1. Restart **Backend Container**
2. Restart **Frontend Container**
3. Wait for containers to be healthy

---

### Step 5: Verify Deployment

1. **Check Backend Health:**
   - Visit: `https://api.contenly.web.id/api/v1/docs`
   - Should show Swagger API documentation

2. **Check Frontend:**
   - Visit: `https://contenly.web.id`
   - Should load login page

3. **Test Login:**
   - Try login with Google
   - Should redirect to dashboard

---

## Optional Environment Variables

These are optional but recommended for production:

### Email Service (Resend)

```bash
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@contenly.web.id
```

### Stripe Billing

```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Troubleshooting

### Error: "Cannot POST /api/v1/..."

**Cause:** Backend not starting or global prefix mismatch

**Solution:**
1. Check backend logs in Dokploy
2. Verify `DATABASE_URL` is correct
3. Verify `ENCRYPTION_KEY` is set

---

### Error: "CORS error"

**Cause:** Frontend domain not allowed in backend

**Solution:**
1. Verify `FRONTEND_URL=https://contenly.web.id` in backend
2. Check backend CORS configuration

---

### Error: "WordPress connection failed"

**Cause:** `ENCRYPTION_KEY` not set or wrong

**Solution:**
1. Generate new `ENCRYPTION_KEY`
2. Update in Dokploy
3. Re-add WordPress site (old encrypted passwords won't work)

---

### Error: "Authentication failed"

**Cause:** `BETTER_AUTH_URL` incorrect

**Solution:**
1. Update to: `BETTER_AUTH_URL=https://api.contenly.web.id/api/v1/auth`
2. Restart backend

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit** `.env` files to git
2. **Rotate keys** regularly (every 90 days recommended)
3. **Use strong passwords** for database and services
4. **Enable HTTPS** on all domains
5. **Restrict database access** to backend only

---

## Support

If issues persist after following this guide:

1. Check container logs in Dokploy
2. Verify all environment variables are set correctly
3. Ensure database migrations ran successfully
4. Check network connectivity between containers

---

*Generated: February 19, 2026*
