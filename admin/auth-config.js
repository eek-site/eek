// Microsoft Authentication Configuration
// Using MSAL.js for Azure AD authentication

const AUTH_CONFIG = {
    // Azure AD App Registration details
    // Get these from: https://portal.azure.com -> Azure Active Directory -> App registrations
    msalConfig: {
        auth: {
            // Your Azure AD tenant ID or domain
            // Options:
            // - "common" (multi-tenant)
            // - "organizations" (work/school accounts)
            // - "consumers" (personal Microsoft accounts)
            // - "YOUR_TENANT_ID" (single tenant)
            authority: "https://login.microsoftonline.com/common",
            
            // Client ID from Azure AD App Registration
            clientId: "YOUR_CLIENT_ID_HERE",
            
            // Redirect URI (must match what's registered in Azure AD)
            // If hosting on SharePoint, use: window.location.origin + "/admin/index.html"
            // If hosting on web server, use your full URL
            redirectUri: window.location.origin + "/admin/index.html",
            
            // Post logout redirect URI
            postLogoutRedirectUri: window.location.origin + "/admin/login.html"
        },
        cache: {
            cacheLocation: "sessionStorage", // or "localStorage" for persistent login
            storeAuthStateInCookie: false
        }
    },
    
    // API scopes (permissions) required
    // These must be granted admin consent in Azure AD
    apiScopes: {
        // SharePoint API permissions
        sharepoint: [
            "https://YOUR_TENANT.sharepoint.com/.default"
            // Or use: "https://graph.microsoft.com/.default" for Microsoft Graph
        ],
        
        // Microsoft Graph permissions (if needed)
        graph: [
            "User.Read",
            "User.ReadBasic.All"
        ]
    },
    
    // SharePoint site URL (for token acquisition)
    sharepointSiteUrl: "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE",
    
    // Login request configuration
    loginRequest: {
        scopes: [
            "User.Read",
            "https://YOUR_TENANT.sharepoint.com/.default"
        ]
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.AUTH_CONFIG = AUTH_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AUTH_CONFIG;
}

