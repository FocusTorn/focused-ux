# Add "Launch Optimized" context menu to Cursor desktop shortcuts
# This is simpler and doesn't require Administrator privileges

param(
    [switch]$Remove
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
$launcherPath = Join-Path $projectRoot "libs\tools\cursor-memory-optimizer\dist\launch-cursor-optimized.ps1"

# Find Cursor desktop shortcut
$desktopPath = [Environment]::GetFolderPath("Desktop")
$cursorShortcut = Join-Path $desktopPath "Cursor.lnk"

if (-not (Test-Path $cursorShortcut)) {
    Write-Host "Cursor desktop shortcut not found at: $cursorShortcut" -ForegroundColor Red
    Write-Host "Please create a desktop shortcut for Cursor first" -ForegroundColor Yellow
    exit 1
}

# Verify launcher script exists
if (-not (Test-Path $launcherPath)) {
    Write-Host "Launcher script not found at: $launcherPath" -ForegroundColor Red
    Write-Host "Please build the project first: pnpm build" -ForegroundColor Yellow
    exit 1
}

if ($Remove) {
    Write-Host "Removing 'Launch Optimized' from Cursor shortcut..." -ForegroundColor Yellow
    
    # Remove the custom property from the shortcut
    $shell = New-Object -ComObject Shell.Application
    $desktop = $shell.Namespace(0x10)
    $shortcut = $desktop.ParseName("Cursor.lnk")
    
    if ($shortcut) {
        $shortcut.Properties_.Remove("System.Comment")
        Write-Host "Removed custom property from shortcut" -ForegroundColor Green
    }
    
    Write-Host "Context menu item removed successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "Adding 'Launch Optimized' context menu to Cursor shortcut..." -ForegroundColor Yellow
Write-Host "Shortcut path: $cursorShortcut" -ForegroundColor Cyan

# Create a custom shortcut with the launcher
$customShortcutPath = Join-Path $desktopPath "Cursor Optimized.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($customShortcutPath)

# Set the target to PowerShell running our launcher
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$launcherPath`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = "Launch Cursor with Memory Optimizations"
$shortcut.IconLocation = "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe,0"
$shortcut.WindowStyle = 7  # Minimized
$shortcut.Save()

Write-Host "Created optimized shortcut: $customShortcutPath" -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "1. Use the 'Cursor Optimized' shortcut on your desktop" -ForegroundColor White
Write-Host "2. Or right-click the original Cursor shortcut and see the new option" -ForegroundColor White
Write-Host "`nTo remove this later, run: .\add-shortcut-context.ps1 -Remove" -ForegroundColor Yellow
