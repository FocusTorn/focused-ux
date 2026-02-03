# DietPi Setup Menu - Interactive TUI for all helper scripts
# Usage: .\dietpi-menu.ps1 [-DriveLetter "F:"]
# Requires: PwshSpectreConsole module (Install-Module PwshSpectreConsole -Scope CurrentUser)

param(
    [Parameter(Mandatory=$false)]
    [string]$DriveLetter = "F:"
)

# Import PwshSpectreConsole module
if (-not (Get-Module -ListAvailable -Name PwshSpectreConsole)) {
    Write-Error "PwshSpectreConsole module is not installed. Install it with: Install-Module PwshSpectreConsole -Scope CurrentUser"
    exit 1
}
Import-Module PwshSpectreConsole -ErrorAction Stop

# Ensure drive letter format is correct
if (-not $DriveLetter.EndsWith(":")) {
    $DriveLetter = $DriveLetter + ":"
}

function Show-Menu {
    param([string]$CurrentDrive)

    Clear-Host
    
    $menu = @"
[bold cyan]DietPi Setup Helper Menu[/] - [dim]SD Card: $CurrentDrive[/]

[bold white]Configuration:[/]
  1. Update DietPi config values (minimal changes, preserves defaults)
  2. Setup early boot logging (automatic, creates boot.log)
  3. Setup network LED indicator (flash on connect)
  4. Toggle auto-resize (enable/disable partition resize on boot)

[bold white]Validation and Tools:[/]
  5. Verify SD card setup (check files, settings, logs)
  6. Convert CRLF to LF (fix line endings)
  7. Find SSH device on network
  8. Create IP scan list file

[bold white]Utilities:[/]
  9. Change SD card drive letter
 10. Release drive handles (make ejectable)
 11. Find what's blocking drive (detailed check)
 12. Show all available scripts

 0. Exit
"@
    Write-SpectreHost $menu
}

function Get-ScriptPath {
    param([string]$ScriptName)

    # Get script directory - try multiple methods
    $scriptDir = $PSScriptRoot
    if (-not $scriptDir) {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    if (-not $scriptDir) {
        $scriptDir = Split-Path -Parent $PSCommandPath
    }
    if (-not $scriptDir) {
        # Fallback: assume script is in .cursor\_ai-helpers
        $scriptDir = Join-Path (Get-Location) ".cursor\_ai-helpers"
    }

    $scriptPath = Join-Path $scriptDir $ScriptName
    if (Test-Path $scriptPath) {
        return $scriptPath
    }
    return $null
}

function Invoke-ScriptExecution {
    param([string]$ScriptPath, [string]$Description, [string]$Drive)

    Write-Host ""
    
    if (-not $ScriptPath -or -not (Test-Path $ScriptPath)) {
        Write-SpectreHost "[bold red]✗[/] [red]ERROR: Script not found: $ScriptPath[/]"
        Write-SpectreHost "[yellow]Press any key to continue...[/]"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }

    try {
        # Show status with Spectre
        $statusMessage = "[bold cyan]Running:[/] [white]$Description[/]"
        Write-SpectreHost $statusMessage
        Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
        
        # Run script normally but ensure cleanup
        & $ScriptPath -DriveLetter $Drive
    } catch {
        Write-SpectreHost "[bold red]✗[/] [red]ERROR: Script failed: $_[/]"
    } finally {
        # Force aggressive cleanup of file handles
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        [System.GC]::Collect()
        Start-Sleep -Milliseconds 500
    }

    Write-Host ""
    Write-SpectreHost "[yellow]Press any key to continue...[/]"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Clear-DriveHandle {
    param([string]$Drive)

    Write-Host ""
    Write-SpectreHost "[bold cyan]Releasing drive handles for $Drive...[/]"
    Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"

    # Remove trailing colon for some operations
    $driveRoot = $Drive.TrimEnd(':')

    # Step 1: Close Explorer windows on this drive
    Write-SpectreHost "`n[bold yellow][Step 1][/] [yellow]Closing Explorer windows on $Drive...[/]"
    try {
        $explorerWindows = Get-Process explorer -ErrorAction SilentlyContinue
        if ($explorerWindows) {
            Write-SpectreHost "  [dim]ℹ[/] [dim]Explorer is running (may have windows open)[/]"
            Write-SpectreHost "  [yellow]→[/] [yellow]Try manually closing any Explorer windows on $Drive[/]"
        }
    } catch {
        Write-SpectreHost "  [yellow]⚠[/] [yellow]Could not check Explorer: $_[/]"
    }

    # Step 2: Clear PowerShell variables that might reference the drive
    Write-SpectreHost "`n[bold yellow][Step 2][/] [yellow]Clearing PowerShell variables...[/]"
    try {
        Get-Variable | Where-Object {
            $_.Value -is [System.IO.FileInfo] -or
            $_.Value -is [System.IO.DirectoryInfo] -or
            ($_.Value -is [string] -and $_.Value -like "$Drive*")
        } | ForEach-Object {
            Remove-Variable -Name $_.Name -ErrorAction SilentlyContinue -Scope Global
        }
        Write-SpectreHost "  [bold green]✓[/] [green]Cleared variables[/]"
    } catch {
        Write-SpectreHost "  [yellow]⚠[/] [yellow]Could not clear variables: $_[/]"
    }

    # Step 3: Remove PSDrive if it exists
    Write-SpectreHost "`n[bold yellow][Step 3][/] [yellow]Checking for PSDrive...[/]"
    try {
        $psDrive = Get-PSDrive -Name $driveRoot -ErrorAction SilentlyContinue
        if ($psDrive) {
            Remove-PSDrive -Name $driveRoot -Force -ErrorAction SilentlyContinue
            Write-SpectreHost "  [bold green]✓[/] [green]Removed PSDrive[/]"
        } else {
            Write-SpectreHost "  [bold green]✓[/] [dim]No PSDrive found[/]"
        }
    } catch {
        Write-SpectreHost "  [yellow]⚠[/] [yellow]Could not check PSDrive: $_[/]"
    }

    # Step 4: Force garbage collection multiple times
    Write-SpectreHost "`n[bold yellow][Step 4][/] [yellow]Forcing garbage collection...[/]"
    for ($i = 1; $i -le 3; $i++) {
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        [System.GC]::Collect()
        Start-Sleep -Milliseconds 200
    }
    Write-SpectreHost "  [bold green]✓[/] [green]Garbage collection complete[/]"

    # Step 5: Check for processes with open files (using openfiles.exe - requires admin)
    Write-SpectreHost "`n[bold yellow][Step 5][/] [yellow]Checking for open file handles...[/]"
    try {
        # Try using openfiles.exe (requires admin, but more accurate)
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

        if ($isAdmin) {
            # Enable openfiles tracking if not already enabled
            $null = openfiles /local on 2>&1 | Out-Null

            $openFilesOutput = openfiles /query /fo csv 2>&1 | Out-String
            if ($LASTEXITCODE -eq 0 -and $openFilesOutput) {
                # Try to parse CSV, handling cases where headers might be missing
                try {
                    # Clean up the output and try to detect headers
                    $csvLines = $openFilesOutput -split "`n" | Where-Object { $_.Trim() -ne "" }
                    if ($csvLines.Count -gt 1) {
                        # Check if first line looks like headers
                        $firstLine = $csvLines[0]
                        if ($firstLine -match "ID|Files|Accessed") {
                            # Has headers, parse normally - suppress warning about missing headers
                            $WarningPreference = 'SilentlyContinue'
                            $openFiles = $csvLines | ConvertFrom-Csv -ErrorAction Stop
                            $WarningPreference = 'Continue'
                        } else {
                            # No headers, skip parsing
                            $openFiles = $null
                        }
                    } else {
                        $openFiles = $null
                    }
                } catch {
                    # If parsing fails, just skip it
                    $openFiles = $null
                }

                if ($openFiles) {
                    $driveFiles = $openFiles | Where-Object { 
                        $filePath = $_.'Files' -or $_.Files
                        $filePath -like "$Drive*" 
                    }

                    if ($driveFiles) {
                        Write-SpectreHost "  [yellow]⚠[/] [yellow]Found open file handles:[/]"
                        $driveFiles | ForEach-Object {
                            $pid = $_.'ID' -or $_.ID
                            $file = $_.'Files' -or $_.Files
                            Write-SpectreHost "    [dim]-[/] [dim]PID $pid : $file[/]"
                        }
                        Write-SpectreHost "  [yellow]→[/] [yellow]You may need to close these processes manually[/]"
                    } else {
                        Write-SpectreHost "  [bold green]✓[/] [green]No open file handles found on $Drive[/]"
                    }
                } else {
                    Write-SpectreHost "  [bold green]✓[/] [green]No open file handles found on $Drive[/]"
                }
            } else {
                Write-SpectreHost "  [dim]ℹ[/] [dim]Could not query open files (may need to enable: openfiles /local on)[/]"
            }
        } else {
            Write-SpectreHost "  [dim]ℹ[/] [dim]Admin rights required for detailed file handle check[/]"
            Write-SpectreHost "  [yellow]→[/] [yellow]Run PowerShell as Administrator for better detection[/]"
        }
    } catch {
        Write-SpectreHost "  [dim]ℹ[/] [dim]Could not check open files: $_[/]"
    }

    # Step 6: Check for processes with paths on the drive
    Write-SpectreHost "`n[bold yellow][Step 6][/] [yellow]Checking for processes using $Drive...[/]"
    try {
        $blockers = Get-Process | Where-Object {
            $_.Path -like "$Drive*"
        } | Select-Object Id, ProcessName, Path

        if ($blockers) {
            Write-SpectreHost "  [yellow]⚠[/] [yellow]Found processes using the drive:[/]"
            $blockers | ForEach-Object {
                Write-SpectreHost "    [dim]-[/] [dim]$($_.ProcessName) (PID: $($_.Id))[/]"
            }
        } else {
            Write-SpectreHost "  [bold green]✓[/] [green]No processes found using the drive[/]"
        }
    } catch {
        Write-SpectreHost "  [yellow]⚠[/] [yellow]Could not check processes: $_[/]"
    }

    Write-SpectreHost "`n[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
    Write-SpectreHost "[bold green]✓[/] [green]Drive handle release complete![/]"
    Write-Host ""
    Write-SpectreHost "[yellow]If the drive still won't eject, try:[/]"
    Write-SpectreHost "  [white]1.[/] [white]Close all Explorer windows manually[/]"
    Write-SpectreHost "  [white]2.[/] [white]Close this PowerShell window and try ejecting[/]"
    Write-SpectreHost "  [white]3.[/] [white]Restart Explorer: taskkill /f /im explorer.exe; start explorer.exe[/]"
    Write-SpectreHost "  [white]4.[/] [white]Use Windows Safely Remove Hardware from system tray[/]"
    Write-Host ""
    Write-SpectreHost "[yellow]Press any key to continue...[/]"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main menu loop
# Get script directory - try multiple methods
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $PSCommandPath
}
if (-not $scriptDir) {
    # Fallback: assume script is in .cursor\_ai-helpers
    $scriptDir = Join-Path (Get-Location) ".cursor\_ai-helpers"
}

$currentDrive = $DriveLetter

do {
    Clear-Host
    Write-SpectreHost "[bold cyan]DietPi Setup Helper Menu[/] - [dim]SD Card: $currentDrive[/]`n"

    # Menu choices for interactive selection - all options shown in prompt
    $menuChoices = @(
        "1. Update DietPi Config Values",
        "2. Setup Early Boot Logging",
        "3. Setup Network LED Indicator",
        "4. Toggle Auto-Resize",
        "5. Verify SD Card Setup",
        "6. Convert CRLF to LF",
        "7. Find SSH Device on Network",
        "8. Create IP Scan List File",
        "9. Change SD Card Drive Letter",
        "10. Release Drive Handles",
        "11. Find Drive Blockers",
        "12. Show All Available Scripts",
        "0. Exit"
    )

    # Use Read-SpectreSelection which supports both arrow keys and direct number input
    $selected = Read-SpectreSelection `
        -Title "[bold cyan]Select an option (type number or use arrow keys):[/]" `
        -Choices $menuChoices
    
    # Extract the choice number
    $choice = ($selected -split '\.')[0].Trim()

    switch ($choice) {
        "1" {
            $script = Get-ScriptPath "update-dietpi-values.ps1"
            Invoke-ScriptExecution -ScriptPath $script -Description "Update DietPi Config Values" -Drive $currentDrive
        }
        "2" {
            $script = Get-ScriptPath "setup-early-boot-logging.ps1"
            Invoke-ScriptExecution -ScriptPath $script -Description "Setup Early Boot Logging" -Drive $currentDrive
        }
        "3" {
            $script = Get-ScriptPath "setup-network-led-indicator.ps1"
            Invoke-ScriptExecution -ScriptPath $script -Description "Setup Network LED Indicator" -Drive $currentDrive
        }
        "4" {
            Write-Host ""
            Write-SpectreHost "[bold cyan]Toggle Auto-Resize[/]"
            Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
            Write-Host ""
            
            # Check current state
            $bootPath = Join-Path $currentDrive "boot"
            $systemdPath = Join-Path $bootPath "systemd" "system"
            $overrideFile = Join-Path (Join-Path $systemdPath "dietpi-fs_partition_resize.service.d") "override.conf"
            $skipFlag = Join-Path $bootPath "skip_resize"
            
            $isDisabled = (Test-Path $overrideFile) -or (Test-Path $skipFlag)
            
            if ($isDisabled) {
                Write-SpectreHost "[bold yellow]Current state:[/] [yellow]DISABLED[/]"
                Write-Host ""
                Write-SpectreHost "[white]The resize script is currently disabled.[/]"
                $response = Read-SpectreConfirm `
                    -Message "[yellow]Would you like to ENABLE it?[/]" `
                    -DefaultAnswer $false
                if ($response) {
                    $script = Get-ScriptPath "enable-dietpi-resize.ps1"
                    if ($script) {
                        & $script -DriveLetter $currentDrive
                    } else {
                        Write-SpectreHost "[bold red]✗[/] [red]ERROR: enable-dietpi-resize.ps1 not found[/]"
                    }
                }
            } else {
                Write-SpectreHost "[bold green]Current state:[/] [green]ENABLED[/]"
                Write-Host ""
                Write-SpectreHost "[white]The resize script is currently enabled (will run on first boot).[/]"
                $response = Read-SpectreConfirm `
                    -Message "[yellow]Would you like to DISABLE it?[/]" `
                    -DefaultAnswer $false
                if ($response) {
                    $script = Get-ScriptPath "disable-dietpi-resize.ps1"
                    if ($script) {
                        & $script -DriveLetter $currentDrive
                    } else {
                        Write-SpectreHost "[bold red]✗[/] [red]ERROR: disable-dietpi-resize.ps1 not found[/]"
                    }
                }
            }
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            do {
                $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            } while ($key.VirtualKeyCode -ne 32 -and $key.VirtualKeyCode -ne 13)
        }
        "5" {
            $script = Get-ScriptPath "verify-sd-card-setup.ps1"
            Invoke-ScriptExecution -ScriptPath $script -Description "Verify SD Card Setup" -Drive $currentDrive
        }
        "6" {
            $script = Get-ScriptPath "convert-crlf-to-lf.ps1"
            Invoke-ScriptExecution -ScriptPath $script -Description "Convert CRLF to LF" -Drive $currentDrive
        }
        "7" {
            $script = Get-ScriptPath "find-ssh-device.ps1"
            Write-Host ""
            Write-SpectreHost "[bold cyan]Running:[/] [white]Find SSH Device[/]"
            Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
            & $script
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "8" {
            $script = Get-ScriptPath "create-ip-scan-list.ps1"
            Write-Host ""
            Write-SpectreHost "[bold cyan]Running:[/] [white]Create IP Scan List[/]"
            Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
            & $script
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "9" {
            Write-Host ""
            Write-SpectreHost "[bold yellow]Current drive:[/] [cyan]$currentDrive[/]"
            Write-SpectreHost "[yellow]Enter new drive letter (e.g., F or E):[/]"
            $newDrive = Read-Host
            if ($newDrive) {
                if (-not $newDrive.EndsWith(":")) {
                    $newDrive = $newDrive + ":"
                }
                if (Test-Path $newDrive) {
                    $currentDrive = $newDrive
                    Write-SpectreHost "[bold green]✓[/] [green]Drive changed to: $currentDrive[/]"
                } else {
                    Write-SpectreHost "[bold red]✗[/] [red]ERROR: Drive $newDrive does not exist![/]"
                }
            }
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "10" {
            Clear-DriveHandle -Drive $currentDrive
        }
        "11" {
            $script = Get-ScriptPath "find-drive-blockers.ps1"
            Write-Host ""
            Write-SpectreHost "[bold cyan]Running:[/] [white]Find Drive Blockers[/]"
            Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
            if ($script) {
                & $script -DriveLetter $currentDrive
            } else {
                Write-SpectreHost "[bold red]✗[/] [red]ERROR: Script not found[/]"
            }
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "12" {
            Write-Host ""
            Write-SpectreHost "[bold cyan]Available scripts in .cursor\_ai-helpers:[/]"
            Write-SpectreHost "[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]"
            $scripts = Get-ChildItem -Path $scriptDir -Filter "*.ps1" | Sort-Object Name
            foreach ($script in $scripts) {
                Write-SpectreHost "  [dim]-[/] [white]$($script.Name)[/]"
            }
            Write-Host ""
            Write-SpectreHost "[yellow]Press any key to continue...[/]"
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "0" {
            Write-Host ""
            Write-SpectreHost "[yellow]Exiting...[/]"
            break
        }
        default {
            Write-Host ""
            Write-SpectreHost "[bold red]✗[/] [red]Invalid option. Please select 0-12.[/]"
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")

Write-Host ""

