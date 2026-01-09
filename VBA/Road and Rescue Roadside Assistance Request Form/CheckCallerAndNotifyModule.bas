Attribute VB_Name = "CheckCallerAndNotifyModule"
' Attribute VB_Name = "CheckCallerAndNotifyModule"
' Attribute VB_Name = "CheckCallerAndNotifyModule"
Sub CheckBlockedCallerAndNotify()
    On Error GoTo ErrHandler
    LogToRR9998 "CheckBlockedCallerAndNotify started"

    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("White_List")
    Dim lastRow As Long: lastRow = ws.Cells(ws.rows.count, "A").End(xlUp).Row
    Dim caller_id As String, location As String, baseLoc As String
    Dim nowTime As String: nowTime = Format(Now, "dd/mm/yyyy h:mm AM/PM")
    Dim i As Long

    For i = 5 To lastRow
        On Error GoTo RowError

        caller_id = ""
        If Not IsError(ws.Cells(i, 1).value) Then caller_id = Trim(CStr(ws.Cells(i, 1).value))

        location = ""
        If Not IsError(ws.Cells(i, 3).value) Then location = Trim(CStr(ws.Cells(i, 3).value))

        LogToRR9998 "Row " & i & ": caller_id='" & caller_id & "' location='" & location & "'"

        If caller_id = "" Or location = "" Then GoTo SkipRow

        If InStr(location, "(") > 0 Then
            baseLoc = Trim(Left(location, InStr(location, "(") - 1))
        Else
            baseLoc = location
        End If
        baseLoc = LCase(Trim(baseLoc))

        If InStr(LCase(location), "(email sent") > 0 Or InStr(LCase(location), "(email skipped") > 0 Then
            LogToRR9998 "Row " & i & ": Already processed"
            GoTo SkipRow
        End If

        ' === Routing & Column Detection ===
        Dim matchRow As Long: matchRow = 0
        Dim TargetSheet As Worksheet
        Dim emailCol As Long, nameCol As Long, phoneCol As Long
        Dim Email As String, name As String
        Dim statusNote As String: statusNote = ""

        Select Case baseLoc
            Case "blocked caller", "post job: supplier support"
                Set TargetSheet = ThisWorkbook.Sheets("Job Build Notes")
                phoneCol = GetCol(TargetSheet, "Supp_Phone")
                emailCol = GetCol(TargetSheet, "Supp_Email")
                nameCol = GetCol(TargetSheet, "Supplier")

            Case "post job client support"
                Set TargetSheet = ThisWorkbook.Sheets("Book a Job")
                phoneCol = GetCol(TargetSheet, "Caller Phone")
                emailCol = GetCol(TargetSheet, "Email")
                nameCol = GetCol(TargetSheet, "Name")

            Case Else
                LogToRR9998 "Row " & i & ": baseLoc '" & baseLoc & "' not applicable. Skipped."
                GoTo SkipRow
        End Select

        If phoneCol = 0 Or emailCol = 0 Or nameCol = 0 Then
            LogToRR9998 "Row " & i & ": Missing header(s). Skipped."
            GoTo MarkSkipped
        End If

        ' === Match Caller ID ===
        Dim r As Long, lastMatchRow As Long: lastMatchRow = 0
        For r = 2 To TargetSheet.Cells(TargetSheet.rows.count, phoneCol).End(xlUp).Row
            If Trim(TargetSheet.Cells(r, phoneCol).value) = caller_id Then
                lastMatchRow = r
                Exit For
            End If
        Next r

        If lastMatchRow > 0 Then
            If Not IsError(TargetSheet.Cells(lastMatchRow, emailCol).value) Then
                Email = Trim(CStr(TargetSheet.Cells(lastMatchRow, emailCol).value))
            End If
            If Not IsError(TargetSheet.Cells(lastMatchRow, nameCol).value) Then
                name = Trim(CStr(TargetSheet.Cells(lastMatchRow, nameCol).value))
            End If

            If Email <> "" Then
                ' === Use SendViaOutbox instead of Outlook
                Dim emailSubject As String, emailBody As String
                emailSubject = "Post Job Enquiry Notice"
                emailBody = "This is an automated message from EEK Mechanical." & vbCrLf & vbCrLf & _
                            "The address no-reply@eek.nz is not monitored. Your message may not be reviewed." & vbCrLf & vbCrLf & _
                            "To ensure your enquiry is processed correctly, follow the instructions below:" & vbCrLf & vbCrLf & _
                            "SUPPLIERS" & vbCrLf & _
                            "Submit an Invoice" & vbCrLf & _
                            "https://www.eek.nz/supplier-upload" & vbCrLf & _
                            "Login required � see your latest job dispatch for access credentials." & vbCrLf & _
                            "Invoices must be submitted using this form." & vbCrLf & _
                            "Emails will not be accepted or processed." & vbCrLf & vbCrLf & _
                            "Make an Enquiry or Lodge a Complaint" & vbCrLf & _
                            "https://www.eek.nz/supplier-relations" & vbCrLf & vbCrLf & _
                            "View Supplier Terms" & vbCrLf & _
                            "https://www.eek.nz/supplier-terms" & vbCrLf & vbCrLf & _
                            "CUSTOMERS" & vbCrLf & _
                            "Submit a Dispute or Refund Request" & vbCrLf & _
                            "https://www.eek.nz/customer-escalation" & vbCrLf & vbCrLf & _
                            "View Terms of Service" & vbCrLf & _
                            "https://www.eek.nz/terms-of-service" & vbCrLf & vbCrLf & _
                            "Please use the correct form above to ensure your enquiry is received." & vbCrLf & vbCrLf & _
                            "EEK Mechanical" & vbCrLf & _
                            "Level 1, 6 Johnsonville Road" & vbCrLf & _
                            "Johnsonville" & vbCrLf & _
                            "Wellington 6037" & vbCrLf & _
                            "New Zealand"

                If SendViaOutbox("no-reply@eek.nz", Email, emailSubject, emailBody) Then
                    statusNote = "(Email Sent: " & nowTime & ")"
                    LogToRR9998 "Row " & i & ": Email sent to " & Email
                Else
                    GoTo MarkSkipped
                End If
            Else
                GoTo MarkSkipped
            End If
        Else
            GoTo MarkSkipped
        End If

        ws.Cells(i, 3).value = Trim(location) & " " & statusNote
        GoTo SkipRow

RowError:
        LogToRR9998 "Row " & i & ": Error " & Err.Number & " � " & Err.description
MarkSkipped:
        ws.Cells(i, 3).value = Trim(location) & " (Email Skipped: " & nowTime & ")"
        Resume SkipRow

SkipRow:
        DoEvents
    Next i

    LogToRR9998 "CheckBlockedCallerAndNotify finished"
    Exit Sub

ErrHandler:
    LogToRR9998 "Fatal error: " & Err.description
    MsgBox "Fatal error: " & Err.description, vbCritical
End Sub


' GetCol is now GetColumnByHeader in PublicUtilities module
Private Function GetCol(ws As Worksheet, headerName As String) As Long
    GetCol = GetColumnByHeader(ws, headerName)
End Function













