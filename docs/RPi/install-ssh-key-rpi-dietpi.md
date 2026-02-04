# Install SSH Key on RPi-DietPi

## Check if Key is Already Installed

SSH into the Pi and check:
```bash
ssh root@192.168.1.165
# or if you can connect with password
# Password: 502421

# Check if authorized_keys exists
ls -la ~/.ssh/authorized_keys

# View the contents
cat ~/.ssh/authorized_keys
```

## Install the Key Manually

### Method 1: Copy from Windows (Recommended)

From your Windows machine, run:
```powershell
# Get your public key
Get-Content "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi.pub"
```

Then SSH into the Pi and add it:
```bash
# SSH into the Pi (using password for now)
ssh root@192.168.1.165
# Password: 502421

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
nano ~/.ssh/authorized_keys
# Paste the public key content, save and exit (Ctrl+X, Y, Enter)

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Method 2: Use ssh-copy-id (if available)

```bash
# From Windows PowerShell
type "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi.pub" | ssh root@192.168.1.165 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Method 3: One-liner from Windows

```powershell
# Copy public key to Pi
Get-Content "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi.pub" | ssh root@192.168.1.165 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'"
```

## Verify Installation

After installing, test key-based authentication:
```powershell
# From Windows - should connect without password
ssh -i "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi" root@192.168.1.165
```

Or using the SSH config:
```powershell
ssh RPi-DietPi
```

## Your Public Key

Your public key is:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBNGM960pZCweE+LGVqWxcHR470SduzUaWYWgvpDGgyY RPi-DietPi
```

## Troubleshooting

If key-based auth doesn't work:

1. **Check permissions on Pi:**
   ```bash
   ls -la ~/.ssh/
   # Should show:
   # drwx------ (700) for .ssh directory
   # -rw------- (600) for authorized_keys file
   ```

2. **Check SSH server config:**
   ```bash
   grep -E "PubkeyAuthentication|AuthorizedKeysFile" /etc/ssh/sshd_config
   # Should show:
   # PubkeyAuthentication yes
   # AuthorizedKeysFile .ssh/authorized_keys
   ```

3. **Restart SSH if needed:**
   ```bash
   systemctl restart ssh
   ```


