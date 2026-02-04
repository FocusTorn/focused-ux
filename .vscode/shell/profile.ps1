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









# PowerShell Profile Paths Alias (with spaces - no conversion)
function Show-Profiles { #>


    Write-Host $WORKSPACE_ROOT 
        
    # .SYNOPSIS
    # Displays all PowerShell profile paths for PowerShell 5 and PowerShell 7.
    # Shows original paths with spaces (no junction conversion).

    
    Write-Host "`nPowerShell Profile Paths (Original with Spaces)" -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    $currentPSVersion = $PSVersionTable.PSVersion.Major
    
    # Helper function to format path (no conversion, shows original with spaces)
    function Format-ClickablePathSpaces {
        param([string]$Path, [string]$Label)
        if ($Path) {
            # Output label and path on one line: label in white, path in cyan
            # No path conversion - shows original paths with spaces
            Write-Host "  $Label " -ForegroundColor White -NoNewline
            Write-Host $Path -ForegroundColor Cyan
        } else {
            Write-Host "  $Label " -ForegroundColor White -NoNewline
            Write-Host "(not set)" -ForegroundColor DarkGray
        }
    }
    
    # PowerShell 5 (Windows PowerShell)
    if ($currentPSVersion -eq 5) {
        Write-Host "PowerShell 5 (Windows PowerShell) - Current:" -ForegroundColor Yellow
        Format-ClickablePathSpaces -Path $PROFILE.CurrentUserCurrentHost -Label "Current User, Current Host:"
        Format-ClickablePathSpaces -Path $PROFILE.CurrentUserAllHosts -Label "Current User, All Hosts:"
        Format-ClickablePathSpaces -Path $PROFILE.AllUsersCurrentHost -Label "All Users, Current Host:"
        Format-ClickablePathSpaces -Path $PROFILE.AllUsersAllHosts -Label "All Users, All Hosts:"
    } else {
        Write-Host "PowerShell 5 (Windows PowerShell):" -ForegroundColor Yellow
        if (Get-Command powershell.exe -ErrorAction SilentlyContinue) {
            $ps5Profiles = powershell.exe -NoProfile -Command {
                @{
                    CurrentUserCurrentHost = $PROFILE.CurrentUserCurrentHost
                    CurrentUserAllHosts = $PROFILE.CurrentUserAllHosts
                    AllUsersCurrentHost = $PROFILE.AllUsersCurrentHost
                    AllUsersAllHosts = $PROFILE.AllUsersAllHosts
                } | ConvertTo-Json
            } | ConvertFrom-Json
            
            Format-ClickablePathSpaces -Path $ps5Profiles.CurrentUserCurrentHost -Label "Current User, Current Host:"
            Format-ClickablePathSpaces -Path $ps5Profiles.CurrentUserAllHosts -Label "Current User, All Hosts:"
            Format-ClickablePathSpaces -Path $ps5Profiles.AllUsersCurrentHost -Label "All Users, Current Host:"
            Format-ClickablePathSpaces -Path $ps5Profiles.AllUsersAllHosts -Label "All Users, All Hosts:"
        } else {
            Write-Host "  Not available" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    
    # PowerShell 7 (pwsh)
    if ($currentPSVersion -ge 7) {
        Write-Host "PowerShell 7 (pwsh) - Current:" -ForegroundColor Yellow
        Format-ClickablePathSpaces -Path $PROFILE.CurrentUserCurrentHost -Label "Current User, Current Host:"
        Format-ClickablePathSpaces -Path $PROFILE.CurrentUserAllHosts -Label "Current User, All Hosts:"
        Format-ClickablePathSpaces -Path $PROFILE.AllUsersCurrentHost -Label "All Users, Current Host:"
        Format-ClickablePathSpaces -Path $PROFILE.AllUsersAllHosts -Label "All Users, All Hosts:"
    } else {
        Write-Host "PowerShell 7 (pwsh):" -ForegroundColor Yellow
        if (Get-Command pwsh -ErrorAction SilentlyContinue) {
            $pwshProfiles = pwsh -NoProfile -Command {
                @{
                    CurrentUserCurrentHost = $PROFILE.CurrentUserCurrentHost
                    CurrentUserAllHosts = $PROFILE.CurrentUserAllHosts
                    AllUsersCurrentHost = $PROFILE.AllUsersCurrentHost
                    AllUsersAllHosts = $PROFILE.AllUsersAllHosts
                } | ConvertTo-Json
            } | ConvertFrom-Json
            
            Format-ClickablePathSpaces -Path $pwshProfiles.CurrentUserCurrentHost -Label "Current User, Current Host:"
            Format-ClickablePathSpaces -Path $pwshProfiles.CurrentUserAllHosts -Label "Current User, All Hosts:"
            Format-ClickablePathSpaces -Path $pwshProfiles.AllUsersCurrentHost -Label "All Users, Current Host:"
            Format-ClickablePathSpaces -Path $pwshProfiles.AllUsersAllHosts -Label "All Users, All Hosts:"
        } else {
            Write-Host "  Not installed" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
} #<







 # ┌────────────────────────────────────────────────────────────────────────────┐
 # │ Linux Tool Alias Override                                                  │
 # ├────────────────────────────────────────────────────────────────────────────┤
 # │ This section identifies tools provided by Git Bash (usr/bin) and removes   │
 # │ any conflicting PowerShell aliases, allowing the Linux-style executables   │
 # │ to take precedence in the terminal.                                       │
 # └────────────────────────────────────────────────────────────────────────────┘
 
 
 
 # 1. Identify Git Bash usr/bin path
 $gitBashPath = "C:\Program Files\Git\usr\bin"
 
 if (Test-Path $gitBashPath) {
     # 2. Dynamically build the list of tools from the directory
     $linuxTools = Get-ChildItem -Path "$gitBashPath\*.exe" | Select-Object -ExpandProperty BaseName
 } else {
     # Fallback to common subset if path is not standard
     $linuxTools = @("ls", "cat", "grep", "curl", "wget", "echo", "cp", "mv", "rm", "sed", "awk", "find", "mkdir")
 }

 $removedAliases = @()
 $failedAliases = @()

 foreach ($tool in $linuxTools) {
     # Skip '[' as it is a special character for PowerShell wildcard matching 
     # and is not typically aliased in a way that needs overriding.
     if ($tool -eq "[") { continue }

     # If a PowerShell alias exists for this tool name, remove it.
     # PowerShell discovery order will then fall back to $tool.exe in the PATH.
     if (Get-Alias -Name $tool -ErrorAction SilentlyContinue) {
         Remove-Item "alias:$tool" -Force -ErrorAction SilentlyContinue
         
         # Verification
         if (-not (Get-Alias -Name $tool -ErrorAction SilentlyContinue)) {
             $removedAliases += $tool
         } else {
             $failedAliases += $tool
         }
     }
 }

 # Output summary only if actions were taken
 if ($removedAliases.Count -gt 0) {
     Write-Host "Replaced Aliases: $($removedAliases -join ', ')" -ForegroundColor DarkGray
 }
 if ($failedAliases.Count -gt 0) {
     Write-Host "Remaining Aliases: $($failedAliases -join ', ')" -ForegroundColor Red
 }









function gli { #>
    # Capture original ComSpec to prevent side effects
    $originalComSpec = $env:COMSPEC
    try {
        # Use absolute path for PowerShell 7 to ensure stability
        $env:COMSPEC = "C:\Program Files\PowerShell\7\pwsh.exe"

        # Check if the user already provided a --model flag
        if ($args -notcontains "--model") {
            # Add your preferred model as the default
            clear
            gemini --model gemini-3-flash-preview @args
        } else {
            # Execute with user-provided arguments
            gemini @args
        }
    } finally {
        # Restore original ComSpec
        $env:COMSPEC = $originalComSpec
    }
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
