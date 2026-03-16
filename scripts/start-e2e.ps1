$ErrorActionPreference = 'Stop'

function Wait-ForPort {
  param(
    [string]$HostName,
    [int]$Port,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $client = $null
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $result = $client.BeginConnect($HostName, $Port, $null, $null)
      if ($result.AsyncWaitHandle.WaitOne(500) -and $client.Connected) {
        $client.EndConnect($result) | Out-Null
        return
      }
    } catch {
      Start-Sleep -Milliseconds 300
    } finally {
      if ($client) {
        $client.Dispose()
      }
    }
  }

  throw "Timed out waiting for $HostName`:$Port"
}

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$backendPython = Join-Path $backendDir '.venv\Scripts\python.exe'
$viteScript = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
$frontendCommand = "`$env:CMG_FRONTEND_PROXY_TARGET='http://127.0.0.1:8010'; node `"$viteScript`" --host 127.0.0.1 --port 4173 --strictPort"

$backend = Start-Process -FilePath $backendPython -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8010' -WorkingDirectory $backendDir -PassThru
$frontend = Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile', '-Command', $frontendCommand -WorkingDirectory $frontendDir -PassThru

try {
  Wait-ForPort -HostName '127.0.0.1' -Port 8010
  Wait-ForPort -HostName '127.0.0.1' -Port 4173

  while ($true) {
    if ($backend.HasExited) {
      throw "backend exited with code $($backend.ExitCode)"
    }

    if ($frontend.HasExited) {
      throw "frontend exited with code $($frontend.ExitCode)"
    }

    Start-Sleep -Seconds 1
  }
} finally {
  if ($backend -and !$backend.HasExited) {
    Stop-Process -Id $backend.Id
  }

  if ($frontend -and !$frontend.HasExited) {
    Stop-Process -Id $frontend.Id
  }
}
