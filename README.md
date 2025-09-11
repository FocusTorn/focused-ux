# FocusedUX Monorepo

A comprehensive monorepo for VSCode extensions and development tools, built with Nx and TypeScript.

## Package Classification

The FocusedUX monorepo follows a **standardized package classification system** that determines architectural patterns, build configurations, and testing strategies.

**📋 Reference**: See [Package Archetypes](./docs/Package-Archetypes.md) for the complete single source of truth on package classification, including detailed descriptions, examples, and implementation guidelines.

### **Quick Reference**

- **Direct TSX Executed** (`libs/tools/`) - Standalone utilities
- **Consumable Package: Shared Utility** (`libs/`) - Shared utilities
- **Consumable Package: Feature Utility** (`packages/{feature}/`) - Feature-specific utilities
- **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`) - Business logic
- **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`) - VSCode extensions
- **Nx Alignment Generators** (`plugins/`) - 🚧 In Development
- **Monolithic Orchestrator** - 📋 Planned

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Nx CLI

### Installation

```bash
pnpm install
```

### Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Generate test scaffold
nx g ./generators:test-scaffold

# Run coverage for shared library
pnpm dlx vitest run -c libs/shared/vitest.config.ts --coverage
```

## Documentation

- [Architecture](./docs/Architecture.md) - Project architecture and package patterns
- [Testing Strategy](./docs/FocusedUX-Testing-Strategy.md) - Comprehensive testing guidelines
- [Actions Log](./docs/Actions-Log.md) - Development history and decisions

## Package Structure

```
packages/
├── dynamicons/          # Icon management extension
│   ├── core/           # Core business logic
│   ├── ext/            # VSCode extension wrapper
│   └── assets/         # Asset processing utilities
├── ghost-writer/        # AI writing assistant
├── project-butler/      # Project management tools
└── note-hub/           # Note-taking extension

libs/
├── shared/             # Shared utilities
├── tools/              # Standalone tools
└── vscode-test-cli-config/ # Test configuration
```

## Contributing

Please refer to the [Architecture](./docs/Architecture.md) and [Testing Strategy](./docs/FocusedUX-Testing-Strategy.md) documents for development guidelines.
