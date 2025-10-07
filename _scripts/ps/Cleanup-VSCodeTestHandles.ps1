# Cleanup-VSCodeTestHandles.ps1
# Cleans up hanging VSCode test file handles and processes

param(
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "🧹 Cleaning up VSCode test file handles and processes..." -ForegroundColor Yellow

# Function to kill processes safely
function Stop-ProcessSafely {
    param([string]$ProcessName, [string]$Description)
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  Found $($processes.Count) $Description processes" -ForegroundColor Cyan
        foreach ($proc in $processes) {
            try {
                if ($Verbose) {
                    Write-Host "    Killing process $($proc.Id) ($($proc.ProcessName))" -ForegroundColor Gray
                }
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Host "    ✅ Killed process $($proc.Id)" -ForegroundColor Green
            }
            catch {
                Write-Host "    ⚠️ Failed to kill process $($proc.Id): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "  No $Description processes found" -ForegroundColor Gray
    }
}

# Function to clean up directories
function Remove-DirectorySafely {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        try {
            if ($Verbose) {
                Write-Host "  Removing $Description: $Path" -ForegroundColor Gray
            }
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "  ✅ Removed $Description" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠️ Failed to remove $Description: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  $Description not found" -ForegroundColor Gray
    }
}

# Step 1: Kill hanging processes
Write-Host "`n🔪 Killing hanging processes..." -ForegroundColor Red
Stop-ProcessSafely -ProcessName "wsl" -Description "WSL"
Stop-ProcessSafely -ProcessName "bash" -Description "Bash"
Stop-ProcessSafely -ProcessName "cygpath" -Description "Cygpath"
Stop-ProcessSafely -ProcessName "sed" -Description "Sed"

# Step 2: Clean up VSCode test artifacts
Write-Host "`n🗑️ Cleaning up VSCode test artifacts..." -ForegroundColor Blue

# Find workspace root
$workspaceRoot = $PWD
while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
    $workspaceRoot = Split-Path $workspaceRoot -Parent
}

if ($workspaceRoot) {
    $vscodeTestPath = Join-Path $workspaceRoot "libs\vscode-test-cli-config\.vscode-test"
    $userDataPath = Join-Path $vscodeTestPath "user-data"
    
    Remove-DirectorySafely -Path $userDataPath -Description "VSCode test user data"
    Remove-DirectorySafely -Path $vscodeTestPath -Description "VSCode test cache"
    
    # Clean up any other .vscode-test directories
    Get-ChildItem -Path $workspaceRoot -Recurse -Directory -Name ".vscode-test" -ErrorAction SilentlyContinue | ForEach-Object {
        $testDir = Join-Path $workspaceRoot $_
        Remove-DirectorySafely -Path $testDir -Description "VSCode test directory: $_"
    }
}
else {
    Write-Host "  ⚠️ Could not find workspace root (nx.json not found)" -ForegroundColor Yellow
}

# Step 3: Clean up any remaining file handles (Windows-specific)
if ($env:OS -eq "Windows_NT") {
    Write-Host "`n🔧 Checking for remaining file handles..." -ForegroundColor Magenta
    
    # Use handle.exe if available (Sysinternals tool)
    $handleExe = Get-Command handle.exe -ErrorAction SilentlyContinue
    if ($handleExe) {
        Write-Host "  Using handle.exe to check for remaining handles..." -ForegroundColor Cyan
        $handles = & handle.exe -p wsl.exe 2>$null | Select-String "vscode-test"
        if ($handles) {
            Write-Host "  ⚠️ Found remaining VSCode test file handles:" -ForegroundColor Yellow
            $handles | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
        else {
            Write-Host "  ✅ No remaining VSCode test file handles found" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ℹ️ handle.exe not found (Sysinternals tool) - install for detailed handle checking" -ForegroundColor Blue
    }
}

Write-Host "`n✅ Cleanup completed!" -ForegroundColor Green
Write-Host "`n💡 To prevent future file handle leaks:" -ForegroundColor Cyan
Write-Host "  - The VSCode test executor now automatically cleans up after tests" -ForegroundColor White
Write-Host "  - Run 'nx cleanup:all:vscode-test' to clean all VSCode test artifacts" -ForegroundColor White
Write-Host "  - Run 'nx cleanup:vscode-test --project=<project-name>' for specific project cleanup" -ForegroundColor White
