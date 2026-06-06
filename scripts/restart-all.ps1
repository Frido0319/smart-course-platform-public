param(
  [int]$Port = 3050,
  [string]$HealthPath = "/activate",
  [switch]$NoBrowser,
  [switch]$NoKill
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutLog = Join-Path $ProjectRoot "tmp-next-3050-current.out.log"
$ErrLog = Join-Path $ProjectRoot "tmp-next-3050-current.err.log"
$Url = "http://localhost:$Port$HealthPath"

function Write-Step($Message) {
  Write-Host "[restart-all] $Message"
}

function Get-ProjectNodeProcesses {
  $escapedRoot = [regex]::Escape($ProjectRoot)
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and
      $_.Name -in @("node.exe", "cmd.exe", "powershell.exe") -and
      $_.CommandLine -match $escapedRoot
    }
}

function Stop-ProjectDevServer {
  if ($NoKill) {
    Write-Step "Skip process cleanup because -NoKill was provided."
    return
  }

  $currentPid = $PID
  $projectProcesses = Get-ProjectNodeProcesses |
    Where-Object {
      $_.ProcessId -ne $currentPid -and
      (
        $_.CommandLine -match "next\\dist\\bin\\next" -or
        $_.CommandLine -match "next\\dist\\server\\lib\\start-server" -or
        $_.CommandLine -match "npm-cli\\.js.*run dev" -or
        $_.CommandLine -match "npm.cmd.*run dev" -or
        $_.CommandLine -match "next dev"
      )
    }

  foreach ($process in $projectProcesses) {
    Write-Step "Stopping project dev process PID $($process.ProcessId)"
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  Start-Sleep -Milliseconds 700

  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($owner -and $owner.CommandLine -match [regex]::Escape($ProjectRoot)) {
      Write-Step "Stopping lingering listener PID $($listener.OwningProcess) on port $Port"
      Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
    } elseif ($owner) {
      throw "Port $Port is occupied by another process, not this project: PID $($owner.ProcessId) $($owner.CommandLine)"
    }
  }
}

function Start-ProjectDevServer {
  Remove-Item -LiteralPath $OutLog, $ErrLog -ErrorAction SilentlyContinue
  Write-Step "Starting Next dev server at http://localhost:$Port"
  Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "-p", "$Port") `
    -WorkingDirectory $ProjectRoot `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -WindowStyle Hidden | Out-Null
}

function Wait-Health {
  Write-Step "Waiting for $Url"
  $deadline = (Get-Date).AddSeconds(60)
  $lastError = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Step "Health check passed: HTTP $($response.StatusCode)"
        return
      }
    } catch {
      $lastError = $_.Exception.Message
    }
    Start-Sleep -Seconds 2
  }

  Write-Host "----- stdout tail -----"
  Get-Content -LiteralPath $OutLog -Tail 80 -ErrorAction SilentlyContinue
  Write-Host "----- stderr tail -----"
  Get-Content -LiteralPath $ErrLog -Tail 80 -ErrorAction SilentlyContinue
  throw "Dev server did not become healthy at $Url. Last error: $lastError"
}

function Open-WithAgentBrowser {
  if ($NoBrowser) {
    Write-Step "Skip agent-browser open because -NoBrowser was provided."
    return
  }

  $agentBrowser = Get-Command agent-browser -ErrorAction SilentlyContinue
  if (-not $agentBrowser) {
    Write-Step "agent-browser is not on PATH; server is running, but browser open was skipped."
    return
  }

  Write-Step "Opening $Url with agent-browser"
  & agent-browser open $Url | Out-Host
}

Set-Location -LiteralPath $ProjectRoot
Stop-ProjectDevServer
Start-ProjectDevServer
Wait-Health
Open-WithAgentBrowser

Write-Step "Ready: $Url"
Write-Step "Logs: $OutLog"
