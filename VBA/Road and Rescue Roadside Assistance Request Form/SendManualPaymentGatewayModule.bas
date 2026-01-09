Attribute VB_Name = "SendManualPaymentGatewayModule"
' Attribute VB_Name = "SendManualPaymentGatewayModule"
' Attribute VB_Name = "SendManualPaymentGatewayModule"

Public Sub SendBankPaymentRequest()
    ' Shortcut for Menu 1 > 5: Sends bank payment request for new job
    ' No rego picker needed - customer not in system yet
    On Error GoTo ErrHandler
    LogToRR9998 "SendBankPaymentRequest started."
    
    Call LaunchOutlook
    
    ' Get rego from user (new job, not in system)
    Dim inputRego As String
    inputRego = InputBox("Enter the Rego/Reference for this new job:", "New Job - Bank Payment")
    If Trim(inputRego) = "" Then Exit Sub
    
    selectedJobRego = UCase(Trim(inputRego))
    
    ' Get amount
    Dim inputAmount As String, numericAmount As Double
    inputAmount = InputBox("Enter the amount due (e.g. 49.99):", "Amount Due")
    If Not IsNumeric(inputAmount) Then MsgBox "Invalid amount.": Exit Sub
    numericAmount = CDbl(inputAmount)
    
    ' Get service description
    Dim inputDesc As String
    inputDesc = InputBox("Enter the service description:", "Service Description")
    If Trim(inputDesc) = "" Then MsgBox "Description required.": Exit Sub
    
    ' Get customer details
    Dim mobileNumber As String, countryCode As String, customerName As String, customerEmail As String
    
    mobileNumber = InputBox("Enter Mobile Number (no country code):", "Mobile")
    If mobileNumber = "" Then MsgBox "Mobile number required.": Exit Sub
    If Left(mobileNumber, 1) = "0" Then mobileNumber = Mid(mobileNumber, 2)
    
    countryCode = InputBox("Enter Country Code (e.g., 64):", "Country Code", "64")
    If countryCode = "" Then Exit Sub
    
    customerName = InputBox("Enter Customer Name:", "Customer Name")
    If Trim(customerName) = "" Then customerName = "there"
    
    customerEmail = InputBox("Enter Customer Email (optional):", "Email Address")
    
    ' Save for later job link send
    SaveBankTransferPending selectedJobRego, customerName, countryCode, mobileNumber, customerEmail, numericAmount, inputDesc
    
    ' Build and send messages
    Dim mobileEmail As String
    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    
    Dim emailSubject As String
    emailSubject = "Bank Payment Request - Ref " & selectedJobRego
    
    Dim smsText As String
    smsText = "Hi there, please pay via bank transfer." & vbCrLf & _
              "Bank: ANZ Chartwell" & vbCrLf & _
              "Account Name: EEK Mechanical" & vbCrLf & _
              "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
              "Ref: " & selectedJobRego & vbCrLf & _
              "Amount: $" & Format(numericAmount, "0.00")
    
    Dim emailText As String
    emailText = "Hi there," & vbCrLf & vbCrLf & _
                "Please pay via bank transfer:" & vbCrLf & vbCrLf & _
                "Bank: ANZ Chartwell" & vbCrLf & _
                "Account Name: EEK Mechanical" & vbCrLf & _
                "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                "Ref: " & selectedJobRego & vbCrLf & _
                "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & vbCrLf & _
                "Once we confirm your payment, we will send you a link to submit your job details." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    Dim staffBody As String
    staffBody = "NEW JOB - Bank Payment Request Sent" & vbCrLf & _
                "Rego: " & selectedJobRego & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                "Service: " & inputDesc & vbCrLf & vbCrLf & _
                "*** PENDING PAYMENT ***" & vbCrLf & _
                "Once payment confirmed, use Menu > 1 > 6 to send job submission link."
    
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    DoEvents
    If customerEmail <> "" Then Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)
    
    MsgBox "Bank payment request sent." & vbCrLf & vbCrLf & _
           "Once payment confirmed, use Menu > 1 > 6 to send job link."
    LogToRR9998 "Sent bank payment request for rego: " & selectedJobRego & " to +" & countryCode & mobileNumber
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendBankPaymentRequest: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub

Sub SendManualPaymentGateway()
    On Error GoTo ErrHandler
    LogToRR9998 "SendManualPaymentGateway started."

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation
        Exit Sub
    End If

    Dim methodChoice As String
    methodChoice = InputBox("Select Payment Method:" & vbCrLf & _
                            "1 - Credit Card (Stripe)" & vbCrLf & _
                            "2 - Bank Transfer" & vbCrLf & _
                            "3 - Credit Card (Stripe) Manual (Ad-Hoc)" & vbCrLf & _
                            "4 - Release Payment (Credit Card)" & vbCrLf & _
                            "5 - Release Payment (Bank Transfer)", "Payment Method")
    If methodChoice <> "1" And methodChoice <> "2" And methodChoice <> "3" And methodChoice <> "4" And methodChoice <> "5" Then Exit Sub

    ' Options 4 & 5 handled by separate subs
    If methodChoice = "4" Then
        Call SendReleasePayment
        Exit Sub
    ElseIf methodChoice = "5" Then
        Call SendReleasePaymentBank
        Exit Sub
    End If

    Dim redirectChoice As String, redirectUrl As String
    redirectChoice = InputBox("Select redirect after payment:" & vbCrLf & _
                             "1 - New Job (www.eek.nz/job)" & vbCrLf & _
                             "2 - Progress Payment (www.eek.nz/thanks)", "Redirect Selection")
    If redirectChoice <> "1" And redirectChoice <> "2" Then Exit Sub
    
    If redirectChoice = "1" Then
        redirectUrl = "www.eek.nz/job"
    Else
        redirectUrl = "www.eek.nz/thanks"
    End If

    Dim inputAmount As String, inputDesc As String, numericAmount As Double
    inputAmount = InputBox("Enter the amount due (e.g. 49.99):", "Amount Due")
    If Not IsNumeric(inputAmount) Then MsgBox "Invalid amount.": Exit Sub
    numericAmount = CDbl(inputAmount)

    inputDesc = InputBox("Enter the service description:", "Service Description")
    If Trim(inputDesc) = "" Then MsgBox "Description required.": Exit Sub

    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long, targetRow As Long: targetRow = 0
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i: Exit For
        End If
    Next i

    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    Dim needsManualEntry As Boolean
    needsManualEntry = False

    ' Check if we need manual entry: option 3 always, or options 1/2 when rego not found
    If methodChoice = "3" Then
        needsManualEntry = True
    ElseIf targetRow = 0 Then
        ' Rego not found - offer to enter details manually
        If MsgBox("Rego '" & selectedJobRego & "' not found in Book a Job." & vbCrLf & vbCrLf & _
                  "Do you want to enter customer details manually?", vbYesNo + vbQuestion, "Rego Not Found") = vbYes Then
            needsManualEntry = True
        Else
            Exit Sub
        End If
    End If

    If needsManualEntry Then
        mobileNumber = InputBox("Enter Mobile Number (no country code):", "Mobile")
        If mobileNumber = "" Then MsgBox "Mobile number required.": Exit Sub
        If Left(mobileNumber, 1) = "0" Then mobileNumber = Mid(mobileNumber, 2)

        countryCode = InputBox("Enter Country Code (e.g., 64):", "Country Code")
        If countryCode = "" Then MsgBox "Country code required.": Exit Sub

        customerName = InputBox("Enter Customer Name (leave blank if unknown):", "Customer Name")
        If Trim(customerName) = "" Then customerName = "there"

        customerEmail = InputBox("Enter Customer Email (optional for record):", "Email Address")
    Else
        countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
        mobileNumber = Trim(ws.Cells(targetRow, "H").value)
        customerEmail = Trim(ws.Cells(targetRow, "D").value)
        customerName = Trim(ws.Cells(targetRow, "E").value)

        If countryCode = "" Or mobileNumber = "" Then MsgBox "Missing mobile contact.": Exit Sub
        If customerEmail = "" Then MsgBox "Missing email.": Exit Sub
    End If

    Dim mobileEmail As String: mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    Dim emailSubject As String, smsText As String, emailText As String, staffBody As String, finalLink As String
    Dim stripeLink As String, token As String
    Dim adHocJobLink As String
    
    ' Build ad-hoc job creation link with all details for staff to create the job
    If needsManualEntry Then
        adHocJobLink = "https://www.eek.nz/job/ad-hoc" & _
                       "?rego=" & Application.WorksheetFunction.EncodeURL(UCase(Trim(selectedJobRego))) & _
                       "&name=" & Application.WorksheetFunction.EncodeURL(customerName) & _
                       "&phone=" & countryCode & mobileNumber & _
                       "&email=" & Application.WorksheetFunction.EncodeURL(customerEmail) & _
                       "&amount=" & Format(numericAmount, "0.00") & _
                       "&service=" & Application.WorksheetFunction.EncodeURL(inputDesc)
    End If
    
    emailSubject = "Manual Payment Request for Rego " & selectedJobRego

    If methodChoice = "1" Then
        Call CreateStripeLink(selectedJobRego, numericAmount, selectedJobRego & ": " & inputDesc, stripeLink, redirectUrl)
        If stripeLink = "" Then MsgBox "Stripe link generation failed.": Exit Sub

        If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
        finalLink = "https://www.eek.nz?token=" & token

        smsText = "Hi " & customerName & ", your roadside assistance request has been received." & vbCrLf & _
                  "Service: " & inputDesc & vbCrLf & _
                  "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                  "Please pay now to confirm: " & finalLink & vbCrLf & _
                  "EEK Mechanical"

        emailText = "Hi " & customerName & vbCrLf & vbCrLf & _
                    "We've received your request for " & inputDesc & " with EEK Mechanical." & vbCrLf & vbCrLf & _
                    "Total Due: $" & Format(numericAmount, "0.00") & vbCrLf & _
                    "To confirm and pay, click here: " & finalLink & vbCrLf & vbCrLf & _
                    "Note: This is the current estimated price. Additional fees may apply as per terms of service." & vbCrLf & vbCrLf & _
                    "- EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"

        staffBody = "Job Rego: " & selectedJobRego & vbCrLf & _
                    "Name: " & customerName & vbCrLf & _
                    "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                    "Email: " & customerEmail & vbCrLf & _
                    "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                    "Method: Credit Card" & vbCrLf & _
                    "Redirect: " & redirectUrl & vbCrLf & _
                    "Link: " & finalLink & vbCrLf & _
                    "SMS: " & mobileEmail & vbCrLf & _
                    "Call: +" & countryCode & mobileNumber
        
        If needsManualEntry Then
            staffBody = staffBody & vbCrLf & vbCrLf & _
                        "*** AD-HOC JOB - NOT IN SYSTEM ***" & vbCrLf & _
                        "Create job in system: " & adHocJobLink
        End If

    ElseIf methodChoice = "2" Then
        ' For existing jobs, auto-calculate outstanding balance
        Dim bankAmount As Double
        Dim totalCharged As Double, totalPaid As Double
        
        If Not needsManualEntry Then
            bankAmount = CalculateOutstandingBalance(selectedJobRego, totalCharged, totalPaid)
            
            If bankAmount > 0 Then
                ' Show calculated balance and confirm
                If MsgBox("Bank Transfer Payment for " & selectedJobRego & ":" & vbCrLf & vbCrLf & _
                          "Total Charged: $" & Format(totalCharged, "0.00") & vbCrLf & _
                          "Already Paid: $" & Format(totalPaid, "0.00") & vbCrLf & _
                          "Balance Due: $" & Format(bankAmount, "0.00") & vbCrLf & vbCrLf & _
                          "Send this amount?", vbYesNo + vbQuestion, "Confirm Amount") = vbNo Then
                    ' Let user enter different amount
                    Dim overrideAmount As String
                    overrideAmount = InputBox("Enter different amount (or cancel):", "Override Amount", Format(bankAmount, "0.00"))
                    If overrideAmount = "" Then Exit Sub
                    If Not IsNumeric(overrideAmount) Then MsgBox "Invalid amount.": Exit Sub
                    bankAmount = CDbl(overrideAmount)
                End If
            Else
                ' No balance or negative - prompt for amount
                MsgBox "No outstanding balance found for " & selectedJobRego & "." & vbCrLf & _
                       "Total Charged: $" & Format(totalCharged, "0.00") & vbCrLf & _
                       "Already Paid: $" & Format(totalPaid, "0.00"), vbInformation
                Dim manualAmount As String
                manualAmount = InputBox("Enter amount to charge:", "Enter Amount")
                If manualAmount = "" Or Not IsNumeric(manualAmount) Then Exit Sub
                bankAmount = CDbl(manualAmount)
            End If
        Else
            ' Ad-hoc - use the amount entered earlier
            bankAmount = numericAmount
        End If
        
        ' Save customer data for later job link send (after payment confirmed)
        SaveBankTransferPending selectedJobRego, customerName, countryCode, mobileNumber, customerEmail, bankAmount, inputDesc
        
        smsText = "Hi there, please pay via bank transfer." & vbCrLf & _
                  "Bank: ANZ Chartwell" & vbCrLf & _
                  "Account Name: EEK Mechanical" & vbCrLf & _
                  "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                  "Ref: " & selectedJobRego & vbCrLf & _
                  "Amount: $" & Format(bankAmount, "0.00")

        emailText = "Hi there," & vbCrLf & vbCrLf & _
                    "Please pay via bank transfer:" & vbCrLf & vbCrLf & _
                    "Bank: ANZ Chartwell" & vbCrLf & _
                    "Account Name: EEK Mechanical" & vbCrLf & _
                    "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                    "Ref: " & selectedJobRego & vbCrLf & _
                    "Amount: $" & Format(bankAmount, "0.00") & vbCrLf & vbCrLf & _
                    "Once we confirm your payment, we will send you a link to submit your job details." & vbCrLf & vbCrLf & _
                    "- EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"

        staffBody = "Job Rego: " & selectedJobRego & vbCrLf & _
                    "Name: " & customerName & vbCrLf & _
                    "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                    "Email: " & customerEmail & vbCrLf & _
                    "Total Charged: $" & Format(totalCharged, "0.00") & vbCrLf & _
                    "Already Paid: $" & Format(totalPaid, "0.00") & vbCrLf & _
                    "Amount Requested: $" & Format(bankAmount, "0.00") & vbCrLf & _
                    "Method: Bank Transfer" & vbCrLf & vbCrLf & _
                    "*** PENDING PAYMENT ***" & vbCrLf & _
                    "Once payment confirmed, use Menu > 1 > 6 to send job submission link."
        
        If needsManualEntry Then
            staffBody = staffBody & vbCrLf & "(Ad-hoc job - not in system)"
        End If

    ElseIf methodChoice = "3" Then
        Call CreateStripeLink(selectedJobRego, numericAmount, selectedJobRego & ": " & inputDesc, stripeLink, redirectUrl)
        If stripeLink = "" Then MsgBox "Stripe link generation failed.": Exit Sub

        If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
        finalLink = "https://www.eek.nz?token=" & token

        smsText = "Hi there, please pay to confirm your roadside assistance job (" & selectedJobRego & "):" & vbCrLf & _
                  "Service: " & inputDesc & vbCrLf & _
                  "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                  "Pay online: " & finalLink & vbCrLf & _
                  "Or bank transfer: EEK Mechanical, ANZ 06-0313-0860749-00, Ref: " & selectedJobRego

        emailText = "Hi there," & vbCrLf & vbCrLf & _
                    "You've requested the following roadside service:" & vbCrLf & _
                    "Service: " & inputDesc & vbCrLf & _
                    "Amount Due: $" & Format(numericAmount, "0.00") & vbCrLf & vbCrLf & _
                    "To confirm and pay online, click here:" & vbCrLf & finalLink & vbCrLf & vbCrLf & _
                    "Alternatively, pay by bank transfer:" & vbCrLf & _
                    "Bank: ANZ Chartwell" & vbCrLf & _
                    "Account Name: EEK Mechanical" & vbCrLf & _
                    "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                    "Ref: " & selectedJobRego & vbCrLf & vbCrLf & _
                    "- EEK Mechanical" & vbCrLf & _
                    "www.eek.nz | 0800 769 000"

        staffBody = "Ad-hoc payment link sent." & vbCrLf & _
                    "Job Rego: " & selectedJobRego & vbCrLf & _
                    "Name: " & customerName & vbCrLf & _
                    "Service: " & inputDesc & vbCrLf & _
                    "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                    "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                    "Email: " & customerEmail & vbCrLf & _
                    "Redirect: " & redirectUrl & vbCrLf & _
                    "Link: " & finalLink & vbCrLf & vbCrLf & _
                    "*** AD-HOC JOB - NOT IN SYSTEM ***" & vbCrLf & _
                    "Create job in system: " & adHocJobLink
    End If

    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    DoEvents
    If customerEmail <> "" Then Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)
    
    ' Send dedicated ad-hoc notification email with prominent link
    If needsManualEntry Then
        Dim adHocSubject As String
        Dim adHocBody As String
        adHocSubject = "[ACTION REQUIRED] Ad-Hoc Job Needs Creating - " & selectedJobRego
        adHocBody = "An ad-hoc payment was sent for a job NOT in the system." & vbCrLf & vbCrLf & _
                    "CLICK HERE TO CREATE THE JOB:" & vbCrLf & _
                    adHocJobLink & vbCrLf & vbCrLf & _
                    "-------------------------------------------" & vbCrLf & _
                    "Job Details:" & vbCrLf & _
                    "-------------------------------------------" & vbCrLf & _
                    "Rego: " & UCase(selectedJobRego) & vbCrLf & _
                    "Customer: " & customerName & vbCrLf & _
                    "Phone: +" & countryCode & mobileNumber & vbCrLf & _
                    "Email: " & customerEmail & vbCrLf & _
                    "Service: " & inputDesc & vbCrLf & _
                    "Amount: $" & Format(numericAmount, "0.00") & vbCrLf & _
                    "-------------------------------------------" & vbCrLf & vbCrLf & _
                    "Please create this job in the system ASAP."
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", adHocSubject, adHocBody)
        LogToRR9998 "Sent ad-hoc job creation notification for rego: " & selectedJobRego
    End If

    MsgBox "Payment instructions sent."
    LogToRR9998 "Sent manual payment instructions to " & customerName & " (" & selectedJobRego & ") with redirect: " & redirectUrl
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendManualPaymentGateway: " & Err.description
End Sub


Sub SendReleasePayment()
    On Error GoTo ErrHandler
    LogToRR9998 "SendReleasePayment started for rego " & selectedJobRego

    ' Get customer details from Book a Job
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long, targetRow As Long: targetRow = 0
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i: Exit For
        End If
    Next i

    If targetRow = 0 Then
        MsgBox "Rego not found in Book a Job.", vbExclamation
        Exit Sub
    End If

    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    customerName = Trim(ws.Cells(targetRow, "E").value)

    If countryCode = "" Or mobileNumber = "" Then MsgBox "Missing mobile contact.": Exit Sub
    If customerEmail = "" Then MsgBox "Missing email.": Exit Sub

    ' Calculate release payment from Job Build Notes
    Dim wsBuildNotes As Worksheet
    On Error Resume Next
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    On Error GoTo ErrHandler

    If wsBuildNotes Is Nothing Then
        MsgBox "Job Build Notes sheet not found.", vbExclamation
        Exit Sub
    End If

    Dim jbnRow As Long, jbnLastRow As Long
    Dim totalK As Double: totalK = 0
    Dim totalI As Double: totalI = 0
    Dim releasePaymentCount As Long: releasePaymentCount = 0
    Dim releasePaymentRow As Long: releasePaymentRow = 0

    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row

    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(selectedJobRego) Then
            ' Sum Column K
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "K").value) Then
                totalK = totalK + CDbl(wsBuildNotes.Cells(jbnRow, "K").value)
            End If
            ' Sum Column I
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "I").value) Then
                totalI = totalI + CDbl(wsBuildNotes.Cells(jbnRow, "I").value)
            End If
            ' Check for Release Payment row
            If InStr(1, wsBuildNotes.Cells(jbnRow, "J").value, "Release Payment", vbTextCompare) > 0 Then
                releasePaymentCount = releasePaymentCount + 1
                releasePaymentRow = jbnRow
            End If
        End If
    Next jbnRow

    Dim releaseAmount As Double
    releaseAmount = totalK - totalI

    ' Validation checks
    If releaseAmount <= 0 Then
        MsgBox "Release amount is $" & Format(releaseAmount, "0.00") & " - nothing to collect." & vbCrLf & _
               "Total K: $" & Format(totalK, "0.00") & vbCrLf & _
               "Total I: $" & Format(totalI, "0.00"), vbExclamation
        Exit Sub
    End If

    If releasePaymentCount = 0 Then
        MsgBox "No 'Release Payment' row found in Job Build Notes for " & selectedJobRego & ".", vbExclamation
        Exit Sub
    ElseIf releasePaymentCount > 1 Then
        MsgBox "Multiple 'Release Payment' rows (" & releasePaymentCount & ") found for " & selectedJobRego & ". Please fix manually.", vbExclamation
        Exit Sub
    End If

    ' Build unique key for Power Automate lookup
    Dim uniqueKey As String
    uniqueKey = UCase(Replace(Trim(selectedJobRego), " ", "")) & "|Release Payment"

    ' Confirm with user
    Dim confirmMsg As String
    confirmMsg = "Release Payment Summary for " & selectedJobRego & ":" & vbCrLf & vbCrLf & _
                 "Total Charged (K): $" & Format(totalK, "0.00") & vbCrLf & _
                 "Already Paid (I): $" & Format(totalI, "0.00") & vbCrLf & _
                 "Release Amount: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
                 "Send payment request to " & customerName & "?"

    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Release Payment") <> vbYes Then Exit Sub

    ' Generate Stripe link - redirect to release thanks page with parameters
    Dim redirectUrl As String
    redirectUrl = "www.eek.nz/thanks/release.html?rego=" & UCase(Replace(Trim(selectedJobRego), " ", "")) & _
                  "&amount=" & Format(releaseAmount, "0.00") & _
                  "&key=" & Application.WorksheetFunction.EncodeURL(uniqueKey) & _
                  "&name=" & Application.WorksheetFunction.EncodeURL(customerName) & _
                  "&email=" & Application.WorksheetFunction.EncodeURL(customerEmail) & _
                  "&phone=" & countryCode & mobileNumber
    
    Dim stripeLink As String, token As String, finalLink As String

    Call CreateStripeLink(selectedJobRego, releaseAmount, selectedJobRego & ": Release Payment", stripeLink, redirectUrl, True)
    If stripeLink = "" Then MsgBox "Stripe link generation failed.": Exit Sub

    If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
    finalLink = "https://www.eek.nz?token=" & token

    ' Build messages
    Dim mobileEmail As String: mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    Dim emailSubject As String: emailSubject = "Final Payment Request for Job " & selectedJobRego

    Dim smsText As String
    smsText = "Hi " & customerName & ", your job is complete!" & vbCrLf & _
              "Final Amount Due: $" & Format(releaseAmount, "0.00") & vbCrLf & _
              "Please pay now: " & finalLink & vbCrLf & _
              "Your vehicle will be released once payment is received." & vbCrLf & _
              "EEK Mechanical"

    Dim emailText As String
    emailText = "Hi " & customerName & vbCrLf & vbCrLf & _
                "Great news - your job (" & selectedJobRego & ") is now complete!" & vbCrLf & vbCrLf & _
                "Final Amount Due: $" & Format(releaseAmount, "0.00") & vbCrLf & _
                "To pay, click here: " & finalLink & vbCrLf & vbCrLf & _
                "Once we receive your payment, we will pay the contractor and notify you when your vehicle is ready for collection." & vbCrLf & vbCrLf & _
                "Please note: The workshop cannot release your vehicle until they receive payment from us." & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical!" & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"

    Dim staffBody As String
    staffBody = "Release Payment sent." & vbCrLf & _
                "Job Rego: " & selectedJobRego & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Total K: $" & Format(totalK, "0.00") & vbCrLf & _
                "Total I: $" & Format(totalI, "0.00") & vbCrLf & _
                "Release Amount: $" & Format(releaseAmount, "0.00") & vbCrLf & _
                "Unique Key: " & uniqueKey & vbCrLf & _
                "Redirect: " & redirectUrl & vbCrLf & _
                "Link: " & finalLink

    ' Send messages
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)

    ' Record amount in Column I of Release Payment row
    wsBuildNotes.Cells(releasePaymentRow, "I").value = releaseAmount
    LogToRR9998 "Updated Job Build Notes: Row " & releasePaymentRow & " Col I set to " & releaseAmount & " for rego " & selectedJobRego

    MsgBox "Release payment request sent for $" & Format(releaseAmount, "0.00")
    LogToRR9998 "SendReleasePayment completed for " & selectedJobRego & " - Amount: $" & Format(releaseAmount, "0.00") & " - Key: " & uniqueKey
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendReleasePayment: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub

Sub SendReleasePaymentBank()
    ' Release Payment via Bank Transfer - requires rego lookup
    On Error GoTo ErrHandler
    LogToRR9998 "SendReleasePaymentBank started for rego " & selectedJobRego

    ' Get customer details from Book a Job - MUST exist
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long, targetRow As Long: targetRow = 0
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row

    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i: Exit For
        End If
    Next i

    If targetRow = 0 Then
        MsgBox "Rego not found in Book a Job." & vbCrLf & vbCrLf & _
               "Release Payment requires an existing job.", vbExclamation
        Exit Sub
    End If

    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    customerName = Trim(ws.Cells(targetRow, "E").value)

    If countryCode = "" Or mobileNumber = "" Then MsgBox "Missing mobile contact.": Exit Sub
    If customerEmail = "" Then MsgBox "Missing email.": Exit Sub

    ' Calculate release payment from Job Build Notes
    Dim wsBuildNotes As Worksheet
    On Error Resume Next
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    On Error GoTo ErrHandler

    If wsBuildNotes Is Nothing Then
        MsgBox "Job Build Notes sheet not found.", vbExclamation
        Exit Sub
    End If

    Dim jbnRow As Long, jbnLastRow As Long
    Dim totalK As Double: totalK = 0
    Dim totalI As Double: totalI = 0

    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row

    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(selectedJobRego) Then
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "K").value) Then
                totalK = totalK + CDbl(wsBuildNotes.Cells(jbnRow, "K").value)
            End If
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "I").value) Then
                totalI = totalI + CDbl(wsBuildNotes.Cells(jbnRow, "I").value)
            End If
        End If
    Next jbnRow

    Dim releaseAmount As Double
    releaseAmount = totalK - totalI

    If releaseAmount <= 0 Then
        MsgBox "Release amount is $" & Format(releaseAmount, "0.00") & " - nothing to collect." & vbCrLf & _
               "Total K: $" & Format(totalK, "0.00") & vbCrLf & _
               "Total I: $" & Format(totalI, "0.00"), vbExclamation
        Exit Sub
    End If

    ' Confirm with user
    Dim confirmMsg As String
    confirmMsg = "BANK TRANSFER Release Payment for " & selectedJobRego & ":" & vbCrLf & vbCrLf & _
                 "Total Charged (K): $" & Format(totalK, "0.00") & vbCrLf & _
                 "Already Paid (I): $" & Format(totalI, "0.00") & vbCrLf & _
                 "Release Amount: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
                 "Send bank payment request to " & customerName & "?"

    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Release Payment (Bank)") <> vbYes Then Exit Sub

    ' Build messages
    Dim mobileEmail As String: mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    Dim emailSubject As String: emailSubject = "Final Payment Request for Job " & selectedJobRego

    Dim smsText As String
    smsText = "Hi " & customerName & ", your job is complete!" & vbCrLf & _
              "Final Amount Due: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
              "Please pay via bank transfer:" & vbCrLf & _
              "Bank: ANZ Chartwell" & vbCrLf & _
              "Account Name: EEK Mechanical" & vbCrLf & _
              "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
              "Ref: " & selectedJobRego & vbCrLf & vbCrLf & _
              "Your vehicle will be released once payment is received." & vbCrLf & _
              "EEK Mechanical"

    Dim emailText As String
    emailText = "Hi " & customerName & vbCrLf & vbCrLf & _
                "Great news - your job (" & selectedJobRego & ") is now complete!" & vbCrLf & vbCrLf & _
                "Final Amount Due: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
                "Please pay via bank transfer:" & vbCrLf & _
                "Bank: ANZ Chartwell" & vbCrLf & _
                "Account Name: EEK Mechanical" & vbCrLf & _
                "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                "Ref: " & selectedJobRego & vbCrLf & vbCrLf & _
                "Once we receive your payment, we will pay the contractor and notify you when your vehicle is ready for collection." & vbCrLf & vbCrLf & _
                "Please note: The workshop cannot release your vehicle until they receive payment from us." & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical!" & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"

    Dim staffBody As String
    staffBody = "BANK TRANSFER Release Payment sent." & vbCrLf & _
                "Job Rego: " & selectedJobRego & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Total K: $" & Format(totalK, "0.00") & vbCrLf & _
                "Total I: $" & Format(totalI, "0.00") & vbCrLf & _
                "Release Amount: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
                "*** AWAITING BANK PAYMENT ***" & vbCrLf & _
                "Once payment confirmed, vehicle can be released."

    ' Send messages
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)

    MsgBox "Bank transfer release payment request sent for $" & Format(releaseAmount, "0.00")
    LogToRR9998 "SendReleasePaymentBank completed for " & selectedJobRego & " - Amount: $" & Format(releaseAmount, "0.00")
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendReleasePaymentBank: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub

' ============================================================================
' BALANCE CALCULATION - Calculate outstanding balance from Job Build Notes
' ============================================================================

Private Function CalculateOutstandingBalance(rego As String, ByRef totalCharged As Double, ByRef totalPaid As Double) As Double
    ' Calculates outstanding balance from Job Build Notes
    ' Returns: balance (totalCharged - totalPaid)
    ' Also sets ByRef params for totalCharged and totalPaid
    
    Dim wsBuildNotes As Worksheet
    Dim jbnRow As Long, jbnLastRow As Long
    
    On Error Resume Next
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    On Error GoTo 0
    
    If wsBuildNotes Is Nothing Then
        CalculateOutstandingBalance = 0
        Exit Function
    End If
    
    totalCharged = 0
    totalPaid = 0
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If UCase(Trim(wsBuildNotes.Cells(jbnRow, "F").value)) = UCase(Trim(rego)) Then
            ' Sum Column K (charged)
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "K").value) Then
                totalCharged = totalCharged + CDbl(wsBuildNotes.Cells(jbnRow, "K").value)
            End If
            ' Sum Column I (paid)
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "I").value) Then
                totalPaid = totalPaid + CDbl(wsBuildNotes.Cells(jbnRow, "I").value)
            End If
        End If
    Next jbnRow
    
    CalculateOutstandingBalance = totalCharged - totalPaid
End Function

' ============================================================================
' BANK TRANSFER PENDING - Save/Retrieve customer data for job link send
' ============================================================================

Private Function GetBankTransferPendingPath() As String
    ' Returns path to pending bank transfers folder
    GetBankTransferPendingPath = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\2000 CODE\EEK VBA Clone\" & _
        "Road and Rescue Roadside Assistance Request Form\_PendingBankTransfers"
End Function

Private Sub SaveBankTransferPending(rego As String, customerName As String, countryCode As String, _
                                     mobileNumber As String, customerEmail As String, _
                                     amount As Double, serviceDesc As String)
    ' Saves customer data to temp file for later job link send
    Dim fso As Object
    Dim ts As Object
    Dim folderPath As String
    Dim filePath As String
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    folderPath = GetBankTransferPendingPath()
    
    ' Create folder if needed
    If Not fso.FolderExists(folderPath) Then
        fso.CreateFolder folderPath
    End If
    
    filePath = folderPath & "\" & UCase(Trim(Replace(rego, " ", ""))) & ".txt"
    
    Set ts = fso.CreateTextFile(filePath, True)
    ts.WriteLine "REGO=" & UCase(Trim(rego))
    ts.WriteLine "NAME=" & customerName
    ts.WriteLine "COUNTRY_CODE=" & countryCode
    ts.WriteLine "MOBILE=" & mobileNumber
    ts.WriteLine "EMAIL=" & customerEmail
    ts.WriteLine "AMOUNT=" & Format(amount, "0.00")
    ts.WriteLine "SERVICE=" & serviceDesc
    ts.WriteLine "CREATED=" & Format(Now, "yyyy-mm-dd hh:nn:ss")
    ts.Close
    
    LogToRR9998 "Saved pending bank transfer for rego: " & rego & " to " & filePath
    
    Set ts = Nothing
    Set fso = Nothing
End Sub

Private Function GetBankTransferPending(rego As String) As Object
    ' Reads customer data from temp file, returns Dictionary or Nothing if not found
    Dim fso As Object
    Dim ts As Object
    Dim filePath As String
    Dim line As String
    Dim parts() As String
    Dim dict As Object
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set dict = CreateObject("Scripting.Dictionary")
    
    filePath = GetBankTransferPendingPath() & "\" & UCase(Trim(Replace(rego, " ", ""))) & ".txt"
    
    If Not fso.fileExists(filePath) Then
        Set GetBankTransferPending = Nothing
        Exit Function
    End If
    
    Set ts = fso.OpenTextFile(filePath, 1)
    Do While Not ts.AtEndOfStream
        line = ts.ReadLine
        If InStr(line, "=") > 0 Then
            parts = Split(line, "=", 2)
            dict(parts(0)) = parts(1)
        End If
    Loop
    ts.Close
    
    Set GetBankTransferPending = dict
    
    Set ts = Nothing
    Set fso = Nothing
End Function

Private Sub DeleteBankTransferPending(rego As String)
    ' Removes temp file after job link sent
    Dim fso As Object
    Dim filePath As String
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    filePath = GetBankTransferPendingPath() & "\" & UCase(Trim(Replace(rego, " ", ""))) & ".txt"
    
    If fso.fileExists(filePath) Then
        fso.DeleteFile filePath
        LogToRR9998 "Deleted pending bank transfer file for rego: " & rego
    End If
    
    Set fso = Nothing
End Sub

Public Sub ConfirmBankPaymentAndRelease()
    ' Main Menu Option 10: Confirm Bank Payment Received & Release Vehicle
    ' Used when customer has paid via bank transfer (no Stripe automation)
    On Error GoTo ErrHandler
    LogToRR9998 "ConfirmBankPaymentAndRelease started."
    
    Call OpenJobRegister
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation
        Exit Sub
    End If
    
    ' Get customer details from Book a Job
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long, targetRow As Long: targetRow = 0
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i: Exit For
        End If
    Next i
    
    If targetRow = 0 Then
        MsgBox "Rego not found in Book a Job.", vbExclamation
        Exit Sub
    End If
    
    Dim customerName As String, customerEmail As String
    customerName = Trim(ws.Cells(targetRow, "E").value)
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    Dim rego As String: rego = Trim(ws.Cells(targetRow, "AI").value)
    If rego = "" Then rego = selectedJobRego
    
    ' Calculate current balance from Job Build Notes
    Dim wsBuildNotes As Worksheet
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim totalK As Double: totalK = 0
    Dim totalI As Double: totalI = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(selectedJobRego) Then
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "K").value) Then
                totalK = totalK + CDbl(wsBuildNotes.Cells(jbnRow, "K").value)
            End If
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "I").value) Then
                totalI = totalI + CDbl(wsBuildNotes.Cells(jbnRow, "I").value)
            End If
        End If
    Next jbnRow
    
    Dim balance As Double
    balance = totalK - totalI
    
    ' Confirm with user
    Dim confirmMsg As String
    confirmMsg = "CONFIRM BANK PAYMENT RECEIVED" & vbCrLf & _
                 String(40, "-") & vbCrLf & vbCrLf & _
                 "Rego: " & UCase(selectedJobRego) & vbCrLf & _
                 "Customer: " & customerName & vbCrLf & vbCrLf & _
                 "Total Charged (K): $" & Format(totalK, "0.00") & vbCrLf & _
                 "Already Paid (I): $" & Format(totalI, "0.00") & vbCrLf & _
                 "Current Balance: $" & Format(balance, "0.00") & vbCrLf & vbCrLf & _
                 "This will:" & vbCrLf & _
                 "- Mark job as paid/closed" & vbCrLf & _
                 "- Notify supplier to RELEASE vehicle" & vbCrLf & vbCrLf & _
                 "Has the bank payment been received?"
    
    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Bank Payment") <> vbYes Then Exit Sub
    
    ' Ask if they want to send final invoice
    Dim sendInvoice As VbMsgBoxResult
    sendInvoice = MsgBox("Do you want to send a FINAL INVOICE to the customer?" & vbCrLf & vbCrLf & _
                         "YES = Generate and send final invoice (closes job)" & vbCrLf & _
                         "NO = Just close job and notify supplier (no invoice)", _
                         vbYesNo + vbQuestion, "Send Final Invoice?")
    
    ' Add Release Payment row to Job Build Notes
    Call AddReleasePaymentRow(selectedJobRego, balance, "Bank", customerEmail)
    
    If sendInvoice = vbYes Then
        ' Use existing invoice process - this will also notify supplier
        Call LaunchOutlook
        Call CreatePDFWithPayment(ws, targetRow, False, False)
        Call AppendToInvoiceList(ws, targetRow)
        
        ' Also notify customer their vehicle is ready
        Dim custPhone As String
        custPhone = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "") & Trim(ws.Cells(targetRow, "H").value)
        Call NotifyCustomerVehicleReadyManual(rego, customerName, customerEmail, custPhone)
    Else
        ' Just mark as closed and notify supplier + customer
        ' Turn row light blue
        ws.rows(targetRow).Interior.Color = RGB(173, 216, 230)
        
        ' Get customer contact info
        Dim customerPhone As String
        customerPhone = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "") & Trim(ws.Cells(targetRow, "H").value)
        
        ' Notify supplier(s) to release vehicle
        Call LaunchOutlook
        Call NotifySupplierVehicleReleaseManual(rego, customerName)
        
        ' Notify customer their vehicle is ready for collection
        Call NotifyCustomerVehicleReadyManual(rego, customerName, customerEmail, customerPhone)
        
        MsgBox "Job Closed & Notifications Sent!" & vbCrLf & vbCrLf & _
               "Rego: " & UCase(selectedJobRego) & vbCrLf & _
               "Release Payment added to Job Build Notes" & vbCrLf & _
               "Row marked as closed (blue)" & vbCrLf & _
               "- Customer notified: vehicle ready" & vbCrLf & _
               "- Supplier notified: can release vehicle", vbInformation, "Complete"
    End If
    
    LogToRR9998 "ConfirmBankPaymentAndRelease completed for " & selectedJobRego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in ConfirmBankPaymentAndRelease: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub

Private Sub AddReleasePaymentRow(rego As String, amount As Double, paymentMethod As String, customerEmail As String)
    ' Adds a Release Payment row to Job Build Notes
    ' This records the payment received and triggers close/post automation
    '
    ' COLUMN CALCULATION:
    ' - Total Billables (K) = All charges to customer
    ' - Total Paid (I) = All deposits + payments received
    ' - Release Amount = Total K - Total I
    '
    ' When customer pays the release amount:
    ' - Column I = amount (payment received) - adds to Total Paid
    ' - Column K = 0 (no new charge) - Total Billables unchanged
    ' - After this: Total K - Total I = 0 (fully paid)
    '
    On Error GoTo ErrHandler
    LogToRR9998 "AddReleasePaymentRow started for rego " & rego & " amount $" & Format(amount, "0.00") & " method " & paymentMethod
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes")
    
    ' Find next row
    Dim newRow As Long
    newRow = ws.Cells(ws.rows.count, "F").End(xlUp).Row + 1
    
    ' Find highest numeric ID
    Dim maxNumericID As Long
    Dim idVal As Variant
    Dim r As Long
    maxNumericID = 0
    
    For r = 2 To ws.Cells(ws.rows.count, 1).End(xlUp).Row
        idVal = ws.Cells(r, 1).value
        If IsNumeric(idVal) And Not IsEmpty(idVal) Then
            If CLng(idVal) > maxNumericID Then
                maxNumericID = CLng(idVal)
            End If
        End If
    Next r
    
    ' Build unique key for Power Automate
    Dim uniqueKey As String
    uniqueKey = UCase(Replace(Trim(rego), " ", "")) & "|Release Payment"
    
    ' Write the row
    ' NOTE: Column K is NOT set because this is a payment record, not a new charge
    ' The release amount was already calculated from existing billables - deposits
    ws.Cells(newRow, 1).value = maxNumericID + 1                              ' A - ID
    ws.Cells(newRow, 2).value = uniqueKey                                      ' B - Unique Key (for Power Automate lookup)
    ws.Cells(newRow, 3).value = Format(Now, "dd/mm/yyyy hh:mm:ss")            ' C - Completion Time
    ws.Cells(newRow, 4).value = customerEmail                                  ' D - Email
    ws.Cells(newRow, 6).value = UCase(Trim(rego))                             ' F - Rego
    ws.Cells(newRow, 7).value = "Deposit"                                     ' G - Type = Deposit (payment received)
    ws.Cells(newRow, 9).value = amount                                         ' I - Payment Amount Received
    ws.Cells(newRow, 10).value = "Release Payment (" & paymentMethod & ")"    ' J - Job Notes/Description
    ' Column K intentionally NOT set - no new charge, just recording payment
    ws.Cells(newRow, 13).value = paymentMethod                                ' M - Payment Method (Bank/Stripe)
    ws.Cells(newRow, 14).value = "Yes"                                        ' N - Close and Post Job For Billing
    
    LogToRR9998 "AddReleasePaymentRow: Added row " & newRow & " for rego " & rego & " - ID: " & (maxNumericID + 1) & " Key: " & uniqueKey & " - Payment: $" & Format(amount, "0.00") & " recorded in Col I"
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in AddReleasePaymentRow: " & Err.description
End Sub

Private Sub NotifySupplierVehicleReleaseManual(rego As String, customerName As String)
    ' Notifies supplier(s) that payment received and they can release the vehicle
    ' Called when manually confirming bank payment
    On Error GoTo ErrHandler
    LogToRR9998 "NotifySupplierVehicleReleaseManual started for rego " & rego
    
    ' Get supplier(s) from Job Build Notes
    Dim wsBuildNotes As Worksheet
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim supplierName As String, supplierEmail As String, supplierMobile As String
    Dim suppliersNotified As Long: suppliersNotified = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(rego) Then
            ' Check if this is a Supplier row
            If InStr(1, wsBuildNotes.Cells(jbnRow, "G").value, "Supplier", vbTextCompare) > 0 Then
                supplierName = Trim(wsBuildNotes.Cells(jbnRow, "H").value)
                supplierEmail = Trim(wsBuildNotes.Cells(jbnRow, "X").value)
                supplierMobile = Trim(wsBuildNotes.Cells(jbnRow, "Y").value)
                
                ' Clean up mobile number
                supplierMobile = Replace(supplierMobile, " ", "")
                supplierMobile = Replace(supplierMobile, "-", "")
                If Left(supplierMobile, 1) = "0" Then supplierMobile = Mid(supplierMobile, 2)
                If Left(supplierMobile, 3) <> "+64" And Left(supplierMobile, 2) <> "64" Then
                    supplierMobile = "64" & supplierMobile
                End If
                supplierMobile = Replace(supplierMobile, "+", "")
                
                If supplierName <> "" And (supplierEmail <> "" Or supplierMobile <> "") Then
                    Call SendSupplierReleaseNotificationManual(rego, customerName, supplierName, supplierEmail, supplierMobile)
                    suppliersNotified = suppliersNotified + 1
                End If
            End If
        End If
    Next jbnRow
    
    If suppliersNotified > 0 Then
        LogToRR9998 "NotifySupplierVehicleReleaseManual: Notified " & suppliersNotified & " supplier(s) for rego " & rego
    Else
        LogToRR9998 "NotifySupplierVehicleReleaseManual: No suppliers found for rego " & rego
    End If
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifySupplierVehicleReleaseManual: " & Err.description
End Sub

Private Sub NotifyCustomerVehicleReadyManual(rego As String, customerName As String, customerEmail As String, customerPhone As String)
    ' Sends customer notification that their vehicle is ready for collection
    ' Called when manually confirming bank payment
    On Error GoTo ErrHandler
    LogToRR9998 "NotifyCustomerVehicleReadyManual started for rego " & rego
    
    If customerName = "" Then customerName = "there"
    
    Dim emailSubject As String
    emailSubject = "Your Vehicle is Ready for Collection - " & rego
    
    ' SMS text
    Dim smsText As String
    smsText = "Hi " & customerName & ", great news!" & vbCrLf & vbCrLf & _
              "Payment received for job " & rego & "." & vbCrLf & _
              "Your vehicle is NOW READY for collection from the workshop." & vbCrLf & vbCrLf & _
              "Thank you for choosing EEK Mechanical!" & vbCrLf & _
              "0800 769 000"
    
    ' Email text
    Dim emailText As String
    emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                "Great news! We have received your payment for job " & rego & "." & vbCrLf & vbCrLf & _
                String(50, "=") & vbCrLf & _
                "YOUR VEHICLE IS READY FOR COLLECTION" & vbCrLf & _
                String(50, "=") & vbCrLf & vbCrLf & _
                "We have processed your payment and notified the workshop." & vbCrLf & _
                "You can now collect your vehicle at your earliest convenience." & vbCrLf & vbCrLf & _
                "Please remember to bring:" & vbCrLf & _
                "- Photo ID" & vbCrLf & _
                "- This email or your payment confirmation" & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical!" & vbCrLf & vbCrLf & _
                "If you have any questions, please call us on 0800 769 000." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    ' Send SMS if phone available
    If customerPhone <> "" Then
        ' Clean up phone number
        customerPhone = Replace(customerPhone, " ", "")
        customerPhone = Replace(customerPhone, "-", "")
        If Left(customerPhone, 1) = "0" Then customerPhone = Mid(customerPhone, 2)
        If Left(customerPhone, 2) <> "64" Then customerPhone = "64" & customerPhone
        
        Dim mobileEmail As String
        mobileEmail = "+" & customerPhone & "@sms.tnz.co.nz"
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
        LogToRR9998 "NotifyCustomerVehicleReadyManual: SMS sent to " & mobileEmail
    End If
    
    ' Send email if available
    If customerEmail <> "" Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
        LogToRR9998 "NotifyCustomerVehicleReadyManual: Email sent to " & customerEmail
    End If
    
    LogToRR9998 "NotifyCustomerVehicleReadyManual completed for rego " & rego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifyCustomerVehicleReadyManual: " & Err.description
End Sub

Private Sub SendSupplierReleaseNotificationManual(rego As String, customerName As String, supplierName As String, supplierEmail As String, supplierMobile As String)
    ' Sends notification to supplier that payment received - CAN release vehicle
    On Error GoTo ErrHandler
    
    Call LaunchOutlook
    
    Dim emailSubject As String
    emailSubject = "Job " & rego & " - PAYMENT RECEIVED - Vehicle Can Be Released"
    
    ' SMS text
    Dim smsText As String
    smsText = "Hi " & supplierName & ", payment received for job " & rego & "." & vbCrLf & vbCrLf & _
              "YOU CAN NOW RELEASE THE VEHICLE to the customer." & vbCrLf & vbCrLf & _
              "Thank you for your service!" & vbCrLf & _
              "EEK Mechanical"
    
    ' Email text
    Dim emailText As String
    emailText = "Hi " & supplierName & "," & vbCrLf & vbCrLf & _
                "Great news! Payment has been received for job " & rego & "." & vbCrLf & vbCrLf & _
                String(50, "=") & vbCrLf & _
                "VEHICLE CAN NOW BE RELEASED" & vbCrLf & _
                String(50, "=") & vbCrLf & vbCrLf & _
                "The customer has paid in full. You can now release the vehicle." & vbCrLf & vbCrLf & _
                "Thank you for your service on this job!" & vbCrLf & vbCrLf & _
                "If you have any questions, please call us on " & SUPPLIER_CONTACT_PHONE & "." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | " & SUPPLIER_CONTACT_PHONE
    
    ' Send SMS if mobile available
    If supplierMobile <> "" Then
        Dim mobileEmail As String
        mobileEmail = "+" & supplierMobile & "@sms.tnz.co.nz"
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    End If
    
    ' Send email if available
    If supplierEmail <> "" Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", supplierEmail, emailSubject, emailText)
    End If
    
    LogToRR9998 "SendSupplierReleaseNotificationManual sent to " & supplierName & " for rego " & rego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendSupplierReleaseNotificationManual: " & Err.description
End Sub

Public Sub SendReleasePaymentWithInvoice()
    ' Main Menu Option 9: Send Release Payment with Invoice
    ' Combines invoice generation + release payment automation
    ' This is the streamlined flow for end-of-job payment collection
    On Error GoTo ErrHandler
    LogToRR9998 "SendReleasePaymentWithInvoice started."
    
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation
        Exit Sub
    End If
    
    ' Get customer details from Book a Job
    Dim ws As Worksheet: Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim i As Long, lastRow As Long, targetRow As Long: targetRow = 0
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If Trim(ws.Cells(i, "V").value) = Trim(selectedJobRego) Then
            targetRow = i: Exit For
        End If
    Next i
    
    If targetRow = 0 Then
        MsgBox "Rego not found in Book a Job." & vbCrLf & vbCrLf & _
               "Release Payment requires an existing job.", vbExclamation
        Exit Sub
    End If
    
    Dim countryCode As String, mobileNumber As String, customerEmail As String, customerName As String
    countryCode = Replace(Trim(ws.Cells(targetRow, "G").value), "+", "")
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)
    customerEmail = Trim(ws.Cells(targetRow, "D").value)
    customerName = Trim(ws.Cells(targetRow, "E").value)
    Dim rego As String: rego = Trim(ws.Cells(targetRow, "AI").value)
    If rego = "" Then rego = selectedJobRego
    
    If countryCode = "" Or mobileNumber = "" Then MsgBox "Missing mobile contact.": Exit Sub
    If customerEmail = "" Then MsgBox "Missing email.": Exit Sub
    
    ' Calculate release payment from Job Build Notes
    Dim wsBuildNotes As Worksheet
    On Error Resume Next
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    On Error GoTo ErrHandler
    
    If wsBuildNotes Is Nothing Then
        MsgBox "Job Build Notes sheet not found.", vbExclamation
        Exit Sub
    End If
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim totalK As Double: totalK = 0
    Dim totalI As Double: totalI = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(selectedJobRego) Then
            ' Sum Column K (charged)
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "K").value) Then
                totalK = totalK + CDbl(wsBuildNotes.Cells(jbnRow, "K").value)
            End If
            ' Sum Column I (paid)
            If IsNumeric(wsBuildNotes.Cells(jbnRow, "I").value) Then
                totalI = totalI + CDbl(wsBuildNotes.Cells(jbnRow, "I").value)
            End If
        End If
    Next jbnRow
    
    Dim releaseAmount As Double
    releaseAmount = totalK - totalI
    
    ' Validation: must have positive balance
    If releaseAmount <= 0 Then
        MsgBox "Release amount is $" & Format(releaseAmount, "0.00") & " - nothing to collect." & vbCrLf & _
               "Total K: $" & Format(totalK, "0.00") & vbCrLf & _
               "Total I: $" & Format(totalI, "0.00"), vbExclamation
        Exit Sub
    End If
    
    ' Build unique key for Power Automate lookup
    Dim uniqueKey As String
    uniqueKey = UCase(Replace(Trim(selectedJobRego), " ", "")) & "|Release Payment"
    
    ' Confirm with user
    Dim confirmMsg As String
    confirmMsg = "SEND RELEASE PAYMENT" & vbCrLf & _
                 String(40, "-") & vbCrLf & vbCrLf & _
                 "Rego: " & UCase(selectedJobRego) & vbCrLf & _
                 "Customer: " & customerName & vbCrLf & _
                 "Email: " & customerEmail & vbCrLf & _
                 "Mobile: +" & countryCode & mobileNumber & vbCrLf & vbCrLf & _
                 "Total Charged (K): $" & Format(totalK, "0.00") & vbCrLf & _
                 "Already Paid (I): $" & Format(totalI, "0.00") & vbCrLf & _
                 "AMOUNT DUE: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
                 "This will:" & vbCrLf & _
                 "- Generate and email invoice" & vbCrLf & _
                 "- Send payment link (SMS + Email)" & vbCrLf & _
                 "- Auto-close job when paid" & vbCrLf & vbCrLf & _
                 "Proceed?"
    
    If MsgBox(confirmMsg, vbYesNo + vbQuestion, "Confirm Release Payment") <> vbYes Then Exit Sub
    
    ' Generate Invoice PDF and send payment link
    Call CreatePDFWithPaymentForRelease(ws, targetRow, releaseAmount, uniqueKey, countryCode, mobileNumber)
    
    MsgBox "Release Payment Sent!" & vbCrLf & vbCrLf & _
           "Amount: $" & Format(releaseAmount, "0.00") & vbCrLf & vbCrLf & _
           "Invoice emailed to customer" & vbCrLf & _
           "Payment link sent (SMS + Email)" & vbCrLf & vbCrLf & _
           "Job will auto-close when payment received.", vbInformation, "Complete"
    
    LogToRR9998 "SendReleasePaymentWithInvoice completed for " & selectedJobRego & " - Amount: $" & Format(releaseAmount, "0.00")
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendReleasePaymentWithInvoice: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub

Private Sub CreatePDFWithPaymentForRelease(ws As Worksheet, rowNumber As Long, releaseAmount As Double, uniqueKey As String, countryCode As String, mobileNumber As String)
    ' Creates invoice PDF and sends with release payment automation link
    ' Based on CreatePDFWithPayment but uses release.html redirect for automation
    Dim wsJobNotes As Worksheet
    Dim doc As Object
    Dim outputPathForEmail As String, finalOneDrivePath As String, localFolder As String
    Dim COLUMN_E As String, COLUMN_B As String, XeroRef As String, rego As String
    Dim COLUMN_AJ As String, STOTAL As Double
    Dim JOBNOTE(1 To 7) As String, q(1 To 7) As Long, u(1 To 7) As Double, a(1 To 7) As Double
    Dim APAID As Double, AOS As Double
    Dim pstatus As String, formattedAOS As String
    Dim i As Long, jobRow As Long, currentLine As Integer, currentRow As Long
    Dim reverseDate As String, fileName As String
    Dim WordApp As Object, templatePath As String, recipientName As String
    Dim recipientEmail As String, emailBody As String
    
    currentRow = rowNumber
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    templatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 COMPANY DOCUMENTS\20210401 EEK Mechanical END USER TERMS OF SERVICE.dotx")
    If Dir(templatePath) = "" Then
        MsgBox "The Word template could not be found.", vbCritical
        Exit Sub
    End If
    
    On Error Resume Next
    Set WordApp = GetObject(, "Word.Application")
    If WordApp Is Nothing Then Set WordApp = CreateObject("Word.Application")
    On Error GoTo 0
    If WordApp Is Nothing Then
        MsgBox "Unable to initialize Word application.", vbCritical
        Exit Sub
    End If
    
    localFolder = "C:\Temp\"
    If Dir(localFolder, vbDirectory) = "" Then
        MsgBox "Local folder " & localFolder & " does not exist.", vbCritical
        Exit Sub
    End If
    
    ' Column F = Invoice Name, Column E = Customer Name
    COLUMN_E = ws.Cells(currentRow, "F").value
    If Trim(COLUMN_E) = "" Then COLUMN_E = ws.Cells(currentRow, "E").value
    COLUMN_B = Format(ws.Cells(currentRow, "AG").value, "d mmm yyyy")
    rego = ws.Cells(currentRow, "AI").value
    If rego = "" Then rego = selectedJobRego
    
    recipientEmail = ws.Cells(currentRow, "AF").value
    If recipientEmail = "" Then recipientEmail = ws.Cells(currentRow, "D").value
    recipientName = Trim(ws.Cells(currentRow, "E").value)
    
    ' === INVOICE NUMBER (Interim) ===
    Dim lastInvoice As Variant: lastInvoice = 0
    For i = currentRow - 1 To 1 Step -1
        If Not IsEmpty(ws.Cells(i, "AU").value) Then
            lastInvoice = ws.Cells(i, "AU").value
            If Left(CStr(lastInvoice), 4) = "INT-" Then
                lastInvoice = Mid(CStr(lastInvoice), 5)
            End If
            If IsNumeric(lastInvoice) Then Exit For
        End If
    Next i
    XeroRef = "INT-" & (CLng(lastInvoice) + 1)
    
    COLUMN_AJ = ws.Cells(currentRow, "AJ").value
    STOTAL = 0: APAID = 0: AOS = 0: currentLine = 1
    
    ' === Gather Job Notes (up to 7 lines) ===
    For jobRow = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "A").End(xlUp).Row
        If wsJobNotes.Cells(jobRow, "F").value = ws.Cells(currentRow, "V").value Then
            Select Case wsJobNotes.Cells(jobRow, "G").value
                Case "Billable"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = NullToDouble(wsJobNotes.Cells(jobRow, "K").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        If wsJobNotes.Cells(jobRow, "M").value <> "No" Then APAID = APAID + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                Case "Reimbursement"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NullToDouble(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                Case "Refund"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NullToDouble(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                Case "Deposit"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NullToDouble(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        APAID = APAID + NullToDouble(wsJobNotes.Cells(jobRow, "I").value)
                        currentLine = currentLine + 1
                    Else
                        APAID = APAID + NullToDouble(wsJobNotes.Cells(jobRow, "I").value)
                    End If
            End Select
        End If
    Next jobRow
    
    AOS = releaseAmount  ' Use the calculated release amount
    formattedAOS = "$" & Format(AOS, "0.00")
    
    pstatus = "FINAL PAYMENT - Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
              "Your job is complete! Please pay now to release your vehicle." & vbNewLine & _
              "Payment details:" & vbNewLine & _
              "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
    
    ' === Build Word document replacements ===
    Set doc = WordApp.Documents.Add(templatePath)
    Dim replacements As Object: Set replacements = CreateObject("Scripting.Dictionary")
    replacements.Add "[COLUMN F]", COLUMN_E
    replacements.Add "[COLUMN B]", COLUMN_B
    replacements.Add "[XERO REF]", CStr(XeroRef)
    replacements.Add "[REGO]", rego
    replacements.Add "[COLUMN AJ]", COLUMN_AJ
    replacements.Add "[STOTAL]", "$" & Format(STOTAL, "0.00")
    replacements.Add "[APAID]", "$" & Format(APAID, "0.00")
    replacements.Add "[AOS]", formattedAOS
    replacements.Add "[STATUS]", pstatus
    
    Dim lineText As String
    For i = 1 To 7
        lineText = Trim(JOBNOTE(i))
        replacements.Add "[JOBNOTE" & i & "]", lineText
        replacements.Add "[Q" & i & "]", IIf(lineText = "", "", CStr(q(i)))
        replacements.Add "[U" & i & "]", IIf(lineText = "", "", "$" & Format(u(i), "0.00"))
        replacements.Add "[A" & i & "]", IIf(lineText = "", "", "$" & Format(a(i), "0.00"))
    Next i
    
    ' Do the find/replace
    Dim storyRange As Object, field As Variant
    For Each storyRange In doc.StoryRanges
        For Each field In replacements.keys
            With storyRange.Find
                .ClearFormatting
                .Replacement.ClearFormatting
                .text = field
                .Replacement.text = Left(replacements(field), 255)
                .Wrap = 1
                .Execute Replace:=2
            End With
        Next field
    Next storyRange
    
    ' === File naming ===
    reverseDate = Format(ws.Cells(currentRow, "AG").value, "yyyymmdd")
    fileName = "RELEASE_" & reverseDate & "_" & rego & "_" & _
               Replace(COLUMN_E, " ", "_") & "_" & Format(Now, "yyyymmddhhmmss") & ".pdf"
    outputPathForEmail = localFolder & fileName
    finalOneDrivePath = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\" & _
        "1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\" & _
        "RELEASE_" & rego & ".pdf"
    
    doc.ExportAsFixedFormat OutputFileName:=outputPathForEmail, ExportFormat:=17
    doc.Close False
    
    ' === Build invoice email body ===
    emailBody = "Dear " & recipientName & "," & vbNewLine & vbNewLine & _
                "Final Payment Invoice " & XeroRef & " for NZD " & Format(AOS, "0.00") & " has been issued." & vbNewLine & vbNewLine & _
                "Your job is now complete! Once payment is received, we will release your vehicle." & vbNewLine & vbNewLine & _
                pstatus & vbNewLine & vbNewLine & _
                "By proceeding with our services, you have agreed to the stated terms of trade, posted at:" & vbNewLine & _
                "https://www.eek.nz/terms-of-service" & vbNewLine & vbNewLine & _
                "Thank you," & vbNewLine & "EEK Mechanical" & vbNewLine & _
                "Level 1, 6 Johnsonville Road" & vbNewLine & "Johnsonville" & vbNewLine & "Wellington 6037" & vbNewLine & "New Zealand"
    
    ' === Send invoice email ===
    Dim invoiceSent As Boolean
    invoiceSent = SendViaOutbox("no-reply@eek.nz", recipientEmail, _
        "Final Payment Invoice " & XeroRef & " from EEK Mechanical", _
        emailBody, outputPathForEmail)
    
    If invoiceSent Then
        Application.Wait (Now + timeValue("0:00:02"))
        On Error Resume Next: If Dir(finalOneDrivePath) <> "" Then Kill finalOneDrivePath: On Error GoTo 0
        FileCopy outputPathForEmail, finalOneDrivePath
        
        ' === Send Release Payment Link with Automation ===
        Call SendReleasePaymentLink(rego, recipientName, recipientEmail, countryCode, mobileNumber, AOS, XeroRef, uniqueKey)
    Else
        MsgBox "There was an issue sending the invoice email.", vbExclamation
    End If
    
    WordApp.Quit False
End Sub

Private Sub SendReleasePaymentLink(rego As String, customerName As String, customerEmail As String, _
                                   countryCode As String, mobileNumber As String, amountDue As Double, _
                                   invoiceRef As String, uniqueKey As String)
    ' Sends payment link with release automation redirect URL
    ' This triggers the Power Automate flow to close job and post when paid
    On Error GoTo ErrHandler
    
    Dim stripeLink As String, token As String, finalLink As String
    Dim redirectUrl As String
    Dim mobileEmail As String, emailSubject As String
    Dim smsText As String, emailText As String
    
    ' Build release redirect URL with all params for Power Automate
    redirectUrl = "www.eek.nz/thanks/release.html?rego=" & UCase(Replace(Trim(rego), " ", "")) & _
                  "&amount=" & Format(amountDue, "0.00") & _
                  "&key=" & Application.WorksheetFunction.EncodeURL(uniqueKey) & _
                  "&name=" & Application.WorksheetFunction.EncodeURL(customerName) & _
                  "&email=" & Application.WorksheetFunction.EncodeURL(customerEmail) & _
                  "&phone=" & countryCode & mobileNumber
    
    ' Generate Stripe link with release redirect (True = capture payment)
    Call CreateStripeLink(rego, amountDue, rego & ": Release Payment - Invoice " & invoiceRef, stripeLink, redirectUrl, True)
    If stripeLink = "" Then
        LogToRR9998 "Stripe link generation failed for release payment"
        Exit Sub
    End If
    
    If InStr(stripeLink, "/") > 0 Then token = Mid(stripeLink, InStrRev(stripeLink, "/") + 1)
    finalLink = "https://www.eek.nz?token=" & token
    
    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    emailSubject = "Final Payment Request - Invoice " & invoiceRef
    
    ' SMS text
    smsText = "Hi " & customerName & ", your job is complete!" & vbCrLf & _
              "Final Amount Due: $" & Format(amountDue, "0.00") & vbCrLf & _
              "Please pay now: " & finalLink & vbCrLf & _
              "Your vehicle will be released once payment is received." & vbCrLf & _
              "EEK Mechanical"
    
    ' Email text
    emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                "Great news - your job (" & rego & ") is now complete!" & vbCrLf & vbCrLf & _
                "Final Amount Due: $" & Format(amountDue, "0.00") & vbCrLf & _
                "Invoice: " & invoiceRef & vbCrLf & vbCrLf & _
                "To pay securely online, click here: " & finalLink & vbCrLf & vbCrLf & _
                "Or pay by bank transfer:" & vbCrLf & _
                "Bank: ANZ Chartwell" & vbCrLf & _
                "Account Name: EEK Mechanical" & vbCrLf & _
                "Account Nbr: 06-0313-0860749-00" & vbCrLf & _
                "Reference: " & rego & vbCrLf & vbCrLf & _
                "Once we receive your payment, we will pay the contractor and notify you when your vehicle is ready for collection." & vbCrLf & vbCrLf & _
                "Please note: The workshop cannot release your vehicle until they receive payment from us." & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical!" & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    ' Send SMS
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    
    ' Send Email
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    
    ' Send staff copy
    Dim staffBody As String
    staffBody = "RELEASE PAYMENT WITH INVOICE SENT" & vbCrLf & _
                String(40, "-") & vbCrLf & _
                "Job Rego: " & rego & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Invoice: " & invoiceRef & vbCrLf & _
                "Release Amount: $" & Format(amountDue, "0.00") & vbCrLf & _
                "Unique Key: " & uniqueKey & vbCrLf & _
                "Payment Link: " & finalLink & vbCrLf & _
                "Redirect: " & redirectUrl & vbCrLf & vbCrLf & _
                "*** Job will AUTO-CLOSE when payment received ***"
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)
    
    LogToRR9998 "SendReleasePaymentLink completed - Rego: " & rego & " Amount: $" & Format(amountDue, "0.00") & " Key: " & uniqueKey
    
    ' === NOTIFY SUPPLIER(S) - DO NOT RELEASE VEHICLE YET ===
    Call NotifySupplierBillingIssued(rego, customerName)
    
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendReleasePaymentLink: " & Err.description
End Sub

Private Sub NotifySupplierBillingIssued(rego As String, customerName As String)
    ' Notifies supplier(s) that final billing has been issued to customer
    ' Reminds them NOT to release vehicle until notified by EEK
    On Error GoTo ErrHandler
    LogToRR9998 "NotifySupplierBillingIssued started for rego " & rego
    
    ' Get supplier(s) from Job Build Notes
    Dim wsBuildNotes As Worksheet
    Set wsBuildNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim jbnRow As Long, jbnLastRow As Long
    Dim supplierName As String, supplierEmail As String, supplierMobile As String
    Dim suppliersNotified As Long: suppliersNotified = 0
    
    jbnLastRow = wsBuildNotes.Cells(wsBuildNotes.rows.count, "F").End(xlUp).Row
    
    For jbnRow = 2 To jbnLastRow
        If Trim(wsBuildNotes.Cells(jbnRow, "F").value) = Trim(rego) Then
            ' Check if this is a Supplier row (Column G contains "Supplier")
            If InStr(1, wsBuildNotes.Cells(jbnRow, "G").value, "Supplier", vbTextCompare) > 0 Then
                supplierName = Trim(wsBuildNotes.Cells(jbnRow, "H").value)
                supplierEmail = Trim(wsBuildNotes.Cells(jbnRow, "X").value)
                supplierMobile = Trim(wsBuildNotes.Cells(jbnRow, "Y").value)
                
                ' Clean up mobile number
                supplierMobile = Replace(supplierMobile, " ", "")
                supplierMobile = Replace(supplierMobile, "-", "")
                If Left(supplierMobile, 1) = "0" Then supplierMobile = Mid(supplierMobile, 2)
                If Left(supplierMobile, 3) <> "+64" And Left(supplierMobile, 2) <> "64" Then
                    supplierMobile = "64" & supplierMobile
                End If
                supplierMobile = Replace(supplierMobile, "+", "")
                
                If supplierName <> "" And (supplierEmail <> "" Or supplierMobile <> "") Then
                    Call SendSupplierHoldNotification(rego, customerName, supplierName, supplierEmail, supplierMobile)
                    suppliersNotified = suppliersNotified + 1
                End If
            End If
        End If
    Next jbnRow
    
    If suppliersNotified > 0 Then
        LogToRR9998 "NotifySupplierBillingIssued: Notified " & suppliersNotified & " supplier(s) for rego " & rego
    Else
        LogToRR9998 "NotifySupplierBillingIssued: No suppliers found for rego " & rego
    End If
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in NotifySupplierBillingIssued: " & Err.description
End Sub

Private Sub SendSupplierHoldNotification(rego As String, customerName As String, supplierName As String, supplierEmail As String, supplierMobile As String)
    ' Sends notification to supplier that billing issued - DO NOT release vehicle
    On Error GoTo ErrHandler
    
    Dim emailSubject As String
    emailSubject = "Job " & rego & " - Final Billing Issued - DO NOT Release Vehicle"
    
    ' SMS text
    Dim smsText As String
    smsText = "Hi " & supplierName & ", EEK Mechanical has issued the final invoice for job " & rego & "." & vbCrLf & vbCrLf & _
              "IMPORTANT: Please DO NOT release the vehicle until you receive confirmation from EEK." & vbCrLf & vbCrLf & _
              "We will notify you once payment is received and the vehicle can be released." & vbCrLf & vbCrLf & _
              "Questions? Call " & SUPPLIER_CONTACT_PHONE & vbCrLf & _
              "EEK Mechanical"
    
    ' Email text
    Dim emailText As String
    emailText = "Hi " & supplierName & "," & vbCrLf & vbCrLf & _
                "EEK Mechanical has issued the final invoice to the customer for job " & rego & "." & vbCrLf & vbCrLf & _
                String(50, "-") & vbCrLf & _
                "IMPORTANT: DO NOT RELEASE THE VEHICLE" & vbCrLf & _
                String(50, "-") & vbCrLf & vbCrLf & _
                "Please hold the vehicle until you receive a separate notification from us confirming payment has been received." & vbCrLf & vbCrLf & _
                "We will send you an SMS and email as soon as the customer pays and you can release the vehicle." & vbCrLf & vbCrLf & _
                "If you have any questions, please call us on " & SUPPLIER_CONTACT_PHONE & "." & vbCrLf & vbCrLf & _
                "Thank you for your cooperation." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | " & SUPPLIER_CONTACT_PHONE
    
    ' Send SMS if mobile available
    If supplierMobile <> "" Then
        Dim mobileEmail As String
        mobileEmail = "+" & supplierMobile & "@sms.tnz.co.nz"
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    End If
    
    ' Send email if available
    If supplierEmail <> "" Then
        DoEvents
        Call SendViaOutbox("no-reply@eek.nz", supplierEmail, emailSubject, emailText)
    End If
    
    LogToRR9998 "SendSupplierHoldNotification sent to " & supplierName & " for rego " & rego
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in SendSupplierHoldNotification: " & Err.description
End Sub

Public Sub SendBankTransferJobLink()
    ' Sends job submission link after bank payment is confirmed
    ' Called from Menu > 5 > 7
    On Error GoTo ErrHandler
    
    Call OpenJobRegister
    Call LaunchOutlook
    
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation
        Exit Sub
    End If
    
    ' Try to get pending data
    Dim pendingData As Object
    Set pendingData = GetBankTransferPending(selectedJobRego)
    
    Dim customerName As String
    Dim countryCode As String
    Dim mobileNumber As String
    Dim customerEmail As String
    Dim amount As String
    Dim serviceDesc As String
    
    If pendingData Is Nothing Then
        ' No pending file - prompt for details
        If MsgBox("No pending bank transfer found for rego: " & selectedJobRego & vbCrLf & vbCrLf & _
                  "Enter details manually?", vbYesNo + vbQuestion, "No Pending Data") = vbNo Then
            Exit Sub
        End If
        
        mobileNumber = InputBox("Enter Mobile Number (no country code):", "Mobile")
        If mobileNumber = "" Then Exit Sub
        If Left(mobileNumber, 1) = "0" Then mobileNumber = Mid(mobileNumber, 2)
        
        countryCode = InputBox("Enter Country Code (e.g., 64):", "Country Code", "64")
        If countryCode = "" Then Exit Sub
        
        customerName = InputBox("Enter Customer Name:", "Customer Name")
        If customerName = "" Then customerName = "there"
        
        customerEmail = InputBox("Enter Customer Email (optional):", "Email")
        
        serviceDesc = InputBox("Enter Service Description:", "Service")
        If serviceDesc = "" Then serviceDesc = "Roadside Assistance"
        
        amount = InputBox("Enter Amount (optional, for reference):", "Amount", "0.00")
    Else
        ' Use pending data
        customerName = pendingData("NAME")
        countryCode = pendingData("COUNTRY_CODE")
        mobileNumber = pendingData("MOBILE")
        customerEmail = pendingData("EMAIL")
        amount = pendingData("AMOUNT")
        serviceDesc = pendingData("SERVICE")
        
        ' Confirm with user
        If MsgBox("Send job submission link to:" & vbCrLf & vbCrLf & _
                  "Name: " & customerName & vbCrLf & _
                  "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                  "Email: " & customerEmail & vbCrLf & _
                  "Amount: $" & amount & vbCrLf & _
                  "Service: " & serviceDesc, vbYesNo + vbQuestion, "Confirm Send") = vbNo Then
            Exit Sub
        End If
    End If
    
    ' Build job submission link with encoded data token
    Dim jobLink As String
    Dim dataString As String
    Dim encodedToken As String
    
    ' Combine all data into a pipe-separated string, then base64 encode
    dataString = UCase(Trim(selectedJobRego)) & "|" & _
                 customerName & "|" & _
                 countryCode & mobileNumber & "|" & _
                 customerEmail & "|" & _
                 amount & "|" & _
                 serviceDesc
    
    ' Use existing EncodeBase64 from PublicUtilities, make URL-safe
    encodedToken = EncodeBase64(dataString)
    encodedToken = Replace(encodedToken, "+", "-")
    encodedToken = Replace(encodedToken, "/", "_")
    encodedToken = Replace(encodedToken, "=", "")
    
    jobLink = "https://www.eek.nz/job/ad-hoc?d=" & encodedToken
    
    ' Build messages
    Dim mobileEmail As String
    mobileEmail = "+" & countryCode & mobileNumber & "@sms.tnz.co.nz"
    
    Dim emailSubject As String
    emailSubject = "Submit Your Job Details - Rego " & selectedJobRego
    
    Dim smsText As String
    smsText = "Hi " & customerName & ", thanks for your payment!" & vbCrLf & _
              "Please submit your job details here: " & vbCrLf & _
              jobLink & vbCrLf & _
              "EEK Mechanical"
    
    Dim emailText As String
    emailText = "Hi " & customerName & "," & vbCrLf & vbCrLf & _
                "Thank you for your payment!" & vbCrLf & vbCrLf & _
                "Please submit your job details by clicking the link below:" & vbCrLf & _
                jobLink & vbCrLf & vbCrLf & _
                "This will help us get your job started right away." & vbCrLf & vbCrLf & _
                "- EEK Mechanical" & vbCrLf & _
                "www.eek.nz | 0800 769 000"
    
    Dim staffBody As String
    staffBody = "Job Submission Link Sent" & vbCrLf & _
                "Rego: " & selectedJobRego & vbCrLf & _
                "Name: " & customerName & vbCrLf & _
                "Mobile: +" & countryCode & mobileNumber & vbCrLf & _
                "Email: " & customerEmail & vbCrLf & _
                "Amount: $" & amount & vbCrLf & _
                "Service: " & serviceDesc & vbCrLf & _
                "Link: " & jobLink
    
    ' Send messages
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsText)
    DoEvents
    If customerEmail <> "" Then Call SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, emailText)
    DoEvents
    Call SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", "[Staff Copy] " & emailSubject, staffBody)
    
    ' Delete pending file
    DeleteBankTransferPending selectedJobRego
    
    MsgBox "Job submission link sent to customer."
    LogToRR9998 "Sent job submission link for rego: " & selectedJobRego & " to +" & countryCode & mobileNumber
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in SendBankTransferJobLink: " & Err.description
    MsgBox "Error: " & Err.description, vbCritical
End Sub











