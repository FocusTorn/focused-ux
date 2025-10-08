# Project Alias Expander (PAE)

A powerful CLI tool for expanding project aliases and executing Nx commands with intelligent template expansion and shell-specific command generation.

## Overview

PAE (Project Alias Expander) transforms short aliases into full Nx project names and provides advanced command expansion capabilities including shell-specific templates, timeout controls, and intelligent flag processing.

## Features

- **🔤 Alias Expansion**: Convert short aliases (`pbc`) to full project names (`@fux/project-butler-core`)
- **🎯 Target Shortcuts**: Use shorthand targets (`b`, `t`, `l`) for common operations (`build`, `test`, `lint`)
- **🚩 Flag Expansion**: Expand short flags (`-f`, `-s`) to full flags (`--fix`, `--skip-nx-cache`)
- **📦 Expandable Templates**: Advanced template system with shell-specific commands and variable substitution
- **⏱️ Timeout Controls**: Built-in timeout functionality with customizable durations
- **🔍 Echo Mode**: Preview commands before execution with `->` prefix
- **🐛 Debug Mode**: Comprehensive debugging with `-d` or `--debug` flags
- **🎨 Cross-Platform**: Works on Windows (PowerShell), macOS, and Linux
- **📋 PowerShell Integration**: Automatic module generation and installation
- **⚡ Advanced Process Management**: ProcessPool with concurrency control, resource management, and automatic cleanup
- **📊 Process Metrics**: Built-in monitoring and metrics for process execution performance

## Installation

### Global Installation

```bash
# Install globally via npm
npm install -g @fux/project-alias-expander

# Or install from the local package
npm install -g ./libs/project-alias-expander
```

### Local Development

```bash
# Build the package
nx build @fux/project-alias-expander

# Install globally from the built package
npm install -g ./libs/project-alias-expander/dist
```

## PowerShell Module Setup

PAE automatically generates PowerShell modules for seamless integration:

### Install Aliases

```bash
# Generate and install PowerShell module
pae install-aliases

# Install with verbose output
pae install-aliases --verbose

# Install with auto-refresh
pae install-aliases --auto-refresh
```

### Refresh Aliases

```bash
# Refresh aliases in current session
pae refresh

# Refresh directly
pae refresh-direct
```

The PowerShell module will be installed to `C:\Users\{user}\Documents\WindowsPowerShell\Modules\PAE\PAE.psm1` and shows "Module loaded: PAE aliases" when imported.

## Usage

### Basic Syntax

```bash
pae <alias> <target> [flags]
```

### Execution Modes

1. **Pae-Prefixed Execution**: `pae pbc b` (works everywhere)
2. **Direct Execution**: `pbc b` (requires PowerShell module - see PowerShell Integration)

### Examples

```bash
# Build project-butler-core
pae pbc b

# Test with coverage
pae pbc tc

# Lint with fix
pae pbc l -f

# Build with timeout (10 seconds)
pae pbc b -sto

# Build with custom timeout (5 seconds)
pae pbc b -sto=5

# Preview command without execution
pae pbc b -echo

# Debug mode
pae pbc b -d
```

## Configuration

PAE uses `libs/project-alias-expander/config.json` for configuration. The file supports JavaScript-style comments and includes:

### Configuration Structure

```json
{
    "nxPackages": {
        "pbc": { "name": "project-butler", "suffix": "core" },
        "pbe": { "name": "project-butler", "suffix": "ext" },
        "pb": { "name": "project-butler", "full": true }
    },
    "nxTargets": {
        "b": "build",
        "t": "test",
        "l": "lint",
        "tc": "test --coverage"
    },
    "feature-nxTargets": {
        "b": { "run-from": "ext", "run-target": "build" }
    },
    "not-nxTargets": {
        "esv": "npx esbuild-visualizer --metadata"
    },
    "expandable-flags": {
        "f": "--fix",
        "s": "--skip-nx-cache",
        "v": "--verbose",
        "d": "--debug",
        "c": "--coverage",
        "echo": "--pae-echo"
    },
    "expandable-templates": {
        "sto": {
            "defaults": { "duration": 10 },
            "pwsh-template": [
                {
                    "position": "start",
                    "template": "$p = Start-Process -FilePath 'pwsh' -ArgumentList '-Command', '"
                },
                {
                    "position": "end",
                    "template": "' -NoNewWindow -PassThru; if (-not $p.WaitForExit({duration}000)) { Stop-Process -Id $p.Id -Force; Write-Warning 'Process timed out and was terminated.' }"
                }
            ],
            "linux-template": {
                "position": "start",
                "template": "timeout {duration}s"
            }
        }
    }
}
```

## Package Aliases

### Core Packages

| Alias  | Project                           | Description                      |
| ------ | --------------------------------- | -------------------------------- |
| `pbc`  | `@fux/project-butler-core`        | Project Butler core logic        |
| `gwc`  | `@fux/ghost-writer-core`          | Ghost Writer core logic          |
| `dcc`  | `@fux/dynamicons-core`            | Dynamicons core logic            |
| `ccpc` | `@fux/context-cherry-picker-core` | Context Cherry Picker core logic |
| `nhc`  | `@fux/note-hub-core`              | Note Hub core logic              |

### Extension Packages

| Alias  | Project                          | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| `pbe`  | `@fux/project-butler-ext`        | Project Butler VSCode extension        |
| `gwe`  | `@fux/ghost-writer-ext`          | Ghost Writer VSCode extension          |
| `dce`  | `@fux/dynamicons-ext`            | Dynamicons VSCode extension            |
| `ccpe` | `@fux/context-cherry-picker-ext` | Context Cherry Picker VSCode extension |
| `nhe`  | `@fux/note-hub-ext`              | Note Hub VSCode extension              |

### Full Packages

| Alias | Project                          | Description                        |
| ----- | -------------------------------- | ---------------------------------- |
| `pb`  | `@fux/project-butler-all`        | Project Butler (core + ext)        |
| `gw`  | `@fux/ghost-writer-all`          | Ghost Writer (core + ext)          |
| `dc`  | `@fux/dynamicons-all`            | Dynamicons (core + ext)            |
| `ccp` | `@fux/context-cherry-picker-all` | Context Cherry Picker (core + ext) |
| `nh`  | `@fux/note-hub-all`              | Note Hub (core + ext)              |

### Library Packages

| Alias | Project                       | Description                |
| ----- | ----------------------------- | -------------------------- |
| `ms`  | `@fux/mock-strategy`          | Mocking strategy utilities |
| `aka` | `@fux/project-alias-expander` | PAE itself                 |

### Tool Packages

| Alias   | Project                        | Description                |
| ------- | ------------------------------ | -------------------------- |
| `audit` | `@fux/structure-auditor`       | Structure auditing tool    |
| `cmo`   | `@fux/cursor-memory-optimizer` | Cursor memory optimization |
| `vp`    | `@fux/vsix-packager`           | VSIX packaging tool        |
| `vsct`  | `@fux/vscode-test-executor`    | VSCode test executor       |

## Target Shortcuts

| Shortcut | Full Target       | Description             |
| -------- | ----------------- | ----------------------- |
| `b`      | `build`           | Build the project       |
| `t`      | `test`            | Run tests               |
| `l`      | `lint`            | Lint the project        |
| `c`      | `clean`           | Clean the project       |
| `d`      | `dev`             | Development mode        |
| `s`      | `serve`           | Serve the project       |
| `e`      | `e2e`             | End-to-end tests        |
| `tc`     | `test --coverage` | Run tests with coverage |

## Flag Expansions

### Basic Flags

| Short Flag | Full Flag         | Description                       |
| ---------- | ----------------- | --------------------------------- |
| `-f`       | `--fix`           | Auto-fix linting issues           |
| `-s`       | `--skip-nx-cache` | Skip Nx cache                     |
| `-v`       | `--verbose`       | Verbose output                    |
| `-d`       | `--debug`         | Debug mode                        |
| `-c`       | `--coverage`      | Test coverage                     |
| `-echo`    | `--pae-echo`      | Preview command without execution |

### Combined Flags

You can combine multiple short flags:

```bash
# Equivalent to: --fix --skip-nx-cache
pae pbc l -fs

# Equivalent to: --skip-nx-cache --fix
pae pbc l -sf
```

## Expandable Templates

PAE supports advanced template expansion with shell-specific commands and variable substitution.

### Template Structure

Templates can be:

- **Strings**: Simple string templates
- **Objects**: Templates with position and defaults
- **Arrays**: Multiple templates for complex commands

### Template Positions

- `start`: Prepended to the command
- `prefix`: Added before the main command
- `pre-args`: Added before command arguments
- `suffix`: Added after the main command (default)
- `end`: Appended to the command

### Variable Substitution

Templates support variable substitution using `{variableName}` syntax:

```json
{
    "defaults": { "duration": 10 },
    "template": "timeout {duration}s"
}
```

### Shell-Specific Templates

Templates can be shell-specific:

```json
{
    "pwsh-template": [
        {
            "position": "start",
            "template": "$p = Start-Process -FilePath 'pwsh' -ArgumentList '-Command', '"
        },
        {
            "position": "end",
            "template": "' -NoNewWindow -PassThru; if (-not $p.WaitForExit({duration}000)) { Stop-Process -Id $p.Id -Force; Write-Warning 'Process timed out and was terminated.' }"
        }
    ],
    "linux-template": {
        "position": "start",
        "template": "timeout {duration}s"
    }
}
```

### Built-in Templates

#### Timeout Template (`sto`)

Adds timeout functionality to commands:

```bash
# 10 second timeout (default)
pae pbc b -sto

# Custom timeout (5 seconds)
pae pbc b -sto=5
```

**PowerShell**: Wraps command in `Start-Process` with timeout control
**Linux**: Uses `timeout` command

## Debug Mode

Enable comprehensive debugging with:

```bash
# Debug flag
pae pbc b -d

# Debug environment variable
PAE_DEBUG=1 pae pbc b

# Debug with echo
pae pbc b -d -echo
```

Debug mode shows:

- Argument parsing
- Configuration loading
- Template expansion
- Command construction
- Execution details

## Echo Mode

Preview commands before execution:

```bash
# Show command with -> prefix
pae pbc b -echo
# Output: -> nx run @fux/project-butler-core:build

# Echo with timeout
pae pbc b -sto=5 -echo
# Output: -> $p = Start-Process -FilePath 'pwsh' -ArgumentList '-Command', ' nx run @fux/project-butler-core:build ' -NoNewWindow -PassThru; if (-not $p.WaitForExit(5000)) { Stop-Process -Id $p.Id -Force; Write-Warning 'Process timed out and was terminated.' }
```

## Commands

### Special Commands

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `pae install-aliases` | Generate and install PowerShell module |
| `pae refresh`         | Refresh aliases in current session     |
| `pae refresh-direct`  | Refresh aliases directly               |
| `pae help`            | Show help information                  |

### Environment Variables

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `PAE_DEBUG=1` | Enable debug logging               |
| `PAE_ECHO=1`  | Echo commands instead of executing |

## Error Handling

PAE provides comprehensive error handling with informative messages:

### Common Errors

1. **Unknown Alias**: `Unknown alias: xyz`
2. **Config File Missing**: `Config file not found. Tried: [paths]`
3. **Template Conflicts**: `Variable conflict: 'duration' is defined in both top-level and template-level defaults`
4. **Multiple End Templates**: `Only one "end" position template is allowed per expandable`

### Debugging Tips

```bash
# Enable debug mode for troubleshooting
pae <command> -d

# Use echo mode to see generated commands
pae <command> -echo

# Check configuration loading
PAE_DEBUG=1 pae help
```

## Advanced Process Management

PAE includes a sophisticated ProcessPool system for optimal resource management and performance:

### ProcessPool Features

- **Concurrency Control**: Configurable limits on concurrent process execution (default: 5)
- **Resource Management**: Automatic cleanup and memory management
- **Process Metrics**: Real-time monitoring of execution statistics
- **Graceful Shutdown**: Proper cleanup on process termination
- **Timeout Handling**: Automatic process termination on timeout
- **Parallel Execution**: Efficient parallel processing for multiple commands
- **Process Leak Prevention**: Comprehensive tracking and cleanup

### Process Metrics

The ProcessPool provides detailed metrics for monitoring:

```typescript
interface ProcessMetrics {
    totalExecutions: number // Total commands executed
    activeProcesses: number // Currently running processes
    completedProcesses: number // Successfully completed processes
    failedProcesses: number // Failed processes
    averageExecutionTime: number // Average execution time in ms
    maxConcurrentReached: boolean // Whether concurrency limit was hit
}
```

### Parallel Execution

For operations involving multiple projects, PAE automatically uses parallel execution:

```bash
# This will run builds in parallel for all ext projects
pae ext b

# Sequential execution for multiple targets
pae ext b t  # Runs build then test sequentially
```

### Configuration

ProcessPool can be configured with custom settings:

```typescript
const pool = new ProcessPool({
    maxConcurrent: 10, // Maximum concurrent processes
    defaultTimeout: 300000, // Default timeout (5 minutes)
    killSignal: 'SIGTERM', // Signal for process termination
    enableMetrics: true, // Enable performance metrics
})
```

### Performance Benefits

The ProcessPool implementation provides significant performance improvements:

- **Parallel Processing**: Multiple projects can run simultaneously (up to concurrency limit)
- **Resource Efficiency**: Better memory management and automatic cleanup
- **Process Leak Prevention**: Comprehensive tracking prevents orphaned processes
- **Graceful Shutdown**: Proper cleanup on termination signals
- **Timeout Management**: Automatic process termination prevents hanging

### Usage Examples

```typescript
import { ProcessPool } from '@fux/project-alias-expander'

// Create a custom ProcessPool
const pool = new ProcessPool({
    maxConcurrent: 8,
    defaultTimeout: 600000, // 10 minutes
    enableMetrics: true,
})

// Execute a single command
const result = await pool.execute('nx', ['build', 'my-project'], {
    stdio: 'inherit',
    timeout: 300000,
})

// Execute multiple commands in parallel
const results = await pool.executeMany([
    { command: 'nx', args: ['build', 'project1'], options: { stdio: 'inherit' } },
    { command: 'nx', args: ['build', 'project2'], options: { stdio: 'inherit' } },
    { command: 'nx', args: ['build', 'project3'], options: { stdio: 'inherit' } },
])

// Get performance metrics
const metrics = pool.getMetrics()
console.log(`Total executions: ${metrics.totalExecutions}`)
console.log(`Average execution time: ${metrics.averageExecutionTime}ms`)

// Graceful shutdown
await pool.shutdown()
```

## Architecture

### File Structure

```
libs/project-alias-expander/
├── src/
│   ├── cli.ts                           # Main CLI entry point
│   ├── config.ts                        # Configuration loading
│   ├── shell.ts                         # Shell detection
│   ├── _types/                          # Type definitions
│   │   ├── config.types.ts
│   │   ├── expandable.types.ts
│   │   └── shell.types.ts
│   ├── _interfaces/                     # Interface definitions
│   │   ├── config.interfaces.ts
│   │   ├── expandable.interfaces.ts
│   │   ├── execution.interfaces.ts
│   │   ├── alias.interfaces.ts
│   │   ├── pae-manager.interfaces.ts
│   │   └── shell.interfaces.ts
│   └── services/                        # Service implementations
│       ├── PAEManager.service.ts        # Main orchestrator
│       ├── AliasManager.service.ts      # Alias management
│       ├── CommandExecution.service.ts  # Command execution
│       ├── ExpandableProcessor.service.ts # Template processing
│       ├── ProcessPool.service.ts       # Advanced process management
│       └── CommonUtils.service.ts       # Shared utilities
├── __tests__/                           # Test files
├── config.json                          # Configuration file
├── package.json                         # Package metadata
├── project.json                         # Nx project configuration
└── README.md                            # This file
```

### Key Components

1. **PAEManagerService**: Main orchestrator that coordinates all operations
2. **AliasManagerService**: Handles PowerShell module generation and installation
3. **CommandExecutionService**: Executes commands with proper shell handling and ProcessPool integration
4. **ExpandableProcessorService**: Processes templates and variable substitution
5. **ProcessPool**: Advanced process management with concurrency control and resource management
6. **Configuration System**: Loads and validates config.json with comment support

### Dependencies

- **strip-json-comments**: Parse JSON files with JavaScript-style comments
- **execa**: Process execution with better control and cross-platform support
- **Node.js built-ins**: fs, path, process, child_process

## Development

### Building

```bash
# Build the package
nx build @fux/project-alias-expander

# Build with watch mode
nx build @fux/project-alias-expander --watch
```

### Testing

```bash
# Run tests
nx test @fux/project-alias-expander

# Run tests with coverage
nx test @fux/project-alias-expander --coverage

# Run tests in watch mode
nx test @fux/project-alias-expander --watch
```

### Linting

```bash
# Lint the package
nx lint @fux/project-alias-expander

# Lint with auto-fix
nx lint @fux/project-alias-expander --fix
```

## Troubleshooting

### Common Issues

1. **Command Not Found**: Ensure PAE is installed globally
2. **Config File Errors**: Verify `config.json` exists and is valid JSON
3. **PowerShell Module Issues**: Run `pae install-aliases` to regenerate module
4. **Permission Errors**: Run with appropriate permissions for global installation
5. **Template Execution Errors**: Use debug mode (`-d`) to see detailed execution flow
6. **Process Pool Issues**: Check for process leaks or timeout issues with debug mode
7. **Concurrency Problems**: Adjust ProcessPool settings if experiencing resource constraints

### Getting Help

```bash
# Show help
pae help

# Debug mode
pae <command> -d

# Echo mode
pae <command> -echo

# Check configuration loading
PAE_DEBUG=1 pae help

# Monitor process pool metrics
PAE_DEBUG=1 pae <command> -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run tests and linting
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
