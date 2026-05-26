# C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\extract_reported.ps1
# Extracts all reported topics and news headlines from archives and draft to data/reported_topics.json

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$archiveDir = Join-Path $projectRoot "data\archive"
$draftPath = Join-Path $projectRoot "data\draft.json"
$outputPath = Join-Path $projectRoot "data\reported_topics.json"

$reportedList = @()

# Read draft if exists
if (Test-Path $draftPath) {
    try {
        $draft = Get-Content -Path $draftPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($draft.aestheticSpark -and $draft.aestheticSpark.title) {
            $reportedList += $draft.aestheticSpark.title
        }
        if ($draft.dynamicNews) {
            foreach ($news in $draft.dynamicNews) {
                if ($news.headline) {
                    $reportedList += $news.headline
                }
            }
        }
    } catch {
        # ignore
    }
}

# Read all archived JSONs
if (Test-Path $archiveDir) {
    $archiveFiles = Get-ChildItem -Path $archiveDir -Filter "*.json"
    foreach ($file in $archiveFiles) {
        try {
            $archive = Get-Content -Path $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($archive.aestheticSpark -and $archive.aestheticSpark.title) {
                $reportedList += $archive.aestheticSpark.title
            }
            if ($archive.dynamicNews) {
                foreach ($news in $archive.dynamicNews) {
                    if ($news.headline) {
                        $reportedList += $news.headline
                    }
                }
            }
        } catch {
            # ignore
        }
    }
}

# Unique list, clean up whitespace and brackets
$cleanedList = @()
foreach ($item in $reportedList) {
    $clean = $item.Trim().Replace("《", "").Replace("》", "").Replace("【", "").Replace("】", "")
    if ($clean -and $cleanedList -notcontains $clean) {
        $cleanedList += $clean
    }
}

# Convert to JSON structure
$outputObj = @{
    reportedTopics = $cleanedList
}

$outputJson = ConvertTo-Json $outputObj -Depth 5
# Write to data/reported_topics.json in UTF-8
[System.IO.File]::WriteAllText($outputPath, $outputJson, [System.Text.Encoding]::UTF8)

Write-Output "Successfully compiled $($cleanedList.Count) unique reported topics into data/reported_topics.json"
