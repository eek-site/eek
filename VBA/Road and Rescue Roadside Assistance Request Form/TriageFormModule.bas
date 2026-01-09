Attribute VB_Name = "TriageFormModule"
' Attribute VB_Name = "TriageFormModule"
' Attribute VB_Name = "TriageFormModule"
Sub TriageForm()
    On Error GoTo ErrorHandler
    Dim url As String
    url = "https://forms.office.com/Pages/ResponsePage.aspx?id=vMb_Yc7Zi0WBINMhh8N3DSnleyJD3nBGm0qPafV8nlFUNTRSSFpINE9OSVhHWTlBV0tUU1ZDMThBNS4u"
    
    ' Open the hyperlink
    ThisWorkbook.FollowHyperlink url
    
    Exit Sub

ErrorHandler:
    ' Log the error to the log file
    LogToRR9998 "Error in TriageForm: " & Err.description
End Sub









