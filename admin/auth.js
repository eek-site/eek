// Microsoft Authentication Helper Functions
// Using MSAL.js for Azure AD authentication

// MSAL PublicClientApplication instance
let msalInstance = null;
let currentAccount = null;

/**
 * Initialize MSAL authentication
 */
function initializeAuth() {
    try {
        // Check if MSAL is loaded
        if (typeof msal === 'undefined') {
            console.error('MSAL.js library not loaded. Please include msal.js in your HTML.');
            return false;
        }
        
        // Check if AUTH_CONFIG is loaded
        if (typeof AUTH_CONFIG === 'undefined') {
            console.error('AUTH_CONFIG not loaded. Please include auth-config.js in your HTML.');
            return false;
        }
        
        // Create MSAL instance
        msalInstance = new msal.PublicClientApplication(AUTH_CONFIG.msalConfig);
        
        // Handle redirect promise (for redirect flow)
        msalInstance.handleRedirectPromise()
            .then(handleResponse)
            .catch(error => {
                console.error('Error handling redirect:', error);
            });
        
        // Get current account
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            console.log('User already signed in:', currentAccount.username);
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing authentication:', error);
        return false;
    }
}

/**
 * Handle authentication response
 */
function handleResponse(response) {
    if (response !== null) {
        currentAccount = response.account;
        console.log('User signed in:', currentAccount.username);
        
        // Redirect to main page if on login page
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
        
        return true;
    }
    return false;
}

/**
 * Sign in user (popup flow)
 */
async function signInPopup() {
    try {
        if (!msalInstance) {
            if (!initializeAuth()) {
                throw new Error('MSAL not initialized');
            }
        }
        
        const loginResponse = await msalInstance.loginPopup(AUTH_CONFIG.loginRequest);
        currentAccount = loginResponse.account;
        console.log('User signed in:', currentAccount.username);
        return loginResponse;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
}

/**
 * Sign in user (redirect flow - recommended for mobile)
 */
function signInRedirect() {
    try {
        if (!msalInstance) {
            if (!initializeAuth()) {
                throw new Error('MSAL not initialized');
            }
        }
        
        msalInstance.loginRedirect(AUTH_CONFIG.loginRequest);
    } catch (error) {
        console.error('Sign in redirect error:', error);
        throw error;
    }
}

/**
 * Sign out user
 */
function signOut() {
    try {
        if (!msalInstance) {
            if (!initializeAuth()) {
                throw new Error('MSAL not initialized');
            }
        }
        
        const logoutRequest = {
            account: currentAccount,
            postLogoutRedirectUri: AUTH_CONFIG.msalConfig.auth.postLogoutRedirectUri
        };
        
        msalInstance.logoutRedirect(logoutRequest);
    } catch (error) {
        console.error('Sign out error:', error);
        // Fallback: clear local storage and redirect
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

/**
 * Get access token for SharePoint API
 */
async function getAccessToken(scopes = null) {
    try {
        if (!msalInstance) {
            if (!initializeAuth()) {
                throw new Error('MSAL not initialized');
            }
        }
        
        if (!currentAccount) {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length === 0) {
                throw new Error('No user signed in');
            }
            currentAccount = accounts[0];
        }
        
        // Use provided scopes or default SharePoint scopes
        const requestScopes = scopes || AUTH_CONFIG.apiScopes.sharepoint;
        
        const tokenRequest = {
            scopes: requestScopes,
            account: currentAccount
        };
        
        // Try to get token silently first
        try {
            const response = await msalInstance.acquireTokenSilent(tokenRequest);
            return response.accessToken;
        } catch (silentError) {
            // If silent token acquisition fails, try popup
            console.log('Silent token acquisition failed, trying popup...');
            const response = await msalInstance.acquireTokenPopup(tokenRequest);
            return response.accessToken;
        }
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    if (!msalInstance) {
        return false;
    }
    
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
}

/**
 * Get current user account
 */
function getCurrentAccount() {
    if (!msalInstance) {
        return null;
    }
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        currentAccount = accounts[0];
        return currentAccount;
    }
    
    return null;
}

/**
 * Get current user display name
 */
function getCurrentUserName() {
    const account = getCurrentAccount();
    if (account) {
        return account.name || account.username;
    }
    return null;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        // Store the page they were trying to access
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Make authenticated fetch request to SharePoint
 */
async function authenticatedFetch(url, options = {}) {
    try {
        // Get access token
        const token = await getAccessToken();
        
        // Add authorization header
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
        };
        
        // Make request
        const response = await fetch(url, {
            ...options,
            headers: headers
        });
        
        // If unauthorized, try to refresh token
        if (response.status === 401) {
            console.log('Token expired, refreshing...');
            const newToken = await getAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            
            const retryResponse = await fetch(url, {
                ...options,
                headers: headers
            });
            
            if (!retryResponse.ok) {
                throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }
            
            return retryResponse;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
}

/**
 * Initialize authentication on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth if not on login page
    if (!window.location.pathname.includes('login.html')) {
        initializeAuth();
        
        // Check authentication status
        if (!isAuthenticated()) {
            requireAuth();
        } else {
            // Update UI with user info
            updateUserDisplay();
        }
    }
});

/**
 * Update UI with current user information
 */
function updateUserDisplay() {
    const account = getCurrentAccount();
    if (account) {
        // Update any user display elements
        const userDisplayElements = document.querySelectorAll('.user-display, .user-name');
        userDisplayElements.forEach(element => {
            element.textContent = account.name || account.username;
        });
        
        // Show logout button if hidden
        const logoutButtons = document.querySelectorAll('.btn-logout, .logout-btn');
        logoutButtons.forEach(button => {
            button.style.display = 'block';
        });
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.auth = {
        initialize: initializeAuth,
        signInPopup: signInPopup,
        signInRedirect: signInRedirect,
        signOut: signOut,
        getAccessToken: getAccessToken,
        isAuthenticated: isAuthenticated,
        getCurrentAccount: getCurrentAccount,
        getCurrentUserName: getCurrentUserName,
        requireAuth: requireAuth,
        authenticatedFetch: authenticatedFetch,
        updateUserDisplay: updateUserDisplay
    };
}

