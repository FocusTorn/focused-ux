# winget install --id Microsoft.PowerShell --source winget
# . $PSScriptRoot/../../Microsoft.PowerShell_profile.ps1



# . "..\_scripts\shell\custom_pnpm_aliases.ps1"
. "$PSScriptRoot\shell\custom_pnpm_aliases.ps1"


# ┌────────────────────────────────────────────────────────────────────────────┐
# │                             Global PS Settings                             │
# └────────────────────────────────────────────────────────────────────────────┘


# function prompt { #>
    
#     $ProjectRoot = "D:\_dev\!Projects\FocusedUX\FocusedUX\"
    
#     # ANSI COLOR CODES
#     $Cyan = $PSStyle.ForegroundColor.Cyan
#     $Reset = $PSStyle.Reset

#     $CurrentPath = $PWD.Path # Get the current working directory

#     # Normalize paths for consistent comparison (remove trailing backslashes)
#     $NormalizedProjectRoot = $ProjectRoot.TrimEnd('\')
#     $NormalizedCurrentPath = $CurrentPath.TrimEnd('\')

#     # Check if the current path is exactly the project root or a subfolder
#     if ($NormalizedCurrentPath -eq $NormalizedProjectRoot -or $NormalizedCurrentPath.StartsWith($NormalizedProjectRoot + "\")) {
#         # Calculate the relative path
#         if ($NormalizedCurrentPath -eq $NormalizedProjectRoot) {
#             $RelativePath = "" # If at the root, relative path is empty
#         } else {
#             $RelativePath = $NormalizedCurrentPath.Substring($NormalizedProjectRoot.Length + 1)
#         }

#         # Construct the new prompt string
#         # If $RelativePath is empty, it will be "[PS: focused-ux]: "
#         # If $RelativePath is "packages\dynamicons", it will be "[PS: focused-ux] packages\dynamicons: "
#         $pathSegment = if ($RelativePath -eq "") { "" } else { " $RelativePath" }
        
#         # return "${Cyan}(FUX)${pathSegment}:${Reset} "
#         Write-Host -Object "${Cyan}(FUX)${pathSegment}>${Reset} " -NoNewline
        
#     }
#     else {
#         # If not within the focused-ux project, fall back to the default PowerShell prompt.
#         $Host.UI.RawUI.WindowTitle = $CurrentPath # Keep the full path in the window title
        
#         # return "PS $CurrentPath>"
#         Write-Host -Object "PS $CurrentPath>" -NoNewline
#     }
    
#     return " " 
    
# } #<

function prompt {
    $ProjectRoot = "D:\_dev\!Projects\_fux\_FocusedUX\"

    # ANSI COLOR CODES
    $ESC = [char]27
    $b="$ESC[38;5;"
    
    $Cyan = $PSStyle.ForegroundColor.Cyan
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


try {
    $vscodeAppPath = (Get-Process -Name "Code", "Code - Insiders" -ErrorAction SilentlyContinue | Select-Object -First 1).Path
    if ($vscodeAppPath) {
        $vscodeDir = Split-Path $vscodeAppPath -Parent
        $integrationScript = Join-Path $vscodeDir "resources/app/out/vs/workbench/contrib/terminal/common/scripts/shellIntegration.ps1"
        if (Test-Path $integrationScript) {
            . $integrationScript
        }
    }
} catch {}


# ┌────────────────────────────────────────────────────────────────────────────┐
# │                                   ALIAS                                    │
# └────────────────────────────────────────────────────────────────────────────┘
# Set-Alias -Name tt -Value "pnpm test" # Example: A shortcut to run tests in this project


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



# ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
# └───────────────────────────────────────────────────────────────────────────────────────────────────┘

# if ([Environment]::GetCommandLineArgs().Contains('-NonInteractive')) {
#   $Global:InteractiveMode = $false
# } else {
#   $Global:InteractiveMode = $true
# }

# gci env: | Where-Object Name -like '*VSCODE*'

# Write-Host "$($PSStyle.Dim)✅ Custom prompt created.$($PSStyle.Reset)" ""
# Write-Host -ForegroundColor Cyan "✅ FocusedUX project profile loaded."
# Write-Host ""