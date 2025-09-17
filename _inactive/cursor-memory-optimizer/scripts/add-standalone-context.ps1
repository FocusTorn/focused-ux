# Add standalone Cursor optimizer to context menu
# This script adds the standalone optimizer to Cursor's shell registration

param(
    [switch]$Remove
)

# Check if running as Administrator
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges to modify the registry." -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$standaloneScript = Join-Path $scriptPath "standalone-cursor-optimizer.ps1"

# Verify standalone script exists
if (-not (Test-Path $standaloneScript)) {
    Write-Host "Standalone script not found at: $standaloneScript" -ForegroundColor Red
    exit 1
}

if ($Remove) {
    Write-Host "Removing 'Launch Optimized' from Cursor context menu..." -ForegroundColor Yellow
    
    # Remove from Cursor shell registration
    $cursorShellPath = "HKCU:\Software\Classes\Cursor\shell\CursorOptimized"
    if (Test-Path $cursorShellPath) {
        Remove-Item $cursorShellPath -Recurse -Force
        Write-Host "Removed: $cursorShellPath" -ForegroundColor Green
    }
    
    Write-Host "Context menu item removed successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "Adding 'Launch Optimized' to Cursor context menu..." -ForegroundColor Yellow
Write-Host "Standalone script: $standaloneScript" -ForegroundColor Cyan

# Add to Cursor's shell registration
$cursorShellPath = "HKCU:\Software\Classes\Cursor\shell\CursorOptimized"

# Remove existing entry if it exists
if (Test-Path $cursorShellPath) {
    Remove-Item $cursorShellPath -Recurse -Force
    Write-Host "Removed existing entry" -ForegroundColor Yellow
}

# Create the context menu item
New-Item -Path $cursorShellPath -Force | Out-Null
Set-ItemProperty -Path $cursorShellPath -Name "(Default)" -Value "Launch Optimized"

# Try to set the icon
try {
    $cursorExe = "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe"
    if (Test-Path $cursorExe) {
        Set-ItemProperty -Path $cursorShellPath -Name "Icon" -Value "$cursorExe,0"
    }
} catch {
    Write-Host "Could not set icon (this is optional)" -ForegroundColor Yellow
}

# Create the command
$commandPath = "$cursorShellPath\command"
New-Item -Path $commandPath -Force | Out-Null

# Set the command to run the standalone script
$command = "powershell.exe -ExecutionPolicy Bypass -File `"$standaloneScript`""
Set-ItemProperty -Path $commandPath -Name "(Default)" -Value $command

Write-Host "Added context menu: $cursorShellPath" -ForegroundColor Green

Write-Host "`n✅ Success! 'Launch Optimized' has been added to Cursor's context menu." -ForegroundColor Green
Write-Host "`nTo test:" -ForegroundColor Cyan
Write-Host "1. Right-click on any file or folder" -ForegroundColor White
Write-Host "2. You should see 'Launch Optimized' in the menu" -ForegroundColor White
Write-Host "3. Click it to launch Cursor with memory optimizations" -ForegroundColor White
Write-Host "`nTo remove this later, run: .\add-standalone-context.ps1 -Remove" -ForegroundColor Yellow
