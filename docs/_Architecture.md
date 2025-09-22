# FocusedUX Architecture

## Package Classification

The FocusedUX monorepo follows a **standardized package classification system** that determines architectural patterns, build configurations, and testing strategies.

**📋 Reference**: See [Package Archetypes](./Package-Archetypes.md) for the complete single source of truth on package classification, including detailed architectural patterns, examples, and implementation guidelines.

### **Quick Reference**

- **Direct TSX Executed** (`libs/tools/`) - Standalone utilities
- **Consumable Package: Shared Utility** (`libs/`) - Shared utilities
- **Consumable Package: Feature Utility** (`packages/{feature}/`) - Feature-specific utilities
- **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`) - Business logic
- **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`) - VSCode extensions
- **Nx Alignment Generators** (`plugins/`) - 🚧 In Development
- **Monolithic Orchestrator** - 📋 Planned

## **Project Architecture**

### **File Organization**

- **Packages**: `packages/` directory (extensions, core packages)
- **Libraries**: `libs/` directory (shared, mockly, tools)
- **Documentation**: `docs/` directory (strategies, logs, SOPs)
- **Configuration**: Root-level configs (`.cursor/rules/`, `nx.json`, etc.)

### **Package Archetypes**

- **`shared` (Library)**: Located in `libs/shared/`, contains shared services and abstractions for runtime use by other packages
- **`core` (Library)**: Located in `packages/{feature}/core/`, contains feature's abstract business logic, built to be tree-shakeable
- **`ext` (Application)**: Located in `packages/{feature}/ext/`, contains VSCode extension implementation, depends on core package
- **`tool` (Utility)**: Located in `libs/tools/{tool-name}/`, contains standalone utilities that run directly with tsx (no build step)

### **Package Structure Decision Tree**

```
Is the package intended to be a VS Code extension?
├─ YES → Use core/ext pattern (packages/{feature}/core + packages/{feature}/ext)
│   ├─ core: Library with business logic, built with @nx/esbuild:esbuild (bundle: false)
│   └─ ext: Application bundle, built with @nx/esbuild:esbuild (bundle: true)
│
├─ NO → Is the package a shared library consumed by other packages?
│   ├─ YES → Use shared pattern (libs/shared)
│   │   └─ Built with @nx/esbuild:esbuild (bundle: false), generates declarations
│   │
│   └─ NO → Is the package a standalone tool/utility that runs directly?
│       ├─ YES → Use tool pattern (libs/tools/{tool-name})
│       │   ├─ Runs directly with tsx (no build step)
│       │   ├─ Uses nx:run-commands executor for execution
│       │   ├─ No declaration generation (composite: false, declaration: false)
│       │   ├─ Dependencies in devDependencies (not dependencies)
│       │   └─ **Guinea Pig Package**: Self-contained without shared dependencies, uses direct instantiation
│       │
│       └─ NO → Reconsider package purpose or consult team
```

## **VSCode Import Patterns**

### **Core Packages**

- **Pattern**: Use type imports only
- **Implementation**: `import type { Uri } from 'vscode'`
- **Rationale**: Core packages remain pure business logic without VSCode dependencies
- **Testing**: See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns
- **Local Interface Pattern**: Define local interfaces (e.g., `IUri`, `IUriFactory`) to replace VSCode value usage

**Important Distinction**:

- ✅ **Type imports are fine**: `import type { Uri } from 'vscode'` - These don't violate decoupling
- ❌ **Value imports are forbidden**: `import { Uri } from 'vscode'` - These violate decoupling
- ❌ **Direct API calls are forbidden**: `Uri.file(path)` - These violate decoupling

### **Extension Packages**

- **Pattern**: Create local adapters with VSCode value imports
- **Implementation**:

    ```typescript
    // src/adapters/Window.adapter.ts
    import * as vscode from 'vscode'

    export interface IWindowAdapter {
        showInformationMessage: (message: string) => Promise<void>
    }

    export class WindowAdapter implements IWindowAdapter {
        async showInformationMessage(message: string): Promise<void> {
            await vscode.window.showInformationMessage(message)
        }
    }
    ```

- **Rationale**: Extension packages handle VSCode integration through local adapters
- **Testing**: See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns

### **No Shared Package Usage**

- **Rule**: Each package is completely self-contained
- **Rationale**: Enables independent validation (see [Testing Strategy](../testing/_Testing-Strategy.md))
- **Implementation**: No dependencies on `@fux/shared` or other shared packages

## **Build System Architecture**

### **Universal Build Executor Rule**

**CRITICAL**: ALL packages MUST use `@nx/esbuild:esbuild` as the build executor, regardless of package type or bundling needs.

**Rationale**:

- **Performance**: ESBuild is significantly faster than Vite, Rollup, or Webpack for TypeScript compilation
- **Consistency**: Single build system across all packages for maintainability
- **Nx Integration**: Superior caching and incremental build support
- **TypeScript Support**: Native TypeScript compilation without bundling when `bundle: false`

### **ESBuild TypeScript Configuration Consistency Rule**

**CRITICAL**: ESBuild and TypeScript configurations MUST use consistent path resolution strategies to prevent intermittent build failures.

**Configuration Requirements**:

- **Path Consistency**: Either use all absolute paths or all relative paths consistently
- **Explicit File Specification**: For single-file projects, prefer `"files": ["src/main.ts"]` over `"include": ["src/**/*"]`
- **Deterministic Behavior**: Configuration must work regardless of working directory or execution context

**Anti-Pattern Prevention**:

- **Mixed Path Resolution**: Never mix absolute ESBuild paths with relative TypeScript paths
- **Glob Pattern Dependency**: Avoid relying solely on glob patterns for single-file projects
- **Working Directory Dependencies**: Ensure builds work from any directory

**Example Configuration**:

```json
// tsconfig.json - Explicit file specification for single-file projects
{
    "files": ["src/cli.ts"],
    "include": ["src/**/*"] // Keep for IDE support
}
```

### **Core Package Build Configuration**

- **Executor**: `@nx/esbuild:esbuild` (MANDATORY)
- **Bundle**: `false` (library mode)
- **Format**: `["esm"]` (ES modules)
- **Declaration**: `true` with `declarationMap: true`
- **External Dependencies**: All runtime dependencies must be externalized
- **TypeScript Config**: Uses `tsconfig.lib.json` for build, `tsconfig.json` for IDE support

### **Package-Specific Exceptions**

While the architecture follows consistent patterns, some packages have legitimate exceptions based on their specific functionality:

#### **Runtime Dependencies**

- **Ghost Writer Core**: Uses TypeScript as a runtime dependency for AST parsing and code generation
    - **Rationale**: ConsoleLoggerService requires TypeScript's compiler API for parsing and analyzing code structure
    - **Implementation**: `import * as ts from 'typescript'` in ConsoleLogger.service.ts
    - **Externalization**: TypeScript is externalized in build configuration
    - **Pattern**: This is the only package requiring TypeScript at runtime

#### **Package Structure Variations**

- **Flat Structure (Preferred)**: Project Butler Core uses a flat structure with all interfaces in `_interfaces/` and services in `services/`
- **Feature-Based Structure**: Some packages may use feature-based organization, but flat structure is preferred for simplicity

### **Extension Package Build Configuration**

- **Executor**: `@nx/esbuild:esbuild` (MANDATORY)
- **Bundle**: `true` (application mode)
- **Format**: `["cjs"]` (CommonJS for VSCode)
- **External Dependencies**: `vscode` and core package dependencies
- **TypeScript Config**: Single `tsconfig.json` with cross-project references

### **Tool Package Build Configuration**

- **Executor**: `@nx/esbuild:esbuild` (MANDATORY)
- **Bundle**: `false` (utility mode)
- **Format**: `["esm"]` (ES modules)
- **Declaration**: `false` (no declarations needed for utilities)
- **External Dependencies**: All runtime dependencies must be externalized
- **TypeScript Config**: Uses `tsconfig.json` for compilation

## **Critical Architectural Rules**

### **Adapter Architecture**

- **Rule**:
    - **Core packages**: Define interfaces only, no adapters
    - **Extension packages**: Create local adapters in `src/adapters/` that implement core interfaces
    - **No shared package usage**: Each package is self-contained
- **Rationale**:
    - Core packages remain pure business logic without VSCode dependencies
    - Extension packages handle VSCode integration through local adapters
    - Self-contained packages enable comprehensive testing and independent validation
- **Implementation**:
    - Core packages: Define interfaces in `src/_interfaces/`
    - Extension packages: Create adapters in `src/adapters/` with VSCode value imports
    - No dependencies on `@fux/shared` or other shared packages

### **VSCode Value Import Restrictions**

- **Rule**:
    - **Core packages**: NO VSCode value imports allowed, use `import type { Api } from 'vscode'` only
    - **Extension packages**: Create local adapters with VSCode value imports, no shared package usage
- **Rationale**:
    - Core packages maintain decoupling from VSCode API for comprehensive testing
    - Extension packages handle VSCode integration through local adapters
    - Self-contained packages enable independent testing and validation
- **Implementation**:
    - Core packages: `import type { Uri } from 'vscode'`
    - Extension packages: Create adapters in `src/adapters/` with VSCode value imports
    - No dependencies on `@fux/shared` or other shared packages

### **Dependency Management**

- **Rule**: Build-only dependencies must be in `devDependencies`
- **Rationale**: Prevents extraneous dependencies in production packages, reduces VSIX package size
- **Implementation**: Runtime dependencies in `dependencies`, build/development dependencies in `devDependencies`

### **Externalization Strategy**

- **Rule**: All third-party dependencies must be properly externalized
- **Rationale**: Ensures clean dependency management, prevents bundling issues
- **Implementation**: List all runtime dependencies in `external` array in build configuration

### **Node.js Module Import Restrictions**

- **Rule**: NO direct Node.js module imports in extension code
- **Rationale**: VSCode extensions should not include Node.js built-in modules as dependencies
- **Implementation**: Use VSCode's built-in file system API through workspace adapters

### **Shared Path Alias Resolution**

- **Rule**: TypeScript path alias for `@fux/shared` must point to package root (`libs/shared`), not `libs/shared/src`
- **Rationale**: Ensures consumers use referenced project's declaration output instead of inlining sources
- **Implementation**: Set path mapping to package root in consumer `tsconfig.lib.json`

### **Core Package = Complete Business Logic Architecture**

- **Rule**: Core packages must contain **complete business logic** for their feature, including any asset generation or processing that is part of the feature's functionality
- **Rationale**:
    - Core packages must be **self-sufficient** and **orchestrator-ready**
    - When the orchestrator extension is implemented, it will consume core packages directly
    - Business logic should not be split between core and extension packages
- **Implementation**:
    - Include all feature functionality in core package (business logic, asset generation, data processing)
    - Core package should be **consumable by any consumer** (extension, orchestrator, or other tools)
    - Use direct service instantiation, not DI containers; mock all external dependencies in tests
- **Local Interface Pattern**: Core packages define their own interfaces (e.g., `IUri`, `IUriFactory`) to replace VSCode value usage
- **Reasonable Dependencies**: Services should have reasonable dependencies based on functionality, not excessive dependencies (9+)

### **Extension Package = VSCode Adapter Architecture**

- **Rule**: Extension packages are **pure VSCode adapters** that wrap core package functionality for VSCode consumption
- **Rationale**:
    - Extension packages should **NOT duplicate or replace** core business logic
    - Extension packages provide **VSCode-specific integration** through local adapters
    - This enables **orchestrator extension** to consume core packages directly without VSCode dependencies
- **Implementation**:
    - Extension packages depend on core packages and provide VSCode adapters
    - Extension packages handle VSCode-specific concerns (activation, commands, UI integration)
    - Extension packages may copy or reference core-generated assets for VSCode packaging
    - **NO business logic duplication** - all business logic remains in core packages

### **Guinea Pig Package Architecture**

- **Rule**: Core packages must be self-contained without shared dependencies
- **Rationale**: Enables independent testing and validation of core logic
- **Implementation**: Use direct service instantiation, not DI containers; mock all external dependencies in tests
- **Local Interface Pattern**: Core packages define their own interfaces (e.g., `IUri`, `IUriFactory`) to replace VSCode value usage
- **Reasonable Dependencies**: Services should have reasonable dependencies based on functionality, not excessive dependencies (9+)

### **VSCode Extension Configuration Preservation**

- **Rule**: ALWAYS preserve all VSCode extension configuration when refactoring extension packages
- **Rationale**: VSCode extension functionality depends on `contributes`, `activationEvents`, `engines`, and other metadata
- **Implementation**: Only remove business logic dependencies, never remove VSCode-specific configuration sections
- **CRITICAL**: This is non-negotiable - removing VSCode configuration breaks extension functionality

### **TypeScript Project References**

- **Rule**: Core packages must use proper project references with unique output directories
- **Rationale**: Prevents build info conflicts and enables proper incremental builds
- **Implementation**:
    - `tsconfig.json`: `./out-tsc/tsconfig.tsbuildinfo`
    - `tsconfig.lib.json`: `./out-tsc/lib/tsconfig.lib.tsbuildinfo`

### **Testing Architecture**

- **Authority**: See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns, configurations, and strategies
- **Core Packages**: Business logic testing patterns
- **Extension Packages**: VSCode integration testing patterns
- **Configuration**: Test executor and target configurations
- **Integration Testing**: VS Code extension testing requirements

### **Package.json Configuration**

#### **Core Package Package.json**

- **Type**: `"module"` (ES modules)
- **Main/Module**: Point to built output
- **Types**: Point to declaration files
- **Exports**: Proper module resolution
- **Dependencies**: Only runtime dependencies
- **DevDependencies**: Build and development tools

#### **Extension Package Package.json**

- **Type**: No `"type"` field (CommonJS)
- **Main**: Point to bundled output
- **Dependencies**: Core package and minimal runtime dependencies
- **DevDependencies**: Build tools and types
- **VSCode Configuration**: Complete extension manifest

## **Project.json Configuration Patterns**

### **Core Package Project.json**

```json
{
    "name": "@fux/{feature}-core",
    "projectType": "library",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "packages/{feature}/core/src/index.ts",
                "outputPath": "packages/{feature}/core/dist",
                "tsConfig": "packages/{feature}/core/tsconfig.lib.json",
                "format": ["esm"],
                "bundle": false,
                "external": ["vscode", "dependency1", "dependency2"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"]
        }
    },
    "tags": ["core"]
}
```

### **Extension Package Project.json**

```json
{
    "name": "@fux/{feature}-ext",
    "projectType": "application",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/{feature}/ext/src/extension.ts"],
                "outputPath": "packages/{feature}/ext/dist",
                "format": ["cjs"],
                "bundle": true,
                "external": ["vscode"],
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/{feature}/ext/assets/",
                        "output": "./assets/"
                    }
                ]
            }
        },
        "package": {
            "executor": "@fux/vpack:pack",
            "dependsOn": ["build", "@fux/vsix-packager:build"],
            "options": {
                "targetPath": "{projectRoot}"
            }
        },
        "package:dev": {
            "executor": "@fux/vpack:pack",
            "dependsOn": ["build", "@fux/vsix-packager:build"],
            "options": {
                "targetPath": "{projectRoot}",
                "dev": true
            }
        }
    },
    "tags": ["ext"]
}
```

## **VPack Executor Documentation**

### **VPack Packaging System**

The FocusedUX monorepo uses the **VPack executor** (`@fux/vpack:pack`) for VSCode extension packaging, replacing the traditional `vsce` command with a more integrated approach.

#### **VPack Executor Configuration**

```json
{
    "package": {
        "executor": "@fux/vpack:pack",
        "dependsOn": ["build", "@fux/vsix-packager:build"],
        "options": {
            "targetPath": "{projectRoot}"
        }
    },
    "package:dev": {
        "executor": "@fux/vpack:pack",
        "dependsOn": ["build", "@fux/vsix-packager:build"],
        "options": {
            "targetPath": "{projectRoot}",
            "dev": true
        }
    }
}
```

#### **VPack Features**

- **Integrated Build Pipeline**: Automatically handles build dependencies and VSIX packaging
- **Development Mode**: `dev: true` option for development packaging with enhanced debugging
- **Dependency Management**: Integrates with `@fux/vsix-packager` for consistent packaging
- **Project Root Targeting**: Uses `{projectRoot}` placeholder for flexible path resolution

#### **VPack vs Traditional Packaging**

| Aspect            | VPack                    | Traditional vsce             |
| ----------------- | ------------------------ | ---------------------------- |
| **Integration**   | Nx-native executor       | External command             |
| **Dependencies**  | Automatic build chain    | Manual dependency management |
| **Configuration** | project.json integration | Separate vsce configuration  |
| **Development**   | Built-in dev mode        | Manual dev flags             |

## **Runtime Dependency Patterns for Extensions**

### **Extension Dependency Classification**

Extensions require careful dependency management to balance functionality with bundle size and runtime performance.

#### **Dependencies vs DevDependencies**

```json
{
    "dependencies": {
        "@fux/{feature}-core": "workspace:*", // ✅ Core business logic
        "js-yaml": "^4.1.0", // ✅ Runtime YAML parsing
        "@types/js-yaml": "^4.0.9" // ✅ Type definitions for runtime deps
    },
    "devDependencies": {
        "@types/vscode": "^1.99.3", // ✅ Build-time VSCode types
        "typescript": "^5.9.2", // ✅ Build-time TypeScript
        "vitest": "^3.2.4" // ✅ Testing framework (see [Testing Strategy](../testing/_Testing-Strategy.md))
    }
}
```

#### **Runtime Dependency Decision Matrix**

| Package Type          | Dependencies           | DevDependencies   | Rationale                                   |
| --------------------- | ---------------------- | ----------------- | ------------------------------------------- |
| **Core Package**      | ✅ Runtime deps only   | ✅ Build tools    | Core consumed at runtime, deps externalized |
| **Extension Package** | ✅ Core + runtime deps | ✅ Build tools    | Extension uses at runtime                   |
| **External Runtime**  | ✅ If imported in code | ❌ Never          | Extension uses at runtime                   |
| **Build Tools**       | ❌ Never               | ✅ Always         | Only needed during build                    |
| **Type Definitions**  | ✅ For runtime deps    | ✅ For build deps | Types for runtime deps go in dependencies   |

#### **External Runtime Dependencies Pattern**

When extensions need external packages at runtime:

```typescript
// packages/{feature}/ext/src/adapters/Yaml.adapter.ts
import { load as loadYaml } from 'js-yaml' // Runtime import
```

```json
// packages/{feature}/ext/package.json
{
    "dependencies": {
        "js-yaml": "^4.1.0" // Runtime dependency
    }
}
```

```json
// packages/{feature}/ext/project.json
{
    "external": ["js-yaml"] // Don't bundle, expect at runtime
}
```

#### **Common Runtime Dependencies**

- **YAML Processing**: `js-yaml` (Project Butler pattern)
- **File System**: `fs-extra` (if VSCode APIs insufficient)
- **HTTP Requests**: `axios` or `node-fetch` (for external APIs)
- **Data Validation**: `zod` or `joi` (for configuration validation)
- **Date Handling**: `date-fns` or `moment` (for complex date operations)

#### **Dependency Externalization Strategy**

```json
{
    "external": [
        "vscode", // ✅ Always externalize VSCode
        "js-yaml", // ✅ External runtime dependencies
        "fs-extra", // ✅ If used at runtime
        "axios" // ✅ If used at runtime
    ]
}
```

**Rationale**: Externalization keeps extension bundles small while ensuring runtime dependencies are available in the VSCode environment.

### **Runtime Dependency Externalization Pattern**

ALL packages (core, extension, shared) must follow this pattern to ensure proper externalization throughout the build chain:

#### **Universal Dependency Pattern**

**Core Package Example:**

```json
{
    "dependencies": {
        "gpt-tokenizer": "^3.0.1", // ✅ Runtime dependency - externalized
        "micromatch": "^4.0.8", // ✅ Runtime dependency - externalized
        "js-yaml": "^4.1.0" // ✅ Runtime dependency - externalized
    },
    "devDependencies": {
        "@types/js-yaml": "^4.0.9", // ✅ Type definitions for runtime deps
        "@types/micromatch": "^4.0.9", // ✅ Type definitions for runtime deps
        "@types/node": "^24.5.2", // ✅ Build-time types
        "typescript": "^5.9.2", // ✅ Build-time TypeScript
        "vitest": "^3.2.4" // ✅ Testing framework (see [Testing Strategy](../testing/_Testing-Strategy.md))
    }
}
```

**Extension Package Example:**

```json
{
    "dependencies": {
        "@fux/context-cherry-picker-core": "workspace:*", // ✅ Core package
        "gpt-tokenizer": "^3.0.1", // ✅ Runtime dependency - externalized
        "js-yaml": "^4.1.0", // ✅ Runtime dependency - externalized
        "micromatch": "^4.0.8" // ✅ Runtime dependency - externalized
    },
    "devDependencies": {
        "@types/js-yaml": "^4.0.9", // ✅ Type definitions for runtime deps
        "@types/micromatch": "^4.0.9", // ✅ Type definitions for runtime deps
        "@types/node": "^24.5.2", // ✅ Build-time types
        "@types/vscode": "^1.104.0", // ✅ Build-time VSCode types
        "typescript": "^5.9.2", // ✅ Build-time TypeScript
        "vitest": "^3.2.4" // ✅ Testing framework (see [Testing Strategy](../testing/_Testing-Strategy.md))
    }
}
```

#### **Universal Externalization Pattern**

```json
{
    "external": [
        "vscode", // ✅ Always externalize VSCode
        "gpt-tokenizer", // ✅ Runtime dependency
        "micromatch", // ✅ Runtime dependency
        "js-yaml" // ✅ Runtime dependency
    ]
}
```

**Critical Principles**:

- **Runtime dependencies** MUST go in `dependencies` for proper externalization
- **Type definitions** for runtime deps go in `dependencies`
- **Build tools** go in `devDependencies`
- **Extension packages** must include ALL runtime deps from core packages
- **Build chain externalization** requires runtime deps in `dependencies` at every level

## **Package Structure**

### **Core Package Structure**

**Preferred Flat Structure (Project Butler Core Pattern):**

```
packages/{feature}/core/
├── src/
│   ├── _interfaces/          # All interfaces centralized
│   ├── services/             # All services in flat structure
│   ├── _config/              # Constants and configuration
│   └── index.ts              # Comprehensive categorized exports
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
└── package.json              # Minimal dependencies
```

**Alternative Feature-Based Structure:**

```
packages/{feature}/core/
├── src/
│   ├── _interfaces/          # Global interfaces
│   ├── _config/              # Configuration constants
│   ├── features/             # Feature-based organization
│   │   └── feature-name/
│   │       ├── _interfaces/  # Feature interfaces
│   │       └── services/     # Feature services
│   └── index.ts              # Individual exports for tree-shaking
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
└── package.json              # No shared dependencies
```

### **Extension Package Structure**

**Preferred Flat Structure:**

```
packages/{feature}/ext/
├── src/
│   ├── adapters/             # All VSCode adapters in flat structure
│   ├── _config/              # Constants and configuration (if needed)
│   └── extension.ts          # Main extension logic (direct entry point)
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
└── package.json              # VSCode extension manifest
```

**Key Architectural Principles:**

- **Direct entry point** - No index.ts wrapper, use extension.ts directly
- **Flat adapter structure** - All adapters in single directory
- **Test structure** - See [Testing Strategy](../testing/_Testing-Strategy.md)
- **Modern packaging** - Use @fux/vpack:pack executor

### **Adapter Pattern Standards**

**Preferred Adapter Pattern:**

- **No constructor injection** - Adapters should not require dependencies in constructor
- **Direct API calls** - Adapters should call VSCode APIs directly
- **Context setters** - Use setter methods for context-dependent adapters (e.g., StorageAdapter)
- **Local interfaces** - Define interfaces within each adapter file
- **Testing** - See [Testing Strategy](../testing/_Testing-Strategy.md) for adapter testing patterns

**Benefits:**

- **Simpler architecture** - Less complexity and dependency management
- **Better testability** - See [Testing Strategy](../testing/_Testing-Strategy.md)
- **Proven approach** - Consistent pattern across all packages
- **Complete coverage** - All adapters have tests

### **Core Package Export Strategy**

**Required Comprehensive Export Categorization:**

All core packages MUST implement comprehensive export coverage with clear categorization following the Project Butler Core pattern:

```typescript
// packages/{feature}/core/src/index.ts
// Service Interfaces
export * from './_interfaces/IPackageJsonFormattingService.js'
export * from './_interfaces/ITerminalManagementService.js'
export * from './_interfaces/IBackupManagementService.js'
export * from './_interfaces/IPoetryShellService.js'
export * from './_interfaces/IProjectButlerManagerService.js'

// Adapter Interfaces
export * from './_interfaces/IFileSystemAdapter.js'
export * from './_interfaces/IPathAdapter.js'
export * from './_interfaces/IYamlAdapter.js'

// Services
export * from './services/PackageJsonFormatting.service.js'
export * from './services/TerminalManagement.service.js'
export * from './services/BackupManagement.service.js'
export * from './services/PoetryShell.service.js'
export * from './services/ProjectButlerManager.service.js'

// Constants
export * from './_config/constants.js'
```

**Export Strategy Requirements:**

- **Service Interfaces**: Core business logic interfaces (e.g., `IServiceName`)
- **Adapter Interfaces**: VSCode integration interfaces (e.g., `IAdapterName`)
- **Services**: Concrete implementations (e.g., `ServiceName.service.js`)
- **Constants**: Configuration and constants (e.g., `constants.js`)
- **Clear Categorization**: Each category must be clearly separated with comments
- **Comprehensive Coverage**: All interfaces and services must be exported
- **Consistent Pattern**: Follow the same structure across all core packages

**Benefits:**

- **Clear Organization**: Developers can easily understand package structure
- **Better DX**: Improved developer experience with organized exports
- **Maintainability**: Easier to maintain and extend package functionality
- **Consistency**: Uniform pattern across all packages in the monorepo

### **Dependency Aggregation Pattern**

**Required Dependency Management Strategy:**

All core packages MUST implement dependency aggregation pattern for better dependency management and centralized orchestration:

```typescript
// packages/{feature}/core/src/_interfaces/I{Feature}ManagerService.ts
export interface I{Feature}Dependencies {
	service1: IService1
	service2: IService2
	service3: IService3
}

export interface I{Feature}ManagerService {
	method1: (param: Type) => ReturnType
	method2: (param: Type) => Promise<ReturnType>
	// ... other orchestrated methods
}

// packages/{feature}/core/src/services/{Feature}Manager.service.ts
export class {Feature}ManagerService implements I{Feature}ManagerService {
	constructor(private readonly dependencies: I{Feature}Dependencies) {}

	method1(param: Type): ReturnType {
		return this.dependencies.service1.process(param)
	}

	async method2(param: Type): Promise<ReturnType> {
		return this.dependencies.service2.process(param)
	}
}
```

**Dependency Aggregation Requirements:**

- **Dependencies Interface**: Aggregate all service dependencies into single interface (e.g., `I{Feature}Dependencies`)
- **Manager Service**: Create central orchestrator service that uses aggregated dependencies
- **Clean Constructor**: Single `dependencies` parameter instead of multiple individual dependencies
- **Centralized Access**: Manager service provides unified access to all package functionality
- **Consistent Pattern**: Follow the same structure across all core packages

**Benefits:**

- **Better Dependency Management**: Single dependencies interface instead of multiple individual dependencies
- **Cleaner Architecture**: Simplified constructor patterns and dependency injection
- **Centralized Orchestration**: Manager service provides unified access to all functionality
- **Improved Testability**: Easier to mock dependencies with single aggregated interface
- **Consistency**: Uniform pattern across all packages in the monorepo

### **Complex Orchestration Pattern**

**Required Complex Manager Service Coordination:**

All core packages MUST implement complex orchestration patterns for advanced manager service coordination:

```typescript
// packages/{feature}/core/src/services/{Feature}Manager.service.ts
export class {Feature}ManagerService implements I{Feature}ManagerService {
	constructor(private readonly dependencies: I{Feature}Dependencies) {}

	// Basic operations with validation and error handling
	async basicOperation(param: Type): Promise<ReturnType> {
		try {
			this.validateInput(param)
			const result = await this.dependencies.service.process(param)
			if (!result) throw new Error(ERROR_MESSAGES.OPERATION_FAILED)
			return result
		} catch (error: any) {
			throw new Error(`${ERROR_MESSAGES.OPERATION_FAILED}: ${error.message}`)
		}
	}

	// Complex orchestration workflows
	async complexWorkflow(param1: Type1, param2: Type2): Promise<WorkflowResult> {
		try {
			// Step 1: Validate inputs
			this.validateWorkflowInputs(param1, param2)

			// Step 2: Execute first operation
			const step1Result = await this.dependencies.service1.process(param1)

			// Step 3: Execute second operation with step1 result
			const step2Result = await this.dependencies.service2.process(step1Result, param2)

			// Step 4: Coordinate final result
			return this.coordinateResults(step1Result, step2Result)
		} catch (error: any) {
			throw new Error(`Complex workflow failed: ${error.message}`)
		}
	}

	// Private validation methods
	private validateInput(param: Type): void {
		if (!param) throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)
		// Additional validation logic
	}
}
```

**Complex Orchestration Requirements:**

- **Multi-step Workflows**: Complex business logic with multiple coordinated steps
- **Error Handling**: Comprehensive error handling with specific error messages and validation
- **Input Validation**: Robust parameter validation with detailed error reporting
- **Business Logic Orchestration**: Coordinating multiple operations in sequence
- **Metadata Management**: Enhanced data structures with metadata for complex workflows
- **Workflow Coordination**: Complete end-to-end workflows that orchestrate multiple services

**Benefits:**

- **Advanced Orchestration**: Complex multi-step workflows that coordinate multiple services
- **Robust Error Handling**: Comprehensive error handling with specific error messages
- **Input Validation**: Robust parameter validation with detailed error reporting
- **Business Logic Coordination**: Manager service orchestrates complex business processes
- **Enhanced Metadata**: Rich metadata support for complex workflow state management
- **Workflow Efficiency**: Complete workflows that handle multiple operations in sequence

## **Migration Guide**

### **From Shared Adapters to Local Adapters**

1. **Core packages**: Change VSCode imports to type imports
2. **Extension packages**: Create local adapters in `src/adapters/`
3. **Remove shared dependencies**: No more `@fux/shared` imports
4. **Update tests**: Test core logic in isolation, test adapters separately

### **Example Migration**

```typescript
// Before (incorrect)
// Core package
import { Uri } from 'vscode' // ❌ Value import

// After (correct)
// Core package
import type { Uri } from 'vscode' // ✅ Type import

// Create local interface
export interface IUri {
    fsPath: string
    scheme: string
    authority: string
    path: string
    query: string
    fragment: string
    toString: () => string
    with: (change: {
        /* ... */
    }) => IUri
}

export interface IUriFactory {
    file: (path: string) => IUri
    parse: (value: string) => IUri
    create: (uri: any) => IUri
    joinPath: (base: IUri, ...paths: string[]) => IUri
}

// Extension package
import * as vscode from 'vscode' // ✅ Value import for adapters
export class UriAdapter implements IUriFactory {
    constructor(private vscodeUri: typeof vscode.Uri) {}

    file(path: string): IUri {
        const uri = this.vscodeUri.file(path)
        return this._toIUri(uri)
    }

    private _toIUri(uri: vscode.Uri): IUri {
        return {
            fsPath: uri.fsPath,
            scheme: uri.scheme,
            // ... other properties
        }
    }
}
```

## **Benefits**

### **Testing Benefits**

- **Core packages**: Test business logic without VSCode complexity
- **Extension packages**: Test VSCode integration patterns
- **Independent validation**: Each package can be tested separately
- **Fast execution**: Core tests run without VSCode context

### **Architectural Benefits**

- **Self-contained**: Each package is independent
- **Clear separation**: Business logic vs VSCode integration
- **Maintainable**: Changes in one package don't affect others
- **Scalable**: Easy to add new packages following the same pattern

---

## **Asset Processing Packages**

### **Dynamicons Assets Package**

- **Pattern**: Core package with orchestrator pattern
- **Structure**: `src/orchestrators/`, `src/processors/`, `src/utils/`
- **Build Configuration**: Uses `@nx/esbuild:esbuild` with absolute paths
- **Error Handling**: Centralized `ErrorHandler` utility class
- **Type Safety**: No explicit `any` types, proper interfaces

### **Implementation Example**

```typescript
// src/orchestrators/asset-orchestrator.ts
export class AssetOrchestrator {
    private async executeProcessor(
        processorName: string,
        description: string,
        processor: Processor // Proper interface, not 'any'
    ): Promise<ScriptResult>
}
```

## **Asset Processing Architecture**

### **Core Package Self-Containment**

Core packages MUST process assets to their own `dist/assets` directory and NEVER output to extension paths or external locations. This ensures complete independence and enables orchestrator extensions to use core packages without external dependencies.

**Key Principles**:

- **Independent Asset Processing**: Core packages handle all asset processing internally
- **Self-Contained Output**: All processed assets stored in package's own dist directory
- **No External Paths**: Never reference extension or external package paths
- **Orchestrator Ready**: Core packages can be used by orchestrator extensions

### **Asset Processing Workflow**

1. **Asset Discovery**: Scan source directories for SVG, theme, and image assets
2. **Change Detection**: Compare current state with manifest to identify modifications
3. **Selective Processing**: Process only changed assets for efficiency
4. **Output Generation**: Store processed assets in core package's dist/assets
5. **Extension Copying**: Extension packages copy assets from core's dist to their own dist

### **Nx Target Integration Best Practices**

**Target Dependencies**:

- Asset processing targets MUST depend on build targets, not vice versa
- This prevents `deleteOutputPath: true` from clearing processed assets
- Correct order: build → process-assets → copy-assets

**Caching Strategy**:

- Asset processing targets should leverage Nx caching for performance
- Use `outputs` configuration to specify cacheable outputs
- Avoid caching targets that create unique timestamped versions

### **Asset Change Detection System**

**Manifest Generation**:

- Create comprehensive asset metadata including hashes, sizes, and timestamps
- Store manifest in core package's dist directory for change tracking
- Use MD5 hashing for reliable change detection

**Change Analysis**:

- Compare current asset state with stored manifest
- Identify added, modified, and deleted assets
- Provide detailed change summary for processing decisions

**Incremental Processing**:

- Process only changed assets to minimize build time
- Maintain full processing capability for complete rebuilds
- Support both incremental and full processing modes

---

## **Nx Target Integration Best Practices**

### **Target vs Package Scripts**

**ALWAYS use Nx targets over package.json scripts** for better caching, dependency management, and build graph integration.

**Benefits**:

- **Caching**: Leverages Nx's intelligent caching system
- **Dependencies**: Proper dependency graph management
- **Build Order**: Correct execution order for complex workflows
- **Performance**: Better performance through optimized execution

### **Target Configuration**

**Output Paths**:

- Use package-relative paths, not workspace-relative paths
- Example: `"{projectRoot}/dist/assets"` not `"{workspaceRoot}/packages/..."`
- This ensures proper caching and dependency resolution

**Dependency Management**:

- Define clear dependencies between targets
- Ensure asset processing occurs after core package build
- Use `dependsOn` to establish correct execution order

### **Asset Processing Targets**

**Core Package Targets**:

- `process-assets`: Full asset processing with change detection
- `process-assets:incremental`: Change-based processing only
- `process-assets:all`: Force all assets processing
- `assets:manifest`: Generate manifest only
- `assets:detect`: Detect changes only

**Extension Package Targets**:

- `copy-assets`: Copy processed assets from core to extension

---

## **Asset Change Detection System**

### **Architectural Components**

**Asset Manifest Generator**:

- Discovers assets recursively from source directories
- Generates metadata including file hashes, sizes, and timestamps
- Creates JSON manifest for change tracking and analysis

**Change Detector**:

- Compares current asset state with stored manifest
- Identifies added, modified, and deleted assets
- Provides detailed change summary for processing decisions

**Asset Processor**:

- Processes assets based on change analysis
- Supports asset-specific processing logic
- Includes validation and error handling

**Asset Orchestrator**:

- Unified entry point for all asset operations
- Coordinates manifest generation, change detection, and processing
- Provides comprehensive logging and statistics

### **Change Detection Algorithm**

**Hash-Based Comparison**:

- Use MD5 hashing for reliable change detection
- Compare file hashes, sizes, and modification times
- Handle edge cases like file corruption or partial writes

**Change Classification**:

- **Added**: New assets not present in manifest
- **Modified**: Existing assets with changed content
- **Deleted**: Assets present in manifest but not in filesystem
- **Unchanged**: Assets with identical content and metadata

**Performance Optimization**:

- Process only changed assets for incremental builds
- Maintain full processing capability for complete rebuilds
- Support both incremental and full processing modes

### VS Code Integration Test Helper (Note)

- The monorepo helper `@fux/vscode-test-cli-config` is a test-only dependency.
- Do not create build graph edges from extensions to this helper (no TS project refs, no devDependency in extensions).
- Preferred pattern: build the helper as a pre-step in integration test targets and import it from its built dist in `.vscode-test.mjs`.
- Benefit: keeps extension builds fast and predictable while preserving consistent test configuration.
