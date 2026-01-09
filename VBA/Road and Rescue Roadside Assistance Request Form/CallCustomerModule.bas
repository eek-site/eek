Attribute VB_Name = "CallCustomerModule"
' Attribute VB_Name = "CallCustomerModule"
' Attribute VB_Name = "CallCustomerModule"
Sub CallCustomer()
    On Error GoTo ErrHandler

    Call OpenJobRegister

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? CallCustomer aborted � no Job Rego selected.", "CallLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "? CallCustomer failed � rego not found: " & selectedJobRego, "CallLog.txt"
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    Dim countryCode As String, phoneNumber As String, fullPhoneNumber As String
    countryCode = Trim(ws.Cells(targetRow, "G").value)
    phoneNumber = Trim(ws.Cells(targetRow, "H").value)

    If countryCode = "" Or phoneNumber = "" Then
        ShowWarning "Missing country code or phone number."
        LogToRR9998 "? CallCustomer failed � missing phone fields for rego: " & selectedJobRego, "CallLog.txt"
        Exit Sub
    End If

    fullPhoneNumber = countryCode & phoneNumber

    Dim callURL As String
    callURL = "tel:" & fullPhoneNumber

    ActiveWorkbook.FollowHyperlink address:=callURL, NewWindow:=True

    LogToRR9998 "?? CallCustomer launched call to: " & fullPhoneNumber & " for rego: " & selectedJobRego, "CallLog.txt"
    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in CallCustomer: " & Err.description, "CallLog.txt"
End Sub




