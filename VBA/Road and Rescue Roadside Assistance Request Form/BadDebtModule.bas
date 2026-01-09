Attribute VB_Name = "BadDebtModule"
' Attribute VB_Name = "BadDebtModule"
' Attribute VB_Name = "BadDebtModule"
Sub BadDebtNotice()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "BadDebtNotice aborted — no Job Rego selected", "DebtNoticeLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")

    Dim lastRow As Long, i As Long
    Dim totalDue As Double: totalDue = 0

    lastRow = ws.Cells(ws.rows.count, "F").End(xlUp).Row

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "F").value) = Trim(selectedJobRego) Then
            If Trim(ws.Cells(i, "G").value) = "Billable" And Trim(ws.Cells(i, "M").value) = "No" Then
                Dim amount As Double
                amount = val(ws.Cells(i, "K").value)
                totalDue = totalDue + amount
                LogToRR9998 "Row " & i & ": Billable Unpaid +$" & Format(amount, "0.00"), "DebtNoticeLog.txt"
            End If
        End If
    Next i

    If totalDue = 0 Then
        MsgBox "No outstanding billable items found for Rego: " & selectedJobRego
        LogToRR9998 "No unpaid billables for rego: " & selectedJobRego, "DebtNoticeLog.txt"
        Exit Sub
    End If

    ' === Lookup details in "Book a Job"
    Set ws = ThisWorkbook.Sheets("Book a Job")
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    Dim targetRow As Long: targetRow = 0

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i
            Exit For
        End If
    Next i

    If targetRow = 0 Then
        MsgBox "Selected Rego not found in 'Book a Job'."
        LogToRR9998 "BadDebtNotice aborted — rego not found in 'Book a Job': " & selectedJobRego, "DebtNoticeLog.txt"
        Exit Sub
    End If

    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    Dim mobileEmail As String, resolvedCurrency As String
    
    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    customerName = Trim(ws.Cells(targetRow, "E").value)

    If countryCode = "" Or mobileNumber = "" Then
        MsgBox "Missing mobile number or country code."
        LogToRR9998 "Missing mobile contact for rego: " & selectedJobRego, "DebtNoticeLog.txt"
        Exit Sub
    End If
    
    If customerEmail = "" Then
        MsgBox "Missing customer email."
        LogToRR9998 "Missing email for rego: " & selectedJobRego, "DebtNoticeLog.txt"
        Exit Sub
    End If

    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    resolvedCurrency = GetCurrencyFromCountryCode(countryCode)

    ' === Generate Stripe link for credit card option
    Dim stripeLink As String, finalLink As String, token As String
    Call CreateStripeLink(selectedJobRego, totalDue, resolvedCurrency, selectedJobRego & ": Bad Debt Payment", stripeLink)
    If stripeLink = "" Then
        MsgBox "Stripe link generation failed."
        Exit Sub
    End If
    
    If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
    finalLink = "https://www.eek.nz?token=" & token

    ' === Compose messages with BOTH payment options
    Dim emailSubject As String, smsText As String, emailText As String
    emailSubject = "Bad Debt Notice for Rego " & selectedJobRego

    smsText = "URGENT: Your vehicle is now listed with lpr.co.nz for unpaid services." & vbCrLf & _
              "Amount Due: $" & Format(totalDue, "0.00") & vbCrLf & _
              "Pay by Card: " & finalLink & vbCrLf & _
              "Or Bank: ANZ 06-0313-0860749-00 Ref: " & selectedJobRego & vbCrLf & _
              "Pay now to avoid clamping ($130 removal fee). EEK Mechanical"

    emailText = "Dear " & customerName & vbCrLf & vbCrLf & _
                "URGENT NOTICE: Your vehicle is now listed with lpr.co.nz as you have not paid for services after ordering." & vbCrLf & vbCrLf & _
                "Failing to pay will lead to your vehicle being clamped at parking locations across New Zealand. Additional costs of $130 to remove the clamp apply." & vbCrLf & vbCrLf & _
                "Amount Due: $" & Format(totalDue, "0.00") & vbCrLf & _
                "Reference: " & selectedJobRego & vbCrLf & vbCrLf & _
                "PAYMENT OPTIONS:" & vbCrLf & vbCrLf & _
                "1. PAY BY CREDIT CARD: " & finalLink & vbCrLf & vbCrLf & _
                "2. PAY BY BANK TRANSFER:" & vbCrLf & _
                "   Bank: ANZ Chartwell" & vbCrLf & _
                "   Account: 06-0313-0860749-00" & vbCrLf & _
                "   Reference: " & selectedJobRego & vbCrLf & vbCrLf & _
                "– EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"

    ' === Send messages
    DoEvents
    If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText) Then
        LogToRR9998 "BadDebtNotice SMS sent to: " & mobileEmail & " for rego " & selectedJobRego & " ($" & Format(totalDue, "0.00") & ")", "DebtNoticeLog.txt"
    Else
        LogToRR9998 "Failed to send BadDebtNotice SMS for rego " & selectedJobRego, "DebtNoticeLog.txt"
    End If

    DoEvents
    If SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText) Then
        LogToRR9998 "BadDebtNotice email sent to: " & customerEmail & " for rego " & selectedJobRego & " ($" & Format(totalDue, "0.00") & ")", "DebtNoticeLog.txt"
    Else
        LogToRR9998 "Failed to send BadDebtNotice email for rego " & selectedJobRego, "DebtNoticeLog.txt"
    End If

    MsgBox "Bad Debt Notice sent to client via SMS and Email."

Cleanup:
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in BadDebtNotice for rego " & selectedJobRego & ": " & Err.description, "DebtNoticeLog.txt"
    Resume Cleanup
End Sub













