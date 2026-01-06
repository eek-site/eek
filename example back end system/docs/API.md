# API Documentation

Complete reference for all API endpoints in the Eek Mechanical system.

## Authentication

Most endpoints require no authentication (public-facing). Admin endpoints check for basic authentication via session.

## Customer APIs

### Create Booking

**Endpoint**: `POST /api/book-service`

Creates a new booking request. Returns booking ID and payment link.

**Request Body**:
```json
{
  "rego": "ABC123",
  "pickupLocation": "123 Main St, Auckland, New Zealand",
  "dropoffLocation": "456 Queen St, Auckland, New Zealand",
  "customerName": "John Doe",
  "customerPhone": "0212345678",
  "customerEmail": "john@example.com",
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "vehicleColor": "Blue",
  "vehicleYear": "2020",
  "issueType": "Tow"
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "HT-MJXMYLNY-EV84",
  "paymentLink": "https://www.eek.co.nz/pay/HT-MJXMYLNY-EV84",
  "price": 10000
}
```

### Confirm Booking

**Endpoint**: `POST /api/confirm-booking`

Confirms booking after payment. Creates job record and sends notifications.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "transactionId": "pi_xxx",
  "rego": "ABC123",
  "customerName": "John Doe",
  "customerPhone": "0212345678",
  "customerEmail": "john@example.com",
  "pickupLocation": "123 Main St, Auckland",
  "dropoffLocation": "456 Queen St, Auckland",
  "price": 10000,
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "vehicleColor": "Blue"
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "HT-MJXMYLNY-EV84",
  "jobCreated": true
}
```

### Get Booking

**Endpoint**: `GET /api/booking/[id]`

Get booking/job details by booking ID.

**Response**:
```json
{
  "success": true,
  "booking": {
    "bookingId": "HT-MJXMYLNY-EV84",
    "rego": "ABC123",
    "status": "booked",
    "price": 10000,
    // ... full job record
  }
}
```

### Send Customer Message

**Endpoint**: `POST /api/customer-message`

Send message from customer to Eek Mechanical.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "message": "When will the tow truck arrive?"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent"
}
```

### Get Messages

**Endpoint**: `GET /api/messages/[bookingId]`

Get all messages for a job.

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "from": "customer",
      "message": "When will the tow truck arrive?",
      "timestamp": "2026-01-05T10:00:00Z"
    },
    {
      "from": "hook_towing_to_customer",
      "message": "Your tow truck will arrive in 30 minutes.",
      "timestamp": "2026-01-05T10:05:00Z"
    }
  ]
}
```

## Supplier APIs

### Get Supplier Portal

**Endpoint**: `GET /api/supplier-portal/[code]`

Get supplier portal data with all their jobs.

**Response**:
```json
{
  "success": true,
  "supplier": {
    "name": "Eek Mechanical",
    "email": "supplier@example.com",
    "phone": "0212345678",
    "bankAccount": "06-0313-0860749-00",
    "bankName": "ANZ",
    "portalCode": "8g625yahytch"
  },
  "openJobs": [
    {
      "bookingId": "HT-MJXMYLNY-EV84",
      "rego": "ABC123",
      "status": "in_progress",
      "supplierPrice": 10000,
      "messages": [],
      "history": []
    }
  ],
  "closedJobs": []
}
```

### Send Supplier Message

**Endpoint**: `POST /api/supplier-portal/[code]`

Send message from supplier to Eek Mechanical.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "message": "Job completed successfully"
}
```

### Submit Supplier Invoice

**Endpoint**: `PUT /api/supplier-portal/[code]`

Submit supplier invoice.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "invoiceRef": "INV-001234",
  "invoiceAmount": 10000,
  "xeroLink": "https://go.xero.com/...",
  "invoiceFileUrl": "https://..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invoice submitted"
}
```

### Update Supplier Profile

**Endpoint**: `PATCH /api/supplier-portal/[code]`

Update supplier profile (bank details, etc.).

**Request Body**:
```json
{
  "legalName": "Eek Mechanical Ltd",
  "bankName": "ANZ",
  "bankAccount": "06-0313-0860749-00",
  "bankAccountName": "Eek Mechanical",
  "gstNumber": "123-456-789"
}
```

### Get Supplier Job

**Endpoint**: `GET /api/supplier-job/[ref]`

Get supplier job acceptance link data.

**Response**:
```json
{
  "success": true,
  "supplierJob": {
    "bookingId": "HT-MJXMYLNY-EV84",
    "rego": "ABC123",
    "supplierName": "Eek Mechanical",
    "status": "pending",
    "portalCode": "8g625yahytch"
  }
}
```

### Accept/Decline Job

**Endpoint**: `PUT /api/supplier-job/[ref]`

Accept or decline a job.

**Request Body**:
```json
{
  "status": "accepted"  // or "declined"
}
```

## Admin APIs

### Generate DLO File

**Endpoint**: `GET /api/admin/generate-dlo`

Generate DLO file for pending supplier payments.

**Query Parameters**:
- `preview=true` - Return payment list without generating file
- `all=true` - Include all unpaid jobs, not just completed

**Response** (preview mode):
```json
{
  "success": true,
  "count": 3,
  "totalAmount": 250.00,
  "payments": [
    {
      "supplierName": "Eek Mechanical",
      "legalName": "Eek Mechanical Ltd",
      "rego": "ABC123",
      "bookingId": "HT-XXX",
      "invoiceRef": "INV-001",
      "amount": "100.00",
      "bankAccount": "06-0313-0860749-00"
    }
  ]
}
```

**Response** (file generation):
- Returns DLO file as download
- Headers:
  - `X-Blob-Upload-Success`: "true" or "false"
  - `X-SharePoint-Upload-Success`: "true" or "false"
  - `X-Payment-Count`: Number of payments
  - `X-Total-Amount`: Total amount

### Mark Payments Processed

**Endpoint**: `POST /api/admin/generate-dlo`

Mark payments as processed.

**Request Body**:
```json
{
  "jobIds": ["HT-XXX", "HT-YYY"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Marked 2 payments as processed",
  "totalPaid": 200.00,
  "processedAt": "2026-01-05T10:00:00Z"
}
```

### Approve Payment

**Endpoint**: `POST /api/admin/approve-payment`

Approve supplier payment.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "approvedAmount": 10000
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "HT-MJXMYLNY-EV84",
  "supplierApprovedAmount": 10000,
  "supplierPaymentApproved": true
}
```

### Get Payment Status

**Endpoint**: `GET /api/admin/payment-status/[bookingId]`

Get payment approval status for a job.

**Response**:
```json
{
  "success": true,
  "bookingId": "HT-MJXMYLNY-EV84",
  "supplierPaymentApproved": true,
  "supplierApprovedAmount": 10000,
  "supplierPaidAt": null
}
```

### Add Additional Charge

**Endpoint**: `POST /api/additional-charge`

Add manual additional charge to a job.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "amount": 5000,
  "reason": "Location change",
  "sendPaymentLink": true
}
```

**Response**:
```json
{
  "success": true,
  "paymentLink": "https://www.eek.co.nz/pay/HT-XXX",
  "totalAmount": 15000
}
```

## Job Management APIs

### Get Job

**Endpoint**: `GET /api/jobs/[rego]`

Get job by rego or bookingId (with fallback lookup).

**Response**:
```json
{
  "success": true,
  "job": {
    "bookingId": "HT-MJXMYLNY-EV84",
    "rego": "ABC123",
    "status": "in_progress",
    // ... full job record
  }
}
```

### Update Job

**Endpoint**: `PUT /api/jobs/[rego]`

Update job status/data.

**Request Body**:
```json
{
  "status": "completed",
  "completedAt": "2026-01-05T10:00:00Z",
  "_updatedBy": "supplier:Company Name"
}
```

**Response**:
```json
{
  "success": true,
  "job": {
    // updated job record
  }
}
```

### Assign Supplier

**Endpoint**: `POST /api/jobs/assign-supplier`

Assign supplier to a job.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "supplierName": "Eek Mechanical",
  "supplierPrice": 10000,
  "supplierEmail": "supplier@example.com",
  "supplierPhone": "0212345678",
  "supplierAddress": "123 Supplier St",
  "notes": "Assigned for immediate pickup"
}
```

**Response**:
```json
{
  "success": true,
  "job": {
    // updated job record
  }
}
```

## Invoice APIs

### Send Customer Invoice

**Endpoint**: `POST /api/send-customer-invoice`

Send customer invoice email (paid receipt).

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84"
}
```

**Response**:
```json
{
  "success": true,
  "email": "customer@example.com",
  "invoiceUrl": "https://www.eek.co.nz/invoice/HT-MJXMYLNY-EV84"
}
```

### Send Supplier Invoice

**Endpoint**: `POST /api/send-supplier-invoice`

Send buyer-created invoice to supplier.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123"
}
```

**Response**:
```json
{
  "success": true,
  "invoiceNumber": "HOOK-202601-XXX",
  "sentTo": "supplier@example.com"
}
```

## File Upload APIs

### Upload Invoice

**Endpoint**: `POST /api/upload-invoice`

Upload supplier invoice file.

**Request**: FormData
- `file`: File object (PDF, PNG, JPG, max 10MB)
- `bookingId`: Job booking ID
- `rego`: Vehicle registration
- `supplierName`: Supplier name
- `amount`: Invoice amount

**Response**:
```json
{
  "success": true,
  "url": "https://...",
  "blobUrl": "https://...",
  "sharePointUrl": "https://...",
  "filename": "2026-01-04_ABC123_Supplier_$100.00.pdf"
}
```

## Utility APIs

### CarJam Lookup

**Endpoint**: `GET /api/carjam?plate=ABC123`

Lookup vehicle details from CarJam API.

**Response**:
```json
{
  "success": true,
  "plate": "ABC123",
  "make": "TOYOTA",
  "model": "COROLLA",
  "year": "2020",
  "color": "BLUE",
  "vin": "XXX"
}
```

### Send Booking Link

**Endpoint**: `POST /api/send-booking-link`

Send booking link to customer via email/SMS.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "link": "https://www.eek.co.nz/pay/HT-MJXMYLNY-EV84",
  "method": "email",  // or "sms"
  "eta": "30 mins",
  "price": 10000
}
```

### Send Supplier Link

**Endpoint**: `POST /api/send-supplier-link`

Send job notification to supplier via email/SMS.

**Request Body**:
```json
{
  "bookingId": "HT-MJXMYLNY-EV84",
  "rego": "ABC123",
  "supplierName": "Eek Mechanical",
  "supplierEmail": "supplier@example.com",
  "supplierPhone": "0212345678",
  "supplierAddress": "123 Supplier St",
  "pickup": "123 Main St",
  "dropoff": "456 Queen St",
  "price": 10000,
  "link": "https://www.eek.co.nz/supplier/XXX",
  "method": "sms"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error
