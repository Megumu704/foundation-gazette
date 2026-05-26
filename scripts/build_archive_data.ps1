$projectRoot = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette"
$archiveDir = Join-Path $projectRoot "data\archive"
$draftPath = Join-Path $projectRoot "data\draft.json"
$outputPath = Join-Path $projectRoot "data\archive_data.js"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$entries = @()

# Load draft.json
if (Test-Path $draftPath) {
    $draftJson = [System.IO.File]::ReadAllText($draftPath, [System.Text.Encoding]::UTF8)
    $entries += '  "draft": ' + $draftJson
}

# Load all archive files
if (Test-Path $archiveDir) {
    $jsonFiles = Get-ChildItem -Path $archiveDir -Filter "*.json" | Sort-Object Name -Descending
    foreach ($file in $jsonFiles) {
        # Extract date key from filename, e.g. "2026_05_20.json" -> "2026.05.20"
        $dateKey = $file.BaseName -replace "_", "."
        $fileJson = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $entries += '  "' + $dateKey + '": ' + $fileJson
    }
}

$jsContent = "window.FOUNDATION_ARCHIVES = {`n" + ($entries -join ",`n") + "`n};"
[System.IO.File]::WriteAllText($outputPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully rebuilt archive_data.js with dynamic scanner!"
