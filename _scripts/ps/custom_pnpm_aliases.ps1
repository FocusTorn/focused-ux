# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │                                  Custom PNPM Aliases for the Focused-UX Monorepo                                   │
# └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

# ======================================================================================================================
# Private Helper Function to Execute Shell Commands
# This centralizes the display and execution logic for pnpm commands.
# The leading underscore is a convention for "private" functions not meant to be called directly by the user.
# ======================================================================================================================
function _Invoke-Process {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Executable,

        [Parameter(Mandatory=$true)]
        [string[]]$PreArgs,

        [string[]]$PostArgs,

        [ScriptBlock]$FilterBlock,

        [Parameter(Mandatory=$true)]
        [switch]$ShowCommandSwitch
    )

    # Step 1: Build the display string from the provided arguments and filter
    if ($ShowCommandSwitch.IsPresent) {
        $displayString = "$Executable $($PreArgs -join ' ')"
        if ($PostArgs.Count -gt 0) { $displayString += " -- $($PostArgs -join ' ')" }
        if ($FilterBlock) {
            $displayString += " *>&1 | Where-Object $($FilterBlock.ToString())"
        }
        Write-Host "$($PSStyle.Dim)-> $displayString$($PSStyle.Reset)"
    }

    # Step 2: Execute the command safely using splatting and the provided filter
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
}


# ======================================================================================================================
# Main Public Function
# ======================================================================================================================
function Invoke-NxCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Alias,
        
        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand,

        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )

    if ($CommandArgs.Count -eq 0) { Write-Host "Please provide a command for '$Alias'."; return }
    $packageName = $packageAliases[$Alias]

    # --- add/remove block ---
    if ($CommandArgs[0] -in 'add', 'remove') {
        if ($CommandArgs.Count -lt 2) { Write-Host "Please provide a package to $($CommandArgs[0])."; return }

        $filter = { $_ -notmatch 'Lockfile only installation|deprecated subdependencies found' }
        $pnpmArgs = @(
            $CommandArgs[0],
            $CommandArgs[1..($CommandArgs.Count - 1)],
            "--filter=$packageName",
            "--reporter=default"
        )
        _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmArgs -FilterBlock $filter -ShowCommandSwitch:$ShowCommand

    # --- run/exec block ---
    } elseif ($CommandArgs[0] -in 'run', 'exec') {
        $subCommand = $CommandArgs[0]
        $subCommandArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
        if ($subCommandArgs.Count -eq 0) { Write-Host "Please provide a script/command to '$subCommand'."; return }

        $filter = { $_ -notmatch 'deprecated subdependencies found' }
        $taskOrExecName, $pnpmFlags, $taskArgs = $null, @(), @()
        foreach ($arg in $subCommandArgs) {
            if ($arg -match '^-') { $pnpmFlags += $arg }
            elseif ($taskOrExecName -eq $null) { $taskOrExecName = $arg }
            else { $taskArgs += $arg }
        }
        if ($taskOrExecName -eq $null) { Write-Host "No script/command name specified after '$subCommand'."; return }
        
        $pnpmPreArgs = @($subCommand, $taskOrExecName) + $pnpmFlags + "--filter=$packageName"
        $pnpmPostArgs = $taskArgs
        _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmPreArgs -PostArgs $pnpmPostArgs -FilterBlock $filter -ShowCommandSwitch:$ShowCommand

    # --- nx block ---
    } else {
        # This block handles all other commands by passing them to Nx.
        $target, $nxFlags, $targetArgs = $null, @(), @()
        foreach ($arg in $CommandArgs) {
            if ($arg.StartsWith("--")) { $nxFlags += $arg }
            elseif ($target -eq $null) { $target = $arg }
            else { $targetArgs += $arg }
        }
        if ($target -eq $null) { Write-Host "No Nx target specified (e.g., 'build', 'lint')."; return }

        $nxPreArgs = @('nx', $target, $packageName) + $nxFlags + $targetArgs
        _Invoke-Process -Executable 'pnpm' -PreArgs $nxPreArgs -ShowCommandSwitch:$ShowCommand
    }
}


# ┌────────────────────────────────────────────────────────────────────────────┐
# │                         Alias to Package Name Mapping                      │
# └────────────────────────────────────────────────────────────────────────────┘
$packageAliases = @{
    "serv"   = "@fux/shared-services";
    "gwc"    = "@fux/ghost-writer-core";
    "gw"     = "@fux/ghost-writer-ext";
    "tools"  = "@fux/tools";
}

# ┌────────────────────────────────────────────────────────────────────────────┐
# │                         Dynamic Alias Registration                         │
# └────────────────────────────────────────────────────────────────────────────┘
$packageAliases.GetEnumerator() | ForEach-Object {
    $aliasName = $_.Name
    $functionName = "Invoke-$($aliasName)Command"
    $description = "Nx alias for $($_.Value)"

    $functionTemplate = @'
function {0} {{
    param(
        [Parameter()]
        [Alias('show')]
        [switch]$ShowCommand,

        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$CommandArgs
    )
    Invoke-NxCommand -Alias '{1}' -ShowCommand:$ShowCommand @CommandArgs
}}
'@
    $functionScript = $functionTemplate -f $functionName, $aliasName
    Invoke-Expression -Command $functionScript
    Set-Alias -Name $aliasName -Value $functionName -Description $description
}



# ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
# └───────────────────────────────────────────────────────────────────────────────────────────────────┘




# # ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# # │                                  Custom PNPM Aliases for the Focused-UX Monorepo                                   │
# # └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

# # ======================================================================================================================
# # Private Helper Function to Execute Shell Commands
# # This centralizes the display and execution logic for both pnpm and turbo commands.
# # The leading underscore is a convention for "private" functions not meant to be called directly by the user.
# # ======================================================================================================================
# function _Invoke-Process {
#     param(
#         [Parameter(Mandatory=$true)]
#         [string]$Executable,

#         [Parameter(Mandatory=$true)]
#         [string[]]$PreArgs,

#         [string[]]$PostArgs,

#         [ScriptBlock]$FilterBlock,

#         [Parameter(Mandatory=$true)]
#         [switch]$ShowCommandSwitch
#     )

#     # Step 1: Build the display string from the provided arguments and filter
#     if ($ShowCommandSwitch.IsPresent) {
#         $displayString = "$Executable $($PreArgs -join ' ')"
#         if ($PostArgs.Count -gt 0) { $displayString += " -- $($PostArgs -join ' ')" }
#         if ($FilterBlock) {
#             $displayString += " *>&1 | Where-Object $($FilterBlock.ToString())"
#         }
#         Write-Host "$($PSStyle.Dim)-> $displayString$($PSStyle.Reset)"
#     }

#     # Step 2: Execute the command safely using splatting and the provided filter
#     $OutputEncoding = [System.Text.Encoding]::UTF8
#     if ($FilterBlock) {
#         if ($PostArgs.Count -gt 0) {
#             & $Executable @PreArgs -- @PostArgs *>&1 | Where-Object $FilterBlock
#         } else {
#             & $Executable @PreArgs *>&1 | Where-Object $FilterBlock
#         }
#     } else {
#         if ($PostArgs.Count -gt 0) {
#             & $Executable @PreArgs -- @PostArgs
#         } else {
#             & $Executable @PreArgs
#         }
#     }
# }


# # ======================================================================================================================
# # Main Public Function
# # ======================================================================================================================
# function Invoke-TurboCommand {
#     [CmdletBinding()]
#     param(
#         [Parameter(Mandatory=$true)]
#         [string]$Alias,
        
#         # Added 'show' as a user-friendly alias to avoid conflict with the common -Debug parameter.
#         [Parameter()]
#         [Alias('show')]
#         [switch]$ShowCommand,

#         [Parameter(Position=0, ValueFromRemainingArguments=$true)]
#         [string[]]$CommandArgs
#     )

#     # The parameter binder now handles removing --show/--showcommand, so manual filtering is no longer needed.

#     if ($CommandArgs.Count -eq 0) { Write-Host "Please provide a command for '$Alias'."; return }
#     $packageName = $packageAliases[$Alias]

#     # --- add/remove block ---
#     if ($CommandArgs[0] -in 'add', 'remove') {
#         if ($CommandArgs.Count -lt 2) { Write-Host "Please provide a package to $($CommandArgs[0])."; return }

#         # Logic specific to add/remove
#         $filter = { $_ -notmatch 'Lockfile only installation|deprecated subdependencies found' }
#         $pnpmArgs = @(
#             $CommandArgs[0],
#             $CommandArgs[1..($CommandArgs.Count - 1)],
#             "--filter=$packageName",
#             "--reporter=default"
#         )

#         # Call the helper to display and execute
#         _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmArgs -FilterBlock $filter -ShowCommandSwitch:$ShowCommand

#     # --- run/exec block ---
#     } elseif ($CommandArgs[0] -in 'run', 'exec') {
#         $subCommand = $CommandArgs[0]
#         $subCommandArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
#         if ($subCommandArgs.Count -eq 0) { Write-Host "Please provide a script/command to '$subCommand'."; return }

#         # Logic specific to run/exec (parsing for '--')
#         $filter = { $_ -notmatch 'deprecated subdependencies found' }
#         $taskOrExecName, $pnpmFlags, $taskArgs = $null, @(), @()
#         foreach ($arg in $subCommandArgs) {
#             if ($arg -match '^-') { $pnpmFlags += $arg }
#             elseif ($taskOrExecName -eq $null) { $taskOrExecName = $arg }
#             else { $taskArgs += $arg }
#         }
#         if ($taskOrExecName -eq $null) { Write-Host "No script/command name specified after '$subCommand'."; return }
        
#         $pnpmPreArgs = @($subCommand, $taskOrExecName) + $pnpmFlags + "--filter=$packageName"
#         $pnpmPostArgs = $taskArgs

#         # Call the helper to display and execute
#         _Invoke-Process -Executable 'pnpm' -PreArgs $pnpmPreArgs -PostArgs $pnpmPostArgs -FilterBlock $filter -ShowCommandSwitch:$ShowCommand

#     # --- turbo block ---
#     } else {
#         # This block handles all other commands by passing them to Turbo.
#         $task, $turboFlags, $taskArgs = $null, @(), @()
#         foreach ($arg in $CommandArgs) {
#             if ($arg.StartsWith("--")) { $turboFlags += $arg }
#             elseif ($task -eq $null) { $task = $arg }
#             else { $taskArgs += $arg }
#         }
#         if ($task -eq $null) { Write-Host "No task specified (e.g., 'build', 'lint')."; return }
#         if (-not ($turboFlags -like "--output-logs*")) { $turboFlags += "--output-logs=new-only" }

#         $turboPreArgs = @('run', $task) + $turboFlags + "--filter=$packageName" + $taskArgs

#         # Call the helper to display and execute
#         _Invoke-Process -Executable 'turbo' -PreArgs $turboPreArgs -ShowCommandSwitch:$ShowCommand
#     }
# }


# # ┌────────────────────────────────────────────────────────────────────────────┐
# # │                         Alias to Package Name Mapping                      │
# # └────────────────────────────────────────────────────────────────────────────┘
# $packageAliases = @{
#     "tbc"    = "@fux/terminal-butler-core";
#     "tb"     = "fux-terminal-butler";
#     "ccc"    = "@fux/chrono-copy-core";
#     "cc"     = "fux-chrono-copy";
#     "ccpc"   = "@fux/context-cherry-picker-core";
#     "ccp"    = "fux-context-cherry-picker";
#     "dconc"  = "@fux/dynamicons-core";
#     "dcon"   = "fux-dynamicons";
#     "gwc"    = "@fux/ghost-writer-core";
#     "gw"     = "fux-ghost-writer";
#     "nhc"    = "@fux/notes-hub-core";
#     "nh"     = "fux-notes-hub";

#     "esb"    = "@fux/config-esbuild";
#     "esl"    = "@fux/config-eslint";
#     "serv"   = "@fux/shared-services";
# }

# # ┌────────────────────────────────────────────────────────────────────────────┐
# # │                         Dynamic Alias Registration                         │
# # └────────────────────────────────────────────────────────────────────────────┘
# $packageAliases.GetEnumerator() | ForEach-Object {
#     $aliasName = $_.Name
#     $functionName = "Invoke-$($aliasName)Command"
#     $description = "Turbo alias for $($_.Value)"

#     # This template creates an intelligent wrapper function that explicitly handles
#     # the --showcommand/--show switch to avoid parameter binding conflicts.
#     $functionTemplate = @'
# function {0} {{
#     param(
#         [Parameter()]
#         [Alias('show')]
#         [switch]$ShowCommand,

#         [Parameter(ValueFromRemainingArguments=$true)]
#         [string[]]$CommandArgs
#     )
#     # Explicitly pass the ShowCommand switch and splat the remaining arguments.
#     Invoke-TurboCommand -Alias '{1}' -ShowCommand:$ShowCommand @CommandArgs
# }}
# '@
#     $functionScript = $functionTemplate -f $functionName, $aliasName

#     # Execute the string to define the function in the current scope
#     Invoke-Expression -Command $functionScript

#     # Set the alias to point to the newly created function
#     Set-Alias -Name $aliasName -Value $functionName -Description $description
# }



# # ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
# # └───────────────────────────────────────────────────────────────────────────────────────────────────┘

