Attribute VB_Name = "UpdateJobAddressByRegoModule"
' Attribute VB_Name = "UpdateJobAddressByRegoModule"
' Attribute VB_Name = "UpdateJobAddressByRegoModule"
Sub UpdateJobAddressByRego()
    On Error GoTo ErrHandler
    LogToRR9998 "UpdateJobAddressByRego started."

    Call OpenJobRegister

    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "UpdateJobAddressByRego aborted � no Job Rego selected"
        Exit Sub
    End If

    Dim newAddress As String
    newAddress = InputBox("Enter the new address for rego " & selectedJobRego, "Update Address")

    If Trim(newAddress) = "" Then
        MsgBox "No address entered. Operation cancelled."
        LogToRR9998 "UpdateJobAddressByRego aborted � no address entered"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim lastRow As Long
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row

    Dim i As Long, foundRow As Long
    foundRow = 0

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            foundRow = i
            Exit For
        End If
    Next i

    If foundRow = 0 Then
        MsgBox "Selected Rego not found in 'Book a Job'."
        LogToRR9998 "UpdateJobAddressByRego aborted � rego not found: " & selectedJobRego
        Exit Sub
    End If

    ' Get old address for notification
    Dim oldAddress As String
    oldAddress = Trim(ws.Cells(foundRow, "K").value)

    ' Update the address
    ws.Cells(foundRow, "K").value = newAddress
    LogToRR9998 "Updated address for rego " & selectedJobRego & " to: " & newAddress

    ' Notify customer of the change
    Call NotifyCustomerOfChange(selectedJobRego, "Your job address has been updated", oldAddress, newAddress)

    MsgBox "Address for rego " & selectedJobRego & " updated successfully." & vbCrLf & _
           "Customer has been notified of this change."

Cleanup:
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in UpdateJobAddressByRego: " & Err.description
    Resume Cleanup
End Sub











