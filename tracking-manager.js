/**
 * Centralized Tracking Management System
 * Handles all tracking across the entire website including Google Analytics, Reddit Pixel, and custom events
 */

class TrackingManager {
    constructor() {
        this.conversionValues = {
            // Service-specific conversion values (in cents)
            'inspection_call': 19900,
            'breakdown_call': 28900,
            'battery_call': 14900,
            'fuel_drain_call': 39900,
            'header_call': 25000,
            'sticky_call': 25000,
            'more_options_call': 25000,
            'mega_banner_call': 25000,
            'sticky_call_service_selection': 25000,
            'book_now_click': 25000,
            'service_card_click': 15000,
            'page_view': 0,
            'scroll_50_percent': 0
        };

        this.serviceTypes = {
            'inspection_call': 'Pre-Purchase Inspection',
            'breakdown_call': 'Emergency Breakdown',
            'battery_call': 'Battery Jump Start',
            'fuel_drain_call': 'Wrong Fuel Rescue',
            'header_call': 'General Inquiry',
            'sticky_call': 'General Inquiry',
            'mega_banner_call': 'Mega Banner Call',
            'more_options_call': 'General Inquiry',
            'sticky_call_service_selection': 'Service Selection',
            'book_now_click': 'Booking',
            'service_card_click': 'Service Selection'
        };

        this.scrollTracked = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeTracking());
        } else {
            this.initializeTracking();
        }
    }

    /**
     * Initialize tracking systems
     */
    initializeTracking() {
        this.trackPageView();
        this.setupScrollTracking();
        this.setupServiceSelectionTracking();
        this.setupBookingTracking();
        this.setupPhoneCallTracking();
        console.log('✅ Tracking Manager initialized');
    }

    /**
     * Track page view
     */
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': document.title,
                'page_location': window.location.href,
                'page_path': window.location.pathname
            });
        }

        if (typeof rdt !== 'undefined') {
            rdt('track', 'PageVisit');
        }
    }

    /**
     * Setup scroll tracking
     */
    setupScrollTracking() {
        window.addEventListener('scroll', () => {
            if (!this.scrollTracked && window.scrollY > document.body.scrollHeight * 0.5) {
                this.scrollTracked = true;
                this.trackEvent('scroll_50_percent', 'Engagement', 'Scrolled 50% of page');
            }
        });
    }

    /**
     * Setup service selection tracking
     */
    setupServiceSelectionTracking() {
        // Track service card clicks
        document.addEventListener('click', (event) => {
            try {
                const serviceCard = event.target?.closest('[data-service]');
                if (serviceCard) {
                    const serviceName = serviceCard.dataset?.service;
                    if (serviceName) {
                        this.trackServiceCardClick(serviceName);
                    }
                }
            } catch (error) {
                console.warn('Service selection tracking error:', error);
            }
        });
    }

    /**
     * Setup booking tracking
     */
    setupBookingTracking() {
        // Track booking button clicks
        document.addEventListener('click', (event) => {
            try {
                const bookingBtn = event.target?.closest('.booking-btn, [data-track*="book"]');
                if (bookingBtn) {
                    const serviceType = bookingBtn.dataset?.service || 'unknown';
                    this.trackBookingClick(serviceType);
                }
            } catch (error) {
                console.warn('Booking tracking error:', error);
            }
        });
    }

    /**
     * Setup phone call tracking
     */
    setupPhoneCallTracking() {
        // Track phone link clicks
        document.addEventListener('click', (event) => {
            try {
                const phoneLink = event.target?.closest('.phone-link, [href^="tel:"]');
                if (phoneLink) {
                    const eventAction = phoneLink.dataset?.track || 'phone_call';
                    this.trackConversion(eventAction, 'Contact');
                }
            } catch (error) {
                console.warn('Phone call tracking error:', error);
            }
        });
    }

    /**
     * Track conversion events
     * @param {string} eventAction - The action being tracked
     * @param {string} eventCategory - The category of the event
     * @param {Object} additionalData - Additional data to include
     */
    trackConversion(eventAction, eventCategory, additionalData = {}) {
        const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const eventValue = this.conversionValues[eventAction] || 25000;
        const serviceType = this.getServiceType(eventAction);

        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventAction, {
                'event_category': eventCategory,
                'event_label': 'Phone Call Click',
                'value': eventValue / 100,
                'custom_parameter_1': serviceType,
                'custom_parameter_2': conversionId,
                ...additionalData
            });

            // Track as conversion if it's a call action
            if (eventAction.includes('_call') || eventAction.includes('call')) {
                gtag('event', 'conversion', {
                    'send_to': 'AW-17084465163/7Mh8CKFRydsaEIuAwJI_'
                });
            }
        }

        // Reddit Pixel tracking
        if (typeof rdt !== 'undefined') {
            rdt('track', 'Lead', {
                'customEventName': 'Phone_Call_Click',
                'conversionId': conversionId,
                'value': eventValue,
                'currency': 'NZD',
                'itemCount': 1,
                'eventSource': eventAction,
                'eventCategory': eventCategory,
                'serviceType': serviceType,
                ...additionalData
            });
        }

        console.log(`📊 Tracked conversion: ${eventAction} (${eventCategory}) - Value: $${eventValue/100}`);
    }

    /**
     * Track general events
     * @param {string} eventAction - The action being tracked
     * @param {string} eventCategory - The category of the event
     * @param {string} eventLabel - The label for the event
     * @param {Object} additionalData - Additional data to include
     */
    trackEvent(eventAction, eventCategory, eventLabel, additionalData = {}) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventAction, {
                'event_category': eventCategory,
                'event_label': eventLabel,
                ...additionalData
            });
        }

        // Reddit Pixel tracking
        if (typeof rdt !== 'undefined') {
            rdt('track', 'Custom', {
                'customEventName': eventAction.replace(/_/g, '_'),
                'eventCategory': eventCategory,
                'eventLabel': eventLabel,
                ...additionalData
            });
        }

        console.log(`📊 Tracked event: ${eventAction} (${eventCategory}) - ${eventLabel}`);
    }

    /**
     * Track service card clicks
     * @param {string} serviceName - Name of the service clicked
     */
    trackServiceCardClick(serviceName) {
        this.trackEvent('service_card_click', 'Service Selection', serviceName, {
            'serviceType': serviceName
        });
    }

    /**
     * Track booking button clicks
     * @param {string} serviceType - Type of service being booked
     */
    trackBookingClick(serviceType) {
        this.trackEvent('book_now_click', 'Booking', serviceType, {
            'serviceType': serviceType
        });
    }

    /**
     * Track service selection from modal
     * @param {string} serviceType - Type of service selected
     */
    trackServiceSelection(serviceType) {
        this.trackConversion('sticky_call_service_selection', serviceType, {
            'serviceType': serviceType,
            'selectionMethod': 'modal'
        });
    }

    /**
     * Get service type from event action
     * @param {string} eventAction - The event action
     * @returns {string} Service type
     */
    getServiceType(eventAction) {
        return this.serviceTypes[eventAction] || 'General Service';
    }

    /**
     * Track form submissions
     * @param {string} formType - Type of form submitted
     * @param {Object} formData - Form data
     */
    trackFormSubmission(formType, formData = {}) {
        this.trackEvent('form_submission', 'Form', formType, {
            'formType': formType,
            'formData': formData
        });
    }

    /**
     * Track external link clicks
     * @param {string} linkUrl - URL being clicked
     * @param {string} linkText - Text of the link
     */
    trackExternalLink(linkUrl, linkText) {
        this.trackEvent('external_link_click', 'Navigation', linkText, {
            'linkUrl': linkUrl,
            'linkText': linkText
        });
    }

    /**
     * Track file downloads
     * @param {string} fileName - Name of file being downloaded
     * @param {string} fileType - Type of file
     */
    trackDownload(fileName, fileType) {
        this.trackEvent('file_download', 'Download', fileName, {
            'fileName': fileName,
            'fileType': fileType
        });
    }

    /**
     * Track video interactions
     * @param {string} videoId - ID of the video
     * @param {string} action - Action taken (play, pause, complete)
     */
    trackVideoInteraction(videoId, action) {
        this.trackEvent('video_interaction', 'Media', action, {
            'videoId': videoId,
            'action': action
        });
    }

    /**
     * Get tracking parameters from URL
     * @returns {Object} Tracking parameters
     */
    getTrackingParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            gclid: urlParams.get("gclid") || null,
            msclkid: urlParams.get("msclkid") || null,
            fbclid: urlParams.get("fbclid") || null,
            rdtclid: urlParams.get("rdtclid") || null,
            utm_source: urlParams.get("utm_source") || null,
            utm_medium: urlParams.get("utm_medium") || null,
            utm_campaign: urlParams.get("utm_campaign") || null,
            utm_term: urlParams.get("utm_term") || null,
            utm_content: urlParams.get("utm_content") || null
        };
    }

    /**
     * Track custom business events
     * @param {string} eventName - Name of the business event
     * @param {Object} eventData - Data associated with the event
     */
    trackBusinessEvent(eventName, eventData = {}) {
        this.trackEvent(eventName, 'Business', eventName, {
            ...eventData,
            'timestamp': new Date().toISOString(),
            'pageUrl': window.location.href,
            'userAgent': navigator.userAgent
        });
    }
}

// Initialize tracking manager
window.trackingManager = new TrackingManager();

// Legacy function for backward compatibility
window.trackConversion = function(eventAction, eventCategory, additionalData) {
    window.trackingManager.trackConversion(eventAction, eventCategory, additionalData);
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackingManager;
}
