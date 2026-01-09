Attribute VB_Name = "BankingModule"
' Attribute VB_Name = "BankingModule"
' Attribute VB_Name = "BankingModule"
Public LastClickedCell As Range
Private Declare PtrSafe Function GetClipboardData Lib "user32" (ByVal uFormat As Long) As LongPtr
Private Declare PtrSafe Function lstrlenW Lib "kernel32" (ByVal lpString As LongPtr) As Long
Private Declare PtrSafe Function GlobalLock Lib "kernel32" (ByVal hMem As LongPtr) As LongPtr
Private Declare PtrSafe Function GlobalUnlock Lib "kernel32" (ByVal hMem As LongPtr) As Long
Private Declare PtrSafe Function OpenClipboard Lib "user32" (ByVal hwnd As LongPtr) As Long
Private Declare PtrSafe Function CloseClipboard Lib "user32" () As Long
Private Declare PtrSafe Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (ByRef Destination As Any, ByVal Source As LongPtr, ByVal length As Long)

Const CF_UNICODETEXT As Long = 13

Sub UpdateBanking()
    On Error GoTo ErrHandler

    Dim wsSource As Worksheet, wsTarget As Worksheet
    Dim lastRow As Long, LastCol As Long
    Dim srcHeaders As Range
    Dim dictHeaders As Object, dictCategories As Object
    Dim i As Long, key As Variant
    Dim copyRow As Boolean
    Dim tbl As ListObject
    Dim newRow As ListRow
    Dim tgtHeaderDict As Object
    Dim headerCell As Range
    Dim currentSheet As Worksheet
    Dim addedCount As Long: addedCount = 0

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Set currentSheet = ActiveSheet

    Set wsSource = ThisWorkbook.Sheets("Banking_Record")
    Set wsTarget = ThisWorkbook.Sheets("Transaction_Record")

    lastRow = wsSource.Cells(wsSource.rows.count, 4).End(xlUp).Row
    LastCol = wsSource.Cells(1, wsSource.Columns.count).End(xlToLeft).Column

    On Error Resume Next
    Set tbl = wsTarget.ListObjects("Table68")
    On Error GoTo 0

    If tbl Is Nothing Then
        MsgBox "Error: Table68 not found in Transaction_Record!", vbCritical
        LogToRR9998 "Table68 missing in Transaction_Record.", "BankingLog.txt"
        Exit Sub
    End If

    If tbl.AutoFilter.FilterMode Then tbl.AutoFilter.ShowAllData

    Set dictCategories = CreateObject("Scripting.Dictionary")
    dictCategories.CompareMode = vbTextCompare
    dictCategories.Add "Bill Payment", True
    dictCategories.Add "Visa Purchase", True
    dictCategories.Add "Deposit", True
    dictCategories.Add "Payment", True
    dictCategories.Add "Direct Credit", True
    dictCategories.Add "ATM Cash Deposit", True
    dictCategories.Add "ATM Deposit", True

    Set dictHeaders = CreateObject("Scripting.Dictionary")
    Set tgtHeaderDict = CreateObject("Scripting.Dictionary")
    dictHeaders.CompareMode = vbTextCompare
    tgtHeaderDict.CompareMode = vbTextCompare

    ' Build header mappings
    Set srcHeaders = wsSource.Range(wsSource.Cells(1, 1), wsSource.Cells(1, LastCol))
    For Each headerCell In tbl.HeaderRowRange.Cells
        tgtHeaderDict.Add LCase(headerCell.value), headerCell.Column - tbl.Range.Column + 1
    Next headerCell

    For i = 1 To srcHeaders.Columns.count
        If tgtHeaderDict.Exists(LCase(srcHeaders.Cells(1, i).value)) Then
            If Not dictHeaders.Exists(i) Then
                dictHeaders.Add i, tgtHeaderDict(LCase(srcHeaders.Cells(1, i).value))
            End If
        End If
    Next i

    ' === Begin processing rows ===
    For i = 2 To lastRow
        copyRow = False

        If wsSource.Cells(i, 1).value = "Entered" Or wsSource.Cells(i, 1).value = "Checked" Then GoTo SkipRow

        If dictCategories.Exists(wsSource.Cells(i, 4).value) Then
            copyRow = True
        End If

        If copyRow Then
            Set newRow = tbl.ListRows.Add
            For Each key In dictHeaders.keys
                newRow.Range.Cells(1, dictHeaders(key)).value = wsSource.Cells(i, key).value
            Next key
            wsSource.Cells(i, 1).value = "Entered"
            addedCount = addedCount + 1
        Else
            wsSource.Cells(i, 1).value = "Checked"
        End If

SkipRow:
    Next i

    ' Finalize
    currentSheet.Activate
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic

    LogToRR9998 "UpdateBanking complete — " & addedCount & " rows added to Table68.", "BankingLog.txt"

    ' Continue to Stripe and Matching
    AppendStripeToTransaction
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateBanking: " & Err.description, "BankingLog.txt"
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
End Sub
Sub AppendStripeToTransaction()
    On Error GoTo ErrHandler

    Dim wsStripe As Worksheet, wsTransaction As Worksheet
    Dim stripeHeaders As Range, transHeaders As Range
    Dim headerMap As Object, matchDict As Object
    Dim i As Long, col As Long, key As Variant
    Dim enteredCol As Long, lastRowStripe As Long, lastRowTransaction As Long
    Dim appendedCount As Long: appendedCount = 0
    Dim valToWrite As Variant

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    Set wsStripe = ThisWorkbook.Sheets("Stripe_Record")
    Set wsTransaction = ThisWorkbook.Sheets("Transaction_Record")

    Set headerMap = CreateObject("Scripting.Dictionary")
    Set matchDict = CreateObject("Scripting.Dictionary")
    headerMap.CompareMode = vbTextCompare
    matchDict.CompareMode = vbTextCompare

    ' Define Stripe -> Transaction mapping
    headerMap.Add "Created date (UTC)", "Transaction Date"
    headerMap.Add "Amount", "Amount"
    headerMap.Add "Description", "Reference"
    headerMap.Add "Customer ID", "Details"
    headerMap.Add "Customer Description", "Particulars"
    headerMap.Add "Customer Email", "Code"

    Set stripeHeaders = wsStripe.rows(1)
    Set transHeaders = wsTransaction.rows(1)

    ' Match column names
    For Each key In headerMap.keys
        For col = 1 To stripeHeaders.Columns.count
            If Trim(LCase(CStr(stripeHeaders.Cells(1, col).value))) = LCase(key) Then
                matchDict(key & "_StripeCol") = col
                Exit For
            End If
        Next col

        For col = 1 To transHeaders.Columns.count
            If Trim(LCase(CStr(transHeaders.Cells(1, col).value))) = LCase(headerMap(key)) Then
                matchDict(key & "_TransCol") = col
                Exit For
            End If
        Next col
    Next key

    ' Ensure mapping was successful
    If matchDict.count < headerMap.count * 2 Then
        MsgBox "Column mapping incomplete. Check header spelling.", vbCritical
        LogToRR9998 "Mapping failed in AppendStripeToTransaction", "StripeLog.txt"
        Exit Sub
    End If

    ' Find "Entered" column
    For col = 1 To stripeHeaders.Columns.count
        If Trim(LCase(CStr(stripeHeaders.Cells(1, col).value))) = "entered" Then
            enteredCol = col
            Exit For
        End If
    Next col

    If enteredCol = 0 Then
        MsgBox """Entered"" column not found in Stripe_Record.", vbCritical
        LogToRR9998 "Missing 'Entered' column in Stripe_Record", "StripeLog.txt"
        Exit Sub
    End If

    lastRowStripe = wsStripe.Cells(wsStripe.rows.count, 2).End(xlUp).Row
    lastRowTransaction = wsTransaction.Cells(wsTransaction.rows.count, 1).End(xlUp).Row

    ' Process Stripe rows
    For i = 2 To lastRowStripe
        If Len(Trim(wsStripe.Cells(i, enteredCol).value)) > 0 Then GoTo SkipStripeRow

        lastRowTransaction = lastRowTransaction + 1

        For Each key In headerMap.keys
            valToWrite = wsStripe.Cells(i, matchDict(key & "_StripeCol")).value
            wsTransaction.Cells(lastRowTransaction, matchDict(key & "_TransCol")).value = valToWrite
        Next key

        wsStripe.Cells(i, enteredCol).value = "Processed"
        appendedCount = appendedCount + 1

SkipStripeRow:
    Next i

    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic

    LogToRR9998 "Stripe entries appended: " & appendedCount, "StripeLog.txt"

    ' Trigger matching process
    FastCheckTransactionRecords
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in AppendStripeToTransaction: " & Err.description, "StripeLog.txt"
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
End Sub
Sub FastCheckTransactionRecords()
    On Error GoTo ErrHandler

    Dim wsTR As Worksheet, wsWL As Worksheet
    Dim i As Long, lastRowTR As Long
    Dim searchKey As String, statusMsg As String, killSwitchPath As String
    Dim debugLog As String, tStart As Single

    tStart = Timer
    Set wsTR = ThisWorkbook.Sheets("Transaction_Record")
    Set wsWL = ThisWorkbook.Sheets("White_List")
    killSwitchPath = EnsureKillSwitchExists()
    lastRowTR = wsTR.Cells(wsTR.rows.count, "A").End(xlUp).Row

    ' Prepare headers I to R
    PrepareMatchColumns wsTR

    LogToRR9998 "? FastCheckTransactionRecords started. Rows to process: " & (lastRowTR - 1), "TransactionMatchLog.txt"

    ' Optional: pre-pass to clean blacklists
    AutoBlacklistFromMatches

    ' Loop through each transaction row
    For i = 2 To lastRowTR
        DoEvents
        If KillSwitchTriggered(killSwitchPath) Then
            debugLog = debugLog & vbCrLf & "? Interrupted at row " & i & vbCrLf
            LogToRR9998 "?? Kill switch triggered at row " & i, "TransactionMatchLog.txt"
            Exit For
        End If

        If i Mod 10 = 0 Or i = 2 Then
            statusMsg = "?? Matching " & i & " of " & lastRowTR & _
                        " (" & Format(i / lastRowTR, "0%") & ")"
            Application.StatusBar = statusMsg
            debugLog = debugLog & statusMsg & vbCrLf
        End If

        debugLog = debugLog & CheckTransactionRow(wsTR, wsWL, i) & vbCrLf
    Next i

    ' Finalize
    WriteDebugLog debugLog
    RemoveKillSwitch killSwitchPath
    Application.StatusBar = False

    Dim duration As String
    duration = Format(Timer - tStart, "0.00")

    LogToRR9998 "? FastCheckTransactionRecords completed in " & duration & " seconds.", "TransactionMatchLog.txt"
    MsgBox "? Fast check complete in " & duration & " seconds." & vbCrLf & _
           "Debug saved to Desktop.", vbInformation
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in FastCheckTransactionRecords: " & Err.description, "TransactionMatchLog.txt"
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
End Sub
Sub AutoBlacklistFromMatches()
    On Error GoTo ErrHandler

    Dim wsTrans As Worksheet, wsWL As Worksheet
    Dim arrB As Variant, arrC As Variant, arrD As Variant, arrE As Variant
    Dim i As Long, lastRow As Long, numRows As Long
    Dim key As Variant
    Dim matchDict As Object
    Dim threshold As Long: threshold = 10
    Dim wlRow As Long
    Dim killSwitchPath As String
    Dim cancelNow As Boolean: cancelNow = False
    Dim blacklistedCount As Long: blacklistedCount = 0
    Dim debugLog As String

    LogToRR9998 "?? AutoBlacklistFromMatches started.", "BlacklistLog.txt"

    Set matchDict = CreateObject("Scripting.Dictionary")
    Set wsTrans = ThisWorkbook.Sheets("Transaction_Record")
    Set wsWL = ThisWorkbook.Sheets("White_List")
    killSwitchPath = EnsureKillSwitchExists()

    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    lastRow = wsTrans.Cells(wsTrans.rows.count, "B").End(xlUp).Row
    If lastRow < 2 Then MsgBox "No data to scan.", vbExclamation: GoTo Cleanup

    arrB = wsTrans.Range("B2:B" & lastRow).value
    arrC = wsTrans.Range("C2:C" & lastRow).value
    arrD = wsTrans.Range("D2:D" & lastRow).value
    arrE = wsTrans.Range("E2:E" & lastRow).value
    numRows = UBound(arrB, 1)

    ' Count frequency of index blobs
    For i = 1 To numRows
        DoEvents
        If KillSwitchTriggered(killSwitchPath) Then
            cancelNow = True
            LogToRR9998 "?? Kill switch triggered during auto-blacklisting at row " & i, "BlacklistLog.txt"
            GoTo Cleanup
        End If

        key = GetCleanedIndexBlobFromArray(Array( _
            Nz(arrB(i, 1)), Nz(arrC(i, 1)), Nz(arrD(i, 1)), Nz(arrE(i, 1)) _
        ))

        If Len(key) > 0 Then
            If Not matchDict.Exists(key) Then
                matchDict.Add key, 1
            Else
                matchDict(key) = matchDict(key) + 1
            End If
        End If
    Next i

    ' Prepare Blacklist sheet columns AV:AW
    wlRow = wsWL.Cells(wsWL.rows.count, "AV").End(xlUp).Row
    If wsWL.Cells(1, "AV").value <> "Black List" Then
        wsWL.Cells(1, "AV").value = "Black List"
        wsWL.Cells(1, "AW").value = "Reason"
        wlRow = 2
    Else
        wlRow = wlRow + 1
    End If

    ' Add new entries
    For Each key In matchDict.keys
        If matchDict(key) >= threshold Then
            If Application.CountIf(wsWL.Range("AV:AV"), key) = 0 Then
                wsWL.Cells(wlRow, "AV").value = key
                wsWL.Cells(wlRow, "AW").value = "Auto-blacklisted for excessive match frequency (" & matchDict(key) & " times)"
                wlRow = wlRow + 1
                blacklistedCount = blacklistedCount + 1
                LogToRR9998 "?? Auto-blacklisted: " & key & " (" & matchDict(key) & "x)", "BlacklistLog.txt"
            End If
        End If
    Next key

Cleanup:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    On Error Resume Next: Kill killSwitchPath: On Error GoTo 0

    If cancelNow Then
        MsgBox "?? Blacklist scan was cancelled by kill switch.", vbExclamation
    Else
        MsgBox "? Blacklist scan complete." & vbCrLf & _
               "Scanned: " & matchDict.count & vbCrLf & _
               "Blacklisted: " & blacklistedCount, vbInformation
        LogToRR9998 "? AutoBlacklistFromMatches complete. Entries blacklisted: " & blacklistedCount, "BlacklistLog.txt"
    End If
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in AutoBlacklistFromMatches: " & Err.description, "BlacklistLog.txt"
    Resume Cleanup
End Sub
Sub PrepareMatchHeaders(ws As Worksheet)
    On Error GoTo ErrHandler
    Dim col As Long
    For col = 9 To 18 ' I to R
        ws.Cells(1, col).value = "Possibility " & (col - 8)
    Next col
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in PrepareMatchHeaders: " & Err.description, "ErrorLog.txt"
End Sub
Sub WriteDebugLog(debugText As String)
    On Error GoTo ErrHandler
    Dim f As Integer
    Dim path As String
    path = GetRRFilePath("9998 LOGS", True) & "Match_Debug_Log.txt"
    f = FreeFile
    Open path For Output As #f
    Print #f, debugText
    Close #f
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in WriteDebugLog: " & Err.description, "ErrorLog.txt"
End Sub
Sub UpdateStatusBar(current As Long, total As Long)
    On Error GoTo ErrHandler
    Application.StatusBar = "?? Fast checking row " & current & " of " & total & _
                            " (" & Format(current / total, "0%") & ")"
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in UpdateStatusBar: " & Err.description, "ErrorLog.txt"
End Sub
Function CheckTransactionRow(wsTR As Worksheet, wsWL As Worksheet, rowNum As Long) As String
    On Error GoTo ErrHandler
    Dim searchKey As String, matchLog As String, indexBlob As String
    Dim matchCount As Long, colOffset As Long
    Dim ws As Worksheet, lastRowWS As Long
    Dim j As Long
    Dim keyCheck As String
    Dim isBlacklisted As Variant
    Dim matchRegos As Object
    Set matchRegos = CreateObject("Scripting.Dictionary")

    searchKey = GetCleanedIndexBlob(wsTR, rowNum)
    If Len(searchKey) < 3 Then Exit Function

    ' Check blacklist
    keyCheck = ""
    If Not IsError(searchKey) Then keyCheck = CStr(searchKey)

    If Len(keyCheck) > 0 Then
        On Error Resume Next
        isBlacklisted = Application.WorksheetFunction.CountIf(wsWL.Range("AV:AV"), keyCheck)
        On Error GoTo 0

        If Not IsError(isBlacklisted) Then
            If isBlacklisted > 0 Then
                wsTR.Cells(rowNum, "H").value = "Blacklisted"
                CheckTransactionRow = "? Row " & rowNum & ": Blacklisted (" & keyCheck & ")"
                Exit Function
            End If
        End If
    End If

    ' Start match tracking
    matchCount = 0
    matchLog = "? Row " & rowNum & " [" & searchKey & "]"
    wsTR.Range(wsTR.Cells(rowNum, "I"), wsTR.Cells(rowNum, "R")).ClearContents

    ' Load config from White_List AY (Sheet Search) and AZ (Rego Location)
    Dim matchSheets As Object
    Set matchSheets = CreateObject("Scripting.Dictionary")

    Dim cfgRow As Long, lastCfgRow As Long
    lastCfgRow = wsWL.Cells(wsWL.rows.count, "AY").End(xlUp).Row
    For cfgRow = 2 To lastCfgRow
        Dim sName As String, regoCol As String
        sName = Trim(wsWL.Cells(cfgRow, "AY").value)
        regoCol = Trim(UCase(wsWL.Cells(cfgRow, "AZ").value))
        If Len(sName) > 0 Then matchSheets(sName) = regoCol
    Next cfgRow

    ' Search only configured sheets
    For Each ws In ThisWorkbook.Worksheets
        If matchSheets.Exists(ws.name) Then
            lastRowWS = ws.Cells(ws.rows.count, "A").End(xlUp).Row
            For j = 2 To lastRowWS
                indexBlob = GetCleanedIndexBlob(ws, j)
                If InStr(indexBlob, searchKey) > 0 Then
                    matchCount = matchCount + 1
                    If matchCount <= 10 Then
                        colOffset = 8 + matchCount ' Column I = 9
                        Dim linkLabel As String
                        linkLabel = "'" & ws.name & "'!A" & j
                        wsTR.Hyperlinks.Add _
                            Anchor:=wsTR.Cells(rowNum, colOffset), _
                            address:="", _
                            SubAddress:=linkLabel, _
                            TextToDisplay:=linkLabel
                    End If

                    ' Extract rego only if defined in AZ
                    regoCol = matchSheets(ws.name)
                    Dim regoVal As String
                    regoVal = ""
                    If Len(regoCol) > 0 Then
                        On Error Resume Next
                        regoVal = Trim(UCase(ws.Cells(j, regoCol).text))
                        On Error GoTo 0
                        If Len(regoVal) > 0 Then
                            If Not matchRegos.Exists(regoVal) Then
                                matchRegos.Add regoVal, 1
                            End If
                        End If
                    End If
                End If
            Next j
        End If
    Next ws

    ' Write match outcome
    If matchCount = 1 Then
        wsTR.Cells(rowNum, "H").value = "Matched"
        wsTR.Range(wsTR.Cells(rowNum, "I"), wsTR.Cells(rowNum, "R")).Interior.Color = RGB(198, 239, 206)
    ElseIf matchCount > 1 Then
        wsTR.Cells(rowNum, "H").value = "Ambiguous"
        wsTR.Range(wsTR.Cells(rowNum, "I"), wsTR.Cells(rowNum, "R")).Interior.Color = RGB(255, 235, 156)
    End If

    ' Populate Ref (G) if regos are consistent
    If matchCount > 0 Then
        If matchRegos.count = 1 Then
            wsTR.Cells(rowNum, "G").value = matchRegos.keys()(0)
        Else
            wsTR.Cells(rowNum, "G").value = ""
        End If
    End If

    ' Check for missing invoice if match found and hyperlinks exist
    If matchCount > 0 Then
        Dim invoiceFound As Boolean
        invoiceFound = False

        Dim invoiceSheet As Worksheet
        Set invoiceSheet = Nothing
        On Error Resume Next
        Set invoiceSheet = ThisWorkbook.Sheets("Invoice_List")
        On Error GoTo 0

        If Not invoiceSheet Is Nothing Then
            Dim invoiceLastRow As Long, invoiceRego As String
            invoiceLastRow = invoiceSheet.Cells(invoiceSheet.rows.count, "A").End(xlUp).Row

            invoiceRego = Trim(UCase(wsTR.Cells(rowNum, "G").value))
            If Len(invoiceRego) > 0 Then
                For j = 2 To invoiceLastRow
                    If Trim(UCase(invoiceSheet.Cells(j, "C").text)) = invoiceRego Then
                        invoiceFound = True
                        Exit For
                    End If
                Next j
            End If

            ' Only apply "Nada Factura" if hyperlinks exist in I–R
            Dim hyperlinkExists As Boolean
            hyperlinkExists = False
            For j = 9 To 18 ' Columns I to R
                If wsTR.Cells(rowNum, j).Hyperlinks.count > 0 Then
                    hyperlinkExists = True
                    Exit For
                End If
            Next j

            If Not invoiceFound And hyperlinkExists Then
                wsTR.Cells(rowNum, "H").value = "Nada Factura"
                wsTR.Range(wsTR.Cells(rowNum, "I"), wsTR.Cells(rowNum, "R")).Interior.Color = RGB(255, 199, 206)
            End If
        End If
    End If

    CheckTransactionRow = matchLog & " ? Matches: " & matchCount
    Exit Function

ErrHandler:
    LogToRR9998 "Error in CheckTransactionRow: " & Err.description, "ErrorLog.txt"
    CheckTransactionRow = "Error: " & Err.description
End Function

Sub PrepareMatchColumns(wsTR As Worksheet)
    On Error GoTo ErrHandler
    Dim col As Long
    For col = 9 To 18 ' Columns I to R
        wsTR.Cells(1, col).value = "Possibility " & (col - 8)
    Next col
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in PrepareMatchColumns: " & Err.description, "ErrorLog.txt"
End Sub

Sub JumpBackToLastClicked()
    On Error GoTo ErrHandler
    Dim wsLog As Worksheet
    Dim logRow As Long
    Dim cellAddress As String
    Dim userName As String
    Dim TargetSheet As Worksheet

    If Not LastClickedCell Is Nothing Then
        Set TargetSheet = LastClickedCell.Worksheet
        Set wsLog = ThisWorkbook.Sheets("White_List")
        logRow = wsLog.Cells(wsLog.rows.count, "BB").End(xlUp).Row + 1

        cellAddress = "'" & TargetSheet.name & "'!" & LastClickedCell.address
        userName = Environ("Username")

        ' Log to BB–BE with standard format
        wsLog.Cells(logRow, "BB").value = Now
        wsLog.Cells(logRow, "BC").value = userName
        wsLog.Cells(logRow, "BD").value = cellAddress
        wsLog.Cells(logRow, "BE").value = "JumpBack"

        ' Perform the jump
        Application.GoTo LastClickedCell, True

        ' Keep Column A visible and center the row
        With ActiveWindow
            .ScrollRow = Application.Max(1, LastClickedCell.Row - 10)
            .ScrollColumn = 1
        End With
    Else
        MsgBox "No previous I–R cell selected yet.", vbExclamation
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in JumpBackToLastClicked: " & Err.description, "ErrorLog.txt"
    MsgBox "Error occurred while trying to jump back.", vbCritical
End Sub

Function RemoveAllSpacesUnicodeAware(ByVal txt As String) As String
    On Error GoTo fallback
    Dim regex As Object
    Set regex = CreateObject("VBScript.RegExp")
    With regex
        .Global = True
        .pattern = "[\s\u00A0]+" ' \s = any whitespace, \u00A0 = non-breaking space
    End With
    RemoveAllSpacesUnicodeAware = UCase(regex.Replace(txt, ""))
    Exit Function
fallback:
    ' Basic fallback
    RemoveAllSpacesUnicodeAware = UCase(Replace(Replace(txt, Chr(160), ""), " ", ""))
End Function

Sub CapitaliseActiveCell()
    On Error GoTo ErrHandler
    LogToRR9998 "CapitaliseActiveCell started."

    Dim clipText As String
    clipText = GetClipboardText()

    If Len(clipText) = 0 Then
        LogToRR9998 "CapitaliseActiveCell aborted: Clipboard empty."
        Exit Sub
    End If

    LogToRR9998 "Clipboard content received: " & clipText

    Dim cleanedText As String
    cleanedText = KeepOnlyLettersAndNumbers(clipText)
    LogToRR9998 "Cleaned content: " & cleanedText

    With ActiveCell
        .value = cleanedText
        .ClearFormats
        .Font.name = "Calibri"
        .Font.Size = 11
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
    End With

    LogToRR9998 "CapitaliseActiveCell completed successfully."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CapitaliseActiveCell: " & Err.description
End Sub

Function GetClipboardText() As String
    On Error GoTo ErrHandler
    LogToRR9998 "GetClipboardText (Unicode) started."

    Dim hClipData As LongPtr
    Dim lpClip As LongPtr
    Dim clipLength As Long
    Dim sBuffer As String

    If OpenClipboard(0) = 0 Then
        LogToRR9998 "OpenClipboard failed."
        Exit Function
    End If

    hClipData = GetClipboardData(CF_UNICODETEXT)
    If hClipData = 0 Then
        LogToRR9998 "GetClipboardData returned null."
        CloseClipboard
        Exit Function
    End If

    lpClip = GlobalLock(hClipData)
    If lpClip <> 0 Then
        clipLength = lstrlenW(lpClip)
        sBuffer = String$(clipLength, vbNullChar)
        CopyMemory ByVal StrPtr(sBuffer), lpClip, clipLength * 2
        GlobalUnlock hClipData
    Else
        LogToRR9998 "GlobalLock failed."
    End If

    CloseClipboard
    LogToRR9998 "GetClipboardText (Unicode) completed."
    GetClipboardText = sBuffer
    Exit Function

ErrHandler:
    LogToRR9998 "Error in GetClipboardText: " & Err.description
End Function



Function NormalizeText(text As String) As String
    On Error GoTo ErrHandler
    Dim s As String, i As Long, ch As String
    s = LCase(text)
    For i = 1 To Len(s)
        ch = Mid(s, i, 1)
        If ch Like "[a-z0-9]" Then
            NormalizeText = NormalizeText & ch
        End If
    Next i
    Exit Function
ErrHandler:
    LogToRR9998 "Error in NormalizeText: " & Err.description, "ErrorLog.txt"
End Function
Function GetCleanedIndexBlob(ws As Worksheet, Row As Long) As String
    On Error GoTo ErrHandler
    Dim blob As String
    blob = ws.Cells(Row, "B").value & ws.Cells(Row, "C").value & ws.Cells(Row, "D").value & ws.Cells(Row, "E").value
    blob = Replace(Replace(LCase(blob), " ", ""), vbTab, "")
    GetCleanedIndexBlob = blob
    Exit Function
ErrHandler:
    LogToRR9998 "Error in GetCleanedIndexBlob: " & Err.description, "ErrorLog.txt"
    GetCleanedIndexBlob = ""
End Function
Function GetCleanedIndexBlobFromArray(arr As Variant) As String
    On Error GoTo ErrHandler
    Dim i As Long, s As String
    For i = LBound(arr) To UBound(arr)
        If Not IsError(arr(i)) And Not IsMissing(arr(i)) Then
            s = s & LCase(Replace(Replace(CStr(arr(i)), " ", ""), vbTab, ""))
        End If
    Next i
    GetCleanedIndexBlobFromArray = s
    Exit Function
ErrHandler:
    LogToRR9998 "Error in GetCleanedIndexBlobFromArray: " & Err.description, "ErrorLog.txt"
    GetCleanedIndexBlobFromArray = ""
End Function
Function Nz(val As Variant) As String
    On Error GoTo ErrHandler
    If IsError(val) Or IsMissing(val) Or IsNull(val) Then
        Nz = ""
    Else
        Nz = CStr(val)
    End If
    Exit Function
ErrHandler:
    LogToRR9998 "Error in Nz: " & Err.description, "ErrorLog.txt"
    Nz = ""
End Function
Function ExtractRego(rawText As String) As String
    On Error GoTo ErrHandler
    Dim tmp As String
    If Trim(rawText) = "" Then
        ExtractRego = ""
        Exit Function
    End If

    On Error Resume Next
    tmp = Split(rawText, " ")(0)
    On Error GoTo 0

    tmp = Replace(tmp, "(", "")
    ExtractRego = UCase(Trim(tmp))
    Exit Function
ErrHandler:
    LogToRR9998 "Error in ExtractRego: " & Err.description, "ErrorLog.txt"
    ExtractRego = ""
End Function
Function EnsureKillSwitchExists() As String
    On Error GoTo ErrHandler
    Dim path As String
    path = GetRRFilePath("9998 LOGS", True) & "EscapeTrigger.txt"
    If Dir(path) = "" Then
        Open path For Output As #1: Close #1
    End If
    EnsureKillSwitchExists = path
    Exit Function
ErrHandler:
    LogToRR9998 "Error in EnsureKillSwitchExists: " & Err.description, "ErrorLog.txt"
    EnsureKillSwitchExists = ""
End Function
Function KillSwitchTriggered(killSwitchPath As String) As Boolean
    On Error GoTo ErrHandler
    KillSwitchTriggered = (Dir(killSwitchPath) = "")
    Exit Function
ErrHandler:
    LogToRR9998 "Error in KillSwitchTriggered: " & Err.description, "ErrorLog.txt"
    KillSwitchTriggered = False
End Function
Sub RemoveKillSwitch(Optional killPath As String = "")
    On Error GoTo ErrHandler
    If killPath = "" Then
        killPath = GetRRFilePath("9998 LOGS", True) & "EscapeTrigger.txt"
    End If
    On Error Resume Next
    If Dir(killPath) <> "" Then Kill killPath
    On Error GoTo 0
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in RemoveKillSwitch: " & Err.description, "ErrorLog.txt"
End Sub

Sub DebugCharacterCodes()
    Dim txt As String
    Dim i As Long
    Dim output As String

    txt = ActiveCell.value
    output = "Character breakdown for: [" & txt & "]" & vbCrLf & vbCrLf

    For i = 1 To Len(txt)
        output = output & "Char " & i & ": '" & Mid(txt, i, 1) & "' = ASC(" & AscW(Mid(txt, i, 1)) & ")" & vbCrLf
    Next i

    MsgBox output, vbInformation, "Hidden Char Debug"
End Sub

Sub ForceCleanSelectedCell()
    Dim originalValue As Variant
    Dim cleanedValue As String

    originalValue = ActiveCell.value

    If VarType(originalValue) = vbString Then
        cleanedValue = UCase(Replace(originalValue, " ", ""))
        If cleanedValue <> originalValue Then
            ActiveCell.value = cleanedValue
            MsgBox "Cleaned from [" & originalValue & "] to [" & cleanedValue & "]", vbInformation
        Else
            MsgBox "No cleaning needed.", vbInformation
        End If
    Else
        MsgBox "Active cell is not a string.", vbExclamation
    End If
End Sub














