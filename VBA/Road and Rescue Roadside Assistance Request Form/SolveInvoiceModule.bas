Attribute VB_Name = "SolveInvoiceModule"
' Attribute VB_Name = "SolveInvoiceModule"
' Attribute VB_Name = "SolveInvoiceModule"
Sub CheckInvoices()
    On Error GoTo ErrHandler
    LogToRR9998 "CheckInvoices started."

    Dim ws As Worksheet
    Dim lastRow As Long
    Dim cell As Range
    Dim folderPath As String
    Dim invalidChars As String
    Dim cellValue As String
    Dim IsValid As Boolean
    Dim filePath As String

    Set ws = ThisWorkbook.Sheets("Invoice_List")

    folderPath = GetRRFilePath("CLIENT_INVOICE_FOLDER")

    invalidChars = "\/:*?""<>|"
    lastRow = ws.Cells(ws.rows.count, 3).End(xlUp).Row

    For Each cell In ws.Range("C2:C" & lastRow)
        cellValue = Trim(cell.text)
        IsValid = True

        Dim i As Integer
        For i = 1 To Len(invalidChars)
            If InStr(cellValue, Mid(invalidChars, i, 1)) > 0 Then
                IsValid = False
                Exit For
            End If
        Next i

        filePath = folderPath & cellValue & ".pdf"
        With cell.Offset(0, -2)
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

    MsgBox "Invoice check completed.", vbInformation
    LogToRR9998 "CheckInvoices completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CheckInvoices: " & Err.description
End Sub
Public Sub SolveInvoice(ByVal Target As Range)
    On Error GoTo ErrHandler
    LogToRR9998 "SolveInvoice triggered on Row " & Target.Row

    Dim folderPath As String
    Dim filePath As String
    Dim invoiceName As String

    folderPath = GetRRFilePath("CLIENT_INVOICE_FOLDER")

    If Target.Column = 1 And LCase(Trim(Target.text)) = "solve" Then
        If Trim(Target.Offset(0, 2).text) <> "" Then
            invoiceName = Trim(Target.Offset(0, 2).text)
        Else
            invoiceName = Trim(Target.Offset(0, 3).text)
        End If

        If invoiceName <> "" Then
            CopyTextToClipboard invoiceName
            filePath = folderPath & invoiceName & ".pdf"

            If Len(Dir(filePath)) > 0 Then
                With Target
                    .value = "Open File"
                    .Font.Color = RGB(0, 0, 255)
                    .Font.Bold = False
                    .Font.Underline = xlUnderlineStyleSingle
                End With
                Shell "cmd /c start """" """ & filePath & """", vbHide
                LogToRR9998 "Opened PDF file for invoice: " & invoiceName
            Else
                With Target
                    .value = "Solve"
                    .Font.Color = RGB(192, 0, 0)
                    .Font.Bold = True
                    .Font.Underline = xlUnderlineStyleSingle
                End With
                Shell "explorer.exe """ & folderPath & """", vbNormalFocus
                LogToRR9998 "File missing. Opened folder for manual check: " & invoiceName
            End If
        Else
            Shell "explorer.exe """ & folderPath & """", vbNormalFocus
            LogToRR9998 "No invoice name found. Folder opened for review."
        End If
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SolveInvoice: " & Err.description
End Sub









