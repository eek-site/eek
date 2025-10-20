/**
 * Centralized Phone Number Management System
 * Handles dynamic phone number display based on traffic source and page context
 */

class PhoneManager {
    constructor() {
        this.phoneNumbers = {
            // Default numbers
            default: {
                tel: 'tel:0800769000',
                display: '0800 769 000'
            },
            // Google Ads tracking number
            tracking: {
                tel: 'tel:0800447153', 
                display: '0800 447 153'
            },
            // Supplier direct contact
            supplier: {
                tel: 'tel:+6498724612',
                display: '+64 9 872 4612'
            }
        };
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateAllPhoneNumbers());
        } else {
            this.updateAllPhoneNumbers();
        }
    }

    /**
     * Get the appropriate phone number based on context
     * @param {string} context - 'default', 'tracking', 'supplier'
     * @returns {Object} Phone number object with tel and display
     */
    getPhoneNumber(context = 'default') {
        // Check if this is Google Ads traffic
        const isGoogleAds = this.isGoogleAdsTraffic();
        
        if (context === 'supplier') {
            return this.phoneNumbers.supplier;
        }
        
        if (isGoogleAds && context === 'default') {
            return this.phoneNumbers.tracking;
        }
        
        return this.phoneNumbers[context] || this.phoneNumbers.default;
    }

    /**
     * Check if traffic is from Google Ads
     * @returns {boolean}
     */
    isGoogleAdsTraffic() {
        // Check for GCLID parameter
        const urlParams = new URLSearchParams(window.location.search);
        const gclid = urlParams.get('gclid');
        
        // Check for GCLID in session storage (set by other scripts)
        const sessionGclid = sessionStorage.getItem('gclid');
        
        // Check for Google Ads referrer
        const referrer = document.referrer;
        const isGoogleReferrer = referrer && (
            referrer.includes('google.com') || 
            referrer.includes('googleadservices.com') ||
            referrer.includes('googlesyndication.com')
        );
        
        return !!(gclid || sessionGclid || isGoogleReferrer);
    }

    /**
     * Update all phone numbers on the page
     */
    updateAllPhoneNumbers() {
        // Update phone links
        this.updatePhoneLinks();
        
        // Update phone displays
        this.updatePhoneDisplays();
        
        // Update any hardcoded phone numbers in text
        this.updateHardcodedNumbers();
    }

    /**
     * Update all elements with .phone-link class
     */
    updatePhoneLinks() {
        const phoneLinks = document.querySelectorAll('.phone-link');
        const context = this.getPageContext();
        const phoneData = this.getPhoneNumber(context);
        
        phoneLinks.forEach(link => {
            link.href = phoneData.tel;
            
            // Only replace phone numbers in display text if it's not an after-hours element
            const textContent = link.textContent;
            const isAfterHoursElement = link.classList.contains('after-hours-btn') || 
                                      link.closest('#closedBanner') || 
                                      link.closest('#phonesBusyBanner');
            
            if (textContent && (textContent.includes('0800') || textContent.includes('+64')) && !isAfterHoursElement) {
                // Replace any phone number with "Now" to keep it as "Call Now"
                link.textContent = textContent.replace(/\b0800\s?\d{3}\s?\d{3}\b|\+64\s?\d\s?\d{3}\s?\d{3}\s?\d{3}\b/g, 'Now');
            }
        });
    }

    /**
     * Update all elements with .phone-display class
     */
    updatePhoneDisplays() {
        const phoneDisplays = document.querySelectorAll('.phone-display');
        
        phoneDisplays.forEach(display => {
            // Never show phone numbers - only show "Now" for "Call Now" buttons
            display.textContent = 'Now';
        });
    }

    /**
     * Update hardcoded phone numbers in text content
     */
    updateHardcodedNumbers() {
        const context = this.getPageContext();
        const phoneData = this.getPhoneNumber(context);
        
        // Only update if we're not on supplier page
        if (context === 'supplier') return;
        
        // Find and replace hardcoded numbers in text content
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('0800 769 000') || node.textContent.includes('0800769000')) {
                // Check if this text node is inside an after-hours element
                const isInAfterHoursElement = node.parentElement && (
                    node.parentElement.closest('#closedBanner') ||
                    node.parentElement.closest('#phonesBusyBanner') ||
                    node.parentElement.classList.contains('after-hours-btn')
                );
                
                if (!isInAfterHoursElement) {
                    textNodes.push(node);
                }
            }
        }
        
        textNodes.forEach(textNode => {
            textNode.textContent = textNode.textContent
                .replace(/0800\s?769\s?000/g, 'Now')
                .replace(/0800769000/g, 'Now');
        });
    }

    /**
     * Determine page context based on URL
     * @returns {string}
     */
    getPageContext() {
        const path = window.location.pathname;
        
        if (path.includes('/supplier')) {
            return 'supplier';
        }
        
        return 'default';
    }

    /**
     * Get phone number for service selection modal
     * @returns {Object}
     */
    getModalPhoneNumber() {
        const context = this.getPageContext();
        return this.getPhoneNumber(context);
    }

    /**
     * Update phone number in service selection modal
     * @param {string} phoneNumberElementId - ID of element to update
     */
    updateModalPhoneNumber(phoneNumberElementId) {
        const element = document.getElementById(phoneNumberElementId);
        if (element) {
            const phoneData = this.getModalPhoneNumber();
            element.textContent = phoneData.display;
        }
    }
}

// Initialize phone manager
window.phoneManager = new PhoneManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoneManager;
}
