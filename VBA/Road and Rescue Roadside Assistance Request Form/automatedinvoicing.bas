Attribute VB_Name = "automatedinvoicing"
' Attribute VB_Name = "automatedinvoicing"
' Attribute VB_Name = "automatedinvoicing"
Option Explicit

' === INVOICING ENTRYPOINT ===
Public Sub AutomateInvoicing()
    Dim choice As String
    choice = InputBox( _
        "SEND INVOICE" & vbCrLf & vbCrLf & _
        "1 - Batch: invoice ALL GREEN rows (close + add to invoice list)" & vbCrLf & _
        "2 - Selected job: Final / Interim" & vbCrLf & vbCrLf & _
        "Enter 1 or 2 (blank to cancel):", _
        "Send Invoice")
        
    If choice = "" Then Exit Sub
    
    Select Case Trim$(choice)
        Case "1"
            AutomateInvoicing_BatchGreenRows True
        Case "2"
            AutomateInvoicing_SingleJobInteractive
        Case Else
            MsgBox "Invalid choice.", vbExclamation
    End Select
End Sub

Public Sub AutomateInvoicing_BatchGreenRows(Optional ByVal showSummary As Boolean = True)
    On Error GoTo ErrHandler
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    
    Dim lastRow As Long
    lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    
    Dim processed As Long
    processed = 0
    
    Dim r As Long
    For r = 2 To lastRow
        ' Green rows are set by ProcessJobBuildNotes when Job Build Notes col N = "Yes"
        ' Skip light blue rows (already invoiced)
        If ws.Cells(r, "A").Interior.Color = RGB(144, 238, 144) Then
            ' CreatePDF will mark row light-blue (closed) and assign invoice number etc.
            Call CreatePDF(ws, r)
            Call AppendToInvoiceList(ws, r)
            processed = processed + 1
        End If
    Next r
    
    If showSummary Then
        MsgBox "Batch invoicing complete." & vbCrLf & _
               "Processed: " & processed, vbInformation, "Send Invoice"
    End If
    Exit Sub
    
ErrHandler:
    If showSummary Then MsgBox "Error in batch invoicing: " & Err.description, vbCritical
End Sub

Private Sub AutomateInvoicing_SingleJobInteractive()
    Dim ws As Worksheet, wsJobNotes As Worksheet
    Dim lastRow As Long
    Dim userChoice As VbMsgBoxResult
    Dim invoiceType As String
    Dim foundRow As Long: foundRow = 0
    Dim isInterim As Boolean
    Dim isFinalPayment As Boolean: isFinalPayment = False
    
    ' === GET REGO USING EXISTING SUB ===
    Call OpenJobRegister
    
    If selectedJobRego = "" Then
        MsgBox "No job selected.", vbExclamation, "Cancelled"
        Exit Sub
    End If
    
    ' === INVOICE TYPE MENU ===
    userChoice = MsgBox("Select Invoice Type for " & UCase(selectedJobRego) & ":" & vbCrLf & vbCrLf & _
                       "YES = Final Invoice" & vbCrLf & _
                       "        - Closes job (row turns blue)" & vbCrLf & _
                       "        - Adds to Invoice List" & vbCrLf & vbCrLf & _
                       "NO = Interim Invoice" & vbCrLf & _
                       "        - Job stays open for more work" & vbCrLf & vbCrLf & _
                       "Cancel to exit.", _
                       vbYesNoCancel + vbQuestion, "Invoice Type")
    
    If userChoice = vbCancel Then Exit Sub
    
    isInterim = (userChoice = vbNo)
    
    ' === IF INTERIM, ASK IF FINAL PAYMENT OR PROGRESS ===
    If isInterim Then
        Dim paymentChoice As VbMsgBoxResult
        paymentChoice = MsgBox("Payment Type for this Interim Invoice:" & vbCrLf & vbCrLf & _
                              "YES = Final Payment Request" & vbCrLf & _
                              "        - Full remaining balance due now" & vbCrLf & _
                              "        - Job stays open but payment closes" & vbCrLf & vbCrLf & _
                              "NO = Progress Payment" & vbCrLf & _
                              "        - Partial payment for work to date" & vbCrLf & _
                              "        - More invoices may follow" & vbCrLf & vbCrLf & _
                              "Cancel to exit.", _
                              vbYesNoCancel + vbQuestion, "Payment Type")
        
        If paymentChoice = vbCancel Then Exit Sub
        isFinalPayment = (paymentChoice = vbYes)
    End If
    
    ' Set invoice type label
    If Not isInterim Then
        invoiceType = "FINAL"
    ElseIf isFinalPayment Then
        invoiceType = "INTERIM (Final Payment)"
    Else
        invoiceType = "INTERIM (Progress Payment)"
    End If
    
    ' Set worksheets
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "ERROR: 'Book a Job' sheet not found." & vbCrLf & vbCrLf & _
               "Please check the workbook has the correct sheet name.", vbCritical, "Sheet Missing"
        Exit Sub
    End If
    
    If wsJobNotes Is Nothing Then
        MsgBox "ERROR: 'Job Build Notes' sheet not found." & vbCrLf & vbCrLf & _
               "Please check the workbook has the correct sheet name.", vbCritical, "Sheet Missing"
        Exit Sub
    End If
    
    ' Find last row with data
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    If lastRow < 2 Then
        MsgBox "ERROR: No data found in 'Book a Job' sheet." & vbCrLf & vbCrLf & _
               "The sheet appears to be empty or only contains headers.", vbCritical, "No Data"
        Exit Sub
    End If
    
    ' Find the row with matching rego (column V)
    Dim i As Long
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(selectedJobRego)) Then
            foundRow = i
            Exit For
        End If
    Next i
    
    If foundRow = 0 Then
        MsgBox "REGO NOT FOUND" & vbCrLf & vbCrLf & _
               "Could not find rego: " & UCase(selectedJobRego) & vbCrLf & vbCrLf & _
               "Please check:" & vbCrLf & _
               "- Spelling is correct" & vbCrLf & _
               "- Job exists in 'Book a Job' sheet (Column V)", vbExclamation, "Not Found"
        Exit Sub
    End If
    
    ' Confirm before processing
    Dim customerName As String
    customerName = Trim(ws.Cells(foundRow, "E").value)  ' Column E = Customer Name
    
    Dim confirmMsg As String
    confirmMsg = "Ready to send " & invoiceType & vbCrLf & vbCrLf & _
                 "Rego: " & UCase(selectedJobRego) & vbCrLf & _
                 "Customer: " & customerName & vbCrLf & _
                 "Row: " & foundRow & vbCrLf & vbCrLf & _
                 "Proceed?"
    
    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Invoice") <> vbYes Then Exit Sub
    
    ' Process the row
    On Error Resume Next
    If Not isInterim Then
        ' FINAL INVOICE
        Call CreatePDFWithPayment(ws, foundRow, False, False)
        Call AppendToInvoiceList(ws, foundRow)
    Else
        ' INTERIM INVOICE (Progress or Final Payment)
        Call CreatePDFWithPayment(ws, foundRow, True, isFinalPayment)
    End If
    
    If Err.Number <> 0 Then
        MsgBox "ERROR processing invoice:" & vbCrLf & vbCrLf & _
               "Rego: " & UCase(selectedJobRego) & vbCrLf & _
               "Error: " & Err.description & vbCrLf & vbCrLf & _
               "Common issues:" & vbCrLf & _
               "- Word template not found" & vbCrLf & _
               "- C:\Temp folder doesn't exist" & vbCrLf & _
               "- Missing data in required columns" & vbCrLf & _
               "- No matching rego in Job Build Notes", vbCritical, "Processing Error"
    End If
    On Error GoTo 0
End Sub

Sub AppendToInvoiceList(ws As Worksheet, rowNum As Long)
    Dim wsInvoice As Worksheet
    Dim headerMap As Object, jobHeaderMap As Object
    Dim col As Long, targetRow As Long
    Dim map As Object
    Dim invCol As Variant, jobCol As Variant
    Dim regoValue As String
    Dim matchCol As Long
    Dim folderPath As String, invalidChars As String
    Dim IsValid As Boolean, clientName As String, filePath As String
    Dim i As Integer

    Set wsInvoice = ThisWorkbook.Sheets("Invoice_List")
    Set headerMap = CreateObject("Scripting.Dictionary")
    Set jobHeaderMap = CreateObject("Scripting.Dictionary")
    Set map = CreateObject("Scripting.Dictionary")

    ' Define mapping: Invoice_List header => Book a Job header
    map.Add "Date", "Start time"
    map.Add "Invoice Ref", "Rego"
    map.Add "Client Name", "Name"
    map.Add "Amount", "Price"
    map.Add "Email Address", "Email Address"
    map.Add "Description", "Service Required"
    map.Add "Invoice Number", "Inv Nbr"

    ' Map headers in Invoice_List
    For col = 1 To wsInvoice.Cells(1, wsInvoice.Columns.count).End(xlToLeft).Column
        headerMap(wsInvoice.Cells(1, col).value) = col
    Next col

    ' Map headers in Book a Job
    For col = 1 To ws.Cells(1, ws.Columns.count).End(xlToLeft).Column
        jobHeaderMap(ws.Cells(1, col).value) = col
    Next col

    ' === Find matching row in Invoice_List based on Rego ===
    regoValue = Trim(ws.Cells(rowNum, jobHeaderMap("Rego")).text)
    targetRow = 0

    If headerMap.Exists("Invoice Ref") Then
        matchCol = headerMap("Invoice Ref")
        For i = 2 To wsInvoice.Cells(wsInvoice.rows.count, matchCol).End(xlUp).Row
            If Trim(wsInvoice.Cells(i, matchCol).text) = regoValue Then
                targetRow = i ' found existing Rego
                Exit For
            End If
        Next i
    End If

    ' If not found, append to next empty row
    If targetRow = 0 Then
        targetRow = wsInvoice.Cells(wsInvoice.rows.count, "A").End(xlUp).Row + 1
    End If

    ' === Write or update mapped fields ===
    For Each invCol In map.keys
        jobCol = map(invCol)
        If jobCol <> "" Then
            If jobHeaderMap.Exists(jobCol) And headerMap.Exists(invCol) Then
                wsInvoice.Cells(targetRow, headerMap(invCol)).value = ws.Cells(rowNum, jobHeaderMap(jobCol)).value
            End If
        End If
    Next invCol

    ' === Solve / Open File logic for Column A ===
    folderPath = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\" & _
    "Road and Rescue New Zealand - Documents\" & _
    "1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\"

    invalidChars = "\/:*?""<>|"
    IsValid = True
    clientName = Trim(wsInvoice.Cells(targetRow, headerMap("Client Name")).text)

    For i = 1 To Len(invalidChars)
        If InStr(clientName, Mid(invalidChars, i, 1)) > 0 Then
            IsValid = False
            Exit For
        End If
    Next i

    filePath = folderPath & clientName & ".pdf"

    With wsInvoice.Cells(targetRow, 1) ' Column A
        If Not IsValid Or clientName = "" Or Len(Dir(filePath)) = 0 Then
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
End Sub

Public Sub ProcessInvoiceRow(ByVal i As Long)
    Const COL_FILENAME As Long = 3 ' Invoice Ref (Column C)
    Const COL_EXPECTED As Long = 5 ' Expected Amount (Column E)
    Const COL_RESULT As Long = 7   ' Status (Column G)

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Invoice_List")

    Dim pdfFolder As String, pdfPath As String, localPdfPath As String, txtPath As String
    Dim userProfile As String
    userProfile = Environ("USERPROFILE")

    pdfFolder = userProfile & "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\"
    localPdfPath = "C:\Temp\"
    If Dir(localPdfPath, vbDirectory) = "" Then MkDir localPdfPath

    Dim fileName As String
    fileName = Trim(CStr(ws.Cells(i, COL_FILENAME).value))
    If Len(fileName) = 0 Then Exit Sub
    If LCase(Right(fileName, 4)) <> ".pdf" Then fileName = fileName & ".pdf"

    pdfPath = pdfFolder & fileName
    localPdfPath = localPdfPath & fileName
    txtPath = "C:\Temp\invoice_" & i & ".txt"

    If Dir(pdfPath) <> "" Then
        If Dir(localPdfPath) <> "" Then Kill localPdfPath
        FileCopy pdfPath, localPdfPath

        Dim exePath As String
        exePath = pdfFolder & "pdftotext.exe"

        Dim shellCmd As String
        shellCmd = """" & exePath & """ -layout """ & localPdfPath & """ """ & txtPath & """"

        Dim wsh As Object
        Set wsh = CreateObject("WScript.Shell")
        wsh.CurrentDirectory = userProfile & "\OneDrive - Road and Rescue Limited"
        wsh.Run shellCmd, 0, True

        If Dir(txtPath) <> "" Then
            Dim invoiceText As String
            With CreateObject("Scripting.FileSystemObject").OpenTextFile(txtPath, 1)
                invoiceText = .ReadAll
                .Close
            End With

            invoiceText = Replace(invoiceText, vbCrLf, " ")

            Dim regexAll As Object
            Set regexAll = CreateObject("VBScript.RegExp")
            regexAll.pattern = "([\d,]+\.\d{2})"
            regexAll.Global = True
            regexAll.IgnoreCase = True

            Dim allMatches As Object
            Set allMatches = regexAll.Execute(invoiceText)

            Dim listedAmount As Double, numVal As Double
            Dim foundMatch As Boolean
            listedAmount = ws.Cells(i, COL_EXPECTED).value

            Dim m As Variant
            For Each m In allMatches
                numVal = CDbl(Replace(m.SubMatches(0), ",", ""))
                If Round(numVal, 2) = Round(listedAmount, 2) Then
                    foundMatch = True
                    Exit For
                End If
            Next m

            If foundMatch Then
                ws.Cells(i, COL_RESULT).Interior.Color = RGB(144, 238, 144) ' Green
            Else
                ws.Cells(i, COL_RESULT).Interior.Color = RGB(255, 255, 0)   ' Yellow
            End If
        Else
            ws.Cells(i, COL_RESULT).Interior.Color = RGB(255, 0, 0)       ' Red (txt not found)
        End If
    Else
        ws.Cells(i, COL_RESULT).Interior.Color = RGB(255, 0, 0)           ' Red (pdf not found)
    End If
End Sub

Public Sub CheckAllInvoiceAmounts()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Invoice_List")

    Application.EnableEvents = False
    Application.ScreenUpdating = False

    Dim maxRow As Long, i As Long
    maxRow = ws.Cells(ws.rows.count, 3).End(xlUp).Row

    For i = 2 To maxRow
        ProcessInvoiceRow i
    Next i

    Application.EnableEvents = True
    Application.ScreenUpdating = True
End Sub

Sub CreatePDFWithPayment(ws As Worksheet, rowNumber As Long, isInterim As Boolean, Optional isFinalPayment As Boolean = False)
    Dim wsJobNotes As Worksheet
    Dim doc As Object
    Dim outputPathForEmail As String, finalOneDrivePath As String, localFolder As String
    Dim COLUMN_E As String, COLUMN_B As String, XeroRef As String, rego As String
    Dim COLUMN_AJ As String, STOTAL As Double
    Dim JOBNOTE(1 To 7) As String, q(1 To 7) As Long, u(1 To 7) As Double, a(1 To 7) As Double
    Dim APAID As Double, AOS As Double
    Dim pstatus As String, formattedAOS As String
    Dim i As Long, jobRow As Long, currentLine As Integer, currentRow As Long
    Dim reverseDate As String, fileName As String
    Dim WordApp As Object, templatePath As String, recipientName As String
    Dim recipientEmail As String, emailBody As String
    Dim refundAmountTotal As Double, refundText As String, isRefund As Boolean
    Dim countryCode As String, mobileNumber As String
    Dim invoiceLabel As String

    refundAmountTotal = 0: refundText = "": isRefund = False
    currentRow = rowNumber
    
    ' Set invoice label for emails/documents
    If Not isInterim Then
        invoiceLabel = ""
    ElseIf isFinalPayment Then
        invoiceLabel = "FINAL PAYMENT "
    Else
        invoiceLabel = "PROGRESS "
    End If

    Call LaunchOutlook

    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")

    templatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 COMPANY DOCUMENTS\20210401 EEK Mechanical END USER TERMS OF SERVICE.dotx")
    If Dir(templatePath) = "" Then
        MsgBox "The Word template could not be found.", vbCritical
        Exit Sub
    End If

    On Error Resume Next
    Set WordApp = GetObject(, "Word.Application")
    If WordApp Is Nothing Then Set WordApp = CreateObject("Word.Application")
    On Error GoTo 0
    If WordApp Is Nothing Then
        MsgBox "Unable to initialize Word application.", vbCritical
        Exit Sub
    End If

    localFolder = "C:\Temp\"
    If Dir(localFolder, vbDirectory) = "" Then
        MsgBox "Local folder " & localFolder & " does not exist.", vbCritical
        Exit Sub
    End If

    ' === COLOUR CHANGE ONLY FOR FINAL INVOICE ===
    If Not isInterim Then
        ws.rows(currentRow).Interior.Color = RGB(173, 216, 230) ' Light blue
    End If

    ' Column F = Invoice Name (for invoice document)
    ' Column E = Customer Name (for communications)
    COLUMN_E = ws.Cells(currentRow, "F").value  ' Invoice Name (Column F)
    If Trim(COLUMN_E) = "" Then COLUMN_E = ws.Cells(currentRow, "E").value  ' Fallback to customer name if invoice name is empty
    COLUMN_B = Format(ws.Cells(currentRow, "AG").value, "d mmm yyyy")
    rego = ws.Cells(currentRow, "AI").value
    
    ' Get contact details for payment request later
    countryCode = Replace(Trim(ws.Cells(currentRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(currentRow, "H").value)
    recipientEmail = ws.Cells(currentRow, "AF").value
    recipientName = Trim(ws.Cells(currentRow, "E").value)  ' Column E = Customer Name for communications

    ' === INVOICE NUMBER ===
    Dim lastInvoice As Variant: lastInvoice = 0
    For i = currentRow - 1 To 1 Step -1
        If Not IsEmpty(ws.Cells(i, "AU").value) Then
            lastInvoice = ws.Cells(i, "AU").value
            If Left(CStr(lastInvoice), 4) = "INT-" Then
                lastInvoice = Mid(CStr(lastInvoice), 5)
            End If
            If IsNumeric(lastInvoice) Then Exit For
        End If
    Next i

    If isInterim Then
        XeroRef = "INT-" & (CLng(lastInvoice) + 1)
        ' Don't write to AU for interim
    Else
        XeroRef = CLng(lastInvoice) + 1
        ws.Cells(currentRow, "AU").value = XeroRef
    End If

    COLUMN_AJ = ws.Cells(currentRow, "AJ").value
    STOTAL = 0: APAID = 0: AOS = 0: currentLine = 1

    ' === Gather Job Notes (up to 7 lines) ===
    For jobRow = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "A").End(xlUp).Row
        If wsJobNotes.Cells(jobRow, "F").value = ws.Cells(currentRow, "V").value Then
            Select Case wsJobNotes.Cells(jobRow, "G").value
                Case "Billable"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = NzD(wsJobNotes.Cells(jobRow, "K").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        If wsJobNotes.Cells(jobRow, "M").value <> "No" Then APAID = APAID + u(currentLine)
                        currentLine = currentLine + 1
                    End If

                Case "Reimbursement"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        currentLine = currentLine + 1
                    End If

                Case "Refund"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        refundAmountTotal = refundAmountTotal + Abs(NzD(wsJobNotes.Cells(jobRow, "I").value))
                        If refundText = "" Then refundText = wsJobNotes.Cells(jobRow, "M").value
                        isRefund = True
                        currentLine = currentLine + 1
                    End If

                Case "Deposit"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                        currentLine = currentLine + 1
                    Else
                        APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                    End If
            End Select
        End If
    Next jobRow

    AOS = STOTAL - APAID
    
    ' === STATUS MESSAGE ===
    Dim invoiceTypeLabel As String
    If Not isInterim Then
        invoiceTypeLabel = ""
    ElseIf isFinalPayment Then
        invoiceTypeLabel = "FINAL PAYMENT INVOICE - "
    Else
        invoiceTypeLabel = "PROGRESS INVOICE - "
    End If
    
    If AOS > 0 Then
        formattedAOS = "$" & Format(AOS, "0.00")
        If Not isInterim Then
            pstatus = "Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
                      "Settlement is required promptly in accordance with the stated terms of trade." & vbNewLine & _
                      "Payment details:" & vbNewLine & _
                      "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
        ElseIf isFinalPayment Then
            pstatus = invoiceTypeLabel & "Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
                      "This is the final payment required for your job. Please pay promptly to complete your service." & vbNewLine & _
                      "Payment details:" & vbNewLine & _
                      "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
        Else
            pstatus = invoiceTypeLabel & "Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
                      "This is a progress invoice for work completed to date. Further invoices may follow." & vbNewLine & _
                      "Payment details:" & vbNewLine & _
                      "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
        End If
    ElseIf AOS < 0 Then
        formattedAOS = "-$" & Format(Abs(AOS), "0.00")
        If isRefund Then
            pstatus = invoiceTypeLabel & "Refunded: $" & Format(refundAmountTotal, "0.00") & " via " & refundText & "."
        Else
            pstatus = invoiceTypeLabel & "Credit Balance: " & formattedAOS
        End If
    Else
        formattedAOS = "PAID"
        If Not isInterim Then
            pstatus = "PAID" & vbNewLine & _
                      "EEK Mechanical acknowledges receipt of full payment." & vbNewLine & _
                      "Submit a review at: https://www.eek.nz/review-form"
        ElseIf isFinalPayment Then
            pstatus = invoiceTypeLabel & "PAID" & vbNewLine & _
                      "Thank you for completing your final payment."
        Else
            pstatus = invoiceTypeLabel & "PAID TO DATE" & vbNewLine & _
                      "This is a progress invoice. Further invoices may follow as work continues."
        End If
        If isRefund Then
            pstatus = invoiceTypeLabel & "Refunded: $" & Format(refundAmountTotal, "0.00") & _
                      " via " & refundText & "." & vbNewLine & vbNewLine & pstatus
        End If
    End If

    ' === Build Word document replacements ===
    Set doc = WordApp.Documents.Add(templatePath)
    Dim replacements As Object: Set replacements = CreateObject("Scripting.Dictionary")
    replacements.Add "[COLUMN F]", COLUMN_E
    replacements.Add "[COLUMN B]", COLUMN_B
    replacements.Add "[XERO REF]", CStr(XeroRef)
    replacements.Add "[REGO]", rego
    replacements.Add "[COLUMN AJ]", COLUMN_AJ
    replacements.Add "[STOTAL]", "$" & Format(STOTAL, "0.00")
    replacements.Add "[APAID]", "$" & Format(APAID, "0.00")
    replacements.Add "[AOS]", formattedAOS
    replacements.Add "[STATUS]", pstatus

    Dim lineText As String
    For i = 1 To 7
        lineText = Trim(JOBNOTE(i))
        replacements.Add "[JOBNOTE" & i & "]", lineText
        replacements.Add "[Q" & i & "]", IIf(lineText = "", "", CStr(q(i)))
        replacements.Add "[U" & i & "]", IIf(lineText = "", "", "$" & Format(u(i), "0.00"))
        replacements.Add "[A" & i & "]", IIf(lineText = "", "", "$" & Format(a(i), "0.00"))
    Next i

    ' Do the find/replace
    Dim storyRange As Object, field As Variant
    For Each storyRange In doc.StoryRanges
        For Each field In replacements.keys
            With storyRange.Find
                .ClearFormatting
                .Replacement.ClearFormatting
                .text = field
                .Replacement.text = Left(replacements(field), 255)
                .Wrap = 1
                .Execute Replace:=2
            End With
        Next field
    Next storyRange

    ' === File naming ===
    reverseDate = Format(ws.Cells(currentRow, "AG").value, "yyyymmdd")
    Dim filePrefix As String
    If Not isInterim Then
        filePrefix = ""
    ElseIf isFinalPayment Then
        filePrefix = "FINAL_PMT_"
    Else
        filePrefix = "PROGRESS_"
    End If
    
    fileName = filePrefix & reverseDate & "_" & rego & "_" & _
               Replace(COLUMN_E, " ", "_") & "_" & Format(Now, "yyyymmddhhmmss") & ".pdf"
    outputPathForEmail = localFolder & fileName
    finalOneDrivePath = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\" & _
        "1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\" & _
        filePrefix & rego & ".pdf"

    doc.ExportAsFixedFormat OutputFileName:=outputPathForEmail, ExportFormat:=17
    doc.Close False

    ' === Build email body ===
    Dim emailInvoiceType As String
    If Not isInterim Then
        emailInvoiceType = "Invoice"
    ElseIf isFinalPayment Then
        emailInvoiceType = "Final Payment Invoice"
    Else
        emailInvoiceType = "Progress Invoice"
    End If
    
    emailBody = "Dear " & recipientName & "," & vbNewLine & vbNewLine & _
                emailInvoiceType & " " & XeroRef & " for NZD " & Format(STOTAL, "0.00") & " has been issued." & vbNewLine & vbNewLine
    
    If isInterim Then
        If isFinalPayment Then
            emailBody = emailBody & "This is your final payment invoice. Once paid, your account will be settled in full." & vbNewLine & vbNewLine
        Else
            emailBody = emailBody & "This is a progress invoice for work completed to date. Further invoices may follow as work continues." & vbNewLine & vbNewLine
        End If
    End If
    
    If AOS = 0 And isRefund Then
        emailBody = emailBody & "Refund of $" & Format(refundAmountTotal, "0.00") & _
                     " will be made via " & refundText & "." & vbNewLine & vbNewLine
    End If
    
    emailBody = emailBody & pstatus & vbNewLine & vbNewLine & _
                "By proceeding with our services, you have agreed to the stated terms of trade, posted at:" & vbNewLine & _
                "https://www.eek.nz/terms-of-service" & vbNewLine & vbNewLine & _
                "The terms include the following:" & vbNewLine & _
                "- Payments are final, and refunds are not applicable." & vbNewLine & _
                "- Additional fees may apply to outstanding balances." & vbNewLine & _
                "- EEK Mechanical reserves the right to re-invoice if supplier invoices were missing." & vbNewLine & vbNewLine & _
                "If you believe an error has occurred or would like to formally request a refund or lodge a complaint," & vbNewLine & _
                "please complete the following form:" & vbNewLine & _
                "https://www.eek.nz/dispute-form" & vbNewLine & vbNewLine & vbNewLine & _
                "Thank you," & vbNewLine & "EEK Mechanical" & vbNewLine & _
                "Level 1, 6 Johnsonville Road" & vbNewLine & "Johnsonville" & vbNewLine & "Wellington 6037" & vbNewLine & "New Zealand"

    ' === Send invoice email ===
    Dim invoiceSent As Boolean
    invoiceSent = SendViaOutbox("no-reply@eek.nz", recipientEmail, _
        emailInvoiceType & " " & XeroRef & " from EEK Mechanical", _
        emailBody, outputPathForEmail)
    
    If invoiceSent Then
        Application.Wait (Now + timeValue("0:00:02"))
        On Error Resume Next: If Dir(finalOneDrivePath) <> "" Then Kill finalOneDrivePath: On Error GoTo 0
        FileCopy outputPathForEmail, finalOneDrivePath
        
        ' === AUTO-SEND PAYMENT REQUEST IF AOS > 0 ===
        If AOS > 0 Then
            Call SendPaymentRequest(rego, recipientName, recipientEmail, countryCode, mobileNumber, AOS, XeroRef, isInterim, isFinalPayment)
        End If
    Else
        MsgBox "There was an issue sending the invoice email.", vbExclamation
    End If

    ' === Update Price column (Final invoice only) ===
    If Not isInterim Then
        Dim wsBook As Worksheet: Set wsBook = ThisWorkbook.Sheets("Book a Job")
        Dim iRow As Long
        For iRow = 2 To wsBook.Cells(wsBook.rows.count, "N").End(xlUp).Row
            If Trim(wsBook.Cells(iRow, "N").value) = Trim(rego) Then
                wsBook.Cells(iRow, "W").value = STOTAL
                Exit For
            End If
        Next iRow
        
        ' === NOTIFY SUPPLIER(S) - VEHICLE CAN BE RELEASED ===
        ' Final invoice means customer has paid - supplier can release vehicle
        Call NotifySupplierVehicleRelease(rego, recipientName)
    End If

    WordApp.Quit False
    
    ' === FINAL CONFIRMATION ===
    Dim summaryMsg As String
    Dim summaryType As String
    If Not isInterim Then
        summaryType = "FINAL INVOICE"
    ElseIf isFinalPayment Then
        summaryType = "FINAL PAYMENT INVOICE"
    Else
        summaryType = "PROGRESS INVOICE"
    End If
    
    summaryMsg = summaryType & " COMPLETE" & vbCrLf & vbCrLf & _
                 "Invoice: " & XeroRef & vbCrLf & _
                 "Rego: " & rego & vbCrLf & _
                 "Customer: " & recipientName & vbCrLf & _
                 "Total: $" & Format(STOTAL, "0.00") & vbCrLf & _
                 "Paid: $" & Format(APAID, "0.00") & vbCrLf & _
                 "Outstanding: " & formattedAOS & vbCrLf & vbCrLf
    
    If AOS > 0 Then
        summaryMsg = summaryMsg & "Done:" & vbCrLf & _
                                  "- Invoice emailed" & vbCrLf & _
                                  "- Payment SMS sent" & vbCrLf & _
                                  "- Payment email sent"
    Else
        summaryMsg = summaryMsg & "Done:" & vbCrLf & _
                                  "- Invoice emailed" & vbCrLf & _
                                  "(No payment request - balance is " & formattedAOS & ")"
    End If
    
    MsgBox summaryMsg, vbInformation, "Invoice Sent"

End Sub

' NzD is now NullToDouble in PublicUtilities module
Private Function NzD(v As Variant) As Double
    NzD = NullToDouble(v)
End Function

Private Sub NotifySupplierVehicleRelease(rego As String, customerName As String)
    ' Notifies supplier(s) that payment received and they can release the vehicle
    ' Called when FINAL invoice is sent (job closed, customer paid)
    On Error GoTo ErrHandler
    LogToRR9998 "NotifySupplierVehicleRelease started for rego " & rego
    
    ' Get supplier(s) from Job Build Notes
    Dim wsBuildNotes As Worksheet
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim supplierName As String, supplierEmail As String, supplierMobile As String
    Dim suppliersNotified As Long: suppliersNotified = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(rego) Then
            ' Check if this is a Supplier row (Column G contains "Supplier")
            If InStr(1, wsBuildNotes.Cells(jbnRow, "G").value, "Supplier", vbTextCompare) > 0 Then
                supplierName = Trim(wsBuildNotes.Cells(jbnRow, "H").value)
                supplierEmail = Trim(wsBuildNotes.Cells(jbnRow, "X").value)
                supplierMobile = Trim(wsBuildNotes.Cells(jbnRow, "Y").value)
                
                ' Clean up mobile number
                supplierMobile = Replace(supplierMobile, " ", "")
                supplierMobile = Replace(supplierMobile, "-", "")
                If Left(supplierMobile, 1) = "0" Then supplierMobile = Mid(supplierMobile, 2)
                If Left(supplierMobile, 3) <> "+64" And Left(supplierMobile, 2) <> "64" Then
                    supplierMobile = "64" & supplierMobile
                End If
                supplierMobile = Replace(supplierMobile, "+", "")
                
                If supplierName <> "" And (supplierEmail <> "" Or supplierMobile <> "") Then
                    Call SendSupplierReleaseNotification(rego, customerName, supplierName, supplierEmail, supplierMobile)
                    suppliersNotified = suppliersNotified + 1
                End If
            End If
        End If
    Next jbnRow
    
    If suppliersNotified > 0 Then
        LogToRR9998 "NotifySupplierVehicleRelease: Notified " & suppliersNotified & " supplier(s) for rego " & rego
    Else
        LogToRR9998 "NotifySupplierVehicleRelease: No suppliers found for rego " & rego
    End If
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifySupplierVehicleRelease: " & Err.description
End Sub

Private Sub SendSupplierReleaseNotification(rego As String, customerName As String, supplierName As String, supplierEmail As String, supplierMobile As String)
    ' Sends notification to supplier that payment received - CAN release vehicle
    On Error GoTo ErrHandler
    
    Dim emailSubject As String
    emailSubject = "Job " & rego & " - PAYMENT RECEIVED - Vehicle Can Be Released"
    
    ' SMS text
    Dim smsText As String
    smsText = "Hi " & supplierName & ", payment received for job " & rego & "." & vbCrLf & vbCrLf & _
              "YOU CAN NOW RELEASE THE VEHICLE to the customer." & vbCrLf & vbCrLf & _
              "Thank you for your service!" & vbCrLf & _
              "EEK Mechanical"
    
    ' Email text
    Dim emailText As String
    emailText = "Hi " & supplierName & "," & vbCrLf & vbCrLf & _
                "Great news! Payment has been received for job " & rego & "." & vbCrLf & vbCrLf & _
                String(50, "=") & vbCrLf & _
                "VEHICLE CAN NOW BE RELEASED" & vbCrLf & _
                String(50, "=") & vbCrLf & vbCrLf & _
                "The customer has paid in full. You can now release the vehicle." & vbCrLf & vbCrLf & _
                "Thank you for your service on this job!" & vbCrLf & vbCrLf & _
                "If you have any questions, please call us on " & SUPPLIER_CONTACT_PHONE & "." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | " & SUPPLIER_CONTACT_PHONE
    
    ' Send SMS if mobile available
    If supplierMobile <> "" Then
        Dim mobileEmail As String
        mobileEmail = "+" & supplierMobile & "@sms.tnz.co.nz"
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    End If
    
    ' Send email if available
    If supplierEmail <> "" Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", supplierEmail, emailSubject, emailText)
    End If
    
    LogToRR9998 "SendSupplierReleaseNotification sent to " & supplierName & " for rego " & rego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendSupplierReleaseNotification: " & Err.description
End Sub

Sub SendPaymentRequest(rego As String, customerName As String, customerEmail As String, _
                       countryCode As String, mobileNumber As String, amountDue As Double, _
                       invoiceRef As String, isInterim As Boolean, Optional isFinalPayment As Boolean = False)
    
    On Error GoTo ErrHandler
    
    ' Skip if missing contact details
    If countryCode = "" Or mobileNumber = "" Then Exit Sub
    If customerEmail = "" Then Exit Sub
    
    Dim stripeLink As String, token As String, finalLink As String
    Dim redirectUrl As String, description As String
    Dim mobileEmail As String, emailSubject As String
    Dim smsText As String, emailText As String
    Dim paymentTypeLabel As String
    
    ' Set labels based on invoice type
    If Not isInterim Then
        paymentTypeLabel = "Final"
    ElseIf isFinalPayment Then
        paymentTypeLabel = "Final Payment"
    Else
        paymentTypeLabel = "Progress"
    End If
    
    ' Set redirect
    redirectUrl = "www.eek.nz/thanks"
    description = rego & ": " & paymentTypeLabel & " Invoice " & invoiceRef
    
    ' Generate Stripe link
    Call CreateStripeLink(rego, amountDue, description, stripeLink, redirectUrl)
    If stripeLink = "" Then Exit Sub
    
    If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
    finalLink = "https://www.eek.nz?token=" & token
    
    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    emailSubject = paymentTypeLabel & " Payment Request - Invoice " & invoiceRef
    
    ' SMS text
    If isFinalPayment Then
        smsText = "Hi " & customerName & ", your final payment invoice " & invoiceRef & " is ready." & vbCrLf & _
                  "Amount Due: $" & Format(amountDue, "0.00") & vbCrLf & _
                  "Please pay now to complete your account: " & finalLink & vbCrLf & _
                  "EEK Mechanical"
    ElseIf isInterim Then
        smsText = "Hi " & customerName & ", progress invoice " & invoiceRef & " is ready." & vbCrLf & _
                  "Amount Due: $" & Format(amountDue, "0.00") & vbCrLf & _
                  "Pay now: " & finalLink & vbCrLf & _
                  "EEK Mechanical"
    Else
        smsText = "Hi " & customerName & ", invoice " & invoiceRef & " is ready." & vbCrLf & _
                  "Amount Due: $" & Format(amountDue, "0.00") & vbCrLf & _
                  "Pay now: " & finalLink & vbCrLf & _
                  "EEK Mechanical"
    End If
    
    ' Email text
    If isFinalPayment Then
        emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                    "Your final payment invoice " & invoiceRef & " for $" & Format(amountDue, "0.00") & " is ready." & vbCrLf & vbCrLf & _
                    "This is the final amount required to complete your account with EEK Mechanical." & vbCrLf & vbCrLf & _
                    "Pay securely online: " & finalLink & vbCrLf & vbCrLf & _
                    "Or pay by bank transfer:" & vbCrLf & _
                    "Bank: ANZ Chartwell" & vbCrLf & _
                    "Account: 06-0313-0860749-00" & vbCrLf & _
                    "Reference: " & rego & vbCrLf & vbCrLf & _
                    "� EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"
    ElseIf isInterim Then
        emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                    "Your progress invoice " & invoiceRef & " for $" & Format(amountDue, "0.00") & " is ready for payment." & vbCrLf & vbCrLf & _
                    "This is a progress payment for work completed to date. Further invoices may follow." & vbCrLf & vbCrLf & _
                    "Pay securely online: " & finalLink & vbCrLf & vbCrLf & _
                    "Or pay by bank transfer:" & vbCrLf & _
                    "Bank: ANZ Chartwell" & vbCrLf & _
                    "Account: 06-0313-0860749-00" & vbCrLf & _
                    "Reference: " & rego & vbCrLf & vbCrLf & _
                    "� EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"
    Else
        emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                    "Your invoice " & invoiceRef & " for $" & Format(amountDue, "0.00") & " is ready for payment." & vbCrLf & vbCrLf & _
                    "Pay securely online: " & finalLink & vbCrLf & vbCrLf & _
                    "Or pay by bank transfer:" & vbCrLf & _
                    "Bank: ANZ Chartwell" & vbCrLf & _
                    "Account: 06-0313-0860749-00" & vbCrLf & _
                    "Reference: " & rego & vbCrLf & vbCrLf & _
                    "� EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"
    End If
    
    ' Send SMS
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    
    ' Send Email
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    
    Exit Sub
    
ErrHandler:
    ' Silent fail - invoice already sent, payment request is secondary
End Sub

' ============================================================================
' RELEASE PAYMENT PROCESSOR
' Called manually or can be hooked to a timer to auto-process new payments
' Scans Job Build Notes for release payments that need notifications sent
' ============================================================================

Public Sub ProcessNewReleasePayments(Optional showMessage As Boolean = False)
    ' Processes release payment rows added by Power Automate
    ' Sends customer "vehicle ready" + supplier "can release" notifications
    ' Uses "Text Flag" column (AD) to track which rows have been notified
    ' Set showMessage=True when calling manually from menu
    On Error GoTo ErrHandler
    LogToRR9998 "ProcessNewReleasePayments started (showMessage=" & showMessage & ")"
    
    Call LaunchOutlook
    
    Dim wsBuildNotes As Worksheet
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim rego As String, customerName As String, customerEmail As String, customerPhone As String
    Dim jobNotes As String, closeFlag As String, textFlag As String, recordType As String
    Dim processedCount As Long: processedCount = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    LogToRR9998 "ProcessNewReleasePayments: Scanning " & jbnLastRow & " rows"
    
    For jbnRow = 2 To jbnLastRow
        rego = Trim(wsBuildNotes.Cells(jbnRow, "F").value)
        recordType = Trim(wsBuildNotes.Cells(jbnRow, "G").value)
        jobNotes = Trim(wsBuildNotes.Cells(jbnRow, "J").value)
        closeFlag = Trim(wsBuildNotes.Cells(jbnRow, "N").value)
        textFlag = Trim(wsBuildNotes.Cells(jbnRow, "AD").value)
        
        ' Check if this is a release payment row that needs processing
        ' Criteria: Type=Deposit, Job Notes contains "Release Payment", Close=Yes, Text Flag not "Notified"
        ' Use case-insensitive comparisons for robustness
        If UCase(recordType) = "DEPOSIT" And _
           InStr(1, jobNotes, "Release Payment", vbTextCompare) > 0 And _
           UCase(closeFlag) = "YES" And _
           textFlag <> "Notified" Then
            
            LogToRR9998 "ProcessNewReleasePayments: Found unprocessed release payment at row " & jbnRow & " for rego " & rego
            
            ' Try to get customer details from the Power Automate row first
            customerName = Trim(wsBuildNotes.Cells(jbnRow, "E").value)   ' Name column
            If customerName = "" Then customerName = Trim(wsBuildNotes.Cells(jbnRow, "AK").value)  ' Client column fallback
            customerEmail = Trim(wsBuildNotes.Cells(jbnRow, "D").value)  ' Email column
            customerPhone = ""  ' Power Automate doesn't write phone, must get from Book a Job
            
            ' Always fall back to Book a Job for reliable data
            If customerName = "" Then
                customerName = GetCustomerNameFromBooking(rego)
                LogToRR9998 "ProcessNewReleasePayments: Got name from Book a Job: " & customerName
            End If
            If customerEmail = "" Then
                customerEmail = GetCustomerEmailFromBooking(rego)
                LogToRR9998 "ProcessNewReleasePayments: Got email from Book a Job: " & customerEmail
            End If
            ' Always get phone from Book a Job since Power Automate doesn't provide it
            customerPhone = GetCustomerPhoneFromBooking(rego)
            LogToRR9998 "ProcessNewReleasePayments: Got phone from Book a Job: " & customerPhone
            
            If rego <> "" Then
                LogToRR9998 "ProcessNewReleasePayments: Processing rego " & rego & " - Name: " & customerName & ", Email: " & customerEmail & ", Phone: " & customerPhone
                
                ' Send customer "vehicle ready" notification
                Call NotifyCustomerVehicleReady(rego, customerName, customerEmail, customerPhone)
                
                ' Send supplier "can release" notification
                Call NotifySupplierVehicleRelease(rego, customerName)
                
                ' Mark as notified so we don't process again
                wsBuildNotes.Cells(jbnRow, "AD").value = "Notified"
                
                ' Also update the "Book a Job" row to show job is closed (light blue)
                Call MarkBookingRowClosed(rego)
                
                processedCount = processedCount + 1
            End If
        End If
    Next jbnRow
    
    If processedCount > 0 Then
        LogToRR9998 "ProcessNewReleasePayments: Processed " & processedCount & " release payment(s)"
        If showMessage Then
            MsgBox "Processed " & processedCount & " release payment(s)." & vbCrLf & _
                   "Customer and supplier notifications sent.", vbInformation, "Release Payments Processed"
        End If
    Else
        LogToRR9998 "ProcessNewReleasePayments: No new release payments to process"
        If showMessage Then
            MsgBox "No unprocessed release payments found.", vbInformation, "Release Payments"
        End If
    End If
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in ProcessNewReleasePayments: " & Err.description
    If showMessage Then
        MsgBox "Error processing release payments: " & Err.description, vbCritical
    End If
End Sub

Private Sub NotifyCustomerVehicleReady(rego As String, customerName As String, customerEmail As String, customerPhone As String)
    ' Sends customer notification that their vehicle is ready for collection
    On Error GoTo ErrHandler
    LogToRR9998 "NotifyCustomerVehicleReady started for rego " & rego
    
    If customerName = "" Then customerName = "there"
    
    Dim emailSubject As String
    emailSubject = "Your Vehicle is Ready for Collection - " & rego
    
    ' SMS text
    Dim smsText As String
    smsText = "Hi " & customerName & ", great news!" & vbCrLf & vbCrLf & _
              "Payment received for job " & rego & "." & vbCrLf & _
              "Your vehicle is NOW READY for collection from the workshop." & vbCrLf & vbCrLf & _
              "Thank you for choosing EEK Mechanical!" & vbCrLf & _
              "0800 769 000"
    
    ' Email text
    Dim emailText As String
    emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                "Great news! We have received your payment for job " & rego & "." & vbCrLf & vbCrLf & _
                String(50, "=") & vbCrLf & _
                "YOUR VEHICLE IS READY FOR COLLECTION" & vbCrLf & _
                String(50, "=") & vbCrLf & vbCrLf & _
                "We have processed your payment and notified the workshop." & vbCrLf & _
                "You can now collect your vehicle at your earliest convenience." & vbCrLf & vbCrLf & _
                "Please remember to bring:" & vbCrLf & _
                "- Photo ID" & vbCrLf & _
                "- This email or your payment confirmation" & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical!" & vbCrLf & vbCrLf & _
                "If you have any questions, please call us on 0800 769 000." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    ' Send SMS if phone available
    If customerPhone <> "" Then
        ' Clean up phone number
        customerPhone = Replace(customerPhone, " ", "")
        customerPhone = Replace(customerPhone, "-", "")
        If Left(customerPhone, 1) = "0" Then customerPhone = Mid(customerPhone, 2)
        If Left(customerPhone, 2) <> "64" Then customerPhone = "64" & customerPhone
        
        Dim mobileEmail As String
        mobileEmail = "+" & customerPhone & "@sms.tnz.co.nz"
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    End If
    
    ' Send email if available
    If customerEmail <> "" Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    End If
    
    ' Send staff copy
    Dim staffBody As String
    staffBody = "VEHICLE READY NOTIFICATION SENT" & vbCrLf & _
                String(40, "-") & vbCrLf & _
                "Rego: " & rego & vbCrLf & _
                "Customer: " & customerName & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Phone: " & customerPhone & vbCrLf & vbCrLf & _
                "Customer has been notified their vehicle is ready for collection."
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff] Vehicle Ready - " & rego, staffBody)
    
    LogToRR9998 "NotifyCustomerVehicleReady sent for rego " & rego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifyCustomerVehicleReady: " & Err.description
End Sub

Private Function GetCustomerNameFromBooking(rego As String) As String
    ' Gets customer name from Book a Job sheet
    On Error Resume Next
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(rego)) Then
            GetCustomerNameFromBooking = Trim(ws.Cells(i, "E").value)
            Exit Function
        End If
    Next i
    GetCustomerNameFromBooking = ""
End Function

Private Function GetCustomerEmailFromBooking(rego As String) As String
    ' Gets customer email from Book a Job sheet
    ' Email is in column D or AF depending on entry
    On Error Resume Next
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long
    Dim Email As String
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(rego)) Then
            ' Try column D first (standard email column)
            Email = Trim(ws.Cells(i, "D").value)
            ' If empty, try column AF (alternate email column)
            If Email = "" Then Email = Trim(ws.Cells(i, "AF").value)
            GetCustomerEmailFromBooking = Email
            Exit Function
        End If
    Next i
    GetCustomerEmailFromBooking = ""
End Function

' Menu callable - processes pending release payments with user feedback
Public Sub ProcessReleasePaymentsManual()
    Call ProcessNewReleasePayments(True)
End Sub

Private Function GetCustomerPhoneFromBooking(rego As String) As String
    ' Gets customer phone from Book a Job sheet (country code + number)
    On Error Resume Next
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long
    Dim countryCode As String, phoneNumber As String
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(rego)) Then
            countryCode = Replace(Trim(ws.Cells(i, "G").value), "+", "")
            phoneNumber = Trim(ws.Cells(i, "H").value)
            GetCustomerPhoneFromBooking = countryCode & phoneNumber
            Exit Function
        End If
    Next i
    GetCustomerPhoneFromBooking = ""
End Function

Private Sub MarkBookingRowClosed(rego As String)
    ' Marks the Book a Job row as closed (light blue background)
    On Error Resume Next
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(rego)) Then
            ws.rows(i).Interior.Color = RGB(173, 216, 230)  ' Light blue
            LogToRR9998 "MarkBookingRowClosed: Marked row " & i & " as closed for rego " & rego
            Exit Sub
        End If
    Next i
End Sub













