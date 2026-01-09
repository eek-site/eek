Attribute VB_Name = "emailinvoice"
' Attribute VB_Name = "emailinvoice"
' Attribute VB_Name = "emailinvoice"
' START OF CreatePDF Subroutine
Sub CreatePDF(ws As Worksheet, rowNumber As Long)
    Dim wsJobNotes As Worksheet
    Dim rg As Range, cell As Range
    Dim doc As Object
    Dim outputPathForEmail As String, finalOneDrivePath As String, localFolder As String
    Dim lastRow As Long, COLUMN_E As String, COLUMN_B As String, XeroRef As String, rego As String
    Dim COLUMN_AJ As String, STOTAL As Double
    Dim JOBNOTE(1 To 7) As String, q(1 To 7) As Long, u(1 To 7) As Double, a(1 To 7) As Double
    Dim APAID As Double, AOS As Double
    Dim pstatus As String, formattedAOS As String
    Dim i As Long, jobRow As Long, currentLine As Integer, currentRow As Long
    Dim reverseDate As String, fileName As String
    Dim WordApp As Object, templatePath As String, recipientName As String
    Dim recipientEmail As String, emailBody As String
    Dim refundAmountTotal As Double, refundText As String, isRefund As Boolean

    refundAmountTotal = 0: refundText = "": isRefund = False

    Call LaunchOutlook

    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")

    templatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 COMPANY DOCUMENTS\20210401 EEK Mechanical END USER TERMS OF SERVICE.dotx")
    If Dir(templatePath) = "" Then
        MsgBox "The Word template could not be found. Please check the file path.", vbCritical
        Exit Sub
    End If

    On Error Resume Next
    Set WordApp = GetObject(, "Word.Application")
    If WordApp Is Nothing Then Set WordApp = CreateObject("Word.Application")
    On Error GoTo 0
    If WordApp Is Nothing Then
        MsgBox "Unable to initialize Word application. Please ensure Microsoft Word is installed.", vbCritical
        Exit Sub
    End If

    localFolder = "C:\Temp\"
    If Dir(localFolder, vbDirectory) = "" Then
        MsgBox "Local folder " & localFolder & " does not exist. Please create it or change the path.", vbCritical
        Exit Sub
    End If

    lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    
    ' If a specific row is supplied, process ONLY that row (legacy callers may loop rows).
    ' If rowNumber = 0, process all green rows (original behaviour).
    If rowNumber > 0 Then
        Set rg = ws.Range("A" & rowNumber & ":A" & rowNumber)
    Else
        Set rg = ws.Range("A1:A" & lastRow).SpecialCells(xlCellTypeConstants)
    End If

    For Each cell In rg
        If cell.Interior.Color = RGB(144, 238, 144) Then
            currentRow = cell.Row
            ws.rows(currentRow).Interior.Color = RGB(173, 216, 230)

            ' Column F = Invoice Name (for invoice document)
            ' Column E = Customer Name (for communications)
            COLUMN_E = ws.Cells(currentRow, "F").value  ' Invoice Name (Column F)
            If Trim(COLUMN_E) = "" Then COLUMN_E = ws.Cells(currentRow, "E").value  ' Fallback to customer name if invoice name is empty
            COLUMN_B = Format(ws.Cells(currentRow, "AG").value, "d mmm yyyy")
            rego = ws.Cells(currentRow, "AI").value

            Dim lastInvoice As Variant: lastInvoice = 0
            For i = currentRow - 1 To 1 Step -1
                If Not IsEmpty(ws.Cells(i, "AU").value) Then
                    lastInvoice = ws.Cells(i, "AU").value
                    Exit For
                End If
            Next i

            XeroRef = lastInvoice + 1
            ws.Cells(currentRow, "AU").value = XeroRef

            COLUMN_AJ = ws.Cells(currentRow, "AJ").value
            STOTAL = 0: APAID = 0: AOS = 0: currentLine = 1

            ' Gather Job Notes (up to 7 lines)
            For jobRow = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "A").End(xlUp).Row
                If wsJobNotes.Cells(jobRow, "F").value = ws.Cells(currentRow, "V").value Then
                    Select Case wsJobNotes.Cells(jobRow, "G").value
                        Case "Billable"
                            If currentLine <= 7 Then
                                JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                                q(currentLine) = 1
                                u(currentLine) = NzD(wsJobNotes.Cells(jobRow, "K").value)     ' +K
                                a(currentLine) = u(currentLine)
                                STOTAL = STOTAL + u(currentLine)                              ' add billable
                                If wsJobNotes.Cells(jobRow, "M").value <> "No" Then APAID = APAID + u(currentLine) ' paid billables
                                currentLine = currentLine + 1
                            End If

                        Case "Reimbursement"
                            If currentLine <= 7 Then
                                JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                                q(currentLine) = 1
                                u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)    ' credit lowers subtotal
                                a(currentLine) = u(currentLine)
                                STOTAL = STOTAL + u(currentLine)
                                currentLine = currentLine + 1
                            End If

                        Case "Refund"
                            If currentLine <= 7 Then
                                JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                                q(currentLine) = 1
                                u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)    ' refund lowers subtotal
                                a(currentLine) = u(currentLine)
                                STOTAL = STOTAL + u(currentLine)
                                refundAmountTotal = refundAmountTotal + Abs(NzD(wsJobNotes.Cells(jobRow, "I").value))
                                If refundText = "" Then refundText = wsJobNotes.Cells(jobRow, "M").value
                                isRefund = True
                                currentLine = currentLine + 1
                            End If

                        Case "Deposit"
                            ' FIXED: Show the deposit line with its amount visible
                            ' Deposits are shown as negative (credits) but don't affect STOTAL
                            ' They only affect APAID (amount paid)
                            If currentLine <= 7 Then
                                JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                                q(currentLine) = 1
                                ' Show the deposit amount as a negative value (credit) for display
                                u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                                a(currentLine) = u(currentLine)
                                ' Add the deposit to APAID (as a positive amount paid)
                                APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                                currentLine = currentLine + 1
                            Else
                                ' Still count towards APAID even if not shown as a line
                                APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                            End If
                    End Select
                End If
            Next jobRow

            AOS = STOTAL - APAID
            If AOS > 0 Then
                formattedAOS = "$" & Format(AOS, "0.00")
                pstatus = "Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
                          "Settlement is required promptly in accordance with the stated terms of trade to avoid additional fees." & vbNewLine & _
                          "Payment details are as follows:" & vbNewLine & _
                          "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
            ElseIf AOS < 0 Then
                formattedAOS = "-$" & Format(Abs(AOS), "0.00")
                If isRefund Then
                    pstatus = "Refunded: $" & Format(refundAmountTotal, "0.00") & " via " & refundText & "." & vbNewLine & _
                              "This refund has cleared your account balance in full."
                Else
                    pstatus = "Goodwill Credit Available: " & formattedAOS & vbNewLine & _
                              "This credit is valid for use in New Zealand, Australia, Canada, USA, UK, and South Africa, subject to the stated terms and conditions."
                End If
            Else
                formattedAOS = "PAID"
                pstatus = "PAID" & vbNewLine & vbNewLine & _
                          "EEK Mechanical acknowledges receipt of full payment. Feedback is requested to evaluate service standards." & vbNewLine & _
                          "Submit a review at the following link:" & vbNewLine & _
                          "https://www.eek.nz/review-form"
                If isRefund Then
                    pstatus = "Refunded: $" & Format(refundAmountTotal, "0.00") & _
                              " via " & refundText & "." & vbNewLine & vbNewLine & pstatus
                End If
            End If

            ' === Build replacements; blank unused lines ===
            Set doc = WordApp.Documents.Add(templatePath)
            Dim replacements As Object: Set replacements = CreateObject("Scripting.Dictionary")
            replacements.Add "[COLUMN F]", COLUMN_E
            replacements.Add "[COLUMN B]", COLUMN_B
            replacements.Add "[XERO REF]", XeroRef
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
                ' Fixed: Don't blank out deposit amounts (they're negative but should show)
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

            reverseDate = Format(ws.Cells(currentRow, "AG").value, "yyyymmdd")
            fileName = reverseDate & "_" & rego & "_" & Replace(COLUMN_E, " ", "_") & "_" & Format(Now, "yyyymmddhhmmss") & ".pdf"
            outputPathForEmail = localFolder & fileName
            finalOneDrivePath = Environ("USERPROFILE") & _
                "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\" & rego & ".pdf"

            doc.ExportAsFixedFormat OutputFileName:=outputPathForEmail, ExportFormat:=17
            doc.Close False

            recipientEmail = ws.Cells(currentRow, "AF").value
            recipientName = Trim(ws.Cells(currentRow, "E").value)  ' Column E = Customer Name for communications

            emailBody = "Dear " & recipientName & "," & vbNewLine & vbNewLine & _
                        "Invoice " & XeroRef & " for NZD " & Format(STOTAL, "0.00") & " has been issued." & vbNewLine & vbNewLine
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

            If SendViaOutbox("no-reply@eek.nz", recipientEmail, _
                "Invoice " & XeroRef & " " & fileName & " from EEK Mechanical", emailBody, outputPathForEmail) Then
                Application.Wait (Now + timeValue("0:00:02"))
                On Error Resume Next: If Dir(finalOneDrivePath) <> "" Then Kill finalOneDrivePath: On Error GoTo 0
                FileCopy outputPathForEmail, finalOneDrivePath
            Else
                MsgBox "There was an issue sending the invoice email.", vbExclamation
            End If

            ' Update Book a Job!W (Price) with the net subtotal (charges minus credits/refunds)
            Dim wsBook As Worksheet: Set wsBook = ThisWorkbook.Sheets("Book a Job")
            Dim iRow As Long
            For iRow = 2 To wsBook.Cells(wsBook.rows.count, "N").End(xlUp).Row
                If Trim(wsBook.Cells(iRow, "N").value) = Trim(rego) Then
                    wsBook.Cells(iRow, "W").value = STOTAL
                    Exit For
                End If
            Next iRow
        End If
    Next cell

    WordApp.Quit False
End Sub

' NzD is now NullToDouble in PublicUtilities module
Private Function NzD(v As Variant) As Double
    NzD = NullToDouble(v)
End Function













