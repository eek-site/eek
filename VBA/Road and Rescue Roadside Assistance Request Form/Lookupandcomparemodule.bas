Attribute VB_Name = "Lookupandcomparemodule"
' Attribute VB_Name = "Lookupandcomparemodule"
' Attribute VB_Name = "Lookupandcomparemodule"
Option Explicit

Sub LookupAndCompare()
    On Error GoTo ErrHandler
    LogToRR9998 "LookupAndCompare started."

    Dim wsActive As Worksheet
    Dim lastRowActive As Long
    Dim i As Long
    Dim lookupValue As Variant

    Set wsActive = ThisWorkbook.Sheets("Book a Job")
    lastRowActive = wsActive.Cells(wsActive.rows.count, "N").End(xlUp).Row

    For i = 1 To lastRowActive
        If Trim(wsActive.Cells(i, "N").value) = "" Then
            wsActive.Cells(i, "N").value = "RARP" & wsActive.Cells(i, "A").value
        End If

        If LCase(Trim(wsActive.Cells(i, "AS").value)) <> "entered" Then
            lookupValue = LCase(Replace(wsActive.Cells(i, "N").value, " ", ""))

            ' Placeholder for potential future external lookup:
            ' Set matchRow = wsJobSheet.Range("H:H").Find(What:=lookupValue, LookIn:=xlValues, LookAt:=xlWhole)

            ' If matchRow is found:
            ' wsActive.Cells(i, "Y").Value = matchRow.Offset(0, -2).Value
            ' wsActive.Cells(i, "Z").Value = matchRow.Offset(0, 14).Value
            ' matchRow.Offset(0, 16).Value = "Yes"

            ' No yellow coloring here � leave it to ProcessJobBuildNotes

            wsActive.Cells(i, "AS").value = "Entered"
        End If
    Next i

    LogToRR9998 "LookupAndCompare completed."
    Call BAJRegoUpdater
    Call ProcessJobBuildNotes
    Call AutomateInvoicing_BatchGreenRows(False)  ' Silent batch invoicing for green rows
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in LookupAndCompare: " & Err.description
End Sub

Sub HandleStripeAndJobUpdates()
    On Error GoTo ErrHandler
    LogToRR9998 "HandleStripeAndJobUpdates started."

    ' Check required sheets
    If Not SheetExists("Job Build Notes") Then
        LogToRR9998 "ERROR: Sheet 'Job Build Notes' not found!"
        Exit Sub
    End If

    If Not SheetExists("Book a Job") Then
        LogToRR9998 "ERROR: Sheet 'Book a Job' not found!"
        Exit Sub
    End If

    Dim availableCount As Long
    Dim hasAvailableRows As Boolean

    LogToRR9998 "Calling CheckAvailableRowsFast"
    hasAvailableRows = CheckAvailableRowsFast(availableCount)
    LogToRR9998 "Returned from CheckAvailableRowsFast"

    If hasAvailableRows Then
        LogToRR9998 "Available billable rows found - processing Stripe payments."

        Dim processedCount As Long
        Dim maxAttempts As Long
        processedCount = 0
        maxAttempts = 10

        Do While hasAvailableRows And processedCount < maxAttempts
            processedCount = processedCount + 1
            LogToRR9998 "Processing Stripe payment #" & processedCount

            Call ProcessStripePayments

            hasAvailableRows = CheckAvailableRowsFast(availableCount)

            If hasAvailableRows Then
                LogToRR9998 "More billable rows available - continuing"
            Else
                LogToRR9998 "No more billable rows available - stopping"
            End If
        Loop

        If processedCount >= maxAttempts Then
            LogToRR9998 "Reached Stripe processing limit (" & maxAttempts & ") - stopping for safety"
        End If
    Else
        LogToRR9998 "No available billable rows found - skipping Stripe processing"
    End If

    LogToRR9998 "Calling UpdateBookAJobTotals..."
    Call UpdateBookAJobTotals

    LogToRR9998 "Calling MarkNonBillableRows..."
    Call MarkNonBillableRows

    LogToRR9998 "HandleStripeAndJobUpdates completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in HandleStripeAndJobUpdates: " & Err.description
End Sub

Function CheckAvailableRowsFast(ByRef availableCount As Long) As Boolean
    On Error GoTo ErrHandler
    LogToRR9998 "CheckAvailableRowsFast started"
    
    ' Ensure newest JBN rego is synced to finalized BAJ rego
    JBNRegoUpdater

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")

    Dim lastRow As Long: lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    Dim i As Long
    Dim colF As Variant, colG As Variant, colK As Variant, colAN As Variant

    availableCount = 0
    CheckAvailableRowsFast = False

    If lastRow > 1 Then
        colF = ws.Range("F2:F" & lastRow).value
        colG = ws.Range("G2:G" & lastRow).value
        colK = ws.Range("K2:K" & lastRow).value
        colAN = ws.Range("AN2:AN" & lastRow).value

        For i = 1 To UBound(colF, 1)
            If LCase(Trim(CStr(colG(i, 1)))) = "billable" And IsEmpty(colK(i, 1)) And IsEmpty(colAN(i, 1)) Then
                availableCount = availableCount + 1
                If availableCount = 1 Then CheckAvailableRowsFast = True
                If availableCount <= 10 Then
                    LogToRR9998 "Available row found: " & (i + 1) & " (Rego: " & colF(i, 1) & ")"
                End If
            End If
        Next i
    End If

    LogToRR9998 "Scan complete - Found " & availableCount & " available billable rows"
    Exit Function

ErrHandler:
    LogToRR9998 "Error in CheckAvailableRowsFast: " & Err.description
    CheckAvailableRowsFast = False
End Function

Sub ProcessStripePayments()
    On Error GoTo ErrHandler
    LogToRR9998 "ProcessStripePayments started."

    ' ==== OUTLOOK PROCESSING ====
    Dim olApp As Object
    Dim olNamespace As Object
    Dim olFolder As Object
    Dim olItems As Object
    Dim olMail As Object
    Dim olArchiveFolder As Object
    Dim i As Long
    Dim paymentAmount As Double
    Dim paymentID As String
    Dim oldestDate As Date
    Dim oldestMail As Object
    Dim mailDate As Date
    Dim emailCount As Long
    Dim stripeEmailCount As Long

    emailCount = 0
    stripeEmailCount = 0

    LogToRR9998 "Step 1: Initializing Outlook..."
    Set olApp = CreateObject("Outlook.Application")
    Set olNamespace = olApp.GetNamespace("MAPI")
    LogToRR9998 "Outlook initialized successfully"

    LogToRR9998 "Step 2: Accessing email folder..."
    On Error GoTo FolderError
    Set olFolder = olNamespace.Folders("no-reply@eek.nz").Folders("Inbox")
    LogToRR9998 "Folder found: " & olFolder.name
    On Error GoTo ErrHandler

    LogToRR9998 "Step 3: Getting and sorting emails..."
    Set olItems = olFolder.items
    olItems.Sort "[ReceivedTime]", True ' Sort oldest first
    LogToRR9998 "Total items in folder: " & olItems.count

    LogToRR9998 "Step 4: Setting up archive folder..."
    On Error GoTo ArchiveFolderError
    Set olArchiveFolder = GetOrCreateArchiveFolder(olNamespace)
    If Not olArchiveFolder Is Nothing Then
        LogToRR9998 "Archive folder ready: " & olArchiveFolder.name
    Else
        LogToRR9998 "No archive folder available - will skip archiving"
    End If
    On Error GoTo ErrHandler

    ' Initialize search for oldest email
    oldestDate = DateSerial(9999, 12, 31)
    Set oldestMail = Nothing

    LogToRR9998 "Step 5: Scanning " & olItems.count & " emails for Stripe payments..."

    ' Scan all emails to find oldest Stripe payment
    For i = 1 To olItems.count
        Set olMail = olItems(i)
        emailCount = emailCount + 1

        If olMail.Class = 43 Then ' Mail item
            Dim hasPaymentOf As Boolean
            Dim hasEekMech As Boolean
            hasPaymentOf = InStr(LCase(olMail.Subject), "payment of nz$") > 0
            hasEekMech = InStr(LCase(olMail.Subject), "for eek mechanical") > 0

            If hasPaymentOf And hasEekMech Then
                stripeEmailCount = stripeEmailCount + 1
                mailDate = olMail.ReceivedTime

                If mailDate < oldestDate Then
                    oldestDate = mailDate
                    Set oldestMail = olMail
                End If
            End If
        End If
    Next i

    LogToRR9998 "Scan complete - Total emails: " & emailCount & ", Stripe payments found: " & stripeEmailCount

    ' Process the oldest email if found
    If Not oldestMail Is Nothing Then
        LogToRR9998 "Step 6: Processing oldest Stripe email: " & oldestMail.Subject

        If ExtractStripePaymentData(oldestMail, paymentAmount, paymentID) Then
            LogToRR9998 "Payment data extracted - Amount: NZ$" & paymentAmount & ", ID: " & paymentID

            Call UpdateWorkbookWithPayment(paymentAmount, paymentID)

            If Not olArchiveFolder Is Nothing Then
                Call ArchiveEmail(oldestMail, olArchiveFolder)
            Else
                LogToRR9998 "Skipping email archiving - no archive folder available"
            End If

            LogToRR9998 "Processed payment: " & paymentID & " for amount: NZ$" & paymentAmount
        Else
            LogToRR9998 "FAILED to extract payment data from email"
        End If
    Else
        LogToRR9998 "Step 6: NO STRIPE EMAILS FOUND TO PROCESS"
    End If

    ' Clean up
    Set olApp = Nothing
    Set olNamespace = Nothing
    Set olFolder = Nothing
    Set olItems = Nothing
    Set olMail = Nothing
    Set olArchiveFolder = Nothing
    Set oldestMail = Nothing

    LogToRR9998 "ProcessStripePayments completed."
    Exit Sub

' ==== ERROR HANDLERS ====

FolderError:
    LogToRR9998 "ERROR: Could not find folder 'no-reply@eek.nz\Inbox'"
    Exit Sub

ArchiveFolderError:
    LogToRR9998 "ERROR setting up archive folder: " & Err.description & " - Will skip archiving and continue"
    Set olArchiveFolder = Nothing
    Resume Next

ErrHandler:
    LogToRR9998 "Error in ProcessStripePayments: " & Err.description
End Sub
Function ExtractStripePaymentData(olMail As Object, ByRef paymentAmount As Double, _
                                ByRef paymentID As String) As Boolean
    On Error GoTo ErrHandler

    LogToRR9998 "Extracting payment data from email: " & olMail.Subject

    Dim emailBody As String
    Dim amountPattern As String
    Dim idPattern As String
    Dim regex As Object
    Dim matches As Object

    emailBody = olMail.body

    Set regex = CreateObject("VBScript.RegExp")
    regex.Global = True
    regex.IgnoreCase = True

    ' Extract payment amount (e.g., NZ$123.45)
    amountPattern = "NZ\$([0-9,]+\.?[0-9]*)"
    regex.pattern = amountPattern
    Set matches = regex.Execute(emailBody)

    If matches.count > 0 Then
        paymentAmount = CDbl(Replace(matches(0).SubMatches(0), ",", ""))
        LogToRR9998 "Amount extracted: NZ$" & paymentAmount
    Else
        LogToRR9998 "ERROR: No amount found in email body"
        ExtractStripePaymentData = False
        Exit Function
    End If

    ' Extract Stripe payment ID (e.g., pi_abc123...)
    idPattern = "(pi_[a-zA-Z0-9]{24,})"
    regex.pattern = idPattern
    Set matches = regex.Execute(emailBody)

    If matches.count > 0 Then
        paymentID = matches(0).SubMatches(0)
        LogToRR9998 "Payment ID extracted: " & paymentID
    Else
        LogToRR9998 "ERROR: No payment ID found in email body"
        ExtractStripePaymentData = False
        Exit Function
    End If

    ExtractStripePaymentData = True
    Exit Function

ErrHandler:
    ExtractStripePaymentData = False
    LogToRR9998 "Error in ExtractStripePaymentData: " & Err.description
End Function
Sub UpdateWorkbookWithPayment(paymentAmount As Double, paymentID As String)
    On Error GoTo ErrHandler
    LogToRR9998 "UpdateWorkbookWithPayment started for: " & paymentID

    Dim wsJobBuild As Worksheet
    Set wsJobBuild = ThisWorkbook.Sheets("Job Build Notes")

    Dim lastRow As Long
    lastRow = wsJobBuild.Cells(wsJobBuild.rows.count, "A").End(xlUp).Row
    If lastRow <= 1 Then Exit Sub

    Dim colA As Variant, colF As Variant, colG As Variant
    Dim colK As Variant, colAN As Variant
    colA = wsJobBuild.Range("A2:A" & lastRow).value
    colF = wsJobBuild.Range("F2:F" & lastRow).value
    colG = wsJobBuild.Range("G2:G" & lastRow).value
    colK = wsJobBuild.Range("K2:K" & lastRow).value
    colAN = wsJobBuild.Range("AN2:AN" & lastRow).value

    Dim i As Long
    Dim updated As Boolean: updated = False
    Dim currentRego As String

    For i = 1 To UBound(colA, 1)
        If LCase(Trim(CStr(colG(i, 1)))) = "billable" And _
           IsEmpty(colK(i, 1)) And IsEmpty(colAN(i, 1)) Then

            currentRego = Trim(CStr(colF(i, 1)))

            ' Update column K (Amount)
            wsJobBuild.Cells(i + 1, "K").value = paymentAmount
            LogToRR9998 "Filled Column K with amount NZ$" & paymentAmount & " for row " & (i + 1)

            ' Update total in Book a Job
            Call UpdateBookAJobTotalForRego(currentRego)
            LogToRR9998 "Updated Book a Job total for rego: " & currentRego

            ' Add hyperlink to Stripe ID
            wsJobBuild.Hyperlinks.Add Anchor:=wsJobBuild.Cells(i + 1, "AN"), _
                address:="https://dashboard.stripe.com/payments/" & paymentID, _
                TextToDisplay:=paymentID
            LogToRR9998 "Filled Column AN with payment ID " & paymentID

            updated = True
            LogToRR9998 "SUCCESS: Updated row " & (i + 1) & " (Rego: " & currentRego & ", Job ID: " & colA(i, 1) & ")"
            Exit For
        End If
    Next i

    If Not updated Then
        LogToRR9998 "WARNING: No available billable rows found to update with payment: " & paymentID
    End If

    LogToRR9998 "UpdateWorkbookWithPayment completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateWorkbookWithPayment: " & Err.description
End Sub
Sub UpdateBookAJobTotalForRego(targetRego As String)
    On Error GoTo ErrHandler
    LogToRR9998 "UpdateBookAJobTotalForRego started for rego: " & targetRego

    Dim wsBookJob As Worksheet, wsJobBuild As Worksheet
    Dim lastRowJob As Long, lastRowBook As Long, i As Long

    Set wsBookJob = ThisWorkbook.Sheets("Book a Job")
    Set wsJobBuild = ThisWorkbook.Sheets("Job Build Notes")

    lastRowJob = wsJobBuild.Cells(wsJobBuild.rows.count, "A").End(xlUp).Row
    If lastRowJob <= 1 Then Exit Sub

    Dim colF As Variant, colG As Variant, colI As Variant, colK As Variant
    colF = wsJobBuild.Range("F2:F" & lastRowJob).value
    colG = wsJobBuild.Range("G2:G" & lastRowJob).value
    colI = wsJobBuild.Range("I2:I" & lastRowJob).value
    colK = wsJobBuild.Range("K2:K" & lastRowJob).value

    Dim regoTotal As Double: regoTotal = 0

    For i = 1 To UBound(colF, 1)
        If StrComp(Trim(CStr(colF(i, 1))), targetRego, vbTextCompare) = 0 Then
            Dim recType As String: recType = LCase(Trim(CStr(colG(i, 1))))
            ' Add charges for Billable
            If recType = "billable" And Not IsEmpty(colK(i, 1)) Then
                regoTotal = regoTotal + CDbl(colK(i, 1))
            End If
            ' Subtract only refunds/reimbursements (NOT deposits)
            If Not IsEmpty(colI(i, 1)) Then
                Select Case recType
                    Case "refund", "reimbursement"
                        regoTotal = regoTotal - CDbl(colI(i, 1))
                End Select
            End If
        End If
    Next i

    lastRowBook = wsBookJob.Cells(wsBookJob.rows.count, "A").End(xlUp).Row
    For i = 2 To lastRowBook
        If StrComp(Trim(CStr(wsBookJob.Cells(i, "V").value)), targetRego, vbTextCompare) = 0 Then
            If regoTotal <> 0 Then
                wsBookJob.Cells(i, "W").value = regoTotal
            Else
                wsBookJob.Cells(i, "W").ClearContents
            End If
            LogToRR9998 "Updated Book a Job row " & i & " for rego " & targetRego & " with total: " & regoTotal
            Exit For
        End If
    Next i

    LogToRR9998 "UpdateBookAJobTotalForRego completed for rego: " & targetRego
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateBookAJobTotalForRego: " & Err.description
End Sub

Function GetOrCreateArchiveFolder(olNamespace As Object) As Object
    Set GetOrCreateArchiveFolder = olNamespace.Folders("no-reply@eek.nz").Folders("Archive")
End Function
Sub ArchiveEmail(olMail As Object, olArchiveFolder As Object)
    On Error GoTo ErrHandler
    LogToRR9998 "Archiving email: " & olMail.Subject

    olMail.Move olArchiveFolder

    LogToRR9998 "Email successfully moved to archive"
    Exit Sub

ErrHandler:
    LogToRR9998 "Error archiving email (email remains in inbox): " & Err.description
End Sub

Sub UpdateBookAJobTotals()
    On Error GoTo ErrHandler
    LogToRR9998 "UpdateBookAJobTotals started - Full refresh of all totals."

    Dim wsBookJob As Worksheet: Set wsBookJob = ThisWorkbook.Sheets("Book a Job")
    Dim wsJobBuild As Worksheet: Set wsJobBuild = ThisWorkbook.Sheets("Job Build Notes")
    Dim lastRowBook As Long: lastRowBook = wsBookJob.Cells(wsBookJob.rows.count, "A").End(xlUp).Row
    Dim lastRowJob As Long: lastRowJob = wsJobBuild.Cells(wsJobBuild.rows.count, "A").End(xlUp).Row
    Dim i As Long

    If lastRowBook <= 1 Or lastRowJob <= 1 Then
        LogToRR9998 "UpdateBookAJobTotals completed - No data to process"
        Exit Sub
    End If

    LogToRR9998 "Processing " & (lastRowBook - 1) & " Book a Job rows and " & (lastRowJob - 1) & " Job Build Notes rows"

    Dim bookJobData As Variant: bookJobData = wsBookJob.Range("V2:W" & lastRowBook).value
    Dim colF As Variant, colG As Variant, colI As Variant, colK As Variant
    colF = wsJobBuild.Range("F2:F" & lastRowJob).value   ' Rego
    colG = wsJobBuild.Range("G2:G" & lastRowJob).value   ' Type
    colI = wsJobBuild.Range("I2:I" & lastRowJob).value   ' Credits (deposits, refunds, reimbursements)
    colK = wsJobBuild.Range("K2:K" & lastRowJob).value   ' Charges

    Dim regoTotals As Object: Set regoTotals = CreateObject("Scripting.Dictionary")
    regoTotals.CompareMode = vbTextCompare

    For i = 1 To UBound(colF, 1)
        Dim rego As String: rego = Trim(CStr(colF(i, 1)))
        If Len(rego) > 0 Then
            If Not regoTotals.Exists(rego) Then regoTotals(rego) = 0

            Dim recType As String: recType = LCase(Trim(CStr(colG(i, 1))))

            ' Add billable charges
            If recType = "billable" And Not IsEmpty(colK(i, 1)) Then
                regoTotals(rego) = regoTotals(rego) + CDbl(colK(i, 1))
            End If

            ' Subtract only refunds/reimbursements (NOT deposits)
            If Not IsEmpty(colI(i, 1)) Then
                Select Case recType
                    Case "refund", "reimbursement"
                        regoTotals(rego) = regoTotals(rego) - CDbl(colI(i, 1))
                    Case Else
                        ' deposit / other: do nothing to subtotal
                End Select
            End If
        End If
    Next i

    Dim updatedCount As Long: updatedCount = 0
    For i = 1 To UBound(bookJobData, 1)
        rego = Trim(CStr(bookJobData(i, 1)))
        If Len(rego) > 0 And regoTotals.Exists(rego) Then
            Dim total As Double: total = regoTotals(rego)
            If total <> 0 Then
                bookJobData(i, 2) = total
                updatedCount = updatedCount + 1
            Else
                bookJobData(i, 2) = ""
            End If
        ElseIf Len(rego) > 0 Then
            bookJobData(i, 2) = ""
        End If
    Next i

    wsBookJob.Range("W2:W" & lastRowBook).value = Application.Index(bookJobData, 0, 2)
    LogToRR9998 "UpdateBookAJobTotals completed - Updated " & updatedCount & " rows."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateBookAJobTotals: " & Err.description
End Sub


Sub MarkNonBillableRows()
    On Error GoTo ErrHandler
    LogToRR9998 "MarkNonBillableRows started."

    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Job Build Notes")
    Dim lastRow As Long: lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    Dim markedCount As Long: markedCount = 0

    If lastRow > 1 Then
        Dim colG As Variant, colAN As Variant, i As Long
        colG = ws.Range("G2:G" & lastRow).value
        colAN = ws.Range("AN2:AN" & lastRow).value

        For i = 1 To UBound(colG, 1)
            Dim billableValue As String: billableValue = LCase(Trim(CStr(colG(i, 1))))
            If billableValue <> "billable" And billableValue <> "" And IsEmpty(colAN(i, 1)) Then
                Select Case billableValue
                    Case "reimbursement": colAN(i, 1) = "Reimbursement - No Payment Required"
                    Case "refund": colAN(i, 1) = "Refund - No Payment Required"
                    Case "dnc": colAN(i, 1) = "DNC - No Payment Required"
                    Case "non-billable", "non billable": colAN(i, 1) = "Non-Billable - No Payment Required"
                    Case Else: colAN(i, 1) = "Not Billable - No Payment Required"
                End Select
                markedCount = markedCount + 1
            End If
        Next i

        ws.Range("AN2:AN" & lastRow).value = colAN
    End If

    LogToRR9998 "MarkNonBillableRows completed - Marked " & markedCount & " non-billable rows"
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in MarkNonBillableRows: " & Err.description
End Sub

Function SheetExists(sheetName As String) As Boolean
    On Error Resume Next
    SheetExists = Not ThisWorkbook.Sheets(sheetName) Is Nothing
    On Error GoTo 0
End Function

'-----------------------
' Helper: strip "-<n>"
'-----------------------
Private Function BaseRego(ByVal rego As String) As String
    Dim p As Long, tail As String
    rego = Trim$(rego)
    p = InStrRev(rego, "-")
    If p > 0 Then
        tail = Mid$(rego, p + 1)
        If Len(tail) > 0 And IsNumeric(tail) Then
            BaseRego = Left$(rego, p - 1)
            Exit Function
        End If
    End If
    BaseRego = rego
End Function

'====================================================================
' BAJRegoUpdater
' Finalises the newest Book a Job rego in col V:
'   - Ensures uniqueness per base rego by appending -2, -3, ...
'   - If first occurrence, forces plain base (no suffix).
' Trigger from White_List when BAJ row count changes (AI8/AJ8).
'====================================================================
Public Sub BAJRegoUpdater()
    On Error GoTo ErrHandler

    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim lastRow As Long: lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    If lastRow < 2 Then Exit Sub

    Dim raw As String: raw = Trim$(CStr(ws.Cells(lastRow, "V").value))
    If Len(raw) = 0 Then Exit Sub

    Dim base As String: base = BaseRego(raw)

    ' Count prior occurrences of the same base rego above newest row
    Dim i As Long, cnt As Long
    For i = 2 To lastRow - 1
        If StrComp(BaseRego(Trim$(CStr(ws.Cells(i, "V").value))), base, vbTextCompare) = 0 Then
            cnt = cnt + 1
        End If
    Next i

    Dim want As String
    If cnt = 0 Then
        want = base
    Else
        want = base & "-" & (cnt + 1)
    End If

    If StrComp(raw, want, vbTextCompare) <> 0 Then
        ws.Cells(lastRow, "V").value = want
    End If

    Exit Sub
ErrHandler:
    On Error Resume Next
    LogToRR9998 "Error in BAJRegoUpdater: " & Err.description
End Sub

'====================================================================
' JBNRegoUpdater
' Updates the newest Job Build Notes rego in col F *only if* it has
' no "-<n>" suffix AND the rego column is EMPTY, by pulling the rego
' from Book a Job col V for the same Job ID (col A).
' Does NOT overwrite manually entered regos.
' Trigger from White_List when JBN row count changes (AI2/AJ2).
'====================================================================
Public Sub JBNRegoUpdater()
    On Error GoTo ErrHandler

    Dim wsJ As Worksheet: Set wsJ = ThisWorkbook.Sheets("Job Build Notes")
    Dim wsB As Worksheet: Set wsB = ThisWorkbook.Sheets("Book a Job")

    Dim lastRowJ As Long: lastRowJ = wsJ.Cells(wsJ.rows.count, "A").End(xlUp).Row
    If lastRowJ < 2 Then Exit Sub

    ' Identify newest JBN row
    Dim jobId As Variant: jobId = wsJ.Cells(lastRowJ, "A").value
    If Len(Trim$(CStr(jobId))) = 0 Then Exit Sub

    Dim curRego As String: curRego = Trim$(CStr(wsJ.Cells(lastRowJ, "F").value))

    ' Only update if there is NO "-<n>" suffix (one-time alignment)
    If BaseRego(curRego) <> curRego Then Exit Sub
    
    ' SAFETY: If rego already has a value, don't overwrite it
    ' This prevents manual entries from being replaced
    If Len(curRego) > 0 Then Exit Sub

    ' Find matching BAJ row by Job ID (col A) and pull rego from col V
    Dim m As Variant: m = Application.Match(jobId, wsB.Columns("A"), 0)
    If IsError(m) Then GoTo Done

    Dim srcRego As String: srcRego = Trim$(CStr(wsB.Cells(m, "V").value))
    If Len(srcRego) = 0 Then GoTo Done

    ' Only populate if currently empty
    wsJ.Cells(lastRowJ, "F").value = srcRego

Done:
    Exit Sub
ErrHandler:
    On Error Resume Next
    LogToRR9998 "Error in JBNRegoUpdater: " & Err.description
End Sub















