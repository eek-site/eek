Attribute VB_Name = "Jobbuilding"
' Attribute VB_Name = "Jobbuilding"
' Attribute VB_Name = "Jobbuilding"
Sub ProcessJobBuildNotes()
    On Error GoTo ErrHandler
    LogToRR9998 "ProcessJobBuildNotes started."

    Call JBNRegoUpdater
    
    Dim ws1 As Worksheet, ws2 As Worksheet
    Dim lastRow1 As Long, lastRow2 As Long
    Dim rego As String
    Dim totalChargeables As Double, totalCostings As Double
    Dim suppliers As String
    Dim matchFound As Boolean
    Dim i As Long, j As Long
    Dim smsRecipient As String, smsSubject As String, smsBody As String

    Set ws1 = ThisWorkbook.Sheets("Book a Job")
    Set ws2 = ThisWorkbook.Sheets("Job Build Notes")

    lastRow1 = ws1.Cells(ws1.rows.count, "A").End(xlUp).Row
    lastRow2 = ws2.Cells(ws2.rows.count, "A").End(xlUp).Row

    For i = 2 To lastRow1
        If ws1.Cells(i, "A").Interior.Color = RGB(173, 216, 230) Then GoTo SkipRow
        If ws1.Cells(i, "A").Interior.Color = RGB(255, 165, 0) Then GoTo SkipRow

        rego = ws1.Cells(i, "V").value
        matchFound = False
        totalChargeables = 0
        totalCostings = 0
        suppliers = ""

        For j = 2 To lastRow2
            If Len(rego) > 0 And Len(ws2.Cells(j, "F").value) > 0 Then
                If StrComp(Trim(ws2.Cells(j, "F").value), Trim(rego), vbTextCompare) = 0 Then
                    matchFound = True

                    If ws2.Cells(j, "O").value <> "Entered" Then
                        ws2.Cells(j, "O").value = "Entered"
                    End If

                    smsRecipient = ws1.Cells(i, "G").value & ws1.Cells(i, "H").value & "@sms.tnz.co.nz"

                    If ws2.Cells(j, "G").value = "DNC" Then
                        ws1.rows(i).Interior.Color = RGB(255, 165, 0)

                        If ws1.Cells(i, "AV").value <> "Yes" Then
                            smsSubject = "Service Cancelled: " & ws1.Cells(i, "N").value
                            smsBody = "Your service request has been cancelled due to non-payment." & vbCrLf & _
                                      "If you believe this cancellation is an error call 0800 769 000 immediately." & vbCrLf & vbCrLf & _
                                      "EEK Mechanical | " & vbCrLf & _
                                      "www.eek.nz"

                            If SendViaOutbox("no-reply@eek.nz", smsRecipient, smsSubject, smsBody) Then
                                ws1.Cells(i, "AV").value = "Yes"
                            Else
                                MsgBox "Failed to send DNC cancellation SMS for rego " & rego, vbExclamation
                            End If
                        End If
                        GoTo nextRow
                    End If

                    If ws2.Cells(j, "N").value = "Yes" Then
                        ws1.rows(i).Interior.Color = RGB(144, 238, 144)
                    End If

                    If Not IsEmpty(ws2.Cells(j, "K").value) Then
                        totalChargeables = totalChargeables + ws2.Cells(j, "K").value
                    End If
                    If Not IsEmpty(ws2.Cells(j, "I").value) Then
                        totalChargeables = totalChargeables - ws2.Cells(j, "I").value
                    End If
                    If Not IsEmpty(ws2.Cells(j, "L").value) Then
                        totalCostings = totalCostings + ws2.Cells(j, "L").value
                    End If
                    If Not IsEmpty(ws2.Cells(j, "H").value) Then
                        If suppliers = "" Then
                            suppliers = ws2.Cells(j, "H").value
                        Else
                            suppliers = suppliers & ", " & ws2.Cells(j, "H").value
                        End If
                    End If

                    If ws1.Cells(i, "AV").value <> "Yes" Then
                        smsSubject = "Job Confirmed: " & ws1.Cells(i, "N").value
                        smsBody = "Your payment has been receipted." & vbCrLf & vbCrLf & _
                                  "A technician will be assigned; you'll receive their ETA once confirmed. Please stand by for further updates." & vbCrLf & vbCrLf & _
                                  "Need assistance? Call EEK dispatch on 0800 769 000." & vbCrLf & vbCrLf & _
                                  "Thank you for choosing EEK Mechanical" & vbCrLf & _
                                  "www.eek.nz"

                        If SendViaOutbox("no-reply@eek.nz", smsRecipient, smsSubject, smsBody) Then
                            Dim apiNbr As String, apiExtn As String
                            apiNbr = ws1.Cells(i, "H").value
                            apiExtn = "1002"

                            SendToSharePoint "delete", apiNbr
                            SendToSharePoint "add", apiNbr, apiExtn

                            ws1.Cells(i, "AV").value = "Yes"
                        Else
                            MsgBox "Failed to send job confirmation SMS for rego " & rego, vbExclamation
                        End If
                    End If
nextRow:
                End If
            End If
        Next j

        If matchFound Then
            If ws1.rows(i).Interior.Color <> RGB(144, 238, 144) And ws1.rows(i).Interior.Color <> RGB(255, 165, 0) Then
                ws1.rows(i).Interior.Color = RGB(255, 255, 0) ' Yellow
            End If
        End If

        If matchFound And (totalChargeables <> 0 Or totalCostings <> 0 Or suppliers <> "") Then
            If totalChargeables <> 0 Then ws1.Cells(i, "W").value = totalChargeables
            If totalCostings <> 0 Then ws1.Cells(i, "AB").value = totalCostings
            If suppliers <> "" Then ws1.Cells(i, "AA").value = suppliers
        End If
SkipRow:
    Next i

    LogToRR9998 "ProcessJobBuildNotes completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in ProcessJobBuildNotes: " & Err.description
End Sub














