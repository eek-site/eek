# EEK PLATFORM DATA STRUCTURE AUDIT REPORT

## Executive Summary
**Date:** 2025-01-24  
**Status:** CRITICAL INCONSISTENCIES FOUND  
**Action Required:** IMMEDIATE STANDARDIZATION NEEDED

## Problem Statement
The EEK platform has **multiple different data structures** being sent to Power Automate workflows across different pages, causing:
- Power Automate template language expression errors
- "Property selection is not supported on values of type 'String'" errors
- Inconsistent email template data
- Broken workflows and failed conversions

## Pages Audited

### 1. **index.html** (Homepage)
**Status:** ❌ INCONSISTENT
**Data Structure:** Custom structure with `site`, `device`, `utm` objects
**Issues:**
- Uses `site` object instead of standard `pageSource`
- Missing `visitorData` and `customerData` objects
- Location is object (correct) but missing email template compatibility

### 2. **pre-purchase-vehicle-inspection/script.js** (Inspection Form)
**Status:** ✅ MOSTLY COMPLIANT (Recently Fixed)
**Data Structure:** Payment JSON SSOT structure
**Issues:**
- ✅ Has both `customerData.location` (string) and `visitorData.location` (object)
- ✅ Includes all required nested objects
- ✅ Follows payment JSON structure

### 3. **thanks/index.html** (Confirmation Page)
**Status:** ❌ INCONSISTENT
**Data Structure:** Custom `canon` object structure
**Issues:**
- Uses `canon` object instead of standard structure
- Missing `visitorData` and `customerData` objects
- Location handling inconsistent

### 4. **mjuris/index.html** (Legal Portal)
**Status:** ❌ INCONSISTENT
**Data Structure:** Custom structure with `page`, `authority`, `security` objects
**Issues:**
- Uses `page` object instead of standard `pageSource`
- Missing `visitorData` and `customerData` objects
- Custom `authority` and `security` objects not in SSOT

### 5. **more-options/index.html** (More Options Page)
**Status:** ❌ INCONSISTENT
**Data Structure:** Custom structure with `site` object
**Issues:**
- Uses `site` object instead of standard `pageSource`
- Missing `visitorData` and `customerData` objects
- Location is object (correct) but missing email template compatibility

### 6. **supplier/index.html** (Supplier Portal)
**Status:** ❌ INCONSISTENT
**Data Structure:** Custom structure
**Issues:**
- Missing `visitorData` and `customerData` objects
- Custom supplier-specific fields not in SSOT
- Location handling inconsistent

### 7. **unified-tracking.js** (Tracking System)
**Status:** ✅ MOSTLY COMPLIANT
**Data Structure:** Follows payment JSON structure
**Issues:**
- ✅ Has proper `visitorData` structure
- ✅ Includes all required nested objects
- ✅ Follows payment JSON structure

## Critical Issues Found

### 1. **Location Field Inconsistency**
- **Payment APIs:** Expect `customerData.location` as **string**
- **Email Templates:** Expect `visitorData.location` as **object**
- **Current State:** Mixed implementations across pages

### 2. **Missing Required Objects**
- **visitorData:** Missing on 5 out of 7 pages
- **customerData:** Missing on 5 out of 7 pages
- **trackingData:** Missing on 4 out of 7 pages

### 3. **Inconsistent Field Names**
- **pageSource vs site vs page:** Different names for same concept
- **location vs locationObject:** Inconsistent naming
- **device vs deviceData:** Inconsistent naming

### 4. **Missing Email Template Compatibility**
- **5 out of 7 pages** don't send data compatible with email templates
- **Power Automate workflows** failing due to missing nested objects

## Recommended Actions

### Phase 1: Immediate Fixes (Critical)
1. **Standardize all pages** to use payment JSON structure
2. **Add missing objects** (`visitorData`, `customerData`, `trackingData`)
3. **Fix location field** inconsistencies
4. **Update field names** to match SSOT

### Phase 2: Validation & Testing
1. **Test all Power Automate workflows** with standardized data
2. **Validate email templates** work with new structure
3. **Performance testing** of unified data structure

### Phase 3: Documentation & Maintenance
1. **Update documentation** with SSOT structure
2. **Create validation tools** for future changes
3. **Establish review process** for data structure changes

## Payment JSON Structure (SSOT)

The payment JSON structure from `pre-purchase-vehicle-inspection/script.js` is established as the **Single Source of Truth**:

```javascript
{
  // Root Level Fields
  sessionId: 'string',
  gclid: 'string|null',
  gclidState: 'string',
  eventType: 'string',
  timestamp: 'string',
  name: 'string',
  phone: 'string',
  email: 'string',
  location: 'string', // For payment API compatibility
  
  // Nested Objects
  customerData: {
    location: 'string', // String for payment API
    locationObject: { // Object for email templates
      city: 'string',
      region: 'string',
      country: 'string',
      coordinates: { ... }
    }
  },
  
  visitorData: {
    location: { // Object for email templates
      city: 'string',
      region: 'string',
      country: 'string',
      coordinates: { ... }
    }
  },
  
  trackingData: { ... },
  pageSource: { ... },
  device: { ... },
  engagement: { ... },
  userJourney: { ... },
  utm: { ... }
}
```

## Next Steps

1. **Create standardized data builder** for all pages
2. **Update all pages** to use payment JSON structure
3. **Test all workflows** with consistent data
4. **Monitor for errors** and validate fixes

## Risk Assessment

**HIGH RISK:** Current inconsistencies are causing:
- Failed Power Automate workflows
- Broken email templates
- Lost conversions
- Poor user experience

**IMMEDIATE ACTION REQUIRED** to prevent further data loss and workflow failures.
