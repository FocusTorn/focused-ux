# Nx Cache Pruning Script
# Keeps only the 3 most recent cache entries for each project

param(
    [int]$KeepCount = 3,
    [switch]$DryRun = $false,
    [switch]$ListOnly = $false
)

$nxCachePath = ".nx/cache"
$workspaceRoot = Split-Path (Split-Path (Split-Path (Split-Path $PSScriptRoot)))
$nxCacheDir = Join-Path $workspaceRoot $nxCachePath

if (-not (Test-Path $nxCacheDir)) {
    Write-Host "Nx cache directory not found at: $nxCacheDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Scanning Nx cache directory: $nxCacheDir" -ForegroundColor Cyan

# Get all cache directories
$cacheDirs = Get-ChildItem -Path $nxCacheDir -Directory | Where-Object { $_.Name -match '^[a-f0-9]+$' }

if ($cacheDirs.Count -eq 0) {
    Write-Host "No cache entries found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($cacheDirs.Count) cache entries" -ForegroundColor Cyan

# Group cache entries by project (infer from directory structure)
$projectGroups = @{}

foreach ($cacheDir in $cacheDirs) {
    # Look for project directories in the cache entry
    $projectDirs = @()
    
    # Check for packages structure
    $packagesDir = Join-Path $cacheDir.FullName "packages"
    if (Test-Path $packagesDir) {
        $packageProjects = Get-ChildItem -Path $packagesDir -Directory | ForEach-Object {
            $packageName = $_.Name
            $subDirs = Get-ChildItem -Path $_.FullName -Directory | ForEach-Object { $_.Name }
            foreach ($subDir in $subDirs) {
                "$packageName/$subDir"
            }
        }
        $projectDirs += $packageProjects
    }
    
    # Check for libs structure
    $libsDir = Join-Path $cacheDir.FullName "libs"
    if (Test-Path $libsDir) {
        $libProjects = Get-ChildItem -Path $libsDir -Directory | ForEach-Object { $_.Name }
        $projectDirs += $libProjects
    }
    
    # If no projects found, mark as unknown
    if ($projectDirs.Count -eq 0) {
        $projectDirs = @("unknown")
    }
    
    # Group by each project found in this cache entry
    foreach ($projectName in $projectDirs) {
        if (-not $projectGroups.ContainsKey($projectName)) {
            $projectGroups[$projectName] = @()
        }
        
        $projectGroups[$projectName] += @{
            Path = $cacheDir.FullName
            Name = $cacheDir.Name
            LastModified = $cacheDir.LastWriteTime
        }
    }
}

# If ListOnly is specified, just show the summary and exit
if ($ListOnly) {
    Write-Host "`nProjects in cache:" -ForegroundColor Cyan
    $projectSummary = @()

    foreach ($projectName in $projectGroups.Keys | Sort-Object) {
        $entryCount = $projectGroups[$projectName].Count
        $projectSummary += "  $projectName`: $entryCount entries"
    }

    if ($projectSummary.Count -gt 0) {
        $projectSummary | ForEach-Object { Write-Host $_ -ForegroundColor White }
    } else {
        Write-Host "  No projects found in cache" -ForegroundColor Yellow
    }

    Write-Host "`nTotal projects: $($projectGroups.Count)" -ForegroundColor Cyan
    Write-Host "Total cache entries: $($cacheDirs.Count)" -ForegroundColor Cyan
    exit 0
}

$totalToDelete = 0
$totalKept = 0

foreach ($projectName in $projectGroups.Keys) {
    $entries = $projectGroups[$projectName]

    if ($entries.Count -le $KeepCount) {
        Write-Host "Project '$projectName': Keeping all $($entries.Count) entries" -ForegroundColor Green
        $totalKept += $entries.Count
        continue
    }

    # Sort by last modified time (newest first)
    $sortedEntries = $entries | Sort-Object LastModified -Descending

    $toKeep = $sortedEntries[0..($KeepCount-1)]
    $toDelete = $sortedEntries[$KeepCount..($sortedEntries.Count-1)]

    Write-Host "Project '$projectName': Keeping $($toKeep.Count) entries, deleting $($toDelete.Count) entries" -ForegroundColor Yellow

    $totalKept += $toKeep.Count
    $totalToDelete += $toDelete.Count

    if (-not $DryRun) {
        foreach ($entry in $toDelete) {
            try {
                Remove-Item -Path $entry.Path -Recurse -Force
                Write-Host "  Deleted: $($entry.Name)" -ForegroundColor Red
            }
            catch {
                Write-Error "Failed to delete: $($entry.Path)"
            }
        }
    }
    else {
        foreach ($entry in $toDelete) {
            Write-Host "  Would delete: $($entry.Name)" -ForegroundColor DarkRed
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Total entries kept: $totalKept" -ForegroundColor Green
Write-Host "  Total entries deleted: $totalToDelete" -ForegroundColor Red

# Output unique list of projects and their cache entry counts
Write-Host "`nProjects in cache:" -ForegroundColor Cyan
$projectSummary = @()

foreach ($projectName in $projectGroups.Keys | Sort-Object) {
    $entryCount = $projectGroups[$projectName].Count
    $projectSummary += "  $projectName`: $entryCount entries"
}

if ($projectSummary.Count -gt 0) {
    $projectSummary | ForEach-Object { Write-Host $_ -ForegroundColor White }
} else {
    Write-Host "  No projects found in cache" -ForegroundColor Yellow
}

Write-Host "`nTotal projects: $($projectGroups.Count)" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`nThis was a dry run. Use -DryRun:$false to actually delete files." -ForegroundColor Yellow
} 