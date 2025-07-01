# _scripts/ps/update-local-extension.ps1

# --- Configuration ---
# The base name of the extension you are working with.
# This script will find the full name (e.g., publisher.extension-name) automatically.
$extensionIdBase = "terminal-butler"

# --- Script Start ---

# Set strict mode and stop on errors for a more reliable script
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Determine the project root directory (which is two levels up from this script)
$projectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$vsixDir = Join-Path $projectRoot "vsix_packages"

Write-Host "Project Root: $projectRoot"
Write-Host "VSIX Directory: $vsixDir"
Write-Host "---"

# --- 1. Uninstall Existing Extension ---
Write-Host "Searching for installed extension matching '$extensionIdBase'..."

# Find the full extension ID (e.g., publisher.terminal-butler)
$installedExtension = code --list-extensions | Where-Object { $_ -like "*$extensionIdBase*" } | Select-Object -First 1

if ($installedExtension) {
    Write-Host "Found installed extension: $installedExtension. Uninstalling..."
    try {
        # Use --force to avoid any interactive prompts
        code --uninstall-extension $installedExtension --force
        Write-Host "Successfully uninstalled $installedExtension."
    } catch {
        Write-Warning "Failed to uninstall $installedExtension. It might not have been installed properly. Continuing..."
    }
} else {
    Write-Host "No installed extension matching '$extensionIdBase' found. Skipping uninstall."
}

Write-Host "---"

# --- 2. Find the Latest VSIX Package ---
Write-Host "Searching for the latest VSIX package in '$vsixDir'..."

# Get all VSIX files for the extension, then sort them by the numeric hash to find the newest one.
$latestVsix = Get-ChildItem -Path $vsixDir -Filter "$extensionIdBase*.vsix" |
    Sort-Object @{Expression = { [long]($_.Name -replace '.*\.(\d+)\.vsix$', '$1') } } -Descending |
    Select-Object -First 1

if (-not $latestVsix) {
    Write-Error "No VSIX packages for '$extensionIdBase' found in '$vsixDir'."
    # The script will stop here because of $ErrorActionPreference = 'Stop'
    exit 1
}

Write-Host "Found latest package: $($latestVsix.Name)"
Write-Host "---"

# --- 3. Install the Latest VSIX ---
Write-Host "Installing $($latestVsix.Name)..."

try {
    code --install-extension $latestVsix.FullName
    Write-Host ""
    Write-Host "✅ Successfully installed $($latestVsix.Name)!"
    Write-Host "VSCode may require a restart to fully apply the changes."
} catch {
    Write-Error "Failed to install the extension. See the output above for details."
    exit 1
}