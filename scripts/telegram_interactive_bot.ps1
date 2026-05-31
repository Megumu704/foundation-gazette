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

# Base64 decoder helper
function Get-DecodedString ($base64Str) {
    return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64Str))
}

# Emoji Char Codes (Safe 7-bit ASCII representation for Windows PowerShell tokenizer)
$e_cross = [char]0x274C
$e_status = [char]::ConvertFromUtf32(0x1F4CA)
$e_preview = [char]::ConvertFromUtf32(0x1F4F8)
$e_sync = [char]::ConvertFromUtf32(0x1F504)
$e_publish = [char]::ConvertFromUtf32(0x1F680)
$e_server = [char]::ConvertFromUtf32(0x1F50C)
$e_stop = [char]::ConvertFromUtf32(0x1F6D1)
$e_hello = [char]::ConvertFromUtf32(0x1F44B)
$e_clipboard = [char]::ConvertFromUtf32(0x1F4CB)
$e_galaxy = [char]::ConvertFromUtf32(0x1F30C)
$e_calendar = [char]::ConvertFromUtf32(0x1F4C5)
$e_pin = [char]::ConvertFromUtf32(0x1F4CD)
$e_palette = [char]::ConvertFromUtf32(0x1F3A8)
$e_bulb = [char]::ConvertFromUtf32(0x1F4A1)
$e_news = [char]::ConvertFromUtf32(0x1F4F0)
$e_frame = [char]::ConvertFromUtf32(0x1F5BC)
$e_pencil = [char]0x270F
$e_book = [char]::ConvertFromUtf32(0x1F4D6)
$e_party = [char]::ConvertFromUtf32(0x1F389)
$e_hourglass = [char]0x23F3
$e_check = [char]0x2705
$e_question = [char]0x2753

# Chinese Text Translations (Base64 encoded to bypass terminal code page parser issues)
$txt_unauth = Get-DecodedString "5pyq57aT5o6I5qyK55qE6YCj57ea6KaB5rGC"
$txt_refuse = Get-DecodedString "5Ly65pyN5Zmo5ouS57WV5Z+36KGM5oyH5Luk44CC"
$txt_draft_status = Get-DecodedString "55W25YmN44CK5Z+65Zyw5pa56Yed5pel5aCx44CL6I2J56i/54uA5oWL"
$txt_era = Get-DecodedString "57SA5YWD"
$txt_date = Get-DecodedString "5pel5pyf"
$txt_coords = Get-DecodedString "5bqn5qiZ"
$txt_layout = Get-DecodedString "5L2I5bGA"
$txt_main_topic = Get-DecodedString "5Li75bCI5qyE5Li76aGM"
$txt_news1 = Get-DecodedString "5paw6IGeIDEgKEdBTUUp"
$txt_news2 = Get-DecodedString "5paw6IGeIDIgKEFOSU1BVElPTik="
$txt_cover = Get-DecodedString "6KaW6Ka65pys6auU5bCB6Z2i"
$txt_not_found = Get-DecodedString "5om+5LiN5YiwIGRhdGEvZHJhZnQuanNvbu+8gQ=="
$txt_generating_preview = Get-DecodedString "5q2j5Zyo54K65oKo55Sf5oiQ5pyA5paw55qE56S+576k5YiG5Lqr5Y2h54mH6IiH5o6S54mI5oiq5ZyW77yM6YCZ5aSn57SE6ZyA6KaBIDEwIOenki4uLg=="
$txt_caption_card = Get-DecodedString "56S+576k5YiG5Lqr5Y2h54mHIChTaGFyZSBDYXJkKQ=="
$txt_caption_read = Get-DecodedString "6Zax6K6A5qih5byP5o6S54mIIChSZWFkIE1vZGUp"
$txt_caption_edit = Get-DecodedString "57eo6Lyv5qih5byP5o6S54mIIChFZGl0IE1vZGUp"
$txt_preview_sent = Get-DecodedString "5pyf5YiK6aCQ6Ka96IiH5oiq5ZyW5bey5oiQ5Yqf55m86YCB77yB"
$txt_preview_failed = Get-DecodedString "6aCQ6Ka955Sf5oiQ5aSx5pWX"
$txt_syncing = Get-DecodedString "5q2j5Zyo5b6eIE5vdGlvbiDoiIcgUlNTIOWQjOatpeS4pumHjeaWsOeUn+aIkOiNieeov++8jOWkp+e0hOmcgOimgSAxNSDnp5IuLi4="
$txt_sync_success = Get-DecodedString "5ZCM5q2l5a6M5oiQ77yB5pys5ZywIGRyYWZ0Lmpzb24g6IiHIE5vdGlvbiDpoIHpnaLlt7LmiJDlip/mm7TmlrDjgII="
$txt_sync_failed = Get-DecodedString "5ZCM5q2l5aSx5pWX"
$txt_publishing = Get-DecodedString "5q2j5Zyo54K65oKo5Z+36KGM5LiA6Y2155m85biD6IiH5a2Y5qqU5o6o6YCB5rWB56iL77yM6KuL56iN5YCZLi4u"
$txt_pub_done = Get-DecodedString "55m85biD5aSn5Yqf5ZGK5oiQ77yB"
$txt_pub_success = Get-DecodedString "5pyf5YiK5bey5a2Y5qqU77yMTm90aW9uIOeLgOaFi+W3sumBnuijnO+8jOabtOaUueW3suaOqOmAgeWIsCBHaXRIdWIgbWFzdGVyIOWIhuaUr++8jFRlbGVncmFtIOW7o+aSreeZvOmAgeWujOeVou+8gQ=="
$txt_pub_failed = Get-DecodedString "55m85biD5rWB56iL5Ye66Yyv"
$txt_server_status = Get-DecodedString "5pys5Zyw5Ly65pyN5Zmo54uA5oWL"
$txt_running = Get-DecodedString "5Z+36KGM5LitIChSdW5uaW5nKQ=="
$txt_listen_addr = Get-DecodedString "55uj6IG95L2N5Z2A"
$txt_stopped = Get-DecodedString "5bey5YGc5q2iIChTdG9wcGVkKQ=="
$txt_starting_server = Get-DecodedString "5q2j5Zyo5ZWf5YuV5pys5ZywIFdlYiDkvLrmnI3lmaguLi4="
$txt_stopping_server = Get-DecodedString "5q2j5Zyo5YGc5q2i5pys5ZywIFdlYiDkvLrmnI3lmaguLi4="
$txt_welcome = Get-DecodedString "5oKo5aW977yM5q2h6L+O5L2/55So44CK5Z+65Zyw5pa56Yed44CL5pys5Zyw5Yqp5omL77yB"
$txt_choose = Get-DecodedString "6KuL6YG45pOH5LiL5pa56KaB5Z+36KGM55qE5qGM6Z2i6YCj5YuV5oyH5Luk77ya"
$txt_unknown = Get-DecodedString "5oqx5q2J77yM5oiR5LiN6KqN6K2Y6YCZ5YCL5oyH5Luk"
$txt_received = Get-DecodedString "5bey5pS25Yiw5oKo55qE6KiK5oGv"
$txt_prompt_menu = Get-DecodedString "6KuL6bue6YG45LiL5pa55oyJ6YiV6YG45Zau6YCy6KGM5pON5L2c77yM5oiW55m86YCBIC9tZW51IOmHjeaWsOWRvOWPq+mBuOWWru+8mg=="
$txt_btn_status = Get-DecodedString "5qqi5p+l5pyf5YiK54uA5oWL"
$txt_btn_preview = Get-DecodedString "55Sf5oiQ5pyf5YiK6aCQ6Ka9"
$txt_btn_sync = Get-DecodedString "5ZCM5q2lIE5vdGlvbiDnt6jovK8="
$txt_btn_publish = Get-DecodedString "5Z+36KGM5LiA6Y2155m85biD"
$txt_btn_stop_srv = Get-DecodedString "5YGc5q2i5Ly65pyN5Zmo"
$txt_btn_start_srv = Get-DecodedString "5ZWf5YuV5Ly65pyN5Zmo"
$txt_btn_menu = Get-DecodedString "6L+U5Zue5Li76YG45Zau"

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
                @{ text = "$e_status $txt_btn_status"; callback_data = "status" },
                @{ text = "$e_preview $txt_btn_preview"; callback_data = "preview" }
            ),
            @(
                @{ text = "$e_sync $txt_btn_sync"; callback_data = "sync" },
                @{ text = "$e_publish $txt_btn_publish"; callback_data = "publish" }
            ),
            @(
                @{ text = "$e_server $txt_btn_status $txt_server_status"; callback_data = "server" }
            )
        )
    }
    return ConvertTo-Json $markup -Depth 5
}

# Handle commands
function Handle-TelegramCommand ($chatId, $command, $callbackQueryId = $null) {
    # Security check: authorize only configured chat ID
    if ($chatId -ne $tgChatId) {
        Send-TelegramMessage -chatId $chatId -text "$e_cross $txt_unauth`n$txt_refuse"
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
                $resText = "$e_clipboard *$txt_draft_status*`n`n"
                $resText += "$e_galaxy *$txt_era*: ``$($draft.galaxyEra)```n"
                $resText += "$e_calendar *$txt_date*: ``$($draft.dateString)```n"
                $resText += "$e_pin *$txt_coords*: ``$($draft.coordinates)```n"
                $resText += "$e_palette *$txt_layout*: ``$($draft.layoutScheme)```n`n"
                $resText += "$e_bulb *$txt_main_topic*:`n``$($draft.aestheticSpark.title)```n`n"
                $resText += "$e_news *$txt_news1*:`n``$($draft.dynamicNews[0].headline)```n`n"
                $resText += "$e_news *$txt_news2*:`n``$($draft.dynamicNews[1].headline)```n`n"
                $resText += "$e_frame *$txt_cover*:`n``$($draft.visualArtifact.imageUrl)``"
                Send-TelegramMessage -chatId $chatId -text $resText -replyMarkupJson (Get-MainMenuMarkup)
            } else {
                Send-TelegramMessage -chatId $chatId -text "$e_cross $txt_not_found" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "preview" {
            Send-TelegramMessage -chatId $chatId -text "$e_hourglass *$txt_generating_preview*"
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
                    Send-TelegramPhoto -chatId $chatId -filePath $cardFile -caption "$e_preview $txt_caption_card"
                }
                if (Test-Path $readImg) {
                    Send-TelegramPhoto -chatId $chatId -filePath $readImg -caption "$e_book $txt_caption_read"
                }
                if (Test-Path $editImg) {
                    Send-TelegramPhoto -chatId $chatId -filePath $editImg -caption "$e_pencil $txt_caption_edit"
                }
                
                Send-TelegramMessage -chatId $chatId -text "$e_check *$txt_preview_sent*" -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                Send-TelegramMessage -chatId $chatId -text "$e_cross $($txt_preview_failed): $($_.ToString())" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "sync" {
            Send-TelegramMessage -chatId $chatId -text "$e_hourglass *$txt_syncing*"
            Send-ChatAction -chatId $chatId -action "typing"
            
            try {
                $syncScript = Join-Path $projectRoot "scripts\sync_notion_gazette.ps1"
                $output = powershell.exe -ExecutionPolicy Bypass -File $syncScript
                Write-Host $output
                Send-TelegramMessage -chatId $chatId -text "$e_check *$txt_sync_success*" -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                Send-TelegramMessage -chatId $chatId -text "$e_cross $($txt_sync_failed): $($_.ToString())" -replyMarkupJson (Get-MainMenuMarkup)
            }
        }
        
        "publish" {
            Send-TelegramMessage -chatId $chatId -text "$e_publish *$txt_publishing*"
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
                
                Send-TelegramMessage -chatId $chatId -text "$e_party *$txt_pub_done*`n`n$txt_pub_success" -replyMarkupJson (Get-MainMenuMarkup)
            } catch {
                # Ensure restore even on error
                & git -C $projectRoot checkout -- scripts/publish_and_shift.ps1
                Send-TelegramMessage -chatId $chatId -text "$e_cross $($txt_pub_failed): $($_.ToString())" -replyMarkupJson (Get-MainMenuMarkup)
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
                        @( @{ text = "$e_stop $txt_btn_stop_srv (Port 8080)"; callback_data = "stop_server" } ),
                        @( @{ text = "$txt_btn_menu"; callback_data = "menu" } )
                    )
                }
                Send-TelegramMessage -chatId $chatId -text "$e_server *$txt_server_status*: ``$txt_running```n$($txt_listen_addr): ``http://localhost:8080/```" -replyMarkupJson (ConvertTo-Json $btnMarkup -Depth 5)
            } else {
                $btnMarkup = @{
                    inline_keyboard = @(
                        @( @{ text = "$e_publish $txt_btn_start_srv (Port 8080)"; callback_data = "start_server" } ),
                        @( @{ text = "$txt_btn_menu"; callback_data = "menu" } )
                    )
                }
                Send-TelegramMessage -chatId $chatId -text "$e_cross *$txt_server_status*: ``$txt_stopped```" -replyMarkupJson (ConvertTo-Json $btnMarkup -Depth 5)
            }
        }

        "start_server" {
            Send-TelegramMessage -chatId $chatId -text "$e_hourglass *$txt_starting_server*"
            $startScript = Join-Path $projectRoot "scripts\start_server.ps1"
            $serverLog = Join-Path $projectRoot "scratch\server.log"
            $serverErr = Join-Path $projectRoot "scratch\server_err.log"
            
            Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`"" -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr
            Start-Sleep -Seconds 2
            
            Handle-TelegramCommand -chatId $chatId -command "server"
        }

        "stop_server" {
            Send-TelegramMessage -chatId $chatId -text "$e_hourglass *$txt_stopping_server*"
            
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
            Send-TelegramMessage -chatId $chatId -text "$e_hello *$txt_welcome*\n\n$txt_choose" -replyMarkupJson (Get-MainMenuMarkup)
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
                    Send-TelegramMessage -chatId $chatId -text "$e_question $($txt_unknown): $command" -replyMarkupJson (Get-MainMenuMarkup)
                }
            } else {
                # Fallback for plain text: send menu!
                Send-TelegramMessage -chatId $chatId -text "$e_hello *$txt_received*：``$command```n`n$txt_prompt_menu" -replyMarkupJson (Get-MainMenuMarkup)
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
