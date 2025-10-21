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
            main: { tel: 'tel:0800769000', display: 'Call Now' },
            tracking: { tel: 'tel:0800447153', display: 'Call Now' },
            emergency: { tel: 'tel:0800769000', display: 'Call Now' },
            winz: { tel: 'tel:0800559009', display: 'Call Now' }
        };

        // Initialize tracking
        this.sessionId = this.getOrCreateSessionId();
        this.pageSource = this.detectPageSource();
        this.userJourney = this.initializeUserJourney();
        this.trackingData = this.initializeTrackingData();
        this.engagement = this.initializeEngagement();
        
        // Initialize persistent data management
        this.lastSentData = this.loadLastSentData();
        this.significantEvents = new Set([
            'page_view', 'form_submit', 'booking_completed', 'payment_confirmed',
            'service_selection', 'customer_info_complete', 'vehicle_info_complete',
            'inspection_booking_completed', 'conversion', 'lead_captured'
        ]);
        
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
     * Initialize comprehensive tracking (without automatic page_view)
     */
    initializeTracking() {
        console.log('🚀 Unified Tracking System v2.1 initialized');
        
        // NOTE: Removed automatic trackPageView() to prevent duplicate emails
        // Page view tracking is now controlled by the main page's IIFE
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
        
        // Retry location detection after CF_GEO loads
        this.retryLocationDetection();
        
        console.log('📊 Tracking Data:', this.trackingData);
    }

    /**
     * Retry location detection if CF_GEO wasn't available initially
     */
    retryLocationDetection() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkLocation = () => {
            attempts++;
            
            if (window.CF_GEO && window.CF_GEO.country) {
                console.log('🌍 CF_GEO loaded, updating location data');
                this.updateLocationData();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkLocation, 500); // Check every 500ms
            } else {
                console.log('🌍 CF_GEO not available after 5 seconds, using defaults');
            }
        };
        
        // Start checking after 100ms
        setTimeout(checkLocation, 100);
    }

    /**
     * Update location data when CF_GEO becomes available
     */
    updateLocationData() {
        const geo = window.CF_GEO;
        
        if (this.trackingData.location) {
            this.trackingData.location[this.STANDARD_FIELDS.country] = geo.country || 'New Zealand';
            this.trackingData.location.countryCode = geo.countryCode || 'NZ';
            this.trackingData.location[this.STANDARD_FIELDS.region] = geo.region || 'Auckland';
            this.trackingData.location.regionCode = geo.regionCode || 'AUK';
            this.trackingData.location[this.STANDARD_FIELDS.city] = geo.city || 'Auckland';
            this.trackingData.location[this.STANDARD_FIELDS.postalCode] = geo.postalCode || 'Unknown';
            this.trackingData.location.continent = geo.continent || 'Oceania';
            this.trackingData.location[this.STANDARD_FIELDS.coordinates] = {
                latitude: geo.latitude || -36.8485,
                longitude: geo.longitude || 174.7633,
                accuracy: geo.latitude && geo.longitude ? 'IP-based' : 'Default'
            };
            this.trackingData.location[this.STANDARD_FIELDS.timezone] = geo.timezone || 'Pacific/Auckland';
            this.trackingData.location.raw = geo;
            
            console.log('🌍 Updated location data:', this.trackingData.location);
        }
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
        // Wait for CF_GEO to be available, with fallback
        const geo = window.CF_GEO || {};
        
        // Debug logging for location data
        console.log('🌍 CF_GEO Data:', geo);
        console.log('🌍 Geo available:', !!window.CF_GEO);
        
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
            
            // Geolocation data - with better fallbacks
            location: {
                [this.STANDARD_FIELDS.country]: geo.country || 'New Zealand', // Default to NZ
                countryCode: geo.countryCode || 'NZ',
                [this.STANDARD_FIELDS.region]: geo.region || 'Auckland', // Default to Auckland
                regionCode: geo.regionCode || 'AUK',
                [this.STANDARD_FIELDS.city]: geo.city || 'Auckland', // Default to Auckland
                [this.STANDARD_FIELDS.postalCode]: geo.postalCode || 'Unknown',
                continent: geo.continent || 'Oceania',
                [this.STANDARD_FIELDS.coordinates]: {
                    latitude: geo.latitude || -36.8485, // Auckland coordinates as fallback
                    longitude: geo.longitude || 174.7633,
                    accuracy: geo.latitude && geo.longitude ? 'IP-based' : 'Default'
                },
                [this.STANDARD_FIELDS.timezone]: geo.timezone || 'Pacific/Auckland',
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
        // Track scroll depth with throttling
        let maxScroll = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            // Throttle scroll tracking to reduce API calls
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                if (scrollPercent > maxScroll) {
                    maxScroll = scrollPercent;
                    this.trackingData.engagement.scrollDepth = scrollPercent;
                    
                    // Only track milestone scrolls, not every scroll
                    if (scrollPercent >= 25 && scrollPercent < 50 && maxScroll < 25) {
                        this.trackEvent('scroll_25_percent', 'Engagement', 'Scrolled 25%');
                    } else if (scrollPercent >= 50 && scrollPercent < 75 && maxScroll < 50) {
                        this.trackEvent('scroll_50_percent', 'Engagement', 'Scrolled 50%');
                    } else if (scrollPercent >= 75 && scrollPercent < 90 && maxScroll < 75) {
                        this.trackEvent('scroll_75_percent', 'Engagement', 'Scrolled 75%');
                    } else if (scrollPercent >= 90 && maxScroll < 90) {
                        this.trackEvent('scroll_90_percent', 'Engagement', 'Scrolled 90%');
                    }
                }
            }, 500); // Throttle to 500ms
        });

        // Track time on page with less frequent updates
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
     * Track service selection (compatibility method)
     */
    trackServiceSelection(serviceType) {
        this.trackEvent('service_selection', 'Service Selection', serviceType, {
            service_type: serviceType
        });
    }

    /**
     * Update phone links (compatibility method)
     */
    updatePhoneLinks() {
        this.updatePhoneNumbers();
    }

    /**
     * Get modal phone number (compatibility method)
     */
    getModalPhoneNumber() {
        // Check if this is Google Ads traffic (has GCLID)
        const hasGclid = !!this.trackingData.pageSource?.clickIds?.gclid;
        
        if (hasGclid) {
            return this.PHONE_NUMBERS.tracking; // 0800 447 153
        } else {
            return this.PHONE_NUMBERS.main; // 0800 769 000
        }
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
        // Send tracking data on page unload only if there are meaningful changes
        window.addEventListener('beforeunload', () => {
            // Only send if user spent meaningful time on page or had significant engagement
            const timeOnPage = this.trackingData.engagement.timeOnPage;
            const scrollDepth = this.trackingData.engagement.scrollDepth;
            const clicks = this.trackingData.engagement.clicks;
            
            if (timeOnPage > 30 || scrollDepth > 25 || clicks > 3) {
                this.sendTrackingData('page_exit', {
                    timeOnPage: timeOnPage,
                    scrollDepth: scrollDepth,
                    clicks: clicks,
                    formInteractions: this.trackingData.engagement.formInteractions,
                    buttonClicks: this.trackingData.engagement.buttonClicks
                });
            } else {
                console.log('📊 Skipping page exit tracking - insufficient engagement');
            }
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
     * Detect device platform for email template
     */
    detectDevicePlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            return 'Mobile';
        } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
            return 'Tablet';
        } else {
            return 'Desktop';
        }
    }

    /**
     * Calculate session duration
     */
    calculateSessionDuration() {
        const sessionStart = localStorage.getItem('eek_session_start');
        if (sessionStart) {
            return Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
        }
        return 0;
    }

    /**
     * Calculate step progress percentage
     */
    calculateStepProgress() {
        const currentStep = this.trackingData.currentStep || 1;
        const totalSteps = this.trackingData.totalSteps || 5;
        return Math.round((currentStep / totalSteps) * 100);
    }

    /**
     * Load last sent data from localStorage for comparison
     */
    loadLastSentData() {
        try {
            const stored = localStorage.getItem('eek_last_sent_data');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load last sent data:', error);
            return {};
        }
    }

    /**
     * Save current data as last sent data
     */
    saveLastSentData(data) {
        try {
            // Only store essential fields to minimize storage
            const essentialData = {
                sessionId: data.sessionId,
                gclid: data.gclid,
                gclidState: data.gclidState,
                pageSource: data.pageSource,
                location: data.location,
                utm: data.utm,
                device: data.device,
                userJourney: data.userJourney,
                timestamp: data.timestamp,
                eventType: data.eventType
            };
            localStorage.setItem('eek_last_sent_data', JSON.stringify(essentialData));
        } catch (error) {
            console.warn('Failed to save last sent data:', error);
        }
    }

    /**
     * Determine if tracking data should be sent based on changes
     */
    shouldSendTrackingData(eventType, additionalData = {}) {
        // Always send significant events
        if (this.significantEvents.has(eventType)) {
            console.log('📊 Sending significant event:', eventType);
            return true;
        }

        // Check for meaningful changes in persistent data
        const currentData = this.getCurrentTrackingData();
        const hasLocationChange = this.hasLocationChanged(currentData);
        const hasEngagementChange = this.hasEngagementChanged(currentData);
        const hasCustomerDataChange = this.hasCustomerDataChanged(currentData);
        const hasServiceDataChange = this.hasServiceDataChanged(currentData);

        if (hasLocationChange || hasEngagementChange || hasCustomerDataChange || hasServiceDataChange) {
            console.log('📊 Sending due to data changes:', {
                location: hasLocationChange,
                engagement: hasEngagementChange,
                customer: hasCustomerDataChange,
                service: hasServiceDataChange
            });
            return true;
        }

        // Send if it's been more than 5 minutes since last send
        const lastSent = this.lastSentData.timestamp;
        if (lastSent) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (new Date(lastSent) < fiveMinutesAgo) {
                console.log('📊 Sending due to time threshold (5 minutes)');
                return true;
            }
        }

        return false;
    }

    /**
     * Get current tracking data for comparison
     */
    getCurrentTrackingData() {
        return {
            sessionId: this.trackingData[this.STANDARD_FIELDS.sessionId],
            gclid: this.trackingData.pageSource?.clickIds?.gclid,
            gclidState: this.trackingData.pageSource?.clickIds?.gclid ? 'Active' : 'Inactive',
            pageSource: this.trackingData.pageSource,
            location: this.trackingData.location,
            utm: this.trackingData.utm,
            device: {
                userAgent: this.trackingData[this.STANDARD_FIELDS.userAgent],
                screenResolution: this.trackingData[this.STANDARD_FIELDS.screenResolution],
                viewportSize: this.trackingData[this.STANDARD_FIELDS.viewportSize],
                language: this.trackingData[this.STANDARD_FIELDS.language],
                timezone: this.trackingData[this.STANDARD_FIELDS.timezone],
                platform: this.detectDevicePlatform()
            },
            userJourney: this.trackingData.userJourney,
            engagement: this.trackingData.engagement,
            customer: {
                name: this.trackingData[this.STANDARD_FIELDS.fullName] || '',
                phone: this.trackingData[this.STANDARD_FIELDS.phone] || '',
                email: this.trackingData[this.STANDARD_FIELDS.email] || ''
            },
            service: {
                serviceType: this.trackingData[this.STANDARD_FIELDS.serviceType] || '',
                serviceTitle: this.trackingData[this.STANDARD_FIELDS.serviceTitle] || '',
                price: this.trackingData[this.STANDARD_FIELDS.price] || ''
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check if location data has changed significantly
     */
    hasLocationChanged(currentData) {
        const lastLocation = this.lastSentData.location;
        if (!lastLocation) return true;

        const currentLocation = currentData.location;
        return (
            lastLocation.country !== currentLocation.country ||
            lastLocation.region !== currentLocation.region ||
            lastLocation.city !== currentLocation.city ||
            lastLocation.coordinates?.latitude !== currentLocation.coordinates?.latitude ||
            lastLocation.coordinates?.longitude !== currentLocation.coordinates?.longitude
        );
    }

    /**
     * Check if engagement data has changed significantly
     */
    hasEngagementChanged(currentData) {
        const lastEngagement = this.lastSentData.engagement;
        if (!lastEngagement) return true;

        const currentEngagement = currentData.engagement;
        return (
            Math.abs((lastEngagement.scrollDepth || 0) - (currentEngagement.scrollDepth || 0)) > 25 ||
            Math.abs((lastEngagement.timeOnPage || 0) - (currentEngagement.timeOnPage || 0)) > 30 ||
            Math.abs((lastEngagement.clicks || 0) - (currentEngagement.clicks || 0)) > 5
        );
    }

    /**
     * Check if customer data has changed
     */
    hasCustomerDataChanged(currentData) {
        const lastCustomer = this.lastSentData.customer;
        if (!lastCustomer) return false; // Don't send for empty customer data

        const currentCustomer = currentData.customer;
        return (
            lastCustomer.name !== currentCustomer.name ||
            lastCustomer.phone !== currentCustomer.phone ||
            lastCustomer.email !== currentCustomer.email
        );
    }

    /**
     * Check if service data has changed
     */
    hasServiceDataChanged(currentData) {
        const lastService = this.lastSentData.service;
        if (!lastService) return false; // Don't send for empty service data

        const currentService = currentData.service;
        return (
            lastService.serviceType !== currentService.serviceType ||
            lastService.serviceTitle !== currentService.serviceTitle ||
            lastService.price !== currentService.price
        );
    }

    /**
     * Send tracking data to Power Automate API
     */
    async sendTrackingData(eventType, additionalData = {}) {
        // Check if this is a significant change that warrants sending
        if (!this.shouldSendTrackingData(eventType, additionalData)) {
            console.log('📊 Skipping tracking data send - no significant changes');
            return;
        }

        // Create payload that matches Power Automate email template expectations EXACTLY
        const trackingPayload = {
            // Core fields that the email template expects - EXACT field names
            name: this.trackingData[this.STANDARD_FIELDS.firstName] && this.trackingData[this.STANDARD_FIELDS.lastName] 
                ? `${this.trackingData[this.STANDARD_FIELDS.firstName]} ${this.trackingData[this.STANDARD_FIELDS.lastName]}`.trim()
                : this.trackingData[this.STANDARD_FIELDS.fullName] || '',
            phone: this.trackingData[this.STANDARD_FIELDS.phone] || '',
            email: this.trackingData[this.STANDARD_FIELDS.email] || '',
            location: this.trackingData[this.STANDARD_FIELDS.address] || this.trackingData[this.STANDARD_FIELDS.city] || '',
            
            // Vehicle information - EXACT field names from template
            vehicleRego: this.trackingData[this.STANDARD_FIELDS.vehicleRego] || '',
            rego: this.trackingData[this.STANDARD_FIELDS.vehicleRego] || '', // Template expects both
            vehicleYear: this.trackingData[this.STANDARD_FIELDS.vehicleYear] || '',
            year: this.trackingData[this.STANDARD_FIELDS.vehicleYear] || '', // Template expects both
            vehicleMake: this.trackingData[this.STANDARD_FIELDS.vehicleMake] || '',
            make: this.trackingData[this.STANDARD_FIELDS.vehicleMake] || '', // Template expects both
            vehicleModel: this.trackingData[this.STANDARD_FIELDS.vehicleModel] || '',
            model: this.trackingData[this.STANDARD_FIELDS.vehicleModel] || '', // Template expects both
            vehicleType: this.trackingData[this.STANDARD_FIELDS.vehicleType] || '',
            batteryVoltage: this.trackingData[this.STANDARD_FIELDS.batteryVoltage] || '',
            selectedVoltage: this.trackingData[this.STANDARD_FIELDS.batteryVoltage] || '', // Template expects both
            
            // Service information - EXACT field names from template
            service: this.trackingData[this.STANDARD_FIELDS.serviceType] || '',
            serviceType: this.trackingData[this.STANDARD_FIELDS.serviceType] || '',
            serviceCode: this.trackingData[this.STANDARD_FIELDS.serviceCode] || '',
            serviceTitle: this.trackingData[this.STANDARD_FIELDS.serviceTitle] || '',
            emergencyType: this.trackingData[this.STANDARD_FIELDS.emergencyType] || '',
            urgencyLevel: this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || '',
            scheduledDate: this.trackingData[this.STANDARD_FIELDS.scheduledDate] || '',
            timeWindow: this.trackingData[this.STANDARD_FIELDS.timeWindow] || '',
            selectedTime: this.trackingData[this.STANDARD_FIELDS.timeWindow] || '', // Template expects both
            selectedUrgency: this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || '', // Template expects both
            
            // Pricing - EXACT field names from template
            price: this.trackingData[this.STANDARD_FIELDS.price] || this.trackingData[this.STANDARD_FIELDS.finalPrice] || this.trackingData[this.STANDARD_FIELDS.calculatedPrice] || '',
            basePrice: this.trackingData[this.STANDARD_FIELDS.price] || this.trackingData[this.STANDARD_FIELDS.finalPrice] || this.trackingData[this.STANDARD_FIELDS.calculatedPrice] || '',
            finalPrice: this.trackingData[this.STANDARD_FIELDS.finalPrice] || '',
            calculatedPrice: this.trackingData[this.STANDARD_FIELDS.calculatedPrice] || '',
            
            // Details
            details: this.trackingData[this.STANDARD_FIELDS.details] || '',
            description: this.trackingData[this.STANDARD_FIELDS.description] || '',
            
            // Seller information
            sellerName: this.trackingData[this.STANDARD_FIELDS.sellerName] || '',
            sellerPhone: this.trackingData[this.STANDARD_FIELDS.sellerPhone] || '',
            
            // WINZ fields
            isWinz: this.trackingData[this.STANDARD_FIELDS.isWinz] || false,
            isWinzService: this.trackingData[this.STANDARD_FIELDS.isWinz] || false,
            quoteReference: this.trackingData[this.STANDARD_FIELDS.quoteReference] || '',
            
            // Urgency and timing fields
            urgencyLevel: this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || 'standard',
            urgencyTitle: this.getUrgencyTitle(this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || 'standard'),
            timeWindow: this.getTimeWindow(this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || 'standard'),
            emergencyType: this.getEmergencyType(this.trackingData[this.STANDARD_FIELDS.urgencyLevel] || 'standard'),
            
            // Booking status and event type - EXACT field names from template
            bookingStatus: this.trackingData[this.STANDARD_FIELDS.bookingStatus] || 'NEW',
            eventType: eventType,
            
            // Session and tracking - EXACT field names from template
            sessionId: this.trackingData[this.STANDARD_FIELDS.sessionId] || '',
            gclid: this.trackingData.pageSource?.clickIds?.gclid || '',
            gclidState: this.trackingData.pageSource?.clickIds?.gclid ? 'Active' : 'Inactive',
            
            // UTM parameters - EXACT structure from template
            utm: {
                source: this.trackingData.pageSource?.utm?.source || '',
                medium: this.trackingData.pageSource?.utm?.medium || '',
                campaign: this.trackingData.pageSource?.utm?.campaign || '',
                term: this.trackingData.pageSource?.utm?.term || '',
                content: this.trackingData.pageSource?.utm?.content || ''
            },
            
            // Page source information - EXACT structure from template
            pageSource: {
                type: this.trackingData.pageSource?.type || 'direct',
                detail: this.trackingData.pageSource?.detail || 'Direct visit',
                referrer: this.trackingData.pageSource?.referrer || '',
                utm: this.trackingData.pageSource?.utm || {},
                clickIds: this.trackingData.pageSource?.clickIds || {}
            },
            
            // Device information - EXACT structure from template
            device: {
                userAgent: this.trackingData[this.STANDARD_FIELDS.userAgent] || navigator.userAgent,
                screenResolution: this.trackingData[this.STANDARD_FIELDS.screenResolution] || `${screen.width}x${screen.height}`,
                viewportSize: this.trackingData[this.STANDARD_FIELDS.viewportSize] || `${window.innerWidth}x${window.innerHeight}`,
                language: this.trackingData[this.STANDARD_FIELDS.language] || navigator.language,
                timezone: this.trackingData[this.STANDARD_FIELDS.timezone] || Intl.DateTimeFormat().resolvedOptions().timeZone,
                platform: this.detectDevicePlatform()
            },
            
            // Location information - EXACT structure from template
            location: {
                country: this.trackingData.location?.country || 'Unknown',
                region: this.trackingData.location?.region || 'Unknown',
                city: this.trackingData.location?.city || 'Unknown',
                postalCode: this.trackingData.location?.postalCode || 'Unknown',
                coordinates: {
                    latitude: this.trackingData.location?.coordinates?.latitude || null,
                    longitude: this.trackingData.location?.coordinates?.longitude || null,
                    accuracy: this.trackingData.location?.coordinates?.accuracy || null
                }
            },
            
            // Engagement data - EXACT structure from template
            engagement: {
                timeOnPage: this.trackingData.engagement?.timeOnPage || 0,
                scrollDepth: this.trackingData.engagement?.scrollDepth || 0,
                clicks: this.trackingData.engagement?.clicks || 0,
                formInteractions: this.trackingData.engagement?.formInteractions || 0,
                buttonClicks: this.trackingData.engagement?.buttonClicks || 0
            },
            
            // User journey - EXACT structure from template
            userJourney: {
                pageHistory: this.trackingData.userJourney || [],
                totalPages: this.trackingData.userJourney?.length || 1,
                sessionDuration: this.calculateSessionDuration(),
                entryPage: this.trackingData.userJourney?.[0]?.url || window.location.href,
                previousPage: this.trackingData.userJourney?.[this.trackingData.userJourney?.length - 2]?.url || ''
            },
            
            // Progress tracking - EXACT field names from template
            currentStep: this.trackingData.currentStep || 1,
            totalSteps: this.trackingData.totalSteps || 5,
            stepProgress: this.calculateStepProgress(),
            
            // Terms and consent - EXACT field names from template
            termsAccepted: this.trackingData.termsAccepted || false,
            marketingConsent: this.trackingData.marketingConsent || false,
            
            // Timestamps - EXACT field names from template
            timestamp: new Date().toISOString(),
            bookingTime: this.trackingData[this.STANDARD_FIELDS.bookingTime] || new Date().toISOString(),
            
            // Page data - EXACT field names from template
            pageUrl: this.trackingData[this.STANDARD_FIELDS.pageUrl] || window.location.href,
            pagePath: this.trackingData[this.STANDARD_FIELDS.pagePath] || window.location.pathname,
            pageTitle: this.trackingData[this.STANDARD_FIELDS.pageTitle] || document.title,
            
            // Additional data
            ...additionalData
        };

        console.log('📊 SENDING TRACKING DATA:', {
            eventType: eventType,
            payload: trackingPayload,
            payloadSize: JSON.stringify(trackingPayload).length
        });
        
        // Debug Google Ads data
        console.log('🎯 Google Ads Debug:', {
            gclid: trackingPayload.gclid,
            utm: trackingPayload.utm,
            pageSource: trackingPayload.pageSource
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
            } else {
                // Save current data as last sent data after successful send
                this.saveLastSentData(trackingPayload);
                console.log('💾 Saved tracking data for future comparison');
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

    /**
     * Update tracking data and send if significant changes
     */
    updateTrackingData(fieldName, value, eventType = 'data_update') {
        if (this.STANDARD_FIELDS[fieldName]) {
            this.trackingData[this.STANDARD_FIELDS[fieldName]] = value;
            console.log(`📊 Updated ${fieldName}:`, value);
            
            // Send immediately for significant data changes
            if (this.isSignificantField(fieldName)) {
                this.sendTrackingData(eventType, {
                    fieldName: fieldName,
                    value: value
                });
            }
        } else {
            console.warn(`Unknown field: ${fieldName}`);
        }
    }

    /**
     * Check if a field is significant enough to trigger immediate send
     */
    isSignificantField(fieldName) {
        const significantFields = [
            'fullName', 'phone', 'email', 'vehicleRego', 'vehicleYear', 
            'vehicleMake', 'vehicleModel', 'serviceType', 'serviceTitle', 
            'price', 'bookingStatus', 'eventType'
        ];
        return significantFields.includes(fieldName);
    }

    /**
     * Batch update multiple fields and send once
     */
    batchUpdateTrackingData(updates, eventType = 'batch_update') {
        let hasSignificantChanges = false;
        
        for (const [fieldName, value] of Object.entries(updates)) {
            if (this.STANDARD_FIELDS[fieldName]) {
                this.trackingData[this.STANDARD_FIELDS[fieldName]] = value;
                if (this.isSignificantField(fieldName)) {
                    hasSignificantChanges = true;
                }
            }
        }
        
        if (hasSignificantChanges) {
            this.sendTrackingData(eventType, updates);
        }
    }

    // Helper methods for urgency mapping
    getUrgencyTitle(urgencyLevel) {
        const titles = {
            'standard': 'Standard',
            'urgent': 'Urgent',
            'emergency': 'Emergency'
        };
        return titles[urgencyLevel] || 'Standard';
    }

    getTimeWindow(urgencyLevel) {
        const windows = {
            'standard': 'flexible',
            'urgent': 'same-day',
            'emergency': 'asap'
        };
        return windows[urgencyLevel] || 'flexible';
    }

    getEmergencyType(urgencyLevel) {
        const types = {
            'standard': '',
            'urgent': 'urgent_inspection',
            'emergency': 'emergency_inspection'
        };
        return types[urgencyLevel] || '';
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
