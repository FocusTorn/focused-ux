<#
.SYNOPSIS
    Get file statistics including modification times and elapsed time between oldest and newest files.

.DESCRIPTION
    This script analyzes file modification times and provides statistics including:
    - Count of files processed
    - Most recent file modification (Maximum)
    - Oldest file modification (Minimum) 
    - Elapsed time between oldest and newest files
    - Current date/time when analysis was performed

    The script can process individual files, entire directories recursively, or a combination of both.

.PARAMETER FilePaths
    Array of specific file paths to analyze. Files that don't exist will generate warnings.

.PARAMETER Directories
    Array of directory paths to process recursively. All files in these directories and subdirectories will be analyzed.

.PARAMETER Help
    Display detailed help information and usage examples.

.EXAMPLE
    # Analyze specific files
    .\Get-FileStats.ps1 -FilePaths @("file1.txt", "file2.txt", "file3.txt")

.EXAMPLE
    # Analyze all files in a directory recursively
    .\Get-FileStats.ps1 -Directories @("packages/note-hub/core/__tests__")

.EXAMPLE
    # Analyze multiple directories
    .\Get-FileStats.ps1 -Directories @("src", "tests", "docs")

.EXAMPLE
    # Mix of specific files and directories
    .\Get-FileStats.ps1 -FilePaths @("package.json") -Directories @("src")

.EXAMPLE
    # Show help
    .\Get-FileStats.ps1 -Help
    .\Get-FileStats.ps1 -h
    .\Get-FileStats.ps1 --help

.NOTES
    - At least one of FilePaths or Directories must be provided
    - Directory processing is recursive and includes all subdirectories
    - Files that don't exist are skipped with warnings
    - Directories that don't exist are skipped with warnings
    - Elapsed time is calculated as the difference between most recent and oldest file modifications

.OUTPUTS
    PowerShell object with properties:
    - CurrentDateTime: When the analysis was performed
    - Count: Number of files processed
    - Property: Always "LastWriteTime"
    - Maximum: Most recent file modification time
    - Minimum: Oldest file modification time
    - ElapsedTime: Time span between oldest and newest files (formatted as HH:MM with days/hours/minutes)

#>

param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string[]]$FilePaths,
    
    [Parameter(Mandatory = $false, Position = 1)]
    [string[]]$Directories,
    
    [Parameter(Mandatory = $false)]
    [Alias("h")]
    [switch]$Help
)

# Handle help request
if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    return
}

# Handle --help case (when passed as first positional argument)
if ($FilePaths -and $FilePaths[0] -eq "--help") {
    Get-Help $MyInvocation.MyCommand.Path -Full
    return
}

# Get file information for all provided paths
$files = @()

# Process individual file paths
if ($FilePaths) {
    foreach ($path in $FilePaths) {
        if (Test-Path $path) {
            $files += Get-Item $path
        } else {
            Write-Warning "File not found: $path"
        }
    }
}

# Process directory paths recursively
if ($Directories) {
    foreach ($dir in $Directories) {
        if (Test-Path $dir -PathType Container) {
            $files += Get-ChildItem -Path $dir -Recurse -File
        } else {
            Write-Warning "Directory not found: $dir"
        }
    }
}

# Check if we have any parameters
if (-not $FilePaths -and -not $Directories) {
    Write-Host "No file paths or directories provided." -ForegroundColor Yellow
    Write-Host "`nShowing help information:" -ForegroundColor Cyan
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

if ($files.Count -eq 0) {
    Write-Error "No valid files found in the provided paths."
    exit 1
}

# Calculate statistics
$currentDateTime = Get-Date
$count = $files.Count
$lastWriteTimes = $files | ForEach-Object { $_.LastWriteTime }
$maximum = ($lastWriteTimes | Measure-Object -Maximum).Maximum
$minimum = ($lastWriteTimes | Measure-Object -Minimum).Minimum
$elapsedTime = $maximum - $minimum

# Format elapsed time
$elapsedDays = $elapsedTime.Days
$elapsedHours = $elapsedTime.Hours
$elapsedMinutes = $elapsedTime.Minutes
$elapsedFormatted = "{0:D2}:{1:D2} ({2}d:{3}h:{4}m)" -f $elapsedHours, $elapsedMinutes, $elapsedDays, $elapsedHours, $elapsedMinutes

# Create output object
$result = [PSCustomObject]@{
    CurrentDateTime   = $currentDateTime
    Count             = $count
    Property          = "LastWriteTime"
    Maximum           = $maximum
    Minimum           = $minimum
    ElapsedTime       = $elapsedFormatted
}

# Return the result object
return $result
