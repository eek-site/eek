/**
 * Eek Footer Manager - Clean Rebuild
 * Simple, reliable footer injection system
 */

class FooterManager {
  constructor() {
    this.isInitialized = false;
  }

  // Generate the footer HTML
  generateFooter() {
    return `
      <footer class="eek-footer">
        <div class="eek-footer-wrapper">
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
  }

  // Generate the CSS styles
  generateCSS() {
    return `
      <style id="eek-footer-styles">
        /* Eek Footer Styles */
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
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,85,0,0.1), rgba(255,85,0,0.05));
          pointer-events: none;
        }
        
        .eek-footer-wrapper {
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 0 20px !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        .eek-footer-content {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
          gap: 30px !important;
          margin-bottom: 30px !important;
        }
        
        .eek-footer-section h4 {
          color: #ff5500 !important;
          font-size: 1.2em !important;
          margin-bottom: 15px !important;
          font-weight: 600 !important;
        }
        
        .eek-footer-section p,
        .eek-footer-section a {
          color: white !important;
          text-decoration: none !important;
          margin-bottom: 8px !important;
          display: block !important;
          transition: color 0.3s ease !important;
        }
        
        .eek-footer-section a:hover {
          color: #ff5500 !important;
        }
        
        .eek-footer-bottom {
          text-align: center !important;
          padding-top: 20px !important;
          border-top: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        .eek-footer-bottom p {
          color: rgba(255,255,255,0.8) !important;
          margin: 5px 0 !important;
          font-size: 0.9em !important;
        }
        
        .eek-footer-bottom div {
          margin-top: 15px !important;
        }
        
        .eek-footer-bottom div a {
          color: rgba(255,255,255,0.8) !important;
          margin: 0 10px !important;
          font-size: 0.9em !important;
        }
        
        .eek-footer-bottom div a:hover {
          color: #ff5500 !important;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .eek-footer {
            padding: 30px 0 15px 0 !important;
          }
          
          .eek-footer-content {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .eek-footer-section h4 {
            font-size: 1.1em !important;
          }
        }
      </style>
    `;
  }

  // Inject CSS into head
  injectCSS() {
    // Remove existing styles if any
    const existing = document.getElementById('eek-footer-styles');
    if (existing) {
      existing.remove();
    }
    
    // Add new styles
    const style = document.createElement('div');
    style.innerHTML = this.generateCSS();
    document.head.appendChild(style.firstElementChild);
  }

  // Inject footer into page
  injectFooter() {
    // Remove existing footer if any
    const existing = document.querySelector('.eek-footer');
    if (existing) {
      existing.remove();
    }
    
    // Add new footer
    const footer = document.createElement('div');
    footer.innerHTML = this.generateFooter();
    document.body.appendChild(footer.firstElementChild);
    
    // Footer injected successfully
    console.log('✅ Footer injected with new wrapper structure');
  }

  // Initialize the footer
  initialize() {
    if (this.isInitialized) {
      console.log('Footer already initialized, skipping');
      return;
    }

    try {
      console.log('🚀 Initializing Eek Footer v2.0 (NEW WRAPPER)...');
      console.log('🔍 Page URL:', window.location.href);
      console.log('🔍 Page path:', window.location.pathname);
      
      // Inject CSS
      this.injectCSS();
      
      // Inject footer
      this.injectFooter();
      
      this.isInitialized = true;
      console.log('✅ Footer initialized successfully with new wrapper structure');
      
    } catch (error) {
      console.error('❌ Footer initialization failed:', error);
    }
  }
}

// Create global instance
window.eekFooter = new FooterManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.eekFooter.initialize();
  });
} else {
  window.eekFooter.initialize();
}