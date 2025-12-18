# Complete Integration Guide

This guide walks you through setting up the complete Road and Rescue admin system with SharePoint and Power Automate.

## Prerequisites

1. SharePoint Online site (or SharePoint Server)
2. Power Automate license
3. Azure AD app registration (for API authentication)
4. Access to create lists and flows

## Step 1: Create SharePoint Lists

1. Review `sharepoint-lists-schema.json` for list structure
2. Follow `sharepoint-list-import-guide.md` to create lists
3. Verify all lists are created and accessible

**Required Lists:**
- Jobs
- JobBuildNotes
- WhiteList
- Receipts
- Invoices
- Transactions
- Contractors
- APINumbers
- APIExtensionList

## Step 2: Create Power Automate Flows

1. Review `power-automate-flows.md` for flow definitions
2. Create each flow in Power Automate:
   - Go to https://make.powerautomate.com
   - Create "Instant cloud flow" with HTTP trigger
   - Copy the input schema from the guide
   - Add SharePoint actions
   - Test each flow
   - Copy the HTTP POST URL

**Required Flows:**
- API_Management_Flow (already exists)
- Job_Operations_Flow
- Supplier_Operations_Flow
- Customer_Operations_Flow
- Invoice_Operations_Flow
- Notification_Operations_Flow
- Booking_Data_Operations_Flow
- Stripe_Payment_Link_Flow (already exists)

## Step 3: Configure API Endpoints

1. Open `admin/api-config.js`
2. Update all flow URLs with your actual Power Automate flow URLs
3. Update SharePoint base URL with your site URL
4. Update list paths if different

Example:
```javascript
flows: {
    jobOperations: "https://prod-XX.australiasoutheast.logic.azure.com:443/workflows/YOUR_WORKFLOW_ID/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_SIG"
}
```

## Step 4: Set Up Authentication

### Option A: Azure AD App Registration (Recommended)

1. Register app in Azure AD
2. Grant SharePoint API permissions
3. Use client credentials flow for service-to-service calls
4. Update `script.js` to include authentication token

### Option B: SharePoint App-Only Authentication

1. Create SharePoint app principal
2. Grant permissions to lists
3. Use app-only token in API calls

### Option C: User Authentication (For Testing)

1. Use browser-based authentication
2. Users will be prompted to sign in
3. Tokens stored in session

## Step 5: Deploy HTML Files

1. Upload all files in `admin/` folder to:
   - SharePoint site (as pages)
   - Web server
   - Azure Static Web Apps
   - Any static hosting

2. Ensure `api-config.js` is accessible
3. Test that all pages load correctly

## Step 6: Test Integration

### Test Checklist:

- [ ] Can load main menu
- [ ] Can navigate to submenus
- [ ] Can select job by rego
- [ ] Can update invoice name
- [ ] Can update job address
- [ ] Can update supplier details
- [ ] Can add API number
- [ ] Can update API extension
- [ ] Can delete API number
- [ ] Can send notifications
- [ ] Can create invoices
- [ ] Can process payments

## Step 7: Data Migration

If migrating from Excel:

1. Export data from Excel worksheets
2. Format as CSV or JSON
3. Use PowerShell or Power Automate to import:
   ```powershell
   Import-Csv "Jobs.csv" | ForEach-Object {
       Add-PnPListItem -List "Jobs" -Values @{
           "Title" = $_.Title
           "Rego" = $_.Rego
           "CustomerName" = $_.CustomerName
           # ... etc
       }
   }
   ```

## Step 8: Configure External APIs

### CarJam API
- Get API key from CarJam
- Store in Azure Key Vault or SharePoint list
- Update API calls in flows

### Stripe API
- Already configured in existing flow
- Verify flow URL is correct

## Troubleshooting

### Issue: "Flow URL not configured"
**Solution:** Update `api-config.js` with actual flow URLs

### Issue: "SharePoint not configured"
**Solution:** Update SharePoint base URL in `api-config.js`

### Issue: "Authentication failed"
**Solution:** Check Azure AD app permissions and token generation

### Issue: "List not found"
**Solution:** Verify list names match exactly (case-sensitive)

### Issue: "Column not found"
**Solution:** Check internal names match (use browser dev tools to inspect)

## Security Considerations

1. **HTTPS Only**: All API calls must use HTTPS
2. **Token Storage**: Never store tokens in client-side code
3. **CORS**: Configure CORS if hosting on different domain
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Input Validation**: Validate all user inputs server-side
6. **Error Messages**: Don't expose sensitive info in error messages

## Performance Optimization

1. **Caching**: Cache frequently accessed data (job lists, suppliers)
2. **Batch Operations**: Batch multiple updates when possible
3. **Lazy Loading**: Load data only when needed
4. **Pagination**: Implement pagination for large lists

## Monitoring

Set up monitoring for:
- Flow execution times
- API error rates
- SharePoint API throttling
- User activity

## Support

For issues:
1. Check browser console for JavaScript errors
2. Check Power Automate flow run history
3. Check SharePoint list permissions
4. Review API response logs

## Next Steps

1. Add user authentication/authorization
2. Implement audit logging
3. Add reporting dashboards
4. Set up automated backups
5. Create user training materials

