# Convert CRLF to LF for Linux files on SD card
# Usage: .\convert-crlf-to-lf.ps1 -DriveLetter "F:" [-FilePattern "*.txt"]

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:",
    
    [Parameter(Mandatory=$false)]
    [string]$FilePattern = "*.txt,*.sh,*.conf"
)

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

Write-Host "`nConverting CRLF to LF on $DriveLetter..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

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

Write-Host "`nBoot path: $bootPath" -ForegroundColor Green

# Files to convert
$patterns = $FilePattern -split ','
$filesConverted = 0
$filesSkipped = 0

foreach ($pattern in $patterns) {
    $pattern = $pattern.Trim()
    $files = Get-ChildItem -Path $bootPath -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        try {
            $content = Get-Content -Path $file.FullName -Raw
            
            # Check if file has CRLF
            if ($content -match "`r`n") {
                # Convert CRLF to LF
                $newContent = $content -replace "`r`n", "`n"
                
                # Write back with LF only
                $newContent | Out-File -FilePath $file.FullName -Encoding ASCII -NoNewline -Force
                
                Write-Host "  ✓ Converted: $($file.Name)" -ForegroundColor Green
                $filesConverted++
            } else {
                Write-Host "  - Already LF: $($file.Name)" -ForegroundColor Gray
                $filesSkipped++
            }
        } catch {
            Write-Host "  ✗ Error converting $($file.Name): $_" -ForegroundColor Red
        }
    }
}

# Also check specific important files
$importantFiles = @(
    "dietpi.txt",
    "cmdline.txt",
    "config.txt"
)

foreach ($fileName in $importantFiles) {
    $filePath = Join-Path $bootPath $fileName
    if (Test-Path $filePath) {
        try {
            $content = Get-Content -Path $filePath -Raw
            
            if ($content -match "`r`n") {
                $newContent = $content -replace "`r`n", "`n"
                $newContent | Out-File -FilePath $filePath -Encoding ASCII -NoNewline -Force
                
                if ($filesConverted -eq 0 -or $filesConverted -notmatch $fileName) {
                    Write-Host "  ✓ Converted: $fileName" -ForegroundColor Green
                    $filesConverted++
                }
            }
        } catch {
            Write-Host "  ✗ Error converting ${fileName}: $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "Conversion Complete!" -ForegroundColor Green
Write-Host "  Files converted: $filesConverted" -ForegroundColor White
Write-Host "  Files skipped (already LF): $filesSkipped" -ForegroundColor White
Write-Host "`n"

