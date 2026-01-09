Attribute VB_Name = "GenerateCustomerRefundModule"
' Attribute VB_Name = "GenerateCustomerRefundModule"
' Attribute VB_Name = "GenerateCustomerRefundModule"
Sub GenerateCustomerRefundFile()
    ' Call the sub that lets the user select a Job Rego.
    Call OpenJobRegister

    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "Error: No Job Rego selected.", "MasterLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")

    ' Retrieve the stored registration
    Dim rego As String
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo 0

    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")

    If rego = "" Then
        MsgBox "No registration found. Returning to main menu.", vbExclamation, "Error"
        LogToRR9998 "Error: No registration found for " & selectedJobRego, "MasterLog.txt"
        Exit Sub
    End If

    ' Search for first Billable record for the matching rego
    Dim lastRow As Long, i As Long, foundRow As Long
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    foundRow = 0

    For i = 2 To lastRow
        If LCase(ws.Cells(i, 6).value) = LCase(rego) And LCase(ws.Cells(i, 7).value) = "billable" Then
            foundRow = i
            Exit For
        End If
    Next i

    If foundRow = 0 Then
        MsgBox "No billable customer entry found for this registration.", vbExclamation, "Not Found"
        LogToRR9998 "Error: No billable customer refund entry found for rego " & rego, "MasterLog.txt"
        Exit Sub
    End If

    ' Prompt for amount
    Dim amount As String
    amount = InputBox("Enter the refund amount (e.g., 249.00):", "Enter Refund Amount")
    If Trim(amount) = "" Or Not IsNumeric(amount) Then
        MsgBox "Invalid or no amount entered. Exiting.", vbExclamation, "Cancelled"
        LogToRR9998 "Error: No valid amount entered for rego " & rego, "MasterLog.txt"
        Exit Sub
    End If

    ' Prompt for bank account
    Dim bankAccount As String
    bankAccount = InputBox("Enter the customer's bank account number (e.g., 12-3456-7890123-00):", "Customer Bank Account")
    If Trim(bankAccount) = "" Then
        MsgBox "Bank account entry was cancelled. Exiting.", vbExclamation, "Cancelled"
        LogToRR9998 "Error: No bank account entered for rego " & rego, "MasterLog.txt"
        Exit Sub
    End If

    ' Retrieve client name + optional reference fields from sheet
    Dim clientName As String, ref As String, particulars As String, code As String
    clientName = ws.Cells(foundRow, 27).value  ' Column AA (Client)
    ref = ws.Cells(foundRow, 22).value         ' Column V
    particulars = ws.Cells(foundRow, 20).value ' Column T
    code = ws.Cells(foundRow, 21).value        ' Column U

    ' Truncate fields to 12 characters
    If Len(ref) > 12 Then ref = Left(ref, 12)
    If Len(particulars) > 12 Then particulars = Left(particulars, 12)
    If Len(code) > 12 Then code = Left(code, 12)

    ' Build batch file line
    Dim batchLine As String
    batchLine = amount & "," & bankAccount & "," & clientName & "," & ref & "," & particulars & "," & code & _
                "," & ref & "," & particulars & "," & code

    ' Save file
    Dim filePath As String
    filePath = GetRRFilePath("9998 LOGS\BatchFiles\" & rego & "_" & clientName & "_REFUND.DLO", True)

    Dim fileNum As Integer
    fileNum = FreeFile
    Open filePath For Output As fileNum
    Print #fileNum, batchLine
    Close fileNum

    ws.Cells(foundRow, 36).value = "Yes" ' Column AJ

    LogToRR9998 "Customer refund batch file created for " & clientName & " (" & rego & "). File: " & filePath, "MasterLog.txt"
    MsgBox "Customer refund file created: " & filePath, vbInformation, "Success"
End Sub














