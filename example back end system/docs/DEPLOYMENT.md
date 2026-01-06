# Deployment Guide

Complete guide for deploying the Eek Mechanical application to production.

## Prerequisites

- Vercel account
- GitHub repository
- Microsoft 365 account (for email/SMS)
- Stripe account (for payments)
- SharePoint access (for file storage)

## Vercel Setup

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)

### 2. Configure Environment Variables

Add all required environment variables in Vercel dashboard:

**Project Settings → Environment Variables**

#### Required Variables

```env
# Vercel KV
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Microsoft Graph API
MS_TENANT_ID=xxx-xxx-xxx-xxx
MS_CLIENT_ID=xxx-xxx-xxx-xxx
MS_CLIENT_SECRET=xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx

# Base URL
NEXT_PUBLIC_BASE_URL=https://www.eek.co.nz
```

#### Optional Variables

```env
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# CarJam
CARJAM_API_KEY=xxx
```

### 3. Enable Vercel Services

#### Vercel KV

1. Go to **Storage** tab in Vercel dashboard
2. Click **Create Database** → **KV**
3. Choose region (closest to your users)
4. Copy connection details to environment variables

#### Vercel Blob

1. Go to **Storage** tab
2. Click **Create Database** → **Blob**
3. Copy access token to `BLOB_READ_WRITE_TOKEN`

### 4. Deploy

1. Push to `main` branch (auto-deploys)
2. Or manually deploy from Vercel dashboard
3. Check deployment logs for errors

## Microsoft 365 Setup

### 1. Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: Eek Mechanical App
   - **Supported account types**: Single tenant
   - **Redirect URI**: Leave blank (not needed)
5. Click **Register**

### 2. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description and expiration
4. **Copy the secret value** (only shown once!)
5. Add to environment variables as `MS_CLIENT_SECRET`

### 3. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Application permissions**
3. Add the following:
   - `Mail.Send` - Send emails
   - `Sites.ReadWrite.All` - Upload to SharePoint
   - `User.Read` - Basic user info
4. Click **Grant admin consent** (requires admin account)

### 4. Get Tenant and Client IDs

1. **Tenant ID**: Found in **Overview** page
2. **Client ID**: Found in **Overview** page (Application ID)
3. Add to environment variables

### 5. Configure From Email

1. Ensure `no-reply@eek.co.nz` email exists in your Microsoft 365 tenant
2. Or update `MS_FROM_EMAIL` in code to use an existing email

## Stripe Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification
3. Get API keys from **Developers** → **API keys**

### 2. Get API Keys

**Test Mode** (for development):
- Publishable key: `pk_test_xxx`
- Secret key: `sk_test_xxx`

**Live Mode** (for production):
- Publishable key: `pk_live_xxx`
- Secret key: `sk_live_xxx`

### 3. Configure Webhooks (Optional)

1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://www.eek.co.nz/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret

## SharePoint Setup

### 1. Get SharePoint Site Details

1. Navigate to your SharePoint site
2. Get site URL: `roadandrescue.sharepoint.com/sites/rar`
3. Note folder paths:
   - DLO Files: `9998 LOGS/BatchFiles`
   - Supplier Invoices: `1000 ACCOUNTING AND LEGAL/Eek Mechanical Ltd/1010 SUPPLIERS/SUPPLIER INVOICE RECORD`

### 2. Verify Permissions

Ensure the Azure AD app has `Sites.ReadWrite.All` permission (configured in Microsoft 365 setup).

### 3. Test Upload

After deployment, test file uploads to verify SharePoint integration works.

## Domain Configuration

### 1. Add Custom Domain

1. Go to Vercel project → **Settings** → **Domains**
2. Add domain: `www.eek.co.nz`
3. Follow DNS configuration instructions
4. Add DNS records:
   - `CNAME www → cname.vercel-dns.com`
   - Or `A record` as instructed

### 2. SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Vercel KV database created and connected
- [ ] Vercel Blob storage created
- [ ] Microsoft Graph API permissions granted
- [ ] Stripe keys configured (live mode)
- [ ] Domain configured and SSL active
- [ ] Test customer booking flow
- [ ] Test supplier portal access
- [ ] Test payment processing
- [ ] Test email/SMS sending
- [ ] Test file uploads (Vercel Blob + SharePoint)
- [ ] Test DLO file generation
- [ ] Verify admin dashboard access

## Monitoring

### Vercel Analytics

1. Enable **Analytics** in Vercel dashboard
2. Monitor:
   - Page views
   - API route performance
   - Error rates

### Logs

1. View logs in Vercel dashboard → **Deployments** → **Functions**
2. Check for:
   - API errors
   - Database connection issues
   - External API failures

### Error Tracking

Consider adding error tracking:
- Sentry
- LogRocket
- Vercel's built-in error tracking

## Rollback

If deployment fails:

1. Go to **Deployments** in Vercel dashboard
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

## CI/CD

### Automatic Deployments

- **Production**: Deploys on push to `main` branch
- **Preview**: Deploys on pull requests

### Manual Deployments

1. Go to Vercel dashboard
2. Click **Deployments** → **Create Deployment**
3. Select branch and deploy

## Performance Optimization

### Image Optimization

- Use Next.js Image component
- Images automatically optimized via Vercel

### Caching

- Static pages cached at edge
- API routes can use `revalidate` for ISR

### Database Optimization

- Use appropriate Redis commands
- Batch operations where possible
- Monitor KV usage in Vercel dashboard

## Security

### Environment Variables

- Never commit `.env.local` to git
- Use Vercel's environment variable encryption
- Rotate secrets regularly

### API Security

- Validate all inputs
- Rate limit API endpoints (consider Vercel Edge Config)
- Use HTTPS only

### Payment Security

- Stripe handles all payment data
- Never store card details
- Use Stripe's secure payment forms

## Backup Strategy

### Database Backups

Vercel KV:
- Automatic backups (check Vercel documentation)
- Consider manual exports for critical data

### File Backups

- Files stored in both Vercel Blob and SharePoint
- SharePoint provides additional backup layer

### Code Backups

- GitHub repository serves as code backup
- Tag releases for easy rollback

## Troubleshooting Deployment

### Build Failures

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies

### Runtime Errors

1. Check function logs
2. Verify environment variables are set
3. Check external API connections

### Database Connection Issues

1. Verify KV credentials
2. Check KV database is active
3. Verify region matches deployment region

## Support

For deployment issues:
1. Check Vercel status page
2. Review Vercel documentation
3. Check application logs
4. Contact Vercel support if needed
