Attribute VB_Name = "SupplierProcessing"
' Attribute VB_Name = "SupplierProcessing"
' Attribute VB_Name = "SupplierProcessing"
Sub MarkVoid()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    Dim cell As Range
    Dim xCell As Range
    Dim redColor As Long
    Dim orangeColor As Long

    ' Set the worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    ' Define the RGB colors for red and orange
    redColor = RGB(255, 0, 0)
    orangeColor = RGB(255, 165, 0)

    ' Loop through each cell in column AA
    For Each cell In ws.Range("AA1:AA" & ws.Cells(ws.rows.count, "AA").End(xlUp).Row)
        ' Get the corresponding cell in column X
        Set xCell = ws.Cells(cell.Row, "X")
        
        ' Check if AA cell is red and X is empty
        If cell.Interior.Color = redColor And IsEmpty(xCell.value) Then
            xCell.value = "VOID"
        End If
        
        ' Check if X is orange and X is empty
        If xCell.Interior.Color = orangeColor And IsEmpty(xCell.value) Then
            xCell.value = "VOID"
        End If
    Next cell
    
    Exit Sub

ErrorHandler:
    LogToRR9998 "MarkVoid", Err.description
End Sub

Sub MatchColumnColorRowByRow()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    
    ' Set the worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    
    ' Determine the last used row in column Z
    lastRow = ws.Cells(ws.rows.count, "Z").End(xlUp).Row
    
    ' Loop through each row in column Z and copy the color to column AA
    For i = 1 To lastRow
        ws.Cells(i, "AA").Interior.Color = ws.Cells(i, "Z").Interior.Color
    Next i
    
    Exit Sub

ErrorHandler:
    LogToRR9998 "MatchColumnColorRowByRow", Err.description
End Sub

Sub FetchSupplierReceipts()
    On Error GoTo ErrorHandler
    Dim wsReceipts As Worksheet
    Dim http As Object
    Dim url As String
    Dim accessToken As String, tenantId As String
    Dim jsonResponse As String
    Dim invoices As Object
    Dim invoice As Object
    Dim rowIndex As Long

    ' Set the worksheet
    Set wsReceipts = ThisWorkbook.Sheets("Receipts_List")
    
    ' Load access token and tenant ID from the API sheet
    With ThisWorkbook.Sheets("API")
        accessToken = .Range("A2").value
        tenantId = .Range("C2").value
    End With

    ' Define the API endpoint for fetching supplier invoices
    url = "https://api.xero.com/api.xro/2.0/Invoices?where=Type==""ACCPAY"""

    ' Initialize HTTP object
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", url, False
    http.setRequestHeader "Authorization", "Bearer " & accessToken
    http.setRequestHeader "Xero-Tenant-Id", tenantId
    http.setRequestHeader "Accept", "application/json"

    ' Send the request
    http.send

    ' Check the response status
    If http.status <> 200 Then
        MsgBox "Failed to fetch supplier invoices. Status: " & http.status & vbCrLf & "Response: " & http.responseText, vbCritical
        Exit Sub
    End If

    ' Parse the JSON response
    jsonResponse = http.responseText
    Set invoices = JsonConverter.ParseJson(jsonResponse)("Invoices")

    ' Clear the Receipts_List sheet before populating
    wsReceipts.Cells.Clear
    wsReceipts.Cells(1, 1).value = "Invoice Number"
    wsReceipts.Cells(1, 2).value = "Supplier Name"
    wsReceipts.Cells(1, 3).value = "Invoice Date"
    wsReceipts.Cells(1, 4).value = "Due Date"
    wsReceipts.Cells(1, 5).value = "Total Amount"
    wsReceipts.Cells(1, 6).value = "Status"
    wsReceipts.Cells(1, 7).value = "Reference"

    ' Start populating data from row 2
    rowIndex = 2

    ' Loop through each invoice and populate the sheet
    For Each invoice In invoices
        wsReceipts.Cells(rowIndex, 1).value = invoice("InvoiceNumber")
        wsReceipts.Cells(rowIndex, 2).value = invoice("Contact")("Name")
        wsReceipts.Cells(rowIndex, 3).value = invoice("Date")
        wsReceipts.Cells(rowIndex, 4).value = invoice("DueDate")
        wsReceipts.Cells(rowIndex, 5).value = invoice("Total")
        wsReceipts.Cells(rowIndex, 6).value = invoice("Status")
        wsReceipts.Cells(rowIndex, 7).value = invoice("Reference")
        rowIndex = rowIndex + 1
    Next invoice
    
    Exit Sub

ErrorHandler:
    LogToRR9998 "FetchSupplierReceipts", Err.description
End Sub

Sub ProcessSupplierReceipts()
    On Error GoTo ErrorHandler
    Dim wsBookAJob As Worksheet, wsReceipts As Worksheet, wsNotes As Worksheet
    Dim lastRowBookAJob As Long, lastRowReceipts As Long
    Dim i As Long, j As Long
    Dim matchValue As String, receiptData As String
    Dim totalE As Double
    Dim cellDate As Date

    ' Set worksheets
    Set wsBookAJob = ThisWorkbook.Sheets("Book a Job")
    Set wsReceipts = ThisWorkbook.Sheets("Receipts_List")
    Set wsNotes = ThisWorkbook.Sheets("Job Build Notes")

    ' Find last rows in each sheet
    lastRowBookAJob = wsBookAJob.Cells(wsBookAJob.rows.count, 1).End(xlUp).Row
    lastRowReceipts = wsReceipts.Cells(wsReceipts.rows.count, 1).End(xlUp).Row

    ' Loop through Book a Job from row 2
    For i = 2 To lastRowBookAJob
        ' If X contains "VOID," color AA the same as Z, and skip the row
        If Trim(LCase(wsBookAJob.Cells(i, 24).value)) = "void" Then ' Column X
            wsBookAJob.Cells(i, 27).Interior.Color = wsBookAJob.Cells(i, 26).Interior.Color ' Column AA = Column Z color
            GoTo nextRow
        End If

        ' Skip row if Column A is orange, Rego column (Column N) is blank, or starts with "RARP"
        If wsBookAJob.Cells(i, 1).Interior.Color = RGB(255, 165, 0) Or _
           Trim(wsBookAJob.Cells(i, 14).value) = "" Or _
           LCase(Left(Trim(wsBookAJob.Cells(i, 14).value), 4)) = "rarp" Then
            GoTo nextRow
        End If

        ' Compare Column N in Book a Job with Column A in Receipts_List
        matchValue = Trim(LCase(wsBookAJob.Cells(i, 14).value)) ' Column N in Book a Job (trim spaces and lowercase)
        totalE = 0
        receiptData = ""

        For j = lastRowReceipts To 2 Step -1
            If Trim(LCase(wsReceipts.Cells(j, 1).value)) = matchValue Then
                ' Concatenate data from Column B in Receipts_List
                If receiptData <> "" Then receiptData = receiptData & ", "
                receiptData = receiptData & wsReceipts.Cells(j, 2).value

                ' Sum Column E values
                totalE = totalE + wsReceipts.Cells(j, 5).value
            End If
        Next j

        ' Output data if matches found
        If receiptData <> "" Then
            wsBookAJob.Cells(i, 27).value = receiptData ' Column AA in Book a Job
            wsBookAJob.Cells(i, 23).value = totalE ' Column W in Book a Job

            ' Color AA light blue if a match is found
            wsBookAJob.Cells(i, 27).Interior.Color = RGB(173, 216, 230) ' Light blue
        Else
            ' Color AA based on date difference in Column B
            cellDate = wsBookAJob.Cells(i, 2).value ' Column B in Book a Job

            Select Case DateDiff("d", cellDate, Date)
                Case Is > 7
                    wsBookAJob.Cells(i, 27).Interior.Color = RGB(255, 0, 0) ' Red
                Case 3 To 6
                    wsBookAJob.Cells(i, 27).Interior.Color = RGB(255, 204, 0) ' Amber (between red and green)
                Case 1 To 2
                    wsBookAJob.Cells(i, 27).Interior.Color = RGB(0, 255, 0) ' Green
            End Select
        End If

nextRow:
    Next i
    
    Exit Sub

ErrorHandler:
    LogToRR9998 "ProcessSupplierReceipts", Err.description
End Sub














