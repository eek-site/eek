/**
 * Eek Footer Manager - Clean Rebuild
 * Simple, reliable footer injection system
 * Cache busting: v20251020.66
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
            <div class="eek-footer-section eek-footer-main">
              <h4><a href="/" style="color: #ff5500; text-decoration: none;">Eek Mechanical</a></h4>
              <div class="eek-footer-links-grid">
                <a href="/misfuels/petrol-in-diesel">Petrol in Diesel</a>
                <a href="/misfuels/diesel-in-petrol">Diesel in Petrol</a>
                <a href="/misfuels/wrong-fuel-at-petrol-station">Wrong Fuel at Station</a>
                <a href="/misfuels/wrong-fuel-left-station">Wrong Fuel Left Station</a>
                <a href="/fuel-extraction/how-fuel-extraction-works">How Fuel Extraction Works</a>
                <a href="/fuel-extraction/fuel-extraction-cost-comparison">Fuel Extraction Cost Comparison</a>
                <a href="/fuel-extraction/when-you-need-fuel-extraction">When You Need Fuel Extraction</a>
                <a href="/fuel-extraction/fuel-extraction-insurance-coverage">Fuel Extraction Insurance</a>
                <a href="/fuel-extraction/fuel-extraction-nationwide-service">Nationwide Fuel Extraction</a>
                <a href="/fuel-extraction/fuel-extraction-response-times">Fuel Extraction Response Times</a>
                <a href="/fuel-extraction/fuel-extraction-vs-towing">Fuel Extraction vs Towing</a>
                <a href="/fuel-extraction/fuel-extraction-equipment-methods">Fuel Extraction Equipment</a>
                <a href="/fuel-extraction/fuel-extraction-vehicle-types">Fuel Extraction Vehicle Types</a>
                <a href="/fuel-extraction/fuel-extraction-safety-procedures">Fuel Extraction Safety</a>
              </div>
            </div>
            
            <div class="eek-footer-section eek-footer-secondary">
              <h4>Book Online</h4>
              <a href="/book-service/?service=jumpstart">Jump Starts</a>
              <a href="/book-service/?service=mechanic">Mobile Repairs</a>
              <a href="/book-service/?service=inspection">Pre-Purchase Inspections</a>
              <a href="/book-service/?service=fuel-extraction">Wrong Fuel Rescue</a>
              
              <h4 class="eek-footer-subheading">Contact</h4>
              <a href="javascript:void(0)" onclick="openServiceModal()">Contact Us</a>
            </div>
          </div>
          
          <div class="eek-footer-bottom">
            <p>© 2025 Eek Mechanical Ltd. All rights reserved.</p>
            <p>Company No: 9365185 | NZBN: 9429053064165</p>
            <div>
              <a href="/more-options">More Options</a>
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
          grid-template-columns: 1.5fr 1fr !important;
          gap: 80px !important;
          margin-bottom: 30px !important;
          max-width: 100% !important;
          align-items: start !important;
        }
        
        .eek-footer-section h4 {
          color: #ff5500 !important;
          font-size: 1.1em !important;
          margin-bottom: 12px !important;
          margin-top: 0 !important;
          font-weight: 600 !important;
          text-align: left !important;
        }
        
        .eek-footer-subheading {
          margin-top: 20px !important;
        }
        
        .eek-footer-main {
          min-width: 0 !important;
        }
        
        .eek-footer-links-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0 30px !important;
          row-gap: 6px !important;
        }
        
        .eek-footer-section p {
          color: rgba(255,255,255,0.9) !important;
          margin-bottom: 5px !important;
          font-size: 0.9em !important;
          line-height: 1.5 !important;
          text-align: left !important;
        }
        
        
        .eek-footer-section a {
          color: rgba(255,255,255,0.9) !important;
          text-decoration: none !important;
          margin-bottom: 8px !important;
          display: block !important;
          font-size: 0.9em !important;
          transition: color 0.3s ease !important;
          line-height: 1.5 !important;
          text-align: left !important;
        }
        
        .eek-footer-section h4 a {
          color: #ff5500 !important;
        }
        
        .eek-footer-section h4 a:hover {
          color: #ff7733 !important;
        }
        
        .eek-footer-section a:hover {
          color: #ff5500 !important;
        }
        
        .eek-footer-bottom {
          text-align: left !important;
          padding-top: 20px !important;
          border-top: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        .eek-footer-bottom p {
          color: rgba(255,255,255,0.7) !important;
          margin: 4px 0 !important;
          font-size: 0.85em !important;
          line-height: 1.6 !important;
        }
        
        .eek-footer-bottom div {
          margin-top: 12px !important;
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 15px !important;
        }
        
        .eek-footer-bottom div a {
          color: rgba(255,255,255,0.7) !important;
          margin: 0 !important;
          font-size: 0.85em !important;
          text-decoration: none !important;
        }
        
        .eek-footer-bottom div a:hover {
          color: #ff5500 !important;
        }
        
        /* Tablet Responsive */
        @media (max-width: 968px) {
          .eek-footer-content {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .eek-footer {
            padding: 25px 0 15px 0 !important;
            margin-top: 30px !important;
          }
          
          .eek-footer-wrapper {
            padding: 0 20px !important;
          }
          
          .eek-footer-content {
            grid-template-columns: 1fr !important;
            gap: 25px !important;
          }
          
          .eek-footer-section h4 {
            font-size: 1.05em !important;
            margin-bottom: 10px !important;
          }
          
          .eek-footer-links-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          
          .eek-footer-section p {
            font-size: 0.9em !important;
            margin-bottom: 8px !important;
            line-height: 1.5 !important;
          }
          
          .eek-footer-section a {
            font-size: 0.9em !important;
            margin-bottom: 8px !important;
            padding: 4px 0 !important;
            min-height: 32px !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.5 !important;
          }
          
          .eek-footer-bottom {
            padding-top: 20px !important;
          }
          
          .eek-footer-bottom p {
            font-size: 0.8em !important;
            line-height: 1.6 !important;
            margin: 5px 0 !important;
          }
          
          .eek-footer-bottom div {
            margin-top: 15px !important;
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: flex-start !important;
            gap: 10px !important;
          }
          
          .eek-footer-bottom div a {
            font-size: 0.8em !important;
            margin: 0 !important;
            padding: 6px 12px !important;
            min-height: 36px !important;
            display: flex !important;
            align-items: center !important;
          }
        }
        
        /* Small Mobile Devices */
        @media (max-width: 480px) {
          .eek-footer-wrapper {
            padding: 0 15px !important;
          }
          
          .eek-footer-content {
            gap: 20px !important;
          }
          
          .eek-footer-section h4 {
            font-size: 1em !important;
          }
          
          .eek-footer-section a {
            font-size: 0.85em !important;
            min-height: 36px !important;
          }
          
          .eek-footer-bottom div a {
            font-size: 0.75em !important;
            padding: 8px 10px !important;
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

  // Inject call modal scripts if not already loaded
  injectCallModalScripts() {
    // Check if call-modal.js is already loaded
    if (window.openServiceModal) {
      console.log('✅ Call modal scripts already loaded');
      return;
    }

    // Load call-modal.css if not already loaded
    if (!document.querySelector('link[href*="call-modal.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/call-modal.css?v=20250125';
      document.head.appendChild(link);
    }

    // Load call-modal.js
    const script = document.createElement('script');
    script.src = '/call-modal.js?v=20250125';
    script.onload = () => {
      console.log('✅ Call modal scripts loaded successfully');
    };
    script.onerror = () => {
      console.error('❌ Failed to load call modal scripts');
    };
    document.head.appendChild(script);
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
      
      // Inject call modal scripts
      this.injectCallModalScripts();
      
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