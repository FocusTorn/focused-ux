# Verify SD card setup and check for issues
# Usage: .\verify-sd-card-setup.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nVerifying SD card setup..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Check if drive exists
if (-not (Test-Path $DriveLetter)) {
    Write-Host "ERROR: Drive $DriveLetter does not exist!" -ForegroundColor Red
    exit 1
}

# Determine boot path
$bootPath = Join-Path $DriveLetter "boot"
$rootPath = $DriveLetter

if (-not (Test-Path $bootPath)) {
    if (Test-Path (Join-Path $rootPath "dietpi.txt")) {
        $bootPath = $rootPath
    } else {
        Write-Host "ERROR: Boot partition not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✓ Boot path: $bootPath" -ForegroundColor Green

# Check critical files
Write-Host "`nChecking critical files..." -ForegroundColor Yellow

$checks = @{
    "dietpi.txt" = Join-Path $bootPath "dietpi.txt"
    "config.txt" = Join-Path $bootPath "config.txt"
    "cmdline.txt" = Join-Path $bootPath "cmdline.txt"
    "ssh file" = Join-Path $bootPath "ssh"
    "boot-logger.sh" = Join-Path $bootPath "boot-logger.sh"
    "network-led-indicator.sh" = Join-Path $bootPath "network-led-indicator.sh"
}

foreach ($name in $checks.Keys) {
    $path = $checks[$name]
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✓ $name exists ($size bytes)" -ForegroundColor Green
        
        # Check line endings for text files
        if ($name -match "\.(txt|sh)$") {
            $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
            if ($content -match "`r`n") {
                Write-Host "    ⚠ WARNING: Has CRLF line endings (should be LF)" -ForegroundColor Red
            } else {
                Write-Host "    ✓ Line endings: LF (correct)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✗ $name NOT FOUND" -ForegroundColor Red
    }
}

# Check dietpi.txt critical settings
Write-Host "`nChecking dietpi.txt settings..." -ForegroundColor Yellow
$configFile = Join-Path $bootPath "dietpi.txt"

if (Test-Path $configFile) {
    $config = Get-Content $configFile -Raw
    
    # Check critical settings
    $criticalSettings = @{
        "AUTO_SETUP_BOOT_WAIT_FOR_NETWORK" = "0"
        "AUTO_SETUP_NET_ETHERNET_ENABLED" = "1"
        "AUTO_SETUP_NET_WIFI_ENABLED" = "0"
        "AUTO_SETUP_AUTOMATED" = "1"
        "AUTO_SETUP_HEADLESS" = "1"
    }
    
    foreach ($key in $criticalSettings.Keys) {
        $expected = $criticalSettings[$key]
        if ($config -match "$key=([^\r\n#]+)") {
            $actual = $matches[1].Trim()
            if ($actual -eq $expected) {
                Write-Host "  ✓ $key = $actual (correct)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $key = $actual (should be $expected)" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠ $key not found" -ForegroundColor Yellow
        }
    }
    
    # Check for corrupted values
    if ($config -match '\$\d+') {
        Write-Host "`n  ✗ CORRUPTED VALUES DETECTED!" -ForegroundColor Red
        $config | Select-String -Pattern '\$\d+' | ForEach-Object {
            Write-Host "    Found: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ dietpi.txt not found!" -ForegroundColor Red
}

# Check boot.log
Write-Host "`nChecking for boot.log..." -ForegroundColor Yellow
$bootLog = Join-Path $bootPath "boot.log"
if (Test-Path $bootLog) {
    $logSize = (Get-Item $bootLog).Length
    Write-Host "  ✓ boot.log exists ($logSize bytes)" -ForegroundColor Green
    Write-Host "`n  Last 20 lines of boot.log:" -ForegroundColor Cyan
    Get-Content $bootLog -Tail 20 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ boot.log NOT FOUND" -ForegroundColor Red
    Write-Host "    This means the boot-logger.sh script did not run" -ForegroundColor Yellow
    Write-Host "    Possible reasons:" -ForegroundColor Yellow
    Write-Host "      - Pi didn't boot at all" -ForegroundColor Gray
    Write-Host "      - Script wasn't executed" -ForegroundColor Gray
    Write-Host "      - Script failed before creating log" -ForegroundColor Gray
}

# Check for other log files
Write-Host "`nChecking for other log files..." -ForegroundColor Yellow
$logFiles = Get-ChildItem -Path $bootPath -Filter "*.log" -ErrorAction SilentlyContinue
if ($logFiles) {
    foreach ($log in $logFiles) {
        Write-Host "  ✓ Found: $($log.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  - No log files found" -ForegroundColor Gray
}

# Check cmdline.txt for verbose options
Write-Host "`nChecking cmdline.txt..." -ForegroundColor Yellow
$cmdlineFile = Join-Path $bootPath "cmdline.txt"
if (Test-Path $cmdlineFile) {
    $cmdline = Get-Content $cmdlineFile -Raw
    if ($cmdline -match "loglevel=7") {
        Write-Host "  ✓ Verbose logging enabled (loglevel=7)" -ForegroundColor Green
    } else {
        Write-Host "  - Verbose logging not enabled" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ cmdline.txt not found" -ForegroundColor Yellow
}

# Check config.txt
Write-Host "`nChecking config.txt..." -ForegroundColor Yellow
$configFilePi = Join-Path $bootPath "config.txt"
if (Test-Path $configFilePi) {
    $configPi = Get-Content $configFilePi -Raw
    if ($configPi -match "enable_uart=1") {
        Write-Host "  ✓ Serial console enabled" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ config.txt not found" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "`nIf boot.log doesn't exist, the Pi may not have booted successfully." -ForegroundColor Yellow
Write-Host "Check:" -ForegroundColor Yellow
Write-Host "  1. SD card is properly inserted" -ForegroundColor White
Write-Host "  2. Power supply is adequate (5V, 3A recommended)" -ForegroundColor White
Write-Host "  3. No hardware issues (try different SD card)" -ForegroundColor White
Write-Host "  4. Image was written correctly (verify checksum)" -ForegroundColor White
Write-Host "`n"

