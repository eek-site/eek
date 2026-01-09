Attribute VB_Name = "SendMessageToSupplierModule"
' Attribute VB_Name = "SendMessageToSupplierModule"
' Attribute VB_Name = "SendMessageToSupplierModule"
Sub SendMessageToSupplier()
    On Error GoTo ErrHandler
    LogToRR9998 "SendMessageToSupplier started."
    Call OpenJobRegister
    Call LaunchOutlook
    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "No Job Rego selected in SendMessageToSupplier."
        Exit Sub
    End If
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    Dim rego As String
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo ErrHandler
    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")
    If rego = "" Then
        ShowWarning "No registration found. Returning to main menu."
        LogToRR9998 "No rego found in named range. Exiting SendMessageToSupplier."
        Exit Sub
    End If
    Dim lastRow As Long, i As Long, matchCount As Long
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    Dim rowIndices() As Long
    Dim supplierList As String
    For i = 2 To lastRow
        If LCase(ws.Cells(i, 6).value) = LCase(rego) Then
            matchCount = matchCount + 1
            ReDim Preserve rowIndices(1 To matchCount)
            rowIndices(matchCount) = i
        End If
    Next i
    If matchCount = 0 Then
        ShowWarning "No job found for the entered registration."
        LogToRR9998 "No job found for rego: " & rego
        Exit Sub
    End If
    For i = 1 To matchCount
        supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
    Next i
    Dim selectedIndex As Variant
    selectedIndex = Application.InputBox( _
        prompt:="Select the supplier by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
        title:="Select Supplier", _
        Type:=1)
    If VarType(selectedIndex) = vbBoolean Then Exit Sub
    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
        ShowWarning "Invalid selection."
        LogToRR9998 "Invalid supplier selection for rego: " & rego
        Exit Sub
    End If
    Dim rowIndex As Long
    rowIndex = rowIndices(selectedIndex)
    
    ' === Get supplier details ===
    Dim supplierEmail As String, mobileNumber As String, supplierName As String
    supplierEmail = Trim(ws.Cells(rowIndex, 24).value) ' Column X
    mobileNumber = Trim(ws.Cells(rowIndex, 25).value) ' Column Y
    supplierName = ws.Cells(rowIndex, 8).value ' Column H
    
    ' === Set global variables for SendViaOutbox to use ===
    selectedSupplierName = supplierName
    selectedSupplierEmail = supplierEmail
    selectedSupplierPhone = mobileNumber
    selectedSupplierRego = rego
    
    ' === Check for valid NZ mobile number ===
    Dim hasValidMobile As Boolean
    hasValidMobile = False
    If mobileNumber <> "" Then
        ' Remove any spaces, dashes, plus signs for checking
        Dim cleanMobile As String
        cleanMobile = Replace(Replace(Replace(Replace(mobileNumber, " ", ""), "-", ""), "+", ""), "64", "", 1, 1)
        ' Check if it starts with 2 (for 20-29 range)
        If Left(cleanMobile, 1) = "2" And Len(cleanMobile) >= 8 Then
            hasValidMobile = True
        End If
    End If
    
    ' === Check if we need to send notification about missing details ===
    Dim missingDetails As String
    missingDetails = ""
    If Not hasValidMobile Then
        missingDetails = missingDetails & "- No valid NZ mobile number (should start with 02x)" & vbCrLf
    End If
    If supplierEmail = "" Then
        missingDetails = missingDetails & "- No email address" & vbCrLf
    End If
    
    ' === Send notification if details are missing ===
    If missingDetails <> "" Then
        Dim notificationSubject As String, notificationBody As String
        notificationSubject = "Missing Supplier Contact Details - Rego: " & rego
        notificationBody = "Alert: Missing contact details for supplier message attempt" & vbCrLf & vbCrLf & _
                          "Rego: " & rego & vbCrLf & _
                          "Supplier: " & supplierName & vbCrLf & _
                          "Row: " & rowIndex & " in Job Build Notes" & vbCrLf & vbCrLf & _
                          "Missing Details:" & vbCrLf & missingDetails & vbCrLf & _
                          "Current Values:" & vbCrLf & _
                          "- Mobile (Col Y): " & IIf(mobileNumber = "", "[EMPTY]", mobileNumber) & vbCrLf & _
                          "- Email (Col X): " & IIf(supplierEmail = "", "[EMPTY]", supplierEmail) & vbCrLf & vbCrLf & _
                          "Please update the Job Build Notes sheet with correct contact information."
        
        SendViaOutbox "no-reply@eek.nz", "no-reply@eek.nz", notificationSubject, notificationBody
        LogToRR9998 "Notification sent about missing contact details for " & supplierName & ", Rego: " & rego
    End If
    
    ' === Exit if no valid mobile ===
    If Not hasValidMobile Then
        ShowWarning "No valid NZ mobile number found for " & supplierName & vbCrLf & _
               "A notification has been sent to no-reply@eek.nz"
        LogToRR9998 "No valid mobile for supplier: " & supplierName & ", rego: " & rego
        Exit Sub
    End If
    
    Dim mobileEmail As String
    mobileEmail = mobileNumber & "@sms.tnz.co.nz"
    
    ' === Prompt for custom message ===
    Dim customMessage As String
    customMessage = InputBox("Enter your custom message for the supplier:", "Custom Message Input")
    If Trim(customMessage) = "" Then
        ShowWarning "No message entered. Process aborted."
        LogToRR9998 "No message entered for supplier SMS. Aborting."
        Exit Sub
    End If
    
    ' === Compose messages ===
    Dim emailSubject As String, smsBody As String, emailBody As String
    emailSubject = "Manual Supplier Reply for Rego " & rego
    
    ' SMS version (shorter)
    smsBody = customMessage & vbCrLf & vbCrLf & _
              "EEK Mechanical � " & vbCrLf & _
              "www.eek.nz"
    
    ' Email version (can be more detailed)
    emailBody = "Dear " & supplierName & "," & vbCrLf & vbCrLf & _
                customMessage & vbCrLf & vbCrLf & _
                "Kind regards," & vbCrLf & _
                "EEK Mechanical" & vbCrLf & _
                "www.eek.nz"
    
    ' === Send messages ===
    Dim smsSent As Boolean, emailSent As Boolean
    Dim statusMsg As String, logMsg As String
    
    ' Send SMS (we know mobile is valid if we got here)
    smsSent = SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsBody)
    
    ' Send Email (only if email address exists)
    If supplierEmail <> "" Then
        emailSent = SendViaOutbox("no-reply@eek.nz", supplierEmail, emailSubject, emailBody)
    Else
        emailSent = False
        LogToRR9998 "No email address found for supplier: " & supplierName & ", rego: " & rego
    End If
    
    ' === Report results ===
    If smsSent And emailSent Then
        statusMsg = "Manual Supplier Reply sent to both SMS and email for " & supplierName
        logMsg = "Supplier message sent to SMS: " & mobileEmail & " & Email: " & supplierEmail & " | Supplier: " & supplierName & " | Rego: " & rego
    ElseIf smsSent And Not emailSent Then
        If supplierEmail = "" Then
            statusMsg = "Manual Supplier Reply sent to SMS only (no email on file) for " & supplierName
            logMsg = "Supplier message sent to SMS: " & mobileEmail & " (no email) | Supplier: " & supplierName & " | Rego: " & rego
        Else
            statusMsg = "SMS sent but email failed for " & supplierName
            logMsg = "Supplier SMS sent: " & mobileEmail & ", Email failed: " & supplierEmail & " | Supplier: " & supplierName & " | Rego: " & rego
        End If
    ElseIf Not smsSent And emailSent Then
        statusMsg = "Email sent but SMS failed for " & supplierName
        logMsg = "Supplier Email sent: " & supplierEmail & ", SMS failed: " & mobileEmail & " | Supplier: " & supplierName & " | Rego: " & rego
    Else
        statusMsg = "Failed to send messages to " & supplierName
        logMsg = "Failed to send both SMS and email | Supplier: " & supplierName & " | Rego: " & rego
    End If
    
    ShowStatus statusMsg
    LogToRR9998 logMsg
    
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in SendMessageToSupplier: " & Err.description
End Sub






