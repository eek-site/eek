Attribute VB_Name = "UpdateSupplierDetailsModule"
' Attribute VB_Name = "UpdateSupplierDetailsModule"
' Attribute VB_Name = "UpdateSupplierDetailsModule"
Sub UpdateSupplierDetails()
    On Error GoTo ErrorHandler

    CollectRego

    Dim ws As Worksheet
    Dim rego As String
    Dim lastRow As Long, i As Long
    Dim matchCount As Long
    Dim selectedIndex As Variant
    Dim rowIndex As Long
    
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    
    ' Get rego from named range
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo 0
    
    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")
    
    If rego = "" Then
        MsgBox "No registration found. Returning to main menu.", vbExclamation, "Error"
        Exit Sub
    End If

    ' Find matching rows by rego in column F
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    Dim rowIndices() As Long
    Dim supplierList As String
    matchCount = 0
    
    For i = 2 To lastRow
        If LCase(ws.Cells(i, 6).value) = LCase(rego) Then
            matchCount = matchCount + 1
            ReDim Preserve rowIndices(1 To matchCount)
            rowIndices(matchCount) = i
        End If
    Next i
    
    If matchCount = 0 Then
        MsgBox "No job found for the entered registration. Returning to main menu.", vbExclamation, "No Match"
        Exit Sub
    End If
    
    ' Build supplier list (col H = Supplier)
    supplierList = ""
    For i = 1 To matchCount
        supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
    Next i
    
    ' Prompt for supplier selection if multiple matches
    selectedIndex = Application.InputBox( _
        prompt:="Select the supplier by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
        title:="Select Supplier", _
        Type:=1)
    
    If VarType(selectedIndex) = vbBoolean Then Exit Sub ' Cancelled
    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
        MsgBox "Invalid selection. Returning to main menu.", vbExclamation, "Error"
        Exit Sub
    End If

    ' === We now have the correct row ===
    rowIndex = rowIndices(selectedIndex)

    ' Get supplier name for notification
    Dim supplierName As String
    Dim supplierCol As Long
    supplierCol = 0
    On Error Resume Next
    supplierCol = Application.WorksheetFunction.Match("Supplier", ws.rows(1), 0)
    On Error GoTo 0
    If supplierCol > 0 Then supplierName = Trim(ws.Cells(rowIndex, supplierCol).value)
    
    ' Fields to optionally update
    Dim headers As Variant
    headers = Array("Supplier", "Costings", "Bank_Account", "Supp_Email", "Supp_Phone")
    
    Dim fieldName As Variant
    Dim currentVal As String
    Dim inputVal As String
    Dim colIndex As Long
    Dim changesMade As Boolean
    Dim changeDescription As String
    changesMade = False
    changeDescription = ""
    
    For Each fieldName In headers
        colIndex = 0
        On Error Resume Next
        colIndex = Application.WorksheetFunction.Match(fieldName, ws.rows(1), 0)
        On Error GoTo 0
        
        If colIndex > 0 Then
            currentVal = ws.Cells(rowIndex, colIndex).value
            inputVal = InputBox("Current value for '" & fieldName & "': " & currentVal & vbCrLf & _
                                "Enter new value (or leave blank to keep current):", _
                                "Update " & fieldName)
            If Trim(inputVal) <> "" And Trim(inputVal) <> Trim(currentVal) Then
                ws.Cells(rowIndex, colIndex).value = inputVal
                changesMade = True
                If changeDescription <> "" Then changeDescription = changeDescription & ", "
                changeDescription = changeDescription & fieldName & " updated"
            End If
        End If
    Next fieldName

    ' Notify supplier if changes were made
    If changesMade And supplierName <> "" Then
        Call NotifySupplierOfChange(rego, supplierName, changeDescription)
        MsgBox "Supplier details updated successfully for rego: " & rego & vbCrLf & _
               "Supplier has been notified of the changes.", vbInformation, "Update Complete"
    Else
        MsgBox "Supplier details updated successfully for rego: " & rego, vbInformation, "Update Complete"
    End If
    
    ' === Run system update
    Call LookupAndCompare

    Exit Sub

ErrorHandler:
    ' Log the error to the log file
    LogToRR9998 "Error in UpdateSupplierDetails: " & Err.description
    MsgBox "An error occurred. Please check the log for details.", vbCritical, "Error"
End Sub














