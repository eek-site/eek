Attribute VB_Name = "UpdateInvoiceNameModule"
' Attribute VB_Name = "UpdateInvoiceNameModule"
' Attribute VB_Name = "UpdateInvoiceNameModule"
Option Explicit

' ===============================
' UPDATE INVOICE NAME MODULE
' Updates column F (Invoice Name) in "Book a Job" sheet
' Customer name (column E) is used for communications
' Invoice name (column F) is used for invoicing
' ===============================

Sub UpdateInvoiceName()
    On Error GoTo ErrHandler
    LogToRR9998 "UpdateInvoiceName started."

    ' Standard job selection process
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "UpdateInvoiceName aborted - no Job Rego selected.", "UpdateInvoiceNameLog.txt"
        Exit Sub
    End If

    ' Lookup the job in "Book a Job" sheet
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        MsgBox "Selected Rego not found in column V."
        LogToRR9998 "UpdateInvoiceName failed - rego not found: " & selectedJobRego, "UpdateInvoiceNameLog.txt"
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    ' Get current values
    Dim currentCustomerName As String
    Dim currentInvoiceName As String
    
    currentCustomerName = Trim(ws.Cells(targetRow, "E").value)  ' Column E = Customer Name
    currentInvoiceName = Trim(ws.Cells(targetRow, "F").value)    ' Column F = Invoice Name

    ' Display current values and prompt for new invoice name
    Dim promptMsg As String
    promptMsg = "UPDATE INVOICE NAME" & vbCrLf & vbCrLf & _
                "Rego: " & UCase(selectedJobRego) & vbCrLf & _
                "Customer Name (Column E): " & currentCustomerName & vbCrLf & _
                "Current Invoice Name (Column F): " & IIf(currentInvoiceName = "", "(empty)", currentInvoiceName) & vbCrLf & vbCrLf & _
                "Enter new Invoice Name (company name for invoicing):" & vbCrLf & _
                "(Leave blank to cancel)"
    
    Dim newInvoiceName As String
    newInvoiceName = InputBox(promptMsg, "Update Invoice Name", currentInvoiceName)
    
    If newInvoiceName = "" Then
        LogToRR9998 "UpdateInvoiceName cancelled by user.", "UpdateInvoiceNameLog.txt"
        Exit Sub
    End If
    
    ' Update the invoice name
    ws.Cells(targetRow, "F").value = Trim(newInvoiceName)
    
    ' Notify customer of the change
    Call NotifyCustomerOfChange(selectedJobRego, "Your invoice name has been updated", currentInvoiceName, Trim(newInvoiceName))
    
    ' Confirm update
    MsgBox "Invoice Name updated successfully!" & vbCrLf & vbCrLf & _
           "Rego: " & UCase(selectedJobRego) & vbCrLf & _
           "Customer Name: " & currentCustomerName & vbCrLf & _
           "Invoice Name: " & Trim(newInvoiceName) & vbCrLf & vbCrLf & _
           "Customer has been notified of this change.", vbInformation, "Update Complete"
    
    LogToRR9998 "UpdateInvoiceName completed - Rego: " & selectedJobRego & ", Invoice Name: " & Trim(newInvoiceName), "UpdateInvoiceNameLog.txt"
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateInvoiceName: " & Err.description, "UpdateInvoiceNameLog.txt"
    MsgBox "Error updating invoice name: " & Err.description, vbCritical, "Error"
End Sub







