Attribute VB_Name = "JobHelpers"
' Attribute VB_Name = "JobHelpers"
' Attribute VB_Name = "JobHelpers"
Option Explicit

' ============================================================================
' JOB HELPERS MODULE
' Consolidated helper functions to reduce code duplication across modules
' ============================================================================

' === CONSTANTS ===
' NOTE: SMS_GATEWAY is now in PublicUtilities module
Public Const DEFAULT_SENDER As String = "no-reply@eek.nz"
Public Const COMPANY_SIGNATURE As String = "EEK Mechanical" & vbCrLf & "www.eek.nz"
Public Const COMPANY_SIGNATURE_SHORT As String = "EEK Mechanical - www.eek.nz"
Public Const COMPANY_PHONE As String = "0800 769 000"
Public Const SUPPLIER_CONTACT_PHONE As String = "09 872 4612"  ' Direct line for supplier enquiries
Public Const BANK_ACCOUNT As String = "06-0313-0860749-00"

' === DATA TYPES ===
Public Type CustomerInfo
    name As String
    Email As String
    countryCode As String
    mobileNumber As String
    smsAddress As String
    address As String
    Row As Long
    IsValid As Boolean
    errorMessage As String
End Type

Public Type SupplierInfo
    name As String
    Email As String
    mobileNumber As String
    smsAddress As String
    Row As Long
    recordType As String
    IsValidMobile As Boolean
    IsValid As Boolean
    errorMessage As String
End Type

' ============================================================================
' INITIALIZATION HELPERS
' ============================================================================

' Standard module initialization - returns True if ready to proceed
Public Function InitializeJobModule(Optional showMessages As Boolean = True) As Boolean
    On Error GoTo ErrHandler
    
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        If showMessages Then MsgBox "No Job Rego selected.", vbExclamation, "No Selection"
        InitializeJobModule = False
        Exit Function
    End If
    
    InitializeJobModule = True
    Exit Function
    
ErrHandler:
    LogToRR9998 "Error in InitializeJobModule: " & Err.description
    InitializeJobModule = False
End Function

' Initialize without Outlook (for read-only operations)
Public Function InitializeJobModuleBasic(Optional showMessages As Boolean = True) As Boolean
    On Error GoTo ErrHandler
    
    Call OpenJobRegister
    
    If selectedJobRego = "" Then
        If showMessages Then MsgBox "No Job Rego selected.", vbExclamation, "No Selection"
        InitializeJobModuleBasic = False
        Exit Function
    End If
    
    InitializeJobModuleBasic = True
    Exit Function
    
ErrHandler:
    LogToRR9998 "Error in InitializeJobModuleBasic: " & Err.description
    InitializeJobModuleBasic = False
End Function

' ============================================================================
' CUSTOMER LOOKUP HELPERS
' ============================================================================

' Get customer info from Book a Job by rego
Public Function GetCustomerByRego(ByVal rego As String) As CustomerInfo
    On Error GoTo ErrHandler
    
    Dim result As CustomerInfo
    Dim ws As Worksheet
    Dim foundCell As Range
    
    result.IsValid = False
    
    If Trim(rego) = "" Then
        result.errorMessage = "No rego provided"
        GetCustomerByRego = result
        Exit Function
    End If
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set foundCell = ws.Range("V:V").Find(What:=rego, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundCell Is Nothing Then
        result.errorMessage = "Rego not found in Book a Job"
        GetCustomerByRego = result
        Exit Function
    End If
    
    result.Row = foundCell.Row
    result.name = Trim(ws.Cells(result.Row, "E").value)
    result.Email = Trim(ws.Cells(result.Row, "D").value)
    result.countryCode = CleanCountryCode(ws.Cells(result.Row, "G").value)
    result.mobileNumber = CleanMobileNumber(ws.Cells(result.Row, "H").value)
    result.address = Trim(ws.Cells(result.Row, "K").value)
    
    ' Build SMS address if we have valid mobile details
    If result.countryCode <> "" And result.mobileNumber <> "" Then
        result.smsAddress = BuildSmsAddress(result.countryCode, result.mobileNumber)
        result.IsValid = True
    Else
        result.errorMessage = "Missing mobile number or country code"
    End If
    
    GetCustomerByRego = result
    Exit Function
    
ErrHandler:
    result.errorMessage = "Error: " & Err.description
    GetCustomerByRego = result
End Function

' Find row number for rego in Book a Job (returns 0 if not found)
Public Function FindRegoRowInBookAJob(ByVal rego As String) As Long
    On Error GoTo ErrHandler
    
    Dim ws As Worksheet
    Dim foundCell As Range
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set foundCell = ws.Range("V:V").Find(What:=rego, LookIn:=xlValues, LookAt:=xlWhole)
    
    If foundCell Is Nothing Then
        FindRegoRowInBookAJob = 0
    Else
        FindRegoRowInBookAJob = foundCell.Row
    End If
    Exit Function
    
ErrHandler:
    FindRegoRowInBookAJob = 0
End Function

' ============================================================================
' SUPPLIER LOOKUP HELPERS
' ============================================================================

' Get all suppliers for a rego from Job Build Notes
Public Function GetSuppliersForRego(ByVal rego As String) As Collection
    On Error GoTo ErrHandler
    
    Dim suppliers As New Collection
    Dim ws As Worksheet
    Dim lastRow As Long, i As Long
    Dim sup As SupplierInfo
    
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    lastRow = ws.Cells(ws.rows.count, "F").End(xlUp).Row
    
    For i = 2 To lastRow
        If StrComp(Trim(ws.Cells(i, "F").value), Trim(rego), vbTextCompare) = 0 Then
            If InStr(1, ws.Cells(i, "G").value, "Supplier", vbTextCompare) > 0 Then
                sup.Row = i
                sup.name = Trim(ws.Cells(i, "H").value)
                sup.Email = Trim(ws.Cells(i, "X").value)
                sup.mobileNumber = Trim(ws.Cells(i, "Y").value)
                sup.recordType = Trim(ws.Cells(i, "G").value)
                sup.IsValidMobile = IsValidNZMobile(sup.mobileNumber)
                
                If sup.IsValidMobile Then
                    sup.smsAddress = sup.mobileNumber & SMS_GATEWAY
                End If
                
                sup.IsValid = (sup.name <> "")
                suppliers.Add sup
            End If
        End If
    Next i
    
    Set GetSuppliersForRego = suppliers
    Exit Function
    
ErrHandler:
    Set GetSuppliersForRego = New Collection
End Function

' Display supplier picker and return selected supplier (Nothing if cancelled)
Public Function PickSupplier(ByVal rego As String, Optional ByVal promptTitle As String = "Select Supplier") As SupplierInfo
    On Error GoTo ErrHandler
    
    Dim result As SupplierInfo
    Dim suppliers As Collection
    Dim supplierList As String
    Dim i As Long
    Dim selectedIndex As Variant
    Dim sup As SupplierInfo
    
    result.IsValid = False
    
    Set suppliers = GetSuppliersForRego(rego)
    
    If suppliers.count = 0 Then
        result.errorMessage = "No suppliers found for rego: " & rego
        PickSupplier = result
        Exit Function
    End If
    
    If suppliers.count = 1 Then
        ' Only one supplier, return it directly
        PickSupplier = suppliers(1)
        Exit Function
    End If
    
    ' Build selection list
    For i = 1 To suppliers.count
        sup = suppliers(i)
        supplierList = supplierList & i & ". " & sup.name & vbCrLf
    Next i
    
    ' Prompt user
    selectedIndex = Application.InputBox( _
        prompt:="Select supplier by number (1 to " & suppliers.count & "):" & vbCrLf & supplierList, _
        title:=promptTitle, _
        Type:=1)
    
    If VarType(selectedIndex) = vbBoolean Then
        result.errorMessage = "Selection cancelled"
        PickSupplier = result
        Exit Function
    End If
    
    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > suppliers.count Then
        result.errorMessage = "Invalid selection"
        PickSupplier = result
        Exit Function
    End If
    
    PickSupplier = suppliers(CLng(selectedIndex))
    Exit Function
    
ErrHandler:
    result.errorMessage = "Error: " & Err.description
    PickSupplier = result
End Function

' ============================================================================
' PHONE/SMS HELPERS - Now in PublicUtilities module
' Use PublicUtilities.CleanCountryCode, PublicUtilities.CleanMobileNumber, etc.
' ============================================================================
' REMOVED: Wrappers removed to avoid "Ambiguous name" compile errors
' All phone/SMS helpers are now in PublicUtilities module

' ============================================================================
' MESSAGING HELPERS
' ============================================================================

' Send both SMS and Email to customer, returns status message
Public Function SendToCustomer( _
    ByRef customer As CustomerInfo, _
    ByVal Subject As String, _
    ByVal smsBody As String, _
    Optional ByVal emailBody As String = "", _
    Optional ByVal logCategory As String = "CustomerMessage" _
) As String
    On Error GoTo ErrHandler
    
    Dim smsSent As Boolean, emailSent As Boolean
    Dim result As String
    
    ' Use SMS body for email if no separate email body provided
    If emailBody = "" Then emailBody = smsBody
    
    ' Send SMS
    If customer.smsAddress <> "" Then
        smsSent = SendViaOutbox(DEFAULT_SENDER, customer.smsAddress, Subject, smsBody)
    End If
    
    ' Send Email
    If customer.Email <> "" Then
        emailSent = SendViaOutbox(DEFAULT_SENDER, customer.Email, Subject, emailBody)
    End If
    
    ' Build result message
    If smsSent And emailSent Then
        result = "Sent to SMS and Email"
        LogToRR9998 logCategory & " sent to SMS: " & customer.smsAddress & " & Email: " & customer.Email
    ElseIf smsSent And Not emailSent Then
        If customer.Email = "" Then
            result = "Sent to SMS only (no email on file)"
        Else
            result = "SMS sent, email failed"
        End If
        LogToRR9998 logCategory & " sent to SMS: " & customer.smsAddress
    ElseIf Not smsSent And emailSent Then
        result = "Email sent, SMS failed"
        LogToRR9998 logCategory & " sent to Email: " & customer.Email
    Else
        result = "Failed to send both SMS and Email"
        LogToRR9998 logCategory & " failed for rego: " & selectedJobRego
    End If
    
    SendToCustomer = result
    Exit Function
    
ErrHandler:
    SendToCustomer = "Error: " & Err.description
    LogToRR9998 "Error in SendToCustomer: " & Err.description
End Function

' Send to supplier
Public Function SendToSupplier( _
    ByRef supplier As SupplierInfo, _
    ByVal Subject As String, _
    ByVal smsBody As String, _
    Optional ByVal emailBody As String = "", _
    Optional ByVal logCategory As String = "SupplierMessage" _
) As String
    On Error GoTo ErrHandler
    
    Dim smsSent As Boolean, emailSent As Boolean
    Dim result As String
    
    If emailBody = "" Then emailBody = smsBody
    
    ' Send SMS if valid mobile
    If supplier.IsValidMobile And supplier.smsAddress <> "" Then
        smsSent = SendViaOutbox(DEFAULT_SENDER, supplier.smsAddress, Subject, smsBody)
    End If
    
    ' Send Email
    If supplier.Email <> "" Then
        emailSent = SendViaOutbox(DEFAULT_SENDER, supplier.Email, Subject, emailBody)
    End If
    
    ' Build result
    If smsSent And emailSent Then
        result = "Sent to SMS and Email"
    ElseIf smsSent Then
        result = "Sent to SMS only"
    ElseIf emailSent Then
        result = "Sent to Email only"
    Else
        result = "Failed to send"
    End If
    
    LogToRR9998 logCategory & " for " & supplier.name & ": " & result
    SendToSupplier = result
    Exit Function
    
ErrHandler:
    SendToSupplier = "Error: " & Err.description
End Function

' ============================================================================
' CURRENCY HELPER - Now in PublicUtilities module
' Use PublicUtilities.GetCurrencyFromCountryCode
' ============================================================================

' ============================================================================
' EMAIL SIGNATURE HELPERS
' ============================================================================

Public Function GetEmailSignature(Optional ByVal includeAddress As Boolean = False) As String
    Dim sig As String
    sig = "EEK Mechanical" & vbCrLf & _
          "www.eek.nz"
    
    If includeAddress Then
        sig = sig & vbCrLf & _
              "Level 1, 6 Johnsonville Road" & vbCrLf & _
              "Johnsonville, Wellington 6037"
    End If
    
    GetEmailSignature = sig
End Function

Public Function GetSmsSignature() As String
    GetSmsSignature = "EEK Mechanical - www.eek.nz"
End Function

' ============================================================================
' COLUMN HELPER - Now in PublicUtilities module
' Use PublicUtilities.GetColumnByHeader
' ============================================================================

' ============================================================================
' CLIPBOARD HELPER - Use PublicUtilities.CopyTextToClipboard directly
' ============================================================================
' REMOVED: CopyTextToClipboard wrapper - use PublicUtilities.CopyTextToClipboard instead













