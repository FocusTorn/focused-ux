# Install and Configure OpenSSH on DietPi

## Steps to Install OpenSSH

### 1. Connect via SSH (using Dropbear)
```bash
ssh root@192.168.1.85
# Password: 502421
```

### 2. Install OpenSSH Server
```bash
apt update
apt install -y openssh-server
```

### 3. Configure OpenSSH

#### Enable and start the service
```bash
systemctl enable ssh
systemctl start ssh
```

#### Check if it's running
```bash
systemctl status ssh
```

#### Verify SSH is listening on port 22
```bash
netstat -tlnp | grep :22
# or
ss -tlnp | grep :22
```

### 4. Configure SSH (Optional but Recommended)

#### Edit SSH config
```bash
nano /etc/ssh/sshd_config
```

#### Recommended settings to add/modify:
```
# Port (default is 22, change if needed)
Port 22

# Disable root login with password (use key-based auth)
PermitRootLogin prohibit-password

# Enable public key authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Disable password authentication (after setting up keys)
PasswordAuthentication no

# Other security settings
X11Forwarding no
AllowTcpForwarding yes
```

#### Restart SSH after config changes
```bash
systemctl restart ssh
```

### 5. Add Your SSH Public Key

#### Create .ssh directory if it doesn't exist
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

#### Add your public key
```bash
nano ~/.ssh/authorized_keys
```

Paste your public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBNGM960pZCweE+LGVqWxcHR470SduzUaWYWgvpDGgyY RPi-DietPi
```

#### Set correct permissions
```bash
chmod 600 ~/.ssh/authorized_keys
```

### 6. Test OpenSSH Connection

From your Windows machine:
```powershell
ssh -i "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi" root@192.168.1.85
```

### 7. (Optional) Disable Dropbear

Once OpenSSH is working, you can disable Dropbear:
```bash
systemctl stop dropbear
systemctl disable dropbear
```

Or remove it:
```bash
apt remove -y dropbear
```

### 8. Update SSH Config on Windows

Update your `~/.ssh/config` to use the correct IP:
```
Host RPi-DietPi
    HostName 192.168.1.85
    User root
    IdentityFile ~/.ssh/ed25519_RPi-DietPi
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

## Quick One-Liner to Install and Configure

```bash
apt update && apt install -y openssh-server && systemctl enable ssh && systemctl start ssh && systemctl status ssh
```

## Verify Installation

```bash
# Check SSH service status
systemctl status ssh

# Check if port 22 is listening
ss -tlnp | grep :22

# Test local connection
ssh -o StrictHostKeyChecking=no root@localhost "echo 'SSH is working!'"
```


