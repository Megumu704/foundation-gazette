# scripts/verify_and_download.ps1
# Force TLS 1.2 to prevent modern servers (like Wikipedia) from rejecting connections
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$DraftPath = Join-Path $ProjectRoot "data\draft.json"
$ImagesDir = Join-Path $ProjectRoot "data\images"

# Create images folder if not exists
if (-not (Test-Path $ImagesDir)) {
    New-Item -ItemType Directory -Path $ImagesDir -Force | Out-Null
}

if (-not (Test-Path $DraftPath)) {
    Write-Error "draft.json not found at $DraftPath"
    exit 1
}

Write-Host "Reading draft data from $DraftPath..."
$JsonContent = Get-Content -Path $DraftPath -Raw -Encoding UTF8
$Data = ConvertFrom-Json $JsonContent

$HasChanges = $false

function Verify-And-Download-Image {
    param (
        [string]$Url
    )

    if ([string]::IsNullOrEmpty($Url)) {
        return $Url
    }

    # If it is a local path, verify it exists
    if (-not ($Url.StartsWith("http://") -or $Url.StartsWith("https://"))) {
        $LocalPath = Join-Path $ProjectRoot $Url.Replace("/", "\")
        if (Test-Path $LocalPath) {
            Write-Host "[VERIFIED] Local image exists: $Url"
            return $Url
        } else {
            throw "Local image file not found: $LocalPath"
        }
    }

    Write-Host "[HTTP GET] Verifying and downloading: $Url"
    
    # Generate MD5 hash for filename
    $Md5 = [System.Security.Cryptography.MD5]::Create()
    $HashBytes = $Md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Url))
    $Hash = [System.BitConverter]::ToString($HashBytes).Replace("-", "").ToLower()

    # Determine extension
    $Ext = ".jpg"
    if ($Url -match "\.(png|webp|gif|jpeg|jpg)\b") {
        $Ext = "." + $Matches[1]
    }

    $Filename = "img_$Hash$Ext"
    $Filepath = Join-Path $ImagesDir $Filename
    $RelativePath = "data/images/$Filename"

    # Fetch image using .NET WebClient for maximum speed and header control
    try {
        $UserAgent = "FoundationGazetteBot/1.0 (https://github.com/foundation-gazette/gazette; contact: admin@foundationgazette.org) Powershell/5.1"
        Invoke-WebRequest -Uri $Url -OutFile $Filepath -UserAgent $UserAgent -TimeoutSec 15
        
        # Verify it downloaded a valid file (non-empty)
        $File = Get-Item $Filepath
        if ($File.Length -lt 1024) {
            # Less than 1KB is likely an error page or empty
            Remove-Item $Filepath
            throw "Downloaded file is too small or invalid (less than 1KB)"
        }

        Write-Host "[SUCCESS] Saved to local path: $RelativePath"
        return $RelativePath
    }
    catch {
        Write-Error "Failed to fetch image from URL: $Url. Error: $_"
        throw $_
    }
}

try {
    # 1. Main visual artifact
    if ($Data.visualArtifact -and $Data.visualArtifact.imageUrl) {
        $LocalUrl = Verify-And-Download-Image -Url $Data.visualArtifact.imageUrl
        if ($LocalUrl -ne $Data.visualArtifact.imageUrl) {
            $Data.visualArtifact.imageUrl = $LocalUrl
            $HasChanges = $true
        }
    }

    # 2. Dynamic news
    if ($Data.dynamicNews) {
        foreach ($NewsItem in $Data.dynamicNews) {
            if ($NewsItem.imageUrl) {
                $LocalUrl = Verify-And-Download-Image -Url $NewsItem.imageUrl
                if ($LocalUrl -ne $NewsItem.imageUrl) {
                    $NewsItem.imageUrl = $LocalUrl
                    $HasChanges = $true
                }
            }
        }
    }

    if ($HasChanges) {
        Write-Host "Updating draft.json with local relative image links..."
        # Convert back to JSON
        $RawJson = ConvertTo-Json $Data -Depth 100
        # Unescape only unicode sequences to keep readable Chinese characters without breaking control characters like \n
        $CleanJson = [System.Text.RegularExpressions.Regex]::Replace($RawJson, '\\u([0-9a-fA-F]{4})', {
            param($m) [char][int]"0x$($m.Groups[1].Value)"
        })
        
        # Write file with UTF8 encoding (without BOM)
        $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($DraftPath, $CleanJson, $Utf8NoBom)
        
        Write-Host "[FINISHED] Image links successfully localized."
    } else {
        Write-Host "[FINISHED] No external image link updates needed."
    }
}
catch {
    Write-Host "[FATAL] Image verification failed!"
    exit 1
}
