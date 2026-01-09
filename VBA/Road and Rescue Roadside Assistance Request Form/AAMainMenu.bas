Attribute VB_Name = "AAMainMenu"
' Attribute VB_Name = "AAMainMenu"
' Attribute VB_Name = "AAMainMenu"
Public selectedJobRego As String
Public currentMenuSelection As Integer
Public currentSubMenuSelection As Integer

' Global variables for selected supplier details (set by supplier selection modals)
Public selectedSupplierName As String
Public selectedSupplierEmail As String
Public selectedSupplierPhone As String
Public selectedSupplierRego As String

Sub StartMenu()
    On Error GoTo ErrHandler
    LogToRR9998 "StartMenu started."

    Call LaunchOutlook
    
    ' Prompt for rego at session start
    Call OpenJobRegister
    
    Dim userInput As String
    Dim exitRoutine As Boolean
    Dim shouldExit As Boolean
    Dim regoDisplay As String

    Do
        ' Show current rego in menu header
        If selectedJobRego <> "" Then
            regoDisplay = "Current Rego: " & UCase(selectedJobRego) & vbCrLf & String(40, "-") & vbCrLf & vbCrLf
        Else
            regoDisplay = "Current Rego: (none selected)" & vbCrLf & String(40, "-") & vbCrLf & vbCrLf
        End If
        
        Dim prompt As String
        prompt = "ROAD AND RESCUE - MAIN MENU" & vbCrLf & vbCrLf & _
                 regoDisplay & _
                 "0. Change Rego" & vbCrLf & _
                 "1. Intake & Booking" & vbCrLf & _
                 "2. Dispatch & Setup" & vbCrLf & _
                 "3. Customer Communication" & vbCrLf & _
                 "4. Supplier Communication" & vbCrLf & _
                 "5. Job Completion & Billing" & vbCrLf & _
                 "6. Accounting & Financial" & vbCrLf & _
                 "7. Administration" & vbCrLf & _
                 "8. Special Services" & vbCrLf & _
                 "9. Send Release Payment (Invoice + Pay Link)" & vbCrLf & _
                 "10. Confirm Bank Payment & Release Vehicle" & vbCrLf & _
                 "11. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                 "Enter category (0-11) or 'q'/'qq' to exit:"
        
        userInput = InputBox(prompt, "Main Menu")
        
        If LCase(Trim(userInput)) = "qq" Or LCase(Trim(userInput)) = "q" Or Trim(userInput) = "" Then
            exitRoutine = True
            Exit Do
        End If
        
        Select Case userInput
            Case "0": Call ChangeSessionRego
            Case "1": currentMenuSelection = 1: shouldExit = ShowIntakeMenu()
            Case "2": currentMenuSelection = 2: shouldExit = ShowDispatchMenu()
            Case "3": currentMenuSelection = 3: shouldExit = ShowCustomerMenu()
            Case "4": currentMenuSelection = 4: shouldExit = ShowSupplierMenu()
            Case "5": currentMenuSelection = 5: shouldExit = ShowCompletionMenu()
            Case "6": currentMenuSelection = 6: shouldExit = ShowAccountingMenu()
            Case "7": currentMenuSelection = 7: shouldExit = ShowAdminMenu()
            Case "8": currentMenuSelection = 8: shouldExit = ShowSpecialMenu()
            Case "9": currentMenuSelection = 9: Call SendReleasePaymentWithInvoice
            Case "10": currentMenuSelection = 10: Call ConfirmBankPaymentAndRelease
            Case "11": ShowAllMenuItems
            Case Else
                ShowWarning "Invalid selection. Please enter 0-11."
        End Select
        
        If shouldExit Then
            exitRoutine = True
            Exit Do
        End If
    Loop Until exitRoutine
    
    ' Clear session rego on exit
    selectedJobRego = ""
    LogToRR9998 "StartMenu exited normally."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in StartMenu: " & Err.description
End Sub

Sub ChangeSessionRego()
    ' Option 0: Force change the session rego
    ' Clears current selection and opens picker
    Dim oldRego As String
    oldRego = selectedJobRego
    selectedJobRego = ""  ' Clear so picker shows
    
    Call OpenJobRegister
    
    If selectedJobRego <> "" Then
        LogToRR9998 "Session rego changed from '" & oldRego & "' to '" & selectedJobRego & "'"
    Else
        ' User cancelled - restore old rego
        selectedJobRego = oldRego
    End If
End Sub

Function ShowIntakeMenu() As Boolean
    ' Returns True if should exit system, False if should return to main menu
    Dim choice As String
    choice = InputBox("INTAKE & BOOKING" & vbCrLf & vbCrLf & _
                      "1. Mark DNC Job" & vbCrLf & _
                      "2. Triage Form" & vbCrLf & _
                      "3. Booking Form" & vbCrLf & _
                      "4. Add Record to Booking Data" & vbCrLf & _
                      "5. Send Bank Payment Request" & vbCrLf & _
                      "6. Send Job Link (Bank Payment Confirmed)" & vbCrLf & _
                      "7. Send Booking Link (New Customer)" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-7), 'q' to go back, or 'qq' to exit:", "Intake & Booking")
    Select Case LCase(choice)
        Case "1": Call MarkDNCJob: ShowIntakeMenu = False
        Case "2": Call TriageForm: ShowIntakeMenu = False
        Case "3": Call BookingForm: ShowIntakeMenu = False
        Case "4": Call AddRecordToBookingData: ShowIntakeMenu = False
        Case "5": Call SendBankPaymentRequest: ShowIntakeMenu = False
        Case "6": Call SendBankTransferJobLink: ShowIntakeMenu = False
        Case "7": Call SendBookingLink: ShowIntakeMenu = False
        Case "?": Call ShowAllMenuItems: ShowIntakeMenu = False
        Case "q", "": ShowIntakeMenu = False  ' Go back to main menu
        Case "qq": ShowIntakeMenu = True  ' Exit system
        Case Else: ShowIntakeMenu = False
    End Select
End Function

Function ShowDispatchMenu() As Boolean
    Dim choice As String
    choice = InputBox("DISPATCH & SETUP" & vbCrLf & vbCrLf & _
                      "1. Add Supplier" & vbCrLf & _
                      "2. Update Job" & vbCrLf & _
                      "3. Update Job Address by Rego" & vbCrLf & _
                      "4. Open Customer Address in Google Maps" & vbCrLf & _
                      "5. Send Location Request" & vbCrLf & _
                      "6. Send Job to Supplier" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-6), 'q' to go back, or 'qq' to exit:", "Dispatch & Setup")
    Select Case LCase(choice)
        Case "1": Call JobBuild: ShowDispatchMenu = False
        Case "2": Call LookupAndCompare: ShowDispatchMenu = False
        Case "3": Call UpdateJobAddressByRego: ShowDispatchMenu = False
        Case "4": Call OpenCustomerAddressInGoogleMaps: ShowDispatchMenu = False
        Case "5": Call SendLocationRequest: ShowDispatchMenu = False
        Case "6": Call SendJobToSupplier: ShowDispatchMenu = False
        Case "?": Call ShowAllMenuItems: ShowDispatchMenu = False
        Case "q", "": ShowDispatchMenu = False
        Case "qq": ShowDispatchMenu = True
        Case Else: ShowDispatchMenu = False
    End Select
End Function

Function ShowCustomerMenu() As Boolean
    Dim choice As String
    choice = InputBox("CUSTOMER COMMUNICATION" & vbCrLf & vbCrLf & _
                      "1. Customer Reply" & vbCrLf & _
                      "2. Call Customer" & vbCrLf & _
                      "3. Send Manual Text" & vbCrLf & _
                      "4. Driver En Route" & vbCrLf & _
                      "5. Revised ETA" & vbCrLf & _
                      "6. Open EEK Contact Form" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-6), 'q' to go back, or 'qq' to exit:", "Customer Communication")
    Select Case LCase(choice)
        Case "1": Call CustomerReply: ShowCustomerMenu = False
        Case "2": Call CallCustomer: ShowCustomerMenu = False
        Case "3": Call SendManualText: ShowCustomerMenu = False
        Case "4": Call DriverEnRoute: ShowCustomerMenu = False
        Case "5": Call RevisedETA: ShowCustomerMenu = False
        Case "6": Call SendEekContactForm: ShowCustomerMenu = False
        Case "?": Call ShowAllMenuItems: ShowCustomerMenu = False
        Case "q", "": ShowCustomerMenu = False
        Case "qq": ShowCustomerMenu = True
        Case Else: ShowCustomerMenu = False
    End Select
End Function

Function ShowSupplierMenu() As Boolean
    Dim choice As String
    choice = InputBox("SUPPLIER COMMUNICATION" & vbCrLf & vbCrLf & _
                      "1. Send Message To Supplier" & vbCrLf & _
                      "2. Call Supplier" & vbCrLf & _
                      "3. Update Supplier Details" & vbCrLf & _
                      "4. Open EEK Contact Form" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-4), 'q' to go back, or 'qq' to exit:", "Supplier Communication")
    Select Case LCase(choice)
        Case "1": Call SendMessageToSupplier: ShowSupplierMenu = False
        Case "2": Call CallSupplier: ShowSupplierMenu = False
        Case "3": Call UpdateSupplierDetails: ShowSupplierMenu = False
        Case "4": Call SendEekContactFormToSupplier: ShowSupplierMenu = False
        Case "?": Call ShowAllMenuItems: ShowSupplierMenu = False
        Case "q", "": ShowSupplierMenu = False
        Case "qq": ShowSupplierMenu = True
        Case Else: ShowSupplierMenu = False
    End Select
End Function

Function ShowCompletionMenu() As Boolean
    Dim choice As String
    choice = InputBox("JOB COMPLETION & BILLING" & vbCrLf & vbCrLf & _
                      "1. Send Manual Payment Gateway" & vbCrLf & _
                      "2. Cancellation" & vbCrLf & _
                      "3. Job Complete" & vbCrLf & _
                      "4. Close Job" & vbCrLf & _
                      "5. Send Invoice" & vbCrLf & _
                      "6. Update Invoice Name" & vbCrLf & _
                      "7. Send Job Link (Bank Payment Confirmed)" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-7), 'q' to go back, or 'qq' to exit:", "Job Completion & Billing")
    Select Case LCase(choice)
        Case "1": Call SendManualPaymentGateway: ShowCompletionMenu = False
        Case "2": Call Cancellation: ShowCompletionMenu = False
        Case "3": Call JobComplete: ShowCompletionMenu = False
        Case "4": Call CloseJob: ShowCompletionMenu = False
        Case "5": Call AutomateInvoicing: ShowCompletionMenu = False
        Case "6": Call UpdateInvoiceName: ShowCompletionMenu = False
        Case "7": Call SendBankTransferJobLink: ShowCompletionMenu = False
        Case "?": Call ShowAllMenuItems: ShowCompletionMenu = False
        Case "q", "": ShowCompletionMenu = False
        Case "qq": ShowCompletionMenu = True
        Case Else: ShowCompletionMenu = False
    End Select
End Function

Function ShowAccountingMenu() As Boolean
    Dim choice As String
    choice = InputBox("ACCOUNTING & FINANCIAL" & vbCrLf & vbCrLf & _
                      "1. Generate ANZ Batch File" & vbCrLf & _
                      "2. Profit and Loss" & vbCrLf & _
                      "3. Generate Customer Refund File" & vbCrLf & _
                      "4. Run Stripe and Job Updates" & vbCrLf & _
                      "5. Buyer Created Invoice (BCI)" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-5), 'q' to go back, or 'qq' to exit:", "Accounting & Financial")
    Select Case LCase(choice)
        Case "1": Call GenerateANZBatchFile: ShowAccountingMenu = False
        Case "2": Call ProfitAndLoss: ShowAccountingMenu = False
        Case "3": Call GenerateCustomerRefundFile: ShowAccountingMenu = False
        Case "4": Call HandleStripeAndJobUpdates: ShowAccountingMenu = False
        Case "5": Call ShowBCIMenu: ShowAccountingMenu = False
        Case "?": Call ShowAllMenuItems: ShowAccountingMenu = False
        Case "q", "": ShowAccountingMenu = False
        Case "qq": ShowAccountingMenu = True
        Case Else: ShowAccountingMenu = False
    End Select
End Function

Function ShowAdminMenu() As Boolean
    Dim choice As String
    choice = InputBox("ADMINISTRATION" & vbCrLf & vbCrLf & _
                      "1. Bad Debt Notice" & vbCrLf & _
                      "2. Complaint Response" & vbCrLf & _
                      "3. Add to Blacklist" & vbCrLf & _
                      "4. API Call Menu" & vbCrLf & _
                      "5. Send Defamation Notice" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-5), 'q' to go back, or 'qq' to exit:", "Administration")
    Select Case LCase(choice)
        Case "1": Call BadDebtNotice: ShowAdminMenu = False
        Case "2": Call ComplaintResponse: ShowAdminMenu = False
        Case "3": Call AddToBlacklist: ShowAdminMenu = False
        Case "4":
            Dim apiExit As Boolean
            apiExit = APICallMenu()
            If apiExit Then
                ShowAdminMenu = True  ' Exit system
            Else
                ShowAdminMenu = False  ' Continue/Go back
            End If
        Case "5": Call SendDefamationNotice: ShowAdminMenu = False
        Case "?": Call ShowAllMenuItems: ShowAdminMenu = False
        Case "q", "": ShowAdminMenu = False
        Case "qq": ShowAdminMenu = True
        Case Else: ShowAdminMenu = False
    End Select
End Function

Function ShowSpecialMenu() As Boolean
    Dim choice As String
    choice = InputBox("SPECIAL SERVICES" & vbCrLf & vbCrLf & _
                      "1. Prepurchase Inspection Menu" & vbCrLf & _
                      "2. Fuel Extraction Menu" & vbCrLf & _
                      "?. Show All Menu Items (Helper)" & vbCrLf & vbCrLf & _
                      "Enter option (1-2), 'q' to go back, or 'qq' to exit:", "Special Services")
    Select Case LCase(choice)
        Case "1":
            Dim ppiExit As Boolean
            ppiExit = PrepurchaseInspectionMenu()
            If ppiExit Then
                ShowSpecialMenu = True  ' Exit system
            Else
                ShowSpecialMenu = False  ' Continue/Go back
            End If
        Case "2":
            Dim fuelExit As Boolean
            fuelExit = FuelExtractionMenu()
            If fuelExit Then
                ShowSpecialMenu = True  ' Exit system
            Else
                ShowSpecialMenu = False  ' Continue/Go back
            End If
        Case "?": Call ShowAllMenuItems: ShowSpecialMenu = False
        Case "q", "": ShowSpecialMenu = False
        Case "qq": ShowSpecialMenu = True
        Case Else: ShowSpecialMenu = False
    End Select
End Function

Sub ShowAllMenuItems()
    ' Helper function to show all menu items as a simple reference list
    ' Split into two messages due to MsgBox length limit
    
    Dim menuList1 As String
    menuList1 = "ROAD AND RESCUE - ALL MENU ITEMS (Part 1/2)" & vbCrLf & String(50, "=") & vbCrLf & vbCrLf
    menuList1 = menuList1 & "SESSION CONTROLS" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 0. Change Rego (pick different job)" & vbCrLf & vbCrLf
    menuList1 = menuList1 & "INTAKE & BOOKING" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 1. Mark DNC Job" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 2. Triage Form" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 3. Booking Form" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 4. Add Record to Booking Data" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 5. Send Bank Payment Request" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 6. Send Job Link (Bank Payment Confirmed)" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 1 > 7. Send Booking Link (New Customer)" & vbCrLf & vbCrLf
    menuList1 = menuList1 & "DISPATCH & SETUP" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 1. Add Supplier" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 2. Update Job" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 3. Update Job Address by Rego" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 4. Open Customer Address in Google Maps" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 5. Send Location Request" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 2 > 6. Send Job to Supplier" & vbCrLf & vbCrLf
    menuList1 = menuList1 & "CUSTOMER COMMUNICATION" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 3 > 1. Customer Reply" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 3 > 2. Call Customer" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 3 > 3. Send Manual Text" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 3 > 4. Driver En Route" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 3 > 5. Revised ETA" & vbCrLf & vbCrLf
    menuList1 = menuList1 & "SUPPLIER COMMUNICATION" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 4 > 1. Send Message To Supplier" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 4 > 2. Call Supplier" & vbCrLf
    menuList1 = menuList1 & "  Main Menu > 4 > 3. Update Supplier Details" & vbCrLf & vbCrLf
    menuList1 = menuList1 & String(50, "=")
    
    Dim menuList2 As String
    menuList2 = "ROAD AND RESCUE - ALL MENU ITEMS (Part 2/2)" & vbCrLf & String(50, "=") & vbCrLf & vbCrLf
    menuList2 = menuList2 & "JOB COMPLETION & BILLING" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 1. Send Manual Payment Gateway" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 2. Cancellation" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 3. Job Complete" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 4. Close Job" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 5. Send Invoice" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 5 > 6. Update Invoice Name" & vbCrLf & vbCrLf
    menuList2 = menuList2 & "ACCOUNTING & FINANCIAL" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 6 > 1. Generate ANZ Batch File" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 6 > 2. Profit and Loss" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 6 > 3. Generate Customer Refund File" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 6 > 4. Run Stripe and Job Updates" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 6 > 5. Buyer Created Invoice (BCI)" & vbCrLf & vbCrLf
    menuList2 = menuList2 & "ADMINISTRATION" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 7 > 1. Bad Debt Notice" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 7 > 2. Complaint Response" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 7 > 3. Add to Blacklist" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 7 > 4. API Call Menu" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 7 > 5. Send Defamation Notice" & vbCrLf & vbCrLf
    menuList2 = menuList2 & "SPECIAL SERVICES" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 8 > 1. Prepurchase Inspection Menu" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 8 > 2. Fuel Extraction Menu" & vbCrLf & vbCrLf
    menuList2 = menuList2 & "QUICK ACCESS" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 9. Send Release Payment (Invoice + Pay Link)" & vbCrLf
    menuList2 = menuList2 & "  Main Menu > 10. Confirm Bank Payment & Release Vehicle" & vbCrLf & vbCrLf
    menuList2 = menuList2 & String(50, "=")
    
    ' Show both parts
    MsgBox menuList1, vbInformation, "Menu Reference - Part 1 of 2"
    MsgBox menuList2, vbInformation, "Menu Reference - Part 2 of 2"
End Sub

Function APICallMenu() As Boolean
    On Error GoTo ErrHandler
    LogToRR9998 "APICallMenu started."

    Dim userInput As String
    userInput = InputBox( _
        "API Call Table Menu:" & vbCrLf & _
        "1 - Add Number" & vbCrLf & _
        "2 - Update Extension" & vbCrLf & _
        "3 - Delete Number" & vbCrLf & vbCrLf & _
        "Enter option (1-3), 'q' to go back, or 'qq' to exit:", "API Call Menu")

    Select Case LCase(Trim(userInput))
        Case "1": AddAPINumber: APICallMenu = False
        Case "2": UpdateAPIExtension: APICallMenu = False
        Case "3": DeleteAPINumber: APICallMenu = False
        Case "q", "": APICallMenu = False  ' Go back
        Case "qq": APICallMenu = True  ' Exit system
        Case Else: ShowWarning "Invalid selection or cancelled.": APICallMenu = False
    End Select

    LogToRR9998 "APICallMenu exited normally."
    Exit Function

ErrHandler:
    LogToRR9998 "Error in APICallMenu: " & Err.description
    APICallMenu = False
End Function

Sub CollectRego()
    On Error GoTo ErrHandler
    LogToRR9998 "CollectRego started."

    Call OpenJobRegister

    LogToRR9998 "CollectRego completed with value: " & selectedJobRego
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CollectRego: " & Err.description
End Sub

Sub OpenJobRegister(Optional ByVal identifier As String = "")
    On Error GoTo ErrHandler
    LogToRR9998 "OpenJobRegister started."
    
    ' If a rego is already selected for this session, use it (bypass picker)
    If selectedJobRego <> "" Then
        LogToRR9998 "OpenJobRegister: Using existing session rego - " & selectedJobRego
        Exit Sub
    End If

    Const JOB_TYPE_PPI As String = "Pre Purchase Vehicle Inspection"
    Dim filterPPI As Boolean
    filterPPI = (LCase$(Trim$(identifier)) Like "*ppi*" Or LCase$(Trim$(identifier)) Like "*pre*purchase*")

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim allData As New Collection
    Dim yellowData As New Collection
    Dim lastRow As Long
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row

    Dim i As Long
    For i = 1 To lastRow
        Dim rego As String
        rego = WorksheetFunction.Trim(ws.Cells(i, "V").value)

        If rego <> "" Then
            On Error Resume Next
            allData.Add rego, CStr(rego)
            On Error GoTo 0
        End If

        If ws.Cells(i, "V").Interior.Color = vbYellow Then
            If rego <> "" Then
                If Not filterPPI Then
                    yellowData.Add rego
                Else
                    Dim jobType As String
                    jobType = WorksheetFunction.Trim(ws.Cells(i, "J").value)
                    If StrComp(jobType, JOB_TYPE_PPI, vbTextCompare) = 0 Then
                        yellowData.Add rego
                    End If
                End If
            End If
        End If
    Next i

    If filterPPI And yellowData.count = 0 Then
        ShowWarning "No YELLOW 'Pre Purchase Vehicle Inspection' jobs found (col J)."
        LogToRR9998 "OpenJobRegister: No yellow PPI jobs available."
        Exit Sub
    End If

    Dim selectionList As String
    Dim j As Long
    For j = 1 To yellowData.count
        selectionList = selectionList & j & ". " & yellowData(j) & vbCrLf
    Next j

    ' Check clipboard for potential rego (auto-copied when clicking Column V in Book a Job)
    Dim clipboardRego As String
    clipboardRego = ""
    On Error Resume Next
    clipboardRego = UCase(Trim(GetTextFromClipboard()))
    On Error GoTo ErrHandler
    
    ' Validate clipboard content looks like a rego (not too long, no special chars)
    ' Only use it if it's a valid-looking rego (alphanumeric, 2-10 chars)
    If Len(clipboardRego) < 2 Or Len(clipboardRego) > 10 Then
        clipboardRego = ""
    ElseIf Not clipboardRego Like "*[A-Z0-9]*" Then
        clipboardRego = ""
    End If

    Dim headerText As String
    headerText = "Please enter a Job Rego or select a number from the yellow-highlighted list:"
    If filterPPI Then headerText = "Please enter a Job Rego or select a number from the YELLOW PPI list:"
    
    ' Add hint if clipboard has a rego
    If clipboardRego <> "" Then
        headerText = headerText & vbCrLf & vbCrLf & "(Clipboard: " & clipboardRego & " - press Enter to use, or type a different rego)"
    End If

    Dim userSelection As Variant
    userSelection = WorksheetFunction.Trim(InputBox(headerText & vbCrLf & selectionList, _
                                                    IIf(filterPPI, "Job Register - PPI", "Job Register"), _
                                                    clipboardRego))

    If userSelection = "" Then
        ShowWarning "No selection made."
        LogToRR9998 "OpenJobRegister: No selection made."
        Exit Sub
    End If

    Dim selectedIndex As Long
    On Error Resume Next
    selectedIndex = CLng(userSelection)
    On Error GoTo 0

    If selectedIndex >= 1 And selectedIndex <= yellowData.count Then
        selectedJobRego = yellowData(selectedIndex)
    Else
        Dim cleanedRego As String: cleanedRego = userSelection
        Dim found As Boolean: found = False

        For j = 1 To yellowData.count
            If StrComp(yellowData(j), cleanedRego, vbTextCompare) = 0 Then
                selectedJobRego = yellowData(j)
                found = True
                Exit For
            End If
        Next j

        If Not found And Not filterPPI Then
            For j = 1 To allData.count
                If StrComp(allData(j), cleanedRego, vbTextCompare) = 0 Then
                    selectedJobRego = allData(j)
                    found = True
                    Exit For
                End If
            Next j
        End If

        If Not found Then
            If filterPPI Then
                ShowWarning "That rego is not in the YELLOW PPI list."
                LogToRR9998 "OpenJobRegister (PPI): rejected non-PPI/non-yellow rego '" & cleanedRego & "'."
                Exit Sub
            Else
                selectedJobRego = cleanedRego
                LogToRR9998 "OpenJobRegister fallback: manual rego accepted - " & selectedJobRego
            End If
        End If
    End If

    On Error Resume Next
    ThisWorkbook.names("CurrentRego").Delete
    On Error GoTo 0
    ThisWorkbook.names.Add name:="CurrentRego", RefersTo:="=""" & selectedJobRego & """"

    ShowStatus "You selected: " & selectedJobRego
    LogToRR9998 "OpenJobRegister completed. Selected Rego: " & selectedJobRego
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in OpenJobRegister: " & Err.description
End Sub

Sub LaunchOutlook()
    On Error GoTo ErrHandler
    LogToRR9998 "LaunchOutlook called."

    Dim olApp As Object
    On Error Resume Next
    Set olApp = GetObject(, "Outlook.Application")
    On Error GoTo 0

    If olApp Is Nothing Then
        Dim outlookPath As String
        outlookPath = "C:\Program Files\Microsoft Office\root\Office16\OUTLOOK.EXE"
        Shell outlookPath, vbNormalFocus
        LogToRR9998 "Outlook launched via Shell."
    Else
        LogToRR9998 "Outlook already running."
    End If
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in LaunchOutlook: " & Err.description
End Sub

Sub UpdateHeaderMapFromSheets()
    On Error GoTo ErrHandler

    Dim wsMap As Worksheet
    Set wsMap = ThisWorkbook.Sheets("White_List")

    Dim headerCol As Long, sheetCol As Long
    Dim LastCol As Long
    LastCol = wsMap.Cells(1, wsMap.Columns.count).End(xlToLeft).Column

    Dim i As Long
    For i = 1 To LastCol
        Select Case LCase(Trim(wsMap.Cells(1, i).value))
            Case "header name": headerCol = i
            Case "sheet name":  sheetCol = i
        End Select
    Next i

    If headerCol = 0 Or sheetCol = 0 Then
        ShowError "Missing 'Header Name' or 'Sheet Name' columns in White_List."
        Exit Sub
    End If

    wsMap.Range(wsMap.Cells(2, headerCol), wsMap.Cells(wsMap.rows.count, headerCol)).ClearContents
    wsMap.Range(wsMap.Cells(2, sheetCol), wsMap.Cells(wsMap.rows.count, sheetCol)).ClearContents

    Dim ws As Worksheet, lastHeaderCol As Long
    Dim outRow As Long: outRow = 2
    Dim headerValue As String

    For Each ws In ThisWorkbook.Sheets
        If ws.name <> wsMap.name Then
            lastHeaderCol = ws.Cells(1, ws.Columns.count).End(xlToLeft).Column
            For i = 1 To lastHeaderCol
                headerValue = Trim(ws.Cells(1, i).value)
                If headerValue <> "" Then
                    wsMap.Cells(outRow, headerCol).value = headerValue
                    wsMap.Cells(outRow, sheetCol).value = ws.name
                    outRow = outRow + 1
                End If
            Next i
        End If
    Next ws

    LogToRR9998 "? Header map updated from all sheets."
    ShowStatus "Header map updated successfully."

    Exit Sub

ErrHandler:
    LogToRR9998 "?? Error in UpdateHeaderMapFromSheets: " & Err.description, "HeaderMapErrors.txt"
    ShowError "Error: " & Err.description
End Sub

Public Function SendViaOutbox( _
    senderAddress As String, _
    recipientAddress As String, _
    subjectText As String, _
    bodyText As String, _
    Optional attachmentPath As String = "", _
    Optional skipTail As Boolean = False _
) As Boolean
    On Error GoTo ErrHandler
    Dim OutlookApp As Object, OutlookNamespace As Object
    Dim TargetAccount As Object, NewMail As Object
    Dim OutboxFolder As Object, Item As Object
    Dim emailSent As Boolean: emailSent = False
    Dim retryCount As Integer: retryCount = 0
    Dim emailID As String, errorContext As String
    Dim userChoice As VbMsgBoxResult
    Dim modifiedBody As String
    
StartAttempt:
    errorContext = "Initializing Outlook"
    Set OutlookApp = CreateObject("Outlook.Application")
    Set OutlookNamespace = OutlookApp.GetNamespace("MAPI")
    
    errorContext = "Finding sender account: " & senderAddress
    Set TargetAccount = Nothing
    For Each TargetAccount In OutlookNamespace.Accounts
        If LCase(TargetAccount.SmtpAddress) = LCase(senderAddress) Then Exit For
    Next TargetAccount
    If TargetAccount Is Nothing Then
        errorContext = "Sender account not found: " & senderAddress
        GoTo ErrHandler
    End If
    
    errorContext = "Getting Outbox"
    Set OutboxFolder = TargetAccount.DeliveryStore.GetDefaultFolder(4)
    
    errorContext = "Clearing existing Outbox items"
    For Each Item In OutboxFolder.items
        If Item.Class = 43 Then
            If Item.Sent = False Then
                Item.send
            End If
        End If
    Next Item
    
    errorContext = "Waiting for Outbox to clear"
    retryCount = 0
    Do While OutboxFolder.items.count > 0 And retryCount < 20
        DoEvents
        retryCount = retryCount + 1
    Loop
    If OutboxFolder.items.count > 0 Then
        errorContext = "Outbox failed to clear - " & OutboxFolder.items.count & " items stuck"
        GoTo ErrHandler
    End If
    
    ' === ULTRA-SIMPLE DATA: BOOKING ID AND CONTACT TYPE ===
    Dim isSMS As Boolean
    isSMS = (InStr(1, recipientAddress, "@sms.tnz.co.nz", vbTextCompare) > 0)
    
    ' Build minimal data string
    Dim dataString As String
    dataString = ""
    
    ' Get booking ID from column X using selectedJobRego
    Dim bookingId As String
    bookingId = ""
    
    If selectedJobRego <> "" Then
        Dim ws As Worksheet
        Dim foundCell As Range
        On Error Resume Next
        Set ws = ThisWorkbook.Sheets("Book a Job")
        If Not ws Is Nothing Then
            ' Find the row with this rego in column V
            Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)
            If Not foundCell Is Nothing Then
                ' Get booking ID from column X of the same row
                bookingId = Trim(ws.Cells(foundCell.Row, "X").value)
            End If
        End If
        On Error GoTo ErrHandler
    End If
    
    ' Add booking ID
    If bookingId <> "" Then
        dataString = "bookingId=" & URLEncode(bookingId)
    End If
    
    ' Determine contact type based on menu selection
    Dim contactType As String
    If currentMenuSelection = 29 Then
        ' PPI menu - submenus 1-4 are seller, 6 is supplier
        If currentSubMenuSelection >= 1 And currentSubMenuSelection <= 4 Then
            contactType = "seller"
        ElseIf currentSubMenuSelection = 6 Then
            contactType = "supplier"
        Else
            contactType = "seller"  ' Default for PPI
        End If
    ElseIf currentMenuSelection = 4 Then
        ' Supplier Communication menu (menu 4)
        contactType = "supplier"
    ElseIf currentMenuSelection >= 9 And currentMenuSelection <= 12 Then
        ' Legacy supplier menus (for backward compatibility)
        contactType = "supplier"
    ElseIf currentMenuSelection = 3 Then
        ' Customer Communication menu (menu 3)
        contactType = "customer"
    Else
        ' Everything else defaults to customer
        contactType = "customer"
    End If
    
    ' Add contact type
    If dataString <> "" Then dataString = dataString & "&"
    dataString = dataString & "contactType=" & contactType
    
    ' For suppliers: include supplier details in the URL (supplier data is NOT in SharePoint)
    ' For customers: only bookingId needed (customer data IS in SharePoint)
    ' Use global variables set by the supplier selection modal in the calling module
    If contactType = "supplier" Then
        ' Add supplier details from global variables (set by calling module's supplier selection)
        If selectedSupplierName <> "" Then
            dataString = dataString & "&supplierName=" & URLEncode(selectedSupplierName)
        End If
        If selectedSupplierEmail <> "" Then
            dataString = dataString & "&supplierEmail=" & URLEncode(selectedSupplierEmail)
        End If
        If selectedSupplierPhone <> "" Then
            dataString = dataString & "&supplierPhone=" & URLEncode(selectedSupplierPhone)
        End If
        If selectedSupplierRego <> "" Then
            dataString = dataString & "&rego=" & URLEncode(selectedSupplierRego)
        ElseIf selectedJobRego <> "" Then
            dataString = dataString & "&rego=" & URLEncode(selectedJobRego)
        End If
    End If
    
    ' NOTE: supplierSupport/customerSupport flags are NOT added here for regular emails
    ' Regular recipients get just contactType - they should NOT see staff items
    ' Staff uses SendEekContactForm/SendEekContactFormToSupplier which add the support flags
    
    ' Encode to Base64
    Dim encodedData As String
    encodedData = EncodeBase64(dataString)
    
    ' Build reply URL
    Dim replyURL As String
    replyURL = "https://www.eek.nz/customer-reply?d=" & encodedData
    
    ' Modify body based on type (skip tail if requested)
    If skipTail Then
        ' No footer/reply link added
        modifiedBody = bodyText
    ElseIf isSMS Then
        modifiedBody = bodyText & vbCrLf & vbCrLf & _
                      "Reply: " & replyURL
    Else
        If InStr(1, bodyText, "<html>", vbTextCompare) > 0 Then
            Dim insertPos As Long
            insertPos = InStr(1, bodyText, "</body>", vbTextCompare)
            If insertPos > 0 Then
                Dim replySection As String
                replySection = "<hr style='margin-top: 30px; border: 1px solid #ddd;'>" & _
                              "<div style='text-align: center; padding: 20px; background-color: #f5f5f5;'>" & _
                              "<p style='margin-bottom: 15px;'>Need to reply or update us about your service?</p>" & _
                              "<a href='" & replyURL & "' style='display: inline-block; padding: 12px 30px; " & _
                              "background-color: #ff5500; color: white; text-decoration: none; " & _
                              "border-radius: 5px; font-weight: bold;'>Reply Online</a>" & _
                              "<p style='margin-top: 10px; font-size: 12px; color: #666;'>" & _
                              "Or copy this link: " & replyURL & "</p></div>"
                modifiedBody = Left(bodyText, insertPos - 1) & replySection & Mid(bodyText, insertPos)
            Else
                modifiedBody = bodyText & "<br><br><hr><p><a href='" & replyURL & "'>Click here to reply or update us</a></p>"
            End If
        Else
            modifiedBody = bodyText & vbCrLf & vbCrLf & _
                          "----------------------------------------" & vbCrLf & _
                          "Need to reply or update us?" & vbCrLf & _
                          "Visit: " & replyURL & vbCrLf & _
                          "----------------------------------------"
        End If
    End If
    
    errorContext = "Creating new email to: " & recipientAddress
    Set NewMail = OutlookApp.CreateItem(0)
    With NewMail
        .To = recipientAddress
        .Subject = subjectText
        If InStr(1, modifiedBody, "<html>", vbTextCompare) > 0 Then
            .HTMLBody = modifiedBody
        Else
            .body = modifiedBody
        End If
        If attachmentPath <> "" Then
            If Dir(attachmentPath) <> "" Then
                .Attachments.Add attachmentPath
            End If
        End If
        .SendUsingAccount = TargetAccount
        .Save
    End With
    
    errorContext = "Moving email to Outbox"
    emailID = NewMail.entryID
    Set NewMail = NewMail.Move(OutboxFolder)
    
    errorContext = "Sending email"
    For Each Item In OutboxFolder.items
        If Item.Class = 43 Then
            If Item.Sent = False Then
                Item.send
            End If
        End If
    Next Item
    
    DoEvents
    Application.Wait Now + timeValue("0:00:02")
    
    userChoice = MsgBox("Please check if the email was sent successfully:" & vbCrLf & vbCrLf & _
                       "To: " & recipientAddress & vbCrLf & _
                       "Subject: " & subjectText & vbCrLf & vbCrLf & _
                       "Check your Outbox and Sent Items." & vbCrLf & _
                       "Did the email send successfully?", _
                       vbYesNo + vbQuestion + vbDefaultButton2, "Verify Email Send")
    
    If userChoice = vbYes Then
        emailSent = True
        MsgBox "Email confirmed sent!" & IIf(Not isSMS, vbCrLf & "Reply link included.", ""), vbInformation, "Success"
    Else
        userChoice = MsgBox("Email did not send." & vbCrLf & vbCrLf & _
                           "Would you like to try sending again?", _
                           vbYesNo + vbQuestion, "Try Again?")
        
        If userChoice = vbYes Then
            Call LogToDesktop("Retrying email send to: " & recipientAddress)
            GoTo StartAttempt
        Else
            Call LogToDesktop("Email send cancelled by user - To: " & recipientAddress)
            emailSent = False
        End If
    End If
    
    SendViaOutbox = emailSent
    Exit Function
    
ErrHandler:
    userChoice = MsgBox("EMAIL SEND ERROR!" & vbCrLf & vbCrLf & _
                       "Context: " & errorContext & vbCrLf & _
                       "Error: " & Err.description & vbCrLf & _
                       "Error Number: " & Err.Number & vbCrLf & vbCrLf & _
                       "To: " & recipientAddress & vbCrLf & _
                       "Subject: " & subjectText & vbCrLf & vbCrLf & _
                       "Would you like to try again?", _
                       vbYesNo + vbQuestion, "Email Send Failed")
    
    If userChoice = vbYes Then
        Call LogToDesktop("Retrying email send after error to: " & recipientAddress)
        Err.Clear
        GoTo StartAttempt
    Else
        Call LogToDesktop("Email send cancelled after error - To: " & recipientAddress & " - Error: " & errorContext)
        SendViaOutbox = False
    End If
End Function

Private Sub AddToDataString(ByRef dataStr As String, key As String, value As String)
    If value <> "" And value <> "0" Then
        If dataStr <> "" Then dataStr = dataStr & "&"
        dataStr = dataStr & key & "=" & URLEncode(value)
    End If
End Sub

' ============================================================================
' UTILITY FUNCTIONS - Now in PublicUtilities module
' Use PublicUtilities.FunctionName directly (e.g., PublicUtilities.URLEncode)
' ============================================================================
' REMOVED: Wrappers removed to avoid "Ambiguous name" compile errors
' Functions moved to PublicUtilities:
'   - SanitizeForURL
'   - TimedMsgBox
'   - ShowStatus, ShowError, ShowWarning
'   - URLEncode
'   - EncodeBase64

Sub LogToDesktop(logMessage As String)
   ' On Error Resume Next
   ' Dim filePath As String
   ' Dim fileNum As Integer
   
   ' filePath = Environ("USERPROFILE") & "\Desktop\EmailLog.txt"
   
   ' fileNum = FreeFile
   ' Open filePath For Append As #fileNum
   
   ' Print #fileNum, Format(Now, "yyyy-mm-dd hh:mm:ss") & " - " & logMessage
   
' Close #fileNum
End Sub

Function GetColorRGB(colorName As String) As Long
    On Error GoTo ErrorHandler

    Dim ws As Worksheet
    Dim headerCol As Long, codeCol As Long
    Dim lastRow As Long, i As Long
    Dim lookupColor As String

    lookupColor = LCase(Trim(colorName))
    Set ws = ThisWorkbook.Sheets("White_List")

    headerCol = GetColumn(ws, "Colour Header")
    codeCol = GetColumn(ws, "Colour Code")

    If headerCol = 0 Or codeCol = 0 Then
        LogToRR9998 "!! 'Colour Header' or 'Colour Code' columns not found in White_List.", "ColorPaletteErrors.txt"
        GetColorRGB = -1
        Exit Function
    End If

    lastRow = ws.Cells(ws.rows.count, headerCol).End(xlUp).Row
    For i = 2 To lastRow
        If LCase(Trim(ws.Cells(i, headerCol).value)) = lookupColor Then
            If IsNumeric(ws.Cells(i, codeCol).value) Then
                GetColorRGB = CLng(ws.Cells(i, codeCol).value)
            Else
                LogToRR9998 "!! Non-numeric color code for '" & colorName & "' in White_List row " & i, "ColorPaletteErrors.txt"
                GetColorRGB = -1
            End If
            Exit Function
        End If
    Next i

    LogToRR9998 "?? Unknown color name requested: '" & colorName & "'", "ColorPaletteErrors.txt"
    GetColorRGB = -1
    Exit Function

ErrorHandler:
    LogToRR9998 "!! Error in GetColorRGB for '" & colorName & "': " & Err.description, "ColorPaletteErrors.txt"
    GetColorRGB = -1
End Function

Public Sub OpenVBAEditor()
    Application.VBE.MainWindow.Visible = True
End Sub

Public Sub ShowVBAManagerHelp()
    MsgBox "VBA MANAGER SHORTCUTS" & vbCrLf & vbCrLf & _
           "Ctrl+Shift+E  -  Open VBA Manager menu" & vbCrLf & _
           "Ctrl+Shift+Q  -  Quick export (silent)" & vbCrLf & _
           "Ctrl+Shift+B  -  Open VBA Editor" & vbCrLf & vbCrLf & _
           "MENU OPTIONS (Ctrl+Shift+E)" & vbCrLf & _
           "1 - Export this workbook" & vbCrLf & _
           "2 - Export all open workbooks" & vbCrLf & _
           "3 - Export to custom folder" & vbCrLf & _
           "4 - Import code" & vbCrLf & _
           "5 - Compare differences" & vbCrLf & _
           "6 - Open export folder" & vbCrLf & _
           "7 - View log" & vbCrLf & _
           "8 - Create restore point" & vbCrLf & _
           "9 - Restore from point", _
           vbInformation, "VBA Manager Help"
End Sub













