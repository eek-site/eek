# Implementation Examples: Module Interfaces & Contracts

This document provides concrete implementation examples for the proposed refactored architecture.

---

## 1. Storage Manager Implementation

### `scripts/storage-manager.js`

```javascript
/**
 * Centralized Storage Management
 * Provides consistent API for localStorage and sessionStorage
 * Handles namespacing, expiration, and cleanup
 */
class StorageManager {
    constructor() {
        this.NAMESPACE = 'eek';
        this.STORAGE_TYPES = {
            SESSION: 'session',
            PERSISTENT: 'persistent',
            TEMPORARY: 'temporary'
        };
        
        // Define storage schemas
        this.SCHEMAS = {
            session: {
                storage: sessionStorage,
                ttl: null, // Session lifetime
                fields: ['id', 'pageViewSent', 'currentStep', 'formState']
            },
            tracking: {
                storage: localStorage,
                ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
                fields: ['gclid', 'gclidTimestamp', 'utm', 'userJourney', 'lastSent']
            },
            visitor: {
                storage: localStorage,
                ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
                fields: ['profile', 'preferences', 'history']
            },
            form: {
                storage: sessionStorage,
                ttl: null,
                fields: ['draft', 'validation', 'errors']
            },
            ui: {
                storage: sessionStorage,
                ttl: null,
                fields: ['modalState', 'sidebarState', 'notifications']
            }
        };
        
        // Initialize and cleanup
        this.cleanup();
    }
    
    /**
     * Get value from storage
     * @param {string} category - Storage category (session, tracking, visitor, etc.)
     * @param {string} field - Field name
     * @returns {any} Stored value or null
     */
    get(category, field) {
        const schema = this.SCHEMAS[category];
        if (!schema) {
            console.warn(`Unknown storage category: ${category}`);
            return null;
        }
        
        const key = this._buildKey(category, field);
        const rawValue = schema.storage.getItem(key);
        
        if (!rawValue) return null;
        
        try {
            const data = JSON.parse(rawValue);
            
            // Check expiration
            if (schema.ttl && data.expiresAt) {
                if (Date.now() > data.expiresAt) {
                    this.remove(category, field);
                    return null;
                }
            }
            
            return data.value;
        } catch (e) {
            console.warn(`Failed to parse storage value for ${key}:`, e);
            return null;
        }
    }
    
    /**
     * Set value in storage
     * @param {string} category - Storage category
     * @param {string} field - Field name
     * @param {any} value - Value to store
     * @param {number} customTTL - Optional custom TTL in milliseconds
     */
    set(category, field, value, customTTL = null) {
        const schema = this.SCHEMAS[category];
        if (!schema) {
            console.warn(`Unknown storage category: ${category}`);
            return false;
        }
        
        const key = this._buildKey(category, field);
        const ttl = customTTL || schema.ttl;
        
        const data = {
            value: value,
            timestamp: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
        };
        
        try {
            schema.storage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`Failed to store value for ${key}:`, e);
            return false;
        }
    }
    
    /**
     * Remove value from storage
     * @param {string} category - Storage category
     * @param {string} field - Field name
     */
    remove(category, field) {
        const schema = this.SCHEMAS[category];
        if (!schema) return;
        
        const key = this._buildKey(category, field);
        schema.storage.removeItem(key);
    }
    
    /**
     * Get all values in a category
     * @param {string} category - Storage category
     * @returns {Object} All values in category
     */
    getAll(category) {
        const schema = this.SCHEMAS[category];
        if (!schema) return {};
        
        const prefix = this._buildKey(category, '');
        const result = {};
        
        for (let i = 0; i < schema.storage.length; i++) {
            const key = schema.storage.key(i);
            if (key && key.startsWith(prefix)) {
                const field = key.replace(prefix, '');
                result[field] = this.get(category, field);
            }
        }
        
        return result;
    }
    
    /**
     * Clear all values in a category
     * @param {string} category - Storage category
     */
    clear(category) {
        const schema = this.SCHEMAS[category];
        if (!schema) return;
        
        const prefix = this._buildKey(category, '');
        const keysToRemove = [];
        
        for (let i = 0; i < schema.storage.length; i++) {
            const key = schema.storage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => schema.storage.removeItem(key));
    }
    
    /**
     * Cleanup expired entries
     */
    cleanup() {
        Object.keys(this.SCHEMAS).forEach(category => {
            const schema = this.SCHEMAS[category];
            if (!schema.ttl) return;
            
            const prefix = this._buildKey(category, '');
            const keysToRemove = [];
            
            for (let i = 0; i < schema.storage.length; i++) {
                const key = schema.storage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const rawValue = schema.storage.getItem(key);
                        if (rawValue) {
                            const data = JSON.parse(rawValue);
                            if (data.expiresAt && Date.now() > data.expiresAt) {
                                keysToRemove.push(key);
                            }
                        }
                    } catch (e) {
                        // Invalid data, remove it
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(key => schema.storage.removeItem(key));
        });
    }
    
    /**
     * Build storage key
     * @private
     */
    _buildKey(category, field) {
        return `${this.NAMESPACE}.${category}.${field}`;
    }
    
    /**
     * Migrate old keys to new structure
     */
    migrate() {
        const migrations = [
            { old: 'eek_session_id', new: { category: 'session', field: 'id' } },
            { old: 'eek_gclid', new: { category: 'tracking', field: 'gclid' } },
            { old: 'eek_gclid_timestamp', new: { category: 'tracking', field: 'gclidTimestamp' } },
            { old: 'eek_user_journey', new: { category: 'tracking', field: 'userJourney' } },
            { old: 'eek_visitor_data', new: { category: 'visitor', field: 'profile' } },
            { old: 'eek_last_sent_data', new: { category: 'tracking', field: 'lastSent' } }
        ];
        
        migrations.forEach(migration => {
            const oldValue = localStorage.getItem(migration.old);
            if (oldValue) {
                try {
                    const parsed = JSON.parse(oldValue);
                    this.set(migration.new.category, migration.new.field, parsed);
                    localStorage.removeItem(migration.old);
                    console.log(`Migrated ${migration.old} to ${migration.new.category}.${migration.new.field}`);
                } catch (e) {
                    // Try as string
                    this.set(migration.new.category, migration.new.field, oldValue);
                    localStorage.removeItem(migration.old);
                    console.log(`Migrated ${migration.old} to ${migration.new.category}.${migration.new.field}`);
                }
            }
        });
        
        // Migrate UTM parameters
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            const oldKey = `eek_${param}`;
            const value = localStorage.getItem(oldKey);
            if (value) {
                const utm = this.get('tracking', 'utm') || {};
                utm[param.replace('utm_', '')] = value;
                this.set('tracking', 'utm', utm);
                localStorage.removeItem(oldKey);
            }
        });
    }
}

// Initialize and export
window.storageManager = new StorageManager();

// Auto-migrate on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.storageManager.migrate();
    });
} else {
    window.storageManager.migrate();
}

export default StorageManager;
```

---

## 2. Tracking Core Module

### `scripts/tracking/tracking-core.js`

```javascript
/**
 * Core Tracking Engine
 * Single source of truth for all tracking functionality
 */
import { EventBus } from './event-bus.js';
import { DataNormalizer } from './data-normalizer.js';
import StorageManager from '../storage-manager.js';

class TrackingCore {
    constructor() {
        this.eventBus = new EventBus();
        this.normalizer = new DataNormalizer();
        this.storage = window.storageManager || new StorageManager();
        
        // Standardized field definitions
        this.STANDARD_FIELDS = {
            sessionId: 'sessionId',
            userId: 'userId',
            customerId: 'customerId',
            firstName: 'firstName',
            lastName: 'lastName',
            fullName: 'fullName',
            email: 'email',
            phone: 'phone',
            // ... (all fields from unified-tracking.js)
        };
        
        // Initialize
        this.sessionId = this.getOrCreateSessionId();
        this.trackingData = this.initializeTrackingData();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Get or create session ID
     */
    getOrCreateSessionId() {
        let sessionId = this.storage.get('session', 'id');
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.storage.set('session', 'id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Initialize tracking data
     */
    initializeTrackingData() {
        return {
            sessionId: this.sessionId,
            pageUrl: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            timestamp: new Date().toISOString(),
            // ... (other initialization)
        };
    }
    
    /**
     * Track event
     * @param {string} eventName - Event name
     * @param {string} category - Event category
     * @param {Object} data - Event data
     */
    trackEvent(eventName, category, data = {}) {
        const normalizedData = this.normalizer.normalize({
            ...this.trackingData,
            ...data,
            eventName,
            category,
            timestamp: new Date().toISOString()
        });
        
        // Emit event for adapters to handle
        this.eventBus.emit('track', {
            eventName,
            category,
            data: normalizedData
        });
        
        console.log(`📊 Tracked: ${eventName} (${category})`);
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        const pageViewKey = `pageViewSent_${this.sessionId}`;
        if (this.storage.get('session', pageViewKey)) {
            return; // Already sent
        }
        
        this.trackEvent('page_view', 'Page', {
            pageTitle: this.trackingData.pageTitle,
            pageUrl: this.trackingData.pageUrl,
            pagePath: this.trackingData.pagePath
        });
        
        this.storage.set('session', pageViewKey, true);
    }
    
    /**
     * Update tracking data
     * @param {string} field - Field name
     * @param {any} value - Field value
     */
    updateTrackingData(field, value) {
        if (this.STANDARD_FIELDS[field]) {
            this.trackingData[this.STANDARD_FIELDS[field]] = value;
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Page view on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.trackPageView();
            });
        } else {
            this.trackPageView();
        }
        
        // Form interactions
        document.addEventListener('submit', (e) => {
            this.trackEvent('form_submit', 'Form', {
                formId: e.target?.id || 'unknown'
            });
        });
    }
    
    /**
     * Get tracking data
     */
    getTrackingData() {
        return { ...this.trackingData };
    }
}

// Initialize
window.trackingCore = new TrackingCore();

export default TrackingCore;
```

---

## 3. Adapter Pattern Implementation

### `scripts/tracking/adapters/google-analytics.js`

```javascript
/**
 * Google Analytics Adapter
 * Handles all Google Analytics / Google Ads tracking
 */
import { EventBus } from '../event-bus.js';

class GoogleAnalyticsAdapter {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isLoaded = typeof gtag !== 'undefined';
        
        // Subscribe to tracking events
        this.eventBus.on('track', (event) => {
            this.handleTrackEvent(event);
        });
    }
    
    /**
     * Handle track event
     */
    handleTrackEvent(event) {
        if (!this.isLoaded) {
            console.warn('Google Analytics not loaded');
            return;
        }
        
        const { eventName, category, data } = event;
        
        // Map event to GA4 format
        const gaEvent = {
            event_category: category,
            event_label: data.eventLabel || eventName,
            ...this.mapCustomParameters(data)
        };
        
        // Send to Google Analytics
        gtag('event', eventName, gaEvent);
        
        // Handle conversions
        if (this.isConversionEvent(eventName)) {
            this.trackConversion(eventName, data);
        }
    }
    
    /**
     * Track conversion
     */
    trackConversion(eventName, data) {
        const conversionValue = this.getConversionValue(eventName, data);
        
        if (conversionValue > 0) {
            gtag('event', 'conversion', {
                send_to: 'AW-17084465163',
                value: conversionValue,
                currency: 'NZD',
                ...this.mapCustomParameters(data)
            });
        }
    }
    
    /**
     * Map custom parameters
     */
    mapCustomParameters(data) {
        return {
            session_id: data.sessionId,
            page_type: data.pageType,
            source_type: data.pageSource?.type,
            // ... (other mappings)
        };
    }
    
    /**
     * Check if event is a conversion
     */
    isConversionEvent(eventName) {
        const conversionEvents = [
            'booking_completed',
            'payment_confirmed',
            'phone_call_click',
            'form_submit'
        ];
        return conversionEvents.includes(eventName);
    }
    
    /**
     * Get conversion value
     */
    getConversionValue(eventName, data) {
        const values = {
            'booking_completed': data.price || 0,
            'payment_confirmed': data.price || 0,
            'phone_call_click': 25.00,
            'form_submit': 10.00
        };
        return values[eventName] || 0;
    }
}

export default GoogleAnalyticsAdapter;
```

### `scripts/tracking/adapters/power-automate.js`

```javascript
/**
 * Power Automate API Adapter
 * Handles all Power Automate API calls
 */
import { EventBus } from '../event-bus.js';

class PowerAutomateAdapter {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.API_ENDPOINTS = {
            tracking: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4',
            payment: 'https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q'
        };
        
        // Subscribe to tracking events
        this.eventBus.on('track', (event) => {
            this.handleTrackEvent(event);
        });
        
        // Throttle API calls
        this.pendingRequests = new Map();
        this.sendQueue = [];
    }
    
    /**
     * Handle track event
     */
    async handleTrackEvent(event) {
        const { eventName, data } = event;
        
        // Check if we should send this event
        if (!this.shouldSend(eventName, data)) {
            return;
        }
        
        // Add to queue
        this.sendQueue.push({ eventName, data });
        
        // Process queue
        this.processQueue();
    }
    
    /**
     * Check if event should be sent
     */
    shouldSend(eventName, data) {
        // Always send significant events
        const significantEvents = [
            'page_view',
            'form_submit',
            'booking_completed',
            'payment_confirmed'
        ];
        
        if (significantEvents.includes(eventName)) {
            return true;
        }
        
        // Check for data changes
        const lastSent = window.storageManager?.get('tracking', 'lastSent');
        if (!lastSent) return true;
        
        // Compare with last sent data
        return this.hasSignificantChanges(data, lastSent);
    }
    
    /**
     * Process send queue
     */
    async processQueue() {
        if (this.pendingRequests.size >= 3) {
            return; // Throttle to 3 concurrent requests
        }
        
        const item = this.sendQueue.shift();
        if (!item) return;
        
        const requestId = `${item.eventName}_${Date.now()}`;
        this.pendingRequests.set(requestId, item);
        
        try {
            await this.sendToAPI(item.eventName, item.data);
            this.pendingRequests.delete(requestId);
            
            // Update last sent data
            window.storageManager?.set('tracking', 'lastSent', item.data);
        } catch (error) {
            console.error('Power Automate API error:', error);
            this.pendingRequests.delete(requestId);
            
            // Retry logic could go here
        }
        
        // Process next item
        if (this.sendQueue.length > 0) {
            setTimeout(() => this.processQueue(), 100);
        }
    }
    
    /**
     * Send to Power Automate API
     */
    async sendToAPI(eventName, data) {
        const endpoint = this.API_ENDPOINTS.tracking;
        
        const payload = {
            ...data,
            eventType: eventName,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': navigator.userAgent
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        return response;
    }
    
    /**
     * Check for significant changes
     */
    hasSignificantChanges(newData, oldData) {
        // Compare key fields
        const keyFields = ['sessionId', 'gclid', 'name', 'phone', 'email', 'service', 'price'];
        
        return keyFields.some(field => {
            return newData[field] !== oldData[field];
        });
    }
}

export default PowerAutomateAdapter;
```

---

## 4. Booking Form Modules

### `scripts/booking/booking-core.js`

```javascript
/**
 * Core Booking System
 * Manages booking state and service configuration
 */
import { StepNavigator } from './step-navigation.js';
import { FormValidator } from './form-validation.js';

class BookingCore {
    constructor(serviceType) {
        this.serviceType = serviceType;
        this.config = null;
        this.formData = {};
        this.navigator = new StepNavigator(3);
        this.validator = new FormValidator();
        
        // Event emitter
        this.listeners = {};
        
        // Initialize
        this.loadServiceConfig(serviceType);
    }
    
    /**
     * Load service configuration
     */
    loadServiceConfig(serviceType) {
        // Load from config file
        const configs = window.serviceConfigs || {};
        this.config = configs[serviceType] || configs['fuel-extraction'];
        this.serviceType = serviceType;
        
        this.emit('configLoaded', this.config);
    }
    
    /**
     * Go to step
     */
    goToStep(stepNumber) {
        if (this.navigator.canProceed(stepNumber)) {
            this.navigator.goToStep(stepNumber);
            this.emit('stepChange', stepNumber);
        }
    }
    
    /**
     * Validate current step
     */
    validateStep(stepNumber) {
        const stepData = this.getStepData(stepNumber);
        const isValid = this.validator.validateStep(stepNumber, stepData);
        
        if (!isValid) {
            const errors = this.validator.getErrors();
            this.emit('validationError', { step: stepNumber, errors });
        }
        
        return isValid;
    }
    
    /**
     * Collect form data for step
     */
    collectFormData(stepNumber) {
        const stepData = {};
        
        switch (stepNumber) {
            case 1:
                stepData.name = document.getElementById('nameInput')?.value || '';
                stepData.phone = document.getElementById('phoneInput')?.value || '';
                stepData.email = document.getElementById('emailInput')?.value || '';
                stepData.location = document.getElementById('locationInput')?.value || '';
                stepData.rego = document.getElementById('regoInput')?.value || '';
                stepData.year = document.getElementById('yearInput')?.value || '';
                stepData.make = document.getElementById('makeInput')?.value || '';
                stepData.model = document.getElementById('modelInput')?.value || '';
                stepData.details = document.getElementById('detailsInput')?.value || '';
                break;
            case 2:
                stepData.urgency = this.formData.selectedUrgency || '';
                stepData.timeWindow = this.formData.selectedTimeWindow || '';
                break;
            case 3:
                stepData.termsAccepted = document.getElementById('termsAgree')?.checked || false;
                break;
        }
        
        this.formData = { ...this.formData, ...stepData };
        return stepData;
    }
    
    /**
     * Get step data
     */
    getStepData(stepNumber) {
        this.collectFormData(stepNumber);
        return this.formData;
    }
    
    /**
     * Get complete booking data
     */
    getBookingData() {
        return {
            ...this.formData,
            serviceType: this.serviceType,
            serviceCode: this.config?.serviceCode,
            serviceTitle: this.config?.title,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Event emitter methods
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

export default BookingCore;
```

### `scripts/booking/form-validation.js`

```javascript
/**
 * Form Validation Utilities
 */
class FormValidator {
    constructor() {
        this.errors = {};
        this.rules = {
            name: (value) => {
                if (!value || value.trim().length < 2) {
                    return 'Name must be at least 2 characters';
                }
                return null;
            },
            phone: (value) => {
                const digits = value.replace(/\D/g, '');
                if (digits.length < 9) {
                    return 'Phone number must have at least 9 digits';
                }
                return null;
            },
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'Please enter a valid email address';
                }
                return null;
            },
            rego: (value) => {
                const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (sanitized.length < 2) {
                    return 'Please enter a valid registration number';
                }
                return sanitized;
            },
            year: (value) => {
                const year = parseInt(value.replace(/\D/g, ''));
                const currentYear = new Date().getFullYear();
                if (year < 1900 || year > currentYear) {
                    return 'Please enter a valid year';
                }
                return null;
            },
            location: (value) => {
                if (!value || value.trim().length < 3) {
                    return 'Please enter a valid location';
                }
                return null;
            }
        };
    }
    
    /**
     * Validate step
     */
    validateStep(stepNumber, formData) {
        this.errors = {};
        let isValid = true;
        
        switch (stepNumber) {
            case 1:
                isValid = this.validateStep1(formData);
                break;
            case 2:
                isValid = this.validateStep2(formData);
                break;
            case 3:
                isValid = this.validateStep3(formData);
                break;
        }
        
        return isValid;
    }
    
    /**
     * Validate step 1
     */
    validateStep1(formData) {
        let isValid = true;
        
        // Validate name
        const nameError = this.rules.name(formData.name);
        if (nameError) {
            this.errors.name = nameError;
            isValid = false;
        }
        
        // Validate phone
        const phoneError = this.rules.phone(formData.phone);
        if (phoneError) {
            this.errors.phone = phoneError;
            isValid = false;
        }
        
        // Validate email
        const emailError = this.rules.email(formData.email);
        if (emailError) {
            this.errors.email = emailError;
            isValid = false;
        }
        
        // Validate rego
        const regoError = this.rules.rego(formData.rego);
        if (regoError && typeof regoError === 'string') {
            this.errors.rego = regoError;
            isValid = false;
        }
        
        // Validate year
        const yearError = this.rules.year(formData.year);
        if (yearError) {
            this.errors.year = yearError;
            isValid = false;
        }
        
        // Validate location
        const locationError = this.rules.location(formData.location);
        if (locationError) {
            this.errors.location = locationError;
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Validate step 2
     */
    validateStep2(formData) {
        if (!formData.urgency) {
            this.errors.urgency = 'Please select a service time';
            return false;
        }
        return true;
    }
    
    /**
     * Validate step 3
     */
    validateStep3(formData) {
        if (!formData.termsAccepted) {
            this.errors.terms = 'Please accept the terms and conditions';
            return false;
        }
        return true;
    }
    
    /**
     * Get errors
     */
    getErrors() {
        return { ...this.errors };
    }
    
    /**
     * Get error for field
     */
    getError(field) {
        return this.errors[field] || null;
    }
    
    /**
     * Clear errors
     */
    clearErrors() {
        this.errors = {};
    }
}

export default FormValidator;
```

---

## 5. Usage Example

### `scripts/booking-init.js`

```javascript
/**
 * Booking Form Initialization
 * Wires up all modules and handles user interactions
 */
import BookingCore from './booking/booking-core.js';
import { PricingCalculator } from './booking/pricing-calculator.js';
import { PaymentHandler } from './booking/payment-handler.js';
import { UIState } from './ui/ui-state.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get service type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('service') || 'fuel-extraction';
    
    // Initialize core systems
    const bookingCore = new BookingCore(serviceType);
    const calculator = new PricingCalculator(bookingCore.config);
    const paymentHandler = new PaymentHandler(PAYMENT_API_URL);
    const uiState = new UIState();
    
    // Wire up event handlers
    document.getElementById('nextBtn').addEventListener('click', async () => {
        // Collect current step data
        bookingCore.collectFormData(bookingCore.navigator.currentStep);
        
        // Validate
        if (bookingCore.validateStep(bookingCore.navigator.currentStep)) {
            // Move to next step
            bookingCore.goToStep(bookingCore.navigator.currentStep + 1);
            
            // Update UI
            updateProgressBar(bookingCore.navigator.currentStep);
            updateStepDisplay(bookingCore.navigator.currentStep);
        } else {
            // Show validation errors
            const errors = bookingCore.validator.getErrors();
            displayErrors(errors);
        }
    });
    
    // Track booking events
    if (window.trackingCore) {
        bookingCore.on('stepChange', (step) => {
            window.trackingCore.trackEvent('booking_step', 'Booking', {
                step: step,
                serviceType: serviceType
            });
        });
        
        bookingCore.on('configLoaded', (config) => {
            window.trackingCore.trackEvent('booking_started', 'Booking', {
                serviceType: serviceType,
                serviceTitle: config.title
            });
        });
    }
    
    // Initialize UI
    loadServiceConfig(serviceType);
    updateProgressBar(1);
});

function updateProgressBar(step) {
    // Update progress bar UI
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index + 1 < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (index + 1 === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });
}

function updateStepDisplay(step) {
    // Show/hide step content
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 === step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function displayErrors(errors) {
    // Display validation errors in UI
    Object.keys(errors).forEach(field => {
        const input = document.getElementById(`${field}Input`);
        if (input) {
            input.classList.add('error');
            // Show error message
        }
    });
}
```

---

## Summary

These implementation examples demonstrate:

1. **Clear separation of concerns**: Each module has a single responsibility
2. **Consistent interfaces**: Standardized APIs across modules
3. **Event-driven architecture**: Modules communicate via events
4. **Storage abstraction**: Centralized storage management
5. **Adapter pattern**: External services accessed through adapters
6. **Backward compatibility**: Can be gradually integrated

The actual implementation would follow these patterns, ensuring maintainability and reducing fragility.


