Attribute VB_Name = "LoggingModule"
' Attribute VB_Name = "LoggingModule"
' Attribute VB_Name = "LoggingModule"
' NOTE:
' This module is used by most macros for path resolution and logging.
' Keep changes backwards-compatible because many call sites pass the 2nd arg
' as a log *filename* (e.g. "CloseJobLog.txt") rather than a "level".
'
' UPDATED: Daily log files with 120-day retention
Option Explicit

Private Const LOG_RETENTION_DAYS As Long = 120
Private gLastCleanupDate As Date  ' Track when we last ran cleanup

' ===== YOUR EXISTING FUNCTION =====
Function GetRRFilePath(ByVal relativePath As String, Optional CreateFolder As Boolean = False) As String
    Dim baseFolder As String
    Dim fullPath As String
    Dim fs As Object

    baseFolder = Environ("USERPROFILE") & _
        "\OneDrive - Road and Rescue Limited\Road and Rescue New Zealand - Documents"
    If Right(baseFolder, 1) <> "\" Then baseFolder = baseFolder & "\"

    fullPath = baseFolder & relativePath
    Set fs = CreateObject("Scripting.FileSystemObject")

    If CreateFolder Then
        Dim folderPart As String
        folderPart = fs.GetParentFolderName(fullPath)
        EnsureFolderPath folderPart
    End If

    GetRRFilePath = fullPath
End Function

' ===== BUFFERED LOGGING SYSTEM WITH DAILY ROTATION =====
Public Sub LogToRR9998(ByVal logText As String, Optional ByVal logLevel As String = "INFO", Optional ByVal category As String = "GENERAL")
    ' Backwards-compatible logger with DAILY LOG FILES.
    '
    ' Common legacy usage in this codebase:
    '   LogToRR9998 "Something happened", "SomeLogFile.txt"
    '
    ' Newer/structured usage (supported too):
    '   LogToRR9998 "Something happened", "INFO", "Billing"
    '
    ' Log files are now named with date: SomeLogFile_2025-12-20.txt
    ' Files older than 120 days are automatically cleaned up.

    On Error Resume Next

    Dim inferredFile As String
    Dim inferredLevel As String
    Dim inferredCategory As String

    inferredFile = ""
    inferredLevel = "INFO"
    inferredCategory = "GENERAL"

    If IsLikelyLogFileName(logLevel) Then
        inferredFile = CStr(logLevel)
        inferredLevel = "INFO"
        inferredCategory = category
    Else
        inferredFile = "RR9998_Log.txt"
        inferredLevel = CStr(logLevel)
        inferredCategory = CStr(category)
    End If

    ' === CREATE DAILY LOG FILE ===
    Dim dailyFile As String
    dailyFile = GetDailyLogFileName(inferredFile)

    Dim logPath As String
    logPath = GetRRFilePath("2000 CODE\\EEK VBA Clone\\_Logs\\" & dailyFile, True)

    Dim fs As Object, ts As Object
    Set fs = CreateObject("Scripting.FileSystemObject")
    EnsureFolderPath fs.GetParentFolderName(logPath)

    Set ts = fs.OpenTextFile(logPath, 8, True) ' ForAppending
    ts.WriteLine Format$(Now, "yyyy-mm-dd hh:nn:ss") & " | " & inferredLevel & " | " & inferredCategory & " | " & logText
    ts.Close
    
    ' === RUN CLEANUP ONCE PER DAY ===
    If Date <> gLastCleanupDate Then
        gLastCleanupDate = Date
        CleanupOldLogs
    End If
End Sub

' ===== GET DAILY LOG FILE NAME =====
Private Function GetDailyLogFileName(ByVal baseFileName As String) As String
    ' Converts "SomeLog.txt" to "SomeLog_2025-12-20.txt"
    Dim dateStamp As String
    Dim baseName As String
    Dim ext As String
    Dim dotPos As Long
    
    dateStamp = Format$(Date, "yyyy-mm-dd")
    
    dotPos = InStrRev(baseFileName, ".")
    If dotPos > 0 Then
        baseName = Left$(baseFileName, dotPos - 1)
        ext = Mid$(baseFileName, dotPos)
    Else
        baseName = baseFileName
        ext = ".txt"
    End If
    
    GetDailyLogFileName = baseName & "_" & dateStamp & ext
End Function

' ===== CLEANUP OLD LOG FILES =====
Public Sub CleanupOldLogs()
    ' Deletes log files older than LOG_RETENTION_DAYS (120 days)
    On Error Resume Next
    
    Dim logFolder As String
    Dim fs As Object
    Dim folder As Object
    Dim file As Object
    Dim cutoffDate As Date
    Dim deletedCount As Long
    
    logFolder = GetRRFilePath("2000 CODE\\EEK VBA Clone\\_Logs\\", False)
    Set fs = CreateObject("Scripting.FileSystemObject")
    
    If Not fs.FolderExists(logFolder) Then Exit Sub
    
    Set folder = fs.GetFolder(logFolder)
    cutoffDate = Date - LOG_RETENTION_DAYS
    deletedCount = 0
    
    For Each file In folder.Files
        ' Only process log files
        If LCase$(fs.GetExtensionName(file.name)) = "txt" Or _
           LCase$(fs.GetExtensionName(file.name)) = "log" Or _
           LCase$(fs.GetExtensionName(file.name)) = "csv" Then
            
            ' Check if file is older than retention period
            If file.DateLastModified < cutoffDate Then
                file.Delete
                deletedCount = deletedCount + 1
            End If
        End If
    Next file
    
    ' Log the cleanup (only if we deleted something)
    If deletedCount > 0 Then
        Dim cleanupLogPath As String
        cleanupLogPath = GetRRFilePath("2000 CODE\\EEK VBA Clone\\_Logs\\CleanupLog_" & Format$(Date, "yyyy-mm-dd") & ".txt", True)
        Set fs = CreateObject("Scripting.FileSystemObject")
        Dim ts As Object
        Set ts = fs.OpenTextFile(cleanupLogPath, 8, True)
        ts.WriteLine Format$(Now, "yyyy-mm-dd hh:nn:ss") & " | Cleanup completed. Deleted " & deletedCount & " files older than " & LOG_RETENTION_DAYS & " days."
        ts.Close
    End If
End Sub

' ===== MANUAL CLEANUP TRIGGER =====
Public Sub RunLogCleanup()
    ' Manual trigger to clean up old logs - can be called from menu
    Dim countBefore As Long
    Dim countAfter As Long
    Dim logFolder As String
    Dim fs As Object
    Dim folder As Object
    
    logFolder = GetRRFilePath("2000 CODE\\EEK VBA Clone\\_Logs\\", False)
    Set fs = CreateObject("Scripting.FileSystemObject")
    
    If fs.FolderExists(logFolder) Then
        Set folder = fs.GetFolder(logFolder)
        countBefore = folder.Files.count
    End If
    
    CleanupOldLogs
    
    If fs.FolderExists(logFolder) Then
        Set folder = fs.GetFolder(logFolder)
        countAfter = folder.Files.count
    End If
    
    ShowStatus "Log cleanup complete." & vbCrLf & _
               "Files before: " & countBefore & vbCrLf & _
               "Files after: " & countAfter & vbCrLf & _
               "Deleted: " & (countBefore - countAfter) & vbCrLf & _
               "Retention: " & LOG_RETENTION_DAYS & " days"
End Sub

' ===== HELPER FUNCTIONS =====
Private Function IsLikelyLogFileName(ByVal s As String) As Boolean
    Dim t As String
    t = LCase$(Trim$(s))
    IsLikelyLogFileName = (Right$(t, 4) = ".txt" Or Right$(t, 4) = ".log" Or Right$(t, 4) = ".csv")
End Function

Private Sub EnsureFolderPath(ByVal folderPath As String)
    ' Creates nested folder paths safely.
    Dim fs As Object
    Set fs = CreateObject("Scripting.FileSystemObject")

    Dim parts() As String
    Dim currentPath As String
    Dim i As Long

    If Len(Trim$(folderPath)) = 0 Then Exit Sub

    parts = Split(folderPath, "\")
    currentPath = parts(0)

    For i = 1 To UBound(parts)
        currentPath = currentPath & "\" & parts(i)
        If Not fs.FolderExists(currentPath) Then fs.CreateFolder currentPath
    Next i
End Sub






