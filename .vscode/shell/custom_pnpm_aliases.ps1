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
# │   PowerShell function (e.g., `Invoke-tbCommand`) and sets a short alias (e.g., `tb`) to point to it.               │
# │                                                                                                                    │
# │   The core logic intelligently distinguishes between three types of commands:                                      │
# │     1. Package Management (`add`, `remove`): Routes to `pnpm add/remove --filter <package-name>`.                  │
# │     2. Script Execution (`run`, `exec`): Routes to `pnpm run/exec --filter <package-name>`.                        │
# │     3. Nx Tasks (default): Routes to `nx <task> <project-name>`.                                                   │
# │                                                                                                                    │
# │   It also provides meta-aliases `ext` and `core` to run commands on all extension or core packages at once         │
# │   using `nx run-many`.                                                                                             │
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
# │   4. View the command and debug info without running it:                                                           │
# │        ext b --debug                                                                                               │
# │        [DEBUG] Invoke-NxCommand started for alias 'ext'.                                                           │
# │        ...                                                                                                         │
# │        -> nx run-many --target=build --projects=... --parallel=N                                                     │
# │                                                                                                                    │
# │ CONFIGURATION                                                                                                      │
# │   To add or modify an alias, edit `pnpm_aliases.json`. For extensions, use the base name (e.g., "my-app"). For     │
# │   other packages, use the full name (e.g., "@fux/my-lib"). The script must be re-sourced.                          │
# │                                                                                                                    │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
#<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                 Private Helper Function to Execute Shell Commands                                  │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
function _Invoke-Process { #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Executable,

        [Parameter(Mandatory=$true)]
        [string[]]$PreArgs,

        [string[]]$PostArgs,

        [ScriptBlock]$FilterBlock,

        [Parameter(Mandatory=$true)]
        [bool]$IsDebug
    )

    if ($IsDebug) {
        $displayString = "$Executable $($PreArgs -join ' ')"
        if ($PostArgs.Count -gt 0) { $displayString += " -- $($PostArgs -join ' ')" }
        if ($FilterBlock) {
            $displayString += " *>&1 | Where-Object $($FilterBlock.ToString())"
        }
        Write-Host "$($PSStyle.Dim)-> $displayString$($PSStyle.Reset)"
    }

    $OutputEncoding = [System.Text.Encoding]::UTF8
    if ($FilterBlock) {
        if ($PostArgs.Count -gt 0) {
            & $Executable @PreArgs -- @PostArgs *>&1 | Where-Object $FilterBlock
        } else {
            & $Executable @PreArgs *>&1 | Where-Object $FilterBlock
        }
    } else {
        if ($PostArgs.Count -gt 0) {
            & $Executable @PreArgs -- @PostArgs
        } else {
            & $Executable @PreArgs
        }
    }
} #<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                          Private Command Handler Functions                                         │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
function _Invoke-PnpmPackageManagement { #>
    param(
        [string]$PnpmPackageName,
        [string[]]$CommandArgs,
        [bool]$IsDebug
    )
    if ($CommandArgs.Count -lt 2) { Write-Host "Please provide a package to $($CommandArgs[0])."; return }

    $filter = { $_ -notmatch 'Lockfile only installation|deprecated subdependencies found' }
    $pnpmArgs = @(
        $CommandArgs[0],
        $CommandArgs[1..($CommandArgs.Count - 1)],
        "--filter=$PnpmPackageName",
        "--reporter=default"
    )
    _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmArgs -IsDebug:$IsDebug
} #<

function _Invoke-PnpmScriptExecution { #>
    param(
        [string]$PnpmPackageName,
        [string[]]$CommandArgs,
        [bool]$IsDebug
    )
    $subCommand = $CommandArgs[0]
    $subCommandArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
    if ($subCommandArgs.Count -eq 0) { Write-Host "Please provide a script/command to '$subCommand'."; return }

    $filter = { $_ -notmatch 'deprecated subdependencies found' }
    $taskOrExecName, $pnpmFlags, $taskArgs = $null, @(), @()
    foreach ($arg in $subCommandArgs) {
        if ($arg -match '^-' -and $arg -ne '-d' -and $arg -ne '--debug') { $pnpmFlags += $arg }
        elseif ($taskOrExecName -eq $null) { $taskOrExecName = $arg }
        else { $taskArgs += $arg }
    }
    if ($taskOrExecName -eq $null) { Write-Host "No script/command name specified after '$subCommand'."; return }
    
    $pnpmPreArgs = @($subCommand, $taskOrExecName) + $pnpmFlags + "--filter=$PnpmPackageName"
    $pnpmPostArgs = $taskArgs
    _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmPreArgs -PostArgs $pnpmPostArgs -FilterBlock $filter -IsDebug:$IsDebug
} #<

function _Invoke-NxTask { #>
    param(
        [string]$NxProjectName,
        [string[]]$CommandArgs,
        [bool]$IsDebug
    )
    $target, $nxFlags, $targetArgs = $null, @(), @()
    foreach ($arg in $CommandArgs) {
        if ($arg.StartsWith("--") -and $arg -ne '--debug') { $nxFlags += $arg }
        elseif ($target -eq $null) { $target = $arg }
        else { $targetArgs += $arg }
    }
    if ($target -eq $null) { Write-Host "No Nx target specified (e.g., 'build', 'lint')."; return }

    $nxPreArgs = @($target, $NxProjectName) + $nxFlags + $targetArgs
    _Invoke-Process -Executable 'nx' -PreArgs $nxPreArgs -IsDebug:$IsDebug
} #<

function _Invoke-NxRunMany { #>
    param(
        [string]$RunType, # 'ext' or 'core'
        [string[]]$CommandArgs, # These are now pre-expanded
        [bool]$IsDebug
    )
    $target, $nxFlags, $targetArgs = $null, @(), @()
    foreach ($arg in $CommandArgs) {
        if ($arg.StartsWith("--") -and $arg -ne '--debug') { $nxFlags += $arg }
        elseif ($target -eq $null) { $target = $arg }
        else { $targetArgs += $arg }
    }
    if ($target -eq $null) { Write-Host "No Nx target specified for '$RunType' (e.g., 'build', 'lint')."; return }

    $packageAliases = Get-PnpmAliasCache
    $suffix = "-$RunType"
    $projectsToRun = @()
    foreach ($key in $packageAliases.PSObject.Properties.Name) {
        $aliasValue = $packageAliases.$key
        $pnpmPackageName, $nxProjectName, $customSuffix = $null, $null, $null
        if ($aliasValue -is [PSCustomObject] -and $aliasValue.PSObject.Properties["name"]) {
            $pnpmPackageName = $aliasValue.name
            $customSuffix = $aliasValue.suffix
        } else { $pnpmPackageName = $aliasValue }
        if ($pnpmPackageName.StartsWith("@fux/")) { $nxProjectName = $pnpmPackageName }
        elseif ($customSuffix) { $nxProjectName = "@fux/$($pnpmPackageName)-$customSuffix" }
        else { $nxProjectName = "@fux/$($pnpmPackageName)" }
        if ($nxProjectName.EndsWith($suffix)) { $projectsToRun += $nxProjectName }
    }
    if ($projectsToRun.Count -eq 0) { Write-Host "No projects found with suffix '$suffix'."; return }

    $parallelCount = $projectsToRun.Count
    $projectList = $projectsToRun -join ','
    $nxPreArgs = @('run-many', "--target=$target", "--projects=$projectList", "--parallel=$parallelCount") + $nxFlags + $targetArgs
    
    if ($IsDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Projects: $projectList"
        Write-Host "$($PSStyle.Dim)  └─ Parallelism: $parallelCount"
        Write-Host "$($PSStyle.Dim)  - Routing to: Nx Run-Many ($RunType)$($PSStyle.Reset)"
    }
    _Invoke-Process -Executable 'nx' -PreArgs $nxPreArgs -IsDebug:$IsDebug
} #<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                               Cache Alias JSON and Add Error Handling                                      │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
$script:AliasCache = $null

function Get-PnpmAliasCache { #>
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
} #<

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                    Nx Target Short Alias Mapping                                           │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
$NxTargetShortcuts = @{ #>
    b = 'build'
    t = 'test'
    l = 'lint'
    p = 'package'
    pd = 'package:dev'
    pub = 'publish'
    
    
} #<


function Expand-NxTargetAlias { #>
    param(
        [string[]]$InputArgs
    )

    # This function is called from Invoke-NxCommand, which has already determined if we are in debug mode.
    # We look up that variable in the parent scope (scope 1) to control logging here.
    $parentScope = Get-Variable -Name IsDebug -Scope 1 -ErrorAction SilentlyContinue
    $isDebug = if ($null -ne $parentScope) { $parentScope.Value } else { $false }

    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)    [DEBUG] >> Entering Expand-NxTargetAlias"
        Write-Host "$($PSStyle.Dim)       ├─ Received InputArgs: $($InputArgs -join ', ')"
        Write-Host "$($PSStyle.Dim)       ├─ Arg Count: $($InputArgs.Count)"
    }

    if ($null -eq $InputArgs -or $InputArgs.Count -eq 0) {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)    [DEBUG] << Exiting Expand-NxTargetAlias (no args)." }
        return @()
    }

    $first = $InputArgs[0].ToLower()
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)       ├─ First Arg (lowercase): '$first'"
        Write-Host "$($PSStyle.Dim)       └─ Checking if NxTargetShortcuts contains '$first'..."
    }

    if ($script:NxTargetShortcuts.ContainsKey($first)) {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)          -> Match found! Replacing '$first' with '$($script:NxTargetShortcuts[$first])'." }
        $InputArgs[0] = $script:NxTargetShortcuts[$first]
    } else {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)          -> No match found." }
    }
    
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)    [DEBUG] << Exiting Expand-NxTargetAlias, returning: $($InputArgs -join ', ')"
    }
    return $InputArgs
} #<



# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                Main Public Function                                                │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

function Invoke-NxCommand { #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Alias,
        [Parameter(Position=1, ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )

    if ($null -eq $CommandArgs) { $CommandArgs = @() }
    $isDebug = $CommandArgs -contains '--debug' -or $CommandArgs -contains '-d'
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)[DEBUG] Invoke-NxCommand started for alias '$Alias'."
        Write-Host "$($PSStyle.Dim)  ├─ 1. Initial CommandArgs: $($CommandArgs -join ', ')"
    }
    $argsWithoutDebug = @($CommandArgs | Where-Object { $_ -ne '--debug' -and $_ -ne '-d' })
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ 2. Args after filtering debug flags: $($argsWithoutDebug -join ', ')"
    }

    # Expand any shortcuts (e.g., 'b' to 'build') on the cleaned arguments.
    $filteredCommandArgs = Expand-NxTargetAlias -InputArgs $argsWithoutDebug
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ 3. Final filtered args after expansion: $($filteredCommandArgs -join ', ')"
        Write-Host "$($PSStyle.Dim)[DEBUG] Alias '$Alias' called with args: $($filteredCommandArgs -join ' ')$($PSStyle.Reset)"
    }

    # Route to the correct handler based on the alias.
    if ($Alias -in 'ext', 'core') {
        _Invoke-NxRunMany -RunType $Alias -CommandArgs $filteredCommandArgs -IsDebug:$isDebug
        return
    }

    if ($filteredCommandArgs.Count -eq 0) {
        Write-Host "Please provide a command for '$Alias'."
        return
    }

    $firstArg = $filteredCommandArgs[0]

    $packageAliases = Get-PnpmAliasCache
    $aliasValue = $packageAliases.$Alias
    if (-not $aliasValue) {
        Write-Error "Alias '$Alias' is not defined in pnpm_aliases.json."; return
    }
    $pnpmPackageName = $null
    $nxProjectName = $null
    $customSuffix = $null
    if ($aliasValue -is [PSCustomObject] -and $aliasValue.PSObject.Properties["name"]) {
        $pnpmPackageName = $aliasValue.name
        $customSuffix = $aliasValue.suffix
    } else {
        $pnpmPackageName = $aliasValue
    }
    if ($pnpmPackageName.StartsWith("@fux/")) {
        $nxProjectName = $pnpmPackageName
    } elseif ($customSuffix) {
        $nxProjectName = "@fux/$($pnpmPackageName)-$customSuffix"
    } else {
        $nxProjectName = "@fux/$($pnpmPackageName)"
    }
    if (-not $pnpmPackageName -or -not $nxProjectName) {
        Write-Error "Alias '$Alias' is misconfigured or could not be resolved from pnpm_aliases.json."
        return
    }
    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Resolved Package Name: $pnpmPackageName$($PSStyle.Reset)"
        Write-Host "$($PSStyle.Dim)  └─ Resolved Project Name: $nxProjectName$($PSStyle.Reset)"
    }
    if ($firstArg -in 'add', 'remove') {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)  - Routing to: Package Management (pnpm add/remove)$($PSStyle.Reset)" }
        _Invoke-PnpmPackageManagement -PnpmPackageName $pnpmPackageName -CommandArgs $filteredCommandArgs -IsDebug:$isDebug
    } elseif ($firstArg -in 'run', 'exec') {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)  - Routing to: Script Execution (pnpm run/exec)$($PSStyle.Reset)" }
        _Invoke-PnpmScriptExecution -PnpmPackageName $pnpmPackageName -CommandArgs $filteredCommandArgs -IsDebug:$isDebug
    } else {
        if ($isDebug) { Write-Host "$($PSStyle.Dim)  - Routing to: Nx Task (nx <target>)$($PSStyle.Reset)" }
        _Invoke-NxTask -NxProjectName $nxProjectName -CommandArgs $filteredCommandArgs -IsDebug:$isDebug
    }
} #<



# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                               Auto-Generate Alias Documentation & Help Command                             │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
function Show-PnpmAliases { #>
    $packageAliases = Get-PnpmAliasCache
    Write-Host "`nAvailable PNPM/Nx Aliases:" -ForegroundColor Cyan
    Write-Host "`n  Meta Aliases (run-many):"
    Write-Host ("  " + "ext".PadRight(8) + "→ " + "Run command on all '-ext' packages.")
    Write-Host ("  " + "core".PadRight(8) + "→ " + "Run command on all '-core' packages.")
    Write-Host "`n  Package Aliases:"
    foreach ($alias in $packageAliases.PSObject.Properties.Name) {
        $val = $packageAliases.$alias
        if ($val -is [PSCustomObject] -and $val.PSObject.Properties["name"]) {
            $pkg = $val.name
            $suffix = $val.suffix
            $proj = $suffix ? "@fux/$pkg-$suffix" : "@fux/$pkg"
        } else {
            $pkg = $val
            $proj = $pkg.StartsWith("@fux/") ? $pkg : "@fux/$pkg"
        }
        Write-Host ("  " + $alias.PadRight(8) + "→ " + $pkg + "  (Nx: " + $proj + ")")
    }
    Write-Host "`nUsage: <alias> <command> [args...]"
    Write-Host "Example: gw b --prod"
    Write-Host "Example: ext b --prod"
} #<

Set-Alias pnpm-aliases-help Show-PnpmAliases

# Dynamically create function wrappers for all aliases in pnpm_aliases.json
$packageAliases = Get-PnpmAliasCache


function New-PnpmAliasFunction { #>
    param($alias)
    # The script block uses $MyInvocation.MyCommand.Name to correctly get the
    # alias that was actually called. This avoids the closure issue in the loop where
    # the '$alias' variable would always resolve to its final value.
    $scriptBlock = [ScriptBlock]::Create(@'
param([Parameter(ValueFromRemainingArguments = $true)][string[]] $args)

# This wrapper is now a simple pass-through. All logic is handled in Invoke-NxCommand.
Invoke-NxCommand $MyInvocation.MyCommand.Name @args
'@)
    Set-Item "function:global:$alias" $scriptBlock
} #<

foreach ($alias in $packageAliases.PSObject.Properties.Name) { #>
    New-PnpmAliasFunction $alias
} #<

# Create meta-aliases for run-many commands
New-PnpmAliasFunction 'ext'
New-PnpmAliasFunction 'core'

# Write-Host "[DEBUG] All alias wrapper functions redefined."