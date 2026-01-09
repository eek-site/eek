Attribute VB_Name = "SendLocationRequestModule"
' Attribute VB_Name = "SendLocationRequestModule"
' Attribute VB_Name = "SendLocationRequestModule"
Sub SendLocationRequest()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "SendLocationRequest aborted � no Job Rego selected", "LocationRequestLog.txt"
        Exit Sub
    End If

    ' === Lookup contact details in "Book a Job"
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim lastRow As Long, i As Long, targetRow As Long
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    targetRow = 0

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i
            Exit For
        End If
    Next i

    If targetRow = 0 Then
        ShowWarning "Selected Rego not found in 'Book a Job'."
        LogToRR9998 "SendLocationRequest aborted � rego not found in 'Book a Job': " & selectedJobRego, "LocationRequestLog.txt"
        Exit Sub
    End If

    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    Dim mobileEmail As String

    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    countryCode = Replace(countryCode, " ", "")
    mobileNumber = Replace(Trim(ws.Cells(targetRow, "H").value), " ", "")
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    customerName = Trim(ws.Cells(targetRow, "E").value)

    If countryCode = "" Or mobileNumber = "" Then
        ShowWarning "Missing mobile number or country code."
        LogToRR9998 "Missing mobile contact for rego: " & selectedJobRego, "LocationRequestLog.txt"
        GoTo MaybeSendEmailOnly
    End If

    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"

    ' === Compose messages
    Dim emailSubject As String, smsText As String, emailText As String
    emailSubject = "Location Request for Rego " & selectedJobRego

    smsText = "Hi " & IIf(customerName <> "", customerName, "there") & _
              ", tap to share your live location so our driver can find you quickly: " & _
              "www.eek.nz/find-me" & vbCrLf & _
              "� EEK Mechanical"

    emailText = "Dear " & IIf(customerName <> "", customerName, "Customer") & "," & vbCrLf & vbCrLf & _
                "Please share your live location so our driver can reach you faster:" & vbCrLf & _
                "www.eek.nz/find-me" & vbCrLf & vbCrLf & _
                "If you prefer, you can reply with your exact address or any entry/parking details." & vbCrLf & vbCrLf & _
                "� EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"

    ' === Send SMS (via email-to-SMS gateway)
    DoEvents
    If mobileEmail <> "" Then
        If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText) Then
            LogToRR9998 "Location request SMS sent to: " & mobileEmail & " for rego " & selectedJobRego, "LocationRequestLog.txt"
        Else
            LogToRR9998 "Failed to send location request SMS for rego " & selectedJobRego, "LocationRequestLog.txt"
        End If
    End If

MaybeSendEmailOnly:
    ' === Send email
    If customerEmail = "" Then
        LogToRR9998 "Missing email for rego: " & selectedJobRego & " (email not sent)", "LocationRequestLog.txt"
    Else
        DoEvents
        If SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText) Then
            LogToRR9998 "Location request email sent to: " & customerEmail & " for rego " & selectedJobRego, "LocationRequestLog.txt"
        Else
            LogToRR9998 "Failed to send location request email for rego " & selectedJobRego, "LocationRequestLog.txt"
        End If
    End If

    ShowStatus "Location request sent (SMS and/or Email) for rego " & selectedJobRego & "."

Cleanup:
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendLocationRequest for rego " & selectedJobRego & ": " & Err.description, "LocationRequestLog.txt"
    Resume Cleanup
End Sub






