# API Security Documentation - Book Service Payment API

## Overview

This document explains what happens when someone attempts to bypass the frontend booking flow and send API requests directly to the Payment API endpoint.

## Frontend Protection (Client-Side)

### What Happens When Someone Tries to Bypass via Browser Console

If someone tries to call `generatePaymentLink()` directly from the browser console, they will encounter multiple validation checks that **block the request**:

1. **Button State Check** - Function verifies the payment button exists and is enabled
2. **Terms Acceptance** - Must have accepted terms checkbox checked
3. **Step Completion Validation** - Must have completed Step 1, Step 2, and be on Step 3
4. **Required Fields Validation** - All form fields must be filled and valid:
   - Name, Phone, Email
   - Location
   - Vehicle Registration, Year, Make, Model
   - Service time/urgency selection
5. **Step 3 Active Check** - Step 3 confirmation page must be visible and active
6. **Price Validation** - Price must be valid (> 0)

**Result**: The function returns early with an alert message before any API call is made.

### Example Console Attempt

```javascript
// This will FAIL with validation errors
generatePaymentLink()
// Alert: "Please complete all booking steps before generating payment link."
```

## Direct API Request Protection

### What Data is Sent to the API

When a **legitimate** request is made, the API receives:

```json
{
  "rego": "ABC123",
  "amount": 39900,
  "currency": "NZD",
  "description": "Wrong Fuel Extraction Service - ABC123 2018 Toyota Corolla - Auckland",
  "redirectUrl": "https://www.eek.nz/thanks?...",
  
  // SECURITY VALIDATION DATA
  "validationToken": "token_abc123_1234567890",
  "stepCompletionState": {
    "step1Completed": true,
    "step2Completed": true,
    "step3Active": true,
    "step1Timestamp": "2024-01-15T10:30:00.000Z",
    "step2Timestamp": "2024-01-15T10:32:00.000Z",
    "step3Timestamp": "2024-01-15T10:33:00.000Z"
  },
  
  // Customer data
  "name": "John Smith",
  "phone": "0212345678",
  "email": "john@example.com",
  "location": { ... },
  "price": 399,
  "service": "fuel-extraction",
  "serviceCode": "FUEL",
  
  // Tracking data
  "sessionId": "session_1234567890_abc123",
  "gclid": "...",
  "trackingData": { ... }
}
```

### What a Malicious Request Would Look Like

If someone bypasses the frontend and sends a direct HTTP request, they would need to:

1. **Know the API URL** (exposed in frontend code - cannot be hidden)
2. **Construct a valid JSON payload** with all required fields
3. **Generate or guess a validation token** (unlikely without completing the flow)
4. **Provide valid step completion timestamps** (would need to understand the flow)

**Example Malicious Request** (would likely fail validation):

```bash
curl -X POST "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dbc93a177083499caf5a06eeac87683c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vXidGdo8qErY4QVv03JeNaGbA79eWEoiOxuDocljL6Q" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "NZD",
    "name": "Fake Name",
    "phone": "0000000000",
    "email": "fake@example.com"
  }'
```

## Backend Validation Recommendations

### Critical: Your Power Automate Workflow Should Validate

Since the API URL is exposed in frontend code, **server-side validation is essential**. Your Power Automate workflow should check:

#### 1. Required Fields Validation
```javascript
// Pseudo-code for Power Automate validation
if (!data.name || !data.phone || !data.email) {
  return { error: "Missing required customer information" };
}

if (!data.rego || !data.year || !data.make || !data.model) {
  return { error: "Missing required vehicle information" };
}

if (!data.amount || data.amount <= 0) {
  return { error: "Invalid payment amount" };
}
```

#### 2. Validation Token Check
```javascript
// Check if validation token exists and is valid format
if (!data.validationToken || !data.validationToken.startsWith('token_')) {
  return { 
    error: "Invalid booking flow - missing validation token",
    suspicious: true 
  };
}
```

#### 3. Step Completion State Validation
```javascript
// Verify step completion state exists
if (!data.stepCompletionState) {
  return { 
    error: "Invalid booking flow - missing step completion data",
    suspicious: true 
  };
}

// Check timestamps are recent (within 1 hour)
const step3Time = new Date(data.stepCompletionState.step3Timestamp);
const now = new Date();
const timeDiff = now - step3Time;

if (timeDiff > 3600000) { // 1 hour
  return { 
    error: "Booking session expired - please start over",
    suspicious: true 
  };
}

// Verify steps were completed in order
if (!data.stepCompletionState.step1Completed || 
    !data.stepCompletionState.step2Completed || 
    !data.stepCompletionState.step3Active) {
  return { 
    error: "Invalid booking flow - steps not completed",
    suspicious: true 
  };
}
```

#### 4. Price Validation
```javascript
// Verify price matches service type
const expectedPrice = data.service === 'fuel-extraction' ? 399 : null;
if (expectedPrice && data.amount !== expectedPrice * 100) {
  return { 
    error: "Price mismatch - possible manipulation",
    suspicious: true 
  };
}
```

#### 5. Rate Limiting
```javascript
// Check request frequency from same IP/session
// Block if too many requests in short time
if (requestCount > 5 && timeWindow < 60000) { // 5 requests per minute
  return { 
    error: "Too many requests - please wait",
    suspicious: true 
  };
}
```

#### 6. Logging Suspicious Activity
```javascript
// Log all requests with suspicious flags
if (suspicious) {
  // Send alert to admin
  // Log to security monitoring system
  // Block IP if repeated attempts
}
```

## What Happens in Each Scenario

### Scenario 1: Legitimate Customer Flow
1. ✅ Customer completes all steps
2. ✅ Validation passes on frontend
3. ✅ API receives complete data with validation token
4. ✅ Backend validates data
5. ✅ Payment link generated
6. ✅ Customer redirected to Stripe

### Scenario 2: Console Bypass Attempt
1. ❌ User tries `generatePaymentLink()` in console
2. ❌ Frontend validation blocks the call
3. ❌ Alert shown: "Please complete all booking steps..."
4. ❌ No API request is made

### Scenario 3: Direct API Call (No Validation Data)
1. ⚠️ Attacker sends direct HTTP request
2. ⚠️ Request reaches Power Automate
3. ❌ Backend validation fails (missing validationToken)
4. ❌ Error returned: "Invalid booking flow - missing validation token"
5. ⚠️ Suspicious activity logged

### Scenario 4: Direct API Call (Fake Validation Data)
1. ⚠️ Attacker sends request with fake validation token
2. ⚠️ Request reaches Power Automate
3. ❌ Backend validation fails (invalid token format or timestamps)
4. ❌ Error returned: "Invalid booking flow - steps not completed"
5. ⚠️ Suspicious activity logged
6. ⚠️ IP may be blocked if repeated

## Security Best Practices

### Current Protection Level: **Medium-High**

✅ **Strengths:**
- Frontend validation prevents most casual bypass attempts
- Validation token system adds complexity
- Step completion tracking provides audit trail
- All validation data sent to backend for verification

⚠️ **Limitations:**
- API URL is exposed (unavoidable for client-side apps)
- Validation token is client-generated (not cryptographically secure)
- No server-side validation implemented yet (needs to be added)

### Recommended Enhancements

1. **Implement Backend Validation** (Critical)
   - Add all validation checks listed above in Power Automate
   - Reject requests without proper validation data

2. **Add Rate Limiting**
   - Limit requests per IP/session
   - Block repeated suspicious attempts

3. **Enhanced Token System** (Optional)
   - Generate tokens server-side after Step 2 completion
   - Use cryptographically secure tokens
   - Include token expiration

4. **Request Signing** (Advanced)
   - Sign requests with HMAC
   - Verify signature on backend

5. **Monitoring & Alerting**
   - Log all suspicious requests
   - Alert on repeated failures
   - Track patterns of abuse

## Testing the Protection

### Test 1: Console Bypass
```javascript
// In browser console on book-service page
generatePaymentLink()
// Expected: Alert blocking the request
```

### Test 2: Direct API Call (Missing Data)
```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
# Expected: Backend should reject with validation error
```

### Test 3: Direct API Call (Fake Data)
```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "validationToken": "fake_token",
    "stepCompletionState": {"step1Completed": true}
  }'
# Expected: Backend should reject with validation error
```

## Summary

**Frontend Protection**: ✅ Blocks console bypass attempts and validates all required data before API calls

**Backend Protection**: ⚠️ **Needs Implementation** - Currently relies on frontend validation. Backend should validate:
- Required fields
- Validation token presence and format
- Step completion state
- Price validation
- Rate limiting

**Recommendation**: Implement the backend validation checks in your Power Automate workflow to provide defense-in-depth security.

