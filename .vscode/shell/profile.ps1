# winget install --id Microsoft.PowerShell --source winget
# . $PSScriptRoot/../../Microsoft.PowerShell_profile.ps1

# Run this to refresh the profile
# Remove-Variable FUX_PROFILE_LOADED -ErrorAction SilentlyContinue



if ($null -ne $FUX_PROFILE_LOADED) { return }

$script:FUX_PROFILE_LOADED = $true



function cat {
    [CmdletBinding(DefaultParameterSetName='Path', SupportsShouldProcess=$false)]
    param(
        [Parameter(ParameterSetName='Path', Position=0, ValueFromPipeline=$false)]
        [string[]] $Path,

        [Parameter(ParameterSetName='LiteralPath', ValueFromPipelineByPropertyName=$true)]
        [string[]] $LiteralPath,

        [Parameter(ValueFromPipeline=$true)]
        $InputObject
    )

    # If called with args like `cat file.txt`, delegate to Get-Content
    if ($PSBoundParameters.ContainsKey('Path') -or $PSBoundParameters.ContainsKey('LiteralPath')) {
        return Get-Content @PSBoundParameters
    }

    # Pipeline-only usage: act as pass-through and warn once per invocation
    begin { Write-Host "Note: '| cat' is a pass-through here." -ForegroundColor Yellow }
    process { $_ }
}




# ┌────────────────────────────────────────────────────────────────────────────┐
# │                             Global PS Settings                             │
# └────────────────────────────────────────────────────────────────────────────┘


function prompt {
    $ProjectRoot = "D:\_dev\_Projects\_fux\_FocusedUX\"

    # ANSI COLOR CODES
    $ESC = [char]27
    $b = "$ESC[38;5;"
    
    # $Cyan = $PSStyle.ForegroundColor.Cyan
    $Reset = $PSStyle.Reset
    
    $Cyan2 = "${b}45m"
    $Reset2 = "$ESC[0m"

    $CurrentPath = $PWD.Path # Get the current working directory

    $NormalizedProjectRoot = $ProjectRoot.TrimEnd('\')
    $NormalizedCurrentPath = $CurrentPath.TrimEnd('\')
    
    Set-PSReadLineOption -Colors @{ Command = $PSStyle.Reset }

    if ($NormalizedCurrentPath -eq $NormalizedProjectRoot -or $NormalizedCurrentPath.StartsWith($NormalizedProjectRoot + "\")) {
        $RelativePath = if ($NormalizedCurrentPath -eq $NormalizedProjectRoot) { "" } else { $NormalizedCurrentPath.Substring($NormalizedProjectRoot.Length + 1) }
        $pathSegment = if ($RelativePath -eq "") { "" } else { " $RelativePath" }
        return "${Cyan2}FUX${pathSegment} />${Reset2} "
    }
    else {
        $Host.UI.RawUI.WindowTitle = $CurrentPath
        return "PS $CurrentPath />${Reset} "
    }
}


# VS Code Shell Integration - Enhanced for extension compatibility
try {
    $vscodeAppPath = (Get-Process -Name "Code", "Code - Insiders" -ErrorAction SilentlyContinue | Select-Object -First 1).Path
    if ($vscodeAppPath) {
        $vscodeDir = Split-Path $vscodeAppPath -Parent
        $integrationScript = Join-Path $vscodeDir "resources/app/out/vs/workbench/contrib/terminal/common/scripts/shellIntegration.ps1"
        if (Test-Path $integrationScript) {
            . $integrationScript
        }
    }
    
    # Allow extensions to contribute to environment
    if ($env:VSCODE_INJECTION -eq "1") {
        # Signal that this terminal is ready for extension contributions
        $env:TERMINAL_READY = "1"
    }
}
catch {
    # Silently fail if integration can't be loaded
} #<

# pnpm install --global ./libs/project-alias-expander
# ┌────────────────────────────────────────────────────────────────────────────┐
# │                                   ALIAS                                    │
# └────────────────────────────────────────────────────────────────────────────┘


Write-Host "`e[32m`e[1m✔`e[0m `e[32mFocusedUX project profile loaded.`e[0m"

# ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
# └───────────────────────────────────────────────────────────────────────────────────────────────────┘

















# ┌────────────────────────────────────────────────────────────────────────────┐
# │                            VS CODE INTEGRATION                             │
# └────────────────────────────────────────────────────────────────────────────┘
#> Finds VS Code installation and sources its shell integration script. This allows tasks and debugging to function correctly.
# try {
#     $vscodeAppPath = (Get-Process -Name "Code", "Code - Insiders" -ErrorAction SilentlyContinue | Select-Object -First 1).Path
#     if ($vscodeAppPath) {
#         $vscodeDir = Split-Path $vscodeAppPath -Parent
#         $integrationScript = Join-Path $vscodeDir "resources/app/out/vs/workbench/contrib/terminal/common/scripts/shellIntegration.ps1"
#         Write-Host $integrationScript
#         if (Test-Path $integrationScript) {
#             . $integrationScript
#         }
#     }
# } catch {
#     # Silently fail if the script can't be found or loaded.
# }
#<




# if ([Environment]::GetCommandLineArgs().Contains('-NonInteractive')) {
#   $Global:InteractiveMode = $false
# } else {
#   $Global:InteractiveMode = $true
# }

# gci env: | Where-Object Name -like '*VSCODE*'
