Attribute VB_Name = "JobBuildModule"
' Attribute VB_Name = "JobBuildModule"
' Attribute VB_Name = "JobBuildModule"
Private Declare PtrSafe Function OpenClipboard Lib "user32" (ByVal hwnd As LongPtr) As Long
Private Declare PtrSafe Function EmptyClipboard Lib "user32" () As Long
Private Declare PtrSafe Function CloseClipboard Lib "user32" () As Long
Private Declare PtrSafe Function SetClipboardData Lib "user32" (ByVal uFormat As Long, ByVal hMem As LongPtr) As Long
Private Declare PtrSafe Function GlobalAlloc Lib "kernel32" (ByVal uFlags As Long, ByVal dwBytes As Long) As LongPtr
Private Declare PtrSafe Function GlobalLock Lib "kernel32" (ByVal hMem As LongPtr) As LongPtr
Private Declare PtrSafe Function GlobalUnlock Lib "kernel32" (ByVal hMem As LongPtr) As Long
Private Declare PtrSafe Sub RtlMoveMemory Lib "kernel32" (ByVal dest As LongPtr, ByVal src As String, ByVal cb As Long)

Const CF_TEXT As Long = 1
Const GMEM_MOVEABLE As Long = &H2

Sub CopyToClipboard(text As String)
    On Error GoTo ErrHandler
    LogToRR9998 "CopyToClipboard started."

    Dim hMem As LongPtr, pMem As LongPtr

    hMem = GlobalAlloc(GMEM_MOVEABLE, Len(text) + 1)
    If hMem = 0 Then Exit Sub

    pMem = GlobalLock(hMem)
    If pMem <> 0 Then
        RtlMoveMemory pMem, text, Len(text)
        GlobalUnlock hMem
    End If

    If OpenClipboard(0) <> 0 Then
        EmptyClipboard
        SetClipboardData CF_TEXT, hMem
        CloseClipboard
    End If

    LogToRR9998 "CopyToClipboard completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CopyToClipboard: " & Err.description
End Sub

Sub JobBuild()
    On Error GoTo ErrHandler
    LogToRR9998 "JobBuild started."

    Call OpenJobRegister

    If selectedJobRego = "" Then
        MsgBox "No Job Rego selected.", vbExclamation, "Job Build"
        LogToRR9998 "No Job Rego selected. Exiting JobBuild."
        Exit Sub
    End If

    ' Ensure selectedJobRego is passed as a string
    CopyToClipboard CStr(selectedJobRego)

    Dim url As String
    url = "https://forms.office.com/r/vMNuDMXasK"
    ThisWorkbook.FollowHyperlink url

    LogToRR9998 "JobBuild completed."
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in JobBuild: " & Err.description
End Sub









