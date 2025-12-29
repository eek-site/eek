# EEK Mechanical - Vercel Deployment Guide

## Overview

This guide will help you deploy the EEK website to Vercel with a **private** GitHub repository.

## Step 1: Create Private GitHub Repository

1. Go to https://github.com/new
2. Repository name: `eek-website` (or your preferred name)
3. **IMPORTANT:** Select **Private**
4. Don't initialize with README (we have existing code)
5. Click "Create repository"

## Step 2: Push Code to GitHub

Open terminal in the `eek` folder and run:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - EEK website with admin panel"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/eek-website.git

# Push to main
git push -u origin main
```

## Step 3: Connect to Vercel

1. Go to https://vercel.com
2. Sign up/login with your GitHub account
3. Click "Add New" → "Project"
4. Import your `eek-website` repository
5. Vercel will auto-detect it's a static site
6. Click "Deploy"

## Step 4: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |

**Note:** The Power Automate URLs are currently hardcoded in the JavaScript files. 
For better security, consider:
1. Creating Vercel serverless functions to proxy these calls
2. Or using Vercel's edge functions

## Step 5: Configure Custom Domain

1. In Vercel project settings → Domains
2. Add `eek.nz` and `www.eek.nz`
3. Update your domain DNS:
   - Add an A record pointing to `76.76.21.21`
   - Or add a CNAME record pointing to `cname.vercel-dns.com`
4. Vercel will auto-provision SSL certificate

## Environment Variables Reference

```
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Power Automate (if moved to serverless functions)
POWER_AUTOMATE_STRIPE_LINK=https://prod-22...
POWER_AUTOMATE_RELEASE_PAYMENT=https://default61ffc...
POWER_AUTOMATE_API_MANAGEMENT=https://prod-50...

# SharePoint (if used)
SHAREPOINT_TENANT=your-tenant
SHAREPOINT_SITE=your-site
```

## Current Sensitive URLs (Hardcoded)

These are currently in `admin/js/config.js` and `admin/api-config.js`:

1. **Stripe Payment Link Flow:**
   ```
   https://prod-22.australiasoutheast.logic.azure.com:443/workflows/e902e35b4e574defb0af836b4259602c/...
   ```

2. **Release Payment Confirmation Flow:**
   ```
   https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4c7d9551c5db4b678a54c799e09a4e0b/...
   ```

3. **API Management Flow:**
   ```
   https://prod-50.australiasoutheast.logic.azure.com:443/workflows/209524261efe4bf584ad77cd745fc58d/...
   ```

## Security Notes

- **Private Repo:** Your code is now private, but...
- **Client-Side URLs:** The Power Automate URLs are still visible in browser dev tools
- **Recommendation:** For maximum security, create serverless API routes in `/api/` folder

## Automatic Deployments

Once connected:
- Every push to `main` → Auto-deploys to production
- Pull requests → Creates preview deployments

## Rollback

If something breaks:
1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Run locally (with env vars from Vercel)
vercel dev
```

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Power Automate: https://make.powerautomate.com

