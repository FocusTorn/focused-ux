# Fix corrupted dietpi.txt file - restores proper format
# Usage: .\fix-corrupted-dietpi-config.ps1 -DriveLetter "F:"

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nFixing corrupted dietpi.txt..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Check if drive exists
if (-not (Test-Path $DriveLetter)) {
    Write-Host "ERROR: Drive $DriveLetter does not exist!" -ForegroundColor Red
    exit 1
}

# Determine boot path
$bootPath = Join-Path $DriveLetter "boot"
$rootPath = $DriveLetter

if (-not (Test-Path $bootPath)) {
    if (Test-Path (Join-Path $rootPath "dietpi.txt")) {
        $bootPath = $rootPath
    } else {
        Write-Host "ERROR: Boot partition not found" -ForegroundColor Red
        exit 1
    }
}

$configFile = Join-Path $bootPath "dietpi.txt"

if (-not (Test-Path $configFile)) {
    Write-Host "ERROR: dietpi.txt not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nReading corrupted file..." -ForegroundColor Yellow
$content = Get-Content -Path $configFile -Raw

# Fix corrupted values
Write-Host "`nFixing corrupted values..." -ForegroundColor Yellow

# Fix: $1502421 -> AUTO_SETUP_GLOBAL_PASSWORD=502421
if ($content -match '\$1502421') {
    $content = $content -replace '\$1502421', 'AUTO_SETUP_GLOBAL_PASSWORD=502421'
    Write-Host "  ✓ Fixed: AUTO_SETUP_GLOBAL_PASSWORD" -ForegroundColor Green
}

# Fix: $11 (Ethernet) -> AUTO_SETUP_NET_ETHERNET_ENABLED=1
if ($content -match '^(\s*)\$11(\s*)$' -Multiline) {
    $content = $content -replace '(?m)^(\s*)\$11(\s*)$', '$1AUTO_SETUP_NET_ETHERNET_ENABLED=1$2'
    Write-Host "  ✓ Fixed: AUTO_SETUP_NET_ETHERNET_ENABLED" -ForegroundColor Green
}

# Fix: $10 (WiFi) -> AUTO_SETUP_NET_WIFI_ENABLED=0
# Need to be careful - find the one after Ethernet
$content = [regex]::Replace($content, '(?m)^(\s*)\$10(\s*)$', {
    param($match)
    # Check if this is after AUTO_SETUP_NET_ETHERNET_ENABLED
    $before = $content.Substring(0, $match.Index)
    if ($before -match 'AUTO_SETUP_NET_ETHERNET_ENABLED') {
        return $match.Groups[1].Value + 'AUTO_SETUP_NET_WIFI_ENABLED=0' + $match.Groups[2].Value
    }
    return $match.Value
})

# Better approach - replace in context
$content = $content -replace '(AUTO_SETUP_NET_ETHERNET_ENABLED=1\s*)\$10', '$1AUTO_SETUP_NET_WIFI_ENABLED=0'
if ($content -match 'AUTO_SETUP_NET_WIFI_ENABLED=0') {
    Write-Host "  ✓ Fixed: AUTO_SETUP_NET_WIFI_ENABLED" -ForegroundColor Green
}

# Fix: $11 (Headless) -> AUTO_SETUP_HEADLESS=1
# Find the one in the headless section
$content = $content -replace '(# Set to "1" to disable HDMI[^\n]*\n)\$11', '$1AUTO_SETUP_HEADLESS=1'
if ($content -match 'AUTO_SETUP_HEADLESS=1') {
    Write-Host "  ✓ Fixed: AUTO_SETUP_HEADLESS" -ForegroundColor Green
}

# Fix: $11 (Automated) -> AUTO_SETUP_AUTOMATED=1
# Find the one in the automated section
$content = $content -replace '(# On first boot[^\n]*\n# - Please change[^\n]*\n)\$11', '$1AUTO_SETUP_AUTOMATED=1'
$content = $content -replace '(# - Please change AUTO_SETUP_GLOBAL_PASSWORD when enabling this option!\s*)\$11', '$1AUTO_SETUP_AUTOMATED=1'
if ($content -match 'AUTO_SETUP_AUTOMATED=1') {
    Write-Host "  ✓ Fixed: AUTO_SETUP_AUTOMATED" -ForegroundColor Green
}

# Fix: $11 in autostart comment -> AUTO_SETUP_AUTOMATED=1
$content = $content -replace '(# - Related software titles must be installed either on first run installs or via )\$11', '$1AUTO_SETUP_AUTOMATED=1'

# Fix: Requires $11 -> Requires AUTO_SETUP_AUTOMATED=1
$content = $content -replace '(# - Requires )\$11', '$1AUTO_SETUP_AUTOMATED=1'

# Convert CRLF to LF
$content = $content -replace "`r`n", "`n"

# Write back
$content | Out-File -FilePath $configFile -Encoding ASCII -Force

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "`nFile has been corrected and saved with LF line endings." -ForegroundColor White
Write-Host "`nPlease verify the file manually to ensure all values are correct." -ForegroundColor Yellow
Write-Host "`n"

