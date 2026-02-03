# Troubleshoot SSH Key Authentication

## Step 1: Install the Key on the Pi

SSH into the Pi with password first:
```bash
ssh root@192.168.1.165
# Password: 502421
```

Then run these commands on the Pi:
```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBNGM960pZCweE+LGVqWxcHR470SduzUaWYWgvpDGgyY RPi-DietPi" >> ~/.ssh/authorized_keys

# Set correct permissions (CRITICAL!)
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys
ls -la ~/.ssh/
```

## Step 2: Check SSH Server Configuration

On the Pi, check SSH config:
```bash
# Check if pubkey auth is enabled
grep -E "PubkeyAuthentication|PasswordAuthentication" /etc/ssh/sshd_config

# Should show:
# PubkeyAuthentication yes
# PasswordAuthentication yes (or no, if you want to disable passwords)
```

If `PubkeyAuthentication` is commented out or set to `no`, enable it:
```bash
sudo nano /etc/ssh/sshd_config
```

Make sure these lines exist and are not commented:
```
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
```

Then restart SSH:
```bash
sudo systemctl restart ssh
```

## Step 3: Verify Permissions on Pi

The permissions MUST be exactly:
```bash
# Check current permissions
ls -la ~/.ssh/

# Should show:
# drwx------ (700) for .ssh directory
# -rw------- (600) for authorized_keys file

# If wrong, fix them:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## Step 4: Test from Windows with Verbose Output

From Windows PowerShell, test with verbose output to see what's happening:
```powershell
ssh -v -i "$env:USERPROFILE\.ssh\ed25519_RPi-DietPi" root@192.168.1.165
```

Look for these lines in the output:
- `Offering public key` - Key is being offered
- `Server accepts key` - Server accepted the key
- `Authentications that can continue: publickey,password` - Shows available methods

## Step 5: Check Key Format on Pi

On the Pi, verify the key is in the correct format:
```bash
# Should be one line, no extra spaces or line breaks
cat ~/.ssh/authorized_keys | od -c
```

## Common Issues

1. **Wrong permissions** - Most common issue
   - Fix: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

2. **Key not in authorized_keys** - Key wasn't added
   - Fix: Add the key manually (see Step 1)

3. **SSH server not configured** - PubkeyAuthentication disabled
   - Fix: Enable in `/etc/ssh/sshd_config` and restart SSH

4. **Wrong key being used** - SSH config issue
   - Fix: Verify `IdentityFile` in SSH config matches your private key

5. **SELinux/AppArmor** - Security modules blocking
   - Check: `getenforce` (should show Disabled or Permissive)

## Quick Fix Script (Run on Pi)

```bash
# Run this on the Pi to set everything up correctly
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBNGM960pZCweE+LGVqWxcHR470SduzUaWYWgvpDGgyY RPi-DietPi" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chown root:root ~/.ssh
chown root:root ~/.ssh/authorized_keys
ls -la ~/.ssh/
```


