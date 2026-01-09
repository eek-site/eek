Attribute VB_Name = "openjobbuild"
' Attribute VB_Name = "openjobbuild"
' Attribute VB_Name = "openjobbuild"
Option Explicit

' Declare API functions for clipboard handling
Declare PtrSafe Function OpenClipboard Lib "user32" (ByVal hwnd As LongPtr) As Long
Declare PtrSafe Function EmptyClipboard Lib "user32" () As Long
Declare PtrSafe Function CloseClipboard Lib "user32" () As Long
Declare PtrSafe Function SetClipboardData Lib "user32" (ByVal uFormat As Long, ByVal hMem As LongPtr) As Long
Declare PtrSafe Function GlobalAlloc Lib "kernel32" (ByVal wFlags As Long, ByVal dwBytes As Long) As LongPtr
Declare PtrSafe Function GlobalLock Lib "kernel32" (ByVal hMem As LongPtr) As LongPtr
Declare PtrSafe Function GlobalUnlock Lib "kernel32" (ByVal hMem As LongPtr) As Long
Declare PtrSafe Function lstrcpy Lib "kernel32" (ByVal lpString1 As Any, ByVal lpString2 As Any) As Long

Const CF_TEXT = 1
Const GMEM_MOVEABLE = &H2

' Function to copy text to the clipboard
Private Sub CopyTextToClipboard(text As String)
    On Error GoTo ErrHandler
    LogToRR9998 "CopyTextToClipboard started."

    Dim hGlobalMemory As LongPtr
    Dim lpMemory As LongPtr

    If OpenClipboard(0&) Then
        EmptyClipboard
        hGlobalMemory = GlobalAlloc(GMEM_MOVEABLE, Len(text) + 1)
        lpMemory = GlobalLock(hGlobalMemory)

        lstrcpy lpMemory, ByVal text
        GlobalUnlock hGlobalMemory

        SetClipboardData CF_TEXT, hGlobalMemory
        CloseClipboard

        LogToRR9998 "Text copied to clipboard successfully."
    Else
        LogToRR9998 "Failed to open clipboard."
        MsgBox "Unable to open the clipboard. Please try again.", vbExclamation, "Clipboard Error"
    End If
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in CopyTextToClipboard: " & Err.description
End Sub

Private Sub ClearStatusBar()
    Application.StatusBar = False
End Sub









