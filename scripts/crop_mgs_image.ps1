# scripts/crop_mgs_image.ps1
Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\images\img_52a7927436e1bdf2188f3bde04005739.jpg"
$tempPath = "C:\Users\Hubert\.gemini\antigravity\scratch\foundation-gazette\data\images\img_52a7927436e1bdf2188f3bde04005739_temp.jpg"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

# Load source image
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

# Crop coordinates to keep Snake centered (X from 1000 to 1920)
$cropX = 1000
$cropY = 0
$cropWidth = 920
$cropHeight = 620

Write-Host "Cropping image: X=$cropX, Y=$cropY, Width=$cropWidth, Height=$cropHeight"

$bmp = New-Object System.Drawing.Bitmap $cropWidth, $cropHeight
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropWidth, $cropHeight
$destRect = New-Object System.Drawing.Rectangle 0, 0, $cropWidth, $cropHeight

$g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Save configuration with high JPEG quality (95%)
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $encoder, 95

# Find JPEG codec
$codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
$jpegCodec = $null
foreach ($codec in $codecs) {
    if ($codec.MimeType -eq "image/jpeg") {
        $jpegCodec = $codec
        break
    }
}

if ($jpegCodec -ne $null) {
    $bmp.Save($tempPath, $jpegCodec, $encoderParams)
} else {
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
}

# Clean up source image handle so we can overwrite it
$g.Dispose()
$bmp.Dispose()
$srcImg.Dispose()

# Overwrite original image with cropped one
Move-Item -Path $tempPath -Destination $srcPath -Force
Write-Host "Successfully cropped and overwrote original image at $srcPath"
