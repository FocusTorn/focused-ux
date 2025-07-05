

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                  Custom PNPM Aliases for the Focused-UX Monorepo                                   │
# ├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
# │                                                                                                                    │
# │ SYNOPSIS                                                                                                           │
# │   This script creates short, convenient PowerShell aliases for interacting with packages in a pnpm/Nx monorepo.    │
# │   It dynamically generates functions and aliases based on a simple key-value mapping in an external JSON file,      │
# │   dramatically simplifying long commands like `pnpm nx build @fux/my-package --some-flag`.                         │
# │                                                                                                                    │
# │ DESCRIPTION                                                                                                        │
# │   The script reads its configuration from `pnpm_aliases.json`. For each entry, it generates a corresponding         │
# │   PowerShell function (e.g., `Invoke-tbCommand`) and sets a short alias (e.g., `tb`) to point to it.               │
# │                                                                                                                    │
# │   The core logic intelligently distinguishes between three types of commands:                                      │
# │     1. Package Management (`add`, `remove`): Routes to `pnpm add/remove --filter <package-name>`.                  │
# │     2. Script Execution (`run`, `exec`): Routes to `pnpm run/exec --filter <package-name>`.                        │
# │     3. Nx Tasks (default): Routes to `nx <task> <project-name>`.                                                   │
# │                                                                                                                    │
# │ SWITCHES                                                                                                           │
# │   --debug (-d): Prints detailed debug information, including resolved names and the final command string.          │
# │                                                                                                                    │
# │ USAGE EXAMPLES                                                                                                     │
# │   Assuming an alias `cc` is mapped to `chrono-copy`:                                                               │
# │                                                                                                                    │
# │   1. Run an Nx 'build' task (uses derived project name `@fux/chrono-copy-ext`):                                    │
# │        cc build --prod                                                                                             │
# │        -> nx build @fux/chrono-copy-ext --prod                                                                     │
# │                                                                                                                    │
# │   2. Add a new dependency (uses derived package name `chrono-copy`):                                               │
# │        cc add dayjs                                                                                                │
# │        -> pnpm add dayjs --filter=chrono-copy --reporter=default                                                   │
# │                                                                                                                    │
# │   3. View the command and debug info without running it:                                                           │
# │        cc build --debug                                                                                            │
# │        [DEBUG] Alias 'cc' called with args: build                                                                  │
# │          ├─ Resolved Package Name: chrono-copy                                                                     │
# │          └─ Resolved Project Name: @fux/chrono-copy-ext                                                            │
# │          - Routing to: Nx Task (nx <target>)                                                                       │
# │        -> nx build @fux/chrono-copy-ext                                                                            │
# │                                                                                                                    │
# │ CONFIGURATION                                                                                                      │
# │   To add or modify an alias, edit `pnpm_aliases.json`. For extensions, use the base name (e.g., "my-app"). For      │
# │   other packages, use the full name (e.g., "@fux/my-lib"). The script must be re-sourced.                           │
# │                                                                                                                    │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

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

# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                                Main Public Function                                                │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
function Invoke-NxCommand { #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Alias,
        
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )

    $isDebug = $PSBoundParameters.ContainsKey('Debug')

    # Filter out our custom --debug/-d switch from the arguments passed to sub-commands
    $filteredCommandArgs = $CommandArgs | Where-Object { $_ -ne '--debug' -and $_ -ne '-d' }

    if ($filteredCommandArgs.Count -eq 0) { Write-Host "Please provide a command for '$Alias'."; return }

    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)[DEBUG] Alias '$Alias' called with args: $($filteredCommandArgs -join ' ')$($PSStyle.Reset)"
    }

    # --- Resolve package and project names based on alias configuration ---
    $aliasValue = $packageAliases.($Alias)
    $pnpmPackageName = $null
    $nxProjectName = $null

    if ($aliasValue.StartsWith("@fux/")) {
        # It's a full project name, likely a core library or shared package
        $pnpmPackageName = $aliasValue
        $nxProjectName = $aliasValue
    } else {
        # It's a shorthand for an extension package
        $pnpmPackageName = $aliasValue
        
        
        
        
        # $nxProjectName = "@fux/$($aliasValue)-ext"
        $nxProjectName = "$($aliasValue)"
        
        
        
        
    }

    if (-not $pnpmPackageName -or -not $nxProjectName) {
        Write-Error "Alias '$Alias' is misconfigured or could not be resolved from pnpm_aliases.json."
        return
    }

    if ($isDebug) {
        Write-Host "$($PSStyle.Dim)  ├─ Resolved Package Name: $pnpmPackageName$($PSStyle.Reset)"
        Write-Host "$($PSStyle.Dim)  └─ Resolved Project Name: $nxProjectName$($PSStyle.Reset)"
    }

    # --- Route to the appropriate command handler ---
    $firstArg = $filteredCommandArgs[0]
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


# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                           Alias to Package Name Mapping                                            │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
$jsonPath = Join-Path $PSScriptRoot "pnpm_aliases.json"

if (-not (Test-Path $jsonPath)) {
    throw "Alias definition file not found at '$jsonPath'. Please ensure 'pnpm_aliases.json' exists."
}

$packageAliases = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json

$packageAliases.psobject.Properties | ForEach-Object { #>
    $aliasName = $_.Name
    $aliasValue = $_.Value
    
    # Determine the name for the alias description, preferring the user-facing project name.
    $descriptionPackageName = if ($aliasValue.StartsWith("@fux/")) {
        $aliasValue
    } else {
        
        # "@fux/$($aliasValue)-ext"
        
        $aliasValue
        
    }
    $functionName = "Invoke-$($aliasName)Command"
    $description = "Nx alias for $descriptionPackageName"

    # This template creates an intelligent wrapper function for each alias.
    # It captures all arguments to pass them cleanly to the main Invoke-NxCommand router.
    $functionTemplate = @'
function {0} {{
    [CmdletBinding()]
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )
    # Splatting $PSBoundParameters correctly passes all arguments, including -Debug if present,
    # to the target command, which will handle them.
    Invoke-NxCommand -Alias '{1}' @PSBoundParameters
}}
'@
    $functionScript = $functionTemplate -f $functionName, $aliasName
    Invoke-Expression -Command $functionScript
    Set-Alias -Name $aliasName -Value $functionName -Description $description
} #<