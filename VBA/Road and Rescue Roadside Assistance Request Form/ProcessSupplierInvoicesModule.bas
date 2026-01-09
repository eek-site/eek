Attribute VB_Name = "ProcessSupplierInvoicesModule"
' Attribute VB_Name = "ProcessSupplierInvoicesModule"
' Attribute VB_Name = "ProcessSupplierInvoicesModule"
Sub ProcessSupplierInvoices()
    On Error GoTo ErrHandler
    LogToRR9998 "ProcessSupplierInvoices started."

    Dim OutApp As Object
    Dim OutNS As Object
    Dim UploadFolder As Object
    Dim ArchiveFolder As Object
    Dim MailItem As Object
    Dim Attach As Object
    Dim ws As Worksheet
    Dim tbl As ListObject
    Dim dataRange As Range
    Dim lastRow As Long, i As Long

    Dim subjectDict As Object
    Dim rowColl As Collection
    Dim colMap As Object
    Dim statusCol As Long
    Dim subKey As String
    Dim rowIndex As Long

    Set OutApp = CreateObject("Outlook.Application")
    Set OutNS = OutApp.GetNamespace("MAPI")
    Set UploadFolder = OutNS.Folders("no-reply@eek.nz").Folders("Upload Ready")
    Set ArchiveFolder = OutNS.Folders("no-reply@eek.nz").Folders("Archive")

    Set ws = ThisWorkbook.Sheets("Receipts_List")
    Set tbl = ws.ListObjects("Table10")
    Set dataRange = tbl.DataBodyRange

    Set subjectDict = CreateObject("Scripting.Dictionary")
    Set colMap = CreateObject("Scripting.Dictionary")

    Dim header As Range
    For Each header In tbl.HeaderRowRange
        colMap(header.value) = header.Column - tbl.HeaderRowRange.Cells(1).Column + 1
    Next header

    Dim requiredHeaders As Variant
    requiredHeaders = Array("Receipt_Email", "Receipt_Subject", "Receipt_Ref", "Receipt_Status")

    Dim h As Variant
    For Each h In requiredHeaders
        If Not colMap.Exists(h) Then
            MsgBox "Missing required column: " & h, vbCritical
            LogToRR9998 "Missing required column: " & h
            Exit Sub
        End If
    Next h

    statusCol = colMap("Receipt_Status")

    For rowIndex = 1 To dataRange.rows.count
        If Trim(dataRange.Cells(rowIndex, statusCol).value) = "" Then
            subKey = Trim(dataRange.Cells(rowIndex, colMap("Receipt_Subject")).value)
            If Not subjectDict.Exists(subKey) Then
                Set rowColl = New Collection
                rowColl.Add rowIndex
                subjectDict.Add subKey, rowColl
            Else
                subjectDict(subKey).Add rowIndex
            End If
        End If
    Next rowIndex

    If subjectDict.count > 0 Then
        Dim foundRow As Long
        Dim rowNum As Variant

        For Each MailItem In UploadFolder.items
            If MailItem.Attachments.count = 0 Then GoTo NextMail

            subKey = Trim(MailItem.Subject)
            If subjectDict.Exists(subKey) Then
                Set rowColl = subjectDict(subKey)
                foundRow = 0

                If rowColl.count = 1 Then
                    foundRow = rowColl(1)
                Else
                    For Each rowNum In rowColl
                        If LCase(Trim(dataRange.Cells(rowNum, colMap("Receipt_Email")).value)) = _
                           LCase(Trim(MailItem.SenderEmailAddress)) Then
                            foundRow = rowNum
                            Exit For
                        End If
                    Next rowNum
                End If

                If foundRow = 0 Then GoTo NextMail

                Dim receiptRef As String
                receiptRef = Trim(dataRange.Cells(foundRow, colMap("Receipt_Ref")).value)

                Dim filePath As String
                For Each Attach In MailItem.Attachments
                    If LCase(Right(Attach.fileName, 4)) = ".pdf" Then
                        filePath = Environ("USERPROFILE") & _
                                   "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents\" & _
                                   "1000 ACCOUNTING AND LEGAL\Eek Mechanical Ltd\1010 SUPPLIERS\SUPPLIER INVOICE RECORD\" & _
                                   receiptRef & ".pdf"

                        Attach.SaveAsFile filePath

                        ' === Send via SendViaOutbox ===
                        Call SendViaOutbox( _
                            "no-reply@eek.nz", _
                            dataRange.Cells(foundRow, colMap("Receipt_Email")).value, _
                            "Supplier Receipt Acknowledged – " & receiptRef, _
                            "Thanks, we've logged your supplier invoice." & vbCrLf & vbCrLf & _
                            "Subject: " & subKey & vbCrLf & _
                            "Ref: " & receiptRef & vbCrLf, _
                            filePath _
                        )

                        dataRange.Cells(foundRow, statusCol).value = "File Saved"
                        Exit For
                    End If
                Next Attach

                MailItem.Move ArchiveFolder
            End If
NextMail:
        Next MailItem
    End If

    MsgBox "Processing complete. Files saved and emails archived.", vbInformation
    LogToRR9998 "ProcessSupplierInvoices completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in ProcessSupplierInvoices: " & Err.description
End Sub














