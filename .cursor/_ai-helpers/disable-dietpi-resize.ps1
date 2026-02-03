# Disable DietPi resize script on SD card before first boot
# Usage: .\disable-dietpi-resize.ps1 -DriveLetter "E:"

param(
    [Parameter(Mandatory=$true)]
    [string]$DriveLetter
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nDisabling DietPi resize script on $DriveLetter..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if drive exists
if (-not (Test-Path $DriveLetter)) {
    Write-Host "ERROR: Drive $DriveLetter does not exist!" -ForegroundColor Red
    exit 1
}

# Determine boot path - could be directly at drive root or in boot subdirectory
$bootPath = $DriveLetter
if (Test-Path (Join-Path $DriveLetter "boot")) {
    $bootPath = Join-Path $DriveLetter "boot"
} elseif (-not (Test-Path (Join-Path $DriveLetter "dietpi.txt"))) {
    Write-Host "ERROR: Boot partition not found at $DriveLetter" -ForegroundColor Red
    Write-Host "Make sure you're pointing to the boot partition (usually first partition)" -ForegroundColor Yellow
    Write-Host "Expected to find dietpi.txt in the root of the drive" -ForegroundColor Yellow
    exit 1
}

# Verify it's the boot partition by checking for dietpi.txt
if (-not (Test-Path (Join-Path $bootPath "dietpi.txt"))) {
    Write-Host "ERROR: dietpi.txt not found at $bootPath" -ForegroundColor Red
    Write-Host "Make sure you're pointing to the boot partition" -ForegroundColor Yellow
    exit 1
}

$systemdPath = Join-Path $bootPath "systemd" "system"

Write-Host "`nBoot partition found: $bootPath" -ForegroundColor Green

# Method 1: Try to disable via systemd override
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
# Resize can be done manually after boot: tune2fs -j /dev/sda2 && resize2fs /dev/sda2

[Service]
# Disable the service
ExecStart=
ExecStart=/bin/true
"@
    
    Set-Content -Path $overrideFile -Value $overrideContent
    Write-Host "  ✓ Created systemd override to disable resize service" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not create systemd override: $_" -ForegroundColor Yellow
}

# Method 2: Create a flag file to skip resize (if DietPi checks for it)
$skipFlag = Join-Path $bootPath "skip_resize"
try {
    Set-Content -Path $skipFlag -Value "1" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Created skip flag file" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not create skip flag: $_" -ForegroundColor Yellow
}

# Method 3: Rename or modify the resize script if it exists in boot
$resizeScript = Join-Path $bootPath "dietpi-fs_partition_resize.sh"
if (Test-Path $resizeScript) {
    $backupScript = $resizeScript + ".disabled"
    try {
        Copy-Item -Path $resizeScript -Destination $backupScript -Force
        Write-Host "  ✓ Backed up resize script" -ForegroundColor Green
        
        # Create a minimal script that just exits
        $minimalScript = @"
#!/bin/bash
# Resize script disabled - run manually after boot:
# tune2fs -j /dev/sda2 && resize2fs /dev/sda2
exit 0
"@
        Set-Content -Path $resizeScript -Value $minimalScript
        Write-Host "  ✓ Replaced resize script with no-op version" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not modify resize script: $_" -ForegroundColor Yellow
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Attempted to disable resize script via multiple methods" -ForegroundColor White
Write-Host "`n  If resize still runs, you can:" -ForegroundColor Yellow
Write-Host "    1. Wait for it to timeout (may take 10+ minutes)" -ForegroundColor White
Write-Host "    2. Interrupt boot and fix manually after SSH access" -ForegroundColor White
Write-Host "    3. Check DietPi documentation for resize script options" -ForegroundColor White
Write-Host "`n  To manually fix after boot:" -ForegroundColor Yellow
Write-Host "    tune2fs -j /dev/sda2 && resize2fs /dev/sda2" -ForegroundColor White
Write-Host "`n"

