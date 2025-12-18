# Power Automate Flow Definitions

This document contains the Power Automate flow definitions needed for the Road and Rescue admin system.

## Flow 1: API Management Flow (EXISTING)

**Flow Name:** `API_Management_Flow`

**Trigger:** Manual (HTTP Request)

**URL:** Already configured in `SharepointModule.bas`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["add", "update", "delete"]
    },
    "API_Nbr": {
      "type": "string"
    },
    "API_Extn": {
      "type": "string"
    }
  },
  "required": ["action", "API_Nbr"]
}
```

**Actions:**
1. Parse JSON input
2. Switch on `action`:
   - **add**: Create item in "APINumbers" SharePoint list
   - **update**: Update item in "APINumbers" SharePoint list
   - **delete**: Delete item from "APINumbers" SharePoint list
3. Return success/error response

---

## Flow 2: Job Operations Flow

**Flow Name:** `Job_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "updateInvoiceName",
        "updateJobAddress",
        "getJobs",
        "completeJob",
        "closeJob",
        "cancelJob",
        "createInsuranceFolder",
        "generatePPIReport",
        "generateWordReport"
      ]
    },
    "rego": {
      "type": "string"
    },
    "invoiceName": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "jobId": {
      "type": "string"
    }
  },
  "required": ["action"]
}
```

**Actions:**
1. Parse JSON input
2. Switch on `action`:
   - **updateInvoiceName**: Update "InvoiceName" field in "Jobs" list where Rego = `rego`
   - **updateJobAddress**: Update "Address" field in "Jobs" list where Rego = `rego`
   - **getJobs**: Get items from "Jobs" list (filter by yellow highlighted if needed)
   - **completeJob**: Update "Status" to "Completed" in "Jobs" list
   - **closeJob**: Update "Status" to "Closed" in "Jobs" list
   - **cancelJob**: Update "Status" to "Cancelled" in "Jobs" list
   - **createInsuranceFolder**: Create folder structure (use SharePoint file operations)
   - **generatePPIReport**: Generate Word document (use Office 365 connector)
   - **generateWordReport**: Generate Word document from template
3. Return success/error response

**Response Schema:**
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "data": {
      "type": "object"
    },
    "error": {
      "type": "string"
    }
  }
}
```

---

## Flow 3: Supplier Operations Flow

**Flow Name:** `Supplier_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "updateSupplier",
        "sendJob",
        "sendMessage",
        "callSupplier"
      ]
    },
    "rego": {
      "type": "string"
    },
    "supplierIndex": {
      "type": "number"
    },
    "supplierName": {
      "type": "string"
    },
    "costings": {
      "type": "string"
    },
    "bankAccount": {
      "type": "string"
    },
    "suppEmail": {
      "type": "string"
    },
    "suppPhone": {
      "type": "string"
    },
    "message": {
      "type": "string"
    }
  },
  "required": ["action", "rego"]
}
```

**Actions:**
1. Parse JSON input
2. Switch on `action`:
   - **updateSupplier**: Update item in "JobBuildNotes" list (filter by Rego and RecordType = "Supplier")
   - **sendJob**: Get job details, format email/SMS, send via Outlook/SMS gateway
   - **sendMessage**: Send message to supplier via Outlook/SMS
   - **callSupplier**: Log call (can integrate with Teams or phone system)
3. Return success/error response

---

## Flow 4: Customer Operations Flow

**Flow Name:** `Customer_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "processReply",
        "callCustomer",
        "sendText",
        "driverEnRoute",
        "revisedETA"
      ]
    },
    "rego": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "eta": {
      "type": "string"
    }
  },
  "required": ["action", "rego"]
}
```

**Actions:**
1. Parse JSON input
2. Get customer details from "Jobs" list by Rego
3. Switch on `action`:
   - **processReply**: Process customer reply (update job status, log response)
   - **callCustomer**: Log call
   - **sendText**: Send SMS via SMS gateway (email to @sms.tnz.co.nz)
   - **driverEnRoute**: Send "Driver En Route" notification
   - **revisedETA**: Send revised ETA notification
4. Return success/error response

---

## Flow 5: Invoice Operations Flow

**Flow Name:** `Invoice_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["createInvoice", "sendInvoice"]
    },
    "rego": {
      "type": "string"
    },
    "jobId": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    }
  },
  "required": ["action", "rego"]
}
```

**Actions:**
1. Parse JSON input
2. Get job details from "Jobs" list
3. Switch on `action`:
   - **createInvoice**: Create item in "Invoices" list, generate PDF
   - **sendInvoice**: Get invoice, send email with PDF attachment
4. Return success/error response

---

## Flow 6: Notification Operations Flow

**Flow Name:** `Notification_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "notifyCustomer",
        "notifySupplier",
        "sendInsuranceReport"
      ]
    },
    "rego": {
      "type": "string"
    },
    "supplierName": {
      "type": "string"
    },
    "changeDescription": {
      "type": "string"
    },
    "oldValue": {
      "type": "string"
    },
    "newValue": {
      "type": "string"
    },
    "reportPath": {
      "type": "string"
    },
    "recipients": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["action", "rego"]
}
```

**Actions:**
1. Parse JSON input
2. Get contact details from "Jobs" or "JobBuildNotes" lists
3. Switch on `action`:
   - **notifyCustomer**: Send email/SMS to customer about changes
   - **notifySupplier**: Send email/SMS to supplier about changes
   - **sendInsuranceReport**: Send insurance report email with attachments
4. Return success/error response

---

## Flow 7: Booking Data Operations Flow

**Flow Name:** `Booking_Data_Operations_Flow`

**Trigger:** Manual (HTTP Request)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["addRecord"]
    },
    "rego": {
      "type": "string"
    },
    "customerName": {
      "type": "string"
    },
    "phoneNumber": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "location": {
      "type": "string"
    },
    "make": {
      "type": "string"
    },
    "model": {
      "type": "string"
    },
    "serviceType": {
      "type": "string"
    }
  },
  "required": ["action", "rego"]
}
```

**Actions:**
1. Parse JSON input
2. Create item in "Jobs" SharePoint list
3. Call external API to create booking (if needed)
4. Update "Jobs" list with BookingID from API response
5. Return success/error response with BookingID

---

## Flow 8: Stripe Payment Link Flow (EXISTING)

**Flow Name:** `Stripe_Payment_Link_Flow`

**Trigger:** Manual (HTTP Request)

**URL:** Already configured in `CreateStripeLinkModule.bas`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "rego": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    },
    "currency": {
      "type": "string",
      "default": "nzd"
    },
    "description": {
      "type": "string"
    },
    "redirectUrl": {
      "type": "string",
      "default": "www.eek.nz/thanks"
    }
  },
  "required": ["rego", "amount", "description"]
}
```

**Response Schema:**
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    }
  }
}
```

---

## Implementation Notes

1. **Authentication**: All flows should use SharePoint connector with appropriate permissions
2. **Error Handling**: All flows should include error handling and return appropriate error messages
3. **Logging**: Consider adding logging actions to track flow executions
4. **Testing**: Test each flow individually before integrating with the HTML interface
5. **Security**: Use secure HTTP (HTTPS) for all flow URLs
6. **Rate Limiting**: Be aware of SharePoint API rate limits

## Creating Flows in Power Automate

1. Go to https://make.powerautomate.com
2. Create a new flow with "Instant cloud flow" trigger
3. Choose "When an HTTP request is received" trigger
4. Copy the input schema JSON into the trigger
5. Add actions for SharePoint operations
6. Add error handling
7. Test the flow
8. Copy the HTTP POST URL and update `api-config.js`

