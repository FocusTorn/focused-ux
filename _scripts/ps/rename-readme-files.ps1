# Script to rename _readme.md files in functional-tests directories
# Renames: packages/**/__tests__/functional-tests/_readme.md
# To:      packages/**/__tests__/functional-tests/_readme(functional-tests).md

Write-Host "Renaming _readme.md files in functional-tests directories..." -ForegroundColor Green

# Find all _readme.md files in functional-tests directories
$readmeFiles = Get-ChildItem -Path "packages" -Recurse -Name "_readme.md" | Where-Object { $_ -like "__tests__/*functional-tests/_readme.md" }

if ($readmeFiles.Count -eq 0) {
    Write-Host "No _readme.md files found in functional-tests directories." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($readmeFiles.Count) files to rename:" -ForegroundColor Cyan

foreach ($file in $readmeFiles) {
    $fullPath = Join-Path "packages" $file
    $directory = Split-Path $fullPath -Parent
    $newName = "_readme(functional-tests).md"
    $newPath = Join-Path $directory $newName
    
    Write-Host "  Renaming: $fullPath" -ForegroundColor White
    Write-Host "  To:       $newPath" -ForegroundColor Gray
    
    try {
        Rename-Item -Path $fullPath -NewName $newName -Force
        Write-Host "  Success" -ForegroundColor Green
    }
    catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Renaming complete!" -ForegroundColor Green