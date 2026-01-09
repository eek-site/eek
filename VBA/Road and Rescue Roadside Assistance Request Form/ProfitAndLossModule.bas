Attribute VB_Name = "ProfitAndLossModule"
' Attribute VB_Name = "ProfitAndLossModule"
' Attribute VB_Name = "ProfitAndLossModule"
Sub ProfitAndLoss()
    On Error GoTo ErrHandler

    Call UpdateDailySalesAndCOGS_Dates

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("White_List")

    Dim dDate As Date
    Dim strDate As String
    strDate = InputBox("Enter Date (mm/dd/yyyy) [Leave blank for today's date]:")

    If Trim(strDate) = "" Then
        dDate = Date
    Else
        On Error Resume Next
        dDate = CDate(strDate)
        If Err.Number <> 0 Then
            MsgBox "Invalid date entered. Using today's date."
            dDate = Date
            Err.Clear
        End If
        On Error GoTo 0
    End If

    ' Input values
    Dim strClicks As String, strCTR As String, strAvgCPC As String
    Dim strCost As String, strImpr As String, strWages As String
    Dim strTelephone As String, strOther As String, strLempiraRate As String
    Dim strQtyTriage As String, strQtySales As String, strQtySupport As String

    strClicks = InputBox("Enter number of Clicks:")
    strCTR = InputBox("Enter CTR:")
    strAvgCPC = InputBox("Enter Avg. CPC:")
    strCost = InputBox("Enter Cost:")
    strImpr = InputBox("Enter Impr.:")
    strWages = InputBox("Enter Wages (in Lempiras):")
    strTelephone = InputBox("Enter Telephone expenses:")
    strOther = InputBox("Enter Other expenses:")
    strLempiraRate = InputBox("Enter Lempira Rate (HNL to NZD conversion) [can be left blank]:")

    strQtyTriage = InputBox("Enter Qty Triage:")
    strQtySales = InputBox("Enter Qty Sales:")
    strQtySupport = InputBox("Enter Qty Support:")

    ' Resolve columns dynamically
    Dim colDate As Long, colClicks As Long, colCTR As Long, colAvgCPC As Long
    Dim colCost As Long, colImpr As Long, colWages As Long, colTelephone As Long, colOther As Long
    Dim colLempiraRate As Long, colTotal As Long
    Dim colQtyTriage As Long, colQtySales As Long, colQtySupport As Long
    Dim colDailySales As Long, colDailyCOGS As Long
    Dim colSalesDate As Long, colSalesAmount As Long, colCOGS As Long

    colDate = GetColumnByHeaderMap("Date")
    colClicks = GetColumnByHeaderMap("Clicks")
    colCTR = GetColumnByHeaderMap("CTR")
    colAvgCPC = GetColumnByHeaderMap("Avg. CPC")
    colCost = GetColumnByHeaderMap("Cost")
    colImpr = GetColumnByHeaderMap("Impr.")
    colWages = GetColumnByHeaderMap("Wages")
    colTelephone = GetColumnByHeaderMap("Telephone")
    colOther = GetColumnByHeaderMap("Other")
    colLempiraRate = GetColumnByHeaderMap("Lempira Rate")
    colTotal = GetColumnByHeaderMap("Profit and Loss")
    colQtyTriage = GetColumnByHeaderMap("Qty Triage")
    colQtySales = GetColumnByHeaderMap("Qty Sales")
    colQtySupport = GetColumnByHeaderMap("Qty Support")
    colDailySales = GetColumnByHeaderMap("Daily Sales")
    colDailyCOGS = GetColumnByHeaderMap("Daily COGS")
    colSalesDate = GetColumnByHeaderMap("Start time")
    colSalesAmount = GetColumnByHeaderMap("Price")
    colCOGS = GetColumnByHeaderMap("Staff Cost")

    If colDate = 0 Then Exit Sub

    ' Determine where to write
    Dim nextRow As Long
    Dim foundCell As Range
    Set foundCell = ws.Columns(colDate).Find(What:=dDate, LookIn:=xlValues, LookAt:=xlWhole)
    If Not foundCell Is Nothing Then
        nextRow = foundCell.Row
    Else
        nextRow = ws.Cells(ws.rows.count, colDate).End(xlUp).Row + 1
    End If

    ws.Cells(nextRow, colDate).value = dDate

    ' Write inputs
    If Trim(strClicks) <> "" Then ws.Cells(nextRow, colClicks).value = CDbl(strClicks)
    If Trim(strCTR) <> "" Then ws.Cells(nextRow, colCTR).value = CDbl(strCTR)
    If Trim(strAvgCPC) <> "" Then ws.Cells(nextRow, colAvgCPC).value = CDbl(strAvgCPC)
    If Trim(strCost) <> "" Then ws.Cells(nextRow, colCost).value = CDbl(strCost)
    If Trim(strImpr) <> "" Then ws.Cells(nextRow, colImpr).value = CDbl(strImpr)

    Dim dblLempiraRateVal As Double, dblWages As Double
    If Trim(strLempiraRate) <> "" Then
        dblLempiraRateVal = CDbl(strLempiraRate)
        ws.Cells(nextRow, colLempiraRate).value = dblLempiraRateVal
    Else
        dblLempiraRateVal = ws.Cells(nextRow, colLempiraRate).value
    End If

    If Trim(strWages) <> "" Then
        dblWages = CDbl(strWages)
        ws.Cells(nextRow, colWages).value = dblWages * dblLempiraRateVal
    End If

    If Trim(strTelephone) <> "" Then ws.Cells(nextRow, colTelephone).value = CDbl(strTelephone)
    If Trim(strOther) <> "" Then ws.Cells(nextRow, colOther).value = CDbl(strOther)
    If Trim(strQtyTriage) <> "" Then ws.Cells(nextRow, colQtyTriage).value = CLng(strQtyTriage)
    If Trim(strQtySales) <> "" Then ws.Cells(nextRow, colQtySales).value = CLng(strQtySales)
    If Trim(strQtySupport) <> "" Then ws.Cells(nextRow, colQtySupport).value = CLng(strQtySupport)

    ' Copy formula from row above if needed
    If ws.Cells(nextRow, colTotal).Formula = "" And nextRow > 2 Then
        If ws.Cells(nextRow - 1, colTotal).HasFormula Then
            ws.Cells(nextRow, colTotal).Formula = ws.Cells(nextRow - 1, colTotal).Formula
        End If
    End If

    Application.Calculate

    ' Manual calculation of sales & COGS from Book a Job
    Dim wsSales As Worksheet
    Set wsSales = ThisWorkbook.Sheets("Book a Job")
    Dim lastRowSales As Long, r As Long
    Dim dailySales As Double, dailyCOGS As Double
    Dim skipColor As Long
    skipColor = GetColorRGB("orange")

    dailySales = 0
    dailyCOGS = 0
    lastRowSales = wsSales.Cells(wsSales.rows.count, colSalesDate).End(xlUp).Row

    For r = 2 To lastRowSales
        If skipColor = 0 Or wsSales.Cells(r, colSalesDate).Interior.Color <> skipColor Then
            If IsDate(wsSales.Cells(r, colSalesDate).value) Then
                If Int(CDate(wsSales.Cells(r, colSalesDate).value)) = dDate Then
                    dailySales = dailySales + val(wsSales.Cells(r, colSalesAmount).value)
                    dailyCOGS = dailyCOGS + val(wsSales.Cells(r, colCOGS).value)
                End If
            End If
        End If
    Next r

    ws.Cells(nextRow, colDailySales).value = dailySales
    ws.Cells(nextRow, colDailyCOGS).value = dailyCOGS

    Dim profitLoss As Variant
    profitLoss = ws.Cells(nextRow, colTotal).value

    Call CalculateAllCPJ_PPJ

    Dim outputMsg As String
    outputMsg = "Daily Sales: " & Format(dailySales, "Currency") & vbCrLf & _
                "Daily COGS: " & Format(dailyCOGS, "Currency") & vbCrLf & _
                "Profit and Loss for " & Format(dDate, "mm/dd/yyyy") & ": " & Format(profitLoss, "Currency")
    MsgBox outputMsg

    Exit Sub

ErrHandler:
    LogToRR9998 "?? Error in ProfitAndLoss: " & Err.description, "ProfitAndLoss_Errors.txt"
    MsgBox "An error occurred: " & Err.description, vbCritical
End Sub

Sub UpdateDailySalesAndCOGS_Dates()
    On Error GoTo ErrHandler

    Dim wsWhite As Worksheet, wsSales As Worksheet
    Dim dateRow As Long, lastRowSales As Long, r As Long
    Dim currentDate As Date, cellValue As Variant
    Dim dailySales As Double, dailyCOGS As Double
    Dim colDailySales As Long, colDailyCOGS As Long
    Dim colDateWhite As Long
    Dim colSalesDate As Long, colSalesAmount As Long, colCOGS As Long
    Dim skipColor As Long

    Set wsWhite = ThisWorkbook.Sheets("White_List")
    Set wsSales = ThisWorkbook.Sheets("Book a Job")

    ' Resolve columns dynamically via map
    colDailySales = GetColumnByHeaderMap("Daily Sales")
    colDailyCOGS = GetColumnByHeaderMap("Daily COGS")
    colDateWhite = GetColumnByHeaderMap("Date")
    colSalesDate = GetColumnByHeaderMap("Start time")
    colSalesAmount = GetColumnByHeaderMap("Price")
    colCOGS = GetColumnByHeaderMap("Staff Cost")

    If colDailySales = 0 Or colDailyCOGS = 0 Or colDateWhite = 0 Or _
       colSalesDate = 0 Or colSalesAmount = 0 Or colCOGS = 0 Then
        LogToRR9998 "? One or more required columns could not be resolved. Aborting UpdateDailySalesAndCOGS_Dates.", "WhiteListCOGS_Errors.txt"
        Exit Sub
    End If

    skipColor = GetColorRGB("orange") ' Use centralized color palette

    lastRowSales = wsSales.Cells(wsSales.rows.count, colSalesDate).End(xlUp).Row

    For dateRow = 2 To 50
        If IsDate(wsWhite.Cells(dateRow, colDateWhite).value) Then
            currentDate = wsWhite.Cells(dateRow, colDateWhite).value
            dailySales = 0
            dailyCOGS = 0

            For r = 2 To lastRowSales
                cellValue = wsSales.Cells(r, colSalesDate).value
                If IsDate(cellValue) Then
                    If skipColor = 0 Or wsSales.Cells(r, colSalesDate).Interior.Color <> skipColor Then
                        If Int(CDate(cellValue)) = Int(currentDate) Then
                            dailySales = dailySales + val(wsSales.Cells(r, colSalesAmount).value)
                            dailyCOGS = dailyCOGS + val(wsSales.Cells(r, colCOGS).value)
                        End If
                    End If
                End If
            Next r

            wsWhite.Cells(dateRow, colDailySales).value = dailySales
            wsWhite.Cells(dateRow, colDailyCOGS).value = dailyCOGS
        End If
    Next dateRow

    LogToRR9998 "? UpdateDailySalesAndCOGS_Dates completed successfully."
    MsgBox "Daily Sales and COGS updated for dates in White_List."

    Exit Sub

ErrHandler:
    LogToRR9998 "?? Error in UpdateDailySalesAndCOGS_Dates: " & Err.description, "WhiteListCOGS_Errors.txt"
    MsgBox "An error occurred: " & Err.description, vbCritical
End Sub

Sub CalculateAllCPJ_PPJ()
    On Error GoTo ErrHandler

    Dim wsWhite As Worksheet, wsJobs As Worksheet
    Set wsWhite = ThisWorkbook.Sheets("White_List")
    Set wsJobs = ThisWorkbook.Sheets("Job Build Notes")

    Dim i As Long, j As Long, lastWhiteRow As Long, lastJobsRow As Long
    Dim searchDate As Date, jobDate As Date
    Dim jobCount As Long
    Dim cost As Variant, profit As Variant
    Dim jobDateRaw As Variant, jobType As String
    Dim totalCostings As Double
    Dim skipColor As Long

    skipColor = GetColorRGB("orange")

    ' === Get dynamic columns from White_List ===
    Dim colDate As Long, colCost As Long, colProfit As Long
    Dim colQty As Long, colGoogleCPJ As Long, colCOGSCPJ As Long, colPPJ As Long

    colDate = GetColumnByHeaderMap("Date")
    colCost = GetColumnByHeaderMap("Cost")
    colProfit = GetColumnByHeaderMap("Profit or Loss")
    colQty = GetColumnByHeaderMap("Qty Jobs")
    colGoogleCPJ = GetColumnByHeaderMap("Google CPJ")
    colCOGSCPJ = GetColumnByHeaderMap("COGS CPJ")
    colPPJ = GetColumnByHeaderMap("PPJ")

    ' === Get dynamic columns from Job Build Notes ===
    Dim colJobDate As Long, colJobType As Long, colCostings As Long
    colJobDate = GetColumnByHeaderMap("Completion time")
    colJobType = GetColumnByHeaderMap("Type")
    colCostings = GetColumnByHeaderMap("Costings")

    ' === Safety check ===
    If colDate * colCost * colProfit * colQty * colGoogleCPJ * colCOGSCPJ * colPPJ = 0 Or _
       colJobDate * colJobType * colCostings = 0 Then
        LogToRR9998 "? Required headers not found in one or more sheets. Aborting CalculateAllCPJ_PPJ.", "CPJ_PPJ_Errors.txt"
        Exit Sub
    End If

    lastWhiteRow = wsWhite.Cells(wsWhite.rows.count, colDate).End(xlUp).Row
    lastJobsRow = wsJobs.Cells(wsJobs.rows.count, colJobDate).End(xlUp).Row

    For i = 2 To lastWhiteRow
        jobCount = 0
        totalCostings = 0

        If IsDate(wsWhite.Cells(i, colDate).value) Then
            searchDate = dateValue(wsWhite.Cells(i, colDate).value)

            For j = 2 To lastJobsRow
                jobDateRaw = wsJobs.Cells(j, colJobDate).value
                jobType = Trim(LCase(wsJobs.Cells(j, colJobType).value))

                If IsDate(jobDateRaw) Then
                    jobDate = dateValue(jobDateRaw)
                    If jobDate = searchDate And jobType = "supplier" Then
                        If skipColor = 0 Or wsJobs.rows(j).Interior.Color <> skipColor Then
                            jobCount = jobCount + 1
                            If IsNumeric(wsJobs.Cells(j, colCostings).value) Then
                                totalCostings = totalCostings + wsJobs.Cells(j, colCostings).value
                            End If
                        End If
                    End If
                End If
            Next j

            ' Record job count
            wsWhite.Cells(i, colQty).value = jobCount
            cost = wsWhite.Cells(i, colCost).value
            profit = wsWhite.Cells(i, colProfit).value

            If jobCount > 0 Then
                wsWhite.Cells(i, colGoogleCPJ).value = IIf(IsNumeric(cost), Round(cost / jobCount, 2), "-")
                wsWhite.Cells(i, colCOGSCPJ).value = Round(totalCostings / jobCount, 2)
                wsWhite.Cells(i, colPPJ).value = IIf(IsNumeric(profit), Round(profit / jobCount, 2), "-")
            Else
                wsWhite.Cells(i, colGoogleCPJ).value = "-"
                wsWhite.Cells(i, colCOGSCPJ).value = "-"
                wsWhite.Cells(i, colPPJ).value = "-"
            End If
        End If
    Next i

    LogToRR9998 "? CPJ/PPJ calculations completed successfully."
    MsgBox "CPJ and PPJ calculations completed."

    Exit Sub

ErrHandler:
    LogToRR9998 "?? Error in CalculateAllCPJ_PPJ: " & Err.description, "CPJ_PPJ_Errors.txt"
    MsgBox "An error occurred: " & Err.description, vbCritical
End Sub

' GetColumn is now GetColumnByHeader in PublicUtilities module
Function GetColumn(ws As Worksheet, headerName As String) As Long
    GetColumn = GetColumnByHeader(ws, headerName)
End Function

' GetColumnByHeaderMap looks up column from White_List sheet
' Used throughout ProfitAndLoss to dynamically resolve column positions
Private Function GetColumnByHeaderMap(ByVal headerName As String) As Long
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("White_List")
    GetColumnByHeaderMap = GetColumnByHeader(ws, headerName)
End Function













