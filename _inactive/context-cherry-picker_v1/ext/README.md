# F-UX: Context Cherry Picker

A standalone VS Code extension for advanced context selection and formatting, designed to streamline the process of gathering and organizing project context for AI interactions and documentation.

## Overview

Context Cherry Picker (CCP) is part of the Focused UX (F-UX) suite of extensions designed to enhance context management and AI interaction workflows. It provides sophisticated tools for selecting, organizing, and formatting project context with intelligent filtering and token management capabilities.

## Features

### 🎯 Advanced Context Selection
- **Tree-based Explorer**: Visual file and folder selection interface
- **Intelligent Filtering**: Smart filtering based on file types and patterns
- **Token Management**: Real-time token counting and estimation
- **Context Preservation**: Save and restore context selections

### 📊 Context Management
- **Saved States**: Save multiple context configurations
- **State Management**: Load, delete, and manage saved states
- **Context Export**: Copy formatted context to clipboard
- **Project-specific Contexts**: Organize contexts by project

### 🔍 Smart Filtering
- **Pattern-based Filtering**: Use glob patterns for file inclusion/exclusion
- **Always Show/Hide**: Configure files that should always be included or excluded
- **Conditional Filtering**: Show files only when specifically selected
- **Dynamic Updates**: Real-time filtering as you type

### 📈 Token Optimization
- **Token Counting**: Real-time token estimation using GPT tokenizer
- **Content Preview**: Preview file contents before inclusion
- **Size Management**: Monitor context size for AI model limits
- **Intelligent Truncation**: Smart content truncation when needed

## Commands

### Core Commands

| Command | Description | Icon | Category |
|---------|-------------|------|----------|
| `CCP: Save Checked State` | Save current selection as a named state | $(save) | Context Cherry Picker |
| `CCP: Refresh Explorer` | Refresh the context explorer view | $(refresh) | Context Cherry Picker |
| `CCP: Delete Saved State` | Remove a saved context state | $(trash) | Context Cherry Picker |
| `CCP: Load Saved State` | Load a previously saved context state | $(bookmark) | Context Cherry Picker |
| `CCP: Clear All Checked Items` | Clear all selected items in explorer | $(clear-all) | Context Cherry Picker |
| `CCP: Copy Context of Checked Items` | Copy formatted context to clipboard | $(clippy) | Context Cherry Picker |

## Views

### Activity Bar Views
- **Context Explorer**: Main interface for selecting files and folders
- **Quick Settings**: Configure filtering and display options
- **Saved States**: Manage saved context configurations

### Context Explorer Features
- **Tree View**: Hierarchical file and folder display
- **Checkbox Selection**: Multi-select files and folders
- **Token Counter**: Real-time token estimation
- **File Preview**: Preview file contents on hover
- **Filter Controls**: Quick filtering options

## Usage Examples

### Basic Context Selection
1. Open the Context Cherry Picker activity bar view
2. Navigate to the Context Explorer
3. Check/uncheck files and folders to include in context
4. Use the token counter to monitor context size

### Saving Context States
1. Select desired files and folders
2. Click "Save Checked State" in the explorer title bar
3. Enter a name for the state
4. The state is saved for future use

### Loading Saved States
1. Open the Saved States view
2. Click on a saved state to load it
3. The Context Explorer updates with the saved selection

### Copying Formatted Context
1. Select files and folders in the Context Explorer
2. Click "Copy Context of Checked Items" in the title bar
3. Formatted context is copied to clipboard
4. Paste into AI chat or documentation

### Configuring Filters
1. Open Quick Settings view
2. Configure "Always Show" patterns for important files
3. Set "Always Hide" patterns for excluded files
4. Define "Show If Selected" patterns for conditional files

## Configuration

### Quick Settings Options
- **Always Show Patterns**: Files that should always be included
- **Always Hide Patterns**: Files that should always be excluded
- **Show If Selected Patterns**: Files that appear only when selected
- **Token Limit**: Maximum tokens for context (default: 4000)
- **Include File Contents**: Whether to include file contents in context

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/context-cherry-picker-core`): Contains the business logic and services
- **Extension Package** (`fux-context-cherry-picker`): VS Code extension wrapper

### Core Services

- **CCP_ManagerService**: Main orchestration service
- **ContextDataCollectorService**: Collects and processes file data
- **ContextFormattingService**: Formats context for output
- **TokenizerService**: Handles token counting and estimation
- **FileExplorerService**: Manages the file explorer interface
- **CCP_StorageService**: Manages saved states and persistence

### External Dependencies
- **gpt-tokenizer**: Accurate token counting for GPT models
- **js-yaml**: YAML configuration parsing
- **micromatch**: Advanced glob pattern matching

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+

### Building
```bash
# Build the extension
nx build context-cherry-picker-ext

# Package the extension
nx package context-cherry-picker-ext
```

### Testing
```bash
# Run tests
nx test context-cherry-picker-core
```

## Dependencies

### Runtime Dependencies
- `@fux/context-cherry-picker-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces
- `awilix`: Dependency injection container
- `gpt-tokenizer`: Token counting for GPT models
- `js-yaml`: YAML configuration parsing
- `micromatch`: Advanced glob pattern matching

### Development Dependencies
- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code API type definitions
- `typescript`: TypeScript compiler

## Use Cases

### AI Development Assistant
- Select relevant code files for AI context
- Monitor token usage for model limits
- Save common context configurations
- Quickly switch between different project contexts

### Documentation Generation
- Gather project structure for documentation
- Include specific files in documentation context
- Format context for documentation tools
- Maintain consistent documentation contexts

### Code Review
- Select files for review context
- Include configuration and documentation files
- Save review contexts for different components
- Share context with team members

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
