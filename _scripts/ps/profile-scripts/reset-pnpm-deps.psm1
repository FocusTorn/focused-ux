# reset-pnpm-deps.psm1
# PowerShell module for resetting pnpm dependencies in Nx monorepos

function reset-pnpm-deps {
    [CmdletBinding()]
    param(
        [Parameter(HelpMessage = "Force the reset without confirmation")]
        [switch]$Force,
        
        [Parameter(HelpMessage = "Skip Nx cache reset")]
        [switch]$SkipNxReset,
        
        [Parameter(HelpMessage = "Skip pnpm-lock.yaml deletion")]
        [switch]$KeepLockFile
    )

    try {
        Write-Host "Starting pnpm reset process..." -ForegroundColor Green

        # Create temporary empty directory
        $emptyDir = "empty_dir"
        Write-Host "Creating temporary empty directory for robocopy..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        # Delete node_modules using robocopy
        Write-Host "Deleting node_modules using robocopy..." -ForegroundColor Yellow
        $robocopyResult = robocopy $emptyDir "node_modules" /MIR /PURGE /S /Q
        if ($LASTEXITCODE -gt 1) {
            Write-Warning "Robocopy completed with warnings (Exit code: $LASTEXITCODE)"
        }

        # Cleanup
        Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue

        # Remove pnpm-lock.yaml (unless skipped)
        if (-not $KeepLockFile) {
            Write-Host "Deleting pnpm-lock.yaml..." -ForegroundColor Yellow
            if (Test-Path "pnpm-lock.yaml") {
                Remove-Item "pnpm-lock.yaml" -Force
            }
        }

        # Reset Nx (unless skipped)
        if (-not $SkipNxReset) {
            Write-Host "Resetting Nx cache and daemon..." -ForegroundColor Yellow
            npx nx reset
        }

        # Fresh install
        Write-Host "Installing fresh dependencies with pnpm..." -ForegroundColor Yellow
        pnpm install

        Write-Host "Pnpm reset process completed successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "An error occurred: $($_.Exception.Message)"
        return $false
    }
}

function Test-PnpmReset {
    [CmdletBinding()]
    param()

    $issues = @()
    
    # Check if node_modules exists
    if (Test-Path "node_modules") {
        $issues += "node_modules directory exists"
    }
    
    # Check if pnpm-lock.yaml exists
    if (Test-Path "pnpm-lock.yaml") {
        $issues += "pnpm-lock.yaml exists"
    }
    
    # Check if pnpm is installed
    try {
        $pnpmVersion = pnpm --version
        Write-Host "pnpm version: $pnpmVersion" -ForegroundColor Green
    }
    catch {
        $issues += "pnpm is not installed or not in PATH"
    }
    
    # Check if nx is available
    try {
        $nxVersion = npx nx --version
        Write-Host "nx version: $nxVersion" -ForegroundColor Green
    }
    catch {
        $issues += "nx is not available"
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "Potential issues found:" -ForegroundColor Yellow
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        return $false
    }
    
    Write-Host "All checks passed!" -ForegroundColor Green
    return $true
}

function Get-PnpmResetHelp {
    [CmdletBinding()]
    param()

    Write-Host @"
PNPM Reset Module Help
=====================

Functions:
  reset-pnpm-deps          - Reset pnpm dependencies and Nx cache
  Test-PnpmReset          - Check if reset is needed
  Get-PnpmResetHelp       - Show this help

Parameters for reset-pnpm-deps:
  -Force                   - Force reset without confirmation
  -SkipNxReset            - Skip Nx cache reset
  -KeepLockFile           - Keep pnpm-lock.yaml file

Examples:
  reset-pnpm-deps
  reset-pnpm-deps -Force
  reset-pnpm-deps -SkipNxReset -KeepLockFile
  Test-PnpmReset

"@ -ForegroundColor Cyan
}

# Export functions
Export-ModuleMember -Function reset-pnpm-deps, Test-PnpmReset, Get-PnpmResetHelp
