Attribute VB_Name = "UpdateCallerID5000Module"
' Attribute VB_Name = "UpdateCallerID5000Module"
' Attribute VB_Name = "UpdateCallerID5000Module"
Option Explicit

Public Sub UpdateCallerID5000()
    Const SRC_TABLE As String = "caller_id"        ' source table name
    Const DST_TABLE As String = "CallerID5000"    ' destination table name
    Const TAKE_N As Long = 4999
    
    Dim loSrc As ListObject, loDst As ListObject
    Set loSrc = GetTableByName(SRC_TABLE)
    Set loDst = GetTableByName(DST_TABLE)
    
    If loSrc Is Nothing Then Err.Raise vbObjectError + 1, , "Source table '" & SRC_TABLE & "' not found."
    If loDst Is Nothing Then Err.Raise vbObjectError + 2, , "Destination table '" & DST_TABLE & "' not found."
    
    If loSrc.DataBodyRange Is Nothing Then
        ' No rows in source; clear destination and exit
        ClearTable loDst
        SetHeaders loDst, Array("callerid5000", "TimeStamp5000", "Location5000")
        Exit Sub
    End If
    
    ' Column indexes by name (required columns)
    Dim ixCaller As Long, ixTS As Long, ixLoc As Long
    ixCaller = loSrc.ListColumns("caller_id").Index
    ixTS = loSrc.ListColumns("Time_Stamp").Index
    ixLoc = loSrc.ListColumns("Location").Index
    
    Dim totalRows As Long, takeRows As Long, startRel As Long
    totalRows = loSrc.DataBodyRange.rows.count
    takeRows = IIf(totalRows < TAKE_N, totalRows, TAKE_N)
    startRel = totalRows - takeRows + 1   ' relative row within DataBodyRange
    
    ' Build output array [takeRows x 3] from bottom slice of source
    Dim outArr() As Variant
    ReDim outArr(1 To takeRows, 1 To 3)
    
    Dim r As Long, srcRow As Long
    For r = 1 To takeRows
        srcRow = startRel + (r - 1)
        outArr(r, 1) = loSrc.DataBodyRange.Cells(srcRow, ixCaller).value
        outArr(r, 2) = loSrc.DataBodyRange.Cells(srcRow, ixTS).value
        outArr(r, 3) = loSrc.DataBodyRange.Cells(srcRow, ixLoc).value
    Next r
    
    ' Prepare destination: headers + resize table to fit exactly (headers + takeRows)
    SetHeaders loDst, Array("callerid5000", "TimeStamp5000", "Location5000")
    WriteToTable loDst, outArr
End Sub

'==== Helpers ====
Private Function GetTableByName(ByVal tableName As String) As ListObject
    Dim ws As Worksheet, lo As ListObject
    For Each ws In ThisWorkbook.Worksheets
        For Each lo In ws.ListObjects
            If StrComp(lo.name, tableName, vbTextCompare) = 0 Then
                Set GetTableByName = lo
                Exit Function
            End If
        Next lo
    Next ws
End Function

Private Sub ClearTable(ByVal lo As ListObject)
    On Error Resume Next
    If Not lo.DataBodyRange Is Nothing Then lo.DataBodyRange.Delete
    On Error GoTo 0
End Sub

Private Sub SetHeaders(ByVal lo As ListObject, ByVal headers As Variant)
    ' FIXED: Properly handle 0-based array indexing from Array() function
    Dim i As Long, headerIndex As Long
    For i = 1 To lo.ListColumns.count
        headerIndex = LBound(headers) + i - 1
        If headerIndex <= UBound(headers) Then
            lo.HeaderRowRange.Cells(1, i).value = headers(headerIndex)
        End If
    Next i
End Sub

Private Sub WriteToTable(ByVal lo As ListObject, ByRef dataArr As Variant)
    ' Clears existing rows, resizes table to fit data, and writes values under current header row
    Dim rowsN As Long, colsN As Long
    rowsN = UBound(dataArr, 1) - LBound(dataArr, 1) + 1
    colsN = UBound(dataArr, 2) - LBound(dataArr, 2) + 1
    
    ' Ensure table has exactly 3 columns
    If lo.ListColumns.count <> colsN Then
        Dim newRange As Range
        Set newRange = lo.HeaderRowRange.Resize(2, colsN) ' temporary two-row width change
        lo.Resize newRange
    End If
    
    ' Clear existing body rows
    ClearTable lo
    
    ' Resize to headers + rowsN
    Dim fullRange As Range
    Set fullRange = lo.HeaderRowRange.Resize(rowsN + 1, colsN)
    lo.Resize fullRange
    
    ' Write data under headers
    lo.HeaderRowRange.Offset(1, 0).Resize(rowsN, colsN).value = dataArr
End Sub








