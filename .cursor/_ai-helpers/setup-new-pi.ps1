#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generates copy-pasteable commands to set up a new Raspberry Pi with SSH, hostname, and static IP.

.DESCRIPTION
    Creates formatted snippets for:
    - Generating SSH keypair
    - Installing auth key on remote Pi
    - Assigning static IP address
    - Designating new hostname

.PARAMETER Name
    The name/hostname for the Raspberry Pi (e.g., RPi-Clean, RPi-Test)

.PARAMETER OriginalIP
    The current IP address of the Raspberry Pi to connect to initially

.PARAMETER AssignedIP
    The static IP address to assign to the Raspberry Pi

.PARAMETER Router
    The router gateway IP address (default: 192.168.1.1)

.PARAMETER DNS
    The DNS server IP address (default: 192.168.1.1)

.EXAMPLE
    .\setup-new-pi.ps1 RPi-Full 192.168.1.159 192.168.1.160
    
.EXAMPLE
    doNewPi RPi-Full 192.168.1.159 192.168.1.160
#>

function doNewPi {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [string]$Name,
        
        [Parameter(Mandatory=$true, Position=1)]
        [string]$OriginalIP,
        
        [Parameter(Mandatory=$true, Position=2)]
        [string]$AssignedIP,
        
        [Parameter(Position=3)]
        [string]$Router = "192.168.1.1",
        
        [Parameter(Position=4)]
        [string]$DNS = "192.168.1.1",
        
        [Parameter()]
        [string]$User = "pi"
    )

    $keyFileName = "ed25519_$Name"
    $keyPath = "$env:USERPROFILE\.ssh\$keyFileName"
    
    # Color definitions
    $headerColor = "`e[38;5;179m"  # Tan/orange color
    $snippetColor = "`e[96m"        # Cyan
    $resetColor = "`e[0m"
    
    # Helper function to create snippet boxes
    function Write-Snippet {
        param([string]$Title, [string]$Command)
        
        Write-Host ""
        Write-Host "${headerColor}## $Title${resetColor}"
        Write-Host ""
        Write-Host "${snippetColor}$Command${resetColor}"
        Write-Host ""
    }
    
    # Header
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Raspberry Pi Setup: ${headerColor}$Name${resetColor}" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  Name:        $Name" -ForegroundColor White
    Write-Host "  Current IP:  $OriginalIP" -ForegroundColor White
    Write-Host "  Static IP:   $AssignedIP" -ForegroundColor White
    Write-Host "  Gateway:     $Router" -ForegroundColor White
    Write-Host "  DNS:         $DNS" -ForegroundColor White
    Write-Host "  User:        $User" -ForegroundColor White
    Write-Host "  Key File:    $keyFileName" -ForegroundColor White
    Write-Host ""
    
    # Snippet 1: Generate Auth Keypair
    $generateKeyCmd = "ssh-keygen -t ed25519 -f `"$keyPath`" -C `"$Name`""
    Write-Snippet "1. Generate Auth Keypair" $generateKeyCmd
    
    # Snippet 2: Install Auth Key on Remote
    $installKeyCmd = "type `"$keyPath.pub`" | ssh $User@$OriginalIP `"mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'`""
    Write-Snippet "2. Install Auth Key on Remote Pi" $installKeyCmd
    
    # Snippet 3: Set Hostname
    $hostnameCmd = "ssh $User@$OriginalIP `"sudo hostnamectl set-hostname $Name && echo 'Hostname set to $Name'`""
    Write-Snippet "3. Set Hostname on Remote Pi" $hostnameCmd
    
    # Snippet 4: Configure Ethernet Static IP
    $ethStaticCmd = @"
ssh $User@$OriginalIP ``
"sudo bash -c 'cat >> /etc/dhcpcd.conf << EOF

# Ethernet Static IP Configuration for $Name
interface eth0
static ip_address=$AssignedIP/24
static routers=$Router
static domain_name_servers=$DNS
EOF' && ``
echo 'Ethernet static IP configured: $AssignedIP'"
"@
    Write-Snippet "4. Configure Ethernet Static IP (eth0)" $ethStaticCmd
    
    # Snippet 5: Configure WiFi Static IP
    $wifiStaticCmd = @"
ssh $User@$OriginalIP ``
"sudo bash -c 'cat >> /etc/dhcpcd.conf << EOF

# WiFi Static IP Configuration for $Name
interface wlan0
static ip_address=$AssignedIP/24
static routers=$Router
static domain_name_servers=$DNS
EOF' && ``
echo 'WiFi static IP configured: $AssignedIP'"
"@
    Write-Snippet "5. Configure WiFi Static IP (wlan0)" $wifiStaticCmd
    
    # Snippet 6: Reboot Remote Pi
    $rebootCmd = "ssh $User@$OriginalIP 'sudo reboot'"
    Write-Snippet "6. Reboot Remote Pi (Apply Changes)" $rebootCmd
    
    # Snippet 7: Test Connection with New Static IP
    $testCmd = "ssh $User@$AssignedIP"
    Write-Snippet "7. Test Connection (After Reboot - Use New IP)" $testCmd
    
    # Snippet 8: Test Connection with Hostname
    $testHostnameCmd = "ssh $User@$Name.local"
    Write-Snippet "8. Test Connection (Using Hostname)" $testHostnameCmd
    
    # SSH Config Entry
    $sshConfigEntry = @"
Host $Name
    HostName $AssignedIP
    User $User
    IdentityFile ~/.ssh/$keyFileName
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
"@
    
    Write-Host ""
    Write-Host "${headerColor}## SSH Config Entry${resetColor}"
    Write-Host ""
    Write-Host "Add this to your ${snippetColor}~\.ssh\config${resetColor} file:" -ForegroundColor White
    Write-Host ""
    Write-Host "┌─────────────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "${snippetColor}$sshConfigEntry${resetColor}"
    Write-Host "└─────────────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    
    # Alternative with hostname
    $sshConfigEntryHostname = @"
Host $Name
    HostName $Name.local
    User $User
    IdentityFile ~/.ssh/$keyFileName
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
"@
    
    Write-Host ""
    Write-Host "${headerColor}## SSH Config Entry (Using Hostname)${resetColor}"
    Write-Host ""
    Write-Host "Or use this to connect via hostname instead of IP:" -ForegroundColor White
    Write-Host ""
    Write-Host "┌─────────────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "${snippetColor}$sshConfigEntryHostname${resetColor}"
    Write-Host "└─────────────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
    
    # Final instructions
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Setup Instructions" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "${snippetColor}Basic Setup:${resetColor}" -ForegroundColor Yellow
    Write-Host "1. Run ${snippetColor}Generate Auth Keypair${resetColor} command" -ForegroundColor White
    Write-Host "2. Run ${snippetColor}Install Auth Key${resetColor} command (enter Pi password)" -ForegroundColor White
    Write-Host "3. Run ${snippetColor}Set Hostname${resetColor} command" -ForegroundColor White
    Write-Host ""
    Write-Host "${snippetColor}Network Configuration (choose what you need):${resetColor}" -ForegroundColor Yellow
    Write-Host "4a. For Ethernet: Run ${snippetColor}Configure Ethernet Static IP${resetColor}" -ForegroundColor White
    Write-Host "4b. For WiFi: Run ${snippetColor}Configure WiFi Static IP${resetColor}" -ForegroundColor White
    Write-Host "4c. For Both: Run both 4a and 4b" -ForegroundColor White
    Write-Host ""
    Write-Host "${snippetColor}Final Steps:${resetColor}" -ForegroundColor Yellow
    Write-Host "5. Run ${snippetColor}Reboot Remote Pi${resetColor} command" -ForegroundColor White
    Write-Host "6. Wait ~30 seconds for the Pi to reboot" -ForegroundColor White
    Write-Host "7. Test connection with ${snippetColor}Test Connection${resetColor} commands" -ForegroundColor White
    Write-Host "8. Add the ${snippetColor}SSH Config Entry${resetColor} to your config file" -ForegroundColor White
    Write-Host "9. Connect using: ${snippetColor}ssh $Name${resetColor}" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# If script is run directly (not dot-sourced), execute the function
if ($MyInvocation.InvocationName -ne '.') {
    if ($args.Count -lt 3) {
        Write-Host "Usage: .\setup-new-pi.ps1 <Name> <OriginalIP> <AssignedIP> [Router] [DNS]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Example:" -ForegroundColor Cyan
        Write-Host "  .\setup-new-pi.ps1 RPi-Full 192.168.1.159 192.168.1.160" -ForegroundColor White
        Write-Host ""
        Write-Host "Or add to your PowerShell profile and use:" -ForegroundColor Cyan
        Write-Host "  doNewPi RPi-Full 192.168.1.159 192.168.1.160" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    doNewPi @args
}

