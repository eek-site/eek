Attribute VB_Name = "AddRecordToBookingDataModule"
' Attribute VB_Name = "AddRecordToBookingDataModule"
' Attribute VB_Name = "AddRecordToBookingDataModule"
' ===============================
' ADD RECORD TO BOOKING DATA - COMPLETE PROCESS
' Creates record and updates Column X with SharePoint ID
' ===============================
Sub AddRecordToBookingData()
    On Error GoTo ErrHandler
    LogToRR9998 "AddRecordToBookingData started."
    
    ' Track menu selection
    currentMenuSelection = 32
    currentSubMenuSelection = 0
    
    ' Standard job selection
    Call OpenJobRegister
    Call LaunchOutlook
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "? AddRecordToBookingData aborted — no rego selected.", "BookingDataLog.txt"
        Exit Sub
    End If
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Book a Job")
    Dim foundCell As Range
    Set foundCell = ws.Range("V:V").Find(What:=selectedJobRego, LookIn:=xlValues, LookAt:=xlWhole)
    If foundCell Is Nothing Then
        MsgBox "Selected Rego not found in column V."
        LogToRR9998 "? AddRecordToBookingData failed — rego not found: " & selectedJobRego, "BookingDataLog.txt"
        Exit Sub
    End If
    
    Dim targetRow As Long
    targetRow = foundCell.Row
    
    ' Pull only required data from worksheet
    Dim customerName As String, phoneNumber As String, Email As String
    Dim location As String, rego As String, make As String
    Dim model As String, serviceType As String
    
    ' E = Customer Name
    customerName = Trim(CStr(ws.Cells(targetRow, "E").value))
    
    ' G & H = Phone (concatenate if both exist)
    Dim phoneG As String, phoneH As String
    phoneG = Trim(CStr(ws.Cells(targetRow, "G").value))
    phoneH = Trim(CStr(ws.Cells(targetRow, "H").value))
    If phoneG <> "" And phoneH <> "" Then
        phoneNumber = phoneG & " / " & phoneH
    ElseIf phoneG <> "" Then
        phoneNumber = phoneG
    Else
        phoneNumber = phoneH
    End If
    
    ' AF = Email
    Email = Trim(CStr(ws.Cells(targetRow, "AF").value))
    
    ' K = Address/Location
    location = Trim(CStr(ws.Cells(targetRow, "K").value))
    
    ' V = Rego
    rego = selectedJobRego
    
    ' O = Vehicle Make
    make = Trim(CStr(ws.Cells(targetRow, "O").value))
    
    ' P = Vehicle Model
    model = Trim(CStr(ws.Cells(targetRow, "P").value))
    
    ' J = Job Type/Service Description
    serviceType = Trim(CStr(ws.Cells(targetRow, "J").value))
    
    ' Display confirmation
    Dim confirmMsg As String
    confirmMsg = "Ready to send booking data to Power Automate:" & vbCrLf & vbCrLf & _
                 "Customer: " & customerName & vbCrLf & _
                 "Phone: " & phoneNumber & vbCrLf & _
                 "Email: " & Email & vbCrLf & _
                 "Location: " & location & vbCrLf & _
                 "Vehicle: " & rego & " - " & make & " " & model & vbCrLf & _
                 "Service: " & serviceType & vbCrLf & vbCrLf & _
                 "Continue?"
    
    If MsgBox(confirmMsg, vbQuestion + vbYesNo, "Confirm Booking Data") = vbNo Then
        LogToRR9998 "? AddRecordToBookingData cancelled by user", "BookingDataLog.txt"
        Exit Sub
    End If
    
    ' Generate timestamps and IDs
    Dim timestamp As String
    timestamp = Format(Now, "yyyy-mm-dd") & "T" & Format(Now, "hh:mm:ss") & ".000Z"
    
    Dim sessionId As String
    sessionId = "session_" & Format(Now, "yyyymmddhhmmss") & "_" & GenerateRandomString(10)
    
    ' Generate the bookingId
    Dim bookingId As String
    bookingId = "booking_" & Format(Now, "yyyymmddhhmmss") & "_" & GenerateRandomString(10)
    
    ' Build minimal JSON payload with only required fields
    Dim jsonBody As String
    jsonBody = "{"
    jsonBody = jsonBody & """name"": """ & EscapeJson(customerName) & ""","
    jsonBody = jsonBody & """phone"": """ & EscapeJson(phoneNumber) & ""","
    jsonBody = jsonBody & """email"": """ & EscapeJson(Email) & ""","
    jsonBody = jsonBody & """location"": """ & EscapeJson(location) & ""","
    jsonBody = jsonBody & """rego"": """ & EscapeJson(rego) & ""","
    jsonBody = jsonBody & """make"": """ & EscapeJson(make) & ""","
    jsonBody = jsonBody & """model"": """ & EscapeJson(model) & ""","
    jsonBody = jsonBody & """service"": """ & EscapeJson(serviceType) & ""","
    jsonBody = jsonBody & """sessionId"": """ & sessionId & ""","
    jsonBody = jsonBody & """timestamp"": """ & timestamp & ""","
    jsonBody = jsonBody & """idempotencyKey"": """ & bookingId & """"
    jsonBody = jsonBody & "}"
    
    ' STEP 1: Send API request to create booking
    Dim httpRequest As Object
    Set httpRequest = CreateObject("MSXML2.XMLHTTP")
    
    Dim apiUrl As String
    apiUrl = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c8ac1b8ac2574f66ad4efcdc23165379/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kg6bffZKUQzUVR7jzpdTRaeudIa_T99V1hpzb_VlXPk"
    
    httpRequest.Open "POST", apiUrl, False
    httpRequest.setRequestHeader "Content-Type", "application/json"
    httpRequest.send jsonBody
    
    If httpRequest.status = 200 Or httpRequest.status = 202 Then
        ' Mark the row to indicate it was sent
        ws.Cells(targetRow, "AT").value = "Sent to PA " & Format(Now, "dd/mm/yy hh:mm")
        LogToRR9998 "? Booking data sent for " & customerName & " - " & rego & " - BookingId: " & bookingId, "BookingDataLog.txt"
        
        ' STEP 2: Retry SharePoint Lookup up to 5 times
        Dim lookupSuccess As Boolean
        lookupSuccess = False
        
        Dim lookupUrl As String
        lookupUrl = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c35b9414a0be42f88182ae7e6e409f1d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2ztt24wScLuAfifD0pjzovseRDKXBAEtCQtScGMgPqQ"
        
        Dim lookupBody As String
        lookupBody = "{""bookingId"": """ & bookingId & """}"
        
        Dim retryCount As Integer
        Dim maxRetries As Integer
        maxRetries = 5
        
        For retryCount = 1 To maxRetries
            Application.StatusBar = "Looking up record in SharePoint... Attempt " & retryCount & " of " & maxRetries
            
            httpRequest.Open "POST", lookupUrl, False
            httpRequest.setRequestHeader "Content-Type", "application/json"
            httpRequest.send lookupBody
            
            If httpRequest.status = 200 Then
                Dim responseText As String
                responseText = httpRequest.responseText
                
                ' Check if success is true
                If InStr(responseText, """success"":true") > 0 Then
                    ' Extract bookingData field (Base64 encoded)
                    Dim base64Data As String
                    base64Data = ExtractJsonValue(responseText, "bookingData")
                    
                    If base64Data <> "" Then
                        ' Decode Base64
                        Dim decodedJson As String
                        decodedJson = Base64Decode(base64Data)
                        
                        ' Extract name from decoded JSON
                        Dim sharepointName As String
                        sharepointName = ExtractJsonValue(decodedJson, "name")
                        
                        ' If name not found at root, try customerData.name
                        If sharepointName = "" Then
                            Dim customerData As String
                            customerData = ExtractJsonObject(decodedJson, "customerData")
                            If customerData <> "" Then
                                sharepointName = ExtractJsonValue(customerData, "name")
                            End If
                        End If
                        
                        ' Compare names (case-insensitive)
                        If LCase(Trim(sharepointName)) = LCase(Trim(customerName)) Then
                            ' Names match - write bookingId to column X
                            ws.Cells(targetRow, "X").value = bookingId
                            ws.Cells(targetRow, "AT").value = ws.Cells(targetRow, "AT").value & " | SP verified (attempt " & retryCount & ")"
                            lookupSuccess = True
                            LogToRR9998 "? SharePoint verified on attempt " & retryCount & " - BookingId written to column X: " & bookingId
                            Exit For ' Success - exit the retry loop
                        Else
                            LogToRR9998 "? Attempt " & retryCount & " - SharePoint name mismatch. Expected: " & customerName & ", Got: " & sharepointName
                        End If
                    Else
                        LogToRR9998 "? Attempt " & retryCount & " - No bookingData in response (record may not exist yet)"
                    End If
                Else
                    LogToRR9998 "? Attempt " & retryCount & " - SharePoint returned success:false (record may not exist yet)"
                End If
            Else
                LogToRR9998 "? Attempt " & retryCount & " - API call failed with status: " & httpRequest.status
            End If
            
            ' If not successful and not the last attempt, wait before retrying
            If Not lookupSuccess And retryCount < maxRetries Then
                Application.StatusBar = "Waiting before retry " & (retryCount + 1) & "..."
                
                ' Progressive wait times: 2, 3, 4, 5 seconds
                Application.Wait (Now + timeValue("0:00:0" & (retryCount + 1)))
            End If
        Next retryCount
        
        Application.StatusBar = False
        
        ' Display final result
        If lookupSuccess Then
            MsgBox "Success! Booking created and verified." & vbCrLf & vbCrLf & _
                   "BookingId: " & bookingId & vbCrLf & _
                   "Updated in Column X", vbInformation, "Complete"
        Else
            MsgBox "Booking created but SharePoint verification timed out after " & maxRetries & " attempts." & vbCrLf & vbCrLf & _
                   "BookingId: " & bookingId & vbCrLf & _
                   "The record may still be processing. Try again later or check Column X manually.", _
                   vbExclamation, "Verification Timeout"
            
            ' Store bookingId in column Y for manual retry later if needed
            ws.Cells(targetRow, "Y").value = bookingId & " (unverified)"
            LogToRR9998 "? SharePoint verification timed out. BookingId stored in column Y for manual retry: " & bookingId
        End If
        
    Else
        MsgBox "Failed to send booking data." & vbCrLf & _
               "Status: " & httpRequest.status & vbCrLf & _
               "Response: " & httpRequest.responseText, vbExclamation, "API Error"
        LogToRR9998 "? Failed to send booking data. Status: " & httpRequest.status
    End If
    
    Exit Sub
ErrHandler:
    Application.StatusBar = False
    LogToRR9998 "Error in AddRecordToBookingData: " & Err.description, "BookingDataLog.txt"
    MsgBox "Error: " & Err.description, vbCritical, "Error"
End Sub

' ===============================
' HELPER FUNCTIONS
' ===============================
Private Function GenerateRandomString(length As Long) As String
    Dim chars As String
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    Dim result As String
    Dim i As Long
    
    Randomize
    For i = 1 To length
        result = result & Mid(chars, Int((Len(chars) * Rnd) + 1), 1)
    Next i
    
    GenerateRandomString = result
End Function

Private Function EscapeJson(ByVal text As String) As String
    text = Replace(text, "\", "\\")
    text = Replace(text, """", "\""")
    text = Replace(text, vbCr, "\r")
    text = Replace(text, vbLf, "\n")
    text = Replace(text, vbTab, "\t")
    EscapeJson = text
End Function

Private Function Base64Decode(ByVal base64String As String) As String
    On Error GoTo ErrHandler
    
    ' Remove any whitespace
    base64String = Replace(base64String, vbCr, "")
    base64String = Replace(base64String, vbLf, "")
    base64String = Replace(base64String, " ", "")
    
    ' Use MSXML to decode
    Dim xml As Object, node As Object
    Set xml = CreateObject("MSXML2.DOMDocument")
    Set node = xml.createElement("b64")
    
    node.DataType = "bin.base64"
    node.text = base64String
    
    ' Convert to string
    Dim stream As Object
    Set stream = CreateObject("ADODB.Stream")
    stream.Type = 1 'Binary
    stream.Open
    stream.Write node.nodeTypedValue
    stream.Position = 0
    stream.Type = 2 'Text
    stream.Charset = "UTF-8"
    
    Base64Decode = stream.ReadText
    stream.Close
    
    Exit Function
ErrHandler:
    Base64Decode = ""
End Function

Private Function ExtractJsonValue(jsonString As String, fieldName As String) As String
    On Error Resume Next
    Dim pattern As String
    pattern = """" & fieldName & """\s*:\s*""([^""]*)"
    
    Dim regex As Object
    Set regex = CreateObject("VBScript.RegExp")
    regex.pattern = pattern
    regex.Global = False
    
    Dim matches As Object
    Set matches = regex.Execute(jsonString)
    
    If matches.count > 0 Then
        ExtractJsonValue = matches(0).SubMatches(0)
    Else
        ExtractJsonValue = ""
    End If
End Function

Private Function ExtractJsonObject(jsonString As String, objectName As String) As String
    On Error Resume Next
    Dim startPos As Long, endPos As Long, braceCount As Long
    
    startPos = InStr(jsonString, """" & objectName & """\s*:\s*{")
    If startPos = 0 Then
        ExtractJsonObject = ""
        Exit Function
    End If
    
    startPos = InStr(startPos, jsonString, "{")
    braceCount = 1
    endPos = startPos + 1
    
    While braceCount > 0 And endPos <= Len(jsonString)
        If Mid(jsonString, endPos, 1) = "{" Then braceCount = braceCount + 1
        If Mid(jsonString, endPos, 1) = "}" Then braceCount = braceCount - 1
        endPos = endPos + 1
    Wend
    
    If braceCount = 0 Then
        ExtractJsonObject = Mid(jsonString, startPos, endPos - startPos)
    Else
        ExtractJsonObject = ""
    End If
End Function













