VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet4"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet4"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet4"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit
Private Sub Worksheet_Calculate()
    On Error Resume Next
    Dim ap2 As Double, aq2 As Double
    ap2 = Me.Range("ap2").value
    aq2 = Me.Range("aq2").value
    If ap2 <> aq2 Then
        Me.Range("aq2").value = ap2
        Call CheckBlockedCallerAndNotify
    End If
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)
    ' Auto-trigger notifications when Power Automate adds a release payment row
    ' Detects: Type="Deposit", Job Notes contains "Release Payment", Close="Yes", Text Flag is empty
    On Error Resume Next
    
    ' Only check if we're adding rows (column A has new data)
    If Target.Column > 14 Then Exit Sub  ' Only care about main data columns
    If Target.rows.count > 10 Then Exit Sub  ' Don't trigger on bulk operations
    
    Dim changedRow As Long
    changedRow = Target.Row
    
    ' Skip header row
    If changedRow < 2 Then Exit Sub
    
    ' Check if this looks like a release payment row that needs processing
    Dim cellType As String, cellNotes As String, cellClose As String, cellFlag As String
    cellType = Trim(Me.Cells(changedRow, "G").value)       ' Type column
    cellNotes = Trim(Me.Cells(changedRow, "J").value)      ' Job Notes column
    cellClose = Trim(Me.Cells(changedRow, "N").value)      ' Close and Post column
    cellFlag = Trim(Me.Cells(changedRow, "AD").value)      ' Text Flag column
    
    ' Check if this is a release payment that needs notification
    ' Use case-insensitive comparisons to handle variations from Power Automate
    If UCase(cellType) = "DEPOSIT" And _
       InStr(1, cellNotes, "Release Payment", vbTextCompare) > 0 And _
       UCase(cellClose) = "YES" And _
       cellFlag = "" Then
        
        ' Log for debugging
        On Error Resume Next
        LogToRR9998 "Sheet4 Worksheet_Change: Detected release payment row " & changedRow & " - scheduling ProcessNewReleasePayments"
        On Error GoTo 0
        
        ' Delay slightly to ensure row is fully written
        Application.OnTime Now + timeValue("00:00:03"), "ProcessNewReleasePayments"
    End If
End Sub

Private Sub Worksheet_BeforeDoubleClick(ByVal Target As Range, Cancel As Boolean)
    Const COL_F As Long = 6        ' sheet column F
    Dim lo As ListObject
    Dim fld As Long
    Dim headerRow As Long

    ' Only respond to double-clicks in column F
    If Target.Column <> COL_F Then Exit Sub

    On Error GoTo exitHandler
    Cancel = True

    ' Bind to the exact table
    Set lo = Me.ListObjects("job_build")

    headerRow = lo.HeaderRowRange.Row

    ' Double-click on header cell = clear filters
    If Target.Row = headerRow Then
        If lo.AutoFilter.FilterMode Then lo.AutoFilter.ShowAllData
        GoTo exitHandler
    End If

    ' Compute field index inside table
    fld = Target.Column - lo.Range.Columns(1).Column + 1

    If fld >= 1 And fld <= lo.Range.Columns.count Then
        lo.Range.AutoFilter field:=fld, Criteria1:=CStr(Target.value)
    End If

exitHandler:
End Sub













