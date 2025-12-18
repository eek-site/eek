# Road and Rescue Admin Panel

A complete HTML-based admin interface for the Road and Rescue VBA system, built directly from the VBA code structure.

## File Structure

```
admin/
├── index.html                      # Main menu page
├── styles.css                      # Global styles
├── forms.css                       # Form-specific styles
├── script.js                       # JavaScript functionality
├── README.md                       # This file
│
├── all-items.html                 # Menu reference helper
│
├── intake.html                     # Intake & Booking submenu
├── dispatch.html                   # Dispatch & Setup submenu
├── customer.html                   # Customer Communication submenu
├── supplier.html                   # Supplier Communication submenu
├── completion.html                 # Job Completion & Billing submenu
├── accounting.html                 # Accounting & Financial submenu
├── administration.html             # Administration submenu
├── special.html                    # Special Services submenu
│
├── api-call-menu.html              # API Call Menu (from Administration)
├── api-add-number.html             # Add API Number form
├── api-update-extension.html       # Update API Extension form
├── api-delete-number.html          # Delete API Number form
│
├── prepurchase-menu.html           # Prepurchase Inspection Menu
├── fuel-extraction-menu.html       # Fuel Extraction Insurance Menu
│
├── update-invoice-name.html        # Update Invoice Name form
├── update-job-address.html         # Update Job Address by Rego form
└── update-supplier-details.html    # Update Supplier Details form
```

## Complete Menu Structure

### Main Menu (index.html)
1. Intake & Booking
2. Dispatch & Setup
3. Customer Communication
4. Supplier Communication
5. Job Completion & Billing
6. Accounting & Financial
7. Administration
8. Special Services
9. Show All Menu Items (Helper)

### Intake & Booking (intake.html)
1. Mark DNC Job
2. Triage Form
3. Booking Form
4. Add Record to Booking Data

### Dispatch & Setup (dispatch.html)
1. Add Supplier
2. Update Job
3. Update Job Address by Rego → **Form Page**
4. Open Customer Address in Google Maps
5. Send Location Request
6. Send Job to Supplier

### Customer Communication (customer.html)
1. Customer Reply (Customer View) - Opens customer-reply form for customer access
2. Customer Reply (Staff View) - Opens customer-reply form with staff-only items visible
3. Call Customer
4. Send Manual Text
5. Driver En Route
6. Revised ETA

### Supplier Communication (supplier.html)
1. Supplier Reply (Supplier View) - Opens supplier-reply form with restricted data (rego + customer name only)
2. Supplier Reply (Staff View) - Opens supplier-reply form with staff-only items visible
3. Send Message To Supplier
4. Call Supplier
5. Update Supplier Details → **Form Page**

### Job Completion & Billing (completion.html)
1. Send Manual Payment Gateway
2. Cancellation
3. Job Complete
4. Close Job
5. Send Invoice
6. Update Invoice Name → **Form Page**

### Accounting & Financial (accounting.html)
1. Generate ANZ Batch File
2. Profit and Loss
3. Generate Customer Refund File
4. Run Stripe and Job Updates

### Administration (administration.html)
1. Bad Debt Notice
2. Complaint Response
3. Add to Blacklist
4. API Call Menu → **Submenu**
5. Send Defamation Notice

### API Call Menu (api-call-menu.html)
1. Add Number → **Form Page**
2. Update Extension → **Form Page**
3. Delete Number → **Form Page**

### Special Services (special.html)
1. Prepurchase Inspection Menu → **Submenu**
2. Fuel Extraction Menu → **Submenu**

### Prepurchase Inspection Menu (prepurchase-menu.html)
1. Call Seller
2. Notify Seller: Mechanic En Route / Visit Workshop
3. Send Revised ETA to Seller
4. Send Manual Text to Seller
5. Prepare Inspection Folder
6. Send Seller Details to Mechanic
7. CarJam Lookup
8. Generate Prepurchase Report

### Fuel Extraction Insurance Menu (fuel-extraction-menu.html)
1. Create Insurance Folder
2. Open Web Form (collect/edit data)
3. Generate Word Report (from InsurerRecord table)
4. Send Report Email (to customer and/or insurer)

## Features

- ✅ **Complete Menu System**: All 8 main categories + special menus
- ✅ **Form Pages**: Interactive forms for actions requiring input
- ✅ **Customer/Supplier Reply Forms**: Integrated customer-reply form with:
  - Form siloing (separate customer and supplier forms)
  - Data restrictions for suppliers (only rego + customer name visible)
  - Staff-only visibility based on support flags
  - Base64-encoded URL parameters for secure data passing
- ✅ **Navigation**: Consistent back/exit buttons throughout
- ✅ **Keyboard Shortcuts**: 'q' to go back, 'qq' to exit, number keys for quick nav
- ✅ **Modern UI**: Professional gradient design with hover effects
- ✅ **Responsive**: Works on desktop and mobile devices
- ✅ **Color-Coded Actions**: Green (actions), Blue (secondary), Yellow (warnings), Red (danger), Purple (staff views)
- ✅ **VBA Structure Match**: Built directly from VBA code structure

## Form Pages

### Update Invoice Name (update-invoice-name.html)
- Select job by rego
- View current customer name (Col E) and invoice name (Col F)
- Update invoice name
- Automatic customer notification

### Update Job Address (update-job-address.html)
- Select job by rego
- View current address
- Update address
- Automatic customer notification

### Update Supplier Details (update-supplier-details.html)
- Select job by rego
- Choose supplier if multiple exist
- Update: Supplier Name, Costings, Bank Account, Email, Phone
- Automatic supplier notification

### API Management Forms
- **Add API Number**: Add new API number to system
- **Update Extension**: Update API extension/state
- **Delete API Number**: Remove API number (with confirmation)

### Customer/Supplier Reply Forms
- **Customer Reply (Customer View)**: Opens customer-reply form for customer access
  - Full customer form with all fields
  - No staff-only items visible
  - URL format: `/customer-reply?d=<base64>` (decoded: `bookingId=X&contactType=customer`)
  
- **Customer Reply (Staff View)**: Opens customer-reply form with staff access
  - Full customer form with staff-only section visible
  - Includes internal notes, priority override, ticket status, etc.
  - URL format: `/customer-reply?d=<base64>` (decoded: `bookingId=X&contactType=customer&customerSupport=true`)
  
- **Supplier Reply (Supplier View)**: Opens supplier-reply form with restricted data
  - Supplier-specific form fields
  - Only shows vehicle rego and customer name (data restricted)
  - No customer personal details (email, phone, address)
  - URL format: `/customer-reply?d=<base64>` (decoded: `bookingId=X&contactType=supplier&supplierSupport=true`)
  
- **Supplier Reply (Staff View)**: Opens supplier-reply form with staff access
  - Supplier form with staff-only section visible
  - Full staff functionality while maintaining supplier data restrictions
  - URL format: `/customer-reply?d=<base64>` (decoded: `bookingId=X&contactType=supplier&supplierSupport=true`)

## Microsoft Authentication

The admin panel includes Microsoft Azure AD authentication using MSAL.js. See `AUTHENTICATION_SETUP.md` for complete setup instructions.

**Features:**
- ✅ Single Sign-On (SSO) with Microsoft 365
- ✅ Secure token-based authentication
- ✅ Automatic token refresh
- ✅ User profile display
- ✅ Protected routes

**Quick Setup:**
1. Create Azure AD app registration
2. Configure API permissions
3. Update `auth-config.js` with your Client ID
4. Test login

## Integration with SharePoint and Power Automate

The system is fully wired to work with SharePoint lists and Power Automate flows. See `INTEGRATION_GUIDE.md` for complete setup instructions.

### Quick Setup:
1. Create SharePoint lists (see `sharepoint-list-import-guide.md`)
2. Create Power Automate flows (see `power-automate-flows.md`)
3. Update `api-config.js` with your flow URLs
4. Deploy HTML files

### API Endpoints Configured:
- ✅ API Management Flow (existing)
- ✅ Stripe Payment Link Flow (existing)
- ⚙️ Job Operations Flow (to be created)
- ⚙️ Supplier Operations Flow (to be created)
- ⚙️ Customer Operations Flow (to be created)
- ⚙️ Invoice Operations Flow (to be created)
- ⚙️ Notification Operations Flow (to be created)
- ⚙️ Booking Data Operations Flow (to be created)

## Integration with VBA (Legacy)

The HTML pages are currently set up with placeholder functions. To connect to your VBA system:

### 1. Set up Backend API

Create an API endpoint that can execute VBA functions. Example structure:

```javascript
// In script.js, update executeAction function:
async function executeAction(actionName, formData = null) {
    try {
        const response = await fetch('/api/execute-vba', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: actionName, 
                data: formData 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Action completed successfully!');
            // Optionally redirect or refresh
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}
```

### 2. Backend API Endpoint

Your backend should:
- Accept POST requests with `action` and `data` parameters
- Execute the corresponding VBA function
- Return success/error status

Example (Node.js/Express):
```javascript
app.post('/api/execute-vba', async (req, res) => {
    const { action, data } = req.body;
    
    // Execute VBA function via COM automation or similar
    try {
        const result = await executeVBAFunction(action, data);
        res.json({ success: true, result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
```

### 3. Data Loading Functions

For forms that need to load existing data (e.g., current invoice name, supplier list):

```javascript
async function loadInvoiceNameData(rego) {
    const response = await fetch(`/api/get-job-data?rego=${rego}`);
    const data = await response.json();
    
    document.getElementById('currentCustomerName').value = data.customerName;
    document.getElementById('currentInvoiceName').value = data.invoiceName;
}
```

## Keyboard Shortcuts

- **Number keys (1-9)**: Quick navigation to menu items
- **'q' key**: Go back to previous menu
- **'qq' or Ctrl+Q**: Exit the admin panel
- **Enter**: Submit forms

## Styling

The interface uses:
- **Purple/blue gradient** backgrounds for headers
- **Clean white** content areas
- **Hover effects** on all interactive elements
- **Color-coded buttons**:
  - Green: Standard actions
  - Blue: Secondary actions
  - Yellow: Warnings
  - Red: Danger/Delete actions
- **Responsive design** for mobile devices

## Next Steps

1. **Backend Integration**: Set up API to execute VBA functions
2. **Authentication**: Add login/security
3. **Data Loading**: Implement API calls to load current values in forms
4. **Real-time Updates**: Add status indicators and progress bars
5. **Logging**: Track all actions for audit trail
6. **Additional Forms**: Create forms for other complex actions (Profit & Loss, Send Manual Text, etc.)

## Notes

- All menu items match the VBA menu structure exactly
- Forms are designed to match VBA InputBox prompts
- Navigation follows VBA 'q'/'qq' pattern
- All pages are self-contained and can be hosted statically
- Ready for backend API integration

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ⚠️ Limited support (modern CSS features may not work)

## Development

To modify or extend:
1. Edit HTML files for structure
2. Edit `styles.css` for appearance
3. Edit `forms.css` for form styling
4. Edit `script.js` for functionality
5. Add new form pages following existing patterns
