# Download yt-dlp and FFmpeg for local combine-youtube script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# yt-dlp
$ytdlp = Join-Path $scriptDir "yt-dlp.exe"
if (-not (Test-Path $ytdlp)) {
    Write-Host "Downloading yt-dlp..."
    Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile $ytdlp -UseBasicParsing
    Write-Host "Downloaded yt-dlp.exe"
} else {
    Write-Host "yt-dlp.exe already exists"
}

# FFmpeg (Windows build from BtbN)
$ffmpeg = Join-Path $scriptDir "ffmpeg.exe"
if (-not (Test-Path $ffmpeg)) {
    Write-Host "Downloading FFmpeg (91MB)..."
    $zip = Join-Path $scriptDir "ffmpeg.zip"
    $url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip"
    # Try latest tag - may need to adjust URL
    try {
        Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl-shared.zip" -OutFile $zip -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Host "FFmpeg download failed. Install manually: winget install Gyan.FFmpeg"
        exit 1
    }
    Expand-Archive -Path $zip -DestinationPath (Join-Path $scriptDir "ffmpeg_extract") -Force
    $exe = Get-ChildItem -Path (Join-Path $scriptDir "ffmpeg_extract") -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
    if ($exe) { Copy-Item $exe.FullName $ffmpeg -Force }
    Remove-Item (Join-Path $scriptDir "ffmpeg_extract") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    Write-Host "Downloaded ffmpeg.exe"
} else {
    Write-Host "ffmpeg.exe already exists"
}

Write-Host "Done. Run: npm run combine-youtube -- --urls ""url1"" ""url2"" --title ""My Reel"""
