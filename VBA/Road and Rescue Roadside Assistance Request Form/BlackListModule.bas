Attribute VB_Name = "BlackListModule"
' Attribute VB_Name = "BlackListModule"
' Attribute VB_Name = "BlackListModule"
Sub AddToBlacklist()
    On Error GoTo ErrHandler

    Dim apiNbr As String
    apiNbr = InputBox("Enter the number to blacklist:")

    If Trim(apiNbr) = "" Then
        MsgBox "No number entered. Operation cancelled.", vbExclamation
        Exit Sub
    End If

    ' Call SharePoint to add blacklist entry
    Call SendToSharePoint("delete", apiNbr)
    Call SendToSharePoint("add", apiNbr, "1010")

    ' Add the number to the local Black_List table (1 column only)
    Dim ws As Worksheet
    Dim tbl As ListObject
    Dim newRow As ListRow

    Set ws = ThisWorkbook.Sheets("White_List")
    Set tbl = ws.ListObjects("Black_List")

    Set newRow = tbl.ListRows.Add
    newRow.Range(1, 1).value = apiNbr

    MsgBox "Number '" & apiNbr & "' has been added to the Black_List table and sent to SharePoint.", vbInformation
    Exit Sub

ErrHandler:
    MsgBox "Error in AddToBlacklist: " & Err.description, vbExclamation
End Sub









