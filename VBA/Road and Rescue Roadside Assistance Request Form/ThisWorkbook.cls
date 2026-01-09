VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
' Attribute VB_Name = "ThisWorkbook"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
' Attribute VB_Name = "ThisWorkbook"
' Attribute VB_GlobalNameSpace = False
' Attribute VB_Creatable = False
' Attribute VB_PredeclaredId = True
' Attribute VB_Exposed = True
Option Explicit

Private Sub Workbook_Open()
    On Error GoTo ErrHandler
    
    ' Custom user-defined shortcuts
Application.OnKey "^m", "StartMenu"
Application.OnKey "^j", "AccountsMenu"
Application.OnKey "^+j", "JumpBackToLastClicked"
Application.OnKey "^+v", "CapitaliseActiveCell"

' VBA Manager shortcuts
Application.OnKey "^+e", "VBAExportImportMenu"
Application.OnKey "^+q", "QuickExportCurrentWorkbook"
Application.OnKey "^+b", "OpenVBAEditor"  ' Ctrl+Shift+B for VBA editor
Application.OnKey "^+h", "ShowVBAManagerHelp"  ' Ctrl+Shift+H for Help
    
    ' Set column widths
    SetColumnWidths
    
    ' Hide sensitive content based on user
    Hide_Receipts_Columns
    
    LogToRR9998 "Workbook opened and shortcuts initialized for user: " & Environ("USERNAME"), "WorkbookSessionLog.txt"
    Exit Sub
    
ErrHandler:
    LogToRR9998 "Error in Workbook_Open: " & Err.description, "WorkbookSessionLog.txt"
End Sub

Private Sub SetColumnWidths()
    ' Sets specific column widths on the "Book a Job" sheet
    Dim ws As Worksheet
    On Error Resume Next
    
    Set ws = ThisWorkbook.Sheets("Book a Job")
    If Not ws Is Nothing Then
        With ws
            .Columns("V").ColumnWidth = 11.45
            .Columns("AA").ColumnWidth = 40
            .Columns("AG").ColumnWidth = 25
            .Columns("AJ").ColumnWidth = 60
        End With
    End If
    
    On Error GoTo 0
End Sub

Private Sub Hide_Receipts_Columns()
    Dim ws As Worksheet
    On Error Resume Next
    
    Set ws = ThisWorkbook.Sheets("Receipts_List")
    If Not ws Is Nothing Then
        If LCase(Environ("USERNAME")) <> "adminrar" Then
            ws.Columns("I:J").Hidden = True
            LogToRR9998 "Receipts_List columns I:J hidden from user: " & Environ("USERNAME"), "AccessControlLog.txt"
        Else
            ws.Columns("I:J").Hidden = False
        End If
    End If
    
    On Error GoTo 0
End Sub

' Sheet protection for new sheet creation
Private Sub Workbook_NewSheet(ByVal Sh As Object)
    Dim userInput As String
    Application.EnableEvents = False
    
    userInput = InputBox("Enter the password to create a new sheet:", "Sheet Creation Restricted")
    
    If userInput = "0906" Then
        MsgBox "Access granted. New sheet creation allowed.", vbInformation
    Else
        MsgBox "Incorrect password. The new sheet will be deleted.", vbCritical
        Application.DisplayAlerts = False
        Sh.Delete
        Application.DisplayAlerts = True
    End If
    
    Application.EnableEvents = True
End Sub

Private Sub Workbook_SheetFollowHyperlink(ByVal Sh As Object, ByVal Target As Hyperlink)
    On Error Resume Next
    If Left(Target.address, 4) = "tel:" Then
        CreateObject("WScript.Shell").Run Target.address
    End If
End Sub










