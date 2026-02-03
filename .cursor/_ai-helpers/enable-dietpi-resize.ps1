# Enable DietPi resize script on SD card (remove disable overrides)
# Usage: .\enable-dietpi-resize.ps1 -DriveLetter "E:"

param(
    [Parameter(Mandatory=$true)]
    [string]$DriveLetter
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nEnabling DietPi resize script on $DriveLetter..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

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

# Method 1: Remove systemd override if it exists
$overridePath = Join-Path $systemdPath "dietpi-fs_partition_resize.service.d"
$overrideFile = Join-Path $overridePath "override.conf"

if (Test-Path $overrideFile) {
    try {
        Remove-Item -Path $overrideFile -Force
        Write-Host "  ✓ Removed systemd override (resize will run normally)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not remove systemd override: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ No systemd override found (resize is already enabled)" -ForegroundColor Green
}

# Method 2: Remove skip flag file if it exists
$skipFlag = Join-Path $bootPath "skip_resize"
if (Test-Path $skipFlag) {
    try {
        Remove-Item -Path $skipFlag -Force
        Write-Host "  ✓ Removed skip flag file" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not remove skip flag: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ No skip flag found" -ForegroundColor Green
}

# Method 3: Restore resize script if it was backed up
$resizeScript = Join-Path $bootPath "dietpi-fs_partition_resize.sh"
$backupScript = $resizeScript + ".disabled"
if (Test-Path $backupScript) {
    try {
        Copy-Item -Path $backupScript -Destination $resizeScript -Force
        Write-Host "  ✓ Restored original resize script from backup" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not restore resize script: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ No backup script found (original should be intact)" -ForegroundColor Green
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Resize script should now run on first boot" -ForegroundColor White
Write-Host "`n  Note: Resize will:" -ForegroundColor Yellow
Write-Host "    - Expand root partition to fill SD card" -ForegroundColor White
Write-Host "    - Resize filesystem to match partition" -ForegroundColor White
Write-Host "    - Create journal if missing" -ForegroundColor White
Write-Host "`n  This may take 5-15 minutes on large SD cards" -ForegroundColor Yellow
Write-Host "`n"

