# Eek Mechanical | Get Going

A comprehensive towing service management platform built with Next.js, providing customer booking, supplier management, payment processing, and automated workflows.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Flows](#user-flows)
- [File Storage](#file-storage)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Eek Mechanical is a full-stack web application that manages the complete lifecycle of towing jobs:

- **Customer Portal**: Book services, make payments, track jobs, and communicate
- **Supplier Portal**: Accept jobs, submit invoices, manage payment details, complete jobs
- **Admin Dashboard**: Manage jobs, approve payments, generate DLO files, communicate with all parties

The system automates workflows including job completion, invoice generation, payment processing, and file management.

## Tech Stack

### Frontend
- **Next.js 14.2.28** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Stripe** - Payment processing

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Vercel KV** - Redis-compatible key-value database
- **Microsoft Graph API** - Email and SMS sending
- **Vercel Blob** - File storage
- **SharePoint** - Additional file storage (DLO files, invoices)

### Services
- **Stripe** - Payment processing
- **Microsoft 365** - Email/SMS via Graph API
- **TNZ Gateway** - SMS delivery
- **CarJam API** - Vehicle information lookup
- **Google Maps** - Route planning for suppliers

## Architecture

### Data Storage (Vercel KV)

All data is stored in Vercel KV (Redis-compatible) using the following key patterns:

```
job:{bookingId}              - Job records (primary storage)
jobs:list                    - List of all job bookingIds
supplier:{name}              - Supplier records
supplier:portal:{code}       - Portal code → supplier name mapping
messages:{bookingId}         - Message threads per job
supplier-job:{ref}           - Supplier job acceptance links
supplier-link:{code}         - Auto-generated supplier links
```

### Key Design Decisions

1. **Booking ID as Primary Key**: All jobs and messages use `bookingId` (e.g., `HT-MJXMYLNY-EV84`) instead of `rego` to avoid conflicts with multiple jobs for the same vehicle.

2. **Supplier Portal Codes**: Each supplier gets a unique 12-character portal code for accessing all their jobs.

3. **Message Threading**: Messages are stored per `bookingId` to ensure unique threads per job.

4. **Dual File Storage**: Files are saved to both Vercel Blob (fast access) and SharePoint (backup/sync).

## Features

### Customer Features

- **Service Booking**: Book towing services with vehicle details
- **Payment Processing**: Secure Stripe payment integration
- **Job Tracking**: Real-time job status updates
- **Communication**: Chat-style messaging with Eek Mechanical
- **Invoice Access**: View and print invoices
- **Vehicle Confirmation**: CarJam integration for vehicle details

### Supplier Features

- **Job Management**: View all open jobs in one portal
- **Job Acceptance**: Accept/decline jobs with one click
- **Route Planning**: Google Maps integration with 3-point routes (Supplier → Pickup → Drop-off)
- **Invoice Submission**: Upload invoices or provide Xero links
- **Payment Details**: Manage bank account information
- **Job Completion**: Mark jobs as complete, triggering automated workflows

### Admin Features

- **Job Management**: View, filter, and manage all jobs
- **Supplier Assignment**: Assign suppliers to jobs with pricing
- **Payment Approval**: Approve supplier payments with editable amounts
- **DLO Generation**: Generate batch payment files for ANZ bank
- **Communication**: Unified messaging interface for customers and suppliers
- **Billing**: Manage customer and supplier invoicing
- **Additional Charges**: Add manual charges to jobs

### Automated Workflows

1. **Job Completion**: When supplier completes a job:
   - Job status updated to `completed`
   - Customer invoice email sent automatically
   - Buyer-created invoice sent to supplier (if no invoice submitted)
   - Eek Mechanical notified

2. **Payment Approval**: When admin approves payment:
   - Supplier receives payment confirmation email
   - Payment details saved for DLO generation
   - Job marked as approved

3. **Invoice Auto-Send**: When job completes without supplier invoice:
   - Buyer-created invoice automatically emailed to supplier
   - Includes links to view online and upload own invoice

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for KV, Blob, deployment)
- Microsoft 365 account (for email/SMS)
- Stripe account (for payments)
- SharePoint access (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hook-towing

# Install dependencies
npm install

# Set up environment variables (see Environment Variables section)
cp .env.example .env.local

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file with the following variables:

### Required

```env
# Vercel KV (Redis)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Microsoft Graph API (Email/SMS)
MS_TENANT_ID=your_azure_tenant_id
MS_CLIENT_ID=your_azure_app_client_id
MS_CLIENT_SECRET=your_azure_app_client_secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Base URL
NEXT_PUBLIC_BASE_URL=https://www.eek.co.nz
```

### Optional

```env
# Google Maps (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# CarJam API
CARJAM_API_KEY=your_carjam_key
```

### Microsoft Graph API Setup

1. Register an app in Azure AD
2. Grant the following API permissions:
   - `Mail.Send` - Send emails
   - `Sites.ReadWrite.All` - Upload files to SharePoint
   - `User.Read` - Basic user info
3. Create a client secret
4. Add credentials to environment variables

## Database Schema

### Job Record (`job:{bookingId}`)

```typescript
{
  bookingId: string              // Primary key (e.g., "HT-MJXMYLNY-EV84")
  rego: string                   // Vehicle registration
  customerName: string
  customerPhone: string
  customerEmail: string
  pickupLocation: string
  dropoffLocation?: string
  price: number                  // Customer price (cents)
  supplierPrice?: number         // Supplier payment amount (cents)
  supplierName?: string
  supplierEmail?: string
  supplierPhone?: string
  supplierAddress?: string
  status: string                 // pending|booked|assigned|in_progress|completed|cancelled
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  transactionId?: string         // Stripe payment ID
  supplierInvoiceRef?: string
  supplierInvoiceAmount?: number
  supplierInvoiceSubmittedAt?: string
  supplierPaymentApproved?: boolean
  supplierApprovedAmount?: number
  supplierPaidAt?: string
  buyerInvoiceRef?: string       // Buyer-created invoice number
  buyerInvoiceSentAt?: string
  createdAt: string
  updatedAt: string
  history: Array<{
    action: string
    timestamp: string
    by?: string
    data?: Record<string, unknown>
  }>
}
```

### Supplier Record (`supplier:{name}`)

```typescript
{
  name: string                   // Primary key
  legalName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postcode?: string
  bankName?: string
  bankAccount?: string           // Format: XX-XXXX-XXXXXXX-XX
  bankAccountName?: string
  gstNumber?: string
  portalCode: string             // Unique 12-char code
  coords?: { lat: number; lng: number }
  createdAt: string
  updatedAt: string
  jobCount: number
  totalPaid: number              // Total paid in cents
}
```

### Message Record (`messages:{bookingId}`)

Messages are stored as a list (Redis list) with each message as:

```typescript
{
  from: string                   // 'customer' | 'supplier' | 'hook_towing_to_customer' | 'hook_towing_to_supplier'
  message: string
  timestamp: string               // ISO 8601
}
```

## API Endpoints

### Customer APIs

#### `POST /api/book-service`
Create a new booking request.

**Request:**
```json
{
  "rego": "ABC123",
  "pickupLocation": "123 Main St, Auckland",
  "dropoffLocation": "456 Queen St, Auckland",
  "customerName": "John Doe",
  "customerPhone": "0212345678",
  "customerEmail": "john@example.com",
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "vehicleColor": "Blue"
}
```

#### `POST /api/confirm-booking`
Confirm booking after payment. Creates job record and sends notifications.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "transactionId": "pi_xxx",
  "rego": "ABC123",
  // ... other job data
}
```

#### `GET /api/booking/[id]`
Get booking/job details by booking ID.

#### `POST /api/customer-message`
Send a message from customer to Eek Mechanical.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "message": "When will the tow truck arrive?"
}
```

#### `GET /api/messages/[bookingId]`
Get all messages for a job.

### Supplier APIs

#### `GET /api/supplier-portal/[code]`
Get supplier portal data with all their jobs.

**Response:**
```json
{
  "success": true,
  "supplier": { /* supplier record */ },
  "openJobs": [ /* array of job records */ ],
  "closedJobs": [ /* array of job records */ ]
}
```

#### `POST /api/supplier-portal/[code]`
Send a message from supplier to Eek Mechanical.

#### `PUT /api/supplier-portal/[code]`
Submit supplier invoice.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "invoiceRef": "INV-001234",
  "invoiceAmount": 10000,  // cents
  "xeroLink": "https://...",
  "invoiceFileUrl": "https://..."  // if file uploaded
}
```

#### `PATCH /api/supplier-portal/[code]`
Update supplier profile (bank details, etc.).

#### `GET /api/supplier-job/[ref]`
Get supplier job acceptance link data.

#### `PUT /api/supplier-job/[ref]`
Accept or decline a job.

**Request:**
```json
{
  "status": "accepted"  // or "declined"
}
```

#### `POST /api/supplier-message`
Send message from supplier (alternative endpoint).

### Admin APIs

#### `GET /api/admin/generate-dlo?preview=true`
Generate DLO file for pending supplier payments.

**Query Params:**
- `preview=true` - Return payment list without generating file
- `all=true` - Include all unpaid jobs, not just completed

**Response:**
- Returns DLO file as download
- Headers include upload status: `X-Blob-Upload-Success`, `X-SharePoint-Upload-Success`

#### `POST /api/admin/generate-dlo`
Mark payments as processed.

**Request:**
```json
{
  "jobIds": ["HT-XXX", "HT-YYY"]
}
```

#### `POST /api/admin/approve-payment`
Approve supplier payment.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "approvedAmount": 10000  // cents
}
```

#### `GET /api/admin/payment-status/[bookingId]`
Get payment approval status for a job.

#### `POST /api/additional-charge`
Add manual additional charge to a job.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "amount": 5000,  // cents
  "reason": "Location change",
  "sendPaymentLink": true
}
```

### Job Management APIs

#### `GET /api/jobs/[rego]`
Get job by rego or bookingId (with fallback lookup).

#### `PUT /api/jobs/[rego]`
Update job status/data.

**Request:**
```json
{
  "status": "completed",
  "completedAt": "2026-01-05T10:00:00Z",
  "_updatedBy": "supplier:Company Name"
}
```

#### `POST /api/jobs/assign-supplier`
Assign supplier to a job.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "supplierName": "Eek Mechanical",
  "supplierPrice": 10000,  // cents
  "supplierEmail": "supplier@example.com",
  "supplierPhone": "0212345678"
}
```

### Invoice APIs

#### `POST /api/send-customer-invoice`
Send customer invoice email (paid receipt).

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84"
}
```

#### `POST /api/send-supplier-invoice`
Send buyer-created invoice to supplier.

**Request:**
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123"
}
```

### File Upload APIs

#### `POST /api/upload-invoice`
Upload supplier invoice file.

**Request:** FormData
- `file`: File object (PDF, PNG, JPG, max 10MB)
- `bookingId`: Job booking ID
- `rego`: Vehicle registration
- `supplierName`: Supplier name
- `amount`: Invoice amount

**Response:**
```json
{
  "success": true,
  "url": "https://...",  // Vercel Blob URL
  "blobUrl": "https://...",
  "sharePointUrl": "https://...",
  "filename": "2026-01-04_ABC123_Supplier_$100.00.pdf"
}
```

### Utility APIs

#### `GET /api/carjam?plate=ABC123`
Lookup vehicle details from CarJam API.

#### `POST /api/send-booking-link`
Send booking link to customer via email/SMS.

#### `POST /api/send-supplier-link`
Send job notification to supplier via email/SMS.

## User Flows

### Customer Booking Flow

1. Customer visits homepage and clicks "Book Now"
2. Enters vehicle details and locations
3. Gets quote and proceeds to payment
4. On payment page, confirms vehicle details (CarJam lookup)
5. Completes Stripe payment
6. Redirected to customer portal with confirmation
7. Receives email/SMS with booking link
8. Can track job, message Eek Mechanical, view invoice

### Supplier Job Flow

1. Admin assigns supplier to job
2. Supplier receives SMS/email with job details and acceptance link
3. Supplier clicks link → redirected to portal with job pre-selected
4. Supplier accepts job → status changes to `in_progress`
5. Supplier completes job → clicks "Job Completed" button
6. System automatically:
   - Updates job status to `completed`
   - Sends customer invoice
   - Sends buyer-created invoice to supplier (if no invoice submitted)
7. Supplier can later upload invoice if needed

### Payment Flow

1. Supplier submits invoice (optional)
2. Admin reviews job in billing area
3. Admin approves payment amount (editable)
4. Supplier receives payment confirmation email
5. Admin generates DLO file for batch payment
6. DLO file saved to Vercel Blob and SharePoint
7. Admin processes payment via ANZ bank
8. Admin marks payments as processed

### Communication Flow

- **Customer ↔ Eek Mechanical**: Direct messaging in customer portal
- **Supplier ↔ Eek Mechanical**: Direct messaging in supplier portal
- **Customer ↔ Supplier**: Not direct; Eek Mechanical forwards messages with notes
- All messages stored per `bookingId` for unique threads

## File Storage

### Vercel Blob

- **Invoice Files**: `invoices/{filename}`
- **DLO Files**: `dlo-files/{filename}`
- Public access URLs for direct viewing/downloading

### SharePoint

Files are also saved to SharePoint for backup and internal access:

- **DLO Files**: `9998 LOGS/BatchFiles/{REGO}_{SupplierName}.DLO`
- **Supplier Invoices**: `1000 ACCOUNTING AND LEGAL/Eek Mechanical Ltd/1010 SUPPLIERS/SUPPLIER INVOICE RECORD/{DATE}_{REGO}_{SupplierName}_${Amount}.pdf`

### File Naming Conventions

- **DLO Files**: `{REGO}_{SupplierName}.DLO` (e.g., `NGK943_PitstopPar.DLO`)
- **Supplier Invoices**: `{DATE}_{REGO}_{SupplierName}_${Amount}.{ext}` (e.g., `2026-01-04_NGK943_PitstopPar_$100.00.pdf`)

## Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main` branch

### Required Vercel Services

- **Vercel KV**: Redis database
- **Vercel Blob**: File storage
- **Edge Functions**: For API routes

### Environment Setup

Ensure all environment variables are set in Vercel dashboard:
- KV credentials
- Blob token
- Microsoft Graph credentials
- Stripe keys
- Base URL

## Troubleshooting

### Common Issues

#### Messages Not Persisting

**Problem**: Messages disappear after refresh.

**Solution**: 
- Ensure messages are saved under `messages:{bookingId}` (not `messages:{rego}`)
- Check that `bookingId` is used consistently throughout the system
- Verify Vercel KV connection

#### Supplier Portal Not Loading

**Problem**: Supplier portal shows "Invalid portal code".

**Solution**:
- Verify `supplier:portal:{code}` mapping exists in KV
- Check supplier record has `portalCode` field
- Ensure portal code matches exactly (case-sensitive)

#### DLO File Not Generating

**Problem**: DLO generation fails or returns empty.

**Solution**:
- Verify jobs have `supplierPaymentApproved: true`
- Check supplier has `bankAccount` set
- Ensure `supplierApprovedAmount` or `supplierPrice` is set
- Check SharePoint credentials if upload fails

#### Email Not Sending

**Problem**: Emails not received.

**Solution**:
- Verify Microsoft Graph API credentials
- Check `MS_FROM_EMAIL` is correct
- Ensure API permissions are granted in Azure AD
- Check email isn't in spam folder
- Review console logs for Graph API errors

#### Payment Page Errors

**Problem**: Payment fails or redirects incorrectly.

**Solution**:
- Verify Stripe keys are correct
- Check `NEXT_PUBLIC_BASE_URL` is set correctly
- Ensure booking is not already paid (check `transactionId`)
- Verify CarJam API key if vehicle lookup fails

### Debug Endpoints

#### `GET /api/debug/messages?bookingId=HT-XXX`
Debug message storage for a specific job.

**Response:**
```json
{
  "bookingId": "HT-XXX",
  "rawCount": 5,
  "parsedCount": 5,
  "messages": [ /* array of messages */ ]
}
```

## Code Structure

```
app/
├── api/                    # API routes
│   ├── admin/             # Admin endpoints
│   ├── booking/           # Booking endpoints
│   ├── jobs/              # Job management
│   ├── messages/          # Message endpoints
│   ├── supplier-portal/   # Supplier portal API
│   └── upload-invoice/    # File upload
├── admin/                 # Admin dashboard pages
├── customer/              # Customer portal
├── portal/                # Supplier portal
├── pay/                   # Payment page
└── invoice/               # Invoice display pages

components/                # Reusable React components
lib/                      # Utility functions and helpers
  ├── sharepoint.ts       # SharePoint integration
  ├── booking-utils.ts   # Booking helpers
  └── internal-notifications.ts  # Admin notifications
```

## Security Considerations

1. **Authentication**: Admin routes should be protected (currently basic auth check)
2. **Portal Codes**: Supplier portal codes are long random strings (12 chars)
3. **Payment Security**: Stripe handles all payment processing securely
4. **Data Validation**: All API inputs should be validated
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

## Future Enhancements

Potential improvements:
- Real-time updates via WebSockets
- Mobile app for suppliers
- Automated DLO processing integration
- Advanced reporting and analytics
- Multi-currency support
- Integration with accounting software
- Automated supplier payment reconciliation

## Support

For issues or questions:
- Check console logs for errors
- Review API response errors
- Verify environment variables
- Check Vercel deployment logs

## License

Private - Eek Mechanical Ltd

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained by**: Eek Mechanical Development Team
