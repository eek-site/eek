Attribute VB_Name = "CallSupplierModule"
' Attribute VB_Name = "CallSupplierModule"
' Attribute VB_Name = "CallSupplierModule"
Sub CallSupplier()
    On Error GoTo ErrHandler

    Call OpenJobRegister

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? CallSupplier aborted � no Job Rego selected.", "SupplierCallLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")

    ' Retrieve current rego from named range
    Dim rego As String
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo ErrHandler
    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")

    If Trim(rego) = "" Then
        ShowWarning "No registration found."
        LogToRR9998 "? CallSupplier aborted � missing rego reference.", "SupplierCallLog.txt"
        Exit Sub
    End If

    ' Search for rego matches in column F
    Dim lastRow As Long, i As Long, matchCount As Long
    Dim rowIndices() As Long
    Dim supplierList As String
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    matchCount = 0

    For i = 2 To lastRow
        If LCase(Trim(ws.Cells(i, 6).value)) = LCase(Trim(rego)) Then
            matchCount = matchCount + 1
            ReDim Preserve rowIndices(1 To matchCount)
            rowIndices(matchCount) = i
        End If
    Next i

    If matchCount = 0 Then
        ShowWarning "No job found for the entered registration."
        LogToRR9998 "? CallSupplier � no match found for rego: " & rego, "SupplierCallLog.txt"
        Exit Sub
    End If

    ' Build numbered list
    supplierList = ""
    For i = 1 To matchCount
        supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
    Next i

    ' Prompt user
    Dim selectedIndex As Variant
    selectedIndex = Application.InputBox( _
        prompt:="Select the supplier by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
        title:="Select Supplier", _
        Type:=1)

    If VarType(selectedIndex) = vbBoolean Then
        LogToRR9998 "?? CallSupplier cancelled by user.", "SupplierCallLog.txt"
        Exit Sub
    End If

    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
        ShowWarning "Invalid selection."
        LogToRR9998 "? CallSupplier invalid selection: " & selectedIndex, "SupplierCallLog.txt"
        Exit Sub
    End If

    ' Extract row and number
    Dim rowIndex As Long, mobileNumber As String
    rowIndex = rowIndices(selectedIndex)
    mobileNumber = Trim(ws.Cells(rowIndex, 25).value) ' Column Y

    If mobileNumber = "" Then
        ShowWarning "No mobile number found for the selected supplier."
        LogToRR9998 "? CallSupplier � no mobile number for supplier at row " & rowIndex, "SupplierCallLog.txt"
        Exit Sub
    End If

    Dim callURL As String
    callURL = "tel:0" & mobileNumber

    ActiveWorkbook.FollowHyperlink address:=callURL, NewWindow:=True

    LogToRR9998 "?? CallSupplier � called 0" & mobileNumber & " (row " & rowIndex & ", rego: " & rego & ")", "SupplierCallLog.txt"
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in CallSupplier: " & Err.description, "SupplierCallLog.txt"
End Sub






