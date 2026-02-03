# Find device with SSH (port 22) open on network - FAST PARALLEL VERSION
# Usage: .\find-ssh-device.ps1 [-NetworkBase "192.168.1"] [-StartRange 1] [-EndRange 254] [-Timeout 1000] [-MaxThreads 50] [-ShowVerbose]
# Or: .\find-ssh-device.ps1 -IPListFile "ip-scan-list.txt"

param(
    [Parameter(Mandatory=$false)]
    [string]$NetworkBase = "192.168.1",
    
    [Parameter(Mandatory=$false)]
    [int]$StartRange = 1,
    
    [Parameter(Mandatory=$false)]
    [int]$EndRange = 254,
    
    [Parameter(Mandatory=$false)]
    [string]$IPListFile = "",
    
    [Parameter(Mandatory=$false)]
    [int]$Timeout = 300,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxThreads = 100,
    
    [Parameter(Mandatory=$false)]
    [switch]$Continue = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowVerbose = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Loop = $true,
    
    [Parameter(Mandatory=$false)]
    [int]$LoopInterval = 10
)

# Exclusion list - IPs to skip during scan
# Format: "IP" or "IP description"
$excludedIPs = @(
    "192.168.1.101 host.docker.internal"
    # Add more exclusions here:
    # "192.168.1.100 Router"
    # "192.168.1.50 Gateway"
)

if ($Loop) {
    Write-Host "`nScanning for devices with SSH (port 22) open (LOOPING MODE - every ${LoopInterval}s until found)..." -ForegroundColor Cyan
} else {
    Write-Host "`nScanning for devices with SSH (port 22) open (PARALLEL MODE)..." -ForegroundColor Cyan
}

# Show excluded IPs (only on first scan)
if ($excludedIPs.Count -gt 0) {
    Write-Host "`nExcluded IPs (skipping):" -ForegroundColor Yellow
    foreach ($excluded in $excludedIPs) {
        $excludedIP = $excluded -split '\s+' | Select-Object -First 1
        $excludedDesc = if ($excluded -match '\s+(.+)') { $matches[1] } else { "" }
        Write-Host "  - $excludedIP" -NoNewline -ForegroundColor Gray
        if ($excludedDesc) {
            Write-Host " ($excludedDesc)" -NoNewline -ForegroundColor DarkGray
        }
        Write-Host ""
    }
}

# Show scan parameters
if ($IPListFile -and (Test-Path $IPListFile)) {
    Write-Host "Reading IPs from file: $IPListFile" -ForegroundColor Cyan
} else {
    Write-Host "Network: $NetworkBase.x ($StartRange-$EndRange)" -ForegroundColor Cyan
}

Write-Host "Timeout: ${Timeout}ms per IP | Threads: $MaxThreads" -ForegroundColor Cyan
if ($ShowVerbose) {
    Write-Host "Verbose mode: ON" -ForegroundColor Yellow
}
Write-Host ("=" * 60) -ForegroundColor Cyan

# Function to perform a single scan
function Invoke-SingleScan {
    param(
        [string]$NetworkBase,
        [int]$StartRange,
        [int]$EndRange,
        [string]$IPListFile,
        [int]$Timeout,
        [int]$MaxThreads,
        [switch]$Continue,
        [switch]$ShowVerbose,
        [array]$ExcludedIPs
    )
    
    # Determine IP list source
    $ipAddresses = @()
    if ($IPListFile -and (Test-Path $IPListFile)) {
        $ipAddresses = Get-Content $IPListFile | Where-Object { 
            $_ -match '^\d+\.\d+\.\d+\.\d+$' -and $_ -notmatch '^\s*#' 
        } | ForEach-Object { $_.Trim() }
    }
    
    # Build IP list
    if ($ipAddresses.Count -eq 0) {
        # Generate from range
        for ($i = $StartRange; $i -le $EndRange; $i++) {
            $ip = "$NetworkBase.$i"
            
            # Check if IP is excluded
            $isExcluded = $false
            foreach ($excluded in $ExcludedIPs) {
                $excludedIP = $excluded -split '\s+' | Select-Object -First 1
                if ($ip -eq $excludedIP) {
                    $isExcluded = $true
                    break
                }
            }
            
            # Skip excluded IPs
            if (-not $isExcluded) {
                $ipAddresses += $ip
            }
        }
    } else {
        # Filter file IPs against exclusions
        $filteredIPs = @()
        foreach ($ip in $ipAddresses) {
            $isExcluded = $false
            foreach ($excluded in $ExcludedIPs) {
                $excludedIP = $excluded -split '\s+' | Select-Object -First 1
                if ($ip -eq $excludedIP) {
                    $isExcluded = $true
                    break
                }
            }
            if (-not $isExcluded) {
                $filteredIPs += $ip
            }
        }
        $ipAddresses = $filteredIPs
    }
    
    # Create runspace pool for parallel execution
    $runspacePool = [RunspaceFactory]::CreateRunspacePool(1, $MaxThreads)
    $runspacePool.Open()
    
    $jobs = @()
    $foundIPs = [System.Collections.ArrayList]::new()
    $lock = [System.Threading.ReaderWriterLockSlim]::new()
    $checked = 0
    $startTime = Get-Date
    
    # Create jobs for each IP
    foreach ($ip in $ipAddresses) {
        $scriptBlock = {
            param($IP, $TimeoutMs, $Lock, $FoundIPs, $Continue, $ShowVerbose)
            
            # Fast port test - single attempt, no retries
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $tcpClient.ReceiveTimeout = $TimeoutMs
                $tcpClient.SendTimeout = $TimeoutMs
                $tcpClient.NoDelay = $true
                
                $result = $tcpClient.BeginConnect($IP, 22, $null, $null)
                $success = $result.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
                
                if ($success) {
                    try {
                        $tcpClient.EndConnect($result)
                        if ($tcpClient.Connected) {
                            $tcpClient.Close()
                            $portOpen = $true
                        } else {
                            $tcpClient.Close()
                            $portOpen = $false
                        }
                    } catch {
                        $tcpClient.Close()
                        $portOpen = $false
                    }
                } else {
                    $tcpClient.Close()
                    $portOpen = $false
                }
            } catch {
                $portOpen = $false
            }
            
            if ($portOpen) {
                $Lock.EnterWriteLock()
                try {
                    if ($FoundIPs -notcontains $IP) {
                        [void]$FoundIPs.Add($IP)
                    }
                } finally {
                    $Lock.ExitWriteLock()
                }
                return $IP
            }
            return $null
        }
        
        $job = [PowerShell]::Create().AddScript($scriptBlock).AddArgument($ip).AddArgument($Timeout).AddArgument($lock).AddArgument($foundIPs).AddArgument($Continue).AddArgument($ShowVerbose)
        $job.RunspacePool = $runspacePool
        $jobs += [PSCustomObject]@{ Job = $job; IP = $ip; Handle = $job.BeginInvoke() }
    }
    
    # Calculate actual total IPs
    $totalIPs = $ipAddresses.Count
    
    # Monitor progress with early exit
    $maxWaitTime = ($totalIPs / $MaxThreads) * ($Timeout / 1000) + 5  # Estimate max time + buffer
    $waitStart = Get-Date
    
    while ($jobs.Handle | Where-Object { -not $_.IsCompleted }) {
        $completed = ($jobs.Handle | Where-Object { $_.IsCompleted }).Count
        $checked = $completed
        
        # Check if we found something and should stop
        $lock.EnterReadLock()
        try {
            if ($foundIPs.Count -gt 0 -and -not $Continue) {
                # Cancel remaining jobs immediately
                foreach ($job in $jobs) {
                    if (-not $job.Handle.IsCompleted) {
                        try {
                            $job.Job.Stop()
                        } catch {
                            # Ignore errors when stopping
                        }
                    }
                }
                break
            }
        } finally {
            $lock.ExitReadLock()
        }
        
        # Timeout check - don't wait forever
        $elapsed = ((Get-Date) - $waitStart).TotalSeconds
        if ($elapsed -gt $maxWaitTime) {
            break
        }
        
        Start-Sleep -Milliseconds 25
    }
    
    # Collect results
    $results = @()
    foreach ($job in $jobs) {
        try {
            if ($job.Handle.IsCompleted) {
                $result = $job.Job.EndInvoke($job.Handle)
                if ($result) {
                    $results += $result
                }
            }
        } catch {
            # Job was cancelled or failed
        } finally {
            $job.Job.Dispose()
        }
    }
    
    $runspacePool.Close()
    $runspacePool.Dispose()
    $lock.Dispose()
    
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    
    return @{
        FoundIPs = $foundIPs
        Elapsed = $elapsed
        TotalIPs = $totalIPs
    }
}

# Main scanning loop
$scanCount = 0
$foundDevice = $false
$loopStartTime = Get-Date

do {
    $scanCount++
    
    if ($Loop -and $scanCount -gt 1) {
        Write-Host "`n[Scan #$scanCount] Waiting ${LoopInterval}s before next scan..." -ForegroundColor Gray
        Start-Sleep -Seconds $LoopInterval
        Write-Host "[Scan #$scanCount] Starting scan..." -ForegroundColor Cyan
    }
    
    # Perform scan
    $scanResult = Invoke-SingleScan -NetworkBase $NetworkBase -StartRange $StartRange -EndRange $EndRange -IPListFile $IPListFile -Timeout $Timeout -MaxThreads $MaxThreads -Continue:$Continue -ShowVerbose:$ShowVerbose -ExcludedIPs $excludedIPs
    
    # Calculate total elapsed time since loop started
    $totalElapsedSeconds = [math]::Round(((Get-Date) - $loopStartTime).TotalSeconds, 1)
    $totalMinutes = [math]::Floor($totalElapsedSeconds / 60)
    $totalSeconds = [math]::Floor($totalElapsedSeconds % 60)
    
    # Format elapsed time as "XmYs" or "Ys" if less than a minute
    if ($totalMinutes -gt 0) {
        $elapsedDisplay = "${totalMinutes}m${totalSeconds}s"
    } else {
        $elapsedDisplay = "${totalSeconds}s"
    }
    
    Write-Host "`r" -NoNewline
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "Scan #$scanCount Complete (${($scanResult.Elapsed)}s) | Total elapsed: ${elapsedDisplay}" -ForegroundColor Cyan
    
    if ($scanResult.FoundIPs.Count -gt 0) {
        $foundDevice = $true
        Write-Host "`nFound $($scanResult.FoundIPs.Count) device(s) with SSH (port 22) open:" -ForegroundColor Green
        
        # Get additional info for found IPs
        $arpCache = arp -a
        
        foreach ($ip in $scanResult.FoundIPs) {
            Write-Host "`n  ✓ $ip" -ForegroundColor Green
            
            # Try to get hostname
            try {
                $hostname = [System.Net.Dns]::GetHostEntry($ip).HostName
                if ($hostname -ne $ip) {
                    Write-Host "    Hostname: $hostname" -ForegroundColor White
                }
            } catch {
                # Hostname not resolvable
            }
            
            # Get MAC from ARP
            $arpEntry = $arpCache | Select-String $ip
            if ($arpEntry) {
                if ($arpEntry -match '([0-9a-f]{2}[:-]){5}([0-9a-f]{2})') {
                    $mac = $matches[0]
                    Write-Host "    MAC: $mac" -ForegroundColor White
                }
            }
        }
    } else {
        if ($Loop) {
            Write-Host "`nNo devices found. Will retry in ${LoopInterval}s..." -ForegroundColor Yellow
        } else {
            Write-Host "`nNo devices found with port 22 open in range $NetworkBase.$StartRange-$EndRange" -ForegroundColor Yellow
            Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
            Write-Host "  - Increase timeout: -Timeout 2000 (current: ${Timeout}ms)" -ForegroundColor White
            Write-Host "  - Try verbose mode: -ShowVerbose" -ForegroundColor White
            Write-Host "  - Check if device is powered on and connected" -ForegroundColor White
            Write-Host "  - Verify network base (current: $NetworkBase)" -ForegroundColor White
            Write-Host "  - Check router DHCP table for actual IP" -ForegroundColor White
            Write-Host "  - Try scanning specific range: -StartRange 160 -EndRange 180" -ForegroundColor White
            Write-Host "`n  Example with longer timeout:" -ForegroundColor Cyan
            Write-Host "    .\find-ssh-device.ps1 -Timeout 2000 -ShowVerbose" -ForegroundColor Gray
        }
    }
    
} while ($Loop -and -not $foundDevice)

if ($Loop -and $foundDevice) {
    Write-Host "`nDevice found after $scanCount scan(s)!" -ForegroundColor Green
}

Write-Host "`n"

