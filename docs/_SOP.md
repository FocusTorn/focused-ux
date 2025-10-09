# SOP v2: FocusedUX Core/Extension Architecture

## **REFERENCE FILES**

### **Documentation References**

- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`
- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **ACTIONS_LOG**: `docs/Actions-Log.md`

### **Command References**

- **FLUENCY_CMD**: `@Deep Dive - Fluency of a package.md`
- **FLUENCY_PHASE_1**: `@fluency-phase1-Identity.md`
- **FLUENCY_PHASE_2**: `@fluency-phase2-Architecture.md`
- **FLUENCY_PHASE_6**: `@fluency-phase6-Synthesis.md`

---

## **Overview**

This document outlines the **confirmed final architecture** for the FocusedUX monorepo, based on the working implementations in Ghost Writer and Project Butler packages. This architecture provides a clean separation between business logic (core) and VSCode integration (extension) while maintaining simplicity and testability.

## **Command Execution Protocol**

### **PAE Alias Mandate**

**CRITICAL RULE**: ALWAYS use PAE aliases for all project operations.

#### **Pre-Execution Requirements**

```bash
# ALWAYS run this first to discover available commands
pae help
```

#### **Command Execution Patterns**

```bash
# ❌ NEVER do this
nx test @fux/package-name-core
nx build @fux/package-name-ext
pnpm run build --filter=@fux/package-name

# ✅ ALWAYS do this
{package-alias} t      # Test package (full)
{package-alias}c t     # Test package core
{package-alias}e t     # Test package extension
{package-alias} b      # Build package
{package-alias} tc     # Test with coverage
{package-alias} ti     # Test integration
```

#### **Package-Specific Aliases**

**CRITICAL**: Always run `pae help` to discover current package aliases. Aliases may change as packages evolve.

**Example Pattern**:

- **Package Name**: `{alias}`, `{alias}c`, `{alias}e`
- **Core Package**: `{alias}c` (e.g., `{alias}c b` for build)
- **Extension Package**: `{alias}e` (e.g., `{alias}e b` for build)

#### **Target Aliases**

- **Build**: `b`
- **Test**: `t`, `tc` (with coverage), `ti` (integration), `tf` (full)
- **Package**: `p`, `pd` (dev)
- **Lint**: `l`, `lf` (full)
- **Validate**: `v`, `vf` (full)
- **Audit**: `a`, `af` (full)

#### **Verification Steps**

- [ ] **PAE aliases discovered** via `pae help`
- [ ] **Package-specific aliases identified** for target package
- [ ] **Command patterns verified** before execution
- [ ] **No raw nx commands used** unless explicitly required

**CRITICAL**: Always run `pae help` first to discover current aliases. Package aliases may change as the workspace evolves.

### **Workspace Analysis Protocol**

#### **Pre-Package Analysis Requirements**

```bash
# ALWAYS understand workspace before focusing on specific packages
nx_workspace
```

#### **Workspace Mapping Checklist**

- [ ] **All package dependencies** and relationships identified
- [ ] **Package types** (core/ext/shared/tool) and roles understood
- [ ] **Build configurations** and variations mapped
- [ ] **Testing strategies** across packages analyzed (see **TESTING_STRATEGY**)
- [ ] **Target package context** within overall system established

## **Confirmed Architecture Pattern**

### **Core Package (`@fux/package-name-core`)**

- **Purpose**: Pure business logic, no VSCode dependencies
- **Dependencies**: Minimal external dependencies (e.g., `external-dependency` for specific functionality)
- **No DI Container**: Services are directly instantiated with dependencies
- **No Shared Dependencies**: Self-contained "guinea pig" packages
- **Complete Interface Implementation**: All service interface methods must be implemented
- **VSCode Imports**: Type imports only (`import type { Uri } from 'vscode'`)
- **Build**: Extends `build:core` target with package-specific external dependencies

### **Extension Package (`@fux/package-name-ext`)**

- **Purpose**: Lightweight VSCode wrapper for core logic
- **Dependencies**: Core package + VSCode APIs
- **No DI Container**: Direct service instantiation
- **VSCode Adapters**: Local adapters with VSCode value imports
- **No Shared Dependencies**: Self-contained with local adapters only
- **Build**: Extends `build:ext` target with package-specific external dependencies

## **VSCode Import Patterns**

### **Core Package VSCode Imports**

- **Pattern**: Type imports only
- **Implementation**: `import type { Uri } from 'vscode'`
- **Rationale**: Core packages remain pure business logic without VSCode dependencies
- **Testing**: See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns

### **Extension Package VSCode Imports**

- **Pattern**: Local adapters with VSCode value imports
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

## **Package Structure**

### **Core Package Structure**

**Preferred Flat Structure (Project Butler Core Pattern):**

```
packages/package-name/core/
├── src/
│   ├── _interfaces/          # All interfaces centralized
│   ├── services/             # All services in flat structure
│   ├── _config/              # Constants and configuration
│   └── index.ts              # Comprehensive categorized exports
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── package.json              # Core package config
├── project.json              # Nx build config
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── vitest.coverage.config.ts # Coverage test config
```

**Alternative Feature-Based Structure:**

```
packages/package-name/core/
├── src/
│   ├── _interfaces/          # Service interfaces
│   ├── _config/              # Configuration constants
│   ├── features/             # Feature-specific services
│   │   └── feature-name/
│   │       ├── _interfaces/  # Feature interfaces
│   │       └── services/     # Feature services
│   └── index.ts              # Package exports
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── package.json              # Core package config
├── project.json              # Nx build config
├── tsconfig.json             # TypeScript config
├── tsconfig.lib.json         # Library build config
├── vitest.config.ts          # Test config
└── vitest.coverage.config.ts # Coverage test config
```

### **Extension Package Structure**

**Preferred Flat Structure:**

```
packages/package-name/ext/
├── src/
│   ├── adapters/             # All VSCode adapters in flat structure
│   ├── _config/              # Configuration constants (if needed)
│   └── extension.ts          # Main extension entry point (direct entry)
├── __tests__/                # Test structure (see [Testing Strategy](../testing/_Testing-Strategy.md))
├── assets/                   # Extension assets
├── package.json              # Extension config
├── project.json              # Nx build config
├── tsconfig.json             # TypeScript config
├── .vscodeignore             # VSIX packaging
├── vitest.config.ts          # Test config
└── vitest.coverage.config.ts # Coverage test config
```

**Key Architectural Principles:**

- **Direct entry point** - No index.ts wrapper, use extension.ts directly
- **Flat adapter structure** - All adapters in single directory
- **Test structure** - See [Testing Strategy](../testing/_Testing-Strategy.md)
- **Modern packaging** - Use @fux/vpack:pack executor

## **Build Configuration**

### **Target Inheritance Architecture**

**CRITICAL**: ALL packages use target inheritance from global `nx.json` configuration for consistent build patterns.

#### **Global Build Targets**

The `nx.json` file defines specialized build targets that packages extend:

- **`build:core`**: Core package pattern (ESM, unbundled, declarations)
- **`build:ext`**: Extension package pattern (CJS, bundled, VSCode-compatible)

#### **Package Configuration Pattern**

All packages use minimal `project.json` configurations:

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
- **Maintainability**: Changes to build logic happen in one place (`nx.json`)
- **Simplicity**: Package configs only specify what's different
- **Directory Independence**: Builds work from any directory using `{workspaceRoot}` paths

### **Universal Build Executor Rule**

**CRITICAL**: ALL packages MUST use `@nx/esbuild:esbuild` as the build executor, regardless of package type or bundling needs.

**Rationale**:

- **Performance**: ESBuild is significantly faster than Vite, Rollup, or Webpack for TypeScript compilation
- **Consistency**: Single build system across all packages for maintainability
- **Nx Integration**: Superior caching and incremental build support
- **TypeScript Support**: Native TypeScript compilation without bundling when `bundle: false`

**Forbidden Executors**:

- ❌ `@nx/vite:build` - Use ESBuild instead
- ❌ `@nx/rollup:rollup` - Use ESBuild instead
- ❌ `@nx/webpack:webpack` - Use ESBuild instead
- ❌ `@nx/tsc:tsc` - Use ESBuild instead

### **Core Package Configuration**

**`package.json`:**

```json
{
    "name": "@fux/package-name-core",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "default": "./dist/index.js"
        }
    },
    "dependencies": {
        "external-dependency": "^1.0.0"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "vitest": "^3.2.4"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/package-name-core",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "main": "packages/package-name/core/src/index.ts",
                "outputPath": "packages/package-name/core/dist",
                "tsConfig": "packages/package-name/core/tsconfig.lib.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "keepNames": true,
                "declarationRootDir": "packages/package-name/core/src",
                "thirdParty": false,
                "deleteOutputPath": true,
                "external": ["vscode", "external-dependency"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"],
            "options": {}
        },
        "test:full": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": [
                {
                    "dependencies": true,
                    "target": "test",
                    "params": "forward"
                }
            ],
            "options": {}
        }
    }
}
```

**`tsconfig.lib.json`:**

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "./dist",
        "declaration": true,
        "declarationMap": true,
        "types": ["node"]
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### **Tool Package Configuration**

**`package.json`:**

```json
{
    "name": "@fux/tool-name",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "dependencies": {
        "dependency1": "^1.0.0"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/tool-name",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "main": "libs/tools/tool-name/src/index.ts",
                "outputPath": "libs/tools/tool-name/dist",
                "tsConfig": "libs/tools/tool-name/tsconfig.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "external": ["dependency1", "dependency2"]
            }
        }
    }
}
```

### **Extension Package Configuration**

**`package.json`:**

```json
{
    "name": "fux-package-name",
    "displayName": "F-UX: Package Name",
    "description": "Description of the extension",
    "publisher": "NewRealityDesigns",
    "version": "0.1.0",
    "private": true,
    "main": "./dist/extension.cjs",
    "dependencies": {
        "@fux/package-name-core": "workspace:*",
        "external-dependency": "^1.0.0"
    },
    "devDependencies": {
        "@types/node": "^24.0.10",
        "@types/vscode": "^1.99.3",
        "@types/external-dependency": "^1.0.0",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4" // ✅ Testing framework (see [Testing Strategy](../testing/_Testing-Strategy.md)),
        "@vitest/coverage-v8": "^3.2.4"
    },
    "contributes": {
        "commands": [
            {
                "command": "fux-package-name.commandName",
                "title": "Package Name: Command Title",
                "category": "Package Name"
            }
        ]
    },
    "activationEvents": ["*"],
    "engines": {
        "vscode": "^1.99.3"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/package-name-ext",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/package-name/ext/src/extension.ts"],
                "outputPath": "packages/package-name/ext/dist",
                "format": ["cjs"],
                "metafile": true,
                "platform": "node",
                "bundle": true,
                "external": ["vscode", "external-dependency"],
                "sourcemap": true,
                "main": "packages/package-name/ext/src/extension.ts",
                "tsConfig": "packages/package-name/ext/tsconfig.json",
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/package-name/ext/assets/",
                        "output": "./assets/"
                    }
                ],
                "thirdParty": true
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
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"],
            "options": {}
        },
        "test:full": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": [
                {
                    "dependencies": true,
                    "target": "test",
                    "params": "forward"
                }
            ],
            "options": {}
        }
    }
}
```

**`tsconfig.json`:**

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "target": "ES2022",
        "module": "CommonJS",
        "moduleResolution": "node",
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

## **VPack Packaging Patterns**

### **VPack Executor Integration**

The FocusedUX monorepo uses the **VPack executor** (`@fux/vpack:pack`) for streamlined VSCode extension packaging, replacing traditional `vsce` commands with Nx-native execution.

#### **VPack Configuration Pattern**

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

#### **VPack Workflow**

1. **Build Dependencies**: Automatically builds core package and VSIX packager
2. **Extension Build**: Builds extension package with proper bundling
3. **VSIX Creation**: Creates VSIX package using integrated packager
4. **Development Mode**: `dev: true` enables enhanced debugging and development features

#### **VPack Benefits**

- **Nx Integration**: Native Nx executor with proper dependency management
- **Automatic Build Chain**: Handles all build dependencies automatically
- **Development Support**: Built-in development mode for enhanced debugging
- **Consistent Packaging**: Standardized packaging across all extensions

#### **VPack vs Traditional Packaging**

| Aspect            | VPack Pattern | Traditional vsce     |
| ----------------- | ------------- | -------------------- |
| **Command**       | `{alias} p`   | `vsce package`       |
| **Dependencies**  | Automatic     | Manual               |
| **Configuration** | project.json  | vsce config          |
| **Development**   | `{alias} pd`  | `vsce package --dev` |
| **Integration**   | Nx-native     | External tool        |

#### **VPack Execution Commands**

```bash
# Production packaging
pae {alias} p

# Development packaging
pae {alias} pd

# Examples (run `pae help` for current aliases)
pae {alias} p      # Package extension
pae {alias} pd     # Package extension (dev mode)
pae {alias} b      # Build package
```

## **Implementation Patterns**

### **Core Package Implementation**

**Service Pattern:**

```typescript
// packages/package-name/core/src/features/feature-name/services/Feature.service.ts
export class FeatureService {
    constructor(
        private readonly dependency1: IDependency1,
        private readonly dependency2: IDependency2
    ) {}

    async performAction(input: string): Promise<string> {
        // Business logic here
        const result = await this.dependency1.process(input)
        return this.dependency2.format(result)
    }
}
```

**Interface Pattern:**

```typescript
// packages/package-name/core/src/features/feature-name/_interfaces/IFeatureService.ts
export interface IFeatureService {
    performAction(input: string): Promise<string>
}
```

**Export Pattern:**

**Required Comprehensive Export Strategy (Project Butler Core Pattern):**

```typescript
// packages/package-name/core/src/index.ts
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

**Key Requirements:**

- **Service Interfaces**: Core business logic interfaces
- **Adapter Interfaces**: VSCode integration interfaces
- **Services**: Concrete implementations
- **Constants**: Configuration and constants
- **Clear Categorization**: Each category must be clearly separated with comments
- **Comprehensive Coverage**: All interfaces and services must be exported
- **Consistent Pattern**: Follow the same structure across all core packages

### **Dependency Aggregation Pattern**

**Required Dependency Management Strategy:**

All core packages MUST implement dependency aggregation pattern for better dependency management and centralized orchestration:

```typescript
// packages/package-name/core/src/_interfaces/IPackageManagerService.ts
export interface IPackageDependencies {
    service1: IService1
    service2: IService2
    service3: IService3
}

export interface IPackageManagerService {
    method1: (param: Type) => ReturnType
    method2: (param: Type) => Promise<ReturnType>
    // ... other orchestrated methods
}

// packages/package-name/core/src/services/PackageManager.service.ts
export class PackageManagerService implements IPackageManagerService {
    constructor(private readonly dependencies: IPackageDependencies) {}

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
- **Improved Testability**: See [Testing Strategy](../testing/_Testing-Strategy.md) for dependency mocking patterns
- **Consistency**: Uniform pattern across all packages in the monorepo

### **Complex Orchestration Pattern**

**Required Complex Manager Service Coordination:**

All core packages MUST implement complex orchestration patterns for advanced manager service coordination:

```typescript
// packages/package-name/core/src/services/PackageManager.service.ts
export class PackageManagerService implements IPackageManagerService {
    constructor(private readonly dependencies: IPackageDependencies) {}

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

**Alternative Individual Exports (Feature-Based Structure):**

```typescript
// packages/package-name/core/src/index.ts
// Individual exports for manual tree-shaking
export type { IFeatureService } from './features/feature-name/_interfaces/IFeatureService.js'
export { FeatureService } from './features/feature-name/services/Feature.service.js'
export { constants } from './_config/constants.js'
```

### **Extension Package Implementation**

**Adapter Pattern:**

```typescript
// packages/package-name/ext/src/adapters/VSCodeAdapter.adapter.ts
export class VSCodeAdapter {
    constructor(private readonly vscodeApi: typeof vscode) {}

    async showMessage(message: string): Promise<void> {
        await this.vscodeApi.window.showInformationMessage(message)
    }
}
```

**Extension Entry Point:**

```typescript
// packages/package-name/ext/src/extension.ts
import * as vscode from 'vscode'
import { FeatureService } from '@fux/package-name-core'
import { VSCodeAdapter } from './adapters/VSCodeAdapter.adapter'

export function activate(context: vscode.ExtensionContext): void {
    // Create adapters
    const vscodeAdapter = new VSCodeAdapter(vscode)

    // Create core services
    const featureService = new FeatureService(vscodeAdapter)

    // Register commands
    const disposable = vscode.commands.registerCommand('fux-package-name.commandName', async () => {
        const result = await featureService.performAction('input')
        await vscodeAdapter.showMessage(result)
    })

    context.subscriptions.push(disposable)
}

export function deactivate(): void {}
```

## **Testing Strategy**

- **Authority**: See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns, configurations, and strategies
- **Core Packages**: Business logic testing patterns
- **Extension Packages**: VSCode integration testing patterns
- **Configuration**: Test executor and target configurations
- **Integration Testing**: VS Code extension testing requirements

## **Key Architectural Principles**

### **1. No DI Containers**

- Core packages use direct service instantiation
- Extension packages use direct service instantiation
- Dependencies are passed as constructor parameters
- Simple architecture (see [Testing Strategy](../testing/_Testing-Strategy.md) for testing patterns)

### **2. No Shared Dependencies in Core**

- Core packages are self-contained "guinea pig" packages
- Only external dependencies are minimal utilities (e.g., `external-dependency`)
- No `@fux/shared` or `@fux/mockly` dependencies
- Enables independent validation (see [Testing Strategy](../testing/_Testing-Strategy.md))

### **3. Thin Extension Wrappers**

- Extension packages contain only VSCode integration code
- Business logic is in core packages
- Adapters abstract VSCode API calls
- Minimal extension code

### **4. Simple Testing**

- See [Testing Strategy](../testing/_Testing-Strategy.md) for comprehensive testing patterns
- Clear separation of concerns

### **5. Comprehensive Export Strategy**

- Core packages use comprehensive categorized exports
- Clear separation between Service Interfaces, Adapter Interfaces, Services, and Constants
- Consistent pattern across all packages for better maintainability
- Clear public API surface with organized categorization

## **Command Aliases**

### **Core Package Commands**

```bash
# Build core package
{alias}c build

# Test core package (functional)
{alias}c test

# Test core package (coverage)
{alias}c test:full

# TypeScript check
{alias}c tsc

# Lint core package
{alias}c lint
```

### **Extension Package Commands**

```bash
# Build extension package
{alias}e build

# Package extension for distribution
{alias}e package

# Package extension for development
{alias}e package:dev

# Test extension package (functional)
{alias}e test

# Test extension package (coverage)
{alias}e test:full

# TypeScript check
{alias}e tsc

# Lint extension package
{alias}e lint
```

### **Combined Package Commands**

```bash
# Test both packages
{alias} test

# Build both packages
{alias} build

# TypeScript check both packages
{alias} tsc
```

## **Migration from Old Architecture**

### **Step 1: Extract Business Logic**

1. Move business logic to core package
2. Create service interfaces
3. Remove VSCode dependencies from core

### **Step 2: Create VSCode Adapters**

1. Abstract VSCode API calls
2. Create adapter interfaces
3. Implement adapter classes

### **Step 3: Update Extension**

1. Import core services
2. Use adapters for VSCode operations
3. Register commands with core logic

### **Step 4: Update Tests**

1. See [Testing Strategy](../testing/_Testing-Strategy.md) for migration testing patterns

### **Step 5: Update Build Configuration**

1. Configure Nx targets for both packages
2. Set up test configurations (see [Testing Strategy](../testing/_Testing-Strategy.md))
3. Update command aliases

## **Quality Gates**

### **Core Package**

- [ ] All services have functional tests (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] Appropriate test coverage (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] No VSCode dependencies
- [ ] Clean interfaces defined
- [ ] TypeScript compilation passes

### **Extension Package**

- [ ] Extension activation test passes (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] All adapters have tests (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] Command registration tested (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] Error handling tested (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] TypeScript compilation passes

### **Integration**

- [ ] Both packages build successfully
- [ ] All tests pass (see [Testing Strategy](../testing/_Testing-Strategy.md))
- [ ] No circular dependencies
- [ ] Clean separation of concerns

## **Conclusion**

This architecture provides:

- **Clean separation of concerns** between business logic and VSCode integration
- **Simple** code structure without complex DI containers
- **Independent core packages** that can be validated separately (see [Testing Strategy](../testing/_Testing-Strategy.md))
- **Thin extension wrappers** that focus only on VSCode integration
- **Consistent patterns** across all packages in the monorepo

The confirmed implementations in Ghost Writer and Project Butler demonstrate that this architecture is working, maintainable, and scalable for the FocusedUX monorepo.

---

## **Asset Processing Workflow**

### **Core Package Asset Processing**

**Workflow Steps**:

1. **Asset Discovery**: Scan source directories for SVG, theme, and image assets
2. **Manifest Generation**: Create comprehensive asset metadata with hashes and timestamps
3. **Change Detection**: Compare current state with manifest to identify modifications
4. **Selective Processing**: Process only changed assets for efficiency
5. **Output Generation**: Store processed assets in core package's dist/assets directory

**Nx Target Usage**:

```bash
# Full asset processing with change detection
{alias} process-assets

# Incremental processing (changed assets only)
{alias} process-assets:incremental

# Force all assets processing
{alias} process-assets:all

# Generate manifest only
{alias} assets:manifest

# Detect changes only
{alias} assets:detect
```

### **Extension Package Asset Copying**

**Workflow Steps**:

1. **Dependency Check**: Ensure core package assets are processed
2. **Asset Copying**: Copy processed assets from core's dist/assets to extension's dist/assets
3. **Structure Preservation**: Maintain directory structure during copying
4. **Validation**: Verify copied assets are accessible

**Nx Target Usage**:

```bash
# Copy assets from core to extension
{alias} copy-assets
```

### **Build Integration**

**Target Dependencies**:

- Core package: `build` → `process-assets`
- Extension package: `copy-assets` → `@fux/package-name-core:process-assets` → `build`

**Critical Rules**:

- Asset processing MUST occur AFTER core package build
- Extension copying MUST occur AFTER core asset processing
- Never reverse dependency order to prevent asset deletion

---

## **Performance Measurement Protocol**

### **Before Implementation**

**Baseline Establishment**:

1. **Build Time Measurement**: Measure current build times for asset-heavy builds
2. **Asset Processing Time**: Measure time spent on asset operations
3. **Cache Hit Rates**: Establish current Nx cache effectiveness
4. **Memory Usage**: Measure peak memory during asset processing

**Measurement Commands**:

```bash
# Measure build time
time {alias} build

# Measure asset processing time
time {alias} process-assets

# Check cache status
nx show projects --graph
```

### **After Implementation**

**Performance Validation**:

1. **Build Time Comparison**: Compare before/after build times
2. **Asset Processing Efficiency**: Measure incremental vs full processing times
3. **Cache Effectiveness**: Verify Nx caching improvements
4. **Memory Optimization**: Confirm reduced memory usage

**Validation Commands**:

```bash
# Measure optimized build time
time {alias} build

# Test incremental processing
time {alias} process-assets:incremental

# Verify cache hits
nx show projects --graph
```

### **Performance Documentation**

**Required Metrics**:

- Build time reduction percentage
- Asset processing time improvement
- Cache hit rate improvement
- Memory usage optimization
- Specific performance bottlenecks addressed

**Documentation Format**:

```markdown
### Performance Impact

- **Build Time Reduction**: X% improvement
- **Asset Processing**: X% faster
- **Cache Efficiency**: X% improvement
- **Memory Usage**: X% reduction
```

---

## **Documentation-First Approach**

### **Development Workflow**

**Before Implementation**:

1. **Check Existing Documentation**: Review `./docs/` for existing solutions
2. **Reference Established Patterns**: Use documented patterns when available
3. **Documentation Gap Analysis**: Identify what needs to be documented
4. **Pattern Validation**: Verify patterns align with architectural principles

**During Implementation**:

1. **Follow Documented Patterns**: Implement using established guidance
2. **Document Deviations**: Note any deviations from documented patterns
3. **Update Documentation**: Keep documentation current with implementation
4. **Pattern Validation**: Ensure implementation follows documented principles

**After Implementation**:

1. **Document Success**: Record successful implementations in Actions Log
2. **Document Failures**: Record what was tried and failed
3. **Update Strategies**: Enhance documentation with new learnings
4. **Pattern Recognition**: Identify new patterns for future use

### **Local Development Testing Patterns**

**Tool Selection Criteria**:

1. **Direct TypeScript Execution**: Use `tsx` for faster development cycles
2. **Avoid Build Steps**: Execute source directly rather than building to dist
3. **Immediate Feedback**: Get instant results without compilation delays
4. **Easier Debugging**: Work with source code directly

**Implementation Pattern**:

```bash
# ✅ Preferred approach for local testing
tsx libs/project-alias-expander/src/cli.ts [command]

# ❌ Avoid these slower approaches
npm run build && node dist/cli.js [command]
npm install @fux/project-alias-expander && pae [command]
```

**Benefits**:

- **Faster iteration**: No build step required
- **Immediate feedback**: Changes reflected instantly
- **Easier debugging**: Work with TypeScript source directly
- **No installation**: No need to install packages globally

**When to Use**:

- Local development and testing
- Quick validation of changes
- Debugging and troubleshooting
- Rapid prototyping

**When NOT to Use**:

- Production deployments
- CI/CD pipelines
- End-to-end testing
- Performance testing

### **Documentation Sources**

**Documentation Priority**:

1. **Architecture**: Core principles and patterns
2. **SOP**: Operational procedures and workflows
3. **Testing**: Testing strategies and patterns
4. **Actions Log**: Implementation history and lessons learned

### **Anti-Pattern Prevention**

**Documentation Violations**:

- Creating new solutions when comprehensive documentation exists
- Performing unnecessary analysis when documented patterns are available
- Asking questions already answered in documentation
- Overcomplicating responses instead of following established guidance

**Required Actions**:

- Always check docs first before creating new solutions
- Reference existing patterns directly in responses
- Implement documented solutions without additional analysis
- Acknowledge documentation as the source of the approach

