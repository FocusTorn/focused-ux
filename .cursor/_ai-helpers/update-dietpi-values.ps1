# Update only specific values in existing dietpi.txt - preserves all defaults
# Usage: .\update-dietpi-values.ps1 -DriveLetter "F:" [-EnableLogging]

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableLogging = $false
)

# ============================================================================
# CONFIGURATION - Only modify values here that you need to change
# ============================================================================
$valuesToUpdate = @{
    # Password for root and dietpi users
    "AUTO_SETUP_GLOBAL_PASSWORD" = "502421"
    
    # Locale and regional settings
    "AUTO_SETUP_LOCALE" = "en_US.UTF-8"
    "AUTO_SETUP_KEYBOARD_LAYOUT" = "us"
    "AUTO_SETUP_TIMEZONE" = "America/Chicago"
    
    # Network settings
    # "AUTO_SETUP_NET_ETHERNET_ENABLED" = "1"
    # "AUTO_SETUP_NET_WIFI_ENABLED" = "0"
    "AUTO_SETUP_NET_WIFI_COUNTRY_CODE" = "US"
    "AUTO_SETUP_BOOT_WAIT_FOR_NETWORK" = "1"
    # "AUTO_SETUP_NET_HOSTNAME" = "DietPi"
    
    "AUTO_SETUP_SSH_PUBKEY" = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBNGM960pZCweE+LGVqWxcHR470SduzUaWYWgvpDGgyY RPi-DietPi"

    
    # Headless mode
    "AUTO_SETUP_HEADLESS" = "1"
    
    # Automated setup
    "AUTO_SETUP_AUTOMATED" = "1"
    
    
    "AUTO_SETUP_INSTALL_SOFTWARE_ID" = "9 17 66 69 70 72 105 122 123 157 162"
    
    
    # SSH server (keep default Dropbear)
    # "AUTO_SETUP_SSH_SERVER_INDEX" = "-1"  # Uncomment to change
    
    # Add more values here as needed:
    # "AUTO_SETUP_NET_USESTATIC" = "0"
    # "CONFIG_SERIAL_CONSOLE_ENABLE" = "0"
}
# ============================================================================

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nUpdating DietPi configuration values..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Only updating $($valuesToUpdate.Count) value(s) - preserving all defaults" -ForegroundColor Yellow
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

# Find dietpi.txt (case-insensitive)
$configFile = $null
$possibleNames = @("dietpi.txt", "DietPi.txt", "DIETPI.TXT")

foreach ($name in $possibleNames) {
    $testPath = Join-Path $bootPath $name
    if (Test-Path $testPath) {
        $configFile = $testPath
        Write-Host "✓ Found config: $name" -ForegroundColor Green
        break
    }
}

if (-not $configFile) {
    Write-Host "ERROR: dietpi.txt not found in $bootPath" -ForegroundColor Red
    exit 1
}

# Read existing config
Write-Host "`nReading existing configuration..." -ForegroundColor Yellow
$content = Get-Content -Path $configFile -Raw

# Count original lines
$originalLines = ($content -split "`n").Count
Write-Host "  Original file: $originalLines lines" -ForegroundColor Gray

# Update values
$updatedCount = 0
$notFound = @()

foreach ($key in $valuesToUpdate.Keys) {
    $value = $valuesToUpdate[$key]
    
    # Pattern to match: KEY=value (with optional whitespace, comments, etc.)
    # Use escaped key to handle special regex characters
    $escapedKey = [regex]::Escape($key)
    $pattern = "($escapedKey\s*=\s*)([^\r\n#]+)"
    
    if ($content -match $pattern) {
        # Replace using script block to properly handle backreferences
        $content = [regex]::Replace($content, $pattern, {
            param($match)
            # Return the key part + new value
            return $match.Groups[1].Value + $value
        })
        Write-Host "  ✓ Updated: $key = $value" -ForegroundColor Green
        $updatedCount++
    } else {
        # Check if key exists but might be commented or have different format
        if ($content -match [regex]::Escape($key)) {
            Write-Host "  ⚠ Found but format differs: $key" -ForegroundColor Yellow
            Write-Host "    (May be commented or have different format - check manually)" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠ Not found: $key" -ForegroundColor Yellow
            Write-Host "    (Will be added at end if needed)" -ForegroundColor Gray
            $notFound += $key
        }
    }
}

# Add any missing keys at the end (only if they don't exist at all)
if ($notFound.Count -gt 0) {
    Write-Host "`nAdding missing keys..." -ForegroundColor Yellow
    foreach ($key in $notFound) {
        $value = $valuesToUpdate[$key]
        # Check one more time if it really doesn't exist
        if ($content -notmatch "^[^#]*$key\s*=") {
            $content += "`n$key=$value"
            Write-Host "  ✓ Added: $key = $value" -ForegroundColor Green
            $updatedCount++
        }
    }
}

# Convert CRLF to LF (Linux line endings)
Write-Host "`nConverting line endings to LF (Linux format)..." -ForegroundColor Yellow
$content = $content -replace "`r`n", "`n"

# Write back with LF line endings
$content | Out-File -FilePath $configFile -Encoding ASCII -Force

# Verify
$newLines = (Get-Content -Path $configFile -Raw -ErrorAction SilentlyContinue) -split "`n" | Measure-Object -Line
Write-Host "  ✓ File written with LF line endings" -ForegroundColor Green
Write-Host "  Final file: $($newLines.Lines) lines" -ForegroundColor Gray

# Create SSH enable file
$sshFile = Join-Path $bootPath "ssh"
if (-not (Test-Path $sshFile)) {
    New-Item -ItemType File -Path $sshFile -Force | Out-Null
    Write-Host "`n✓ Created 'ssh' file to enable SSH" -ForegroundColor Green
} else {
    Write-Host "`n✓ SSH file already exists" -ForegroundColor Green
}

# Enable verbose logging if requested
if ($EnableLogging) {
    Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
    Write-Host "Enabling verbose logging..." -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
    
    # Step 1: Enable verbose kernel logging in cmdline.txt
    Write-Host "`n[Logging] Enabling verbose kernel boot messages..." -ForegroundColor Yellow
    $cmdlineFile = Join-Path $bootPath "cmdline.txt"
    
    if (Test-Path $cmdlineFile) {
        $cmdline = Get-Content $cmdlineFile -Raw
        
        $verboseOptions = @("loglevel=7", "earlyprintk", "console=tty1", "console=serial0,115200")
        $needsUpdate = $false
        
        foreach ($option in $verboseOptions) {
            if ($cmdline -notmatch [regex]::Escape($option)) {
                $cmdline = $cmdline.TrimEnd() + " $option"
                $needsUpdate = $true
            }
        }
        
        if ($needsUpdate) {
            $cmdline.Trim() | Out-File -FilePath $cmdlineFile -Encoding ASCII -NoNewline -Force
            Write-Host "  ✓ Updated cmdline.txt with verbose options" -ForegroundColor Green
        }
    }
    
    # Step 2: Enable serial console in config.txt
    Write-Host "`n[Logging] Enabling serial console..." -ForegroundColor Yellow
    $configFilePi = Join-Path $bootPath "config.txt"
    
    if (Test-Path $configFilePi) {
        $configPi = Get-Content $configFilePi
        $serialEnabled = $false
        $newConfigPi = @()
        
        foreach ($line in $configPi) {
            if ($line -match '^#?\s*enable_uart=') {
                $newConfigPi += "enable_uart=1"
                $serialEnabled = $true
            } else {
                $newConfigPi += $line
            }
        }
        
        if (-not $serialEnabled) {
            $newConfigPi += ""
            $newConfigPi += "# Serial console for logging"
            $newConfigPi += "enable_uart=1"
        }
        
        ($newConfigPi -join "`n") + "`n" | Out-File -FilePath $configFilePi -Encoding ASCII -Force
        Write-Host "  ✓ Enabled serial console" -ForegroundColor Green
    }
    
    # Step 3: Create boot logging script
    Write-Host "`n[Logging] Creating boot logging script..." -ForegroundColor Yellow
    $logScript = Join-Path $bootPath "boot-logger.sh"
    
    $scriptContent = @'
#!/bin/bash
# Comprehensive boot logging script
# Logs everything to /boot/boot.log (same directory as /boot/dietpi.txt)

# Determine log file location - try /boot first, fallback to /tmp if /boot not available
if [ -d /boot ] && [ -w /boot ]; then
    LOG_FILE="/boot/boot.log"
elif [ -d /boot/firmware ] && [ -w /boot/firmware ]; then
    LOG_FILE="/boot/firmware/boot.log"
else
    LOG_FILE="/tmp/boot.log"
    echo "WARNING: /boot not available, logging to $LOG_FILE" >&2
fi

# Always also log to dietpi.txt as guaranteed fallback
DIETPI_TXT="/boot/dietpi.txt"
[ -f /boot/firmware/dietpi.txt ] && DIETPI_TXT="/boot/firmware/dietpi.txt"
[ -f /boot/dietpi.txt ] && DIETPI_TXT="/boot/dietpi.txt"

# Function to log to both locations
log_message() {
    local msg="$1"
    echo "$msg" >> "$LOG_FILE" 2>&1 || true
    # Always append to dietpi.txt as guaranteed backup
    if [ -w "$DIETPI_TXT" ]; then
        echo "$msg" >> "$DIETPI_TXT" 2>&1 || true
    fi
}

# Ensure log file directory exists
LOG_DIR=$(dirname "$LOG_FILE")
[ -d "$LOG_DIR" ] || mkdir -p "$LOG_DIR" 2>/dev/null || LOG_FILE="/tmp/boot.log"

TIMESTAMP() { date '+%Y-%m-%d %H:%M:%S'; }

log_message "[$(TIMESTAMP)] Boot logger started"
log_message "[$(TIMESTAMP)] Kernel version: $(uname -r)"
log_message "[$(TIMESTAMP)] Boot parameters: $(cat /proc/cmdline)"

# Log network initialization
log_message "[$(TIMESTAMP)] Starting network logging..."
ip addr show >> "$LOG_FILE" 2>&1
if [ -w "$DIETPI_TXT" ]; then
    ip addr show >> "$DIETPI_TXT" 2>&1 || true
fi

# Log systemd services
log_message "[$(TIMESTAMP)] Systemd services status:"
systemctl list-units --type=service --state=running >> "$LOG_FILE" 2>&1

# Log DietPi processes
log_message "[$(TIMESTAMP)] DietPi processes:"
ps aux | grep -i dietpi >> "$LOG_FILE" 2>&1

# Log resize script status
log_message "[$(TIMESTAMP)] Resize script status:"
systemctl status dietpi-fs_partition_resize >> "$LOG_FILE" 2>&1

# Log network connectivity
log_message "[$(TIMESTAMP)] Network connectivity:"
ping -c 2 8.8.8.8 >> "$LOG_FILE" 2>&1

# Log DHCP lease
log_message "[$(TIMESTAMP)] DHCP lease info:"
cat /var/lib/dhcp/dhclient.leases >> "$LOG_FILE" 2>&1 || log_message "No DHCP leases found"

log_message "[$(TIMESTAMP)] Boot logger completed"
'@
    
    $scriptContent -replace "`r`n", "`n" | Out-File -FilePath $logScript -Encoding ASCII -Force
    Write-Host "  ✓ Created boot logging script" -ForegroundColor Green
    
    # Step 4: Create log collection script
    Write-Host "`n[Logging] Creating log collection script..." -ForegroundColor Yellow
    $collectLogsScript = Join-Path $bootPath "collect-logs.sh"
    
    $collectScript = @'
#!/bin/bash
# Collect all logs after boot for analysis
# Run this via SSH after boot: bash /boot/collect-logs.sh

LOG_DIR="/boot/logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$LOG_DIR"

echo "Collecting logs to $LOG_DIR..."

# System logs
journalctl --no-pager > "$LOG_DIR/journalctl.log" 2>&1
journalctl -u dietpi-fs_partition_resize --no-pager > "$LOG_DIR/resize-service.log" 2>&1
dmesg > "$LOG_DIR/dmesg.log" 2>&1

# Network logs
ip addr show > "$LOG_DIR/network-interfaces.log" 2>&1
ip route show > "$LOG_DIR/network-routes.log" 2>&1
systemctl status networking > "$LOG_DIR/networking-service.log" 2>&1

# DietPi logs
cp -r /var/tmp/dietpi/logs/* "$LOG_DIR/" 2>/dev/null || true

# System info
uname -a > "$LOG_DIR/system-info.log" 2>&1
cat /proc/cmdline > "$LOG_DIR/cmdline.log" 2>&1
systemctl list-units --all > "$LOG_DIR/all-services.log" 2>&1

# Boot logs
cp /boot/boot.log "$LOG_DIR/" 2>/dev/null || true

echo "Logs collected in $LOG_DIR"
echo "Copy to Windows: scp -r root@<IP>:$LOG_DIR ."
'@
    
    $collectScript -replace "`r`n", "`n" | Out-File -FilePath $collectLogsScript -Encoding ASCII -Force
    Write-Host "  ✓ Created log collection script" -ForegroundColor Green
    
    Write-Host "`n✓ Verbose logging enabled!" -ForegroundColor Green
    Write-Host "  Logs will be available at:" -ForegroundColor White
    Write-Host "    - /boot/boot.log (boot process)" -ForegroundColor Gray
    Write-Host "    - /var/log/journal/ (systemd logs)" -ForegroundColor Gray
    Write-Host "    - /var/tmp/dietpi/logs/ (DietPi logs)" -ForegroundColor Gray
}

Write-Host "`n$("=" * 60)" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Values updated: $updatedCount" -ForegroundColor White
Write-Host "  Values not found: $($notFound.Count)" -ForegroundColor $(if ($notFound.Count -gt 0) { "Yellow" } else { "White" })
Write-Host "  Line endings: LF (Linux format)" -ForegroundColor White
Write-Host "  All other settings: Preserved (using DietPi defaults)" -ForegroundColor White

if ($notFound.Count -gt 0) {
    Write-Host "`nNote: These keys were not found in the original file:" -ForegroundColor Yellow
    foreach ($key in $notFound) {
        Write-Host "  - $key" -ForegroundColor Gray
    }
    Write-Host "  (They may use different names or be in a different section)" -ForegroundColor Gray
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Safely eject SD card" -ForegroundColor White
Write-Host "  2. Insert into Pi and power on" -ForegroundColor White
Write-Host "  3. Wait 2-3 minutes for boot" -ForegroundColor White
Write-Host "  4. Find IP: .cursor\_ai-helpers\find-ssh-device.ps1" -ForegroundColor White
Write-Host "  5. SSH: ssh root@<IP> (password: $($valuesToUpdate['AUTO_SETUP_GLOBAL_PASSWORD']))" -ForegroundColor White

if ($EnableLogging) {
    Write-Host "`nTo collect logs after SSH access:" -ForegroundColor Yellow
    Write-Host "  bash /boot/collect-logs.sh" -ForegroundColor Gray
    Write-Host "  scp -r root@<IP>:/boot/logs-* ." -ForegroundColor Gray
    Write-Host "`nOr check boot.log directly from SD card:" -ForegroundColor Yellow
    Write-Host "  Mount SD card and check: $bootPath\boot.log" -ForegroundColor Gray
}

Write-Host "`n"

