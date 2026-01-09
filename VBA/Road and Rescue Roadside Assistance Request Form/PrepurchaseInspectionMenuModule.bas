Attribute VB_Name = "PrepurchaseInspectionMenuModule"
' Attribute VB_Name = "PrepurchaseInspectionMenuModule"
' Attribute VB_Name = "PrepurchaseInspectionMenuModule"
' ===============================
' PREPURCHASE INSPECTION MENU SYSTEM
' EEK Mechanical - Seller Communication Module
' ===============================

Option Explicit

' ===============================
' DATA STRUCTURES (UDTs) & ENUMS
' (Public + at top of a STANDARD module; no duplicates anywhere)
' ===============================
Public Type SellerInfo
    name As String
    phone As String
    year As String
    ScheduledDate As String
    ScheduledTime As String
    jobRego As String
    currentETA As String
    WorksheetRow As Long
End Type

Public Type SupplierInfo
    name As String
    Mobile As String
    IsValid As Boolean
End Type

Public Type NotificationMessage
    Subject As String
    body As String
    modeLine As String
End Type

Public Enum DeliveryModeEnum
    dmNone = 0
    dmMobileEnRoute = 1
    dmVisitWorkshop = 2
End Enum

' ===============================
' CONSTANTS
' ===============================
Private Const DEFAULT_COUNTRY_CODE As String = "+64"
Private Const SMS_GATEWAY As String = "@sms.tnz.co.nz"
Private Const COMPANY_SIGNATURE As String = "EEK Mechanical" & vbCrLf & "www.eek.nz"
Private Const NO_REPLY_EMAIL As String = "no-reply@eek.nz"
Private Const INSPECTION_DURATION As String = "30 minutes"

' Worksheet column constants (Book a Job)
Private Const COL_SELLER_DATA As String = "L"        ' SELLER|Name|Phone|Year|Date|Time
Private Const COL_VEHICLE_REGO As String = "V"       ' Rego
Private Const COL_ETA_MINUTES As String = "U"        ' ETA minutes
Private Const COL_JOB_REGO As String = "N"           ' Optional second rego
Private Const COL_JOB_TYPE As String = "J"           ' Job Type
Private Const JOB_TYPE_PPI As String = "Pre Purchase Vehicle Inspection"

' Job Build Notes columns (used for fallback supplier)
Private Const COL_SUPPLIER_REGO As Long = 6          ' F
Private Const COL_SUPPLIER_NAME As Long = 8          ' H
Private Const COL_SUPPLIER_MOBILE As Long = 25       ' Y

' Log files
Private Const LOG_CALL_SELLER As String = "PPI_CallSellerLog.txt"
Private Const LOG_EN_ROUTE As String = "PPI_EnRouteSellerLog.txt"
Private Const LOG_REVISED_ETA As String = "PPI_RevisedETASellerLog.txt"
Private Const LOG_MANUAL_MESSAGE As String = "PPI_SellerReplyLog.txt"

' ===============================
' MAIN MENU (exits after one action)
' ===============================
Function PrepurchaseInspectionMenu() As Boolean
    On Error GoTo ErrHandler
    
    ' TRACK MENU SELECTION
    currentMenuSelection = 29
    currentSubMenuSelection = 0

    OpenJobRegister "PPI"
    LaunchOutlook
    If selectedJobRego = "" Then PrepurchaseInspectionMenu = False: Exit Function

    Dim userInput As String
    userInput = InputBox( _
        "PREPURCHASE INSPECTION MENU (Seller Communications)" & vbCrLf & vbCrLf & _
        "1. Call Seller" & vbCrLf & _
        "2. Notify Seller: Mechanic En Route / Visit Workshop" & vbCrLf & _
        "3. Send Revised ETA to Seller" & vbCrLf & _
        "4. Send Manual Text to Seller" & vbCrLf & _
        "5. Prepare Inspection Folder" & vbCrLf & _
        "6. Send Seller Details to Mechanic" & vbCrLf & _
        "7. CarJam Lookup" & vbCrLf & _
        "8. Generate Prepurchase Report" & vbCrLf & vbCrLf & _
        "Enter option (1-8), 'q' to go back, or 'qq' to exit:", _
        "PPI Menu - EEK Mechanical")
    
    ' TRACK SUBMENU SELECTION
    currentSubMenuSelection = val(userInput)

    Select Case LCase$(Trim$(userInput))
        Case "qq": PrepurchaseInspectionMenu = True: Exit Function  ' Exit system
        Case "q", "": PrepurchaseInspectionMenu = False: Exit Function  ' Go back to previous menu
        Case "1": ExecuteCallSeller:                     PrepurchaseInspectionMenu = False: Exit Function
        Case "2": ExecuteNotifySellerEnRoute:            PrepurchaseInspectionMenu = False: Exit Function
        Case "3": ExecuteRevisedETA:                     PrepurchaseInspectionMenu = False: Exit Function
        Case "4": ExecuteManualMessage:                  PrepurchaseInspectionMenu = False: Exit Function
        Case "5": PPI_SetupInspectionFolder:             PrepurchaseInspectionMenu = False: Exit Function
        Case "6": PPI_SendSellerDetailsToMechanic:       PrepurchaseInspectionMenu = False: Exit Function
        Case "7": CarJam_Submenu:                        PrepurchaseInspectionMenu = False: Exit Function
        Case "8": GeneratePrepurchaseReport:             PrepurchaseInspectionMenu = False: Exit Function
        Case Else
            MsgBox "Invalid selection. Please enter 1�8, q, or qq.", vbExclamation, "Invalid Option"
            PrepurchaseInspectionMenu = False: Exit Function
    End Select
    PrepurchaseInspectionMenu = False
    Exit Function
ErrHandler:
    LogError "PrepurchaseInspectionMenu", Err.description
    PrepurchaseInspectionMenu = False
End Function

' ===============================
' OPTION 1: CALL SELLER
' ===============================
Private Sub ExecuteCallSeller()
    On Error GoTo ErrHandler
    Dim si As SellerInfo
    If Not GetValidatedSellerData(si) Then Exit Sub

    Dim telUri As String
    telUri = BuildTelephoneUri(si.phone)
    If telUri = "" Then
        ShowErrorMessage "Invalid or missing seller phone number"
        LogAction LOG_CALL_SELLER, "Failed - invalid phone for rego: " & selectedJobRego
        Exit Sub
    End If

    ActiveWorkbook.FollowHyperlink address:=telUri, NewWindow:=True
    LogAction LOG_CALL_SELLER, "Call launched: " & telUri & " for rego: " & selectedJobRego
    Exit Sub
ErrHandler:
    LogError "ExecuteCallSeller", Err.description, LOG_CALL_SELLER
End Sub

' ===============================
' OPTION 2: NOTIFY SELLER (EN ROUTE / VISIT WORKSHOP)
' ===============================
Private Sub ExecuteNotifySellerEnRoute()
    On Error GoTo ErrHandler

    Dim si As SellerInfo
    If Not GetValidatedSellerData(si) Then Exit Sub

    Dim mode As DeliveryModeEnum
    mode = GetDeliveryMode()
    If mode = dmNone Then Exit Sub

    Dim sup As SupplierInfo
    GetSupplierInformation si.jobRego, sup

    Dim timeInfo As String
    timeInfo = GetTimeInformation(mode, si)
    If timeInfo = "" Then
        LogAction LOG_EN_ROUTE, "Cancelled - no time info provided"
        Exit Sub
    End If

    If mode = dmMobileEnRoute Then UpdateETAInWorksheet timeInfo

    Dim msg As NotificationMessage
    msg = BuildNotificationMessage(si, mode, timeInfo, sup)

    If SendSellerNotification(si.phone, msg) Then
        MsgBox "Seller notification sent successfully.", vbInformation, "Message Sent"
        LogAction LOG_EN_ROUTE, "Sent to " & BuildSmsGatewayAddress(si.phone) & " | " & msg.modeLine
    Else
        ShowErrorMessage "Failed to send seller notification"
        LogAction LOG_EN_ROUTE, "Failed during send operation"
    End If
    Exit Sub
ErrHandler:
    LogError "ExecuteNotifySellerEnRoute", Err.description, LOG_EN_ROUTE
End Sub

' ===============================
' OPTION 3: REVISED ETA TO SELLER
' ===============================
Private Sub ExecuteRevisedETA()
    On Error GoTo ErrHandler

    Dim si As SellerInfo
    If Not GetValidatedSellerData(si) Then Exit Sub

    Dim newETA As String
    newETA = GetRevisedETA(si.currentETA)
    If newETA = "" Then
        LogAction LOG_REVISED_ETA, "Cancelled - no ETA provided"
        Exit Sub
    End If

    UpdateETAInWorksheet newETA

    Dim msg As NotificationMessage
    msg = BuildRevisedETAMessage(si.name, newETA)

    If SendSellerNotification(si.phone, msg) Then
        MsgBox "Revised ETA sent to seller successfully.", vbInformation, "ETA Updated"
        LogAction LOG_REVISED_ETA, "Sent to: " & BuildSmsGatewayAddress(si.phone) & " for Rego " & selectedJobRego
    Else
        ShowErrorMessage "Failed to send revised ETA"
        LogAction LOG_REVISED_ETA, "Failed during send operation"
    End If
    Exit Sub
ErrHandler:
    LogError "ExecuteRevisedETA", Err.description, LOG_REVISED_ETA
End Sub

' ===============================
' OPTION 4: MANUAL MESSAGE TO SELLER
' ===============================
Private Sub ExecuteManualMessage()
    On Error GoTo ErrHandler

    Dim si As SellerInfo
    If Not GetValidatedSellerData(si) Then Exit Sub

    Dim customText As String
    customText = InputBox("Enter your custom message for the seller:" & vbCrLf & vbCrLf & _
                          "Enter 'qq' to exit completely", "Custom Seller Message")
    If LCase$(Trim$(customText)) = "qq" Then Exit Sub

    If Trim$(customText) = "" Then
        MsgBox "No message entered. Operation cancelled.", vbInformation, "Cancelled"
        LogAction LOG_MANUAL_MESSAGE, "Cancelled - no message provided"
        Exit Sub
    End If

    Dim msg As NotificationMessage
    msg = BuildCustomMessage(customText)

    If SendSellerNotification(si.phone, msg) Then
        MsgBox "Manual message sent to seller successfully.", vbInformation, "Message Sent"
        LogAction LOG_MANUAL_MESSAGE, "Sent to " & BuildSmsGatewayAddress(si.phone) & " | Rego: " & selectedJobRego
    Else
        ShowErrorMessage "Failed to send manual message"
        LogAction LOG_MANUAL_MESSAGE, "Failed during send operation"
    End If
    Exit Sub
ErrHandler:
    LogError "ExecuteManualMessage", Err.description, LOG_MANUAL_MESSAGE
End Sub

' ===============================
' CORE BUSINESS LOGIC
' ===============================
Private Function GetValidatedSellerData(ByRef sellerData As SellerInfo) As Boolean
    On Error GoTo ErrHandler
    If selectedJobRego = "" Then Exit Function

    Dim ws As Worksheet
    Set ws = GetWorksheet("Book a Job")
    If ws Is Nothing Then Exit Function

    Dim r As Long
    r = FindPPIRegistrationRow(ws, selectedJobRego) ' yellow + PPI in col J
    If r = 0 Then Exit Function

    If Not ParseSellerInformation(ws, r, sellerData) Then Exit Function

    sellerData.jobRego = GetCellValue(ws, r, COL_JOB_REGO)
    If sellerData.jobRego = "" Then sellerData.jobRego = selectedJobRego
    sellerData.currentETA = GetCellValue(ws, r, COL_ETA_MINUTES)
    sellerData.WorksheetRow = r

    GetValidatedSellerData = True
    Exit Function
ErrHandler:
    GetValidatedSellerData = False
End Function

' V matches rego; J = PPI; J is yellow
Private Function FindPPIRegistrationRow(ws As Worksheet, rego As String) As Long
    Dim lastRow As Long, r As Long
    lastRow = ws.Cells(ws.rows.count, COL_VEHICLE_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If StrComp(Trim$(CStr(ws.Cells(r, COL_VEHICLE_REGO).value)), Trim$(rego), vbTextCompare) = 0 Then
            If StrComp(Trim$(CStr(ws.Cells(r, COL_JOB_TYPE).value)), JOB_TYPE_PPI, vbTextCompare) = 0 Then
                If IsYellow(ws.Cells(r, COL_JOB_TYPE)) Then
                    FindPPIRegistrationRow = r: Exit Function
                End If
            End If
        End If
    Next r
End Function

Private Function IsYellow(c As Range) As Boolean
    Dim clr As Long: clr = c.Interior.Color
    Select Case clr
        Case vbYellow, RGB(255, 255, 0), RGB(255, 255, 153), RGB(255, 242, 204)
            IsYellow = True
    End Select
End Function

' ===============================
' USER PROMPTS
' ===============================
Private Function GetDeliveryMode() As DeliveryModeEnum
    Dim s As String
    s = InputBox("Select delivery method:" & vbCrLf & vbCrLf & _
                 "1. Mobile mechanic en route to seller" & vbCrLf & _
                 "2. Seller visits workshop" & vbCrLf & vbCrLf & _
                 "Enter 'qq' to exit completely", _
                 "Delivery Method Selection")
    If LCase$(Trim$(s)) = "qq" Then GetDeliveryMode = dmNone: Exit Function
    If Trim$(s) = "" Then GetDeliveryMode = dmNone: Exit Function

    If IsNumeric(s) Then
        Select Case CLng(s)
            Case 1: GetDeliveryMode = dmMobileEnRoute
            Case 2: GetDeliveryMode = dmVisitWorkshop
            Case Else: MsgBox "Invalid selection. Choose 1 or 2.", vbExclamation: GetDeliveryMode = dmNone
        End Select
    Else
        MsgBox "Invalid selection. Choose 1 or 2.", vbExclamation
        GetDeliveryMode = dmNone
    End If
End Function

' UDTs must be ByRef
Private Function GetTimeInformation(ByVal mode As DeliveryModeEnum, ByRef si As SellerInfo) As String
    Dim prompt As String, title As String, defaultValue As String
    If mode = dmMobileEnRoute Then
        prompt = "Enter estimated arrival time (minutes):" & vbCrLf & vbCrLf & "Enter 'qq' to exit completely"
        title = "ETA (Minutes)": defaultValue = si.currentETA
    Else
        prompt = "Enter appointment window or arrival time:" & vbCrLf & _
                 "Example: 'Friday 29 Aug, 10:00�11:00'" & vbCrLf & vbCrLf & "Enter 'qq' to exit completely"
        title = "Appointment Window"
        defaultValue = IIf(si.ScheduledDate <> "" And si.ScheduledTime <> "", si.ScheduledDate & " " & si.ScheduledTime, "")
    End If

    Dim s As String
    s = Trim$(InputBox(prompt, title, defaultValue))
    If LCase$(s) = "qq" Then Exit Function
    If s = "" Then
        MsgBox "No time information entered. Operation cancelled.", vbInformation, "Cancelled"
        Exit Function
    End If
    GetTimeInformation = s
End Function

Private Function GetRevisedETA(currentETA As String) As String
    Dim s As String
    s = Trim$(InputBox( _
        "Please confirm or modify the ETA (in minutes):" & vbCrLf & vbCrLf & _
        "Current ETA: " & IIf(currentETA <> "", currentETA & " minutes", "Not set") & vbCrLf & vbCrLf & _
        "Enter 'qq' to exit completely", _
        "ETA Confirmation", currentETA))
    If LCase$(s) = "qq" Then Exit Function
    If s = "" Then
        MsgBox "No ETA entered. Operation cancelled.", vbInformation, "Cancelled"
        Exit Function
    End If
    GetRevisedETA = s
End Function

' ===============================
' MESSAGE BUILDERS
' ===============================
Private Function BuildNotificationMessage(ByRef si As SellerInfo, ByVal mode As DeliveryModeEnum, _
                                          ByVal timeInfo As String, ByRef sup As SupplierInfo) As NotificationMessage
    Dim m As NotificationMessage
    m.Subject = "Pre-Purchase Inspection � " & selectedJobRego

    Dim greeting As String
    greeting = "Hi " & IIf(si.name <> "", si.name, "there") & ","

    Dim modeLine As String
    If mode = dmMobileEnRoute Then
        modeLine = "A mobile mechanic is en route. ETA: " & timeInfo & " minutes."
    Else
        modeLine = "Please visit the mechanic at your booked time: " & timeInfo & "."
    End If
    m.modeLine = modeLine

    Dim supplierLine As String
    If sup.IsValid And sup.name <> "" Then
        supplierLine = "Your mechanic: " & sup.name
        If sup.Mobile <> "" Then supplierLine = supplierLine & " on " & FormatNZMobileDisplay(sup.Mobile)
        supplierLine = supplierLine & "."
    Else
        supplierLine = "Your mechanic details will be shared shortly."
    End If

    m.body = greeting & vbCrLf & _
             modeLine & vbCrLf & _
             supplierLine & vbCrLf & _
             "The inspection itself takes about " & INSPECTION_DURATION & "." & vbCrLf & vbCrLf & _
             "Thanks � " & COMPANY_SIGNATURE
    BuildNotificationMessage = m
End Function

Private Function BuildRevisedETAMessage(ByVal sellerName As String, ByVal newETA As String) As NotificationMessage
    Dim m As NotificationMessage
    m.Subject = "Revised ETA � " & selectedJobRego
    m.body = "Hi " & IIf(sellerName <> "", sellerName, "there") & "," & vbCrLf & _
             "Due to traffic conditions your ETA is now: " & newETA & " minutes." & vbCrLf & _
             "The inspection itself takes about " & INSPECTION_DURATION & "." & vbCrLf & vbCrLf & _
             "Thanks � " & COMPANY_SIGNATURE
    m.modeLine = "Revised ETA: " & newETA & " minutes"
    BuildRevisedETAMessage = m
End Function

Private Function BuildCustomMessage(ByVal customText As String) As NotificationMessage
    Dim m As NotificationMessage
    m.Subject = "Message regarding " & selectedJobRego
    m.body = customText & vbCrLf & vbCrLf & COMPANY_SIGNATURE
    m.modeLine = "Custom message sent"
    BuildCustomMessage = m
End Function

' ===============================
' COMMUNICATION
' ===============================
Private Function SendSellerNotification(ByVal phone As String, ByRef m As NotificationMessage) As Boolean
    Dim smsAddress As String
    smsAddress = BuildSmsGatewayAddress(phone)
    If smsAddress = "" Then Exit Function
    SendSellerNotification = SendViaOutbox(NO_REPLY_EMAIL, smsAddress, m.Subject, m.body)
End Function

Private Function BuildSmsGatewayAddress(ByVal phone As String) As String
    Dim e164 As String
    e164 = NormalizeToE164(phone, DEFAULT_COUNTRY_CODE)
    If e164 = "" Then Exit Function
    BuildSmsGatewayAddress = Replace(e164, "+", "") & SMS_GATEWAY
End Function

Private Function BuildTelephoneUri(ByVal phone As String) As String
    Dim e164 As String
    e164 = NormalizeToE164(phone, DEFAULT_COUNTRY_CODE)
    If e164 = "" Then Exit Function
    BuildTelephoneUri = "tel:" & e164
End Function

' ===============================
' WORKSHEET HELPERS
' ===============================
Private Function GetWorksheet(ByVal sheetName As String) As Worksheet
    On Error Resume Next
    Set GetWorksheet = ThisWorkbook.Sheets(sheetName)
    On Error GoTo 0
End Function

Private Function GetCellValue(ByVal ws As Worksheet, ByVal rowNum As Long, ByVal colRef As String) As String
    GetCellValue = Trim$(CStr(ws.Cells(rowNum, colRef).value))
End Function

Private Sub UpdateETAInWorksheet(ByVal eta As String)
    On Error Resume Next
    Dim ws As Worksheet
    Set ws = GetWorksheet("Book a Job")
    If Not ws Is Nothing Then
        Dim r As Long
        r = FindPPIRegistrationRow(ws, selectedJobRego)
        If r > 0 Then ws.Cells(r, COL_ETA_MINUTES).value = eta
    End If
    On Error GoTo 0
End Sub

' ===============================
' SELLER DATA PARSING
' ===============================
Private Function ParseSellerInformation(ByVal ws As Worksheet, ByVal r As Long, ByRef si As SellerInfo) As Boolean
    Dim raw As String
    raw = GetCellValue(ws, r, COL_SELLER_DATA)
    If InStr(1, raw, "SELLER", vbTextCompare) = 0 Then Exit Function

    Dim p() As String
    p = Split(raw, "|")
    If UBound(p) < 2 Then Exit Function

    With si
        .name = Trim$(p(1))
        .phone = Trim$(p(2))
        If UBound(p) >= 3 Then .year = Trim$(p(3))
        If UBound(p) >= 4 Then .ScheduledDate = Trim$(p(4))
        If UBound(p) >= 5 Then .ScheduledTime = Trim$(p(5))
    End With
    ParseSellerInformation = True
End Function

' ===============================
' SUPPLIER MANAGEMENT
' ===============================
Private Sub GetSupplierInformation(ByVal jobRego As String, ByRef outSupplier As SupplierInfo)
    outSupplier.IsValid = SelectSupplierByRegistration(jobRego, outSupplier.name, outSupplier.Mobile)
End Sub

Private Function SelectSupplierByRegistration(ByVal rego As String, ByRef supplierName As String, ByRef supplierMobile As String) As Boolean
    On Error GoTo SupplierError
    If Trim$(rego) = "" Then Exit Function

    Dim ws As Worksheet
    Set ws = GetWorksheet("Job Build Notes")
    If ws Is Nothing Then Exit Function

    Dim matches() As Long, cnt As Long
    cnt = FindSupplierMatches(ws, rego, matches)
    If cnt = 0 Then Exit Function

    Dim idx As Long
    idx = GetSupplierSelection(ws, matches, cnt)
    If idx = 0 Then Exit Function

    ExtractSupplierDetails ws, matches(idx), supplierName, supplierMobile
    SelectSupplierByRegistration = True
    Exit Function
SupplierError:
    SelectSupplierByRegistration = False
End Function

Private Function FindSupplierMatches(ByVal ws As Worksheet, ByVal rego As String, ByRef rows() As Long) As Long
    Dim lastRow As Long, r As Long, cnt As Long
    lastRow = ws.Cells(ws.rows.count, COL_SUPPLIER_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If LCase$(Trim$(ws.Cells(r, COL_SUPPLIER_REGO).value)) = LCase$(Trim$(rego)) Then
            cnt = cnt + 1
            ReDim Preserve rows(1 To cnt)
            rows(cnt) = r
        End If
    Next r
    FindSupplierMatches = cnt
End Function

Private Function GetSupplierSelection(ByVal ws As Worksheet, ByRef rows() As Long, ByVal cnt As Long) As Long
    ' Auto-select if only one supplier
    If cnt = 1 Then
        GetSupplierSelection = 1
        Exit Function
    End If
    
    Dim list As String, i As Long
    list = "Select supplier:" & vbCrLf & vbCrLf
    For i = 1 To cnt
        list = list & i & ". " & Trim$(CStr(ws.Cells(rows(i), COL_SUPPLIER_NAME).value)) & vbCrLf
    Next i
    Dim pick As Variant
    pick = Application.InputBox(list & vbCrLf & "Enter number, or Cancel to abort", "Supplier Selection", Type:=1)
    If VarType(pick) = vbBoolean Then Exit Function
    If IsNumeric(pick) And pick >= 1 And pick <= cnt Then GetSupplierSelection = pick
End Function

Private Sub ExtractSupplierDetails(ByVal ws As Worksheet, ByVal r As Long, ByRef nm As String, ByRef mob As String)
    nm = Trim$(CStr(ws.Cells(r, COL_SUPPLIER_NAME).value))
    mob = Trim$(CStr(ws.Cells(r, COL_SUPPLIER_MOBILE).value))
    If mob <> "" And Left$(mob, 1) <> "0" And Left$(mob, 1) <> "+" Then mob = "0" & mob
End Sub

' ===============================
' PHONE UTILITIES
' ===============================
Private Function NormalizeToE164(ByVal phone As String, Optional ByVal cc As String = "+64") As String
    Dim s As String
    s = CleanPhoneNumber(phone)
    If s = "" Then Exit Function
    If Left$(s, 1) = "+" Then
        NormalizeToE164 = s
    ElseIf Left$(s, 2) = "00" Then
        NormalizeToE164 = "+" & Mid$(s, 3)
    ElseIf Left$(s, 1) = "0" Then
        NormalizeToE164 = cc & Mid$(s, 2)
    Else
        NormalizeToE164 = cc & s
    End If
    If Left$(NormalizeToE164, 1) <> "+" Then NormalizeToE164 = ""
End Function

' CleanPhoneNumber is now CleanMobileNumber in PublicUtilities module
Private Function CleanPhoneNumber(ByVal p As String) As String
    CleanPhoneNumber = CleanMobileNumber(p)
End Function

Private Function FormatNZMobileDisplay(ByVal phone As String) As String
    Dim s As String
    s = Replace(Replace(Replace(Trim$(phone), " ", ""), "-", ""), "+", "")
    If Left$(s, 2) = "64" Then s = "0" & Mid$(s, 3)
    If Len(s) = 10 Then
        FormatNZMobileDisplay = Left$(s, 3) & " " & Mid$(s, 4, 3) & " " & Right$(s, 4)
    Else
        FormatNZMobileDisplay = s
    End If
End Function

' ===============================
' ERROR & LOGGING
' ===============================
Private Sub ShowErrorMessage(ByVal msg As String)
    MsgBox msg, vbExclamation, "Error - PPI System"
End Sub

Private Sub LogAction(ByVal logFile As String, ByVal msg As String)
    LogToRR9998 "? " & msg, logFile
End Sub

Private Sub LogError(ByVal proc As String, ByVal errDesc As String, Optional ByVal logFile As String = "")
    Dim msg As String
    msg = "? Error in " & proc & ": " & errDesc
    If logFile <> "" Then
        LogToRR9998 msg, logFile
    Else
        LogToRR9998 msg
    End If
End Sub

' ===============================
' PREPURCHASE INSPECTION FOLDER SETUP
' ===============================
Sub PPI_SetupInspectionFolder()
    On Error GoTo ErrHandler
    
    Dim fs As Object
    Dim srcFolder As String, destFolder As String
    Dim rego As String, mechanicName As String, sellerName As String
    Dim clientName As String, supplierName As String

    rego = selectedJobRego
    If rego = "" Then
        MsgBox "No registration selected.", vbExclamation
        Exit Sub
    End If

    Set fs = CreateObject("Scripting.FileSystemObject")
    srcFolder = GetRRFilePath("PREPURCHASE INSPECTIONS\REGO")
    destFolder = GetRRFilePath("PREPURCHASE INSPECTIONS\" & rego, True)

    If Not fs.FolderExists(srcFolder) Then
        MsgBox "Template folder not found:" & vbCrLf & srcFolder, vbCritical
        Exit Sub
    End If

    If fs.FolderExists(destFolder) Then
        If MsgBox("Folder already exists for " & rego & "." & vbCrLf & _
                  "Replace it with a fresh copy of the template?", _
                  vbQuestion + vbYesNo) = vbNo Then Exit Sub
        fs.DeleteFolder destFolder, True
    End If

    fs.CopyFolder srcFolder, destFolder

    ' Get client name from Book a Job col E
    clientName = PPI_GetClientNameForRego(rego)
    If clientName = "" Then clientName = "Client"

    ' Get supplier name from Book a Job col AA (with picker if multiple)
    supplierName = PPI_GetSupplierNameForRego(rego)
    If supplierName = "" Then supplierName = "Supplier"

    ' Mechanic from Book a Job!AA (picker if >1)
    mechanicName = PPI_GetMechanicNameForRego(rego)
    If mechanicName <> "" Then mechanicName = PPI_SafeName(mechanicName) Else mechanicName = "Mechanic"

    ' Seller (owner) name from Book a Job!L
    sellerName = PPI_GetSellerNameForRego(rego)
    If sellerName <> "" Then sellerName = PPI_SafeName(sellerName) Else sellerName = "Owner"

    ' ATTENDINGMECHANIC -> mechanicName
    If fs.FolderExists(destFolder & "\ATTENDINGMECHANIC") Then
        fs.GetFolder(destFolder & "\ATTENDINGMECHANIC").name = mechanicName
        LogToRR9998 "PPI: Renamed ATTENDINGMECHANIC to '" & mechanicName & "' for " & rego
    End If

    ' CLIENTFILE -> "<REGO> PrePurchase Report"
    If fs.FolderExists(destFolder & "\CLIENTFILE") Then
        fs.GetFolder(destFolder & "\CLIENTFILE").name = rego & " PrePurchase Report"
        LogToRR9998 "PPI: Renamed CLIENTFILE to '" & rego & " PrePurchase Report' for " & rego
    End If

    ' OWNERFILE -> sellerName
    If fs.FolderExists(destFolder & "\OWNERFILE") Then
        fs.GetFolder(destFolder & "\OWNERFILE").name = sellerName
        LogToRR9998 "PPI: Renamed OWNERFILE to '" & sellerName & "' for " & rego
    End If

    ' Report doc -> "<REGO> PrePurchase Report.docx" AND replace CLIENTDATA/SUPPLIERDATA
    Dim reportPath As String
    reportPath = PPI_FindReportFile(destFolder)
    If reportPath <> "" Then
        ' Replace CLIENTDATA and SUPPLIERDATA in the Word document
        PPI_ReplaceDataInWordDoc reportPath, clientName, supplierName
        
        ' Rename the file
        fs.GetFile(reportPath).name = rego & " PrePurchase Report.docx"
        LogToRR9998 "PPI: Renamed report doc and replaced CLIENTDATA/SUPPLIERDATA for " & rego
    End If

    MsgBox "Inspection folder prepared successfully for " & rego & ".", vbInformation
    Exit Sub
ErrHandler:
    LogToRR9998 "Error in PPI_SetupInspectionFolder: " & Err.description
    MsgBox "Error in PPI_SetupInspectionFolder: " & Err.description, vbExclamation
End Sub

' === Helpers for folder setup ===
Private Function PPI_FindReportFile(ByVal destFolder As String) As String
    Dim fs As Object: Set fs = CreateObject("Scripting.FileSystemObject")
    If fs.fileExists(destFolder & "\PrePurchase Report.docx") Then
        PPI_FindReportFile = destFolder & "\PrePurchase Report.docx"
    ElseIf fs.fileExists(destFolder & "\Prepurchase Report.docx") Then
        PPI_FindReportFile = destFolder & "\Prepurchase Report.docx"
    Else
        PPI_FindReportFile = ""
    End If
End Function

' Get client name from Book a Job col E for this rego
Private Function PPI_GetClientNameForRego(ByVal rego As String) As String
    On Error Resume Next
    Dim ws As Worksheet, r As Long, lastRow As Long
    Set ws = ThisWorkbook.Sheets("Book a Job")
    If ws Is Nothing Then Exit Function

    lastRow = ws.Cells(ws.rows.count, COL_VEHICLE_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If StrComp(Trim$(CStr(ws.Cells(r, COL_VEHICLE_REGO).value)), Trim$(rego), vbTextCompare) = 0 Then
            PPI_GetClientNameForRego = Trim$(CStr(ws.Cells(r, "E").value))
            Exit Function
        End If
    Next r
End Function

' Get supplier name from Book a Job col AA (with picker if multiple suppliers separated by comma)
Private Function PPI_GetSupplierNameForRego(ByVal rego As String) As String
    On Error Resume Next
    Dim ws As Worksheet, r As Long, lastRow As Long
    Set ws = ThisWorkbook.Sheets("Book a Job")
    If ws Is Nothing Then Exit Function

    lastRow = ws.Cells(ws.rows.count, COL_VEHICLE_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If StrComp(Trim$(CStr(ws.Cells(r, COL_VEHICLE_REGO).value)), Trim$(rego), vbTextCompare) = 0 Then
            Dim rawSupplier As String
            rawSupplier = Trim$(CStr(ws.Cells(r, "AA").value))
            
            If rawSupplier = "" Then Exit Function
            
            ' Check if multiple suppliers (separated by comma)
            If InStr(rawSupplier, ",") > 0 Then
                Dim suppliers() As String
                Dim i As Long, listTxt As String, pick As Variant
                
                suppliers = Split(rawSupplier, ",")
                listTxt = "Multiple suppliers found for rego " & rego & ":" & vbCrLf & vbCrLf
                
                For i = LBound(suppliers) To UBound(suppliers)
                    suppliers(i) = Trim$(suppliers(i))
                    listTxt = listTxt & (i + 1) & ". " & suppliers(i) & vbCrLf
                Next i
                
                pick = Application.InputBox( _
                    prompt:=listTxt & vbCrLf & "Enter number:", _
                    title:="Select Supplier", Type:=1)
                
                If VarType(pick) = vbBoolean Then
                    PPI_GetSupplierNameForRego = ""
                ElseIf IsNumeric(pick) And pick >= 1 And pick <= UBound(suppliers) + 1 Then
                    PPI_GetSupplierNameForRego = PPI_CleanSupplierName(suppliers(CLng(pick) - 1))
                End If
            Else
                ' Single supplier
                PPI_GetSupplierNameForRego = PPI_CleanSupplierName(rawSupplier)
            End If
            Exit Function
        End If
    Next r
End Function

' Attending mechanic / supplier name from Book a Job!AA for this rego (picker if multiple).
Private Function PPI_GetMechanicNameForRego(ByVal rego As String) As String
    On Error GoTo ErrHandler
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    If ws Is Nothing Then Exit Function
    
    Dim lastRow As Long, r As Long
    lastRow = ws.Cells(ws.rows.count, COL_VEHICLE_REGO).End(xlUp).Row
    
    Dim names As New Collection
    Dim seen As Object: Set seen = CreateObject("Scripting.Dictionary")
    
    For r = 2 To lastRow
        If StrComp(Trim$(CStr(ws.Cells(r, COL_VEHICLE_REGO).value)), Trim$(rego), vbTextCompare) = 0 Then
            Dim nm As String
            nm = Trim$(CStr(ws.Cells(r, 27).value))   ' AA
            nm = PPI_CleanSupplierName(nm)
            If nm <> "" Then
                If Not seen.Exists(LCase$(nm)) Then
                    seen.Add LCase$(nm), True
                    names.Add nm
                End If
            End If
        End If
    Next r
    
    Select Case names.count
        Case 0
            PPI_GetMechanicNameForRego = PPI_GetFirstSupplierNameForRego(rego) ' fallback to Job Build Notes H
        Case 1
            PPI_GetMechanicNameForRego = names(1)
        Case Else
            Dim i As Long, listTxt As String, pick As Variant
            For i = 1 To names.count
                listTxt = listTxt & i & ". " & names(i) & vbCrLf
            Next i
            pick = Application.InputBox( _
                    prompt:="Multiple attending mechanics found for rego " & rego & ":" & vbCrLf & vbCrLf & listTxt & _
                            vbCrLf & "Enter number:", _
                    title:="Select Mechanic", Type:=1)
            If VarType(pick) = vbBoolean Then
                PPI_GetMechanicNameForRego = ""
            ElseIf IsNumeric(pick) And pick >= 1 And pick <= names.count Then
                PPI_GetMechanicNameForRego = names(CLng(pick))
            End If
    End Select
    Exit Function
ErrHandler:
    PPI_GetMechanicNameForRego = ""
End Function

' Seller/Owner name from Book a Job!L (SELLER|Name|Phone|...)
Private Function PPI_GetSellerNameForRego(ByVal rego As String) As String
    On Error Resume Next
    Dim ws As Worksheet, r As Long, lastRow As Long
    Set ws = ThisWorkbook.Sheets("Book a Job")
    If ws Is Nothing Then Exit Function

    lastRow = ws.Cells(ws.rows.count, COL_VEHICLE_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If StrComp(Trim$(CStr(ws.Cells(r, COL_VEHICLE_REGO).value)), Trim$(rego), vbTextCompare) = 0 Then
            Dim raw As String, parts() As String
            raw = Trim$(CStr(ws.Cells(r, COL_SELLER_DATA).value))
            If InStr(1, raw, "SELLER", vbTextCompare) > 0 Then
                parts = Split(raw, "|")
                If UBound(parts) >= 1 Then
                    PPI_GetSellerNameForRego = Trim$(parts(1))
                    Exit Function
                End If
            End If
        End If
    Next r
End Function

' Fallback if AA blank: first supplier name from Job Build Notes col H
Private Function PPI_GetFirstSupplierNameForRego(ByVal rego As String) As String
    On Error Resume Next
    Dim ws As Worksheet, lastRow As Long, r As Long
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    If ws Is Nothing Then Exit Function
    lastRow = ws.Cells(ws.rows.count, COL_SUPPLIER_REGO).End(xlUp).Row
    For r = 2 To lastRow
        If LCase$(Trim$(ws.Cells(r, COL_SUPPLIER_REGO).value)) = LCase$(Trim$(rego)) Then
            PPI_GetFirstSupplierNameForRego = Trim$(CStr(ws.Cells(r, COL_SUPPLIER_NAME).value))
            Exit Function
        End If
    Next r
End Function

' Replace CLIENTDATA and SUPPLIERDATA in Word document
Private Sub PPI_ReplaceDataInWordDoc(ByVal docPath As String, ByVal clientName As String, ByVal supplierName As String)
    On Error GoTo ErrHandler
    
    Dim WordApp As Object
    Dim wordDoc As Object
    Dim wasRunning As Boolean
    
    ' Check if Word is already running
    On Error Resume Next
    Set WordApp = GetObject(, "Word.Application")
    wasRunning = (Err.Number = 0)
    On Error GoTo ErrHandler
    
    ' If Word wasn't running, create new instance
    If WordApp Is Nothing Then
        Set WordApp = CreateObject("Word.Application")
        wasRunning = False
    End If
    
    ' Open the document
    Set wordDoc = WordApp.Documents.Open(docPath)
    
    ' Replace CLIENTDATA with client name
    With wordDoc.content.Find
        .ClearFormatting
        .text = "CLIENTDATA"
        .Replacement.text = clientName
        .Forward = True
        .Wrap = 1 ' wdFindContinue
        .Format = False
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        .Execute Replace:=2 ' wdReplaceAll
    End With
    
    ' Replace SUPPLIERDATA with supplier name
    With wordDoc.content.Find
        .ClearFormatting
        .text = "SUPPLIERDATA"
        .Replacement.text = supplierName
        .Forward = True
        .Wrap = 1 ' wdFindContinue
        .Format = False
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        .Execute Replace:=2 ' wdReplaceAll
    End With
    
    ' Save and close the document
    wordDoc.Save
    wordDoc.Close
    
    ' Quit Word if it wasn't running before
    If Not wasRunning Then
        WordApp.Quit
    End If
    
    Set wordDoc = Nothing
    Set WordApp = Nothing
    
    LogToRR9998 "PPI: Replaced CLIENTDATA with '" & clientName & "' and SUPPLIERDATA with '" & supplierName & "'"
    Exit Sub
    
ErrHandler:
    If Not wordDoc Is Nothing Then wordDoc.Close False
    If Not wasRunning And Not WordApp Is Nothing Then WordApp.Quit
    LogToRR9998 "Error in PPI_ReplaceDataInWordDoc: " & Err.description
End Sub

' Safe filename/foldername
Private Function PPI_SafeName(ByVal s As String) As String
    Dim bad As Variant, i As Long
    bad = Array("\", "/", ":", "*", "?", """", "<", ">", "|")
    For i = LBound(bad) To UBound(bad)
        s = Replace(s, bad(i), "")
    Next i
    Do While Len(s) > 0 And (Right$(s, 1) = " " Or Right$(s, 1) = ".")
        s = Left$(s, Len(s) - 1)
    Loop
    If s = "" Then s = "Unnamed"
    PPI_SafeName = s
End Function

Private Function PPI_CleanSupplierName(ByVal s As String) As String
    s = Trim$(s)
    s = Replace(s, "Supplier:", "", , , vbTextCompare)
    s = Replace(s, "Supplier -", "", , , vbTextCompare)
    s = Replace(s, "Mechanic:", "", , , vbTextCompare)
    s = Replace(s, "Attending Mechanic:", "", , , vbTextCompare)
    s = Replace(s, "ATTENDING MECHANIC:", "", , , vbTextCompare)
    PPI_CleanSupplierName = Trim$(s)
End Function

' Sends seller (owner) contact details to the selected mechanic for this PPI job
Private Sub PPI_SendSellerDetailsToMechanic()
    On Error GoTo ErrHandler

    ' --- Validate we have a current PPI job + seller data
    Dim si As SellerInfo
    If Not GetValidatedSellerData(si) Then
        MsgBox "Could not load seller/job details for this rego.", vbExclamation
        Exit Sub
    End If

    Dim rego As String: rego = selectedJobRego
    If Trim$(rego) = "" Then
        MsgBox "No registration selected.", vbExclamation
        Exit Sub
    End If

    ' --- Pick a mechanic (supplier) row in Job Build Notes for this rego
    Dim ws As Worksheet: Set ws = GetWorksheet("Job Build Notes")
    If ws Is Nothing Then
        MsgBox "Sheet 'Job Build Notes' not found.", vbExclamation
        Exit Sub
    End If

    Dim lastRow As Long, r As Long, cnt As Long
    Dim rowsFound() As Long, supplierList As String
    lastRow = ws.Cells(ws.rows.count, COL_SUPPLIER_REGO).End(xlUp).Row

    For r = 2 To lastRow
        If LCase$(Trim$(ws.Cells(r, COL_SUPPLIER_REGO).value)) = LCase$(Trim$(rego)) Then
            cnt = cnt + 1
            ReDim Preserve rowsFound(1 To cnt)
            rowsFound(cnt) = r
        End If
    Next r

    If cnt = 0 Then
        MsgBox "No supplier rows found for rego " & rego & " in Job Build Notes.", vbExclamation
        Exit Sub
    End If

    Dim pick As Variant, i As Long
    If cnt = 1 Then
        pick = 1
    Else
        supplierList = "Select attending mechanic for rego " & rego & ":" & vbCrLf & vbCrLf
        For i = 1 To cnt
            supplierList = supplierList & i & ". " & Trim$(CStr(ws.Cells(rowsFound(i), COL_SUPPLIER_NAME).value)) & vbCrLf
        Next i
        pick = Application.InputBox(supplierList & vbCrLf & "Enter number:", "Select Mechanic", Type:=1)
        If VarType(pick) = vbBoolean Then Exit Sub
        If Not IsNumeric(pick) Or pick < 1 Or pick > cnt Then Exit Sub
    End If

    Dim selRow As Long: selRow = rowsFound(CLng(pick))
    Dim mechName As String, mechMobile As String, mechEmail As String
    mechName = Trim$(CStr(ws.Cells(selRow, COL_SUPPLIER_NAME).value))
    mechMobile = Trim$(CStr(ws.Cells(selRow, 25).value)) ' Y = 25 (mobile)
    mechEmail = Trim$(CStr(ws.Cells(selRow, 24).value))  ' X = 24 (email)

    ' Normalise mobile for SMS gateway if needed
    If mechMobile <> "" And Left$(mechMobile, 1) <> "0" And Left$(mechMobile, 1) <> "+" Then mechMobile = "0" & mechMobile
    Dim smsAddr As String: smsAddr = ""
    If mechMobile <> "" Then
        Dim e164 As String: e164 = NormalizeToE164(mechMobile, "+64")
        If e164 <> "" Then smsAddr = Replace(e164, "+", "") & "@sms.tnz.co.nz"
    End If

    ' --- Build the message with SELLER details (not buyer/client)
    Dim sellerPhoneDisplay As String
    sellerPhoneDisplay = FormatNZMobileDisplay(si.phone)

    Dim whenTxt As String
    If si.ScheduledDate <> "" Or si.ScheduledTime <> "" Then
        whenTxt = Trim$(si.ScheduledDate & " " & si.ScheduledTime)
    End If

    Dim subj As String
    subj = "SELLER DETAILS � PPI for " & rego

    Dim body As String
    body = "Hi " & IIf(mechName <> "", mechName, "there") & "," & vbCrLf & vbCrLf & _
           "Seller details for the pre-purchase inspection:" & vbCrLf & _
           "� Rego: " & rego & IIf(si.year <> "", " (" & si.year & ")", "") & vbCrLf & _
           "� Seller: " & IIf(si.name <> "", si.name, "N/A") & vbCrLf & _
           "� Phone: " & IIf(sellerPhoneDisplay <> "", sellerPhoneDisplay, "N/A") & vbCrLf & _
           IIf(whenTxt <> "", "� Scheduled: " & whenTxt & vbCrLf, "") & _
           vbCrLf & _
           "Please contact the seller to coordinate access. The inspection typically takes about " & INSPECTION_DURATION & "." & vbCrLf & vbCrLf & _
           "Thanks � " & COMPANY_SIGNATURE

    ' SMS version (shorter)
    Dim sms As String
    sms = "PPI " & rego & ": Seller " & IIf(si.name <> "", si.name, "N/A") & _
          ", " & IIf(sellerPhoneDisplay <> "", sellerPhoneDisplay, "N/A") & _
          IIf(whenTxt <> "", " (" & whenTxt & ")", "")

    ' --- Send via email and/or SMS (whatever is available)
    Dim sentEmail As Boolean, sentSMS As Boolean
    If mechEmail <> "" Then sentEmail = SendViaOutbox(NO_REPLY_EMAIL, mechEmail, subj, body)
    If smsAddr <> "" Then sentSMS = SendViaOutbox(NO_REPLY_EMAIL, smsAddr, "Seller details " & rego, sms)

    If Not sentEmail And Not sentSMS Then
        MsgBox "No messages sent. Missing/invalid supplier contact details.", vbExclamation, "Nothing Sent"
    Else
        Dim doneMsg As String
        doneMsg = "Seller details sent to " & IIf(mechName <> "", mechName, "mechanic") & " for rego " & rego & _
                  IIf(sentEmail, " (email)", "") & IIf(sentSMS, " (sms)", "")
        MsgBox doneMsg, vbInformation
        LogToRR9998 doneMsg
    End If

    Exit Sub
ErrHandler:
    LogToRR9998 "Error in PPI_SendSellerDetailsToMechanic: " & Err.description
    MsgBox "Error in PPI_SendSellerDetailsToMechanic: " & Err.description, vbExclamation
End Sub













