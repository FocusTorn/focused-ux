# Project Alias Expander (PAE)

A powerful, cross-platform CLI tool for expanding project aliases and running Nx commands with intelligent target resolution and flag expansion.

## Overview

PAE (Project Alias Expander) is a global CLI tool that provides seamless project management for Nx workspaces. It transforms short aliases into full Nx project names and expands target shortcuts, making project operations faster and more intuitive.

## Features

- **🔤 Alias Expansion**: Convert short aliases (`pbc`) to full project names (`@fux/project-butler-core`)
- **🎯 Target Shortcuts**: Use shorthand targets (`b`, `t`, `l`) for common operations (`build`, `test`, `lint`)
- **🚩 Flag Expansion**: Expand short flags (`-f`, `-s`) to full flags (`--fix`, `--skip-nx-cache`)
- **📦 Multi-Project Operations**: Run commands across all packages of a specific type (`ext`, `core`, `all`)
- **🔧 Not-Nx Targets**: Execute workspace-level commands with project context
- **⚡ Performance Monitoring**: Built-in performance tracking for test operations
- **🎨 Cross-Platform**: Works on Windows, macOS, and Linux
- **🔍 Echo Mode**: Preview commands before execution

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
nx build project-alias-expander

# Install globally from the built package
npm install -g ./libs/project-alias-expander/dist
```

## Setting Up Shorthand Execution

PAE supports two execution modes: direct shorthand execution (`pbc b`) and pae-prefixed execution (`pae pbc b`). To enable shorthand execution, you need to import the PowerShell module.

### PowerShell Module Approach

PAE now uses a **self-contained PowerShell module** approach that eliminates the need for manual script generation and installation.

#### Automatic Module Generation

The PowerShell module (`pae-functions.psm1`) is automatically generated during the build process:

1. **Build-time generation**: Module is created when you run `nx build project-alias-expander`
2. **Config-driven**: All aliases are automatically generated from `config.json`
3. **Self-contained**: Module is included in the package distribution
4. **Always up-to-date**: Module is regenerated whenever the build runs

#### Importing the Module

**Option 1: Import in current session**

```powershell
Import-Module .\libs\project-alias-expander\dist\pae-functions.psm1
```

**Option 2: Add to PowerShell profile (recommended)**
Add this line to your PowerShell profile (`$PROFILE`):

```powershell
Import-Module libs/project-alias-expander/dist/pae-functions.psm1
```

#### When the Module is Regenerated

The PowerShell module is automatically regenerated in these scenarios:

- **After building the package**: `nx build project-alias-expander` → Module regenerated
- **After alias configuration changes**: When you modify `config.json` and rebuild
- **After package updates**: When you update the PAE package

**You do NOT need to manually regenerate it:**

- The build process handles module generation automatically
- Functions are immediately available after import
- No manual script management required

## Usage

### Quick-start and pitfalls

- **List available aliases and targets**: `pae help`
- **Run with PAE**: `pae <alias> <target>` (e.g., `pae dce package:dev`)
- **Run without PAE**: `nx run <project>:<target>` (e.g., `nx run @fux/dynamicons-ext:package:dev`)
- **PowerShell note**: Don’t pipe PAE output to `cat`. Use `pae help` directly without `| cat`.
- **Missing alias**: If you see `Alias 'xyz' is not defined`, the alias doesn’t exist. Check the tables below or update `libs/project-alias-expander/config.json` to add it.

### Basic Syntax

```bash
pae <alias> <target> [flags]
```

### Execution Modes

PAE supports two execution modes:

1. **Direct Execution**: `pbc b` (requires PowerShell functions - see "Setting Up Shorthand Execution")
2. **Pae-Prefixed Execution**: `pae pbc b` (works everywhere)

### Examples

```bash
# Build project-butler-core
pae pbc b

# Test with coverage
pae pbc tc

# Lint with fix
pae pbc l -f

# Build all extension packages
pae ext b

# Test all packages
pae all t

# Preview command without execution
pae pbc b --pae-echo
```

## Configuration

PAE uses a JSON configuration file located at `libs/project-alias-expander/config.json`. This file defines:

- **Package Aliases**: Short names for projects
- **Target Shortcuts**: Abbreviated target names
- **Flag Expansions**: Short flag mappings
- **Not-Nx Targets**: Workspace-level commands

### Configuration Structure

```json
{
    "packages": {
        "pbc": { "name": "project-butler", "suffix": "core" },
        "pbe": { "name": "project-butler", "suffix": "ext" },
        "pb": { "name": "project-butler", "full": true },
        "shared": "shared",
        "mockly": "mockly"
    },
    "targets": {
        "b": "build",
        "t": "test",
        "l": "lint",
        "tc": "test --coverage"
    },
    "expandables": {
        "f": "fix",
        "s": "skip-nx-cache",
        "echo": "pae-echo"
    },
    "not-nx-targets": {
        "esv": "npx esbuild-visualizer --metadata"
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

### All Packages

| Alias | Project                          | Description                        |
| ----- | -------------------------------- | ---------------------------------- |
| `pb`  | `@fux/project-butler-all`        | Project Butler (core + ext)        |
| `gw`  | `@fux/ghost-writer-all`          | Ghost Writer (core + ext)          |
| `dc`  | `@fux/dynamicons-all`            | Dynamicons (core + ext)            |
| `ccp` | `@fux/context-cherry-picker-all` | Context Cherry Picker (core + ext) |
| `nh`  | `@fux/note-hub-all`              | Note Hub (core + ext)              |

### Library Packages

| Alias    | Project       | Description                   |
| -------- | ------------- | ----------------------------- |
| `shared` | `@fux/shared` | Shared utilities and adapters |
| `mockly` | `@fux/mockly` | Mocking utilities             |

### Tool Packages

| Alias   | Project                        | Description                |
| ------- | ------------------------------ | -------------------------- |
| `audit` | `@fux/structure-auditor`       | Structure auditing tool    |
| `cmo`   | `@fux/cursor-memory-optimizer` | Cursor memory optimization |

### Multi-Project Operations

| Alias  | Description            |
| ------ | ---------------------- |
| `ext`  | All extension packages |
| `core` | All core packages      |
| `all`  | All packages           |

## Target Shortcuts

### Basic Targets

| Shortcut | Full Target       | Description             |
| -------- | ----------------- | ----------------------- |
| `b`      | `build`           | Build the project       |
| `t`      | `test`            | Run tests               |
| `l`      | `lint`            | Lint the project        |
| `tc`     | `test --coverage` | Run tests with coverage |

### Full Targets

| Shortcut   | Full Target     | Description                                    |
| ---------- | --------------- | ---------------------------------------------- |
| `l`        | `lint:deps`     | Full linting (when used with full packages)    |
| `t`        | `test:full`     | Full testing (when used with full packages)    |
| `validate` | `validate:deps` | Full validation (when used with full packages) |

## Flag Expansions

### Common Flags

| Short Flag | Full Flag         | Description                       |
| ---------- | ----------------- | --------------------------------- |
| `-f`       | `--fix`           | Auto-fix linting issues           |
| `-s`       | `--skip-nx-cache` | Skip Nx cache                     |
| `-echo`    | `--pae-echo`      | Preview command without execution |

### Combined Flags

You can combine multiple short flags:

```bash
# Equivalent to: --fix --skip-nx-cache
pae pbc l -fs

# Equivalent to: --skip-nx-cache --fix
pae pbc l -sf
```

## Not-Nx Targets

These are workspace-level commands that operate on project metadata:

| Target | Command                             | Description                   |
| ------ | ----------------------------------- | ----------------------------- |
| `esv`  | `npx esbuild-visualizer --metadata` | Generate bundle visualization |

## PowerShell Integration

For seamless local development, PAE integrates with PowerShell profiles to provide direct alias execution.

### PowerShell Functions

The following functions are automatically created in your PowerShell profile:

```powershell
function pbc { [CmdletBinding()] param([Parameter(Position=0,ValueFromRemainingArguments=$true)][string[]]$Arguments) Invoke-PaeAlias -Alias 'pbc' -Args $Arguments }
function pbe { [CmdletBinding()] param([Parameter(Position=0,ValueFromRemainingArguments=$true)][string[]]$Arguments) Invoke-PaeAlias -Alias 'pbe' -Args $Arguments }
# ... and so on for all aliases
```

### Local Execution

With PowerShell integration, you can use aliases directly:

```bash
# These work in PowerShell with the profile loaded
pbc b
ext t
core l
```

## Advanced Features

### Performance Monitoring

PAE includes built-in performance monitoring for test operations:

```bash
# Create performance baseline
pae pbc t --performance-baseline

# Check performance against baseline
pae pbc t --performance-check

# Validate performance metrics
pae pbc t --performance-validate
```

### Echo Mode

Preview commands before execution:

```bash
# Show what command would be executed
pae pbc b --pae-echo
# Output: nx run build @fux/project-butler-core
```

### Integration Test Handling

PAE automatically targets extension packages for integration tests:

```bash
# Automatically targets @fux/project-butler-ext
pae pb test:integration
```

### Auto-Injection Features

PAE automatically injects helpful flags for certain operations:

- **Stream Output**: Auto-injects `--output-style=stream` for `test:full`, `validate:deps`, and `lint:deps`
- **Sequential Execution**: Auto-injects `--parallel=false` for `validate:deps`
- **Vitest Config**: Auto-injects coverage config for test commands with `--coverage`

## Error Handling

### Common Error Scenarios

1. **Invalid Alias**: `Alias 'invalid' is not defined.`
2. **Missing Target**: `Please provide a command for 'pbc'.`
3. **Config File Missing**: `Config file not found at: /path/to/config.json`

### Debugging

Use echo mode to debug command resolution:

```bash
pae pbc b --pae-echo
```

## Development

### Building

```bash
# Build the package
nx build project-alias-expander

# Build with watch mode
nx build project-alias-expander --watch
```

### Testing

```bash
# Run tests
nx test project-alias-expander

# Run tests with coverage
nx test project-alias-expander --coverage
```

### Linting

```bash
# Lint the package
nx lint project-alias-expander

# Lint with auto-fix
nx lint project-alias-expander --fix
```

## Architecture

### File Structure

```
libs/project-alias-expander/
├── src/
│   └── cli.ts              # Main CLI entry point
├── config.json             # Alias configuration
├── package.json            # Package metadata
├── project.json            # Nx project configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

### Key Components

1. **CLI Entry Point** (`cli.ts`): Main execution logic
2. **Configuration Loader**: Loads and parses `config.json`
3. **Alias Resolver**: Converts aliases to project names
4. **Target Expander**: Expands target shortcuts
5. **Flag Expander**: Expands flag shortcuts
6. **Command Executor**: Runs Nx commands

### Dependencies

- **strip-json-comments**: Parse JSON with comments
- **Node.js built-ins**: fs, path, process, child_process

## Troubleshooting

### Common Issues

1. **Command Not Found**: Ensure PAE is installed globally
2. **Config File Errors**: Verify `config.json` exists and is valid JSON
3. **Permission Errors**: Run with appropriate permissions for global installation

### Getting Help

```bash
# Show help
pae --help

# Show available aliases
pae help
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v0.1.0

- Initial release
- Basic alias expansion
- Target and flag shortcuts
- Multi-project operations
- PowerShell integration
- Performance monitoring
- Echo mode
