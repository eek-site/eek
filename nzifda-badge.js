/**
 * Enhanced NZIFDA Badge Component
 * Enhances badge images with improved presentation and interactivity
 */

class NZIFDABadge {
  constructor() {
    this.init();
  }

  /**
   * Initialize and enhance all badge images on the page
   */
  init() {
    // Find all images that link to nzifda.org/badge
    const images = document.querySelectorAll('img[src*="nzifda.org/badge"]');
    
    images.forEach(img => {
      this.enhanceBadge(img);
    });
  }

  /**
   * Enhance badge image presentation
   */
  enhanceBadge(img) {
    // Check if already enhanced
    if (img.closest('.nzifda-badge-enhanced')) {
      return;
    }

    // Get the badge URL
    const badgeUrl = img.getAttribute('src');
    if (!badgeUrl) return;

    // Get the parent container
    const container = img.parentElement;
    
    // Create enhanced wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'nzifda-badge-wrapper nzifda-badge-enhanced';
    
    // Get alt text
    const altText = img.getAttribute('alt') || 'NZIFDA Certified - Eek Mechanical Ltd';
    
    // Create the enhanced structure
    wrapper.innerHTML = `
      <div class="nzifda-badge-container">
        <div class="nzifda-badge-glow"></div>
        <div class="nzifda-badge-content">
          <div class="nzifda-badge-label">
            <span class="nzifda-badge-icon">✓</span>
            <span class="nzifda-badge-label-text">NZIFDA Certified Operator</span>
          </div>
          <a href="https://nzifda.org/index.html#certification" target="_blank" rel="noopener noreferrer" class="nzifda-badge-image-wrapper">
            <img src="${badgeUrl}" alt="${altText}" class="nzifda-badge-image" loading="lazy" />
            <div class="nzifda-badge-overlay">
              <div class="nzifda-badge-hover-effect">
                <span class="nzifda-badge-hover-text">Click to Verify</span>
                <svg class="nzifda-badge-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 3L14 10L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </a>
          <div class="nzifda-badge-footer">
            <a href="/certification" class="nzifda-badge-link">Learn about our certification</a>
          </div>
        </div>
      </div>
    `;

    // Replace original image with enhanced wrapper
    container.insertBefore(wrapper, img);
    container.removeChild(img);
    
    // Attach interactivity
    this.attachInteractivity(wrapper);
  }

  /**
   * Attach interactivity to the badge
   */
  attachInteractivity(wrapper) {
    const imageWrapper = wrapper.querySelector('.nzifda-badge-image-wrapper');
    const verifyUrl = 'https://nzifda.org/index.html#certification';

    if (imageWrapper) {
      // Track clicks
      imageWrapper.addEventListener('click', (e) => {
        // Track the click
        if (typeof gtag !== 'undefined') {
          gtag('event', 'nzifda_badge_click', {
            'event_category': 'Certification',
            'event_label': 'Badge Verification'
          });
        }
        if (typeof rdt !== 'undefined') {
          rdt('track', 'Custom', {
            'customEventName': 'nzifda_badge_click',
            'eventCategory': 'Certification'
          });
        }
      });

      // Add hover effects
      wrapper.addEventListener('mouseenter', () => {
        wrapper.classList.add('nzifda-badge-hover');
      });

      wrapper.addEventListener('mouseleave', () => {
        wrapper.classList.remove('nzifda-badge-hover');
      });
    }
  }

  /**
   * Static method to initialize all badges
   */
  static initAll() {
    new NZIFDABadge();
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    NZIFDABadge.initAll();
  });
} else {
  NZIFDABadge.initAll();
}

// Re-initialize after dynamic content loads
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(() => {
    NZIFDABadge.initAll();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NZIFDABadge;
}

