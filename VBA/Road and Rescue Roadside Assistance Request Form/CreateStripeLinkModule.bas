Attribute VB_Name = "CreateStripeLinkModule"
' Attribute VB_Name = "CreateStripeLinkModule"
' Attribute VB_Name = "CreateStripeLinkModule"
Sub CreateStripeLink( _
    ByVal rego As String, _
    ByVal amountDue As Double, _
    ByVal descText As String, _
    ByRef paymentLink As String, _
    Optional ByVal redirectUrl As String = "www.eek.nz/thanks", _
    Optional ByVal isReleasePayment As Boolean = False)
    
    On Error GoTo ErrHandler
    Dim http As Object
    Dim endpoint As String
    Dim payload As String
    Dim cleanDesc As String
    Dim amountInCents As Long
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Always use the Stripe link creator endpoint
    endpoint = "https://prod-22.australiasoutheast.logic.azure.com:443/workflows/e902e35b4e574defb0af836b4259602c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4DuJt4Ol0Z75ZXD6m4XEtbtGoPlhCnPhor0FsW8ncog"
    
    cleanDesc = Replace(descText, Chr(34), "'")
    cleanDesc = Replace(cleanDesc, vbCr, " ")
    cleanDesc = Replace(cleanDesc, vbLf, " ")
    cleanDesc = Replace(cleanDesc, vbTab, " ")
    
    amountInCents = CLng(amountDue * 100)
    
    payload = "{""rego"":""" & rego & """," & _
              """amount"":" & amountInCents & "," & _
              """currency"":""nzd""," & _
              """description"":""" & cleanDesc & """," & _
              """redirectUrl"":""" & redirectUrl & """}"
    
    With http
        .Open "POST", endpoint, False
        .setRequestHeader "Content-Type", "application/json"
        .send payload
    End With
    
    If http.status = 200 Then
        Dim raw As String: raw = Trim(http.responseText)
        If InStr(raw, """url"":""") > 0 Then
            Dim startPos As Long: startPos = InStr(raw, """url"":""") + 7
            Dim endPos As Long: endPos = InStr(startPos, raw, """")
            paymentLink = Mid(raw, startPos, endPos - startPos)
        Else
            paymentLink = ""
        End If
    Else
        paymentLink = ""
    End If
    
    Set http = Nothing
    Exit Sub
    
ErrHandler:
    paymentLink = ""
    If Not http Is Nothing Then Set http = Nothing
End Sub













