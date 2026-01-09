Attribute VB_Name = "DriverEnRouteModule"
' Attribute VB_Name = "DriverEnRouteModule"
' Attribute VB_Name = "DriverEnRouteModule"
Sub DriverEnRoute()
    On Error GoTo ErrHandler

    Call OpenJobRegister
    Call LaunchOutlook

    If selectedJobRego = "" Then
        ShowWarning "No Job Rego selected."
        LogToRR9998 "? DriverEnRoute aborted � no rego selected.", "DriverEnRouteLog.txt"
        Exit Sub
    End If

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")

    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)

    If foundCell Is Nothing Then
        ShowWarning "Selected Rego not found in column V."
        LogToRR9998 "? DriverEnRoute failed � rego not found: " & selectedJobRego, "DriverEnRouteLog.txt"
        Exit Sub
    End If

    Dim targetRow As Long
    targetRow = foundCell.Row

    ' === Confirm ETA ===
    Dim currentETA As String, newETA As String
    currentETA = Trim(ws.Cells(targetRow, "U").value)
    newETA = InputBox("Please confirm or modify the ETA (in minutes):", "ETA Confirmation", currentETA)

    If Trim(newETA) = "" Then
        ShowWarning "No ETA entered. Exiting process."
        LogToRR9998 "?? DriverEnRoute cancelled � no ETA entered for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
        Exit Sub
    End If

    ws.Cells(targetRow, "U").value = newETA

    ' === Build mobile email ===
    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    countryCode = Trim(ws.Cells(targetRow, "G").value)
    mobileNumber = Trim(ws.Cells(targetRow, "H").value)

    If countryCode = "" Or mobileNumber = "" Then
        ShowWarning "Missing country code or mobile number."
        LogToRR9998 "? DriverEnRoute failed � missing phone fields for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
        Exit Sub
    End If

    mobileNumber = Replace(mobileNumber, " ", "")
    mobileNumber = Replace(mobileNumber, "-", "")
    mobileNumber = Replace(mobileNumber, "+", "")

    If Left(countryCode, 1) <> "+" Then countryCode = "+" & countryCode

    mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"

    ' === Compose message ===
    Dim emailSubject As String, emailBody As String
    Dim technicianLine As String
    emailSubject = "Driver En Route for Rego " & selectedJobRego & " - ETA Confirmation"

    technicianLine = "To connect with a service technician during your wait period, call 0800 769 000."

    ' === Optional Supplier Info with Picker (uses timed prompt) ===
    Dim includeSupplier As VbMsgBoxResult
    includeSupplier = TimedMsgBox("Include supplier details in message to client?", 5, "Include Supplier Info", vbYesNo + vbQuestion)
    
    ' Default to No if timed out (returns -1) or user clicks No
    If includeSupplier = vbYes Then
        Dim supplierSheet As Worksheet
        Set supplierSheet = ThisWorkbook.Sheets("Job Build Notes")

        ' Search for all supplier matches for this rego
        Dim lastRow As Long, i As Long, matchCount As Long
        Dim rowIndices() As Long
        Dim supplierList As String
        
        lastRow = supplierSheet.Cells(supplierSheet.rows.count, "F").End(xlUp).Row
        matchCount = 0
        
        ' Find all suppliers for this rego
        For i = 2 To lastRow
            If Trim(supplierSheet.Cells(i, "F").value) = selectedJobRego And _
               InStr(1, supplierSheet.Cells(i, "G").value, "Supplier", vbTextCompare) > 0 Then
                matchCount = matchCount + 1
                ReDim Preserve rowIndices(1 To matchCount)
                rowIndices(matchCount) = i
            End If
        Next i
        
        If matchCount = 0 Then
            ShowWarning "No supplier info found for rego: " & selectedJobRego
            LogToRR9998 "? Supplier info not found for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
        ElseIf matchCount = 1 Then
            ' Only one supplier found, use it directly
            Dim supplierName As String, supplierMobile As String
            supplierName = Trim(supplierSheet.Cells(rowIndices(1), "H").value)
            supplierMobile = Trim(supplierSheet.Cells(rowIndices(1), "Y").value)
            
            If supplierMobile <> "" Then
                supplierMobile = "0" & supplierMobile
                technicianLine = "To connect with a service technician during your wait period, call " & supplierName & " on " & supplierMobile & "."
                LogToRR9998 "? Auto-selected single supplier: " & supplierName & " for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
            End If
        Else
            ' Multiple suppliers found, let user choose
            supplierList = ""
            For i = 1 To matchCount
                supplierList = supplierList & i & ". " & supplierSheet.Cells(rowIndices(i), "H").value & vbCrLf
            Next i
            
            Dim selectedIndex As Variant
            selectedIndex = Application.InputBox( _
                prompt:="Multiple suppliers found. Select by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
                title:="Select Supplier", _
                Type:=1)
            
            If VarType(selectedIndex) = vbBoolean Then
                ' User cancelled
                LogToRR9998 "?? DriverEnRoute supplier selection cancelled by user.", "DriverEnRouteLog.txt"
            ElseIf Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
                ShowWarning "Invalid selection. Using default technician line."
                LogToRR9998 "? DriverEnRoute invalid supplier selection: " & selectedIndex, "DriverEnRouteLog.txt"
            Else
                ' Valid selection
                Dim selectedRowIndex As Long
                selectedRowIndex = rowIndices(selectedIndex)
                supplierName = Trim(supplierSheet.Cells(selectedRowIndex, "H").value)
                supplierMobile = Trim(supplierSheet.Cells(selectedRowIndex, "Y").value)
                
                If supplierMobile <> "" Then
                    supplierMobile = "0" & supplierMobile
                    technicianLine = "To connect with a service technician during your wait period, call " & supplierName & " on " & supplierMobile & "."
                    LogToRR9998 "? Selected supplier: " & supplierName & " for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
                End If
            End If
        End If
    End If

    emailBody = "Thank you for confirming your roadside assistance service." & vbCrLf & _
                "ETA: " & newETA & " minutes" & vbCrLf & _
                technicianLine & vbCrLf & vbCrLf & _
                "Thank you for choosing EEK Mechanical" & vbCrLf & _
                "EEK Mechanical � " & vbCrLf & _
                "www.eek.nz"

    ' === Send using SendViaOutbox ===
    If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, emailBody) Then
        ShowStatus "? ETA message sent successfully to client."
        LogToRR9998 "? DriverEnRoute sent � ETA: " & newETA & ", To: " & mobileEmail & ", Rego: " & selectedJobRego, "DriverEnRouteLog.txt"
    Else
        ShowError "? There was an issue sending the ETA message."
        LogToRR9998 "? DriverEnRoute failed during send for rego: " & selectedJobRego, "DriverEnRouteLog.txt"
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "? Error in DriverEnRoute: " & Err.description, "DriverEnRouteLog.txt"
End Sub






