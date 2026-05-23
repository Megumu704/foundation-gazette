$draft = [System.IO.File]::ReadAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\draft.json", [System.Text.Encoding]::UTF8)
$a2020 = [System.IO.File]::ReadAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive\2026_05_20.json", [System.Text.Encoding]::UTF8)
$a2021 = [System.IO.File]::ReadAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive\2026_05_21.json", [System.Text.Encoding]::UTF8)
$a2022 = [System.IO.File]::ReadAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive\2026_05_22.json", [System.Text.Encoding]::UTF8)
$a2023 = [System.IO.File]::ReadAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive\2026_05_23.json", [System.Text.Encoding]::UTF8)

$jsContent = @"
window.FOUNDATION_ARCHIVES = {
  "draft": $draft,
  "2026.05.23": $a2023,
  "2026.05.22": $a2022,
  "2026.05.21": $a2021,
  "2026.05.20": $a2020
};
"@

[System.IO.File]::WriteAllText("C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\archive_data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully rebuilt archive_data.js"
