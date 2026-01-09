Attribute VB_Name = "SupplierUpdateModule"
' Attribute VB_Name = "SupplierUpdateModule"
' Attribute VB_Name = "SupplierUpdateModule"
Sub PushSuppliers_KeywordMatch_Optimized()

    Dim wsSource As Worksheet, wsTarget As Worksheet
    Dim lastRow As Long, outRow As Long, lastTargetRow As Long
    Dim supplierDict As Object, typeDict As Object, locDict As Object
    Dim i As Long, supplier As String, blob As String, fromLocation As String
    Dim typeResult As String, locResult As String
    Dim dataArray As Variant, targetArray As Variant
    Dim targetRowCount As Long

    ' Comprehensive service type mapping based on Book1.xlsx analysis
    Dim typeKeywords As Variant, typeMapping As Variant
    typeKeywords = Array( _
        "flat tyre|flat tire|tyre repair|tire repair|puncture|wheel", "tyre", _
        "locked out|lock out|locksmith|keys locked|locked keys", "locksmith", _
        "flat battery|battery flat|jump start|jumpstart|battery dead|battery", "battery", _
        "tow|towing|breakdown|mechanical|engine|starter|alternator|clutch|transmission|gearbox", "tow", _
        "windscreen|windshield|glass|window", "glass", _
        "scrap|dispose|removal|wreck", "scrap", _
        "mechanic|mechanical repair|service|maintenance", "mechanic", _
        "fuel|petrol|diesel|gas|out of fuel|no fuel", "fuel", _
        "accident|crash|collision|insurance", "accident" _
    )

    ' New Zealand locations mapping (comprehensive list)
    Dim locationKeywords As Variant
    locationKeywords = Array( _
        "auckland", "wellington", "christchurch", "hamilton", "tauranga", "napier", "hastings", _
        "dunedin", "palmerston north", "rotorua", "whangarei", "new plymouth", "whanganui", _
        "nelson", "queenstown", "invercargill", "blenheim", "timaru", "ashburton", "levin", _
        "masterton", "whakatane", "greymouth", "westport", "wanaka", "kerikeri", "kaitaia", _
        "pukekohe", "cambridge", "matamata", "putaruru", "otaki", "motueka", "kaikoura", _
        "whangaparaoa", "fielding", "marton", "paraparaumu", "lower hutt", "upper hutt", _
        "porirua", "kapiti", "gisborne", "taupo", "tokoroa", "te anau", "oamaru", _
        "rangiora", "rolleston", "papakura", "manukau", "waitakere", "north shore", _
        "mount maunganui", "taupo", "te awamutu", "morrinsville", "hamilton east", _
        "hamilton west", "frankton", "huntly", "raglan", "ngaruawahia", "te kuiti", _
        "otorohanga", "waitomo", "thames", "coromandel", "whitianga", "whangamata", _
        "paeroa", "te aroha", "katikati", "waihi", "mount wellington", "glen eden", _
        "henderson", "new lynn", "avondale", "blockhouse bay", "titirangi", "west auckland", _
        "east auckland", "south auckland", "central auckland", "north auckland", _
        "manurewa", "mangere", "otahuhu", "papatoetoe", "howick", "botany", "pakuranga", _
        "half moon bay", "clevedon", "beachlands", "maraetai", "kawakawa bay", _
        "orewa", "silverdale", "dairy flat", "albany", "browns bay", "devonport", _
        "takapuna", "milford", "castor bay", "sunnynook", "glenfield", "birkenhead", _
        "northcote", "hillcrest", "birkdale", "beach haven", "chatswood", "mairangi bay", _
        "murrays bay", "rothesay bay", "torbay", "long bay", "okura", "stillwater", _
        "snells beach", "matakana", "warkworth", "wellsford", "mangawhai", "langs beach", _
        "bream bay", "ruakaka", "one tree point", "marsden point", "waipu", "kaiwaka" _
    )

    ' Initialize objects
    Set wsSource = ThisWorkbook.Sheets("Job Build Notes")
    Set wsTarget = ThisWorkbook.Sheets("Contractor_Details")
    Set supplierDict = CreateObject("Scripting.Dictionary")
    Set typeDict = CreateObject("Scripting.Dictionary")
    Set locDict = CreateObject("Scripting.Dictionary")

    ' Optimize Excel performance
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    ' Build type mapping dictionary for fast lookup
    For i = 0 To UBound(typeKeywords) Step 2
        Dim keywords As Variant
        keywords = Split(typeKeywords(i), "|")
        Dim kw As Variant
        For Each kw In keywords
            typeDict(Trim(LCase(kw))) = typeKeywords(i + 1)
        Next kw
    Next i

    ' Build location dictionary for fast lookup
    Dim loc As Variant
    For Each loc In locationKeywords
        locDict(Trim(LCase(loc))) = loc
    Next loc

    ' Load existing suppliers from Contractor_Details to avoid duplicates
    lastTargetRow = wsTarget.Cells(wsTarget.rows.count, "D").End(xlUp).Row
    If lastTargetRow > 1 Then
        Dim existingSuppliers As Variant
        existingSuppliers = wsTarget.Range("D2:D" & lastTargetRow).Value2
        For i = 1 To UBound(existingSuppliers, 1)
            If Not IsEmpty(existingSuppliers(i, 1)) Then
                supplierDict(CStr(existingSuppliers(i, 1))) = True
            End If
        Next i
    End If

    ' Read source data into array for faster processing
    lastRow = wsSource.Cells(wsSource.rows.count, "A").End(xlUp).Row
    If lastRow < 2 Then GoTo Cleanup

    ' Read all source data at once
    dataArray = wsSource.Range("A2:AQ" & lastRow).Value2

    ' Prepare target array
    ReDim targetArray(1 To lastRow, 1 To 9) ' Columns B through J
    targetRowCount = 0
    outRow = wsTarget.Cells(wsTarget.rows.count, "A").End(xlUp).Row + 1

    ' Process each row
    For i = 1 To UBound(dataArray, 1)
        ' Check if Column G (Type) = "Supplier" - if not, skip this row entirely
        If LCase(Trim(CStr(dataArray(i, 7)))) <> "supplier" Then
            GoTo nextRow
        End If
        
        ' Extract the actual supplier name from Column H (Supplier)
        supplier = Trim(CStr(dataArray(i, 8))) ' Column H - actual supplier name
        
        ' Skip if conditions not met:
        ' - No supplier name
        ' - Already processed (column AM = "PROCESSED")
        ' - Already exists in Contractor_Details
        If supplier = "" Or _
           LCase(Trim(CStr(dataArray(i, 39)))) = "processed" Or _
           supplierDict.Exists(supplier) Then ' Column AM (Supp_Update)
            GoTo nextRow
        End If

        ' Build search blob from multiple fields for service type matching
        blob = LCase(CStr(dataArray(i, 28)) & " " & CStr(dataArray(i, 29)) & " " & _
                     CStr(dataArray(i, 9)) & " " & CStr(dataArray(i, 33)) & " " & _
                     CStr(dataArray(i, 32)) & " " & CStr(dataArray(i, 30)) & " " & _
                     CStr(dataArray(i, 31))) ' AB(Fault), AC(Service Required), I(Reimbursement), AG(From Location), AF(Tyre Size), AD(Make), AE(Model)

        ' Fast type matching using dictionary lookup
        typeResult = FindBestMatch(blob, typeDict)
        If typeResult = "" Then typeResult = "no match"

        ' Fast location matching from From Location field
        fromLocation = LCase(CStr(dataArray(i, 33))) ' Column AG (From Location)
        locResult = ExtractLocationFromAddress(fromLocation, locDict)
        If locResult = "" Then locResult = "no match"

        ' Add to target array
        targetRowCount = targetRowCount + 1
        targetArray(targetRowCount, 1) = typeResult ' cd_Type (B)
        targetArray(targetRowCount, 2) = locResult ' cd_Location (C)
        targetArray(targetRowCount, 3) = supplier ' cd_Business (D) - from column H (actual supplier name)
        targetArray(targetRowCount, 4) = "" ' E - empty
        targetArray(targetRowCount, 5) = dataArray(i, 23) ' cd_Phone (F) - Column W (Supp_Ph_Nbr)
        targetArray(targetRowCount, 6) = "" ' cd_Main Contact (G) - not available in source
        targetArray(targetRowCount, 7) = dataArray(i, 9) ' cd_Text (H) - Column I (Reimbursement)
        targetArray(targetRowCount, 8) = dataArray(i, 24) ' cd_email (I) - Column X (Supp_Email)
        targetArray(targetRowCount, 9) = dataArray(i, 17) ' Bank Number (J) - Column Q (Bank_Supplier)

        ' Mark as processed in source (Column AM)
        wsSource.Cells(i + 1, 39).value = "PROCESSED" ' AM column (Supp_Update)
        supplierDict.Add supplier, True

nextRow:
    Next i

    ' Write all data to target sheet at once (much faster)
    If targetRowCount > 0 Then
        ' Create a properly sized array for output
        Dim outputArray As Variant
        ReDim outputArray(1 To targetRowCount, 1 To 9)
        
        ' Copy data to output array
        For i = 1 To targetRowCount
            outputArray(i, 1) = targetArray(i, 1)
            outputArray(i, 2) = targetArray(i, 2)
            outputArray(i, 3) = targetArray(i, 3)
            outputArray(i, 4) = targetArray(i, 4)
            outputArray(i, 5) = targetArray(i, 5)
            outputArray(i, 6) = targetArray(i, 6)
            outputArray(i, 7) = targetArray(i, 7)
            outputArray(i, 8) = targetArray(i, 8)
            outputArray(i, 9) = targetArray(i, 9)
        Next i
        
        ' Write to worksheet
        wsTarget.Range("B" & outRow & ":J" & (outRow + targetRowCount - 1)).Value2 = outputArray
    End If

Cleanup:
    ' Restore Excel settings
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
    
    MsgBox "Supplier extraction complete. Processed " & targetRowCount & " new suppliers.", vbInformation

End Sub

' Function to find best matching service type
Private Function FindBestMatch(searchText As String, typeDict As Object) As String
    Dim key As Variant
    Dim bestMatch As String
    Dim longestMatch As Integer
    
    bestMatch = ""
    longestMatch = 0
    
    ' Look for longest matching keyword
    For Each key In typeDict.keys
        If InStr(searchText, key) > 0 And Len(key) > longestMatch Then
            longestMatch = Len(key)
            bestMatch = typeDict(key)
        End If
    Next
    
    FindBestMatch = bestMatch
End Function

' Function to extract location from address string
Private Function ExtractLocationFromAddress(address As String, locDict As Object) As String
    Dim location As Variant
    Dim bestMatch As String
    Dim longestMatch As Integer
    
    bestMatch = ""
    longestMatch = 0
    
    ' Clean address string
    address = LCase(Replace(Replace(Replace(address, ",", " "), "  ", " "), "new zealand", ""))
    
    ' Look for longest matching location
    For Each location In locDict.keys
        If InStr(address, location) > 0 And Len(location) > longestMatch Then
            longestMatch = Len(location)
            bestMatch = locDict(location)
        End If
    Next
    
    ExtractLocationFromAddress = bestMatch
End Function

' Helper function to clean and normalize text
Private Function CleanText(inputText As String) As String
    CleanText = LCase(Trim(Replace(Replace(Replace(inputText, "  ", " "), vbLf, " "), vbCr, " ")))
End Function













