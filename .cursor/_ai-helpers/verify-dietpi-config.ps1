# Verify DietPi.txt configuration on SD card
# Usage: .\verify-dietpi-config.ps1 -DriveLetter "E:"

param(
    [Parameter(Mandatory=$true)]
    [string]$DriveLetter
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nVerifying DietPi configuration on $DriveLetter..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if drive exists
if (-not (Test-Path $DriveLetter)) {
    Write-Host "ERROR: Drive $DriveLetter does not exist!" -ForegroundColor Red
    exit 1
}

$bootPath = Join-Path $DriveLetter "boot"
$configFile = Join-Path $bootPath "dietpi.txt"
$configFileAlt = Join-Path $bootPath "DietPi.txt"

# Check if boot partition exists
if (-not (Test-Path $bootPath)) {
    Write-Host "ERROR: Boot partition not found at $bootPath" -ForegroundColor Red
    Write-Host "Make sure you're pointing to the boot partition (usually first partition)" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✓ Boot partition found: $bootPath" -ForegroundColor Green

# Check for config file (case-insensitive)
$foundConfig = $false
$actualConfigPath = $null

if (Test-Path $configFile) {
    $foundConfig = $true
    $actualConfigPath = $configFile
    Write-Host "✓ Found: dietpi.txt (correct name)" -ForegroundColor Green
} elseif (Test-Path $configFileAlt) {
    $foundConfig = $true
    $actualConfigPath = $configFileAlt
    Write-Host "⚠ Found: DietPi.txt (should be dietpi.txt - lowercase)" -ForegroundColor Yellow
    Write-Host "  Renaming to dietpi.txt..." -ForegroundColor Yellow
    try {
        Rename-Item -Path $configFileAlt -NewName "dietpi.txt" -Force
        $actualConfigPath = $configFile
        Write-Host "  ✓ Renamed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to rename: $_" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Config file not found!" -ForegroundColor Red
    Write-Host "  Expected: $configFile" -ForegroundColor Yellow
    Write-Host "  Or: $configFileAlt" -ForegroundColor Yellow
    exit 1
}

# Read and verify key settings
Write-Host "`nChecking key network settings..." -ForegroundColor Cyan

$configContent = Get-Content $actualConfigPath -Raw

# Check Ethernet
if ($configContent -match 'AUTO_SETUP_NET_ETHERNET_ENABLED=(\d)') {
    $ethEnabled = $matches[1]
    if ($ethEnabled -eq "1") {
        Write-Host "  ✓ Ethernet enabled" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Ethernet DISABLED (should be 1)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ Ethernet setting not found" -ForegroundColor Yellow
}

# Check WiFi
if ($configContent -match 'AUTO_SETUP_NET_WIFI_ENABLED=(\d)') {
    $wifiEnabled = $matches[1]
    if ($wifiEnabled -eq "0") {
        Write-Host "  ✓ WiFi disabled (correct for Ethernet)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ WiFi enabled (will take priority over Ethernet)" -ForegroundColor Yellow
    }
}

# Check Static IP
if ($configContent -match 'AUTO_SETUP_NET_USESTATIC=(\d)') {
    $staticIP = $matches[1]
    if ($staticIP -eq "0") {
        Write-Host "  ✓ Using DHCP (dynamic IP)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Static IP enabled" -ForegroundColor Yellow
        if ($configContent -match 'AUTO_SETUP_NET_STATIC_IP=([\d.]+)') {
            Write-Host "    Static IP: $($matches[1])" -ForegroundColor Gray
        }
    }
}

# Check Network Wait
if ($configContent -match 'AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=(\d)') {
    $networkWait = $matches[1]
    if ($networkWait -eq "0") {
        Write-Host "  ✓ Network wait disabled (allows network to initialize)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Network wait ENABLED (may prevent network connection!)" -ForegroundColor Red
        Write-Host "    This can cause a deadlock - should be 0" -ForegroundColor Yellow
    }
}

# Check Automated setup
if ($configContent -match 'AUTO_SETUP_AUTOMATED=(\d)') {
    $automated = $matches[1]
    if ($automated -eq "1") {
        Write-Host "  ✓ Automated setup enabled" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Automated setup disabled (will require manual interaction)" -ForegroundColor Yellow
    }
}

# Check for resize script disable
Write-Host "`nChecking for potential issues..." -ForegroundColor Cyan

if ($configContent -match 'AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=1') {
    Write-Host "  ⚠ WARNING: Network wait is enabled - this may prevent network connection!" -ForegroundColor Red
    Write-Host "    Recommendation: Set AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=0" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Config file: $actualConfigPath" -ForegroundColor White
Write-Host "  Status: " -NoNewline -ForegroundColor White
if ($foundConfig) {
    Write-Host "READY" -ForegroundColor Green
} else {
    Write-Host "NOT FOUND" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Ensure file is named 'dietpi.txt' (lowercase) in boot partition" -ForegroundColor White
Write-Host "  2. Verify network settings are correct" -ForegroundColor White
Write-Host "  3. If resize script hangs, it may prevent network initialization" -ForegroundColor White
Write-Host "  4. Check router DHCP table after boot to see if Pi got an IP" -ForegroundColor White
Write-Host "  5. Use find-ssh-device.ps1 to scan for the Pi" -ForegroundColor White
Write-Host "`n"

