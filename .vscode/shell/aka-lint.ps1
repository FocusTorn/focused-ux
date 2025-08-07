# Linting Aliases for the Focused-UX Monorepo
# This script provides convenient linting aliases for packages in the pnpm/Nx monorepo.

$script:LintAliasCache = $null

function Get-LintAliasConfiguration {
    if ($script:LintAliasCache -eq $null) {
        $jsonPath = Join-Path $PSScriptRoot "pnpm_aliases.json"
        if (-not (Test-Path $jsonPath)) {
            throw "Alias definition file not found at '$jsonPath'."
        }
        try {
            $script:LintAliasCache = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
        } catch {
            throw "Failed to parse pnpm_aliases.json: $_"
        }
    }
    return $script:LintAliasCache
}

function Get-LintPackageAliases {
    $config = Get-LintAliasConfiguration
    if ($config.packages) {
        return $config.packages
    } else {
        return $config
    }
}

function Resolve-LintAlias {
    param([string]$Alias)
    
    $packageAliases = Get-LintPackageAliases
    $aliasValue = $packageAliases.$Alias
    
    if (-not $aliasValue) {
        throw "Alias '$Alias' is not defined in pnpm_aliases.json."
    }
    
    $result = @{
        PackageName = $null
        ProjectName = $null
        IsFullTarget = $false
    }
    
    if ($aliasValue -is [PSCustomObject] -and $aliasValue.PSObject.Properties["name"]) {
        $result.PackageName = $aliasValue.name
        $result.IsFullTarget = $aliasValue.full -eq $true
        
        if ($aliasValue.suffix) {
            $result.ProjectName = "@fux/$($aliasValue.name)-$($aliasValue.suffix)"
        } else {
            $result.ProjectName = "@fux/$($aliasValue.name)"
        }
    } else {
        $result.PackageName = $aliasValue
        if ($aliasValue.StartsWith("@fux/")) {
            $result.ProjectName = $aliasValue
        } else {
            $result.ProjectName = "@fux/$aliasValue"
        }
    }
    
    return $result
}

function Process-LintArguments {
    param([string[]]$Arguments)
    
    $processed = @()
    $hasFix = $false
    $hasSkipCache = $false
    
    foreach ($arg in $Arguments) {
        if ($arg.StartsWith('-') -and $arg.Length -gt 1) {
            if ($arg.Length -gt 2 -and $arg[1] -ne '-') {
                $flagString = $arg.Substring(1)
                for ($i = 0; $i -lt $flagString.Length; $i++) {
                    $flag = $flagString[$i]
                    switch ($flag) {
                        's' { $hasSkipCache = $true }
                        'f' { $hasFix = $true }
                    }
                }
            } else {
                switch ($arg) {
                    '-s' { $hasSkipCache = $true }
                    '-f' { $hasFix = $true }
                    default { $processed += $arg }
                }
            }
        } else {
            $processed += $arg
        }
    }
    
    if ($hasFix) {
        $processed += '--fix'
    }
    if ($hasSkipCache) {
        $processed += '--skip-nx-cache'
    }
    
    return $processed
}

function Invoke-LintTask {
    param(
        [string]$ProjectName,
        [string]$Target = 'lint',
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    $nxArgs = @($Target, $ProjectName) + $Arguments
    
    if ($IsDebug) {
        Write-Host "Running: nx $Target $ProjectName " + ($Arguments -join ' ')
    }
    
    $OutputEncoding = [System.Text.Encoding]::UTF8
    & nx @nxArgs
}

function Invoke-LintRunMany {
    param(
        [string]$RunType,
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    $packageAliases = Get-LintPackageAliases
    $projectsToRun = @()
    
    if ($RunType -eq 'all') {
        foreach ($key in $packageAliases.PSObject.Properties.Name) {
            $aliasValue = $packageAliases.$key
            if ($aliasValue -is [PSCustomObject] -and $aliasValue.PSObject.Properties["name"]) {
                if ($aliasValue.suffix) {
                    $projectName = "@fux/$($aliasValue.name)-$($aliasValue.suffix)"
                } else {
                    $projectName = "@fux/$($aliasValue.name)"
                }
            } else {
                if ($aliasValue.StartsWith("@fux/")) {
                    $projectName = $aliasValue
                } else {
                    $projectName = "@fux/$aliasValue"
                }
            }
            $projectsToRun += $projectName
        }
    } else {
        $suffix = "-$RunType"
        foreach ($key in $packageAliases.PSObject.Properties.Name) {
            $aliasValue = $packageAliases.$key
            if ($aliasValue -is [PSCustomObject] -and $aliasValue.PSObject.Properties["name"]) {
                if ($aliasValue.suffix) {
                    $projectName = "@fux/$($aliasValue.name)-$($aliasValue.suffix)"
                } else {
                    $projectName = "@fux/$($aliasValue.name)"
                }
            } else {
                if ($aliasValue.StartsWith("@fux/")) {
                    $projectName = $aliasValue
                } else {
                    $projectName = "@fux/$aliasValue"
                }
            }
            if ($projectName.EndsWith($suffix)) { 
                $projectsToRun += $projectName 
            }
        }
    }
    
    if ($projectsToRun.Count -eq 0) { 
        Write-Host "No projects found for '$RunType'."; 
        return 
    }
    
    $parallelCount = $projectsToRun.Count
    $projectList = $projectsToRun -join ','
    $nxArgs = @('run-many', "--target=lint", "--projects=$projectList", "--parallel=$parallelCount") + $Arguments
    
    if ($IsDebug) {
        Write-Host "Projects: $projectList"
        Write-Host "Parallelism: $parallelCount"
        Write-Host "Running: nx run-many --target=lint --projects=$projectList --parallel=$parallelCount " + ($Arguments -join ' ')
    }
    
    $OutputEncoding = [System.Text.Encoding]::UTF8
    & nx @nxArgs
}

function Invoke-LintCommand {
    param(
        [string]$Alias,
        [string[]]$CommandArgs
    )
    
    if ($null -eq $CommandArgs) { $CommandArgs = @() }
    
    $isDebug = $CommandArgs -contains '--debug' -or $CommandArgs -contains '-d'
    $argsWithoutDebug = @($CommandArgs | Where-Object { $_ -ne '--debug' -and $_ -ne '-d' })
    
    if ($isDebug) {
        Write-Host "DEBUG: Invoke-LintCommand started for alias '$Alias'."
        Write-Host "Initial CommandArgs: " + ($CommandArgs -join ', ')
        Write-Host "Args after filtering debug flags: " + ($argsWithoutDebug -join ', ')
    }
    
    $finalArgs = Process-LintArguments -Arguments $argsWithoutDebug
    
    if ($isDebug) {
        Write-Host "Final args: " + ($finalArgs -join ', ')
        Write-Host "Final args count: $($finalArgs.Count)"
        Write-Host "Final args contains --fix: $($finalArgs -contains '--fix')"
    }
    
    if ($Alias -in 'ext', 'core', 'all') {
        Invoke-LintRunMany -RunType $Alias -Arguments $finalArgs -IsDebug $isDebug
        return
    }
    
    try {
        $resolved = Resolve-LintAlias -Alias $Alias
    } catch {
        Write-Error $_.Exception.Message
        return
    }
    
    if ($isDebug) {
        Write-Host "Resolved Package Name: $($resolved.PackageName)"
        Write-Host "Resolved Project Name: $($resolved.ProjectName)"
    }
    
    if ($resolved.IsFullTarget) {
        if ($isDebug) {
            Write-Host "Full target expansion: using 'lint:full' target"
        }
        # If --fix is used, use the regular lint target instead of lint:full
        # because lint:full doesn't pass the --fix flag to dependent tasks
        if ($finalArgs -contains '--fix') {
            if ($isDebug) {
                Write-Host "Using 'lint' target instead of 'lint:full' because --fix flag is present"
            }
            Invoke-LintTask -ProjectName $resolved.ProjectName -Target 'lint' -Arguments $finalArgs -IsDebug $isDebug
        } else {
            Invoke-LintTask -ProjectName $resolved.ProjectName -Target 'lint:full' -Arguments $finalArgs -IsDebug $isDebug
        }
    } else {
        Invoke-LintTask -ProjectName $resolved.ProjectName -Target 'lint' -Arguments $finalArgs -IsDebug $isDebug
    }
}

function Show-LintHelp {
    Write-Host "Linting Aliases for Focused-UX Monorepo:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  lint alias [options]"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -f, --fix           Add --fix flag to auto-fix linting issues"
    Write-Host "  -s, --skip-cache    Add --skip-nx-cache flag to skip Nx cache"
    Write-Host "  -h, --help          Show this help information"
    Write-Host "  --debug             Show debug information"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  lint gw                    # Lint ghost-writer extension"
    Write-Host "  lint gw -f                 # Lint ghost-writer with auto-fix"
    Write-Host "  lint gw -s                 # Lint ghost-writer skipping Nx cache"
    Write-Host "  lint gw -f -s              # Lint ghost-writer with auto-fix and skip cache"
    Write-Host "  lint gw -fs                # Same as above (combined flags)"
    Write-Host "  lint gw -sf                # Same as above (different order)"
    Write-Host "  lint ext                   # Lint all extension packages"
    Write-Host "  lint core                  # Lint all core packages"
    Write-Host "  lint all                   # Lint all packages"
    Write-Host ""
    Write-Host "AVAILABLE ALIASES:" -ForegroundColor Yellow
    
    $packageAliases = Get-LintPackageAliases
    foreach ($alias in $packageAliases.PSObject.Properties.Name) {
        $val = $packageAliases.$alias
        if ($val -is [PSCustomObject] -and $val.PSObject.Properties["name"]) {
            $pkg = $val.name
            $suffix = $val.suffix
            if ($suffix) {
                $proj = "@fux/$pkg-$suffix"
            } else {
                $proj = "@fux/$pkg"
            }
            if ($val.full) {
                $fullIndicator = " (full)"
            } else {
                $fullIndicator = ""
            }
        } else {
            $pkg = $val
            if ($pkg.StartsWith("@fux/")) {
                $proj = $pkg
            } else {
                $proj = "@fux/$pkg"
            }
            $fullIndicator = ""
        }
        Write-Host ("  " + $alias.PadRight(8) + "-> " + $pkg + $fullIndicator + "  (Nx: " + $proj + ")")
    }
}

function lint {
    [CmdletBinding()]
    param(
        [Parameter(Position=0, Mandatory=$true)]
        [string]$Alias,
        [Parameter(Position=1, ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    if ($Arguments -contains '-h' -or $Arguments -contains '--help') {
        Show-LintHelp
        return
    }
    
    $packageAliases = Get-LintPackageAliases
    if ($packageAliases.PSObject.Properties.Name -contains $Alias -or $Alias -in 'ext', 'core', 'all') {
        Invoke-LintCommand -Alias $Alias -CommandArgs $Arguments
    } else {
        Write-Error "Alias '$Alias' is not defined. Use 'lint -h' to see available aliases."
    }
} 