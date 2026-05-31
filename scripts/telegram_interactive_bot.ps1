# C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\scripts\telegram_interactive_bot.ps1
# Interactive Telegram Bot to control Foundation Gazette desktop builds from mobile.

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $projectRoot ".env"

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

$tgToken = $TG_TOKEN
$tgChatId = $TG_CHAT_ID

if (-not $tgToken -or -not $tgChatId) {
    Write-Error "TG_TOKEN or TG_CHAT_ID is missing in .env file!"
    exit 1
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Helper to send a text message
function Send-TelegramMessage ($chatId, $text, $replyMarkupJson = $null) {
    $body = @{
        chat_id = $chatId
        text = $text
        parse_mode = "Markdown"
    }
    if ($replyMarkupJson) {
        $body.reply_markup = ConvertFrom-Json $replyMarkupJson
    }
    $bodyJson = ConvertTo-Json $body -Depth 10
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
    
    $url = "https://api.telegram.org/bot$tgToken/sendMessage"
    try {
        $null = Invoke-RestMethod -Uri $url -Method Post -Body $bodyBytes -Headers @{"Content-Type" = "application/json; charset=utf-8"}
    } catch {
        Write-Host "Error sending message: $_"
    }
}

# Helper to send a typing action
function Send-ChatAction ($chatId, $action = "typing") {
    $url = "https://api.telegram.org/bot$tgToken/sendChatAction?chat_id=$chatId&action=$action"
    try { $null = Invoke-RestMethod -Uri $url -Method Get } catch {}
}

# Multipart photo sender
function Send-TelegramPhoto ($chatId, $filePath, $caption = "") {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    $headers = @{ "Content-Type" = "multipart/form-data; boundary=$boundary" }
    
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    $bodyBuilder = New-Object System.Text.StringBuilder
    [void]$bodyBuilder.Append("--$boundary$LF")
    [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"chat_id`"$LF$LF")
    [void]$bodyBuilder.Append("$chatId$LF")
    if ($caption) {
        [void]$bodyBuilder.Append("--$boundary$LF")
        [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"caption`"$LF$LF")
        [void]$bodyBuilder.Append("$caption$LF")
    }
    [void]$bodyBuilder.Append("--$boundary$LF")
    [void]$bodyBuilder.Append("Content-Disposition: form-data; name=`"photo`"; filename=`"$fileName`"$LF")
    [void]$bodyBuilder.Append("Content-Type: image/png$LF$LF")
    
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyBuilder.ToString())
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    $requestBytes = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
    [System.Buffer]::BlockCopy($headerBytes, 0, $requestBytes, 0, $headerBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $requestBytes, $headerBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($footerBytes, 0, $requestBytes, ($headerBytes.Length + $fileBytes.Length), $footerBytes.Length)
    
    $url = "https://api.telegram.org/bot$tgToken/sendPhoto"
    try {
        $null = Invoke-RestMethod -Uri $url -Method Post -Body $requestBytes -Headers $headers
    } catch {
        Write-Host "Error sending photo: $_"
    }
}

# Build Menu Markup
function Get-MainMenuMarkup {
    $markup = @{
        inline_keyboard = @(
            @(
                @{ text = "[Status] Check Issue Status"; callback_data = "status" },
                @{ text = "[Preview] Generate Preview"; callback_data = "preview" }
            ),
            @(
                @{ text = "[Sync] Sync Notion Edits"; callback_data = "sync" },
                @{ text = "[Publish] Launch Publication"; callback_data = "publish" }
            ),
            @(
                @{ text = "[Server] Local Web Server"; callback_data = "server" }
            )
        )
    }
    return ConvertTo-Json $markup -Depth 5
}

# Handle commands
function Handle-TelegramCommand ($chatId, $command, $callbackQueryId = $null) {
    # Security check: authorize only configured chat ID
    if ($chatId -ne $tgChatId) {
        Send-TelegramMessage -chatId $chatId -text "[x] Unauthorized Access Blocked."
        return
    }

    # Acknowledge callback query to stop loading spinner
    if ($callbackQueryId) {
        $ackUrl = "https://api.telegram.org/bot$tgToken/answerCallbackQuery?callback_query_id=$callbackQueryId"
        try { $null = Invoke-RestMethod -Uri $ackUrl -Method Get } catch {}
    }

    switch ($command) {
        "status" {
            Send-ChatAction -chatId $chatId
            $draftPath = Join-Path $projectRoot "data\draft.json"
            if (Test-Path $draftPath) {
                $draft = Get-Content $draftPath -Raw | ConvertFrom-Json
                $resText = "[Draft Info] Current Issue Status:`n`n"
                $resText += "*Era*: `$($draft.galaxyEra)`\n"
                $resText += "*Date*: `$($draft.dateString)`\n"
                $resText += "*Coordinates*: `$($draft.coordinates)`\n"
                $resText += "*Layout*: `$($draft.layoutScheme)`\n`n"
                $resText += "*Main Topic*:`n``$($draft.aestheticSpark.title)``\n`n"
                $resText += "*News 1 (GAME)*:`n``$($draft.dynamicNews[0].headline)``\n`n"
                $resText += "*News 2 (ANIMATION)*:`n``$($draft.dynamicNews[1].headline)``\n`n"
                $resText += "*Cover Visual*:`n``$($draft.visualArtifact.imageUrl)``"
                Send-TelegramMessage -chatId $chatId -text $resText -replyMarkupJson (Get-MainMenuMarkup)
            } else {
                Send-TelegramMessage -chatId $chatId -text "[x] Error: data/draft.json not found!" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "preview" {
            Send-TelegramMessage -chatId $chatId -text "[...] Generating social share card and screenshots, please wait 10 seconds..."
            Send-ChatAction -chatId $chatId -action "upload_photo"
            
            # Run card gen and screenshot scripts
            try {
                $cardScript = Join-Path $projectRoot "scripts\generate_card.ps1"
                $screenScript = Join-Path $projectRoot "scripts\take_screenshots.ps1"
                
                # Run card gen
                powershell.exe -ExecutionPolicy Bypass -File $cardScript | Out-Null
                # Run screenshots
                powershell.exe -ExecutionPolicy Bypass -File $screenScript | Out-Null
                
                # Locate output images
                $cardFile = Join-Path $projectRoot "test_output_share_card.png"
                
                # Dynamic suffix calculation matching take_screenshots.ps1
                $archiveDir = Join-Path $projectRoot "data\archive"
                $archiveCount = 0
                if (Test-Path $archiveDir) { $archiveCount = (Get-ChildItem $archiveDir -Filter *.json).Count }
                $issueSuffix = [string]($archiveCount + 1)
                $issueSuffix = $issueSuffix.PadLeft(3, '0')
                
                $brainDir = "C:\Users\Hubert\.gemini\antigravity\brain\dbd6bef2-0510-40d7-8d0b-3fc3b15a08e5"
                $readImg = Join-Path $brainDir "render_read_mode_$($issueSuffix).png"
                $editImg = Join-Path $brainDir "render_edit_mode_$($issueSuffix).png"
                
                if (Test-Path $cardFile) {
                    Send-TelegramPhoto -chatId $chatId -filePath $cardFile -caption "[Preview] Social Share Card"
                }
                if (Test-Path $readImg) {
                    Send-TelegramPhoto -chatId $chatId -filePath $readImg -caption "[Preview] Read Mode Layout"
                }
                if (Test-Path $editImg) {
                    Send-TelegramPhoto -chatId $chatId -filePath $editImg -caption "[Preview] Edit Mode Layout"
                }
                
                Send-TelegramMessage -chatId $chatId -text "[Success] Visual preview files sent!" -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                Send-TelegramMessage -chatId $chatId -text "[x] Preview Generation Failed: $_" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "sync" {
            Send-TelegramMessage -chatId $chatId -text "[...] Syncing contents from Notion and rebuild draft, please wait 15 seconds..."
            Send-ChatAction -chatId $chatId -action "typing"
            
            try {
                $syncScript = Join-Path $projectRoot "scripts\sync_notion_gazette.ps1"
                $output = powershell.exe -ExecutionPolicy Bypass -File $syncScript
                Write-Host $output
                Send-TelegramMessage -chatId $chatId -text "[Success] Notion sync completed! Local draft.json updated." -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                Send-TelegramMessage -chatId $chatId -text "[x] Sync Failed: $_" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "publish" {
            Send-TelegramMessage -chatId $chatId -text "[...] Launching one-click publication workflow..."
            Send-ChatAction -chatId $chatId -action "typing"
            
            try {
                # 1. Ensure the Notion status is set to Confirm
                $confirmScript = Join-Path $projectRoot "scratch\mark_confirm.ps1"
                if (Test-Path $confirmScript) {
                    powershell.exe -ExecutionPolicy Bypass -File $confirmScript | Out-Null
                }
                
                # 2. Comment out sync block in publish script temporarily to protect local draft customizations
                $pubScript = Join-Path $projectRoot "scripts\publish_and_shift.ps1"
                $content = Get-Content $pubScript -Raw
                # Comment it out if not already commented out
                if ($content -like "*# Sync latest reviews and edits*") {
                    $commented = $content.Replace('Write-Host "Syncing latest reviews and edits back to draft.json..."', '<#`nWrite-Host "Syncing latest reviews and edits back to draft.json..."')
                    
                    $toFind = 'Successfully synced Notion edits back to draft.json."' + "`r`n" + '    } catch {' + "`r`n" + '        Write-Host "Warning: Failed to sync Notion edits to draft.json: $_"' + "`r`n" + '    }' + "`r`n" + '}'
                    # Try both CRLF and LF formats to be safe
                    $commented = $commented.Replace($toFind, $toFind + "`r`n#>")
                    $toFindLF = 'Successfully synced Notion edits back to draft.json."' + "`n" + '    } catch {' + "`n" + '        Write-Host "Warning: Failed to sync Notion edits to draft.json: $_"' + "`n" + '    }' + "`n" + '}'
                    $commented = $commented.Replace($toFindLF, $toFindLF + "`n#>")
                    
                    [System.IO.File]::WriteAllText($pubScript, $commented, [System.Text.Encoding]::UTF8)
                }
                
                # 3. Execute publish script
                $pubOutput = powershell.exe -ExecutionPolicy Bypass -File $pubScript
                
                # 4. Restore the publish script to standard master via git
                & git -C $projectRoot checkout -- scripts/publish_and_shift.ps1
                
                Send-TelegramMessage -chatId $chatId -text "[Success] Gazette published successfully!`nArchive saved, Notion shifted, and changes pushed to GitHub." -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                # Ensure restore even on error
                & git -C $projectRoot checkout -- scripts/publish_and_shift.ps1
                Send-TelegramMessage -chatId $chatId -text "[x] Publication Failed: $_" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "server" {
            $portInUse = $null
            try {
                $portInUse = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
            } catch {}
            
            if ($portInUse) {
                $btnMarkup = @{
                    inline_keyboard = @(
                        @( @{ text = "🛑 Stop Server (Port 8080)"; callback_data = "stop_server" } ),
                        @( @{ text = "⬅ Back to Main Menu"; callback_data = "menu" } )
                    )
                }
                Send-TelegramMessage -chatId $chatId -text "[Server Info] Local HTTP Server is: Running`nURL: http://localhost:8080/" -replyMarkupJson (ConvertTo-Json $btnMarkup -Depth 5)
            } else {
                $btnMarkup = @{
                    inline_keyboard = @(
                        @( @{ text = "▶ Start Server (Port 8080)"; callback_data = "start_server" } ),
                        @( @{ text = "⬅ Back to Main Menu"; callback_data = "menu" } )
                    )
                }
                Send-TelegramMessage -chatId $chatId -text "[Server Info] Local HTTP Server is: Stopped" -replyMarkupJson (ConvertTo-Json $btnMarkup -Depth 5)
            }
        }

        "start_server" {
            Send-TelegramMessage -chatId $chatId -text "[...] Starting local web server..."
            $startScript = Join-Path $projectRoot "scripts\start_server.ps1"
            $serverLog = Join-Path $projectRoot "scratch\server.log"
            $serverErr = Join-Path $projectRoot "scratch\server_err.log"
            
            Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`"" -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr
            Start-Sleep -Seconds 2
            
            Handle-TelegramCommand -chatId $chatId -command "server"
        }

        "stop_server" {
            Send-TelegramMessage -chatId $chatId -text "[...] Stopping local web server..."
            
            # Find and stop port 8080 process
            $connections = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
            if ($connections) {
                foreach ($c in $connections) {
                    try {
                        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
                    } catch {}
                }
            }
            Start-Sleep -Seconds 1
            
            Handle-TelegramCommand -chatId $chatId -command "server"
        }
        
        "menu" {
            Send-TelegramMessage -chatId $chatId -text "Hello, welcome to the Foundation Gazette Desktop Assistant!`n`nPlease select a command to trigger on your desktop:" -replyMarkupJson (Get-MainMenuMarkup)
        }

        default {
            # Check text command fallbacks
            if ($command.StartsWith("/")) {
                $cmdName = $command.TrimStart("/").ToLower()
                if ($cmdName -eq "start" -or $cmdName -eq "help" -or $cmdName -eq "menu") {
                    Handle-TelegramCommand -chatId $chatId -command "menu"
                } elseif ($cmdName -eq "status") {
                    Handle-TelegramCommand -chatId $chatId -command "status"
                } elseif ($cmdName -eq "preview") {
                    Handle-TelegramCommand -chatId $chatId -command "preview"
                } elseif ($cmdName -eq "sync") {
                    Handle-TelegramCommand -chatId $chatId -command "sync"
                } elseif ($cmdName -eq "publish") {
                    Handle-TelegramCommand -chatId $chatId -command "publish"
                } elseif ($cmdName -eq "server") {
                    Handle-TelegramCommand -chatId $chatId -command "server"
                } else {
                    Send-TelegramMessage -chatId $chatId -text "Unknown command: $command" -replyMarkupJson (Get-MainMenuMarkup)
                }
            } else {
                # Fallback for plain text: send menu!
                Send-TelegramMessage -chatId $chatId -text "Received message: `$command``n`nPlease use the menu buttons below to interact with the desktop:" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
    }
}

# Polling loop initialization
Write-Host "-------------------------------------------------------"
Write-Host "   Telegram Gazette Interactive Assistant Bot"
Write-Host "-------------------------------------------------------"
Write-Host " Listening for mobile requests from Chat ID $tgChatId..."
Write-Host " Press Ctrl+C to exit and stop the bot."
Write-Host "-------------------------------------------------------"

# Send start greeting to the user
Handle-TelegramCommand -chatId $tgChatId -command "menu"

$offset = 0
# Retrieve latest offset first to avoid processing stale historical messages
try {
    $initialRes = Invoke-RestMethod -Uri "https://api.telegram.org/bot$tgToken/getUpdates?limit=1&offset=-1" -TimeoutSec 10
    if ($initialRes.result -and $initialRes.result.Count -gt 0) {
        $offset = $initialRes.result[0].update_id + 1
    }
} catch {
    Write-Host "Warning: Initial offset fetch failed: $_"
}

while ($true) {
    try {
        $url = "https://api.telegram.org/bot$tgToken/getUpdates?offset=$offset&timeout=15"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 20
        
        if ($response.ok -and $response.result.Count -gt 0) {
            foreach ($update in $response.result) {
                $offset = $update.update_id + 1
                
                # Check for callback queries (inline button clicks)
                if ($update.callback_query) {
                    $cq = $update.callback_query
                    $cqChatId = $cq.message.chat.id
                    $cqData = $cq.data
                    $cqId = $cq.id
                    
                    Write-Host "[TG Callback] Chat ID: $cqChatId | Data: $cqData"
                    Handle-TelegramCommand -chatId $cqChatId -command $cqData -callbackQueryId $cqId
                }
                # Check for direct text messages
                elseif ($update.message) {
                    $msg = $update.message
                    $msgChatId = $msg.chat.id
                    $msgText = $msg.text
                    
                    if ($msgText) {
                        Write-Host "[TG Text] Chat ID: $msgChatId | Text: $msgText"
                        Handle-TelegramCommand -chatId $msgChatId -command $msgText
                    }
                }
            }
        }
    } catch {
        Write-Host "Network or Polling Error: $_"
        Start-Sleep -Seconds 3 # Back off briefly on error
    }
    Start-Sleep -Milliseconds 250
}
