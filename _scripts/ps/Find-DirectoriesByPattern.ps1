# Find-DirectoriesByPattern.ps1
# Advanced PowerShell script to find directories based on configurable patterns and filters

param(
    [string[]]$PathEnd = @("coverage"),           # Patterns to match at end of directory names
    [string[]]$ShouldIncludes = @(),              # Paths must contain these patterns (AND logic)
    [string[]]$DoesNotInclude = @("_reports\coverage", "node_modules"),  # Paths must NOT contain these patterns
    [string[]]$Ignore = @("node_modules"),        # Skip scanning these directories entirely
    [string]$BasePath = ".",                      # Starting directory for search
    [switch]$ShowDetails,                         # Show detailed output
    [switch]$ReturnObjects,                       # Return directory objects instead of just paths
    [switch]$FullNameOnly,                        # Return only FullName property
    [switch]$RelativePathOnly,                    # Return only RelativePath property
    [switch]$Quiet                               # Suppress all output except results
)

# Function to normalize path separators for consistent matching
function Convert-PathSeparator {
    param([string]$path)
    return $path -replace '/', '\'
}

# Function to check if path should be ignored (skip scanning)
function Test-ShouldIgnore {
    param([string]$path)
    
    foreach ($ignorePattern in $Ignore) {
        $normalizedPattern = Convert-PathSeparator -path $ignorePattern
        $normalizedPath = Convert-PathSeparator -path $path
        if ($normalizedPath -like "*$normalizedPattern*") {
            return $true
        }
    }
    return $false
}

# Function to check if path should be excluded from results
function Test-ShouldExclude {
    param([string]$path)
    
    foreach ($excludePattern in $DoesNotInclude) {
        $normalizedPattern = Convert-PathSeparator -path $excludePattern
        $normalizedPath = Convert-PathSeparator -path $path
        if ($normalizedPath -like "*$normalizedPattern*") {
            return $true
        }
    }
    return $false
}

# Function to check if path should be included in results
function Test-ShouldInclude {
    param([string]$path)
    
    if ($ShouldIncludes.Count -eq 0) {
        return $true  # If no inclusion criteria, include everything
    }
    
    foreach ($includePattern in $ShouldIncludes) {
        $normalizedPattern = Convert-PathSeparator -path $includePattern
        $normalizedPath = Convert-PathSeparator -path $path
        if ($normalizedPath -like "*$normalizedPattern*") {
            return $true
        }
    }
    return $false
}

# Function to check if directory path ends with any of the patterns
function Test-PathEndMatches {
    param([string]$fullPath, [string]$relativePath, [string[]]$patterns)
    
    foreach ($pattern in $patterns) {
        $normalizedPattern = Convert-PathSeparator -path $pattern
        $normalizedFullPath = Convert-PathSeparator -path $fullPath
        $normalizedRelativePath = Convert-PathSeparator -path $relativePath
        
        # Check if full path ends with the pattern
        if ($normalizedFullPath -like "*$normalizedPattern") {
            return $true
        }
        
        # Check if relative path ends with the pattern
        if ($normalizedRelativePath -like "*$normalizedPattern") {
            return $true
        }
        
        # Also support glob patterns for directory names only
        $dirName = Split-Path -Leaf $fullPath
        if ($dirName -like $normalizedPattern -or $dirName -eq $normalizedPattern) {
            return $true
        }
    }
    return $false
}

# Display configuration
if ($ShowDetails -and -not $Quiet) {
    Write-Host "=== Search Configuration ===" -ForegroundColor Cyan
    Write-Host "Base Path: $BasePath" -ForegroundColor White
    Write-Host "Path End Patterns: $($PathEnd -join ', ')" -ForegroundColor White
    Write-Host "Must Include: $($ShouldIncludes -join ', ')" -ForegroundColor White
    Write-Host "Must NOT Include: $($DoesNotInclude -join ', ')" -ForegroundColor White
    Write-Host "Ignore Directories: $($Ignore -join ', ')" -ForegroundColor White
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host ""
}

# Get all directories recursively, respecting ignore patterns
$allDirs = @()
try {
    $directories = Get-ChildItem -Path $BasePath -Recurse -Directory -ErrorAction SilentlyContinue
    
    foreach ($dir in $directories) {
        $fullPath = $dir.FullName
        $relativePath = $dir.FullName.Replace((Resolve-Path $BasePath).Path, "").TrimStart('\', '/')
        
        # Skip if path should be ignored entirely
        if (Test-ShouldIgnore -path $fullPath) {
            continue
        }
        
        # Check if directory path ends with any of the patterns
        if (Test-PathEndMatches -fullPath $fullPath -relativePath $relativePath -patterns $PathEnd) {
            # Apply inclusion/exclusion filters
            if (-not (Test-ShouldExclude -path $fullPath) -and 
                (Test-ShouldInclude -path $fullPath)) {
                
                $allDirs += $dir
            }
        }
    }
} catch {
    Write-Error "Error scanning directories: $_"
    return
}

# Display results
if ($allDirs.Count -gt 0) {
    if (-not $Quiet) {
        Write-Host "Found $($allDirs.Count) matching directories:" -ForegroundColor Green
    }
    
    if ($ReturnObjects) {
        $allDirs | ForEach-Object {
            $_ | Add-Member -NotePropertyName "RelativePath" -NotePropertyValue ($_.FullName.Replace((Resolve-Path $BasePath).Path, "").TrimStart('\', '/')) -Force
        }
        return $allDirs
    } elseif ($FullNameOnly) {
        $allDirs | ForEach-Object { $_.FullName }
    } elseif ($RelativePathOnly) {
        $allDirs | ForEach-Object { $_.FullName.Replace((Resolve-Path $BasePath).Path, "").TrimStart('\', '/') }
    } else {
        $allDirs | Select-Object FullName, @{Name="RelativePath"; Expression={$_.FullName.Replace((Resolve-Path $BasePath).Path, "").TrimStart('\', '/')}} | 
            Format-Table -AutoSize
    }
} else {
    if (-not $Quiet) {
        Write-Host "No matching directories found." -ForegroundColor Red
    }
    if ($ReturnObjects) {
        return @()
    }
}

# Example usage:
<#
# Basic usage (same as your original command):
.\Find-DirectoriesByPattern.ps1

# Match directory names:
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage")

# Match path segments (directories ending with specific path):
.\Find-DirectoriesByPattern.ps1 -PathEnd @("_reports\coverage")

# With glob patterns:
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage", "*coverage", "*.ts", "*.{ts,js}")

# With custom filters (supports both / and \ in paths):
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -ShouldIncludes @("test") -DoesNotInclude @("node_modules", "dist")

# Path separators are normalized automatically:
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -DoesNotInclude @("_reports/coverage", "node_modules\dist")

# Return only full paths (clean output for scripting):
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -FullNameOnly

# Return only relative paths (clean output for scripting):
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -RelativePathOnly

# Quiet mode (no status messages, just results):
.\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -RelativePathOnly -Quiet

# Return objects for further processing:
$results = .\Find-DirectoriesByPattern.ps1 -ReturnObjects
$results | ForEach-Object { Write-Host "Found: $($_.RelativePath)" }
#>
