Attribute VB_Name = "dropdowncommandline"
' Attribute VB_Name = "dropdowncommandline"
' Attribute VB_Name = "dropdowncommandline"
' === Adds dropdown list to a cell from a defined range ===
Sub AddSupplierDropdown(ByVal cell As Range, ByVal sourceRange As Range)
    On Error GoTo ErrHandler
    With cell.Validation
        .Delete
        .Add Type:=xlValidateList, _
             AlertStyle:=xlValidAlertStop, _
             Operator:=xlBetween, _
             Formula1:="=" & sourceRange.address(External:=True)
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowInput = True
        .ShowError = True
    End With
    Exit Sub
ErrHandler:
    LogToRR9998 "? Error in AddSupplierDropdown: " & Err.description, "SupplierDropdownLog.txt"
End Sub

' === Removes dropdown from a cell ===
Sub RemoveDropdown(ByVal cell As Range)
    On Error Resume Next
    cell.Validation.Delete
    On Error GoTo 0
End Sub

' === Checks if suppliers listed in Contractor_Details exist in Receipts_List ===
Sub CheckContractorDetails()
    On Error GoTo ErrHandler

    Dim wsReceipts As Worksheet, wsContractors As Worksheet
    Dim lastRowReceipts As Long, lastRowContractors As Long
    Dim cell As Range, foundSupplier As Range, supplierList As Range

    Set wsReceipts = ThisWorkbook.Sheets("Receipts_List")
    Set wsContractors = ThisWorkbook.Sheets("Contractor_Details")

    lastRowReceipts = wsReceipts.Cells(wsReceipts.rows.count, "B").End(xlUp).Row
    lastRowContractors = wsContractors.Cells(wsContractors.rows.count, "D").End(xlUp).Row

    Set supplierList = wsReceipts.Range("B2:B" & lastRowReceipts)

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    Dim checkedCount As Long, flaggedCount As Long
    checkedCount = 0: flaggedCount = 0

    For Each cell In wsContractors.Range("D2:D" & lastRowContractors)
        If Trim(cell.value) <> "" Then
            Set foundSupplier = supplierList.Find(What:=Trim(cell.value), LookAt:=xlWhole)
            If foundSupplier Is Nothing Then
                cell.Interior.Color = RGB(255, 0, 0)
                AddSupplierDropdown cell, supplierList
                flaggedCount = flaggedCount + 1
            Else
                cell.Interior.ColorIndex = xlNone
                RemoveDropdown cell
            End If
            checkedCount = checkedCount + 1
        End If
    Next cell

    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic

    LogToRR9998 "? CheckContractorDetails completed — Checked: " & checkedCount & ", Flagged: " & flaggedCount, "SupplierDropdownLog.txt"
    Exit Sub

ErrHandler:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LogToRR9998 "? Error in CheckContractorDetails: " & Err.description, "SupplierDropdownLog.txt"
End Sub














