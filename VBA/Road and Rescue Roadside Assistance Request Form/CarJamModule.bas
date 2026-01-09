Attribute VB_Name = "CarJamModule"
' Attribute VB_Name = "CarJamModule"
' Attribute VB_Name = "CarJamModule"
Option Explicit

' ===============================
' CarJam Integration (NZ/AU/Japan) + DESKTOP DEBUG LOGGING
' ===============================
' Effects:
'   - Saves raw JSON/XML in the client folder
'   - Appends summaries to "<REGO> CarJam Report.docx"
'   - Writes debug steps to Desktop\CarJamDebug_<REGO>_<timestamp>.log

' ---- Endpoints ----
Private Const CJ_BASE_NZ As String = "https://www.carjam.co.nz"
Private Const CJ_API_VEHICLE_NZ As String = "/api/car/"
Private Const CJ_API_AVAIL      As String = "/api/availability/"
Private Const CJ_API_AU         As String = "/api/car-au/"
Private Const CJ_A_REPORT_CREATE As String = "/a/report:create"
Private Const CJ_A_REPORT_GET    As String = "/a/report:get"
Private Const CJ_A_VALUATION     As String = "/a/vehicle:valuation"
Private Const CJ_A_JAPAN         As String = "/a/vehicle:japan_lookup"

' ---- Debug globals ----
Private gCJ_DebugOn As Boolean
Private gCJ_DebugFile As String

' ---- Your �always pick� preferences (when availability is vague) ----
Private Const WANT_PPSR As Boolean = True           ' Money Owing
Private Const WANT_OWNERS As Boolean = True         ' Ownership history (s241 prompt required)
Private Const WANT_VALUATION As Boolean = False     ' Market valuation
Private Const WANT_DOGLEMON As Boolean = False
Private Const WANT_OWNERSHIP_GUARANTEE As Boolean = False
Private Const WANT_RUC As Boolean = False

' ===============================
' PUBLIC ENTRY � Dynamic menu (built from availability, with fallback)
' ===============================
Public Sub CarJam_Submenu()
    On Error GoTo ErrHandler
    If selectedJobRego = "" Then
        ShowWarning "Select a Job Rego first."
        Exit Sub
    End If

    CJ_DebugInit selectedJobRego
    CJ_DebugLog "=== CarJam_Submenu start for " & selectedJobRego & " ==="

    ' Read availability (once)
    Dim avail As String: avail = CJ_GetAvailabilityJSON()
    CJ_DebugLog "Availability JSON length: " & Len(avail)
    CJ_DebugLog "Availability JSON (first 1000 chars): " & Left$(avail, 1000)

    ' Capability probes (TRUE if the key appears as true/1/"true")
    Dim capPPSR As Boolean:      capPPSR = CJ_AvailAnyOf(avail, "moneyowing", "ppsr")
    Dim capRUC As Boolean:       capRUC = CJ_AvailAnyOf(avail, "rucs", "ruc", "ruch")
    Dim capOwners As Boolean:    capOwners = CJ_AvailAnyOf(avail, "owners", "ownershiphistory", "ownership_history")
    Dim capValuation As Boolean: capValuation = CJ_AvailAnyOf(avail, "valuation", "marketvaluation", "market_valuation")
    Dim capDog As Boolean:       capDog = CJ_AvailAnyOf(avail, "dogandlemon", "dog_and_lemon")
    Dim capGuarantee As Boolean: capGuarantee = CJ_AvailAnyOf(avail, "ownershipguarantee", "ownership_guarantee", "guarantee")

    ' If API didn�t say, fall back to your prefs
Dim canPPSR As Boolean
Dim canRUC As Boolean
Dim canOwners As Boolean
Dim canValuation As Boolean
Dim canDog As Boolean
Dim canGuarantee As Boolean

canPPSR = IIf(CJ_AvailHasKey(avail, "moneyowing", "ppsr"), capPPSR, WANT_PPSR)
canRUC = IIf(CJ_AvailHasKey(avail, "rucs", "ruc", "ruch"), capRUC, WANT_RUC)
canOwners = IIf(CJ_AvailHasKey(avail, "owners", "ownershiphistory", "ownership_history"), capOwners, WANT_OWNERS)
canValuation = IIf(CJ_AvailHasKey(avail, "valuation", "marketvaluation", "market_valuation"), capValuation, WANT_VALUATION)
canDog = IIf(CJ_AvailHasKey(avail, "dogandlemon", "dog_and_lemon"), capDog, WANT_DOGLEMON)
canGuarantee = IIf(CJ_AvailHasKey(avail, "ownershipguarantee", "ownership_guarantee", "guarantee"), capGuarantee, WANT_OWNERSHIP_GUARANTEE)

    CJ_DebugLog "Flags (after fallback) -> PPSR:" & canPPSR & "  RUC:" & canRUC & _
                "  Owners:" & canOwners & "  Valuation:" & canValuation & _
                "  Dog&Lemon:" & canDog & "  Guarantee:" & canGuarantee

    ' Build menu
    Dim items As New Collection, routes As New Collection
    Dim i As Long, msg As String, choice As String

    If canPPSR Then
        items.Add "NZ Vehicle: PPSR" & IIf(canRUC, " + RUC", "") & " + Warnings (JSON)"
        routes.Add "PPSR"
    End If
    If canOwners Then
        items.Add "NZ Vehicle: Owners (s241) (XML)"
        routes.Add "OWNERS"
    End If

    items.Add "NZ Vehicle: Basic (JSON)"
    routes.Add "BASIC"

    Dim inc As String: inc = "basic, warnings"
    If canPPSR Then inc = "PPSR" & IIf(canRUC, "+RUC", "") & ", " & inc
    If canValuation Then inc = inc & ", valuation"
    If canOwners Then inc = inc & ", ownership history"
    If canDog Then inc = inc & ", Dog & Lemon"
    If canGuarantee Then inc = inc & ", ownership guarantee"

    items.Add "Create Report (async bundle: " & inc & ")"
    routes.Add "REPORT"

    If canValuation Then
        items.Add "Valuation (async JSON)"
        routes.Add "VALUATION"
    End If

    items.Add "Japan Lookup by chassis (JSON)"
    routes.Add "JAPAN"

    items.Add "Australia Vehicle (VIN / Plate+State)"
    routes.Add "AU"

    items.Add "Availability (health)"
    routes.Add "AVAIL"
    
        ' Add All-NZ option (everything except AU/Japan)
    items.Add "ALL NZ DATA (PPSR + RUC + Warnings + Basic + Owners + Valuation + Dog&Lemon + Guarantee)"
    routes.Add "ALLNZ"

    ' Add All option (every endpoint including AU + Japan)
    items.Add "ALL ENDPOINTS (NZ + AU + Japan)"
    routes.Add "ALL"

    CJ_DebugLog "Menu items count: " & items.count
    For i = 1 To items.count
        CJ_DebugLog "  " & i & ": " & items(i) & "  -> route " & CStr(routes(i))
    Next

    ' Render chooser
    msg = "CARJAM LOOKUP MENU for " & selectedJobRego & vbCrLf & vbCrLf
    For i = 1 To items.count
        msg = msg & i & ". " & items(i) & vbCrLf
    Next
    msg = msg & vbCrLf & "Enter option (1-" & items.count & "), 'q' to go back, or 'qq' to exit:"

    choice = InputBox(msg, "CarJam")
    If LCase$(Trim$(choice)) = "qq" Then CJ_DebugLog "User requested exit.": Exit Sub
    If LCase$(Trim$(choice)) = "q" Or Trim$(choice) = "" Then CJ_DebugLog "User cancelled.": Exit Sub
    If Not IsNumeric(choice) Then ShowWarning "Enter a number 1�" & items.count: CJ_DebugLog "Non-numeric choice: " & choice: Exit Sub
    i = CLng(choice)
    If i < 1 Or i > items.count Then ShowWarning "Enter a number 1�" & items.count: CJ_DebugLog "Out-of-range choice: " & i: Exit Sub

    CJ_DebugLog "Routing to: " & CStr(routes(i))
        Select Case CStr(routes(i))
        Case "PPSR":      CJ_Fetch_NZ_PPSR_RUC_Warn selectedJobRego
        Case "OWNERS":    CJ_Fetch_NZ_OwnersXML selectedJobRego
        Case "BASIC":     CJ_Fetch_NZ_Basic selectedJobRego
        Case "REPORT":    CJ_CreateReport_And_Append selectedJobRego
        Case "VALUATION": CJ_Fetch_Valuation selectedJobRego
        Case "JAPAN":     CJ_Fetch_JapanLookup
        Case "AU":        CJ_Fetch_Australia
        Case "AVAIL":     CJ_Fetch_Availability

        Case "ALLNZ"
            CJ_Fetch_NZ_PPSR_RUC_Warn selectedJobRego
            CJ_Fetch_NZ_Basic selectedJobRego
            CJ_Fetch_NZ_OwnersXML selectedJobRego
            CJ_Fetch_Valuation selectedJobRego
            ' Add Dog&Lemon / Guarantee if you later wire those in

        Case "ALL"
            CJ_Fetch_NZ_PPSR_RUC_Warn selectedJobRego
            CJ_Fetch_NZ_Basic selectedJobRego
            CJ_Fetch_NZ_OwnersXML selectedJobRego
            CJ_Fetch_Valuation selectedJobRego
            CJ_Fetch_JapanLookup
            CJ_Fetch_Australia
            CJ_Fetch_Availability
    End Select


    CJ_DebugLog "=== CarJam_Submenu end ==="
    Exit Sub
ErrHandler:
    CJ_DebugLog "ERROR in CarJam_Submenu: " & Err.description
    On Error Resume Next
    LogToRR9998 "CarJam_Submenu error: " & Err.description
End Sub

' ===============================
' Debug helpers (drop-in)
' ===============================
Private Sub CJ_DebugInit(ByVal rego As String)
    On Error Resume Next
    gCJ_DebugOn = True
    Dim desktop As String
    desktop = CreateObject("WScript.Shell").SpecialFolders("Desktop")
    gCJ_DebugFile = desktop & "\CarJamDebug_" & rego & "_" & Format(Now, "yyyymmdd_hhnnss") & ".log"
    Dim ff As Integer: ff = FreeFile
    Open gCJ_DebugFile For Output As #ff
    Print #ff, "CarJam debug started: " & Now
    Close #ff
End Sub

Private Sub CJ_DebugLog(ByVal msg As String)
    On Error Resume Next
    If Not gCJ_DebugOn Then Exit Sub
    Dim ff As Integer: ff = FreeFile
    Open gCJ_DebugFile For Append As #ff
    Print #ff, Format(Now, "hh:nn:ss") & "  " & msg
    Close #ff
End Sub

Private Function CJ_MaskSecrets(ByVal s As String) As String
    On Error Resume Next
    Dim k As String
    CJ_MaskSecrets = s
    k = CJ_GetApiKey():     If k <> "" Then CJ_MaskSecrets = Replace(CJ_MaskSecrets, k, String(Len(k), "*"))
    k = CJ_GetAccountKey(): If k <> "" Then CJ_MaskSecrets = Replace(CJ_MaskSecrets, k, String(Len(k), "*"))
End Function

' Run a URL, save the body, and append a heading to the Word doc
Private Sub CJ_RunAndSave(ByVal url As String, ByVal rego As String, _
                          ByVal fileName As String, ByVal heading As String, _
                          Optional ByVal prettyJson As Boolean = False)
    On Error GoTo ErrHandler
    Dim status As Long, hdrs As String, refresh As Long, body As String
    body = CJ_HttpGET(url, refresh, status, hdrs, True)
    If prettyJson Then body = CJ_PrettyJSON(body)
    CJ_SaveArtifact rego, fileName, body
    CJ_AppendToCarJamDoc rego, heading, "(" & fileName & " saved � length " & Len(body) & ")"
    Exit Sub
ErrHandler:
    CJ_DebugLog "CJ_RunAndSave error: " & Err.description
    On Error Resume Next
    LogToRR9998 "CJ_RunAndSave error for " & url & ": " & Err.description
End Sub

' ===============================
' AVAILABILITY HELPERS (single copy)
' ===============================
Private Function CJ_GetAvailabilityJSON() As String
    Dim url As String
    ' Include account_key to coax full entitlements where required
    url = CJ_BASE_NZ & CJ_API_AVAIL & "?" & CJ_QS("key", CJ_GetApiKey) & _
          "&" & CJ_QS("account_key", CJ_GetAccountKey) & "&f=json"
    CJ_DebugLog "GET Availability: " & CJ_MaskSecrets(url)
    CJ_GetAvailabilityJSON = CJ_HttpGET(url, , , , True)
End Function

' True if ANY of the keys appear with true/1/"true"
Private Function CJ_AvailAnyOf(ByVal json As String, ParamArray keys() As Variant) As Boolean
    On Error Resume Next
    Dim k As Variant, pat As String, re As Object
    Set re = CreateObject("VBScript.RegExp")
    re.IgnoreCase = True: re.Global = False
    For Each k In keys
        pat = """" & CStr(k) & """" & "\s*:\s*(true|1|""true"")"
        re.pattern = pat
        If re.test(json) Then CJ_AvailAnyOf = True: Exit Function
    Next k
End Function

Private Function CJ_AvailTrue(ByVal json As String, ByVal key As String) As Boolean
    CJ_AvailTrue = (InStr(1, LCase$(json), """" & LCase$(key) & """:true", vbTextCompare) > 0)
End Function

' ===============================
' NZ Lookups
' ===============================
Public Sub CJ_Fetch_NZ_Basic(ByVal regoOrVIN As String)
    Dim u As String
    u = CJ_BASE_NZ & CJ_API_VEHICLE_NZ & "?" & _
        CJ_QS("key", CJ_GetApiKey) & "&" & _
        CJ_QS("plate", regoOrVIN) & "&basic=1&translate=1&f=json"
    CJ_DebugLog "Fetch NZ Basic URL: " & CJ_MaskSecrets(u)
    CJ_RunAndSave u, regoOrVIN, "nz_basic.json", "CarJam � NZ Vehicle (Basic)", True
End Sub

Public Sub CJ_Fetch_NZ_PPSR_RUC_Warn(ByVal regoOrVIN As String)
    Dim u As String
    u = CJ_BASE_NZ & CJ_API_VEHICLE_NZ & "?" & _
        CJ_QS("key", CJ_GetApiKey) & "&" & _
        CJ_QS("plate", regoOrVIN) & "&basic=1&ppsr=1&rucs=1&warnings=1&translate=1&f=json"
    CJ_DebugLog "Fetch NZ PPSR/RUC/WARN URL: " & CJ_MaskSecrets(u)
    CJ_RunAndSave u, regoOrVIN, "nz_ppsr_ruc_warn.json", "CarJam � PPSR/RUC/WARN", True
End Sub

' Requires s241 (XML)
Public Sub CJ_Fetch_NZ_OwnersXML(ByVal regoOrVIN As String)
    Dim purpose As String
    purpose = InputBox("Enter s241 purpose (required):", "s241 purpose")
    If Trim$(purpose) = "" Then ShowWarning "No purpose provided.": CJ_DebugLog "OWNERS aborted (no s241 purpose).": Exit Sub

    Dim u As String
    u = CJ_BASE_NZ & CJ_API_VEHICLE_NZ & "?" & _
        CJ_QS("key", CJ_GetApiKey) & "&" & _
        CJ_QS("plate", regoOrVIN) & "&owners=1&" & _
        CJ_QS("s241_purpose", purpose) & "&f=xml"
    CJ_DebugLog "Fetch NZ Owners URL: " & CJ_MaskSecrets(u)
    CJ_RunAndSave u, regoOrVIN, "nz_owners.xml", "CarJam � Owners (s241/XML)", False
End Sub

' ===============================
' Async Report bundle
' ===============================
Public Sub CJ_CreateReport_And_Append(ByVal rego As String)
    Dim avail As String: avail = CJ_GetAvailabilityJSON()

    Dim canPPSR As Boolean:    canPPSR = CJ_AvailTrue(avail, "moneyowing") Or CJ_AvailTrue(avail, "ppsr") Or WANT_PPSR
    Dim canOwnHist As Boolean: canOwnHist = CJ_AvailTrue(avail, "ownershiphistory") Or CJ_AvailTrue(avail, "owners") Or WANT_OWNERS
    Dim canRUC As Boolean:     canRUC = CJ_AvailTrue(avail, "ruc") Or CJ_AvailTrue(avail, "rucs") Or CJ_AvailTrue(avail, "ruch") Or WANT_RUC
    Dim canVal As Boolean:     canVal = CJ_AvailTrue(avail, "valuation") Or WANT_VALUATION

    Dim flags As String, picked As New Collection, s241Purpose As String
    If canPPSR Then flags = flags & "&ppsrf=1": picked.Add "PPSR"
    If canRUC Then flags = flags & "&ruch=1": picked.Add "RUC"
    If canVal Then flags = flags & "&valuation=1": picked.Add "Valuation"
    flags = flags & "&warnings=1"

    If canOwnHist Then
        s241Purpose = InputBox("Enter s241 purpose (required for Ownership History):", "s241 purpose")
        If Trim$(s241Purpose) <> "" Then
            flags = flags & "&owners=1&" & CJ_QS("s241_purpose", s241Purpose)
            picked.Add "Ownership History"
        End If
    End If

    CJ_DebugLog "Report flags: " & flags
    If Len(flags) = 0 Then
        ShowWarning "No report sections available."
        CJ_DebugLog "Report aborted: no flags."
        Exit Sub
    End If

    Dim createUrl As String
    createUrl = CJ_BASE_NZ & CJ_A_REPORT_CREATE & "?" & _
                CJ_QS("key", CJ_GetApiKey) & "&" & _
                CJ_QS("account_key", CJ_GetAccountKey) & "&" & _
                CJ_QS("plate", rego) & _
                "&basic=1" & flags & "&f=json"
    CJ_DebugLog "Report:create URL: " & CJ_MaskSecrets(createUrl)

    Dim body As String
    body = CJ_HttpGET(createUrl, , , , True)
    If body = "" Then ShowWarning "No response from report:create": CJ_DebugLog "Empty response from report:create": Exit Sub

    Dim ref As String: ref = CJ_ExtractJsonValue(body, "ref")
    CJ_DebugLog "Report ref: " & ref
    If ref = "" Then
        LogToRR9998 "Report create response: " & body
        CJ_DebugLog "No ref in create response. Body(first 1000): " & Left$(body, 1000)
        ShowWarning "Could not get report ref."
        Exit Sub
    End If

    ' Poll
    Dim pollUrl As String, tries As Long, refreshSec As Long, ok As Boolean
    pollUrl = CJ_BASE_NZ & CJ_A_REPORT_GET & "?" & CJ_QS("key", CJ_GetApiKey) & "&" & CJ_QS("ref", ref)
    CJ_DebugLog "Report:get URL: " & CJ_MaskSecrets(pollUrl)

    For tries = 1 To 15
        body = CJ_HttpGET(pollUrl, refreshSec, , , True)
        CJ_DebugLog "Poll #" & tries & " refreshSec=" & refreshSec & " bodyLen=" & Len(body)
        If InStr(1, body, """completed"":true", vbTextCompare) > 0 Then ok = True: Exit For
        If refreshSec <= 0 Then refreshSec = 2
        Application.Wait Now + TimeSerial(0, 0, refreshSec)
    Next tries

    Dim fn As String: fn = "report_" & rego & "_" & ref & ".json"
    CJ_SaveArtifact rego, fn, body
    CJ_DebugLog "Saved bundle JSON -> " & fn

    Dim listTxt As String, i As Long
    For i = 1 To picked.count
        listTxt = listTxt & picked(i) & IIf(i < picked.count, ", ", "")
    Next i

    Dim gist As String
    gist = CJ_ShortGistFromReport(body) & vbCrLf & "(Included: " & listTxt & ")"
    CJ_AppendToCarJamDoc rego, "CarJam Report (" & ref & ")", gist

    If ok Then
        ShowStatus "Report saved and appended." & vbCrLf & "Included: " & listTxt
    Else
        ShowWarning "Report did not complete in time. Raw saved." & vbCrLf & "Included: " & listTxt
    End If
End Sub

' ===============================
' Other endpoints
' ===============================
Public Sub CJ_Fetch_Valuation(ByVal regoOrVIN As String)
    Dim url As String, body As String, refreshSec As Long, tries As Long
    url = CJ_BASE_NZ & CJ_A_VALUATION & "?" & CJ_QS("key", CJ_GetApiKey) & "&" & CJ_QS("plate", regoOrVIN)
    CJ_DebugLog "Valuation URL: " & CJ_MaskSecrets(url)
    For tries = 1 To 12
        body = CJ_HttpGET(url, refreshSec, , , True)
        If body <> "null" And Len(Trim$(body)) > 0 Then Exit For
        If refreshSec <= 0 Then refreshSec = 2
        Application.Wait Now + TimeSerial(0, 0, refreshSec)
    Next tries
    CJ_SaveArtifact regoOrVIN, "valuation.json", CJ_PrettyJSON(body)
    CJ_AppendToCarJamDoc regoOrVIN, "CarJam Valuation", CJ_SummariseValuation(body)
End Sub

Public Sub CJ_Fetch_JapanLookup()
    Dim chassis As String
    chassis = InputBox("Enter JDM chassis:", "Japan Lookup")
    If Trim$(chassis) = "" Then CJ_DebugLog "Japan lookup aborted (no chassis).": Exit Sub

    Dim url As String, body As String, refreshSec As Long, tries As Long
    url = CJ_BASE_NZ & CJ_A_JAPAN & "?" & CJ_QS("key", CJ_GetApiKey) & "&" & CJ_QS("chassis", chassis)
    CJ_DebugLog "Japan lookup URL: " & CJ_MaskSecrets(url)
    For tries = 1 To 12
        body = CJ_HttpGET(url, refreshSec, , , True)
        If body <> "null" And Len(Trim$(body)) > 0 Then Exit For
        If refreshSec <= 0 Then refreshSec = 2
        Application.Wait Now + TimeSerial(0, 0, refreshSec)
    Next tries
    CJ_SaveArtifact selectedJobRego, "japan_lookup.json", CJ_PrettyJSON(body)
    CJ_AppendToCarJamDoc selectedJobRego, "Japan Lookup (" & chassis & ")", CJ_SummariseJapan(body)
End Sub

Public Sub CJ_Fetch_Australia()
    Dim mode As String, vin As String, plate As String, state As String, url As String
    mode = InputBox("AU Lookup:" & vbCrLf & "1 = VIN" & vbCrLf & "2 = Plate+State", "Australia")
    If mode = "1" Then
        vin = InputBox("Enter VIN:", "AU VIN")
        If Trim$(vin) = "" Then CJ_DebugLog "AU VIN aborted (empty).": Exit Sub
        url = CJ_BASE_NZ & CJ_API_AU & "?" & CJ_QS("key", CJ_GetApiKey) & "&query_type=VDBC&" & CJ_QS("vin", vin) & "&f=json"
    ElseIf mode = "2" Then
        plate = InputBox("Enter Plate:", "AU Plate")
        state = InputBox("Enter State:", "AU State")
        If Trim$(plate) = "" Or Trim$(state) = "" Then CJ_DebugLog "AU Plate/State aborted (missing).": Exit Sub
        url = CJ_BASE_NZ & CJ_API_AU & "?" & CJ_QS("key", CJ_GetApiKey) & "&" & CJ_QS("plate", plate) & "&" & CJ_QS("state", state) & "&query_type=VDBC&f=json"
    Else
        CJ_DebugLog "AU selection cancelled.": Exit Sub
    End If
    CJ_DebugLog "AU URL: " & CJ_MaskSecrets(url)
    Dim body As String
    body = CJ_HttpGET(url, , , , True)
    CJ_SaveArtifact selectedJobRego, "au_vehicle.json", CJ_PrettyJSON(body)
    CJ_AppendToCarJamDoc selectedJobRego, "Australia Vehicle", CJ_SummariseAU(body)
End Sub

Public Sub CJ_Fetch_Availability()
    Dim url As String, body As String
    url = CJ_BASE_NZ & CJ_API_AVAIL & "?" & CJ_QS("key", CJ_GetApiKey) & _
          "&" & CJ_QS("account_key", CJ_GetAccountKey) & "&f=json"
    CJ_DebugLog "Availability (manual) URL: " & CJ_MaskSecrets(url)
    body = CJ_HttpGET(url, , , , True)
    CJ_SaveArtifact selectedJobRego, "availability.json", body
    CJ_AppendToCarJamDoc selectedJobRego, "CarJam Availability", body
End Sub

' ===============================
' HTTP + helpers
' ===============================
Private Function CJ_HttpGET(ByVal url As String, Optional ByRef refreshSecs As Long, _
                            Optional ByRef httpStatus As Long, Optional ByRef respHeaders As String, _
                            Optional ByVal trace As Boolean = False) As String
    On Error GoTo ErrHandler
    Dim http As Object
    Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    http.Open "GET", url, False
    http.setRequestHeader "Accept", "*/*"
    http.send
    httpStatus = http.status
    respHeaders = http.GetAllResponseHeaders
    If trace Then CJ_DebugLog "HTTP GET " & CJ_MaskSecrets(url) & " -> " & httpStatus & "  RefreshHint:" & CJ_ParseRefreshSeconds(respHeaders)
    CJ_HttpGET = http.responseText
    refreshSecs = CJ_ParseRefreshSeconds(respHeaders)
    Exit Function
ErrHandler:
    CJ_DebugLog "HTTP GET error for " & CJ_MaskSecrets(url) & ": " & Err.description
    On Error Resume Next
    LogToRR9998 "HTTP GET error for " & url & ": " & Err.description
End Function

Private Function CJ_ParseRefreshSeconds(ByVal headers As String) As Long
    Dim i As Long
    i = InStr(1, headers, "Refresh:", vbTextCompare)
    If i > 0 Then
        Dim l As String, v As String
        l = Mid$(headers, i, InStr(i, headers, vbCrLf) - i)
        v = Trim$(Replace(l, "Refresh:", "", , , vbTextCompare))
        If IsNumeric(v) Then CJ_ParseRefreshSeconds = CLng(v)
    End If
End Function

Private Function CJ_QS(ByVal k As String, ByVal v As String) As String
    CJ_QS = k & "=" & CJ_UrlEncode(v)
End Function

Private Function CJ_UrlEncode(ByVal s As String) As String
    Dim i As Long, ch As String, o As String
    For i = 1 To Len(s)
        ch = Mid$(s, i, 1)
        Select Case AscW(ch)
            Case 48 To 57, 65 To 90, 97 To 122: o = o & ch
            Case Else: o = o & "%" & Right$("0" & Hex(AscW(ch)), 2)
        End Select
    Next i
    CJ_UrlEncode = o
End Function

' ===============================
' Storage + Word append
' ===============================
Private Function CJ_ClientFolder(ByVal rego As String) As String
    Dim base As String, fs As Object
    base = GetRRFilePath("PREPURCHASE INSPECTIONS\" & rego, True)
    Set fs = CreateObject("Scripting.FileSystemObject")
    Dim f As Object
    For Each f In fs.GetFolder(base).SubFolders
        If InStr(1, f.name, "PrePurchase", vbTextCompare) > 0 Then
            CJ_ClientFolder = f.path: Exit Function
        End If
    Next f
    CJ_ClientFolder = base
End Function

Private Function CJ_CarJamDocPath(ByVal rego As String) As String
    CJ_CarJamDocPath = CJ_ClientFolder(rego) & "\" & rego & " CarJam Report.docx"
End Function

Private Sub CJ_SaveArtifact(ByVal rego As String, ByVal fileName As String, ByVal content As String)
    On Error Resume Next
    Dim p As String, ff As Integer
    p = CJ_ClientFolder(rego) & "\" & fileName
    ff = FreeFile
    Open p For Output As #ff
    Print #ff, content
    Close #ff
    CJ_DebugLog "Saved artifact: " & p & " (len=" & Len(content) & ")"
    LogToRR9998 "Saved CarJam artifact: " & p
End Sub

Private Sub CJ_AppendToCarJamDoc(ByVal rego As String, ByVal heading As String, ByVal bodyText As String)
    On Error GoTo ErrHandler
    Dim docPath As String: docPath = CJ_CarJamDocPath(rego)
    Dim wd As Object, doc As Object, rng As Object
    Set wd = CreateObject("Word.Application")
    wd.Visible = False

    If Dir(docPath) <> "" Then
        Set doc = wd.Documents.Open(docPath)
    Else
        Set doc = wd.Documents.Add
        doc.content.InsertAfter rego & " � CarJam Report" & vbCrLf
        doc.Paragraphs.Last.Range.Style = "Title"
        doc.content.InsertParagraphAfter
        doc.content.InsertAfter "Generated: " & Format(Now, "yyyy-mm-dd hh:nn") & vbCrLf
        doc.Paragraphs.Last.Range.Style = "Subtitle"
        doc.content.InsertParagraphAfter
    End If

    Set rng = doc.content
    rng.SetRange Start:=doc.content.End - 1, End:=doc.content.End - 1
    rng.InsertParagraphAfter
    rng.InsertAfter heading & vbCrLf
    rng.Style = doc.Styles("Heading 2")
    rng.InsertParagraphAfter
    rng.InsertAfter bodyText & vbCrLf
    rng.InsertParagraphAfter

    If Dir(docPath) = "" Then
        doc.SaveAs2 docPath, 12
    Else
        doc.Save
    End If
    doc.Close False: wd.Quit
    CJ_DebugLog "Updated CarJam doc: " & docPath
    Exit Sub
ErrHandler:
    CJ_DebugLog "AppendToCarJamDoc error: " & Err.description
    On Error Resume Next
    LogToRR9998 "CJ_AppendToCarJamDoc error: " & Err.description
End Sub

' ===============================
' Summarisers
' ===============================
Private Function CJ_ShortGistFromReport(ByVal json As String) As String
    Dim make As String, model As String, year As String, vin As String
    Dim ppsr As String, ruc As String, odo As String
    Dim valLow As String, valHigh As String, regoExp As String, wofExp As String

    make = CJ_ExtractJsonValue(json, "make")
    model = CJ_ExtractJsonValue(json, "model")
    year = CJ_ExtractJsonValue(json, "year_of_manufacture")
    vin = CJ_ExtractJsonValue(json, "vin")

    ppsr = CJ_ExtractJsonValue(json, "ppsr_status"): If ppsr = "" Then ppsr = "Unknown"
    ruc = CJ_ExtractJsonValue(json, "ruc_expiry"):    If ruc = "" Then ruc = "N/A"

    odo = CJ_ExtractJsonValue(json, "odometer_reading")
    If odo <> "" Then odo = odo & " km" Else odo = "N/A"

    valLow = CJ_ExtractJsonValue(json, "value_low")
    valHigh = CJ_ExtractJsonValue(json, "value_high")
    Dim valText As String: valText = IIf(valLow <> "" And valHigh <> "", "NZ$" & valLow & " � NZ$" & valHigh, "N/A")

    regoExp = CJ_ExtractJsonValue(json, "rego_expiry")
    wofExp = CJ_ExtractJsonValue(json, "warrant_expiry")

    CJ_ShortGistFromReport = _
        "Vehicle: " & year & " " & make & " " & model & IIf(vin <> "", " (VIN " & vin & ")", "") & vbCrLf & _
        "� PPSR (finance owing): " & ppsr & vbCrLf & _
        "� RUC Expiry: " & ruc & vbCrLf & _
        "� Odometer: " & odo & vbCrLf & _
        "� Valuation Range: " & valText & vbCrLf & _
        "� Registration Expiry: " & IIf(regoExp <> "", regoExp, "N/A") & vbCrLf & _
        "� WOF/COF Expiry: " & IIf(wofExp <> "", wofExp, "N/A") & vbCrLf & _
        "(Full JSON saved in client folder)"
End Function

' ==== Valuation: show candidate variants + range ====
Private Function CJ_SummariseValuation(ByVal json As String) As String
    On Error Resume Next

    Dim errMsg As String
    If CJ_IsJsonError(json, errMsg) Then
        CJ_SummariseValuation = "ERROR (Valuation): " & errMsg
        Exit Function
    End If

    ' Collect candidate names (several possible fields)
    Dim names As New Collection, nm As Variant
    Dim nameHits As Collection
    Set nameHits = CJ_RegexFindAll(json, """" & "(variant_name|variant|title|submodel|grade|name)" & """" & "\s*:\s*""([^""]+)""", 1)
    For Each nm In nameHits: names.Add nm: Next

    ' Collect prices: dealer_current_price first, fallback to dgest
    Dim prices As New Collection, priceStr As Variant
    For Each priceStr In CJ_RegexFindAll(json, """dealer_current_price""\s*:\s*([0-9]+)", 0)
        prices.Add CJ_ToNumber(priceStr)
    Next
    If prices.count = 0 Then
        For Each priceStr In CJ_RegexFindAll(json, """dgest""\s*:\s*([0-9]+)", 0)
            prices.Add CJ_ToNumber(priceStr)
        Next
    End If

    If names.count = 0 And prices.count = 0 Then
        CJ_SummariseValuation = "(No valuation variants available.)"
        Exit Function
    End If

    ' Pair up to the smaller count; compute overall range across all prices
    Dim n As Long, i As Long
    n = IIf(names.count > prices.count, prices.count, names.count)

    Dim lo As Double: lo = 1E+99
    Dim hi As Double: hi = -1
    For i = 1 To prices.count
        If prices(i) < lo Then lo = prices(i)
        If prices(i) > hi Then hi = prices(i)
    Next i

    ' Build a small sortable array
    Dim cnt As Long: cnt = IIf(n > 64, 64, n)
    Dim arr() As Variant: ReDim arr(1 To cnt, 1 To 2)
    For i = 1 To cnt
        arr(i, 1) = names(i)
        arr(i, 2) = prices(i)
    Next i

    ' Sort by price asc
    Dim a As Long, b As Long, tmpN As Variant, tmpP As Variant
    For a = 1 To cnt - 1
        For b = a + 1 To cnt
            If arr(a, 2) > arr(b, 2) Then
                tmpN = arr(a, 1): tmpP = arr(a, 2)
                arr(a, 1) = arr(b, 1): arr(a, 2) = arr(b, 2)
                arr(b, 1) = tmpN: arr(b, 2) = tmpP
            End If
        Next b
    Next a

    ' Compose output
    Dim out As String, show As Long
    If prices.count > 0 Then
        out = "Estimated price range: NZ$" & Format$(lo, "#,##0") & "�NZ$" & Format$(hi, "#,##0") & vbCrLf
    End If

    If cnt > 0 Then
        out = out & "Valuation candidates (by price):" & vbCrLf
        show = IIf(cnt > 8, 8, cnt)
        For i = 1 To show
            out = out & "  " & i & ") NZ$" & Format$(arr(i, 2), "#,##0") & " � " & arr(i, 1) & vbCrLf
        Next i
        If cnt > show Then out = out & "  � plus " & (cnt - show) & " more variants in JSON." & vbCrLf
    End If

    CJ_SummariseValuation = Trim$(out)
End Function



Private Function CJ_SummariseJapan(ByVal json As String) As String
    Dim mk As String, md As String
    mk = CJ_ExtractJsonValue(json, "make")
    md = CJ_ExtractJsonValue(json, "model")
    CJ_SummariseJapan = "Japan lookup candidate: " & mk & " " & md & "."
End Function

Private Function CJ_SummariseAU(ByVal json As String) As String
    Dim mk As String, md As String, y As String
    mk = CJ_ExtractJsonValue(json, "make")
    md = CJ_ExtractJsonValue(json, "model")
    y = CJ_ExtractJsonValue(json, "year")
    CJ_SummariseAU = "AU vehicle: " & y & " " & mk & " " & md & "."
End Function

' ===============================
' JSON helpers
' ===============================
Private Function CJ_PrettyJSON(ByVal s As String) As String
    Dim i As Long, c As String, q As Boolean, esc As Boolean, ind As Long, o As String
    For i = 1 To Len(s)
        c = Mid$(s, i, 1)
        If esc Then
            o = o & c: esc = False
        ElseIf c = "\" Then
            o = o & c: esc = True
        ElseIf c = """" Then
            q = Not q: o = o & c
        ElseIf Not q And (c = "{" Or c = "[") Then
            ind = ind + 1: o = o & c & vbCrLf & String(ind * 2, " ")
        ElseIf Not q And (c = "}" Or c = "]") Then
            ind = ind - 1: o = RTrim$(o) & vbCrLf & String(ind * 2, " ") & c
        ElseIf Not q And c = "," Then
            o = o & c & vbCrLf & String(ind * 2, " ")
        ElseIf Not q And c = ":" Then
            o = o & ": "
        Else
            o = o & c
        End If
    Next i
    CJ_PrettyJSON = o
End Function

Private Function CJ_ExtractJsonValue(ByVal json As String, ByVal key As String) As String
    On Error Resume Next
    Dim pat As String, m As Object, re As Object
    pat = """" & key & """" & "\s*:\s*(""([^""]*)""|([^\s,}\]]+))"
    Set re = CreateObject("VBScript.RegExp")
    re.pattern = pat: re.IgnoreCase = True: re.Global = False
    If re.test(json) Then
        Set m = re.Execute(json)(0)
        If m.SubMatches(1) <> "" Then
            CJ_ExtractJsonValue = m.SubMatches(1)
        Else
            CJ_ExtractJsonValue = m.SubMatches(2)
        End If
    End If
End Function

' ===============================
' Secrets (keys) � single source
' ===============================
Private Function CJ_GetApiKey() As String
    CJ_GetApiKey = "F66F35CFE7F3E07E6D76349139A2672B56ECCF5B"
End Function

Private Function CJ_GetAccountKey() As String
    CJ_GetAccountKey = "A53E5F3EC26689AB674DA30E3CAFEFFD645BA4D0"
End Function

Private Function CJ_AvailHasKey(ByVal json As String, ParamArray keys() As Variant) As Boolean
    On Error Resume Next
    Dim k As Variant, re As Object
    Set re = CreateObject("VBScript.RegExp")
    re.IgnoreCase = True: re.Global = False
    For Each k In keys
        re.pattern = """" & CStr(k) & """" & "\s*:"
        If re.test(json) Then CJ_AvailHasKey = True: Exit Function
    Next k
End Function

' ---- tiny helpers for parsing lists ----
Private Function CJ_RegexFindAll(ByVal s As String, ByVal pattern As String, ByVal groupIdx As Long) As Collection
    On Error Resume Next
    Dim re As Object, m As Object
    Set re = CreateObject("VBScript.RegExp")
    re.IgnoreCase = True: re.Global = True
    re.pattern = pattern
    Set CJ_RegexFindAll = New Collection
    For Each m In re.Execute(s)
        CJ_RegexFindAll.Add m.SubMatches(groupIdx)
    Next
End Function

Private Function CJ_ToNumber(ByVal s As String) As Double
    On Error Resume Next
    CJ_ToNumber = CDbl(val(s))
End Function

' ==== Error detection helpers (JSON & XML) ====
Private Function CJ_IsJsonError(ByVal s As String, ByRef msgOut As String) As Boolean
    On Error Resume Next
    Dim c As String, m As String
    c = CJ_ExtractJsonValue(s, "code")
    m = CJ_ExtractJsonValue(s, "message")
    ' Treat negative numeric codes as errors; adjust if your API differs
    If c <> "" And IsNumeric(c) And CLng(c) < 0 Then
        CJ_IsJsonError = True
        msgOut = IIf(m <> "", m, "Unknown API error")
    End If
End Function

Private Function CJ_ParseXmlError(ByVal xml As String) As String
    On Error Resume Next
    Dim re As Object: Set re = CreateObject("VBScript.RegExp")
    re.pattern = "<message>([\s\S]*?)</message>"
    re.IgnoreCase = True: re.Global = False
    If re.test(xml) Then CJ_ParseXmlError = re.Execute(xml)(0).SubMatches(0)
End Function













