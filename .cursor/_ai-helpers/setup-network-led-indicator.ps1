# Setup network LED indicator for Raspberry Pi
# Flashes power LED when network connects (0.2s on, 0.2s off, then reverts)
# Triggers on LAN (eth0) or WiFi (wlan0) connection
# Usage: .\setup-network-led-indicator.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nSetting up network LED indicator..." -ForegroundColor Cyan
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

# Create network LED indicator script
Write-Host "`nCreating network LED indicator script..." -ForegroundColor Yellow
$ledScript = Join-Path $bootPath "network-led-indicator.sh"

$scriptContent = @'
#!/bin/bash
# Network LED indicator - flashes power LED when network connects
# 0.2s on, 0.2s off, then revert to original state
# Triggers on LAN (eth0) or WiFi (wlan0) connection

# Find power LED (varies by Pi model)
# IMPORTANT: Exclude activity/status LED (led0, ACT) - we only want power LED
LED_PATH=""

# First, try to find power LED by name (most reliable)
for led in /sys/class/leds/*/; do
    if [ -f "$led/trigger" ]; then
        led_name=$(basename "$led")
        # Exclude activity/status LED
        if [[ "$led_name" == *"ACT"* ]] || [[ "$led_name" == "led0" ]] || [[ "$led_name" == *"activity"* ]] || [[ "$led_name" == *"status"* ]]; then
            continue
        fi
        # Check if it's a power LED (PWR, led1, or similar)
        if [[ "$led_name" == *"PWR"* ]] || [[ "$led_name" == "led1" ]] || [[ "$led_name" == *"power"* ]]; then
            LED_PATH="$led"
            break
        fi
    fi
done

# Fallback: try common paths (prioritize power LED, exclude activity LED)
if [ -z "$LED_PATH" ]; then
    # Try led1 first (power LED on most Pi models)
    if [ -d "/sys/class/leds/led1" ]; then
        LED_PATH="/sys/class/leds/led1"
    # Try PWR
    elif [ -d "/sys/class/leds/PWR" ]; then
        LED_PATH="/sys/class/leds/PWR"
    # Try rpi:led1 (Raspberry Pi 4/5 naming)
    elif [ -d "/sys/class/leds/rpi:led1" ]; then
        LED_PATH="/sys/class/leds/rpi:led1"
    # Try rpi:PWR (Raspberry Pi 4/5 naming)
    elif [ -d "/sys/class/leds/rpi:PWR" ]; then
        LED_PATH="/sys/class/leds/rpi:PWR"
    fi
fi

if [ -z "$LED_PATH" ] || [ ! -f "$LED_PATH/trigger" ]; then
    echo "Power LED not found, skipping LED indicator"
    exit 0
fi

# Function to flash LED
flash_led() {
    local led="$1"
    local on_time=0.2
    local off_time=0.2
    
    # Save current trigger and brightness
    local original_trigger=$(cat "$led/trigger" | grep -o '\[.*\]' | tr -d '[]')
    local original_brightness=$(cat "$led/brightness" 2>/dev/null || echo "0")
    
    # Set to none trigger so we can control it manually
    echo none > "$led/trigger"
    
    # Flash once: on for 0.2s, off for 0.2s
    echo 1 > "$led/brightness"  # On
    sleep $on_time
    echo 0 > "$led/brightness"  # Off
    sleep $off_time
    
    # Restore original trigger and brightness
    if [ -n "$original_trigger" ]; then
        echo "$original_trigger" > "$led/trigger"
    else
        # Default to default-on if no original trigger found
        echo default-on > "$led/trigger"
    fi
    
    # Restore original brightness if trigger doesn't control it
    if [ "$original_trigger" = "none" ] || [ -z "$original_trigger" ]; then
        echo "$original_brightness" > "$led/brightness" 2>/dev/null || true
    fi
}

# Check if network interface is up (LAN or WiFi)
check_network_connected() {
    # Check for Ethernet (eth0)
    if ip link show eth0 2>/dev/null | grep -q "state UP"; then
        if ip addr show eth0 2>/dev/null | grep -q "inet.*scope global"; then
            return 0
        fi
    fi
    
    # Check for WiFi (wlan0)
    if ip link show wlan0 2>/dev/null | grep -q "state UP"; then
        if ip addr show wlan0 2>/dev/null | grep -q "inet.*scope global"; then
            return 0
        fi
    fi
    
    return 1
}

# Main execution - flash LED when network connects
if check_network_connected; then
    echo "Network connected (LAN or WiFi) - flashing power LED"
    flash_led "$LED_PATH"
else
    echo "Network not connected"
fi
'@

# Write script with LF line endings
$scriptContent -replace "`r`n", "`n" | Out-File -FilePath $ledScript -Encoding ASCII -Force
Write-Host "  ✓ Created network LED indicator script" -ForegroundColor Green

# Create systemd service to run on network connection
Write-Host "`nCreating systemd service..." -ForegroundColor Yellow
$systemdPath = Join-Path $bootPath "systemd" "system"
$serviceFile = Join-Path $systemdPath "network-led-indicator.service"

try {
    if (-not (Test-Path $systemdPath)) {
        New-Item -ItemType Directory -Path $systemdPath -Force | Out-Null
    }
    
    $serviceContent = @'
[Unit]
Description=Network LED Indicator
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/boot/network-led-indicator.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
WantedBy=network-online.target
'@
    
    $serviceContent -replace "`r`n", "`n" | Out-File -FilePath $serviceFile -Encoding ASCII -Force
    Write-Host "  ✓ Created systemd service" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not create systemd service: $_" -ForegroundColor Yellow
}

# Create network interface hooks (if-up.d and if-down.d)
Write-Host "`nCreating network interface hooks..." -ForegroundColor Yellow
$networkHooksScript = @'
#!/bin/bash
# Network interface hook - flash LED when interface comes up
# This script is called by network interface up/down events

# Only run for eth0 or wlan0
if [ "$IFACE" != "eth0" ] && [ "$IFACE" != "wlan0" ]; then
    exit 0
fi

# Only run when interface comes up
if [ "$MODE" != "start" ] && [ "$PHASE" != "post-up" ]; then
    exit 0
fi

# Run LED indicator script
if [ -f /boot/network-led-indicator.sh ]; then
    bash /boot/network-led-indicator.sh
fi
'@

# Note: These hooks will be created on the Pi after first boot
# We'll add instructions in the custom script
Write-Host "  ✓ Network hooks will be created on first boot" -ForegroundColor Green

# Alternative: Add to DietPi custom script
Write-Host "`nAdding to DietPi custom script..." -ForegroundColor Yellow
$customScript = Join-Path $bootPath "Automation_Custom_Script.sh"

if (-not (Test-Path $customScript)) {
    $customScriptContent = @'
#!/bin/bash
# Custom script executed after DietPi setup
# Flash LED when network is connected

# Create network interface hooks for eth0 and wlan0
if [ ! -f /etc/network/if-up.d/network-led-hook ]; then
    cat > /etc/network/if-up.d/network-led-hook << 'HOOKEOF'
#!/bin/bash
# Network interface hook - flash LED when interface comes up
if [ "$IFACE" = "eth0" ] || [ "$IFACE" = "wlan0" ]; then
    if [ "$MODE" = "start" ] || [ "$PHASE" = "post-up" ]; then
        if [ -f /boot/network-led-indicator.sh ]; then
            bash /boot/network-led-indicator.sh
        fi
    fi
fi
HOOKEOF
    chmod +x /etc/network/if-up.d/network-led-hook
fi

# Run LED indicator script if network is already up
if [ -f /boot/network-led-indicator.sh ]; then
    bash /boot/network-led-indicator.sh
fi
'@
    
    $customScriptContent -replace "`r`n", "`n" | Out-File -FilePath $customScript -Encoding ASCII -Force
    Write-Host "  ✓ Created custom script with network hooks" -ForegroundColor Green
} else {
    Write-Host "  ✓ Custom script already exists (will add LED script call)" -ForegroundColor Green
    $existing = Get-Content $customScript -Raw
    if ($existing -notmatch "network-led-indicator") {
        $hookAddition = @'

# Create network interface hooks for eth0 and wlan0
if [ ! -f /etc/network/if-up.d/network-led-hook ]; then
    cat > /etc/network/if-up.d/network-led-hook << 'HOOKEOF'
#!/bin/bash
# Network interface hook - flash LED when interface comes up
if [ "$IFACE" = "eth0" ] || [ "$IFACE" = "wlan0" ]; then
    if [ "$MODE" = "start" ] || [ "$PHASE" = "post-up" ]; then
        if [ -f /boot/network-led-indicator.sh ]; then
            bash /boot/network-led-indicator.sh
        fi
    fi
fi
HOOKEOF
    chmod +x /etc/network/if-up.d/network-led-hook
fi

# Flash LED on network connection
if [ -f /boot/network-led-indicator.sh ]; then
    bash /boot/network-led-indicator.sh
fi
'@
        $existing += $hookAddition
        $existing -replace "`r`n", "`n" | Out-File -FilePath $customScript -Encoding ASCII -Force
        Write-Host "  ✓ Added LED script call and network hooks to existing custom script" -ForegroundColor Green
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Network LED Indicator Setup Complete!" -ForegroundColor Green
Write-Host "`nWhat was created:" -ForegroundColor Cyan
Write-Host "  ✓ /boot/network-led-indicator.sh - LED flashing script" -ForegroundColor White
Write-Host "  ✓ systemd service (optional, for automatic execution)" -ForegroundColor White
Write-Host "  ✓ Custom script integration" -ForegroundColor White

Write-Host "`nHow it works:" -ForegroundColor Yellow
Write-Host "  - Monitors LAN (eth0) and WiFi (wlan0) interfaces" -ForegroundColor White
Write-Host "  - Flashes power LED: 0.2s on, 0.2s off, then reverts to original state" -ForegroundColor White
Write-Host "  - Works on Raspberry Pi (all models with controllable LEDs)" -ForegroundColor White

Write-Host "`nThe LED will flash when:" -ForegroundColor Yellow
Write-Host "  - Ethernet (eth0) connection is established with IP address" -ForegroundColor White
Write-Host "  - WiFi (wlan0) connection is established with IP address" -ForegroundColor White

Write-Host "`n"

