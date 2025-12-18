# Microsoft Authentication Setup Guide

This guide walks you through setting up Microsoft Azure AD authentication for the Road and Rescue admin panel.

## Prerequisites

1. Azure AD tenant (Microsoft 365 subscription)
2. Admin access to Azure Portal
3. SharePoint Online site
4. Access to create app registrations

## Step 1: Create Azure AD App Registration

### 1.1 Navigate to Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your admin account
3. Navigate to **Azure Active Directory**
4. Click **App registrations** in the left menu
5. Click **+ New registration**

### 1.2 Register the Application

Fill in the registration form:

- **Name**: `Road and Rescue Admin Panel` (or your preferred name)
- **Supported account types**: 
  - Select **Accounts in this organizational directory only** (single tenant)
  - OR **Accounts in any organizational directory** (multi-tenant)
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `https://YOUR_DOMAIN/admin/index.html`
  - Example: `https://yourcompany.sharepoint.com/sites/admin/admin/index.html`
  - OR: `https://yourdomain.com/admin/index.html` (if hosting on web server)

Click **Register**

### 1.3 Note Your Client ID

After registration, you'll see the **Overview** page. Copy the **Application (client) ID** - you'll need this for `auth-config.js`.

## Step 2: Configure API Permissions

### 2.1 Add SharePoint Permissions

1. In your app registration, click **API permissions** in the left menu
2. Click **+ Add a permission**
3. Select **SharePoint**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `Sites.Read.All` - Read items in all site collections
   - `Sites.ReadWrite.All` - Read and write items in all site collections (if you need write access)
6. Click **Add permissions**

### 2.2 Add Microsoft Graph Permissions (Optional)

If you want to display user profile information:

1. Click **+ Add a permission**
2. Select **Microsoft Graph**
3. Choose **Delegated permissions**
4. Add:
   - `User.Read` - Sign in and read user profile
   - `User.ReadBasic.All` - Read all users' basic profiles (if needed)
5. Click **Add permissions**

### 2.3 Grant Admin Consent

1. Click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm
3. Verify all permissions show **✓ Granted for [Your Organization]**

## Step 3: Configure Authentication

### 3.1 Update auth-config.js

Open `admin/auth-config.js` and update the following:

```javascript
msalConfig: {
    auth: {
        // Option 1: Single tenant (recommended for internal use)
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        
        // Option 2: Multi-tenant (if allowing external users)
        // authority: "https://login.microsoftonline.com/common",
        
        // Your Client ID from Step 1.3
        clientId: "YOUR_CLIENT_ID_HERE",
        
        // Must match the redirect URI from Step 1.2
        redirectUri: window.location.origin + "/admin/index.html",
        
        postLogoutRedirectUri: window.location.origin + "/admin/login.html"
    },
    // ...
}
```

### 3.2 Update SharePoint Site URL

In `auth-config.js`, update:

```javascript
// SharePoint site URL (for token acquisition)
sharepointSiteUrl: "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE",
```

### 3.3 Update API Scopes

In `auth-config.js`, update the scopes:

```javascript
apiScopes: {
    sharepoint: [
        "https://YOUR_TENANT.sharepoint.com/.default"
    ],
    // ...
}
```

And in `loginRequest`:

```javascript
loginRequest: {
    scopes: [
        "User.Read",
        "https://YOUR_TENANT.sharepoint.com/.default"
    ]
}
```

## Step 4: Find Your Tenant ID (Optional)

If using single-tenant authentication:

1. In Azure Portal, go to **Azure Active Directory**
2. Click **Overview**
3. Copy the **Tenant ID**

Use this in the authority URL: `https://login.microsoftonline.com/YOUR_TENANT_ID`

## Step 5: Test Authentication

### 5.1 Open Login Page

1. Navigate to `admin/login.html`
2. You should see the login page (not a configuration warning)

### 5.2 Sign In

1. Click **Sign in with Microsoft**
2. You'll be redirected to Microsoft login
3. Sign in with your Microsoft account
4. Grant permissions if prompted
5. You should be redirected back to `index.html`

### 5.3 Verify

- You should see your name in the header
- You should see a **Sign Out** button
- SharePoint API calls should work

## Troubleshooting

### Issue: "Configuration Required" warning on login page

**Solution:**
- Check that `auth-config.js` is loaded
- Verify `clientId` is set (not "YOUR_CLIENT_ID_HERE")
- Verify `authority` doesn't contain "YOUR_TENANT"

### Issue: "AADSTS50011: The redirect URI specified in the request does not match"

**Solution:**
- The redirect URI in `auth-config.js` must exactly match what's registered in Azure AD
- Check for trailing slashes, http vs https, etc.
- Update the redirect URI in Azure AD app registration if needed

### Issue: "AADSTS7000215: Invalid client secret is provided"

**Solution:**
- This error usually means the client ID is incorrect
- Verify the Client ID in `auth-config.js` matches Azure AD

### Issue: "Insufficient privileges to complete the operation" when accessing SharePoint

**Solution:**
- Verify API permissions are granted admin consent
- Check that the user has access to the SharePoint site
- Verify the SharePoint site URL is correct

### Issue: Popup blocked

**Solution:**
- The code automatically falls back to redirect flow if popup is blocked
- Allow popups for your domain in browser settings
- Or use redirect flow by default (modify `login.html`)

### Issue: Token expires quickly

**Solution:**
- MSAL automatically refreshes tokens
- If issues persist, check token expiration settings in Azure AD
- Consider using `localStorage` instead of `sessionStorage` for cache

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Redirect URIs**: Only register the exact URIs you need
3. **Permissions**: Only request the minimum permissions required
4. **Token Storage**: Tokens are stored securely by MSAL.js
5. **Admin Consent**: Always grant admin consent for organization-wide permissions

## Advanced Configuration

### Using Different Cache Location

In `auth-config.js`:

```javascript
cache: {
    cacheLocation: "localStorage", // Persistent login across sessions
    // OR
    cacheLocation: "sessionStorage", // Login only for current session
    storeAuthStateInCookie: false
}
```

### Custom Scopes

Add additional scopes if needed:

```javascript
loginRequest: {
    scopes: [
        "User.Read",
        "User.ReadBasic.All",
        "https://YOUR_TENANT.sharepoint.com/.default",
        "https://graph.microsoft.com/Mail.Send" // Example: if you need to send emails
    ]
}
```

### Multi-Tenant Support

To allow users from other organizations:

1. In Azure AD app registration, set **Supported account types** to **Multi-tenant**
2. In `auth-config.js`, use:
   ```javascript
   authority: "https://login.microsoftonline.com/common"
   ```

## Next Steps

After authentication is working:

1. Test SharePoint API calls
2. Verify user can access all admin functions
3. Set up user roles/permissions if needed
4. Configure additional scopes if required

## Support

For issues:
1. Check browser console for errors
2. Check Azure AD app registration settings
3. Verify redirect URIs match exactly
4. Review Microsoft documentation: https://docs.microsoft.com/azure/active-directory/develop/

