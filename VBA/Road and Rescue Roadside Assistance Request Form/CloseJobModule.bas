Attribute VB_Name = "CloseJobModule"
' Attribute VB_Name = "CloseJobModule"
' Attribute VB_Name = "CloseJobModule"
Option Explicit

Sub CloseJob()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? CloseJob aborted � no rego selected.", "CloseJobLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")

    Dim lastRow As Long, prevRow As Long, r As Long
    lastRow = ws.Cells(ws.rows.count, "F").End(xlUp).Row
    prevRow = 0

    For r = lastRow To 1 Step -1
        If Trim(UCase(ws.Cells(r, "F").value)) = Trim(UCase(selectedJobRego)) Then
            prevRow = r
            Exit For
        End If
    Next r

    If prevRow = 0 Then
        ShowWarning "No matching row found for rego in column F."
        LogToRR9998 "? CloseJob failed � no match in column F for rego: " & selectedJobRego, "CloseJobLog.txt"
        Exit Sub
    End If

    Dim newRow As Long
    newRow = lastRow + 1

    ws.Cells(newRow, "A").value = ws.Cells(prevRow, "A").value + 1

    Dim col As Integer
    For col = 2 To 7
        ws.Cells(newRow, col).value = ws.Cells(prevRow, col).value
    Next col

    ws.Cells(newRow, "G").value = "Close Job"
    ws.Cells(newRow, "J").value = "[Close Job]"
    ws.Cells(newRow, "M").value = "No"
    ws.Cells(newRow, "N").value = "Yes"

    LogToRR9998 "? CloseJob entry added for rego: " & selectedJobRego & " (row " & newRow & ")", "CloseJobLog.txt"
    Call DeleteRelatedRecordsByRego(selectedJobRego)
    LookupAndCompare
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in CloseJob: " & Err.description, "CloseJobLog.txt"
End Sub

Private Sub DeleteRelatedRecordsByRego(ByVal rego As String)
    On Error GoTo ErrHandler

    Dim wsNotes  As Worksheet
    Dim lastRow  As Long, r As Long
    Dim recType  As String
    Dim phoneNum As String
    Dim extn     As String

    Set wsNotes = ThisWorkbook.Sheets("Job Build Notes")
    lastRow = wsNotes.Cells(wsNotes.rows.count, "F").End(xlUp).Row

    For r = 2 To lastRow
        If Trim(UCase(wsNotes.Cells(r, "F").value)) = Trim(UCase(rego)) Then
            recType = Trim(UCase(wsNotes.Cells(r, "G").value))
            Select Case recType
                Case "BILLABLE"
                    phoneNum = Trim(wsNotes.Cells(r, "AL").value)
                    extn = "1003"
                Case "SUPPLIER"
                    phoneNum = Trim(wsNotes.Cells(r, "Y").value)
                    extn = "1001"
                Case Else
                    GoTo nextRow
            End Select

            ' ? Use "update" explicitly
            SendToSharePoint "delete", phoneNum
            SendToSharePoint "add", phoneNum, extn
        End If
nextRow:
    Next r

ExitPoint:
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in DeleteRelatedRecordsByRego: " & Err.description, "CloseJobLog.txt"
    Resume ExitPoint
End Sub

Private Function GetRealDesktopPath() As String
    On Error Resume Next
    Dim p As String
    p = CreateObject("WScript.Shell").SpecialFolders("Desktop")
    If Len(Dir$(p, vbDirectory)) > 0 Then
        GetRealDesktopPath = p
        Exit Function
    End If
    p = Environ$("USERPROFILE") & "\Desktop"
    If Len(Dir$(p, vbDirectory)) > 0 Then
        GetRealDesktopPath = p
        Exit Function
    End If
    GetRealDesktopPath = ThisWorkbook.path
End Function

' =======================
' String normalizer for comparisons/logs
' =======================
Private Function KeyNorm(ByVal s As Variant) As String
    Dim t As String
    t = CStr(s)
    ' Clean control chars
    On Error Resume Next
    t = Application.WorksheetFunction.clean(t)
    On Error GoTo 0
    ' Normalize common invisibles / dashes
    t = Replace(t, Chr$(160), " ")                 ' NBSP -> space
    t = Replace(t, vbTab, " ")
    t = Replace(t, ChrW(&HFEFF), "")               ' ZWNBSP -> ""
    t = Replace(t, ChrW(&H2013), "-")              ' en dash -> hyphen
    t = Replace(t, ChrW(&H2014), "-")              ' em dash -> hyphen
    t = Replace(t, ChrW(&H2212), "-")              ' minus -> hyphen
    KeyNorm = UCase$(Trim$(t))
End Function

' Return codepoints (hex) of a short string to spot look-alikes (kept short for log)
Private Function HexCodes(ByVal s As String, Optional ByVal maxChars As Long = 80) As String
    Dim i As Long, out As String, l As Long
    l = Len(s)
    If l > maxChars Then l = maxChars
    For i = 1 To l
        out = out & Hex$(AscW(Mid$(s, i, 1))) & " "
    Next
    HexCodes = Trim$(out)
End Function

' =====================================
' MAIN: MarkDNCJob with GUID-proof ID generation
' =====================================
Sub MarkDNCJob()
    On Error GoTo ErrHandler

    ' ---- Debug file: create fresh on Desktop ----
    Dim desktopPath As String, logPath As String
    Dim ff As Integer, logOpen As Boolean
    desktopPath = GetRealDesktopPath()
    logPath = desktopPath & "\MarkDNCJob_Debug_" & Format(Now, "yyyymmdd_hhnnss") & ".txt"

    ff = FreeFile
    On Error Resume Next
    Open logPath For Output As #ff
    logOpen = (Err.Number = 0)
    On Error GoTo ErrHandler

    If logOpen Then
        Print #ff, "=== MarkDNCJob DEBUG START @ " & Now & " ==="
        Print #ff, "Log file: " & logPath
    End If

    ' ---- Your existing preamble ----
    Call OpenJobRegister
    Call LaunchOutlook

    If logOpen Then Print #ff, "selectedJobRego RAW=[" & selectedJobRego & "] len=" & Len(CStr(selectedJobRego)) & " hex=[" & HexCodes(CStr(selectedJobRego)) & "]"
    If logOpen Then Print #ff, "selectedJobRego NORM=[" & KeyNorm(selectedJobRego) & "]"

    If selectedJobRego = "" Then
        If logOpen Then Print #ff, "ABORT: No Job Rego selected."
        If logOpen Then Print #ff, "=== DEBUG END (EARLY) ==="
        If logOpen Then Close #ff
        Exit Sub
    End If

    Dim ws As Worksheet, jobWS As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    Set jobWS = ThisWorkbook.Sheets("Book a Job")

    ' ---- Determine an authoritative last row (prove we're not skipping) ----
    Dim lastN As Long, lastA As Long, lastUsed As Long, lastJobRow As Long
    lastN = jobWS.Cells(jobWS.rows.count, "N").End(xlUp).Row
    lastA = jobWS.Cells(jobWS.rows.count, 1).End(xlUp).Row
    lastUsed = jobWS.UsedRange.Row + jobWS.UsedRange.rows.count - 1
    lastJobRow = lastN
    If lastA > lastJobRow Then lastJobRow = lastA
    If lastUsed > lastJobRow Then lastJobRow = lastUsed

    If logOpen Then
        Print #ff, "LastRow candidates: lastN=" & lastN & ", lastA=" & lastA & ", lastUsed=" & lastUsed & " => using lastJobRow=" & lastJobRow
        Print #ff, "Scanning rows 2.." & lastJobRow & " in [Book a Job]!N"
    End If

    ' ---- Exhaustive scan with per-row determination ----
    Dim r As Long, bookRow As Long
    Dim rawN As String, normN As String
    Dim rawSel As String, normSel As String
    rawSel = CStr(selectedJobRego)
    normSel = KeyNorm(rawSel)
    bookRow = 0

    For r = 2 To lastJobRow
        rawN = CStr(jobWS.Cells(r, "N").value)
        normN = KeyNorm(rawN)

        ' determinations
        Dim exactMatch As Boolean, normMatch As Boolean, startsWithRarp As Boolean, startsWithSel As Boolean
        exactMatch = (Trim$(UCase$(rawN)) = Trim$(UCase$(rawSel)))
        normMatch = (normN = normSel)
        startsWithRarp = (Left$(normN, 4) = "RARP")
        startsWithSel = (Len(normSel) > 0 And Left$(normN, Len(normSel)) = normSel)

        If logOpen Then
            Print #ff, "r=" & r & _
                       " | N_RAW=[" & rawN & "] len=" & Len(rawN) & " hex=[" & HexCodes(rawN) & "]" & _
                       " | N_NORM=[" & normN & "]" & _
                       " | EXACT=" & CStr(exactMatch) & " | NORM_EQ=" & CStr(normMatch) & _
                       " | STARTS_WITH_RARP=" & CStr(startsWithRarp) & " | STARTS_WITH_SEL=" & CStr(startsWithSel)
        End If

        ' BUSINESS RULE: keep your original strict compare (exactMatch)
        If exactMatch Then
            bookRow = r
            If logOpen Then Print #ff, ">> MATCH (EXACT) at row " & bookRow
            Exit For
        End If
    Next r

    If logOpen Then Print #ff, "Scan complete. bookRow=" & bookRow & " (0 means none matched EXACT)."

    If bookRow = 0 Then
        If logOpen Then Print #ff, "ABORT: No EXACT match found in [Book a Job]!N for selectedJobRego."
        If logOpen Then Print #ff, "=== MarkDNCJob DEBUG END ==="
        If logOpen Then Close #ff
        Exit Sub
    End If

    ' ---- Proceed with your insert into Job Build Notes ----
    Dim newRow As Long
    newRow = ws.Cells(ws.rows.count, "F").End(xlUp).Row + 1
    If logOpen Then Print #ff, "Job Build Notes newRow (from col F) = " & newRow

    ' ---- FIXED: Find the highest NUMERIC ID (ignore GUIDs and "Manual" entries) ----
    Dim maxNumericID As Long
    Dim idVal As Variant
    maxNumericID = 0

    For r = 2 To ws.Cells(ws.rows.count, 1).End(xlUp).Row
        idVal = ws.Cells(r, 1).value
        
        If IsNumeric(idVal) And Not IsEmpty(idVal) Then
            Dim numID As Long
            numID = CLng(idVal)
            If numID > maxNumericID Then
                maxNumericID = numID
            End If
        End If
    Next r

    If logOpen Then Print #ff, "Max numeric ID found: " & maxNumericID & ", using nextID: " & (maxNumericID + 1)

    ' Do the write with the next sequential numeric ID
    ws.Cells(newRow, 1).value = maxNumericID + 1
    ws.Cells(newRow, 3).value = jobWS.Cells(bookRow, 3).value ' C - Completion Time
    ws.Cells(newRow, 4).value = jobWS.Cells(bookRow, 4).value ' D - Email
    ws.Cells(newRow, 6).value = jobWS.Cells(bookRow, 14).value ' N - Rego
    ws.Cells(newRow, 7).value = "DNC"                         ' G - Type
    ws.Cells(newRow, 8).value = ""                             ' H - Supplier
    ws.Cells(newRow, 9).value = ""                             ' I - Reimbursement
    ws.Cells(newRow, 10).value = "[DNC]"                       ' J - Job Notes
    ws.Cells(newRow, 11).value = ""                            ' K - Charges
    ws.Cells(newRow, 12).value = ""                            ' L - Costings
    ws.Cells(newRow, 13).value = "No"                          ' M - Paid
    ws.Cells(newRow, 14).value = "Yes"                         ' N - Closed

    If logOpen Then
        Dim c As Long, rowDump As String
        rowDump = ""
        For c = 1 To 14
            rowDump = rowDump & "[" & ws.Cells(newRow, c).text & "] "
        Next c
        Print #ff, "WROTE JBN row " & newRow & ": " & rowDump
    End If

    LogToRR9998 "? MarkDNCJob entry added for rego: " & selectedJobRego & " (JBN row " & newRow & ", Book a Job row " & bookRow & ")", "MarkDNCJobLog.txt"

    ' Downstream calls (unchanged)
    Call DeleteRelatedRecordsByRego(selectedJobRego)
    LookupAndCompare
    Call ClearRegoFromJobData

    If logOpen Then
        Print #ff, "=== MarkDNCJob DEBUG END (OK) ==="
        Close #ff
    End If

    ShowStatus "DNC job marked successfully!" & vbCrLf & "Debug file: " & logPath

    Exit Sub

ErrHandler:
    ' Open fallback log if needed, then write error
    If Not logOpen Then
        On Error Resume Next
        logPath = ThisWorkbook.path & "\MarkDNCJob_Debug_ERROR_" & Format(Now, "yyyymmdd_hhnnss") & ".txt"
        ff = FreeFile
        Open logPath For Output As #ff
        logOpen = (Err.Number = 0)
        On Error GoTo 0
    End If
    If logOpen Then
        Print #ff, "ERROR " & Err.Number & ": " & Err.description
        Print #ff, "=== MarkDNCJob DEBUG END (ERROR) ==="
        Close #ff
        ShowError "Error logged to: " & logPath
    Else
        ShowError "Error " & Err.Number & ": " & Err.description & vbCrLf & "(Also failed to open a log file.)"
    End If
End Sub

Sub ClearRegoFromJobData()
    On Error GoTo ErrHandler

    If selectedJobRego = "" Then Exit Sub

    Dim ws As Worksheet
    Dim regoColName As String
    Dim targetColName As String
    Dim regoCol As Long, targetCol As Long
    Dim lastRow As Long, r As Long

    ' --- Process Book a Job ---
    Set ws = ThisWorkbook.Sheets("Book a Job")
    regoColName = "Rego2"
    targetColName = "Job_Support_Open"
    
    regoCol = GetColumnByHeader(ws, regoColName)
    targetCol = GetColumnByHeader(ws, targetColName)

    If regoCol > 0 And targetCol > 0 Then
        lastRow = ws.Cells(ws.rows.count, regoCol).End(xlUp).Row
        For r = 2 To lastRow
            If Trim(UCase(ws.Cells(r, regoCol).value)) = Trim(UCase(selectedJobRego)) Then
                ws.Cells(r, targetCol).ClearContents
            End If
        Next r
        LogToRR9998 "? Cleared Job_Support_Open for rego '" & selectedJobRego & "' in Book a Job", "ClearRegoLog.txt"
    Else
        LogToRR9998 "? Missing header(s) in Book a Job: " & regoColName & "/" & targetColName, "ClearRegoLog.txt"
    End If

    ' --- Process Job Build Notes ---
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    regoColName = "Rego"
    targetColName = "Supp_Phone_Open"

    regoCol = GetColumnByHeader(ws, regoColName)
    targetCol = GetColumnByHeader(ws, targetColName)

    If regoCol > 0 And targetCol > 0 Then
        lastRow = ws.Cells(ws.rows.count, regoCol).End(xlUp).Row
        For r = 2 To lastRow
            If Trim(UCase(ws.Cells(r, regoCol).value)) = Trim(UCase(selectedJobRego)) Then
                ws.Cells(r, targetCol).ClearContents
            End If
        Next r
        LogToRR9998 "? Cleared Supp_Phone_Open for rego '" & selectedJobRego & "' in Job Build Notes", "ClearRegoLog.txt"
    Else
        LogToRR9998 "? Missing header(s) in Job Build Notes: " & regoColName & "/" & targetColName, "ClearRegoLog.txt"
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in ClearRegoFromJobData: " & Err.description, "ClearRegoLog.txt"
End Sub

' NOTE: GetColumnByHeader is now in PublicUtilities module
' Calls to GetColumnByHeader() will use PublicUtilities.GetColumnByHeader()


Sub CountColumnN_Gaps()
    Dim ws As Worksheet
    Dim lastRow As Long, r As Long
    Dim blanks As Long, nonBlanks As Long
    Dim inGap As Boolean, gapStart As Long
    Dim gaps() As String, g As Long
    Dim v As String
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    
    ' True last used row anywhere on the sheet (handles gaps)
    Dim lastAny As Range
    Set lastAny = ws.Cells.Find(What:="*", _
                                After:=ws.Cells(1, 1), _
                                LookIn:=xlFormulas, _
                                LookAt:=xlPart, _
                                SearchOrder:=xlByRows, _
                                SearchDirection:=xlPrevious, _
                                MatchCase:=False)
    If lastAny Is Nothing Then
        ShowWarning "Sheet is empty."
        Exit Sub
    End If
    lastRow = lastAny.Row
    
    ' Walk N and collect gap ranges
    For r = 2 To lastRow
        v = Trim$(CStr(ws.Cells(r, "N").value))
        If v = "" Then
            blanks = blanks + 1
            If Not inGap Then
                inGap = True
                gapStart = r
            End If
        Else
            nonBlanks = nonBlanks + 1
            If inGap Then
                ' close gap at r-1
                g = g + 1
                ReDim Preserve gaps(1 To g)
                gaps(g) = FormatGap(ws, gapStart, r - 1, True, r)
                inGap = False
            End If
        End If
    Next r
    
    ' trailing gap to bottom
    If inGap Then
        g = g + 1
        ReDim Preserve gaps(1 To g)
        gaps(g) = FormatGap(ws, gapStart, lastRow, False, 0)
    End If
    
    ' Build summary (show first 15 gaps only to keep the popup sane)
    Dim summary As String, i As Long, showCount As Long
    summary = "Book a Job total rows checked: " & lastRow & vbCrLf & _
              "Non-blank in column N: " & nonBlanks & vbCrLf & _
              "Blank in column N: " & blanks & vbCrLf & _
              "Blank gap ranges found: " & g & vbCrLf
    
    showCount = IIf(g > 15, 15, g)
    If g > 0 Then
        summary = summary & vbCrLf & "First " & showCount & " gap(s):" & vbCrLf
        For i = 1 To showCount
            summary = summary & " � " & gaps(i) & vbCrLf
        Next i
        If g > showCount Then summary = summary & "� (" & (g - showCount) & " more; see Immediate window)"
    End If
    
    ShowStatus summary
    
    ' Full list -> Immediate window (Ctrl+G to view)
    If g > 0 Then
        Debug.Print String(60, "-")
        Debug.Print "Column N blank gaps (start�end, length | prev=[�] next=[�]):"
        For i = 1 To g
            Debug.Print gaps(i)
        Next i
        Debug.Print String(60, "-")
    End If
End Sub

Private Function FormatGap(ws As Worksheet, _
                           ByVal startRow As Long, _
                           ByVal endRow As Long, _
                           ByVal hasNext As Boolean, _
                           ByVal nextRow As Long) As String
    Dim beforeVal As String, afterVal As String, length As Long
    length = endRow - startRow + 1
    If startRow > 2 Then beforeVal = CStr(ws.Cells(startRow - 1, "N").value)
    If hasNext And nextRow > 0 Then afterVal = CStr(ws.Cells(nextRow, "N").value)
    FormatGap = CStr(startRow) & "�" & CStr(endRow) & _
                " (" & length & ") | prev=[" & beforeVal & "] next=[" & afterVal & "]"
End Function














