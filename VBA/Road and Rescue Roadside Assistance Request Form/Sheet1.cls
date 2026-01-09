VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet1"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet1"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit

Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    On Error GoTo ErrHandler
    
    ' Copy rego to clipboard when column V is clicked
    If Not Intersect(Target, Me.Columns("V")) Is Nothing And Target.Row > 2 Then
        If Target.Cells.count = 1 Then
            Dim rego As String
            rego = Trim(Target.value)
            If rego <> "" Then
                CopyTextToClipboard rego
            End If
        End If
    End If
    
    ' Copy address to clipboard when column AJ is clicked
    If Not Intersect(Target, Me.Columns("AJ")) Is Nothing And Target.Row > 2 Then
        If Target.Cells.count = 1 Then
            Dim addressText As String
            ' Get address from column K of the same row
            addressText = Trim(Me.Cells(Target.Row, 11).value) ' Column K = 11
            If addressText <> "" Then
                CopyTextToClipboard addressText
            End If
        End If
    End If
    
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in Worksheet_SelectionChange: " & Err.description, "SelectionChangeLog.txt"
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)
    On Error GoTo ErrHandler
    If Not Intersect(Target, Me.Columns("AA")) Is Nothing Then
        Application.EnableEvents = False
        MatchCellColorAAZ Target
        Application.EnableEvents = True
    End If
    Exit Sub
ErrHandler:
    Application.EnableEvents = True
    LogToRR9998 "Error in Worksheet_Change: " & Err.description, "ChangeLog.txt"
End Sub

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    On Error GoTo ErrHandler
    
    ' Double-click column AW to call - phone from G & H
    If Not Intersect(Target, Me.Columns("AW")) Is Nothing And Target.Row > 2 Then
        If Target.Cells.count = 1 Then
            Cancel = True
            
            Dim countryCode As String
            Dim phoneNum As String
            
            countryCode = Trim(Me.Cells(Target.Row, 7).value) ' Column G
            phoneNum = Trim(Me.Cells(Target.Row, 8).value) ' Column H
            
            If phoneNum = "" Then
                MsgBox "No phone number found for this row.", vbExclamation, "No Phone"
                Exit Sub
            End If
            
            Dim fullNumber As String
            fullNumber = countryCode & phoneNum
            
            CreateObject("WScript.Shell").Run "tel:" & fullNumber
            LogToRR9998 "Click-to-call from AW: " & fullNumber, "PhoneCallLog.txt"
        End If
    End If
    
    ' Double-click column AA to call supplier
    If Not Intersect(Target, Me.Columns("AA")) Is Nothing And Target.Row > 2 Then
        If Target.Cells.count = 1 Then
            Cancel = True
            
            Dim rego As String
            rego = Trim(Me.Cells(Target.Row, 14).value) ' Column N
            
            If rego = "" Then
                MsgBox "No rego found in column N for this row.", vbExclamation, "No Rego"
                Exit Sub
            End If
            
            Dim wsJobBuild As Worksheet
            Dim lastRow As Long
            Dim i As Long
            Dim suppliers As Collection
            Dim SupplierInfo As String
            
            Set wsJobBuild = ThisWorkbook.Worksheets("Job Build Notes")
            Set suppliers = New Collection
            
            lastRow = wsJobBuild.Cells(wsJobBuild.rows.count, "F").End(xlUp).Row
            
            For i = 2 To lastRow
                If Trim(wsJobBuild.Cells(i, 6).value) = rego Then ' Column F
                    If InStr(1, wsJobBuild.Cells(i, 7).value, "Supplier", vbTextCompare) > 0 Then
                        Dim phoneNumber As String
                        phoneNumber = Trim(wsJobBuild.Cells(i, 25).value) ' Column Y
                        
                        If phoneNumber <> "" Then
                            If Left(phoneNumber, 1) <> "0" Then
                                phoneNumber = "0" & phoneNumber
                            End If
                            SupplierInfo = i & "|" & phoneNumber & "|" & wsJobBuild.Cells(i, 7).value
                            suppliers.Add SupplierInfo
                        End If
                    End If
                End If
            Next i
            
            If suppliers.count = 0 Then
                MsgBox "No suppliers with phone numbers found for rego: " & rego, vbExclamation, "No Suppliers Found"
            ElseIf suppliers.count = 1 Then
                Dim parts() As String
                parts = Split(suppliers(1), "|")
                Dim telLink As String
                telLink = "tel:" & parts(1)
                CreateObject("WScript.Shell").Run telLink
                LogToRR9998 "Calling supplier for rego: " & rego & " at " & parts(1), "PhoneCallLog.txt"
            Else
                ShowSupplierSelection rego, suppliers, wsJobBuild
            End If
        End If
    End If
    
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in Worksheet_BeforeDoubleClick: " & Err.description, "DoubleClickLog.txt"
    MsgBox "Error initiating call: " & Err.description, vbCritical, "Error"
End Sub

Sub ShowSupplierSelection(rego As String, suppliers As Collection, wsJobBuild As Worksheet)
    On Error GoTo ErrHandler
    
    Dim supplierList As String
    Dim i As Integer
    Dim parts() As String
    
    supplierList = "Multiple suppliers found for rego " & rego & ":" & vbCrLf & vbCrLf
    
    For i = 1 To suppliers.count
        parts = Split(suppliers(i), "|")
        supplierList = supplierList & i & ". " & parts(2) & " - " & parts(1) & vbCrLf
    Next i
    
    supplierList = supplierList & vbCrLf & "Enter number (1-" & suppliers.count & ") to call:"
    
    Dim userChoice As String
    userChoice = InputBox(supplierList, "Select Supplier to Call", "1")
    
    If userChoice <> "" Then
        Dim choiceNum As Integer
        choiceNum = val(userChoice)
        
        If choiceNum >= 1 And choiceNum <= suppliers.count Then
            parts = Split(suppliers(choiceNum), "|")
            Dim telLink As String
            telLink = "tel:" & parts(1)
            CreateObject("WScript.Shell").Run telLink
            LogToRR9998 "Calling supplier #" & choiceNum & " for rego: " & rego & " at " & parts(1), "PhoneCallLog.txt"
        Else
            MsgBox "Invalid selection. Please double-click again and enter a number between 1 and " & suppliers.count, vbExclamation
        End If
    End If
    
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in ShowSupplierSelection: " & Err.description, "SupplierSelectionLog.txt"
End Sub

Sub MatchCellColorAAZ(ByVal Target As Range)
    On Error GoTo ErrHandler
    Dim cell As Range
    Dim referenceCell As Range
    
    For Each cell In Target
        If Not Intersect(cell, Me.Columns("AA")) Is Nothing Then
            Set referenceCell = cell.Offset(0, -2)
            If Not IsEmpty(referenceCell.value) And cell.value = referenceCell.value Then
                cell.Interior.Color = referenceCell.Interior.Color
            End If
        End If
    Next cell
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in MatchCellColorAAZ: " & Err.description, "ColorLog.txt"
End Sub










