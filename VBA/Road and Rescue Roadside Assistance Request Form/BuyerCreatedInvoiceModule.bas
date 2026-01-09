Attribute VB_Name = "BuyerCreatedInvoiceModule"
' Attribute VB_Name = "BuyerCreatedInvoiceModule"
' Attribute VB_Name = "BuyerCreatedInvoiceModule"
' ============================================================================
' BUYER CREATED INVOICE (BCI) MODULE
' Opens the eek.nz/bci form with supplier details encoded
' Same pattern as SendEekContactFormToSupplier
' ============================================================================

Sub ShowBCIMenu()
    On Error GoTo ErrHandler
    
    Dim choice As String
    choice = InputBox("BUYER CREATED INVOICE (BCI)" & vbCrLf & vbCrLf & _
        "1. Create BCI for Job Supplier" & vbCrLf & _
        "2. Create Manual BCI (no job)" & vbCrLf & vbCrLf & _
        "Enter option (1-2), or q to go back:", _
        "Buyer Created Invoice")
    
    Select Case LCase(Trim(choice))
        Case "1"
            Call CreateBuyerCreatedInvoice
        Case "2"
            Call CreateManualBCI
        Case "q", ""
            Exit Sub
        Case Else
            ShowWarning "Invalid selection."
    End Select
    Exit Sub
    
ErrHandler:
    ShowError "Error in BCI menu: " & Err.description
End Sub

Sub CreateBuyerCreatedInvoice()
    On Error GoTo ErrHandler
    LogToRR9998 "CreateBuyerCreatedInvoice started."
    
    ' Step 1: Get the rego
    Call OpenJobRegister
    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "CreateBuyerCreatedInvoice aborted - no rego selected."
        Exit Sub
    End If
    
    ' Step 2: Find suppliers in Job Build Notes (same pattern as SendEekContactFormToSupplier)
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
        LogToRR9998 "CreateBuyerCreatedInvoice: No supplier found for rego: " & rego
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
        title:="Select Supplier for BCI", _
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
    
    LogToRR9998 "CreateBuyerCreatedInvoice: Selected supplier '" & supplierName & "' | Email: " & supplierEmail & " | Phone: " & supplierPhone
    
    ' Step 6: Get booking ID from Book a Job sheet
    Dim wsBooking As Worksheet
    Dim foundCell As Range
    Dim bookingId As String
    
    Set wsBooking = ThisWorkbook.Sheets("Book a Job")
    Set foundCell = wsBooking.Range("V:V").Find(What:=rego, LookIn:=xlValues, LookAt:=xlWhole)
    If Not foundCell Is Nothing Then
        bookingId = Trim(wsBooking.Cells(foundCell.Row, "X").value)
    End If
    
    ' Step 7: Build URL with supplier details (for BCI page)
    Dim dataString As String
    dataString = ""
    If bookingId <> "" Then dataString = "bookingId=" & URLEncode(bookingId)
    If dataString <> "" Then dataString = dataString & "&"
    dataString = dataString & "formType=bci"
    
    ' Add supplier details
    If supplierName <> "" Then dataString = dataString & "&supplierName=" & URLEncode(supplierName)
    If supplierEmail <> "" Then dataString = dataString & "&supplierEmail=" & URLEncode(supplierEmail)
    If supplierPhone <> "" Then dataString = dataString & "&supplierPhone=" & URLEncode(supplierPhone)
    If rego <> "" Then dataString = dataString & "&rego=" & URLEncode(rego)
    
    Dim bciUrl As String
    bciUrl = "https://www.eek.nz/bci?" & EncodeBase64(dataString)
    
    ' Step 8: Open in browser
    ThisWorkbook.FollowHyperlink bciUrl
    LogToRR9998 "CreateBuyerCreatedInvoice opened for rego: " & rego & " | Supplier: " & supplierName & " | URL: " & bciUrl
    
    ShowStatus "BCI form opened in browser." & vbCrLf & "Rego: " & rego & vbCrLf & "Supplier: " & supplierName
    Exit Sub
    
ErrHandler:
    ShowError "Error: " & Err.description
    LogToRR9998 "Error in CreateBuyerCreatedInvoice: " & Err.description & " | Rego: " & selectedJobRego
End Sub

Sub CreateManualBCI()
    On Error GoTo ErrHandler
    LogToRR9998 "CreateManualBCI started."
    
    Dim supplierName As String
    supplierName = InputBox("Enter Supplier Name:", "Buyer Created Invoice")
    If Trim(supplierName) = "" Then Exit Sub
    
    Dim supplierGst As String
    supplierGst = InputBox("Enter Supplier GST Number (optional):", "Supplier GST")
    
    Dim supplierBank As String
    supplierBank = InputBox("Enter Supplier Bank Account (optional):", "Supplier Bank")
    
    Dim dataString As String
    dataString = "supplierName=" & URLEncode(supplierName)
    If supplierGst <> "" Then dataString = dataString & "&supplierGst=" & URLEncode(supplierGst)
    If supplierBank <> "" Then dataString = dataString & "&supplierBank=" & URLEncode(supplierBank)
    dataString = dataString & "&manualEntry=true&formType=bci"
    
    Dim bciUrl As String
    bciUrl = "https://www.eek.nz/bci?" & EncodeBase64(dataString)
    
    ThisWorkbook.FollowHyperlink bciUrl
    LogToRR9998 "CreateManualBCI opened for supplier: " & supplierName
    
    ShowStatus "BCI form opened for: " & supplierName
    Exit Sub
    
ErrHandler:
    ShowError "Error: " & Err.description
    LogToRR9998 "Error in CreateManualBCI: " & Err.description
End Sub






