Attribute VB_Name = "Module1"
' Attribute VB_Name = "Module1"
' Attribute VB_Name = "Module1"
'==============================
' Forman Pacific – Data Mapper (Corrected)
' Map Data! ? Consolidated (Format schema),
' validate against Schema!, and normalize
' for SharePoint List field types. SharePoint-ready.
'==============================
Option Explicit

' ======== TYPES (must be at top) ========
Public Type MapperConfig
    SourceSheet As String
    TargetSheet As String
    FormatSheet As String
    SchemaSheet As String
    ErrorsSheet As String
    ProcessOnlySelection As Boolean
    WriteHeadersToTarget As Boolean
End Type

' Using a lightweight dictionary per field instead of a UDT to avoid
' "Only user-defined types ... can be coerced" errors with Variants.
' Each schema entry is stored as: schema(name) -> Dict with keys
'   "datatype" (String), "required" (Boolean), "choices" (Variant array)

' ======== PUBLIC ENTRYPOINTS ========
Public Sub MapAndValidate_All()
    Dim cfg As MapperConfig
    cfg = DefaultConfig()          ' UDT assigns by value (no Set)
    RunMapping cfg
End Sub

Public Sub MapAndValidate_OnlySelected()
    Dim cfg As MapperConfig
    cfg = DefaultConfig()
    cfg.ProcessOnlySelection = True
    RunMapping cfg
End Sub

' ======== CONFIG ========
Private Function DefaultConfig() As MapperConfig
    Dim c As MapperConfig
    c.SourceSheet = "Data"
    c.TargetSheet = "Forman Pacific Consolidated Bra"
    c.FormatSheet = "Format"
    c.SchemaSheet = "Schema"
    c.ErrorsSheet = "Errors"
    c.ProcessOnlySelection = False
    c.WriteHeadersToTarget = True
    DefaultConfig = c
End Function

' ======== CORE ========
Private Sub RunMapping(ByRef cfg As MapperConfig)
    Dim wsS As Worksheet, wsT As Worksheet, wsFmt As Worksheet, wsSch As Worksheet, wsErr As Worksheet
    Set wsS = SheetByName(cfg.SourceSheet)
    Set wsT = SheetByName(cfg.TargetSheet)
    Set wsFmt = SheetByName(cfg.FormatSheet)
    Set wsSch = SheetByName(cfg.SchemaSheet)
    If wsS Is Nothing Or wsT Is Nothing Or wsFmt Is Nothing Or wsSch Is Nothing Then
        Err.Raise vbObjectError + 1100, , "One or more sheets missing. Expected sheets: '" & cfg.SourceSheet & "', '" & cfg.TargetSheet & "', '" & cfg.FormatSheet & "', '" & cfg.SchemaSheet & "'."
    End If

    ' Prepare Errors sheet
    On Error Resume Next
    Set wsErr = SheetByName(cfg.ErrorsSheet)
    If wsErr Is Nothing Then Set wsErr = ThisWorkbook.Worksheets.Add(After:=wsT): wsErr.name = cfg.ErrorsSheet
    On Error GoTo 0
    InitErrorsSheet wsErr

    Dim tgtHeaders() As String: tgtHeaders = ReadHeaders(wsFmt)
    If cfg.WriteHeadersToTarget Then WriteHeaders wsT, tgtHeaders

    Dim srcHeaders() As String: srcHeaders = ReadHeaders(wsS)

    Dim map As Object: Set map = BuildAutoMap(srcHeaders, tgtHeaders)
    ApplyManualOverrides map

    Dim schema As Object: Set schema = LoadSchema(wsSch)

    Dim rStart As Long, rEnd As Long
    rStart = 2
    If cfg.ProcessOnlySelection Then
        If TypeName(Selection) = "Range" Then
            rStart = Selection.Row
            rEnd = Selection.rows(Selection.rows.count).Row
        Else
            rEnd = LastRowAny(wsS)
        End If
    Else
        rEnd = LastRowAny(wsS)
    End If

    Dim outRow As Long: outRow = 2
    Dim r As Long
    For r = rStart To rEnd
        If RowIsEmpty(wsS, r) Then GoTo nextRow

        Dim outValues() As Variant
        ReDim outValues(1 To UBound(tgtHeaders) + 1)

        Dim i As Long, tName As String, sIdx As Long, rawVal As Variant, normVal As Variant
        For i = LBound(tgtHeaders) To UBound(tgtHeaders)
            tName = tgtHeaders(i)
            sIdx = 0
            If map.Exists(NormKey(tName)) Then sIdx = map(NormKey(tName))

            If sIdx > 0 Then
                rawVal = wsS.Cells(r, sIdx).value
            Else
                rawVal = Empty
            End If

            normVal = NormalizeBySchema(tName, rawVal, schema)
            outValues(i + 1) = normVal

            ValidateBySchema wsErr, r, tName, rawVal, normVal, schema
        Next i

        ' Derived fills (names)
        DerivedNameFills wsS, r, tgtHeaders, outValues

        ' Write row
        wsT.Range(wsT.Cells(outRow, 1), wsT.Cells(outRow, UBound(tgtHeaders) + 1)).value = outValues
        outRow = outRow + 1
nextRow:
    Next r

    AutoFitAll wsT
    MsgBox "Mapping complete ? " & (outRow - 2) & " rows written to '" & wsT.name & "'." & vbCrLf & _
           "See '" & wsErr.name & "' for any validation issues.", vbInformation
End Sub

' ======== MAPPING ========
Private Function BuildAutoMap(ByRef srcHeaders() As String, ByRef tgtHeaders() As String) As Object
    Dim dict As Object: Set dict = CreateObject("Scripting.Dictionary")
    dict.CompareMode = vbTextCompare

    Dim srcIndex As Object: Set srcIndex = CreateObject("Scripting.Dictionary")
    Dim i As Long
    For i = LBound(srcHeaders) To UBound(srcHeaders)
        If Len(Trim$(srcHeaders(i))) > 0 Then
            srcIndex(NormKey(srcHeaders(i))) = i + 1 ' 1-based column index
        End If
    Next i

    Dim t As Long, key As String
    For t = LBound(tgtHeaders) To UBound(tgtHeaders)
        key = NormKey(tgtHeaders(t))
        If srcIndex.Exists(key) Then
            dict(key) = srcIndex(key)
        Else
            dict(key) = 0
        End If
    Next t

    Set BuildAutoMap = dict
End Function

Private Sub ApplyManualOverrides(ByRef map As Object)
    Dim wsS As Worksheet: Set wsS = SheetByName("Data")
    Dim srcHeaders() As String: srcHeaders = ReadHeaders(wsS)

    SetMapByHeader map, srcHeaders, "Start time", "StartTime"
    SetMapByHeader map, srcHeaders, "Completion time", "CompletionTime"
    SetMapByHeader map, srcHeaders, "Country Code", "CountryCode"
    SetMapByHeader map, srcHeaders, "Caller phone", "CallerPhone"
    SetMapByHeader map, srcHeaders, "Service Required", "ServiceRequired"
    SetMapByHeader map, srcHeaders, "From Location", "FromLocation"
    SetMapByHeader map, srcHeaders, "To Location (if applicable)", "ToLocation"
    SetMapByHeader map, srcHeaders, "Tyre Size (if applicable)", "TyreSize"
    SetMapByHeader map, srcHeaders, "Payment method", "PaymentMethod"
    SetMapByHeader map, srcHeaders, "Inv Nbr", "InvNbr"
    SetMapByHeader map, srcHeaders, "Staff Member", "SellerName"
    SetMapByHeader map, srcHeaders, "Staff Cost", "SupplierCost"
    SetMapByHeader map, srcHeaders, "Supplier Name", "SupplierName"
    SetMapByHeader map, srcHeaders, "Net Income", "NetIncome"
    SetMapByHeader map, srcHeaders, "Price Estimate", "Price"
    SetMapByHeader map, srcHeaders, "Price2", "TotalPrice"
    SetMapByHeader map, srcHeaders, "Amt Pd", "PaidAmount"
    SetMapByHeader map, srcHeaders, "Date Pd", "Paid"
    SetMapByHeader map, srcHeaders, "Account2", "BankAccount"
    SetMapByHeader map, srcHeaders, "Ref_Pmt", "StripePaymentID"
    SetMapByHeader map, srcHeaders, "Invoice Status", "PaymentStatus"
    SetMapByHeader map, srcHeaders, "Xero Ref", "InvoiceIdentifier"
    SetMapByHeader map, srcHeaders, "Job Text Sent", "TextFlag"
    SetMapByHeader map, srcHeaders, "BackCallLink", "CallAttemptId"
    SetMapByHeader map, srcHeaders, "Job_Support_Open", "JobStatus"
    SetMapByHeader map, srcHeaders, "Concat_Nbr", "SessionID"
    SetMapByHeader map, srcHeaders, "Reference", "PrimaryReference"
    SetMapByHeader map, srcHeaders, "To", "CustomerAddress"
    SetMapByHeader map, srcHeaders, "Email2", "SupplierEmail"
    SetMapByHeader map, srcHeaders, "Issue Date", "InvoiceDate"
    SetMapByHeader map, srcHeaders, "Due Date", "RequestedDate"
End Sub

Private Sub SetMapByHeader(ByRef map As Object, ByRef srcHeaders() As String, ByVal srcHeader As String, ByVal targetHeader As String)
    Dim idx As Long: idx = FindHeaderIndex(srcHeaders, srcHeader)
    If idx > 0 Then map(NormKey(targetHeader)) = idx
End Sub

' ======== VALIDATION / NORMALIZATION ========
Private Function NormalizeBySchema(ByVal fieldName As String, ByVal v As Variant, ByRef schema As Object) As Variant
    Dim s As String: s = Trim$(ToString(v))
    If Len(s) = 0 Then
        NormalizeBySchema = Empty
        Exit Function
    End If

    Dim f As Object
    If schema.Exists(NormKey(fieldName)) Then
        Set f = schema(NormKey(fieldName))
    Else
        NormalizeBySchema = s
        Exit Function
    End If

    Dim dt As String: dt = LCase$(CStr(f("datatype")))
    Select Case dt
        Case "datetime"
            NormalizeBySchema = ToISODateTime(s)
        Case "date"
            NormalizeBySchema = ToISODateOnly(s)
        Case "boolean"
            NormalizeBySchema = ToBooleanText(s)
        Case "number", "integer", "currency"
            NormalizeBySchema = ToNumeric(s, dt = "integer")
        Case "email"
            NormalizeBySchema = LCase$(s)
        Case "phone"
            NormalizeBySchema = NormalizePhone(s)
        Case "choice"
            NormalizeBySchema = MatchChoice(s, f("choices"))
        Case "multichoice"
            NormalizeBySchema = MatchMultiChoice(s, f("choices"))
        Case Else
            NormalizeBySchema = s
    End Select
End Function

Private Sub ValidateBySchema(ByRef wsErr As Worksheet, ByVal srcRow As Long, ByVal fieldName As String, ByVal rawVal As Variant, ByVal normVal As Variant, ByRef schema As Object)
    If Not schema.Exists(NormKey(fieldName)) Then Exit Sub
    Dim f As Object: Set f = schema(NormKey(fieldName))

    Dim hasVal As Boolean: hasVal = (Len(Trim$(ToString(normVal))) > 0)

    If CBool(f("required")) And Not hasVal Then
        LogErr wsErr, srcRow, fieldName, "Required field is blank", rawVal
        Exit Sub
    End If

    Dim dt As String: dt = LCase$(CStr(f("datatype")))
    Select Case dt
        Case "datetime"
            If hasVal And Not LooksLikeDateTime(ToString(normVal)) Then LogErr wsErr, srcRow, fieldName, "Invalid DateTime", rawVal
        Case "date"
            If hasVal And Not LooksLikeDate(ToString(normVal)) Then LogErr wsErr, srcRow, fieldName, "Invalid Date", rawVal
        Case "boolean"
            If hasVal Then
                Dim ub As String: ub = UCase$(ToString(normVal))
                If Not (ub = "TRUE" Or ub = "FALSE") Then LogErr wsErr, srcRow, fieldName, "Invalid Boolean (expect TRUE/FALSE)", rawVal
            End If
        Case "number", "integer", "currency"
            If hasVal And Not IsNumeric(normVal) Then LogErr wsErr, srcRow, fieldName, "Invalid Number", rawVal
        Case "email"
            If hasVal And InStr(1, ToString(normVal), "@") = 0 Then LogErr wsErr, srcRow, fieldName, "Invalid Email", rawVal
        Case "phone"
            If hasVal And Len(Replace(ToString(normVal), " ", "")) < 6 Then LogErr wsErr, srcRow, fieldName, "Phone too short", rawVal
        Case "choice"
            If hasVal And Not InChoices(ToString(normVal), f("choices")) Then LogErr wsErr, srcRow, fieldName, "Value not in choices", rawVal
        Case "multichoice"
            If hasVal Then
                Dim parts() As String: parts = SplitMulti(ToString(normVal))
                Dim i As Long
                For i = LBound(parts) To UBound(parts)
                    If Not InChoices(parts(i), f("choices")) Then
                        LogErr wsErr, srcRow, fieldName, "MultiChoice contains invalid option: " & parts(i), rawVal
                    End If
                Next i
            End If
    End Select
End Sub

' ======== SCHEMA HELPERS ========
Private Function LoadSchema(ByRef ws As Worksheet) As Object
    Dim dict As Object: Set dict = CreateObject("Scripting.Dictionary")
    dict.CompareMode = vbTextCompare

    Dim rLast As Long: rLast = lastRow(ws)

    Dim hdr() As String: hdr = ReadHeaders(ws)
    Dim cNameCol&, dtCol&, reqCol&, choicesCol&
    cNameCol = FindHeaderIndex(hdr, "Column Name")
    dtCol = FindHeaderIndex(hdr, "Data Type")
    reqCol = FindHeaderIndex(hdr, "Required")
    choicesCol = FindHeaderIndex(hdr, "Choices")

    Dim r As Long
    For r = 2 To rLast
        Dim name As String, dt As String, req As String, choices As String
        name = Trim$(ToString(ws.Cells(r, cNameCol).value))
        If Len(name) = 0 Then GoTo nextRow
        dt = Trim$(ToString(ws.Cells(r, dtCol).value))
        req = Trim$(ToString(ws.Cells(r, reqCol).value))
        choices = Trim$(ToString(ws.Cells(r, choicesCol).value))

        Dim f As Object: Set f = CreateObject("Scripting.Dictionary")
        f.CompareMode = vbTextCompare
        f("datatype") = dt
        f("required") = (UCase$(req) = "YES" Or UCase$(req) = "TRUE" Or req = "1")
        If Len(choices) > 0 Then
            f("choices") = SplitChoices(choices) ' Variant array
        Else
            f("choices") = Empty
        End If
        Set dict(NormKey(name)) = f
nextRow:
    Next r

    Set LoadSchema = dict
End Function

Private Function SplitChoices(ByVal s As String) As String()
    Dim tmp As String: tmp = Replace(Replace(Replace(s, vbCr, ","), vbLf, ","), ";", ",")
    tmp = Replace(tmp, "|", ",")
    tmp = Replace(tmp, "/", ",")
    SplitChoices = SplitAndTrim(tmp, ",")
End Function

' ======== NORMALIZATION HELPERS ========
Private Function ToISODateTime(ByVal s As String) As String
    Dim d As Date
    On Error Resume Next
    d = CDate(s)
    On Error GoTo 0
    If d = 0 Then
        ToISODateTime = s
    Else
        ToISODateTime = Format$(d, "yyyy-mm-dd hh:nn:ss")
    End If
End Function

Private Function ToISODateOnly(ByVal s As String) As String
    Dim d As Date
    On Error Resume Next
    d = CDate(s)
    On Error GoTo 0
    If d = 0 Then
        ToISODateOnly = s
    Else
        ToISODateOnly = Format$(d, "yyyy-mm-dd")
    End If
End Function

Private Function ToBooleanText(ByVal s As String) As String
    Dim u As String: u = UCase$(Trim$(s))
    Select Case u
        Case "TRUE", "YES", "Y", "1": ToBooleanText = "TRUE"
        Case "FALSE", "NO", "N", "0": ToBooleanText = "FALSE"
        Case Else: ToBooleanText = s
    End Select
End Function

Private Function ToNumeric(ByVal s As String, Optional asInteger As Boolean = False) As Variant
    Dim t As String: t = s
    t = Replace(t, ",", "")
    t = Replace(t, "$", "")
    t = Replace(t, "L", "")
    t = Replace(t, "NZD", "")
    t = Trim$(t)
    If IsNumeric(t) Then
        If asInteger Then
            ToNumeric = CLng(t)
        Else
            ToNumeric = CDbl(t)
        End If
    Else
        ToNumeric = s
    End If
End Function

Private Function NormalizePhone(ByVal s As String) As String
    Dim t As String: t = s
    t = Replace(t, " ", "")
    t = Replace(t, "-", "")
    t = Replace(t, "(", "")
    t = Replace(t, ")", "")
    t = Replace(t, ".", "")
    If Left$(t, 3) = "+64" Then t = Mid$(t, 4)
    If Left$(t, 2) = "64" Then t = Mid$(t, 3)
    NormalizePhone = t
End Function

Private Function MatchChoice(ByVal s As String, ByRef choices As Variant) As String
    If IsArray(choices) Then
        Dim i As Long
        For i = LBound(choices) To UBound(choices)
            If StrComp(Trim$(s), choices(i), vbTextCompare) = 0 Then
                MatchChoice = choices(i): Exit Function
            End If
        Next i
    End If
    MatchChoice = s
End Function

Private Function MatchMultiChoice(ByVal s As String, ByRef choices As Variant) As String
    Dim parts() As String: parts = SplitMulti(s)
    Dim i As Long
    For i = LBound(parts) To UBound(parts)
        parts(i) = MatchChoice(parts(i), choices)
    Next i
    MatchMultiChoice = Join(parts, "; ")
End Function

Private Function SplitMulti(ByVal s As String) As String()
    Dim tmp As String: tmp = Replace(Replace(Replace(s, vbCr, ","), vbLf, ","), ";", ",")
    tmp = Replace(tmp, "|", ",")
    SplitMulti = SplitAndTrim(tmp, ",")
End Function

Private Function InChoices(ByVal val As String, ByRef arr As Variant) As Boolean
    Dim i As Long
    If IsArray(arr) Then
        For i = LBound(arr) To UBound(arr)
            If StrComp(Trim$(val), arr(i), vbTextCompare) = 0 Then InChoices = True: Exit Function
        Next i
    End If
End Function

Private Sub DerivedNameFills(ByRef wsS As Worksheet, ByVal r As Long, ByRef tgtHeaders() As String, ByRef outValues() As Variant)
    Dim idxFirst As Long: idxFirst = FindInArray(tgtHeaders, "FirstName")
    Dim idxLast As Long: idxLast = FindInArray(tgtHeaders, "LastName")
    Dim idxName As Long: idxName = FindInArray(tgtHeaders, "CustomerName")

    Dim haveFirst As Boolean: haveFirst = (idxFirst > 0 And Len(ToString(outValues(idxFirst + 1))) > 0)
    Dim haveLast As Boolean: haveLast = (idxLast > 0 And Len(ToString(outValues(idxLast + 1))) > 0)

    If Not haveFirst Or Not haveLast Then
        Dim s As String
        s = Trim$(ToString(FindSourceCell(wsS, r, "Name1").value))
        If Len(s) = 0 Then s = Trim$(ToString(FindSourceCell(wsS, r, "Name").value))
        If Len(s) > 0 Then
            Dim f As String, l As String
            SplitName s, f, l
            If idxFirst > 0 And Not haveFirst Then outValues(idxFirst + 1) = f
            If idxLast > 0 And Not haveLast Then outValues(idxLast + 1) = l
            If idxName > 0 And Len(ToString(outValues(idxName + 1))) = 0 Then outValues(idxName + 1) = s
        End If
    End If
End Sub

Private Sub SplitName(ByVal fullName As String, ByRef firstOut As String, ByRef lastOut As String)
    Dim parts() As String: parts = Split(Trim$(fullName), " ")
    If UBound(parts) < 0 Then
        firstOut = fullName
        lastOut = ""
    Else
        firstOut = parts(0)
        lastOut = Join(Slice(parts, 1), " ")
    End If
End Sub

' ======== ERRORS ========
Private Sub InitErrorsSheet(ByRef ws As Worksheet)
    ws.Cells.Clear
    ws.Range("A1:D1").value = Array("SourceRow", "Field", "Issue", "RawValue")
    ws.rows(1).Font.Bold = True
End Sub

Private Sub LogErr(ByRef ws As Worksheet, ByVal srcRow As Long, ByVal fieldName As String, ByVal issue As String, ByVal rawVal As Variant)
    Dim r As Long: r = lastRow(ws) + 1
    ws.Cells(r, 1).value = srcRow
    ws.Cells(r, 2).value = fieldName
    ws.Cells(r, 3).value = issue
    ws.Cells(r, 4).value = rawVal
End Sub

' ======== GENERIC UTILS ========
Private Function SheetByName(ByVal name As String) As Worksheet
    On Error Resume Next
    Set SheetByName = ThisWorkbook.Worksheets(name)
    On Error GoTo 0
End Function

Private Function ReadHeaders(ByRef ws As Worksheet) As String()
    Dim cLast As Long: cLast = LastCol(ws)
    Dim arr() As String
    Dim i As Long
    ReDim arr(0 To cLast - 1)
    For i = 1 To cLast
        arr(i - 1) = Trim$(ToString(ws.Cells(1, i).value))
    Next i
    ReadHeaders = arr
End Function

Private Sub WriteHeaders(ByRef ws As Worksheet, ByRef headers() As String)
    ws.Cells.Clear
    Dim i As Long
    For i = LBound(headers) To UBound(headers)
        ws.Cells(1, i + 1).value = headers(i)
    Next i
    ws.rows(1).Font.Bold = True
    ws.rows(1).Interior.Color = RGB(230, 242, 255)
End Sub

Private Function lastRow(ByRef ws As Worksheet) As Long
    On Error Resume Next
    lastRow = ws.Cells.Find(What:="*", After:=ws.Cells(1, 1), LookIn:=xlFormulas, _
                            LookAt:=xlPart, SearchOrder:=xlByRows, SearchDirection:=xlPrevious).Row
    If lastRow = 0 Then lastRow = 1
    On Error GoTo 0
End Function

Private Function LastCol(ByRef ws As Worksheet) As Long
    On Error Resume Next
    LastCol = ws.Cells.Find(What:="*", After:=ws.Cells(1, 1), LookIn:=xlFormulas, _
                            LookAt:=xlPart, SearchOrder:=xlByColumns, SearchDirection:=xlPrevious).Column
    If LastCol = 0 Then LastCol = 1
    On Error GoTo 0
End Function

Private Function LastRowAny(ByRef ws As Worksheet) As Long
    LastRowAny = lastRow(ws)
End Function

Private Function RowIsEmpty(ByRef ws As Worksheet, ByVal r As Long) As Boolean
    RowIsEmpty = (WorksheetFunction.CountA(ws.rows(r)) = 0)
End Function

Private Function NormKey(ByVal s As String) As String
    Dim t As String
    t = LCase$(Trim$(s))
    t = Replace(t, " ", "")
    t = Replace(t, "-", "")
    t = Replace(t, "_", "")
    t = Replace(t, "(", "")
    t = Replace(t, ")", "")
    NormKey = t
End Function

Private Function ToString(ByVal v As Variant) As String
    If IsError(v) Then
        ToString = ""
    ElseIf IsNull(v) Then
        ToString = ""
    Else
        ToString = CStr(v)
    End If
End Function

Private Function LooksLikeDateTime(ByVal s As String) As Boolean
    On Error Resume Next
    Dim d As Date: d = CDate(s)
    LooksLikeDateTime = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Private Function LooksLikeDate(ByVal s As String) As Boolean
    LooksLikeDate = LooksLikeDateTime(s)
End Function

Private Function SplitAndTrim(ByVal s As String, ByVal delim As String) As String()
    Dim raw() As String: raw = Split(s, delim)
    Dim i As Long
    For i = LBound(raw) To UBound(raw)
        raw(i) = Trim$(raw(i))
    Next i
    SplitAndTrim = raw
End Function

Private Function FindHeaderIndex(ByRef headers() As String, ByVal name As String) As Long
    Dim i As Long
    For i = LBound(headers) To UBound(headers)
        If StrComp(headers(i), name, vbTextCompare) = 0 Then
            FindHeaderIndex = i + 1
            Exit Function
        End If
    Next i
    FindHeaderIndex = 0
End Function

Private Function FindInArray(ByRef arr() As String, ByVal value As String) As Long
    Dim i As Long
    For i = LBound(arr) To UBound(arr)
        If StrComp(arr(i), value, vbTextCompare) = 0 Then
            FindInArray = i + 1
            Exit Function
        End If
    Next i
    FindInArray = 0
End Function

Private Function Slice(a() As String, ByVal startIdx As Long) As String()
    Dim n As Long: n = UBound(a) - startIdx + 1
    If n <= 0 Then
        Dim emptyArr() As String
        Slice = emptyArr
        Exit Function
    End If
    Dim i As Long
    ReDim b(0 To n - 1) As String
    For i = 0 To n - 1
        b(i) = a(startIdx + i)
    Next i
    Slice = b
End Function

Private Sub AutoFitAll(ByRef ws As Worksheet)
    ws.Cells.EntireColumn.AutoFit
End Sub

Private Function FindSourceCell(ByRef ws As Worksheet, ByVal r As Long, ByVal headerName As String) As Range
    Dim headers() As String: headers = ReadHeaders(ws)
    Dim c As Long: c = FindHeaderIndex(headers, headerName)
    If c > 0 Then
        Set FindSourceCell = ws.Cells(r, c)
    Else
        Set FindSourceCell = ws.Cells(r, 1)
    End If
End Function

' ======== POST-MAP CONFORMANCE (match Format!row 2) ========
Public Sub ConformToFormatRow2()
    ' UDT-free version to avoid "User-defined type not defined" in some environments
    Const TARGET_SHEET As String = "Forman Pacific Consolidated Bra"
    Const FORMAT_SHEET As String = "Format"
    Const SCHEMA_SHEET As String = "Schema"

    Dim wsT As Worksheet, wsFmt As Worksheet, wsSch As Worksheet
    Set wsT = SheetByName(TARGET_SHEET)
    Set wsFmt = SheetByName(FORMAT_SHEET)
    Set wsSch = SheetByName(SCHEMA_SHEET)
    If wsT Is Nothing Or wsFmt Is Nothing Or wsSch Is Nothing Then
        MsgBox "Missing expected sheets.", vbExclamation: Exit Sub
    End If

    Dim schema As Object: Set schema = LoadSchema(wsSch)

    Dim fmtHdr() As String: fmtHdr = ReadHeaders(wsFmt)
    Dim tgtHdr() As String: tgtHdr = ReadHeaders(wsT)

    Dim colByName As Object: Set colByName = CreateObject("Scripting.Dictionary")
    colByName.CompareMode = vbTextCompare

    Dim c As Long
    For c = LBound(tgtHdr) To UBound(tgtHdr)
        If Len(tgtHdr(c)) > 0 Then colByName(NormKey(tgtHdr(c))) = c + 1
    Next c

    Dim lastRow As Long: lastRow = lastRow(wsT)

    Dim h As Long, tCol As Long, fCol As Long, r As Long
    Dim tName As String, exemplar As Variant, raw As Variant, shaped As Variant

    For h = LBound(fmtHdr) To UBound(fmtHdr)
        tName = fmtHdr(h)
        If Len(tName) = 0 Then GoTo nextHeader
        If Not colByName.Exists(NormKey(tName)) Then GoTo nextHeader

        tCol = colByName(NormKey(tName))
        fCol = h + 1
        exemplar = wsFmt.Cells(2, fCol).value

        ' Pre-set number format per exemplar
        ApplyColumnFormatFromExemplar wsT.Columns(tCol), exemplar

        For r = 2 To lastRow
            raw = wsT.Cells(r, tCol).value
            shaped = ShapeToExemplar(tName, raw, exemplar, schema)
            wsT.Cells(r, tCol).value = shaped
        Next r
nextHeader:
    Next h

    AutoFitAll wsT
    MsgBox "Conformance pass complete (matched to Format!row 2 patterns).", vbInformation
End Sub

' ======== END ========














