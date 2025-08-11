#>
# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                  Custom PNPM Aliases for the Focused-UX Monorepo                                   │
# ├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
# │                                                                                                                    │
# │ SYNOPSIS                                                                                                           │
# │   This script creates short, convenient PowerShell aliases for interacting with packages in a pnpm/Nx monorepo.    │
# │   It dynamically generates functions and aliases based on a simple key-value mapping in an external JSON file,     │
# │   dramatically simplifying long commands like `pnpm nx build @fux/my-package --some-flag`.                         │
# │                                                                                                                    │
# │ DESCRIPTION                                                                                                        │
# │   The script reads its configuration from `pnpm_aliases.json`. For each entry, it generates a corresponding        │
# │   PowerShell function and sets a short alias to point to it.                                                       │
# │                                                                                                                    │
# │   The core logic intelligently distinguishes between different types of commands:                                  │
# │     1. Package Management (`add`, `remove`): Routes to `pnpm add/remove --filter <package-name>`.                  │
# │     2. Script Execution (`run`, `exec`): Routes to `pnpm run/exec --filter <package-name>`.                        │
# │     3. Nx Tasks (default): Routes to `nx <task> <project-name>`.                                                   │
# │     4. Audit (`audit`, `a`): Runs the custom feature structure audit script.                                       │
# │     5. Meta-aliases (`ext`, `core`, `all`): Run commands on multiple packages using `nx run-many`.                 │
# │                                                                                                                    │
# │ SWITCHES                                                                                                           │
# │   --debug (-d): Prints detailed debug information, including resolved names and the final command string.          │
# │                                                                                                                    │
# │ USAGE EXAMPLES                                                                                                     │
# │   Assuming an alias `gw` is mapped to `@fux/ghost-writer-ext`:                                                     │
# │                                                                                                                    │
# │   1. Run an Nx 'build' task on a single package:                                                                   │
# │        gw b --prod                                                                                                 │
# │        -> nx build @fux/ghost-writer-ext --prod                                                                    │
# │                                                                                                                    │
# │   2. Add a new dependency to a single package:                                                                     │
# │        gw add dayjs                                                                                                │
# │        -> pnpm add dayjs --filter=@fux/ghost-writer-ext --reporter=default                                         │
# │                                                                                                                    │
# │   3. Run an Nx 'build' task on all extension packages:                                                             │
# │        ext b                                                                                                       │
# │        -> nx run-many --target=build --projects=... --parallel=N                                                     │
# │                                                                                                                    │
# │   4. Run the audit script on a single package:                                                                     │
# │        dc a                                                                                                        │
# │        -> tsx libs/tools/structure-auditor/src/main.ts dynamicons                                                  │
# │                                                                                                                    │
# │ CONFIGURATION                                                                                                      │
# │   To add or modify an alias, edit `pnpm_aliases.json`. For extensions, use the base name (e.g., "my-app"). For     │
# │   other packages, use the full name (e.g., "@fux/my-lib"). The script must be re-sourced.                          │
# │                                                                                                                    │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
#<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                    Configuration                                                   │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

# Cache for alias configuration
$script:AliasCache = $null

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                   Core Functions                                                   │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Get-AliasConfiguration {
    <#
    .SYNOPSIS
    Gets the alias configuration from pnpm_aliases.json with caching.
    #>
    if ($script:AliasCache -eq $null) {
        $jsonPath = Join-Path $PSScriptRoot "pnpm_aliases.json"
        if (-not (Test-Path $jsonPath)) {
            throw "Alias definition file not found at '$jsonPath'. Please ensure 'pnpm_aliases.json' exists."
        }
        try {
            $script:AliasCache = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
        } catch {
            throw "Failed to parse pnpm_aliases.json: $_"
        }
    }
    return $script:AliasCache
}

function Get-PackageAliases {
    <#
    .SYNOPSIS
    Gets the package aliases from the configuration.
    #>
    $config = Get-AliasConfiguration
    if ($config.packages) {
        return $config.packages
    } else {
        return $config
    }
}

function Get-TargetShortcuts {
    <#
    .SYNOPSIS
    Gets the target shortcuts from the configuration.
    #>
    $config = Get-AliasConfiguration
    if ($config.targets) {
        return $config.targets
    }
    
    # Fallback to default targets
    return @{
        b = 'build'
        t = 'test'
        l = 'lint'
        p = 'package'
        pd = 'package:dev'
        pdo = 'package:dev:only'
        pub = 'publish'
        a = 'audit'
        c = 'clean'
        cc = 'clean:cache'
        cd = 'clean:dist'
        tsc = 'check-types'
        v = 'validate'
    }
}

function Resolve-Alias {
    <#
    .SYNOPSIS
    Resolves an alias to its package name and project name.
    #>
    param(
        [string]$Alias
    )
    
    $packageAliases = Get-PackageAliases
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

function Expand-TargetAlias {
    <#
    .SYNOPSIS
    Expands target shortcuts (e.g., 'l' to 'lint').
    #>
    param(
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    if ($Arguments.Count -eq 0) { return @() }
    
    $targetShortcuts = Get-TargetShortcuts
    $firstArg = $Arguments[0].ToLower()
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)    [DEBUG] Expanding target alias: '$firstArg'$($PSStyle.Reset)"
    }
    
    # Handle PSCustomObject from JSON vs Hashtable fallback
    $hasKey = $false
    $value = $null
    
    if ($targetShortcuts -is [hashtable]) {
        $hasKey = $targetShortcuts.ContainsKey($firstArg)
        if ($hasKey) { $value = $targetShortcuts[$firstArg] }
    } else {
        $hasKey = $targetShortcuts.PSObject.Properties.Name -contains $firstArg
        if ($hasKey) { $value = $targetShortcuts.$firstArg }
    }
    
    if ($hasKey) {
        if ($IsDebug) {
            Write-Host "$($PSStyle.Dim)    [DEBUG] Expanded '$firstArg' to '$value'$($PSStyle.Reset)"
        }
        $Arguments[0] = $value
    }
    
    return $Arguments
}

function Process-Arguments {
    <#
    .SYNOPSIS
    Processes arguments to convert short flags to their long equivalents.
    #>
    param(
        [string[]]$Arguments
    )
    
    $processed = @()
    foreach ($arg in $Arguments) {
        if ($arg.StartsWith('-') -and $arg.Length -gt 1) {
            # Handle combined flags like -sf, -fs, etc.
            if ($arg.Length -gt 2 -and $arg[1] -ne '-') {
                # Combined flags like -sf, -fs
                $flagString = $arg.Substring(1)
                for ($i = 0; $i -lt $flagString.Length; $i++) {
                    $flag = $flagString[$i]
                    switch ($flag) {
                        's' { $processed += '--skip-nx-cache' }
                        'v' { $processed += '--validate' }
                        'f' { $processed += '--fix' }
                    }
                }
            } else {
                # Single flags like -s, -f, -v
                switch ($arg) {
                    '-s' { $processed += '--skip-nx-cache' }
                    '-v' { $processed += '--validate' }
                    '-f' { $processed += '--fix' }
                    default { $processed += $arg }
                }
            }
        } else {
            $processed += $arg
        }
    }
    return $processed
}

function Invoke-Process {
    <#
    .SYNOPSIS
    Executes a process with the given arguments.
    #>
    param(
        [string]$Executable,
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)-> $Executable $($Arguments -join ' ')$($PSStyle.Reset)"
    }
    
    $OutputEncoding = [System.Text.Encoding]::UTF8
    & $Executable @Arguments
}

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                Command Handlers                                                    │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Invoke-NxTask {
    <#
    .SYNOPSIS
    Executes an Nx task for a specific project.
    #>
    param(
        [string]$ProjectName,
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    $target, $flags, $targetArgs = $null, @(), @()
    
    # Parse arguments
    foreach ($arg in $Arguments) {
        if ($arg.StartsWith("--") -and $arg -ne '--debug') { 
            $flags += $arg 
        } elseif ($target -eq $null) { 
            $target = $arg 
        } else { 
            $targetArgs += $arg 
        }
    }
    
    if ($target -eq $null) { 
        Write-Host "No Nx target specified (e.g., 'build', 'lint')."; 
        return 
    }
    
    # Special handling for 'clean' - run all clean targets
    if ($target -eq 'clean') {
        $cleanTargets = @('clean:cache', 'clean:dist')
        foreach ($cleanTarget in $cleanTargets) {
            if ($IsDebug) {
                Write-Host "$($PSStyle.Dim)  - Running clean target: $cleanTarget$($PSStyle.Reset)"
            }
            $cleanArgs = @($cleanTarget, $ProjectName) + $flags + $targetArgs
            Invoke-Process -Executable 'nx' -Arguments $cleanArgs -IsDebug:$IsDebug
        }
        return
    }
    
    $nxArgs = @($target, $ProjectName) + $flags + $targetArgs
    Invoke-Process -Executable 'nx' -Arguments $nxArgs -IsDebug:$IsDebug
}

function Invoke-NxRunMany {
    <#
    .SYNOPSIS
    Executes an Nx task on multiple projects.
    #>
    param(
        [string]$RunType, # 'ext', 'core', or 'all'
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    $target, $flags, $targetArgs = $null, @(), @()
    
    # Parse arguments
    foreach ($arg in $Arguments) {
        if ($arg.StartsWith("--") -and $arg -ne '--debug') { 
            $flags += $arg 
        } elseif ($target -eq $null) { 
            $target = $arg 
        } else { 
            $targetArgs += $arg 
        }
    }
    
    if ($target -eq $null) { 
        Write-Host "No Nx target specified for '$RunType' (e.g., 'build', 'lint')."; 
        return 
    }
    
    # Get projects to run
    $packageAliases = Get-PackageAliases
    $projectsToRun = @()
    
    if ($RunType -eq 'all') {
        foreach ($key in $packageAliases.PSObject.Properties.Name) {
            $aliasValue = $packageAliases.$key
            if ($aliasValue.StartsWith("@fux/")) {
                $projectName = $aliasValue
            } else {
                $projectName = "@fux/$aliasValue"
            }
            $projectsToRun += $projectName
        }
    } else {
        $suffix = "-$RunType"
        foreach ($key in $packageAliases.PSObject.Properties.Name) {
            $aliasValue = $packageAliases.$key
            if ($aliasValue.StartsWith("@fux/")) {
                $projectName = $aliasValue
            } else {
                $projectName = "@fux/$aliasValue"
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
    $nxArgs = @('run-many', "--target=$target", "--projects=$projectList", "--parallel=$parallelCount") + $flags + $targetArgs
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Projects: $projectList"
        Write-Host "$($PSStyle.Dim)  └─ Parallelism: $parallelCount"
        Write-Host "$($PSStyle.Dim)  - Routing to: Nx Run-Many ($RunType)$($PSStyle.Reset)"
    }
    
    Invoke-Process -Executable 'nx' -Arguments $nxArgs -IsDebug:$IsDebug
}

function Invoke-Audit {
    <#
    .SYNOPSIS
    Executes the audit script.
    #>
    param(
        [string]$PackageName = $null,
        [string[]]$Flags = @(),
        [bool]$IsDebug = $false
    )
    
    $auditArgs = @('libs/tools/structure-auditor/src/main.ts')
    
    # Add flags if provided
    if ($Flags.Count -gt 0) {
        $auditArgs += $Flags
    }
    
    # Add package name if specified
    if ($PackageName) {
        $auditArgs += $PackageName
    }
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)  - Routing to: Audit Script$($PSStyle.Reset)"
    }
    
    Invoke-Process -Executable 'tsx' -Arguments $auditArgs -IsDebug:$IsDebug
}

function Invoke-PnpmCommand {
    <#
    .SYNOPSIS
    Executes a pnpm command for a specific package.
    #>
    param(
        [string]$PackageName,
        [string]$Command,
        [string[]]$Arguments,
        [bool]$IsDebug = $false
    )
    
    $pnpmArgs = @($Command) + $Arguments + "--filter=$PackageName" + "--reporter=default"
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)  - Routing to: PNPM $Command$($PSStyle.Reset)"
    }
    
    Invoke-Process -Executable 'pnpm' -Arguments $pnpmArgs -IsDebug:$IsDebug
}

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                 Main Function                                                      │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Invoke-NxCommand {
    <#
    .SYNOPSIS
    Main function that handles all alias commands.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Alias,
        [Parameter(Position=1, ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )
    
    if ($null -eq $CommandArgs) { $CommandArgs = @() }
    
    # Check for debug flag
    $isDebug = $CommandArgs -contains '--debug' -or $CommandArgs -contains '-d'
    $argsWithoutDebug = @($CommandArgs | Where-Object { $_ -ne '--debug' -and $_ -ne '-d' })
    
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)[DEBUG] Invoke-NxCommand started for alias '$Alias'."
        Write-Host "$($PSStyle.Dim)  ├─ Initial CommandArgs: $($CommandArgs -join ', ')"
        Write-Host "$($PSStyle.Dim)  └─ Args after filtering debug flags: $($argsWithoutDebug -join ', ')$($PSStyle.Reset)"
    }
    
    # Handle special subcommands
    if ($argsWithoutDebug.Count -eq 1 -and $argsWithoutDebug[0] -eq 'ev') {
        Handle-EsbuildVisualizer -Alias $Alias -IsDebug $isDebug
        return
    }
    
    # Handle audit targets BEFORE target expansion
    if ($argsWithoutDebug.Count -gt 0 -and ($argsWithoutDebug[0] -eq 'a' -or $argsWithoutDebug[0] -eq 'audit')) {
        if ($isDebug) {
            Write-Host "$($PSStyle.Dim)  - Routing to: Audit Script$($PSStyle.Reset)"
        }
        
        # Resolve alias to get package directory name
        try {
            $resolved = Resolve-Alias -Alias $Alias
        } catch {
            Write-Error $_.Exception.Message
            return
        }
        
        $packageDirName = if ($resolved.ProjectName -match "@fux/(.+?)(?:-core|-ext)?$") { $Matches[1] } else { $null }
        if (-not $packageDirName) {
            Write-Error "Could not determine package directory name for alias '$Alias' ($($resolved.ProjectName))."
            return
        }
        
        $auditFlags = Get-AuditFlags -Arguments $argsWithoutDebug[1..($argsWithoutDebug.Count - 1)]
        Invoke-Audit -PackageName $packageDirName -Flags $auditFlags -IsDebug $isDebug
        return
    }
    
    # Handle cmo-specific targets BEFORE target expansion
    if ($Alias -eq 'cmo' -and $argsWithoutDebug.Count -gt 0 -and $argsWithoutDebug[0] -in 's', 'o', 'm') {
        if ($isDebug) {
            Write-Host "$($PSStyle.Dim)  - Routing to: CMO Optimizer ($($argsWithoutDebug[0]))$($PSStyle.Reset)"
        }
        
        $cmoArgs = @('libs/tools/cursor-memory-optimizer/src/index.ts')
        
        # Map cmo targets to their corresponding actions
        switch ($argsWithoutDebug[0]) {
            's' { $cmoArgs += 'status' }
            'o' { $cmoArgs += 'optimize' }
            'm' { $cmoArgs += 'monitor' }
        }
        
        # Add any additional arguments
        if ($argsWithoutDebug.Count -gt 1) {
            $cmoArgs += $argsWithoutDebug[1..($argsWithoutDebug.Count - 1)]
        }
        
        Invoke-Process -Executable 'tsx' -Arguments $cmoArgs -IsDebug $isDebug
        return
    }
    
    # Expand target aliases
    $expandedArgs = Expand-TargetAlias -Arguments $argsWithoutDebug -IsDebug $isDebug
    
    # Process arguments (e.g., -s to --skip-nx-cache)
    $finalArgs = Process-Arguments -Arguments $expandedArgs
    
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Expanded args: $($expandedArgs -join ', ')"
        Write-Host "$($PSStyle.Dim)  └─ Final args: $($finalArgs -join ', ')$($PSStyle.Reset)"
    }
    
    # Handle meta-aliases (ext, core, all)
    if ($Alias -in 'ext', 'core', 'all') {
        if ($finalArgs.Count -gt 0 -and $finalArgs[0] -eq 'audit') {
            $auditFlags = Get-AuditFlags -Arguments $finalArgs[1..($finalArgs.Count - 1)]
            Invoke-Audit -Flags $auditFlags -IsDebug $isDebug
        } else {
            Invoke-NxRunMany -RunType $Alias -Arguments $finalArgs -IsDebug $isDebug
        }
        return
    }
    
    if ($finalArgs.Count -eq 0) {
        Write-Host "Please provide a command for '$Alias'."
        return
    }
    
    # Resolve alias
    try {
        $resolved = Resolve-Alias -Alias $Alias
    } catch {
        Write-Error $_.Exception.Message
        return
    }
    
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Resolved Package Name: $($resolved.PackageName)"
        Write-Host "$($PSStyle.Dim)  └─ Resolved Project Name: $($resolved.ProjectName)$($PSStyle.Reset)"
    }
    
    $firstArg = $finalArgs[0]
    
    # Route to appropriate handler
    if ($firstArg -in 'add', 'remove') {
        Invoke-PnpmCommand -PackageName $resolved.PackageName -Command $firstArg -Arguments $finalArgs[1..($finalArgs.Count - 1)] -IsDebug $isDebug
    }
    elseif ($firstArg -in 'run', 'exec') {
        if ($finalArgs.Count -lt 2) {
            Write-Host "Please provide a script/command to '$firstArg'."
            return
        }
        $scriptName = $finalArgs[1]
        $scriptArgs = $finalArgs[2..($finalArgs.Count - 1)]
        $pnpmArgs = @($firstArg, $scriptName) + $scriptArgs + "--filter=$($resolved.PackageName)"
        Invoke-Process -Executable 'pnpm' -Arguments $pnpmArgs -IsDebug $isDebug
    }
    else {
        # Handle Nx tasks
        if ($isDebug) {
            Write-Host "$($PSStyle.Dim)  - Routing to: Nx Task (nx target)$($PSStyle.Reset)"
        }
        
        # Handle full target expansion for aliases with full: true
        if ($resolved.IsFullTarget -and $finalArgs.Count -gt 0) {
            $firstArg = $finalArgs[0]
            $fullTargets = @('lint', 'test', 'check-types', 'validate')
            if ($fullTargets -contains $firstArg) {
                $newTarget = $firstArg + ":full"
                $finalArgs[0] = $newTarget
                if ($isDebug) {
                    Write-Host "$($PSStyle.Dim)  ├─ Full target expansion: '$firstArg' -> '$newTarget'$($PSStyle.Reset)"
                }
            }
        }
        
        Invoke-NxTask -ProjectName $resolved.ProjectName -Arguments $finalArgs -IsDebug $isDebug
    }
}

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                               Helper Functions                                                     │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Handle-EsbuildVisualizer {
    <#
    .SYNOPSIS
    Handles the esbuild-visualizer subcommand.
    #>
    param(
        [string]$Alias,
        [bool]$IsDebug
    )
    
    $packageAliases = Get-PackageAliases
    $aliasValue = $packageAliases.$Alias
    
    if (-not $aliasValue) {
        Write-Error "Alias '$Alias' is not defined in pnpm_aliases.json."
        return
    }
    
    # Determine the extension directory for the alias
    $extDir = $null
    if ($aliasValue -is [string] -and $aliasValue -match "@fux/(.+)-ext") {
        $extDir = $Matches[1]
    } elseif ($aliasValue -is [string] -and $aliasValue -match "@fux/(.+)") {
        $extDir = $Matches[1]
    } else {
        Write-Error "Cannot determine extension directory for alias '$Alias'."
        return
    }
    
    $metaPath = "./packages/$extDir/ext/dist/meta.json"
    $cmd = "pnpm dlx esbuild-visualizer --metadata $metaPath"
    Write-Host "[esbuild-visualizer] $cmd"
    Invoke-Expression $cmd
}

function Get-AuditFlags {
    <#
    .SYNOPSIS
    Extracts audit-specific flags from arguments.
    #>
    param(
        [string[]]$Arguments
    )
    
    $auditFlags = @()
    foreach ($arg in $Arguments) {
        if ($arg -in '-l', '--list', '-g', '--grouped', '-h', '--help') {
            $auditFlags += $arg
        }
    }
    return $auditFlags
}

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                               Documentation                                                        │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Show-PnpmAliases {
    <#
    .SYNOPSIS
    Shows available aliases and their mappings.
    #>
    $packageAliases = Get-PackageAliases
    $targetShortcuts = Get-TargetShortcuts
    
    Write-Host "`nAvailable PNPM/Nx Aliases:" -ForegroundColor Cyan
    
    # Meta Aliases
    Write-Host "`n  Meta Aliases (run-many):" -ForegroundColor Yellow
    Write-Host ("  " + "ext".PadRight(8) + "→ " + "Run command on all '-ext' packages.")
    Write-Host ("  " + "core".PadRight(8) + "→ " + "Run command on all '-core' packages.")
    Write-Host ("  " + "all".PadRight(8) + "→ " + "Run command on all aliased packages.")
    
    # Package Aliases
    Write-Host "`n  Package Aliases:" -ForegroundColor Yellow
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
        Write-Host ("  " + $alias.PadRight(8) + "→ " + $pkg + $fullIndicator + "  (Nx: " + $proj + ")")
    }
    
    # Nx Targets
    Write-Host "`n  Nx Targets:" -ForegroundColor Yellow
    $nxTargets = @(
        @{ Short = "b"; Full = "build"; Desc = "Build the package" },
        @{ Short = "t"; Full = "test"; Desc = "Run tests" },
        @{ Short = "tc"; Full = "test --coverage"; Desc = "Run tests with coverage" },
        @{ Short = "tcw"; Full = "test --coverage --reporter=html"; Desc = "Run tests with HTML coverage" },
        @{ Short = "l"; Full = "lint"; Desc = "Lint the package" },
        @{ Short = "tsc"; Full = "check-types"; Desc = "TypeScript type checking" },
        @{ Short = "v"; Full = "validate"; Desc = "Lint + type check" },
        @{ Short = "p"; Full = "package"; Desc = "Package for release" },
        @{ Short = "pd"; Full = "package:dev"; Desc = "Package for dev" },
        @{ Short = "pdo"; Full = "package:dev:only"; Desc = "Dev package (only)" },
        @{ Short = "pub"; Full = "publish"; Desc = "Publish the package" },
        @{ Short = "c"; Full = "clean"; Desc = "Clean (runs both clean:cache and clean:dist)" },
        @{ Short = "cc"; Full = "clean:cache"; Desc = "Clean cache" },
        @{ Short = "cd"; Full = "clean:dist"; Desc = "Clean dist" }
    )
    
    foreach ($target in $nxTargets) {
        Write-Host ("  " + $target.Short.PadRight(8) + "→ " + $target.Full.PadRight(20) + " " + $target.Desc)
    }
    
    # Non-Nx Targets
    Write-Host "`n  Non-Nx Targets:" -ForegroundColor Yellow
    $nonNxTargets = @(
        @{ Short = "a"; Full = "audit"; Desc = "Run structure auditor for the package" },
        @{ Short = "ev"; Full = "esbuild-visualizer"; Desc = "Show esbuild bundle visualization" }
    )
    
    foreach ($target in $nonNxTargets) {
        Write-Host ("  " + $target.Short.PadRight(8) + "→ " + $target.Full.PadRight(20) + " " + $target.Desc)
    }
    
    # Package-Specific Targets
    Write-Host "`n  Package-Specific Targets:" -ForegroundColor Yellow
    Write-Host "  Optimizer (cmo):"
    Write-Host ("    " + "s".PadRight(8) + "→ " + "status".PadRight(20) + " Show optimizer status")
    Write-Host ("    " + "o".PadRight(8) + "→ " + "optimize".PadRight(20) + " Run optimization")
    Write-Host ("    " + "m".PadRight(8) + "→ " + "monitor".PadRight(20) + " Monitor optimization")
    
    Write-Host "`nUsage: <alias> <command> [args...]"
    Write-Host "Examples:"
    Write-Host "  gw b --prod                    # Build ghost-writer extension"
    Write-Host "  ext b --prod                   # Build all extension packages"
    Write-Host "  ccp l -s                       # Lint context-cherry-picker (skip cache)"
    Write-Host "  ccp a                          # Audit context-cherry-picker"
    Write-Host "  gw ev                          # Show esbuild visualization for ghost-writer"
    Write-Host "  cmo s                          # Show optimizer status"
}

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                               Initialization                                                       │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

# Set up help alias
Set-Alias pnpm-aliases-help Show-PnpmAliases

# Dynamically create function wrappers for all aliases
$packageAliases = Get-PackageAliases

function New-PnpmAliasFunction {
    <#
    .SYNOPSIS
    Creates a function wrapper for an alias.
    #>
    param([string]$alias)
    
    $scriptBlock = [ScriptBlock]::Create(@"
param([Parameter(ValueFromRemainingArguments = `$true)][string[]] `$args)

# This wrapper is a simple pass-through. All logic is handled in Invoke-NxCommand.
Invoke-NxCommand '$alias' @args
"@)
    
    Set-Item "function:global:$alias" $scriptBlock
}

# Create aliases for all packages
foreach ($alias in $packageAliases.PSObject.Properties.Name) {
    New-PnpmAliasFunction $alias
}

# Create meta-aliases for run-many commands
New-PnpmAliasFunction 'ext'
New-PnpmAliasFunction 'core'
New-PnpmAliasFunction 'all'

# Create standalone audit alias
function audit {
    <#
    .SYNOPSIS
    Standalone audit command that can be used to audit any package or lib.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    # Check for help flags or no arguments
    if ($Arguments.Count -eq 0 -or $Arguments -contains '-h' -or $Arguments -contains '--help') {
        Write-Host "Usage: audit [package|lib] [options]"
        Write-Host "Options:"
        Write-Host "  -l, --list     Show detailed output with line/column numbers"
        Write-Host "  -g, --grouped  Show grouped output (default)"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  audit                    # Audit all packages and libs"
        Write-Host "  audit shared             # Audit shared library"
        Write-Host "  audit ghost-writer       # Audit ghost-writer package"
        Write-Host "  audit shared -l          # Audit shared library with detailed output"
        return
    }
    
    # Parse arguments
    $packageName = $null
    $flags = @()
    
    foreach ($arg in $Arguments) {
        if ($arg -in '-l', '--list', '-g', '--grouped') {
            $flags += $arg
        } elseif (-not $packageName) {
            $packageName = $arg
        }
    }
    
    # Call the audit function
    Invoke-Audit -PackageName $packageName -Flags $flags
}

# Create the main 'aka' function
function aka {
    <#
    .SYNOPSIS
    Main entry point for the aka script. Handles help and delegates to appropriate aliases.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    # Check for help flags or no arguments FIRST - before any other processing
    if ($Arguments.Count -eq 0 -or $Arguments -contains '-h' -or $Arguments -contains '--help') {
        Show-PnpmAliases
        return
    }
    
    # Get the first argument as the alias
    $alias = $Arguments[0]
    $remainingArgs = $Arguments[1..($Arguments.Count - 1)]
    
    # Check if the alias exists
    $packageAliases = Get-PackageAliases
    if ($packageAliases.PSObject.Properties.Name -contains $alias) {
        # Delegate to the existing alias function
        Invoke-NxCommand -Alias $alias -CommandArgs $remainingArgs
    } else {
        Write-Error "Alias '$alias' is not defined. Use 'aka -h' to see available aliases."
    }
}