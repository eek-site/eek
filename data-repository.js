/**
 * EEK PLATFORM DATA REPOSITORY - SINGLE SOURCE OF TRUTH
 * 
 * This file defines the EXACT data structure used across the entire EEK platform.
 * All pages, APIs, and Power Automate workflows MUST use this structure.
 * 
 * PAYMENT JSON IS THE SINGLE SOURCE OF TRUTH (SSOT)
 * 
 * Version: 1.1
 * Last Updated: 2025-12-23
 */

class EekDataRepository {
    constructor() {
        // Get sanitizer instance if available
        this.sanitizer = window.dataSanitizer || null;
        // === CORE FIELD DEFINITIONS ===
        this.CORE_FIELDS = {
            // Session & Tracking
            sessionId: 'sessionId',
            gclid: 'gclid',
            gclidState: 'gclidState',
            timestamp: 'timestamp',
            eventType: 'eventType',
            eventAction: 'eventAction',
            bookingStatus: 'bookingStatus',
            currentStep: 'currentStep',
            totalSteps: 'totalSteps',
            stepProgress: 'stepProgress',
            termsAccepted: 'termsAccepted',
            marketingConsent: 'marketingConsent',
            
            // Customer Information
            name: 'name',
            firstName: 'firstName',
            lastName: 'lastName',
            phone: 'phone',
            email: 'email',
            location: 'location',
            address: 'address',
            city: 'city',
            
            // Vehicle Information
            vehicleRego: 'vehicleRego',
            rego: 'rego',
            vehicleYear: 'vehicleYear',
            year: 'year',
            vehicleMake: 'vehicleMake',
            make: 'make',
            vehicleModel: 'vehicleModel',
            model: 'model',
            vehicleType: 'vehicleType',
            vehicleDescription: 'vehicleDescription',
            vehicleTypeAddon: 'vehicleTypeAddon',
            
            // Service Information
            service: 'service',
            serviceCode: 'serviceCode',
            serviceTitle: 'serviceTitle',
            serviceTier: 'serviceTier',
            price: 'price',
            finalPrice: 'finalPrice',
            calculatedPrice: 'calculatedPrice',
            basePrice: 'basePrice',
            details: 'details',
            specialInstructions: 'specialInstructions',
            
            // Seller Information
            sellerName: 'sellerName',
            sellerPhone: 'sellerPhone',
            
            // Scheduling
            bookingDateTime: 'bookingDateTime',
            scheduledDate: 'scheduledDate',
            scheduledTime: 'scheduledTime',
            scheduledDateISO: 'scheduledDateISO',
            preferredDate: 'preferredDate',
            preferredTime: 'preferredTime',
            
            // Tracking & Attribution
            bookingSource: 'bookingSource',
            formVersion: 'formVersion',
            pageType: 'pageType',
            referrer: 'referrer',
            userAgent: 'userAgent'
        };

        // === PAYMENT JSON STRUCTURE (SSOT) ===
        this.PAYMENT_JSON_STRUCTURE = {
            // Stripe Payment Fields
            amount: 'number', // Amount in cents
            currency: 'string', // 'nzd'
            description: 'string',
            redirectUrl: 'string',
            
            // Root Level Fields (for direct access)
            sessionId: 'string',
            gclid: 'string|null',
            gclidState: 'string', // 'Active' | 'Inactive'
            eventType: 'string',
            eventAction: 'string',
            timestamp: 'string', // ISO 8601
            bookingStatus: 'string',
            currentStep: 'number',
            totalSteps: 'number',
            stepProgress: 'number',
            termsAccepted: 'boolean',
            marketingConsent: 'boolean',
            
            // Customer Information (Root Level)
            name: 'string',
            phone: 'string',
            email: 'string',
            // Root-level location object for email template compatibility
            location: {
                city: 'string',
                region: 'string',
                country: 'string',
                address: 'string',
                coordinates: {
                    latitude: 'number|null',
                    longitude: 'number|null',
                    accuracy: 'string|null'
                }
            },
            
            // Vehicle Information (Root Level)
            rego: 'string',
            vehicleRego: 'string',
            year: 'string',
            vehicleYear: 'string',
            make: 'string',
            vehicleMake: 'string',
            model: 'string',
            vehicleModel: 'string',
            vehicleType: 'string',
            
            // Service Information (Root Level)
            service: 'string',
            serviceCode: 'string',
            serviceTitle: 'string',
            price: 'number',
            details: 'string',
            
            // Nested Objects
            customerData: {
                // Customer Information
                name: 'string',
                phone: 'string',
                email: 'string',
                location: 'string', // String for payment API (matches triggerBody structure)
                
                // Vehicle Information
                vehicleRego: 'string',
                vehicleYear: 'string',
                vehicleMake: 'string',
                vehicleModel: 'string',
                vehicleDescription: 'string',
                vehicleType: 'string',
                vehicleTypeAddon: 'number',
                
                // Seller Information
                sellerName: 'string',
                sellerPhone: 'string',
                
                // Service Information
                service: 'string',
                serviceCode: 'string',
                serviceTitle: 'string',
                details: 'string',
                price: 'number',
                finalPrice: 'number',
                calculatedPrice: 'number',
                basePrice: 'number',
                
                // Scheduling
                bookingDateTime: 'string', // ISO 8601
                scheduledDate: 'string',
                scheduledTime: 'string',
                scheduledDateISO: 'string', // ISO 8601
                
                // Tracking
                sessionId: 'string',
                bookingSource: 'string',
                formVersion: 'string'
            },
            
            // Email Template Compatibility
            visitorData: {
                // Customer Information
                name: 'string',
                phone: 'string',
                email: 'string',
                location: { // Object for email templates
                    city: 'string',
                    region: 'string',
                    country: 'string',
                    address: 'string',
                    coordinates: {
                        latitude: 'number|null',
                        longitude: 'number|null',
                        accuracy: 'string|null'
                    }
                },
                
                // Vehicle Information
                vehicleRego: 'string',
                rego: 'string', // Template expects both
                vehicleYear: 'string',
                vehicleMake: 'string',
                vehicleModel: 'string',
                vehicleType: 'string',
                
                // Service Information
                service: 'string',
                serviceCode: 'string',
                serviceTitle: 'string'
            },
            
            // Journey Data
            journeyData: {
                callAttemptId: 'string|null',
                callTimestamp: 'string|null',
                returnTimestamp: 'string|null',
                timeBetweenCallAndReturn: 'number|null',
                source: 'string'
            },
            
            // Tracking Data
            trackingData: {
                gclid: 'string|null',
                gclidState: 'string',
                utm: 'object',
                pageSource: 'object',
                location: 'object',
                sessionId: 'string',
                pageUrl: 'string',
                pagePath: 'string',
                pageTitle: 'string',
                pageType: 'string',
                referrer: 'string|null',
                referrerDomain: 'string|null',
                conversionValue: 'number',
                conversionCurrency: 'string',
                conversionType: 'string'
            },
            
            // Additional Objects for Email Templates
            pageSource: {
                type: 'string',
                detail: 'string',
                referrer: 'string|null',
                landingPage: 'string',
                entryPoint: 'string',
                clickIds: {
                    gclid: 'string|null',
                    gbraid: 'string|null',
                    wbraid: 'string|null',
                    msclkid: 'string|null',
                    fbclid: 'string|null',
                    rdtclid: 'string|null'
                }
            },
            
            device: {
                userAgent: 'string',
                platform: 'string',
                language: 'string',
                timezone: 'string',
                screenResolution: 'string',
                viewportSize: 'string',
                isMobile: 'boolean',
                isTablet: 'boolean'
            },
            
            engagement: {
                timeOnPage: 'number',
                timeOnSite: 'number',
                pageViews: 'number',
                interactions: 'number',
                scrollDepth: 'number',
                formInteractions: 'number',
                buttonClicks: 'number',
                linkClicks: 'number',
                engagementScore: 'number'
            },
            
            userJourney: {
                journeyId: 'string',
                journeyStart: 'string', // ISO 8601
                journeyEnd: 'string', // ISO 8601
                journeyDuration: 'number',
                journeySteps: 'array',
                journeyCompleted: 'boolean',
                journeyAbandoned: 'boolean',
                journeyConversion: 'boolean',
                pageHistory: 'array',
                totalPages: 'number',
                sessionDuration: 'number',
                entryPage: 'string',
                previousPage: 'string'
            },
            
            utm: {
                source: 'string|null',
                medium: 'string|null',
                campaign: 'string|null',
                term: 'string|null',
                content: 'string|null',
                gclid: 'string|null'
            }
        };

        // === API ENDPOINTS ===
        this.API_ENDPOINTS = {
            tracking: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4',
            payment: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q',
            paymentConfirmed: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q',
            sharepointLookup: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c35b9414a0be42f88182ae7e6e409f1d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2ztt24wScLuAfifD0pjzovseRDKXBAEtCQtScGMgPqQ'
        };

        // === PAGE TYPES ===
        this.PAGE_TYPES = {
            HOMEPAGE: 'homepage',
            BOOKING_FORM: 'booking_form',
            INSPECTION_FORM: 'inspection_form',
            CONFIRMATION_PAGE: 'confirmation_page',
            ADMIN_PANEL: 'admin_panel',
            SUPPLIER_PORTAL: 'supplier_portal',
            LEGAL_PORTAL: 'legal_portal',
            THANKS_PAGE: 'thanks_page',
            OTHER: 'other'
        };

        // === SERVICE TYPES ===
        this.SERVICE_TYPES = {
            FUEL_EXTRACTION: 'fuel-extraction'
        };

        // === SERVICE CODES ===
        this.SERVICE_CODES = {
            FUEL_EXTRACTION: 'FUEL'
        };
    }

    /**
     * Get the payment JSON structure (SSOT)
     * @returns {Object} Payment JSON structure
     */
    getPaymentJsonStructure() {
        return this.PAYMENT_JSON_STRUCTURE;
    }

    /**
     * Get core field definitions
     * @returns {Object} Core field definitions
     */
    getCoreFields() {
        return this.CORE_FIELDS;
    }

    /**
     * Get API endpoints
     * @returns {Object} API endpoints
     */
    getApiEndpoints() {
        return this.API_ENDPOINTS;
    }

    /**
     * Get page types
     * @returns {Object} Page types
     */
    getPageTypes() {
        return this.PAGE_TYPES;
    }

    /**
     * Get service types
     * @returns {Object} Service types
     */
    getServiceTypes() {
        return this.SERVICE_TYPES;
    }

    /**
     * Get service codes
     * @returns {Object} Service codes
     */
    getServiceCodes() {
        return this.SERVICE_CODES;
    }

    /**
     * Validate data structure against SSOT
     * @param {Object} data - Data to validate
     * @param {string} type - Type of data (payment, tracking, etc.)
     * @returns {Object} Validation result
     */
    validateDataStructure(data, type = 'payment') {
        const structure = this.PAYMENT_JSON_STRUCTURE;
        const errors = [];
        const warnings = [];

        // Validate required fields
        const requiredFields = [
            'sessionId', 'gclid', 'gclidState', 'eventType', 'timestamp',
            'name', 'phone', 'email', 'location', 'service', 'price'
        ];

        for (const field of requiredFields) {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate nested objects
        if (type === 'payment') {
            // Validate root-level location object (for email template compatibility)
            if (!data.location || typeof data.location !== 'object') {
                warnings.push('Missing recommended field: root-level location object (for email template compatibility)');
            } else {
                if (!data.location.country) {
                    warnings.push('Root-level location object missing country field');
                }
            }

            if (!data.customerData) {
                errors.push('Missing required object: customerData');
            } else {
                if (!data.customerData.location) {
                    errors.push('Missing required field: customerData.location (must be string for payment API)');
                } else if (typeof data.customerData.location !== 'string') {
                    errors.push('customerData.location must be a string (for payment API compatibility)');
                }
            }

            if (!data.visitorData) {
                warnings.push('Missing recommended object: visitorData');
            } else {
                if (!data.visitorData.location || typeof data.visitorData.location !== 'object') {
                    warnings.push('visitorData.location should be an object for email template compatibility');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
        };
    }

    /**
     * Get standardized location object
     * @param {Object} geo - CF_GEO data
     * @param {string} userLocation - User-provided location
     * @returns {Object} Standardized location object
     */
    getStandardizedLocationObject(geo = {}, userLocation = '') {
        // Extract location string - handle both string and object cases
        let locationStr = '';
        if (typeof userLocation === 'string') {
            locationStr = userLocation;
        } else if (userLocation && typeof userLocation === 'object') {
            // If location is an object, extract address or city
            locationStr = userLocation.address || userLocation.city || '';
            // If still empty, try to extract from nested properties
            if (!locationStr && userLocation.location) {
                locationStr = typeof userLocation.location === 'string' 
                    ? userLocation.location 
                    : (userLocation.location.address || userLocation.location.city || '');
            }
        } else {
            locationStr = String(userLocation || '');
        }
        
        // Ensure all string fields are actually strings to prevent [object Object] issues
        return {
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
            raw: geo
        };
    }

    /**
     * Get standardized UTM data
     * @param {Object} formData - Form data
     * @returns {Object} Standardized UTM data
     */
    getStandardizedUtmData(formData = {}, useEmptyStrings = false) {
        // For payment payloads, use empty strings instead of null for Power Automate compatibility
        const defaultValue = useEmptyStrings ? '' : null;
        return {
            source: formData.utm_source || localStorage.getItem("eek_utm_source") || defaultValue,
            medium: formData.utm_medium || localStorage.getItem("eek_utm_medium") || defaultValue,
            campaign: formData.utm_campaign || localStorage.getItem("eek_utm_campaign") || defaultValue,
            term: formData.utm_term || localStorage.getItem("eek_utm_term") || defaultValue,
            content: formData.utm_content || localStorage.getItem("eek_utm_content") || defaultValue,
            gclid: formData.gclid || localStorage.getItem("eek_gclid") || defaultValue
        };
    }

    /**
     * Get standardized device data
     * @returns {Object} Standardized device data
     */
    getStandardizedDeviceData() {
        return {
            userAgent: navigator.userAgent,
            platform: this.detectDevicePlatform(),
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?=.*\bMobile\b)/i.test(navigator.userAgent)
        };
    }

    /**
     * Detect device platform
     * @returns {string} Platform name
     */
    detectDevicePlatform() {
        const userAgent = navigator.userAgent;
        if (/Windows/i.test(userAgent)) return 'Windows';
        if (/Mac/i.test(userAgent)) return 'macOS';
        if (/Linux/i.test(userAgent)) return 'Linux';
        if (/Android/i.test(userAgent)) return 'Android';
        if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
        return 'Unknown';
    }

    /**
     * Detect page type
     * @returns {string} Page type
     */
    detectPageType() {
        const path = window.location.pathname;
        if (path.includes('/book-service/')) return this.PAGE_TYPES.BOOKING_FORM;
        if (path.includes('/pre-purchase-vehicle-inspection/')) return this.PAGE_TYPES.INSPECTION_FORM;
        if (path.includes('/thanks/')) return this.PAGE_TYPES.THANKS_PAGE;
        if (path.includes('/admin/')) return this.PAGE_TYPES.ADMIN_PANEL;
        if (path.includes('/supplier/')) return this.PAGE_TYPES.SUPPLIER_PORTAL;
        if (path.includes('/mjuris/')) return this.PAGE_TYPES.LEGAL_PORTAL;
        if (path === '/' || path === '/index.html') return this.PAGE_TYPES.HOMEPAGE;
        return this.PAGE_TYPES.OTHER;
    }

    /**
     * Sanitize data before sending to flow
     * Removes corrupted characters, encoding issues, and other anomalies
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitizeForFlow(data) {
        // Use global sanitizer if available
        if (window.dataSanitizer) {
            return window.dataSanitizer.sanitizeForFlow(data);
        }
        
        // Fallback basic sanitization if sanitizer not loaded
        console.warn('⚠️ DataSanitizer not loaded, using basic sanitization');
        return this.basicSanitize(data);
    }

    /**
     * Basic fallback sanitization if data-sanitizer.js is not loaded
     * @param {*} value - Value to sanitize
     * @returns {*} Sanitized value
     */
    basicSanitize(value) {
        if (typeof value === 'string') {
            // Remove Unicode replacement character and other common issues
            return value
                .replace(/\uFFFD/g, '')           // Unicode replacement char
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
                .replace(/\s{2,}/g, ' ')          // Multiple spaces
                .trim();
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this.basicSanitize(item));
        }
        
        if (value && typeof value === 'object') {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = this.basicSanitize(val);
            }
            return sanitized;
        }
        
        return value;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EekDataRepository;
} else {
    window.EekDataRepository = EekDataRepository;
}
