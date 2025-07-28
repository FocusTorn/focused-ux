# F-UX: Project Butler (Decoupled)

A decoupled collection of project management utilities for VS Code that streamlines common development workflows.

## Overview

Project Butler is part of the Focused UX (F-UX) suite of extensions designed to enhance project management and development workflow automation. It provides essential utilities for terminal management, backup creation, package management, and VS Code extension development.

## Features

### 🖥️ Terminal Management
- **CD to Here**: Quickly change terminal directory to the current file's location
- **Poetry Shell**: Automatically open Poetry virtual environment shell
- Context-aware terminal operations

### 💾 Backup & File Management
- **Create Backup**: Generate timestamped backups of files and directories
- Smart backup naming and organization
- Exclude VSIX files from backup operations

### 📦 Package Management
- **Format package.json**: Automatically format and organize package.json files
- Consistent package.json structure across projects
- Integration with package managers

### 🔄 VS Code Extension Development
- **Hotswap VSIX**: Rapidly test VS Code extensions during development
- Streamlined extension packaging workflow
- Development-to-production pipeline optimization

## Commands

### Core Commands

| Command | Description | Context Menu | Trigger |
|---------|-------------|--------------|---------|
| `Project Butler (DC): CD to Here` | Change terminal to current file location | ✅ Explorer context | File/folder selection |
| `Project Butler (DC): Create Backup` | Create timestamped backup | ✅ Explorer context | File selection (excludes .vsix) |
| `Project Butler (DC): Open Poetry Shell` | Open Poetry virtual environment | ✅ Explorer context | Always available |
| `Project Butler (DC): Format package.json` | Format package.json file | ✅ Explorer context | package.json files only |
| `Project Butler (DC): Hotswap VSIX` | Rapid VSIX extension testing | ✅ Explorer context | .vsix files only |

## Usage Examples

### Terminal Management
1. Right-click on a file or folder in the explorer
2. Select "Project Butler (DC): CD to Here"
3. Terminal automatically navigates to the selected location

### Creating Backups
1. Right-click on a file in the explorer
2. Select "Project Butler (DC): Create Backup"
3. A timestamped backup is created in the same directory

### Poetry Integration
1. Right-click in the explorer
2. Select "Project Butler (DC): Open Poetry Shell"
3. A new terminal opens with Poetry virtual environment activated

### Package.json Formatting
1. Right-click on a package.json file
2. Select "Project Butler (DC): Format package.json"
3. The file is automatically formatted and organized

### Extension Development
1. Build your VS Code extension
2. Right-click on the generated .vsix file
3. Select "Project Butler (DC): Hotswap VSIX"
4. Extension is automatically installed for testing

## Context Menu Groups

The extension organizes commands into logical groups in the context menu:

- **fux-terminal**: Terminal-related operations
- **fux-file**: File management operations
- **fux-format**: Code formatting operations
- **fux-package**: Package and extension operations

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/project-butler-core`): Contains the business logic and services
- **Extension Package** (`fux-project-butler`): VS Code extension wrapper

### Core Services

- **FileSystemService**: Manages file operations and backups
- **ProcessService**: Handles terminal and process management
- **VSCodeTerminalService**: Manages VS Code terminal interactions

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+
- Poetry (for Poetry shell functionality)

### Building
```bash
# Build the extension
nx build project-butler-ext

# Package the extension
nx package project-butler-ext
```

### Testing
```bash
# Run tests
nx test project-butler-core
```

## Dependencies

### Runtime Dependencies
- `@fux/project-butler-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces
- `awilix`: Dependency injection container

### Development Dependencies
- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code API type definitions
- `typescript`: TypeScript compiler

## Configuration

Project Butler is designed to work out-of-the-box with sensible defaults. No additional configuration is required for basic functionality.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

SEE LICENSE IN [../../../LICENSE.txt](../../../LICENSE.txt)

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the F-UX project guidelines

---

**Part of the Focused UX (F-UX) Extension Suite**
