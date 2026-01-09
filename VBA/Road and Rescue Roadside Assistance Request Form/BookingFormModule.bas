Attribute VB_Name = "BookingFormModule"
' Attribute VB_Name = "BookingFormModule"
' Attribute VB_Name = "BookingFormModule"
' ============================================================================
' BOOKING FORM - Sends Fuel Extraction booking link to customer via SMS
' ============================================================================

Sub BookingForm()
    On Error GoTo ErrHandler
    LogToRR9998 "BookingForm started."
    
    Call LaunchOutlook
    
    ' ===== Step 1: Get customer phone number =====
    Dim mobileNumber As String
    mobileNumber = InputBox( _
        "SEND FUEL EXTRACTION BOOKING LINK" & vbCrLf & vbCrLf & _
        "Enter customer mobile number:" & vbCrLf & _
        "(e.g., 0226982813)", _
        "Customer Phone")
    If Trim(mobileNumber) = "" Then Exit Sub
    
    ' Clean up phone number - keep NZ format
    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    mobileNumber = Replace(mobileNumber, "+", "")
    mobileNumber = Replace(mobileNumber, "64", "", 1, 1)
    
    ' Ensure starts with 0 for NZ format
    If Left(mobileNumber, 1) <> "0" Then
        mobileNumber = "0" & mobileNumber
    End If
    
    ' Build SMS email address - NZ format: 0226982813@sms.tnz.co.nz
    Dim mobileEmail As String
    mobileEmail = mobileNumber & "@sms.tnz.co.nz"
    
    ' ===== Step 2: Use existing rego from selected job =====
    Dim customerRego As String
    customerRego = UCase(Trim(selectedJobRego))
    If customerRego = "" Then
        MsgBox "No job selected. Please select a job first.", vbExclamation
        Exit Sub
    End If
    
    ' ===== Step 3: Build message =====
    Dim bookingUrl As String
    bookingUrl = "https://www.eek.nz/book-service?service=fuel-extraction"
    
    Dim emailSubject As String
    emailSubject = "Fuel Extraction for " & mobileNumber
    
    Dim smsText As String
    smsText = "Hello," & vbCrLf & vbCrLf & _
              "You just gave us a call - thanks for reaching out." & vbCrLf & vbCrLf & _
              "To book your Fuel Extraction service with Eek Mechanical, please visit:" & vbCrLf & _
              bookingUrl & vbCrLf & vbCrLf & _
              "Your service details and pricing are pre-loaded on the booking page." & vbCrLf & _
              "Your Rego: " & customerRego & vbCrLf & _
              "Your contact number: " & mobileNumber & vbCrLf & vbCrLf & _
              "No pressure - nothing is booked or charged until you complete the online form and confirm payment. " & _
              "Once payment is received, your booking will be confirmed in under 5 minutes." & vbCrLf & vbCrLf & _
              "Need help? Call us back on 0800 769 000 - Eek Mechanical"
    
    ' ===== Step 4: Send SMS (skipTail = True) =====
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText, "", True)
    
    ' ===== Step 5: Staff copy =====
    Dim staffBody As String
    staffBody = "Fuel Extraction Booking Link Sent" & vbCrLf & _
                "Phone: " & mobileNumber & vbCrLf & _
                "Rego: " & customerRego & vbCrLf & _
                "Booking URL: " & bookingUrl & vbCrLf & vbCrLf & _
                "Message sent:" & vbCrLf & _
                String(40, "-") & vbCrLf & _
                smsText
    
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody, "", True)
    
    MsgBox "Booking link sent!" & vbCrLf & vbCrLf & _
           "Phone: " & mobileNumber & vbCrLf & _
           "Rego: " & customerRego, vbInformation, "Fuel Extraction Booking Link Sent"
    
    LogToRR9998 "BookingForm SMS sent to " & mobileNumber & " | Rego: " & customerRego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in BookingForm: " & Err.description
    MsgBox "Error: " & Err.description, vbExclamation
End Sub










