# Test Power Automate APIs
# Run these commands in PowerShell

Write-Host "`n=== Testing GCLID State API ===" -ForegroundColor Cyan
$gclidUrl = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5f20c5153e8a4de0be50a17e2dab4254/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Zw5-_6YSCNPb2cfjjfa0Oj_Fpc7N9rhHfc6fPZZhX7g"

try {
    $gclidResponse = Invoke-RestMethod -Uri $gclidUrl -Method Post -ContentType "application/json" -Body "{}"
    Write-Host "✅ GCLID State Response:" -ForegroundColor Green
    $gclidResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ GCLID State Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`n=== Testing Callflow State API ===" -ForegroundColor Cyan
$callflowUrl = "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17b1d2990e6f4082a2b0d9c2f1a29025/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bPyoxJ24kuxJZOyLGAclGaEuH6BHwUTFaGmYOwHofa8"

try {
    $callflowResponse = Invoke-RestMethod -Uri $callflowUrl -Method Post -ContentType "application/json" -Body "{}"
    Write-Host "✅ Callflow State Response:" -ForegroundColor Green
    $callflowResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Callflow State Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
}

