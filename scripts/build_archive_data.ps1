# C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\build_archive_data.ps1
# Dynamically compiles all archived JSON files and the draft.json into archive_data.js

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$draftPath = Join-Path $projectRoot "data\draft.json"
$archiveDir = Join-Path $projectRoot "data\archive"
$outputPath = Join-Path $projectRoot "data\archive_data.js"

if (-not (Test-Path $draftPath)) {
    Write-Output "Error: draft.json not found at $draftPath"
    exit 1
}

$draftContent = [System.IO.File]::ReadAllText($draftPath, [System.Text.Encoding]::UTF8)

# Find all JSON files in data/archive
$archiveFiles = @()
if (Test-Path $archiveDir) {
    $archiveFiles = Get-ChildItem -Path $archiveDir -Filter "*.json" | Sort-Object Name -Descending
}

$jsEntries = @()
$jsEntries += "  `"draft`": $draftContent"

foreach ($file in $archiveFiles) {
    # e.g., 2026_05_22.json -> 2026.05.22
    $dateKey = $file.BaseName.Replace("_", ".")
    $fileContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $jsEntries += "  `"$dateKey`": $fileContent"
}

$jsBody = [string]::Join(",`n", $jsEntries)

$jsContent = @"
window.FOUNDATION_ARCHIVES = {
$jsBody
};
"@

[System.IO.File]::WriteAllText($outputPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully rebuilt archive_data.js dynamically with $($archiveFiles.Count) archived items."
