# Email Template Fixes Required in Power Automate

## Issue: Location showing `[object Object]` in Customer Details

### Current Template Code (WRONG):
```
Location: @{coalesce(triggerBody()?['body']?['location'], triggerBody()?['location'], triggerBody()?['body']?['trackingData']?['visitorData']?['location'], triggerBody()?['trackingData']?['visitorData']?['location'])}
```

### Fixed Template Code (CORRECT):
```
Location: @{coalesce(
    triggerBody()?['body']?['location'], 
    triggerBody()?['body']?['visitorData']?['location']?['address'],
    triggerBody()?['body']?['visitorData']?['location']?['city'],
    triggerBody()?['body']?['trackingData']?['visitorData']?['location'],
    triggerBody()?['trackingData']?['visitorData']?['location'],
    'TBD'
)}
```

### Explanation:
- `body.location` = STRING (e.g., "BP Flatbush") ✓
- `body.visitorData.location` = OBJECT (has `.address`, `.city`, etc.)
  - When accessing the object directly, use `.address` or `.city` property
- `body.trackingData.visitorData.location` = STRING ✓

## HTML Layout Issues

### Issues Found:
1. **Location field showing `[object Object]`** - Fix above
2. **Missing spacing in "Urgency: mobile ETA: Session ID:"** - Add line breaks or better formatting
3. **Vehicle Type showing empty** - Check if `vehicleType` field is being populated

### Recommended HTML Layout Fixes:

#### Status Bar Section:
Change from:
```
Urgency: mobile ETA: Session ID: sess_1762228330768_iukijlfb7 Payment Confirmed: 04/11/2025 03:52 NZT
```

To:
```
<strong>Urgency:</strong> mobile<br>
<strong>ETA:</strong> 30–90 minutes arrival<br>
<strong>Session ID:</strong> sess_1762228330768_iukijlfb7<br>
<strong>Payment Confirmed:</strong> 04/11/2025 03:52 NZT
```

#### Vehicle Information Section:
Ensure Vehicle Type displays properly:
```
Vehicle Type: @{coalesce(triggerBody()?['body']?['vehicleType'], triggerBody()?['vehicleType'], triggerBody()?['body']?['trackingData']?['visitorData']?['vehicleType'], triggerBody()?['trackingData']?['visitorData']?['vehicleType'], 'Not specified')}
```

## Payload Structure (Already Correct)

Our payload sends:
- ✅ `body.location` = STRING ("BP Flatbush")
- ✅ `body.visitorData.location.address` = STRING ("BP Flatbush")
- ✅ `body.visitorData.location.city` = STRING ("BP Flatbush")
- ✅ `body.trackingData.visitorData.location` = STRING ("BP Flatbush")
- ✅ All vehicle fields (make, model, year, rego, vehicleType)

## Next Steps

1. **Update Power Automate email template** with the fixed Location field code above
2. **Fix HTML layout** in Status Bar section to use line breaks
3. **Test email** to ensure Location displays correctly


