Attribute VB_Name = "SolveReceiptsModule"
' Attribute VB_Name = "SolveReceiptsModule"
' Attribute VB_Name = "SolveReceiptsModule"
Sub CheckReceipts()
    On Error GoTo ErrHandler
    LogToRR9998 "CheckReceipts started."

    Dim ws As Worksheet
    Dim lastRow As Long
    Dim cell As Range
    Dim folderPath As String
    Dim invalidChars As String
    Dim cellValue As String
    Dim IsValid As Boolean
    Dim filePath As String

    Set ws = ThisWorkbook.Sheets("Receipts_List")

    folderPath = GetRRFilePath("SUPPLIER_INVOICE_FOLDER") ' central path logic

    invalidChars = "\/:*?""<>|"
    lastRow = ws.Cells(ws.rows.count, 2).End(xlUp).Row

    For Each cell In ws.Range("B2:B" & lastRow)
        cellValue = Trim(cell.Offset(0, 1).text)
        IsValid = True

        Dim i As Integer
        For i = 1 To Len(invalidChars)
            If InStr(cellValue, Mid(invalidChars, i, 1)) > 0 Then
                IsValid = False
                Exit For
            End If
        Next i

        filePath = folderPath & cellValue & ".pdf"

        With cell.Offset(0, -1)
            If Not IsValid Or cellValue = "" Or Len(Dir(filePath)) = 0 Then
                .value = "Solve"
                .Font.Color = RGB(192, 0, 0)
                .Font.Bold = True
            Else
                .value = "Open File"
                .Font.Color = RGB(0, 0, 255)
                .Font.Bold = False
            End If

            .Font.Underline = xlUnderlineStyleSingle
            .HorizontalAlignment = xlCenter
            .VerticalAlignment = xlCenter
        End With
    Next cell

    MsgBox "Receipt check completed.", vbInformation
    LogToRR9998 "CheckReceipts completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CheckReceipts: " & Err.description
End Sub
Sub SolveReceipt(ByVal Target As Range)
    On Error GoTo ErrHandler
    LogToRR9998 "SolveReceipt triggered on Row " & Target.Row

    Dim folderPath As String
    Dim filePath As String
    Dim receiptName As String

    folderPath = GetRRFilePath("SUPPLIER_INVOICE_FOLDER") ' centralized

    If Target.Column = 1 And LCase(Trim(Target.text)) = "solve" Then
        If Trim(Target.Offset(0, 2).text) <> "" Then
            receiptName = Trim(Target.Offset(0, 2).text)
        Else
            receiptName = Trim(Target.Offset(0, 3).text)
        End If

        If receiptName <> "" Then
            CopyTextToClipboard receiptName
            filePath = folderPath & receiptName & ".pdf"

            If Len(Dir(filePath)) > 0 Then
                With Target
                    .value = "Open File"
                    .Font.Color = RGB(0, 0, 255)
                    .Font.Bold = False
                    .Font.Underline = xlUnderlineStyleSingle
                End With
                Shell "cmd /c start """" """ & filePath & """", vbHide
                LogToRR9998 "Opened receipt file: " & receiptName
            Else
                With Target
                    .value = "Solve"
                    .Font.Color = RGB(192, 0, 0)
                    .Font.Bold = True
                    .Font.Underline = xlUnderlineStyleSingle
                End With
                Shell "explorer.exe """ & folderPath & """", vbNormalFocus
                LogToRR9998 "File missing – opened folder for receipt: " & receiptName
            End If
        Else
            Shell "explorer.exe """ & folderPath & """", vbNormalFocus
            LogToRR9998 "No receipt name – opened folder."
        End If
    End If
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SolveReceipt: " & Err.description
End Sub









