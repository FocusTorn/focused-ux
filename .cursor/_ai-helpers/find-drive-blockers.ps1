# Find what's blocking a drive from being ejected
# Usage: .\find-drive-blockers.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nFinding blockers for drive $DriveLetter..." -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n⚠ WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some checks require admin rights. Run as Administrator for full results." -ForegroundColor Yellow
}

# Method 1: Check processes with paths on the drive
Write-Host "`n[1] Checking processes with paths on $DriveLetter..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object { $_.Path -like "$DriveLetter*" }
if ($processes) {
    Write-Host "  ⚠ Found processes:" -ForegroundColor Red
    $processes | ForEach-Object {
        Write-Host "    - $($_.ProcessName) (PID: $($_.Id)) - $($_.Path)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✓ No processes found" -ForegroundColor Green
}

# Method 2: Check for open files using openfiles.exe (requires admin)
Write-Host "`n[2] Checking for open file handles..." -ForegroundColor Yellow
if ($isAdmin) {
    try {
        # Enable openfiles tracking
        $null = openfiles /local on 2>&1
        
        # Query open files
        $openFiles = openfiles /query /fo csv 2>&1 | ConvertFrom-Csv -ErrorAction SilentlyContinue
        
        if ($openFiles) {
            $driveFiles = $openFiles | Where-Object { $_.'Files' -like "$DriveLetter*" }
            if ($driveFiles) {
                Write-Host "  ⚠ Found open file handles:" -ForegroundColor Red
                $driveFiles | ForEach-Object {
                    $pid = $_.'ID'
                    $file = $_.'Files'
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    $procName = if ($process) { $process.ProcessName } else { "Unknown" }
                    Write-Host "    - $procName (PID: $pid): $file" -ForegroundColor Gray
                }
            } else {
                Write-Host "  ✓ No open file handles found on $DriveLetter" -ForegroundColor Green
            }
        } else {
            Write-Host "  ℹ Could not query open files" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ℹ Error checking open files: $_" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ Requires Administrator rights" -ForegroundColor Yellow
}

# Method 3: Check Explorer windows
Write-Host "`n[3] Checking Explorer windows..." -ForegroundColor Yellow
try {
    $shell = New-Object -ComObject Shell.Application
    $windows = $shell.Windows()
    $driveWindows = @()
    
    foreach ($window in $windows) {
        try {
            if ($window.LocationURL -like "*$DriveLetter*") {
                $driveWindows += $window
            }
        } catch {
            # Ignore errors accessing window properties
        }
    }
    
    if ($driveWindows.Count -gt 0) {
        Write-Host "  ⚠ Found $($driveWindows.Count) Explorer window(s) on $DriveLetter" -ForegroundColor Red
        Write-Host "  → Close these windows manually" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ No Explorer windows found on $DriveLetter" -ForegroundColor Green
    }
} catch {
    Write-Host "  ℹ Could not check Explorer windows: $_" -ForegroundColor Gray
}

# Method 4: Check PowerShell variables
Write-Host "`n[4] Checking PowerShell variables..." -ForegroundColor Yellow
$vars = Get-Variable | Where-Object {
    ($_.Value -is [System.IO.FileInfo] -and $_.Value.FullName -like "$DriveLetter*") -or
    ($_.Value -is [System.IO.DirectoryInfo] -and $_.Value.FullName -like "$DriveLetter*") -or
    ($_.Value -is [string] -and $_.Value -like "$DriveLetter*")
}

if ($vars) {
    Write-Host "  ⚠ Found variables referencing ${DriveLetter}:" -ForegroundColor Red
    $vars | ForEach-Object {
        Write-Host "    - `$$($_.Name)" -ForegroundColor Gray
    }
    Write-Host "  → These will be cleared when you exit PowerShell" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No variables found" -ForegroundColor Green
}

# Method 5: Try to get more info using WMI
Write-Host "`n[5] Checking for logical disk locks..." -ForegroundColor Yellow
try {
    $disk = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $DriveLetter }
    if ($disk) {
        Write-Host "  ✓ Drive found: $($disk.VolumeName) ($($disk.Size / 1GB) GB)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ℹ Could not query disk info: $_" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  If blockers were found, close them and try ejecting again." -ForegroundColor White
Write-Host "  If no blockers found but drive still won't eject:" -ForegroundColor White
Write-Host "    1. Close this PowerShell window completely" -ForegroundColor Yellow
Write-Host "    2. Use Windows 'Safely Remove Hardware' from system tray" -ForegroundColor Yellow
Write-Host "    3. Restart Explorer: taskkill /f /im explorer.exe && start explorer.exe" -ForegroundColor Yellow
Write-Host "    4. Reboot if necessary" -ForegroundColor Yellow
Write-Host ""

