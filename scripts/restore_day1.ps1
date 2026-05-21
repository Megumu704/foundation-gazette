# scripts/restore_day1.ps1
$gazetteDir = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette"
$brainDir = "C:\Users\Hubert\.gemini\antigravity\brain\6c3e2652-6d76-4f6b-9e55-01ae3a8ffebb"

Write-Host "Downloading Sytin portrait img_7c72c88033879270ca840b07dec040cd.jpg from Wikipedia with custom User-Agent..."
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $WebClient = New-Object System.Net.WebClient
    # Wikimedia requires a descriptive User-Agent
    $UserAgent = "FoundationGazetteBot/1.1 (hubert@example.com; Mozilla/5.0 Windows NT 10.0)"
    $WebClient.Headers.Add("User-Agent", $UserAgent)
    $WebClient.Headers.Add("Accept", "image/webp,image/apng,image/*,*/*;q=0.8")
    
    $WebClient.DownloadFile("https://upload.wikimedia.org/wikipedia/commons/8/8b/Sytin_Ivan_Dmitrievich.jpg", "$gazetteDir\data\images\img_7c72c88033879270ca840b07dec040cd.jpg")
    Write-Host "Sytin portrait downloaded successfully!"
} catch {
    Write-Error "Failed to download Sytin portrait: $_"
}
