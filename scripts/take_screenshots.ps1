# scripts/take_screenshots.ps1
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$brainDir = "C:\Users\Hubert\.gemini\antigravity\brain\dbd6bef2-0510-40d7-8d0b-3fc3b15a08e5"

# Calculate issue number dynamically by counting archived issues + 1
$archiveDir = Join-Path $projectRoot "data\archive"
$archiveCount = 0
if (Test-Path $archiveDir) {
    $archiveCount = (Get-ChildItem $archiveDir -Filter *.json).Count
}
$issueNum = $archiveCount + 1
$issueSuffix = [string]$issueNum
$issueSuffix = $issueSuffix.PadLeft(3, '0')

$draftPath = Join-Path $projectRoot "data\draft.json"
$dateParam = (Get-Date).ToString("yyyyMMdd")
if (Test-Path $draftPath) {
    $draft = Get-Content $draftPath -Encoding UTF8 -Raw | ConvertFrom-Json
    if ($draft.dateString) {
        $dateParam = $draft.dateString.Replace(".", "")
    }
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

# 1. Take screenshot of Read Mode
$readUrl = "http://127.0.0.1:8080/?mode=read&v=$dateParam"
$readOut = Join-Path $brainDir "render_read_mode_$($issueSuffix).png"
Write-Output "Capturing Read Mode screenshot at $readOut..."
$proc1 = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-sandbox", "--user-data-dir=$profilePath", "--screenshot=$readOut", "--window-size=1200,1600", $readUrl -PassThru
Start-Sleep -Seconds 5
try { Stop-Process -Id $proc1.Id -Force -ErrorAction SilentlyContinue } catch {}

# 2. Take screenshot of Edit Mode
$editUrl = "http://127.0.0.1:8080/?mode=edit&v=$dateParam"
$editOut = Join-Path $brainDir "render_edit_mode_$($issueSuffix).png"
Write-Output "Capturing Edit Mode screenshot at $editOut..."
$proc2 = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-sandbox", "--user-data-dir=$profilePath", "--screenshot=$editOut", "--window-size=1200,1600", $editUrl -PassThru
Start-Sleep -Seconds 5
try { Stop-Process -Id $proc2.Id -Force -ErrorAction SilentlyContinue } catch {}

Write-Output "Screenshots captured successfully!"
