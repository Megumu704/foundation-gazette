# C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\publish_and_shift.ps1
# PowerShell script to archive published topics in Notion, generate share card, publish to Discord/Telegram, and shift remaining priorities.

$lockFile = "C:\Users\Hubert\.gemini\antigravity\scratch\publish.lock"
if (Test-Path $lockFile) {
    $lockTime = (Get-Item $lockFile).LastWriteTime
    if (((Get-Date) - $lockTime).TotalMinutes -lt 5) {
        Write-Host "Another publish process is currently running. Exiting."
        exit 0
    }
}
New-Item -ItemType File -Path $lockFile -Force | Out-Null

try {

# Load environment variables from .env file
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim().Trim('"').Trim("'")
                Set-Variable -Name $key -Value $value -Scope Script
            }
        }
    }
}

$notionToken = $NOTION_TOKEN
$tgToken = $TG_TOKEN
$tgChatId = $TG_CHAT_ID

# Configuration (Please fill in your Discord Webhook URL here to enable Discord auto-publishing)
$discordWebhookUrl = ""

$mainDbId = "36b59276-212b-8156-b9e8-c84b9f720a28"
$newsDbId = "36b59276-212b-81f5-8e88-de7650513cff"
$draftPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\draft.json"
$outCardPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\test_output_share_card.png"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Base64 decoder helper
function Get-DecodedString ($base64Str) {
    return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64Str))
}

$headersNotion = @{
    "Authorization" = "Bearer " + $notionToken
    "Notion-Version" = "2022-06-28"
    "Content-Type" = "application/json; charset=utf-8"
}

# Column Names and Status Values decoded
$colStatus = Get-DecodedString "55m85biD54uA5oWL"
$colPriority = Get-DecodedString "5YSq5YWI6aCG5L2N"
$colDate = Get-DecodedString "5q245qqU5pel5pyf"

$statusConfirm = Get-DecodedString "56K66KqN55m85biD"
$statusArchive = Get-DecodedString "5bey5q245qqU"
$statusPending = Get-DecodedString "5b6F6JmV55CG"

$todayStr = (Get-Date).ToString("yyyy-MM-dd")

Write-Host "======================================================="
Write-Host "  Foundation Gazette Publish, Card Gen, & Shift Task"
Write-Host "======================================================="

# Step 0: Check if any items are marked for confirmation
Write-Host "Checking Notion databases for items marked as '$statusConfirm'..."
$queryConfirmBody = @{
    filter = @{
        property = $colStatus
        select = @{ equals = $statusConfirm }
    }
}
$queryConfirmJson = ConvertTo-Json $queryConfirmBody -Depth 5
$queryConfirmBytes = [System.Text.Encoding]::UTF8.GetBytes($queryConfirmJson)

$mainConfirmList = @()
$newsConfirmList = @()

try {
    $mainRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $mainDbId + "/query") -Method Post -Body $queryConfirmBytes -Headers $headersNotion
    $mainConfirmList = $mainRes.results
} catch {
    Write-Host "Error querying Main DB: $_"
}

try {
    $newsRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $newsDbId + "/query") -Method Post -Body $queryConfirmBytes -Headers $headersNotion
    $newsConfirmList = $newsRes.results
} catch {
    Write-Host "Error querying News DB: $_"
}

$totalConfirm = $mainConfirmList.Count + $newsConfirmList.Count
if ($totalConfirm -eq 0) {
    Write-Host "No items marked as '$statusConfirm' found. Exiting."
    return
}

Write-Host "Found $totalConfirm items marked as '$statusConfirm'. Proceeding with publishing..."

# Helper function to get text content from a Notion page body
function Get-NotionPageContent ($pageId) {
    $apiUrl = "https://api.notion.com/v1/blocks/" + $pageId + "/children?page_size=100"
    try {
        $res = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headersNotion
        $paragraphs = @()
        foreach ($block in $res.results) {
            $type = $block.type
            $text = ""
            if ($type -eq "paragraph" -and $block.paragraph.rich_text.Count -gt 0) {
                $text = $block.paragraph.rich_text[0].plain_text
            } elseif ($type -eq "heading_3" -and $block.heading_3.rich_text.Count -gt 0) {
                $text = "#### " + $block.heading_3.rich_text[0].plain_text
            } elseif ($type -eq "quote" -and $block.quote.rich_text.Count -gt 0) {
                $text = "> " + $block.quote.rich_text[0].plain_text
            }
            if ($text) {
                $paragraphs += $text
            }
        }
        return ($paragraphs -join "`n")
    } catch {
        Write-Host "   Error fetching content for page $pageId : $_"
        return ""
    }
}

# Sync latest reviews and edits from Notion back to draft.json before rendering
Write-Host "Syncing latest reviews and edits from Notion to draft.json..."
if (Test-Path $draftPath) {
    try {
        $draftJsonRaw = [System.IO.File]::ReadAllText($draftPath, [System.Text.Encoding]::UTF8)
        $draftObj = ConvertFrom-Json $draftJsonRaw
        
        # 1. Sync Main Column
        if ($mainConfirmList.Count -gt 0) {
            $mainItem = $mainConfirmList[0]
            $mainTitleProp = Get-DecodedString "5bCI5qyE5Li76aGM"
            if ($mainItem.properties.$mainTitleProp.title.Count -gt 0) {
                $latestTitle = $mainItem.properties.$mainTitleProp.title[0].plain_text
                $draftObj.aestheticSpark.title = $latestTitle
                $draftObj.aestheticSpark.fullTitle = "$latestTitle " + [char]0x6df1 + [char]0x8b80
            }
            $latestContent = Get-NotionPageContent -pageId $mainItem.id
            if ($latestContent) {
                $draftObj.aestheticSpark.content = $latestContent
            }
        }
        
        # 2. Sync News
        if ($newsConfirmList.Count -gt 0) {
            # Sort news items by Priority ascending
            $sortedNews = $newsConfirmList | Sort-Object { $_.properties.$colPriority.number }
            $newsTitleProp = Get-DecodedString "5paw6IGe5qiZ6aGM"
            
            for ($i = 0; $i -lt [Math]::Min($sortedNews.Count, $draftObj.dynamicNews.Count); $i++) {
                $newsItem = $sortedNews[$i]
                if ($newsItem.properties.$newsTitleProp.title.Count -gt 0) {
                    $draftObj.dynamicNews[$i].headline = $newsItem.properties.$newsTitleProp.title[0].plain_text
                }
                $latestSummary = Get-NotionPageContent -pageId $newsItem.id
                if ($latestSummary) {
                    $draftObj.dynamicNews[$i].summary = $latestSummary
                }
            }
        }
        
        # Save back to draft.json
        $updatedJson = ConvertTo-Json $draftObj -Depth 10
        [System.IO.File]::WriteAllText($draftPath, $updatedJson, [System.Text.Encoding]::UTF8)
        Write-Host "Successfully synced Notion edits back to draft.json."
    } catch {
        Write-Host "Warning: Failed to sync Notion edits to draft.json: $_"
    }
}

# Step 1: Generate Share Card Image using Headless Edge
if (-not (Test-Path $draftPath)) {
    Write-Host "Error: draft.json not found! Cannot publish."
    return
}

# Start local HTTP server if not already running on port 8080
$serverStartedByUs = $false
$portInUse = $null
try {
    $portInUse = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
} catch {}

if (-not $portInUse) {
    Write-Host "Starting local HTTP server on port 8080..."
    $serverLog = "C:\Users\Hubert\.gemini\antigravity\scratch\server.log"
    $serverErr = "C:\Users\Hubert\.gemini\antigravity\scratch\server_err.log"
    $serverProcess = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\start_server.ps1" -PassThru -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr
    $serverStartedByUs = $true
    
    # Poll until server is listening on port 8080 (up to 5 seconds)
    $serverTimeout = 5
    $serverElapsed = 0
    while ($serverElapsed -lt $serverTimeout) {
        $connection = $null
        try {
            $connection = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
        } catch {}
        if ($connection) {
            break
        }
        Start-Sleep -Milliseconds 250
        $serverElapsed += 0.25
    }
} else {
    Write-Host "Local HTTP server is already running."
}

# Delete old card if exists
if (Test-Path $outCardPath) {
    Remove-Item $outCardPath -Force
}

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edgePath)) {
    Write-Host "Error: Microsoft Edge executable not found!"
    return
}

$profilePath = "C:\Users\Hubert\.gemini\antigravity\scratch\edge_profile"
$captureUrl = "http://127.0.0.1:8080/?openShare=true&downloadShare=true"

Write-Host "Launching Headless Edge to generate share card..."
$edgeProcess = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--no-sandbox", "--user-data-dir=$profilePath", $captureUrl -PassThru

# Wait for card generation with 15s timeout
$timeoutSeconds = 15
$intervalMs = 250
$elapsedMs = 0
$fileGenerated = $false

while ($elapsedMs -lt ($timeoutSeconds * 1000)) {
    if (Test-Path $outCardPath) {
        $fileGenerated = $true
        # Wait an extra 200ms to ensure the file write stream is completely closed/flushed
        Start-Sleep -Milliseconds 200
        break
    }
    Start-Sleep -Milliseconds $intervalMs
    $elapsedMs += $intervalMs
}

if (-not $fileGenerated) {
    Write-Host "Warning: Card generation timed out after $timeoutSeconds seconds."
} else {
    Write-Host "Card generated dynamically in $($elapsedMs / 1000) seconds!"
}

# Kill Edge process
try {
    Stop-Process -Id $edgeProcess.Id -Force -ErrorAction SilentlyContinue
} catch {}

# Stop local server if we started it
if ($serverStartedByUs -and $serverProcess) {
    Write-Host "Stopping local HTTP server..."
    try {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}

if (-not (Test-Path $outCardPath)) {
    Write-Host "Error: Failed to generate share card PNG at $outCardPath!"
    return
}
Write-Host "Share card generated successfully!"

# Step 2: Save draft.json to archive and update archive_data.js
$draftJsonRaw = [System.IO.File]::ReadAllText($draftPath, [System.Text.Encoding]::UTF8)
$draftJson = ConvertFrom-Json $draftJsonRaw
$dateStr = $draftJson.dateString
$dateFormatted = $dateStr.Replace(".", "_")
$archiveJsonPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive\$dateFormatted.json"

# Create archive directory if it doesn't exist
$archiveDir = [System.IO.Path]::GetDirectoryName($archiveJsonPath)
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
}

[System.IO.File]::WriteAllText($archiveJsonPath, $draftJsonRaw, [System.Text.Encoding]::UTF8)
Write-Host "Saved draft to archive: $archiveJsonPath"

# Run build_archive_data.ps1 to rebuild the archive fallback
powershell -ExecutionPolicy Bypass -File C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\build_archive_data.ps1 | Out-Null

# Step 3: Construct Teaser Text
$title = $draftJson.aestheticSpark.title
$intro = $draftJson.aestheticSpark.shareCardText
if (-not $intro) { $intro = $draftJson.aestheticSpark.intro }
$era = $draftJson.galaxyEra
$news1 = $draftJson.dynamicNews[0].headline
$news2 = $draftJson.dynamicNews[1].headline

$teaserText = (Get-DecodedString "44CQ") + (Get-DecodedString "5Z+65Zyw5pel5aCx") + " | FOUNDATION GAZETTE" + (Get-DecodedString "44CR") + "`n"
$teaserText += (Get-DecodedString "8J+ThSDlh7rniYjml6XmnJ/vvJo=") + " $dateStr ($era)`n`n"
$teaserText += (Get-DecodedString "4pyoIOacrOacn+e+juWtuOWwiOashO+8mg==") + " $title`n"
if ($intro) { $teaserText += (Get-DecodedString "44CM") + $intro + (Get-DecodedString "44CN") + "`n" }
$teaserText += "`n"
$teaserText += (Get-DecodedString "8J+UpSDmmYLkuovoiIfpgYrmiLLli5XmhYvvvJo=") + "`n"
$teaserText += (Get-DecodedString "8J+TjSA=") + "$news1`n"
$teaserText += (Get-DecodedString "8J+TjSA=") + "$news2`n`n"
$teaserText += (Get-DecodedString "8J+RiSDpu57mk4rpgKPntZDplrHoroDmjpLniYjnvo7nvo7nmoTmlbjkvY3loLHntJnvvJo=") + "`n"
$teaserText += (Get-DecodedString "8J+UlyA=") + "http://localhost:8080/?mode=read&issue=$dateStr`n"

# Step 4: Publish to Discord and Telegram
function Send-Photo-Multipart ($url, $payloadName, $filePath, $caption) {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    $bodyBuilder = New-Object System.Text.StringBuilder
    [void]$bodyBuilder.Append("--$boundary$LF")
    if ($payloadName -eq "photo") {
        # Telegram format
        [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"chat_id`"$LF$LF")
        [void]$bodyBuilder.Append("$tgChatId$LF")
        [void]$bodyBuilder.Append("--$boundary$LF")
        [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"caption`"$LF$LF")
        [void]$bodyBuilder.Append("$caption$LF")
    } else {
        # Discord format
        [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"content`"$LF$LF")
        [void]$bodyBuilder.Append("$caption$LF")
    }
    [void]$bodyBuilder.Append("--$boundary$LF")
    [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"$payloadName`"; filename=`"$fileName`"$LF")
    [void]$bodyBuilder.Append("Content-Type: image/png$LF$LF")
    
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyBuilder.ToString())
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    $requestBytes = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
    [System.Buffer]::BlockCopy($headerBytes, 0, $requestBytes, 0, $headerBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $requestBytes, $headerBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($footerBytes, 0, $requestBytes, ($headerBytes.Length + $fileBytes.Length), $footerBytes.Length)
    
    Invoke-RestMethod -Uri $url -Method Post -Body $requestBytes -Headers $headers
}

# Publish to Telegram
Write-Host "Sending share card and teaser to Telegram..."
try {
    $tgUrl = "https://api.telegram.org/bot$tgToken/sendPhoto"
    Send-Photo-Multipart -url $tgUrl -payloadName "photo" -filePath $outCardPath -caption $teaserText | Out-Null
    Write-Host "   Telegram notification sent successfully!"
} catch {
    Write-Host "   Failed to send to Telegram: $_"
}

# Publish to Discord
if ($discordWebhookUrl) {
    Write-Host "Sending share card and teaser to Discord..."
    try {
        Send-Photo-Multipart -url $discordWebhookUrl -payloadName "file" -filePath $outCardPath -caption $teaserText | Out-Null
        Write-Host "   Discord webhook sent successfully!"
    } catch {
        Write-Host "   Failed to send to Discord: $_"
    }
} else {
    Write-Host "Discord webhook URL is empty, skipping Discord publishing."
}

# Helper function to archive a page
function Archive-Page ($pageId, $isNews) {
    $statusId = "~%5B%3DR"
    $dateId = "Nefc"
    $priorityId = "e%5B%40Z"
    if ($isNews) {
        $statusId = "rv%40Q"
        $dateId = "%7DopY"
        $priorityId = "%40chL"
    }

    $bodyObj = @{
        properties = @{
            "$statusId" = @{
                select = @{ name = $statusArchive }
            }
            "$dateId" = @{
                date = @{ start = $todayStr }
            }
            "$priorityId" = @{
                number = $null
            }
        }
    }
    $bodyJson = ConvertTo-Json $bodyObj -Depth 5
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    
    $url = "https://api.notion.com/v1/pages/" + $pageId
    try {
        $null = Invoke-RestMethod -Uri $url -Method Patch -Body $bodyBytes -Headers $headersNotion -ContentType "application/json; charset=utf-8"
        Write-Host "   Archived page: $pageId"
    } catch {
        Write-Host "   Failed to archive page $pageId : $_"
    }
}

# Helper function to update page priority
function Update-PagePriority ($pageId, $newPriority, $isNews) {
    $priorityId = "e%5B%40Z"
    if ($isNews) {
        $priorityId = "%40chL"
    }
    $bodyObj = @{
        properties = @{
            "$priorityId" = @{
                number = $newPriority
            }
        }
    }
    $bodyJson = ConvertTo-Json $bodyObj -Depth 5
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    
    $url = "https://api.notion.com/v1/pages/" + $pageId
    try {
        $null = Invoke-RestMethod -Uri $url -Method Patch -Body $bodyBytes -Headers $headersNotion -ContentType "application/json; charset=utf-8"
        Write-Host "   Updated page $pageId priority to: $newPriority"
    } catch {
        Write-Host "   Failed to update page $pageId priority: $_"
    }
}

# Process Main Essay DB
Write-Host "1. Processing Main DB..."
foreach ($item in $mainConfirmList) {
    Archive-Page -pageId $item.id -isNews $false
}
if ($mainConfirmList.Count -gt 0) {
    Write-Host "   Shifting remaining main essay priorities..."
    $queryAllBody = @{}
    $queryAllJson = ConvertTo-Json $queryAllBody
    $queryAllBytes = [System.Text.Encoding]::UTF8.GetBytes($queryAllJson)
    
    try {
        $pendingRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $mainDbId + "/query") -Method Post -Body $queryAllBytes -Headers $headersNotion
        foreach ($item in $pendingRes.results) {
            $statusVal = $item.properties.$colStatus.select.name
            if ($statusVal -ne $statusArchive -and $mainConfirmList.id -notcontains $item.id) {
                $currentPriority = $item.properties.$colPriority.number
                if ($currentPriority -ne $null) {
                    $newPriority = [Math]::Max(1, $currentPriority - 1)
                    Update-PagePriority -pageId $item.id -newPriority $newPriority -isNews $false
                }
            }
        }
    } catch {
        Write-Host "   Error shifting main DB priorities: $_"
    }
}

# Process News DB
Write-Host "2. Processing News DB..."
foreach ($item in $newsConfirmList) {
    Archive-Page -pageId $item.id -isNews $true
}
$archivedCount = $newsConfirmList.Count
if ($archivedCount -gt 0) {
    Write-Host "   Shifting remaining news priorities by -$archivedCount..."
    $queryAllBody = @{}
    $queryAllJson = ConvertTo-Json $queryAllBody
    $queryAllBytes = [System.Text.Encoding]::UTF8.GetBytes($queryAllJson)
    
    try {
        $pendingRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $newsDbId + "/query") -Method Post -Body $queryAllBytes -Headers $headersNotion
        foreach ($item in $pendingRes.results) {
            $statusVal = $item.properties.$colStatus.select.name
            if ($statusVal -ne $statusArchive -and $newsConfirmList.id -notcontains $item.id) {
                $currentPriority = $item.properties.$colPriority.number
                if ($currentPriority -ne $null) {
                    $newPriority = [Math]::Max(1, $currentPriority - $archivedCount)
                    Update-PagePriority -pageId $item.id -newPriority $newPriority -isNews $true
                }
            }
        }
    } catch {
        Write-Host "   Error shifting news DB priorities: $_"
    }
}

    # Step 6: Commit and push changes to GitHub
    Write-Host "Step 6: Committing and pushing changes to GitHub..."
    try {
        $projectRoot = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette"
        & git -C $projectRoot add data/draft.json data/archive_data.js data/archive/*.json data/images/*
        $commitMsg = "Publish issue for $dateStr"
        & git -C $projectRoot commit -m $commitMsg
        & git -C $projectRoot push origin master
        Write-Host "   Successfully pushed changes to GitHub!"
    } catch {
        Write-Host "   Failed to commit/push to GitHub: $_"
    }

    Write-Host "All shift operations completed successfully!"
} finally {
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }
}
