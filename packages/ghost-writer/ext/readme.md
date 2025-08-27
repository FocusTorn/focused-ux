# F-UX: Ghost Writer

A VS Code extension that dynamically generates frequently used code snippets and provides intelligent code assistance features.

## Overview

Ghost Writer is part of the Focused UX (F-UX) suite of extensions designed to enhance developer productivity through intelligent code generation and automation. It provides tools for storing code fragments, generating import statements, and creating intelligent console logging statements.

## Features

### 🎯 Code Fragment Storage
- Store frequently used code snippets for quick access
- Organize code fragments by project or context
- Quick insertion of stored fragments into your code

### 📦 Import Statement Generator
- Automatically generate import statements based on selected code
- Smart detection of required imports
- Support for various module systems (ES6, CommonJS)

### 🐛 Intelligent Console Logging
- Generate contextual console.log statements with variable information
- Include class and function context in log messages
- Configurable logging format and detail level

## Commands

### Core Commands

| Command | Description | Context Menu |
|---------|-------------|--------------|
| `[F-UX] Ghost Writer: Store Code Fragment` | Store selected code as a reusable fragment | ✅ Available when text is selected |
| `[F-UX] Ghost Writer: Insert Import Statement` | Generate and insert import statements | ✅ Always available |
| `[F-UX] Ghost Writer: Log Selected Variable` | Create console.log for selected variable | ✅ Available when text is selected |

## Configuration

### Console Logger Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `fux-ghost-writer.consoleLogger.includeClassName` | boolean | `true` | Include the enclosing class name in log messages |
| `fux-ghost-writer.consoleLogger.includeFunctionName` | boolean | `true` | Include the enclosing function name in log messages |

## Usage Examples

### Storing Code Fragments
1. Select a code snippet in your editor
2. Right-click and choose "F-UX Ghost Writer: Store Code Fragment"
3. The fragment is stored for future use

### Generating Import Statements
1. Place your cursor where you want the import
2. Right-click and choose "F-UX Ghost Writer: Insert Import Statement"
3. The extension will analyze your code and suggest appropriate imports

### Creating Console Logs
1. Select a variable name
2. Right-click and choose "F-UX Ghost Writer: Log Selected Variable"
3. A contextual console.log statement is inserted

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/ghost-writer-core`): Contains the business logic and services
- **Extension Package** (`fux-ghost-writer`): VS Code extension wrapper

### Core Services

- **ClipboardService**: Manages code fragment storage and retrieval
- **ImportGeneratorService**: Analyzes code and generates import statements
- **ConsoleLoggerService**: Creates contextual logging statements

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+

### Building
```bash
# Build the extension
nx build ghost-writer-ext

# Package the extension
nx package ghost-writer-ext
```

### Testing
```bash
# Run tests
nx test ghost-writer-core
```

## Dependencies

### Runtime Dependencies
- `typescript`: TypeScript language support
- `awilix`: Dependency injection container
- `js-yaml`: YAML parsing for configuration

### Development Dependencies
- `@fux/ghost-writer-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE.txt](../../../LICENSE.txt) for details.

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the F-UX project guidelines

---

**Part of the Focused UX (F-UX) Extension Suite**
