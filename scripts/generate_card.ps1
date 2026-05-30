# scripts/generate_card.ps1
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outCardPath = Join-Path $projectRoot "test_output_share_card.png"

# Delete old card if exists
if (Test-Path $outCardPath) {
    Remove-Item $outCardPath -Force
}

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edgePath)) {
    Write-Output "Error: Microsoft Edge executable not found!"
    exit 1
}

$profilePath = Join-Path $projectRoot "edge_profile_temp"
$captureUrl = "http://127.0.0.1:8080/?openShare=true&downloadShare=true&v=20260531"

Write-Output "Launching Headless Edge to generate share card..."
$edgeProcess = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-sandbox", "--user-data-dir=$profilePath", $captureUrl -PassThru

# Wait for card generation with 15s timeout
$timeoutSeconds = 15
$intervalMs = 250
$elapsedMs = 0
$fileGenerated = $false

while ($elapsedMs -lt ($timeoutSeconds * 1000)) {
    if (Test-Path $outCardPath) {
        $fileGenerated = $true
        # Wait an extra 500ms to ensure the file write stream is completely closed/flushed
        Start-Sleep -Milliseconds 500
        break
    }
    Start-Sleep -Milliseconds $intervalMs
    $elapsedMs += $intervalMs
}

# Kill Edge process
try {
    Stop-Process -Id $edgeProcess.Id -Force -ErrorAction SilentlyContinue
} catch {}

if ($fileGenerated) {
    Write-Output "Share card generated successfully at $outCardPath in $($elapsedMs / 1000) seconds!"
} else {
    Write-Output "Error: Card generation timed out after $timeoutSeconds seconds."
    exit 1
}
