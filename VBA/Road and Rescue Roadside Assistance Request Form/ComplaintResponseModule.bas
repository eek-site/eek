Attribute VB_Name = "ComplaintResponseModule"
' Attribute VB_Name = "ComplaintResponseModule"
' Attribute VB_Name = "ComplaintResponseModule"
Sub ComplaintResponse()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? Complaint response aborted � no Job Rego selected.", "ComplaintLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "? Complaint response failed � rego not found: " & selectedJobRego, "ComplaintLog.txt"
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    ' === Validate mobile details ===
    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = Trim(ws.Cells(targetRow, "G").value)
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)

    If Left(mobileNumber, Len(countryCode)) = countryCode Then
        mobileNumber = Mid(mobileNumber, Len(countryCode) + 1)
    End If

    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    mobileNumber = Replace(mobileNumber, "+", "")

    If Left(countryCode, 1) <> "+" Then countryCode = "+" & countryCode

    If countryCode = "" Or mobileNumber = "" Then
        ShowWarning "Missing mobile number or country code for this job."
        LogToRR9998 "? Complaint response failed � missing mobile fields for rego: " & selectedJobRego, "ComplaintLog.txt"
        Exit Sub
    End If

    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"

    ' === Compose message ===
    Dim emailSubject As String, emailBody As String
    emailSubject = "Dispute or Complaint � Rego " & selectedJobRego

    emailBody = "Thank you for your message. If you wish to formally raise a complaint or request a refund review," & vbCrLf & _
                "please complete the following form:" & vbCrLf & _
                "https://www.eek.nz/dispute-form" & vbCrLf & vbCrLf & _
                "All submissions will be reviewed and responded to in accordance with our terms of trade." & vbCrLf & _
                "You may also reply to this message for assistance or clarification." & vbCrLf & vbCrLf & _
                "EEK Mechanical � " & vbCrLf & _
                "www.eek.nz"

    ' === Send using standard SendViaOutbox ===
    If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, emailBody) Then
        ShowStatus "? Complaint response sent via SMS."
        ws.Cells(targetRow, "AA").value = "Complaint response sent: " & Now
        ws.Cells(targetRow, "AB").value = mobileEmail
        LogToRR9998 "? Complaint response sent to: " & mobileEmail & " for rego: " & selectedJobRego, "ComplaintLog.txt"
    Else
        ShowError "? There was an issue sending the complaint response."
        LogToRR9998 "? Complaint response failed during send for rego: " & selectedJobRego, "ComplaintLog.txt"
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in ComplaintResponse: " & Err.description, "ComplaintLog.txt"
End Sub






