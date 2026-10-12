# Static file server for the Mowazafai site.
# Uses the built-in System.Net.HttpListener - no Node, no Python, no install.
# Binds to localhost only, so it needs no administrator rights.
#
# NOTE: this file is deliberately ASCII-only. Windows PowerShell 5.1 reads
# -File scripts using the system ANSI codepage unless the file has a UTF-8
# BOM, which mangles non-ASCII characters and breaks parsing.

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$port = 4173

if (-not (Test-Path $root -PathType Container)) {
  Write-Host "Site folder not found: $root"
  exit 1
}

$rootFull = [System.IO.Path]::GetFullPath($root)

$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.htm'   = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'application/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.webp'  = 'image/webp'
  '.ico'   = 'image/x-icon'
  '.woff'  = 'font/woff'
  '.woff2' = 'font/woff2'
  '.txt'   = 'text/plain; charset=utf-8'
  '.xml'   = 'application/xml; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
  $listener.Start()
} catch {
  Write-Host "Could not bind port $port - probably already in use."
  Write-Host $_.Exception.Message
  exit 1
}

Write-Host "Serving $rootFull"
Write-Host "Ready on http://localhost:$port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  $status = 200
  $rel = ''

  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }

    $path = Join-Path $root $rel
    if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }

    # Match vercel.json "cleanUrls": /privacy -> privacy.html
    if (-not (Test-Path $path -PathType Leaf) -and -not [System.IO.Path]::GetExtension($path)) {
      if (Test-Path "$path.html" -PathType Leaf) { $path = "$path.html" }
    }

    $full = [System.IO.Path]::GetFullPath($path)

    if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      # Refuse to serve anything outside the site folder.
      $status = 403
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
      $res.ContentType = 'text/plain; charset=utf-8'
    }
    elseif (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $ct = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentType = $ct
      # Local dev: never cache, so edits show up on reload.
      $res.Headers.Add('Cache-Control', 'no-store')

      # Mirror the production headers from vercel.json so the CSP is
      # actually exercised locally instead of only in production.
      if ($ext -eq '.html' -or $ext -eq '.htm') {
        $res.Headers.Add('X-Content-Type-Options', 'nosniff')
        $res.Headers.Add('Referrer-Policy', 'strict-origin-when-cross-origin')
        $res.Headers.Add('Content-Security-Policy', ("default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; " +
          "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; " +
          "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'"))
      }
    }
    else {
      $status = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $res.ContentType = 'text/plain; charset=utf-8'
    }

    $res.StatusCode = $status

    if ($ctx.Request.HttpMethod -eq 'HEAD') {
      # A HEAD reply carries headers only. Writing a body here is what
      # produced the "bytes exceed Content-Length" error.
      $res.ContentLength64 = $bytes.Length
      $res.Close()
    }
    else {
      # Close(bytes, willBlock) sets Content-Length and writes the body in one
      # step, so the two can never disagree.
      $res.Close($bytes, $true)
    }
  }
  catch {
    Write-Host "ERR $rel :: $($_.Exception.Message)"
    try { $res.StatusCode = 500 } catch { }
    try { $res.Close() } catch { }
  }

  Write-Host "$status $($ctx.Request.HttpMethod) /$rel"
}
