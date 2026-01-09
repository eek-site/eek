Attribute VB_Name = "SharepointModule"
' Attribute VB_Name = "SharepointModule"
' Attribute VB_Name = "SharepointModule"
Option Explicit

' Power Automate flow endpoint with SAS token
Private Const FLOW_URL As String = _
    "https://prod-50.australiasoutheast.logic.azure.com:443/workflows/209524261efe4bf584ad77cd745fc58d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=21khH6fPcAWT-BzK0J11GCOBTO0EWinYErKPqfBdaXI"

Sub AddAPINumber()
    On Error GoTo ErrHandler

    Dim ws As Worksheet
    Dim apiNbr As String

    Set ws = ThisWorkbook.Worksheets("White_List")

    ' Prompt for the new API number
    apiNbr = InputBox("Enter new API Number to add:", "Add API Number")
    If Len(Trim(apiNbr)) = 0 Then Exit Sub

    ' Write to cells BO2 and BP2
    ws.Range("BO2").value = apiNbr
    ws.Range("BP2").value = "1004"

    ' Notify SharePoint
    SendToSharePoint "add", apiNbr, "1004"
    Exit Sub

ErrHandler:
    MsgBox "Error in AddAPINumber: " & Err.description, vbExclamation
End Sub

Sub UpdateAPIExtension()
    On Error GoTo ErrHandler
    Dim ws As Worksheet
    Dim apiNbr As String
    Dim lo As ListObject
    Dim stateList As Variant, extnList As Variant
    Dim i As Long, menu As String, userChoice As Variant
    Dim apiExtn As String
    
    Set ws = ThisWorkbook.Worksheets("White_List")
    
    ' Step 1: Prompt for the new API number once
    apiNbr = InputBox("Enter the API Number to update:", "Update API Extension")
    If Len(Trim(apiNbr)) = 0 Then Exit Sub
    
    ' Step 2: Clear old contents in BO2 and BP2
    ws.Range("BO2").ClearContents
    ws.Range("BP2").ClearContents
    
    ' Step 3: Write new number to BO2
    ws.Range("BO2").value = apiNbr
    
    ' Step 4: Delete the number now in BO2
    Call DeleteAPINumber
    
    ' Step 5: Write it again to BO2 for adding
    ws.Range("BO2").value = apiNbr
    
    ' Step 6: Add the number (writes "1004" to BP2 and triggers 'add')
    Call AddAPINumber
    
    ' Step 7: Proceed with extension update
    Set lo = ws.ListObjects("API_Extn_Change_List")
    If lo Is Nothing Then
        MsgBox "Table 'API_Extn_Change_List' not found on 'White_List' worksheet.", vbCritical
        Exit Sub
    End If
    
    With lo
        stateList = .ListColumns("API_State").DataBodyRange.value
        extnList = .ListColumns("API_Set_Extn").DataBodyRange.value
    End With
    
    menu = "Choose new state for API " & apiNbr & ":" & vbCrLf
    For i = 1 To UBound(stateList, 1)
        menu = menu & i & ". " & stateList(i, 1) & vbCrLf
    Next i
    
    ' Add VIP option at the end
    menu = menu & (UBound(stateList, 1) + 1) & ". VIP Customer (1021)" & vbCrLf
    
    menu = menu & vbCrLf & "Enter number:"
    
    userChoice = Application.InputBox(menu, "Select API Extension", Type:=1)
    If userChoice = False Or userChoice < 1 Or userChoice > (UBound(stateList, 1) + 1) Then Exit Sub
    
    ' Check if VIP option was selected
    If userChoice = (UBound(stateList, 1) + 1) Then
        apiExtn = "1021"
    Else
        apiExtn = Trim(extnList(userChoice, 1))
    End If
    
    If Len(apiExtn) = 0 Then
        MsgBox "Invalid extension for selected option.", vbExclamation
        Exit Sub
    End If
    
    ws.Range("BP2").value = apiExtn
    
    SendToSharePoint "update", apiNbr, apiExtn
    
    Exit Sub
    
ErrHandler:
    MsgBox "Error in UpdateAPIExtension: " & Err.description, vbExclamation
End Sub

Sub DeleteAPINumber()
    On Error GoTo ErrHandler

    Dim ws As Worksheet
    Dim apiNbr As String

    Set ws = ThisWorkbook.Worksheets("White_List")

    apiNbr = Trim(ws.Range("BO2").value)
    If Len(apiNbr) = 0 Then
        MsgBox "No API number to delete.", vbInformation
        Exit Sub
    End If

    ' Clear cells BO2 and BP2
    ws.Range("BO2").ClearContents
    ws.Range("BP2").ClearContents

    ' Notify SharePoint
    SendToSharePoint "delete", apiNbr
    Exit Sub

ErrHandler:
    MsgBox "Error in DeleteAPINumber: " & Err.description, vbExclamation
End Sub

Sub SendToSharePoint(action As String, apiNbr As String, Optional apiExtn As String = "")
    On Error GoTo ErrHandler

    Dim http As Object
    Dim payload As String
    Dim response As String

    ' Build JSON payload
    payload = "{""action"":""" & action & """,""API_Nbr"":""" & apiNbr & """,""API_Extn"":""" & apiExtn & """}"

    ' Debug: print payload for inspection
    Debug.Print "Sending payload: "; payload

    Set http = CreateObject("MSXML2.XMLHTTP")
    With http
        .Open "POST", FLOW_URL, False
        .setRequestHeader "Content-Type", "application/json"
        .send payload
        response = .responseText
        
    End With
    Exit Sub

ErrHandler:
    MsgBox "Error in SendToSharePoint: " & Err.description, vbExclamation
End Sub














