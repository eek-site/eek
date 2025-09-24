/**
 * Eek Mobile Mechanical - Master Configuration & Shared Functions
 * This file contains all shared functionality across the website
 * Include this file on every page to ensure consistency
 */

// === INJECT COMPREHENSIVE STYLE GUIDE ===
function injectMasterStyles() {
    if (document.getElementById('eek-master-styles')) return; // Already injected
    
    // Check if style guide is already loaded
    const existingStyleGuide = document.querySelector('link[href*="eek-style-guide"]') || 
                               document.getElementById('eek-style-guide');
    
    if (existingStyleGuide) {
        console.log('📋 Style guide already loaded');
        return;
    }
    
    // Try to load external style guide first
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/eek-style-guide.css';
    link.id = 'eek-style-guide-link';
    
    // If external file fails, inject critical styles
    link.onerror = function() {
        injectFallbackStyles();
    };
    
    document.head.appendChild(link);
    console.log('📋 Style guide linked');
}

function injectFallbackStyles() {
    if (document.getElementById('eek-master-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'eek-master-styles';
    style.textContent = `
        /* Critical fallback styles */
        :root {
            --eek-primary: #ff5500;
            --eek-primary-hover: #e64a00;
            --eek-success: #28a745;
            --eek-success-hover: #20a142;
            --eek-bg-body: #f5f5f5;
            --eek-bg-white: #ffffff;
            --eek-text: #333;
            --eek-shadow-md: 0 4px 8px rgba(0,0,0,0.1);
            --eek-radius-lg: 12px;
            --eek-radius-full: 50px;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--eek-bg-body);
            color: var(--eek-text);
            margin: 0;
            padding: 0 0 80px 0;
        }
        
        /* Sticky Call Button */
        .sticky-call, .eek-sticky-button {
            position: fixed;
            bottom: 15px;
            right: 15px;
            background-color: var(--eek-primary);
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: var(--eek-radius-full);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-call:hover, .eek-sticky-button:hover {
            background-color: var(--eek-primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        .sticky-payment, .eek-sticky-payment {
            position: fixed;
            bottom: 15px;
            right: 150px;
            background-color: var(--eek-success);
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: var(--eek-radius-full);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-payment:hover, .eek-sticky-payment:hover {
            background-color: var(--eek-success-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        /* Business Hours Banner */
        .after-hours-banner, .eek-banner {
            background: linear-gradient(135deg, #ff3333, #ff5500);
            color: white;
            padding: 20px;
            margin: 0 auto 20px;
            max-width: 800px;
            border-radius: var(--eek-radius-lg);
            box-shadow: 0 4px 12px rgba(255,51,51,0.3);
            animation: eek-pulse 2s infinite;
            display: none;
            text-align: center;
        }
        
        @keyframes eek-pulse {
            0%, 100% { box-shadow: 0 4px 12px rgba(255,51,51,0.3); }
            50% { box-shadow: 0 4px 20px rgba(255,51,51,0.5); }
        }
        
        .after-hours-banner h2, .eek-banner h2 {
            margin: 0 0 10px 0;
            font-size: 1.6em;
        }
        
        .after-hours-banner p, .eek-banner p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .sticky-call, .eek-sticky-button {
                font-size: 1em;
                padding: 12px 18px;
                bottom: 10px;
                right: 10px;
            }
            
            .sticky-payment, .eek-sticky-payment {
                font-size: 1em;
                padding: 12px 18px;
                bottom: 10px;
                right: 120px;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('📋 Fallback styles injected');
}

// === LOGO MANAGEMENT ===
function getLogoForPageType() {
    const currentPath = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('service');
    
    console.log('🔍 Determining logo for path:', currentPath, 'service:', serviceType);
    
    // Pre-purchase inspection pages use lemon logo
    if (currentPath.includes('inspection') || 
        currentPath.includes('pre-purchase') ||
        serviceType === 'inspection') {
        return { file: 'lemon.png', class: 'lemon', type: 'Pre-Purchase Inspection' };
    }
    
    // Inquiry/support pages use sweet-ride logo
    if (currentPath.includes('more-options') ||
        currentPath.includes('customer-escalation') ||
        currentPath.includes('supplier') ||
        currentPath.includes('apply') ||
        currentPath.includes('contact') ||
        currentPath.includes('support')) {
        return { file: 'sweet-ride.png', class: 'sweet-ride', type: 'Inquiry/Support' };
    }
    
    // Index page and booking steps use brand-image (default)
    // This includes: /, /book-service, /rescue-me, etc.
    return { file: 'brand-image.png', class: 'brand-image', type: 'Main/Booking' };
}

async function detectAndUpdateLogo() {
    const logoImages = document.querySelectorAll('.eek-brand-image, img[src*="brand-image"], img[src*="sweet-ride"], img[src*="lemon"]');
    
    if (logoImages.length === 0) {
        console.log('ℹ️ No logo images found on page');
        return;
    }
    
    const logoInfo = getLogoForPageType();
    console.log('🎯 Selected logo:', logoInfo.file, 'for page type:', logoInfo.type);
    
    for (let img of logoImages) {
        // If image already has the correct src, skip
        if (img.src && img.src.endsWith(logoInfo.file)) {
            console.log('✅ Logo already correct:', img.src);
            continue;
        }
        
        try {
            // Test if the selected logo file exists
            const testImg = new Image();
            
            await new Promise((resolve, reject) => {
                testImg.onload = function() {
                    // Update the logo
                    img.src = logoInfo.file;
                    img.alt = `Eek Mobile Mechanical - Mobile Mechanic Services`;
                    
                    // Remove old logo classes
                    img.classList.remove('brand-image', 'sweet-ride', 'lemon');
                    // Add appropriate class
                    img.classList.add(logoInfo.class);
                    
                    console.log('🖼️ Logo updated to:', logoInfo.file, 'class:', logoInfo.class);
                    resolve();
                };
                
                testImg.onerror = function() {
                    console.warn('❌ Logo file not found:', logoInfo.file, '- falling back to brand-image.png');
                    
                    // Fallback to brand-image if selected logo doesn't exist
                    if (logoInfo.file !== 'brand-image.png') {
                        img.src = 'brand-image.png';
                        img.classList.remove('sweet-ride', 'lemon');
                        img.classList.add('brand-image');
                        console.log('🔄 Fallback logo applied: brand-image.png');
                    }
                    resolve();
                };
                
                testImg.src = logoInfo.file;
            });
            
        } catch (error) {
            console.error('❌ Error updating logo:', error);
        }
    }
}
function initializeRedditPixel() {
    if (window.rdt) return; // Already initialized
    
    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}
    (window,document);
    
    window.rdt('init', 'a2_hf16791nsdhx');
    // Note: PageVisit tracking moved to trackPageView() function to prevent duplicates
    
    console.log('📊 Reddit Pixel initialized (PageVisit will be tracked by trackPageView)');
}

// === CONFIGURATION ===
const EEK_CONFIG = {
    // API Endpoints
    TRACKING_API_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4",
    SYSTEM_STATUS_API_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17b1d2990e6f4082a2b0d9c2f1a29025/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bPyoxJ24kuxJZOyLGAclGaEuH6BHwUTFaGmYOwHofa8",
    FIRST_VISIT_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4",
    
    // Phone Numbers
    PHONE_NUMBERS: {
        default: {
            tel: 'tel:0800769000',
            display: '0800 769 000'
        },
        tracking: {
            tel: 'tel:0800447153', 
            display: '0800 447 153'
        }
    },
    
    // Business Hours (NZ Time)
    BUSINESS_HOURS: {
        weekdays: { start: 7, end: 17 }, // 7 AM - 5 PM
        weekends: { start: 7, end: 12 }  // 7 AM - 12 PM
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        sessionId: "eek_session_id",
        gclid: "eek_gclid",
        gclidTimestamp: "eek_gclid_timestamp",
        phonePreference: "eek_phone_preference",
        firstVisitSent: "eek_first_visit_sent"
    },
    
    // Service Values for tracking (in cents)
    SERVICE_VALUES: {
        'inspection_call': 19900,
        'breakdown_call': 28900,
        'battery_call': 14900,
        'fuel_drain_call': 39900,
        'header_call': 25000,
        'sticky_call': 25000,
        'more_options_call': 25000,
        'customer_call': 25000,
        'emergency_rescue': 35000,
        'customer_emergency': 35000,
        'find_me_tool': 15000,
        'customer_find_me': 15000,
        'customer_support': 10000,
        'supplier_portal': 5000,
        'supplier_relations': 5000,
        'employment_apply': 8000,
        'utility_maps': 5000,
        'book_online_after_hours': 20000,
        'customer_book_online': 20000,
        'after_hours_emergency': 35000,
        'breakdown_after_hours': 35000,
        'battery_after_hours': 20000,
        'fuel_drain_after_hours': 45000,
        'inspection_after_hours': 25000
    },
    
    // Service Type Mapping
    SERVICE_TYPES: {
        'inspection_call': 'Pre-Purchase Inspection',
        'breakdown_call': 'Emergency Breakdown',
        'battery_call': 'Battery Jump Start',
        'fuel_drain_call': 'Wrong Fuel Rescue',
        'header_call': 'General Inquiry',
        'sticky_call': 'General Inquiry',
        'more_options_call': 'General Inquiry',
        'customer_call': 'General Inquiry',
        'emergency_rescue': 'Emergency Service',
        'customer_emergency': 'Emergency Service',
        'find_me_tool': 'Location Service',
        'customer_find_me': 'Location Service',
        'customer_support': 'Customer Support',
        'after_hours_emergency': 'After Hours Emergency',
        'breakdown_after_hours': 'After Hours Breakdown',
        'battery_after_hours': 'After Hours Battery',
        'fuel_drain_after_hours': 'After Hours Fuel Drain',
        'inspection_after_hours': 'After Hours Inspection'
    }
};

// === GLOBAL STATE ===
let EEK_STATE = {
    sessionId: null,
    gclid: null,
    utmData: {},
    hasPaymentToken: false,
    systemActive: true,
    duringBusinessHours: false
};

// === TRACKING AND ANALYTICS ===
function buildTrackingPayload(eventType, eventAction, additionalData = {}) {
    const urlParams = new URLSearchParams(window.location.search);
    const now = new Date();
    
    return {
        eventType: eventType,
        eventAction: eventAction,
        timestamp: now.toISOString(),
        
        // Session & Identity Data
        sessionId: EEK_STATE.sessionId,
        gclid: EEK_STATE.gclid,
        hasCurrentGclid: !!urlParams.get('gclid'),
        hasCurrentToken: !!urlParams.get('token'),
        hasStoredGclid: !!localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid),
        gclidAge: getGCLIDAgeInDays(),
        phoneNumberType: getDisplayPhoneNumber() === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default',
        
        // Page Context (Enhanced)
        page: {
            title: document.title,
            url: window.location.href,
            path: window.location.pathname,
            hash: window.location.hash,
            search: window.location.search,
            referrer: document.referrer || null,
            domain: window.location.hostname,
            protocol: window.location.protocol,
            viewport: {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight
            },
            scroll: {
                x: window.pageXOffset || document.documentElement.scrollLeft,
                y: window.pageYOffset || document.documentElement.scrollTop,
                maxX: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
                maxY: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
            }
        },
        
        // Business Context
        business: {
            systemActive: EEK_STATE.systemActive,
            duringBusinessHours: EEK_STATE.duringBusinessHours,
            nzTime: new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"}),
            dayOfWeek: now.getDay(), // 0=Sunday, 6=Saturday
            hourOfDay: now.getHours(),
            isWeekend: (now.getDay() === 0 || now.getDay() === 6)
        },
        
        // UTM & Marketing Data (Enhanced)
        utm: {
            ...EEK_STATE.utmData,
            // Add any missing UTM from current URL
            utm_source: urlParams.get('utm_source') || EEK_STATE.utmData.utm_source || null,
            utm_medium: urlParams.get('utm_medium') || EEK_STATE.utmData.utm_medium || null,
            utm_campaign: urlParams.get('utm_campaign') || EEK_STATE.utmData.utm_campaign || null,
            utm_term: urlParams.get('utm_term') || EEK_STATE.utmData.utm_term || null,
            utm_content: urlParams.get('utm_content') || EEK_STATE.utmData.utm_content || null,
            // Additional marketing parameters
            fbclid: urlParams.get('fbclid') || null,
            msclkid: urlParams.get('msclkid') || null,
            ttclid: urlParams.get('ttclid') || null
        },
        
        // Device & Browser Info (Maximum Detail)
        device: {
            userAgent: navigator.userAgent,
            platform: navigator.platform || null,
            language: navigator.language || null,
            languages: navigator.languages || [],
            mobile: /Mobi|Android/i.test(navigator.userAgent),
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            onLine: navigator.onLine,
            vendor: navigator.vendor || null,
            vendorSub: navigator.vendorSub || null,
            screen: {
                width: window.screen ? window.screen.width : null,
                height: window.screen ? window.screen.height : null,
                availWidth: window.screen ? window.screen.availWidth : null,
                availHeight: window.screen ? window.screen.availHeight : null,
                colorDepth: window.screen ? window.screen.colorDepth : null,
                pixelDepth: window.screen ? window.screen.pixelDepth : null,
                pixelRatio: window.devicePixelRatio || 1,
                orientation: window.screen && window.screen.orientation ? window.screen.orientation.angle : null
            }
        },
        
        // Performance Data
        performance: {
            navigationStart: performance.navigationStart || null,
            loadEventEnd: performance.loadEventEnd || null,
            domContentLoadedEventEnd: performance.domContentLoadedEventEnd || null,
            responseEnd: performance.responseEnd || null,
            domainLookupStart: performance.domainLookupStart || null,
            domainLookupEnd: performance.domainLookupEnd || null,
            connectStart: performance.connectStart || null,
            connectEnd: performance.connectEnd || null,
            requestStart: performance.requestStart || null,
            responseStart: performance.responseStart || null,
            domLoading: performance.domLoading || null,
            domInteractive: performance.domInteractive || null,
            domComplete: performance.domComplete || null,
            loadEventStart: performance.loadEventStart || null,
            timing: performance.timing ? {
                dns: performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
                connection: performance.timing.connectEnd - performance.timing.connectStart,
                response: performance.timing.responseEnd - performance.timing.responseStart,
                domProcessing: performance.timing.domComplete - performance.timing.domLoading,
                totalLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
            } : null
        },
        
        // Connection Info
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType || null,
            type: navigator.connection.type || null,
            downlink: navigator.connection.downlink || null,
            rtt: navigator.connection.rtt || null,
            saveData: navigator.connection.saveData || false
        } : null,
        
        // Storage & Privacy
        storage: {
            localStorageAvailable: isLocalStorageAvailable(),
            sessionStorageAvailable: isSessionStorageAvailable(),
            cookiesEnabled: navigator.cookieEnabled,
            thirdPartyCookiesBlocked: await testThirdPartyCookies()
        },
        
        // Source & Attribution
        source: window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
        formVersion: '2.1',
        
        // Visit Context
        visit: {
            isFirstVisit: !localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent),
            sessionDuration: Date.now() - getSessionStartTime(),
            pageLoadTime: Date.now() - performance.navigationStart,
            timeOnCurrentPage: Date.now() - getPageStartTime(),
            previousPage: getPreviousPage(),
            visitCount: getVisitCount(),
            pageViewCount: getPageViewCount()
        },
        
        // Feature Detection
        features: {
            webgl: !!window.WebGLRenderingContext,
            webgl2: !!window.WebGL2RenderingContext,
            canvas: !!document.createElement('canvas').getContext,
            localStorage: isLocalStorageAvailable(),
            sessionStorage: isSessionStorageAvailable(),
            geolocation: !!navigator.geolocation,
            touchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            serviceWorker: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window,
            webAssembly: typeof WebAssembly === 'object'
        },
        
        // Additional data
        ...additionalData
    };
}

async function sendTrackingEvent(payload) {
    try {
        const response = await fetch(EEK_CONFIG.TRACKING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true
        });
        
        console.log(`📡 Tracking event sent: ${payload.eventAction} (Status: ${response.status})`);
        return response.ok;
    } catch (error) {
        console.error('❌ Tracking event failed:', error);
        return false;
    }
}

function trackConversion(eventAction, eventCategory = 'Contact') {
    const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const eventValue = EEK_CONFIG.SERVICE_VALUES[eventAction] || 25000;
    const serviceType = EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
    
    console.log('🎯 Conversion tracked:', eventAction, 'Value:', eventValue);
    
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventAction, {
            'event_category': eventCategory,
            'event_label': serviceType,
            'value': eventValue / 100, // Convert to dollars
            'gclid': EEK_STATE.gclid
        });
        
        // Track phone calls as conversions
        if (eventAction.includes('call')) {
            gtag('event', 'conversion', {
                'send_to': 'AW-17084465163/7Mh8CKFRydsaEIuAwJI_'
            });
        }
    }
    
    // Reddit Pixel tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'Lead', {
            'customEventName': eventAction,
            'conversionId': conversionId,
            'value': eventValue,
            'currency': 'NZD',
            'itemCount': 1,
            'eventSource': window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
            'eventCategory': eventCategory,
            'serviceType': serviceType,
            'gclid': EEK_STATE.gclid
        });
    }
    
    // Send to our tracking API with enhanced conversion data
    const payload = buildTrackingPayload('conversion', eventAction, {
        conversionId: conversionId,
        eventValue: eventValue,
        eventValueDollars: eventValue / 100,
        serviceType: serviceType,
        eventCategory: eventCategory,
        currency: 'NZD',
        
        // Conversion context
        conversionContext: {
            timeToConversion: Date.now() - getPageStartTime(),
            sessionTimeToConversion: Date.now() - getSessionStartTime(),
            pageScrollPosition: window.pageYOffset || document.documentElement.scrollTop,
            pageScrollPercentage: Math.round(((window.pageYOffset || document.documentElement.scrollTop) / 
                Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)) * 100),
            clickedFromSection: getClickedSection(),
            visibleElements: getVisibleElements()
        },
        
        // Attribution data
        attribution: {
            firstTouch: getFirstTouchAttribution(),
            lastTouch: getLastTouchAttribution(),
            touchpointCount: getTouchpointCount(),
            daysSinceFirstVisit: getDaysSinceFirstVisit(),
            sessionsSinceFirstVisit: getSessionsSinceFirstVisit()
        },
        
        // Conversion funnel data
        funnel: {
            landingPage: getFirstVisitPage(),
            pagesVisitedThisSession: getPagesVisitedThisSession(),
            totalPageViews: getPageViewCount(),
            bounceCandidate: getPageViewCount() === 1,
            timeOnSite: Date.now() - getSessionStartTime(),
            interactionsBeforeConversion: getInteractionCount()
        }
    });
    
    sendTrackingEvent(payload);
}

function trackInteraction(element) {
    const trackingAction = element.dataset.track;
    const linkUrl = element.href;
    const linkText = element.textContent.trim();
    
    if (!trackingAction) {
        console.warn('⚠️ Element missing data-track attribute');
        return;
    }
    
    console.log('👆 Interaction tracked:', trackingAction);
    
    // Increment interaction count
    incrementInteractionCount();
    
    // Build event payload with enhanced interaction data
    const payload = buildTrackingPayload('user_interaction', trackingAction, {
        element: {
            tag: element.tagName.toLowerCase(),
            text: linkText,
            href: linkUrl,
            className: element.className,
            id: element.id || null,
            dataset: element.dataset || {}
        },
        interactionType: element.href && element.href.startsWith('tel:') ? 'phone_call' : 'link_click',
        
        // Interaction context
        interactionContext: {
            clickPosition: getClickPosition(element),
            elementVisible: isElementVisible(element),
            timeOnPageBeforeClick: Date.now() - getPageStartTime(),
            interactionSequence: getInteractionCount(),
            scrollPositionAtClick: window.pageYOffset || document.documentElement.scrollTop
        }
    });
    
    // Send tracking event
    sendTrackingEvent(payload);
    
    // If it's a phone call, track as conversion
    if (trackingAction.includes('call') || (element.href && element.href.startsWith('tel:'))) {
        trackConversion(trackingAction, 'Contact');
    }
}

// Helper functions for interaction tracking
function getClickPosition(element) {
    try {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
        };
    } catch (e) {
        return null;
    }
}

function isElementVisible(element) {
    try {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 && 
               rect.left < window.innerWidth && rect.right > 0;
    } catch (e) {
        return false;
    }
}

function trackPageView() {
    // Update previous page tracking
    localStorage.setItem('eek_previous_page', window.location.href);
    
    const firstVisitSent = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent);
    const isFirstVisit = !firstVisitSent;
    
    // Single unified event with all tracking data
    const payload = buildTrackingPayload('page_visit', 'page_loaded', {
        pageType: window.location.pathname.includes('more-options') ? 'more_options' : 'main',
        loadTime: Date.now() - performance.navigationStart,
        isFirstVisit: isFirstVisit,
        landingPage: isFirstVisit ? window.location.href : null,
        visitType: isFirstVisit ? 'first_visit' : 'return_visit',
        timestamp: new Date().toISOString(),
        
        // Enhanced page-specific data
        pageSpecific: {
            hasServiceSelection: !!document.querySelector('#service-selection'),
            hasPaymentBlock: !!document.getElementById('stripePaymentBlock'),
            hasClosedBanner: !!document.getElementById('closedBanner'),
            phoneLinksCount: document.querySelectorAll('.phone-link').length,
            serviceLinksCount: document.querySelectorAll('.service-link').length,
            logoType: getLogoForPageType().type,
            elementsWithTracking: document.querySelectorAll('[data-track]').length
        }
    });
    
    sendTrackingEvent(payload);
    
    // Mark first visit as sent if this was a first visit
    if (isFirstVisit) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent, new Date().toISOString());
        console.log('🆕 First visit data included in unified page visit event');
    }
    
    // Google Analytics page view tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': document.title,
            'page_location': window.location.href,
            'gclid': EEK_STATE.gclid
        });
    }
    
    // Reddit Pixel page visit tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'PageVisit');
        console.log('📊 Reddit Pixel PageVisit tracked');
    }
}

// Set up scroll tracking
function setupScrollTracking() {
    let scrollTracked = false;
    
    window.addEventListener('scroll', function() {
        if (!scrollTracked && window.scrollY > document.body.scrollHeight * 0.5) {
            scrollTracked = true;
            
            const payload = buildTrackingPayload('user_engagement', 'scroll_50_percent', {
                scrollDepth: '50%',
                pageHeight: document.body.scrollHeight
            });
            
            sendTrackingEvent(payload);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll', {
                    'event_category': 'Engagement',
                    'event_label': 'Scrolled 50% of page'
                });
            }
            
            if (typeof rdt !== 'undefined') {
                rdt('track', 'ViewContent', {
                    'customEventName': 'scroll_50_percent',
                    'eventCategory': 'Engagement'
                });
            }
        }
    });
}

// Set up time on page tracking
function setupTimeTracking() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Date.now() - startTime;
        const payload = buildTrackingPayload('user_engagement', 'time_on_page', {
            timeOnPage: timeOnPage,
            timeOnPageSeconds: Math.round(timeOnPage / 1000)
        });
        
        sendTrackingEvent(payload);
    });
}

// === PHONE NUMBER MANAGEMENT ===
function getDisplayPhoneNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    // PRIORITY 1: Current URL GCLID (always takes precedence)
    if (currentGclid) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'tracking');
        console.log('📞 Using tracking number (current URL GCLID):', currentGclid);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 2: Payment token users get tracking number
    if (currentToken) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'tracking');
        console.log('📞 Using tracking number (payment token):', currentToken);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 3: Check if there's a valid stored GCLID
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    if (storedGclid && isGCLIDValid()) {
        console.log('📞 Using tracking number (stored valid GCLID):', storedGclid);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 4: Default number for all other cases
    localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'default');
    console.log('📞 Using default number (no valid GCLID or token)');
    return EEK_CONFIG.PHONE_NUMBERS.default;
}

function updatePhoneNumbers() {
    const phoneData = getDisplayPhoneNumber();
    
    console.log('📞 Updating phone numbers to:', phoneData.display, 'Tel:', phoneData.tel);
    
    // Update all phone links
    document.querySelectorAll('.phone-link').forEach((link, index) => {
        link.href = phoneData.tel;
        console.log(`  Updated phone link ${index}:`, link.href);
    });
    
    // Update phone display text - preserve special text like "Eek Now"
    document.querySelectorAll('.phone-display').forEach((span, index) => {
        console.log(`  Phone display ${index} before:`, span.textContent);
        if (span.textContent === 'Eek Now' || span.textContent.includes('Eek')) {
            console.log(`  Keeping special text: "${span.textContent}"`);
            return; // Keep sticky button text unchanged
        }
        span.textContent = phoneData.display;
        console.log(`  Phone display ${index} after:`, span.textContent);
    });
    
    console.log('📞 Phone numbers updated to:', phoneData.display);
    
    // Update debug info if present
    const debugPhoneEl = document.getElementById('debugPhonePreference');
    if (debugPhoneEl) {
        debugPhoneEl.textContent = phoneData === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default';
    }
}

// === GCLID MANAGEMENT ===
function isGCLIDValid() {
    const storedTimestamp = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
    if (!storedTimestamp) return false;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(storedTimestamp) > thirtyDaysAgo;
}

function getGCLID() {
    const urlParams = new URLSearchParams(window.location.search);
    let gclidValue = urlParams.get('gclid');
    
    // PRIORITY 1: If GCLID in current URL, use it and store it
    if (gclidValue) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclid, gclidValue);
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp, new Date().toISOString());
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, "tracking");
        console.log('✅ GCLID captured from current URL:', gclidValue);
        return gclidValue;
    }
    
    // PRIORITY 2: Try to get stored GCLID (only if still valid)
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    
    if (storedGclid && isGCLIDValid()) {
        console.log('📋 Using stored valid GCLID:', storedGclid);
        return storedGclid;
    } else if (storedGclid) {
        // GCLID expired - clean it up
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclid);
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.phonePreference);
        console.log('⚠️ GCLID expired and removed');
    }
    
    return null;
}

// === SESSION MANAGEMENT ===
function getOrCreateSessionId() {
    let sid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.sessionId);
    
    if (!sid) {
        // Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        sid = urlParams.get('session_id');
        
        if (sid) {
            localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.sessionId, sid);
            console.log('🔄 Session ID restored from URL');
        } else {
            // Create new session ID
            sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.sessionId, sid);
            console.log('🆕 New session ID created');
        }
    } else {
        console.log('✅ Existing session ID found');
    }
    
    return sid;
}

// === BUSINESS HOURS ===
function isWithinBusinessHours() {
    const nzTime = new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"});
    const now = new Date(nzTime);
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const time = hour + minutes / 60;
    
    let isOpen = false;
    
    // Monday-Friday: 7:00 AM - 5:00 PM (NZ time)
    if (day >= 1 && day <= 5) {
        isOpen = time >= EEK_CONFIG.BUSINESS_HOURS.weekdays.start && 
                 time < EEK_CONFIG.BUSINESS_HOURS.weekdays.end;
    }
    
    // Saturday-Sunday: 7:00 AM - 12:00 PM (NZ time)
    if (day === 0 || day === 6) {
        isOpen = time >= EEK_CONFIG.BUSINESS_HOURS.weekends.start && 
                 time < EEK_CONFIG.BUSINESS_HOURS.weekends.end;
    }
    
    console.log('🕒 Business hours check:', isOpen ? 'OPEN' : 'CLOSED', `(${now.toLocaleString()} NZ Time)`);
    
    return isOpen;
}

// === SYSTEM STATUS ===
async function checkSystemStatus() {
    try {
        console.log('🔄 Checking system status...');
        
        const response = await fetch(EEK_CONFIG.SYSTEM_STATUS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}),
            cache: "no-store",
            timeout: 10000
        });
        
        if (response.ok) {
            const data = await response.json();
            const isActive = data.state === 'Active';
            console.log('✅ System status check successful:', isActive ? 'ACTIVE' : 'INACTIVE');
            return isActive;
        } else {
            console.warn('⚠️ System status API returned non-OK status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error checking system status:', error);
    }
    
    // Default to active if check fails
    console.log('🔄 Defaulting to ACTIVE due to API failure');
    return true;
}

// === PAYMENT TOKEN HANDLING ===
function hasPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get('token');
}

function getPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// === URL PARAMETER UTILITIES ===
function buildTrackingParams() {
    const params = new URLSearchParams();
    const urlParams = new URLSearchParams(window.location.search);
    
    // Preserve payment token if present
    const token = urlParams.get('token');
    if (token) {
        params.set('token', token);
    }
    
    // Preserve GCLID if present
    const gclid = urlParams.get('gclid');
    if (gclid) {
        params.set('gclid', gclid);
    }
    
    // Preserve UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            params.set(param, value);
        }
    });
    
    // Add session ID for tracking continuity
    const sessionId = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.sessionId);
    if (sessionId) {
        params.set('session_id', sessionId);
    }
    
    return params.toString();
}

function getUTMData() {
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {};
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    // Check URL parameters
    utmParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            utm[param] = value;
            // Store for future use
            localStorage.setItem(`eek_${param}`, value);
        }
    });
    
    // Fill in from localStorage if not in URL
    utmParams.forEach(param => {
        if (!utm[param]) {
            const stored = localStorage.getItem(`eek_${param}`);
            if (stored) {
                utm[param] = stored;
            }
        }
    });
    
    return utm;
}

// === MASTER UI UPDATE FUNCTION ===
async function updateUIState() {
    console.log('🔄 Starting master UI state update...');
    
    // Update global state - check current URL parameters FIRST
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    // Always update stored GCLID state for phone number management
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    console.log('🔍 URL Parameter Check:', {
        currentUrlGclid: currentGclid,
        currentUrlToken: currentToken,
        storedGclid: EEK_STATE.gclid,
        hasPaymentToken: EEK_STATE.hasPaymentToken
    });
    
    // System status logic - ONLY based on current URL parameters
    if (currentGclid || currentToken) {
        EEK_STATE.systemActive = true;
        console.log('🎯 Current URL GCLID or Token detected - forcing system active');
    } else {
        EEK_STATE.systemActive = await checkSystemStatus();
        console.log('🔄 No current URL params - checking system status via API');
    }
    
    EEK_STATE.duringBusinessHours = isWithinBusinessHours();
    
    console.log('📊 Master State:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasCurrentGclid: !!currentGclid,
        hasCurrentToken: !!currentToken,
        hasStoredGclid: !!EEK_STATE.gclid
    });
    
    // Update phone numbers FIRST (before other UI elements)
    updatePhoneNumbers();
    
    // Update banners and buttons
    updateBanners();
    updateButtons();
    updateStickyButtons();
    updatePaymentUI();
    
    console.log('✅ Master UI state update completed');
}

// === BANNER MANAGEMENT ===
function updateBanners() {
    const closedBanner = document.getElementById('closedBanner');
    const stripePaymentBlock = document.getElementById('stripePaymentBlock');
    
    // For payment token users, show only the Stripe payment block
    if (EEK_STATE.hasPaymentToken) {
        // Show Stripe payment block for token users
        if (stripePaymentBlock) {
            stripePaymentBlock.style.display = 'block';
            console.log('💳 Showing Stripe payment block for token user');
        }
        
        // Hide closed banner for token users
        if (closedBanner) closedBanner.style.display = 'none';
        
        return;
    }
    
    // Hide Stripe payment block for non-token users
    if (stripePaymentBlock) {
        stripePaymentBlock.style.display = 'none';
    }
    
    // Closed banner logic for non-token users
    if (closedBanner) {
        if (EEK_STATE.gclid) {
            closedBanner.style.display = 'none';
            console.log('🎯 Hiding closed banner (gclid user)');
        } else if (!EEK_STATE.systemActive) {
            closedBanner.style.display = 'block';
            updateClosedBannerContent();
            console.log('🕐 Showing closed banner');
        } else {
            closedBanner.style.display = 'none';
            console.log('✅ Hiding closed banner (system active)');
        }
    }
}

function updateClosedBannerContent() {
    const closedTitle = document.getElementById('closedTitle');
    const afterHoursMessage = document.getElementById('afterHoursMessage');
    const tempUnavailableMessage = document.getElementById('tempUnavailableMessage');
    
    if (EEK_STATE.duringBusinessHours) {
        if (closedTitle) closedTitle.innerHTML = '🚧 PHONE LINES BUSY';
        if (afterHoursMessage) afterHoursMessage.style.display = 'none';
        if (tempUnavailableMessage) tempUnavailableMessage.style.display = 'block';
        const closedBanner = document.getElementById('closedBanner');
        if (closedBanner) closedBanner.style.background = 'linear-gradient(135deg, #ff8c00, #ff6b00)';
    } else {
        if (closedTitle) closedTitle.innerHTML = '🕐 CURRENTLY CLOSED';
        if (afterHoursMessage) afterHoursMessage.style.display = 'block';
        if (tempUnavailableMessage) tempUnavailableMessage.style.display = 'none';
        const closedBanner = document.getElementById('closedBanner');
        if (closedBanner) closedBanner.style.background = 'linear-gradient(135deg, #666, #888)';
    }
}

// === BUTTON MANAGEMENT ===
function updateButtons() {
    const normalButtons = document.querySelectorAll('.normal-hours-btn');
    const afterHoursButtons = document.querySelectorAll('.after-hours-btn');
    
    const showNormalButtons = EEK_STATE.systemActive;
    const showAfterHoursButtons = !EEK_STATE.systemActive;
    
    console.log('🔘 Found buttons:', {
        normalButtons: normalButtons.length,
        afterHoursButtons: afterHoursButtons.length,
        showNormal: showNormalButtons,
        showAfterHours: showAfterHoursButtons
    });
    
    normalButtons.forEach((btn, index) => {
        btn.style.display = showNormalButtons ? 'inline-block' : 'none';
        console.log(`  Normal button ${index}: ${showNormalButtons ? 'VISIBLE' : 'HIDDEN'}`);
    });
    
    afterHoursButtons.forEach((btn, index) => {
        btn.style.display = showAfterHoursButtons ? 'inline-block' : 'none';
        console.log(`  After-hours button ${index}: ${showAfterHoursButtons ? 'VISIBLE' : 'HIDDEN'}`);
    });
    
    console.log('🔘 Button update complete - Normal:', showNormalButtons ? 'VISIBLE' : 'HIDDEN', 
                'After-hours:', showAfterHoursButtons ? 'VISIBLE' : 'HIDDEN');
}

// === STICKY BUTTON MANAGEMENT ===
function updateStickyButtons() {
    const stickyCall = document.getElementById('stickyCallButton');
    const stickyClosed = document.getElementById('stickyClosedButton');
    
    if (stickyCall) {
        if (EEK_STATE.hasPaymentToken) {
            stickyCall.style.display = 'none';
            console.log('📱 Sticky call button: HIDDEN (payment token)');
        } else {
            const shouldShow = EEK_STATE.systemActive;
            stickyCall.style.display = shouldShow ? 'inline-block' : 'none';
            console.log('📱 Sticky call button:', shouldShow ? 'VISIBLE' : 'HIDDEN');
        }
    }
    
    if (stickyClosed) {
        if (!EEK_STATE.systemActive && !EEK_STATE.hasPaymentToken && !EEK_STATE.gclid) {
            stickyClosed.style.display = 'inline-block';
            if (EEK_STATE.duringBusinessHours) {
                stickyClosed.innerHTML = '📅 Book Online';
                stickyClosed.style.background = '#ff8c00';
                stickyClosed.href = '#service-selection';
            } else {
                stickyClosed.innerHTML = '🕐 View Hours';
                stickyClosed.style.background = '#666';
                stickyClosed.href = '#closedBanner';
            }
        } else {
            stickyClosed.style.display = 'none';
        }
    }
}

// === PAYMENT UI MANAGEMENT ===
function updatePaymentUI() {
    const paymentToken = getPaymentToken();
    const stripePaymentBlock = document.getElementById('stripePaymentBlock');
    const stripePaymentSticky = document.getElementById('stripePaymentSticky');
    const payNowButton = document.getElementById('payNowButton');
    const termsCheckbox = document.getElementById('termsCheckbox');
    
    console.log('💳 Payment UI Update - Token:', paymentToken);
    
    if (paymentToken) {
        // Show payment UI for token users
        if (stripePaymentBlock) {
            stripePaymentBlock.style.display = 'block';
            console.log('💳 Showing Stripe payment block for token user');
        }
        if (stripePaymentSticky) {
            stripePaymentSticky.style.display = 'inline-block';
            stripePaymentSticky.href = '#stripePaymentBlock';
            console.log('💳 Showing sticky payment button');
        }
        
        // Hide normal service buttons for payment users
        const normalButtons = document.querySelectorAll('.normal-hours-btn');
        normalButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Set up payment functionality
        setupPaymentHandlers(paymentToken);
        console.log('💳 Payment UI configured for token:', paymentToken);
    } else {
        // Hide all payment UI for non-token users
        if (stripePaymentBlock) {
            stripePaymentBlock.style.display = 'none';
            console.log('💳 Hiding Stripe payment block (no token)');
        }
        if (stripePaymentSticky) {
            stripePaymentSticky.style.display = 'none';
            console.log('💳 Hiding sticky payment button (no token)');
        }
        if (payNowButton) {
            payNowButton.style.display = 'none';
            console.log('💳 Hiding pay now button (no token)');
        }
        if (termsCheckbox) {
            termsCheckbox.checked = false;
            console.log('💳 Resetting terms checkbox (no token)');
        }
        console.log('💳 All payment UI hidden for non-token user');
    }
}

function setupPaymentHandlers(token) {
    // Main page payment setup
    const stripePaymentBlock = document.getElementById('stripePaymentBlock');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const payNowButton = document.getElementById('payNowButton');
    const stripePaymentSticky = document.getElementById('stripePaymentSticky');
    
    console.log('💳 Setting up payment handlers for token:', token);
    console.log('💳 Payment elements found:', {
        stripePaymentBlock: !!stripePaymentBlock,
        termsCheckbox: !!termsCheckbox,
        payNowButton: !!payNowButton,
        stripePaymentSticky: !!stripePaymentSticky
    });
    
    if (stripePaymentBlock && termsCheckbox && payNowButton && stripePaymentSticky) {
        stripePaymentBlock.style.display = 'block';
        stripePaymentSticky.style.display = 'inline-block';
        stripePaymentSticky.href = '#stripePaymentBlock';
        
        // Remove any existing event listeners
        const newTermsCheckbox = termsCheckbox.cloneNode(true);
        termsCheckbox.parentNode.replaceChild(newTermsCheckbox, termsCheckbox);
        
        const newPayNowButton = payNowButton.cloneNode(true);
        payNowButton.parentNode.replaceChild(newPayNowButton, payNowButton);
        
        newTermsCheckbox.addEventListener('change', () => {
            console.log('💳 Terms checkbox changed:', newTermsCheckbox.checked);
            newPayNowButton.style.display = newTermsCheckbox.checked ? 'inline-block' : 'none';
        });
        
        newPayNowButton.addEventListener('click', () => {
            console.log('💳 Pay Now button clicked, redirecting to:', `https://buy.stripe.com/${token}`);
            window.location.href = `https://buy.stripe.com/${token}`;
        });
        
        console.log('💳 Payment handlers configured successfully');
    } else {
        console.warn('💳 Missing payment elements - handlers not configured');
    }
}

// === LINK MANAGEMENT ===
function updateServiceLinks() {
    const trackingParams = buildTrackingParams();
    
    document.querySelectorAll('.service-link').forEach(link => {
        const service = link.dataset.service;
        if (service) {
            const baseUrl = `/book-service?service=${service}`;
            const fullUrl = trackingParams ? `${baseUrl}&${trackingParams}` : baseUrl;
            
            if (link.classList.contains('after-hours-btn') || link.getAttribute('href') === '#service-selection') {
                link.href = fullUrl;
            } else {
                link.dataset.bookingUrl = fullUrl;
            }
        }
    });
    
    // Update More Options link
    const moreOptionsLinks = document.querySelectorAll('.more-options-link, a[href*="more-options"], a[href="/more-options"]');
    moreOptionsLinks.forEach(link => {
        const baseUrl = '/more-options';
        const fullUrl = trackingParams ? `${baseUrl}?${trackingParams}` : baseUrl;
        link.href = fullUrl;
        console.log('🔗 More Options link updated:', fullUrl);
    });
    
    // Update all internal navigation links to preserve tracking
    document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
        if (link.classList.contains('no-tracking')) return; // Skip if explicitly marked
        
        const currentHref = link.getAttribute('href');
        if (currentHref && !currentHref.includes('?') && trackingParams) {
            link.href = `${currentHref}?${trackingParams}`;
        } else if (currentHref && currentHref.includes('?') && trackingParams) {
            link.href = `${currentHref}&${trackingParams}`;
        }
    });
    
    console.log('🔗 Service links updated with tracking parameters:', trackingParams);
}

function addClickTrackingToElements() {
    // Add tracking to all elements with data-track attributes
    document.querySelectorAll('[data-track]').forEach(element => {
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
    });
    
    // Add tracking to all phone links
    document.querySelectorAll('a[href^="tel:"]').forEach(element => {
        if (!element.dataset.track) {
            element.dataset.track = 'phone_call';
        }
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
    });
}

// === INITIALIZATION ===
function initializePage() {
    console.log('🚀 Initializing Eek Mobile Mechanical page...');
    
    // Inject critical CSS styles first
    injectMasterStyles();
    
    // Create dynamic elements that may not exist on the page
    initializeDynamicElements();
    
    // Initialize tracking pixels
    initializeRedditPixel();
    
    // Detect and update logos
    detectAndUpdateLogo();
    
    // Initialize state
    EEK_STATE.sessionId = getOrCreateSessionId();
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.utmData = getUTMData();
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    // Debug: Check for phone display elements
    const phoneDisplays = document.querySelectorAll('.phone-display');
    const phoneLinks = document.querySelectorAll('.phone-link');
    console.log('🔍 Found phone elements:', {
        phoneDisplays: phoneDisplays.length,
        phoneLinks: phoneLinks.length
    });
    
    phoneDisplays.forEach((el, i) => {
        console.log(`  Phone display ${i}:`, el.textContent, el);
    });
    
    // Update UI
    updateUIState();
    updateServiceLinks();
    
    // Set up tracking
    setupScrollTracking();
    setupTimeTracking();
    addClickTrackingToElements();
    
    // Set up service selection handlers (for main page)
    handleServiceSelection();
    
    trackPageView(); // Single unified event handles both page view AND first visit
    
    // Set up periodic checks
    setInterval(updateUIState, 5 * 60 * 1000); // Every 5 minutes
    
    console.log('✅ Page initialization complete');
    console.log('📊 Final State:', {
        sessionId: EEK_STATE.sessionId,
        gclid: EEK_STATE.gclid,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        phoneNumber: getDisplayPhoneNumber().display
    });
}

// === AUTO-INITIALIZE ON DOM CONTENT LOADED ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// === SERVICE SELECTION HANDLERS ===
function handleServiceSelection() {
    document.querySelectorAll('.service-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const bookingUrl = this.dataset.bookingUrl;
            const service = this.dataset.service;
            
            // Track the service interaction
            if (service) {
                trackInteraction(this);
            }
            
            // Only redirect to booking for service cards (not already direct booking links)
            if (bookingUrl && this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                console.log('🎯 Redirecting to booking page:', bookingUrl);
                window.location.href = bookingUrl;
            }
        });
    });
}

// === DYNAMIC ELEMENT CREATION ===
function createClosedBanner() {
    if (document.getElementById('closedBanner')) return; // Already exists
    
    const banner = document.createElement('div');
    banner.id = 'closedBanner';
    banner.className = 'after-hours-banner';
    banner.style.display = 'none';
    banner.style.background = 'linear-gradient(135deg, #666, #888)';
    
    banner.innerHTML = `
        <h2 id="closedTitle">🕐 CURRENTLY CLOSED</h2>
        <div id="afterHoursMessage">
            <p><strong>Business Hours:</strong></p>
            <p>Monday - Friday: 7:00 AM - 5:00 PM</p>
            <p>Saturday - Sunday: 7:00 AM - 12:00 PM</p>
            <p>Please call during business hours or book online for next available service</p>
        </div>
        <div id="tempUnavailableMessage" style="display: none;">
            <p><strong>We're currently experiencing high demand</strong></p>
            <p>Our mechanics are fully dispatched on emergency calls</p>
            <p>Please book online for the next available appointment or try calling again shortly</p>
            <a href="#service-selection" class="emergency-btn" style="background: rgba(255,255,255,0.25); margin-top: 10px;">📅 Book Online Now</a>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);
    console.log('📋 Closed banner created dynamically');
}

function createStripePaymentBlock() {
    if (document.getElementById('stripePaymentBlock')) return; // Already exists
    
    const block = document.createElement('section');
    block.id = 'stripePaymentBlock';
    block.style.cssText = 'display: none; background-color: #ffffff; padding: 20px; text-align: center; color: #333; border-bottom: 2px solid #ff5500;';
    
    block.innerHTML = `
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 12px; max-width: 700px; margin: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 2.2em; margin-bottom: 0.5em;">Secure Roadside Payment</h1>
            <p style="font-size: 1.2em; margin-bottom: 1.5em;">Confirm your payment to get help on the way — fast, safe, and secure.</p>
            <label style="font-size: 1.1em; display: inline-flex; align-items: center; gap: 10px; color: #333;">
                <input type="checkbox" id="termsCheckbox" style="transform: scale(1.5);" />
                <span>I agree to the Eek Mobile Mechanical terms of service 
                    <a href="https://www.eek.nz/terms" target="_blank" style="color: #ff5500; text-decoration: underline;">
                        View terms of use
                    </a>
                </span>
            </label>
            <br><br>
            <button id="payNowButton" style="display: none; background-color: #ff5500; color: white; padding: 14px 32px; font-size: 1.2em; border: none; border-radius: 8px; cursor: pointer;">
                Pay Now
            </button>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(block, document.body.firstChild);
    console.log('💳 Stripe payment block created dynamically');
}

function createStickyButtons() {
    // Create sticky call button if it doesn't exist
    if (!document.getElementById('stickyCallButton')) {
        const callButton = document.createElement('a');
        callButton.className = 'sticky-call phone-link';
        callButton.href = 'tel:0800769000';
        callButton.id = 'stickyCallButton';
        callButton.setAttribute('data-track', 'sticky_call');
        callButton.innerHTML = '📞 Call <span class="phone-display">Eek Now</span>';
        document.body.appendChild(callButton);
        console.log('📱 Sticky call button created dynamically');
    }
    
    // Create sticky closed button if it doesn't exist
    if (!document.getElementById('stickyClosedButton')) {
        const closedButton = document.createElement('a');
        closedButton.className = 'sticky-call';
        closedButton.href = '#closedBanner';
        closedButton.id = 'stickyClosedButton';
        closedButton.style.cssText = 'display: none; background: #666;';
        closedButton.innerHTML = '🕐 View Hours';
        document.body.appendChild(closedButton);
        console.log('📱 Sticky closed button created dynamically');
    }
    
    // Create sticky payment button if it doesn't exist
    if (!document.getElementById('stripePaymentSticky')) {
        const paymentButton = document.createElement('a');
        paymentButton.className = 'sticky-payment';
        paymentButton.href = '#';
        paymentButton.id = 'stripePaymentSticky';
        paymentButton.style.display = 'none';
        paymentButton.innerHTML = '💳 Make Payment';
        document.body.appendChild(paymentButton);
        console.log('💳 Sticky payment button created dynamically');
    }
}

// === INITIALIZE ALL DYNAMIC ELEMENTS ===
function initializeDynamicElements() {
    console.log('🎬 Creating dynamic elements...');
    createClosedBanner();
    createStripePaymentBlock();
    createStickyButtons();
    console.log('✅ All dynamic elements initialized');
}

// === CUSTOMER DATA PERSISTENCE ===
const CUSTOMER_PROFILE_KEY = 'eek_customer_profile';

function getCustomerProfile() {
    try {
        const stored = localStorage.getItem(CUSTOMER_PROFILE_KEY);
        return stored ? JSON.parse(stored) : createNewCustomerProfile();
    } catch (e) {
        console.warn('Error reading customer profile, creating new:', e);
        return createNewCustomerProfile();
    }
}

function createNewCustomerProfile() {
    const profile = {
        customerId: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        
        // Identity & Attribution
        attribution: {
            firstTouch: null,
            lastTouch: null,
            allTouchpoints: [],
            gclids: [],
            utmHistory: []
        },
        
        // Behavior Tracking
        behavior: {
            totalVisits: 0,
            totalPageViews: 0,
            totalTimeOnSite: 0,
            totalInteractions: 0,
            pagesVisited: [],
            servicesViewed: [],
            conversions: [],
            phoneNumbers: {
                tracking: 0,
                default: 0
            }
        },
        
        // Technical Profile
        technical: {
            devices: [],
            browsers: [],
            locations: [],
            referrers: [],
            screenResolutions: []
        },
        
        // Business Context
        businessInteractions: {
            systemActiveVisits: 0,
            systemInactiveVisits: 0,
            businessHoursVisits: 0,
            afterHoursVisits: 0,
            paymentTokensUsed: []
        },
        
        // Journey Tracking
        journey: {
            sessionCount: 0,
            currentSessionStart: null,
            lastVisit: null,
            averageSessionDuration: 0,
            bounceRate: 0,
            conversionRate: 0
        }
    };
    
    saveCustomerProfile(profile);
    return profile;
}

function updateCustomerProfile(updates) {
    const profile = getCustomerProfile();
    
    // Deep merge the updates
    const updatedProfile = deepMerge(profile, updates);
    updatedProfile.updated = new Date().toISOString();
    
    saveCustomerProfile(updatedProfile);
    return updatedProfile;
}

function saveCustomerProfile(profile) {
    try {
        localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error('Error saving customer profile:', e);
    }
}

function addToCustomerJourney(eventType, eventData) {
    const profile = getCustomerProfile();
    
    // Add to journey tracking
    if (!profile.journey.events) profile.journey.events = [];
    
    profile.journey.events.push({
        timestamp: new Date().toISOString(),
        type: eventType,
        data: eventData,
        page: window.location.pathname,
        sessionId: EEK_STATE.sessionId
    });
    
    // Keep only last 100 events to prevent storage bloat
    if (profile.journey.events.length > 100) {
        profile.journey.events = profile.journey.events.slice(-100);
    }
    
    updateCustomerProfile(profile);
}

function trackCustomerAttribution(attribution) {
    const profile = getCustomerProfile();
    
    // Set first touch if not exists
    if (!profile.attribution.firstTouch) {
        profile.attribution.firstTouch = attribution;
    }
    
    // Always update last touch
    profile.attribution.lastTouch = attribution;
    
    // Add to touchpoints history
    profile.attribution.allTouchpoints.push(attribution);
    
    // Track GCLID history
    if (attribution.gclid && !profile.attribution.gclids.includes(attribution.gclid)) {
        profile.attribution.gclids.push(attribution.gclid);
    }
    
    // Track UTM combinations
    if (attribution.utm_source) {
        const utmKey = `${attribution.utm_source}|${attribution.utm_medium}|${attribution.utm_campaign}`;
        if (!profile.attribution.utmHistory.some(u => u.key === utmKey)) {
            profile.attribution.utmHistory.push({
                key: utmKey,
                source: attribution.utm_source,
                medium: attribution.utm_medium,
                campaign: attribution.utm_campaign,
                firstSeen: new Date().toISOString()
            });
        }
    }
    
    updateCustomerProfile(profile);
}

function trackCustomerBehavior(behaviorType, data) {
    const profile = getCustomerProfile();
    
    switch (behaviorType) {
        case 'page_visit':
            profile.behavior.totalPageViews++;
            if (!profile.behavior.pagesVisited.includes(data.page)) {
                profile.behavior.pagesVisited.push(data.page);
            }
            break;
            
        case 'service_view':
            if (!profile.behavior.servicesViewed.includes(data.service)) {
                profile.behavior.servicesViewed.push(data.service);
            }
            break;
            
        case 'conversion':
            profile.behavior.conversions.push({
                timestamp: new Date().toISOString(),
                type: data.eventAction,
                value: data.eventValue,
                page: window.location.pathname
            });
            break;
            
        case 'interaction':
            profile.behavior.totalInteractions++;
            break;
            
        case 'phone_display':
            if (data.phoneType === 'tracking') {
                profile.behavior.phoneNumbers.tracking++;
            } else {
                profile.behavior.phoneNumbers.default++;
            }
            break;
    }
    
    updateCustomerProfile(profile);
}

function trackCustomerTechnical(technicalData) {
    const profile = getCustomerProfile();
    
    // Track unique devices
    const deviceFingerprint = `${technicalData.platform}-${technicalData.userAgent.slice(0, 50)}`;
    if (!profile.technical.devices.some(d => d.fingerprint === deviceFingerprint)) {
        profile.technical.devices.push({
            fingerprint: deviceFingerprint,
            platform: technicalData.platform,
            mobile: technicalData.mobile,
            screen: technicalData.screen,
            firstSeen: new Date().toISOString()
        });
    }
    
    // Track referrers
    if (technicalData.referrer && !profile.technical.referrers.includes(technicalData.referrer)) {
        profile.technical.referrers.push(technicalData.referrer);
    }
    
    updateCustomerProfile(profile);
}

// Utility function for deep merging objects
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
function getServiceType(eventAction) {
    return EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
}

// Enhanced tracking helper functions
function getGCLIDAgeInDays() {
    const timestamp = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
    if (!timestamp) return null;
    
    const gclidDate = new Date(timestamp);
    const now = new Date();
    return Math.floor((now - gclidDate) / (1000 * 60 * 60 * 24));
}

function isLocalStorageAvailable() {
    try {
        const test = 'localStorage-test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function isSessionStorageAvailable() {
    try {
        const test = 'sessionStorage-test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

async function testThirdPartyCookies() {
    try {
        // Simple test for third-party cookie blocking
        document.cookie = "third-party-test=1; SameSite=None; Secure";
        const hasThirdPartyCookie = document.cookie.indexOf("third-party-test=1") !== -1;
        // Clean up
        document.cookie = "third-party-test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure";
        return !hasThirdPartyCookie;
    } catch (e) {
        return true; // Assume blocked if error
    }
}

function getSessionStartTime() {
    const stored = localStorage.getItem('eek_session_start_time');
    if (stored) return parseInt(stored);
    
    const startTime = Date.now();
    localStorage.setItem('eek_session_start_time', startTime.toString());
    return startTime;
}

function getPageStartTime() {
    return performance.navigationStart || Date.now();
}

function getPreviousPage() {
    return localStorage.getItem('eek_previous_page') || null;
}

function getVisitCount() {
    const count = parseInt(localStorage.getItem('eek_visit_count') || '0') + 1;
    localStorage.setItem('eek_visit_count', count.toString());
    return count;
}

function getPageViewCount() {
    const count = parseInt(localStorage.getItem('eek_page_view_count') || '0') + 1;
    localStorage.setItem('eek_page_view_count', count.toString());
    return count;
}

// Additional conversion tracking helpers
function getClickedSection() {
    // Try to determine which section of the page the user clicked from
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    if (scrollY < windowHeight * 0.33) return 'above_fold';
    if (scrollY < windowHeight * 0.66) return 'middle_section';
    return 'below_fold';
}

function getVisibleElements() {
    const elements = {};
    
    // Check if key elements are visible
    const checkElement = (id, name) => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            elements[name] = rect.top < window.innerHeight && rect.bottom > 0;
        }
    };
    
    checkElement('service-selection', 'serviceSelection');
    checkElement('stripePaymentBlock', 'paymentBlock');
    checkElement('closedBanner', 'closedBanner');
    
    return elements;
}

function getFirstTouchAttribution() {
    return JSON.parse(localStorage.getItem('eek_first_touch') || 'null');
}

function getLastTouchAttribution() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentAttribution = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        gclid: urlParams.get('gclid')
    };
    
    // Store as last touch
    localStorage.setItem('eek_last_touch', JSON.stringify(currentAttribution));
    
    // Store as first touch if not exists
    if (!getFirstTouchAttribution()) {
        localStorage.setItem('eek_first_touch', JSON.stringify(currentAttribution));
    }
    
    return currentAttribution;
}

function getTouchpointCount() {
    const touchpoints = JSON.parse(localStorage.getItem('eek_touchpoints') || '[]');
    return touchpoints.length;
}

function getDaysSinceFirstVisit() {
    const firstVisit = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent);
    if (!firstVisit) return 0;
    
    const firstDate = new Date(firstVisit);
    const now = new Date();
    return Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));
}

function getSessionsSinceFirstVisit() {
    return parseInt(localStorage.getItem('eek_session_count') || '1');
}

function getFirstVisitPage() {
    return localStorage.getItem('eek_first_visit_page') || window.location.href;
}

function getPagesVisitedThisSession() {
    const pages = JSON.parse(sessionStorage.getItem('eek_session_pages') || '[]');
    if (!pages.includes(window.location.pathname)) {
        pages.push(window.location.pathname);
        sessionStorage.setItem('eek_session_pages', JSON.stringify(pages));
    }
    return pages;
}

function getInteractionCount() {
    return parseInt(sessionStorage.getItem('eek_interaction_count') || '0');
}

function incrementInteractionCount() {
    const count = getInteractionCount() + 1;
    sessionStorage.setItem('eek_interaction_count', count.toString());
    return count;
}

// === BACKWARDS COMPATIBILITY WRAPPER ===
// This ensures any existing onclick handlers in HTML still work
window.trackConversionCompat = function(eventAction, eventCategory = 'Contact') {
    // Call the main tracking function that's already defined above
    const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const eventValue = EEK_CONFIG.SERVICE_VALUES[eventAction] || 25000;
    const serviceType = EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
    
    console.log('🎯 Conversion tracked (compat):', eventAction, 'Value:', eventValue);
    
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventAction, {
            'event_category': eventCategory,
            'event_label': serviceType,
            'value': eventValue / 100, // Convert to dollars
            'gclid': EEK_STATE.gclid
        });
        
        // Track phone calls as conversions
        if (eventAction.includes('call')) {
            gtag('event', 'conversion', {
                'send_to': 'AW-17084465163/7Mh8CKFRydsaEIuAwJI_'
            });
        }
    }
    
    // Reddit Pixel tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'Lead', {
            'customEventName': eventAction,
            'conversionId': conversionId,
            'value': eventValue,
            'currency': 'NZD',
            'itemCount': 1,
            'eventSource': window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
            'eventCategory': eventCategory,
            'serviceType': serviceType,
            'gclid': EEK_STATE.gclid
        });
    }
};

// === EXPORT FOR GLOBAL ACCESS ===
window.EEK_CONFIG = EEK_CONFIG;
window.EEK_STATE = EEK_STATE;
window.updateUIState = updateUIState;
window.updatePhoneNumbers = updatePhoneNumbers;
window.buildTrackingParams = buildTrackingParams;
window.trackConversion = trackConversion;
window.trackConversionCompat = trackConversionCompat;
window.trackInteraction = trackInteraction;
window.handleServiceSelection = handleServiceSelection;
window.getServiceType = getServiceType;
window.initializeDynamicElements = initializeDynamicElements;
window.createClosedBanner = createClosedBanner;
window.createStripePaymentBlock = createStripePaymentBlock;
window.createStickyButtons = createStickyButtons;
window.getLogoForPageType = getLogoForPageType;
window.detectAndUpdateLogo = detectAndUpdateLogo;
