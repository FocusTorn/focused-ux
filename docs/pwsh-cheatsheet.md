# PowerShell Cheatsheet

## Version & Environment

**Active Version Table**: `$PSVersionTable`

### Get Module Data

```powershell
$env:PSModulePath -split ';'
Get-Module -ListAvailable -Name "*PAE*"
(Get-Module -ListAvailable -Name "*PAE*").ModuleBase
Get-ChildItem "$env:USERPROFILE\Documents\WindowsPowerShell\Modules\PAE" -Recurse
```

## Profile Management

### Profile Paths

```powershell
# Current Profile (CurrentUserCurrentHost)
$PROFILE
# PowerShell 7: Documents\PowerShell\Microsoft.PowerShell_profile.ps1
# PowerShell 5.1: Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1

# All Hosts Profile (CurrentUserAllHosts)
$PROFILE.CurrentUserAllHosts
# PowerShell 7: Documents\PowerShell\profile.ps1
# PowerShell 5.1: Documents\WindowsPowerShell\profile.ps1

# All Profile Types
$PROFILE | Get-Member -MemberType NoteProperty
```

### Profile Operations

```powershell
# Check if profile exists
Test-Path $PROFILE

# Create profile if it doesn't exist
if (!(Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Edit profile
notepad $PROFILE
code $PROFILE

# View profile content
Get-Content $PROFILE

# Backup profile
Copy-Item $PROFILE "$PROFILE.backup.$(Get-Date -Format 'yyyyMMdd')"

# Reload profile
. $PROFILE

# Remove profile
Remove-Item $PROFILE -Force
```

### Profile Functions

```powershell
# Function to manage profiles
function Get-ProfileInfo {
    Write-Host "=== PowerShell Profile Information ===" -ForegroundColor Cyan
    Write-Host ""

    $profiles = @{
        "CurrentUserCurrentHost" = $PROFILE
        "CurrentUserAllHosts" = $PROFILE.CurrentUserAllHosts
        "AllUsersCurrentHost" = $PROFILE.AllUsersCurrentHost
        "AllUsersAllHosts" = $PROFILE.AllUsersAllHosts
    }

    foreach ($type in $profiles.Keys) {
        $path = $profiles[$type]
        Write-Host "$type :" -ForegroundColor Yellow
        Write-Host "  Path: $path"

        if (Test-Path $path) {
            $file = Get-Item $path
            Write-Host "  ✅ Exists" -ForegroundColor Green
            Write-Host "  Size: $($file.Length) bytes" -ForegroundColor Gray
            Write-Host "  Modified: $($file.LastWriteTime)" -ForegroundColor Gray
        } else {
            Write-Host "  ❌ Does not exist" -ForegroundColor Red
        }
        Write-Host ""
    }
}

# Function to create profile with template
function New-ProfileTemplate {
    param(
        [string]$Path = $PROFILE,
        [switch]$Force
    )

    if ((Test-Path $Path) -and !$Force) {
        Write-Host "Profile already exists at: $Path" -ForegroundColor Yellow
        Write-Host "Use -Force to overwrite" -ForegroundColor Yellow
        return
    }

    $template = @"
# PowerShell Profile
# Created: $(Get-Date)

# Set execution policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Import modules
# Import-Module -Name "ModuleName"

# Set aliases
# Set-Alias -Name "ll" -Value "Get-ChildItem"

# Set environment variables
# `$env:MY_VAR = "value"

# Custom functions
function Get-Greeting {
    param([string]`$Name = "World")
    "Hello, `$Name!"
}

# Load additional scripts
# . "`$PSScriptRoot\additional-script.ps1"

Write-Host "Profile loaded successfully!" -ForegroundColor Green
"@

    $template | Out-File -FilePath $Path -Encoding UTF8
    Write-Host "Profile template created at: $Path" -ForegroundColor Green
}

# Function to backup all profiles
function Backup-Profiles {
    param(
        [string]$BackupPath = "`$env:USERPROFILE\Documents\PowerShell\Backups"
    )

    if (!(Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $profiles = @($PROFILE, $PROFILE.CurrentUserAllHosts)

    foreach ($profile in $profiles) {
        if (Test-Path $profile) {
            $backupFile = Join-Path $BackupPath "profile_$timestamp.ps1"
            Copy-Item $profile $backupFile
            Write-Host "Backed up: $profile -> $backupFile" -ForegroundColor Green
        }
    }
}
```

## Common Commands

### Module Management

```powershell
# List available modules
Get-Module -ListAvailable

# List loaded modules
Get-Module

# Import module
Import-Module -Name "ModuleName"

# Import module from specific path
Import-Module -Name "C:\Path\To\Module"

# Remove module
Remove-Module -Name "ModuleName" -Force

# Get module info
Get-Module -Name "ModuleName" -ListAvailable

# Find modules by name pattern
Get-Module -ListAvailable -Name "*Pattern*"

# Get module commands
Get-Command -Module "ModuleName"
```

### Module Installation

```powershell
# Install from PowerShell Gallery
Install-Module -Name "ModuleName" -Scope CurrentUser

# Install specific version
Install-Module -Name "ModuleName" -RequiredVersion "1.0.0" -Scope CurrentUser

# Install from local path
Install-Module -Name "ModuleName" -Repository "LocalRepo" -Scope CurrentUser

# Update module
Update-Module -Name "ModuleName"

# Uninstall module
Uninstall-Module -Name "ModuleName"
```

### Module Paths

```powershell
# Get all module paths
$env:PSModulePath -split ';'

# Add custom module path
$env:PSModulePath += ";C:\MyModules"

# Get module path for current user
$userModulePath = Join-Path $env:USERPROFILE "Documents\PowerShell\Modules"
if (!(Test-Path $userModulePath)) {
    New-Item -ItemType Directory -Path $userModulePath -Force
}
```

### Module Functions

```powershell
# Function to completely remove module
function Remove-ModuleCompletely {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [string]$ModuleName = 'PAE'
    )

    # Remove from current session
    Remove-Module -Name $ModuleName -Force -ErrorAction SilentlyContinue

    # Find and delete module files
    $module = Get-Module -ListAvailable -Name $ModuleName
    if ($module) {
        Write-Host "Deleting module from: $($module.ModuleBase)" -ForegroundColor Yellow
        Remove-Item -Path $module.ModuleBase -Recurse -Force
        Write-Host "✅ Module '$ModuleName' completely removed" -ForegroundColor Green
    } else {
        Write-Host "❌ Module '$ModuleName' not found" -ForegroundColor Red
    }
}

# Function to get module details
function Get-ModuleDetails {
    param(
        [string]$ModuleName
    )

    $module = Get-Module -ListAvailable -Name $ModuleName
    if ($module) {
        Write-Host "=== Module Details: $ModuleName ===" -ForegroundColor Cyan
        Write-Host "Name: $($module.Name)"
        Write-Host "Version: $($module.Version)"
        Write-Host "Path: $($module.ModuleBase)"
        Write-Host "Description: $($module.Description)"
        Write-Host "Author: $($module.Author)"
        Write-Host "Company: $($module.CompanyName)"
        Write-Host "PowerShell Version: $($module.PowerShellVersion)"
        Write-Host "CLR Version: $($module.CLRVersion)"
        Write-Host "Nested Modules: $($module.NestedModules -join ', ')"
        Write-Host "Required Modules: $($module.RequiredModules -join ', ')"
        Write-Host "Exported Commands: $((Get-Command -Module $ModuleName).Count)"
    } else {
        Write-Host "❌ Module '$ModuleName' not found" -ForegroundColor Red
    }
}

# Function to list all module paths with details
function Get-ModulePaths {
    Write-Host "=== Module Paths Analysis ===" -ForegroundColor Cyan
    Write-Host ""

    $modulePaths = $env:PSModulePath -split ';'
    foreach ($path in $modulePaths) {
        Write-Host "Module Path: $path" -ForegroundColor Yellow

        if (Test-Path $path) {
            Write-Host "  ✅ Exists" -ForegroundColor Green

            # Check PowerShell version compatibility
            if ($path -like "*PowerShell\7*" -or $path -like "*PowerShell\Modules*") {
                Write-Host "  🟢 PowerShell 7+ native" -ForegroundColor Green
            } elseif ($path -like "*WindowsPowerShell*" -or $path -like "*system32*") {
                Write-Host "  🟡 PowerShell 5.1 native" -ForegroundColor Yellow
            } elseif ($path -like "*Documents\PowerShell*") {
                Write-Host "  🔵 PowerShell 7+ preferred" -ForegroundColor Blue
            } elseif ($path -like "*Documents\WindowsPowerShell*") {
                Write-Host "  🟠 PowerShell 5.1 preferred" -ForegroundColor DarkYellow
            } else {
                Write-Host "  ⚪ Third-party path" -ForegroundColor Gray
            }

            # Check write permissions
            try {
                $testFile = Join-Path $path ".test_write_permission_$(Get-Random).tmp"
                $null = New-Item -Path $testFile -ItemType File -Force -ErrorAction Stop
                Remove-Item -Path $testFile -Force -ErrorAction SilentlyContinue
                Write-Host "  🔓 Writable (no elevation required)" -ForegroundColor Green
            } catch {
                Write-Host "  🔒 Requires elevated access" -ForegroundColor Red
            }

            # Count modules in path
            $moduleCount = (Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue).Count
            Write-Host "  📦 Modules: $moduleCount" -ForegroundColor Cyan
        } else {
            Write-Host "  ❌ Does not exist" -ForegroundColor Red
        }
        Write-Host ""
    }
}
```

### Path Operations

```powershell
# Split path
$env:PSModulePath -split ';'

# Join paths
Join-Path -Path $env:USERPROFILE -ChildPath "Documents\PowerShell"

# Test if path exists
Test-Path -Path "C:\SomePath"

# Get current location
Get-Location
Set-Location -Path "C:\SomePath"
```

### Environment Variables

```powershell
# Get all environment variables
Get-ChildItem Env:

# Get specific variable
$env:USERPROFILE
$env:PSModulePath

# Set environment variable (session only)
$env:MY_VAR = "value"
```

### File Operations

```powershell
# List files recursively
Get-ChildItem -Path "C:\Path" -Recurse

# Copy files
Copy-Item -Path "source" -Destination "dest" -Recurse

# Remove files/folders
Remove-Item -Path "path" -Recurse -Force

# Create directory
New-Item -ItemType Directory -Path "C:\NewDir"
```

### String Operations

```powershell
# Split strings
"one,two,three" -split ','

# Join strings
"one", "two", "three" -join ','

# Replace text
"Hello World" -replace "World", "PowerShell"

# Format strings
"Hello {0}" -f "World"
```

### Error Handling

```powershell
# Try-catch
try {
    # Risky code
} catch {
    Write-Error "Something went wrong: $_"
}

# Error action
Get-ChildItem -Path "NonExistentPath" -ErrorAction SilentlyContinue
```

### Output Formatting

```powershell
# Format as table
Get-Process | Format-Table

# Format as list
Get-Process | Format-List

# Format as wide
Get-Process | Format-Wide

# Custom properties
Get-Process | Select-Object Name, Id, CPU
```

### Color Codes

```powershell
# Basic Colors
Write-Host "Text" -ForegroundColor Black
Write-Host "Text" -ForegroundColor DarkBlue
Write-Host "Text" -ForegroundColor DarkGreen
Write-Host "Text" -ForegroundColor DarkCyan
Write-Host "Text" -ForegroundColor DarkRed
Write-Host "Text" -ForegroundColor DarkMagenta
Write-Host "Text" -ForegroundColor DarkYellow
Write-Host "Text" -ForegroundColor Gray
Write-Host "Text" -ForegroundColor DarkGray
Write-Host "Text" -ForegroundColor Blue
Write-Host "Text" -ForegroundColor Green
Write-Host "Text" -ForegroundColor Cyan
Write-Host "Text" -ForegroundColor Red
Write-Host "Text" -ForegroundColor Magenta
Write-Host "Text" -ForegroundColor Yellow
Write-Host "Text" -ForegroundColor White

# Background Colors
Write-Host "Text" -BackgroundColor Black
Write-Host "Text" -BackgroundColor DarkBlue
Write-Host "Text" -BackgroundColor DarkGreen
Write-Host "Text" -BackgroundColor DarkCyan
Write-Host "Text" -BackgroundColor DarkRed
Write-Host "Text" -BackgroundColor DarkMagenta
Write-Host "Text" -BackgroundColor DarkYellow
Write-Host "Text" -BackgroundColor Gray
Write-Host "Text" -BackgroundColor DarkGray
Write-Host "Text" -BackgroundColor Blue
Write-Host "Text" -BackgroundColor Green
Write-Host "Text" -BackgroundColor Cyan
Write-Host "Text" -BackgroundColor Red
Write-Host "Text" -BackgroundColor Magenta
Write-Host "Text" -BackgroundColor Yellow
Write-Host "Text" -BackgroundColor White

# Combined Foreground and Background
Write-Host "Text" -ForegroundColor Green -BackgroundColor Black

# ANSI Escape Sequences (Brighter Colors)
Write-Host "`e[96mBright Cyan Text`e[0m"  # Bright Cyan
Write-Host "`e[91mBright Red Text`e[0m"   # Bright Red
Write-Host "`e[92mBright Green Text`e[0m" # Bright Green
Write-Host "`e[93mBright Yellow Text`e[0m" # Bright Yellow
Write-Host "`e[94mBright Blue Text`e[0m"  # Bright Blue
Write-Host "`e[95mBright Magenta Text`e[0m" # Bright Magenta
Write-Host "`e[97mBright White Text`e[0m" # Bright White

# ANSI Color Codes Reference
# 30-37: Standard colors (Black, Red, Green, Yellow, Blue, Magenta, Cyan, White)
# 90-97: Bright colors (Bright Black, Bright Red, Bright Green, Bright Yellow, Bright Blue, Bright Magenta, Bright Cyan, Bright White)
# 40-47: Background standard colors
# 100-107: Background bright colors

# Custom RGB Colors (PowerShell 7+)
Write-Host "Custom Color" -ForegroundColor ([System.ConsoleColor]::Cyan)
Write-Host "`e[38;2;0;255;255mCustom RGB Cyan`e[0m"  # RGB: 0,255,255
Write-Host "`e[38;2;255;100;100mCustom RGB Pink`e[0m" # RGB: 255,100,100

# Function for Bright Colors
function Write-BrightHost {
    param(
        [string]$Message,
        [string]$Color = "cyan"
    )

    $colorMap = @{
        "black" = "`e[90m"
        "red" = "`e[91m"
        "green" = "`e[92m"
        "yellow" = "`e[93m"
        "blue" = "`e[94m"
        "magenta" = "`e[95m"
        "cyan" = "`e[96m"
        "white" = "`e[97m"
    }

    $colorCode = $colorMap[$Color.ToLower()]
    if ($colorCode) {
        Write-Host "$colorCode$Message`e[0m"
    } else {
        Write-Host $Message
    }
}

# Usage
Write-BrightHost "This is bright cyan!" "cyan"
Write-BrightHost "This is bright red!" "red"
```

### Functions

```powershell
# Simple function
function Get-Greeting {
    param([string]$Name = "World")
    "Hello, $Name!"
}

# Advanced function
function Remove-ModuleCompletely {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$false)]
        [string]$ModuleName = 'PAE'
    )

    # Remove from current session
    Remove-Module -Name $ModuleName -Force -ErrorAction SilentlyContinue

    # Find and delete module files
    $module = Get-Module -ListAvailable -Name $ModuleName
    if ($module) {
        Write-Host "Deleting module from: $($module.ModuleBase)" -ForegroundColor Yellow
        Remove-Item -Path $module.ModuleBase -Recurse -Force
        Write-Host "✅ Module '$ModuleName' completely removed" -ForegroundColor Green
    } else {
        Write-Host "❌ Module '$ModuleName' not found" -ForegroundColor Red
    }
}
```

## Diagnostic Script

Run this script to get comprehensive PowerShell environment information:

┌─┬┐ ╔═╦╗ ╓─╥╖ ╒═╤╕
│ ││ ║ ║║ ║ ║║ │ ││
├─┼┤ ╠═╬╣ ╟─╫╢ ╞═╪╡
└─┴┘ ╚═╩╝ ╙─╨╜ ╘═╧╛

┏━┳┓
┃ ┃┃
┣━╋┫
┗━┻┛
╭─╥─╮
╞═╬═╡
│ ║ │
╰─╨─╯

```powershell
# PowerShell Environment Diagnostic Script
Write-Host ""
Write-Host "`e[38;5;51m┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┐`e[0m"
Write-Host "`e[38;5;51m┃                                        PowerShell Environment Diagnostic                                         │`e[0m"
Write-Host "`e[38;5;51m┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘`e[0m"
Write-Host ""

# Version Information
Write-Host "━━━━━ Version Information ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$PSVersionTable
Write-Host ""

# Profile Information
Write-Host "━━━━━ Profile Paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Current Profile: $PROFILE"
Write-Host "All Hosts Profile: $($PROFILE.CurrentUserAllHosts)"
Write-Host "CurrentUserCurrentHost: $($PROFILE.CurrentUserCurrentHost)"
Write-Host "CurrentUserAllHosts: $($PROFILE.CurrentUserAllHosts)"
Write-Host "AllUsersCurrentHost: $($PROFILE.AllUsersCurrentHost)"
Write-Host "AllUsersAllHosts: $($PROFILE.AllUsersAllHosts)"
Write-Host ""

# Module Paths
Write-Host "━━━━━ Module Paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
$modulePaths = $env:PSModulePath -split ';'
foreach ($path in $modulePaths) {
    Write-Host "Module Path: $path"
    if (Test-Path $path) {
        Write-Host "  ✅ Exists" -ForegroundColor Green

        # Check PowerShell version compatibility
        if ($path -like "*PowerShell\7*" -or $path -like "*PowerShell\Modules*") {
            Write-Host "  🟢 PowerShell 7+ native" -ForegroundColor Green
        } elseif ($path -like "*WindowsPowerShell*" -or $path -like "*system32*") {
            Write-Host "  🟡 PowerShell 5.1 native" -ForegroundColor Yellow
        } elseif ($path -like "*Documents\PowerShell*") {
            Write-Host "  🔵 PowerShell 7+ preferred" -ForegroundColor Blue
        } elseif ($path -like "*Documents\WindowsPowerShell*") {
            Write-Host "  🟠 PowerShell 5.1 preferred" -ForegroundColor DarkYellow
        } else {
            Write-Host "  ⚪ Third-party path" -ForegroundColor Gray
        }

        # Check if path requires elevated access
        $requiresElevation = $false
        try {
            # Try to create a test file to check write permissions
            $testFile = Join-Path $path ".test_write_permission_$(Get-Random).tmp"
            $null = New-Item -Path $testFile -ItemType File -Force -ErrorAction Stop
            Remove-Item -Path $testFile -Force -ErrorAction SilentlyContinue
            Write-Host "  🔓 Writable (no elevation required)" -ForegroundColor Green
        } catch {
            $requiresElevation = $true
            Write-Host "  🔒 Requires elevated access" -ForegroundColor Red
        }
    } else {
        Write-Host "  ❌ Does not exist" -ForegroundColor Red
    }
}
Write-Host ""

# Current Location
Write-Host "━━━━━ Current Location ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Current Directory: $(Get-Location)"
Write-Host ""

# Environment Variables
Write-Host "━━━━━ Key Environment Variables ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "USERPROFILE: $env:USERPROFILE"
Write-Host "USERNAME: $env:USERNAME"
Write-Host "COMPUTERNAME: $env:COMPUTERNAME"
Write-Host "OS: $env:OS"
Write-Host "PROCESSOR_ARCHITECTURE: $env:PROCESSOR_ARCHITECTURE"
Write-Host ""

# Loaded Modules
Write-Host "━━━━━ Currently Loaded Modules ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Get-Module | Format-Table Name, Version, ModuleType -AutoSize
Write-Host ""

# Available Modules (first 10)
Write-Host "━━━━━ Available Modules (first 10) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Get-Module -ListAvailable | Select-Object -First 10 | Format-Table Name, Version, ModuleBase -AutoSize
Write-Host ""

# PAE Module Specific
Write-Host "━━━━━ PAE Module Information ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
$paeModules = Get-Module -ListAvailable -Name "*PAE*"
if ($paeModules) {
    foreach ($module in $paeModules) {
        Write-Host "PAE Module: $($module.Name)"
        Write-Host "  Version: $($module.Version)"
        Write-Host "  Path: $($module.ModuleBase)"
        Write-Host "  ✅ Available" -ForegroundColor Green
    }
} else {
    Write-Host "❌ No PAE modules found" -ForegroundColor Red
}
Write-Host ""

# Profile Status
Write-Host "━━━━━ Profile Status ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
if (Test-Path $PROFILE) {
    Write-Host "Current Profile: ✅ Exists at $PROFILE" -ForegroundColor Green
    Write-Host "Profile Size: $((Get-Item $PROFILE).Length) bytes"
    Write-Host "Last Modified: $((Get-Item $PROFILE).LastWriteTime)"
} else {
    Write-Host "Current Profile: ❌ Does not exist at $PROFILE" -ForegroundColor Red
}

if (Test-Path $($PROFILE.CurrentUserAllHosts)) {
    Write-Host "All Hosts Profile: ✅ Exists at $($PROFILE.CurrentUserAllHosts)" -ForegroundColor Green
    Write-Host "Profile Size: $((Get-Item $($PROFILE.CurrentUserAllHosts)).Length) bytes"
    Write-Host "Last Modified: $((Get-Item $($PROFILE.CurrentUserAllHosts)).LastWriteTime)"
} else {
    Write-Host "All Hosts Profile: ❌ Does not exist at $($PROFILE.CurrentUserAllHosts)" -ForegroundColor Red
}
Write-Host ""

# Execution Policy
Write-Host "━━━━━ Execution Policy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Get-ExecutionPolicy -List | Format-Table Scope, ExecutionPolicy -AutoSize
Write-Host ""

# PowerShell Host Information
Write-Host "━━━━━ Host Information ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Host Name: $($Host.Name)"
Write-Host "Host Version: $($Host.Version)"
Write-Host "Host UI: $($Host.UI)"
Write-Host ""
Write-Host "`e[38;5;51m━━━━━ Diagnostic Complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`e[0m"
```

## Quick Reference

### Common Aliases

- `ls` → `Get-ChildItem`
- `cd` → `Set-Location`
- `pwd` → `Get-Location`
- `cat` → `Get-Content`
- `cp` → `Copy-Item`
- `mv` → `Move-Item`
- `rm` → `Remove-Item`
- `mkdir` → `New-Item -ItemType Directory`

### Useful Variables

- `$PSVersionTable` - PowerShell version info
- `$PROFILE` - Current profile path
- `$env:USERPROFILE` - User home directory
- `$env:PSModulePath` - Module search paths
- `$_` - Current pipeline object
- `$?` - Last command success status
- `$LASTEXITCODE` - Last command exit code

### Operators

- `-eq` - Equal
- `-ne` - Not equal
- `-lt` - Less than
- `-le` - Less than or equal
- `-gt` - Greater than
- `-ge` - Greater than or equal
- `-like` - Like (wildcards)
- `-match` - Regex match
- `-contains` - Array contains
- `-in` - Value in array
