# URGENT: Backend Validation Required

## Critical Issue
Someone bypassed frontend validation and sent a direct API request **WITHOUT** the security validation data.

## Missing in the Bypassed Request
- ❌ `validationToken` - **MISSING**
- ❌ `stepCompletionState` - **MISSING**

## Immediate Action Required

Add these validation checks to your Power Automate workflow **BEFORE** processing any payment request:

### Step 1: Check for Validation Token (CRITICAL)

```javascript
// In Power Automate - Add a Condition action
// Condition: validationToken is not empty AND validationToken starts with "token_"

IF validationToken is empty OR validationToken does not start with "token_"
  THEN
    - Return error response: { "error": "Invalid booking flow - security validation failed", "code": "SECURITY_FAIL" }
    - Log to SharePoint/Azure Monitor with "SUSPICIOUS" flag
    - STOP workflow
END IF
```

### Step 2: Check for Step Completion State (CRITICAL)

```javascript
// Condition: stepCompletionState exists AND has required fields

IF stepCompletionState is empty
  THEN
    - Return error: { "error": "Invalid booking flow - missing step completion data", "code": "MISSING_STEPS" }
    - Log as SUSPICIOUS
    - STOP workflow
END IF

IF stepCompletionState.step1Completed is not true
  OR stepCompletionState.step2Completed is not true
  OR stepCompletionState.step3Active is not true
  THEN
    - Return error: { "error": "Invalid booking flow - steps not completed", "code": "INCOMPLETE_STEPS" }
    - Log as SUSPICIOUS
    - STOP workflow
END IF
```

### Step 3: Validate Timestamps (Important)

```javascript
// Check Step 3 timestamp is recent (within 1 hour)

Parse stepCompletionState.step3Timestamp as DateTime
Calculate time difference: Now() - step3Timestamp

IF time difference > 1 hour (3600 seconds)
  THEN
    - Return error: { "error": "Booking session expired - please start over", "code": "SESSION_EXPIRED" }
    - STOP workflow
END IF

// Check steps completed in reasonable order
IF step2Timestamp < step1Timestamp
  OR step3Timestamp < step2Timestamp
  THEN
    - Return error: { "error": "Invalid booking flow - timestamps out of order", "code": "INVALID_TIMESTAMPS" }
    - Log as SUSPICIOUS
    - STOP workflow
END IF
```

### Step 4: Validate Required Fields

```javascript
// Check all required customer fields

IF name is empty OR name length < 2
  OR phone is empty OR phone length < 9
  OR email is empty OR email does not contain "@"
  OR rego is empty
  OR year is empty OR year < 1900 OR year > current year + 1
  OR make is empty
  OR model is empty
  OR location.address is empty
  THEN
    - Return error: { "error": "Missing or invalid required fields", "code": "INVALID_DATA" }
    - STOP workflow
END IF
```

### Step 5: Validate Price

```javascript
// Ensure price matches service type

IF service is "fuel-extraction"
  AND amount is not 39900 (399 * 100)
  THEN
    - Return error: { "error": "Price mismatch - possible manipulation", "code": "PRICE_MISMATCH" }
    - Log as SUSPICIOUS
    - STOP workflow
END IF

IF amount <= 0 OR amount > 100000
  THEN
    - Return error: { "error": "Invalid payment amount", "code": "INVALID_AMOUNT" }
    - STOP workflow
END IF
```

### Step 6: Check Engagement Data (Optional but Recommended)

```javascript
// If engagement data shows suspicious activity

IF trackingData.engagement.timeOnPage is 0
  AND trackingData.engagement.buttonClicks is 0
  AND trackingData.engagement.formInteractions is 0
  THEN
    - Log as SUSPICIOUS (but don't block - could be legitimate fast user)
    - Flag for review
END IF
```

## Power Automate Implementation

### Recommended Workflow Structure

```
1. HTTP Request Trigger
   ↓
2. Initialize Variables (extract body data)
   ↓
3. Condition: Check validationToken exists and format
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
4. Condition: Check stepCompletionState exists
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
5. Condition: Check step completion flags
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
6. Condition: Check timestamps are recent
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
7. Condition: Validate required fields
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
8. Condition: Validate price
   ├─ NO → Return Error Response → STOP
   └─ YES → Continue
   ↓
9. Process Payment (Stripe API call)
   ↓
10. Return Success Response
```

## Error Response Format

```json
{
  "success": false,
  "error": "Invalid booking flow - security validation failed",
  "code": "SECURITY_FAIL",
  "timestamp": "2025-12-04T21:43:46.000Z"
}
```

## Logging Suspicious Activity

For every rejected request, log to:
- SharePoint List (with "SUSPICIOUS" flag)
- Azure Monitor / Application Insights
- Email alert to admin (if multiple failures from same IP)

Include in log:
- Request timestamp
- IP address (from X-Forwarded-For header)
- Error code
- Request payload (sanitized - no sensitive data)
- User-Agent

## Testing

Test with the exact payload you received:
- Should be **REJECTED** immediately
- Should return error code "SECURITY_FAIL" or "MISSING_STEPS"
- Should be logged as suspicious

## Priority

**URGENT** - Implement validation checks 1-5 immediately. This will block the bypassed request pattern.

