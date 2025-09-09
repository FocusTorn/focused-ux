# FocusedUX Package Archetypes

## Overview

This document serves as the **single source of truth** for package classification in the FocusedUX monorepo. All packages must be classified according to this system, which determines architectural patterns, build configurations, testing strategies, and development workflows.

## Package Classification System

### **Current Implemented Package Types**

#### 1. **Direct TSX Executed** (`libs/tools/`)

**Purpose**: Standalone utilities with direct execution capabilities
**Architecture**: Direct execution, minimal dependencies, CLI-focused
**Build Configuration**: `bundle: false, format: ['esm']`
**Testing Strategy**: Direct execution tests, CLI testing patterns

**Examples**:

- `libs/tools/structure-auditor` - Package structure validation tool
- `libs/tools/project-alias-expander` - PAE command expansion utility

**Characteristics**:

- Executable via `npx tsx` or direct Node.js execution
- Minimal external dependencies
- Self-contained functionality
- Often used for development tooling and automation

**Directory Structure**:

```
libs/tools/{tool-name}/
├── src/
│   ├── cli/           # CLI entry points
│   ├── lib/           # Core functionality
│   └── index.ts       # Main exports
├── __tests__/         # Test files
├── package.json       # Tool configuration
└── project.json       # Nx configuration
```

---

#### 2. **Consumable Package: Shared Utility** (`libs/`)

**Purpose**: Shared utilities across multiple packages
**Architecture**: Pure functions, clear exports, no side effects
**Build Configuration**: `bundle: false, format: ['esm']`
**Testing Strategy**: Standard library testing, unit tests

**Examples**:

- `libs/vscode-test-cli-config` - VS Code test configuration utilities
- `libs/shared` - Common utilities and abstractions
- `libs/mockly` - Testing utilities and mocks

**Characteristics**:

- Pure functions with clear interfaces
- No VSCode dependencies (unless specifically for VSCode utilities)
- Tree-shakeable exports
- Used by multiple other packages

**Directory Structure**:

```
libs/{utility-name}/
├── src/
│   ├── _interfaces/   # Type definitions
│   ├── _config/       # Configuration constants
│   ├── features/      # Feature-specific modules
│   └── index.ts       # Main exports
├── __tests__/         # Test files
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 3. **Consumable Package: Feature Utility** (`packages/{feature}/`)

**Purpose**: Feature-specific utilities and processing logic
**Architecture**: Feature-specific processing, specialized functionality
**Build Configuration**: `bundle: false, format: ['esm']`
**Testing Strategy**: Feature-specific utility testing, integration tests

**Examples**:

- `packages/dynamicons/assets` - Asset processing and generation utilities
- `packages/{feature}/libs` - Feature-specific shared utilities

**Characteristics**:

- Feature-specific functionality
- May have specialized dependencies (e.g., image processing, file manipulation)
- Self-contained within feature domain
- Used by core and extension packages of the same feature

**Directory Structure**:

```
packages/{feature}/{utility-name}/
├── src/
│   ├── processors/    # Processing logic
│   ├── orchestrators/ # Workflow orchestration
│   ├── utils/         # Utility functions
│   └── index.ts       # Main exports
├── __tests__/         # Test files
├── assets/            # Asset files (if applicable)
├── scripts/           # Processing scripts
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 4. **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`)

**Purpose**: Pure business logic, self-contained feature implementation
**Architecture**: Type imports only, no VSCode value imports, minimal external dependencies
**Build Configuration**: `bundle: false, format: ['esm']`
**Testing Strategy**: Core package testing pattern, business logic validation

**Examples**:

- `packages/dynamicons/core` - Icon management business logic
- `packages/ghost-writer/core` - AI writing assistant logic
- `packages/project-butler/core` - Project management logic

**Characteristics**:

- Pure business logic with no VSCode dependencies
- Self-contained "guinea pig" packages
- Direct service instantiation (no DI containers)
- Minimal external dependencies
- Type imports only for VSCode types

**Directory Structure**:

```
packages/{feature-name}/core/
├── src/
│   ├── _interfaces/   # Service interfaces
│   ├── _config/       # Configuration constants
│   ├── features/      # Feature-specific services
│   └── index.ts       # Package exports
├── __tests__/
│   ├── functional-tests/    # Main test directory
│   ├── isolated-tests/     # Specific isolated tests
│   ├── coverage-tests/     # Coverage reports
│   └── _reports/           # Test reports
├── vitest.config.ts        # Test config
├── vitest.coverage.config.ts # Coverage config
└── project.json            # Nx configuration
```

---

#### 5. **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`)

**Purpose**: VSCode extension wrapper for core logic
**Architecture**: Local adapters, CommonJS bundle, VSCode integration
**Build Configuration**: `bundle: true, format: ['cjs']`
**Testing Strategy**: Extension package testing pattern, dual testing strategy

**Examples**:

- `packages/dynamicons/ext` - Icon management VSCode extension
- `packages/ghost-writer/ext` - AI writing assistant VSCode extension
- `packages/project-butler/ext` - Project management VSCode extension

**Characteristics**:

- Lightweight VSCode wrapper for core logic
- Primary dependency on core package
- VSCode API adapters for abstraction
- Direct service instantiation (no DI containers)
- Dual testing strategy (standard + integration tests)

**Directory Structure**:

```
packages/{feature-name}/ext/
├── src/
│   ├── adapters/      # VSCode API adapters
│   ├── _interfaces/   # Extension interfaces
│   ├── _config/       # Extension configuration
│   ├── services/      # Extension-specific services
│   ├── extension.ts   # Main extension entry point
│   └── index.ts       # Package exports
├── __tests__/
│   ├── functional-tests/    # Standard Vitest tests
│   ├── integration-tests/   # VS Code integration tests
│   ├── isolated-tests/     # Specific isolated tests
│   ├── coverage-tests/     # Coverage reports
│   ├── _out-tsc/           # Compiled integration tests
│   └── _reports/            # Test reports
├── assets/            # Extension assets
├── vitest.config.ts   # Standard test config
├── vitest.coverage.config.ts # Coverage config
├── tsconfig.test.json # Integration test config
├── .vscode-test.mjs   # VS Code test config
└── project.json       # Nx configuration
```

---

### **Future/Planned Package Types**

#### 6. **Nx Alignment Generators** (`plugins/`) - 🚧 In Development

**Purpose**: Will replace current generator packages with Nx-aligned generators
**Status**: Currently in development
**Architecture**: TBD when implemented
**Testing Strategy**: TBD when implemented

**Planned Examples**:

- `plugins/recommended/` - Recommended extension generator
- Additional generators for different package types

---

#### 7. **Monolithic Orchestrator** - 📋 Planned

**Purpose**: Single orchestrator extension that manages multiple features
**Status**: Planned for future development
**Architecture**: TBD when implemented
**Testing Strategy**: TBD when implemented

**Characteristics** (Planned):

- Single VSCode extension managing multiple features
- Centralized configuration and management
- Feature modules loaded dynamically
- Unified user experience across all features

---

## Package Selection Guidelines

### **When to Create Each Package Type**

1. **Direct TSX Executed** (`libs/tools/`)
    - ✅ Standalone development tools
    - ✅ CLI utilities
    - ✅ Automation scripts
    - ❌ Don't use for shared business logic

2. **Consumable Package: Shared Utility** (`libs/`)
    - ✅ Utilities used by multiple features
    - ✅ Common abstractions and helpers
    - ✅ Testing utilities
    - ❌ Don't use for feature-specific logic

3. **Consumable Package: Feature Utility** (`packages/{feature}/`)
    - ✅ Feature-specific processing logic
    - ✅ Asset processing and generation
    - ✅ Feature-specific utilities
    - ❌ Don't use for shared utilities

4. **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`)
    - ✅ Business logic for VSCode extensions
    - ✅ Pure functionality without VSCode dependencies
    - ✅ Self-contained feature implementation
    - ❌ Don't use for VSCode-specific code

5. **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`)
    - ✅ VSCode extension implementations
    - ✅ VSCode API integration
    - ✅ Extension-specific configuration
    - ❌ Don't use for business logic

## Naming Conventions

### **Package Names**

- **Core Packages**: `@fux/{feature-name}-core`
- **Extension Packages**: `@fux/{feature-name}-ext`
- **Shared Utilities**: `@fux/{utility-name}`
- **Tools**: `@fux/{tool-name}`

### **Directory Names**

- **Features**: Use kebab-case (e.g., `ghost-writer`, `project-butler`)
- **Utilities**: Use kebab-case (e.g., `vscode-test-cli-config`)
- **Tools**: Use kebab-case (e.g., `structure-auditor`)

### **File Names**

- **TypeScript**: Use kebab-case (e.g., `asset-processor.ts`)
- **Test Files**: Use kebab-case with `.test.ts` suffix
- **Configuration**: Use kebab-case (e.g., `vitest.config.ts`)

## Migration Guidelines

### **From Monolithic to Core/Ext Architecture**

1. **Extract Business Logic**
    - Move business logic to core package
    - Create service interfaces
    - Remove VSCode dependencies from core

2. **Create VSCode Adapters**
    - Abstract VSCode API calls
    - Create adapter interfaces
    - Implement adapter classes

3. **Update Extension**
    - Import core services
    - Use adapters for VSCode operations
    - Register commands with core logic

4. **Update Tests**
    - Move service tests to core package
    - Create adapter tests in extension package
    - Update extension tests with new architecture

5. **Update Build Configuration**
    - Configure Nx targets for both packages
    - Set up Vitest configurations
    - Update command aliases

## Quality Gates

### **Package Validation Checklist**

For each package type, ensure:

- [ ] **Correct Classification**: Package follows appropriate archetype
- [ ] **Proper Dependencies**: Dependencies align with package purpose
- [ ] **Build Configuration**: Build settings match archetype requirements
- [ ] **Testing Strategy**: Tests follow archetype testing patterns
- [ ] **Naming Conventions**: Names follow established conventions
- [ ] **Documentation**: Package purpose and usage is documented

### **Architecture Validation**

- [ ] **Separation of Concerns**: Business logic separated from VSCode integration
- [ ] **Dependency Direction**: Dependencies flow in correct direction
- [ ] **Interface Contracts**: Clear interfaces between packages
- [ ] **Testing Coverage**: Appropriate test coverage for package type
- [ ] **Build Success**: All packages build without errors
- [ ] **Integration**: Packages integrate correctly with each other

---

**This document is the single source of truth for package classification in the FocusedUX monorepo. All other documentation should reference this document for package archetype definitions and guidelines.**
