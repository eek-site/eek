VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet9"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet9"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet9"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit
Private Sub Worksheet_Calculate()
    On Error Resume Next
    
    ' Monitor AI2/AJ2 for changes
    Dim ai2 As Double, aj2 As Double
    ai2 = Me.Range("AI2").value
    aj2 = Me.Range("AJ2").value
    If ai2 <> aj2 Then
        ' Capture previous count before updating the latch cell
        Dim prevCount As Long, newCount As Long
        prevCount = CLng(aj2)
        newCount = CLng(ai2)
        
        Me.Range("AJ2").value = ai2
        Call LookupAndCompare
        Call HandleStripeAndJobUpdates
        
        ' Auto-invoicing gate:
        ' Only run batch invoicing when a newly-added Job Build Notes row indicates Close Job = Yes.
        Call AutoInvoiceIfCloseJobTriggered(prevCount, newCount)
    End If
    
    ' Monitor AI5/AJ5 for changes
    Dim ai5 As Double, aj5 As Double
    ai5 = Me.Range("AI5").value
    aj5 = Me.Range("AJ5").value
    If ai5 <> aj5 Then
        Me.Range("AJ5").value = ai5
        Call UpdateCallerID5000
    End If
End Sub

Private Sub AutoInvoiceIfCloseJobTriggered(ByVal prevCount As Long, ByVal newCount As Long)
    On Error Resume Next
    
    ' White_List!AI2 is a reliable count latch:
    '   AI2 = COUNTA('Job Build Notes'!A:A) - 1   (data row count)
    '   AJ2 stores the previous value.
    '
    ' When the count increases, newly-added rows are expected to be appended.
    If newCount <= prevCount Then
        LogToRR9998 "AutoInvoiceIfCloseJobTriggered: No new rows (prev=" & prevCount & ", new=" & newCount & ")"
        Exit Sub
    End If
    
    LogToRR9998 "AutoInvoiceIfCloseJobTriggered: Checking new rows " & (prevCount + 1) & " to " & newCount
    
    Dim wsJBN As Worksheet
    Set wsJBN = ThisWorkbook.Sheets("Job Build Notes")
    If wsJBN Is Nothing Then
        LogToRR9998 "AutoInvoiceIfCloseJobTriggered: Job Build Notes sheet not found!"
        Exit Sub
    End If
    
    ' In this workbook, Job Build Notes has a header row at 1 and data starts at row 2,
    ' so data-row-count N maps to last-row index N+1.
    ' Check each newly-added row (supports multiple rows added at once).
    Dim dataRow As Long
    For dataRow = prevCount + 1 To newCount
        Dim jbnRow As Long
        jbnRow = dataRow + 1
        
        ' Close Job flag is expected in column N.
        Dim closeFlag As String
        closeFlag = LCase$(Trim$(CStr(wsJBN.Cells(jbnRow, "N").value)))
        
        LogToRR9998 "AutoInvoiceIfCloseJobTriggered: Row " & jbnRow & " Closed flag = '" & closeFlag & "'"
        
        If closeFlag = "yes" Then
            LogToRR9998 "AutoInvoiceIfCloseJobTriggered: Found Closed=Yes at row " & jbnRow & " - triggering batch invoicing"
            ' Silent: no popups during automation
            AutomateInvoicing_BatchGreenRows False
            Exit For
        End If
    Next dataRow
End Sub











