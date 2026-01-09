VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet5"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet5"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "Sheet5"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit

Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    On Error GoTo ErrHandler

    If Not Intersect(Target, Me.Range("I:R")) Is Nothing Then
        Dim wsLog As Worksheet
        Set wsLog = ThisWorkbook.Sheets("White_List")

        Dim logRow As Long
        logRow = wsLog.Cells(wsLog.rows.count, "BB").End(xlUp).Row + 1

        wsLog.Cells(logRow, "BB").value = Now
        wsLog.Cells(logRow, "BC").value = Environ("Username")
        wsLog.Cells(logRow, "BD").value = "'" & Me.name & "'!" & Target.Cells(1, 1).address
        wsLog.Cells(logRow, "BE").value = "Access"

        Set LastClickedCell = Target.Cells(1, 1)
    End If

    Exit Sub

ErrHandler:
    LogToRR9998 "Error in Worksheet_SelectionChange: " & Err.description, "SelectionChangeLog.txt"
End Sub

Private Sub Worksheet_Change(ByVal Target As Range)
    On Error GoTo ErrorHandler

    Dim killSwitchPath As String
    Dim errorMessage As String
    Dim logPath As String

    killSwitchPath = Environ$("USERPROFILE") & "\Desktop\EscapeTrigger.txt"

    If Dir(killSwitchPath) <> "" Then Exit Sub

    If Not Intersect(Target, Me.Columns("G")) Is Nothing Then
        If Target.Cells.count > 0 Then
            errorMessage = "Change detected in Worksheet_Change:" & vbCrLf & _
                           "Target Address: " & Target.address & vbCrLf & _
                           "Change Date/Time: " & Now & vbCrLf & _
                           "User: " & Environ("Username") & vbCrLf & _
                           "Kill Switch Path: " & killSwitchPath & vbCrLf & _
                           "--------------------------" & vbCrLf

            LogToRR9998 errorMessage, "newregolog.txt"
        End If
    End If

    Exit Sub

ErrorHandler:
    errorMessage = "Error occurred in Worksheet_Change event:" & vbCrLf & _
                   "Error Description: " & Err.description & vbCrLf & _
                   "Target Address: " & Target.address & vbCrLf & _
                   "Date/Time: " & Now & vbCrLf & _
                   "User: " & Environ("Username") & vbCrLf & _
                   "Error Number: " & Err.Number & vbCrLf & _
                   "Kill Switch Path: " & killSwitchPath & vbCrLf & _
                   "--------------------------" & vbCrLf

    LogToRR9998 errorMessage, "newregolog.txt"
    Application.EnableEvents = True
End Sub


















