# Enable comprehensive verbose logging for DietPi boot troubleshooting
# Usage: .\enable-dietpi-verbose-logging.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nEnabling verbose logging for DietPi boot..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

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

# Step 1: Enable verbose kernel logging in cmdline.txt
Write-Host "`n[Step 1] Enabling verbose kernel boot messages..." -ForegroundColor Yellow
$cmdlineFile = Join-Path $bootPath "cmdline.txt"

if (Test-Path $cmdlineFile) {
    $cmdline = Get-Content $cmdlineFile -Raw
    
    # Add verbose logging options if not present
    $verboseOptions = @(
        "loglevel=7",           # Maximum kernel log level
        "earlyprintk",          # Early kernel messages
        "console=tty1",         # Console output
        "console=serial0,115200" # Serial console
    )
    
    $needsUpdate = $false
    foreach ($option in $verboseOptions) {
        if ($cmdline -notmatch [regex]::Escape($option)) {
            $cmdline = $cmdline.TrimEnd() + " $option"
            $needsUpdate = $true
        }
    }
    
    if ($needsUpdate) {
        # Use LF line endings for Linux files
    $cmdline.Trim() | Out-File -FilePath $cmdlineFile -Encoding ASCII -NoNewline -Force
        Write-Host "  ✓ Updated cmdline.txt with verbose options" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Verbose options already present" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ cmdline.txt not found (may be normal for some images)" -ForegroundColor Yellow
}

# Step 2: Enable serial console in config.txt
Write-Host "`n[Step 2] Enabling serial console for logging..." -ForegroundColor Yellow
$configFile = Join-Path $bootPath "config.txt"

if (Test-Path $configFile) {
    $config = Get-Content $configFile
    
    $serialEnabled = $false
    $newConfig = @()
    
    foreach ($line in $config) {
        # Enable serial console
        if ($line -match '^#?\s*enable_uart=') {
            $newConfig += "enable_uart=1"
            $serialEnabled = $true
        }
        elseif ($line -match '^#?\s*CONFIG_SERIAL_CONSOLE_ENABLE') {
            # Skip this - it's in dietpi.txt
            continue
        }
        else {
            $newConfig += $line
        }
    }
    
    if (-not $serialEnabled) {
        $newConfig += ""
        $newConfig += "# Serial console for logging"
        $newConfig += "enable_uart=1"
    }
    
    # Use LF line endings for Linux config files
    ($newConfig -join "`n") + "`n" | Out-File -FilePath $configFile -Encoding ASCII -Force
    Write-Host "  ✓ Enabled serial console in config.txt" -ForegroundColor Green
} else {
    Write-Host "  ⚠ config.txt not found" -ForegroundColor Yellow
}

# Step 3: Create boot logging script
Write-Host "`n[Step 3] Creating boot logging script..." -ForegroundColor Yellow
$logScript = Join-Path $bootPath "boot-logger.sh"

$scriptContent = @"
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
"@

# Use LF line endings for shell scripts
$scriptContent -replace "`r`n", "`n" | Out-File -FilePath $logScript -Encoding ASCII -Force
Write-Host "  ✓ Created boot logging script" -ForegroundColor Green

# Step 4: Enable systemd journal to file
Write-Host "`n[Step 4] Configuring systemd journal logging..." -ForegroundColor Yellow
$journaldConfig = Join-Path $bootPath "journald.conf"

$journaldContent = @"
[Journal]
Storage=persistent
SystemMaxUse=100M
ForwardToSyslog=yes
MaxLevelStore=debug
MaxLevelSyslog=debug
"@

# Use LF line endings for Linux config files
$journaldContent -replace "`r`n", "`n" | Out-File -FilePath $journaldConfig -Encoding ASCII -Force
Write-Host "  ✓ Created journald.conf for persistent logging" -ForegroundColor Green

# Step 5: Update dietpi.txt to enable verbose logging
Write-Host "`n[Step 5] Updating dietpi.txt for verbose logging..." -ForegroundColor Yellow
$dietpiConfig = Join-Path $bootPath "dietpi.txt"

if (Test-Path $dietpiConfig) {
    $config = Get-Content $dietpiConfig -Raw
    
    # Change logging to save to disk
    if ($config -match 'AUTO_SETUP_LOGGING_INDEX=-?\d+') {
        $config = $config -replace 'AUTO_SETUP_LOGGING_INDEX=-?\d+', 'AUTO_SETUP_LOGGING_INDEX=-2'
        Write-Host "  ✓ Changed logging to save to disk" -ForegroundColor Green
    }
    
    # Enable serial console temporarily for debugging
    if ($config -match 'CONFIG_SERIAL_CONSOLE_ENABLE=\d+') {
        $config = $config -replace 'CONFIG_SERIAL_CONSOLE_ENABLE=\d+', 'CONFIG_SERIAL_CONSOLE_ENABLE=1'
        Write-Host "  ✓ Enabled serial console for debugging" -ForegroundColor Green
    }
    
    # Use LF line endings for dietpi.txt
    $config -replace "`r`n", "`n" | Out-File -FilePath $dietpiConfig -Encoding ASCII -Force
    Write-Host "  ✓ Updated dietpi.txt" -ForegroundColor Green
} else {
    Write-Host "  ⚠ dietpi.txt not found" -ForegroundColor Yellow
}

# Step 6: Create comprehensive log collection script (runs after boot)
Write-Host "`n[Step 6] Creating post-boot log collection script..." -ForegroundColor Yellow
$collectLogsScript = Join-Path $bootPath "collect-logs.sh"

$collectScript = @"
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
"@

# Use LF line endings for shell scripts
$collectScript -replace "`r`n", "`n" | Out-File -FilePath $collectLogsScript -Encoding ASCII -Force
Write-Host "  ✓ Created log collection script" -ForegroundColor Green

# Step 7: Enable verbose boot in config.txt
Write-Host "`n[Step 7] Enabling verbose boot messages..." -ForegroundColor Yellow
if (Test-Path $configFile) {
    $config = Get-Content $configFile
    
    $hasVerbose = $false
    $newConfig = @()
    
    foreach ($line in $config) {
        if ($line -match '^#?\s*dtparam=audio') {
            # Keep audio settings
            $newConfig += $line
        }
        elseif ($line -match 'verbose') {
            $hasVerbose = $true
            $newConfig += $line
        }
        else {
            $newConfig += $line
        }
    }
    
    if (-not $hasVerbose) {
        $newConfig += ""
        $newConfig += "# Verbose boot for debugging"
        $newConfig += "dtparam=audio=off"
    }
    
    # Use LF line endings for Linux config files
    ($newConfig -join "`n") + "`n" | Out-File -FilePath $configFile -Encoding ASCII -Force
    Write-Host "  ✓ Updated config.txt" -ForegroundColor Green
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Verbose Logging Enabled!" -ForegroundColor Green
Write-Host "`nLogging enabled:" -ForegroundColor Cyan
Write-Host "  ✓ Kernel verbose messages (loglevel=7)" -ForegroundColor White
Write-Host "  ✓ Serial console enabled" -ForegroundColor White
Write-Host "  ✓ Systemd journal persistent" -ForegroundColor White
Write-Host "  ✓ Boot logging script created" -ForegroundColor White
Write-Host "  ✓ Log collection script created" -ForegroundColor White

Write-Host "`nAfter boot, logs will be available:" -ForegroundColor Yellow
Write-Host "  - /boot/boot.log (boot process log)" -ForegroundColor White
Write-Host "  - /var/log/journal/ (systemd logs)" -ForegroundColor White
Write-Host "  - /var/tmp/dietpi/logs/ (DietPi logs)" -ForegroundColor White

Write-Host "`nTo collect all logs after SSH access:" -ForegroundColor Yellow
Write-Host "  bash /boot/collect-logs.sh" -ForegroundColor Gray
Write-Host "  scp -r root@<IP>:/boot/logs-* ." -ForegroundColor Gray

Write-Host "`n"

