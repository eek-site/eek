VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet7"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet7"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet7"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    On Error GoTo ErrHandler

    Dim rng As Range
    Dim receiptName As String
    Dim folderPath As String
    Dim filePath As String

    Set rng = Target.Cells(1, 1)

    If rng.Column = 1 And rng.Row > 1 Then
        Select Case LCase(Trim(rng.value))
            Case "solve"
                Cancel = True
                SolveReceipt rng

            Case "open file"
                Cancel = True

                ' Use central path resolution
                folderPath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\", True)

                ' Use column C or D for receipt name
                If Trim(rng.Offset(0, 2).value) <> "" Then
                    receiptName = Trim(rng.Offset(0, 2).value)
                Else
                    receiptName = Trim(rng.Offset(0, 3).value)
                End If

                If receiptName = "" Then Exit Sub

                filePath = folderPath & receiptName & ".pdf"

                If Len(Dir(filePath)) > 0 Then
                    Shell "cmd /c start """" """ & filePath & """", vbHide
                    LogToRR9998 "Opened supplier file: " & filePath, "SupplierFileOpenLog.txt"
                Else
                    rng.value = "Solve"
                    rng.Font.Color = RGB(192, 0, 0)
                    rng.Font.Bold = True
                    Shell "explorer.exe """ & folderPath & """", vbNormalFocus
                    LogToRR9998 "File not found: " & filePath, "SupplierFileOpenLog.txt"
                End If
        End Select
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in Worksheet_BeforeDoubleClick (Supplier Sheet): " & Err.description, "SupplierFileOpenLog.txt"
End Sub











