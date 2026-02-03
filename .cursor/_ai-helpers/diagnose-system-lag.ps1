#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Diagnoses system lag by checking CPU, memory, disk, and process activity.

.DESCRIPTION
    Comprehensive system diagnostics script that identifies potential causes of system lag
    and provides actionable recommendations.

.EXAMPLE
    .\diagnose-system-lag.ps1
    Runs the full diagnostic suite and provides recommendations.

.EXAMPLE
    .\diagnose-system-lag.ps1 -KillSuggested
    Runs diagnostics and kills suggested processes automatically.
#>

param(
    [switch]$KillSuggested,
    [switch]$Detailed
)

$ErrorActionPreference = 'SilentlyContinue'

# Colors
$headerColor = 'Cyan'
$warningColor = 'Yellow'
$errorColor = 'Red'
$successColor = 'Green'
$infoColor = 'White'

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor $headerColor
    Write-Host "║  $($Text.PadRight(58))  ║" -ForegroundColor $headerColor
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor $headerColor
}

function Write-Finding {
    param(
        [string]$Category,
        [string]$Message,
        [string]$Severity = 'Info' # Info, Warning, Error, Success
    )
    
    $color = switch ($Severity) {
        'Warning' { $warningColor }
        'Error' { $errorColor }
        'Success' { $successColor }
        default { $infoColor }
    }
    
    $icon = switch ($Severity) {
        'Warning' { '⚠️ ' }
        'Error' { '❌' }
        'Success' { '✅' }
        default { '📋' }
    }
    
    Write-Host "$icon [$Category] " -ForegroundColor $color -NoNewline
    Write-Host $Message -ForegroundColor $infoColor
}

function Write-Suggestion {
    param([string]$Text, [string]$Command = $null)
    Write-Host "   💡 " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor $infoColor
    if ($Command) {
        Write-Host "      Command: " -ForegroundColor Gray -NoNewline
        Write-Host $Command -ForegroundColor Cyan
    }
}

# Initialize results
$findings = @()
$suggestions = @()
$processesToKill = @()

# ============================================================================
# SYSTEM OVERVIEW
# ============================================================================
Write-Header "SYSTEM OVERVIEW"

# CPU Usage
$cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
Write-Host "CPU Usage: " -NoNewline
if ($cpu -gt 80) {
    Write-Host "$cpu%" -ForegroundColor $errorColor
    $findings += "High CPU usage detected"
} elseif ($cpu -gt 50) {
    Write-Host "$cpu%" -ForegroundColor $warningColor
    $findings += "Elevated CPU usage"
} else {
    Write-Host "$cpu%" -ForegroundColor $successColor
}

# Memory Usage
$mem = Get-CimInstance Win32_OperatingSystem
$memUsed = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory)/1MB,2)
$memTotal = [math]::Round($mem.TotalVisibleMemorySize/1MB,2)
$memPercent = [math]::Round(($memUsed/$memTotal)*100,1)

Write-Host "Memory: " -NoNewline
Write-Host "$memUsed GB / $memTotal GB " -NoNewline
if ($memPercent -gt 90) {
    Write-Host "($memPercent%)" -ForegroundColor $errorColor
    $findings += "Critical memory usage"
} elseif ($memPercent -gt 80) {
    Write-Host "($memPercent%)" -ForegroundColor $warningColor
    $findings += "High memory usage"
} else {
    Write-Host "($memPercent%)" -ForegroundColor $successColor
}

# Disk I/O
$diskTime = (Get-Counter '\PhysicalDisk(_Total)\% Disk Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue
Write-Host "Disk Activity: " -NoNewline
if ($diskTime -gt 80) {
    Write-Host "$([math]::Round($diskTime,1))%" -ForegroundColor $errorColor
    $findings += "Disk is bottleneck"
} elseif ($diskTime -gt 50) {
    Write-Host "$([math]::Round($diskTime,1))%" -ForegroundColor $warningColor
} else {
    Write-Host "$([math]::Round($diskTime,1))%" -ForegroundColor $successColor
}

# ============================================================================
# TOP PROCESSES BY CPU
# ============================================================================
Write-Header "TOP 10 CPU CONSUMERS"

$topProcesses = Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 ProcessName, Id, CPU, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}}, @{Name="Threads";Expression={$_.Threads.Count}}

$topProcesses | Format-Table ProcessName, Id, @{Label="CPU";Expression={[math]::Round($_.CPU,2)}}, @{Label="Memory(MB)";Expression={$_.'Memory(MB)'}}, Threads -AutoSize

# ============================================================================
# NX DAEMON CHECK (Project-Specific)
# ============================================================================
Write-Header "NX DAEMON CHECK"

$nxDaemon = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmdLine -match "nx.*daemon.*start\.js"
}

if ($nxDaemon) {
    $nxCpu = $nxDaemon.CPU
    if ($nxCpu -gt 100) {
        Write-Finding "NX Daemon" "NX Daemon consuming high CPU ($([math]::Round($nxCpu,2)))" -Severity Error
        $findings += "NX Daemon stuck"
        $suggestions += @{
            Text = "Reset the NX daemon to stop the high CPU usage"
            Command = "pnpm nx reset"
        }
        $processesToKill += @{Name="NX Daemon"; Process=$nxDaemon; Command="pnpm nx reset"}
    } else {
        Write-Finding "NX Daemon" "Running normally (CPU: $([math]::Round($nxCpu,2)))" -Severity Success
    }
} else {
    Write-Finding "NX Daemon" "Not running" -Severity Info
}

# ============================================================================
# CURSOR/VSCODE PROCESSES
# ============================================================================
Write-Header "CURSOR/VSCODE ANALYSIS"

$cursorProcs = Get-Process Cursor, Code -ErrorAction SilentlyContinue
if ($cursorProcs) {
    $cursorCount = ($cursorProcs | Measure-Object).Count
    $cursorTotalCpu = ($cursorProcs | Measure-Object -Property CPU -Sum).Sum
    $cursorTotalMem = ($cursorProcs | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    
    Write-Host "Total Processes: " -NoNewline
    if ($cursorCount -gt 15) {
        Write-Host "$cursorCount" -ForegroundColor $warningColor
        $findings += "Many Cursor processes"
    } else {
        Write-Host "$cursorCount" -ForegroundColor $successColor
    }
    
    Write-Host "Total CPU: $([math]::Round($cursorTotalCpu,2))" -ForegroundColor $infoColor
    Write-Host "Total Memory: $([math]::Round($cursorTotalMem,2)) MB" -ForegroundColor $infoColor
    
    if ($cursorCount -gt 15) {
        $suggestions += @{
            Text = "Consider reloading Cursor window (Ctrl+Shift+P → Developer: Reload Window)"
            Command = $null
        }
    }
} else {
    Write-Finding "Cursor/VSCode" "Not running" -Severity Info
}

# ============================================================================
# BACKGROUND CULPRITS
# ============================================================================
Write-Header "BACKGROUND CULPRITS CHECK"

# Windows Defender
$defender = Get-Process MsMpEng -ErrorAction SilentlyContinue
if ($defender) {
    $defenderCpu = $defender.CPU
    $defenderMem = [math]::Round($defender.WorkingSet64/1MB,2)
    if ($defenderCpu -gt 200) {
        Write-Finding "Windows Defender" "Actively scanning (CPU: $defenderCpu)" -Severity Warning
        $findings += "Defender scanning"
    } else {
        Write-Finding "Windows Defender" "Running normally (Mem: $defenderMem MB)" -Severity Success
    }
}

# Search Indexer
$search = Get-Process SearchIndexer, SearchHost -ErrorAction SilentlyContinue
if ($search) {
    $searchCpu = ($search | Measure-Object -Property CPU -Sum).Sum
    if ($searchCpu -gt 100) {
        Write-Finding "Windows Search" "Indexing files (CPU: $([math]::Round($searchCpu,2)))" -Severity Warning
        $findings += "Search indexing"
        $suggestions += @{
            Text = "Wait for search indexing to complete, or disable Windows Search"
            Command = "Stop-Service wsearch -Force"
        }
    }
}

# FontBase
$fontbase = Get-Process FontBase -ErrorAction SilentlyContinue
if ($fontbase) {
    $fontbaseCpu = ($fontbase | Measure-Object -Property CPU -Sum).Sum
    if ($fontbaseCpu -gt 50) {
        Write-Finding "FontBase" "Consuming CPU ($([math]::Round($fontbaseCpu,2)))" -Severity Warning
        $findings += "FontBase active"
        $processesToKill += @{Name="FontBase"; Process=$fontbase; Command="Get-Process FontBase | Stop-Process -Force"}
        $suggestions += @{
            Text = "Close FontBase if not actively needed"
            Command = "Get-Process FontBase | Stop-Process -Force"
        }
    }
}

# OneDrive/Cloud Sync
$onedrive = Get-Process OneDrive* -ErrorAction SilentlyContinue
if ($onedrive) {
    $onedriveCpu = ($onedrive | Measure-Object -Property CPU -Sum).Sum
    if ($onedriveCpu -gt 50) {
        Write-Finding "OneDrive" "Syncing files (CPU: $([math]::Round($onedriveCpu,2)))" -Severity Warning
        $findings += "OneDrive syncing"
    }
}

# Generic "Monitor" processes
$monitor = Get-Process Monitor -ErrorAction SilentlyContinue
if ($monitor) {
    $monitorCpu = $monitor.CPU
    if ($monitorCpu -gt 100) {
        Write-Finding "Monitor Process" "High CPU usage ($([math]::Round($monitorCpu,2)))" -Severity Error
        $findings += "Monitor process issue"
        $processesToKill += @{Name="Monitor"; Process=$monitor; Command="Get-Process Monitor | Stop-Process -Force"}
        $suggestions += @{
            Text = "Kill the Monitor process (display/recording utility)"
            Command = "Get-Process Monitor | Stop-Process -Force"
        }
    }
}

# ============================================================================
# BACKGROUND SERVICES
# ============================================================================
if ($Detailed) {
    Write-Header "BACKGROUND SERVICES"
    
    $services = Get-Service | Where-Object {
        $_.Status -eq 'Running' -and (
            $_.Name -like "*update*" -or 
            $_.Name -like "*sync*" -or 
            $_.Name -like "*telemetry*"
        )
    } | Select-Object Name, DisplayName, Status
    
    if ($services) {
        $services | Format-Table -AutoSize
    } else {
        Write-Host "No suspicious services found" -ForegroundColor $successColor
    }
}

# ============================================================================
# SUMMARY & RECOMMENDATIONS
# ============================================================================
Write-Header "SUMMARY & RECOMMENDATIONS"

if ($findings.Count -eq 0) {
    Write-Host "✅ System appears healthy! No major issues detected." -ForegroundColor $successColor
} else {
    Write-Host "Issues Found:" -ForegroundColor $warningColor
    foreach ($finding in $findings) {
        Write-Host "  • $finding" -ForegroundColor $infoColor
    }
}

if ($suggestions.Count -gt 0) {
    Write-Host "`nSuggested Actions:" -ForegroundColor $warningColor
    $i = 1
    foreach ($suggestion in $suggestions) {
        Write-Host "`n$i. " -ForegroundColor Yellow -NoNewline
        Write-Host $suggestion.Text -ForegroundColor $infoColor
        if ($suggestion.Command) {
            Write-Host "   Command: " -ForegroundColor Gray -NoNewline
            Write-Host $suggestion.Command -ForegroundColor Cyan
        }
        $i++
    }
}

# ============================================================================
# AUTO-KILL SUGGESTED PROCESSES
# ============================================================================
if ($KillSuggested -and $processesToKill.Count -gt 0) {
    Write-Host "`n" -NoNewline
    Write-Header "KILLING SUGGESTED PROCESSES"
    
    foreach ($item in $processesToKill) {
        Write-Host "Killing $($item.Name)... " -NoNewline
        try {
            if ($item.Name -eq "NX Daemon") {
                Invoke-Expression "pnpm nx reset" | Out-Null
            } else {
                $item.Process | Stop-Process -Force
            }
            Write-Host "✅ Success" -ForegroundColor $successColor
        } catch {
            Write-Host "❌ Failed: $_" -ForegroundColor $errorColor
        }
    }
    
    Write-Host "`nRe-checking CPU usage..." -ForegroundColor $infoColor
    Start-Sleep -Seconds 2
    $newCpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
    Write-Host "New CPU Usage: $newCpu%" -ForegroundColor $(if ($newCpu -lt $cpu) { $successColor } else { $warningColor })
}

# ============================================================================
# FINAL STATUS
# ============================================================================
Write-Host "`n" -NoNewline
Write-Header "DIAGNOSTIC COMPLETE"
Write-Host "Run with " -NoNewline
Write-Host "-KillSuggested" -ForegroundColor Cyan -NoNewline
Write-Host " to automatically kill problematic processes" -ForegroundColor $infoColor
Write-Host "Run with " -NoNewline
Write-Host "-Detailed" -ForegroundColor Cyan -NoNewline
Write-Host " to see more detailed information" -ForegroundColor $infoColor
Write-Host ""




