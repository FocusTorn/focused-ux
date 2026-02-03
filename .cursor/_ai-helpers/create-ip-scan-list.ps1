# Create IP scan list file for Angry IP Scanner or other tools
# Usage: .\create-ip-scan-list.ps1 -OutputFile "ip-scan-list.txt"

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "ip-scan-list.txt",
    
    [Parameter(Mandatory=$false)]
    [string]$NetworkBase = "192.168.1",
    
    [Parameter(Mandatory=$false)]
    [int]$StartRange = 1,
    
    [Parameter(Mandatory=$false)]
    [int]$EndRange = 254,
    
    [Parameter(Mandatory=$false)]
    [string[]]$ExcludeIPs = @("192.168.1.101"),  # IPs to exclude
    
    [Parameter(Mandatory=$false)]
    [string[]]$IncludeIPs = @()  # Specific IPs to include (overrides range)
)

Write-Host "`nCreating IP scan list..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$ipList = @()

# Add specific IPs if provided
if ($IncludeIPs.Count -gt 0) {
    Write-Host "`nAdding specific IPs..." -ForegroundColor Yellow
    foreach ($ip in $IncludeIPs) {
        if ($ip -match '^\d+\.\d+\.\d+\.\d+$') {
            $ipList += $ip
            Write-Host "  ✓ Added: $ip" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Invalid IP format: $ip" -ForegroundColor Yellow
        }
    }
}

# Add range IPs
if ($StartRange -le $EndRange) {
    Write-Host "`nAdding IP range: $NetworkBase.$StartRange-$EndRange" -ForegroundColor Yellow
    for ($i = $StartRange; $i -le $EndRange; $i++) {
        $ip = "$NetworkBase.$i"
        
        # Skip excluded IPs
        if ($ExcludeIPs -contains $ip) {
            Write-Host "  - Excluded: $ip" -ForegroundColor Gray
            continue
        }
        
        # Skip if already in list (from IncludeIPs)
        if ($ipList -contains $ip) {
            continue
        }
        
        $ipList += $ip
    }
    Write-Host "  ✓ Added $($EndRange - $StartRange + 1 - $ExcludeIPs.Count) IPs from range" -ForegroundColor Green
}

# Remove duplicates and sort
$ipList = $ipList | Sort-Object -Unique

# Write to file (one IP per line)
$ipList | Out-File -FilePath $OutputFile -Encoding ASCII -Force

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "IP Scan List Created!" -ForegroundColor Green
Write-Host "`nFile: $OutputFile" -ForegroundColor White
Write-Host "Total IPs: $($ipList.Count)" -ForegroundColor White
Write-Host "Excluded: $($ExcludeIPs.Count)" -ForegroundColor White

Write-Host "`nUsage in Angry IP Scanner:" -ForegroundColor Yellow
Write-Host "  1. Open Angry IP Scanner" -ForegroundColor White
Write-Host "  2. Go to: Tools > Preferences > Ports" -ForegroundColor White
Write-Host "  3. Or use: File > Import > IP Range List" -ForegroundColor White
Write-Host "  4. Select this file: $OutputFile" -ForegroundColor White

Write-Host "`nOr use with our PowerShell scanner:" -ForegroundColor Yellow
Write-Host "  .cursor\_ai-helpers\find-ssh-device.ps1 -IPListFile `"$OutputFile`"" -ForegroundColor Gray

Write-Host "`n"

