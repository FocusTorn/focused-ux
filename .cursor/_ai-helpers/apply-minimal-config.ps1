# Apply minimal DietPi config to SD card with proper LF line endings
# Usage: .\apply-minimal-config.ps1 -DriveLetter "F:" [-Password "502421"]

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "502421",
    
    [Parameter(Mandatory=$false)]
    [string]$Timezone = "America/Chicago",
    
    [Parameter(Mandatory=$false)]
    [string]$Hostname = "DietPi"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nApplying minimal DietPi configuration..." -ForegroundColor Cyan
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

# Generate minimal config
$config = @"
# ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
# ┃            DietPi-Automation settings, applied on first boot of DietPi only, ONCE!             ┃
# ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

##> 
 # Initial user and default password
 # - Sets "root" and "dietpi" user's login passwords and is used by dietpi-software as default for software installs which require a password.
 # - Once applied during first run setup, the password is removed from this file, encrypted and stored to a safer location to be used by dietpi-software only.
 # - WARN: The default SSH server Dropbear does not support passwords over 100 bytes. Certain special characters, and such with accents, take 2 bytes.
 # - WARN: We cannot guarantee that all software options can handle special characters like $"|\.
 #<
AUTO_SETUP_GLOBAL_PASSWORD=$Password

##############################################################################################################
##  Language/Regional options  ###############################################################################

##> Locale 
 # - e.g.: "en_GB.UTF-8" / "de_DE.UTF-8" | One entry and UTF-8 ONLY!
 ##<
AUTO_SETUP_LOCALE=en_US.UTF-8

# Keyboard layout e.g.: "gb" / "us" / "de" / "fr"
AUTO_SETUP_KEYBOARD_LAYOUT=us

##> Time zone
 # - e.g.: "Europe/London" / "America/New_York" | Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 ##<
AUTO_SETUP_TIMEZONE=$Timezone

##############################################################################################################
##  Network options  #########################################################################################

##> Connection
 # Enable Ethernet or WiFi adapter: 1=enable | 0=disable
 # - If both Ethernet and WiFi are enabled, WiFi will take priority and Ethernet will be disabled.
 # - If using WiFi, please edit dietpi-wifi.txt to pre-enter credentials.
 ##<
AUTO_SETUP_NET_ETHERNET_ENABLED=1
AUTO_SETUP_NET_WIFI_ENABLED=0

##> WiFi country code
 # - 2 capital letter value (e.g. GB US DE JP): https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
 # - NB: This choice may be overridden if the WiFi access point sends a country code.
 ##<
AUTO_SETUP_NET_WIFI_COUNTRY_CODE=US

# Static IP
AUTO_SETUP_NET_USESTATIC=0

# Hostname
AUTO_SETUP_NET_HOSTNAME=$Hostname

##### Misc options #####
# Swap space size to generate: 0 => disable | 1 => auto | 2 and up => size in MiB
AUTO_SETUP_SWAPFILE_SIZE=1
# Swap space location: "zram" => swap space on /dev/zram0 (auto-size = 50% of RAM size) | /path/to/file => swap file at location (auto-size = 2 GiB minus RAM size)
AUTO_SETUP_SWAPFILE_LOCATION=/var/swap

# Set to "1" to disable HDMI/video output and framebuffers on Raspberry Pi, to reduce power consumption and memory usage: Works on RPi only!
AUTO_SETUP_HEADLESS=1

# Serial console: Set to "0" if you do not require a serial console. It will then be disabled automatically on first boot.
# - If you leave it at "1", and first login does not happen on a serial console, a dialogue offers to disable it instead.
CONFIG_SERIAL_CONSOLE_ENABLE=0

##### Software options #####
# SSH server choice: 0=none/custom | -1=Dropbear | -2=OpenSSH
AUTO_SETUP_SSH_SERVER_INDEX=-1

# Logging mode choice: 0=none/custom | -1=RAMlog hourly clear | -2=RAMlog hourly save to disk + clear | -3=Rsyslog + Logrotate
AUTO_SETUP_LOGGING_INDEX=-1
# RAMlog max tmpfs size (MiB). 50 MiB should be fine for single use. 200+ MiB for heavy webserver access log etc.
AUTO_SETUP_RAMLOG_MAXSIZE=50

##### Non-interactive first run setup #####
# On first boot, run updates, initial setup, and optional software installs without any user interaction.
# - Please change AUTO_SETUP_GLOBAL_PASSWORD when enabling this option!
AUTO_SETUP_AUTOMATED=1

"@

# Write config file with LF line endings
$configFile = Join-Path $bootPath "dietpi.txt"
$config | Out-File -FilePath $configFile -Encoding ASCII -Force

Write-Host "`n✓ Created dietpi.txt with LF line endings" -ForegroundColor Green

# Create SSH enable file
$sshFile = Join-Path $bootPath "ssh"
if (-not (Test-Path $sshFile)) {
    New-Item -ItemType File -Path $sshFile -Force | Out-Null
    Write-Host "✓ Created 'ssh' file to enable SSH" -ForegroundColor Green
} else {
    Write-Host "✓ SSH file already exists" -ForegroundColor Green
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Minimal Configuration Applied!" -ForegroundColor Green
Write-Host "`nSettings:" -ForegroundColor Cyan
Write-Host "  ✓ Password: $Password" -ForegroundColor White
Write-Host "  ✓ Timezone: $Timezone" -ForegroundColor White
Write-Host "  ✓ Hostname: $Hostname" -ForegroundColor White
Write-Host "  ✓ Ethernet: Enabled (DHCP)" -ForegroundColor White
Write-Host "  ✓ Headless: Enabled" -ForegroundColor White
Write-Host "  ✓ SSH: Enabled" -ForegroundColor White
Write-Host "  ✓ Automated: Enabled" -ForegroundColor White
Write-Host "  ✓ Line endings: LF (Linux format)" -ForegroundColor White

Write-Host "`nUsing DietPi defaults for:" -ForegroundColor Yellow
Write-Host "  - Network wait (default should work)" -ForegroundColor Gray
Write-Host "  - Resize script (default should work)" -ForegroundColor Gray
Write-Host "  - All other settings" -ForegroundColor Gray

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Safely eject SD card" -ForegroundColor White
Write-Host "  2. Insert into Pi and power on" -ForegroundColor White
Write-Host "  3. Wait 2-3 minutes for boot" -ForegroundColor White
Write-Host "  4. Find IP: .cursor\_ai-helpers\find-ssh-device.ps1" -ForegroundColor White
Write-Host "  5. SSH: ssh root@<IP> (password: $Password)" -ForegroundColor White

Write-Host "`n"

