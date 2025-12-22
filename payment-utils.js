/**
 * PAYMENT UTILITIES - Payment-Specific Data Handling
 * 
 * This file handles payment payload construction and normalization.
 * Uses data-repository.js as the Single Source of Truth (SSOT) for structure.
 * 
 * Key difference from tracking:
 * - Payment: Uses empty strings (''), not null, for Power Automate Excel trim() compatibility
 * - Tracking: Can use null values where appropriate
 * 
 * Version: 1.1
 * Last Updated: 2025-12-23
 */

class PaymentUtils {
    constructor() {
        // Use data repository as SSOT
        this.dataRepo = window.EekDataRepository ? new window.EekDataRepository() : null;
        
        // Use data sanitizer for cleaning data before sending to flows
        this.sanitizer = window.dataSanitizer || null;
        
        if (!this.dataRepo) {
            console.warn('⚠️ EekDataRepository not found. Payment utilities may not work correctly.');
        }
    }

    /**
     * Normalize value for Power Automate Excel compatibility
     * Power Automate Excel trim() requires strings, not null
     * Also sanitizes the value to remove corrupted characters and encoding issues
     * @param {*} value - Value to normalize
     * @returns {string} Normalized and sanitized string value
     */
    normalizeForPayment(value) {
        // If value is undefined, null, or empty string, return empty string
        // Power Automate Excel trim() function requires strings, not null
        if (value === undefined || value === null || value === '') {
            return '';
        }
        // If it's a string with only whitespace, return empty string
        if (typeof value === 'string' && value.trim() === '') {
            return '';
        }
        // If it's already a string, sanitize and return
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }
        // For other types (numbers, booleans), convert to string
        return String(value);
    }

    /**
     * Sanitize a string value to remove corrupted characters and encoding issues
     * @param {string} value - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeString(value) {
        if (typeof value !== 'string') {
            return value;
        }
        
        // Use global sanitizer if available
        if (window.dataSanitizer) {
            return window.dataSanitizer.sanitizeString(value);
        }
        
        // Fallback basic sanitization
        return value
            .replace(/\uFFFD/g, '')           // Unicode replacement char (�)
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
            .replace(/[\uE000-\uF8FF]/g, '')  // Private use area
            .replace(/[\uD800-\uDFFF]/g, '')  // Invalid surrogates
            .replace(/\s{2,}/g, ' ')          // Multiple spaces
            .trim();
    }

    /**
     * Normalize entire object for payment payload
     * Recursively converts all null/undefined values to empty strings
     * @param {Object} obj - Object to normalize
     * @returns {Object} Normalized object
     */
    normalizeObjectForPayment(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj === null || obj === undefined ? '' : obj;
        }
        
        const normalized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // Recursively normalize nested objects
                    normalized[key] = this.normalizeObjectForPayment(value);
                } else {
                    normalized[key] = this.normalizeForPayment(value);
                }
            }
        }
        return normalized;
    }

    /**
     * Build payment confirmed payload following SSOT structure
     * @param {Object} canonicalData - Canonical booking data
     * @param {string} bookingId - Booking ID
     * @returns {Object} Payment payload following SSOT structure
     */
    buildPaymentConfirmedPayload(canonicalData, bookingId) {
        const geo = window.CF_GEO || {};
        // Extract location string - handle both string and object cases
        let locationStr = '';
        if (typeof canonicalData.location === 'string') {
            locationStr = canonicalData.location;
        } else if (canonicalData.location && typeof canonicalData.location === 'object') {
            // If location is an object, extract address or city
            locationStr = canonicalData.location.address || canonicalData.location.city || '';
            // If still empty, try to extract from nested properties
            if (!locationStr && canonicalData.location.location) {
                locationStr = typeof canonicalData.location.location === 'string' 
                    ? canonicalData.location.location 
                    : (canonicalData.location.location.address || canonicalData.location.location.city || '');
            }
        } else {
            locationStr = String(canonicalData.location || '');
        }
        
        // Final safety check - if locationStr is still "[object Object]", clear it
        if (locationStr === '[object Object]' || locationStr === 'object Object') {
            locationStr = '';
        }
        
        // Build payload following data-repository.js structure
        const payload = {
            // Root-level fields for email template compatibility
            name: this.normalizeForPayment(canonicalData.name),
            phone: this.normalizeForPayment(canonicalData.phone),
            email: this.normalizeForPayment(canonicalData.email),
            
            // Root-level location - STRING for Excel compatibility (Power Automate Excel action expects string)
            // Email template will use trackingData.visitorData.location object instead
            location: locationStr || '',
            
            // Vehicle information
            rego: this.normalizeForPayment(canonicalData.rego),
            year: this.normalizeForPayment(canonicalData.year),
            make: this.normalizeForPayment(canonicalData.make),
            model: this.normalizeForPayment(canonicalData.model),
            vehicleType: this.normalizeForPayment(canonicalData.vehicleType),
            
            // Service information
            service: this.normalizeForPayment(canonicalData.service),
            serviceCode: this.normalizeForPayment(canonicalData.serviceCode),
            serviceTitle: this.normalizeForPayment(canonicalData.serviceTitle),
            price: this.normalizeForPayment(canonicalData.price),
            basePrice: canonicalData.price || '',
            finalPrice: canonicalData.price || '',
            calculatedPrice: canonicalData.price || '',
            
            // Optional fields - normalize to empty strings for Power Automate
            batteryVoltage: this.normalizeForPayment(canonicalData.batteryVoltage),
            sellerName: this.normalizeForPayment(canonicalData.sellerName),
            sellerPhone: this.normalizeForPayment(canonicalData.sellerPhone),
            details: this.normalizeForPayment(canonicalData.details),
            scheduledDate: this.normalizeForPayment(canonicalData.scheduledDate),
            scheduledTime: this.normalizeForPayment(canonicalData.timeWindow),
            urgencyLevel: this.normalizeForPayment(canonicalData.urgencyLevel),
            emergencyType: this.normalizeForPayment(canonicalData.emergencyType),
            quoteReference: this.normalizeForPayment(canonicalData.quoteReference),
            tyreSize: this.normalizeForPayment(canonicalData.tyreSize),
            
            // Tracking fields
            isWinzService: canonicalData.isWinz === 'true',
            sessionId: this.normalizeForPayment(canonicalData.sessionId),
            gclid: this.normalizeForPayment(canonicalData.gclid),
            gclidState: (canonicalData.gclid || localStorage.getItem("eek_gclid")) ? 'Active' : 'Inactive',
            
            // Event metadata
            eventType: 'payment_confirmed',
            eventAction: 'payment_confirmed',
            timestamp: new Date().toISOString(),
            bookingStatus: 'payment_confirmed',
            // bookingTime required for Power Automate convertTimeZone - use canonical bookingTime or current time
            bookingTime: canonicalData.bookingTime || new Date().toISOString(),
            currentStep: 8,
            totalSteps: 8,
            stepProgress: 100,
            termsAccepted: true,
            marketingConsent: false,
            
            // visitorData object for email template compatibility
            visitorData: {
                name: this.normalizeForPayment(canonicalData.name),
                phone: this.normalizeForPayment(canonicalData.phone),
                email: this.normalizeForPayment(canonicalData.email),
                location: this.dataRepo
                    ? this.dataRepo.getStandardizedLocationObject(geo, locationStr)
                    : {
                        city: String(locationStr || geo.city || 'Unknown'),
                        region: String(geo.region || 'Unknown'),
                        country: String(geo.country || 'New Zealand'),
                        countryCode: String(geo.countryCode || 'NZ'),
                        regionCode: String(geo.regionCode || 'Unknown'),
                        postalCode: String(geo.postalCode || 'Unknown'),
                        continent: String(geo.continent || 'Oceania'),
                        address: String(locationStr || ''),
                        coordinates: {
                            latitude: geo.latitude || null,
                            longitude: geo.longitude || null,
                            accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
                        },
                        timezone: String(geo.timezone || 'Pacific/Auckland'),
                        raw: geo || {}
                    },
                tyreSize: this.normalizeForPayment(canonicalData.tyreSize),
                vehicleRego: this.normalizeForPayment(canonicalData.rego),
                rego: this.normalizeForPayment(canonicalData.rego),
                vehicleYear: this.normalizeForPayment(canonicalData.year),
                vehicleMake: this.normalizeForPayment(canonicalData.make),
                vehicleModel: this.normalizeForPayment(canonicalData.model),
                vehicleType: this.normalizeForPayment(canonicalData.vehicleType),
                service: this.normalizeForPayment(canonicalData.service),
                serviceCode: this.normalizeForPayment(canonicalData.serviceCode),
                serviceTitle: canonicalData.serviceTitle || ''
            },
            
            // customerData object for payment API compatibility (location as string)
            customerData: {
                name: this.normalizeForPayment(canonicalData.name),
                phone: this.normalizeForPayment(canonicalData.phone),
                email: this.normalizeForPayment(canonicalData.email),
                location: locationStr || '', // String for payment API
                
                vehicleRego: this.normalizeForPayment(canonicalData.rego),
                vehicleYear: this.normalizeForPayment(canonicalData.year),
                vehicleMake: this.normalizeForPayment(canonicalData.make),
                vehicleModel: this.normalizeForPayment(canonicalData.model),
                vehicleType: this.normalizeForPayment(canonicalData.vehicleType),
                
                service: this.normalizeForPayment(canonicalData.service),
                serviceCode: this.normalizeForPayment(canonicalData.serviceCode),
                serviceTitle: this.normalizeForPayment(canonicalData.serviceTitle),
                details: this.normalizeForPayment(canonicalData.details),
                price: this.normalizeForPayment(canonicalData.price),
                finalPrice: canonicalData.price || '',
                calculatedPrice: canonicalData.price || '',
                basePrice: canonicalData.price || '',
                
                sessionId: this.normalizeForPayment(canonicalData.sessionId),
                bookingSource: 'payment_confirmation',
                formVersion: '2.1'
            },
            
            // journeyData for email template compatibility
            journeyData: {
                callAttemptId: localStorage.getItem('eek_last_call_attempt_id') || '',
                callTimestamp: localStorage.getItem('eek_last_call_timestamp') || '',
                returnTimestamp: '',
                timeBetweenCallAndReturn: '',
                source: 'payment_confirmation'
            },
            
            // Additional objects for email template compatibility
            pageSource: {
                type: 'direct',
                detail: 'Direct visit',
                referrer: document.referrer || '',
                utm: this.dataRepo
                    ? this.dataRepo.getStandardizedUtmData(canonicalData, true) // Use empty strings for Power Automate
                    : {
                        source: canonicalData.utm_source || localStorage.getItem("eek_utm_source") || '',
                        medium: canonicalData.utm_medium || localStorage.getItem("eek_utm_medium") || '',
                        campaign: canonicalData.utm_campaign || localStorage.getItem("eek_utm_campaign") || '',
                        term: canonicalData.utm_term || localStorage.getItem("eek_utm_term") || '',
                        content: canonicalData.utm_content || localStorage.getItem("eek_utm_content") || ''
                    },
                clickIds: {
                    gclid: canonicalData.gclid || localStorage.getItem("eek_gclid") || '',
                    fbclid: '',
                    msclkid: ''
                }
            },
            
            device: this.dataRepo
                ? this.dataRepo.getStandardizedDeviceData()
                : {
                    userAgent: navigator.userAgent,
                    platform: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                    language: navigator.language || 'en-NZ',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Pacific/Auckland',
                    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
                    viewportSize: `${window.innerWidth || 0}x${window.innerHeight || 0}`
                },
            
            engagement: {
                timeOnPage: Math.round((Date.now() - (window.pageLoadTime || Date.now())) / 1000),
                scrollDepth: 0,
                clicks: 0,
                formInteractions: 0,
                buttonClicks: 0
            },
            
            userJourney: {
                pageHistory: JSON.parse(localStorage.getItem('eek_user_journey') || '[]'),
                totalPages: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').length || 1,
                sessionDuration: Date.now() - (window.sessionStartTime || Date.now()),
                entryPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]')[0]?.url || window.location.href,
                previousPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').slice(-2, -1)[0]?.url || ''
            },
            
            utm: this.dataRepo
                ? this.dataRepo.getStandardizedUtmData(canonicalData, true) // Use empty strings for Power Automate
                : {
                    source: canonicalData.utm_source || localStorage.getItem("eek_utm_source") || '',
                    medium: canonicalData.utm_medium || localStorage.getItem("eek_utm_medium") || '',
                    campaign: canonicalData.utm_campaign || localStorage.getItem("eek_utm_campaign") || '',
                    term: canonicalData.utm_term || localStorage.getItem("eek_utm_term") || '',
                    content: canonicalData.utm_content || localStorage.getItem("eek_utm_content") || '',
                    gclid: canonicalData.gclid || localStorage.getItem("eek_gclid") || ''
                },
            
            // Enhanced tracking data for complete attribution
            trackingData: {
                gclid: canonicalData.gclid || localStorage.getItem("eek_gclid") || '',
                gclidState: (canonicalData.gclid || localStorage.getItem("eek_gclid")) ? 'Active' : 'Inactive',
                utm: this.dataRepo
                    ? this.dataRepo.getStandardizedUtmData(canonicalData, true) // Use empty strings for Power Automate
                    : {
                        source: canonicalData.utm_source || localStorage.getItem("eek_utm_source") || '',
                        medium: canonicalData.utm_medium || localStorage.getItem("eek_utm_medium") || '',
                        campaign: canonicalData.utm_campaign || localStorage.getItem("eek_utm_campaign") || '',
                        term: canonicalData.utm_term || localStorage.getItem("eek_utm_term") || '',
                        content: canonicalData.utm_content || localStorage.getItem("eek_utm_content") || ''
                    },
                pageSource: {
                    type: 'direct',
                    detail: 'Direct visit',
                    referrer: document.referrer || '',
                    utm: this.dataRepo
                        ? this.dataRepo.getStandardizedUtmData(canonicalData, true) // Use empty strings for Power Automate
                        : {
                            source: canonicalData.utm_source || localStorage.getItem("eek_utm_source") || '',
                            medium: canonicalData.utm_medium || localStorage.getItem("eek_utm_medium") || '',
                            campaign: canonicalData.utm_campaign || localStorage.getItem("eek_utm_campaign") || '',
                            term: canonicalData.utm_term || localStorage.getItem("eek_utm_term") || '',
                            content: canonicalData.utm_content || localStorage.getItem("eek_utm_content") || ''
                        },
                    clickIds: {
                        gclid: canonicalData.gclid || localStorage.getItem("eek_gclid") || '',
                        fbclid: '',
                        msclkid: ''
                    }
                },
                device: this.dataRepo
                    ? this.dataRepo.getStandardizedDeviceData()
                    : {
                        userAgent: navigator.userAgent,
                        platform: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                        language: navigator.language || 'en-NZ',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Pacific/Auckland',
                        screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
                        viewportSize: `${window.innerWidth || 0}x${window.innerHeight || 0}`
                    },
                location: {
                    country: String(geo.country || 'New Zealand'),
                    region: String(geo.region || 'Unknown'),
                    city: String(locationStr || geo.city || 'Unknown'), // Use user-provided location string first
                    postalCode: String(geo.postalCode || 'Unknown'),
                    coordinates: {
                        latitude: geo.latitude || null,
                        longitude: geo.longitude || null,
                        accuracy: geo.latitude && geo.longitude ? 'IP-based' : null
                    }
                },
                engagement: {
                    timeOnPage: Math.round((Date.now() - (window.pageLoadTime || Date.now())) / 1000),
                    scrollDepth: 0,
                    clicks: 0,
                    formInteractions: 0,
                    buttonClicks: 0
                },
                userJourney: {
                    pageHistory: JSON.parse(localStorage.getItem('eek_user_journey') || '[]'),
                    totalPages: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').length || 1,
                    sessionDuration: Date.now() - (window.sessionStartTime || Date.now()),
                    entryPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]')[0]?.url || window.location.href,
                    previousPage: JSON.parse(localStorage.getItem('eek_user_journey') || '[]').slice(-2, -1)[0]?.url || ''
                },
                visitorData: {
                    name: this.normalizeForPayment(canonicalData.name),
                    phone: this.normalizeForPayment(canonicalData.phone),
                    email: this.normalizeForPayment(canonicalData.email),
                    location: locationStr || '', // String for trackingData.visitorData.location
                    vehicleRego: this.normalizeForPayment(canonicalData.rego),
                    vehicleYear: this.normalizeForPayment(canonicalData.year),
                    vehicleMake: this.normalizeForPayment(canonicalData.make),
                    vehicleModel: this.normalizeForPayment(canonicalData.model),
                    vehicleType: this.normalizeForPayment(canonicalData.vehicleType),
                    batteryVoltage: this.normalizeForPayment(canonicalData.batteryVoltage),
                    service: this.normalizeForPayment(canonicalData.service),
                    serviceCode: this.normalizeForPayment(canonicalData.serviceCode),
                    serviceTitle: this.normalizeForPayment(canonicalData.serviceTitle),
                    price: this.normalizeForPayment(canonicalData.price),
                    basePrice: canonicalData.price || ''
                },
                journeyData: {
                    callAttemptId: localStorage.getItem('eek_last_call_attempt_id') || '',
                    callTimestamp: localStorage.getItem('eek_last_call_timestamp') || '',
                    returnTimestamp: '',
                    timeBetweenCallAndReturn: '',
                    source: 'payment_confirmation'
                },
                eventType: 'payment_confirmed',
                eventAction: 'payment_confirmed',
                timestamp: new Date().toISOString()
            },
            
            // Additional fields for webhook functionality
            idempotencyKey: bookingId,
            paymentConfirmedAt: new Date().toISOString(),
            paymentStatus: 'confirmed',
            pageLoadedAt: new Date().toISOString(),
            submissionAttempt: 1
        };

        // Validate payload structure if dataRepo is available
        if (this.dataRepo) {
            const validation = this.dataRepo.validateDataStructure(payload, 'payment');
            if (!validation.isValid) {
                console.warn('⚠️ Payment payload validation warnings:', validation.warnings);
                if (validation.errors.length > 0) {
                    console.error('❌ Payment payload validation errors:', validation.errors);
                }
            }
        }

        // Sanitize the entire payload before returning
        return this.sanitizePayload(payload);
    }

    /**
     * Sanitize entire payload before sending to flow
     * Removes corrupted characters, encoding issues, and other anomalies
     * @param {Object} payload - Payload to sanitize
     * @returns {Object} Sanitized payload
     */
    sanitizePayload(payload) {
        console.log('🧹 Sanitizing payment payload for flow...');
        
        // Use global sanitizer if available
        if (window.dataSanitizer) {
            return window.dataSanitizer.sanitizeForFlow(payload);
        }
        
        // Fallback: recursively sanitize the object
        return this.recursiveSanitize(payload);
    }

    /**
     * Recursively sanitize an object (fallback if sanitizer not loaded)
     * @param {*} value - Value to sanitize
     * @returns {*} Sanitized value
     */
    recursiveSanitize(value) {
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this.recursiveSanitize(item));
        }
        
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = this.recursiveSanitize(val);
            }
            return sanitized;
        }
        
        return value;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentUtils;
} else {
    window.PaymentUtils = PaymentUtils;
}

