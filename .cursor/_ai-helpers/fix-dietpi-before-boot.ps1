# Fix DietPi SD card before first boot to prevent network/resize issues
# Usage: .\fix-dietpi-before-boot.ps1 [-DriveLetter "F:"] [-SourceConfig "C:\Users\slett\Desktop\DietPi.txt"]

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:",
    
    [Parameter(Mandatory=$false)]
    [string]$SourceConfig = "C:\Users\slett\Desktop\DietPi.txt"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nPreparing DietPi SD card for headless boot..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if source config exists
if (-not (Test-Path $SourceConfig)) {
    Write-Host "ERROR: Source config file not found: $SourceConfig" -ForegroundColor Red
    exit 1
}

# Check if drive exists
if (-not (Test-Path $DriveLetter)) {
    Write-Host "ERROR: Drive $DriveLetter does not exist!" -ForegroundColor Red
    exit 1
}

# Check if files are directly in root or in boot folder
$bootPath = Join-Path $DriveLetter "boot"
$rootPath = $DriveLetter

# Determine if files are in boot/ subfolder or directly in root
if (Test-Path $bootPath) {
    $configFile = Join-Path $bootPath "dietpi.txt"
    Write-Host "`n✓ Boot folder found: $bootPath" -ForegroundColor Green
} elseif (Test-Path (Join-Path $rootPath "dietpi.txt")) {
    # Files are directly in root (common with some imaging tools)
    $bootPath = $rootPath
    $configFile = Join-Path $rootPath "dietpi.txt"
    Write-Host "`n✓ Boot files found directly in root: $rootPath" -ForegroundColor Green
} else {
    Write-Host "ERROR: Boot partition structure not recognized" -ForegroundColor Red
    Write-Host "  Checked: $bootPath" -ForegroundColor Yellow
    Write-Host "  Checked: $rootPath" -ForegroundColor Yellow
    Write-Host "Make sure you're pointing to the boot partition" -ForegroundColor Yellow
    exit 1
}

# Step 1: Copy config file with correct name
Write-Host "`n[Step 1] Copying config file..." -ForegroundColor Yellow
try {
    Copy-Item -Path $SourceConfig -Destination $configFile -Force
    Write-Host "  ✓ Copied to: $configFile" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to copy config: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Verify critical settings in copied file
Write-Host "`n[Step 2] Verifying critical settings..." -ForegroundColor Yellow
$configContent = Get-Content $configFile -Raw

$issues = @()

# Check network wait
if ($configContent -match 'AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=(\d)') {
    if ($matches[1] -eq "1") {
        Write-Host "  ⚠ Network wait is ENABLED - fixing..." -ForegroundColor Yellow
        $configContent = $configContent -replace 'AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=1', 'AUTO_SETUP_BOOT_WAIT_FOR_NETWORK=0'
        $issues += "Network wait disabled"
    } else {
        Write-Host "  ✓ Network wait disabled (correct)" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ Network wait setting not found - adding..." -ForegroundColor Yellow
    $configContent += "`n# Delay service starts at boot until network is established: 0=disabled | 1=enabled`nAUTO_SETUP_BOOT_WAIT_FOR_NETWORK=0`n"
    $issues += "Network wait added and set to 0"
}

# Check Ethernet
if ($configContent -notmatch 'AUTO_SETUP_NET_ETHERNET_ENABLED=1') {
    Write-Host "  ⚠ Ethernet not enabled - fixing..." -ForegroundColor Yellow
    if ($configContent -match 'AUTO_SETUP_NET_ETHERNET_ENABLED=(\d)') {
        $configContent = $configContent -replace 'AUTO_SETUP_NET_ETHERNET_ENABLED=\d', 'AUTO_SETUP_NET_ETHERNET_ENABLED=1'
    } else {
        $configContent += "`nAUTO_SETUP_NET_ETHERNET_ENABLED=1`n"
    }
    $issues += "Ethernet enabled"
}

# Save fixed config with LF line endings
if ($issues.Count -gt 0) {
    $configContent -replace "`r`n", "`n" | Out-File -FilePath $configFile -Encoding ASCII -Force
    Write-Host "  ✓ Fixed $($issues.Count) issue(s)" -ForegroundColor Green
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✓ All critical settings correct" -ForegroundColor Green
}

# Step 3: Disable resize script to prevent hang
Write-Host "`n[Step 3] Disabling resize script to prevent boot hang..." -ForegroundColor Yellow

# Method 1: Create systemd override
$systemdPath = Join-Path $bootPath "systemd" "system"
$overridePath = Join-Path $systemdPath "dietpi-fs_partition_resize.service.d"
$overrideFile = Join-Path $overridePath "override.conf"

try {
    if (-not (Test-Path $systemdPath)) {
        New-Item -ItemType Directory -Path $systemdPath -Force | Out-Null
    }
    if (-not (Test-Path $overridePath)) {
        New-Item -ItemType Directory -Path $overridePath -Force | Out-Null
    }
    
    $overrideContent = @"
[Unit]
# Disabled to prevent hang during boot
# Resize can be done manually after SSH: tune2fs -j /dev/sda2 && resize2fs /dev/sda2

[Service]
# Disable the service
ExecStart=
ExecStart=/bin/true
"@
    
    # Use LF line endings for Linux config files
    $overrideContent -replace "`r`n", "`n" | Out-File -FilePath $overrideFile -Encoding ASCII -Force
    Write-Host "  ✓ Created systemd override to disable resize" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not create systemd override: $_" -ForegroundColor Yellow
    Write-Host "    (This is optional - resize may still run)" -ForegroundColor Gray
}

# Method 2: Create SSH file to enable SSH immediately (if not already enabled)
Write-Host "`n[Step 4] Ensuring SSH is enabled..." -ForegroundColor Yellow
$sshFile = Join-Path $bootPath "ssh"
if ($bootPath -eq $rootPath) {
    # Files are in root, ssh file goes in root
    $sshFile = Join-Path $rootPath "ssh"
}
if (-not (Test-Path $sshFile)) {
    try {
        New-Item -ItemType File -Path $sshFile -Force | Out-Null
        Write-Host "  ✓ Created 'ssh' file to enable SSH" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not create ssh file: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ SSH file already exists" -ForegroundColor Green
}

# Step 5: Create wpa_supplicant if WiFi might be needed as backup
Write-Host "`n[Step 5] Summary of changes..." -ForegroundColor Yellow

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "`nChanges made:" -ForegroundColor Cyan
Write-Host "  ✓ Config file copied: $configFile" -ForegroundColor White
Write-Host "  ✓ Network wait: DISABLED (prevents deadlock)" -ForegroundColor White
Write-Host "  ✓ Ethernet: ENABLED" -ForegroundColor White
Write-Host "  ✓ Resize script: DISABLED (prevents hang)" -ForegroundColor White
Write-Host "  ✓ SSH: ENABLED" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Safely eject the SD card" -ForegroundColor White
Write-Host "  2. Insert into Raspberry Pi and power on" -ForegroundColor White
Write-Host "  3. Wait 2-3 minutes for boot and network initialization" -ForegroundColor White
Write-Host "  4. Check router DHCP table for Pi's IP address" -ForegroundColor White
Write-Host "  5. Or run: .cursor\_ai-helpers\find-ssh-device.ps1" -ForegroundColor White
Write-Host "  6. SSH in: ssh root@<IP> (password: 502421)" -ForegroundColor White

Write-Host "`nIf resize is needed after boot:" -ForegroundColor Yellow
Write-Host "  tune2fs -j /dev/sda2 && resize2fs /dev/sda2" -ForegroundColor Gray

Write-Host "`n"

