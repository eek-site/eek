Attribute VB_Name = "ChangeNotificationModule"
' Attribute VB_Name = "ChangeNotificationModule"
' Attribute VB_Name = "ChangeNotificationModule"
Option Explicit

' ===============================
' CHANGE NOTIFICATION MODULE
' Sends notifications to customers or suppliers when their details are updated
' Uses existing SendToCustomer and SendToSupplier functions from JobHelpers
' ===============================

' Notify customer of changes to their details
Public Sub NotifyCustomerOfChange(ByVal rego As String, ByVal changeDescription As String, Optional ByVal oldValue As String = "", Optional ByVal newValue As String = "")
    On Error GoTo ErrHandler
    
    Call LaunchOutlook
    
    ' Get customer info using existing helper
    Dim customer As CustomerInfo
    customer = GetCustomerByRego(rego)
    
    If Not customer.IsValid Then
        LogToRR9998 "NotifyCustomerOfChange: " & customer.errorMessage & " | Rego: " & rego, "ChangeNotificationLog.txt"
        Exit Sub
    End If
    
    ' Build notification message
    Dim smsText As String, emailText As String, emailSubject As String
    
    emailSubject = "Update to Your Job Details - Rego " & UCase(rego)
    
    Dim changeMsg As String
    If oldValue <> "" And newValue <> "" Then
        changeMsg = changeDescription & vbCrLf & _
                   "Previous: " & oldValue & vbCrLf & _
                   "Updated to: " & newValue
    Else
        changeMsg = changeDescription
    End If
    
    smsText = "Hi " & IIf(customer.name <> "", customer.name, "there") & "," & vbCrLf & _
              "We've updated your job details for rego " & UCase(rego) & "." & vbCrLf & _
              changeMsg & vbCrLf & vbCrLf & _
              "If you have any questions, please contact us." & vbCrLf & _
              "EEK Mechanical | www.eek.nz"
    
    emailText = "Dear " & IIf(customer.name <> "", customer.name, "Customer") & "," & vbCrLf & vbCrLf & _
                "We've updated your job details for registration " & UCase(rego) & "." & vbCrLf & vbCrLf & _
                changeMsg & vbCrLf & vbCrLf & _
                "If you have any questions or concerns about this change, please don't hesitate to contact us." & vbCrLf & vbCrLf & _
                "Kind regards," & vbCrLf & _
                "EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    ' Send notification using existing helper function
    Dim result As String
    result = SendToCustomer(customer, emailSubject, smsText, emailText, "ChangeNotification")
    
    LogToRR9998 "NotifyCustomerOfChange: " & result & " | Rego: " & rego & " | Change: " & changeDescription, "ChangeNotificationLog.txt"
    
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifyCustomerOfChange: " & Err.description & " | Rego: " & rego, "ChangeNotificationLog.txt"
End Sub

' Notify supplier of changes to their details
Public Sub NotifySupplierOfChange(ByVal rego As String, ByVal supplierName As String, ByVal changeDescription As String, Optional ByVal oldValue As String = "", Optional ByVal newValue As String = "")
    On Error GoTo ErrHandler
    
    Call LaunchOutlook
    
    ' Get suppliers for this rego using existing helper
    Dim suppliers As Collection
    Set suppliers = GetSuppliersForRego(rego)
    
    If suppliers.count = 0 Then
        LogToRR9998 "NotifySupplierOfChange: No suppliers found for rego: " & rego, "ChangeNotificationLog.txt"
        Exit Sub
    End If
    
    ' Find the matching supplier by name
    Dim supplier As SupplierInfo
    Dim sup As SupplierInfo
    Dim found As Boolean
    found = False
    
    Dim i As Long
    For i = 1 To suppliers.count
        sup = suppliers(i)
        If Trim(UCase(sup.name)) = Trim(UCase(supplierName)) Then
            supplier = sup
            found = True
            Exit For
        End If
    Next i
    
    If Not found Then
        LogToRR9998 "NotifySupplierOfChange: Supplier '" & supplierName & "' not found for rego: " & rego, "ChangeNotificationLog.txt"
        Exit Sub
    End If
    
    ' Build notification message
    Dim smsText As String, emailText As String, emailSubject As String
    
    emailSubject = "Update to Your Supplier Details - Job " & UCase(rego)
    
    Dim changeMsg As String
    If oldValue <> "" And newValue <> "" Then
        changeMsg = changeDescription & vbCrLf & _
                   "Previous: " & oldValue & vbCrLf & _
                   "Updated to: " & newValue
    Else
        changeMsg = changeDescription
    End If
    
    smsText = "Hi " & supplier.name & "," & vbCrLf & _
              "We've updated your details for job " & UCase(rego) & "." & vbCrLf & _
              changeMsg & vbCrLf & vbCrLf & _
              "If you have questions, contact us." & vbCrLf & _
              "EEK Mechanical | www.eek.nz"
    
    emailText = "Dear " & supplier.name & "," & vbCrLf & vbCrLf & _
                "We've updated your supplier details for job " & UCase(rego) & "." & vbCrLf & vbCrLf & _
                changeMsg & vbCrLf & vbCrLf & _
                "If you have any questions about this change, please contact us." & vbCrLf & vbCrLf & _
                "Kind regards," & vbCrLf & _
                "EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    ' Send notification using existing helper function
    Dim result As String
    result = SendToSupplier(supplier, emailSubject, smsText, emailText, "ChangeNotification")
    
    LogToRR9998 "NotifySupplierOfChange: " & result & " | Rego: " & rego & " | Supplier: " & supplierName & " | Change: " & changeDescription, "ChangeNotificationLog.txt"
    
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifySupplierOfChange: " & Err.description & " | Rego: " & rego, "ChangeNotificationLog.txt"
End Sub







