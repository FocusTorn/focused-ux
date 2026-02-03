# Devel-MCP

Universal Development Assistant - A Model Context Protocol (MCP) server for intelligent code analysis and generation across multiple programming languages.

## 🎯 Features

- **Multi-Language Support**: TypeScript, JavaScript, C#, AutoHotkey, C/C++
- **Project-Aware Analysis**: Understands project structure and conventions
- **Smart Code Generation**: Generates boilerplate following project standards
- **Universal MCP Integration**: Works with any MCP-compatible client

## 🚀 Quick Start

### Installation

```bash
# Build from source
git clone https://github.com/user/devel-mcp
cd devel-mcp
go build -o devel-mcp cmd/devel-mcp/main.go

# Install globally
go install github.com/user/devel-mcp/cmd/devel-mcp
```

### Usage

```bash
# Initialize project configuration
devel-mcp init --type typescript --interactive

# Analyze project
devel-mcp analyze --path ./my-project

# Generate code
devel-mcp generate function --name "ProcessData" --type typescript
```

## 📁 Project Structure

```
devel-mcp/
├── cmd/devel-mcp/          # Main executable
├── internal/               # Core server logic
├── pkg/                    # Public packages
├── plugins/                # Language-specific implementations
├── project-configs/        # Project configuration templates
└── docs/                   # Documentation
```

## 🔧 Configuration

Create a `.devel-mcp/config.yaml` file in your project root:

```yaml
project:
    name: 'My Project'
    type: 'typescript'
    version: '1.0.0'

guidelines:
    coding_style: 'camelCase'
    max_function_length: 50
    required_comments: true

preferences:
    test_framework: 'vitest'
    documentation_format: 'markdown'

non_negotiables:
    - 'All functions must have error handling'
    - 'No global variables except constants'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
