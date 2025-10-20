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
              <h4>Eek Mechanical</h4>
              <p>Professional mobile mechanic services across New Zealand</p>
              <p>Emergency roadside assistance • Pre-purchase inspections</p>
            </div>
            
            <div class="eek-footer-section">
              <h4>Services</h4>
              <a href="javascript:void(0)" onclick="openServiceModal()">Contact Us</a>
              <a href="/pre-purchase-vehicle-inspection">Pre-Purchase Inspections</a>
              <a href="/book-service">Book Online</a>
            </div>
            
            <div class="eek-footer-section">
              <h4>Contact</h4>
              <p>📞 0800 769 000</p>
              <p>24/7 Emergency Service</p>
              <a href="/supplier">Join Our Network</a>
            </div>
          </div>
          
          <div class="eek-footer-bottom">
            <p>© 2025 Eek Mechanical Ltd. All rights reserved.</p>
            <p>Company No: 9365185 | NZBN: 9429053064165</p>
            <div>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
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
          background: #2c3e50 !important;
          color: white !important;
          padding: 30px 0 15px 0 !important;
          margin-top: 40px !important;
          border-top: 2px solid #ff5500 !important;
        }
        
        .eek-footer-wrapper {
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 0 15px !important;
        }
        
        .eek-footer-content {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          gap: 20px !important;
          margin-bottom: 20px !important;
        }
        
        .eek-footer-section h4 {
          color: #ff5500 !important;
          font-size: 1.1em !important;
          margin-bottom: 10px !important;
          font-weight: 600 !important;
        }
        
        .eek-footer-section p {
          color: rgba(255,255,255,0.9) !important;
          margin-bottom: 5px !important;
          font-size: 0.9em !important;
          line-height: 1.4 !important;
        }
        
        .eek-footer-section a {
          color: rgba(255,255,255,0.9) !important;
          text-decoration: none !important;
          margin-bottom: 5px !important;
          display: block !important;
          font-size: 0.9em !important;
          transition: color 0.3s ease !important;
        }
        
        .eek-footer-section a:hover {
          color: #ff5500 !important;
        }
        
        .eek-footer-bottom {
          text-align: center !important;
          padding-top: 15px !important;
          border-top: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        .eek-footer-bottom p {
          color: rgba(255,255,255,0.7) !important;
          margin: 3px 0 !important;
          font-size: 0.8em !important;
        }
        
        .eek-footer-bottom div {
          margin-top: 10px !important;
        }
        
        .eek-footer-bottom div a {
          color: rgba(255,255,255,0.7) !important;
          margin: 0 8px !important;
          font-size: 0.8em !important;
        }
        
        .eek-footer-bottom div a:hover {
          color: #ff5500 !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .eek-footer {
            padding: 20px 0 10px 0 !important;
            margin-top: 30px !important;
          }
          
          .eek-footer-content {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          
          .eek-footer-section h4 {
            font-size: 1em !important;
            margin-bottom: 8px !important;
          }
          
          .eek-footer-section p,
          .eek-footer-section a {
            font-size: 0.85em !important;
            margin-bottom: 4px !important;
          }
          
          .eek-footer-bottom p {
            font-size: 0.75em !important;
          }
          
          .eek-footer-bottom div a {
            font-size: 0.75em !important;
            margin: 0 5px !important;
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