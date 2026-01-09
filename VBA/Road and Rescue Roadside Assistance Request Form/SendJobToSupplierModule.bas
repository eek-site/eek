Attribute VB_Name = "SendJobToSupplierModule"
' Attribute VB_Name = "SendJobToSupplierModule"
' Attribute VB_Name = "SendJobToSupplierModule"
Sub SendJobToSupplier()
    On Error GoTo ErrHandler
    LogToRR9998 "SendJobToSupplier started."

    Call OpenJobRegister
    Call LaunchOutlook
    Call LookupAndCompare

    Dim ws As Worksheet, rego As String
    Dim lastRow As Long, i As Long, matchCount As Long
    Dim selectedIndex As Variant, rowIndices() As Long, supplierList As String
    Dim rowIndex As Long, emailAddress As String, smsAddress As String
    Dim messageBody As String, AccountName As String
    AccountName = "no-reply@eek.nz"
    
    Dim termsURL As String
    termsURL = "https://eek.nz/supplier"

    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    On Error Resume Next
    rego = Replace(Replace(ThisWorkbook.names("CurrentRego").RefersTo, "=", ""), """", "")
    On Error GoTo ErrHandler
    If rego = "" Then
        ShowWarning "No registration found."
        Exit Sub
    End If

    ' Find all rows matching the rego (includes customer data + supplier data on same row)
    ' NOTE: We do NOT filter by Record Type here - we need the full row with all job data
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    matchCount = 0
    For i = 2 To lastRow
        If LCase(ws.Cells(i, 6).value) = LCase(rego) Then
            matchCount = matchCount + 1
            ReDim Preserve rowIndices(1 To matchCount)
            rowIndices(matchCount) = i
        End If
    Next i
    If matchCount = 0 Then
        ShowWarning "No job found for rego: " & rego
        Exit Sub
    End If

    ' Auto-select if only one supplier
    If matchCount = 1 Then
        selectedIndex = 1
        LogToRR9998 "SendJobToSupplier: Only one supplier found, auto-selecting"
    Else
        For i = 1 To matchCount
            supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
        Next i
        selectedIndex = Application.InputBox("Select supplier:" & vbCrLf & supplierList, "Select", Type:=1)
        If VarType(selectedIndex) = vbBoolean Then Exit Sub
        If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then Exit Sub
    End If

    rowIndex = rowIndices(selectedIndex)
    
    ' === Get supplier details from fixed columns (matching working version) ===
    Dim supplierName As String
    supplierName = ws.Cells(rowIndex, 8).value
    emailAddress = Trim(ws.Cells(rowIndex, 24).value)  ' Col X = Supplier Email
    Dim mobileNumber As String
    mobileNumber = Trim(ws.Cells(rowIndex, 25).value)  ' Col Y = Supplier Phone
    
    LogToRR9998 "SendJobToSupplier: Selected supplier '" & supplierName & "' at row " & rowIndex
    
    ' === Set global variables for SendViaOutbox to use ===
    selectedSupplierName = supplierName
    selectedSupplierEmail = emailAddress
    selectedSupplierPhone = mobileNumber
    selectedSupplierRego = rego
    
    ' === Get Base64 BookingId from Book a Job sheet (Column C) ===
    Dim bookJobWS As Worksheet
    Dim base64BookingId As String
    Dim uploadURL As String
    
    On Error Resume Next
    Set bookJobWS = ThisWorkbook.Sheets("Book a Job")
    On Error GoTo ErrHandler
    
    base64BookingId = ""
    If Not bookJobWS Is Nothing Then
        Dim bookJobLastRow As Long, bookJobRow As Long
        bookJobLastRow = bookJobWS.Cells(bookJobWS.rows.count, 22).End(xlUp).Row ' Col V for rego
        For i = 2 To bookJobLastRow
            If LCase(bookJobWS.Cells(i, 22).value) = LCase(rego) Then ' Col V = rego
                base64BookingId = Trim(CStr(bookJobWS.Cells(i, 3).value)) ' Col C = Base64
                Exit For
            End If
        Next i
    End If
    
    ' === Build upload URL with base64 parameter ===
    If base64BookingId <> "" Then
        uploadURL = "https://www.eek.nz/supplier-upload/?d=" & base64BookingId
    Else
        ' Fallback if no base64 found - log warning
        uploadURL = "https://www.eek.nz/supplier-upload"
        LogToRR9998 "WARNING: No Base64 BookingId found for rego: " & rego
    End If
    
    ' === Check for valid NZ mobile number ===
    Dim hasValidMobile As Boolean
    hasValidMobile = False
    If mobileNumber <> "" Then
        Dim cleanMobile As String
        cleanMobile = Replace(Replace(Replace(Replace(mobileNumber, " ", ""), "-", ""), "+", ""), "64", "", 1, 1)
        If Left(cleanMobile, 1) = "2" And Len(cleanMobile) >= 8 Then
            hasValidMobile = True
            smsAddress = mobileNumber & "@sms.tnz.co.nz"
        End If
    End If
    
    ' === Check for missing contact details ===
    Dim missingDetails As String
    missingDetails = ""
    If Not hasValidMobile Then
        missingDetails = missingDetails & "- No valid NZ mobile number" & vbCrLf
    End If
    If emailAddress = "" Then
        missingDetails = missingDetails & "- No email address" & vbCrLf
    End If
    
    ' === Send notification if details are missing ===
    If missingDetails <> "" Then
        Dim notificationSubject As String, notificationBody As String
        notificationSubject = "Missing Supplier Contact Details - Rego: " & rego
        notificationBody = "Alert: Missing contact details for job assignment" & vbCrLf & vbCrLf & _
                          "Rego: " & rego & vbCrLf & _
                          "Supplier: " & supplierName & vbCrLf & _
                          "Row: " & rowIndex & " in Job Build Notes" & vbCrLf & vbCrLf & _
                          "Missing Details:" & vbCrLf & missingDetails & vbCrLf & _
                          "Current Values:" & vbCrLf & _
                          "- Mobile (Col Y): " & IIf(mobileNumber = "", "[EMPTY]", mobileNumber) & vbCrLf & _
                          "- Email (Col X): " & IIf(emailAddress = "", "[EMPTY]", emailAddress) & vbCrLf & vbCrLf & _
                          "Job assignment will continue with available contact methods."
        
        SendViaOutbox AccountName, AccountName, notificationSubject, notificationBody
        LogToRR9998 "Notification sent about missing contact details for " & supplierName & ", Rego: " & rego
    End If
    
    ' === Check if this is a Pre-Purchase Inspection ===
    Dim isPrePurchase As Boolean
    Dim prePurchaseValue As String
    
    prePurchaseValue = Trim(CStr(ws.Cells(rowIndex, 28).value))
    isPrePurchase = (LCase(prePurchaseValue) Like "*pre*purchase*" Or _
                     LCase(prePurchaseValue) Like "*prepurchase*" Or _
                     LCase(prePurchaseValue) Like "*inspection*" Or _
                     LCase(prePurchaseValue) = "pp" Or _
                     LCase(prePurchaseValue) = "yes")
    
    ' Also check Book a Job sheet
    If Not isPrePurchase And Not bookJobWS Is Nothing Then
        For i = 2 To bookJobLastRow
            If LCase(bookJobWS.Cells(i, 22).value) = LCase(rego) Then ' Col V = rego
                prePurchaseValue = Trim(CStr(bookJobWS.Cells(i, 9).value))
                isPrePurchase = (LCase(prePurchaseValue) Like "*pre*purchase*" Or _
                                 LCase(prePurchaseValue) Like "*prepurchase*" Or _
                                 LCase(prePurchaseValue) Like "*inspection*" Or _
                                 LCase(prePurchaseValue) = "pp" Or _
                                 LCase(prePurchaseValue) = "yes")
                If isPrePurchase Then Exit For
            End If
        Next i
    End If

    ' === Redaction choice ===
    Dim redactionChoice As Variant
    redactionChoice = Application.InputBox("Choose:" & vbCrLf & "1. Redacted" & vbCrLf & "2. Complete", "Privacy", Type:=1)
    If VarType(redactionChoice) = vbBoolean Then Exit Sub
    If Not IsNumeric(redactionChoice) Or redactionChoice < 1 Or redactionChoice > 2 Then Exit Sub

    Dim includePhone As Boolean: includePhone = (redactionChoice = 2)

    ' === Build message body ===
    messageBody = IIf(isPrePurchase, "PRE-PURCHASE INSPECTION:", "JOB DETAILS:") & vbCrLf
    Dim baseHeaders As Variant: baseHeaders = Array("Timestamp", "Rego", "Client", "Fault", "Service Required", "Make", "Model", "Tyre Size", "From Location", "To Location")
    Dim dynamicHeaders() As String, headerCount As Integer: headerCount = UBound(baseHeaders) - LBound(baseHeaders) + 1
    ReDim dynamicHeaders(0 To headerCount - 1 + IIf(includePhone, 1, 0))
    For i = 0 To headerCount - 1: dynamicHeaders(i) = baseHeaders(i): Next i
    If includePhone Then dynamicHeaders(headerCount) = "Caller phone"

    Dim headerName As Variant, headerCol As Variant
    For Each headerName In dynamicHeaders
        headerCol = Application.Match(headerName, ws.rows(1), 0)
        If Not IsError(headerCol) Then
            Dim cellVal As String: cellVal = CStr(ws.Cells(rowIndex, headerCol).value)
            If headerName = "Caller phone" And includePhone And Left(cellVal, 1) <> "0" Then cellVal = "0" & cellVal
            If cellVal <> "0" And cellVal <> "Not Found" Then messageBody = messageBody & headerName & ": " & cellVal & vbCrLf
        End If
    Next headerName

    Dim clientName As String: clientName = ws.Cells(rowIndex, Application.Match("Client", ws.rows(1), 0)).value
    Dim acceptanceClause As String
    Dim jobTypeText As String: jobTypeText = IIf(isPrePurchase, "pre-purchase inspection", "job")
    acceptanceClause = "By accepting this " & jobTypeText & " for rego '" & rego & "' from '" & clientName & "', " & supplierName & " agrees to terms at: " & termsURL

    ' === Upload instructions - simple and direct ===
    Dim uploadInstructions As String
    uploadInstructions = vbCrLf & "SUBMIT YOUR INVOICE:" & vbCrLf & _
                        uploadURL & vbCrLf & vbCrLf

    ' === Build email and SMS bodies ===
    Dim emailTail As String, smsTail As String
    emailTail = uploadInstructions & _
                "Support: +64 9 872 4612" & vbCrLf & vbCrLf & _
                "=================" & vbCrLf & "EEK Mechanical" & vbCrLf & _
                "Level 1, 6 Johnsonville Road" & vbCrLf & "Johnsonville, Wellington 6037" & vbCrLf & _
                "=================" & vbCrLf & vbCrLf & acceptanceClause

    smsTail = vbCrLf & "Submit invoice: " & uploadURL & vbCrLf & _
              "Support: +64 9 872 4612"

    Dim emailBody As String: emailBody = messageBody & emailTail
    Dim smsBody As String: smsBody = messageBody & smsTail

    ' === Send Messages ===
    Dim emailSent As Boolean, smsSent As Boolean
    Dim emailSubject As String
    emailSubject = IIf(isPrePurchase, "Pre-Purchase Inspection: ", "Job: ") & rego
    
    If emailAddress <> "" Then
        emailSent = SendViaOutbox(AccountName, emailAddress, emailSubject, emailBody)
    Else
        emailSent = False
    End If
    
    If hasValidMobile Then
        smsSent = SendViaOutbox(AccountName, smsAddress, supplierName & " " & IIf(isPrePurchase, "PP:", "Job:") & " " & rego, smsBody)
    Else
        smsSent = False
    End If

    ' === Report results ===
    Dim successMsg As String
    If Not emailSent And Not smsSent Then
        successMsg = "WARNING: No messages sent to " & supplierName & vbCrLf & _
                    "Missing valid contact details. Notification sent to no-reply@eek.nz"
        ShowWarning successMsg
    Else
        successMsg = IIf(isPrePurchase, "Pre-purchase inspection", "Job") & " sent to " & supplierName
        If missingDetails <> "" Then
            successMsg = successMsg & vbCrLf & "Note: Some contact details missing - notification sent"
        End If
        ShowStatus successMsg
    End If
    LogToRR9998 successMsg & " for rego: " & rego

    ' === Log to White_List ===
    Dim logWS As Worksheet: Set logWS = ThisWorkbook.Sheets("White_List")
    Dim logRow As Long: logRow = logWS.Cells(logWS.rows.count, 42).End(xlUp).Row + 1
    logWS.Cells(logRow, 39).value = Now
    logWS.Cells(logRow, 40).value = rego
    logWS.Cells(logRow, 41).value = clientName
    logWS.Cells(logRow, 42).value = supplierName
    logWS.Cells(logRow, 43).value = acceptanceClause
    logWS.Cells(logRow, 44).value = IIf(isPrePurchase, "Pre-Purchase", "Standard")
    logWS.Cells(logRow, 45).value = uploadURL
    If missingDetails <> "" Then
        logWS.Cells(logRow, 46).value = "Missing: " & Replace(Replace(missingDetails, vbCrLf, " "), "- ", "")
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendJobToSupplier: " & Err.description
End Sub






