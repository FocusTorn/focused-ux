# Cursor Memory Optimizer

A comprehensive memory optimization tool for Cursor IDE that addresses the memory leak issues described in the [Cursor forum post](https://forum.cursor.com/t/i-asked-deep-search/55873).

> **Note**: This tool follows the FocusedUX SOP directives outlined in `./docs/SOP.md`. All new packages must adhere to these standards for consistency and maintainability.
>
> **Memory**: All new packages must follow the directives outlined within the `./docs/SOP.md` file, including the package structure decision tree for determining whether to use core/ext, shared, or tool patterns.

## Features

- **Memory Optimization**: Apply Electron runtime optimizations to Cursor
- **Real-time Monitoring**: Monitor Cursor's memory usage with configurable thresholds
- **Smart Launcher**: Launch Cursor with optimized settings and optional extension disabling
- **Cross-platform Support**: Works on Windows, macOS, and Linux
- **Status Reporting**: Check current optimization status and process information

## Installation

The tool is part of the FocusedUX monorepo. To install dependencies:

```bash
pnpm install
```

## Usage

### Basic Commands

```bash
# Apply memory optimizations to Cursor
npx nx optimize cursor-memory-optimizer

# Monitor Cursor memory usage in real-time
npx nx monitor cursor-memory-optimizer

# Launch Cursor with optimizations
npx nx launch cursor-memory-optimizer

# Check current optimization status
npx nx status cursor-memory-optimizer
```

### Direct tsx Usage

You can also run the tool directly with tsx:

```bash
# Apply memory optimizations to Cursor
tsx libs/tools/cursor-memory-optimizer/src/index.ts optimize

# Monitor Cursor memory usage in real-time
tsx libs/tools/cursor-memory-optimizer/src/index.ts monitor

# Launch Cursor with optimizations
tsx libs/tools/cursor-memory-optimizer/src/index.ts launch

# Check current optimization status
tsx libs/tools/cursor-memory-optimizer/src/index.ts status
```

### Advanced Usage

#### Optimize Command

```bash
# Apply optimizations with custom settings
npx nx optimize cursor-memory-optimizer -- --max-memory 2048 --gc-interval 50 --force-gc

# Options:
# -m, --max-memory <mb>     Maximum memory limit in MB (default: 4096)
# -g, --gc-interval <ms>    Garbage collection interval in ms (default: 100)
# -f, --force-gc            Force garbage collection (default: false)
```

#### Monitor Command

```bash
# Monitor with custom settings
npx nx monitor cursor-memory-optimizer -- --interval 10 --threshold 70

# Options:
# -i, --interval <seconds>    Monitoring interval in seconds (default: 5)
# -t, --threshold <percent>   Memory threshold percentage (default: 80)
```

#### Launch Command

```bash
# Launch with optimizations and monitoring
npx nx launch cursor-memory-optimizer -- --max-memory 2048 --disable-extensions --start-monitor

# Options:
# -m, --max-memory <mb>      Maximum memory limit in MB (default: 4096)
# -d, --disable-extensions    Disable AI extensions (default: false)
# -o, --optimize-first        Apply optimizations before launch (default: true)
# -s, --start-monitor         Start memory monitoring after launch (default: false)
```

## How It Works

### Memory Optimization

The tool creates an `argv.json` configuration file in Cursor's application data directory with optimized Electron runtime arguments:

```json
{
  "runtimeArgs": [
    "--max-old-space-size=4096",
    "--gc-interval=100",
    "--force-gc",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection"
  ]
}
```

### Memory Monitoring

The monitoring system:
- Checks Cursor's memory usage at configurable intervals
- Triggers garbage collection when memory usage exceeds thresholds
- Provides real-time status updates with color-coded output
- Generates reports with statistics and recommendations

### Process Management

The tool can:
- Find Cursor installation paths across different platforms
- Launch Cursor with optimized command-line arguments
- Monitor process status and resource usage
- Handle graceful shutdown and cleanup

## Configuration Files

### Windows
- Config: `%APPDATA%\Cursor\argv.json`

### macOS
- Config: `~/Library/Application Support/Cursor/argv.json`

### Linux
- Config: `~/.config/Cursor/argv.json`

## Troubleshooting

### Common Issues

1. **Cursor not found**: Ensure Cursor is installed and accessible in PATH
2. **Permission denied**: Run with appropriate permissions for your platform
3. **Configuration not applied**: Restart Cursor after applying optimizations

### Memory Issues

If you're still experiencing memory problems:

1. **Disable AI extensions**: Use `--disable-extensions` flag
2. **Reduce memory limit**: Lower the `--max-memory` value
3. **Increase monitoring frequency**: Use shorter intervals with `--interval`
4. **Check system resources**: Ensure adequate RAM and swap space

### Platform-Specific Notes

#### Windows
- Uses `tasklist` for process monitoring
- CPU usage information may not be available
- Check Windows Defender exclusions if needed

#### macOS
- Uses `ps aux` for process monitoring
- May require accessibility permissions
- Check Gatekeeper settings if launching fails

#### Linux
- Uses `ps aux` for process monitoring
- May require additional permissions for process management
- Check SELinux/AppArmor if applicable

## Development

### Running

```bash
# Run the tool directly
npx nx optimize cursor-memory-optimizer

# Run with tsx directly
tsx libs/tools/cursor-memory-optimizer/src/index.ts optimize
```

### Testing

```bash
# Run tests
pnpm run test

# Run with verbose output
pnpm run test -- --verbose
```

### Linting

```bash
# Run linter
pnpm run lint
```

## Contributing

1. Follow the existing code structure and patterns
2. Add appropriate tests for new features
3. Update documentation for any changes
4. Ensure cross-platform compatibility

## License

MIT License - see LICENSE file for details.

## References

- [Cursor Forum Discussion](https://forum.cursor.com/t/i-asked-deep-search/55873)
- [Electron Memory Management](https://www.electronjs.org/docs/latest/tutorial/memory-management)
- [Node.js Memory Optimization](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes) 