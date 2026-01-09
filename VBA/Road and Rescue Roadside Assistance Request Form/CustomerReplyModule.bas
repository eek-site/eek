Attribute VB_Name = "CustomerReplyModule"
' Attribute VB_Name = "CustomerReplyModule"
' Attribute VB_Name = "CustomerReplyModule"
Sub CustomerReply()
    On Error GoTo ErrHandler
    Call OpenJobRegister
    Call LaunchOutlook
    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? CustomerReply aborted � no rego selected.", "CustomerReplyLog.txt"
        Exit Sub
    End If
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)
    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "? CustomerReply failed � rego not found: " & selectedJobRego, "CustomerReplyLog.txt"
        Exit Sub
    End If
    Dim targetRow As Long
    targetRow = foundCell.Row
    
    ' === Get customer email address ===
    Dim customerEmail As String
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    
    ' === Build mobile email ===
    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = Trim(ws.Cells(targetRow, "G").value)
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    If countryCode = "" Or mobileNumber = "" Then
        ShowWarning "Missing mobile number or country code."
        LogToRR9998 "? CustomerReply failed � missing phone fields for rego: " & selectedJobRego, "CustomerReplyLog.txt"
        Exit Sub
    End If
    ' Cleanup mobile number
    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    mobileNumber = Replace(mobileNumber, "+", "")
    If Left(countryCode, 1) <> "+" Then
        countryCode = "+" & countryCode
    End If
    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"
    
    ' === Prompt user for custom message ===
    Dim customMessage As String
    customMessage = InputBox("Enter your custom message for the customer:", "Custom Message Input")
    If Trim(customMessage) = "" Then
        ShowWarning "No message entered. Process aborted."
        LogToRR9998 "?? CustomerReply cancelled � no message entered for rego: " & selectedJobRego, "CustomerReplyLog.txt"
        Exit Sub
    End If
    
    ' === Compose messages ===
    Dim emailSubject As String, smsBody As String, emailBody As String
    emailSubject = "Manual Customer Reply for Rego " & selectedJobRego
    
    ' SMS version (shorter)
    smsBody = customMessage & vbCrLf & vbCrLf & _
              "EEK Mechanical � " & vbCrLf & _
              "www.eek.nz"
    
    ' Email version (can be more detailed)
    emailBody = "Dear Customer," & vbCrLf & vbCrLf & _
                customMessage & vbCrLf & vbCrLf & _
                "Kind regards," & vbCrLf & _
                "EEK Mechanical" & vbCrLf & _
                "www.eek.nz"
    
    ' === Send messages ===
    Dim smsSent As Boolean, emailSent As Boolean
    Dim statusMsg As String, logMsg As String
    
    ' Send SMS
    smsSent = SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsBody)
    
    ' Send Email (only if email address exists)
    If customerEmail <> "" Then
        emailSent = SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailBody)
    Else
        emailSent = False
        LogToRR9998 "? No email address found for rego: " & selectedJobRego, "CustomerReplyLog.txt"
    End If
    
    ' === Report results ===
    If smsSent And emailSent Then
        statusMsg = "? Manual Customer Reply sent to both SMS and email."
        logMsg = "? CustomerReply sent to SMS: " & mobileEmail & " & Email: " & customerEmail & " | Rego: " & selectedJobRego & " | Msg: " & customMessage
    ElseIf smsSent And Not emailSent Then
        If customerEmail = "" Then
            statusMsg = "? Manual Customer Reply sent to SMS only (no email on file)."
            logMsg = "? CustomerReply sent to SMS: " & mobileEmail & " (no email) | Rego: " & selectedJobRego & " | Msg: " & customMessage
        Else
            statusMsg = "? SMS sent but email failed."
            logMsg = "? CustomerReply SMS sent: " & mobileEmail & ", Email failed: " & customerEmail & " | Rego: " & selectedJobRego
        End If
    ElseIf Not smsSent And emailSent Then
        statusMsg = "? Email sent but SMS failed."
        logMsg = "? CustomerReply Email sent: " & customerEmail & ", SMS failed: " & mobileEmail & " | Rego: " & selectedJobRego
    Else
        statusMsg = "? There was an issue sending both messages."
        logMsg = "? CustomerReply failed for both SMS and email | Rego: " & selectedJobRego
    End If
    
    ShowStatus statusMsg
    LogToRR9998 logMsg, "CustomerReplyLog.txt"
    
    Exit Sub
ErrHandler:
    LogToRR9998 "? Error in CustomerReply: " & Err.description, "CustomerReplyLog.txt"
End Sub






