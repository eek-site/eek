# Quick Start Guide - Road and Rescue Admin System

Get up and running in 30 minutes (basic setup) or 4-5 hours (complete setup).

## 30-Minute Quick Setup (Testing Only)

For testing the HTML interface without SharePoint/Power Automate:

1. **Open the HTML files:**
   ```bash
   # Simply open admin/index.html in your browser
   # Or use a local web server:
   cd admin
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Test the interface:**
   - Navigate through menus
   - Fill out forms
   - Test navigation (q/qq keys)

**Note:** Actions will show alerts (not execute) until API endpoints are configured.

## Complete Setup (4-5 hours)

### Step 1: Create SharePoint Lists (30 min)

**Option A: PowerShell Script (Recommended)**
```powershell
# Install PnP PowerShell if needed
Install-Module -Name PnP.PowerShell

# Run the script
cd admin
.\Create-SharePointLists.ps1 -SiteUrl "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE"
```

**Option B: Manual Creation**
- Follow `sharepoint-list-import-guide.md`
- Create 9 lists via SharePoint UI

### Step 2: Create Power Automate Flows (2-3 hours)

1. Go to https://make.powerautomate.com
2. For each flow in `power-automate-flows.md`:
   - Create "Instant cloud flow"
   - Add HTTP trigger
   - Copy input schema
   - Add SharePoint actions
   - Test flow
   - Copy HTTP POST URL

**Required Flows:**
- Job Operations
- Supplier Operations
- Customer Operations
- Invoice Operations
- Notification Operations
- Booking Data Operations

### Step 3: Configure API Endpoints (15 min)

1. Open `admin/api-config.js`
2. Replace all `YOUR_POWER_AUTOMATE_FLOW_URL_HERE` with actual URLs
3. Replace `YOUR_TENANT` and `YOUR_SITE` with your SharePoint details

Example:
```javascript
flows: {
    jobOperations: "https://prod-XX.australiasoutheast.logic.azure.com:443/workflows/...",
    // ... etc
},
sharepoint: {
    baseUrl: "https://yourtenant.sharepoint.com/sites/roadandrescue",
    // ... etc
}
```

### Step 4: Deploy HTML Files (10 min)

**Option A: SharePoint Site**
- Upload to Site Pages library
- Create navigation links

**Option B: Web Server**
- Upload `admin/` folder to web root
- Ensure `api-config.js` is accessible

**Option C: Azure Static Web Apps**
- Connect GitHub repo
- Deploy automatically

### Step 5: Test (1 hour)

Follow `DEPLOYMENT_CHECKLIST.md` Phase 8 for complete testing.

## Common Issues & Quick Fixes

### "Flow URL not configured"
→ Update `api-config.js` with actual Power Automate flow URLs

### "SharePoint not configured"
→ Update SharePoint base URL in `api-config.js`

### "List not found"
→ Verify list names match exactly (case-sensitive)

### "Authentication failed"
→ Check Azure AD app permissions or SharePoint app principal

### Forms not loading data
→ Check browser console for JavaScript errors
→ Verify SharePoint REST API calls are working

## Next Steps After Setup

1. **Migrate Data:**
   - Export from Excel
   - Import to SharePoint lists
   - Verify data integrity

2. **Set Up Authentication:**
   - Choose method (Azure AD recommended)
   - Configure tokens
   - Test access

3. **Train Users:**
   - Share `README.md`
   - Create user guide
   - Conduct training session

4. **Monitor:**
   - Set up flow monitoring
   - Track errors
   - Collect feedback

## Getting Help

- **Setup Questions:** See `INTEGRATION_GUIDE.md`
- **Flow Creation:** See `power-automate-flows.md`
- **List Creation:** See `sharepoint-list-import-guide.md`
- **API Configuration:** See comments in `api-config.js`
- **Troubleshooting:** See `DEPLOYMENT_CHECKLIST.md` Phase 9

## File Reference

| File | Purpose |
|------|---------|
| `index.html` | Main menu - start here |
| `api-config.js` | **MUST UPDATE** - API endpoints |
| `INTEGRATION_GUIDE.md` | Complete setup walkthrough |
| `QUICK_START.md` | This file - quick reference |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `power-automate-flows.md` | Flow specifications |
| `sharepoint-list-import-guide.md` | List creation guide |
| `Create-SharePointLists.ps1` | Automated list creation |

## Success Criteria

✅ All HTML pages load  
✅ Navigation works  
✅ Forms submit (even if just alerts)  
✅ SharePoint lists created  
✅ Power Automate flows created  
✅ API endpoints configured  
✅ Can create/update jobs  
✅ Can send notifications  

Once all checked, system is ready for production use!

