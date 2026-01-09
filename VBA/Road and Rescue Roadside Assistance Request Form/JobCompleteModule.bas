Attribute VB_Name = "JobCompleteModule"
' Attribute VB_Name = "JobCompleteModule"
' Attribute VB_Name = "JobCompleteModule"
Sub JobComplete()
    On Error GoTo ErrHandler
    LogToRR9998 "JobComplete started."

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        LogToRR9998 "No Job Rego selected. Exiting JobComplete."
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        LogToRR9998 "Selected Rego not found in column V."
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = ws.Cells(targetRow, "G").value
    mobileNumber = ws.Cells(targetRow, "H").value
    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"

    Dim emailSubject As String, emailBody As String
    emailSubject = "Job Complete for Rego " & selectedJobRego

    emailBody = "Thanks for working with EEK Mechanical" & vbCrLf & vbCrLf & _
                "How did we do?" & vbCrLf & vbCrLf & _
                "Please share your EEK Mechanical experience." & vbCrLf & _
                "https://forms.office.com/r/BhszQ91B9V" & vbCrLf & _
                "EEK Mechanical – " & vbCrLf & _
                "www.eek.nz"

    ' === Send via SendViaOutbox ===
    If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, emailBody) Then
        MsgBox "Job Complete process initiated and text sent to client."
        LogToRR9998 "JobComplete finished for Rego " & selectedJobRego
    Else
        MsgBox "Job Complete could not send SMS email.", vbExclamation
        LogToRR9998 "JobComplete failed to send SMS for Rego " & selectedJobRego
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in JobComplete: " & Err.description
End Sub














