Attribute VB_Name = "RevisedETAModule"
' Attribute VB_Name = "RevisedETAModule"
' Attribute VB_Name = "RevisedETAModule"
Sub RevisedETA()
    On Error GoTo ErrHandler
    LogToRR9998 "RevisedETA started."

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "No Job Rego selected. Exiting."
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "Selected Rego not found in column V."
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    Dim currentETA As String
    currentETA = ws.Cells(targetRow, "U").value

    Dim newETA As String
    newETA = InputBox("Please confirm or modify the ETA (in minutes):", "ETA Confirmation", currentETA)

    If newETA = "" Then
        ShowWarning "No ETA entered. Exiting process."
        LogToRR9998 "No ETA entered. Exiting process."
        Exit Sub
    End If

    ws.Cells(targetRow, "U").value = newETA

    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = ws.Cells(targetRow, "G").value
    mobileNumber = ws.Cells(targetRow, "H").value
    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"

    Dim emailSubject As String, emailBody As String
    emailSubject = "Revised ETA for Rego " & selectedJobRego & " - ETA Confirmation"

    emailBody = "Thank you for confirming your roadside assistance service." & vbCrLf & _
                "Due to traffic conditions your ETA is now: " & newETA & vbCrLf & _
                "To connect with a service technician during your wait period, call 0800 769 000." & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical Please stand by for further updates." & vbCrLf & _
                "EEK Mechanical � " & vbCrLf & _
                "www.eek.nz"

    ' === Send via SendViaOutbox ===
    If Not SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, emailBody) Then
        ShowError "There was an issue sending the ETA update SMS."
    Else
        ShowStatus "Revised ETA process initiated and text sent to client."
    End If

    LogToRR9998 "Revised ETA sent to: " & mobileEmail & " for Rego " & selectedJobRego
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in RevisedETA: " & Err.description
End Sub






