# Self-elevating script to add "Launch Optimized" to Cursor taskbar context menu
# This script will automatically prompt for UAC elevation if needed

# Check if running as Administrator, if not, self-elevate
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges to modify the registry." -ForegroundColor Yellow
    Write-Host "Attempting to self-elevate..." -ForegroundColor Cyan
    
    # Get the current script path
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = $PSCommandPath
    }
    
    # Create the elevation arguments
    $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""
    
    try {
        # Start a new elevated PowerShell process
        Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -Verb RunAs -Wait
        exit 0
    }
    catch {
        Write-Host "Failed to self-elevate. Please run this script as Administrator manually." -ForegroundColor Red
        Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Running with Administrator privileges!" -ForegroundColor Green
Write-Host "Adding 'Launch Optimized' to Cursor taskbar context menu..." -ForegroundColor Cyan

# Get the script directory and project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)

# Create a simple launcher command that runs the CMO tool directly
$cmoCommand = "tsx --expose-gc `"$projectRoot\libs\tools\cursor-memory-optimizer\src\index.ts`" launch"

Write-Host "Script path: $scriptPath" -ForegroundColor Cyan
Write-Host "Project root: $projectRoot" -ForegroundColor Cyan
Write-Host "CMO command: $cmoCommand" -ForegroundColor Cyan

# Search for Cursor's AppX registration
Write-Host "`nSearching for Cursor AppX registration..." -ForegroundColor Yellow

# List all AppX entries to see what's available
Write-Host "Available AppX entries:" -ForegroundColor Yellow
Get-ChildItem "HKCU:\Software\Classes\AppX" -ErrorAction SilentlyContinue | 
    ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Gray }

# Search for Cursor specifically
$appXKeys = Get-ChildItem "HKCU:\Software\Classes\AppX" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "*Cursor*" }

Write-Host "`nCursor-related AppX entries found:" -ForegroundColor Yellow
if ($appXKeys) {
    $appXKeys | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Cyan }
} else {
    Write-Host "  None found" -ForegroundColor Red
}

# Also check alternative locations
Write-Host "`nChecking alternative registry locations..." -ForegroundColor Yellow

# Check for Cursor in shell extensions
$shellKeys = @(
    "HKCR:\Cursor.Cursor\shell",
    "HKCR:\Cursor\shell",
    "HKCU:\Software\Classes\Cursor.Cursor\shell",
    "HKCU:\Software\Classes\Cursor\shell"
)

foreach ($shellKey in $shellKeys) {
    if (Test-Path $shellKey) {
        Write-Host "Found shell key: $shellKey" -ForegroundColor Green
        $taskbarPath = "$shellKey\CursorOptimized"
        
        # Remove existing entry if it exists
        if (Test-Path $taskbarPath) {
            Remove-Item $taskbarPath -Recurse -Force
            Write-Host "Removed existing entry" -ForegroundColor Yellow
        }
        
        # Create the context menu item
        New-Item -Path $taskbarPath -Force | Out-Null
        Set-ItemProperty -Path $taskbarPath -Name "(Default)" -Value "Launch Optimized"
        
        # Try to set the icon
        try {
            $cursorExe = "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe"
            if (Test-Path $cursorExe) {
                Set-ItemProperty -Path $taskbarPath -Name "Icon" -Value "$cursorExe,0"
            }
        } catch {
            Write-Host "Could not set icon (this is optional)" -ForegroundColor Yellow
        }
        
        # Create the command
        $taskbarCommandPath = "$taskbarPath\command"
        New-Item -Path $taskbarCommandPath -Force | Out-Null
        
        # Set the command to run tsx directly with the CMO launch command
        $command = "powershell.exe -ExecutionPolicy Bypass -Command `"cd '$projectRoot'; $cmoCommand`""
        Set-ItemProperty -Path $taskbarCommandPath -Name "(Default)" -Value $command
        
        Write-Host "Added context menu: $taskbarPath" -ForegroundColor Green
    }
}

if ($appXKeys) {
    foreach ($appXKey in $appXKeys) {
        $appXPath = $appXKey.PSPath
        $taskbarPath = "$appXPath\shell\CursorOptimized"
        
        Write-Host "Processing AppX: $($appXKey.Name)" -ForegroundColor Cyan
        
        # Remove existing entry if it exists
        if (Test-Path $taskbarPath) {
            Remove-Item $taskbarPath -Recurse -Force
            Write-Host "Removed existing entry" -ForegroundColor Yellow
        }
        
        # Create the taskbar context menu item
        New-Item -Path $taskbarPath -Force | Out-Null
        Set-ItemProperty -Path $taskbarPath -Name "(Default)" -Value "Launch Optimized"
        
        # Try to set the icon (may fail if Cursor path is different)
        try {
            $cursorExe = "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe"
            if (Test-Path $cursorExe) {
                Set-ItemProperty -Path $taskbarPath -Name "Icon" -Value "$cursorExe,0"
            }
        } catch {
            Write-Host "Could not set icon (this is optional)" -ForegroundColor Yellow
        }
        
        # Create the command
        $taskbarCommandPath = "$taskbarPath\command"
        New-Item -Path $taskbarCommandPath -Force | Out-Null
        
        # Set the command to run tsx directly with the CMO launch command
        $command = "powershell.exe -ExecutionPolicy Bypass -Command `"cd '$projectRoot'; $cmoCommand`""
        Set-ItemProperty -Path $taskbarCommandPath -Name "(Default)" -Value $command
        
        Write-Host "Added taskbar context menu: $taskbarPath" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Success! 'Launch Optimized' has been added to Cursor's context menus." -ForegroundColor Green
    Write-Host "`nTo test:" -ForegroundColor Cyan
    Write-Host "1. Right-click the Cursor taskbar icon" -ForegroundColor White
    Write-Host "2. You should see 'Launch Optimized' in the menu" -ForegroundColor White
    Write-Host "3. Click it to launch Cursor with memory optimizations" -ForegroundColor White
    
} else {
    Write-Host "`n❌ No Cursor AppX registration found!" -ForegroundColor Red
    Write-Host "`nThis usually means:" -ForegroundColor Yellow
    Write-Host "1. Cursor is not pinned to the taskbar" -ForegroundColor White
    Write-Host "2. Cursor was installed differently than expected" -ForegroundColor White
    Write-Host "3. Cursor uses a different registration method" -ForegroundColor White
    Write-Host "`nTo fix:" -ForegroundColor Cyan
    Write-Host "1. Pin Cursor to your taskbar first" -ForegroundColor White
    Write-Host "2. Run this script again" -ForegroundColor White
    Write-Host "3. Or check if Cursor appears in the alternative locations above" -ForegroundColor White
}

Write-Host "`nPress Enter to exit..."
Read-Host
