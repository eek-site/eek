/**
 * Unified Tracking System - Single Source of Truth
 * Standardizes all tracking data, field names, and API calls across the entire platform
 * Replaces: enhanced-tracking.js, tracking-manager.js, phone-manager.js
 */

class UnifiedTrackingSystem {
    constructor() {
        // Standardized field names - these are the ONLY field names used across the platform
        this.STANDARD_FIELDS = {
            // Session & Identity
            sessionId: 'sessionId',
            userId: 'userId',
            customerId: 'customerId',
            
            // Contact Information
            firstName: 'firstName',
            lastName: 'lastName',
            fullName: 'fullName',
            email: 'email',
            phone: 'phone',
            phoneNumber: 'phoneNumber',
            
            // Location
            address: 'address',
            city: 'city',
            region: 'region',
            country: 'country',
            postalCode: 'postalCode',
            coordinates: 'coordinates',
            
            // Vehicle Information
            vehicleRego: 'vehicleRego',
            vehicleYear: 'vehicleYear',
            vehicleMake: 'vehicleMake',
            vehicleModel: 'vehicleModel',
            vehicleType: 'vehicleType',
            vehicleAddon: 'vehicleAddon',
            batteryVoltage: 'batteryVoltage',
            
            // Service Information
            serviceType: 'serviceType',
            serviceCode: 'serviceCode',
            serviceTitle: 'serviceTitle',
            emergencyType: 'emergencyType',
            urgencyLevel: 'urgencyLevel',
            scheduledDate: 'scheduledDate',
            timeWindow: 'timeWindow',
            price: 'price',
            finalPrice: 'finalPrice',
            calculatedPrice: 'calculatedPrice',
            details: 'details',
            description: 'description',
            
            // Seller Information
            sellerName: 'sellerName',
            sellerPhone: 'sellerPhone',
            
            // Marketing & Tracking
            gclid: 'gclid',
            fbclid: 'fbclid',
            msclkid: 'msclkid',
            utmSource: 'utmSource',
            utmMedium: 'utmMedium',
            utmCampaign: 'utmCampaign',
            utmTerm: 'utmTerm',
            utmContent: 'utmContent',
            
            // System Fields
            formVersion: 'formVersion',
            bookingTime: 'bookingTime',
            timestamp: 'timestamp',
            pageType: 'pageType',
            pageUrl: 'pageUrl',
            pagePath: 'pagePath',
            pageTitle: 'pageTitle',
            referrer: 'referrer',
            userAgent: 'userAgent',
            screenResolution: 'screenResolution',
            viewportSize: 'viewportSize',
            language: 'language',
            timezone: 'timezone',
            
            // Special Fields
            isWinz: 'isWinz',
            quoteReference: 'quoteReference',
            sharepointId: 'sharepointId',
            bookingStatus: 'bookingStatus',
            eventType: 'eventType'
        };

        // Power Platform API Endpoints
        this.API_ENDPOINTS = {
            tracking: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4',
            paymentConfirmed: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q',
            sharepointLookup: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c35b9414a0be42f88182ae7e6e409f1d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2ztt24wScLuAfifD0pjzovseRDKXBAEtCQtScGMgPqQ'
        };

        // Phone number management
        this.PHONE_NUMBERS = {
            main: { tel: 'tel:+6498724612', display: '+64 9 872 4612' },
            tracking: { tel: 'tel:0800447153', display: '0800 447 153' },
            emergency: { tel: 'tel:0800769000', display: '0800 769 000' },
            winz: { tel: 'tel:0800559009', display: '0800 559 009' }
        };

        // Initialize tracking
        this.sessionId = this.getOrCreateSessionId();
        this.pageSource = this.detectPageSource();
        this.userJourney = this.initializeUserJourney();
        this.trackingData = this.initializeTrackingData();
        this.engagement = this.initializeEngagement();
        
        this.init();
    }

    /**
     * Initialize the tracking system
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeTracking());
        } else {
            this.initializeTracking();
        }
    }

    /**
     * Initialize comprehensive tracking
     */
    initializeTracking() {
        console.log('🚀 Unified Tracking System initialized');
        
        this.trackPageView();
        this.trackPageSource();
        this.trackUserJourney();
        this.trackEngagement();
        this.trackFormInteractions();
        this.trackButtonClicks();
        this.trackScrollBehavior();
        this.trackTimeOnPage();
        this.trackExitIntent();
        this.setupAPITracking();
        this.updatePhoneNumbers();
        
        console.log('📊 Tracking Data:', this.trackingData);
    }

    /**
     * Get or create standardized session ID
     */
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem("eek_session_id");
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("eek_session_id", sessionId);
        }
        return sessionId;
    }

    /**
     * Detect page source with standardized data
     */
    detectPageSource() {
        const referrer = document.referrer;
        const urlParams = new URLSearchParams(window.location.search);
        
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        const gclid = urlParams.get('gclid');
        const fbclid = urlParams.get('fbclid');
        const msclkid = urlParams.get('msclkid');

        // Store UTM parameters in localStorage for persistence
        if (utmSource) localStorage.setItem("eek_utm_source", utmSource);
        if (utmMedium) localStorage.setItem("eek_utm_medium", utmMedium);
        if (utmCampaign) localStorage.setItem("eek_utm_campaign", utmCampaign);
        if (gclid) {
            localStorage.setItem("eek_gclid", gclid);
            localStorage.setItem("eek_gclid_timestamp", new Date().toISOString());
        }

        // Determine source type
        let sourceType = 'direct';
        let sourceDetail = 'Direct visit';

        if (gclid) {
            sourceType = 'google_ads';
            sourceDetail = 'Google Ads';
        } else if (fbclid) {
            sourceType = 'facebook_ads';
            sourceDetail = 'Facebook Ads';
        } else if (msclkid) {
            sourceType = 'microsoft_ads';
            sourceDetail = 'Microsoft Ads';
        } else if (utmSource) {
            sourceType = 'utm';
            sourceDetail = `${utmSource} - ${utmMedium || 'unknown'}`;
        } else if (referrer) {
            const referrerDomain = new URL(referrer).hostname;
            if (referrerDomain.includes('google')) {
                sourceType = 'google_organic';
                sourceDetail = 'Google Search';
            } else if (referrerDomain.includes('facebook')) {
                sourceType = 'facebook_organic';
                sourceDetail = 'Facebook';
            } else if (referrerDomain.includes('linkedin')) {
                sourceType = 'linkedin';
                sourceDetail = 'LinkedIn';
            } else {
                sourceType = 'referral';
                sourceDetail = referrerDomain;
            }
        }

        return {
            type: sourceType,
            detail: sourceDetail,
            referrer: referrer,
            utm: {
                source: utmSource || localStorage.getItem("eek_utm_source"),
                medium: utmMedium || localStorage.getItem("eek_utm_medium"),
                campaign: utmCampaign || localStorage.getItem("eek_utm_campaign"),
                term: urlParams.get('utm_term') || localStorage.getItem("eek_utm_term"),
                content: urlParams.get('utm_content') || localStorage.getItem("eek_utm_content")
            },
            clickIds: {
                gclid: gclid || localStorage.getItem("eek_gclid"),
                fbclid: fbclid,
                msclkid: msclkid
            }
        };
    }

    /**
     * Initialize user journey tracking
     */
    initializeUserJourney() {
        let journey = JSON.parse(localStorage.getItem('eek_user_journey') || '[]');
        
        const currentPage = {
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            source: this.pageSource,
            timeOnPage: 0
        };

        journey.push(currentPage);
        
        // Keep only last 10 pages
        if (journey.length > 10) {
            journey = journey.slice(-10);
        }
        
        localStorage.setItem('eek_user_journey', JSON.stringify(journey));
        return journey;
    }

    /**
     * Initialize comprehensive tracking data with standardized fields
     */
    initializeTrackingData() {
        const geo = window.CF_GEO || {};
        
        return {
            // Session data
            [this.STANDARD_FIELDS.sessionId]: this.sessionId,
            pageSource: this.pageSource,
            userJourney: this.userJourney,
            
            // Page data
            [this.STANDARD_FIELDS.pageUrl]: window.location.href,
            [this.STANDARD_FIELDS.pagePath]: window.location.pathname,
            [this.STANDARD_FIELDS.pageTitle]: document.title,
            [this.STANDARD_FIELDS.pageType]: this.detectPageType(),
            
            // User data
            [this.STANDARD_FIELDS.userAgent]: navigator.userAgent,
            [this.STANDARD_FIELDS.screenResolution]: `${screen.width}x${screen.height}`,
            [this.STANDARD_FIELDS.viewportSize]: `${window.innerWidth}x${window.innerHeight}`,
            [this.STANDARD_FIELDS.language]: navigator.language,
            [this.STANDARD_FIELDS.timezone]: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Geolocation data
            location: {
                [this.STANDARD_FIELDS.country]: geo.country || 'Unknown',
                countryCode: geo.countryCode || 'Unknown',
                [this.STANDARD_FIELDS.region]: geo.region || 'Unknown',
                regionCode: geo.regionCode || 'Unknown',
                [this.STANDARD_FIELDS.city]: geo.city || 'Unknown',
                [this.STANDARD_FIELDS.postalCode]: geo.postalCode || 'Unknown',
                continent: geo.continent || 'Unknown',
                [this.STANDARD_FIELDS.coordinates]: {
                    latitude: geo.latitude || null,
                    longitude: geo.longitude || null,
                    accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
                },
                [this.STANDARD_FIELDS.timezone]: geo.timezone || 'Unknown',
                raw: geo
            },
            
            // Marketing data
            utm: this.pageSource.utm,
            clickIds: this.pageSource.clickIds,
            
            // Timestamps
            [this.STANDARD_FIELDS.timestamp]: new Date().toISOString(),
            visitStart: new Date().toISOString(),
            
            // Engagement data
            engagement: this.initializeEngagement()
        };
    }

    /**
     * Initialize engagement tracking
     */
    initializeEngagement() {
        return {
            scrollDepth: 0,
            timeOnPage: 0,
            clicks: 0,
            formInteractions: 0,
            buttonClicks: 0
        };
    }

    /**
     * Detect page type
     */
    detectPageType() {
        const path = window.location.pathname;
        if (path === '/') return 'homepage';
        if (path.includes('/book-service')) return 'booking';
        if (path.includes('/pre-purchase-vehicle-inspection')) return 'inspection';
        if (path.includes('/more-options')) return 'more_options';
        if (path.includes('/supplier')) return 'supplier';
        if (path.includes('/supplier-upload')) return 'supplier_upload';
        if (path.includes('/thanks')) return 'thank_you';
        if (path.includes('/mjuris')) return 'legal';
        if (path.includes('/admin')) return 'admin';
        return 'other';
    }

    /**
     * Track page view with standardized data
     */
    trackPageView() {
        console.log('📊 Tracking page view...');
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: this.trackingData[this.STANDARD_FIELDS.pageTitle],
                page_location: this.trackingData[this.STANDARD_FIELDS.pageUrl],
                page_path: this.trackingData[this.STANDARD_FIELDS.pagePath],
                page_type: this.trackingData[this.STANDARD_FIELDS.pageType],
                source_type: this.trackingData.pageSource.type,
                source_detail: this.trackingData.pageSource.detail,
                session_id: this.trackingData[this.STANDARD_FIELDS.sessionId],
                user_journey_length: this.trackingData.userJourney.length
            });
        }

        if (typeof rdt !== 'undefined') {
            rdt('track', 'PageVisit', {
                pageType: this.trackingData[this.STANDARD_FIELDS.pageType],
                sourceType: this.trackingData.pageSource.type,
                sessionId: this.trackingData[this.STANDARD_FIELDS.sessionId]
            });
        }

        // Send to Power Automate API
        this.sendTrackingData('page_view');
    }

    /**
     * Track page source
     */
    trackPageSource() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_source', {
                event_category: 'Traffic',
                source_type: this.trackingData.pageSource.type,
                source_detail: this.trackingData.pageSource.detail,
                utm_source: this.trackingData.pageSource.utm.source,
                utm_medium: this.trackingData.pageSource.utm.medium,
                utm_campaign: this.trackingData.pageSource.utm.campaign,
                gclid: this.trackingData.pageSource.clickIds.gclid,
                session_id: this.trackingData[this.STANDARD_FIELDS.sessionId]
            });
        }
    }

    /**
     * Track user journey
     */
    trackUserJourney() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'user_journey', {
                event_category: 'Navigation',
                journey_length: this.trackingData.userJourney.length,
                previous_page: this.trackingData.userJourney.length > 1 ? 
                    this.trackingData.userJourney[this.trackingData.userJourney.length - 2].path : null,
                session_id: this.trackingData[this.STANDARD_FIELDS.sessionId]
            });
        }
    }

    /**
     * Track engagement metrics
     */
    trackEngagement() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.trackingData.engagement.scrollDepth = scrollPercent;
                
                // Track milestone scrolls
                if (scrollPercent >= 25 && scrollPercent < 50) {
                    this.trackEvent('scroll_25_percent', 'Engagement', 'Scrolled 25%');
                } else if (scrollPercent >= 50 && scrollPercent < 75) {
                    this.trackEvent('scroll_50_percent', 'Engagement', 'Scrolled 50%');
                } else if (scrollPercent >= 75 && scrollPercent < 90) {
                    this.trackEvent('scroll_75_percent', 'Engagement', 'Scrolled 75%');
                } else if (scrollPercent >= 90) {
                    this.trackEvent('scroll_90_percent', 'Engagement', 'Scrolled 90%');
                }
            }
        });

        // Track time on page
        setInterval(() => {
            this.trackingData.engagement.timeOnPage += 1;
        }, 1000);
    }

    /**
     * Track form interactions
     */
    trackFormInteractions() {
        document.addEventListener('focus', (event) => {
            try {
                if (event.target?.matches('input, textarea, select')) {
                    this.trackingData.engagement.formInteractions++;
                    this.trackEvent('form_focus', 'Form', event.target.name || event.target.id);
                }
            } catch (error) {
                console.warn('Form focus tracking error:', error);
            }
        });

        document.addEventListener('blur', (event) => {
            try {
                if (event.target?.matches('input, textarea, select')) {
                    this.trackEvent('form_blur', 'Form', event.target.name || event.target.id);
                }
            } catch (error) {
                console.warn('Form blur tracking error:', error);
            }
        });

        document.addEventListener('submit', (event) => {
            try {
                this.trackEvent('form_submit', 'Form', event.target?.id || 'unknown_form');
                this.sendTrackingData('form_submit', {
                    formId: event.target?.id,
                    formData: event.target ? new FormData(event.target) : null
                });
            } catch (error) {
                console.warn('Form submit tracking error:', error);
            }
        });
    }

    /**
     * Track button clicks
     */
    trackButtonClicks() {
        document.addEventListener('click', (event) => {
            try {
                this.trackingData.engagement.clicks++;
                
                if (event.target?.matches('button, a, [role="button"]')) {
                    this.trackingData.engagement.buttonClicks++;
                    const buttonText = event.target.textContent?.trim() || event.target.alt || 'unknown';
                    const buttonClass = event.target.className || 'no-class';
                    
                    this.trackEvent('button_click', 'Interaction', buttonText, {
                        button_class: buttonClass,
                        button_id: event.target.id || 'no-id'
                    });
                }
            } catch (error) {
                console.warn('Button click tracking error:', error);
            }
        });
    }

    /**
     * Track scroll behavior
     */
    trackScrollBehavior() {
        let scrollDirection = 'down';
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const newDirection = currentScrollY > lastScrollY ? 'down' : 'up';
            
            if (newDirection !== scrollDirection) {
                scrollDirection = newDirection;
                this.trackEvent('scroll_direction_change', 'Engagement', scrollDirection);
            }
            
            lastScrollY = currentScrollY;
        });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage() {
        // Track time milestones
        setTimeout(() => this.trackEvent('time_30_seconds', 'Engagement', '30 seconds on page'), 30000);
        setTimeout(() => this.trackEvent('time_1_minute', 'Engagement', '1 minute on page'), 60000);
        setTimeout(() => this.trackEvent('time_2_minutes', 'Engagement', '2 minutes on page'), 120000);
        setTimeout(() => this.trackEvent('time_5_minutes', 'Engagement', '5 minutes on page'), 300000);
    }

    /**
     * Track exit intent
     */
    trackExitIntent() {
        let exitIntentTracked = false;
        
        document.addEventListener('mouseleave', (event) => {
            if (event.clientY <= 0 && !exitIntentTracked) {
                exitIntentTracked = true;
                this.trackEvent('exit_intent', 'Engagement', 'User attempted to leave page');
            }
        });
    }

    /**
     * Setup API tracking
     */
    setupAPITracking() {
        // Send tracking data on page unload
        window.addEventListener('beforeunload', () => {
            this.sendTrackingData('page_exit', {
                timeOnPage: this.trackingData.engagement.timeOnPage,
                scrollDepth: this.trackingData.engagement.scrollDepth,
                clicks: this.trackingData.engagement.clicks,
                formInteractions: this.trackingData.engagement.formInteractions,
                buttonClicks: this.trackingData.engagement.buttonClicks
            });
        });
    }

    /**
     * Update phone numbers based on traffic source
     */
    updatePhoneNumbers() {
        const hasGclid = !!this.trackingData.pageSource.clickIds.gclid;
        const phoneData = hasGclid ? this.PHONE_NUMBERS.tracking : this.PHONE_NUMBERS.main;
        
        // Update all phone links
        document.querySelectorAll('.phone-link').forEach(link => {
            link.href = phoneData.tel;
            if (link.querySelector('.phone-display')) {
                link.querySelector('.phone-display').textContent = phoneData.display;
            }
        });
        
        console.log('📞 Phone numbers updated:', phoneData.display);
    }

    /**
     * Get phone number for specific context
     */
    getPhoneNumber(context = 'main') {
        switch (context) {
            case 'emergency':
                return this.PHONE_NUMBERS.emergency;
            case 'winz':
                return this.PHONE_NUMBERS.winz;
            case 'tracking':
                return this.PHONE_NUMBERS.tracking;
            default:
                return this.trackingData.pageSource.clickIds.gclid ? 
                    this.PHONE_NUMBERS.tracking : this.PHONE_NUMBERS.main;
        }
    }

    /**
     * Track custom events
     */
    trackEvent(eventName, category, label, additionalData = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: category,
                event_label: label,
                session_id: this.trackingData[this.STANDARD_FIELDS.sessionId],
                page_type: this.trackingData[this.STANDARD_FIELDS.pageType],
                source_type: this.trackingData.pageSource.type,
                ...additionalData
            });
        }

        if (typeof rdt !== 'undefined') {
            rdt('track', 'Custom', {
                customEventName: eventName,
                eventCategory: category,
                eventLabel: label,
                sessionId: this.trackingData[this.STANDARD_FIELDS.sessionId],
                ...additionalData
            });
        }

        console.log(`📊 Tracked: ${eventName} (${category}) - ${label}`);
    }

    /**
     * Send tracking data to Power Automate API
     */
    async sendTrackingData(eventType, additionalData = {}) {
        const trackingPayload = {
            ...this.trackingData,
            [this.STANDARD_FIELDS.eventType]: eventType,
            ...additionalData
        };

        console.log('📊 SENDING TRACKING DATA:', {
            eventType: eventType,
            payload: trackingPayload,
            payloadSize: JSON.stringify(trackingPayload).length
        });

        try {
            const response = await fetch(this.API_ENDPOINTS.tracking, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': navigator.userAgent
                },
                body: JSON.stringify(trackingPayload)
            });
            
            console.log('📡 Tracking API Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Tracking API Error Response:', errorText);
            }
        } catch (error) {
            console.error('❌ Tracking API Error:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
    }

    /**
     * Send payment confirmed data
     */
    async sendPaymentConfirmed(bookingData) {
        const payload = {
            ...this.trackingData,
            ...this.standardizeData(bookingData),
            [this.STANDARD_FIELDS.eventType]: 'payment_confirmed',
            [this.STANDARD_FIELDS.bookingStatus]: 'PAID',
            paymentConfirmedAt: new Date().toISOString(),
            paymentStatus: 'confirmed'
        };

        try {
            const response = await fetch(this.API_ENDPOINTS.paymentConfirmed, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            return response.ok;
        } catch (error) {
            console.error('❌ Payment confirmed API error:', error);
            return false;
        }
    }

    /**
     * Standardize data to use consistent field names
     */
    standardizeData(rawData) {
        const standardized = {};
        
        // Field mapping for common variations
        const fieldMappings = {
            // Session & Identity
            'sid': this.STANDARD_FIELDS.sessionId,
            'session_id': this.STANDARD_FIELDS.sessionId,
            'customer_id': this.STANDARD_FIELDS.customerId,
            'user_id': this.STANDARD_FIELDS.userId,
            
            // Contact Information
            'customerName': this.STANDARD_FIELDS.fullName,
            'customerPhone': this.STANDARD_FIELDS.phone,
            'customerEmail': this.STANDARD_FIELDS.email,
            'emailAddress': this.STANDARD_FIELDS.email,
            'phoneNumber': this.STANDARD_FIELDS.phone,
            
            // Vehicle Information
            'rego': this.STANDARD_FIELDS.vehicleRego,
            'vehicleRego': this.STANDARD_FIELDS.vehicleRego,
            'year': this.STANDARD_FIELDS.vehicleYear,
            'make': this.STANDARD_FIELDS.vehicleMake,
            'model': this.STANDARD_FIELDS.vehicleModel,
            'selectedVoltage': this.STANDARD_FIELDS.batteryVoltage,
            
            // Service Information
            'service': this.STANDARD_FIELDS.serviceType,
            'selectedTime': this.STANDARD_FIELDS.timeWindow,
            'selectedUrgency': this.STANDARD_FIELDS.urgencyLevel,
            'finalPrice': this.STANDARD_FIELDS.price,
            'calculatedPrice': this.STANDARD_FIELDS.price,
            
            // Marketing
            'google_click_id': this.STANDARD_FIELDS.gclid,
            'utm_source': this.STANDARD_FIELDS.utmSource,
            'utm_medium': this.STANDARD_FIELDS.utmMedium,
            'utm_campaign': this.STANDARD_FIELDS.utmCampaign,
            'utm_term': this.STANDARD_FIELDS.utmTerm,
            'utm_content': this.STANDARD_FIELDS.utmContent
        };

        // Apply field mappings
        for (const [oldField, newField] of Object.entries(fieldMappings)) {
            if (rawData[oldField] !== undefined) {
                standardized[newField] = rawData[oldField];
            }
        }

        // Copy over any fields that are already standardized
        for (const [key, value] of Object.entries(rawData)) {
            if (Object.values(this.STANDARD_FIELDS).includes(key) && !standardized[key]) {
                standardized[key] = value;
            }
        }

        return standardized;
    }

    /**
     * Get comprehensive tracking data
     */
    getTrackingData() {
        return this.trackingData;
    }

    /**
     * Get standardized field names
     */
    getStandardFields() {
        return this.STANDARD_FIELDS;
    }
}

// Initialize unified tracking system
window.unifiedTracking = new UnifiedTrackingSystem();

// Backward compatibility
window.enhancedTracking = window.unifiedTracking;
window.trackingManager = window.unifiedTracking;
window.phoneManager = window.unifiedTracking;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedTrackingSystem;
}
