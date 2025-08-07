# FUX PowerShell Startup Script
# This script is used by VS Code to initialize the FUX terminal profile

# Set the working directory to the workspace root
Set-Location $PSScriptRoot\..\..

# Load the main profile
. "$PSScriptRoot\profile.ps1" 