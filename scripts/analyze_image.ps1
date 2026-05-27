# scripts/analyze_image.ps1
Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\images\img_52a7927436e1bdf2188f3bde04005739.jpg"
$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap $img

$width = $bmp.Width
$height = $bmp.Height

$segments = 10
$segmentWidth = [Math]::Floor($width / $segments)

Write-Host "Image Dimensions: $width x $height"
Write-Host "Analyzing average darkness in $segments segments:"

for ($s = 0; $s -lt $segments; $s++) {
    $xStart = $s * $segmentWidth
    $xEnd = ($s + 1) * $segmentWidth
    
    $totalBrightness = 0
    $sampleCount = 0
    
    for ($x = $xStart; $x -lt $xEnd; $x += 10) {
        for ($y = 0; $y -lt $height; $y += 10) {
            $pixel = $bmp.GetPixel($x, $y)
            $totalBrightness += $pixel.GetBrightness()
            $sampleCount++
        }
    }
    
    $avg = $totalBrightness / $sampleCount
    $darkness = 1.0 - $avg
    
    # Simple output
    Write-Host "Segment $s (X=$xStart..$xEnd): Darkness = $([Math]::Round($darkness * 100))%"
}

$bmp.Dispose()
$img.Dispose()
