Attribute VB_Name = "SendBookingLinkModule"
' Attribute VB_Name = "SendBookingLinkModule"
' Attribute VB_Name = "SendBookingLinkModule"
' ============================================================================
' SEND BOOKING LINK MODULE
' Sends booking form link to NEW customer via SMS
' For customers who just called - enter their phone and rego
' ============================================================================

Option Explicit

Public Sub SendBookingLink()
    On Error GoTo ErrHandler
    LogToRR9998 "SendBookingLink started."
    
    Call LaunchOutlook
    
    ' ===== Step 1: Get customer phone number =====
    Dim mobileNumber As String
    mobileNumber = InputBox( _
        "SEND BOOKING LINK" & vbCrLf & vbCrLf & _
        "Enter customer mobile number:" & vbCrLf & _
        "(e.g., 0221234567)", _
        "Customer Phone")
    If Trim(mobileNumber) = "" Then Exit Sub
    
    ' Clean up phone number - keep NZ format
    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    mobileNumber = Replace(mobileNumber, "+", "")
    mobileNumber = Replace(mobileNumber, "64", "", 1, 1) ' Remove country code if present at start
    
    ' Ensure starts with 0 for NZ format
    If Left(mobileNumber, 1) <> "0" Then
        mobileNumber = "0" & mobileNumber
    End If
    
    ' Build SMS email address - NZ format: 021123456@sms.tnz.co.nz
    Dim mobileEmail As String
    mobileEmail = mobileNumber & "@sms.tnz.co.nz"
    
    ' ===== Step 2: Get customer rego =====
    Dim customerRego As String
    customerRego = InputBox( _
        "Enter vehicle registration:" & vbCrLf & _
        "(e.g., ABC123)", _
        "Vehicle Rego")
    customerRego = UCase(Trim(customerRego))
    If customerRego = "" Then Exit Sub
    
    ' ===== Step 3: Choose service type =====
    Dim serviceChoice As String
    serviceChoice = InputBox( _
        "Select service type:" & vbCrLf & _
        "1 - Fuel Extraction" & vbCrLf & _
        "2 - Jump Start" & vbCrLf & _
        "3 - Mechanic Diagnostic" & vbCrLf & _
        "4 - WINZ Quote", _
        "Service Type")
    
    If serviceChoice <> "1" And serviceChoice <> "2" And serviceChoice <> "3" And serviceChoice <> "4" Then Exit Sub
    
    Dim serviceType As String
    Dim serviceName As String
    Select Case serviceChoice
        Case "1"
            serviceType = "fuel-extraction"
            serviceName = "Fuel Extraction"
        Case "2"
            serviceType = "jumpstart"
            serviceName = "Jump Start"
        Case "3"
            serviceType = "mechanic"
            serviceName = "Mechanic Diagnostic"
        Case "4"
            serviceType = "winz"
            serviceName = "WINZ Quote"
    End Select
    
    ' ===== Step 4: Build booking URL =====
    Dim bookingUrl As String
    bookingUrl = "https://www.eek.nz/book-service?service=" & serviceType
    
    ' ===== Step 5: Build message =====
    Dim smsText As String
    Dim emailSubject As String
    
    emailSubject = serviceName & " for " & mobileNumber
    
    smsText = "Hello," & vbCrLf & vbCrLf & _
              "You just gave us a call - thanks for reaching out." & vbCrLf & vbCrLf & _
              "To book your " & serviceName & " service with Eek Mechanical, please visit:" & vbCrLf & _
              bookingUrl & vbCrLf & vbCrLf & _
              "Your service details and pricing are pre-loaded on the booking page." & vbCrLf & _
              "Your Rego: " & customerRego & vbCrLf & _
              "Your contact number: " & mobileNumber & vbCrLf & vbCrLf & _
              "No pressure - nothing is booked or charged until you complete the online form and confirm payment. " & _
              "Once payment is received, your booking will be confirmed in under 5 minutes." & vbCrLf & vbCrLf & _
              "Need help? Call us back on 0800 769 000 - Eek Mechanical"
    
    ' ===== Step 6: Send SMS (skipTail = True to avoid adding reply footer) =====
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText, "", True)
    
    ' ===== Step 7: Staff copy =====
    Dim staffBody As String
    staffBody = "Booking Link Sent" & vbCrLf & _
                "Service: " & serviceName & vbCrLf & _
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
           "Rego: " & customerRego & vbCrLf & _
           "Service: " & serviceName, vbInformation, "Booking Link Sent"
    
    LogToRR9998 "SendBookingLink sent to " & mobileNumber & " for " & serviceName & " | Rego: " & customerRego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendBookingLink: " & Err.description
    MsgBox "Failed to send booking link: " & Err.description, vbExclamation
End Sub

' ============================================================================
' SEND BOOKING LINK FROM REGO
' For existing jobs - looks up customer details from Book a Job
' ============================================================================
Public Sub SendBookingLinkFromRego()
    On Error GoTo ErrHandler
    LogToRR9998 "SendBookingLinkFromRego started."
    
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation
        Exit Sub
    End If
    
    ' ===== Step 1: Get customer details from Book a Job =====
    Dim ws As Worksheet
    Dim lastRow As Long, i As Long, targetRow As Long
    Dim mobileNumber As String, countryCode As String
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    targetRow = 0
    
    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i
            Exit For
        End If
    Next i
    
    If targetRow = 0 Then
        MsgBox "Rego not found in Book a Job: " & selectedJobRego, vbExclamation
        Exit Sub
    End If
    
    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    
    If mobileNumber = "" Then
        MsgBox "No mobile number found for this job.", vbExclamation
        Exit Sub
    End If
    
    ' Clean up and convert to NZ local format
    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    
    ' If we have country code 64, convert to 0 prefix
    If countryCode = "64" And Left(mobileNumber, 1) <> "0" Then
        mobileNumber = "0" & mobileNumber
    End If
    
    ' Build SMS email address - NZ format: 021123456@sms.tnz.co.nz
    Dim mobileEmail As String
    mobileEmail = mobileNumber & "@sms.tnz.co.nz"
    
    ' ===== Step 2: Choose service type =====
    Dim serviceChoice As String
    serviceChoice = InputBox( _
        "Select service type:" & vbCrLf & _
        "1 - Fuel Extraction" & vbCrLf & _
        "2 - Jump Start" & vbCrLf & _
        "3 - Mechanic Diagnostic" & vbCrLf & _
        "4 - WINZ Quote", _
        "Service Type", "1")
    
    If serviceChoice <> "1" And serviceChoice <> "2" And serviceChoice <> "3" And serviceChoice <> "4" Then Exit Sub
    
    Dim serviceType As String
    Dim serviceName As String
    Select Case serviceChoice
        Case "1"
            serviceType = "fuel-extraction"
            serviceName = "Fuel Extraction"
        Case "2"
            serviceType = "jumpstart"
            serviceName = "Jump Start"
        Case "3"
            serviceType = "mechanic"
            serviceName = "Mechanic Diagnostic"
        Case "4"
            serviceType = "winz"
            serviceName = "WINZ Quote"
    End Select
    
    ' ===== Step 3: Build booking URL =====
    Dim bookingUrl As String
    bookingUrl = "https://www.eek.nz/book-service?service=" & serviceType
    
    ' ===== Step 4: Build message =====
    Dim smsText As String
    Dim emailSubject As String
    
    emailSubject = serviceName & " for " & mobileNumber
    
    smsText = "Hello," & vbCrLf & vbCrLf & _
              "You just gave us a call - thanks for reaching out." & vbCrLf & vbCrLf & _
              "To book your " & serviceName & " service with Eek Mechanical, please visit:" & vbCrLf & _
              bookingUrl & vbCrLf & vbCrLf & _
              "Your service details and pricing are pre-loaded on the booking page." & vbCrLf & _
              "Your Rego: " & selectedJobRego & vbCrLf & _
              "Your contact number: " & mobileNumber & vbCrLf & vbCrLf & _
              "No pressure - nothing is booked or charged until you complete the online form and confirm payment. " & _
              "Once payment is received, your booking will be confirmed in under 5 minutes." & vbCrLf & vbCrLf & _
              "Need help? Call us back on 0800 769 000 - Eek Mechanical"
    
    ' ===== Step 5: Send SMS (skipTail = True) =====
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText, "", True)
    
    ' ===== Step 6: Staff copy =====
    Dim staffBody As String
    staffBody = "Booking Link Sent (From Rego)" & vbCrLf & _
                "Service: " & serviceName & vbCrLf & _
                "Phone: " & mobileNumber & vbCrLf & _
                "Rego: " & selectedJobRego & vbCrLf & _
                "Booking URL: " & bookingUrl & vbCrLf & vbCrLf & _
                "Message sent:" & vbCrLf & _
                String(40, "-") & vbCrLf & _
                smsText
    
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody, "", True)
    
    MsgBox "Booking link sent!" & vbCrLf & vbCrLf & _
           "Phone: " & mobileNumber & vbCrLf & _
           "Rego: " & selectedJobRego & vbCrLf & _
           "Service: " & serviceName, vbInformation, "Booking Link Sent"
    
    LogToRR9998 "SendBookingLinkFromRego sent to " & mobileNumber & " for " & serviceName & " | Rego: " & selectedJobRego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendBookingLinkFromRego: " & Err.description
    MsgBox "Failed to send booking link: " & Err.description, vbExclamation
End Sub



