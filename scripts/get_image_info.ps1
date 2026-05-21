Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\images\*" -Include *.jpg,*.png
foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        Write-Output "$($file.Name): $($img.Width)x$($img.Height)"
        $img.Dispose()
    } catch {
        # ignore or write error
    }
}
