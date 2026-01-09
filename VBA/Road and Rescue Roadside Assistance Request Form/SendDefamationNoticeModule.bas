Attribute VB_Name = "SendDefamationNoticeModule"
' Attribute VB_Name = "SendDefamationNoticeModule"
' Attribute VB_Name = "SendDefamationNoticeModule"
Sub SendDefamationNotice()
    On Error GoTo ErrHandler
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "WARNING: SendDefamationNotice aborted — no rego selected.", "DefamationNoticeLog.txt"
        Exit Sub
    End If
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundCell Is Nothing Then
        MsgBox "Selected Rego not found in column V."
        LogToRR9998 "ERROR: SendDefamationNotice failed — rego not found: " & selectedJobRego, "DefamationNoticeLog.txt"
        Exit Sub
    End If
    
    Dim targetRow As Long
    targetRow = foundCell.Row
    
    ' === Get customer details ===
    Dim customerName As String, customerEmail As String
    customerName = Trim(ws.Cells(targetRow, "E").value)  ' FIXED: Column E for customer name
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    
    ' === Build mobile email ===
    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = Trim(ws.Cells(targetRow, "G").value)
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    
    If countryCode = "" Or mobileNumber = "" Then
        MsgBox "Missing mobile number or country code."
        LogToRR9998 "ERROR: SendDefamationNotice failed — missing phone fields for rego: " & selectedJobRego, "DefamationNoticeLog.txt"
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
    
    ' === Get booking ID from column X ===
    Dim bookingId As String
    bookingId = Trim(ws.Cells(targetRow, "X").value)
    
    If bookingId = "" Then
        If MsgBox("No Booking ID found for this job. Continue anyway?", vbYesNo + vbQuestion) = vbNo Then
            LogToRR9998 "WARNING: SendDefamationNotice cancelled — no booking ID for rego: " & selectedJobRego, "DefamationNoticeLog.txt"
            Exit Sub
        End If
    End If
    
    ' === Build the defamation notice URL with encoded data ===
    Dim dataString As String
    dataString = "bookingId=" & URLEncode(bookingId) & "&contactType=customer"
    
    Dim encodedData As String
    encodedData = EncodeBase64(dataString)
    
    Dim defamationURL As String
    defamationURL = "https://www.eek.nz/mjuris/defamation/?d=" & encodedData
    
    ' === Confirm with user before sending ===
    Dim confirmMsg As String
    confirmMsg = "SENDING DEFAMATION NOTICE" & vbCrLf & vbCrLf
    confirmMsg = confirmMsg & "Customer: " & customerName & vbCrLf
    confirmMsg = confirmMsg & "Rego: " & selectedJobRego & vbCrLf
    confirmMsg = confirmMsg & "Booking ID: " & bookingId & vbCrLf & vbCrLf
    confirmMsg = confirmMsg & "This will send a legal defamation notice to:" & vbCrLf
    confirmMsg = confirmMsg & "• SMS: " & Replace(mobileEmail, "@sms.tnz.co.nz", "") & vbCrLf
    
    If customerEmail <> "" Then
        confirmMsg = confirmMsg & "• Email: " & customerEmail & vbCrLf
    End If
    
    confirmMsg = confirmMsg & vbCrLf & "WARNING: This is a serious legal notice." & vbCrLf
    confirmMsg = confirmMsg & "Are you sure you want to proceed?"
    
    If MsgBox(confirmMsg, vbYesNo + vbExclamation, "Confirm Defamation Notice") = vbNo Then
        LogToRR9998 "WARNING: SendDefamationNotice cancelled by user for rego: " & selectedJobRego, "DefamationNoticeLog.txt"
        Exit Sub
    End If
    
    ' === Compose messages ===
    Dim emailSubject As String, smsBody As String, emailBody As String
    emailSubject = "IMPORTANT LEGAL NOTICE - Eek Mechanical Limited"
    
    ' SMS version (shorter, direct) - NO EMOJIS
    smsBody = "LEGAL NOTICE" & vbCrLf & vbCrLf
    smsBody = smsBody & customerName & ", Eek Mechanical has identified potentially defamatory content you posted online." & vbCrLf & vbCrLf
    smsBody = smsBody & "This is a formal legal notice. Immediate action required." & vbCrLf & vbCrLf
    smsBody = smsBody & "View full notice: " & defamationURL & vbCrLf & vbCrLf
    smsBody = smsBody & "Failure to respond may result in legal action."
    
    ' Email version (HTML formatted) - Build in sections WITHOUT EMOJIS
    Dim htmlPart1 As String, htmlPart2 As String, htmlPart3 As String, htmlPart4 As String
    
    ' Part 1: Header
    htmlPart1 = "<html><body style='font-family: Arial, sans-serif;'>"
    htmlPart1 = htmlPart1 & "<div style='background-color: #dc3545; color: white; padding: 20px; text-align: center;'>"
    htmlPart1 = htmlPart1 & "<h1 style='margin: 0;'>IMPORTANT LEGAL NOTICE</h1>"
    htmlPart1 = htmlPart1 & "</div>"
    htmlPart1 = htmlPart1 & "<div style='padding: 20px; background-color: #f8f9fa;'>"
    htmlPart1 = htmlPart1 & "<p>Dear <strong>" & customerName & "</strong>,</p>"
    
    ' Part 2: Main content
    htmlPart2 = "<p style='font-size: 16px;'>Eek Mechanical Limited has identified that you have posted information "
    htmlPart2 = htmlPart2 & "online about the company that may be false, defamatory, or malicious.</p>"
    htmlPart2 = htmlPart2 & "<div style='background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0;'>"
    htmlPart2 = htmlPart2 & "<p style='color: #856404; margin: 0;'><strong>This is a formal legal notice under New Zealand law.</strong></p>"
    htmlPart2 = htmlPart2 & "<p style='color: #856404; margin: 10px 0 0 0;'>You are required to review and acknowledge receipt of our "
    htmlPart2 = htmlPart2 & "Defamation Policy and Legal Action Protocol.</p></div>"
    
    ' Part 3: Legal obligations and button
    htmlPart3 = "<p><strong>Your Legal Obligations:</strong></p>"
    htmlPart3 = htmlPart3 & "<ul>"
    htmlPart3 = htmlPart3 & "<li>Under the Defamation Act 1992, false statements that damage a business's reputation are actionable</li>"
    htmlPart3 = htmlPart3 & "<li>Under the Harmful Digital Communications Act 2015, harmful online content can result in criminal prosecution</li>"
    htmlPart3 = htmlPart3 & "<li>Damages awards in New Zealand regularly exceed $100,000 plus legal costs</li>"
    htmlPart3 = htmlPart3 & "</ul>"
    htmlPart3 = htmlPart3 & "<div style='text-align: center; margin: 30px 0;'>"
    htmlPart3 = htmlPart3 & "<a href='" & defamationURL & "' style='display: inline-block; padding: 15px 30px; "
    htmlPart3 = htmlPart3 & "background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; "
    htmlPart3 = htmlPart3 & "font-size: 18px; font-weight: bold;'>VIEW LEGAL NOTICE</a></div>"
    
    ' Part 4: Footer
    htmlPart4 = "<p style='color: #dc3545; font-weight: bold;'>You have 24 hours to remove any false content before legal action commences.</p>"
    htmlPart4 = htmlPart4 & "<p>If you have legitimate concerns about your service, we encourage you to contact us directly at legal@eek.nz "
    htmlPart4 = htmlPart4 & "to resolve this matter without legal proceedings.</p>"
    htmlPart4 = htmlPart4 & "<hr style='margin: 20px 0;'>"
    htmlPart4 = htmlPart4 & "<p style='font-size: 12px; color: #6c757d;'>This communication is privileged and confidential. "
    htmlPart4 = htmlPart4 & "It is intended for the named recipient only. If you are not the intended recipient, "
    htmlPart4 = htmlPart4 & "you must not use, disseminate, distribute or reproduce all or any part of this communication.</p>"
    htmlPart4 = htmlPart4 & "<p style='font-size: 12px; color: #6c757d;'>Eek Mechanical Limited | Company No. 9365185 | NZBN 9429053064165</p>"
    htmlPart4 = htmlPart4 & "</div></body></html>"
    
    ' Combine all parts
    emailBody = htmlPart1 & htmlPart2 & htmlPart3 & htmlPart4
    
    ' === Send messages ===
    Dim smsSent As Boolean, emailSent As Boolean
    Dim statusMsg As String, logMsg As String
    
    ' Send SMS - USING NO-REPLY@EEK.NZ
    smsSent = SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsBody)
    
    ' Send Email (only if email address exists) - USING NO-REPLY@EEK.NZ
    If customerEmail <> "" Then
        emailSent = SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailBody)
    Else
        emailSent = False
        LogToRR9998 "WARNING: No email address found for rego: " & selectedJobRego, "DefamationNoticeLog.txt"
    End If
    
    ' === Log the action in column BG (or appropriate tracking column) ===
    On Error Resume Next
    ws.Cells(targetRow, "BG").value = "Defamation Notice Sent: " & Format(Now, "dd/mm/yyyy hh:mm")
    On Error GoTo ErrHandler
    
    ' === Report results ===
    If smsSent And emailSent Then
        statusMsg = "SUCCESS: Defamation Notice sent to both SMS and email." & vbCrLf & vbCrLf
        statusMsg = statusMsg & "The customer has been notified of potential legal action." & vbCrLf
        statusMsg = statusMsg & "24-hour deadline has been set for content removal."
        logMsg = "SUCCESS: DefamationNotice sent to SMS: " & mobileEmail & " & Email: " & customerEmail
        logMsg = logMsg & " | Rego: " & selectedJobRego & " | BookingID: " & bookingId & " | URL: " & defamationURL
    ElseIf smsSent And Not emailSent Then
        If customerEmail = "" Then
            statusMsg = "SUCCESS: Defamation Notice sent to SMS only (no email on file)." & vbCrLf & vbCrLf
            statusMsg = statusMsg & "24-hour deadline has been set for content removal."
            logMsg = "SUCCESS: DefamationNotice sent to SMS: " & mobileEmail & " (no email) | Rego: "
            logMsg = logMsg & selectedJobRego & " | BookingID: " & bookingId
        Else
            statusMsg = "WARNING: SMS sent but email failed. Consider resending email manually."
            logMsg = "WARNING: DefamationNotice SMS sent: " & mobileEmail & ", Email failed: " & customerEmail
            logMsg = logMsg & " | Rego: " & selectedJobRego
        End If
    ElseIf Not smsSent And emailSent Then
        statusMsg = "WARNING: Email sent but SMS failed. Consider resending SMS manually."
        logMsg = "WARNING: DefamationNotice Email sent: " & customerEmail & ", SMS failed: " & mobileEmail
        logMsg = logMsg & " | Rego: " & selectedJobRego
    Else
        statusMsg = "ERROR: Failed to send defamation notice. Please try again or send manually."
        logMsg = "ERROR: DefamationNotice failed for both SMS and email | Rego: " & selectedJobRego
    End If
    
    MsgBox statusMsg, IIf(InStr(statusMsg, "SUCCESS") > 0, vbInformation, vbExclamation), "Defamation Notice Status"
    LogToRR9998 logMsg, "DefamationNoticeLog.txt"
    
    ' === Remind user about follow-up ===
    If smsSent Or emailSent Then
        Dim reminderMsg As String
        reminderMsg = "REMINDER:" & vbCrLf & vbCrLf
        reminderMsg = reminderMsg & "• Monitor for customer response within 24 hours" & vbCrLf
        reminderMsg = reminderMsg & "• Document any continued defamatory activity" & vbCrLf
        reminderMsg = reminderMsg & "• If content not removed, proceed with legal action protocol" & vbCrLf
        reminderMsg = reminderMsg & "• All communications are being logged for legal purposes"
        
        MsgBox reminderMsg, vbInformation, "Legal Follow-up Required"
    End If
    
    Exit Sub
    
ErrHandler:
    LogToRR9998 "ERROR: Error in SendDefamationNotice: " & Err.description, "DefamationNoticeLog.txt"
    MsgBox "Error sending defamation notice: " & Err.description, vbCritical
End Sub








