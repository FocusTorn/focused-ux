# Fix static IP configuration on SD card
# Removes or corrects static IP settings that prevent network connection
# Usage: .\fix-static-ip-sdcard.ps1 -SDCardPath "\\wsl$\Debian\home\pi\sdcard_data" [-RemoveStaticIP] [-FixStaticIP] [-IPAddress "192.168.1.177"] [-Gateway "192.168.1.1"] [-DNS "192.168.1.1"]

param(
    [Parameter(Mandatory=$true)]
    [string]$SDCardPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$RemoveStaticIP = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixStaticIP = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$IPAddress = "192.168.1.177",
    
    [Parameter(Mandatory=$false)]
    [string]$Gateway = "192.168.1.1",
    
    [Parameter(Mandatory=$false)]
    [string]$DNS = "192.168.1.1"
)

Write-Host "`nFixing static IP configuration on SD card..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Check if SD card path exists
if (-not (Test-Path $SDCardPath)) {
    Write-Host "ERROR: SD card path does not exist: $SDCardPath" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure WSL is running" -ForegroundColor White
    Write-Host "  2. Check if the path is correct" -ForegroundColor White
    Write-Host "  3. Try accessing via: wsl ls $SDCardPath" -ForegroundColor White
    exit 1
}

Write-Host "`n✓ SD card path accessible: $SDCardPath" -ForegroundColor Green

# Determine boot path
$bootPath = Join-Path $SDCardPath "boot"
$rootPath = $SDCardPath

if (-not (Test-Path $bootPath)) {
    if (Test-Path (Join-Path $rootPath "dietpi.txt")) {
        $bootPath = $rootPath
    } else {
        Write-Host "ERROR: Boot partition not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Boot path: $bootPath" -ForegroundColor Green

# Check for dhcpcd.conf (main network config file)
$dhcpcdPath = Join-Path $bootPath "dhcpcd.conf"
$rootDhcpcdPath = Join-Path $rootPath "etc" "dhcpcd.conf"

$dhcpcdFile = $null
if (Test-Path $dhcpcdPath) {
    $dhcpcdFile = $dhcpcdPath
    Write-Host "✓ Found dhcpcd.conf in boot: $dhcpcdPath" -ForegroundColor Green
} elseif (Test-Path $rootDhcpcdPath) {
    $dhcpcdFile = $rootDhcpcdPath
    Write-Host "✓ Found dhcpcd.conf in root: $rootDhcpcdPath" -ForegroundColor Green
} else {
    Write-Host "⚠ dhcpcd.conf not found (will be created on first boot)" -ForegroundColor Yellow
}

# Check for DietPi network config
$dietpiConfig = Join-Path $bootPath "dietpi.txt"
if (Test-Path $dietpiConfig) {
    Write-Host "✓ Found dietpi.txt: $dietpiConfig" -ForegroundColor Green
    
    # Read dietpi.txt to check static IP settings
    $dietpiContent = Get-Content $dietpiConfig -Raw
    $hasStaticIP = $false
    
    if ($dietpiContent -match 'AUTO_SETUP_NET_USESTATIC=(\d)') {
        $staticEnabled = $matches[1]
        if ($staticEnabled -eq "1") {
            $hasStaticIP = $true
            Write-Host "  ⚠ Static IP enabled in dietpi.txt" -ForegroundColor Yellow
            
            if ($dietpiContent -match 'AUTO_SETUP_NET_STATIC_IP=([\d.]+)') {
                $currentIP = $matches[1]
                Write-Host "    Current static IP: $currentIP" -ForegroundColor Gray
            }
        }
    }
    
    if ($RemoveStaticIP -and $hasStaticIP) {
        Write-Host "`nRemoving static IP from dietpi.txt..." -ForegroundColor Yellow
        $dietpiContent = $dietpiContent -replace 'AUTO_SETUP_NET_USESTATIC=1', 'AUTO_SETUP_NET_USESTATIC=0'
        
        # Remove static IP address line if present
        $dietpiContent = $dietpiContent -replace 'AUTO_SETUP_NET_STATIC_IP=[\d.]+\r?\n', ''
        $dietpiContent = $dietpiContent -replace 'AUTO_SETUP_NET_STATIC_IP=[\d.]+', ''
        
        # Convert CRLF to LF
        $dietpiContent = $dietpiContent -replace "`r`n", "`n"
        
        $dietpiContent | Out-File -FilePath $dietpiConfig -Encoding ASCII -Force
        Write-Host "  ✓ Removed static IP from dietpi.txt" -ForegroundColor Green
        Write-Host "  ✓ Changed to DHCP (dynamic IP)" -ForegroundColor Green
    }
}

# If dhcpcd.conf exists, check and fix it
if ($dhcpcdFile -and (Test-Path $dhcpcdFile)) {
    Write-Host "`nChecking dhcpcd.conf..." -ForegroundColor Yellow
    $dhcpcdContent = Get-Content $dhcpcdFile -Raw
    
    # Check for static IP configuration
    $hasStaticConfig = $false
    if ($dhcpcdContent -match 'interface\s+(eth0|wlan0)') {
        $hasStaticConfig = $true
        Write-Host "  ⚠ Found static IP configuration in dhcpcd.conf" -ForegroundColor Yellow
        
        # Extract current config
        if ($dhcpcdContent -match 'static ip_address=([\d.]+/\d+)') {
            $currentIP = $matches[1]
            Write-Host "    Current IP: $currentIP" -ForegroundColor Gray
        }
        if ($dhcpcdContent -match 'static routers=([\d.]+)') {
            $currentGateway = $matches[1]
            Write-Host "    Current Gateway: $currentGateway" -ForegroundColor Gray
        }
    }
    
    if ($RemoveStaticIP -and $hasStaticConfig) {
        Write-Host "`nRemoving static IP configuration from dhcpcd.conf..." -ForegroundColor Yellow
        
        # Remove static IP blocks for eth0 and wlan0
        $lines = Get-Content $dhcpcdFile
        $newLines = @()
        $skipBlock = $false
        
        foreach ($line in $lines) {
            # Start of static IP block
            if ($line -match '^interface\s+(eth0|wlan0)') {
                $skipBlock = $true
                continue
            }
            
            # End of static IP block (empty line or next interface/comment)
            if ($skipBlock -and ($line -match '^\s*$' -or $line -match '^#' -or $line -match '^interface')) {
                $skipBlock = $false
                if ($line -notmatch '^interface') {
                    $newLines += $line
                }
                continue
            }
            
            # Skip lines within static IP block
            if ($skipBlock -and ($line -match 'static\s+(ip_address|routers|domain_name_servers)')) {
                continue
            }
            
            # Add all other lines
            if (-not $skipBlock) {
                $newLines += $line
            }
        }
        
        # Convert to LF line endings
        ($newLines -join "`n") + "`n" | Out-File -FilePath $dhcpcdFile -Encoding ASCII -Force
        Write-Host "  ✓ Removed static IP configuration" -ForegroundColor Green
        Write-Host "  ✓ Device will use DHCP on next boot" -ForegroundColor Green
    }
    
    if ($FixStaticIP -and $hasStaticConfig) {
        Write-Host "`nFixing static IP configuration in dhcpcd.conf..." -ForegroundColor Yellow
        
        # Remove old static IP blocks first
        $lines = Get-Content $dhcpcdFile
        $newLines = @()
        $skipBlock = $false
        
        foreach ($line in $lines) {
            if ($line -match '^interface\s+(eth0|wlan0)') {
                $skipBlock = $true
                continue
            }
            
            if ($skipBlock -and ($line -match '^\s*$' -or $line -match '^#' -or $line -match '^interface')) {
                $skipBlock = $false
                if ($line -notmatch '^interface') {
                    $newLines += $line
                }
                continue
            }
            
            if ($skipBlock -and ($line -match 'static\s+(ip_address|routers|domain_name_servers)')) {
                continue
            }
            
            if (-not $skipBlock) {
                $newLines += $line
            }
        }
        
        # Add corrected static IP configuration
        $newLines += ""
        $newLines += "# Static IP Configuration (Fixed)"
        $newLines += "interface eth0"
        $newLines += "static ip_address=$IPAddress/24"
        $newLines += "static routers=$Gateway"
        $newLines += "static domain_name_servers=$DNS"
        
        ($newLines -join "`n") + "`n" | Out-File -FilePath $dhcpcdFile -Encoding ASCII -Force
        Write-Host "  ✓ Fixed static IP configuration" -ForegroundColor Green
        Write-Host "    IP: $IPAddress/24" -ForegroundColor Gray
        Write-Host "    Gateway: $Gateway" -ForegroundColor Gray
        Write-Host "    DNS: $DNS" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Static IP Fix Complete!" -ForegroundColor Green
Write-Host "`nWhat was done:" -ForegroundColor Cyan

if ($RemoveStaticIP) {
    Write-Host "  ✓ Removed static IP configuration" -ForegroundColor White
    Write-Host "  ✓ Device will use DHCP (dynamic IP) on next boot" -ForegroundColor White
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Safely eject/unmount SD card" -ForegroundColor White
    Write-Host "  2. Insert SD card into Pi and power on" -ForegroundColor White
    Write-Host "  3. Wait 2-3 minutes for boot" -ForegroundColor White
    Write-Host "  4. Find IP using DHCP: .cursor\_ai-helpers\find-ssh-device.ps1" -ForegroundColor White
    Write-Host "  5. SSH: ssh root@<IP> (password: 502421)" -ForegroundColor White
}

if ($FixStaticIP) {
    Write-Host "  ✓ Fixed static IP configuration" -ForegroundColor White
    Write-Host "  ✓ IP: $IPAddress/24" -ForegroundColor White
    Write-Host "  ✓ Gateway: $Gateway" -ForegroundColor White
    Write-Host "  ✓ DNS: $DNS" -ForegroundColor White
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Safely eject/unmount SD card" -ForegroundColor White
    Write-Host "  2. Insert SD card into Pi and power on" -ForegroundColor White
    Write-Host "  3. Wait 2-3 minutes for boot" -ForegroundColor White
    Write-Host "  4. Try SSH: ssh root@$IPAddress" -ForegroundColor White
    Write-Host "`nIf still not connecting:" -ForegroundColor Yellow
    Write-Host "  - Verify gateway IP is correct (usually 192.168.1.1)" -ForegroundColor White
    Write-Host "  - Check if IP 192.168.1.177 is available (not in use)" -ForegroundColor White
    Write-Host "  - Try removing static IP and using DHCP first" -ForegroundColor White
}

if (-not $RemoveStaticIP -and -not $FixStaticIP) {
    Write-Host "  ⚠ No action taken - specify -RemoveStaticIP or -FixStaticIP" -ForegroundColor Yellow
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "  To remove static IP (use DHCP):" -ForegroundColor White
    Write-Host "    .\fix-static-ip-sdcard.ps1 -SDCardPath `"$SDCardPath`" -RemoveStaticIP" -ForegroundColor Gray
    Write-Host "`n  To fix static IP with correct settings:" -ForegroundColor White
    Write-Host "    .\fix-static-ip-sdcard.ps1 -SDCardPath `"$SDCardPath`" -FixStaticIP -IPAddress `"192.168.1.177`" -Gateway `"192.168.1.1`" -DNS `"192.168.1.1`"" -ForegroundColor Gray
}

Write-Host "`n"


