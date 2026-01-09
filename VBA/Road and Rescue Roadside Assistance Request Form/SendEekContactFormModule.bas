Attribute VB_Name = "SendEekContactFormModule"
' Attribute VB_Name = "SendEekContactFormModule"
' Attribute VB_Name = "SendEekContactFormModule"
' ============================================================================
' SEND EEK CONTACT FORM MODULE
' Opens the eek.nz customer-reply form for long-form staff communication
' ============================================================================

Sub SendEekContactForm()
    On Error GoTo ErrHandler
    
    Call OpenJobRegister
    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "SendEekContactForm aborted - no rego selected."
        Exit Sub
    End If
    
    Dim ws As Worksheet
    Dim foundCell As Range
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "SendEekContactForm failed - rego not found: " & selectedJobRego
        Exit Sub
    End If
    
    Dim targetRow As Long
    targetRow = foundCell.Row
    
    ' Get booking ID from column X
    Dim bookingId As String
    bookingId = Trim(ws.Cells(targetRow, "X").value)
    
    ' Build URL: bookingId + contactType=customer + customerSupport=true
    ' Customer data is in SharePoint, so only bookingId needed
    Dim dataString As String
    dataString = ""
    If bookingId <> "" Then dataString = "bookingId=" & URLEncode(bookingId)
    If dataString <> "" Then dataString = dataString & "&"
    dataString = dataString & "contactType=customer&customerSupport=true"
    
    Dim contactURL As String
    contactURL = "https://www.eek.nz/customer-reply?d=" & EncodeBase64(dataString)
    
    ' Open in browser
    ThisWorkbook.FollowHyperlink contactURL
    LogToRR9998 "SendEekContactForm opened for rego: " & selectedJobRego & " | URL: " & contactURL
    
    ShowStatus "Contact form opened in browser." & vbCrLf & "Rego: " & selectedJobRego
    Exit Sub
    
ErrHandler:
    ShowError "Error: " & Err.description
    LogToRR9998 "Error in SendEekContactForm: " & Err.description & " | Rego: " & selectedJobRego
End Sub

Sub SendEekContactFormToSupplier()
    On Error GoTo ErrHandler
    LogToRR9998 "SendEekContactFormToSupplier started."
    
    ' Step 1: Get the rego
    Call OpenJobRegister
    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "SendEekContactFormToSupplier aborted - no rego selected."
        Exit Sub
    End If
    
    ' Step 2: Find suppliers in Job Build Notes (same pattern as SendMessageToSupplier)
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim rego As String
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo ErrHandler
    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")
    If rego = "" Then rego = selectedJobRego
    
    ' Find all matching rows for this rego
    Dim lastRow As Long, i As Long, matchCount As Long
    Dim rowIndices() As Long
    Dim supplierList As String
    
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    matchCount = 0
    
    For i = 2 To lastRow
        If LCase(ws.Cells(i, 6).value) = LCase(rego) Then
            ' Check if it's a supplier row (Record Type column G)
            Dim recordType As String
            recordType = Trim(ws.Cells(i, 7).value)
            If InStr(1, recordType, "Supplier", vbTextCompare) > 0 Then
                matchCount = matchCount + 1
                ReDim Preserve rowIndices(1 To matchCount)
                rowIndices(matchCount) = i
            End If
        End If
    Next i
    
    If matchCount = 0 Then
        ShowWarning "No supplier found for rego: " & rego
        LogToRR9998 "SendEekContactFormToSupplier: No supplier found for rego: " & rego
        Exit Sub
    End If
    
    ' Step 3: Build supplier list for selection modal
    For i = 1 To matchCount
        supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
    Next i
    
    ' Step 4: Show supplier selection modal
    Dim selectedIndex As Variant
    selectedIndex = Application.InputBox( _
        prompt:="Select the supplier by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
        title:="Select Supplier", _
        Type:=1)
    
    If VarType(selectedIndex) = vbBoolean Then Exit Sub
    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
        ShowWarning "Invalid selection."
        Exit Sub
    End If
    
    Dim rowIndex As Long
    rowIndex = rowIndices(selectedIndex)
    
    ' Step 5: Get supplier details from selected row using dynamic column lookup
    Dim supplierNameCol As Long, emailCol As Long, mobileCol As Long
    supplierNameCol = GetColumnByHeader(ws, "Supplier")
    emailCol = GetColumnByHeader(ws, "Supp_Email")
    mobileCol = GetColumnByHeader(ws, "Supp_Phone")
    
    ' Fallback to hardcoded columns if headers not found
    If supplierNameCol = 0 Then supplierNameCol = 8  ' Column H
    If emailCol = 0 Then emailCol = 24               ' Column X
    If mobileCol = 0 Then mobileCol = 25             ' Column Y
    
    Dim supplierName As String, supplierEmail As String, supplierPhone As String
    supplierName = Trim(ws.Cells(rowIndex, supplierNameCol).value)
    supplierEmail = Trim(ws.Cells(rowIndex, emailCol).value)
    supplierPhone = Trim(ws.Cells(rowIndex, mobileCol).value)
    
    LogToRR9998 "SendEekContactFormToSupplier: Selected supplier '" & supplierName & "' | Email: " & supplierEmail & " | Phone: " & supplierPhone
    
    ' Step 6: Get booking ID from Book a Job sheet
    Dim wsBooking As Worksheet
    Dim foundCell As Range
    Dim bookingId As String
    
    Set wsBooking = ThisWorkbook.Sheets("Book a Job")
    Set foundCell = wsBooking.Range("V:V").Find(What:=rego, LookIn:=xlValues, LookAt:=xlWhole)
    If Not foundCell Is Nothing Then
        bookingId = Trim(wsBooking.Cells(foundCell.Row, "X").value)
    End If
    
    ' Step 7: Build URL with supplier details
    Dim dataString As String
    dataString = ""
    If bookingId <> "" Then dataString = "bookingId=" & URLEncode(bookingId)
    If dataString <> "" Then dataString = dataString & "&"
    dataString = dataString & "contactType=supplier&supplierSupport=true"
    
    ' Add supplier details (required because supplier data not in SharePoint)
    If supplierName <> "" Then dataString = dataString & "&supplierName=" & URLEncode(supplierName)
    If supplierEmail <> "" Then dataString = dataString & "&supplierEmail=" & URLEncode(supplierEmail)
    If supplierPhone <> "" Then dataString = dataString & "&supplierPhone=" & URLEncode(supplierPhone)
    If rego <> "" Then dataString = dataString & "&rego=" & URLEncode(rego)
    
    Dim contactURL As String
    contactURL = "https://www.eek.nz/customer-reply?d=" & EncodeBase64(dataString)
    
    ' Step 8: Open in browser
    ThisWorkbook.FollowHyperlink contactURL
    LogToRR9998 "SendEekContactFormToSupplier opened for rego: " & rego & " | Supplier: " & supplierName & " | URL: " & contactURL
    
    ShowStatus "Contact form opened in browser." & vbCrLf & "Rego: " & rego & vbCrLf & "Supplier: " & supplierName
    Exit Sub
    
ErrHandler:
    ShowError "Error: " & Err.description
    LogToRR9998 "Error in SendEekContactFormToSupplier: " & Err.description & " | Rego: " & selectedJobRego
End Sub






