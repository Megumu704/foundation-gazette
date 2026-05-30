$brainDir = "C:\Users\Hubert\.gemini\antigravity\brain\dbd6bef2-0510-40d7-8d0b-3fc3b15a08e5"
Get-ChildItem -Path $brainDir -Filter "*.md" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file
    foreach ($line in $content) {
        if ($line -match "\!\[.*?\]\(.*?\)") {
            Write-Output "$($_.Name): $line"
        }
    }
}
