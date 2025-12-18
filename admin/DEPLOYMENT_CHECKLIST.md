# Road and Rescue Admin System - Deployment Checklist

Use this checklist to ensure complete setup and deployment.

## Phase 1: Prerequisites ✅

- [ ] SharePoint Online site created and accessible
- [ ] Power Automate license assigned
- [ ] Azure AD app registration created (for API authentication)
- [ ] PnP PowerShell module installed (`Install-Module -Name PnP.PowerShell`)
- [ ] Access to create lists and flows confirmed

## Phase 2: SharePoint Lists Setup ✅

- [ ] Run `Create-SharePointLists.ps1` script OR create lists manually
- [ ] Verify "Jobs" list created with all columns
- [ ] Verify "JobBuildNotes" list created with all columns
- [ ] Verify "WhiteList" list created with all columns
- [ ] Verify "Receipts" list created with all columns
- [ ] Verify "Invoices" list created with all columns
- [ ] Verify "Transactions" list created with all columns
- [ ] Verify "Contractors" list created with all columns
- [ ] Verify "APINumbers" list created with all columns
- [ ] Verify "APIExtensionList" list created with all columns
- [ ] Test creating a sample item in each list
- [ ] Set list permissions (Read/Contribute/Full Control)
- [ ] Verify indexed fields are working

## Phase 3: Power Automate Flows Setup ✅

### Existing Flows (Verify)
- [ ] API Management Flow - URL verified and working
- [ ] Stripe Payment Link Flow - URL verified and working

### New Flows to Create
- [ ] Job Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] SharePoint actions added
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

- [ ] Supplier Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] SharePoint actions added
  - [ ] Email/SMS actions added
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

- [ ] Customer Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] SharePoint actions added
  - [ ] SMS gateway configured
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

- [ ] Invoice Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] SharePoint actions added
  - [ ] PDF generation configured
  - [ ] Email sending configured
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

- [ ] Notification Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] Email actions configured
  - [ ] SMS gateway configured
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

- [ ] Booking Data Operations Flow created
  - [ ] HTTP trigger configured
  - [ ] Input schema matches specification
  - [ ] SharePoint actions added
  - [ ] External API integration (if needed)
  - [ ] Error handling implemented
  - [ ] Tested with sample data
  - [ ] Flow URL copied

## Phase 4: Configuration ✅

- [ ] Open `api-config.js`
- [ ] Update `flows.apiManagement` with actual URL
- [ ] Update `flows.stripePaymentLink` with actual URL
- [ ] Update `flows.jobOperations` with actual URL
- [ ] Update `flows.supplierOperations` with actual URL
- [ ] Update `flows.customerOperations` with actual URL
- [ ] Update `flows.invoiceOperations` with actual URL
- [ ] Update `flows.notificationOperations` with actual URL
- [ ] Update `flows.bookingDataOperations` with actual URL
- [ ] Update `sharepoint.baseUrl` with your SharePoint site URL
- [ ] Update `sharepoint.siteUrl` with your site path
- [ ] Verify all list paths are correct
- [ ] Test API configuration loads correctly

## Phase 5: Authentication Setup ✅

- [ ] Choose authentication method (Azure AD / App-Only / User)
- [ ] Configure Azure AD app (if using)
  - [ ] App registered
  - [ ] API permissions granted
  - [ ] Client ID and Secret obtained
- [ ] Configure SharePoint app principal (if using app-only)
  - [ ] App created
  - [ ] Permissions granted
  - [ ] Certificate/Secret configured
- [ ] Test authentication works
- [ ] Update `script.js` with authentication logic (if needed)

## Phase 6: HTML Deployment ✅

- [ ] Choose deployment location:
  - [ ] SharePoint site (as pages)
  - [ ] Web server
  - [ ] Azure Static Web Apps
  - [ ] Other static hosting
- [ ] Upload all files from `admin/` folder
- [ ] Verify `api-config.js` is accessible
- [ ] Verify all HTML pages load correctly
- [ ] Test navigation between pages
- [ ] Verify CSS and JavaScript load correctly
- [ ] Test on different browsers (Chrome, Edge, Firefox)

## Phase 7: Data Migration ✅

- [ ] Export data from Excel "Book a Job" worksheet
- [ ] Format data for SharePoint import
- [ ] Import data to "Jobs" list
- [ ] Export data from "Job Build Notes" worksheet
- [ ] Import data to "JobBuildNotes" list
- [ ] Export data from "White_List" worksheet
- [ ] Import data to "WhiteList" list
- [ ] Export and import other worksheets as needed
- [ ] Verify data integrity after import
- [ ] Test that existing regos can be found

## Phase 8: Testing ✅

### Basic Navigation
- [ ] Main menu loads correctly
- [ ] All submenus accessible
- [ ] Back buttons work
- [ ] Exit buttons work
- [ ] Keyboard shortcuts work (q, qq, number keys)

### Job Operations
- [ ] Can select job by rego
- [ ] Yellow-highlighted jobs appear in selection
- [ ] Can update invoice name
- [ ] Can update job address
- [ ] Customer notification sent on update
- [ ] Can complete job
- [ ] Can close job
- [ ] Can cancel job

### Supplier Operations
- [ ] Can view suppliers for a rego
- [ ] Can update supplier details
- [ ] Supplier notification sent on update
- [ ] Can send job to supplier
- [ ] Can send message to supplier

### Customer Operations
- [ ] Can send manual text to customer
- [ ] Can send driver en route notification
- [ ] Can send revised ETA
- [ ] SMS gateway working (@sms.tnz.co.nz)

### API Management
- [ ] Can add API number
- [ ] Can update API extension
- [ ] Can delete API number
- [ ] API Extension list loads correctly

### Invoice Operations
- [ ] Can create invoice
- [ ] Can send invoice
- [ ] Invoice PDF generated correctly
- [ ] Email sent with attachment

### Payment Operations
- [ ] Can create Stripe payment link
- [ ] Payment link URL returned correctly
- [ ] Payment link works when clicked

## Phase 9: Security & Permissions ✅

- [ ] HTTPS enabled for all API calls
- [ ] CORS configured (if needed)
- [ ] Authentication tokens secured
- [ ] No sensitive data in client-side code
- [ ] Error messages don't expose sensitive info
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on server-side
- [ ] Audit logging enabled

## Phase 10: Documentation & Training ✅

- [ ] `README.md` reviewed and updated
- [ ] `INTEGRATION_GUIDE.md` reviewed
- [ ] `SETUP_SUMMARY.md` reviewed
- [ ] User training materials created
- [ ] Admin documentation created
- [ ] Troubleshooting guide created
- [ ] Support contact information documented

## Phase 11: Monitoring & Maintenance ✅

- [ ] Flow execution monitoring set up
- [ ] Error alerting configured
- [ ] Performance metrics tracked
- [ ] Backup strategy defined
- [ ] Update procedure documented
- [ ] Maintenance schedule created

## Phase 12: Go-Live ✅

- [ ] All tests passed
- [ ] Data migrated successfully
- [ ] Users trained
- [ ] Support process in place
- [ ] Rollback plan prepared
- [ ] Go-live date scheduled
- [ ] Communication sent to users
- [ ] System live and operational

## Post-Go-Live ✅

- [ ] Monitor for first 24 hours
- [ ] Address any immediate issues
- [ ] Collect user feedback
- [ ] Plan improvements
- [ ] Document lessons learned

---

## Quick Reference

**Key Files:**
- `api-config.js` - API endpoint configuration
- `INTEGRATION_GUIDE.md` - Complete setup guide
- `power-automate-flows.md` - Flow specifications
- `sharepoint-list-import-guide.md` - List creation guide
- `Create-SharePointLists.ps1` - Automated list creation

**Key URLs to Update:**
- Power Automate flow URLs in `api-config.js`
- SharePoint site URL in `api-config.js`

**Estimated Time:**
- Setup: 4-5 hours
- Testing: 1-2 hours
- Data Migration: 1-2 hours
- **Total: 6-9 hours**

