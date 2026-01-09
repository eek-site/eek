Attribute VB_Name = "PublicUtilities"
' Attribute VB_Name = "PublicUtilities"
' Attribute VB_Name = "PublicUtilities"
' ============================================================================
' PUBLIC UTILITIES MODULE
' Consolidated public utility functions used across the codebase
' ============================================================================
'
' CATEGORIES:
'   1. DATE/TIME PARSING    - ISO 8601 and flexible date/time handling
'   2. ENCODING/SANITIZING  - URL encoding, Base64, text sanitization
'   3. UI HELPERS           - Message boxes, status messages
'   4. PHONE/SMS HELPERS    - Phone number cleaning and validation
'   5. EXCEL HELPERS        - Column lookup, clipboard operations
'   6. CURRENCY HELPERS     - Currency code lookup
'   7. STRING HELPERS       - Common string operations
'
' USAGE:
'   All functions are Public and can be called directly from any module:
'   result = ParseFlexibleDate(someValue)
'   encoded = URLEncode(text)
'
' ORIGINAL LOCATIONS (for reference):
'   - ParseFlexibleDate/Time: FuelExtractionMenuModule
'   - URLEncode, EncodeBase64, SanitizeForURL: AAMainMenu
'   - TimedMsgBox, ShowStatus/Error/Warning: AAMainMenu
'   - Phone helpers: JobHelpers
'   - GetColumnByHeader, CopyTextToClipboard: JobHelpers
'   - GetCurrencyFromCountryCode: JobHelpers
'
' ============================================================================

Option Explicit

' ============================================================================
' MODULE-LEVEL CONSTANTS (must be declared before any Sub/Function)
' ============================================================================
Public Const SMS_GATEWAY As String = "@sms.tnz.co.nz"

' ============================================================================
' 1. DATE/TIME PARSING UTILITIES
'    Originally from: FuelExtractionMenuModule
' ============================================================================

Public Function ParseFlexibleDate(ByVal dateValue As Variant) As Variant
    ' Parses dates from multiple formats:
    ' - ISO 8601: "2025-12-23T00:00:00", "2025-12-23T14:30:00"
    ' - ISO date only: "2025-12-23"
    ' - Excel date serial numbers
    ' - Standard date strings recognized by VBA (dd/mm/yyyy, etc.)
    ' Returns: Date value if successful, original value if not parseable
    '
    ' Example:
    '   Dim d As Variant
    '   d = ParseFlexibleDate("2025-12-23T14:30:00")  ' Returns Date
    '   d = ParseFlexibleDate(45678)                   ' Returns Date from serial
    '   d = ParseFlexibleDate("invalid")               ' Returns "invalid"
    
    On Error Resume Next
    
    Dim strValue As String
    Dim result As Date
    Dim datePart As String
    Dim timePart As String
    Dim tPos As Long
    
    ' Handle empty/null
    If IsEmpty(dateValue) Or IsNull(dateValue) Then
        ParseFlexibleDate = dateValue
        Exit Function
    End If
    
    ' If already a date, return it
    If IsDate(dateValue) And Not IsNumeric(dateValue) Then
        ParseFlexibleDate = CDate(dateValue)
        Exit Function
    End If
    
    ' If numeric (Excel serial date), convert directly
    If IsNumeric(dateValue) Then
        ParseFlexibleDate = CDate(CDbl(dateValue))
        Exit Function
    End If
    
    ' Convert to string for parsing
    strValue = Trim(CStr(dateValue))
    
    ' Check for ISO 8601 format (contains T separator)
    tPos = InStr(strValue, "T")
    If tPos > 0 Then
        ' Split into date and time parts
        datePart = Left(strValue, tPos - 1)
        timePart = Mid(strValue, tPos + 1)
        
        ' Remove timezone info if present (Z or +00:00)
        If InStr(timePart, "Z") > 0 Then
            timePart = Left(timePart, InStr(timePart, "Z") - 1)
        End If
        If InStr(timePart, "+") > 0 Then
            timePart = Left(timePart, InStr(timePart, "+") - 1)
        End If
        If InStr(timePart, "-") > 0 And Len(timePart) > 8 Then
            timePart = Left(timePart, InStrRev(timePart, "-") - 1)
        End If
        
        ' Parse ISO date part (yyyy-mm-dd)
        If Len(datePart) >= 10 Then
            Dim yyyy As Integer, mm As Integer, dd As Integer
            yyyy = CInt(Left(datePart, 4))
            mm = CInt(Mid(datePart, 6, 2))
            dd = CInt(Mid(datePart, 9, 2))
            
            result = DateSerial(yyyy, mm, dd)
            
            ' Add time if present
            If Len(timePart) >= 5 Then
                Dim hh As Integer, mi As Integer, ss As Integer
                hh = CInt(Left(timePart, 2))
                mi = CInt(Mid(timePart, 4, 2))
                If Len(timePart) >= 8 Then
                    ss = CInt(Mid(timePart, 7, 2))
                Else
                    ss = 0
                End If
                result = result + TimeSerial(hh, mi, ss)
            End If
            
            ParseFlexibleDate = result
            Exit Function
        End If
    End If
    
    ' Check for ISO date only format (yyyy-mm-dd without T)
    If Len(strValue) >= 10 And Mid(strValue, 5, 1) = "-" And Mid(strValue, 8, 1) = "-" Then
        Dim y As Integer, m As Integer, d As Integer
        y = CInt(Left(strValue, 4))
        m = CInt(Mid(strValue, 6, 2))
        d = CInt(Mid(strValue, 9, 2))
        ParseFlexibleDate = DateSerial(y, m, d)
        Exit Function
    End If
    
    ' Try standard VBA date parsing as fallback
    If IsDate(strValue) Then
        ParseFlexibleDate = CDate(strValue)
        Exit Function
    End If
    
    ' Return original if nothing worked
    ParseFlexibleDate = dateValue
    
    On Error GoTo 0
End Function

Public Function ParseFlexibleTime(ByVal timeValue As Variant) As String
    ' Parses time from multiple formats and returns formatted string
    ' - ISO 8601: "2025-12-23T14:30:00" -> "2:30 PM"
    ' - Time only: "14:30" -> "2:30 PM"
    ' - Excel time serial
    ' Returns: Formatted time string "h:mm AM/PM" or original value
    '
    ' Example:
    '   ParseFlexibleTime("2025-12-23T14:30:00")  ' Returns "2:30 PM"
    '   ParseFlexibleTime(0.5)                     ' Returns "12:00 PM"
    
    On Error Resume Next
    
    Dim strValue As String
    Dim result As Date
    Dim timePart As String
    Dim tPos As Long
    
    ' Handle empty/null
    If IsEmpty(timeValue) Or IsNull(timeValue) Then
        ParseFlexibleTime = ""
        Exit Function
    End If
    
    strValue = Trim(CStr(timeValue))
    
    ' Check for ISO 8601 format (contains T separator)
    tPos = InStr(strValue, "T")
    If tPos > 0 Then
        timePart = Mid(strValue, tPos + 1)
        
        ' Remove timezone/milliseconds
        If InStr(timePart, "Z") > 0 Then timePart = Left(timePart, InStr(timePart, "Z") - 1)
        If InStr(timePart, "+") > 0 Then timePart = Left(timePart, InStr(timePart, "+") - 1)
        If InStr(timePart, ".") > 0 Then timePart = Left(timePart, InStr(timePart, ".") - 1)
        
        If Len(timePart) >= 5 Then
            Dim hh As Integer, mi As Integer
            hh = CInt(Left(timePart, 2))
            mi = CInt(Mid(timePart, 4, 2))
            result = TimeSerial(hh, mi, 0)
            ParseFlexibleTime = Format(result, "h:mm AM/PM")
            Exit Function
        End If
    End If
    
    ' If numeric (Excel time serial), convert directly
    If IsNumeric(timeValue) Then
        result = CDate(CDbl(timeValue))
        ParseFlexibleTime = Format(result, "h:mm AM/PM")
        Exit Function
    End If
    
    ' Try standard VBA date/time parsing
    If IsDate(strValue) Then
        result = CDate(strValue)
        ParseFlexibleTime = Format(result, "h:mm AM/PM")
        Exit Function
    End If
    
    ' Return original if nothing worked
    ParseFlexibleTime = strValue
    
    On Error GoTo 0
End Function

' ============================================================================
' 2. ENCODING & SANITIZATION UTILITIES
'    Originally from: AAMainMenu
' ============================================================================

Public Function URLEncode(ByVal StringVal As String) As String
    ' URL-encodes a string for safe use in URLs
    ' Handles special characters including smart quotes
    '
    ' Example:
    '   URLEncode("Hello World!")  ' Returns "Hello+World%21"
    
    Dim i As Integer, CharCode As Integer
    Dim char As String, Space As String
    Dim sanitizedVal As String
    
    ' Sanitize first to replace smart quotes
    sanitizedVal = SanitizeForURL(StringVal)
    
    URLEncode = ""
    Space = "+"
    
    For i = 1 To Len(sanitizedVal)
        char = Mid(sanitizedVal, i, 1)
        CharCode = Asc(char)
        
        If (CharCode >= 48 And CharCode <= 57) Or _
           (CharCode >= 65 And CharCode <= 90) Or _
           (CharCode >= 97 And CharCode <= 122) Then
            URLEncode = URLEncode & char
        ElseIf char = " " Then
            URLEncode = URLEncode & Space
        Else
            URLEncode = URLEncode & "%" & Hex(CharCode)
        End If
    Next i
End Function

Public Function SanitizeForURL(ByVal text As String) As String
    ' Sanitizes text for URL encoding - replaces smart quotes with ASCII equivalents
    ' Call this before URLEncode for best results
    '
    ' Example:
    '   SanitizeForURL("It's a "test"")  ' Replaces curly quotes
    
    Dim result As String
    result = text
    
    ' Replace curly/smart apostrophes with straight apostrophe (char 39)
    result = Replace(result, ChrW(&H2019), "'")  ' Right single quotation mark
    result = Replace(result, ChrW(&H2018), "'")  ' Left single quotation mark
    result = Replace(result, Chr(146), "'")      ' Windows-1252 right single quote
    result = Replace(result, Chr(145), "'")      ' Windows-1252 left single quote
    
    ' Replace curly/smart double quotes with straight double quote (char 34)
    result = Replace(result, ChrW(&H201C), """") ' Left double quotation mark
    result = Replace(result, ChrW(&H201D), """") ' Right double quotation mark
    result = Replace(result, Chr(147), """")     ' Windows-1252 left double quote
    result = Replace(result, Chr(148), """")     ' Windows-1252 right double quote
    
    ' Replace em-dash and en-dash with hyphen
    result = Replace(result, ChrW(&H2014), "-")  ' Em dash
    result = Replace(result, ChrW(&H2013), "-")  ' En dash
    result = Replace(result, Chr(150), "-")      ' Windows-1252 en dash
    result = Replace(result, Chr(151), "-")      ' Windows-1252 em dash
    
    SanitizeForURL = result
End Function

Public Function EncodeBase64(ByVal text As String) As String
    ' Encodes a string to Base64 format
    ' Uses MSXML for reliable encoding
    '
    ' Example:
    '   EncodeBase64("Hello")  ' Returns "SGVsbG8="
    
    On Error GoTo ErrorHandler
    
    Dim arrData() As Byte
    Dim objXML As Object
    Dim objNode As Object
    
    ' Convert string to byte array
    arrData = StrConv(text, vbFromUnicode)
    
    ' Use MSXML to encode Base64
    Set objXML = CreateObject("MSXML2.DOMDocument")
    Set objNode = objXML.createElement("b64")
    
    objNode.DataType = "bin.base64"
    objNode.nodeTypedValue = arrData
    
    ' Remove line breaks
    EncodeBase64 = Replace(objNode.text, vbLf, "")
    EncodeBase64 = Replace(EncodeBase64, vbCr, "")
    
    ' Clean up objects
    Set objNode = Nothing
    Set objXML = Nothing
    
    Exit Function
    
ErrorHandler:
    EncodeBase64 = ""
    Set objNode = Nothing
    Set objXML = Nothing
End Function

Public Function DecodeBase64(ByVal base64String As String) As String
    ' Decodes a Base64 string back to plain text
    '
    ' Example:
    '   DecodeBase64("SGVsbG8=")  ' Returns "Hello"
    
    On Error GoTo ErrorHandler
    
    Dim objXML As Object
    Dim objNode As Object
    
    Set objXML = CreateObject("MSXML2.DOMDocument")
    Set objNode = objXML.createElement("b64")
    
    objNode.DataType = "bin.base64"
    objNode.text = base64String
    
    DecodeBase64 = StrConv(objNode.nodeTypedValue, vbUnicode)
    
    Set objNode = Nothing
    Set objXML = Nothing
    
    Exit Function
    
ErrorHandler:
    DecodeBase64 = ""
    Set objNode = Nothing
    Set objXML = Nothing
End Function

' ============================================================================
' 3. UI HELPER UTILITIES
'    Originally from: AAMainMenu
' ============================================================================

Public Function TimedMsgBox(ByVal message As String, Optional ByVal seconds As Integer = 3, Optional ByVal title As String = "EEK", Optional ByVal buttons As Integer = vbOKOnly + vbInformation) As Integer
    ' Displays a message box that auto-closes after specified seconds
    ' Returns: Button clicked OR -1 if timed out
    '
    ' Example:
    '   TimedMsgBox "Operation complete!", 3, "Success"
    '   If TimedMsgBox("Continue?", 5, "Confirm", vbYesNo) = vbYes Then ...
    
    On Error GoTo FallbackMsgBox
    
    Dim wsh As Object
    Set wsh = CreateObject("WScript.Shell")
    
    ' Popup returns -1 if timed out, otherwise returns button clicked
    TimedMsgBox = wsh.Popup(message, seconds, title, buttons)
    
    Set wsh = Nothing
    Exit Function
    
FallbackMsgBox:
    ' If WScript.Shell fails, fall back to regular MsgBox
    TimedMsgBox = MsgBox(message, buttons, title)
End Function

Public Sub ShowStatus(ByVal message As String, Optional ByVal seconds As Integer = 5)
    ' Shows a quick status message that auto-closes (for confirmations)
    '
    ' Example:
    '   ShowStatus "File saved successfully!"
    
    TimedMsgBox message, seconds, "Status", vbOKOnly + vbInformation
End Sub

Public Sub ShowError(ByVal message As String, Optional ByVal seconds As Integer = 5)
    ' Shows an error message that auto-closes
    '
    ' Example:
    '   ShowError "Failed to connect to server"
    
    TimedMsgBox message, seconds, "Error", vbOKOnly + vbCritical
End Sub

Public Sub ShowWarning(ByVal message As String, Optional ByVal seconds As Integer = 5)
    ' Shows a warning message that auto-closes
    '
    ' Example:
    '   ShowWarning "File may be outdated"
    
    TimedMsgBox message, seconds, "Warning", vbOKOnly + vbExclamation
End Sub

' ============================================================================
' 4. PHONE/SMS HELPER UTILITIES
'    Originally from: JobHelpers
'    NOTE: SMS_GATEWAY constant is declared at top of module
' ============================================================================

Public Function CleanCountryCode(ByVal code As Variant) As String
    ' Cleans a country code by removing +, spaces
    '
    ' Example:
    '   CleanCountryCode("+64 ")  ' Returns "64"
    
    Dim result As String
    result = Trim(CStr(code))
    result = Replace(result, "+", "")
    result = Replace(result, " ", "")
    CleanCountryCode = result
End Function

Public Function CleanMobileNumber(ByVal Mobile As Variant) As String
    ' Cleans a mobile number by removing spaces, dashes, plus signs
    '
    ' Example:
    '   CleanMobileNumber("+64 21-123-4567")  ' Returns "64211234567"
    
    Dim result As String
    result = Trim(CStr(Mobile))
    result = Replace(result, " ", "")
    result = Replace(result, "-", "")
    result = Replace(result, "+", "")
    CleanMobileNumber = result
End Function

Public Function BuildSmsAddress(ByVal countryCode As String, ByVal mobileNumber As String) As String
    ' Builds an SMS gateway email address from country code and mobile
    '
    ' Example:
    '   BuildSmsAddress("64", "211234567")  ' Returns "+64211234567@sms.tnz.co.nz"
    
    Dim cc As String, mn As String
    
    cc = CleanCountryCode(countryCode)
    mn = CleanMobileNumber(mobileNumber)
    
    ' Ensure country code starts with +
    If Left(cc, 1) <> "+" Then cc = "+" & cc
    
    BuildSmsAddress = cc & mn & SMS_GATEWAY
End Function

Public Function IsValidNZMobile(ByVal mobileNumber As String) As Boolean
    ' Validates if a number is a valid NZ mobile (starts with 2x after cleaning)
    '
    ' Example:
    '   IsValidNZMobile("0211234567")  ' Returns True
    '   IsValidNZMobile("0911234567")  ' Returns False (landline)
    
    Dim clean As String
    clean = CleanMobileNumber(mobileNumber)
    
    ' Remove leading 64 if present
    If Left(clean, 2) = "64" Then clean = Mid(clean, 3)
    
    ' Remove leading 0 if present
    If Left(clean, 1) = "0" Then clean = Mid(clean, 2)
    
    ' Valid NZ mobiles start with 2 (20-29 range) and are at least 8 digits
    IsValidNZMobile = (Left(clean, 1) = "2" And Len(clean) >= 8)
End Function

Public Function BuildTelUri(ByVal countryCode As String, ByVal phoneNumber As String) As String
    ' Builds a tel: URI for click-to-call functionality
    '
    ' Example:
    '   BuildTelUri("64", "211234567")  ' Returns "tel:+64211234567"
    
    Dim cc As String, pn As String
    
    cc = CleanCountryCode(countryCode)
    pn = CleanMobileNumber(phoneNumber)
    
    If cc <> "" And pn <> "" Then
        BuildTelUri = "tel:+" & cc & pn
    ElseIf pn <> "" Then
        BuildTelUri = "tel:" & pn
    Else
        BuildTelUri = ""
    End If
End Function

' ============================================================================
' 5. EXCEL HELPER UTILITIES
'    Originally from: JobHelpers
' ============================================================================

Public Function GetColumnByHeader(ByVal ws As Worksheet, ByVal headerName As String) As Long
    ' Finds a column number by its header name in row 1
    ' Returns 0 if not found
    '
    ' Example:
    '   Dim col As Long
    '   col = GetColumnByHeader(ActiveSheet, "Customer Name")
    '   If col > 0 Then MsgBox "Found in column " & col
    
    Dim c As Long
    Dim LastCol As Long
    
    LastCol = ws.Cells(1, ws.Columns.count).End(xlToLeft).Column
    
    For c = 1 To LastCol
        If StrComp(Trim(ws.Cells(1, c).value), Trim(headerName), vbTextCompare) = 0 Then
            GetColumnByHeader = c
            Exit Function
        End If
    Next c
    
    GetColumnByHeader = 0
End Function

Public Sub CopyTextToClipboard(ByVal text As String)
    ' Copies text to the Windows clipboard
    '
    ' Example:
    '   CopyTextToClipboard "Hello World"
    
    On Error Resume Next
    Dim DataObj As Object
    Set DataObj = CreateObject("New:{1C3B4210-F441-11CE-B9EA-00AA006B1A69}")
    DataObj.SetText text
    DataObj.PutInClipboard
    Set DataObj = Nothing
End Sub

Public Function GetTextFromClipboard() As String
    ' Gets text from the Windows clipboard
    '
    ' Example:
    '   Dim clipText As String
    '   clipText = GetTextFromClipboard()
    
    On Error Resume Next
    Dim DataObj As Object
    Set DataObj = CreateObject("New:{1C3B4210-F441-11CE-B9EA-00AA006B1A69}")
    DataObj.GetFromClipboard
    GetTextFromClipboard = DataObj.GetText(1)
    Set DataObj = Nothing
End Function

' ============================================================================
' 6. CURRENCY HELPER UTILITIES
'    Originally from: JobHelpers
' ============================================================================

Public Function GetCurrencyFromCountryCode(ByVal countryCode As String) As String
    ' Returns currency code based on phone country code
    '
    ' Example:
    '   GetCurrencyFromCountryCode("64")  ' Returns "nzd"
    '   GetCurrencyFromCountryCode("61")  ' Returns "aud"
    
    Select Case CleanCountryCode(countryCode)
        Case "64": GetCurrencyFromCountryCode = "nzd"
        Case "61": GetCurrencyFromCountryCode = "aud"
        Case "1": GetCurrencyFromCountryCode = "usd"
        Case "44": GetCurrencyFromCountryCode = "gbp"
        Case "27": GetCurrencyFromCountryCode = "zar"
        Case Else: GetCurrencyFromCountryCode = "nzd"
    End Select
End Function

' ============================================================================
' 7. STRING HELPER UTILITIES
' ============================================================================

Public Function NullToEmpty(ByVal value As Variant) As String
    ' Converts Null/Empty to empty string, otherwise returns string value
    '
    ' Example:
    '   NullToEmpty(Null)        ' Returns ""
    '   NullToEmpty("Hello")     ' Returns "Hello"
    
    If IsNull(value) Or IsEmpty(value) Then
        NullToEmpty = ""
    Else
        NullToEmpty = CStr(value)
    End If
End Function

Public Function SafeTrim(ByVal value As Variant) As String
    ' Safely trims a value, handling Null/Empty
    '
    ' Example:
    '   SafeTrim(Null)           ' Returns ""
    '   SafeTrim("  Hello  ")    ' Returns "Hello"
    
    If IsNull(value) Or IsEmpty(value) Then
        SafeTrim = ""
    Else
        SafeTrim = Trim(CStr(value))
    End If
End Function

Public Function Coalesce(ParamArray values() As Variant) As Variant
    ' Returns the first non-empty value from the arguments
    '
    ' Example:
    '   Coalesce("", Null, "Default")  ' Returns "Default"
    '   Coalesce("First", "Second")    ' Returns "First"
    
    Dim i As Long
    For i = LBound(values) To UBound(values)
        If Not IsNull(values(i)) And Not IsEmpty(values(i)) Then
            If Len(Trim(CStr(values(i)))) > 0 Then
                Coalesce = values(i)
                Exit Function
            End If
        End If
    Next i
    Coalesce = ""
End Function

Public Function Left0(ByVal text As String, ByVal length As Long) As String
    ' Safe Left function that handles empty strings and lengths > string length
    '
    ' Example:
    '   Left0("Hello", 3)   ' Returns "Hel"
    '   Left0("Hi", 10)     ' Returns "Hi"
    '   Left0("", 5)        ' Returns ""
    
    If Len(text) = 0 Or length <= 0 Then
        Left0 = ""
    ElseIf length >= Len(text) Then
        Left0 = text
    Else
        Left0 = Left(text, length)
    End If
End Function

Public Function Right0(ByVal text As String, ByVal length As Long) As String
    ' Safe Right function that handles empty strings and lengths > string length
    '
    ' Example:
    '   Right0("Hello", 3)  ' Returns "llo"
    '   Right0("Hi", 10)    ' Returns "Hi"
    
    If Len(text) = 0 Or length <= 0 Then
        Right0 = ""
    ElseIf length >= Len(text) Then
        Right0 = text
    Else
        Right0 = Right(text, length)
    End If
End Function

' ============================================================================
' 8. NUMERIC HELPER UTILITIES
' ============================================================================

Public Function NullToDouble(ByVal v As Variant) As Double
    ' Safely converts any value to Double, returning 0 for null/empty/error values
    ' Handles: Empty, Null, Error, empty strings, and non-numeric values
    '
    ' Example:
    '   NullToDouble(Null)      ' Returns 0
    '   NullToDouble("")        ' Returns 0
    '   NullToDouble("123.45")  ' Returns 123.45
    '   NullToDouble(100)       ' Returns 100
    
    If IsError(v) Or IsNull(v) Or IsEmpty(v) Then
        NullToDouble = 0
    ElseIf VarType(v) = vbString And Trim$(CStr(v)) = "" Then
        NullToDouble = 0
    ElseIf IsNumeric(v) Then
        NullToDouble = CDbl(v)
    Else
        NullToDouble = 0
    End If
End Function

Public Function NullToLong(ByVal v As Variant) As Long
    ' Safely converts any value to Long, returning 0 for null/empty/error values
    '
    ' Example:
    '   NullToLong(Null)      ' Returns 0
    '   NullToLong("123")     ' Returns 123
    
    NullToLong = CLng(NullToDouble(v))
End Function

Public Function SafeToString(ByVal v As Variant) As String
    ' Safely converts any value to String, handling errors and nulls
    '
    ' Example:
    '   SafeToString(Null)        ' Returns ""
    '   SafeToString(CVErr(2015)) ' Returns ""
    '   SafeToString(123)         ' Returns "123"
    
    If IsError(v) Or IsNull(v) Or IsEmpty(v) Then
        SafeToString = ""
    Else
        SafeToString = CStr(v)
    End If
End Function

' ============================================================================
' 9. EXCEL ROW/COLUMN HELPER UTILITIES
' ============================================================================

Public Function GetLastRow(ByRef ws As Worksheet, Optional ByVal col As Variant = 0) As Long
    ' Finds the last row with data in a worksheet
    ' If col is specified, finds last row in that column only
    ' If col is 0 or omitted, finds last row in any column
    '
    ' Example:
    '   lastRow = GetLastRow(ActiveSheet)      ' Last row anywhere
    '   lastRow = GetLastRow(ActiveSheet, "A") ' Last row in column A
    '   lastRow = GetLastRow(ActiveSheet, 1)   ' Last row in column 1
    
    On Error Resume Next
    
    If col = 0 Then
        ' Find last row in any column
        GetLastRow = ws.Cells.Find(What:="*", After:=ws.Cells(1, 1), LookIn:=xlFormulas, _
                                   LookAt:=xlPart, SearchOrder:=xlByRows, _
                                   SearchDirection:=xlPrevious).Row
    Else
        ' Find last row in specific column
        GetLastRow = ws.Cells(ws.rows.count, col).End(xlUp).Row
    End If
    
    If GetLastRow = 0 Then GetLastRow = 1
    On Error GoTo 0
End Function

Public Function GetLastCol(ByRef ws As Worksheet, Optional ByVal Row As Variant = 0) As Long
    ' Finds the last column with data in a worksheet
    ' If row is specified, finds last column in that row only
    ' If row is 0 or omitted, finds last column in any row
    '
    ' Example:
    '   lastCol = GetLastCol(ActiveSheet)    ' Last column anywhere
    '   lastCol = GetLastCol(ActiveSheet, 1) ' Last column in row 1 (headers)
    
    On Error Resume Next
    
    If Row = 0 Then
        ' Find last column in any row
        GetLastCol = ws.Cells.Find(What:="*", After:=ws.Cells(1, 1), LookIn:=xlFormulas, _
                                   LookAt:=xlPart, SearchOrder:=xlByColumns, _
                                   SearchDirection:=xlPrevious).Column
    Else
        ' Find last column in specific row
        GetLastCol = ws.Cells(Row, ws.Columns.count).End(xlToLeft).Column
    End If
    
    If GetLastCol = 0 Then GetLastCol = 1
    On Error GoTo 0
End Function

Public Function IsRowEmpty(ByRef ws As Worksheet, ByVal Row As Long) As Boolean
    ' Checks if an entire row is empty
    '
    ' Example:
    '   If IsRowEmpty(ActiveSheet, 5) Then Debug.Print "Row 5 is empty"
    
    On Error Resume Next
    IsRowEmpty = (WorksheetFunction.CountA(ws.rows(Row)) = 0)
    On Error GoTo 0
End Function








