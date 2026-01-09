VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet6"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet6"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet6"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    On Error GoTo ErrHandler

    Dim rng As Range
    Dim invoiceName As String
    Dim folderPath As String
    Dim filePath As String

    Set rng = Target.Cells(1, 1)

    If rng.Column = 1 And rng.Row > 1 Then
        Select Case LCase(Trim(rng.value))
            Case "solve"
                Cancel = True
                SolveInvoice rng

            Case "open file"
                Cancel = True

                folderPath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\", True)

                If Trim(rng.Offset(0, 2).value) <> "" Then
                    invoiceName = Trim(rng.Offset(0, 2).value)
                Else
                    invoiceName = Trim(rng.Offset(0, 3).value)
                End If

                If invoiceName = "" Then Exit Sub

                filePath = folderPath & invoiceName & ".pdf"

                If Len(Dir(filePath)) > 0 Then
                    Shell "cmd /c start """" """ & filePath & """", vbHide
                    LogToRR9998 "Opened invoice file: " & filePath, "InvoiceOpenLog.txt"
                Else
                    rng.value = "Solve"
                    rng.Font.Color = RGB(192, 0, 0)
                    rng.Font.Bold = True
                    Shell "explorer.exe """ & folderPath & """", vbNormalFocus
                    LogToRR9998 "Invoice file not found: " & filePath, "InvoiceOpenLog.txt"
                End If
        End Select
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in Worksheet_BeforeDoubleClick: " & Err.description, "InvoiceOpenLog.txt"
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)
    On Error GoTo ErrHandler

    Dim r As Range
    Set r = Intersect(Target, Me.Range("A:A,C:C,E:E"))
    
    If Not r Is Nothing Then
        Dim cell As Range
        For Each cell In r
            ProcessInvoiceRow cell.Row
        Next cell
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in Worksheet_Change (Invoice Sheet): " & Err.description, "InvoiceChangeLog.txt"
End Sub











