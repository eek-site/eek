// Authentication Helper for EEK Mechanical Admin Panel
// Provides authentication functions - can be extended for Azure AD / Microsoft 365

const auth = {
    // Current user state
    currentUser: null,
    msalInstance: null,
    
    // Initialize authentication
    init: function() {
        // Check if MSAL is loaded and auth is required
        if (typeof msal !== 'undefined' && authConfig && authConfig.requireAuth) {
            this.msalInstance = new msal.PublicClientApplication(authConfig.msalConfig);
            this.checkLogin();
        } else {
            // Auth not required - set default user
            this.currentUser = {
                name: 'Admin User',
                email: 'admin@eek.nz',
                authenticated: !authConfig.requireAuth
            };
        }
    },
    
    // Check if user is logged in
    checkLogin: function() {
        if (!this.msalInstance) return;
        
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            this.currentUser = {
                name: accounts[0].name,
                email: accounts[0].username,
                authenticated: true
            };
            this.updateUserDisplay();
        }
    },
    
    // Sign in with Microsoft
    signIn: async function() {
        if (!this.msalInstance) {
            console.log('MSAL not initialized');
            return;
        }
        
        try {
            const response = await this.msalInstance.loginPopup(authConfig.loginRequest);
            this.currentUser = {
                name: response.account.name,
                email: response.account.username,
                authenticated: true
            };
            this.updateUserDisplay();
            return this.currentUser;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    // Sign out
    signOut: function() {
        if (this.msalInstance) {
            this.msalInstance.logoutPopup();
        }
        this.currentUser = null;
        sessionStorage.removeItem('sessionRego');
        window.location.href = 'index.html';
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        // If auth not required, always return true
        if (!authConfig || !authConfig.requireAuth) {
            return true;
        }
        return this.currentUser && this.currentUser.authenticated;
    },
    
    // Get current user
    getUser: function() {
        return this.currentUser;
    },
    
    // Update user display in UI
    updateUserDisplay: function() {
        const userNameEl = document.querySelector('.user-name');
        const logoutBtn = document.querySelector('.btn-logout');
        
        if (this.currentUser && this.currentUser.authenticated) {
            if (userNameEl) {
                userNameEl.textContent = this.currentUser.name || this.currentUser.email;
            }
            if (logoutBtn && authConfig.requireAuth) {
                logoutBtn.style.display = 'inline-block';
            }
        }
    },
    
    // Require authentication for page
    requireAuth: function() {
        if (authConfig && authConfig.requireAuth && !this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // Get access token for API calls
    getAccessToken: async function() {
        if (!this.msalInstance) return null;
        
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length === 0) return null;
        
        try {
            const response = await this.msalInstance.acquireTokenSilent({
                ...authConfig.loginRequest,
                account: accounts[0]
            });
            return response.accessToken;
        } catch (error) {
            console.error('Token acquisition error:', error);
            return null;
        }
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    auth.init();
});

