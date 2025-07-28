# F-UX: AI Agent Interactor

A VS Code extension that automates the transfer of code from AI agents directly into VS Code files, streamlining the AI-assisted development workflow.

## Overview

AI Agent Interactor is part of the Focused UX (F-UX) suite of extensions designed to enhance AI-assisted development workflows. It provides seamless integration between AI agents and VS Code by automatically transferring generated code into the appropriate files, eliminating the need for manual copy-paste operations.

## Features

### 🤖 AI Agent Integration

- **Automatic Code Transfer**: Seamlessly transfer code from AI agents to VS Code
- **URI Handler**: Handle custom URI schemes for AI agent communication
- **File Path Resolution**: Automatically resolve relative file paths to absolute paths
- **Project Context Awareness**: Understand project structure and file locations

### 📁 File Management

- **Smart File Creation**: Automatically create files that don't exist
- **Path Resolution**: Convert relative paths to absolute project paths
- **File Overwrite Protection**: Safely handle existing files
- **Directory Creation**: Automatically create necessary directories

### ⚙️ Configuration

- **Project Base Path**: Configure the base path for relative file resolution
- **Flexible Path Handling**: Support for various path formats and structures
- **Environment Awareness**: Adapt to different project structures

## URI Handler

The extension registers a custom URI handler that AI agents can use to transfer code:

### URI Format

```
vscode://fux-ai-agent-interactor/transfer?file=path/to/file&content=encoded_content
```

### Parameters

- **file**: The target file path (relative or absolute)
- **content**: URL-encoded file content to be written

### Example Usage

```javascript
// AI Agent can generate a URI like this:
const uri = `vscode://fux-ai-agent-interactor/transfer?file=src/components/Button.tsx&content=${encodeURIComponent(codeContent)}`
```

## Configuration

### Project Base Path

Configure the base path for resolving relative file paths:

| Setting                               | Type   | Default | Description                                                                                     |
| ------------------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------- |
| `fux-ai-agent-interactor.projectBase` | string | `""`    | The absolute base path of the project to which relative file paths from the AI will be resolved |

### Configuration Example

```json
{
    "fux-ai-agent-interactor.projectBase": "/path/to/your/project"
}
```

## Usage Examples

### Basic Code Transfer

1. AI agent generates code and creates a transfer URI
2. The URI is opened (via browser, command line, or programmatically)
3. VS Code automatically opens and the file is created/updated
4. Code is immediately available for editing

### Relative Path Resolution

```
// AI agent sends: file=src/utils/helper.ts
// Extension resolves to: /project/base/path/src/utils/helper.ts
```

### File Creation

```
// If the file doesn't exist, it's automatically created
// If directories don't exist, they're created as needed
```

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/ai-agent-interactor-core`): Contains the business logic and services
- **Extension Package** (`fux-ai-agent-interactor`): VS Code extension wrapper

### Core Services

- **AiAgentInteractorService**: Main service for handling AI agent interactions
- **FileSystemService**: Manages file operations and path resolution
- **PathResolutionService**: Handles relative to absolute path conversion

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+

### Building

```bash
# Build the extension
nx build ai-agent-interactor-ext

# Package the extension
nx package ai-agent-interactor-ext
```

### Testing

```bash
# Run tests
nx test ai-agent-interactor-core
```

## Dependencies

### Runtime Dependencies

- `@fux/ai-agent-interactor-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces
- `awilix`: Dependency injection container

### Development Dependencies

- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code API type definitions
- `typescript`: TypeScript compiler

## Integration with AI Agents

### For AI Agent Developers

1. Generate the code content
2. Create a transfer URI with the target file path
3. Open the URI to trigger the transfer
4. The file is automatically created/updated in VS Code

### URI Generation Example

```javascript
function createTransferUri(filePath, content) {
    const encodedContent = encodeURIComponent(content)
    return `vscode://fux-ai-agent-interactor/transfer?file=${encodeURIComponent(filePath)}&content=${encodedContent}`
}

// Usage
const uri = createTransferUri('src/components/Button.tsx', buttonCode)
// Open the URI to transfer the code
```

## Use Cases

### AI-Assisted Development

- **Code Generation**: AI generates code and transfers it directly to files
- **Refactoring**: AI suggests changes and applies them automatically
- **Bug Fixes**: AI identifies and fixes issues in existing code
- **Feature Implementation**: AI implements new features based on requirements

### Automated Workflows

- **CI/CD Integration**: Automated code generation in build pipelines
- **Code Review**: AI-assisted code review with automatic fixes
- **Documentation**: AI-generated documentation with automatic file creation
- **Testing**: AI-generated test files with automatic placement

### Development Tools

- **Scaffolding**: AI-generated project scaffolding
- **Boilerplate**: AI-generated boilerplate code
- **Templates**: AI-generated code templates
- **Examples**: AI-generated example implementations

## Security Considerations

- **File Path Validation**: All file paths are validated before processing
- **Content Sanitization**: File content is properly encoded/decoded
- **Project Scope**: Operations are limited to the configured project base
- **Error Handling**: Robust error handling for invalid URIs or file operations

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
