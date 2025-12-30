// Authentication Configuration for Road and Rescue Admin Panel
// This can be configured for Microsoft 365 / Azure AD authentication later

const authConfig = {
    // Set to true to enable authentication requirement
    requireAuth: false,
    
    // Microsoft Azure AD Configuration (for future use)
    msalConfig: {
        auth: {
            clientId: "YOUR_CLIENT_ID_HERE", // Replace with Azure AD App Client ID
            authority: "https://login.microsoftonline.com/common",
            redirectUri: window.location.origin + "/admin/"
        },
        cache: {
            cacheLocation: "sessionStorage",
            storeAuthStateInCookie: false
        }
    },
    
    // Login request scopes
    loginRequest: {
        scopes: ["User.Read"]
    },
    
    // Allowed domains for login (empty = allow all)
    allowedDomains: [
        "eek.nz",
        "roadandrescue.com"
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authConfig;
}

