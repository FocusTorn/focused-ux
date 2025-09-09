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
- **Testing**: Test business logic in complete isolation without VSCode mocking
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
- **Testing**: Test VSCode integration through local adapters with API mocks

### **No Shared Package Usage**

- **Rule**: Each package is completely self-contained
- **Rationale**: Enables independent testing and validation
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

### **Test Configuration Consistency**

- **Rule**: All packages must use direct `@nx/vite:test` executor, not extends
- **Rationale**: Ensures consistent test execution and prevents configuration conflicts
- **Implementation**: Explicit executor configuration in project.json test targets

### **Comprehensive Testing Architecture**

- **Authority**: The `docs/FocusedUX-Testing-Strategy.md` is the authoritative source for all testing dependencies and patterns
- **Rule**:
    - **Core packages**: Test business logic in complete isolation without VSCode dependencies
    - **Extension packages**: Test VSCode integration through local adapters
    - **No shared package testing**: Each package tests its own functionality independently
- **Rationale**:
    - Core packages can be tested without complex VSCode mocking
    - Extension packages test real VSCode integration patterns
    - Self-contained testing enables deep validation and fast execution
- **Implementation**:
    - Core packages: Mock all external dependencies, test pure business logic
    - Extension packages: Test adapters with VSCode API mocks, validate integration flows
    - Independent test suites enable comprehensive coverage and regression prevention
- **Mock Precision**: Test mocks must precisely match actual API signatures and parameter handling patterns
- **Real Behavior Validation**: Tests must validate actual runtime behavior, not just mock replacements
- **Performance-Aware Testing**: Split large test files (500+ lines) proactively to prevent hanging and performance issues

### **VS Code Extension Integration Testing**

- **Rule**: VS Code extension integration tests require specific environment configuration to prevent UI operations from hanging
- **Critical Requirements**:
    - **Environment Variable**: Always set `VSCODE_TEST: '1'` in `.vscode-test.mjs` configuration
    - **Setup Files**: Use `setupFiles` configuration option instead of `--require` parameter for module loading
    - **Environment Detection**: Extensions must detect test environment with `process.env.VSCODE_TEST === '1'`
    - **UI Operation Handling**: Skip UI operations (like `window.showInformationMessage()`) in test environment
- **Rationale**:
    - Missing `VSCODE_TEST` environment variable causes UI operations to hang indefinitely in test context
    - `--require` parameter can cause module resolution issues in extension host context
    - Test environment detection prevents extension from attempting UI operations that block test execution
- **Implementation**:
    - Configure `.vscode-test.mjs` with `env: { VSCODE_TEST: '1' }` and `setupFiles: ['./out-tsc/suite/index.js']`
    - Use `const IS_TEST_ENVIRONMENT = process.env.VSCODE_TEST === '1'` in extension code
    - Conditionally skip UI operations: `if (!IS_TEST_ENVIRONMENT) { await window.showInformationMessage(...) }`
    - Throw errors in test environment for proper test failure reporting

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
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node scripts/create-vsix.js packages/{feature}/ext vsix_packages"
            }
        },
        "package:dev": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node scripts/create-vsix.js packages/{feature}/ext vsix_packages --dev"
            }
        }
    },
    "tags": ["ext"]
}
```

## **Package Structure**

### **Core Package Structure**

```
packages/{feature}/core/
├── src/
│   ├── _interfaces/          # Define interfaces only
│   ├── services/             # Business logic
│   └── index.ts
├── __tests__/
│   └── functional-tests/     # Test business logic in isolation
└── package.json              # No shared dependencies
```

### **Extension Package Structure**

```
packages/{feature}/ext/
├── src/
│   ├── adapters/             # Local VSCode adapters
│   ├── extension.ts          # VSCode integration
│   └── index.ts
├── __tests__/
│   └── functional-tests/     # Test VSCode integration
└── package.json              # Dependencies on core package only
```

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
