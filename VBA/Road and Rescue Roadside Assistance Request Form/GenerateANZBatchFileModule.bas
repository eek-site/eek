Attribute VB_Name = "GenerateANZBatchFileModule"
' Attribute VB_Name = "GenerateANZBatchFileModule"
' Attribute VB_Name = "GenerateANZBatchFileModule"
Sub GenerateANZBatchFile()
    ' Call the sub that lets the user select a Job Rego.
    Call OpenJobRegister
    
    ' Ensure a job was selected.
    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected."
        LogToRR9998 "Error: No Job Rego selected.", "MasterLog.txt"
        Exit Sub
    End If
    
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Job Build Notes") ' Adjusted to correct sheet
    
    ' Retrieve the stored registration
    Dim rego As String
    On Error Resume Next
    rego = ThisWorkbook.names("CurrentRego").RefersTo
    On Error GoTo 0
    
    ' Clean up the named range formula string
    rego = Replace(rego, "=", "")
    rego = Replace(rego, """", "")
    
    If rego = "" Then
        MsgBox "No registration found. Returning to main menu.", vbExclamation, "Error"
        LogToRR9998 "Error: No registration found for " & selectedJobRego, "MasterLog.txt"
        Exit Sub
    End If
    
    ' Find matches in column F (Job Build Notes)
    Dim lastRow As Long, i As Long, matchCount As Long
    lastRow = ws.Cells(ws.rows.count, 6).End(xlUp).Row
    
    Dim rowIndices() As Long
    Dim supplierList As String
    matchCount = 0
    
    For i = 2 To lastRow ' Assuming headers in row 1
        If LCase(ws.Cells(i, 6).value) = LCase(rego) Then
            matchCount = matchCount + 1
            ReDim Preserve rowIndices(1 To matchCount)
            rowIndices(matchCount) = i
        End If
    Next i
    
    If matchCount = 0 Then
        MsgBox "No job found for the entered registration. Returning to main menu.", vbExclamation, "No Match"
        LogToRR9998 "Error: No match found for registration " & rego, "MasterLog.txt"
        Exit Sub
    End If
    
    ' Build a numbered list of matching suppliers
    supplierList = ""
    For i = 1 To matchCount
        supplierList = supplierList & i & ". " & ws.Cells(rowIndices(i), 8).value & vbCrLf
    Next i
    
    ' Prompt user to select supplier
    Dim selectedIndex As Variant
    selectedIndex = Application.InputBox( _
        prompt:="Select the supplier by number (1 to " & matchCount & "):" & vbCrLf & supplierList, _
        title:="Select Supplier", _
        Type:=1)
    
    If VarType(selectedIndex) = vbBoolean Then Exit Sub
    If Not IsNumeric(selectedIndex) Or selectedIndex < 1 Or selectedIndex > matchCount Then
        MsgBox "Invalid selection. Returning to main menu.", vbExclamation, "Error"
        LogToRR9998 "Error: Invalid supplier selection. Exiting process.", "MasterLog.txt"
        Exit Sub
    End If
    
    ' Retrieve the row index for the chosen supplier
    Dim rowIndex As Long
    rowIndex = rowIndices(selectedIndex)
    
    ' Retrieve required values
    Dim amount As String, bankAccount As String, ref As String
    Dim particulars As String, code As String
    amount = ws.Cells(rowIndex, 19).value ' Column S
    bankAccount = ws.Cells(rowIndex, 18).value ' Column R
    supplierName = ws.Cells(rowIndex, 17).value ' Column Q
    ref = ws.Cells(rowIndex, 22).value ' Column V
    particulars = ws.Cells(rowIndex, 20).value ' Column T
    code = ws.Cells(rowIndex, 21).value ' Column U
    
    ' Truncate the bank reference fields (ref, particulars, code) to under 12 characters if needed
    If Len(ref) > 12 Then ref = Left(ref, 12)
    If Len(particulars) > 12 Then particulars = Left(particulars, 12)
    If Len(code) > 12 Then code = Left(code, 12)
    
    ' Construct the batch file line format with all fields
    Dim batchLine As String
    batchLine = amount & "," & bankAccount & "," & supplierName & "," & ref & "," & particulars & "," & code & _
                "," & ref & "," & particulars & "," & code
    
    ' Define file path using centralized file path function (inside "9998 LOGS\BatchFiles")
Dim filePath As String
filePath = GetRRFilePath("9998 LOGS\BatchFiles\" & rego & "_" & supplierName & ".DLO", True)
    
    ' Create and write to the file
    Dim fileNum As Integer
    fileNum = FreeFile
    Open filePath For Output As fileNum
    Print #fileNum, batchLine
    Close fileNum
    
    ' Update column AJ with "Yes"
    ws.Cells(rowIndex, 36).value = "Yes" ' Column AJ
    
    ' Log the successful batch file creation
    LogToRR9998 "Batch file created successfully for " & supplierName & " (" & rego & "). File path: " & filePath, "MasterLog.txt"
    
    MsgBox "Batch file created successfully: " & filePath, vbInformation, "Success"
End Sub














