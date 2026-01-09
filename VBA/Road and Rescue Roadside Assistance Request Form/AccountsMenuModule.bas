Attribute VB_Name = "AccountsMenuModule"
' Attribute VB_Name = "AccountsMenuModule"
' Attribute VB_Name = "AccountsMenuModule"
Sub AccountsMenu()
    Dim userInput As String
    Dim exitRoutine As Boolean
    Dim invoicePath As String

    LogToRR9998 "Accounts menu launched by user: " & Environ("Username"), "AccountsMenuLog.txt"

    ' Always run data sanitisation first
    Call SanitiseData

    invoicePath = FixInvoiceFolderName()
    If invoicePath = "" Then
        LogToRR9998 "Invoice folder not found for user: " & Environ("Username"), "AccountsMenuLog.txt"
        Exit Sub
    End If

    Do Until exitRoutine
        userInput = InputBox( _
            "ACCOUNTS MENU" & vbCrLf & vbCrLf & _
            "0. Sanitise Data" & vbCrLf & _
            "1. Update Banking" & vbCrLf & _
            "2. Update Invoicing" & vbCrLf & _
            "3. Update Receipts" & vbCrLf & _
            "4. Process Supplier Invoices" & vbCrLf & _
            "5. Fast Check Transaction Records" & vbCrLf & _
            "6. Auto Blacklist From Matches" & vbCrLf & _
            "7. Buyer Created Invoice (BCI)" & vbCrLf & vbCrLf & _
            "Enter option (0-7), 'q' to go back, or 'qq' to exit:", _
            "Accounts Menu")

        Select Case LCase(Trim(userInput))
            Case "qq": exitRoutine = True: Exit Sub
            Case "q", "": exitRoutine = True: Exit Sub  ' Go back (exit this menu)
            Case "0": Call SanitiseData
            Case "1": Call UpdateBanking
            Case "2": Call CheckInvoices
            Case "3": Call CheckReceipts
            Case "4": Call ProcessSupplierInvoices
            Case "5": Call FastCheckTransactionRecords
            Case "6": Call AutoBlacklistFromMatches
            Case "7": Call ShowBCIMenu
            Case Else
                MsgBox "Invalid selection. Please enter a valid option."
        End Select
    Loop
End Sub
Function FixInvoiceFolderName() As String
    Dim baseFolder As String
    Dim fs As Object
    Dim folder As Object
    Dim subfolder As Object
    Dim originalName As String
    Dim cleanName As String
    Dim correctedPath As String
    
    baseFolder = GetRRFilePath("1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1005 CLIENTS\INVOICE RECORD\", True)
    Set fs = CreateObject("Scripting.FileSystemObject")

    If Not fs.FolderExists(baseFolder) Then
        LogToRR9998 "FixInvoiceFolderName base folder not found: " & baseFolder, "AccountsMenuLog.txt"
        MsgBox "Base folder not found: " & baseFolder, vbCritical
        FixInvoiceFolderName = ""
        Exit Function
    End If

    Set folder = fs.GetFolder(baseFolder)

    For Each subfolder In folder.SubFolders
        originalName = subfolder.name

        If UCase(Left(originalName, 7)) = "INVOICE" Then
            cleanName = Replace(originalName, Chr(160), Chr(32))

            If cleanName <> originalName Then
                Name subfolder.path As folder.path & "\" & cleanName
                correctedPath = folder.path & "\" & cleanName & "\"
                LogToRR9998 "Renamed invoice folder from [" & originalName & "] to [" & cleanName & "]", "AccountsMenuLog.txt"
            Else
                correctedPath = subfolder.path & "\"
            End If

            FixInvoiceFolderName = correctedPath
            Exit Function
        End If
    Next

    MsgBox "No folder starting with 'INVOICE' found in: " & baseFolder, vbExclamation
    LogToRR9998 "Invoice folder not found in: " & baseFolder, "AccountsMenuLog.txt"
    FixInvoiceFolderName = ""
End Function
Sub SanitiseData()
    Dim ws As Worksheet
    Dim r As Long, c As Long
    Dim lastRow As Long, LastCol As Long
    Dim val As Variant
    Dim sheetErrors As Long, totalErrors As Long
    Dim msg As String

    msg = "Sanitisation complete:" & vbCrLf & vbCrLf

    For Each ws In ThisWorkbook.Worksheets
        sheetErrors = 0
        lastRow = ws.Cells(ws.rows.count, 1).End(xlUp).Row
        LastCol = ws.Cells(1, ws.Columns.count).End(xlToLeft).Column

        For r = 2 To lastRow
            For c = 1 To LastCol
                On Error Resume Next
                val = ws.Cells(r, c).value
                If Err.Number <> 0 Then
                    ws.Cells(r, c).value = ""
                    sheetErrors = sheetErrors + 1
                    Err.Clear
                End If
                On Error GoTo 0
            Next c
        Next r

        If sheetErrors > 0 Then
            msg = msg & ws.name & ": " & sheetErrors & " error(s) cleared" & vbCrLf
            LogToRR9998 "Sanitised " & sheetErrors & " cells in sheet: " & ws.name, "SanitiseLog.txt"
            totalErrors = totalErrors + sheetErrors
        End If
    Next ws

    If totalErrors = 0 Then
        MsgBox "No errors found in workbook.", vbInformation
    Else
        MsgBox msg & vbCrLf & "Total errors cleared: " & totalErrors, vbInformation
    End If
End Sub

Sub Unhide_All_Sheets()
    Dim ws As Worksheet
    On Error Resume Next
    For Each ws In ThisWorkbook.Sheets
        ws.Visible = xlSheetVisible
    Next ws
    On Error GoTo 0
    MsgBox "All sheets are now visible.", vbInformation
End Sub

Function KeepOnlyLettersAndNumbers(txt)
    On Error GoTo fallback
    Dim regex
    Set regex = CreateObject("VBScript.RegExp")
    With regex
        .Global = True
        .IgnoreCase = True
        .pattern = "[^A-Z0-9]" ' Remove anything that's NOT A-Z or 0-9
    End With
    KeepOnlyLettersAndNumbers = UCase(regex.Replace(txt, ""))
    Exit Function
fallback:
    KeepOnlyLettersAndNumbers = ""
End Function













