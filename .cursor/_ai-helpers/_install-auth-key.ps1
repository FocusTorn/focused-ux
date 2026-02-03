# SSH Key Installation Script
# Generates SSH key pair (or uses existing), removes old host key, and installs public key on server
#
# Usage:
#   .\_install-auth-key.ps1 -IP "192.168.1.171" -USER "root" -KEY_NAME "ed25519_RPi-DietPi"
#
# Parameters:
#   -IP        : Server IP address (required)
#   -USER      : SSH username (default: "root")
#   -KEY_NAME  : Name of the SSH key file (default: "ed25519_RPi-DietPi")
#
# Requirements:
#   - PwshSpectreConsole module (Install-Module PwshSpectreConsole -Scope CurrentUser)

param(
    [Parameter(Mandatory=$true)]
    [string]$IP,
    
    [Parameter(Mandatory=$false)]
    [string]$USER = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$KEY_NAME = "ed25519_RPi-DietPi"
)

# Import PwshSpectreConsole module
if (-not (Get-Module -ListAvailable -Name PwshSpectreConsole)) {
    Write-Error "PwshSpectreConsole module is not installed. Install it with: Install-Module PwshSpectreConsole -Scope CurrentUser"
    exit 1
}
Import-Module PwshSpectreConsole -ErrorAction Stop

# Configuration
$SSH_DIR = "$env:USERPROFILE\.ssh"
$KEY_PATH = "$SSH_DIR\$KEY_NAME"
$KeyExists = Test-Path "$KEY_PATH"
$KeyGenerated = $false

# Display header with Spectre panel
$header = @"
[bold cyan]SSH Key Setup Script[/]
[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]

[bold]IP:[/] $IP
[bold]User:[/] $USER
[bold]Key:[/] $KEY_NAME
"@
Write-SpectreHost $header
Write-Host ""

# Step 1: Handle key generation or use existing
if ($KeyExists) {
    $choices = @(
        "Use existing key",
        "Generate new key (removes existing)",
        "Cancel"
    )
    
    $choice = Read-SpectreSelection `
        -Title "[yellow]⚠ Key $KEY_NAME already exists. Choose an option:[/]" `
        -Choices $choices `
        -Color "Green"
    
    switch ($choice) {
        "Use existing key" {
            Write-SpectreHost "[green]✓ Using existing key[/]"
            $KeyGenerated = $true
        }
        "Generate new key (removes existing)" {
            # Confirm before removing existing key
            $confirmOverwrite = Read-SpectreConfirm `
                -Message "[yellow]⚠ This will permanently delete the existing key. Continue?[/]" `
                -DefaultAnswer $false
            
            if ($confirmOverwrite) {
                Write-SpectreHost "[yellow]Removing old key...[/]"
                Remove-Item "$KEY_PATH" -Force -ErrorAction SilentlyContinue
                Remove-Item "$KEY_PATH.pub" -Force -ErrorAction SilentlyContinue
                
                Write-SpectreHost "[yellow]Generating new key...[/]"
                ssh-keygen -t ed25519 -f "$KEY_PATH" -N '' -C "$KEY_NAME" -q
                
                if ($LASTEXITCODE -eq 0) {
                    Write-SpectreHost "[green]✓ New key generated[/]"
                    $KeyGenerated = $true
                } else {
                    Write-SpectreHost "[red]✗ Key generation failed[/]"
                    exit 1
                }
            } else {
                Write-SpectreHost "[yellow]Cancelled - existing key preserved[/]"
                exit 0
            }
        }
        "Cancel" {
            Write-SpectreHost "[yellow]Cancelled[/]"
            exit 0
        }
    }
} else {
    Write-SpectreHost "[yellow]Generating new key...[/]"
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N '' -C "$KEY_NAME" -q
    
    if ($LASTEXITCODE -eq 0) {
        Write-SpectreHost "[green]✓ Key generated[/]"
        $KeyGenerated = $true
    } else {
        Write-SpectreHost "[red]✗ Key generation failed[/]"
        exit 1
    }
}

# Step 2: Remove old host key from known_hosts
if ($KeyGenerated) {
    Write-Host ""
    Write-SpectreHost "[yellow]Removing old host key from known_hosts...[/]"
    ssh-keygen -R $IP 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-SpectreHost "[green]✓ Host key removed[/]"
    }
    
    # Step 3: Check server connectivity
    Write-Host ""
    Write-SpectreHost "[yellow]Checking server connectivity...[/]"
    if (Test-Connection $IP -Count 1 -Quiet) {
        Write-SpectreHost "[green]✓ Server is reachable[/]"
        
        # Step 4: Install public key on server
        Write-Host ""
        Write-SpectreHost "[yellow]Copying public key to server...[/]"
        
        $PubKey = Get-Content "$KEY_PATH.pub" -Raw
        $PubKeyTrimmed = $PubKey.Trim()
        
        Get-Content "$KEY_PATH.pub" | ssh "${USER}@${IP}" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && (grep -qF '$PubKeyTrimmed' ~/.ssh/authorized_keys || cat >> ~/.ssh/authorized_keys) && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            $success = @"
[bold green]✓ SSH key setup completed successfully![/]
[dim]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]
[bold cyan]You can now connect using:[/] [bold]ssh ${USER}@${IP}[/]
"@
            Write-SpectreHost $success
        } else {
            Write-SpectreHost "[red]✗ Failed to install key on server. Check connection and credentials.[/]"
            exit 1
        }
    } else {
        Write-SpectreHost "[yellow]⚠ Server $IP not reachable. Key ready but not installed.[/]"
        Write-Host ""
        Write-SpectreHost "[dim]You can manually install the key later using:[/]"
        Write-SpectreHost "[gray]  Get-Content `"$KEY_PATH.pub`" | ssh ${USER}@${IP} `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys`"[/]"
    }
}

