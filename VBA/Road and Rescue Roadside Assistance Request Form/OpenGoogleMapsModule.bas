Attribute VB_Name = "OpenGoogleMapsModule"
' Attribute VB_Name = "OpenGoogleMapsModule"
' Attribute VB_Name = "OpenGoogleMapsModule"
Sub OpenCustomerAddressInGoogleMaps()
    On Error GoTo ErrHandler
    LogToRR9998 "OpenCustomerAddressInGoogleMaps started."

    Call OpenJobRegister

    If selectedJobRego = "" Then
        LogToRR9998 "No Job Rego selected. Exiting."
        Exit Sub
    End If

    Dim customerAddress As String
    customerAddress = GetCustomerAddress(selectedJobRego)

    If customerAddress = "" Then
        LogToRR9998 "No address found for selected Job Rego."
        Exit Sub
    End If

    customerAddress = Replace(customerAddress, " ", "+")
    Dim url As String
    url = "https://www.google.com/maps/search/?api=1&query=" & customerAddress

    ThisWorkbook.FollowHyperlink url
    LogToRR9998 "Google Maps link opened for: " & customerAddress
    Exit Sub

ErrHandler:
    LogToRR9998 "Error in OpenCustomerAddressInGoogleMaps: " & Err.description
End Sub

Function GetCustomerAddress(jobRego As String) As String
    On Error GoTo ErrHandler
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long

    Set ws = ThisWorkbook.Sheets("Book a Job")
    lastRow = ws.Cells(ws.rows.count, "N").End(xlUp).Row

    For i = 2 To lastRow
        If ws.Cells(i, 14).value = jobRego Then
            GetCustomerAddress = ws.Cells(i, 11).value
            Exit Function
        End If
    Next i

    GetCustomerAddress = ""
    Exit Function

ErrHandler:
    LogToRR9998 "Error in GetCustomerAddress: " & Err.description
    GetCustomerAddress = ""
End Function









