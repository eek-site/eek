/**
 * Centralized Footer System for Eek Mechanical
 * Provides consistent footer across all pages
 */

class FooterManager {
  constructor() {
    this.footerHTML = this.generateFooterHTML();
    this.footerCSS = this.generateFooterCSS();
  }

  generateFooterCSS() {
    return `
      /* Centralized Footer Styles */
        .eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
          color: white !important;
          padding: 40px 0 20px 0 !important;
          margin-top: 60px !important;
          border-top: 3px solid #ff5500 !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        /* More specific selectors to override any conflicting styles */
        footer.eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
        }
        
        body footer.eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
        }
        
        html body footer.eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
        }
        
        /* Ultra-specific selectors for stubborn pages */
        html body div footer.eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
        }
        
        /* Override any possible conflicting styles */
        .eek-footer[class*="footer"] {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
        }
        
        /* Force override with maximum specificity */
        html body div.container footer.eek-footer {
          background: linear-gradient(135deg, #1e3a5f, #2c5282) !important;
          background-color: #1e3a5f !important;
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
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 30px;
        margin-bottom: 30px;
      }

      .eek-footer-section h4 {
        color: #ff5500 !important;
        margin-bottom: 15px !important;
        font-size: 1.1em !important;
        font-weight: 600 !important;
      }

      .eek-footer-section p,
      .eek-footer-section a {
        color: #b8d4e8 !important;
        text-decoration: none !important;
        line-height: 1.6 !important;
        margin: 5px 0 !important;
        transition: color 0.3s ease !important;
      }

      .eek-footer-section a:hover {
        color: #ffffff;
        text-decoration: underline;
      }

      .eek-footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 20px;
        font-size: 0.9em;
        color: #b8d4e8;
      }

      .eek-footer-bottom .company-info {
        margin-bottom: 10px;
      }

      .eek-footer-bottom .legal-links {
        margin-top: 15px;
      }

      .eek-footer-bottom .legal-links a {
        color: #b8d4e8;
        text-decoration: none;
        margin: 0 15px;
        transition: color 0.3s ease;
      }

      .eek-footer-bottom .legal-links a:hover {
        color: #ff5500;
      }

      .eek-footer .phone-link {
        color: #ff5500 !important;
        font-weight: 600;
      }

      .eek-footer .phone-link:hover {
        color: #ff7700 !important;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .eek-footer {
          padding: 30px 0 15px 0;
        }
        
        .eek-footer-content {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .eek-footer-bottom .legal-links a {
          display: block;
          margin: 5px 0;
        }
      }
    `;
  }

  generateFooterHTML() {
    return `
      <footer class="eek-footer">
        <div class="container">
          <div class="eek-footer-content">
            <div class="eek-footer-section">
              <h4>🔧 Eek Mechanical</h4>
              <p><strong>353+ local mechanics vs $864M+ corporate profits</strong></p>
              <p>Supporting family-owned garages across New Zealand</p>
              <p>Emergency roadside assistance & workshop services</p>
              <p style="color: #ff5500; font-weight: 600; margin-top: 10px;">Your choice: Feed corporate greed or support your community</p>
            </div>
            
            <div class="eek-footer-section">
              <h4>📞 Contact Us</h4>
              <p><a href="#" class="phone-link" onclick="openServiceModal(); return false;">📞 Call Now</a></p>
              <p><a href="/book-service/">Book Service Online</a></p>
              <p><a href="/more-options/">More Options</a></p>
            </div>
            
            <div class="eek-footer-section">
              <h4>🏢 Business</h4>
              <p><a href="/supplier/">Join Our Network</a></p>
              <p><a href="/pre-purchase-vehicle-inspection/">Pre-Purchase Inspections</a></p>
              <p><a href="/mjuris/">Legal Portal</a></p>
            </div>
          </div>
          
          <div class="eek-footer-bottom">
            <div class="company-info">
              <strong>&copy; 2025 Eek Mechanical Ltd.</strong> All rights reserved.<br>
              Company No: 9365185 | NZBN: 9429053064165
            </div>
            
            <div class="legal-links">
              <a href="/privacy" data-track="footer_privacy" onclick="trackInteraction(this)">Privacy Policy</a>
              <a href="/terms" data-track="footer_terms" onclick="trackInteraction(this)">Terms of Service</a>
              <a href="/" data-track="footer_home" onclick="trackInteraction(this)">Homepage</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // Get page-specific footer content
  getPageSpecificFooter(pageType) {
    const baseFooter = this.generateFooterHTML();
    
    switch(pageType) {
      case 'supplier':
        return baseFooter.replace(
          '<p><a href="#" class="phone-link" onclick="openServiceModal(); return false;">📞 Call Now</a></p>',
          '<p><a href="tel:+6498724612" class="phone-link">📞 +64 9 872 4612</a></p>'
        );
      
      case 'legal':
        return baseFooter.replace(
          '<div class="eek-footer-section">',
          '<div class="eek-footer-section">' +
          '<h4>⚖️ Legal Services</h4>' +
          '<p><a href="/disputes-tribunal">Disputes Tribunal</a></p>' +
          '<p><a href="/authorize">Privacy Authorization</a></p>' +
          '</div>' +
          '<div class="eek-footer-section">'
        );
      
      case 'booking':
        return baseFooter.replace(
          '<p><a href="/book-service/">Book Service Online</a></p>',
          '<p><strong>Currently Booking:</strong> Emergency Service</p>'
        );
      
      default:
        return baseFooter;
    }
  }

  // Initialize footer on page
  initialize(pageType = 'default') {
    try {
      console.log('🔧 Footer.js v2.6: Starting initialization with pageType:', pageType);
      
      // Add CSS to head
      if (!document.getElementById('eek-footer-css')) {
        console.log('🎨 Footer.js: Adding CSS to head');
        const style = document.createElement('style');
        style.id = 'eek-footer-css';
        style.textContent = this.footerCSS;
        document.head.appendChild(style);
      } else {
        console.log('🎨 Footer.js: CSS already exists');
      }

      // Add footer to page
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
        
        // Force apply background styles as backup
        setTimeout(() => {
          newFooter.style.setProperty('background', 'linear-gradient(135deg, #1e3a5f, #2c5282)', 'important');
          newFooter.style.setProperty('background-color', '#1e3a5f', 'important');
          console.log('🎨 Footer.js: Force-applied background styles as backup');
        }, 100);
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

    if (path.includes('/supplier')) pageType = 'supplier';
    else if (path.includes('/mjuris')) pageType = 'legal';
    else if (path.includes('/book-service')) pageType = 'booking';
    else if (path.includes('/pre-purchase')) pageType = 'inspection';

    this.initialize(pageType);
  }
}

// Global footer manager instance
window.footerManager = new FooterManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Footer.js v2.6: DOM loaded, initializing footer...');
    console.log('🔧 Footer.js v2.6: About to call autoInitialize...');
    window.footerManager.autoInitialize();
    console.log('🔧 Footer.js v2.6: autoInitialize call completed');
  });
} else {
  console.log('🚀 Footer.js v2.6: DOM already ready, initializing footer...');
  console.log('🔧 Footer.js v2.6: About to call autoInitialize...');
  window.footerManager.autoInitialize();
  console.log('🔧 Footer.js v2.6: autoInitialize call completed');
}
