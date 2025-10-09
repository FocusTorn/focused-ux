# FocusedUX Package Archetypes

## **REFERENCE FILES**

### **Documentation References**

- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **SOP_DOCS**: `docs/_SOP.md`
- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`

---

## Overview

This document serves as the **single source of truth** for package classification in the FocusedUX monorepo. All packages must be classified according to this system, which determines architectural patterns, build configurations, and development workflows.

**📋 Testing Reference**: See **TESTING_STRATEGY** for comprehensive testing strategies and patterns.

## Package Classification System

### **Build Configuration Architecture**

The FocusedUX monorepo uses **target inheritance** in `nx.json` to provide consistent build patterns:

#### **Global Build Targets**

- **`build:core`**: Core package pattern (ESM, unbundled, declarations)
- **`build:ext`**: Extension package pattern (CJS, bundled, VSCode-compatible)

#### **Package Configuration Pattern**

All packages use minimal `project.json` configurations that extend global targets:

```json
{
    "targets": {
        "build": {
            "extends": "build:core", // or "build:ext" for extensions
            "options": {
                "external": ["vscode", "package-specific-deps"]
            }
        }
    }
}
```

#### **Benefits**

- **Consistency**: All packages follow the same build patterns
- **Maintainability**: Changes to build logic happen in one place
- **Simplicity**: Package configs only specify what's different
- **Directory Independence**: Builds work from any directory

### **Current Implemented Package Types**

#### 1. **Core Package** (`packages/{feature}/core/`)

**Purpose**: Pure business logic, self-contained feature implementation
**Architecture**: Type imports only, no VSCode value imports, minimal external dependencies
**Build Configuration**: Extends `build:core` target with package-specific external dependencies
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

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
- Uses `.js` extensions in export statements for ESM compliance

**Directory Structure**:

```
packages/{feature-name}/core/
├── src/
│   ├── _interfaces/   # Service interfaces
│   ├── _config/       # Configuration constants
│   ├── services/      # Business logic services
│   └── index.ts       # Package exports
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 2. **Extension Package** (`packages/{feature}/ext/`)

**Purpose**: VSCode extension wrapper for core logic
**Architecture**: Local adapters, CommonJS bundle, VSCode integration
**Build Configuration**: Extends `build:ext` target with package-specific external dependencies
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

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
- Uses `.js` extensions in import statements

**Directory Structure**:

```
packages/{feature-name}/ext/
├── src/
│   ├── adapters/      # VSCode API adapters
│   ├── extension.ts   # Main extension entry point
│   └── index.ts       # Package exports
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── assets/            # Extension assets
├── .vscodeignore      # VSCode packaging configuration
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 3. **Accessory Packages** (`packages/{feature}/{accessory}/`)

**Purpose**: Specialized functionality supporting core/ext packages
**Architecture**: Feature-specific processing, specialized functionality
**Build Configuration**: Extends `build:core` target with package-specific external dependencies
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

**Examples**:

- `packages/dynamicons/assets` - Asset processing and generation utilities
- `packages/{feature}/themes` - Theme-specific resources
- `packages/{feature}/config` - Configuration management

**Characteristics**:

- Feature-specific functionality
- May have specialized dependencies (e.g., image processing, file manipulation)
- Self-contained within feature domain
- Used by core and extension packages of the same feature
- Must be externalized in extension builds

**Directory Structure**:

```
packages/{feature}/{accessory-name}/
├── src/
│   ├── processors/    # Processing logic
│   ├── orchestrators/ # Workflow orchestration
│   ├── utils/         # Utility functions
│   └── index.ts       # Main exports
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── assets/            # Asset files (if applicable)
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 4. **Shared Libraries** (`libs/`)

**Purpose**: Shared utilities across multiple packages
**Architecture**: Pure functions, clear exports, no side effects
**Build Configuration**: Extends `build:core` target with package-specific external dependencies
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

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
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── package.json       # Package configuration
└── project.json       # Nx configuration
```

---

#### 5. **Plugins** (`plugins/`)

**Purpose**: Nx plugins that extend workspace functionality with custom executors, generators, and utilities
**Architecture**: Nx integration, executor/generator focus, workspace tooling
**Build Configuration**: Extends `build:core` target with schema asset handling
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

**Examples**:

- `plugins/npack` - Nx packaging executor
- `plugins/vpack` - VSCode extension packaging executor
- `plugins/recommended` - Recommended generators and executors
- `plugins/ft-typescript` - TypeScript type checking executor
- `plugins/vscode-test-executor` - VSCode integration testing executor

**Characteristics**:

- Nx workspace integration and extension
- Custom executors and generators
- Schema files and configuration assets
- Workspace development tooling
- Uses `.js` extensions in export statements for ESM compliance
- Asset handling for schema files in build output

**Directory Structure**:

```
plugins/{plugin-name}/
├── src/
│   ├── executors/
│   │   └── executor-name/
│   │       ├── executor-name.ts
│   │       ├── schema.d.ts
│   │       └── schema.json
│   ├── generators/
│   │   └── generator-name/
│   │       ├── generator-name.ts
│   │       ├── schema.d.ts
│   │       └── schema.json
│   ├── services/
│   │   └── [service modules]
│   └── index.ts       # Main exports
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── executors.json     # Executor registry
├── generators.json    # Generator registry
├── package.json       # Plugin configuration
└── project.json       # Nx configuration
```

---

#### 6. **Utilities** (`utilities/`)

**Purpose**: Standalone utilities and tools
**Architecture**: Direct execution, minimal dependencies, CLI-focused
**Build Configuration**: Extends `build:core` target with package-specific external dependencies
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

**Examples**:

- `utilities/project-alias-expander` - PAE command expansion utility
- `utilities/structure-auditor` - Package structure validation tool

**Characteristics**:

- Executable via `npx tsx` or direct Node.js execution
- Minimal external dependencies
- Self-contained functionality
- Often used for development tooling and automation

**Directory Structure**:

```
utilities/{utility-name}/
├── src/
│   ├── cli/           # CLI entry points
│   ├── lib/           # Core functionality
│   └── index.ts       # Main exports
├── __tests__/         # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── package.json       # Tool configuration
└── project.json       # Nx configuration
```

---

### **Future/Planned Package Types**

#### 7. **Monolithic Orchestrator** - 📋 Planned

**Purpose**: Single orchestrator extension that manages multiple features
**Status**: Planned for future development
**Architecture**: TBD when implemented
**Testing Strategy**: See **TESTING_STRATEGY** for package-specific testing patterns

**Characteristics** (Planned):

- Single VSCode extension managing multiple features
- Centralized configuration and management
- Feature modules loaded dynamically
- Unified user experience across all features

---

## Package Selection Guidelines

### **When to Create Each Package Type**

1. **Consumable Package: Shared Utility** (`libs/`)
    - ✅ Utilities used by multiple features
    - ✅ Common abstractions and helpers
    - ✅ Testing utilities (see [Testing Strategy](../testing/_Testing-Strategy.md))
    - ❌ Don't use for feature-specific logic

2. **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`)
    - ✅ Business logic for VSCode extensions
    - ✅ Pure functionality without VSCode dependencies
    - ✅ Self-contained feature implementation
    - ❌ Don't use for VSCode-specific code

3. **Consumable Package: Feature Utility** (`packages/{feature-name}/{utility-name}`)
    - ✅ Feature-specific processing logic
    - ✅ Asset processing and generation
    - ✅ Feature-specific utilities
    - ❌ Don't use for shared utilities

4. **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`)
    - ✅ VSCode extension implementations
    - ✅ VSCode API integration
    - ✅ Extension-specific configuration
    - ❌ Don't use for business logic

5. **Nx Plugin: Workspace Extension** (`plugins/`)
    - ✅ Custom Nx executors and generators
    - ✅ Workspace development tooling
    - ✅ Build and deployment automation
    - ❌ Don't use for business logic or VSCode extensions

6. **Standalone Utility: Development Tool** (`utilities/`)
    - ✅ CLI tools and development utilities
    - ✅ Standalone executables
    - ✅ Development automation scripts
    - ❌ Don't use for shared libraries or business logic

## Naming Conventions

### **Package Names**

- **Core Packages**: `@fux/{feature-name}-core`
- **Extension Packages**: `@fux/{feature-name}-ext`
- **Accessory Packages**: `@fux/{feature-name}-{accessory}`
- **Shared Libraries**: `@fux/{utility-name}`
- **Utilities**: `@fux/{utility-name}`

### **Directory Names**

- **Features**: Use kebab-case (e.g., `ghost-writer`, `project-butler`)
- **Accessories**: Use kebab-case (e.g., `assets`, `themes`, `config`)
- **Utilities**: Use kebab-case (e.g., `vscode-test-cli-config`)
- **Libraries**: Use kebab-case (e.g., `shared`, `mockly`)

### **File Names**

- **TypeScript**: Use kebab-case (e.g., `asset-processor.ts`)
- **Test Files**: Use kebab-case with `.test.ts` suffix (see [Testing Strategy](../testing/_Testing-Strategy.md))
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
    - See [Testing Strategy](../testing/_Testing-Strategy.md) for migration testing patterns

5. **Update Build Configuration**
    - Configure Nx targets for both packages
    - Set up test configurations (see [Testing Strategy](../testing/_Testing-Strategy.md))
    - Update command aliases

## Quality Gates

### **Package Validation Checklist**

For each package type, ensure:

- [ ] **Correct Classification**: Package follows appropriate archetype (core/ext/accessory/libs/utilities)
- [ ] **Proper Dependencies**: Dependencies align with package purpose
- [ ] **Build Configuration**: Build settings match archetype requirements
- [ ] **Testing Strategy**: Tests follow patterns in [Testing Strategy](../testing/_Testing-Strategy.md)
- [ ] **Naming Conventions**: Names follow established conventions
- [ ] **Documentation**: Package purpose and usage is documented
- [ ] **File Extensions**: Uses `.js` extensions in exports/imports as required
- [ ] **Externalization**: Runtime dependencies properly externalized

### **Architecture Validation**

- [ ] **Separation of Concerns**: Business logic separated from VSCode integration
- [ ] **Dependency Direction**: Dependencies flow in correct direction
- [ ] **Interface Contracts**: Clear interfaces between packages
- [ ] **Testing Coverage**: Appropriate test coverage (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] **Build Success**: All packages build without errors
- [ ] **Integration**: Packages integrate correctly with each other

---

**This document is the single source of truth for package classification in the FocusedUX monorepo. All other documentation should reference this document for package archetype definitions and guidelines.**
