/**
 * Centralized Footer Management System
 * Handles dynamic footer injection across all pages
 */

class FooterManager {
  constructor() {
    this.initialized = false;
  }

  generateFooterCSS() {
    return `
      /* Centralized Footer Styles */
      .eek-footer {
        background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
        color: white !important;
        padding: 40px 0 20px 0 !important;
        margin-top: 60px !important;
        border-top: 3px solid #ff5500 !important;
        position: relative !important;
        overflow: hidden !important;
      }

      .eek-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #ff5500, #ff7700, #ff5500);
        animation: shimmer 3s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      .eek-footer .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        text-align: center;
      }

      .eek-footer-content {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
        gap: 30px !important;
        margin-bottom: 30px !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      .eek-footer-section h4 {
        color: #ff5500 !important;
        margin-bottom: 15px !important;
        font-size: 1.1em !important;
        font-weight: 600 !important;
      }

      .eek-footer-section p,
      .eek-footer-section a {
        color: white !important;
        text-decoration: none !important;
        margin-bottom: 8px !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      .eek-footer-section a:hover {
        color: #ff5500 !important;
        text-decoration: underline !important;
      }

      .eek-footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 20px;
        margin-top: 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.8) !important;
        font-size: 0.9em;
      }

      .eek-footer-bottom a {
        color: rgba(255, 255, 255, 0.8) !important;
        text-decoration: none !important;
        margin: 0 10px !important;
      }

      .eek-footer-bottom a:hover {
        color: #ff5500 !important;
        text-decoration: underline !important;
      }

      @media (max-width: 768px) {
        .eek-footer-content {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .eek-footer .container {
          padding: 0 15px;
        }
      }
    `;
  }

  getPageSpecificFooter(pageType = 'default') {
    const baseFooter = `
      <footer class="eek-footer">
        <div class="container">
          <div class="eek-footer-content">
            <div class="eek-footer-section">
              <h4>🔧 Eek Mechanical</h4>
              <p>353+ local mechanics vs $864M+ corporate profits</p>
              <p>Supporting family-owned garages across New Zealand</p>
              <p>Emergency roadside assistance & workshop services</p>
              <p>Your choice: Feed corporate greed or support your community</p>
            </div>
            
            <div class="eek-footer-section">
              <h4>📞 Contact Us</h4>
              <a href="javascript:void(0)" onclick="openServiceModal()">Call Now</a>
              <a href="/book-service">Book Service Online</a>
              <a href="/more-options">More Options</a>
            </div>
            
            <div class="eek-footer-section">
              <h4>🏢 Business</h4>
              <a href="/supplier">Join Our Network</a>
              <a href="/pre-purchase-vehicle-inspection">Pre-Purchase Inspections</a>
              <a href="/mjuris">Legal Portal</a>
            </div>
          </div>
          
          <div class="eek-footer-bottom">
            <p>© 2025 Eek Mechanical Ltd. All rights reserved.</p>
            <p>Company No: 9365185 | NZBN: 9429053064165</p>
            <div>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/">Homepage</a>
            </div>
          </div>
        </div>
      </footer>
    `;

    return baseFooter;
  }

  // Initialize footer on page
  initialize(pageType = 'default') {
    try {
      console.log('🔧 Footer.js v2.3: Starting initialization with pageType:', pageType);
      
      // Add CSS to head
      if (!document.getElementById('eek-footer-css')) {
        console.log('🎨 Footer.js: Adding CSS to head');
        const style = document.createElement('style');
        style.id = 'eek-footer-css';
        style.textContent = this.generateFooterCSS();
        document.head.appendChild(style);
      }
      
      // Get page-specific footer
      console.log('📄 Footer.js: Getting page-specific footer...');
      const footerHTML = this.getPageSpecificFooter(pageType);
      console.log('📄 Footer.js: Generated footer HTML length:', footerHTML.length);
      
      // Remove existing footer if present
      const existingFooter = document.querySelector('footer, .footer, .eek-footer');
      if (existingFooter) {
        console.log('🗑️ Footer.js: Removing existing footer:', existingFooter);
        existingFooter.remove();
      } else {
        console.log('✅ Footer.js: No existing footer found');
      }

      // Add new footer before closing body tag
      console.log('➕ Footer.js: Injecting new footer into body');
      document.body.insertAdjacentHTML('beforeend', footerHTML);
      
      // Verify footer was added
      const newFooter = document.querySelector('.eek-footer');
      if (newFooter) {
        console.log('✅ Footer.js: Footer successfully injected:', newFooter);
      } else {
        console.log('❌ Footer.js: Footer injection failed - no .eek-footer found');
      }
    } catch (error) {
      console.error('❌ Footer.js: Error during initialization:', error);
      console.error('❌ Footer.js: Error stack:', error.stack);
    }

    // Initialize phone manager if available
    if (window.phoneManager && typeof window.phoneManager.updatePhoneLinks === 'function') {
      window.phoneManager.updatePhoneLinks();
    }

    // Initialize unified tracking if available
    if (window.unifiedTracking) {
      // Footer links are already set up with tracking
    }
  }

  // Auto-detect page type and initialize
  autoInitialize() {
    const path = window.location.pathname;
    let pageType = 'default';
    
    if (path.includes('/supplier')) {
      pageType = 'supplier';
    } else if (path.includes('/pre-purchase')) {
      pageType = 'inspection';
    } else if (path.includes('/thanks')) {
      pageType = 'thanks';
    } else if (path.includes('/404')) {
      pageType = '404';
    } else if (path.includes('/more-options')) {
      pageType = 'more-options';
    }
    
    this.initialize(pageType);
  }
}

// Global footer manager instance
window.footerManager = new FooterManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Footer.js v2.3: DOM loaded, initializing footer...');
    console.log('🔧 Footer.js v2.3: About to call autoInitialize...');
    window.footerManager.autoInitialize();
    console.log('🔧 Footer.js v2.3: autoInitialize call completed');
  });
} else {
  console.log('🚀 Footer.js v2.3: DOM already ready, initializing footer...');
  console.log('🔧 Footer.js v2.3: About to call autoInitialize...');
  window.footerManager.autoInitialize();
  console.log('🔧 Footer.js v2.3: autoInitialize call completed');
}