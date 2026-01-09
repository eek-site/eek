Attribute VB_Name = "aaaallsubstopdf"
' Attribute VB_Name = "aaaallsubstopdf"
' Attribute VB_Name = "aaaallsubstopdf"
Option Explicit

' Requires: your GetRRFilePath(relativePath As String, Optional CreateFolder As Boolean) function.

Public Sub BuildSinglePageHTMLDump()
    Dim fso As Object, ts As Object
    Dim fileName As String
    Dim proj As Object, comp As Object, cm As Object
    Dim i As Long, totalLines As Long
    Dim includeLineNumbers As Boolean: includeLineNumbers = True  ' toggle

    ' Make sure programmatic access is allowed (Trust Center setting)
    ' If not, the next line may fail when touching VBProject.
    On Error GoTo SecErr
    Set proj = ThisWorkbook.VBProject
    On Error GoTo 0

    ' Output path (OneDrive via your helper). Creates "Exports" if missing.
    fileName = GetRRFilePath("Exports\AllVBA_SinglePage.html", True)

    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.CreateTextFile(fileName, True, True) ' overwrite, Unicode

    ' ---------- HTML HEAD ----------
    ts.WriteLine "<!doctype html>"
    ts.WriteLine "<html lang=""en""><head><meta charset=""utf-8"">"
    ts.WriteLine "<title>All VBA Code — " & HtmlEncode(ThisWorkbook.name) & "</title>"
    ts.WriteLine "<style>"
    ts.WriteLine "  :root{--fg:#111;--muted:#666;--bg:#fff;--border:#e5e7eb;}"
    ts.WriteLine "  body{margin:24px;background:var(--bg);color:var(--fg);font:14px/1.45 ui-monospace,Consolas,Menlo,monospace;}"
    ts.WriteLine "  h1{font:600 20px/1.2 ui-sans-serif,system-ui,Segoe UI,Arial;margin:0 0 8px}"
    ts.WriteLine "  .meta{color:var(--muted);margin:0 0 18px}"
    ts.WriteLine "  .block{border:1px solid var(--border);border-radius:12px;margin:16px 0;overflow:hidden}"
    ts.WriteLine "  .hdr{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);background:#fafafa}"
    ts.WriteLine "  .name{font-weight:600}"
    ts.WriteLine "  .type{color:var(--muted)}"
    ts.WriteLine "  pre{margin:0;padding:14px 16px;white-space:pre;overflow:auto}"
    ts.WriteLine "  code{font:13px/1.5 ui-monospace,Consolas,Menlo,monospace}"
    ts.WriteLine "  @media print{@page{size: 1200mm 4000mm; margin:10mm} body{font-size:10px}}"
    ts.WriteLine "</style></head><body>"

    ' Title/meta
    ts.WriteLine "<h1>All VBA Code Snapshot</h1>"
    ts.WriteLine "<p class=""meta"">Workbook: <strong>" & HtmlEncode(ThisWorkbook.fullName) & _
                 "</strong><br>Date: " & HtmlEncode(Format(Now, "yyyy-mm-dd hh:nn:ss")) & _
                 "<br>Excel Version: " & HtmlEncode(Application.Version) & "</p>"

    ' ---------- Iterate components ----------
    For Each comp In proj.VBComponents
        Set cm = comp.codeModule
        totalLines = cm.CountOfLines
        WriteComponentBlock ts, CStr(comp.name), ComponentKind(comp), cm, totalLines, includeLineNumbers
    Next comp

    ' Footer
    ts.WriteLine "<p class=""meta"">End of dump.</p>"
    ts.WriteLine "</body></html>"
    ts.Close

    MsgBox "Single-page HTML created:" & vbCrLf & fileName & vbCrLf & _
           vbCrLf & "Open in browser ? Print ? Save as PDF.", vbInformation
    Exit Sub

SecErr:
    MsgBox "Excel is blocking access to the VBA project." & vbCrLf & _
           "Enable: File ? Options ? Trust Center ? Trust Center Settings… ? Macro Settings ?" & vbCrLf & _
           "? Trust access to the VBA project object model", vbExclamation
End Sub

' ---------- Helpers ----------

Private Sub WriteComponentBlock(ByVal ts As Object, ByVal compName As String, ByVal kind As String, _
                                ByVal cm As Object, ByVal totalLines As Long, ByVal addLineNos As Boolean)
    Dim i As Long, lineText As String
    ts.WriteLine "<section class=""block"">"
    ts.WriteLine "  <div class=""hdr""><div class=""name"">" & HtmlEncode(compName) & "</div>" & _
                 "<div class=""type"">" & HtmlEncode(kind) & " • " & totalLines & " lines</div></div>"
    ts.WriteLine "  <pre><code>"
    If totalLines > 0 Then
        For i = 1 To totalLines
            lineText = cm.lines(i, 1)
            If addLineNos Then
                ts.WriteLine HtmlEncode(Format$(i, "00000") & ": " & lineText)
            Else
                ts.WriteLine HtmlEncode(lineText)
            End If
        Next i
    End If
    ts.WriteLine "  </code></pre>"
    ts.WriteLine "</section>"
End Sub

Private Function ComponentKind(ByVal comp As Object) As String
    On Error Resume Next
    Select Case comp.Type
        Case 1: ComponentKind = "Standard Module"
        Case 2: ComponentKind = "Class Module"
        Case 3: ComponentKind = "UserForm (code only)"
        Case 100: ComponentKind = "Document Module (Sheet/ThisWorkbook)"
        Case Else: ComponentKind = "Other"
    End Select
End Function

Private Function HtmlEncode(ByVal s As String) As String
    If Len(s) = 0 Then
        HtmlEncode = ""
    Else
        HtmlEncode = Replace(Replace(Replace(Replace(s, "&", "&amp;"), "<", "&lt;"), ">", "&gt;"), """", "&quot;")
    End If
End Function














