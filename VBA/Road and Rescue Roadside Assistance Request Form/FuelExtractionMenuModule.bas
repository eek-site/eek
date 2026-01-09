Attribute VB_Name = "FuelExtractionMenuModule"
' Attribute VB_Name = "FuelExtractionMenuModule"
' Attribute VB_Name = "FuelExtractionMenuModule"
' ============================================================================
' EEK INSURANCE REPORT SYSTEM
' Fuel Extraction Menu with Web Form & Database Integration
' ============================================================================

Option Explicit

Public Function FuelExtractionMenu() As Boolean
    ' Returns True if should exit system, False if should return to main menu
    ' Main menu - called from your existing master menu system
    On Error GoTo ErrHandler
    
    ' Ensure we have a rego selected
    OpenJobRegister "FUEL"
    LaunchOutlook
    If selectedJobRego = "" Then FuelExtractionMenu = False: Exit Function
    
    Dim userInput As String
    userInput = InputBox( _
        "FUEL EXTRACTION INSURANCE MENU" & vbCrLf & vbCrLf & _
        "1. Create Insurance Folder" & vbCrLf & _
        "2. Open Web Form (collect/edit data)" & vbCrLf & _
        "3. Generate Word Report (from InsurerRecord table)" & vbCrLf & _
        "4. Send Report Email (to customer and/or insurer)" & vbCrLf & vbCrLf & _
        "Enter option (1-4), 'q' to go back, or 'qq' to exit:", _
        "Fuel Extraction Menu - EEK Mechanical")
    
    Select Case LCase$(Trim$(userInput))
        Case "qq": FuelExtractionMenu = True: Exit Function  ' Exit system
        Case "q", "": FuelExtractionMenu = False: Exit Function  ' Go back to previous menu
        Case "1": Call CreateInsuranceFolder: FuelExtractionMenu = False: Exit Function
        Case "2": Call OpenWebFormWithData: FuelExtractionMenu = False: Exit Function
        Case "3": Call GenerateWordReportFromTable: FuelExtractionMenu = False: Exit Function
        Case "4": Call SendInsuranceReport: FuelExtractionMenu = False: Exit Function
        Case Else
            MsgBox "Invalid selection. Please enter 1-4, 'q', or 'qq'.", vbExclamation, "Invalid Option"
            FuelExtractionMenu = False: Exit Function
    End Select
    
    FuelExtractionMenu = False
    Exit Function
ErrHandler:
    MsgBox "Error: " & Err.description, vbCritical, "Error"
    FuelExtractionMenu = False
End Function

' ===============================
' CREATE INSURANCE FOLDER (Manual)
' ===============================
Private Sub CreateInsuranceFolder()
    On Error GoTo ErrorHandler
    
    Dim fs As Object
    Dim rootFolder As String, insurerFolder As String, regoFolder As String
    Dim rego As String, insurerName As String
    Dim wsBookJob As Worksheet
    Dim jobRow As Long
    
    Set wsBookJob = ThisWorkbook.Sheets("Book a Job")
    
    ' Use selectedJobRego if available
    rego = ""
    On Error Resume Next
    rego = selectedJobRego
    On Error GoTo ErrorHandler
    
    If rego = "" Then
        rego = InputBox("Enter vehicle registration:", "Create Insurance Folder")
        If rego = "" Then Exit Sub
    End If
    
    ' Find job row in Book a Job
    jobRow = FindJobRow(wsBookJob, rego)
    
    ' Ask for insurance company
    insurerName = InputBox( _
        "Enter the insurance company name:" & vbCrLf & vbCrLf & _
        "Examples:" & vbCrLf & _
        "- AA Insurance" & vbCrLf & _
        "- AMI" & vbCrLf & _
        "- State Insurance" & vbCrLf & _
        "- Tower" & vbCrLf & _
        "- Vero", _
        "Insurance Company", "")
    
    If insurerName = "" Then
        MsgBox "No insurance company entered. Operation cancelled.", vbInformation
        Exit Sub
    End If
    
    Set fs = CreateObject("Scripting.FileSystemObject")
    
    ' Root folder for insurance claims
    rootFolder = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\" & _
        "Road and Rescue New Zealand - Documents\Client Insurance Claims"
    
    ' Create insurer folder if doesn't exist
    insurerFolder = rootFolder & "\" & SafeFolderName(insurerName)
    If Not fs.FolderExists(insurerFolder) Then
        fs.CreateFolder insurerFolder
    End If
    
    ' Create rego-specific folder
    regoFolder = insurerFolder & "\" & rego
    
    If fs.FolderExists(regoFolder) Then
        If MsgBox("Insurance folder already exists for " & rego & " under " & insurerName & "." & vbCrLf & _
                  "Do you want to replace it?", _
                  vbQuestion + vbYesNo, "Folder Exists") = vbNo Then Exit Sub
        fs.DeleteFolder regoFolder, True
    End If
    
    fs.CreateFolder regoFolder
    
    ' Create subfolders
    fs.CreateFolder regoFolder & "\Photos"
    fs.CreateFolder regoFolder & "\Documents"
    fs.CreateFolder regoFolder & "\Correspondence"
    fs.CreateFolder regoFolder & "\Invoices"
    
    ' Create info file
    Dim infoFile As String
    infoFile = regoFolder & "\ClaimInfo.txt"
    Dim fileNum As Integer
    fileNum = FreeFile
    
    Open infoFile For Output As #fileNum
    Print #fileNum, "Insurance Claim Information"
    Print #fileNum, "=========================="
    Print #fileNum, "Date Created: " & Format(Now, "dd/mm/yyyy hh:mm:ss")
    Print #fileNum, "Registration: " & rego
    Print #fileNum, "Insurer: " & insurerName
    Print #fileNum, "Claim Type: Fuel Extraction/Wrong Fuel"
    Print #fileNum, ""
    Print #fileNum, "Folders:"
    Print #fileNum, "- Photos: Vehicle and damage photos"
    Print #fileNum, "- Documents: Reports and assessments"
    Print #fileNum, "- Correspondence: Email and letter communications"
    Print #fileNum, "- Invoices: Service invoices and receipts"
    Close #fileNum
    
    ' Save insurer name to Book a Job column AN
    If jobRow > 0 Then
        wsBookJob.Cells(jobRow, "AN").value = insurerName
    End If
    
    MsgBox "Insurance folder created successfully:" & vbCrLf & vbCrLf & regoFolder, vbInformation
    
    Exit Sub
ErrorHandler:
    MsgBox "Error creating folder: " & Err.description, vbCritical, "Error"
End Sub

' ===============================
' OPEN WEB FORM WITH BASE64 DATA
' ===============================
Private Sub OpenWebFormWithData()
    On Error GoTo ErrorHandler
    
    Dim wsBookJob As Worksheet
    Dim wsJobNotes As Worksheet
    Dim rego As String
    Dim jobRow As Long
    Dim url As String
    Dim carjamUrl As String
    Dim base64Data As String
    
    Set wsBookJob = ThisWorkbook.Sheets("Book a Job")
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    ' Use selectedJobRego (already set by OpenJobRegister)
    rego = selectedJobRego
    
    ' Find job in Book a Job
    jobRow = FindJobRow(wsBookJob, rego)
    If jobRow = 0 Then
        MsgBox "REGO '" & rego & "' not found in Book a Job.", vbExclamation, "Not Found"
        Exit Sub
    End If
    
    ' Build JSON and encode to Base64
    base64Data = BuildBase64Data(wsBookJob, wsJobNotes, jobRow, rego)
    
    ' Build URL with single Base64 parameter
    url = "https://www.eek.nz/insurance-report-generator.html?data=" & base64Data
    
    ' Build CarJam URL
    carjamUrl = "https://www.carjam.co.nz/car/?plate=" & rego
    
    ' Open both in default browser
    CreateObject("WScript.Shell").Run url
    CreateObject("WScript.Shell").Run carjamUrl
    
    MsgBox "Web form and CarJam opened with available data from Book a Job." & vbCrLf & vbCrLf & _
           "Complete the remaining fields and submit.", vbInformation, "Forms Opened"
    
    Exit Sub
ErrorHandler:
    MsgBox "Error opening web form: " & Err.description, vbCritical, "Error"
End Sub

Private Function BuildBase64Data(wsBookJob As Worksheet, wsJobNotes As Worksheet, jobRow As Long, rego As String) As String
    Dim jsonData As String
    Dim incidentDateTime As Variant
    Dim i As Long
    Dim expenseType As String
    Dim costValue As Double
    Dim description As String
    Dim litersExtracted As String
    Dim litersExtractedNum As Double
    Dim calloutCost As Double
    Dim extractionCost As Double
    Dim laborCost As Double
    Dim fuelCost As Double
    Dim partsCosts As String
    Dim partsCostTotal As Double
    Dim totalCost As Double
    Dim hasParts As Boolean
    Dim contaminationPercent As Double
    Dim technicalFindings As String
    Dim componentsReplaced As String
    
    hasParts = False
    calloutCost = 0
    extractionCost = 0
    laborCost = 0
    fuelCost = 0
    partsCosts = ""
    partsCostTotal = 0
    totalCost = 0
    litersExtracted = ""
    litersExtractedNum = 0
    
    ' Get incident date/time
    incidentDateTime = wsBookJob.Cells(jobRow, "B").value
    
    ' Parse Job Build Notes for expense types
    For i = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "F").End(xlUp).Row
        If wsJobNotes.Cells(i, "F").value = rego Then
            expenseType = Trim(wsJobNotes.Cells(i, "E").value)
            costValue = NzD(wsJobNotes.Cells(i, "K").value)
            description = Trim(wsJobNotes.Cells(i, "J").value)
            
            Select Case expenseType
                Case "Towing"
                    calloutCost = calloutCost + costValue
                Case "Labour"
                    laborCost = laborCost + costValue
                Case "FuelDisposal"
                    extractionCost = extractionCost + costValue
                    litersExtracted = ExtractLitersFromDescription(description)
                    If IsNumeric(litersExtracted) Then
                        litersExtractedNum = CDbl(litersExtracted)
                    End If
                Case "Parts"
                    hasParts = True
                    partsCostTotal = partsCostTotal + costValue
                    If partsCosts <> "" Then partsCosts = partsCosts & "\n"
                    partsCosts = partsCosts & description & ": $" & Format(costValue / 1.15, "0.00")
                Case "FuelReplacement"
                    fuelCost = fuelCost + costValue
            End Select
            
            If wsJobNotes.Cells(i, "G").value = "Billable" Then
                totalCost = totalCost + costValue
            End If
        End If
    Next i
    
    ' Build TECHNICAL_FINDINGS
    If litersExtractedNum > 0 Then
        contaminationPercent = (litersExtractedNum / 60) * 100
        technicalFindings = "Fuel system contamination: " & Format(contaminationPercent, "0") & "% (" & _
                          litersExtracted & "L extracted from 60L tank capacity). "
        If hasParts Then
            technicalFindings = technicalFindings & "Genuine fuel filter replaced as preventative measure. "
        End If
        technicalFindings = technicalFindings & "Complete system decontamination performed. All contaminated fuel removed. " & _
                          "System flushed and tested. Vehicle returned to service in roadworthy condition."
    End If
    
    ' Build COMPONENTS_REPLACED
    If hasParts Then
        componentsReplaced = "Genuine fuel filter (OEM specification)"
    End If
    
    ' Build JSON string
    jsonData = "{"
    jsonData = jsonData & JSONPair("REGO", rego)
    jsonData = jsonData & JSONPair("REPORT_DATE", Format(Date, "yyyy-mm-dd"))
    jsonData = jsonData & JSONPair("INCIDENT_DATE", Format(incidentDateTime, "yyyy-mm-dd"))
    jsonData = jsonData & JSONPair("INCIDENT_TIME", Format(incidentDateTime, "hh:mm AM/PM"))
    jsonData = jsonData & JSONPair("CLIENT_NAME", wsBookJob.Cells(jobRow, "E").value)
    jsonData = jsonData & JSONPair("VEHICLE_MAKE", wsBookJob.Cells(jobRow, "O").value)
    jsonData = jsonData & JSONPair("VEHICLE_MODEL", wsBookJob.Cells(jobRow, "P").value)
    jsonData = jsonData & JSONPair("INCIDENT_LOCATION", wsBookJob.Cells(jobRow, "K").value)
    jsonData = jsonData & JSONPair("INSURER", wsBookJob.Cells(jobRow, "AN").value)
    jsonData = jsonData & JSONPair("FUEL_SYSTEM_TYPE", "Diesel")
    jsonData = jsonData & JSONPair("CORRECT_FUEL_TYPE", "Diesel")
    jsonData = jsonData & JSONPair("VEHICLE_CONDITION", "No problems")
    jsonData = jsonData & JSONPair("LITERS_REFUELED", "60")
    jsonData = jsonData & JSONPair("INCIDENT_DESCRIPTION", "Customer misfueled at the petrol station")
    jsonData = jsonData & JSONPair("TESTING_PROCEDURE", "Ran the vehicle for 30 minutes, no problems evident")
    jsonData = jsonData & JSONPair("INITIAL_RESPONSE", "Removed from the petrol station via tow")
    jsonData = jsonData & JSONPair("EMERGENCY_JUSTIFICATION", "To prevent further engine damage, the vehicle was uplifted and contaminated fuel removed as soon as possible")
    jsonData = jsonData & JSONPair("CONTAMINATION_IMPACT_TECHNICAL", "Petrol contamination in diesel system causes immediate lubricity failure. Diesel fuel provides essential lubrication for high-pressure fuel pump and injectors. Petrol contamination removes this lubrication, risking accelerated wear and potential seizure of fuel system components.")
    
    If litersExtracted <> "" Then jsonData = jsonData & JSONPair("LITERS_EXTRACTED", litersExtracted)
    If technicalFindings <> "" Then jsonData = jsonData & JSONPair("TECHNICAL_FINDINGS", technicalFindings)
    If componentsReplaced <> "" Then jsonData = jsonData & JSONPair("COMPONENTS_REPLACED", componentsReplaced)
    If partsCosts <> "" Then jsonData = jsonData & JSONPair("COMPONENTS_COST_BREAKDOWN", partsCosts)
    If partsCostTotal > 0 Then jsonData = jsonData & JSONPair("PARTS_COST", Format(partsCostTotal / 1.15, "0.00"))
    
    If calloutCost > 0 Then jsonData = jsonData & JSONPair("CALLOUT_COST", Format(calloutCost / 1.15, "0.00"))
    If extractionCost > 0 Then jsonData = jsonData & JSONPair("EXTRACTION_COST", Format(extractionCost / 1.15, "0.00"))
    If laborCost > 0 Then jsonData = jsonData & JSONPair("LABOR_COST", Format(laborCost / 1.15, "0.00"))
    If fuelCost > 0 Then jsonData = jsonData & JSONPair("FUEL_COST", Format(fuelCost / 1.15, "0.00"))
    
    If totalCost > 0 Then
        jsonData = jsonData & JSONPair("STOTAL", Format(totalCost / 1.15, "0.00"))
        jsonData = jsonData & JSONPair("TOTAL_COST", Format(totalCost, "0.00"), True) ' Last item, no comma
    Else
        ' Remove trailing comma
        If Right(jsonData, 1) = "," Then jsonData = Left(jsonData, Len(jsonData) - 1)
    End If
    
    jsonData = jsonData & "}"
    
    ' Encode to Base64
    BuildBase64Data = EncodeBase64(jsonData)
End Function


Private Function JSONPair(key As String, value As Variant, Optional isLast As Boolean = False) As String
    ' Escape special characters in value
    Dim escapedValue As String
    escapedValue = Replace(CStr(value), "\", "\\")
    escapedValue = Replace(escapedValue, """", "\""")
    escapedValue = Replace(escapedValue, vbCrLf, "\n")
    escapedValue = Replace(escapedValue, vbCr, "\n")
    escapedValue = Replace(escapedValue, vbLf, "\n")
    escapedValue = Replace(escapedValue, vbTab, "\t")
    
    JSONPair = """" & key & """:""" & escapedValue & """"
    If Not isLast Then JSONPair = JSONPair & ","
End Function

Private Function FindJobRow(ws As Worksheet, rego As String) As Long
    ' Find row in Book a Job (column V = REGO)
    Dim lastRow As Long
    Dim i As Long
    
    lastRow = ws.Cells(ws.rows.count, "V").End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, "V").value)) = UCase(Trim(rego)) Then
            FindJobRow = i
            Exit Function
        End If
    Next i
    
    FindJobRow = 0
End Function

Private Function ExtractLitersFromDescription(description As String) As String
    ' Extract liters from description like "Fuel Disposal Fee @ 20Ltrs x $4.31"
    Dim atPos As Integer
    Dim afterAt As String
    Dim liters As String
    Dim i As Integer
    Dim char As String
    
    ' Find "@ "
    atPos = InStr(description, "@ ")
    If atPos = 0 Then
        ExtractLitersFromDescription = ""
        Exit Function
    End If
    
    ' Get text after "@ "
    afterAt = Mid(description, atPos + 2)
    
    ' Extract numeric part
    liters = ""
    For i = 1 To Len(afterAt)
        char = Mid(afterAt, i, 1)
        If IsNumeric(char) Or char = "." Then
            liters = liters & char
        ElseIf liters <> "" Then
            ' Stop when we hit non-numeric after starting to collect numbers
            Exit For
        End If
    Next i
    
    ExtractLitersFromDescription = liters
End Function

' NzD is now NullToDouble in PublicUtilities module
Private Function NzD(ByVal v As Variant) As Double
    NzD = NullToDouble(v)
End Function

' ===============================
' GENERATE WORD REPORT FROM TABLE
' ===============================
Private Sub GenerateWordReportFromTable()
    On Error GoTo ErrorHandler
    
    If selectedJobRego = "" Then
        MsgBox "No job selected. Please run the menu again.", vbExclamation
        Exit Sub
    End If
    
    ' Get data from InsurerRecord table
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("InsurerRecord")
    
    Dim dataRow As Long
    dataRow = FindRegoRow(ws, selectedJobRego)
    
    If dataRow = 0 Then
        MsgBox "Could not find data for REGO: " & selectedJobRego, vbExclamation
        Exit Sub
    End If
    
    ' Get insurer name and other details
    Dim insurerName As String, rego As String
    Dim reportDateValue As Variant
    Dim parsedReportDate As Variant
    
    insurerName = Trim(ws.Cells(dataRow, 4).value) ' Column D = INSURER
    rego = Trim(ws.Cells(dataRow, 1).value)        ' Column A = REGO
    reportDateValue = ws.Cells(dataRow, 2).value   ' Column B = REPORT_DATE
    
    ' Parse the date - handles ISO 8601 format and standard formats
    parsedReportDate = ParseFlexibleDate(reportDateValue)
    
    Dim reportDate As String
    If IsDate(parsedReportDate) Then
        reportDate = Format(parsedReportDate, "yyyymmdd")
    Else
        reportDate = Format(Date, "yyyymmdd")
    End If
    
    ' === GENERATE INSURANCE REPORT (with financials) ===
    
    ' Get insurance template path
    Dim insuranceTemplatePath As String
    insuranceTemplatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 COMPANY DOCUMENTS\20210401_EEK_MECHANICAL_INSURANCE_REPORT.dotx")
    
    If Dir(insuranceTemplatePath) = "" Then
        MsgBox "Insurance template not found at: " & insuranceTemplatePath, vbExclamation
        Exit Sub
    End If
    
    ' Open Word insurance template
    Dim WordApp As Object, insuranceDoc As Object
    Set WordApp = CreateObject("Word.Application")
    WordApp.Visible = False
    Set insuranceDoc = WordApp.Documents.Add(Template:=insuranceTemplatePath)
    
    ' Fill insurance document
    Call FillWordDocument(insuranceDoc, ws, dataRow)
    
    ' Get job data for invoice section
    Dim wsBook As Worksheet
    Set wsBook = ThisWorkbook.Sheets("Book a Job")
    Dim insurerRow As Long
    insurerRow = dataRow
    
    Call FillInvoiceSection(insuranceDoc, ws, insurerRow)
    
    ' Create folder structure
    Dim basePath As String, fullFolderPath As String
    basePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS")
    fullFolderPath = basePath & "\" & SafeFolderName(insurerName) & "\" & rego & "\INSURANCE REPORTS"
    
    ' Create folders if they don't exist
    If Dir(basePath & "\" & SafeFolderName(insurerName), vbDirectory) = "" Then
        MkDir basePath & "\" & SafeFolderName(insurerName)
    End If
    
    If Dir(basePath & "\" & SafeFolderName(insurerName) & "\" & rego, vbDirectory) = "" Then
        MkDir basePath & "\" & SafeFolderName(insurerName) & "\" & rego
    End If
    
    If Dir(fullFolderPath, vbDirectory) = "" Then
        MkDir fullFolderPath
    End If
    
    ' Save insurance report as Word
    Dim insuranceWordFileName As String, insuranceWordPath As String
    insuranceWordFileName = rego & "_Insurance_Report_" & reportDate & ".docx"
    insuranceWordPath = fullFolderPath & "\" & insuranceWordFileName
    insuranceDoc.SaveAs2 fileName:=insuranceWordPath, FileFormat:=16 ' 16 = .docx
    
    ' Save insurance report as PDF
    Dim insurancePdfFileName As String, insurancePdfPath As String
    insurancePdfFileName = rego & "_Insurance_Report_" & reportDate & ".pdf"
    insurancePdfPath = fullFolderPath & "\" & insurancePdfFileName
    insuranceDoc.ExportAsFixedFormat OutputFileName:=insurancePdfPath, ExportFormat:=17 ' 17 = PDF
    
    insuranceDoc.Close False
    Set insuranceDoc = Nothing
    
    ' === GENERATE SUPPLIER REPORT (no financials) ===
    
    ' Get supplier template path
    Dim supplierTemplatePath As String
    supplierTemplatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 COMPANY DOCUMENTS\20210401_EEK_MECHANICAL_SUPPLIER_REPORT.dotx")
    
    If Dir(supplierTemplatePath) = "" Then
        MsgBox "Supplier template not found at: " & supplierTemplatePath, vbExclamation
        WordApp.Quit
        Set WordApp = Nothing
        Exit Sub
    End If
    
    ' Open Word supplier template
    Dim supplierDoc As Object
    Set supplierDoc = WordApp.Documents.Add(Template:=supplierTemplatePath)
    
    ' Fill supplier document (technical only)
    Call FillSupplierWordDocument(supplierDoc, ws, dataRow)
    
    ' Save supplier report as Word
    Dim supplierWordFileName As String, supplierWordPath As String
    supplierWordFileName = rego & "_Supplier_Report_" & reportDate & ".docx"
    supplierWordPath = fullFolderPath & "\" & supplierWordFileName
    supplierDoc.SaveAs2 fileName:=supplierWordPath, FileFormat:=16 ' 16 = .docx
    
    ' Save supplier report as PDF
    Dim supplierPdfFileName As String, supplierPdfPath As String
    supplierPdfFileName = rego & "_Supplier_Report_" & reportDate & ".pdf"
    supplierPdfPath = fullFolderPath & "\" & supplierPdfFileName
    supplierDoc.ExportAsFixedFormat OutputFileName:=supplierPdfPath, ExportFormat:=17 ' 17 = PDF
    
    supplierDoc.Close False
    Set supplierDoc = Nothing
    
    ' Close Word
    WordApp.Quit
    Set WordApp = Nothing
    
    ' Open folder in Explorer
    Shell "explorer.exe """ & fullFolderPath & """", vbNormalFocus
    
    MsgBox "Reports generated successfully!" & vbCrLf & vbCrLf & _
           "Insurance Report (with financials):" & vbCrLf & _
           "- " & insuranceWordFileName & vbCrLf & _
           "- " & insurancePdfFileName & vbCrLf & vbCrLf & _
           "Supplier Report (technical only):" & vbCrLf & _
           "- " & supplierWordFileName & vbCrLf & _
           "- " & supplierPdfFileName, vbInformation, "Reports Generated"
    
    LogToRR9998 "? Insurance and Supplier reports generated | Rego: " & rego & " | Path: " & fullFolderPath, "InsuranceReportLog.txt"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error generating reports: " & Err.description, vbCritical
    LogToRR9998 "? Error in GenerateWordReportFromTable: " & Err.description & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
    If Not insuranceDoc Is Nothing Then insuranceDoc.Close False
    If Not supplierDoc Is Nothing Then supplierDoc.Close False
    If Not WordApp Is Nothing Then WordApp.Quit
End Sub

Private Sub FillInvoiceSection(doc As Object, ws As Worksheet, insurerRow As Long)
    ' Get the REGO from InsurerRecord table
    Dim rego As String
    rego = ws.Cells(insurerRow, 1).value ' Column A in InsurerRecord = REGO
    
    ' Now find this REGO in Book a Job sheet to get invoice details
    Dim wsBook As Worksheet
    Set wsBook = ThisWorkbook.Sheets("Book a Job")
    
    Dim bookRow As Long
    bookRow = FindJobRow(wsBook, rego) ' Use existing function
    
    If bookRow = 0 Then
        ' No job found, leave invoice section blank
        Exit Sub
    End If
    
    ' Get invoice header data from Book a Job
    Dim COLUMN_E As String, COLUMN_B As String, XeroRef As String
    Dim COLUMN_AJ As String
    
    ' Column F = Invoice Name (for invoice document)
    ' Column E = Customer Name (for communications)
    Dim invoiceName As String
    Dim customerName As String
    invoiceName = Trim(wsBook.Cells(bookRow, "F").value)  ' Invoice Name (Column F)
    customerName = Trim(wsBook.Cells(bookRow, "E").value)  ' Customer Name (Column E)
    
    ' Use invoice name from Column F, fallback to Column E if empty
    If invoiceName = "" Then
        invoiceName = customerName  ' Fallback to customer name if invoice name is empty
        LogToRR9998 "FillInvoiceSection: WARNING - Column F is empty for rego " & rego & ", using Column E (customer name): '" & customerName & "'", "InsuranceReportLog.txt"
    Else
        LogToRR9998 "FillInvoiceSection: Rego=" & rego & " | Invoice Name (Col F)='" & invoiceName & "' | Customer Name (Col E)='" & customerName & "'", "InsuranceReportLog.txt"
    End If
    
    ' Set COLUMN_E to the invoice name (this variable name is misleading but used throughout)
    COLUMN_E = invoiceName
    
    ' Parse date - handles ISO 8601 format and standard formats
    Dim invoiceDateValue As Variant
    invoiceDateValue = ParseFlexibleDate(wsBook.Cells(bookRow, "AG").value)
    If IsDate(invoiceDateValue) Then
        COLUMN_B = Format(invoiceDateValue, "d mmm yyyy")
    Else
        COLUMN_B = Format(Date, "d mmm yyyy") ' Fallback to today
    End If
    
    XeroRef = wsBook.Cells(bookRow, "AU").value ' Invoice number
    COLUMN_AJ = wsBook.Cells(bookRow, "AJ").value ' Reference
    
    ' Get invoice line items from Job Build Notes
    Dim wsJobNotes As Worksheet
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim JOBNOTE(1 To 7) As String
    Dim q(1 To 7) As Long
    Dim u(1 To 7) As Double
    Dim a(1 To 7) As Double
    Dim STOTAL As Double, APAID As Double, AOS As Double
    Dim currentLine As Integer, jobRow As Long
    
    ' Declare these at top of sub (moved from inside loop)
    Dim expenseType As String
    Dim costVal As Double
    
    STOTAL = 0: APAID = 0: AOS = 0: currentLine = 1
    
    ' Loop through Job Build Notes
    For jobRow = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "A").End(xlUp).Row
        If wsJobNotes.Cells(jobRow, "F").value = rego Then ' Match REGO
            Select Case wsJobNotes.Cells(jobRow, "G").value
                Case "Billable"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = NzD(wsJobNotes.Cells(jobRow, "K").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        If wsJobNotes.Cells(jobRow, "M").value <> "No" Then APAID = APAID + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                    
                Case "Reimbursement"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                    
                Case "Refund"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        STOTAL = STOTAL + u(currentLine)
                        currentLine = currentLine + 1
                    End If
                    
                Case "Deposit"
                    If currentLine <= 7 Then
                        JOBNOTE(currentLine) = Replace(Replace(Replace(wsJobNotes.Cells(jobRow, "J").value, "[", ""), "]", ""), """", "")
                        q(currentLine) = 1
                        u(currentLine) = -NzD(wsJobNotes.Cells(jobRow, "I").value)
                        a(currentLine) = u(currentLine)
                        APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                        currentLine = currentLine + 1
                    Else
                        APAID = APAID + NzD(wsJobNotes.Cells(jobRow, "I").value)
                    End If
            End Select
        End If
    Next jobRow
    
    AOS = STOTAL - APAID
    
    ' Calculate status message (matching CreatePDFWithPayment exactly)
    Dim pstatus As String, formattedAOS As String
    If AOS > 0 Then
        formattedAOS = "$" & Format(AOS, "0.00")
        pstatus = "Amount Due: $" & Format(AOS, "0.00") & vbNewLine & _
                  "Settlement is required promptly in accordance with the stated terms of trade." & vbNewLine & _
                  "Payment details:" & vbNewLine & _
                  "EEK Mechanical" & vbNewLine & "06-0313-0860749-00"
    ElseIf AOS < 0 Then
        formattedAOS = "-$" & Format(Abs(AOS), "0.00")
        pstatus = "Credit Available: " & formattedAOS
    Else
        formattedAOS = "PAID"
        pstatus = "PAID" & vbNewLine & _
                  "EEK Mechanical acknowledges receipt of full payment." & vbNewLine & _
                  "Submit a review at: https://www.eek.nz/review-form"
    End If
    
    ' Build replacements dictionary for invoice
    Dim replacements As Object
    Set replacements = CreateObject("Scripting.Dictionary")

    ' Invoice header fields
    ' Replace [COLUMN F] with invoice name from Column F (Book a Job, Column F)
    replacements.Add "[COLUMN F]", COLUMN_E
    replacements.Add "[COLUMN B]", COLUMN_B
    replacements.Add "[XERO REF]", CStr(XeroRef)
    replacements.Add "[REGO]", rego
    replacements.Add "[COLUMN AJ]", COLUMN_AJ
    ' We'll do this replacement separately after all other replacements
    ' to ensure it only affects the invoice section

    ' Calculate individual cost breakdowns from line items using EXPENSE TYPE from Job Build Notes
    Dim calloutTotal As Double, extractionTotal As Double, laborTotal As Double
    Dim fuelTotal As Double, diagnosticTotal As Double, partsTotal As Double
    calloutTotal = 0: extractionTotal = 0: laborTotal = 0
    fuelTotal = 0: diagnosticTotal = 0: partsTotal = 0

    ' Loop through Job Build Notes again to get costs by expense type
    For jobRow = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "F").End(xlUp).Row
        If wsJobNotes.Cells(jobRow, "F").value = rego Then
            If wsJobNotes.Cells(jobRow, "G").value = "Billable" Then
                expenseType = Trim(wsJobNotes.Cells(jobRow, "E").value)
                costVal = NzD(wsJobNotes.Cells(jobRow, "K").value)
                
                Select Case expenseType
                    Case "Towing"
                        calloutTotal = calloutTotal + costVal
                    Case "Labour"
                        laborTotal = laborTotal + costVal
                    Case "FuelDisposal"
                        extractionTotal = extractionTotal + costVal
                    Case "Parts"
                        partsTotal = partsTotal + costVal
                    Case "FuelReplacement"
                        fuelTotal = fuelTotal + costVal
                    Case "Diagnostic"
                        diagnosticTotal = diagnosticTotal + costVal
                End Select
            End If
        End If
    Next jobRow

    ' Add cost breakdown to replacements
    replacements.Add "[CALLOUT_COST]", IIf(calloutTotal <> 0, "$" & Format(calloutTotal, "0.00"), "")
    replacements.Add "[EXTRACTION_COST]", IIf(extractionTotal <> 0, "$" & Format(extractionTotal, "0.00"), "")
    replacements.Add "[LABOR_COST]", IIf(laborTotal <> 0, "$" & Format(laborTotal, "0.00"), "")
    replacements.Add "[FUEL_COST]", IIf(fuelTotal <> 0, "$" & Format(fuelTotal, "0.00"), "")
    replacements.Add "[DIAGNOSTIC_COST]", IIf(diagnosticTotal <> 0, "$" & Format(diagnosticTotal, "0.00"), "")
    replacements.Add "[PARTS_COST]", IIf(partsTotal <> 0, "$" & Format(partsTotal, "0.00"), "")
    replacements.Add "[CONSUMABLES_COST]", ""

    ' Add totals
    replacements.Add "[STOTAL]", "$" & Format(STOTAL, "0.00")
    replacements.Add "[TOTAL_COST]", "$" & Format(STOTAL, "0.00")
    replacements.Add "[APAID]", "$" & Format(APAID, "0.00")
    replacements.Add "[AOS]", formattedAOS
    replacements.Add "[STATUS]", pstatus
    
    ' Add line items
    Dim i As Integer, lineText As String
    For i = 1 To 7
        lineText = Trim(JOBNOTE(i))
        replacements.Add "[JOBNOTE" & i & "]", lineText
        replacements.Add "[Q" & i & "]", IIf(lineText = "", "", CStr(q(i)))
        replacements.Add "[U" & i & "]", IIf(lineText = "", "", "$" & Format(u(i), "0.00"))
        replacements.Add "[A" & i & "]", IIf(lineText = "", "", "$" & Format(a(i), "0.00"))
    Next i
    
    ' Replace all invoice placeholders
    Dim searchText As String, replaceText As String
    Dim field As Variant
    Dim storyRange As Object
    Dim replacementMade As Boolean

    For Each field In replacements.keys
        searchText = field
        replaceText = replacements(field)
        replacementMade = False
        
        ' Search through ALL story ranges (main document, headers, footers, etc.)
        For Each storyRange In doc.StoryRanges
            Do
                If Len(replaceText) > 250 Then
                    ' For long text, use direct range replacement
                    Do While storyRange.Find.Execute(FindText:=searchText, MatchCase:=False, MatchWholeWord:=False)
                        storyRange.text = replaceText
                        replacementMade = True
                    Loop
                Else
                    ' For short text, use Find & Replace
                    ' First check if the text exists
                    Dim foundBefore As Boolean
                    With storyRange.Find
                        .ClearFormatting
                        .MatchWildcards = False
                        .text = searchText
                        foundBefore = .Execute(FindText:=searchText, MatchCase:=False, MatchWholeWord:=False)
                    End With
                    
                    ' Now do the replacement
                    If foundBefore Then
                        With storyRange.Find
                            .ClearFormatting
                            .Replacement.ClearFormatting
                            .MatchWildcards = False
                            .Wrap = 1
                            .text = searchText
                            .Replacement.text = replaceText
                            .Execute Replace:=2
                            replacementMade = True
                        End With
                    End If
                End If
                
                ' Move to next linked story (for headers/footers with multiple sections)
                Set storyRange = storyRange.NextStoryRange
            Loop Until storyRange Is Nothing
        Next
        
        ' Log replacement for [COLUMN F] specifically
        If searchText = "[COLUMN F]" Then
            If replacementMade Then
                LogToRR9998 "FillInvoiceSection: Successfully replaced [COLUMN F] with '" & replaceText & "'", "InsuranceReportLog.txt"
            Else
                LogToRR9998 "FillInvoiceSection: WARNING - [COLUMN F] placeholder not found in template!", "InsuranceReportLog.txt"
            End If
        End If
    Next field
End Sub


' ===============================
' HELPER FUNCTIONS
' ===============================

' ============================================================================
' DATE/TIME PARSING - Wrapper functions for backwards compatibility
' Main implementation is in PublicUtilities module
' ============================================================================

' Wrapper for PublicUtilities.ParseFlexibleDate - kept for backwards compatibility
' Use PublicUtilities.ParseFlexibleDate directly in new code
Private Function ParseFlexibleDate(ByVal dateValue As Variant) As Variant
    ParseFlexibleDate = PublicUtilities.ParseFlexibleDate(dateValue)
End Function

' Wrapper for PublicUtilities.ParseFlexibleTime - kept for backwards compatibility
' Use PublicUtilities.ParseFlexibleTime directly in new code
Private Function ParseFlexibleTime(ByVal timeValue As Variant) As String
    ParseFlexibleTime = PublicUtilities.ParseFlexibleTime(timeValue)
End Function

Private Function FindRegoRow(ws As Worksheet, rego As String) As Long
    Dim lastRow As Long
    Dim i As Long
    
    lastRow = ws.Cells(ws.rows.count, 1).End(xlUp).Row
    
    For i = 2 To lastRow
        If UCase(Trim(ws.Cells(i, 1).value)) = UCase(Trim(rego)) Then
            FindRegoRow = i
            Exit Function
        End If
    Next i
    
    FindRegoRow = 0
End Function

Private Sub FillWordDocument(doc As Object, ws As Worksheet, dataRow As Long)
    Dim fieldNames() As Variant
    Dim i As Integer
    Dim fieldValue As String
    Dim searchText As String
    Dim replaceText As String
    Dim found As Boolean
    Dim rng As Object
    
    ' Field names for insurance report (43 fields - NO invoice cost fields)
    fieldNames = Array( _
        "REGO", "REPORT_DATE", "INCIDENT_DATE", "INSURER", "CLAIM_NUMBER", "CLIENT_NAME", _
        "VEHICLE_MAKE", "VEHICLE_MODEL", "VEHICLE_YEAR", "VIN_NUMBER", "ENGINE_TYPE", _
        "FUEL_SYSTEM_TYPE", "ODOMETER", "VEHICLE_CONDITION", "INCIDENT_TIME", _
        "INCIDENT_LOCATION", "CONTAMINATION_TYPE", "LITERS_EXTRACTED", "ENGINE_START_STATUS", _
        "INCIDENT_DESCRIPTION", "CONTAMINATION_IMPACT_TECHNICAL", "FUEL_PUMP_CONDITION", _
        "FUEL_PUMP_ACTION", "FUEL_PUMP_TECHNICAL", "INJECTOR_CONDITION", "INJECTOR_ACTION", _
        "INJECTOR_TECHNICAL", "CATALYTIC_CONDITION", "CATALYTIC_ACTION", "CATALYTIC_TECHNICAL", _
        "SPARK_PLUG_CONDITION", "SPARK_PLUG_ACTION", "SPARK_PLUG_TECHNICAL", _
        "FILTER_TECHNICAL_JUSTIFICATION", "COMPONENTS_REPLACED", "TECHNICAL_FINDINGS", _
        "TESTING_PROCEDURE", "INITIAL_RESPONSE", "EMERGENCY_JUSTIFICATION", "CORRECT_FUEL_TYPE", _
        "FUEL_PRESSURE_SPEC", "ECU_CODES", "LITERS_REFUELED", "COMPONENTS_COST_BREAKDOWN" _
    )
    ' NOTE: Invoice fields (CALLOUT_COST, EXTRACTION_COST, etc.) are handled by FillInvoiceSection
    
    For i = LBound(fieldNames) To UBound(fieldNames)
        fieldValue = Trim(ws.Cells(dataRow, i + 1).value)
        searchText = "[" & fieldNames(i) & "]"
        
        ' Special formatting for specific field types
        Select Case fieldNames(i)
            Case "INCIDENT_TIME"
                ' Format time properly - handles ISO 8601, decimals, and standard formats
                replaceText = ParseFlexibleTime(ws.Cells(dataRow, i + 1).value)
                If replaceText = "" Then replaceText = fieldValue
                
            Case "INCIDENT_DATE", "REPORT_DATE"
                ' Format dates - handles ISO 8601 and standard formats
                Dim parsedDate As Variant
                parsedDate = ParseFlexibleDate(ws.Cells(dataRow, i + 1).value)
                If IsDate(parsedDate) Then
                    replaceText = Format(parsedDate, "d/m/yyyy")
                Else
                    replaceText = fieldValue
                End If
                
            Case Else
                ' No special formatting for other fields
                replaceText = fieldValue
        End Select
        
        ' Use different method based on length
        If Len(replaceText) > 250 Then
            ' For long text, use direct range replacement
            Call ReplaceLongText(doc, searchText, replaceText)
        Else
            ' For short text, use Find & Replace
            With doc.content.Find
                .ClearFormatting
                .Replacement.ClearFormatting
                .MatchWildcards = False
                .Wrap = 1
                .text = searchText
                .Replacement.text = replaceText
                .Execute Replace:=2
            End With
        End If
    Next i
End Sub

Private Sub ReplaceLongText(doc As Object, searchText As String, replaceText As String)
    ' Handle long text that exceeds Find & Replace 255 character limit
    Dim rng As Object
    Set rng = doc.content
    
    Do While rng.Find.Execute(FindText:=searchText, MatchCase:=False, MatchWholeWord:=False)
        rng.text = replaceText
        Set rng = doc.content
    Loop
End Sub

Private Function SafeFolderName(ByVal name As String) As String
    Dim result As String
    Dim i As Integer
    Dim char As String
    
    result = ""
    For i = 1 To Len(name)
        char = Mid(name, i, 1)
        
        Select Case char
            Case "A" To "Z", "a" To "z", "0" To "9", " ", "-", "_"
                result = result & char
            Case Else
                result = result & "_"
        End Select
    Next i
    
    Do While InStr(result, "  ") > 0
        result = Replace(result, "  ", " ")
    Loop
    Do While InStr(result, "__") > 0
        result = Replace(result, "__", "_")
    Loop
    
    SafeFolderName = Trim(result)
End Function

Private Function BuildURLWithBase64Data(wsBookJob As Worksheet, wsJobNotes As Worksheet, jobRow As Long, rego As String) As String
    Dim jsonData As String
    Dim base64Data As String
    
    ' Build JSON string with all data
    jsonData = BuildJSONData(wsBookJob, wsJobNotes, jobRow, rego)
    
    ' Encode to Base64
    base64Data = EncodeBase64(jsonData)
    
    ' Return URL with single parameter
    BuildURLWithBase64Data = "https://www.eek.nz/insurance-report-generator.html?data=" & base64Data
End Function

Private Function BuildJSONData(wsBookJob As Worksheet, wsJobNotes As Worksheet, jobRow As Long, rego As String) As String
    ' Build JSON manually (simple string concatenation)
    Dim json As String
    json = "{"
    json = json & """REGO"":""" & rego & ""","
    json = json & """REPORT_DATE"":""" & Format(Date, "yyyy-mm-dd") & ""","
    json = json & """CLIENT_NAME"":""" & Replace(wsBookJob.Cells(jobRow, "E").value, """", "\""") & ""","
    ' ... add all other fields ...
    json = json & "}"
    
    BuildJSONData = json
End Function

Private Function FindLatestFile(folderPath As String, pattern As String) As String
    ' Find the most recent file matching a pattern
    Dim fileName As String
    Dim latestFile As String
    Dim latestDate As Date
    Dim fileDate As Date
    Dim fs As Object
    
    Set fs = CreateObject("Scripting.FileSystemObject")
    
    latestFile = ""
    latestDate = 0
    
    If Dir(folderPath, vbDirectory) = "" Then
        FindLatestFile = ""
        Exit Function
    End If
    
    fileName = Dir(folderPath & "\" & pattern)
    Do While fileName <> ""
        fileDate = fs.GetFile(folderPath & "\" & fileName).DateLastModified
        If fileDate > latestDate Then
            latestDate = fileDate
            latestFile = fileName
        End If
        fileName = Dir()
    Loop
    
    FindLatestFile = latestFile
End Function

Private Sub SendInsuranceReport()
    On Error GoTo ErrorHandler
    
    If selectedJobRego = "" Then
        MsgBox "No job selected. Please run the menu again.", vbExclamation
        Exit Sub
    End If
    
    ' Get customer email and mobile from Book a Job
    Dim wsBook As Worksheet
    Set wsBook = ThisWorkbook.Sheets("Book a Job")
    
    Dim bookRow As Long
    bookRow = FindJobRow(wsBook, selectedJobRego)
    
    If bookRow = 0 Then
        MsgBox "Could not find job for REGO: " & selectedJobRego, vbExclamation
        Exit Sub
    End If
    
    Dim customerEmail As String, customerName As String
    Dim countryCode As String, mobileNumber As String, mobileEmail As String
    
    customerEmail = Trim(wsBook.Cells(bookRow, "D").value)
    customerName = Trim(wsBook.Cells(bookRow, "E").value)
    countryCode = Trim(wsBook.Cells(bookRow, "G").value)
    mobileNumber = Trim(wsBook.Cells(bookRow, "H").value)
    
    ' Build mobile email
    If countryCode <> "" And mobileNumber <> "" Then
        mobileNumber = Replace(mobileNumber, " ", "")
        mobileNumber = Replace(mobileNumber, "-", "")
        mobileNumber = Replace(mobileNumber, "+", "")
        If Left(countryCode, 1) <> "+" Then
            countryCode = "+" & countryCode
        End If
        mobileEmail = countryCode & mobileNumber & "@sms.tnz.co.nz"
    End If
    
    ' Get insurer info from InsurerRecord
    Dim wsInsurer As Worksheet
    Set wsInsurer = ThisWorkbook.Sheets("InsurerRecord")
    
    Dim insurerRow As Long
    insurerRow = FindRegoRow(wsInsurer, selectedJobRego)
    
    Dim insurerEmail As String, insurerContact As String, insurerName As String, claimNumber As String
    If insurerRow > 0 Then
        insurerEmail = Trim(wsInsurer.Cells(insurerRow, "BD").value)
        insurerContact = Trim(wsInsurer.Cells(insurerRow, "BC").value)
        insurerName = Trim(wsInsurer.Cells(insurerRow, "D").value)
        claimNumber = Trim(wsInsurer.Cells(insurerRow, "E").value)
    End If
    
    ' Get supplier/contractor info from Job Build Notes
    Dim wsJobNotes As Worksheet
    Set wsJobNotes = ThisWorkbook.Sheets("Job Build Notes")
    
    Dim supplierEmail As String, supplierMobile As String, mechanicName As String
    Dim supplierMobileEmail As String
    Dim i As Long
    
    ' Find the "Mechanic" line in Job Build Notes for this REGO
    For i = 2 To wsJobNotes.Cells(wsJobNotes.rows.count, "F").End(xlUp).Row
        If Trim(wsJobNotes.Cells(i, "F").value) = selectedJobRego Then
            If Trim(wsJobNotes.Cells(i, "E").value) = "Mechanic" Then
                mechanicName = Trim(wsJobNotes.Cells(i, "H").value)
                supplierEmail = Trim(wsJobNotes.Cells(i, "X").value)
                supplierMobile = Trim(wsJobNotes.Cells(i, "Y").value)
                Exit For
            End If
        End If
    Next i
    
    ' Build supplier mobile email for SMS
    If supplierMobile <> "" Then
        supplierMobile = Replace(supplierMobile, " ", "")
        supplierMobile = Replace(supplierMobile, "-", "")
        supplierMobile = Replace(supplierMobile, "+", "")
        If Left(supplierMobile, 1) <> "+" Then
            supplierMobile = "+64" & supplierMobile
        End If
        supplierMobileEmail = supplierMobile & "@sms.tnz.co.nz"
    End If
    
    ' === SEPARATE INPUT BOXES ===
    
    ' 1. Customer email
    Dim inputCustomerEmail As String
    inputCustomerEmail = InputBox( _
        "Customer Email Address:" & vbCrLf & vbCrLf & _
        "Leave blank to skip sending to customer." & vbCrLf & _
        "Click Cancel to abort entire process.", _
        "Customer Email - " & selectedJobRego, _
        customerEmail)
    
    If StrPtr(inputCustomerEmail) = 0 Then
        MsgBox "Email sending cancelled.", vbInformation
        Exit Sub
    End If
    
    inputCustomerEmail = Trim(inputCustomerEmail)
    
    ' 2. Insurer contact name
    Dim inputInsurerContact As String
    inputInsurerContact = InputBox( _
        "Insurer Contact Name:" & vbCrLf & vbCrLf & _
        "This will be used in the greeting." & vbCrLf & _
        "Leave blank for generic greeting 'Dear Claims Assessor'.", _
        "Insurer Contact - " & insurerName, _
        insurerContact)
    
    If StrPtr(inputInsurerContact) = 0 Then
        MsgBox "Email sending cancelled.", vbInformation
        Exit Sub
    End If
    
    inputInsurerContact = Trim(inputInsurerContact)
    
    ' 3. Insurer email
    Dim inputInsurerEmail As String
    inputInsurerEmail = InputBox( _
        "Insurer Email Address:" & vbCrLf & vbCrLf & _
        "Leave blank to skip sending to insurer." & vbCrLf & _
        "Click Cancel to abort entire process.", _
        "Insurer Email - " & insurerName, _
        insurerEmail)
    
    If StrPtr(inputInsurerEmail) = 0 Then
        MsgBox "Email sending cancelled.", vbInformation
        Exit Sub
    End If
    
    inputInsurerEmail = Trim(inputInsurerEmail)
    
    ' 4. Supplier/Contractor email
    Dim inputSupplierEmail As String
    inputSupplierEmail = InputBox( _
        "Supplier/Contractor Email Address:" & vbCrLf & vbCrLf & _
        "Mechanic: " & mechanicName & vbCrLf & vbCrLf & _
        "Leave blank to skip sending to supplier." & vbCrLf & _
        "Click Cancel to abort entire process.", _
        "Supplier Email - " & selectedJobRego, _
        supplierEmail)
    
    If StrPtr(inputSupplierEmail) = 0 Then
        MsgBox "Email sending cancelled.", vbInformation
        Exit Sub
    End If
    
    inputSupplierEmail = Trim(inputSupplierEmail)
    
    ' Check if at least one recipient
    If inputCustomerEmail = "" And inputInsurerEmail = "" And inputSupplierEmail = "" Then
        MsgBox "No recipients entered. Email cancelled.", vbInformation
        Exit Sub
    End If
    
    ' Update the variables
    customerEmail = inputCustomerEmail
    insurerContact = inputInsurerContact
    insurerEmail = inputInsurerEmail
    supplierEmail = inputSupplierEmail
    
    ' === SAVE INSURER DETAILS BACK TO TABLE ===
    If insurerRow > 0 Then
        wsInsurer.Cells(insurerRow, "BC").value = insurerContact
        wsInsurer.Cells(insurerRow, "BD").value = insurerEmail
        LogToRR9998 "? Updated insurer details in InsurerRecord | Contact: " & insurerContact & " | Email: " & insurerEmail & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
    End If
    
    ' Find the generated report files - USE LATEST FILE FINDER
    Dim basePath As String, fullFolderPath As String
    basePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS")
    fullFolderPath = basePath & "\" & SafeFolderName(insurerName) & "\" & selectedJobRego & "\INSURANCE REPORTS"
    
    Dim pdfPath As String, wordPath As String
    Dim latestFile As String
    
    ' Find the most recent insurance report file
    latestFile = FindLatestFile(fullFolderPath, selectedJobRego & "_Insurance_Report_*.pdf")
    If latestFile <> "" Then
        pdfPath = fullFolderPath & "\" & latestFile
    Else
        pdfPath = ""
    End If
    
    latestFile = FindLatestFile(fullFolderPath, selectedJobRego & "_Insurance_Report_*.docx")
    If latestFile <> "" Then
        wordPath = fullFolderPath & "\" & latestFile
    Else
        wordPath = ""
    End If
    
    ' Check if files exist
    If pdfPath = "" And wordPath = "" Then
        MsgBox "Report files not found. Please generate the report first (Option 3)." & vbCrLf & vbCrLf & _
               "Searched in: " & fullFolderPath, vbExclamation
        Exit Sub
    End If
    
    ' Choose which file to attach (prefer PDF)
    Dim attachmentPath As String
    If pdfPath <> "" Then
        attachmentPath = pdfPath
    Else
        attachmentPath = wordPath
    End If
    
    ' Supplier report - find most recent
    Dim supplierPdfPath As String, supplierWordPath As String
    
    latestFile = FindLatestFile(fullFolderPath, selectedJobRego & "_Supplier_Report_*.pdf")
    If latestFile <> "" Then
        supplierPdfPath = fullFolderPath & "\" & latestFile
    Else
        supplierPdfPath = ""
    End If
    
    latestFile = FindLatestFile(fullFolderPath, selectedJobRego & "_Supplier_Report_*.docx")
    If latestFile <> "" Then
        supplierWordPath = fullFolderPath & "\" & latestFile
    Else
        supplierWordPath = ""
    End If
    
    ' Compose emails
    Dim emailSubject As String
    If claimNumber <> "" Then
        emailSubject = "Insurance Claim Report - " & claimNumber & " - " & selectedJobRego & " - " & insurerName
    Else
        emailSubject = "Insurance Claim Report - " & selectedJobRego & " - " & insurerName
    End If
    
    Dim sentCount As Integer
    sentCount = 0
    
    ' === SEND TO CUSTOMER ===
    
    ' Send SMS to customer first
    If mobileEmail <> "" And customerEmail <> "" Then
        Dim smsBody As String
        smsBody = customerName & ", your insurance claim report for " & selectedJobRego & " is ready. " & _
                  "We've sent the full report to your email. " & _
                  "EEK Mechanical - www.eek.nz"
        
        If SendViaOutbox("no-reply@eek.nz", mobileEmail, emailSubject, smsBody) Then
            LogToRR9998 "? SMS notification sent to customer mobile | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        Else
            LogToRR9998 "? Failed to send SMS to customer mobile | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        End If
    End If
    
    ' Send email to customer (with attachment)
    If customerEmail <> "" Then
        Dim customerBody As String
        customerBody = "Dear " & customerName & "," & vbCrLf & vbCrLf & _
                      "Please find attached the insurance claim report for your vehicle (" & selectedJobRego & ")." & vbCrLf & vbCrLf & _
                      "This report has been prepared for submission to " & insurerName & " and contains:" & vbCrLf & _
                      "- Complete technical assessment of the fuel contamination incident" & vbCrLf & _
                      "- Detailed service procedures performed" & vbCrLf & _
                      "- Cost breakdown and justification" & vbCrLf & _
                      "- Invoice for services rendered" & vbCrLf & vbCrLf & _
                      "If you have any questions about this report or the insurance claim process, please don't hesitate to contact us." & vbCrLf & vbCrLf & _
                      "Kind regards," & vbCrLf & _
                      "EEK Mechanical Ltd" & vbCrLf & _
                      "Ph: 0800 447 153" & vbCrLf & _
                      "Web: www.eek.nz"
        
        If SendViaOutbox("no-reply@eek.nz", customerEmail, emailSubject, customerBody, attachmentPath) Then
            sentCount = sentCount + 1
            LogToRR9998 "? Insurance report sent to customer: " & customerEmail & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        Else
            LogToRR9998 "? Failed to send to customer: " & customerEmail & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        End If
    End If
    
    ' === SEND TO INSURER ===
    
    If insurerEmail <> "" Then
        Dim insurerBody As String
        Dim greeting As String
        
        If insurerContact <> "" Then
            greeting = "Dear " & insurerContact
        Else
            greeting = "Dear Claims Assessor"
        End If
        
        insurerBody = greeting & "," & vbCrLf & vbCrLf & _
                     "Please find attached a comprehensive insurance claim report for the following incident:" & vbCrLf & vbCrLf & _
                     "Vehicle Registration: " & selectedJobRego & vbCrLf & _
                     "Policy Holder: " & customerName & vbCrLf & _
                     "Incident Type: Fuel Contamination (Wrong Fuel)" & vbCrLf & _
                     "Service Provider: EEK Mechanical Ltd (NZBN: 9429053064165)" & vbCrLf & vbCrLf & _
                     "This report contains:" & vbCrLf & _
                     "- Complete vehicle identification and verification" & vbCrLf & _
                     "- Detailed incident assessment and causation analysis" & vbCrLf & _
                     "- Technical damage assessment with component analysis" & vbCrLf & _
                     "- Emergency response justification" & vbCrLf & _
                     "- Service procedures performed with NZIFDA compliance" & vbCrLf & _
                     "- Professional opinion on repair appropriateness" & vbCrLf & _
                     "- Complete financial assessment and cost breakdown" & vbCrLf & _
                     "- Tax invoice for services rendered" & vbCrLf & vbCrLf & _
                     "The report has been prepared by an NZIFDA-certified technician in accordance with established protocols for contaminated fuel system management." & vbCrLf & vbCrLf & _
                     "Should you require any additional information, supporting documentation, or clarification regarding this claim, please use our dedicated Insurer Portal:" & vbCrLf & _
                     "https://www.eek.nz/claims/insurer-portal" & vbCrLf & vbCrLf & _
                     "Yours faithfully," & vbCrLf & vbCrLf & _
                     "EEK Mechanical Ltd" & vbCrLf & _
                     "Insurance Claims Department" & vbCrLf & _
                     "Ph: 09 885 2000 (Insurance Claims Hotline)" & vbCrLf & _
                     "Email: claims@eek.nz" & vbCrLf & _
                     "Insurer Portal: www.eek.nz/claims/insurer-portal" & vbCrLf & _
                     "NZBN: 9429053064165"
        
        If SendViaOutbox("no-reply@eek.nz", insurerEmail, emailSubject, insurerBody, attachmentPath) Then
            sentCount = sentCount + 1
            LogToRR9998 "? Insurance report sent to insurer: " & insurerEmail & " (" & insurerName & ") | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        Else
            LogToRR9998 "? Failed to send to insurer: " & insurerEmail & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        End If
    End If
    
    ' === SEND TO SUPPLIER/CONTRACTOR ===
    
    ' Send SMS to supplier
    If supplierMobileEmail <> "" And supplierEmail <> "" Then
        Dim supplierSmsBody As String
        supplierSmsBody = "Technical report for " & selectedJobRego & " is ready for your review. " & _
                         "Check your email. You have 24 hours to review and request corrections. " & _
                         "EEK Mechanical - www.eek.nz"
        
        If SendViaOutbox("no-reply@eek.nz", supplierMobileEmail, emailSubject, supplierSmsBody) Then
            LogToRR9998 "? SMS notification sent to supplier mobile | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        Else
            LogToRR9998 "? Failed to send SMS to supplier mobile | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        End If
    End If
    
    ' Send email to supplier (with supplier-specific attachment - no financials)
    If supplierEmail <> "" Then
        Dim supplierBody As String
        Dim supplierGreeting As String
        Dim supplierAttachment As String
        
        ' Use supplier-specific report (no financials)
        If supplierPdfPath <> "" Then
            supplierAttachment = supplierPdfPath
        ElseIf supplierWordPath <> "" Then
            supplierAttachment = supplierWordPath
        Else
            MsgBox "Supplier report not generated. Cannot send to supplier.", vbExclamation
            GoTo SkipSupplier
        End If
        
        If mechanicName <> "" Then
            supplierGreeting = "Dear " & mechanicName
        Else
            supplierGreeting = "Dear Contractor"
        End If
        
        ' Build email body in parts
        supplierBody = supplierGreeting & "," & vbCrLf & vbCrLf
        supplierBody = supplierBody & "Please find attached the technical report for service completed on vehicle " & selectedJobRego & "." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "IMPORTANT - CONTRACTOR AGREEMENT:" & vbCrLf
        supplierBody = supplierBody & "By completing this service and receiving this report, you agree to all technical findings, "
        supplierBody = supplierBody & "assessments, and procedures documented in this report." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "You have 24 HOURS from receipt of this email to review the report and notify us of any "
        supplierBody = supplierBody & "corrections or discrepancies. After 24 hours, the report will be considered final and accepted "
        supplierBody = supplierBody & "by all parties, including yourself as the service provider." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "The report includes:" & vbCrLf
        supplierBody = supplierBody & "- Technical assessment and findings" & vbCrLf
        supplierBody = supplierBody & "- Service procedures performed" & vbCrLf
        supplierBody = supplierBody & "- Component replacement details" & vbCrLf
        supplierBody = supplierBody & "- Professional certifications and compliance" & vbCrLf & vbCrLf
        supplierBody = supplierBody & "If you identify any errors or require corrections, please reply to this email immediately." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "If we do not hear from you within 24 hours, we will proceed with submission to the insurer "
        supplierBody = supplierBody & "and consider all details confirmed and agreed upon." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "Thank you for your professional service." & vbCrLf & vbCrLf
        supplierBody = supplierBody & "Regards," & vbCrLf
        supplierBody = supplierBody & "EEK Mechanical Ltd" & vbCrLf
        supplierBody = supplierBody & "Insurance Claims Department" & vbCrLf
        supplierBody = supplierBody & "Web: www.eek.nz" & vbCrLf
        supplierBody = supplierBody & "NZBN: 9429053064165"
        
        If SendViaOutbox("no-reply@eek.nz", supplierEmail, emailSubject, supplierBody, supplierAttachment) Then
            sentCount = sentCount + 1
            LogToRR9998 "? Supplier report sent to: " & supplierEmail & " (" & mechanicName & ") | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        Else
            LogToRR9998 "? Failed to send to supplier: " & supplierEmail & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
        End If
    End If
    
SkipSupplier:
    
    ' Report results
    If sentCount > 0 Then
        MsgBox "Insurance report sent successfully to " & sentCount & " recipient(s).", vbInformation
    Else
        MsgBox "Failed to send emails. Please check the log for details.", vbExclamation
    End If
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error sending insurance report: " & Err.description, vbCritical
    LogToRR9998 "? Error in SendInsuranceReport: " & Err.description & " | Rego: " & selectedJobRego, "InsuranceReportLog.txt"
End Sub

Private Function GenerateSupplierReport(rego As String, insurerName As String, reportDate As String) As Boolean
    On Error GoTo ErrorHandler
    
    GenerateSupplierReport = False
    
    ' Get data from InsurerRecord table
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("InsurerRecord")
    
    Dim dataRow As Long
    dataRow = FindRegoRow(ws, rego)
    
    If dataRow = 0 Then
        MsgBox "Could not find data for REGO: " & rego, vbExclamation
        Exit Function
    End If
    
    ' Get template path
    Dim templatePath As String
    templatePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1001 ADMINISTRATION\TEMPLATES\20210401_EEK_MECHANICAL_SUPPLIER_REPORT.dotx")
    
    If Dir(templatePath) = "" Then
        MsgBox "Supplier template not found at: " & templatePath, vbExclamation
        Exit Function
    End If
    
    ' Open Word template
    Dim WordApp As Object, doc As Object
    Set WordApp = CreateObject("Word.Application")
    WordApp.Visible = False
    Set doc = WordApp.Documents.Add(Template:=templatePath)
    
    ' Fill document with technical data only (no financial fields)
    Call FillSupplierWordDocument(doc, ws, dataRow)
    
    ' Create folder structure if needed
    Dim basePath As String, fullFolderPath As String
    basePath = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS")
    fullFolderPath = basePath & "\" & SafeFolderName(insurerName) & "\" & rego & "\INSURANCE REPORTS"
    
    ' Create folders if they don't exist
    If Dir(basePath & "\" & SafeFolderName(insurerName), vbDirectory) = "" Then
        MkDir basePath & "\" & SafeFolderName(insurerName)
    End If
    
    If Dir(basePath & "\" & SafeFolderName(insurerName) & "\" & rego, vbDirectory) = "" Then
        MkDir basePath & "\" & SafeFolderName(insurerName) & "\" & rego
    End If
    
    If Dir(fullFolderPath, vbDirectory) = "" Then
        MkDir fullFolderPath
    End If
    
    ' Save as Word document first
    Dim wordFileName As String, wordOutputPath As String
    wordFileName = rego & "_Supplier_Report_" & reportDate & ".docx"
    wordOutputPath = fullFolderPath & "\" & wordFileName
    doc.SaveAs2 fileName:=wordOutputPath, FileFormat:=16 ' 16 = .docx
    
    ' Then save as PDF
    Dim fileName As String, outputPath As String
    fileName = rego & "_Supplier_Report_" & reportDate & ".pdf"
    outputPath = fullFolderPath & "\" & fileName
    doc.ExportAsFixedFormat OutputFileName:=outputPath, ExportFormat:=17 ' 17 = PDF
    
    doc.Close False
    WordApp.Quit
    Set doc = Nothing
    Set WordApp = Nothing
    
    GenerateSupplierReport = True
    LogToRR9998 "? Supplier report generated: " & outputPath, "InsuranceReportLog.txt"
    
    Exit Function
    
ErrorHandler:
    GenerateSupplierReport = False
    MsgBox "Error generating supplier report: " & Err.description, vbCritical
    LogToRR9998 "? Error in GenerateSupplierReport: " & Err.description & " | Rego: " & rego, "InsuranceReportLog.txt"
    If Not doc Is Nothing Then doc.Close False
    If Not WordApp Is Nothing Then WordApp.Quit
End Function

Private Sub FillSupplierWordDocument(doc As Object, ws As Worksheet, dataRow As Long)
    Dim fieldNames() As Variant
    Dim i As Integer
    Dim fieldValue As String
    Dim searchText As String
    Dim replaceText As String
    
    ' Field names for supplier report (43 technical fields - NO financial/cost/invoice fields)
    fieldNames = Array( _
        "REGO", "REPORT_DATE", "INCIDENT_DATE", "INSURER", "CLAIM_NUMBER", "CLIENT_NAME", _
        "VEHICLE_MAKE", "VEHICLE_MODEL", "VEHICLE_YEAR", "VIN_NUMBER", "ENGINE_TYPE", _
        "FUEL_SYSTEM_TYPE", "ODOMETER", "VEHICLE_CONDITION", "INCIDENT_TIME", _
        "INCIDENT_LOCATION", "CONTAMINATION_TYPE", "LITERS_EXTRACTED", "ENGINE_START_STATUS", _
        "INCIDENT_DESCRIPTION", "CONTAMINATION_IMPACT_TECHNICAL", "FUEL_PUMP_CONDITION", _
        "FUEL_PUMP_ACTION", "FUEL_PUMP_TECHNICAL", "INJECTOR_CONDITION", "INJECTOR_ACTION", _
        "INJECTOR_TECHNICAL", "CATALYTIC_CONDITION", "CATALYTIC_ACTION", "CATALYTIC_TECHNICAL", _
        "SPARK_PLUG_CONDITION", "SPARK_PLUG_ACTION", "SPARK_PLUG_TECHNICAL", _
        "FILTER_TECHNICAL_JUSTIFICATION", "COMPONENTS_REPLACED", "TECHNICAL_FINDINGS", _
        "TESTING_PROCEDURE", "INITIAL_RESPONSE", "EMERGENCY_JUSTIFICATION", "CORRECT_FUEL_TYPE", _
        "FUEL_PRESSURE_SPEC", "ECU_CODES", "LITERS_REFUELED" _
    )
    
    For i = LBound(fieldNames) To UBound(fieldNames)
        fieldValue = Trim(ws.Cells(dataRow, i + 1).value)
        searchText = "[" & fieldNames(i) & "]"
        
        ' Special formatting for specific field types
        Select Case fieldNames(i)
            Case "INCIDENT_TIME"
                ' Format time properly - handles ISO 8601, decimals, and standard formats
                replaceText = ParseFlexibleTime(ws.Cells(dataRow, i + 1).value)
                If replaceText = "" Then replaceText = fieldValue
                
            Case "INCIDENT_DATE", "REPORT_DATE"
                ' Format dates - handles ISO 8601 and standard formats
                Dim parsedSupplierDate As Variant
                parsedSupplierDate = ParseFlexibleDate(ws.Cells(dataRow, i + 1).value)
                If IsDate(parsedSupplierDate) Then
                    replaceText = Format(parsedSupplierDate, "d/m/yyyy")
                Else
                    replaceText = fieldValue
                End If
                
            Case Else
                replaceText = fieldValue
        End Select
        
        ' Use different method based on length
        If Len(replaceText) > 250 Then
            Call ReplaceLongText(doc, searchText, replaceText)
        Else
            With doc.content.Find
                .ClearFormatting
                .Replacement.ClearFormatting
                .MatchWildcards = False
                .Wrap = 1
                .text = searchText
                .Replacement.text = replaceText
                .Execute Replace:=2
            End With
        End If
    Next i
End Sub












