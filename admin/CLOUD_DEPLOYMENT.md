# Road and Rescue - Cloud Deployment Guide

## Overview

This guide walks you through deploying the complete Road and Rescue admin system to the cloud using:
- **Supabase** - Free PostgreSQL database + authentication
- **Vercel** (or Netlify) - Free static site hosting
- **Existing Power Automate flows** - For Stripe and Excel integration

## Prerequisites

1. A GitHub account (free)
2. Your existing Power Automate flow URLs (already in the code)
3. About 15 minutes

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in with GitHub
3. Click "New Project"
4. Fill in:
   - **Name**: `road-and-rescue`
   - **Database Password**: (save this somewhere safe)
   - **Region**: Sydney (or nearest to you)
5. Click "Create new project"
6. Wait for setup to complete (~2 minutes)

### 1.2 Run Database Schema

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `admin/db/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or Ctrl+Enter)
6. You should see "Success. No rows returned" (that's normal)

### 1.3 Get Your API Keys

1. Click **Settings** (gear icon) in left sidebar
2. Click **API**
3. Copy these values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon public** key (under Project API keys)

## Step 2: Configure the Admin Panel

### 2.1 Update Configuration

1. Open `admin/js/config.js`
2. Replace the placeholder values:

```javascript
const APP_CONFIG = {
    SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',  // Your Supabase URL
    SUPABASE_ANON_KEY: 'eyJhbGciOiJS...',  // Your anon key
    
    dataSource: 'supabase',  // Change from 'manual' to 'supabase'
    
    // ... rest of config
};
```

### 2.2 Test Locally (Optional)

1. Open `admin/index.html` in a browser
2. Try creating a test job in Intake
3. Check Supabase dashboard - you should see the data in Tables

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

1. Create a new GitHub repository
2. Upload the entire `admin` folder
3. Or use Git:
   ```bash
   cd admin
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/road-and-rescue-admin.git
   git push -u origin main
   ```

### 3.2 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"
6. Wait for deployment (~1 minute)
7. You'll get a URL like `road-and-rescue-admin.vercel.app`

### 3.3 Add Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Click "Domains"
3. Add your domain (e.g., `admin.eek.nz`)
4. Follow DNS configuration instructions

## Step 4: Set Up Authentication (Optional)

### 4.1 Enable Email Auth in Supabase

1. In Supabase, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure settings:
   - Enable email confirmations (optional)
   - Set redirect URLs

### 4.2 Create Staff Users

1. Go to **Authentication** > **Users**
2. Click "Add user"
3. Enter staff email and password
4. Or let them sign up via the login page

## Step 5: Migrate Data from Excel

### 5.1 Export Excel Data

1. Open your Excel workbook
2. For each sheet (Book a Job, Job Build Notes), save as CSV

### 5.2 Import to Supabase

1. In Supabase, go to **Table Editor**
2. Select the table (e.g., `jobs`)
3. Click "Insert" > "Import data from CSV"
4. Upload your CSV
5. Map columns to database fields
6. Click "Import"

### 5.3 Alternative: Use VBA Export

Run this in Excel VBA to export directly to Supabase:

```vba
' Note: This would require additional VBA code to call Supabase API
' Contact your developer for this functionality
```

## Configuration Reference

### Power Automate URLs (Already Configured)

These are already in `config.js`:

```javascript
flows: {
    // Stripe Payment Link - creates Stripe checkout
    stripePaymentLink: "https://prod-22.australiasoutheast.logic.azure.com/...",
    
    // Release Payment Confirmation - updates Excel
    releasePaymentConfirmation: "https://default61ffc6bcd9ce458b8120d32187c377.0d...",
    
    // API Management
    apiManagement: "https://prod-50.australiasoutheast.logic.azure.com/..."
}
```

### Data Source Modes

In `config.js`:

```javascript
dataSource: 'manual',    // Prompts user for all data (testing)
dataSource: 'supabase',  // Uses Supabase database (production)
dataSource: 'demo',      // Uses demo data (demos)
```

## Troubleshooting

### "Supabase not initialized"

- Check that SUPABASE_URL and SUPABASE_ANON_KEY are correct in config.js
- Make sure the Supabase script is loaded before supabase.js

### "CORS error"

- Add your domain to Supabase allowed origins:
  - Go to **Settings** > **API** > **Additional CORS settings**
  - Add your Vercel URL

### "Power Automate flow not working"

- Flows are the same as VBA uses - check they're still active
- Check browser console for error details

### Data not appearing

- Set `dataSource: 'supabase'` in config.js
- Check browser console for Supabase errors
- Verify data exists in Supabase Tables view

## Backup and Recovery

### Automatic Backups

Supabase automatically backs up your database daily.

### Manual Export

1. In Supabase, go to **Settings** > **Database**
2. Click "Download backup"

### Restore from Backup

1. Contact Supabase support, or
2. Import CSV files manually

## Security Notes

1. **Never commit real API keys to public GitHub**
   - Use environment variables on Vercel
   - Or use a private repository

2. **Enable Row Level Security**
   - Already configured in schema.sql
   - Requires authentication for write operations

3. **Regular backups**
   - Export data periodically
   - Keep restore points as before

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Report issues to your developer

## Next Steps

1. ✅ Deploy to cloud
2. ✅ Import existing data
3. ✅ Create staff accounts
4. ⬜ Configure custom domain
5. ⬜ Set up email notifications (Supabase Edge Functions)
6. ⬜ Add more automation (Supabase Functions + Webhooks)

