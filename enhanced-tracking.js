/**
 * Enhanced Tracking System for Maximum Data Value
 * Tracks page source, user journey, and comprehensive analytics across all pages
 */

class EnhancedTrackingManager {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.pageSource = this.detectPageSource();
        this.userJourney = this.initializeUserJourney();
        this.trackingData = this.initializeTrackingData();
        this.init();
    }

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
        
        console.log('🚀 Enhanced Tracking initialized');
        console.log('📊 Page Source:', this.pageSource);
        console.log('🆔 Session ID:', this.sessionId);
    }

    /**
     * Get or create session ID
     */
    getOrCreateSessionId() {
        let sid = localStorage.getItem("eek_session_id");
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("eek_session_id", sid);
        }
        return sid;
    }

    /**
     * Detect page source (referrer, UTM, direct, etc.)
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
                source: utmSource,
                medium: utmMedium,
                campaign: utmCampaign,
                term: urlParams.get('utm_term'),
                content: urlParams.get('utm_content')
            },
            clickIds: {
                gclid: gclid,
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
        
        // Add current page to journey
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
     * Initialize comprehensive tracking data
     */
    initializeTrackingData() {
        const geo = window.CF_GEO || {};
        const urlParams = new URLSearchParams(window.location.search);
        
        return {
            // Session data
            sessionId: this.sessionId,
            pageSource: this.pageSource,
            userJourney: this.userJourney,
            
            // Page data
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            pageType: this.detectPageType(),
            
            // User data
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Geolocation data
            location: {
                country: geo.country || 'Unknown',
                countryCode: geo.countryCode || 'Unknown',
                region: geo.region || 'Unknown',
                regionCode: geo.regionCode || 'Unknown',
                city: geo.city || 'Unknown',
                postalCode: geo.postalCode || 'Unknown',
                continent: geo.continent || 'Unknown',
                coordinates: {
                    latitude: geo.latitude || null,
                    longitude: geo.longitude || null,
                    accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
                },
                timezone: geo.timezone || 'Unknown',
                raw: geo
            },
            
            // Marketing data
            utm: this.pageSource.utm,
            clickIds: this.pageSource.clickIds,
            
            // Timestamps
            timestamp: new Date().toISOString(),
            visitStart: new Date().toISOString(),
            
            // Engagement data
            engagement: {
                scrollDepth: 0,
                timeOnPage: 0,
                clicks: 0,
                formInteractions: 0,
                buttonClicks: 0
            }
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
        return 'other';
    }

    /**
     * Track page view with enhanced data
     */
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: this.trackingData.pageTitle,
                page_location: this.trackingData.pageUrl,
                page_path: this.trackingData.pagePath,
                page_type: this.trackingData.pageType,
                source_type: this.trackingData.pageSource.type,
                source_detail: this.trackingData.pageSource.detail,
                session_id: this.trackingData.sessionId,
                user_journey_length: this.trackingData.userJourney.length
            });
        }

        if (typeof rdt !== 'undefined') {
            rdt('track', 'PageVisit', {
                pageType: this.trackingData.pageType,
                sourceType: this.trackingData.pageSource.type,
                sessionId: this.trackingData.sessionId
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
                session_id: this.trackingData.sessionId
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
                session_id: this.trackingData.sessionId
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
     * Track custom events
     */
    trackEvent(eventName, category, label, additionalData = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: category,
                event_label: label,
                session_id: this.trackingData.sessionId,
                page_type: this.trackingData.pageType,
                source_type: this.trackingData.pageSource.type,
                ...additionalData
            });
        }

        if (typeof rdt !== 'undefined') {
            rdt('track', 'Custom', {
                customEventName: eventName,
                eventCategory: category,
                eventLabel: label,
                sessionId: this.trackingData.sessionId,
                ...additionalData
            });
        }

        console.log(`📊 Tracked: ${eventName} (${category}) - ${label}`);
    }

    /**
     * Send tracking data to Power Automate API
     */
    async sendTrackingData(eventType, additionalData = {}) {
        const POWER_AUTOMATE_URL = 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q';
        
        const trackingPayload = {
            ...this.trackingData,
            eventType: eventType,
            ...additionalData
        };

        try {
            await fetch(POWER_AUTOMATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trackingPayload)
            });
        } catch (error) {
            console.error('Tracking API Error:', error);
        }
    }

    /**
     * Get comprehensive tracking data
     */
    getTrackingData() {
        return this.trackingData;
    }
}

// Initialize enhanced tracking
window.enhancedTracking = new EnhancedTrackingManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedTrackingManager;
}
