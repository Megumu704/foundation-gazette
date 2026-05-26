$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

Write-Host "======================================================="
Write-Host "   Foundation Gazette PowerShell HTTP Server"
Write-Host "======================================================="
Write-Host " Server starting at http://localhost:$port/"
Write-Host " Press Ctrl+C to stop the server."
Write-Host "-------------------------------------------------------"

try {
    $listener.Start()
    Write-Host "Server successfully started! Listening on port $port..."
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get requested relative path
        $url = $request.Url.LocalPath
        
        if ($request.HttpMethod -eq "POST" -and $url -eq "/save-test-image") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                $reader.Close()
                
                if ($body.StartsWith("data:image/png;base64,")) {
                    $base64Data = $body.Substring("data:image/png;base64,".Length)
                    $bytes = [System.Convert]::FromBase64String($base64Data)
                    
                    $projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
                    $outputPath = Join-Path $projectRoot "test_output_share_card.png"
                    [System.IO.File]::WriteAllBytes($outputPath, $bytes)
                    
                    $response.StatusCode = 200
                    $response.Headers.Add("Access-Control-Allow-Origin", "*")
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes("Image saved successfully to $outputPath")
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                    Write-Host "[200] Saved test image: $outputPath"
                } else {
                    $response.StatusCode = 400
                    $response.Headers.Add("Access-Control-Allow-Origin", "*")
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes("Invalid data URL format")
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                    Write-Host "[400] Invalid POST format"
                }
            } catch {
                $response.StatusCode = 500
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes("Error saving image: $_")
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                Write-Host "[500] Error: $_"
            }
            $response.Close()
            continue
        }
        
        if ($url -eq "/") { $url = "/index.html" }
        
        # Clean up path to prevent traversal and decode URL encoding
        $decodedUrl = [System.Uri]::UnescapeDataString($url)
        $relativePath = $decodedUrl.Replace("/", "\").TrimStart("\")
        
        # Resolve full path
        $projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
        $filePath = Join-Path $projectRoot $relativePath
        $filePath = [System.IO.Path]::GetFullPath($filePath)
        
        # Verify the file is within the project directory to prevent directory traversal
        if (-not $filePath.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            # Determine content type
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/html; charset=utf-8"
            if ($ext -eq ".css") { $contentType = "text/css" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript" }
            elseif ($ext -eq ".json") { $contentType = "application/json; charset=utf-8" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }
            
            # CORS headers to avoid tainted canvas issues
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.ContentType = $contentType
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "[200] Serving: $url"
        } else {
            $response.StatusCode = 404
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "[404] Not Found: $url"
        }
        $response.Close()
    }
}
catch {
    Write-Error "Error starting server: $_"
}
finally {
    $listener.Stop()
}
