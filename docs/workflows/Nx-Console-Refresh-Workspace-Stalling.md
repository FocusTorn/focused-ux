## Fix: Nx Console “Refreshing Nx Workspace” Stuck

This playbook resolves Nx Console getting stuck on “Refreshing NxWorkspace” in VS Code (Nx 21.4.x, pnpm, Windows).

### Quick fix

1) Reset Nx completely (daemon, workspace data, cache)

```bash
npx.cmd nx reset --only-daemon && npx.cmd nx reset --only-workspace-data && npx.cmd nx reset --only-cache
```

2) Close VS Code windows for this repo

- Ensure no background Node processes from the extension host are lingering. Optional hard stop:

```bash
taskkill /F /IM node.exe /T
```

3) Reopen the workspace and warm the project graph without the daemon

```bash
npx.cmd nx graph --file=tmp/nx-graph.html --no-daemon
```

4) Retry Nx Console → “Refresh Nx Workspace”

### If it still hangs

- **Disable Nx daemon in VS Code (temporary):** Set `nxDaemon.enabled` to `false` in VS Code Settings (Workspace) for Nx Console, then try refresh again.
- **Reload the window / toggle the extension:** Run “Developer: Reload Window”, or disable/enable the Nx Console extension.
- **Check `.nx` path locks / antivirus:** Ensure files under `.nx/` aren’t locked by AV. Consider excluding the repo directory from AV real-time scanning.
- **Prefer `npx.cmd` on Windows shells:** If your shell can’t see `npx`, call `npx.cmd` directly (as above).

### Optional validation

After the reset, validate the workspace by running a quick build. For example:

```bash
pae shared b -s -v
```

If the build succeeds and the graph renders without the daemon, Nx Console refresh should complete normally.

### Notes

- Tested with Nx 21.4.x on Windows using pnpm.
- Stalls are commonly caused by stale daemon state or locked workspace data; the reset sequence above clears both.


---

### Diagnostics: Identify lockers and stabilize the daemon

This section helps you confirm what is locking `.nx` and how to clear it. Use PowerShell as Administrator.

#### 1) Install or fetch Handle (Microsoft Sysinternals)

- One‑shot (no install):
```powershell
$dir="$env:TEMP\Handle"; $zip="$dir.zip"
Invoke-WebRequest 'https://download.sysinternals.com/files/Handle.zip' -OutFile $zip
Expand-Archive $zip -DestinationPath $dir -Force
Get-AuthenticodeSignature "$dir\handle64.exe"  # optional signature check
```
- What this does: downloads `handle64.exe` from Microsoft, expands it, and (optionally) verifies it’s signed by Microsoft.
- Result: `handle64.exe` path available in `$env:TEMP\Handle`.

#### 2) Find processes locking `.nx` and the repo

```powershell
$h = "$env:TEMP\Handle\handle64.exe"
& $h -nobanner 'D:\_dev\_Projects\_fux\_FocusedUX\.nx' /accepteula
& $h -nobanner 'FocusedUX' /accepteula
```
- What this does: searches for open handles on `.nx` and the repo path.
- Result: lines like `node.exe pid: 6264 ... .nx\workspace-data\d\daemon.log` indicate Nx daemon or graph workers holding files.

Optionally target specific processes:
```powershell
Get-Process MsMpEng, Code, node -ErrorAction SilentlyContinue | ForEach-Object {
  & $h -nobanner -p $_.Id '.nx' /accepteula
}
```
- What this does: checks Defender (`MsMpEng`), VS Code (`Code`/`Cursor`), and Node for `.nx` handles.
- Result: confirms whether AV or editor is involved.

#### 3) Inspect process command lines (confirm Nx daemon)

```powershell
$ids = 6264,25564,26296,37796  # replace with PIDs you saw above
foreach ($id in $ids) {
  Get-CimInstance Win32_Process -Filter "ProcessId=$id" |
    Select-Object ProcessId, CommandLine
}
```
- What this does: shows how those Node processes were launched.
- Result: paths referencing `nx\src\daemon\server\start.js` or `project-graph\plugins\isolation` confirm they are Nx daemon/graph workers.

#### 4) Clear stuck processes and state

```powershell
Stop-Process -Id 6264,25564,26296,37796 -Force   # replace with your PIDs
npx.cmd nx reset --only-daemon
npx.cmd nx reset --only-workspace-data
# If needed:
# Remove-Item -Recurse -Force 'D:\_dev\_Projects\_fux\_FocusedUX\.nx\workspace-data'
```
- What this does: terminates stuck Nx processes and resets daemon/workspace data.
- Result: releases locks so refresh can proceed.

#### 5) Warm the graph without the daemon, then retry Nx Console

```powershell
npx.cmd nx graph --file=tmp/nx-graph.html --no-daemon
```
- What this does: builds the project graph statelessly to ensure the workspace is healthy.
- Result: successful graph rendering indicates it’s safe to retry Nx Console → Refresh Nx Workspace.

#### 6) Prevent recurrence (optional but recommended)

- VS Code (Workspace Settings): set `nxDaemon.enabled` = false (Nx Console) to avoid daemon use from the extension.
- CLI (system‑wide):
```powershell
setx NX_DAEMON false
```
- Defender exclusion (A/B test or permanent):
```powershell
Add-MpPreference -ExclusionPath 'D:\_dev\_Projects\_fux\_FocusedUX'
# Remove later with:
# Remove-MpPreference -ExclusionPath 'D:\_dev\_Projects\_fux\_FocusedUX'
```
- What this does: disables daemon where it tends to hang and prevents AV from locking `.nx`.
- Result: fewer stalls; refresh works reliably.

