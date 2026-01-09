Attribute VB_Name = "UpdatePaymentInvoice"
' Attribute VB_Name = "UpdatePaymentInvoice"
' Attribute VB_Name = "UpdatePaymentInvoice"
Sub CompareInvoiceWithTransactions()
    On Error GoTo ErrorHandler
    Dim wsInvoice As Worksheet, wsTransaction As Worksheet
    Dim lastRowInvoice As Long, lastRowTransaction As Long
    Dim i As Long, j As Long
    Dim matchFound As Boolean
    Dim hyperlinkAddress As String
    Dim invValue As Variant, transValue As Variant
    Dim numInvValue As Double, numTransValue As Double
    
    ' Define worksheets
    Set wsInvoice = ThisWorkbook.Sheets("Invoice_List")
    Set wsTransaction = ThisWorkbook.Sheets("Transaction_Record")
    
    ' Find last rows in both sheets
    lastRowInvoice = wsInvoice.Cells(wsInvoice.rows.count, "B").End(xlUp).Row
    lastRowTransaction = wsTransaction.Cells(wsTransaction.rows.count, "B").End(xlUp).Row
    
    ' Loop through Invoice List from bottom up
    For i = lastRowInvoice To 2 Step -1
        matchFound = False
        
        ' Ensure Invoice C is valid
        On Error Resume Next ' Prevent crash on error
        invValue = wsInvoice.Cells(i, 3).value
        If IsError(invValue) Or IsEmpty(invValue) Then GoTo NextIteration
        invValue = Trim(LCase(invValue))
        On Error GoTo 0 ' Resume normal error handling
        
        ' Direct match: Compare Invoice C with Transaction B, C, D, E
        For j = 2 To lastRowTransaction
            On Error Resume Next
            transValue = wsTransaction.Cells(j, 2).value
            If Not IsError(transValue) And Not IsEmpty(transValue) Then
                transValue = Trim(LCase(transValue))
                If InStr(1, transValue, invValue, vbTextCompare) > 0 Then matchFound = True
            End If
            
            transValue = wsTransaction.Cells(j, 3).value
            If Not IsError(transValue) And Not IsEmpty(transValue) Then
                If InStr(1, Trim(LCase(transValue)), invValue, vbTextCompare) > 0 Then matchFound = True
            End If
            
            transValue = wsTransaction.Cells(j, 4).value
            If Not IsError(transValue) And Not IsEmpty(transValue) Then
                If InStr(1, Trim(LCase(transValue)), invValue, vbTextCompare) > 0 Then matchFound = True
            End If
            
            transValue = wsTransaction.Cells(j, 5).value
            If Not IsError(transValue) And Not IsEmpty(transValue) Then
                If InStr(1, Trim(LCase(transValue)), invValue, vbTextCompare) > 0 Then matchFound = True
            End If
            On Error GoTo 0
            
            If matchFound Then
                ' Update Invoice G with Transaction A (Date)
                wsInvoice.Cells(i, 7).value = wsTransaction.Cells(j, 1).value
                ' Update Invoice H with Transaction F (Amount)
                wsInvoice.Cells(i, 8).value = wsTransaction.Cells(j, 6).value
                Exit For
            End If
        Next j
        
        ' If no direct match, try Wide Match
        If Not matchFound Then
            For j = 2 To lastRowTransaction
                On Error Resume Next
                numInvValue = CDbl(wsInvoice.Cells(i, 5).value)
                numTransValue = CDbl(wsTransaction.Cells(j, 6).value)
                If Err.Number <> 0 Then GoTo SkipMatch ' Skip if conversion fails
                
                If numInvValue = numTransValue Then ' Match amount
                    If Not IsError(wsInvoice.Cells(i, 2).value) And Not IsError(wsTransaction.Cells(j, 1).value) Then
                        If IsNumeric(wsInvoice.Cells(i, 2).value) And IsNumeric(wsTransaction.Cells(j, 1).value) Then
                            If Abs(wsInvoice.Cells(i, 2).value - wsTransaction.Cells(j, 1).value) <= 7 Then ' Date within 7 days
                                
                                ' Label as "Wide Match" in J
                                wsInvoice.Cells(i, 10).value = "Wide Match"
                                 
                                ' Create Hyperlink to the matching transaction row
                                hyperlinkAddress = "#'Transaction_Record'!A" & j
                                wsInvoice.Hyperlinks.Add Anchor:=wsInvoice.Cells(i, 10), address:="", SubAddress:=hyperlinkAddress, TextToDisplay:="Wide Match"
                                
                                ' Highlight row in yellow
                                wsInvoice.rows(i).Interior.Color = RGB(255, 255, 0)
                                
                                Exit For
                            End If
                        End If
                    End If
                End If
SkipMatch:
                Err.Clear
                On Error GoTo 0
            Next j
        End If
        
NextIteration:
    Next i
    
    MsgBox "Comparison complete!", vbInformation
    Exit Sub

ErrorHandler:
    ' Log the error to the log file
    LogToRR9998 "Error in CompareInvoiceWithTransactions: " & Err.description
End Sub










