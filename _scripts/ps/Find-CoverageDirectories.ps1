# Find-CoverageDirectories.ps1
# PowerShell script to find directories based on configurable criteria



clear; .\_scripts\ps\Find-DirectoriesByPattern.ps1 `
    -PathEnd @("coverage") `
    -Ignore @("node_modules","*inactive","*removed") `
    -ShouldIncludes @("") `
    -DoesNotInclude @("_reports\coverage") `
    -RelativePathOnly -Quiet




        

# # Return only full paths (clean output for scripting)
# .\_scripts\ps\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -FullNameOnly

# # Return only relative paths (clean output for scripting)  
# .\_scripts\ps\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -RelativePathOnly

# # Quiet mode (no status messages, just results)
# .\_scripts\ps\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -RelativePathOnly -Quiet

# # Combine with your original filters
# .\_scripts\ps\Find-DirectoriesByPattern.ps1 -PathEnd @("coverage") -ShouldIncludes @("test") -DoesNotInclude @("node_modules", "dist") -RelativePathOnly -Quiet


# Configuration variables
$pathEnd = @("coverage")  # Base locate, results will show all children that end with
$shouldIncludes = @()     # If populated, results will only be shown that contain the items
$doesNotInclude = @("_reports\coverage", "node_modules")  # If populated, results will not be shown that contain the items
$ignore = @("node_modules")  # Does not scan within this directory (recursive)

# Function to check if path should be excluded based on ignore patterns
function Test-ShouldIgnore {
    param([string]$path)
    
    foreach ($ignorePattern in $ignore) {
        if ($path -like "*$ignorePattern*") {
            return $true
        }
    }
    return $false
}

# Function to check if path should be excluded based on doesNotInclude patterns
function Test-ShouldExclude {
    param([string]$path)
    
    foreach ($excludePattern in $doesNotInclude) {
        if ($path -like "*$excludePattern*") {
            return $true
        }
    }
    return $false
}

# Function to check if path should be included based on shouldIncludes patterns
function Test-ShouldInclude {
    param([string]$path)
    
    if ($shouldIncludes.Count -eq 0) {
        return $true  # If no inclusion criteria, include everything
    }
    
    foreach ($includePattern in $shouldIncludes) {
        if ($path -like "*$includePattern*") {
            return $true
        }
    }
    return $false
}

# Main execution
Write-Host "Searching for directories ending with: $($pathEnd -join ', ')" -ForegroundColor Cyan
Write-Host "Excluding paths containing: $($doesNotInclude -join ', ')" -ForegroundColor Yellow
Write-Host "Ignoring directories: $($ignore -join ', ')" -ForegroundColor Yellow

$results = @()

foreach ($endPattern in $pathEnd) {
    # Get all directories recursively
    $directories = Get-ChildItem -Path . -Recurse -Directory -ErrorAction SilentlyContinue
    
    foreach ($dir in $directories) {
        $fullPath = $dir.FullName
        $relativePath = $dir.FullName.Replace((Get-Location).Path, "").TrimStart('\')
        
        # Check if directory name ends with the pattern
        if ($dir.Name -eq $endPattern) {
            # Apply filters
            if (-not (Test-ShouldIgnore -path $fullPath) -and 
                -not (Test-ShouldExclude -path $fullPath) -and 
                (Test-ShouldInclude -path $fullPath)) {
                
                $results += $dir
            }
        }
    }
}

# Display results
if ($results.Count -gt 0) {
    Write-Host "`nFound $($results.Count) matching directories:" -ForegroundColor Green
    $results | Select-Object FullName, @{Name="RelativePath"; Expression={$_.FullName.Replace((Get-Location).Path, "").TrimStart('\')}} | 
        Format-Table -AutoSize
} else {
    Write-Host "`nNo matching directories found." -ForegroundColor Red
}

# Optional: Return results for further processing
return $results
