Attribute VB_Name = "GeneratePrepurchaseReportModule"
' Attribute VB_Name = "GeneratePrepurchaseReportModule"
' Attribute VB_Name = "GeneratePrepurchaseReportModule"
' Main module for Prepurchase Report Generation (single-source hard-coded API key)
Option Explicit

' ====== CONFIG ======
Private Const ANTHROPIC_API_KEY As String = "YOUR_ANTHROPIC_API_KEY_HERE"  ' Replace with actual key
Private Const WD_FORMAT_XML_DOC As Long = 12  ' wdFormatXMLDocument

' ====== ENTRY POINT ======
Sub GeneratePrepurchaseReport()
    On Error GoTo ErrorHandler

    If Trim$(selectedJobRego) = "" Then
        MsgBox "No registration selected (selectedJobRego is blank).", vbExclamation
        Exit Sub
    End If

    Dim baseRegoFolder As String
    baseRegoFolder = GetRRFilePath("PREPURCHASE INSPECTIONS\" & selectedJobRego, True)

    Dim clientFolder As String, carjamFolder As String, outputDocPath As String
    clientFolder = FindClientReportFolderExact(selectedJobRego, baseRegoFolder)
    If clientFolder = "" Then
        MsgBox "Could not find the '" & selectedJobRego & " PrePurchase Report' folder.", vbExclamation
        Exit Sub
    End If

    ' Optional sibling CarJam folder (included if present)
    carjamFolder = FindCarJamFolder(baseRegoFolder)

    ' We WRITE to this doc but DO NOT READ it
    outputDocPath = clientFolder & "\" & selectedJobRego & " PrePurchase Report.docx"

    Dim allData As String
    Dim reportPrompt As String
    Dim reportContent As String
    Dim WordApp As Object
    Dim wordDoc As Object

    Application.StatusBar = "Reading inspection data..."
    ' Reads everything EXCEPT the output report itself
    allData = GatherAllInspectionData_Composite(clientFolder, carjamFolder, outputDocPath)

    If Len(allData) = 0 Then
        MsgBox "No data files found in the client/CarJam folders.", vbExclamation
        GoTo Cleanup
    End If

    Application.StatusBar = "Preparing report request..."
    reportPrompt = BuildReportPrompt(allData)

    Application.StatusBar = "Generating report via Anthropic API..."
    reportContent = CallClaudeForReport(reportPrompt, ANTHROPIC_API_KEY)

    If Left$(reportContent, 5) = "Error" Then
        MsgBox reportContent, vbCritical, "API Error"
        GoTo Cleanup
    End If

    Application.StatusBar = "Writing Word document..."

    Set WordApp = CreateObject("Word.Application")
    WordApp.Visible = False

    ' If file exists, open and replace content; else create new
    If Dir$(outputDocPath) <> "" Then
        Set wordDoc = WordApp.Documents.Open(outputDocPath)
        wordDoc.content.Delete
    Else
        Set wordDoc = WordApp.Documents.Add
    End If

    FormatReportInWord wordDoc, reportContent
    wordDoc.SaveAs2 outputDocPath, FileFormat:=WD_FORMAT_XML_DOC
    wordDoc.Close False
    WordApp.Quit

    Application.StatusBar = "Report generated successfully!"
    MsgBox "Prepurchase report created:" & vbCrLf & outputDocPath, vbInformation
    GoTo Done

Cleanup:
    On Error Resume Next
    If Not wordDoc Is Nothing Then wordDoc.Close False
    If Not WordApp Is Nothing Then WordApp.Quit
Done:
    Application.StatusBar = ""
    Exit Sub

ErrorHandler:
    Application.StatusBar = ""
    LogToRR9998 "GeneratePrepurchaseReport error: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
    GoTo Cleanup
End Sub

' ====== PATH HELPERS ======
' Finds EXACT "<REGO> PrePurchase Report" inside the provided base folder.
Private Function FindClientReportFolderExact(ByVal rego As String, ByVal baseRegoFolder As String) As String
    On Error Resume Next
    Dim fs As Object, f As Object
    Set fs = CreateObject("Scripting.FileSystemObject")
    If fs.FolderExists(baseRegoFolder) Then
        For Each f In fs.GetFolder(baseRegoFolder).SubFolders
            If LCase$(f.name) = LCase$(rego & " PrePurchase Report") Then
                FindClientReportFolderExact = f.path
                Exit Function
            End If
        Next
    End If
    FindClientReportFolderExact = ""
End Function

' Looks for a sibling folder named "CarJam Report" under the base rego folder.
Private Function FindCarJamFolder(ByVal baseRegoFolder As String) As String
    On Error Resume Next
    Dim fs As Object
    Set fs = CreateObject("Scripting.FileSystemObject")
    If fs.FolderExists(baseRegoFolder & "\CarJam Report") Then
        FindCarJamFolder = baseRegoFolder & "\CarJam Report"
    Else
        FindCarJamFolder = "" ' optional
    End If
End Function

' ====== DATA GATHER ======
' Collects data from the client folder + its subfolders, and (if present) the CarJam folder + subfolders.
' Skips ONLY: Word temp files and the output report itself.
Private Function GatherAllInspectionData_Composite(ByVal clientFolder As String, _
                                                   ByVal carjamFolder As String, _
                                                   ByVal outputDocPath As String) As String
    Dim buf As String
    buf = GatherTree(clientFolder, outputDocPath)
    If Len(carjamFolder) > 0 Then
        buf = buf & GatherTree(carjamFolder, outputDocPath)
    End If
    GatherAllInspectionData_Composite = buf
End Function

' Walk a folder tree and read supported files.
Private Function GatherTree(rootFolder As String, outputDocPath As String) As String
    Dim fso As Object, stack As Collection, cur As Object, f As Object
    Dim buf As String, fileContent As String

    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(rootFolder) Then Exit Function

    Set stack = New Collection
    stack.Add fso.GetFolder(rootFolder)

    Do While stack.count > 0
        Set cur = stack(1)
        stack.Remove 1

        ' Files
        For Each f In cur.Files
            If ShouldReadFile(CStr(f.path), outputDocPath) Then
                fileContent = ReadFileContent(CStr(f.path))
                If Len(fileContent) > 0 Then
                    buf = buf & vbCrLf & "--- File: " & f.name & " ---" & vbCrLf
                    buf = buf & fileContent & vbCrLf
                End If
            End If
        Next

        ' Subfolders
        Dim subf As Object
        For Each subf In cur.SubFolders
            stack.Add subf
        Next
    Loop

    GatherTree = buf
End Function

' Controls which files are read. We only skip:
' - Word temp files (~$)
' - The output report itself (to avoid reading what we�re writing)
Private Function ShouldReadFile(ByVal path As String, ByVal outputDocPath As String) As Boolean
    Dim nm As String, ext As String
    nm = Mid$(path, InStrRev(path, "\") + 1)
    ext = LCase$(Mid$(path, InStrRev(path, ".")))

    ' Skip Word lock/temporary files
    If Left$(nm, 2) = "~$" Then Exit Function

    ' Skip the output report itself
    If LCase$(path) = LCase$(outputDocPath) Then Exit Function

    ' Supported types (PDF excluded by default)
    ShouldReadFile = (ext = ".txt" Or ext = ".csv" Or ext = ".json" Or ext = ".xml" _
                      Or ext = ".xlsx" Or ext = ".xls" Or ext = ".docx" Or ext = ".doc")
End Function

' Dispatch by extension
Private Function ReadFileContent(filePath As String) As String
    On Error Resume Next
    Dim ext As String: ext = LCase$(Mid$(filePath, InStrRev(filePath, ".")))

    Select Case ext
        Case ".txt", ".csv", ".json", ".xml"
            ReadFileContent = ReadTextFile(filePath)
        Case ".xlsx", ".xls"
            ReadFileContent = ReadExcelFile(filePath)
        Case ".docx", ".doc"
            ReadFileContent = ReadWordFile(filePath)
        Case Else
            ReadFileContent = ""
    End Select
End Function

Private Function ReadTextFile(filePath As String) As String
    Dim fso As Object, ts As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    ReadTextFile = ts.ReadAll
    ts.Close
End Function

Private Function ReadExcelFile(filePath As String) As String
    On Error GoTo clean
    Dim xlApp As Object, wb As Object, Sh As Object
    Dim content As String, i As Long, j As Long

    Set xlApp = CreateObject("Excel.Application")
    xlApp.DisplayAlerts = False
    Set wb = xlApp.Workbooks.Open(filePath, ReadOnly:=True)

    For Each Sh In wb.Worksheets
        content = content & "Sheet: " & Sh.name & vbCrLf
        For i = 1 To Sh.UsedRange.rows.count
            For j = 1 To Sh.UsedRange.Columns.count
                content = content & Sh.Cells(i, j).value & IIf(j < Sh.UsedRange.Columns.count, vbTab, "")
            Next j
            content = content & vbCrLf
        Next i
    Next Sh

clean:
    On Error Resume Next
    If Not wb Is Nothing Then wb.Close False
    If Not xlApp Is Nothing Then xlApp.Quit
    ReadExcelFile = content
End Function

Private Function ReadWordFile(filePath As String) As String
    On Error GoTo clean
    Dim wdApp As Object, wdDoc As Object
    Set wdApp = CreateObject("Word.Application")
    wdApp.Visible = False
    Set wdDoc = wdApp.Documents.Open(filePath, ReadOnly:=True)
    ReadWordFile = wdDoc.content.text
clean:
    On Error Resume Next
    If Not wdDoc Is Nothing Then wdDoc.Close False
    If Not wdApp Is Nothing Then wdApp.Quit
End Function

' ====== PROMPT BUILDER ======
Function BuildReportPrompt(inspectionData As String) As String
    Dim prompt As String
    prompt = _
      "You are creating a professional 44-point prepurchase vehicle inspection report for Eek Mechanical. " & _
      "The customer has paid for this comprehensive inspection." & vbCrLf & vbCrLf & _
      "IMPORTANT REQUIREMENTS:" & vbCrLf & _
      "1. Include a disclaimer at the very top stating that Eek Mechanical is contracted to write the report, and the attending mechanic is liable for physical checks and tests." & vbCrLf & _
      "2. Executive Summary with price guide and buy/not buy/proceed with caution recommendation" & vbCrLf & _
      "3. Complete 44-point prepurchase inspection report based on the data" & vbCrLf & _
      "4. Maintenance requirements section based on age and condition" & vbCrLf & _
      "5. Recalls section" & vbCrLf & _
      "6. Full summary of CarJam data (valuation at top, then all other sections in order)" & vbCrLf & _
      "7. Include exact copy of glossary after section 6" & vbCrLf & _
      "8. Endnote section with sources (no hyperlinks in body, only at end)" & vbCrLf & _
      "9. Limited liability statement for references" & vbCrLf & vbCrLf & _
      "INSPECTION DATA:" & vbCrLf & inspectionData & vbCrLf & vbCrLf & _
      "Please generate a complete, professional report following the exact structure above. " & _
      "Research current market values, known issues for this vehicle, and maintenance schedules. " & _
      "Format the report professionally with clear sections and headings."
    BuildReportPrompt = prompt
End Function

' ====== ANTHROPIC API ======
Function CallClaudeForReport(prompt As String, apiKey As String) As String
    On Error GoTo ErrorHandler
    If Len(Trim$(apiKey)) = 0 Then
        CallClaudeForReport = "Error: Anthropic API key not set."
        Exit Function
    End If

    Dim http As Object, url As String, requestBody As String, response As String
    Set http = CreateObject("MSXML2.XMLHTTP")
    url = "https://api.anthropic.com/v1/messages"

    ' JSON escape
    prompt = Replace(prompt, """", "\""")
    prompt = Replace(prompt, vbCrLf, "\n")
    prompt = Replace(prompt, vbCr, "\n")
    prompt = Replace(prompt, vbLf, "\n")
    prompt = Replace(prompt, vbTab, "\t")

    requestBody = "{" & _
        """model"": ""claude-3-7-sonnet-20250219""," & _
        """max_tokens"": 8000," & _
        """messages"": [{""role"": ""user"", ""content"": """ & prompt & """}]" & _
    "}"

    With http
        .Open "POST", url, False
        .setRequestHeader "Content-Type", "application/json"
        .setRequestHeader "x-api-key", apiKey
        .setRequestHeader "anthropic-version", "2023-06-01"
        .send requestBody

        If .status = 200 Then
            response = .responseText
            CallClaudeForReport = ExtractContentFromJSON(response)
        Else
            CallClaudeForReport = "Error: HTTP " & .status & " - " & .statusText & vbCrLf & .responseText
        End If
    End With

    Set http = Nothing
    Exit Function
ErrorHandler:
    CallClaudeForReport = "Error: " & Err.description
    Set http = Nothing
End Function

Function ExtractContentFromJSON(jsonString As String) As String
    Dim startPos As Long, endPos As Long, searchStr As String, content As String
    searchStr = """text"":"""
    startPos = InStr(jsonString, searchStr)
    If startPos = 0 Then
        ExtractContentFromJSON = "Could not parse API response"
        Exit Function
    End If
    startPos = startPos + Len(searchStr)
    endPos = startPos
    Do While endPos < Len(jsonString)
        If Mid$(jsonString, endPos, 1) = """" Then
            If Mid$(jsonString, endPos - 1, 1) <> "\" Then Exit Do
        End If
        endPos = endPos + 1
    Loop
    content = Mid$(jsonString, startPos, endPos - startPos)
    content = Replace(content, "\n", vbCrLf)
    content = Replace(content, "\t", vbTab)
    content = Replace(content, "\""", """")
    content = Replace(content, "\\", "\")
    ExtractContentFromJSON = content
End Function

' ====== WORD LAYOUT ======
Sub FormatReportInWord(wordDoc As Object, reportContent As String)
    Dim para As Object, lines() As String, i As Long
    lines = Split(reportContent, vbCrLf)

    For i = 0 To UBound(lines)
        Set para = wordDoc.content.Paragraphs.Add
        para.Range.text = lines(i)

        ' Heuristic heading styling
        If InStr(1, lines(i), "DISCLAIMER", vbTextCompare) > 0 Then
            para.Range.Font.Bold = True: para.Range.Font.Size = 12
        ElseIf InStr(1, lines(i), "EXECUTIVE SUMMARY", vbTextCompare) > 0 Then
            para.Range.Font.Bold = True: para.Range.Font.Size = 14
        ElseIf IsHeading(lines(i)) Then
            para.Range.Font.Bold = True: para.Range.Font.Size = 12
        End If

        para.Range.InsertParagraphAfter
    Next i
End Sub

Function IsHeading(text As String) As Boolean
    IsHeading = (InStr(text, "Section") = 1) Or _
                (InStr(text, "SECTION") = 1) Or _
                (Len(text) > 0 And Right$(text, 1) = ":") Or _
                (InStr(text, "Maintenance") > 0 And Len(text) < 50) Or _
                (InStr(text, "Recalls") > 0 And Len(text) < 30) Or _
                (InStr(text, "Glossary") > 0 And Len(text) < 30)
End Function














