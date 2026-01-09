Attribute VB_Name = "RemoveDupReceiptsModule"
' Attribute VB_Name = "RemoveDupReceiptsModule"
' Attribute VB_Name = "RemoveDupReceiptsModule"
Sub RemoveDuplicateReceiptsAndNotify()
    On Error GoTo ErrHandler
    LogToRR9998 "RemoveDuplicateReceiptsAndNotify started."

    Dim ws As Worksheet
    Dim tbl As ListObject
    Dim dataRange As Range
    Dim dupDict As Object
    Dim lastRow As Long, i As Long
    Dim key As String
    Dim colMap As Dictionary
    Dim rowData As String
    Dim removedRows As Collection
    Dim msgBody As String

    Set ws = ThisWorkbook.Sheets("Receipts_List")
    Set tbl = ws.ListObjects("Table10")
    Set dataRange = tbl.DataBodyRange
    Set dupDict = CreateObject("Scripting.Dictionary")
    Set removedRows = New Collection
    Set colMap = New Dictionary

    Dim header As Range
    For Each header In tbl.HeaderRowRange
        colMap(header.value) = header.Column - tbl.HeaderRowRange.Cells(1).Column + 1
    Next header

    Dim requiredHeaders As Variant
    requiredHeaders = Array("Receipt_Date", "Receipt_Ref", "Receipt_Supplier_Name", "Receipt_Email", "Receipt_Subject", "Receipt_Amount")

    For i = LBound(requiredHeaders) To UBound(requiredHeaders)
        If Not colMap.Exists(requiredHeaders(i)) Then
            MsgBox "Missing required column: " & requiredHeaders(i), vbCritical
            LogToRR9998 "Missing required column: " & requiredHeaders(i)
            Exit Sub
        End If
    Next i

    For i = dataRange.rows.count To 1 Step -1
        With dataRange.rows(i)
            key = Join(Array( _
                Trim(.Cells(1, colMap("Receipt_Date")).text), _
                Trim(.Cells(1, colMap("Receipt_Ref")).text), _
                Trim(.Cells(1, colMap("Receipt_Supplier_Name")).text), _
                Trim(.Cells(1, colMap("Receipt_Email")).text), _
                Trim(.Cells(1, colMap("Receipt_Subject")).text), _
                Trim(.Cells(1, colMap("Receipt_Amount")).text) _
            ), "|")

            If dupDict.Exists(key) Then
                removedRows.Add key
                .Delete
            Else
                dupDict.Add key, True
            End If
        End With
    Next i

    If removedRows.count > 0 Then
        msgBody = "Duplicate receipts were found and removed from Table10 in the 'Receipts_List' sheet. Please review the following entries:" & vbCrLf & vbCrLf

        Dim removedItem As Variant
        For Each removedItem In removedRows
            msgBody = msgBody & Replace(removedItem, "|", " | ") & vbCrLf
        Next removedItem

        ' === Send via SendViaOutbox ===
        If Not SendViaOutbox("no-reply@eek.nz", "no-reply@eek.nz", _
                             "Duplicate Receipts Detected in Table10", msgBody) Then
            MsgBox "There was an issue sending the notification email.", vbExclamation
        End If

        LogToRR9998 removedRows.count & " duplicate receipts removed and reported."
    Else
        LogToRR9998 "No duplicates found in RemoveDuplicateReceiptsAndNotify."
    End If

    MsgBox removedRows.count & " duplicate row(s) removed and reported to accounts.", vbInformation
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in RemoveDuplicateReceiptsAndNotify: " & Err.description
End Sub














