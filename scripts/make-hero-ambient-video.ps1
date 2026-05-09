# Regenerate assets/videos/hero-live-bw-loop.mp4 from a still (slow zoom).
# Requires FFmpeg (e.g. winget install Gyan.FFmpeg).

param(
  [string]$InputImage = "",
  [string]$OutputVideo = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not $InputImage) {
  $InputImage = Join-Path $projectRoot "assets/images/havard-live-bw-semihollow.png"
}
if (-not $OutputVideo) {
  $OutputVideo = Join-Path $projectRoot "assets/videos/hero-live-bw-loop.mp4"
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutputVideo) | Out-Null

$ffexe = $null
try {
  $ffexe = (Get-Command ffmpeg -ErrorAction Stop).Source
} catch {
  $found = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($found) {
    $ffexe = $found.FullName
  }
}

if (-not $ffexe) {
  Write-Error "ffmpeg not found. Install with: winget install Gyan.FFmpeg"
  exit 1
}

Write-Host "Using $ffexe"
# hue=s=0 = grayscale; slow zoom for cinematic loop (single-artist wallpaper)
& $ffexe -y -loop 1 -i $InputImage `
  -vf "scale=2560:-2:flags=lanczos,hue=s=0,eq=contrast=1.06:brightness=-0.02,zoompan=z='if(eq(on,1),1,zoom+0.00032)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,format=yuv420p" `
  -t 14 -c:v libx264 -preset medium -crf 21 -movflags +faststart $OutputVideo

Write-Host "Wrote $OutputVideo"
