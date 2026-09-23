# Minimal static file server for local preview (no Node/Python needed).
# Serves the project root (the parent of this .claude folder).
param([int]$Port = 8765)

$root = Split-Path -Parent $PSScriptRoot
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $root at http://localhost:$Port/"

$types = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'
  '.mp4'='video/mp4'; '.webm'='video/webm'; '.mov'='video/quicktime'; '.md'='text/plain; charset=utf-8'
}

while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
    if ($p -eq '') { $p = 'index.html' }
    $f = [IO.Path]::GetFullPath((Join-Path $root $p))
    if ($f.StartsWith($root) -and (Test-Path -LiteralPath $f -PathType Leaf)) {
      $b = [IO.File]::ReadAllBytes($f)
      $t = $types[[IO.Path]::GetExtension($f).ToLower()]
      if ($t) { $c.Response.ContentType = $t }
      $c.Response.ContentLength64 = $b.Length
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch { $c.Response.StatusCode = 500 }
  finally { $c.Response.Close() }
}
