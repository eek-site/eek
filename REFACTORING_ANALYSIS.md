# EEK Platform Refactoring Analysis & Consolidation Plan

## Executive Summary

This document provides a comprehensive analysis of the EEK platform codebase, identifying consolidation opportunities, storage inconsistencies, and architectural improvements. The focus is on maintainability and reducing fragility before scaling further.

---

## Task 1: Duplicated Tracking Functionality Analysis

### Current State: Multiple Tracking Systems

#### 1.1 Tracking Files Identified

1. **`unified-tracking.js`** (1,472 lines)
   - **Purpose**: "Single Source of Truth" for tracking
   - **Features**: 
     - Standardized field names
     - Power Automate API integration
     - Google Analytics (gtag) integration
     - Reddit Pixel (rdt) integration
     - Session management
     - User journey tracking
     - Engagement metrics
   - **Status**: Most comprehensive, but still has overlap

2. **`tracking-manager.js`** (357 lines)
   - **Purpose**: Conversion tracking with values
   - **Features**:
     - Conversion value mapping
     - Service type mapping
     - Google Analytics events
     - Reddit Pixel events
     - Scroll tracking
     - Phone call tracking
   - **Status**: Duplicates functionality in unified-tracking.js

3. **`enhanced-tracking.js`** (539 lines)
   - **Purpose**: "Enhanced Tracking System for Maximum Data Value"
   - **Features**:
     - Page source detection
     - User journey tracking
     - Engagement metrics
     - Power Automate API integration
   - **Status**: Nearly identical to unified-tracking.js

4. **`tracking-diagnostic.js`** (219 lines)
   - **Purpose**: Diagnostic tool for testing tracking
   - **Status**: Utility file, can be kept

5. **Inline Tracking in HTML Files**
   - Multiple instances of `trackConversion()` calls
   - Direct `gtag()` and `rdt()` calls
   - Custom tracking logic in `book-service/index.html`

### 1.2 Duplication Patterns

#### Pattern 1: Page View Tracking
- **unified-tracking.js**: `trackPageView()` (lines 499-525)
- **tracking-manager.js**: `trackPageView()` (lines 68-80)
- **enhanced-tracking.js**: `trackPageView()` (lines 233-260)
- **book-service/index.html**: Inline tracking initialization

#### Pattern 2: Conversion Tracking
- **tracking-manager.js**: `trackConversion()` (lines 156-191)
- **book-service/index.html**: `window.trackConversion` wrapper (line 349)
- Multiple HTML files: Direct `trackConversion()` calls

#### Pattern 3: Google Analytics Integration
- All three tracking files have `gtag()` integration
- Inconsistent event naming and data structures

#### Pattern 4: Reddit Pixel Integration
- All three tracking files have `rdt()` integration
- Different event structures

#### Pattern 5: Power Automate API Calls
- **unified-tracking.js**: `sendTrackingData()` (lines 1039-1272)
- **enhanced-tracking.js**: `sendTrackingData()` (lines 480-522)
- **book-service/index.html**: Direct API calls

### 1.3 Proposed Consolidated Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRACKING CORE MODULE                       │
│                  (tracking-core.js)                          │
│                                                               │
│  • Standardized field definitions                            │
│  • Event bus/emitter pattern                                 │
│  • Data normalization                                        │
│  • API client (Power Automate)                               │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Google     │  │    Reddit     │  │   Custom     │
│   Analytics  │  │    Pixel     │  │   Webhooks   │
│   Adapter    │  │   Adapter    │  │   Adapter    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Event      │
                    │   Router     │
                    └──────────────┘
```

#### Architecture Principles

1. **Single Responsibility**: Each module has one clear purpose
2. **Adapter Pattern**: External services (GA, Reddit, Power Automate) accessed through adapters
3. **Event-Driven**: Core module emits events, adapters subscribe
4. **Backward Compatibility**: Legacy function wrappers for gradual migration

#### Proposed File Structure

```
tracking/
├── core/
│   ├── tracking-core.js          # Main tracking engine
│   ├── event-bus.js              # Event system
│   ├── data-normalizer.js        # Data standardization
│   └── storage-manager.js        # localStorage/sessionStorage abstraction
├── adapters/
│   ├── google-analytics.js       # GA4 adapter
│   ├── reddit-pixel.js           # Reddit Pixel adapter
│   ├── power-automate.js         # Power Automate API adapter
│   └── custom-webhook.js         # Custom webhook adapter
├── events/
│   ├── page-view.js              # Page view tracking
│   ├── conversion.js             # Conversion tracking
│   ├── engagement.js             # Engagement metrics
│   └── form-interaction.js       # Form tracking
└── utils/
    ├── diagnostic.js             # Diagnostic tools (existing)
    └── helpers.js                # Utility functions
```

#### Migration Strategy

**Phase 1: Core Module** (Week 1)
- Extract common functionality from unified-tracking.js
- Create event bus system
- Implement data normalizer

**Phase 2: Adapters** (Week 2)
- Create Google Analytics adapter
- Create Reddit Pixel adapter
- Create Power Automate adapter

**Phase 3: Event Handlers** (Week 3)
- Migrate page view tracking
- Migrate conversion tracking
- Migrate engagement tracking

**Phase 4: Cleanup** (Week 4)
- Remove old tracking files
- Update HTML files to use new system
- Add backward compatibility wrappers

---

## Task 2: Data Storage Strategy

### 2.1 Current Storage Usage

#### localStorage Keys (Inconsistent Naming)

| Key | Used In | Purpose | Issue |
|-----|---------|---------|-------|
| `eek_session_id` | unified-tracking.js, book-service/index.html | Session identifier | ✅ Consistent |
| `eek_gclid` | unified-tracking.js, book-service/index.html | Google Click ID | ✅ Consistent |
| `eek_gclid_timestamp` | unified-tracking.js, book-service/index.html | GCLID expiration | ✅ Consistent |
| `eek_utm_source` | unified-tracking.js, book-service/index.html | UTM source | ✅ Consistent |
| `eek_utm_medium` | unified-tracking.js, book-service/index.html | UTM medium | ✅ Consistent |
| `eek_utm_campaign` | unified-tracking.js, book-service/index.html | UTM campaign | ✅ Consistent |
| `eek_utm_term` | unified-tracking.js, book-service/index.html | UTM term | ✅ Consistent |
| `eek_utm_content` | unified-tracking.js, book-service/index.html | UTM content | ✅ Consistent |
| `eek_user_journey` | unified-tracking.js, enhanced-tracking.js | Page history | ⚠️ Duplicated logic |
| `eek_visitor_data` | book-service/index.html | Visitor information | ⚠️ Unclear purpose |
| `eek_last_sent_data` | unified-tracking.js | Last API payload | ⚠️ Could be optimized |
| `eek_session_start` | unified-tracking.js | Session start time | ⚠️ Not consistently used |

#### sessionStorage Keys

| Key | Used In | Purpose | Issue |
|-----|---------|---------|-------|
| `page_view_sent_${sessionId}` | unified-tracking.js | Prevent duplicate page views | ✅ Good pattern |
| `gclid` | phone-manager.js | GCLID storage | ❌ Inconsistent with localStorage |

### 2.2 Storage Strategy Issues

1. **Naming Inconsistency**: Mix of `eek_` prefix and non-prefixed keys
2. **Purpose Overlap**: `eek_visitor_data` vs `eek_user_journey` - unclear boundaries
3. **Expiration Logic**: GCLID has expiration, but other data doesn't
4. **Storage Type Confusion**: Some data in localStorage that should be sessionStorage
5. **No Cleanup**: Old data accumulates indefinitely

### 2.3 Proposed Storage Strategy

#### Storage Abstraction Layer

```javascript
// storage-manager.js
class StorageManager {
    // Namespace all keys under 'eek'
    NAMESPACE = 'eek';
    
    // Define storage types
    STORAGE_TYPES = {
        SESSION: 'session',      // Session-only data
        PERSISTENT: 'persistent', // Cross-session data
        TEMPORARY: 'temporary'    // Time-limited data
    };
    
    // Define data schemas
    SCHEMAS = {
        session: {
            key: 'session',
            storage: sessionStorage,
            ttl: null, // Session lifetime
            fields: ['sessionId', 'pageViewSent', 'currentStep']
        },
        tracking: {
            key: 'tracking',
            storage: localStorage,
            ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
            fields: ['gclid', 'utm', 'userJourney', 'lastSentData']
        },
        visitor: {
            key: 'visitor',
            storage: localStorage,
            ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
            fields: ['name', 'phone', 'email', 'preferences']
        }
    };
}
```

#### Standardized Key Structure

```
eek.{category}.{field}
```

**Categories:**
- `session` - Session-only data (sessionStorage)
- `tracking` - Tracking/attribution data (localStorage, 30-day TTL)
- `visitor` - Visitor profile data (localStorage, 90-day TTL)
- `form` - Form state (sessionStorage)
- `ui` - UI state (sessionStorage)

#### Migration Map

| Old Key | New Key | Storage Type | TTL |
|---------|---------|--------------|-----|
| `eek_session_id` | `eek.session.id` | sessionStorage | Session |
| `eek_gclid` | `eek.tracking.gclid` | localStorage | 30 days |
| `eek_gclid_timestamp` | `eek.tracking.gclidTimestamp` | localStorage | 30 days |
| `eek_utm_*` | `eek.tracking.utm.*` | localStorage | 30 days |
| `eek_user_journey` | `eek.tracking.userJourney` | localStorage | 30 days |
| `eek_visitor_data` | `eek.visitor.profile` | localStorage | 90 days |
| `eek_last_sent_data` | `eek.tracking.lastSent` | localStorage | 7 days |
| `page_view_sent_*` | `eek.session.pageViewSent` | sessionStorage | Session |

#### Implementation

```javascript
// Example usage
const storage = new StorageManager();

// Get session ID
const sessionId = storage.get('session', 'id');

// Store GCLID with automatic expiration
storage.set('tracking', 'gclid', gclidValue);

// Get visitor data
const visitor = storage.get('visitor', 'profile');

// Automatic cleanup on init
storage.cleanup(); // Removes expired data
```

---

## Task 3: Monolithic HTML Breakdown

### 3.1 Current State: `book-service/index.html`

**Size**: 2,957 lines
**Issues**:
- Inline styles (~150 lines)
- Inline scripts (~1,200 lines)
- Business logic mixed with presentation
- No separation of concerns

### 3.2 Proposed Module Structure

```
book-service/
├── index.html              # Clean HTML structure only
├── styles/
│   └── booking-form.css    # All styles extracted
├── scripts/
│   ├── booking-core.js     # Core booking logic
│   ├── form-validation.js  # Form validation
│   ├── step-navigation.js  # Step management
│   ├── pricing-calculator.js # Price calculations
│   └── payment-handler.js  # Payment link generation
└── config/
    └── service-configs.js  # Service configurations
```

### 3.3 Module Interfaces

#### `booking-core.js`
```javascript
/**
 * Core booking system
 * Handles: Service configuration, step management, data collection
 */
class BookingCore {
    constructor(serviceType) {
        this.serviceType = serviceType;
        this.currentStep = 1;
        this.formData = {};
    }
    
    // Public API
    loadServiceConfig(serviceType) {}
    goToStep(stepNumber) {}
    validateStep(stepNumber) {}
    collectFormData() {}
    getBookingData() {}
}
```

#### `form-validation.js`
```javascript
/**
 * Form validation utilities
 */
class FormValidator {
    validateName(name) {}
    validatePhone(phone) {}
    validateEmail(email) {}
    validateRego(rego) {}
    validateYear(year) {}
    validateLocation(location) {}
    validateStep(stepNumber, formData) {}
}
```

#### `step-navigation.js`
```javascript
/**
 * Step navigation and progress tracking
 */
class StepNavigator {
    constructor(totalSteps) {
        this.totalSteps = totalSteps;
        this.currentStep = 1;
    }
    
    goToStep(stepNumber) {}
    nextStep() {}
    previousStep() {}
    updateProgress() {}
    canProceed(stepNumber) {}
}
```

#### `pricing-calculator.js`
```javascript
/**
 * Price calculation logic
 */
class PricingCalculator {
    constructor(serviceConfig) {
        this.config = serviceConfig;
    }
    
    calculateBasePrice(serviceType) {}
    calculateUrgencyPrice(urgencyLevel) {}
    calculateTotalPrice(options) {}
    getPriceBreakdown() {}
}
```

#### `payment-handler.js`
```javascript
/**
 * Payment link generation and handling
 */
class PaymentHandler {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }
    
    async generatePaymentLink(bookingData) {}
    buildPaymentPayload(bookingData) {}
    handlePaymentSuccess(response) {}
    handlePaymentError(error) {}
}
```

#### `ui-state.js`
```javascript
/**
 * UI state management
 */
class UIState {
    constructor() {
        this.state = {
            loading: false,
            errors: {},
            touched: {},
            submitted: false
        };
    }
    
    setLoading(loading) {}
    setError(field, message) {}
    clearError(field) {}
    setTouched(field) {}
    updateState(updates) {}
    getState() {}
}
```

#### `modal.js`
```javascript
/**
 * Modal management
 */
class ModalManager {
    constructor() {
        this.activeModal = null;
    }
    
    open(modalId, options) {}
    close(modalId) {}
    closeAll() {}
    isOpen(modalId) {}
}
```

### 3.4 Clean HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Service - Eek Mechanical</title>
    
    <!-- External Styles -->
    <link rel="stylesheet" href="/styles/booking-form.css">
</head>
<body>
    <header>
        <!-- Header content -->
    </header>
    
    <main>
        <div class="booking-container">
            <!-- Booking form structure -->
        </div>
    </main>
    
    <!-- External Scripts -->
    <script src="/scripts/booking-core.js"></script>
    <script src="/scripts/form-validation.js"></script>
    <script src="/scripts/step-navigation.js"></script>
    <script src="/scripts/pricing-calculator.js"></script>
    <script src="/scripts/payment-handler.js"></script>
    <script src="/scripts/ui-state.js"></script>
    <script src="/scripts/booking-init.js"></script>
</body>
</html>
```

### 3.5 Module Communication Contract

```javascript
// booking-init.js - Initialization and wiring
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core systems
    const bookingCore = new BookingCore(serviceType);
    const validator = new FormValidator();
    const navigator = new StepNavigator(3);
    const calculator = new PricingCalculator(serviceConfig);
    const paymentHandler = new PaymentHandler(PAYMENT_API_URL);
    const uiState = new UIState();
    
    // Wire up event handlers
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (validator.validateStep(navigator.currentStep, bookingCore.formData)) {
            navigator.nextStep();
            bookingCore.goToStep(navigator.currentStep);
        }
    });
    
    // Initialize tracking
    if (window.unifiedTracking) {
        bookingCore.on('stepChange', (step) => {
            window.unifiedTracking.trackEvent('booking_step', 'Booking', step);
        });
    }
});
```

---

## Task 4: System Architecture Documentation

### 4.1 Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   HTML       │  │   CSS        │  │   JavaScript │    │
│  │   Pages      │  │   Styles     │  │   Modules     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│         ┌──────────────────▼──────────────────┐            │
│         │     Tracking System                 │            │
│         │  (unified-tracking.js)              │            │
│         └──────────────────┬──────────────────┘            │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Google     │    │    Reddit     │    │   Power      │
│   Analytics  │    │    Pixel      │    │   Automate   │
│   (GA4)      │    │               │    │   API        │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │   Stripe     │
                    │   Payment    │
                    │   API        │
                    └──────────────┘
```

### 4.2 Data Flow

#### 4.2.1 Page Load Flow

```
1. User visits page
   ↓
2. HTML loads
   ↓
3. External scripts load:
   - unified-tracking.js
   - phone-manager.js
   - footer-new.js
   ↓
4. unified-tracking.js initializes:
   - Creates/retrieves sessionId
   - Detects page source (UTM, GCLID, referrer)
   - Initializes tracking data
   - Sends page_view event
   ↓
5. Page-specific scripts initialize:
   - Booking form logic
   - UI state management
   ↓
6. User interactions tracked:
   - Form field focus/blur
   - Button clicks
   - Scroll depth
   - Time on page
```

#### 4.2.2 Booking Flow

```
1. User fills Step 1 (Service Details)
   ↓
2. Form validation
   ↓
3. sendBookingUpdate('details_complete')
   → unified-tracking.sendTrackingData()
   → Power Automate API
   ↓
4. User selects Step 2 (Scheduling)
   ↓
5. sendBookingUpdate('time_selected')
   → unified-tracking.sendTrackingData()
   → Power Automate API
   ↓
6. User accepts terms (Step 3)
   ↓
7. sendBookingUpdate('terms_accepted')
   → unified-tracking.sendTrackingData()
   → Power Automate API
   ↓
8. generatePaymentLink()
   → Payment API (Power Automate)
   → Stripe Checkout Session
   ↓
9. User redirected to Stripe
   ↓
10. Payment confirmation
    → Stripe webhook
    → Power Automate
    → SMS notification
    → Email confirmation
```

#### 4.2.3 Tracking Data Flow

```
User Action
   ↓
Event Emitted (e.g., 'form_submit')
   ↓
unified-tracking.js captures event
   ↓
Data normalized using STANDARD_FIELDS
   ↓
Payload built with:
   - Session data
   - Page source
   - User journey
   - Engagement metrics
   - Form data
   ↓
Multiple destinations:
   ├─→ Google Analytics (gtag)
   ├─→ Reddit Pixel (rdt)
   └─→ Power Automate API
       ↓
   Power Automate workflow:
   ├─→ SharePoint (data storage)
   ├─→ Email notification
   └─→ SMS notification
```

### 4.3 External Dependencies

#### 4.3.1 Google Analytics / Google Ads
- **Purpose**: Analytics and conversion tracking
- **Integration**: `gtag()` function
- **Events Tracked**: page_view, conversion, custom events
- **Data Sent**: Event name, category, label, value, custom parameters

#### 4.3.2 Reddit Pixel
- **Purpose**: Reddit ad conversion tracking
- **Integration**: `rdt()` function
- **Events Tracked**: PageVisit, Lead, Custom
- **Data Sent**: Custom event data, conversion values

#### 4.3.3 Power Automate
- **Endpoints**:
  1. **Tracking API**: `2f31c90260554c5a9d6dcffec47bc6c2`
     - Purpose: General tracking events
     - Trigger: Manual HTTP request
     - Output: SharePoint list item, email notification
   
  2. **Payment API**: `dbc93a177083499caf5a06eeac87683c`
     - Purpose: Payment link generation
     - Trigger: Manual HTTP request
     - Output: Stripe checkout session, email notification
   
  3. **SharePoint Lookup**: `c35b9414a0be42f88182ae7e6e409f1d`
     - Purpose: Data lookup/validation
     - Trigger: Manual HTTP request

#### 4.3.4 Stripe
- **Purpose**: Payment processing
- **Integration**: Stripe Checkout (hosted)
- **Flow**: 
  1. Payment link generated via Power Automate
  2. User redirected to Stripe Checkout
  3. Payment processed
  4. Webhook to Power Automate
  5. Confirmation email/SMS sent

#### 4.3.5 Cloudflare (CF_GEO)
- **Purpose**: Geolocation data
- **Integration**: `window.CF_GEO` object
- **Data**: Country, region, city, coordinates, timezone

### 4.4 Data Storage Locations

#### Client-Side (Browser)
- **localStorage**: Persistent data (30-90 day TTL)
  - Session IDs
  - GCLID
  - UTM parameters
  - User journey
  - Visitor data
  
- **sessionStorage**: Session-only data
  - Page view flags
  - Form state
  - UI state

#### Server-Side (Power Automate / SharePoint)
- **SharePoint Lists**: Booking data, tracking events
- **Email Templates**: Notification emails
- **SMS Gateway**: Text message notifications

### 4.5 Key Integration Points

1. **Tracking → Power Automate**: All tracking events sent via `sendTrackingData()`
2. **Booking → Payment**: Payment link generation via Power Automate API
3. **Payment → Confirmation**: Stripe webhook triggers Power Automate workflow
4. **Power Automate → Notifications**: Email and SMS sent via Power Automate

---

## Implementation Priority

### Phase 1: Critical (Weeks 1-2)
1. ✅ Consolidate tracking systems
2. ✅ Standardize storage keys
3. ✅ Extract styles from HTML

### Phase 2: High Priority (Weeks 3-4)
4. ✅ Break down booking form into modules
5. ✅ Implement storage abstraction layer
6. ✅ Add backward compatibility wrappers

### Phase 3: Medium Priority (Weeks 5-6)
7. ✅ Refactor other HTML files
8. ✅ Add comprehensive error handling
9. ✅ Performance optimization

### Phase 4: Low Priority (Weeks 7-8)
10. ✅ Documentation updates
11. ✅ Testing and validation
12. ✅ Gradual rollout

---

## Risk Mitigation

1. **Backward Compatibility**: Maintain legacy function wrappers during migration
2. **Gradual Rollout**: Migrate one module at a time
3. **Feature Flags**: Use feature flags to enable/disable new system
4. **Monitoring**: Track errors and performance during migration
5. **Rollback Plan**: Keep old files until migration is complete

---

## Success Metrics

1. **Code Reduction**: 30-40% reduction in total lines of code
2. **Maintainability**: Single source of truth for each concern
3. **Performance**: No degradation in page load times
4. **Reliability**: Zero tracking data loss during migration
5. **Developer Experience**: Clear module boundaries and interfaces

---

## Next Steps

1. Review and approve this plan
2. Create feature branch for refactoring
3. Begin Phase 1 implementation
4. Set up monitoring and testing
5. Schedule regular review meetings


