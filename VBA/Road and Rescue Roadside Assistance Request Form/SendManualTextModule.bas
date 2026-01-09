Attribute VB_Name = "SendManualTextModule"
' Attribute VB_Name = "SendManualTextModule"
' Attribute VB_Name = "SendManualTextModule"
Sub SendManualText()
    On Error GoTo ErrHandler
    LogToRR9998 "SendManualText started."

    Call OpenJobRegister
    Call LaunchOutlook

    ' Ensure we have a rego context for non ad-hoc sends
    Dim jobRef As String
    If selectedJobRego = "" Then
        If MsgBox("No Job Rego is currently selected." & vbCrLf & _
                  "Do you want to proceed with an ad-hoc text?", vbYesNo + vbQuestion) = vbNo Then
            Exit Sub
        End If
        jobRef = "N/A"
    Else
        jobRef = Trim$(selectedJobRego)
    End If

    ' ===== Step 1: Choose recipient source =====
    Dim recipientChoice As String
    recipientChoice = InputBox( _
        "Select recipient source:" & vbCrLf & _
        "1 - Customer from Job Register" & vbCrLf & _
        "2 - Ad-Hoc (enter details manually)", _
        "Recipient")
    If recipientChoice <> "1" And recipientChoice <> "2" Then Exit Sub

    ' ===== Step 2: Choose message template =====
    Dim templateChoice As String
    templateChoice = InputBox( _
        "Select message template:" & vbCrLf & _
        "1 - ETA Update" & vbCrLf & _
        "2 - Location Request" & vbCrLf & _
        "3 - Payment Reminder (link/token optional)" & vbCrLf & _
        "4 - Custom Message", _
        "Template")
    If templateChoice <> "1" And templateChoice <> "2" And templateChoice <> "3" And templateChoice <> "4" Then Exit Sub

    ' ===== Step 3: Optional token/link (used by some templates) =====
    Dim tokenOrLink As String
    If templateChoice = "2" Or templateChoice = "3" Then
        tokenOrLink = InputBox("Enter token or full link if applicable (optional):" & vbCrLf & _
                               "e.g., abc123 OR https://www.eek.nz?token=abc123", "Token/Link (Optional)")
    End If

    ' ===== Step 4: Gather recipient details =====
    Dim ws As Worksheet, lastRow As Long, i As Long, targetRow As Long
    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    Dim mobileEmail As String

    If recipientChoice = "1" Then
        If selectedJobRego = "" Then MsgBox "A Job Rego must be selected to use the Job Register option.", vbExclamation: Exit Sub

        Set ws = ThisWorkbook.Sheets("Book a Job")
        lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
        targetRow = 0
        For i = 2 To lastRow
            If Trim$(ws.Cells(i, "V").value) = Trim$(selectedJobRego) Then targetRow = i: Exit For
        Next i
        If targetRow = 0 Then MsgBox "Rego not found in Book a Job.", vbExclamation: Exit Sub

        countryCode = Replace(Trim$(ws.Cells(targetRow, "G").value), "+", "")
        mobileNumber = Trim$(ws.Cells(targetRow, "H").value)
        customerEmail = Trim$(ws.Cells(targetRow, "D").value)
        customerName = Trim$(ws.Cells(targetRow, "E").value)
        If Len(customerName) = 0 Then customerName = "there"

        If countryCode = "" Or mobileNumber = "" Then MsgBox "Missing customer mobile/country code.", vbExclamation: Exit Sub
        mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"

    ElseIf recipientChoice = "2" Then
        countryCode = InputBox("Enter Country Code (e.g., 64):", "Country Code")
        If Trim$(countryCode) = "" Then MsgBox "Country code required.", vbExclamation: Exit Sub

        mobileNumber = InputBox("Enter Mobile Number (no country code, digits only):", "Mobile")
        If Trim$(mobileNumber) = "" Then MsgBox "Mobile number required.", vbExclamation: Exit Sub
        If Left$(mobileNumber, 1) = "0" Then mobileNumber = Mid$(mobileNumber, 2)

        customerName = InputBox("Enter Recipient Name (optional):", "Name")
        If Len(Trim$(customerName)) = 0 Then customerName = "there"

        customerEmail = InputBox("Enter Email (optional, for a copy):", "Email (Optional)")

        mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    End If

    ' ===== Step 5: Compose message text based on template =====
    Dim smsText As String, emailText As String
    Dim etaStr As String, freeText As String
    Dim templateName As String
    Const FOOTER As String = "— EEK Mechanical | www.eek.nz | 09 872 4612"

    Select Case templateChoice
        Case "1" ' ETA Update
            templateName = "ETA"
            etaStr = InputBox("Enter ETA (e.g., 35 minutes, 5:45pm):", "ETA")
            If Trim$(etaStr) = "" Then etaStr = "shortly"
            smsText = "Hi " & customerName & ", your EEK Mechanical driver is en route." & vbCrLf & _
                      "ETA: " & etaStr & vbCrLf & _
                      "Rego: " & jobRef & vbCrLf & _
                      "If anything changes, please reply to this message." & vbCrLf & _
                      FOOTER
            emailText = smsText

        Case "2" ' Location Request
            templateName = "LOC"
            Dim locLink As String
            If Len(Trim$(tokenOrLink)) > 0 Then
                If LCase$(Left$(tokenOrLink, 4)) = "http" Then
                    locLink = tokenOrLink
                Else
                    locLink = "https://www.eek.nz/location?token=" & tokenOrLink
                End If
            Else
                locLink = "https://www.eek.nz/location"
            End If
            smsText = "Hi " & customerName & ", please share your live location so we can route the nearest driver." & vbCrLf & _
                      "Tap: " & locLink & vbCrLf & _
                      "Rego: " & jobRef & vbCrLf & _
                      FOOTER
            emailText = smsText

        Case "3" ' Payment Reminder
            templateName = "PAY"
            Dim payLink As String
            If Len(Trim$(tokenOrLink)) > 0 Then
                If LCase$(Left$(tokenOrLink, 4)) = "http" Then
                    payLink = tokenOrLink
                Else
                    payLink = "https://www.eek.nz?token=" & tokenOrLink
                End If
            Else
                payLink = "https://www.eek.nz"
            End If
            smsText = "Hi " & customerName & ", quick reminder to complete payment to confirm your roadside job." & vbCrLf & _
                      "Rego: " & jobRef & vbCrLf & _
                      "Pay online: " & payLink & vbCrLf & _
                      "Or bank transfer: ANZ 06-0313-0860749-00, Ref: " & jobRef & vbCrLf & _
                      FOOTER
            emailText = smsText

        Case "4" ' Custom
            templateName = "CUST"
            freeText = InputBox("Enter the message to send:", "Custom Message")
            If Len(Trim$(freeText)) = 0 Then MsgBox "No message entered.", vbExclamation: Exit Sub
            smsText = freeText & vbCrLf & FOOTER
            emailText = smsText
    End Select

    ' ===== Step 6: Trackable subject =====
    Dim stamp As String
    stamp = Format(Now, "yyyymmdd-hhnn")
    Dim emailSubject As String
    emailSubject = "[EEK Mechanical] SMS | Rego " & jobRef & " | " & templateName & " | " & customerName & " | " & stamp

    ' ===== Step 7: Send messages =====
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)

    If Len(Trim$(customerEmail)) > 0 Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    End If

    ' Staff copy
    Dim staffBody As String
    staffBody = "Manual Text Sent" & vbCrLf & _
                "Rego: " & jobRef & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Template: " & templateName & vbCrLf & _
                IIf(Len(Trim$(tokenOrLink)) > 0, "Token/Link: " & tokenOrLink & vbCrLf, "") & _
                "Subject: " & emailSubject & vbCrLf & _
                "Message:" & vbCrLf & smsText

    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)

    MsgBox "Manual text sent."
    LogToRR9998 "SendManualText sent to +" & countryCode & mobileNumber & " for rego " & jobRef
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendManualText: " & Err.description
    MsgBox "Failed to send manual text: " & Err.description, vbExclamation
End Sub














