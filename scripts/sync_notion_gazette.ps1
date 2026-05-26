# C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\sync_notion_gazette.ps1
# PowerShell script to sync Notion Database topics, call Gemini API, update Notion, and notify Telegram.

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
$geminiApiKey = $GEMINI_API_KEY
$tgToken = $TG_TOKEN
$tgChatId = $TG_CHAT_ID

$mainDbId = "36b59276-212b-8156-b9e8-c84b9f720a28"
$newsDbId = "36b59276-212b-81f5-8e88-de7650513cff"
$draftPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\draft.json"

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

# Helper to Call Gemini API with proper UTF-8 handling
function Call-Gemini ($promptText) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + $geminiApiKey
    
    # System Instruction
    $systemPrompt = Get-DecodedString "5L2g5piv44CO5Z+65Zyw5a245pyD44CP55qEIEFJIOWKqeaJi+OAjuS4ueWwvOeIvuOAj+OAguiri+S4gOW+i+S9v+eUqOe5gemrlOS4reaWh++8iOWPsOeBo++8ieiIh+OAjuaCtumot+eLuOe4vee3qOi8r+OAj+mAsuihjOWwjeetlO+8jOaFi+W6puimquWIh+OAgeaciem7mOWlkeOAgeWFt+acieenkeW5u+iIh+aWh+WMluawo+aBr+OAguWbnuetlOiri+S/neaMgeeyvuewoeS4lOWIh+S4reimgeWus+OAgg=="
    
    $bodyObj = @{
        contents = @(
            @{
                parts = @(
                    @{ text = $promptText }
                )
            }
        )
        systemInstruction = @{
            parts = @(
                @{ text = $systemPrompt }
            )
        }
    }
    
    $bodyJson = ConvertTo-Json $bodyObj -Depth 10
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    $headers = @{ "Content-Type" = "application/json; charset=utf-8" }
    
    $res = Invoke-RestMethod -Uri $url -Method Post -Body $bodyBytes -Headers $headers -TimeoutSec 40
    if ($res.candidates -and $res.candidates[0].content.parts[0].text) {
        return $res.candidates[0].content.parts[0].text
    }
    return $null
}

$colStatus = Get-DecodedString "55m85biD54uA5oWL"
$colPriority = Get-DecodedString "5YSq5YWI6aCG5L2N"
$statusConfirm = Get-DecodedString "56K66KqN55m85biD"
$statusArchive = Get-DecodedString "5bey5q245qqU"
$statusPending = Get-DecodedString "5b6F6JmV55CG"

Write-Host "1. Querying Notion Databases..."

# Query filter with only sorting by Priority
$filterObj = @{
    sorts = @(
        @{
            property = $colPriority
            direction = "ascending"
        }
    )
}
$filterJson = ConvertTo-Json $filterObj -Depth 5
$filterBytes = [System.Text.Encoding]::UTF8.GetBytes($filterJson)

# Query Main Column DB
$mainTopic = ""
$mainPageId = $null
try {
    $mainRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $mainDbId + "/query") -Method Post -Body $filterBytes -Headers $headersNotion
    foreach ($item in $mainRes.results) {
        $statusVal = $item.properties.$colStatus.select.name
        # Select the highest priority item that is neither archived nor confirmed
        if ($statusVal -ne $statusArchive -and $statusVal -ne $statusConfirm) {
            $mainPageId = $item.id
            $titlePropName = Get-DecodedString "5bCI5qyE5Li76aGM"
            if ($item.properties.$titlePropName.title.Count -gt 0) {
                $mainTopic = $item.properties.$titlePropName.title[0].plain_text
            }
            break
        }
    }
} catch {
    Write-Host ("Error querying Main DB: " + $_)
}

# Query News DB
$newsList = @()
$newsIds = @()
try {
    $newsRes = Invoke-RestMethod -Uri ("https://api.notion.com/v1/databases/" + $newsDbId + "/query") -Method Post -Body $filterBytes -Headers $headersNotion
    foreach ($item in $newsRes.results) {
        $statusVal = $item.properties.$colStatus.select.name
        # Select items that are neither archived nor confirmed
        if ($statusVal -ne $statusArchive -and $statusVal -ne $statusConfirm) {
            $newsTitleProp = Get-DecodedString "5paw6IGe5qiZ6aGM"
            if ($item.properties.$newsTitleProp.title.Count -gt 0) {
                $newsList += $item.properties.$newsTitleProp.title[0].plain_text
                $newsIds += $item.id
            }
            # We only need at most 2 news items
            if ($newsList.Count -eq 2) {
                break
            }
        }
    }
} catch {
    Write-Host ("Error querying News DB: " + $_)
}

Write-Host ("Main Topic: " + $mainTopic)
Write-Host ("News Topics Count: " + $newsList.Count)

# 2. Apply Fallback Logic if needed
if (-not $mainTopic) {
    Write-Host "Main Topic is empty! Running fallback prompt..."
    # Fallback main prompt
    $fallbackMainPrompt = Get-DecodedString "6KuL54K65oiR5o6o6Jam5LiA5YCL6Zec5pa86Jed6KGT44CB576O5a2444CB6Zu75b2x5oiW5YuV55Wr55qE5pel5aCx5bCI5qyE5Li76aGM77yM5Y+q6KaB5Zue5YKz5Li76aGM5qiZ6aGM5Y2z5Y+v77yI5LiN6KaB5qiZ6bue56ym6Jmf5oiW6aGN5aSW5paH5a2X77yM5o6n5Yi25ZyoMTXlrZfku6XlhafvvInjgII="
    $mainTopic = Call-Gemini -promptText $fallbackMainPrompt
    $mainTopic = $mainTopic.Trim("`n").Trim("`r").Trim().Trim('"')
    Write-Host ("Fallback Main Topic Selected: " + $mainTopic)
}

while ($newsList.Count -lt 2) {
    Write-Host "News Topics are less than 2! Running fallback prompt..."
    $fallbackNewsPrompt = Get-DecodedString "6KuL5o6o6Jam5YWp5YCL5pyA6L+R5LiA6YCx5YWn54ax6ZaA55qE6YGK5oiy5oiW5YuV55Wr5pmC5LqL5paw6IGe77yM55So5pac57eaICcvJyDliIbpmpTvvIjkvovlpoLvvJrlnLDlubPnt5o255m86KGoIC8g5a6J6Yyr5b2x5bGV5LiW55WM6aaW5pig77yJ44CC5Y+q6KaB5Zue5YKz5Li76aGM77yM5LiN6KaB6aGN5aSW5paH5a2X44CC"
    $newsRaw = Call-Gemini -promptText $fallbackNewsPrompt
    $newsSplits = $newsRaw.Split("/")
    foreach ($n in $newsSplits) {
        $cleanN = $n.Trim("`n").Trim("`r").Trim().Trim('"')
        if ($cleanN -and $newsList.Count -lt 2) {
            $newsList += $cleanN
        }
    }
}

$news1 = $newsList[0]
$news2 = $newsList[1]
Write-Host ("Final selection - Main: $mainTopic | News 1: $news1 | News 2: $news2")

# 3. Call Gemini to write the full Gazette Draft
Write-Host "3. Generating Gazette Content with Gemini..."
$todayStr = (Get-Date).ToString("yyyy.MM.dd")
$promptPrefix = Get-DecodedString "6KuL5qC55pOa5Lul5LiL6YG46aGM77yM54K644CK5Z+65Zyw5pel5aCx44CL5pKw5a+r5LiA5Lu96auY6LOq6YeP55qE57mB6auU5Lit5paH5YWn5a6544CC"
$jsonFormatInst = Get-DecodedString "6KuL55u05o6l5Zue5YKz5LiA5YCL56ym5ZCI5Lul5LiLIEpTT04g5qC85byP55qE5a2X5Liy77yM5LiN6KaB5YyF5ZCrIG1hcmtkb3duIOaomeexpO+8iOWmgiBganNvbiDmqJnoqJjvvInjgILmoLzlvI/ntZDmp4vlpoLkuIvvvJo="

$jsonTemplate = '
{
  "galaxyEra": "FOUNDATION ERA 06",
  "dateString": "__DATE__",
  "coordinates": "SECTOR 2824 / TERMINUS",
  "aestheticSpark": {
    "title": "__MAIN_TOPIC__",
    "fullTitle": "__MAIN_TOPIC__ 深讀",
    "intro": "",
    "content": "",
    "shareCardText": ""
  },
  "guardiansQuote": {
    "quote": "",
    "author": ""
  },
  "dynamicNews": [
    {
      "category": "GAME",
      "headline": "__NEWS1__",
      "summary": "",
      "imageUrl": "data/images/placeholder.jpg"
    },
    {
      "category": "ANIMATION",
      "headline": "__NEWS2__",
      "summary": "",
      "imageUrl": "data/images/placeholder.jpg"
    }
  ]
}
'
$jsonTemplate = $jsonTemplate.Replace("__DATE__", $todayStr)
$jsonTemplate = $jsonTemplate.Replace("__MAIN_TOPIC__", $mainTopic)
$jsonTemplate = $jsonTemplate.Replace("__NEWS1__", $news1)
$jsonTemplate = $jsonTemplate.Replace("__NEWS2__", $news2)

$fullPrompt = $promptPrefix + "`n" + $jsonFormatInst + "`n`n" + $jsonTemplate + "`n`n" +
(Get-DecodedString "6KuL5L6d5pOa5q2k5qC85byP57WQ5qeL77yM5oqK5YWn5a655aGr5YWF5a6M5pW077yI5Li75bCI6aGMIGNvbnRlbnQg6ZyA5o6i6KiO5YW25paH5YyWL+e+juWtuOWFp+a2te+8jOiHs+WwkTYwMOWtl++8jOaZguS6i+aWsOiBniBzdW1tYXJ5IOWIhuWIpeiHs+WwkTMwMOWtl+OAguW8leiogOiIh+WQjeiogOetieeahumcgOWhq+a7v++8ieOAguiri+ebtOaOpeWbnuWCsyBKU09OIOWtl+S4suOAgg==")

$rawJsonResult = Call-Gemini -promptText $fullPrompt
$rawJsonResult = $rawJsonResult.Trim()
if ($rawJsonResult.StartsWith('```json')) {
    $rawJsonResult = $rawJsonResult.Substring(7).Trim([char]10).Trim([char]13).Trim()
}
if ($rawJsonResult.EndsWith('```')) {
    $rawJsonResult = $rawJsonResult.Substring(0, $rawJsonResult.Length - 3).Trim()
}

# Verify and Save locally
try {
    $parsedObj = ConvertFrom-Json $rawJsonResult
    # Save to draft.json
    [System.IO.File]::WriteAllText($draftPath, $rawJsonResult, [System.Text.Encoding]::UTF8)
    Write-Host "Draft saved successfully to draft.json!"
} catch {
    Write-Host "JSON syntax error from Gemini! Writing raw output to debug log."
    Write-Host $rawJsonResult
    exit 1
}

# Helper to write structured text to Notion page body
function Write-ContentToNotionPage ($pageId, $content) {
    if (-not $pageId -or -not $content) { return }
    
    $lines = $content.Split("`n")
    $childrenBlocks = @()
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if (-not $trimmed) { continue }
        
        $block = @{}
        if ($trimmed.StartsWith("#### ")) {
            $headerText = $trimmed.Substring(5).Trim()
            $block = @{
                object = "block"
                type = "heading_3"
                heading_3 = @{
                    rich_text = @( @{ type = "text"; text = @{ content = $headerText } } )
                }
            }
        } elseif ($trimmed.StartsWith("> ")) {
            $quoteText = $trimmed.Substring(2).Trim()
            $block = @{
                object = "block"
                type = "quote"
                quote = @{
                    rich_text = @( @{ type = "text"; text = @{ content = $quoteText } } )
                }
            }
        } else {
            $block = @{
                object = "block"
                type = "paragraph"
                paragraph = @{
                    rich_text = @( @{ type = "text"; text = @{ content = $trimmed } } )
                }
            }
        }
        $childrenBlocks += $block
    }
    
    $chunkSize = 50
    for ($i = 0; $i -lt $childrenBlocks.Count; $i += $chunkSize) {
        $chunk = $childrenBlocks[$i..[Math]::Min($i + $chunkSize - 1, $childrenBlocks.Count - 1)]
        $patchBody = @{ children = $chunk }
        $patchJson = ConvertTo-Json $patchBody -Depth 10
        $patchBytes = [System.Text.Encoding]::UTF8.GetBytes($patchJson)
        
        try {
            $null = Invoke-RestMethod -Uri ("https://api.notion.com/v1/blocks/" + $pageId + "/children") -Method Patch -Body $patchBytes -Headers $headersNotion -ContentType "application/json; charset=utf-8"
        } catch {
            Write-Host ("Failed to append chunk to Notion page $pageId : " + $_)
        }
    }
}

# 4. Write content back to the Notion page of the selected Main Column Topic and News Topics
Write-Host "4. Appending generated drafts to Notion card inner pages..."

if ($mainPageId -ne $null) {
    Write-Host "   Writing Main Essay content..."
    Write-ContentToNotionPage -pageId $mainPageId -content $parsedObj.aestheticSpark.content
}

if ($newsIds.Count -gt 0 -and $newsIds[0] -ne $null) {
    Write-Host "   Writing News 1 content ($($newsIds[0]))..."
    Write-ContentToNotionPage -pageId $newsIds[0] -content $parsedObj.dynamicNews[0].summary
}

if ($newsIds.Count -gt 1 -and $newsIds[1] -ne $null) {
    Write-Host "   Writing News 2 content ($($newsIds[1]))..."
    Write-ContentToNotionPage -pageId $newsIds[1] -content $parsedObj.dynamicNews[1].summary
}

Write-Host "   Notion pages updated successfully!"

# 5. Send Telegram Notification
Write-Host "5. Sending Telegram Notification..."
$sparkIntro = $parsedObj.aestheticSpark.shareCardText
if (-not $sparkIntro) { $sparkIntro = $parsedObj.aestheticSpark.intro }

# Construct message
$msgText = (Get-DecodedString "8J+ToSDln7rlnLDml6XloLHmlrDnqL/lt7Lnt6jnkIblrozmiJDvvIE=") + "`n`n"
$msgText += (Get-DecodedString "5bCI5qyE5Li76aGM77ya") + " " + $mainTopic + "`n"
$msgText += (Get-DecodedString "5paw6IGe6aGM77ya") + " " + $news1 + " / " + $news2 + "`n`n"
$msgText += (Get-DecodedString "LS0tLS0tLS0tLS0tLS0tLS0t") + "`n"
$msgText += $sparkIntro + "`n`n"
$msgText += (Get-DecodedString "6KuL5omT6ZaLIE5vdGlvbiDlhafpoIHkv67mlLnlsIjnlKjnqL/vvIzmgqjnmoTliqnmiYvlt7Lngrrmgqjlr6vlpqXmnJ/nqL/jgII=") + "`n"
$msgText += (Get-DecodedString "6Zqo5pmC5omT6ZaL566h55CG5p2/5Y2z5Y+v5L+u5pS577yM56K66KqN54Sh6Kqk54uA5oWL6YG454K644CM56K66KqN55m85biD44CN5Y2z5pyD6Ieq5YuV55m85biD44CC")

$replyText = [Uri]::EscapeDataString($msgText)
$sendUrl = "https://api.telegram.org/bot" + $tgToken + "/sendMessage?chat_id=" + $tgChatId + "&text=" + $replyText
$null = Invoke-RestMethod -Uri $sendUrl -Method Get

Write-Host "All operations completed successfully!"
