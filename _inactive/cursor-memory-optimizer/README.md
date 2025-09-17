# Cursor Memory Optimizer

A memory optimization tool for Cursor IDE that **manually** optimizes memory usage and provides on-demand monitoring.

## Key Features

- **Manual-only operation** - No background processes or automatic monitoring
- **Memory optimization** - Applies Electron runtime optimizations to Cursor
- **On-demand monitoring** - Check memory usage when needed
- **Garbage collection** - Manual trigger for memory cleanup
- **Process management** - Launch Cursor with optimized settings
- **Context menu integration** - Quick access from file/folder context menus

## Installation

```bash
# Install dependencies
pnpm install

# Build the tool
pnpm build
```

## Usage

### Apply Optimizations

```bash
# Apply default memory optimizations
cmo optimize

# Customize memory limits
cmo optimize --max-memory 4096 --gc-threshold 85
```

### Check Memory Status

```bash
# Check current optimization status
cmo status

# Check memory usage once (no continuous monitoring)
cmo check

# Check with custom threshold
cmo check --threshold 85
```

### Manual Memory Management

```bash
# Trigger garbage collection manually
cmo gc

# Start a manual monitoring session (interactive)
cmo monitor
```

### Launch Optimized

```bash
# Launch Cursor with optimizations
cmo launch

# Launch with custom memory limits
cmo launch --max-memory 4096
```

## Context Menu Integration

### Option 1: Full Context Menu (Requires Admin)

Add "Launch Optimized" to right-click context menus for files, folders, and empty space:

```bash
# Add context menu items (run as Administrator)
pnpm run add-context-menu

# Remove context menu items
pnpm run remove-context-menu
```

**Note**: This requires Administrator privileges as it modifies the Windows registry.

### Option 2: Desktop Shortcut (No Admin Required)

Create a custom "Cursor Optimized" shortcut on your desktop:

```bash
# Create optimized shortcut
pnpm run add-shortcut-context

# Remove optimized shortcut
pnpm run remove-shortcut-context
```

This creates a separate shortcut that launches Cursor with optimizations without requiring elevated privileges.

## Commands

| Command    | Description                      | Options                                                         |
| ---------- | -------------------------------- | --------------------------------------------------------------- |
| `optimize` | Apply memory optimizations       | `--max-memory`, `--gc-interval`, `--gc-threshold`, `--force-gc` |
| `status`   | Check optimization status        | None                                                            |
| `check`    | Check memory usage once          | `--threshold`                                                   |
| `monitor`  | Start manual monitoring session  | `--threshold`                                                   |
| `gc`       | Trigger garbage collection       | None                                                            |
| `launch`   | Launch Cursor with optimizations | `--max-memory`, `--disable-extensions`, `--optimize-first`      |

## Configuration

The tool creates configuration files in your Cursor app data directory:

- **Windows**: `%APPDATA%\Cursor\argv.json`
- **macOS**: `~/Library/Application Support/Cursor/argv.json`
- **Linux**: `~/.config/Cursor/argv.json`

## Performance Impact

- **No background processes** - Tool only runs when explicitly called
- **Minimal overhead** - Optimizations are applied at Cursor startup
- **Manual control** - You decide when to check memory or trigger GC

## Troubleshooting

### High Memory Usage

1. Check current usage: `cmo check`
2. Trigger garbage collection: `cmo gc`
3. Apply optimizations: `cmo optimize`
4. Restart Cursor if needed

### Process Spawning Issues

This tool **does not spawn background processes**. If you see multiple processes:

- Check if other tools are running
- Verify no other CMO instances are active
- Use `cmo status` to check current state

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint
```

## License

Private - FocusedUX project
