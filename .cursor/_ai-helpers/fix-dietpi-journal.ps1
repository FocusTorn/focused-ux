# Fix DietPi missing journal issue
# This script creates a helper script to run on the Pi to add the journal manually
# Usage: .\fix-dietpi-journal.ps1 [-BootDrive "F:"] [-SSHHost "192.168.1.168"] [-SSHUser "root"] [-SSHPassword "502421"]

param(
    [Parameter(Mandatory=$false)]
    [string]$BootDrive = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHHost = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHPassword = "502421"
)

Write-Host "`n=== DietPi Journal Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Function to find boot drive
function Find-BootDrive {
    $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 }
    foreach ($drive in $drives) {
        $path = "$($drive.Name):\"
        if (Test-Path (Join-Path $path "dietpi.txt")) {
            return $path
        }
    }
    return $null
}

# Determine boot drive
if (-not $BootDrive) {
    $BootDrive = Find-BootDrive
    if (-not $BootDrive) {
        Write-Host "ERROR: Could not find boot drive with dietpi.txt" -ForegroundColor Red
        Write-Host "Please specify boot drive: -BootDrive `"F:`"" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Boot drive: $BootDrive" -ForegroundColor Green

# Create fix script to run on Pi
$fixScript = Join-Path $BootDrive "fix-journal.sh"
$fixScriptContent = @'
#!/bin/bash
# Fix DietPi missing journal - adds journal to root filesystem
# Run this on the Pi: sudo bash /boot/fix-journal.sh

set -e

echo "=== DietPi Journal Fix Script ==="
echo ""

# Get root filesystem device
ROOT_DEV=$(findmnt -n -o SOURCE /)
if [ -z "$ROOT_DEV" ]; then
    echo "ERROR: Could not determine root filesystem device"
    exit 1
fi

echo "Root filesystem device: $ROOT_DEV"
echo ""

# Check if journal already exists
if tune2fs -l "$ROOT_DEV" 2>/dev/null | grep -q "has_journal"; then
    JOURNAL_EXISTS=$(tune2fs -l "$ROOT_DEV" 2>/dev/null | grep "has_journal" | awk '{print $3}')
    if [ "$JOURNAL_EXISTS" = "1" ]; then
        echo "Journal already exists on $ROOT_DEV"
        echo "No action needed."
        exit 0
    fi
fi

echo "Adding journal to $ROOT_DEV..."
echo "This may take a few minutes on large drives..."
echo ""

# Add journal using tune2fs
if tune2fs -j "$ROOT_DEV"; then
    echo ""
    echo "SUCCESS: Journal added successfully!"
    echo ""
    echo "Verifying journal..."
    if tune2fs -l "$ROOT_DEV" 2>/dev/null | grep -q "has_journal.*1"; then
        echo "Journal verified: OK"
        echo ""
        echo "You can now reboot. The journal error should be gone."
    else
        echo "WARNING: Journal may not have been created correctly"
    fi
else
    echo ""
    echo "ERROR: Failed to add journal"
    echo "Check the error messages above"
    exit 1
fi
'@

# Write script to boot drive
$fixScriptContent -replace "`r`n", "`n" | Out-File -FilePath $fixScript -Encoding ASCII -Force
Write-Host "  ✓ Created fix-journal.sh on boot drive" -ForegroundColor Green

# Optionally run via SSH if host provided
if ($SSHHost) {
    Write-Host ""
    Write-Host "Attempting to run fix script via SSH..." -ForegroundColor Cyan
    Write-Host "Host: $SSHHost" -ForegroundColor Gray
    Write-Host "User: $SSHUser" -ForegroundColor Gray
    
    # Create SSH command
    $sshCommand = @"
bash /boot/fix-journal.sh
"@
    
    # Try to run via SSH (requires ssh command or plink)
    try {
        # Try using ssh command if available
        $env:SSH_PASSWORD = $SSHPassword
        $sshArgs = @(
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "${SSHUser}@${SSHHost}",
            $sshCommand
        )
        
        # Use sshpass if available, otherwise prompt
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            Write-Host "Running via SSH (using sshpass)..." -ForegroundColor Yellow
            $sshpassArgs = @("-p", $SSHPassword, "ssh") + $sshArgs
            & sshpass $sshpassArgs
        } elseif (Get-Command plink -ErrorAction SilentlyContinue) {
            Write-Host "Running via SSH (using plink)..." -ForegroundColor Yellow
            echo y | plink -ssh -pw $SSHPassword "${SSHUser}@${SSHHost}" $sshCommand
        } else {
            Write-Host ""
            Write-Host "SSH tools not found. Please run manually:" -ForegroundColor Yellow
            Write-Host "  ssh ${SSHUser}@${SSHHost}" -ForegroundColor White
            Write-Host "  sudo bash /boot/fix-journal.sh" -ForegroundColor White
        }
    } catch {
        Write-Host ""
        Write-Host "Could not run via SSH automatically." -ForegroundColor Yellow
        Write-Host "Please run manually:" -ForegroundColor Yellow
        Write-Host "  ssh ${SSHUser}@${SSHHost}" -ForegroundColor White
        Write-Host "  sudo bash /boot/fix-journal.sh" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "To fix the journal, SSH into the Pi and run:" -ForegroundColor Yellow
    Write-Host "  sudo bash /boot/fix-journal.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "Or provide SSH details to run automatically:" -ForegroundColor Gray
    Write-Host "  .\fix-dietpi-journal.ps1 -SSHHost `"192.168.1.168`"" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Script Complete ===" -ForegroundColor Cyan
Write-Host ""

