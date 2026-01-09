Attribute VB_Name = "CancellationModule"
' Attribute VB_Name = "CancellationModule"
' Attribute VB_Name = "CancellationModule"
Sub Cancellation()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? Cancellation aborted � no Job Rego selected.", "CancellationLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "? Cancellation failed � rego not found: " & selectedJobRego, "CancellationLog.txt"
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
        LogToRR9998 "? Cancellation failed � missing mobile fields for rego: " & selectedJobRego, "CancellationLog.txt"
        Exit Sub
    End If

    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"

    ' === Compose message ===
    Dim emailSubject As String, emailBody As String
    emailSubject = "Cancellation for Rego " & selectedJobRego

    emailBody = "As you have cancelled after ordering the service you are liable for the cancellation fee." & vbCrLf & vbCrLf & _
                "Please pay $29.00" & vbCrLf & _
                "Bank: ANZ" & vbCrLf & _
                "Branch: Chartwell" & vbCrLf & _
                "Account name: EEK Mechanical" & vbCrLf & _
                "Account number: 06-0313-0860749-00" & vbCrLf & _
                "Reference: " & selectedJobRego & vbCrLf & vbCrLf & _
                "Please advise if you need a tax receipt." & vbCrLf & vbCrLf & _
                "Please note that failing to pay will lead to your vehicle being clamped at any one of our parking locations in Auckland." & vbCrLf & vbCrLf & _
                "EEK Mechanical � " & vbCrLf & _
                "www.eek.nz"

    ' === Use SendViaOutbox
    If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, emailBody) Then
        ShowStatus "? Cancellation notice sent via SMS."
        ws.Cells(targetRow, "Z").value = "Cancellation sent: " & Now
        LogToRR9998 "? Cancellation sent to: " & mobileEmail & " for rego: " & selectedJobRego, "CancellationLog.txt"
    Else
        ShowError "There was an issue sending the cancellation notice."
        LogToRR9998 "? Cancellation failed during send for rego: " & selectedJobRego, "CancellationLog.txt"
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in Cancellation: " & Err.description, "CancellationLog.txt"
End Sub






