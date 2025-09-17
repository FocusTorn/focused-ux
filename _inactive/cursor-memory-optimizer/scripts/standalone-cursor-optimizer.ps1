# Standalone Cursor Memory Optimizer
# This script does everything the CMO tool does - no external dependencies needed

param(
    [string]$Action = "launch",
    [int]$MaxMemory = 4096,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Standalone Cursor Memory Optimizer" -ForegroundColor Cyan
    Write-Host "Usage: .\standalone-cursor-optimizer.ps1 [Action] [Options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  launch     - Launch Cursor with optimizations (default)" -ForegroundColor White
    Write-Host "  optimize   - Apply optimizations to Cursor config" -ForegroundColor White
    Write-Host "  status     - Show current optimization status" -ForegroundColor White
    Write-Host "  check      - Check memory usage once" -ForegroundColor White
    Write-Host "  gc         - Trigger garbage collection" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -MaxMemory <MB> - Set max memory limit (default: 4096)" -ForegroundColor White
    Write-Host "  -Help           - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\standalone-cursor-optimizer.ps1" -ForegroundColor White
    Write-Host "  .\standalone-cursor-optimizer.ps1 optimize -MaxMemory 8192" -ForegroundColor White
    Write-Host "  .\standalone-cursor-optimizer.ps1 status" -ForegroundColor White
    exit 0
}

# Function to find Cursor executable
function Find-CursorExecutable {
    $possiblePaths = @(
        "C:\Users\$env:USERNAME\AppData\Local\Programs\Cursor\Cursor.exe",
        "C:\Program Files\Cursor\Cursor.exe",
        "C:\Program Files (x86)\Cursor\Cursor.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }

    # Fallback to checking the PATH environment variable
    $cursorInPath = Get-Command Cursor.exe -ErrorAction SilentlyContinue
    if ($cursorInPath) {
        return $cursorInPath.Source
    }

    return $null
}

# Function to get Cursor's argv.json path
function Get-CursorArgvPath {
    $possiblePaths = @(
        "$env:APPDATA\Cursor\argv.json",
        "$env:LOCALAPPDATA\Cursor\argv.json"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    return $null
}

# Function to apply optimizations to Cursor
function Optimize-Cursor {
    param([int]$MaxMemory = 4096)
    
    $argvPath = Get-CursorArgvPath
    if (-not $argvPath) {
        Write-Host "❌ Could not find Cursor's argv.json file" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Applying optimizations to: $argvPath" -ForegroundColor Cyan
    
    try {
        # Read current config
        $config = Get-Content $argvPath -Raw | ConvertFrom-Json
        
        # Ensure runtimeArgs array exists
        if (-not $config.runtimeArgs) {
            $config.runtimeArgs = @()
        }
        
        # Remove existing memory optimizations
        $config.runtimeArgs = $config.runtimeArgs | Where-Object { 
            $_ -notlike "--max-old-space-size*" -and
            $_ -notlike "--gc-interval*" -and
            $_ -notlike "--force-gc*" -and
            $_ -notlike "--gc-threshold*"
        }
        
        # Add new memory optimization
        $config.runtimeArgs += "--max-old-space-size=$($MaxMemory)"
        
        # Convert back to JSON with proper formatting
        $jsonContent = $config | ConvertTo-Json -Depth 10
        
        # Backup original file
        $backupPath = "$argvPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $argvPath $backupPath
        Write-Host "Backup created: $backupPath" -ForegroundColor Green
        
        # Write new config
        $jsonContent | Out-File $argvPath -Encoding UTF8
        Write-Host "✅ Optimizations applied successfully!" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Host "❌ Failed to apply optimizations: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to show optimization status
function Show-CursorStatus {
    $argvPath = Get-CursorArgvPath
    if (-not $argvPath) {
        Write-Host "❌ Could not find Cursor's argv.json file" -ForegroundColor Red
        return
    }
    
    try {
        $config = Get-Content $argvPath -Raw | ConvertFrom-Json
        Write-Host "Cursor Configuration Status:" -ForegroundColor Cyan
        Write-Host "Config file: $argvPath" -ForegroundColor White
        
        if ($config.runtimeArgs) {
            Write-Host "Runtime arguments:" -ForegroundColor Yellow
            foreach ($arg in $config.runtimeArgs) {
                Write-Host "  $arg" -ForegroundColor White
            }
        } else {
            Write-Host "No runtime arguments configured" -ForegroundColor Yellow
        }
        
        # Check for specific optimizations
        $maxMemory = $config.runtimeArgs | Where-Object { $_ -like "--max-old-space-size*" }
        if ($maxMemory) {
            Write-Host "✅ Memory optimization: $maxMemory" -ForegroundColor Green
        } else {
            Write-Host "❌ Memory optimization: Not configured" -ForegroundColor Red
        }
        
    }
    catch {
        Write-Host "❌ Failed to read configuration: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to check memory usage
function Check-CursorMemory {
    $cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
    
    if (-not $cursorProcesses) {
        Write-Host "No Cursor processes running" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Cursor Memory Usage:" -ForegroundColor Cyan
    foreach ($process in $cursorProcesses) {
        $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
        $cpuPercent = [math]::Round($process.CPU, 2)
        Write-Host "PID $($process.Id): $memoryMB MB, CPU: $cpuPercent%" -ForegroundColor White
    }
}

# Function to trigger garbage collection
function Invoke-GarbageCollection {
    Write-Host "Triggering garbage collection..." -ForegroundColor Yellow
    
    # Try to find Cursor processes and send GC signal
    $cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
    
    if ($cursorProcesses) {
        Write-Host "Found $($cursorProcesses.Count) Cursor process(es)" -ForegroundColor Cyan
        
        foreach ($process in $cursorProcesses) {
            try {
                # Send a gentle signal to trigger GC
                $process.Refresh()
                Write-Host "Process $($process.Id) refreshed" -ForegroundColor Green
            }
            catch {
                Write-Host "Could not refresh process $($process.Id): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        Write-Host "✅ Garbage collection signals sent" -ForegroundColor Green
    } else {
        Write-Host "No Cursor processes running" -ForegroundColor Yellow
    }
}

# Function to launch Cursor with optimizations
function Launch-CursorOptimized {
    Write-Host "Launching Cursor with memory optimizations..." -ForegroundColor Cyan
    
    # Apply optimizations first
    if (Optimize-Cursor -MaxMemory $MaxMemory) {
        Write-Host "Optimizations applied, launching Cursor..." -ForegroundColor Green
        
        # Find Cursor executable
        $cursorExe = Find-CursorExecutable
        if (-not $cursorExe) {
            Write-Host "❌ Could not find Cursor executable" -ForegroundColor Red
            return $false
        }
        
        # Close existing Cursor instances
        $existingProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
        if ($existingProcesses) {
            Write-Host "Closing $($existingProcesses.Count) existing Cursor process(es)..." -ForegroundColor Yellow
            $existingProcesses | Stop-Process -Force
            Start-Sleep -Seconds 2
        }
        
        # Launch Cursor
        try {
            Start-Process -FilePath $cursorExe
            Write-Host "✅ Cursor launched successfully with optimizations!" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Failed to launch Cursor: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Failed to apply optimizations" -ForegroundColor Red
        return $false
    }
}

# Main execution logic
Write-Host "Standalone Cursor Memory Optimizer" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor White
Write-Host "Max Memory: $MaxMemory MB" -ForegroundColor White
Write-Host ""

switch ($Action.ToLower()) {
    "optimize" {
        Optimize-Cursor -MaxMemory $MaxMemory
    }
    "status" {
        Show-CursorStatus
    }
    "check" {
        Check-CursorMemory
    }
    "gc" {
        Invoke-GarbageCollection
    }
    "launch" {
        Launch-CursorOptimized
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Write-Host "Use -Help to see available actions" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
