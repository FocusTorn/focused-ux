# Setup early boot logging that runs automatically
# Usage: .\setup-early-boot-logging.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nSetting up early boot logging..." -ForegroundColor Cyan
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

# Create boot-logger.sh script (standalone script that can be called)
Write-Host "`n[Creating] boot-logger.sh script..." -ForegroundColor Yellow
$logScript = Join-Path $bootPath "boot-logger.sh"

$bootLoggerContent = @'
#!/bin/bash
# Boot logger script - logs boot process to /boot/boot.log
# Note: This writes to the same directory as dietpi.txt (/boot/dietpi.txt)

# Determine log file location - try /boot first, fallback to /tmp if /boot not available
if [ -d /boot ] && [ -w /boot ]; then
    LOG_FILE="/boot/boot.log"
elif [ -d /boot/firmware ] && [ -w /boot/firmware ]; then
    LOG_FILE="/boot/firmware/boot.log"
else
    # Fallback to /tmp if /boot is not available (very early boot)
    LOG_FILE="/tmp/boot.log"
    echo "WARNING: /boot not available, logging to $LOG_FILE" >&2
fi

# Always also log to dietpi.txt as guaranteed fallback
DIETPI_TXT="/boot/dietpi.txt"
[ -f /boot/firmware/dietpi.txt ] && DIETPI_TXT="/boot/firmware/dietpi.txt"
[ -f /boot/dietpi.txt ] && DIETPI_TXT="/boot/dietpi.txt"

# Function to get timestamp
TIMESTAMP() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Function to log to both locations
log_message() {
    local msg="$1"
    echo "$msg" >> "$LOG_FILE" 2>&1 || true
    # Always append to dietpi.txt as guaranteed backup
    if [ -w "$DIETPI_TXT" ]; then
        echo "$msg" >> "$DIETPI_TXT" 2>&1 || true
    fi
}

# Ensure log file directory exists and is writable
LOG_DIR=$(dirname "$LOG_FILE")
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR" 2>/dev/null || {
        # If we can't create log dir, just use dietpi.txt
        LOG_FILE="$DIETPI_TXT"
    }
fi

log_message "[$(TIMESTAMP)] Boot logger started"
log_message "[$(TIMESTAMP)] Kernel version: $(uname -r)"
log_message "[$(TIMESTAMP)] Boot parameters: $(cat /proc/cmdline)"

# Log network status
log_message "[$(TIMESTAMP)] Starting network logging..."
ip addr show >> "$LOG_FILE" 2>&1 || log_message "[$(TIMESTAMP)] ip command failed"

# Log systemd services
log_message "[$(TIMESTAMP)] Systemd services status:"
systemctl list-units --type=service --state=running >> "$LOG_FILE" 2>&1 || log_message "[$(TIMESTAMP)] systemctl failed"

# Log DietPi resize status
log_message "[$(TIMESTAMP)] Resize script status:"
systemctl status dietpi-fs_partition_resize --no-pager >> "$LOG_FILE" 2>&1 || log_message "[$(TIMESTAMP)] Resize service not found"

# Log network connectivity
log_message "[$(TIMESTAMP)] Network connectivity:"
ping -c 1 9.9.9.9 >> "$LOG_FILE" 2>&1 || log_message "[$(TIMESTAMP)] Network ping failed"

# Log DHCP lease info
log_message "[$(TIMESTAMP)] DHCP lease info:"
cat /var/lib/dhcp/dhclient.leases >> "$LOG_FILE" 2>&1 || log_message "[$(TIMESTAMP)] No DHCP leases"

log_message "[$(TIMESTAMP)] Boot logger completed"
'@

$bootLoggerContent -replace "`r`n", "`n" | Out-File -FilePath $logScript -Encoding ASCII -Force
Write-Host "  ✓ Created boot-logger.sh" -ForegroundColor Green

# Method 1: Add to rc.local (runs early, before most services)
Write-Host "`n[Method 1] Adding to rc.local (early boot)..." -ForegroundColor Yellow
$rcLocal = Join-Path $bootPath "rc.local"

# rc.local content that logs to boot partition and calls boot-logger.sh
$rcLocalContent = @'
#!/bin/sh -e
# Boot logging - runs early in boot process
# Note: This writes to the same directory as dietpi.txt (/boot/dietpi.txt)

# Determine log file location - try /boot first, fallback to /tmp if /boot not available
if [ -d /boot ] && [ -w /boot ]; then
    LOG_FILE="/boot/boot.log"
elif [ -d /boot/firmware ] && [ -w /boot/firmware ]; then
    LOG_FILE="/boot/firmware/boot.log"
else
    LOG_FILE="/tmp/boot.log"
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

log_message "=== Boot started at $(date) ==="
log_message "Kernel: $(uname -r)"
log_message "Boot params: $(cat /proc/cmdline)"

# Call boot-logger.sh if it exists
if [ -f /boot/boot-logger.sh ]; then
    /bin/bash /boot/boot-logger.sh
fi

exit 0
'@

$rcLocalContent -replace "`r`n", "`n" | Out-File -FilePath $rcLocal -Encoding ASCII -Force
Write-Host "  ✓ Created/updated rc.local" -ForegroundColor Green

# Method 2: Create a systemd service that runs on boot
Write-Host "`n[Method 2] Creating systemd service..." -ForegroundColor Yellow
$systemdPath = Join-Path $bootPath "systemd" "system"
$serviceFile = Join-Path $systemdPath "boot-logger.service"

try {
    if (-not (Test-Path $systemdPath)) {
        New-Item -ItemType Directory -Path $systemdPath -Force | Out-Null
    }
    
    $serviceContent = @'
[Unit]
Description=Boot Logger
After=local-fs.target
Before=network.target

[Service]
Type=oneshot
# Note: Logs to /boot/boot.log (same directory as /boot/dietpi.txt)
# Falls back to /tmp/boot.log if /boot is not available
# Always also appends to dietpi.txt as guaranteed backup
ExecStart=/bin/bash -c 'if [ -d /boot ] && [ -w /boot ]; then LOG_FILE="/boot/boot.log"; elif [ -d /boot/firmware ] && [ -w /boot/firmware ]; then LOG_FILE="/boot/firmware/boot.log"; else LOG_FILE="/tmp/boot.log"; fi; DIETPI_TXT="/boot/dietpi.txt"; [ -f /boot/firmware/dietpi.txt ] && DIETPI_TXT="/boot/firmware/dietpi.txt"; [ -f /boot/dietpi.txt ] && DIETPI_TXT="/boot/dietpi.txt"; MSG="=== Boot logger service at $(date) ==="; echo "$MSG" >> "$LOG_FILE" 2>&1; [ -w "$DIETPI_TXT" ] && echo "$MSG" >> "$DIETPI_TXT" 2>&1 || true; ip addr show >> "$LOG_FILE" 2>&1; [ -w "$DIETPI_TXT" ] && ip addr show >> "$DIETPI_TXT" 2>&1 || true; systemctl status dietpi-fs_partition_resize --no-pager >> "$LOG_FILE" 2>&1 || true'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
'@
    
    $serviceContent -replace "`r`n", "`n" | Out-File -FilePath $serviceFile -Encoding ASCII -Force
    Write-Host "  ✓ Created systemd service" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not create systemd service: $_" -ForegroundColor Yellow
}

# Method 3: Add to DietPi custom script (runs after DietPi setup)
Write-Host "`n[Method 3] Updating DietPi custom script..." -ForegroundColor Yellow
$customScript = Join-Path $bootPath "Automation_Custom_Script.sh"

$customContent = @'
#!/bin/bash
# Custom script executed after DietPi setup
# Note: This writes to the same directory as dietpi.txt (/boot/dietpi.txt)

# Determine log file location - try /boot first, fallback to /tmp if /boot not available
if [ -d /boot ] && [ -w /boot ]; then
    LOG_FILE="/boot/boot.log"
elif [ -d /boot/firmware ] && [ -w /boot/firmware ]; then
    LOG_FILE="/boot/firmware/boot.log"
else
    LOG_FILE="/tmp/boot.log"
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

log_message "=== DietPi custom script at $(date) ==="
log_message "Network status:"
ip addr show >> "$LOG_FILE" 2>&1
if [ -w "$DIETPI_TXT" ]; then
    ip addr show >> "$DIETPI_TXT" 2>&1 || true
fi
log_message "DHCP lease:"
cat /var/lib/dhcp/dhclient.leases >> "$LOG_FILE" 2>&1 || log_message "No DHCP leases"
'@

$customContent -replace "`r`n", "`n" | Out-File -FilePath $customScript -Encoding ASCII -Force
Write-Host "  ✓ Created/updated custom script" -ForegroundColor Green

# Method 4: Add logging to cmdline.txt (kernel messages)
Write-Host "`n[Method 4] Checking cmdline.txt..." -ForegroundColor Yellow
$cmdlineFile = Join-Path $bootPath "cmdline.txt"

if (Test-Path $cmdlineFile) {
    $cmdline = Get-Content $cmdlineFile -Raw
    
    if ($cmdline -notmatch "loglevel=7") {
        $cmdline = $cmdline.TrimEnd() + " loglevel=7"
        $cmdline.Trim() | Out-File -FilePath $cmdlineFile -Encoding ASCII -NoNewline -Force
        Write-Host "  ✓ Added verbose kernel logging" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Verbose logging already enabled" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ cmdline.txt not found" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Early Boot Logging Setup Complete!" -ForegroundColor Green
Write-Host "`nLogging methods enabled:" -ForegroundColor Cyan
Write-Host "  ✓ boot-logger.sh (standalone script)" -ForegroundColor White
Write-Host "  ✓ rc.local (runs very early in boot, calls boot-logger.sh)" -ForegroundColor White
Write-Host "  ✓ systemd service (runs after filesystem mount)" -ForegroundColor White
Write-Host "  ✓ DietPi custom script (runs after DietPi setup)" -ForegroundColor White
Write-Host "  ✓ Kernel verbose logging (loglevel=7)" -ForegroundColor White

Write-Host "`nLogs will be written to:" -ForegroundColor Yellow
Write-Host "  - /boot/boot.log (accessible from Windows after boot)" -ForegroundColor White

Write-Host "`nAfter boot, check:" -ForegroundColor Yellow
Write-Host "  1. Mount SD card in Windows" -ForegroundColor White
Write-Host "  2. Check: $bootPath\boot.log" -ForegroundColor White
Write-Host "  3. This will show where boot process got to" -ForegroundColor White

Write-Host "`n"

