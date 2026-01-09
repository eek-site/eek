Attribute VB_Name = "ImportExportModule"
Option Explicit

Private Const VBA_CLONE_FOLDER As String = "2000 CODE\EEK VBA Clone"
Private Const LOG_FILE As String = "VBA_Manager_Log.txt"
Private Const RESTORE_FOLDER As String = "_RestorePoints"
Private Const ERROR_LOG_FOLDER As String = "_ErrorLogs"
Private Const ERROR_LOG_FILE As String = "ImportErrors.txt"
Private Const PENDING_CHANGES_FILE As String = "PENDING_CHANGES.txt"
Private Const VBEXT_CT_STDMODULE As Long = 1
Private Const VBEXT_CT_CLASSMODULE As Long = 2

Public Sub VBAExportImportMenu()
    Dim choice As String
    Dim menuText As String
    
    menuText = "VBA CODE MANAGER" & vbCrLf & vbCrLf
    menuText = menuText & "EXPORT:" & vbCrLf
    menuText = menuText & "  1. Export this workbook" & vbCrLf
    menuText = menuText & "  2. Export ALL open workbooks" & vbCrLf
    menuText = menuText & "  3. Export to custom folder" & vbCrLf & vbCrLf
    menuText = menuText & "IMPORT:" & vbCrLf
    menuText = menuText & "  4. Import from default folder" & vbCrLf & vbCrLf
    menuText = menuText & "UTILITIES:" & vbCrLf
    menuText = menuText & "  5. Compare code differences" & vbCrLf
    menuText = menuText & "  6. Open export folder" & vbCrLf
    menuText = menuText & "  7. View export log" & vbCrLf
    menuText = menuText & "  8. View error log (in VBA folder)" & vbCrLf & vbCrLf
    menuText = menuText & "RESTORE POINTS:" & vbCrLf
    menuText = menuText & "  9. Create restore point" & vbCrLf
    menuText = menuText & "  10. Restore from restore point" & vbCrLf & vbCrLf
    menuText = menuText & "Enter choice (1-10), 'q' to go back, or 'qq' to exit:"
    
    choice = InputBox(menuText, "VBA Manager - Ctrl+Shift+E", "")
    
    Select Case LCase(Trim(choice))
        Case "qq": Exit Sub  ' Exit system
        Case "q", "": Exit Sub  ' Go back
        Case "1": ExportCurrentWorkbook
        Case "2": ExportAllOpenWorkbooks
        Case "3": ExportToCustomFolder
        Case "4": ImportCodeToWorkbook
        Case "5": ShowCodeDifferences
        Case "6": OpenExportFolder
        Case "7": ViewExportLog
        Case "8": ViewErrorLog
        Case "9": CreateRestorePoint
        Case "10": RestoreFromPoint
        Case Else: MsgBox "Invalid choice. Please enter a number from 1-10, 'q', or 'qq'.", vbExclamation, "Invalid Selection"
    End Select
End Sub

Public Sub CreateRestorePoint()
    Dim restorePath As String
    Dim pointName As String
    Dim timestamp As String
    Dim count As Long
    Dim changeDescription As String
    Dim pendingChanges As String
    
    timestamp = Format(Now, "yyyy-mm-dd_hhnnss")
    pointName = InputBox("Enter a name for this restore point (optional):" & vbCrLf & vbCrLf & _
                         "Leave blank for timestamp only.", "Create Restore Point", "")
    If pointName = "" Then
        pointName = timestamp
    Else
        pointName = timestamp & "_" & CleanFileName(pointName)
    End If
    
    ' Read pending changes from session file (written by AI assistant)
    pendingChanges = ReadPendingChanges()
    
    ' Ask for change description, showing pending changes as default
    If Len(pendingChanges) > 0 Then
        changeDescription = InputBox("Changes detected from this session:" & vbCrLf & vbCrLf & _
                                     Left(pendingChanges, 500) & vbCrLf & vbCrLf & _
                                     "Edit or add to this description:", _
                                     "Change Description", pendingChanges)
    Else
        changeDescription = InputBox("What changes were made? (optional)" & vbCrLf & vbCrLf & _
                                     "This will be saved to help you remember what was changed.", _
                                     "Change Description", "")
    End If
    
    restorePath = GetRestorePointsPath() & "\" & pointName
    count = ExportWorkbookCode(ThisWorkbook, restorePath)
    
    ' Create CHANGES.md in the restore point folder
    CreateChangesFile restorePath, pointName, changeDescription, count
    
    ' Append to master changelog
    AppendToMasterChangelog pointName, changeDescription, count
    
    ' Clear pending changes after successful restore point
    ClearPendingChanges
    
    LogRestorePoint pointName, "CREATED", count
    MsgBox "Restore point created:" & vbCrLf & vbCrLf & _
           "Name: " & pointName & vbCrLf & _
           "Components: " & count & vbCrLf & _
           "Location: " & restorePath, vbInformation, "Restore Point Created"
End Sub

Public Sub RestoreFromPoint()
    Dim restoreBasePath As String
    Dim fso As Object
    Dim folder As Object
    Dim subfolder As Object
    Dim pointList As String
    Dim pointArray() As String
    Dim pointCount As Long
    Dim choice As String
    Dim selectedPath As String
    Dim response As VbMsgBoxResult
    Dim i As Long
    restoreBasePath = GetRestorePointsPath()
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(restoreBasePath) Then
        MsgBox "No restore points found." & vbCrLf & vbCrLf & _
               "Create one first using option 8.", vbInformation, "No Restore Points"
        Exit Sub
    End If
    Set folder = fso.GetFolder(restoreBasePath)
    If folder.SubFolders.count = 0 Then
        MsgBox "No restore points found." & vbCrLf & vbCrLf & _
               "Create one first using option 8.", vbInformation, "No Restore Points"
        Exit Sub
    End If
    ReDim pointArray(1 To folder.SubFolders.count)
    pointList = "Available restore points:" & vbCrLf & vbCrLf
    pointCount = 0
    For Each subfolder In folder.SubFolders
        pointCount = pointCount + 1
        pointArray(pointCount) = subfolder.path
        pointList = pointList & pointCount & " - " & subfolder.name & vbCrLf
    Next subfolder
    choice = InputBox(pointList & vbCrLf & "Enter number to restore (1-" & pointCount & "):", _
                      "Select Restore Point", "")
    If choice = "" Then Exit Sub
    If Not IsNumeric(choice) Then
        MsgBox "Invalid selection.", vbExclamation
        Exit Sub
    End If
    i = CLng(choice)
    If i < 1 Or i > pointCount Then
        MsgBox "Invalid selection. Please enter 1-" & pointCount, vbExclamation
        Exit Sub
    End If
    selectedPath = pointArray(i)
    response = MsgBox("Restore from:" & vbCrLf & vbCrLf & selectedPath & vbCrLf & vbCrLf & _
                     "WARNING: This will replace current code!" & vbCrLf & vbCrLf & _
                     "Create a restore point of current state first?", _
                     vbYesNoCancel + vbExclamation, "Confirm Restore")
    If response = vbCancel Then Exit Sub
    If response = vbYes Then
        CreateRestorePointSilent "Before_Restore_" & Format(Now, "yyyymmdd_hhnnss")
    End If
    ImportFromPath selectedPath
    LogRestorePoint fso.GetFolder(selectedPath).name, "RESTORED", 0
    MsgBox "Restore complete from:" & vbCrLf & vbCrLf & selectedPath, vbInformation, "Restore Complete"
End Sub

Private Sub CreateRestorePointSilent(pointName As String, Optional changeDescription As String = "Auto-created before import")
    Dim restorePath As String
    Dim count As Long
    restorePath = GetRestorePointsPath() & "\" & pointName
    count = ExportWorkbookCode(ThisWorkbook, restorePath)
    
    ' Create CHANGES.md in the restore point folder
    CreateChangesFile restorePath, pointName, changeDescription, count
    
    ' Append to master changelog
    AppendToMasterChangelog pointName, changeDescription, count
    
    LogRestorePoint pointName, "AUTO-CREATED", count
End Sub

Private Function GenerateAutoRestorePointName() As String
    ' Generates automatic restore point name: "LastGood_2025-12-18_060857"
    Dim timestamp As String
    timestamp = Format(Now, "yyyy-mm-dd_hhnnss")
    GenerateAutoRestorePointName = "LastGood_" & timestamp
End Function

Private Sub ImportFromPath(importPath As String)
    Dim fso As Object
    Dim folder As Object
    Dim file As Object
    Dim count As Long
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set folder = fso.GetFolder(importPath)
    For Each file In folder.Files
        Select Case LCase(fso.GetExtensionName(file.name))
            Case "bas", "cls", "frm"
                If ImportSingleFile(file.path, fso.GetBaseName(file.name)) Then
                    count = count + 1
                End If
        End Select
    Next file
End Sub

Private Function GetRestorePointsPath() As String
    GetRestorePointsPath = GetDefaultExportPath(ThisWorkbook.name) & "\" & RESTORE_FOLDER
End Function

Private Sub LogRestorePoint(pointName As String, action As String, componentCount As Long)
    Dim fso As Object
    Dim ts As Object
    Dim logPath As String
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    logPath = GetBaseExportPath() & "\" & LOG_FILE
    CreateFolderPath GetBaseExportPath()
    Set ts = fso.OpenTextFile(logPath, 8, True)
    ts.WriteLine Format(Now, "yyyy-mm-dd hh:nn:ss") & " | RESTORE | " & action & " | " & pointName & " | " & componentCount & " components"
    ts.Close
End Sub

Private Sub CreateChangesFile(restorePath As String, pointName As String, changeDescription As String, componentCount As Long)
    ' Creates a CHANGES.md file in the restore point folder with metadata
    Dim fso As Object
    Dim ts As Object
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.CreateTextFile(restorePath & "\CHANGES.md", True)
    
    ts.WriteLine "# Restore Point: " & pointName
    ts.WriteLine ""
    ts.WriteLine "## Metadata"
    ts.WriteLine "- **Created:** " & Format(Now, "yyyy-mm-dd hh:nn:ss")
    ts.WriteLine "- **User:** " & Environ("USERNAME")
    ts.WriteLine "- **Computer:** " & Environ("COMPUTERNAME")
    ts.WriteLine "- **Components:** " & componentCount
    ts.WriteLine ""
    ts.WriteLine "## Changes Made"
    If Len(Trim(changeDescription)) > 0 Then
        ts.WriteLine changeDescription
    Else
        ts.WriteLine "_No description provided_"
    End If
    ts.WriteLine ""
    ts.WriteLine "---"
    ts.WriteLine "_This file was auto-generated by VBA Manager_"
    
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
End Sub

Private Sub AppendToMasterChangelog(pointName As String, changeDescription As String, componentCount As Long)
    ' Appends entry to master CHANGELOG.md at restore points root
    Dim fso As Object
    Dim ts As Object
    Dim changelogPath As String
    Dim fileExists As Boolean
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    changelogPath = GetRestorePointsPath() & "\CHANGELOG.md"
    CreateFolderPath GetRestorePointsPath()
    
    fileExists = fso.fileExists(changelogPath)
    
    ' Open for appending (8) or create new
    Set ts = fso.OpenTextFile(changelogPath, 8, True)
    
    ' Add header if new file
    If Not fileExists Or fso.GetFile(changelogPath).Size = 0 Then
        ts.WriteLine "# VBA Change Log"
        ts.WriteLine ""
        ts.WriteLine "This file tracks all restore points and their changes."
        ts.WriteLine ""
        ts.WriteLine "---"
        ts.WriteLine ""
    End If
    
    ' Add entry
    ts.WriteLine "## " & Format(Now, "yyyy-mm-dd hh:nn:ss") & " - " & pointName
    ts.WriteLine "- **Components:** " & componentCount
    ts.WriteLine "- **User:** " & Environ("USERNAME")
    If Len(Trim(changeDescription)) > 0 Then
        ts.WriteLine "- **Changes:** " & changeDescription
    Else
        ts.WriteLine "- **Changes:** _No description provided_"
    End If
    ts.WriteLine ""
    
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
End Sub

Private Function GetPendingChangesPath() As String
    ' Returns path to the pending changes file in the VBA export folder
    GetPendingChangesPath = GetDefaultExportPath(ThisWorkbook.name) & "\" & PENDING_CHANGES_FILE
End Function

Private Function ReadPendingChanges() As String
    ' Reads pending changes from session file (written by AI assistant or user)
    Dim fso As Object
    Dim ts As Object
    Dim pendingPath As String
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    pendingPath = GetPendingChangesPath()
    
    If fso.fileExists(pendingPath) Then
        Set ts = fso.OpenTextFile(pendingPath, 1) ' ForReading
        ReadPendingChanges = ts.ReadAll
        ts.Close
    Else
        ReadPendingChanges = ""
    End If
    
    Set ts = Nothing
    Set fso = Nothing
End Function

Private Sub ClearPendingChanges()
    ' Clears the pending changes file after a restore point is created
    Dim fso As Object
    Dim pendingPath As String
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    pendingPath = GetPendingChangesPath()
    
    If fso.fileExists(pendingPath) Then
        fso.DeleteFile pendingPath
    End If
    
    Set fso = Nothing
End Sub

Public Sub LogPendingChange(changeDescription As String)
    ' Appends a change to the pending changes file
    ' Call this from other modules or externally to track changes
    Dim fso As Object
    Dim ts As Object
    Dim pendingPath As String
    On Error Resume Next
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    pendingPath = GetPendingChangesPath()
    CreateFolderPath GetDefaultExportPath(ThisWorkbook.name)
    
    Set ts = fso.OpenTextFile(pendingPath, 8, True) ' ForAppending, Create if not exists
    ts.WriteLine "- " & changeDescription
    ts.Close
    
    Set ts = Nothing
    Set fso = Nothing
End Sub

Public Sub ExportCurrentWorkbook()
    Dim exportPath As String
    Dim count As Long
    exportPath = GetDefaultExportPath(ThisWorkbook.name)
    count = ExportWorkbookCode(ThisWorkbook, exportPath)
    MsgBox "Exported " & count & " components to:" & vbCrLf & vbCrLf & exportPath, vbInformation, "Export Complete"
End Sub

Public Sub ExportAllOpenWorkbooks()
    Dim wb As Workbook
    Dim basePath As String
    Dim totalCount As Long
    Dim wbCount As Long
    basePath = GetBaseExportPath()
    For Each wb In Application.Workbooks
        If LCase(wb.name) <> "personal.xlsb" And Right(LCase(wb.name), 5) <> ".xlam" Then
            totalCount = totalCount + ExportWorkbookCode(wb, basePath & "\" & CleanFileName(wb.name))
            wbCount = wbCount + 1
        End If
    Next wb
    MsgBox "Exported " & totalCount & " components from " & wbCount & " workbooks to:" & vbCrLf & vbCrLf & basePath, vbInformation, "Export Complete"
End Sub

Public Sub ExportToCustomFolder()
    Dim exportPath As String
    Dim count As Long
    With Application.FileDialog(msoFileDialogFolderPicker)
        .title = "Select Export Folder for VBA Code"
        .InitialFileName = GetBaseExportPath()
        If .show = -1 Then
            exportPath = .SelectedItems(1) & "\" & CleanFileName(ThisWorkbook.name)
            count = ExportWorkbookCode(ThisWorkbook, exportPath)
            MsgBox "Exported " & count & " components to:" & vbCrLf & vbCrLf & exportPath, vbInformation, "Export Complete"
        End If
    End With
End Sub

Private Function ExportWorkbookCode(wb As Workbook, exportPath As String) As Long
    Dim vbComp As Object
    Dim fileName As String
    Dim extension As String
    Dim count As Long
    Dim codeLines As Long
    On Error GoTo ErrHandler
    On Error Resume Next
    Dim testAccess As Long
    testAccess = wb.VBProject.VBComponents.count
    If Err.Number <> 0 Then
        MsgBox "Cannot access VBA Project in '" & wb.name & "'." & vbCrLf & vbCrLf & _
               "Enable access via:" & vbCrLf & _
               "File > Options > Trust Center > Trust Center Settings" & vbCrLf & _
               "Macro Settings > Trust access to the VBA project object model", _
               vbCritical, "Access Denied"
        ExportWorkbookCode = 0
        Exit Function
    End If
    On Error GoTo ErrHandler
    CreateFolderPath exportPath
    CreateManifestFile wb, exportPath
    For Each vbComp In wb.VBProject.VBComponents
        Select Case vbComp.Type
            Case 1: extension = ".bas"
            Case 2: extension = ".cls"
            Case 3: extension = ".frm"
            Case 100: extension = ".cls"
            Case Else: extension = ".txt"
        End Select
        codeLines = vbComp.codeModule.CountOfLines
        ' SAFETY: Don't export empty modules - this prevents overwriting good files with empty ones
        ' Only export if module has code (codeLines > 0)
        If codeLines > 0 Then
            fileName = exportPath & "\" & SanitizeComponentName(vbComp.name) & extension
            vbComp.Export fileName
            count = count + 1
            LogExport wb.name, vbComp.name, extension, codeLines, exportPath
        Else
            ' Log skipped empty modules for debugging
            LogToRR9998_Local "Export skipped empty module: " & vbComp.name & " (Type: " & vbComp.Type & ")", "INFO", "VBA_MANAGER"
        End If
    Next vbComp
    ExportWorkbookCode = count
    Exit Function
ErrHandler:
    LogError "ExportWorkbookCode", Err.description, wb.name
    ExportWorkbookCode = count
End Function

Private Sub CreateManifestFile(wb As Workbook, exportPath As String)
    Dim fso As Object
    Dim ts As Object
    Dim vbComp As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.CreateTextFile(exportPath & "\MANIFEST.md", True)
    ts.WriteLine "# VBA Export Manifest"
    ts.WriteLine ""
    ts.WriteLine "## Workbook Information"
    ts.WriteLine "- **Workbook:** " & wb.name
    ts.WriteLine "- **Full Path:** " & wb.fullName
    ts.WriteLine "- **Export Date:** " & Format(Now, "yyyy-mm-dd hh:nn:ss")
    ts.WriteLine "- **Exported By:** " & Environ("USERNAME")
    ts.WriteLine "- **Computer:** " & Environ("COMPUTERNAME")
    ts.WriteLine ""
    ts.WriteLine "## Components"
    ts.WriteLine ""
    ts.WriteLine "| Type | Name | Lines |"
    ts.WriteLine "|------|------|-------|"
    For Each vbComp In wb.VBProject.VBComponents
        ts.WriteLine "| " & GetComponentTypeName(vbComp.Type) & " | " & vbComp.name & " | " & vbComp.codeModule.CountOfLines & " |"
    Next vbComp
    ts.Close
    Set ts = Nothing
    Set fso = Nothing
End Sub

Public Sub ImportCodeToWorkbook()
    Dim importPath As String
    Dim fso As Object
    Dim folder As Object
    Dim file As Object
    Dim count As Long
    Dim skipped As Long
    Dim autoRestoreName As String
    On Error GoTo ErrHandler
    On Error Resume Next
    Dim testAccess As Long
    testAccess = ThisWorkbook.VBProject.VBComponents.count
    If Err.Number <> 0 Then
        MsgBox "Cannot access VBA Project. Enable access via:" & vbCrLf & _
               "File > Options > Trust Center > Trust Center Settings" & vbCrLf & _
               "Macro Settings > Trust access to the VBA project object model", _
               vbCritical, "Access Denied"
        Exit Sub
    End If
    On Error GoTo ErrHandler
    ' Automatically use default export path - fully programmatic
    importPath = GetDefaultExportPath(ThisWorkbook.name)
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(importPath) Then
        MsgBox "Import folder not found: " & importPath & vbCrLf & vbCrLf & _
               "Export some code first to create the folder.", vbCritical, "Folder Not Found"
        Exit Sub
    End If
    
    ' Automatically create restore point before importing
    autoRestoreName = GenerateAutoRestorePointName()
    CreateRestorePointSilent autoRestoreName
    
    ' Now proceed with import
    Set folder = fso.GetFolder(importPath)
    For Each file In folder.Files
        Select Case LCase(fso.GetExtensionName(file.name))
            Case "bas", "cls", "frm"
                If ImportSingleFile(file.path, fso.GetBaseName(file.name)) Then
                    count = count + 1
                Else
                    skipped = skipped + 1
                End If
        End Select
    Next file
    Application.StatusBar = "VBA imported: " & count & " components, " & skipped & " skipped. Restore point: " & autoRestoreName
    Application.OnTime Now + timeValue("00:00:05"), "VBAImportExport_ClearStatusBar"
    Exit Sub
ErrHandler:
    MsgBox "Import error: " & Err.description, vbCritical
    LogError "ImportCodeToWorkbook", Err.description, importPath
End Sub

Private Function ImportSingleFile(filePath As String, moduleName As String) As Boolean
    Dim vbComp As Object
    Dim targetName As String
    Dim ext As String
    On Error GoTo ErrHandler

    ext = LCase$(Mid$(filePath, InStrRev(filePath, ".") + 1))
    targetName = GetModuleNameFromFile(filePath, moduleName)

    ' Don't attempt to overwrite this module while it is running.
    ' Replacing code in an executing module can destabilize the running import.
    If LCase$(targetName) = LCase$("ImportExportModule") Then
        LogToRR9998_Local "Skipped self-update while importing. Module=" & targetName & " File=" & filePath, "INFO", "VBA_MANAGER"
        ImportSingleFile = False
        Exit Function
    End If

    On Error Resume Next
    Set vbComp = ThisWorkbook.VBProject.VBComponents(targetName)
    On Error GoTo ErrHandler
    If Not vbComp Is Nothing Then
        If vbComp.Type = 100 Then
            ImportCodeToDocumentModule vbComp, filePath
            ImportSingleFile = True
            Exit Function
        Else
            ' Avoid "ModuleName1" duplicates by replacing code in-place instead of removing+importing.
            ' This also allows ImportExportModule to update itself safely while running.
            ReplaceCodeInComponent vbComp, filePath
            ImportSingleFile = True
            Exit Function
        End If
    End If

    ' Component doesn't exist yet -> create and load cleaned code to avoid any header issues.
    Dim newComp As Object
    Select Case ext
        Case "bas"
            Set newComp = ThisWorkbook.VBProject.VBComponents.Add(VBEXT_CT_STDMODULE)
        Case "cls"
            Set newComp = ThisWorkbook.VBProject.VBComponents.Add(VBEXT_CT_CLASSMODULE)
        Case Else
            ' UserForms are best imported via VBComponents.Import
            ThisWorkbook.VBProject.VBComponents.Import filePath
            ImportSingleFile = True
            Exit Function
    End Select

    On Error Resume Next
    newComp.name = targetName
    On Error GoTo ErrHandler
    ReplaceCodeInComponent newComp, filePath
    ImportSingleFile = True
    Exit Function
ErrHandler:
    LogError "ImportSingleFile", Err.description, filePath
    ImportSingleFile = False
End Function

Private Sub ImportCodeToDocumentModule(vbComp As Object, filePath As String)
    Dim fso As Object
    Dim ts As Object
    Dim codeText As String
    Dim startLine As Long
    Dim lines() As String
    Dim i As Long
    Dim cleanCode As String
    On Error GoTo ErrHandler
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    codeText = ts.ReadAll
    ts.Close
    lines = Split(codeText, vbCrLf)
    
    ' Exported document modules (.cls) include a header block that is NOT valid VBA when pasted
    ' into a document module's CodeModule:
    '   VERSION 1.0 CLASS
    '   BEGIN
    '     MultiUse = -1  'True
    '   END
    '   Attribute ...
    '
    ' Strip that header consistently.
    For i = LBound(lines) To UBound(lines)
        If Not ShouldIgnoreExportLine(lines(i)) Then
            startLine = i
            Exit For
        End If
    Next i
    
    For i = startLine To UBound(lines)
        If Not ShouldIgnoreExportLine(lines(i)) Then
            cleanCode = cleanCode & lines(i) & vbCrLf
        End If
    Next i
    
    ' SAFETY CHECK: Don't delete existing code if file is empty or invalid
    ' This prevents blanking out modules when the source file is corrupted/empty
    If Len(Trim(cleanCode)) = 0 Then
        LogError "ImportCodeToDocumentModule", "Source file is empty or invalid - skipping import to prevent data loss: " & filePath, filePath
        Exit Sub
    End If
    
    With vbComp.codeModule
        If .CountOfLines > 0 Then .DeleteLines 1, .CountOfLines
        .AddFromString cleanCode
        
        ' After import, remove or comment out any Attribute lines that VBA may have added
        ' or that were in the imported code
        CleanupAttributeLines vbComp
    End With
    Exit Sub
ErrHandler:
    LogError "ImportCodeToDocumentModule", Err.description, filePath
End Sub

Private Sub ReplaceCodeInComponent(vbComp As Object, filePath As String)
    ' Replace code of an existing component with cleaned code (no export headers).
    On Error GoTo ErrHandler
    
    ' SAFETY: Check if component already has code - log warning if we're about to overwrite
    Dim existingLineCount As Long
    existingLineCount = vbComp.codeModule.CountOfLines
    If existingLineCount > 0 Then
        LogToRR9998_Local "ReplaceCodeInComponent: About to replace " & existingLineCount & " lines in " & vbComp.name & " from " & filePath, "INFO", "VBA_IMPORT"
    End If
    
    Dim cleanCode As String
    cleanCode = GetCleanCodeFromFile(filePath)

    ' SAFETY CHECK: Don't delete existing code if file is empty or invalid
    ' This prevents blanking out modules when the source file is corrupted/empty
    If Len(Trim$(cleanCode)) = 0 Then
        LogError "ReplaceCodeInComponent", "Source file is empty or invalid - skipping import to prevent data loss: " & filePath & " (existing code preserved: " & existingLineCount & " lines)", filePath
        MsgBox "WARNING: Skipped importing " & vbComp.name & " - source file is empty or invalid. Existing code preserved.", vbExclamation, "Import Skipped"
        Exit Sub
    End If

    ' SAFETY: Double-check we have valid code before deleting existing code
    If Len(Trim$(cleanCode)) < 10 Then
        LogError "ReplaceCodeInComponent", "Source file appears to contain only headers/metadata (too short) - skipping import: " & filePath, filePath
        MsgBox "WARNING: Skipped importing " & vbComp.name & " - source file appears invalid. Existing code preserved.", vbExclamation, "Import Skipped"
        Exit Sub
    End If

    With vbComp.codeModule
        If .CountOfLines > 0 Then .DeleteLines 1, .CountOfLines
        .AddFromString cleanCode
        
        ' After import, remove or comment out any Attribute lines that VBA may have added
        ' or that were in the imported code
        CleanupAttributeLines vbComp
    End With
    
    LogToRR9998_Local "ReplaceCodeInComponent: Successfully imported " & vbComp.codeModule.CountOfLines & " lines into " & vbComp.name, "INFO", "VBA_IMPORT"
    Exit Sub
ErrHandler:
    LogError "ReplaceCodeInComponent", Err.description & " (existing code may be preserved)", filePath
    ' Don't show error to user if we're in silent import mode - just log it
End Sub

Private Function GetModuleNameFromFile(ByVal filePath As String, ByVal fallbackName As String) As String
    ' Prefer the module/class name encoded in the export file's Attribute VB_Name.
    On Error GoTo ErrHandler

    Dim fso As Object, ts As Object
    Dim txt As String
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    txt = ts.ReadAll
    ts.Close

    Dim lines() As String
    lines = Split(txt, vbCrLf)

    Dim i As Long
    For i = LBound(lines) To UBound(lines)
        Dim t As String
        t = Trim$(lines(i))
        If LCase$(Left$(t, 17)) = "attribute vb_name" Then
            Dim p As Long, q As Long
            p = InStr(t, """")
            If p > 0 Then
                q = InStr(p + 1, t, """")
                If q > p Then
                    GetModuleNameFromFile = Mid$(t, p + 1, q - p - 1)
                    Exit Function
                End If
            End If
        End If
        ' stop scanning early once we hit real code
        If Not ShouldIgnoreExportLine(t) Then Exit For
    Next i

    GetModuleNameFromFile = fallbackName
    Exit Function
ErrHandler:
    GetModuleNameFromFile = fallbackName
End Function

Private Function GetCleanCodeFromFile(ByVal filePath As String) As String
    ' Strip export headers/metadata:
    '   VERSION/BEGIN/MultiUse/END and all Attribute lines
    On Error GoTo ErrHandler

    Dim fso As Object, ts As Object
    Dim codeText As String
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' SAFETY: Check if file exists and has content before reading
    If Not fso.fileExists(filePath) Then
        LogError "GetCleanCodeFromFile", "File does not exist: " & filePath, filePath
        GetCleanCodeFromFile = ""
        Exit Function
    End If
    
    ' Check file size - if it's 0 bytes, it's empty
    If fso.GetFile(filePath).Size = 0 Then
        LogError "GetCleanCodeFromFile", "File is empty (0 bytes): " & filePath, filePath
        GetCleanCodeFromFile = ""
        Exit Function
    End If
    
    Set ts = fso.OpenTextFile(filePath, 1)
    codeText = ts.ReadAll
    ts.Close

    ' SAFETY: Check if we actually read any content
    If Len(codeText) = 0 Then
        LogError "GetCleanCodeFromFile", "File read returned empty content: " & filePath, filePath
        GetCleanCodeFromFile = ""
        Exit Function
    End If

    Dim lines() As String
    lines = Split(codeText, vbCrLf)

    Dim out As String
    Dim i As Long
    Dim lineText As String
    For i = LBound(lines) To UBound(lines)
        lineText = lines(i)
        
        ' Remove export headers (VERSION, BEGIN, END, MultiUse) - these are not valid VBA
        If ShouldIgnoreExportLine(lineText) Then
            ' Skip these lines entirely
        ElseIf ShouldCommentAttributeLine(lineText) Then
            ' Comment out Attribute lines - preserve them as comments for reference
            ' VBA will automatically add Attribute VB_Name when importing, so we don't need these
            out = out & "' " & lineText & vbCrLf
        Else
            ' Keep all other lines as-is
            out = out & lineText & vbCrLf
        End If
    Next i

    ' SAFETY: Final check - make sure we have actual code after stripping headers
    If Len(Trim(out)) = 0 Then
        LogError "GetCleanCodeFromFile", "After stripping export headers, file contains no code: " & filePath, filePath
        GetCleanCodeFromFile = ""
        Exit Function
    End If

    GetCleanCodeFromFile = out
    Exit Function
ErrHandler:
    LogError "GetCleanCodeFromFile", "Error reading file: " & Err.description & " (" & Err.Number & ")", filePath
    GetCleanCodeFromFile = ""
End Function

Public Sub ShowCodeDifferences()
    Dim comparePath As String
    Dim fso As Object
    Dim folder As Object
    Dim file As Object
    Dim vbComp As Object
    Dim currentCode As String
    Dim fileCode As String
    Dim differences As String
    Dim diffCount As Long
    Dim moduleName As String
    Dim expectedFile As String
    On Error GoTo ErrHandler
    With Application.FileDialog(msoFileDialogFolderPicker)
        .title = "Select Folder to Compare Against Current Code"
        .InitialFileName = GetDefaultExportPath(ThisWorkbook.name)
        If .show <> -1 Then Exit Sub
        comparePath = .SelectedItems(1)
    End With
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set folder = fso.GetFolder(comparePath)
    differences = "CODE COMPARISON REPORT" & vbCrLf & _
                  "=====================" & vbCrLf & _
                  "Comparing: " & ThisWorkbook.name & vbCrLf & _
                  "Against: " & comparePath & vbCrLf & _
                  "Date: " & Format(Now, "yyyy-mm-dd hh:nn:ss") & vbCrLf & vbCrLf
    For Each file In folder.Files
        Select Case LCase(fso.GetExtensionName(file.name))
            Case "bas", "cls", "frm"
                moduleName = fso.GetBaseName(file.name)
                On Error Resume Next
                Set vbComp = ThisWorkbook.VBProject.VBComponents(moduleName)
                On Error GoTo ErrHandler
                If vbComp Is Nothing Then
                    differences = differences & "NEW: " & moduleName & " (not in current workbook)" & vbCrLf
                    diffCount = diffCount + 1
                Else
                    currentCode = GetModuleCode(vbComp)
                    fileCode = GetComparableFileCode(file.path)
                    If NormalizeCode(currentCode) <> NormalizeCode(fileCode) Then
                        differences = differences & "MODIFIED: " & moduleName & vbCrLf
                        diffCount = diffCount + 1
                    End If
                End If
                Set vbComp = Nothing
        End Select
    Next file
    For Each vbComp In ThisWorkbook.VBProject.VBComponents
        If vbComp.codeModule.CountOfLines > 0 Then
            expectedFile = comparePath & "\" & vbComp.name & GetExtensionForType(vbComp.Type)
            If Not fso.fileExists(expectedFile) Then
                differences = differences & "DELETED: " & vbComp.name & " (not in export folder)" & vbCrLf
                diffCount = diffCount + 1
            End If
        End If
    Next vbComp
    differences = differences & vbCrLf & "SUMMARY: " & diffCount & " differences found"
    MsgBox differences, vbInformation, "Code Comparison"
    Exit Sub
ErrHandler:
    MsgBox "Comparison error: " & Err.description, vbCritical
End Sub

Public Sub OpenExportFolder()
    Dim exportPath As String
    exportPath = GetDefaultExportPath(ThisWorkbook.name)
    If Dir(exportPath, vbDirectory) <> "" Then
        Shell "explorer.exe """ & exportPath & """", vbNormalFocus
    Else
        MsgBox "Export folder doesn't exist yet. Export some code first!", vbInformation
    End If
End Sub

Public Sub ViewExportLog()
    Dim logPath As String
    Dim fso As Object
    logPath = GetBaseExportPath() & "\" & LOG_FILE
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.fileExists(logPath) Then
        Shell "notepad.exe """ & logPath & """", vbNormalFocus
    Else
        MsgBox "No export log found. Export some code first!", vbInformation
    End If
End Sub

Public Sub ViewErrorLog()
    Dim errorLogPath As String
    Dim vbaCodePath As String
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    vbaCodePath = GetDefaultExportPath(ThisWorkbook.name)
    errorLogPath = vbaCodePath & "\" & ERROR_LOG_FOLDER & "\" & ERROR_LOG_FILE
    
    If fso.fileExists(errorLogPath) Then
        Shell "notepad.exe """ & errorLogPath & """", vbNormalFocus
    Else
        MsgBox "No error log found yet." & vbCrLf & vbCrLf & _
               "Error log location:" & vbCrLf & errorLogPath & vbCrLf & vbCrLf & _
               "Errors will be logged here when they occur during import/export operations.", vbInformation, "Error Log"
    End If
End Sub

Public Sub QuickExportCurrentWorkbook()
    Dim exportPath As String
    Dim count As Long
    On Error Resume Next
    exportPath = GetDefaultExportPath(ThisWorkbook.name)
    count = ExportWorkbookCode(ThisWorkbook, exportPath)
    Application.StatusBar = "VBA exported: " & count & " components to " & exportPath
    Application.OnTime Now + timeValue("00:00:05"), "VBAImportExport_ClearStatusBar"
End Sub

Public Sub VBAImportExport_ClearStatusBar()
    Application.StatusBar = False
End Sub

Private Function GetBaseExportPath() As String
    GetBaseExportPath = GetRRFilePath_Local(VBA_CLONE_FOLDER, True)
End Function

' ============================================================================
' STANDALONE UTILITY FUNCTIONS
' These functions are duplicated here to keep ImportExportModule independent
' of other modules. This ensures VBA code import/export always works even if
' other modules are broken or missing.
' ============================================================================

Private Function GetRRFilePath_Local(ByVal relativePath As String, Optional CreateFolder As Boolean = False) As String
    ' Standalone implementation - does not depend on LoggingModule
    Dim baseFolder As String
    Dim fullPath As String
    Dim fso As Object

    baseFolder = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents"
    If Right(baseFolder, 1) <> "\" Then baseFolder = baseFolder & "\"

    fullPath = baseFolder & relativePath
    Set fso = CreateObject("Scripting.FileSystemObject")

    If CreateFolder Then
        Dim folderPart As String
        folderPart = fso.GetParentFolderName(fullPath)
        EnsureFolderPath_Local folderPart
    End If

    GetRRFilePath_Local = fullPath
End Function

Private Sub EnsureFolderPath_Local(ByVal folderPath As String)
    ' Standalone implementation - creates nested folder paths safely
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    Dim parts() As String
    Dim currentPath As String
    Dim i As Long

    If Len(Trim$(folderPath)) = 0 Then Exit Sub

    parts = Split(folderPath, "\")
    currentPath = parts(0)

    For i = 1 To UBound(parts)
        currentPath = currentPath & "\" & parts(i)
        If Not fso.FolderExists(currentPath) Then fso.CreateFolder currentPath
    Next i
End Sub

Private Sub LogToRR9998_Local(ByVal logText As String, Optional ByVal logLevel As String = "INFO", Optional ByVal category As String = "GENERAL")
    ' Standalone implementation - logs to a local file without depending on LoggingModule
    ' This ensures import/export logging works even if LoggingModule is broken
    On Error Resume Next
    
    Dim logPath As String
    Dim fso As Object
    Dim ts As Object
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    logPath = GetBaseExportPath() & "\" & LOG_FILE
    CreateFolderPath GetBaseExportPath()
    
    Set ts = fso.OpenTextFile(logPath, 8, True) ' ForAppending
    ts.WriteLine Format$(Now, "yyyy-mm-dd hh:nn:ss") & " | " & logLevel & " | " & category & " | " & logText
    ts.Close
End Sub

Private Function GetDefaultExportPath(workbookName As String) As String
    GetDefaultExportPath = GetBaseExportPath() & "\" & CleanFileName(workbookName)
End Function

Private Function CleanFileName(fileName As String) As String
    Dim result As String
    Dim invalidChars As Variant
    Dim i As Long
    result = fileName
    If InStr(result, ".") > 0 Then result = Left(result, InStrRev(result, ".") - 1)
    invalidChars = Array("\", "/", ":", "*", "?", """", "<", ">", "|")
    For i = LBound(invalidChars) To UBound(invalidChars)
        result = Replace(result, invalidChars(i), "_")
    Next i
    CleanFileName = result
End Function

Private Function SanitizeComponentName(componentName As String) As String
    SanitizeComponentName = CleanFileName(componentName)
End Function

Private Sub CreateFolderPath(folderPath As String)
    Dim fso As Object
    Dim parts() As String
    Dim currentPath As String
    Dim i As Long
    Set fso = CreateObject("Scripting.FileSystemObject")
    parts = Split(folderPath, "\")
    currentPath = parts(0)
    For i = 1 To UBound(parts)
        currentPath = currentPath & "\" & parts(i)
        If Not fso.FolderExists(currentPath) Then fso.CreateFolder currentPath
    Next i
End Sub

Private Function GetComponentTypeName(compType As Long) As String
    Select Case compType
        Case 1: GetComponentTypeName = "Module"
        Case 2: GetComponentTypeName = "Class"
        Case 3: GetComponentTypeName = "UserForm"
        Case 100: GetComponentTypeName = "Document"
        Case Else: GetComponentTypeName = "Other"
    End Select
End Function

Private Function GetExtensionForType(compType As Long) As String
    Select Case compType
        Case 1: GetExtensionForType = ".bas"
        Case 2: GetExtensionForType = ".cls"
        Case 3: GetExtensionForType = ".frm"
        Case 100: GetExtensionForType = ".cls"
        Case Else: GetExtensionForType = ".txt"
    End Select
End Function

Private Function GetModuleCode(vbComp As Object) As String
    With vbComp.codeModule
        If .CountOfLines > 0 Then GetModuleCode = .lines(1, .CountOfLines)
    End With
End Function

Private Function GetFileCode(filePath As String) As String
    Dim fso As Object
    Dim ts As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.OpenTextFile(filePath, 1)
    GetFileCode = ts.ReadAll
    ts.Close
End Function

Private Function GetComparableFileCode(filePath As String) As String
    ' Exported VBA files include metadata (VERSION/BEGIN/END/Attribute lines)
    ' that do not always appear in VBIDE CodeModule.Lines().
    ' Strip these so comparisons are meaningful.

    Dim raw As String
    raw = GetFileCode(filePath)

    Dim lines() As String
    lines = Split(raw, vbCrLf)

    Dim i As Long
    Dim out As String

    For i = LBound(lines) To UBound(lines)
        If ShouldIgnoreExportLine(lines(i)) Then
            ' skip
        Else
            out = out & lines(i) & vbCrLf
        End If
    Next i

    GetComparableFileCode = out
End Function

Private Function ShouldIgnoreExportLine(ByVal lineText As String) As Boolean
    ' Returns True for lines that should be completely removed (not valid VBA)
    Dim t As String
    t = LCase$(Trim$(lineText))

    If t = "" Then
        ShouldIgnoreExportLine = False
        Exit Function
    End If

    ' Document/Class/UserForm export headers - these are NOT valid VBA code
    If Left$(t, 7) = "version" Then
        ShouldIgnoreExportLine = True
        Exit Function
    End If
    If t = "begin" Or t = "end" Then
        ShouldIgnoreExportLine = True
        Exit Function
    End If
    If Left$(t, 8) = "multiuse" Then
        ' e.g. "MultiUse = -1  'True" (part of exported class header)
        ShouldIgnoreExportLine = True
        Exit Function
    End If

    ' Attribute lines are handled separately by ShouldCommentAttributeLine
    ' They should be commented out, not removed
    ShouldIgnoreExportLine = False
End Function

Private Function ShouldCommentAttributeLine(ByVal lineText As String) As Boolean
    ' Returns True for Attribute lines that should be commented out
    ' VBA will automatically add Attribute VB_Name when importing, so we comment these out
    ' but preserve them as comments for reference
    Dim t As String
    t = LCase$(Trim$(lineText))
    
    If Left$(t, 9) = "attribute" Then
        ShouldCommentAttributeLine = True
    Else
        ShouldCommentAttributeLine = False
    End If
End Function

Private Sub CleanupAttributeLines(vbComp As Object)
    ' After importing code, remove or comment out Attribute lines
    ' VBA manages these internally, so we don't want them in the visible code
    On Error GoTo ErrHandler
    
    Dim codeModule As Object
    Set codeModule = vbComp.codeModule
    
    Dim totalLines As Long
    totalLines = codeModule.CountOfLines
    
    If totalLines = 0 Then Exit Sub
    
    Dim i As Long
    Dim lineText As String
    Dim cleanedCode As String
    Dim hasAttributeLines As Boolean
    hasAttributeLines = False
    
    ' Read all lines and comment out Attribute lines
    For i = 1 To totalLines
        lineText = codeModule.lines(i, 1)
        If IsAttributeLine(lineText) Then
            ' Comment out the Attribute line
            cleanedCode = cleanedCode & "' " & lineText & vbCrLf
            hasAttributeLines = True
        Else
            ' Keep the line as-is
            cleanedCode = cleanedCode & lineText & vbCrLf
        End If
    Next i
    
    ' If we found Attribute lines, replace the entire module with cleaned code
    If hasAttributeLines Then
        codeModule.DeleteLines 1, totalLines
        codeModule.AddFromString cleanedCode
        LogToRR9998_Local "CleanupAttributeLines: Commented out Attribute lines in " & vbComp.name, "INFO", "VBA_IMPORT"
    End If
    
    Exit Sub
ErrHandler:
    ' If cleanup fails, log it but don't fail the import
    LogError "CleanupAttributeLines", Err.description & " in " & vbComp.name, vbComp.name
End Sub

Private Function IsAttributeLine(ByVal lineText As String) As Boolean
    ' Check if a line is an Attribute line
    Dim t As String
    t = LCase$(Trim$(lineText))
    
    ' Check if it starts with "Attribute" (case-insensitive)
    If Left$(t, 9) = "attribute" Then
        IsAttributeLine = True
    Else
        IsAttributeLine = False
    End If
End Function

Private Function NormalizeCode(code As String) As String
    NormalizeCode = Replace(Replace(Trim(code), vbCrLf, vbLf), vbCr, vbLf)
End Function

Private Sub LogExport(workbookName As String, componentName As String, extension As String, lineCount As Long, exportPath As String)
    Dim fso As Object
    Dim ts As Object
    Dim logPath As String
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    logPath = GetBaseExportPath() & "\" & LOG_FILE
    CreateFolderPath GetBaseExportPath()
    Set ts = fso.OpenTextFile(logPath, 8, True)
    ts.WriteLine Format(Now, "yyyy-mm-dd hh:nn:ss") & " | EXPORT | " & workbookName & " | " & componentName & extension & " | " & lineCount & " lines"
    ts.Close
End Sub

Private Sub LogError(procedureName As String, errorDesc As String, context As String)
    Dim fso As Object
    Dim ts As Object
    Dim logPath As String
    Dim errorLogPath As String
    On Error Resume Next
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' Log to main log file (existing behavior)
    logPath = GetBaseExportPath() & "\" & LOG_FILE
    CreateFolderPath GetBaseExportPath()
    Set ts = fso.OpenTextFile(logPath, 8, True)
    ts.WriteLine Format(Now, "yyyy-mm-dd hh:nn:ss") & " | ERROR | " & procedureName & " | " & errorDesc & " | " & context
    ts.Close
    
    ' Also log to dedicated error log in VBA code folder for easy review
    Dim vbaCodePath As String
    vbaCodePath = GetDefaultExportPath(ThisWorkbook.name)
    errorLogPath = vbaCodePath & "\" & ERROR_LOG_FOLDER & "\" & ERROR_LOG_FILE
    CreateFolderPath vbaCodePath & "\" & ERROR_LOG_FOLDER
    Set ts = fso.OpenTextFile(errorLogPath, 8, True)
    ts.WriteLine Format(Now, "yyyy-mm-dd hh:nn:ss") & " | ERROR | " & procedureName & " | " & errorDesc & " | " & context
    ts.Close
End Sub









