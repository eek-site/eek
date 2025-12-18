# Road and Rescue Admin System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HTML Admin Interface                       │
│  (index.html, submenus, forms)                              │
│  - User interactions                                         │
│  - Form submissions                                          │
│  - Navigation                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Requests (JSON)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  API Configuration Layer                     │
│  (api-config.js)                                            │
│  - Endpoint mapping                                          │
│  - Action routing                                            │
│  - SharePoint URLs                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Routes to appropriate service
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Power        │ │ SharePoint   │ │ External     │
│ Automate     │ │ REST API     │ │ APIs         │
│ Flows        │ │              │ │              │
│              │ │              │ │ - CarJam     │
│ - Job Ops    │ │ - Jobs List  │ │ - Stripe     │
│ - Supplier   │ │ - Suppliers  │ │              │
│ - Customer   │ │ - Invoices   │ │              │
│ - Invoice    │ │ - Receipts    │ │              │
│ - Notify     │ │ - etc.       │ │              │
│ - Booking    │ │              │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  SharePoint      │
              │  Lists (Data)    │
              │                  │
              │  - Jobs          │
              │  - JobBuildNotes │
              │  - Invoices      │
              │  - Receipts      │
              │  - etc.          │
              └──────────────────┘
```

## Data Flow

### 1. User Action Flow
```
User clicks button in HTML
    ↓
JavaScript executes executeAction()
    ↓
Looks up action in api-config.js
    ↓
Routes to appropriate Power Automate flow
    ↓
Flow processes request
    ↓
Updates SharePoint list
    ↓
Returns response
    ↓
JavaScript shows success/error
```

### 2. Data Retrieval Flow
```
User needs job data
    ↓
JavaScript calls getSharePointData()
    ↓
Makes REST API call to SharePoint
    ↓
SharePoint returns JSON
    ↓
JavaScript populates form
```

### 3. Notification Flow
```
User updates job/supplier
    ↓
Power Automate flow updates SharePoint
    ↓
Flow sends email/SMS via Outlook/SMS gateway
    ↓
Customer/Supplier receives notification
```

## Component Details

### Frontend (HTML/JavaScript)
- **Location:** `admin/` folder
- **Files:** 23 HTML files, 2 CSS files, 2 JS files
- **Purpose:** User interface and interactions
- **Technology:** Vanilla JavaScript, HTML5, CSS3

### API Configuration
- **File:** `api-config.js`
- **Purpose:** Centralized endpoint configuration
- **Contains:**
  - Power Automate flow URLs
  - SharePoint site URLs
  - Action mappings
  - External API endpoints

### Power Automate Flows
- **Count:** 8 flows (2 existing, 6 new)
- **Purpose:** Business logic and data processing
- **Technology:** Power Automate (Logic Apps)
- **Integration:** SharePoint, Outlook, SMS gateway

### SharePoint Lists
- **Count:** 9 lists
- **Purpose:** Data storage (replaces Excel worksheets)
- **Technology:** SharePoint Online/Server
- **Access:** REST API, Power Automate connectors

## Data Model

### Jobs List (Primary)
- **Purpose:** Main job registry
- **Key Fields:** Rego, CustomerName, InvoiceName, Address, Status
- **Relationships:** Links to JobBuildNotes, Invoices, Receipts

### JobBuildNotes List
- **Purpose:** Supplier and job details
- **Key Fields:** Rego, RecordType, Supplier, Costings
- **Relationships:** Links to Jobs via Rego

### Supporting Lists
- **Invoices:** Invoice records
- **Receipts:** Receipt records
- **Transactions:** Payment transactions
- **Contractors:** Supplier details
- **APINumbers:** API number management
- **WhiteList:** Configuration data
- **APIExtensionList:** API extension lookup

## Security Model

### Authentication
- **Option 1:** Azure AD (Recommended)
  - User signs in via browser
  - Token stored in session
  - Automatic token refresh

- **Option 2:** App-Only
  - Service account authentication
  - Certificate or secret-based
  - No user interaction

### Authorization
- **SharePoint Permissions:**
  - Read: All authenticated users
  - Contribute: Users who can update
  - Full Control: Administrators

- **Power Automate:**
  - Flow runs with service account
  - Has permissions to SharePoint lists
  - Can send emails/SMS

## Integration Points

### Internal Integrations
1. **HTML → Power Automate:** HTTP POST with JSON
2. **Power Automate → SharePoint:** REST API or Connector
3. **SharePoint → HTML:** REST API queries

### External Integrations
1. **Stripe:** Payment link creation
2. **CarJam:** Vehicle lookup API
3. **SMS Gateway:** Email to @sms.tnz.co.nz
4. **Outlook:** Email sending

## Scalability Considerations

### Current Design
- Suitable for: Small to medium business
- Expected users: 10-50 concurrent
- Data volume: Thousands of jobs

### Scaling Options
1. **Caching:** Cache frequently accessed data
2. **Pagination:** Implement for large lists
3. **Batch Operations:** Group multiple updates
4. **CDN:** Serve static files from CDN
5. **Load Balancing:** Multiple Power Automate instances

## Performance Optimization

### Frontend
- Minify CSS/JavaScript
- Use CDN for libraries
- Lazy load data
- Cache API responses

### Backend
- Use SharePoint indexes
- Batch SharePoint operations
- Optimize Power Automate flows
- Cache lookup data

## Monitoring & Maintenance

### Key Metrics
- Flow execution time
- API error rate
- SharePoint API throttling
- User activity

### Maintenance Tasks
- Regular data backups
- Flow optimization
- Security updates
- User training

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| API Layer | Power Automate (Logic Apps) |
| Data Storage | SharePoint Lists |
| Authentication | Azure AD / SharePoint |
| External APIs | REST APIs (Stripe, CarJam) |
| Email/SMS | Outlook / SMS Gateway |

## Future Enhancements

1. **Mobile App:** React Native or PWA
2. **Real-time Updates:** SignalR or WebSockets
3. **Advanced Reporting:** Power BI integration
4. **Workflow Automation:** Additional Power Automate flows
5. **AI Integration:** Chatbot for common queries

