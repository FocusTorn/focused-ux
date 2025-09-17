# Add "Launch Optimized" context menu to Cursor shortcuts
# Run this script as Administrator

param(
    [switch]$Remove
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
$launcherPath = Join-Path $projectRoot "libs\tools\cursor-memory-optimizer\dist\launch-cursor-optimized.ps1"

# Registry paths for Cursor context menus
$regPaths = @(
    # File and folder context menus
    "HKCR:\*\shell\CursorOptimized",
    "HKCR:\Directory\shell\CursorOptimized",
    "HKCR:\Directory\Background\shell\CursorOptimized",
    # Taskbar pinned shortcut context menu
    "HKCU:\Software\Classes\AppX\Cursor.Cursor_*_Cursor\shell\CursorOptimized",
    # Alternative AppX path for different Cursor versions
    "HKCU:\Software\Classes\AppX\Cursor.Cursor*\shell\CursorOptimized"
)

if ($Remove) {
    Write-Host "Removing 'Launch Optimized' context menu items..." -ForegroundColor Yellow
    
    foreach ($regPath in $regPaths) {
        if (Test-Path $regPath) {
            Remove-Item $regPath -Recurse -Force
            Write-Host "Removed: $regPath" -ForegroundColor Green
        }
    }
    
    Write-Host "Context menu items removed successfully!" -ForegroundColor Green
    exit 0
}

# Check if running as Administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.Identity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator to modify registry." -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Verify launcher script exists
if (-not (Test-Path $launcherPath)) {
    Write-Host "Launcher script not found at: $launcherPath" -ForegroundColor Red
    Write-Host "Please build the project first: pnpm build" -ForegroundColor Yellow
    exit 1
}

Write-Host "Adding 'Launch Optimized' context menu items..." -ForegroundColor Yellow
Write-Host "Launcher path: $launcherPath" -ForegroundColor Cyan

# Create registry entries for different context types
$regEntries = @{
    "HKCR:\*\shell\CursorOptimized" = "Launch Cursor Optimized"
    "HKCR:\Directory\shell\CursorOptimized" = "Open in Cursor Optimized"
    "HKCR:\Directory\Background\shell\CursorOptimized" = "Open Cursor Optimized Here"
}

# Add file/folder context menus
foreach ($regPath in $regEntries.Keys) {
    $displayName = $regEntries[$regPath]
    
    # Create the main key
    New-Item -Path $regPath -Force | Out-Null
    
    # Set the display name
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $displayName
    
    # Set the icon (using Cursor's icon)
    Set-ItemProperty -Path $regPath -Name "Icon" -Value "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe,0"
    
    # Create the command key
    $commandPath = "$regPath\command"
    New-Item -Path $commandPath -Force | Out-Null
    
    # Set the command to run PowerShell with the launcher script
    $command = "powershell.exe -ExecutionPolicy Bypass -File `"$launcherPath`""
    Set-ItemProperty -Path $commandPath -Name "(Default)" -Value $command
    
    Write-Host "Added: $regPath -> $displayName" -ForegroundColor Green
}

# Find and add to Cursor's AppX registration for taskbar context menu
Write-Host "`nSearching for Cursor AppX registration..." -ForegroundColor Yellow

$appXKeys = Get-ChildItem "HKCU:\Software\Classes\AppX" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "*Cursor*" -and $_.Name -like "*Cursor*" }

if ($appXKeys) {
    foreach ($appXKey in $appXKeys) {
        $appXPath = $appXKey.PSPath
        $taskbarPath = "$appXPath\shell\CursorOptimized"
        
        Write-Host "Found Cursor AppX: $($appXKey.Name)" -ForegroundColor Cyan
        
        # Create the taskbar context menu item
        New-Item -Path $taskbarPath -Force | Out-Null
        Set-ItemProperty -Path $taskbarPath -Name "(Default)" -Value "Launch Optimized"
        Set-ItemProperty -Path $taskbarPath -Name "Icon" -Value "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe,0"
        
        # Create the command
        $taskbarCommandPath = "$taskbarPath\command"
        New-Item -Path $taskbarCommandPath -Force | Out-Null
        $command = "powershell.exe -ExecutionPolicy Bypass -File `"$launcherPath`""
        Set-ItemProperty -Path $taskbarCommandPath -Name "(Default)" -Value $command
        
        Write-Host "Added taskbar context menu: $taskbarPath" -ForegroundColor Green
    }
} else {
    Write-Host "No Cursor AppX registration found. Taskbar context menu may not work." -ForegroundColor Yellow
    Write-Host "Try pinning Cursor to taskbar first, then run this script again." -ForegroundColor Yellow
}

Write-Host "`nContext menu items added successfully!" -ForegroundColor Green
Write-Host "You can now:" -ForegroundColor Cyan
Write-Host "1. Right-click on files/folders and select 'Launch Optimized'" -ForegroundColor White
Write-Host "2. Right-click on the Cursor taskbar icon and see 'Launch Optimized'" -ForegroundColor White
Write-Host "`nTo remove these items later, run: .\add-context-menu.ps1 -Remove" -ForegroundColor Yellow




# powershell.exe -ExecutionPolicy Bypass -File "D:\_dev\!Projects\_fux\_FocusedUX\libs\tools\cursor-memory-optimizer\scripts\add-context-menu.ps1"
# "D:\_dev\!Projects\_fux\_FocusedUX\libs\tools\cursor-memory-optimizer\scripts\add-context-menu.ps1"


# powershell.exe -ExecutionPolicy Bypass -File "D:\_dev\!Projects\_fux\_FocusedUX\libs\tools\cursor-memory-optimizer\scripts\add-taskbar-context.ps1"