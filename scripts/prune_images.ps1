# prune_images.ps1
# This script prunes unused images in data/images/ by matching them against all archive json files and the main draft.json.

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
# If running directly, make sure paths are absolute relative to project root
$projectRoot = Resolve-Path (Join-Path $scriptPath "..")

$imagesDir = Join-Path $projectRoot "data\images"
$draftFile = Join-Path $projectRoot "data\draft.json"
$archiveDir = Join-Path $projectRoot "data\archive"
$backupDir = Join-Path $projectRoot "backups\pruned_images"

# 1. Gather all JSON files to scan
$jsonFiles = @()
if (Test-Path $draftFile) {
    $jsonFiles += $draftFile
}
if (Test-Path $archiveDir) {
    $jsonFiles += Get-ChildItem -Path $archiveDir -Filter "*.json" | ForEach-Object { $_.FullName }
}

Write-Host "Scanning $($jsonFiles.Count) JSON files for referenced images..."

# 2. Extract referenced image file names
$referencedImages = @{ }

foreach ($file in $jsonFiles) {
    # Force reading with UTF-8
    $content = Get-Content -Raw -Path $file -Encoding UTF8
    
    # Match patterns like "data/images/filename.ext" or "data\images\filename.ext"
    # We use regex to find matching filenames in JSON strings
    $matches = [regex]::Matches($content, '"data[/\\]images[/\\]([^"]+)"')
    foreach ($match in $matches) {
        $imgName = $match.Groups[1].Value
        # Remove query parameters if any (e.g. ?v=1)
        $imgName = ($imgName -split '\?')[0]
        
        # Normalize to file name only
        $imgName = Split-Path $imgName -Leaf
        
        # Simple UrlDecode
        try {
            $imgName = [System.Uri]::UnescapeDataString($imgName)
        } catch {
            # Fallback if unescape fails
        }
        
        $key = $imgName.ToLower()
        $referencedImages[$key] = $true
    }
}

Write-Host "Found $($referencedImages.Count) unique referenced images in JSON files:"
foreach ($key in $referencedImages.Keys) {
    Write-Host "  - $key"
}

# 3. Scan physical images in data/images/
if (-not (Test-Path $imagesDir)) {
    Write-Host "Images directory not found at: $imagesDir" -ForegroundColor Red
    exit
}

$physicalFiles = Get-ChildItem -Path $imagesDir -File
$prunedCount = 0

foreach ($file in $physicalFiles) {
    $fileName = $file.Name.ToLower()
    $isReferenced = $referencedImages.ContainsKey($fileName)
    if (-not $isReferenced) {
        # Check if backup directory exists
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        
        $destPath = Join-Path $backupDir $file.Name
        Write-Host "Unreferenced image found: $($file.Name) -> Moving to backup directory..." -ForegroundColor Yellow
        Move-Item -Path $file.FullName -Destination $destPath -Force
        $prunedCount++
    }
}

if ($prunedCount -eq 0) {
    Write-Host "All physical images are referenced. No pruning needed." -ForegroundColor Green
} else {
    Write-Host "Successfully pruned $prunedCount images. Backup saved to: $backupDir" -ForegroundColor Green
}
