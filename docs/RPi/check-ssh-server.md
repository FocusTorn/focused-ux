# How to Check Which SSH Server is Active

## Quick Check Commands

### 1. Check which process is listening on port 22
```bash
# Method 1: Using ss (most reliable)
ss -tlnp | grep :22

# Method 2: Using netstat
netstat -tlnp | grep :22

# Method 3: Using lsof (if available)
lsof -i :22
```

**Output will show:**
- `sshd` = OpenSSH
- `dropbear` = Dropbear

### 2. Check which SSH services are running
```bash
# Check OpenSSH status
systemctl status ssh

# Check Dropbear status
systemctl status dropbear
```

### 3. Check which SSH processes are running
```bash
# See all SSH-related processes
ps aux | grep -E "(sshd|dropbear)" | grep -v grep
```

**Output examples:**
- `sshd: root@pts/0` = OpenSSH
- `/usr/sbin/dropbear` = Dropbear

### 4. Check which SSH binary is being used
```bash
# Find the process and its path
ps aux | grep -E "(sshd|dropbear)" | grep -v grep | awk '{print $11}'
```

### 5. Check installed SSH servers
```bash
# Check if OpenSSH is installed
dpkg -l | grep openssh-server

# Check if Dropbear is installed
dpkg -l | grep dropbear

# Or use which/whereis
which sshd
which dropbear
```

## One-Liner to Identify Active SSH Server

```bash
# Quick one-liner
ss -tlnp | grep :22 | awk '{print $7}' | cut -d',' -f2 | xargs ps -p | grep -E "(sshd|dropbear)" | head -1
```

Or simpler:
```bash
# Check what's listening on port 22
sudo lsof -i :22 | grep LISTEN
```

## Most Reliable Method

```bash
# This will show the exact process name
sudo netstat -tlnp 2>/dev/null | grep :22 | awk '{print $7}' | cut -d'/' -f2 | sort -u
```

**Expected output:**
- `sshd` = OpenSSH is active
- `dropbear` = Dropbear is active
- Both = Both are running (unusual, but possible)

## Check Service Status

```bash
# Check both services
systemctl is-active ssh && echo "OpenSSH is ACTIVE" || echo "OpenSSH is INACTIVE"
systemctl is-active dropbear && echo "Dropbear is ACTIVE" || echo "Dropbear is INACTIVE"
```

## Visual Identification

```bash
# See full process tree
pstree | grep -E "(sshd|dropbear)"
```


