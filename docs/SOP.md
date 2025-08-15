# SOP v3: Comprehensive Build System & Architecture Guidelines

This document consolidates the valid parts from SOP and SOP v2, providing comprehensive guidelines for the FocusedUX monorepo architecture, build system, and development practices.

## 1. :: Project Overview <!-- Start Fold -->

The **Focused-UX (F-UX)** project is a monorepo designed to produce a suite of VS Code extensions. The architecture follows a modular approach where each feature is developed as a self-contained, installable VS Code extension through a `core`/`ext` package pair.

### 1.1. :: Current Package Structure

The workspace contains the following packages:

**Shared Libraries:**

- `@fux/shared` - Common services and VSCode API abstractions
- `@fux/mockly` - Testing utilities and mocks

**Feature Packages:**

- `@fux/ghost-writer-core` & `@fux/ghost-writer-ext`
- `@fux/context-cherry-picker-core` & `@fux/context-cherry-picker-ext`
- `@fux/dynamicons-core` & `@fux/dynamicons-ext`
- `@fux/note-hub-core` & `@fux/note-hub-ext`
- `@fux/project-butler-core` & `@fux/project-butler-ext`
- `@fux/ai-agent-interactor-core` & `@fux/ai-agent-interactor-ext`

**Tool Packages:**

- `@fux/structure-auditor` - Workspace structure validation
- `@fux/cursor-memory-optimizer` - Cursor optimization utilities
- `@fux/prune-nx-cache` - Nx cache management

###### END: Project Overview (END) <!-- Close Fold -->

## 2. :: Package Archetypes <!-- Start Fold -->

The monorepo consists of four primary package archetypes, each with a distinct purpose and configuration.

### 2.1. :: Package Types

- **`shared` (Library):** Located in `libs/shared/`, contains shared services and abstractions (e.g., file utilities, VS Code API wrappers) intended for runtime use by other packages.
- **`core` (Library):** Located in `packages/{feature}/core/`, contains a feature's abstract business logic. It is built to be tree-shakeable and is consumed by `ext` packages.
- **`ext` (Application):** Located in `packages/{feature}/ext/`, contains the VSCode extension implementation. It depends on a `core` package and is bundled into a final, executable artifact.
- **`tool` (Utility):** Located in `libs/tools/{tool-name}/`, contains standalone utilities that run directly with tsx (no build step).

### 2.2. :: Package Structure Decision Tree

When creating a new package, use the following decision tree to determine the appropriate structure:

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
│       │   └─ Dependencies in devDependencies (not dependencies)
│       │
│       └─ NO → Reconsider package purpose or consult team
```

### 2.3. :: Tool Pattern Configuration

For standalone tools that run directly with tsx:

**`package.json`:**

```json
{
    "name": "@fux/tool-name",
    "version": "0.0.1",
    "private": true,
    "type": "module",
    "devDependencies": {
        "@types/node": "18.19.39",
        "tsx": "4.16.2",
        "other-runtime-deps": "^version"
    }
}
```

**`project.json`:**

```json
{
    "name": "tool-name",
    "sourceRoot": "libs/tools/tool-name/src",
    "projectType": "library",
    "targets": {
        "run": {
            "executor": "nx:run-commands",
            "options": {
                "command": "tsx libs/tools/tool-name/src/main.ts"
            }
        }
    },
    "tags": ["tool"]
}
```

**`tsconfig.json`:**

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "src",
        "composite": false,
        "declaration": false,
        "declarationMap": false
    },
    "include": ["src/**/*.ts"]
}
```

###### END: Package Archetypes (END) <!-- Close Fold -->

## 3. :: Build System Architecture <!-- Start Fold -->

### 3.1. :: Build Configuration Requirements

**Core Package (`tsconfig.lib.json`):**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "declarationMap": true,
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

**Extension Package (`tsconfig.json`):**

```json
{
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

### 3.2. :: Build Target Configuration

**Core Package (`project.json`):**

```json
{
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "main": "packages/dynamicons/core/src/index.ts",
                "outputPath": "packages/dynamicons/core/dist",
                "tsConfig": "packages/dynamicons/core/tsconfig.lib.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "keepNames": true,
                "declarationRootDir": "packages/dynamicons/core/src",
                "thirdParty": false,
                "deleteOutputPath": true,
                "external": ["@fux/shared", "strip-json-comments"]
            }
        }
    }
}
```

**Extension Package (`project.json`):**

```json
{
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/dynamicons/ext/src/extension.ts"],
                "outputPath": "packages/dynamicons/ext/dist",
                "format": ["cjs"],
                "metafile": true,
                "platform": "node",
                "bundle": true,
                "external": [
                    "vscode",
                    "awilix",
                    "js-yaml",
                    "strip-json-comments",
                    "@fux/shared",
                    "@fux/dynamicons-core"
                ],
                "sourcemap": true,
                "main": "packages/dynamicons/ext/src/extension.ts",
                "tsConfig": "packages/dynamicons/ext/tsconfig.json",
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/dynamicons/ext/assets/",
                        "output": "./assets/"
                    }
                ]
            }
        }
    }
}
```

### 3.3. :: Global Targets in nx.json

The workspace defines standardized global targets in `nx.json` under `targetDefaults`:

**Build Targets:**

```json
{
    "build:core": {
        "executor": "@nx/esbuild:esbuild",
        "outputs": ["{options.outputPath}"],
        "dependsOn": ["^build"],
        "options": {
            "bundle": false,
            "sourcemap": true,
            "target": "es2022",
            "keepNames": true,
            "declarationRootDir": "{projectRoot}/src",
            "thirdParty": false,
            "deleteOutputPath": true
        }
    },
    "build:extension": {
        "executor": "@nx/esbuild:esbuild",
        "outputs": ["{options.outputPath}"],
        "dependsOn": ["^build"],
        "options": {
            "bundle": true,
            "format": ["cjs"],
            "metafile": true,
            "platform": "node",
            "sourcemap": true,
            "target": "es2022"
        }
    }
}
```

###### END: Build System Architecture (END) <!-- Close Fold -->

## 4. :: Critical Rules <!-- Start Fold -->

### 4.1. :: Adapter Architecture

**Rule:** All adapters MUST be in the shared package (`@fux/shared`).

**Rationale:**

- Ensures consistent abstraction across all packages
- Prevents duplication of adapter logic
- Maintains single source of truth for VSCode API abstractions

**Implementation:**

- Create adapters in `libs/shared/src/vscode/adapters/`
- Export adapters from `libs/shared/src/index.ts`
- Import adapters from `@fux/shared` in all packages

**Example:**

```typescript
// ✅ Correct - Import from shared package
import { FileSystemAdapter, PathAdapter } from '@fux/shared'

// ❌ Incorrect - Create local adapters
class LocalFileSystemAdapter implements IFileSystem {
    // Implementation
}
```

### 4.2. :: VSCode Value Import Restrictions

**Rule:** NO VSCode values are to be imported outside of adapters in the shared package.

**Rationale:**

- Maintains decoupling from VSCode API
- Enables complete dependency injection
- Facilitates testing and mocking

**Implementation:**

- Only import VSCode types (using `import type`) outside of adapters
- All VSCode value imports must be in shared package adapters
- Use shared adapters for all VSCode API interactions

**Example:**

```typescript
// ✅ Correct - Import only types
import type { ExtensionContext, Uri } from 'vscode'

// ✅ Correct - Use shared adapter
import { UriAdapter } from '@fux/shared'
const uri = UriAdapter.file(path)

// ❌ Incorrect - Direct VSCode value import
import { Uri } from 'vscode'
const uri = Uri.file(path)
```

### 4.3. :: Dependency Management

**Rule:** Build-only dependencies must be in `devDependencies`.

**Rationale:**

- Prevents extraneous dependencies in production packages
- Reduces VSIX package size
- Avoids packaging issues

**Implementation:**

- Runtime dependencies: `dependencies`
- Build/development dependencies: `devDependencies`
- Script-only dependencies: `devDependencies`

**Example:**

```json
{
    "dependencies": {
        "@fux/shared": "workspace:*",
        "awilix": "^12.0.5",
        "js-yaml": "^4.1.0"
    },
    "devDependencies": {
        "puppeteer": "^24.10.0",
        "sharp": "^0.34.2",
        "svgo": "^3.3.2",
        "tsx": "^4.20.1"
    }
}
```

### 4.4. :: Externalization Strategy

**Rule:** All third-party dependencies must be properly externalized.

**Rationale:**

- Ensures clean dependency management
- Prevents bundling issues
- Maintains compatibility with VSCode extension requirements

**Implementation:**

- List all runtime dependencies in `external` array in build configuration
- Use static imports for externalized packages
- Never use dynamic imports for externalized packages

**Example:**

```json
{
    "external": [
        "vscode",
        "awilix",
        "js-yaml",
        "strip-json-comments",
        "@fux/shared",
        "@fux/dynamicons-core"
    ]
}
```

### 4.5. :: Node.js Module Import Restrictions

**Rule:** NO direct Node.js module imports in extension code.

**Rationale:**

- VSCode extensions should not include Node.js built-in modules as dependencies
- Direct imports cause these modules to be bundled, leading to packaging failures
- Maintains compatibility with VSCode extension requirements

**Implementation:**

- Use VSCode's built-in file system API through workspace adapters
- Create proper abstractions that use shared module adapters
- Never import `node:fs`, `node:path`, or other Node.js built-ins directly

**Example:**

```typescript
// ✅ Correct - Use VSCode's built-in file system
import { workspace } from 'vscode'
const fs = workspace.fs

// ✅ Correct - Use shared adapter
import { FileSystemAdapter } from '@fux/shared'
const fs = new FileSystemAdapter()

// ❌ Incorrect - Direct Node.js import
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
```

**Common Node.js modules to avoid:**

- `node:fs` / `node:fs/promises`
- `node:path`
- `node:url`
- `node:os`
- `node:crypto`
- `node:child_process`

### 4.6. :: Shared Path Alias Resolution

**Rule:** The TypeScript path alias for `@fux/shared` must point to the package root (`libs/shared`), not `libs/shared/src`.

**Rationale:**

- Ensures consumers use the referenced project's declaration output instead of inlining sources
- Prevents `rootDir` and `include` errors in composite projects under NodeNext/ESM
- Aligns all packages on a consistent import strategy for the shared adapters

**Implementation:**

- In each consumer `tsconfig.lib.json`, set the path mapping to the package root
- Keep a project reference to `libs/shared/tsconfig.lib.json`

**Example (Correct):**

```json
{
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared"]
        }
    },
    "references": [{ "path": "../../../libs/shared/tsconfig.lib.json" }]
}
```

**Example (Incorrect):**

```json
{
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared/src"]
        }
    }
}
```

### 4.7. :: Explicit End-Goal Execution (No-Confirmation Mode)

**Rule:** When a task is stated with an explicit end goal (e.g., "add this feature and write tests that go green" or "achieve 100% across all 4 coverage columns"), proceed continuously toward the goal without asking for confirmation to continue.

**Rationale:** Reduces iteration latency and enforces outcome-driven execution. Prompts for confirmation are redundant when the goal is precisely specified.

**Implementation:**

- Continue autonomously until the stated end condition is met (e.g., tests green with 100% across statements, branches, functions, and lines).
- Only pause to request input when a true blocking ambiguity is encountered and cannot be resolved via local research.
- Apply necessary edits (code, tests, config) in one sequence per goal; verify with builds/tests before concluding.

###### END: Critical Rules (END) <!-- Close Fold -->

## 5. :: Dependency Injection with Awilix <!-- Start Fold -->

### 5.1. :: Framework

The project uses **awilix** for dependency injection across all packages.

### 5.2. :: Container Setup

Each extension package includes an `injection.ts` file that sets up the DI container.

### 5.3. :: Service Registration

All services (core, shared, and adapters) are registered in the DI container.

### 5.4. :: Static Imports

`awilix` and other externalized packages **MUST** be imported using static, top-level `import` statements to allow the bundler to correctly externalize them.

```typescript
// Correct - static import
import { createContainer, asClass, asFunction } from 'awilix'
```

### 5.5. :: Dependency Injection Best Practices

- **One Container Per Extension:** Each extension has its own DI container, created in its `injection.ts` file.
- **Use Factories for Dependencies:** Services that depend on other services or adapters **MUST** be registered using factory functions (`asFunction`) to ensure `awilix` can correctly resolve the dependency graph.
- **Register All Dependencies:** The container **MUST** provide a concrete implementation for every interface required by the services it resolves. This includes adapters for VS Code APIs (`IWindow`, `IWorkspace`) and shared utilities (`IPathUtilsService`, etc.).
- **Import Required Interfaces:** All interfaces used in DI registration **MUST** be imported from their respective packages to ensure proper typing and resolution.

### 5.6. :: Common DI Pitfalls & Troubleshooting

- **`AwilixResolutionError`:** This is the most common error and almost always means a dependency is missing from the container.
    - **Symptom:** `Could not resolve 'someService'.`
    - **Cause:** The `injection.ts` file is missing a registration for `someService` or one of its transitive dependencies.
    - **Solution:** Trace the dependency chain for the service that failed to resolve and ensure every required interface has a corresponding adapter or service registered in the container.

- **Hallucinated Adapters:** Do not assume an adapter exists in `@fux/shared`.
    - **Symptom:** TypeScript error `Module '"@fux/shared"' has no exported member 'SomeAdapter'.`
    - **Cause:** Attempting to import an adapter that does not exist in the shared library.
    - **Solution:** Verify the exports of `@fux/shared/src/index.ts`. If an adapter is needed but not present, it **MUST** be created locally within the `ext` package's `src/adapters` directory.

- **Path Sanitization Issues:** The `PathUtilsAdapter.santizePath()` method is designed for filenames only.
    - **Symptom:** Corrupted drive letters like `\C_` instead of `C:\`
    - **Cause:** Calling `santizePath()` on full file paths instead of just filenames
    - **Solution:** Only sanitize individual filenames/foldernames, not complete file paths. Use `path.join()` to construct full paths after sanitizing individual components.

- **Missing Interface Imports:** DI container registration requires proper interface imports.
    - **Symptom:** TypeScript errors about missing interface types in DI registration
    - **Cause:** Missing interface imports from core packages
    - **Solution:** Import all required interfaces from the core package and use factory functions (`asFunction`) for proper dependency injection.

#### 6.5.3. :: Core Container Summary

**The Core Container is the Heart of the System:**

The core container serves multiple critical roles in the FocusedUX architecture:

1. **Service Orchestration:** Provides all business logic services with proper dependencies
2. **Extension Integration:** Enables extensions to consume core functionality without reconstruction
3. **Orchestrator Enablement:** Allows future orchestrator extensions to coordinate multiple features
4. **Testing Foundation:** Provides consistent service instances for both unit and integration tests
5. **Architectural Boundary:** Maintains clean separation between VSCode-specific and business logic

**Key Architectural Principles:**

- **Core containers are the primary service providers** - not just for testing
- **Extensions consume core containers** - they don't reconstruct services
- **Orchestrators aggregate multiple core containers** - enabling cross-feature workflows
- **All consumers get the same service instances** - ensuring consistency across the system

This architecture makes the FocusedUX monorepo not just a collection of independent extensions, but a **coordinated ecosystem** where features can work together seamlessly through the orchestrator pattern.

###### END: Dependency Injection with Awilix (END) <!-- Close Fold -->

## 6. :: Package Injection Patterns & Relationships <!-- Start Fold -->

### 6.1. :: Injection Hierarchy Overview

The FocusedUX monorepo follows a strict injection hierarchy that maintains clean separation of concerns and prevents circular dependencies:

```
VSCode Extension (ext package)
    ↓
Core Package (core package)
    ↓
Shared Library (shared package)
    ↓
VSCode APIs (raw VSCode values)
```

**Key Principles:**

- **Shared packages** contain VSCode API adapters and common utilities
- **Core packages** contain business logic and depend on shared adapters
- **Extension packages** contain VSCode-specific logic and depend on both core and shared
- **No circular dependencies** are allowed between these layers

### 6.2. :: Package Injection Responsibilities

#### 6.2.1. :: Shared Package (`@fux/shared`)

**Purpose:** Provide VSCode API abstractions and common utilities
**Dependencies:** Direct VSCode API imports (`import * as vscode from 'vscode'`)
**Injection Pattern:** Self-contained, no external DI container needed

**What Shared Provides:**

- VSCode API adapters (FileSystemAdapter, WindowAdapter, etc.)
- Common utility services (ConfigurationService, CommonUtilsAdapter, etc.)
- Interface definitions for all adapters and services
- Pure utility functions and classes

**Example Shared Service:**

```typescript
// libs/shared/src/services/Configuration.service.ts
export class ConfigurationService implements IConfigurationService {
    constructor(
        private readonly fileSystem: IFileSystem,
        private readonly process: IProcess
    ) {}

    // Implementation using injected adapters
}
```

#### 6.2.2. :: Core Package (`@fux/{feature}-core`)

**Purpose:** Contain business logic and domain services
**Dependencies:** `@fux/shared` adapters and services
**Injection Pattern:** Self-contained DI container for core services

**What Core Provides:**

- Business logic services (NotesHubService, GhostWriterService, etc.)
- Domain models and interfaces
- Core functionality independent of VSCode

**Core Package DI Container - The Orchestration Hub:**

The core container serves as the **primary orchestration point** for feature functionality across the entire system. It's not just for testing - it's the central hub that:

1. **Injects core functionality into extensions:** The `ext` package uses the core container to get access to all business logic services
2. **Enables orchestrator extensions:** Future orchestrator extensions will use core containers from multiple features to coordinate cross-feature workflows
3. **Provides consistent service access:** All consumers (ext, orchestrators, tests) get the same service instances with the same dependencies
4. **Maintains architectural boundaries:** Keeps VSCode-specific logic separate from business logic

**Core Container Architecture:**

```typescript
// packages/{feature}/core/src/injection.ts
export function createCoreContainer(): AwilixContainer {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
    })

    // Register shared adapters (VSCode API abstractions)
    container.register({
        iFileSystem: asClass(FileSystemAdapter).singleton(),
        iWindow: asClass(WindowAdapter).singleton(),
        iWorkspace: asClass(WorkspaceAdapter).singleton(),
        // ... other shared adapters
    })

    // Register core business logic services
    container.register({
        iFeatureService: asFunction(
            (cradle: { iFileSystem: IFileSystem; iWindow: IWindow; iWorkspace: IWorkspace }) =>
                new FeatureService(cradle.iFileSystem, cradle.iWindow, cradle.iWorkspace)
        ).singleton(),
    })

    return container
}
```

**Core Container Usage Patterns:**

```typescript
// 1. Extension package consumption
// packages/{feature}/ext/src/injection.ts
const coreContainer = createCoreContainer()
const featureService = coreContainer.resolve('iFeatureService')

// 2. Orchestrator extension consumption (future)
// packages/orchestrator/ext/src/injection.ts
const noteHubContainer = createNoteHubCoreContainer()
const ghostWriterContainer = createGhostWriterCoreContainer()
const orchestratorService = new OrchestratorService(
    noteHubContainer.resolve('iNotesHubService'),
    ghostWriterContainer.resolve('iGhostWriterService')
)

// 3. Testing consumption
// packages/{feature}/core/__tests__/_setup.ts
const testContainer = createCoreContainer()
// Override with Mockly services for testing
```

#### 6.2.3. :: Extension Package (`@fux/{feature}-ext`)

**Purpose:** VSCode extension implementation and UI logic
**Dependencies:** `@fux/{feature}-core` and `@fux/shared`
**Injection Pattern:** Main DI container that orchestrates everything

**What Extension Provides:**

- VSCode command implementations
- UI providers and views
- Extension lifecycle management
- Integration between core logic and VSCode

### 6.3. :: Correct Injection Flow

#### 6.3.1. :: Extension Package Injection

**Pattern:** Extension packages should inject both shared adapters AND core services

```typescript
// packages/{feature}/ext/src/injection.ts
export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
    })

    // 1. Register VSCode context and Node.js primitives
    container.register({
        extensionContext: asValue(context),
        iOsHomedir: asValue(os.homedir),
        iPathJoin: asValue(path.join),
        // ... other Node.js primitives
    })

    // 2. Register shared adapters (from @fux/shared)
    container.register({
        iFileSystem: asClass(FileSystemAdapter).singleton(),
        iWindow: asClass(WindowAdapter).singleton(),
        iWorkspace: asClass(WorkspaceAdapter).singleton(),
        iPathUtils: asClass(PathUtilsAdapter).singleton(),
        iProcess: asClass(ProcessAdapter).singleton(),
        iEnv: asClass(EnvAdapter).singleton(),
        iCommands: asClass(CommandsAdapter).singleton(),
        // ... other shared adapters
    })

    // 3. Register local adapters (extension-specific)
    container.register({
        iLocalAdapter: asFunction(
            (cradle: { iFileSystem: IFileSystem }) => new LocalAdapter(cradle.iFileSystem)
        ).singleton(),
    })

    // 4. Register core services using factories (from @fux/{feature}-core)
    container.register({
        iFeatureService: asFunction(
            (cradle: {
                iFileSystem: IFileSystem
                iWindow: IWindow
                iWorkspace: IWorkspace
                iLocalAdapter: ILocalAdapter
            }) =>
                new FeatureService(
                    cradle.iFileSystem,
                    cradle.iWindow,
                    cradle.iWorkspace,
                    cradle.iLocalAdapter
                )
        ).singleton(),
    })

    // 5. Register extension-specific services
    container.register({
        iExtensionService: asFunction(
            (cradle: { iFeatureService: IFeatureService; iWindow: IWindow }) =>
                new ExtensionService(cradle.iFeatureService, cradle.iWindow)
        ).singleton(),
    })

    return container
}
```

#### 6.3.2. :: Core Package Service Construction

**Pattern:** Core services should be constructed using factories that inject shared adapters

```typescript
// packages/{feature}/core/src/services/Feature.service.ts
export class FeatureService implements IFeatureService {
    constructor(
        private readonly fileSystem: IFileSystem,
        private readonly window: IWindow,
        private readonly workspace: IWorkspace
    ) {}

    async performAction(path: string): Promise<void> {
        // Use injected adapters for VSCode operations
        const exists = await this.fileSystem.access(path)
        if (!exists) {
            await this.window.showErrorMessage(`Path not found: ${path}`)
            return
        }

        // Business logic here
        await this.workspace.fs.writeFile(path, content)
    }
}
```

#### 6.3.3. :: Core Container Integration Pattern

**The Modern Approach - Using Core Container Directly:**

Instead of manually reconstructing services in the extension, the modern pattern is to **consume the core container directly**:

```typescript
// packages/{feature}/ext/src/injection.ts
export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
    })

    // 1. Register VSCode context and Node.js primitives
    container.register({
        extensionContext: asValue(context),
        iOsHomedir: asValue(os.homedir),
        iPathJoin: asValue(path.join),
    })

    // 2. Create and integrate the core container
    const coreContainer = createCoreContainer()

    // 3. Register core services directly from the core container
    container.register({
        iFeatureService: asValue(coreContainer.resolve('iFeatureService')),
        iNotesHubService: asValue(coreContainer.resolve('iNotesHubService')),
        // ... other core services
    })

    // 4. Register extension-specific services that depend on core services
    container.register({
        iExtensionService: asFunction(
            (cradle: { iFeatureService: IFeatureService }) =>
                new ExtensionService(cradle.iFeatureService)
        ).singleton(),
    })

    return container
}
```

**Benefits of Core Container Integration:**

- **Consistency:** Same service instances across all consumers
- **Maintainability:** Single source of truth for service configuration
- **Testability:** Easy to mock by overriding core container services
- **Orchestration Ready:** Core services are immediately available for orchestrator extensions

### 6.4. :: Orchestrator Extension Pattern

#### 6.4.1. :: Orchestrator Architecture

The core container design enables a powerful **orchestrator extension pattern** where a single extension can coordinate multiple features:

```typescript
// packages/orchestrator/ext/src/injection.ts
export async function createOrchestratorContainer(
    context: ExtensionContext
): Promise<AwilixContainer> {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
    })

    // 1. Create core containers for all features
    const noteHubContainer = createNoteHubCoreContainer()
    const ghostWriterContainer = createGhostWriterCoreContainer()
    const contextCherryPickerContainer = createContextCherryPickerCoreContainer()

    // 2. Register core services from all features
    container.register({
        iNotesHubService: asValue(noteHubContainer.resolve('iNotesHubService')),
        iGhostWriterService: asValue(ghostWriterContainer.resolve('iGhostWriterService')),
        iContextCherryPickerService: asValue(
            contextCherryPickerContainer.resolve('iContextCherryPickerService')
        ),
    })

    // 3. Register orchestrator services that coordinate multiple features
    container.register({
        iWorkflowOrchestrator: asFunction(
            (cradle: {
                iNotesHubService: INotesHubService
                iGhostWriterService: IGhostWriterService
                iContextCherryPickerService: IContextCherryPickerService
            }) =>
                new WorkflowOrchestrator(
                    cradle.iNotesHubService,
                    cradle.iGhostWriterService,
                    cradle.iContextCherryPickerService
                )
        ).singleton(),
    })

    return container
}
```

**Orchestrator Service Example:**

```typescript
// packages/orchestrator/ext/src/services/WorkflowOrchestrator.service.ts
export class WorkflowOrchestrator {
    constructor(
        private readonly notesHub: INotesHubService,
        private readonly ghostWriter: IGhostWriterService,
        private readonly contextCherryPicker: IContextCherryPickerService
    ) {}

    async executeNoteWritingWorkflow(notePath: string, context: string): Promise<void> {
        // 1. Use Note Hub to get note content
        const note = await this.notesHub.getNote(notePath)

        // 2. Use Context Cherry Picker to analyze context
        const contextAnalysis = await this.contextCherryPicker.analyzeContext(context)

        // 3. Use Ghost Writer to enhance the note
        await this.ghostWriter.enhanceNote(note, contextAnalysis)

        // 4. Save back to Note Hub
        await this.notesHub.saveNote(note)
    }
}
```

**Benefits of Orchestrator Pattern:**

- **Cross-Feature Coordination:** Single extension can orchestrate complex workflows across multiple features
- **Reusable Core Logic:** Core services are consumed without modification
- **Consistent Architecture:** Same DI patterns across all packages
- **Scalable Design:** Easy to add new features to orchestrator workflows

### 6.5. :: What Went Wrong & How to Fix It

#### 6.5.1. :: Previous Injection Problems

**Problem 1: Missing Shared Adapter Injection**

- **Symptom:** Core services couldn't access VSCode APIs
- **Root Cause:** Core packages weren't injecting shared adapters
- **Solution:** Always inject shared adapters into core services

**Problem 2: Circular Dependencies**

- **Symptom:** `AwilixResolutionError` or import loops
- **Root Cause:** Packages trying to import from each other
- **Solution:** Maintain strict hierarchy: shared → core → ext

**Problem 3: Manual Service Construction**

- **Symptom:** Services created outside DI container
- **Root Cause:** Not using factory functions for complex dependencies
- **Solution:** Use `asFunction` with proper dependency injection

**Problem 4: Missing Interface Imports**

- **Symptom:** TypeScript errors about missing types
- **Root Cause:** Not importing interfaces from core packages
- **Solution:** Import all required interfaces and use factory functions

#### 6.5.2. :: Correct Injection Patterns

**✅ DO:**

- Inject shared adapters into core services
- Use factory functions (`asFunction`) for complex dependencies
- Register all services in the DI container
- Import interfaces from core packages
- Use singleton registration for most services

**❌ DON'T:**

- Create services outside the DI container
- Skip dependency injection for complex services
- Import VSCode values directly in core packages
- Create circular dependencies between packages
- Assume adapters exist without checking exports

### 6.5. :: Testing Injection Patterns

#### 6.5.0. :: 🚨 CRITICAL TESTING ARCHITECTURE RULE 🚨

**Core packages should NEVER import from @fux/shared during tests. EVER.**

This is a fundamental architectural rule that prevents circular dependency issues and ensures proper test isolation. When testing core packages:

- ❌ **NO imports from @fux/shared**
- ❌ **NO shared library involvement**
- ❌ **NO shared adapter imports**
- ✅ **ONLY Mockly shims injected through DI**
- ✅ **ONLY Mockly services for all dependencies**

**Why This Rule Exists:**

1. **Shared packages import VSCode** - They need VSCode to create adapters
2. **Core packages import shared types** - They need interfaces for type safety
3. **Tests don't have VSCode** - VSCode isn't available in test environments
4. **Importing shared during tests** - Causes VSCode import failures

**The Solution:**

- **Shared packages** test their adapters by mocking VSCode directly with `vi.mock('vscode')`
- **Core packages** test business logic by injecting Mockly shims directly (no shared imports)
- **Extension packages** test integration using DI containers with Mockly shims

#### 6.5.0.1. :: 🚨 WHY NOT HARD-CODED MOCKS? 🚨

**The Problem with Hard-Coded Mocks:**

When you create hard-coded mocks like this:

```typescript
// ❌ WRONG - Hard-coded mocks
vi.mock('@fux/shared', () => ({
    TreeItemAdapter: {
        create: vi.fn().mockReturnValue({
            /* hard-coded object */
        }),
    },
    UriAdapter: {
        file: vi.fn().mockReturnValue({
            /* hard-coded object */
        }),
    },
}))
```

**What Happens:**

1. **You're reinventing the wheel** - Mockly already provides comprehensive VSCode API mocks
2. **Your mocks become stale** - They don't match the real adapter behavior
3. **Tests become brittle** - Hard-coded values break when adapters change
4. **You're still importing shared** - Even though you're mocking it, the import still happens

**The Right Approach - Use Mockly:**

```typescript
// ✅ CORRECT - Use Mockly shims
import { mockly, mocklyService } from '@fux/mockly'

// Mockly provides real VSCode API mocks that adapters can use
const service = new FeatureService(
    mockly.workspace.fs, // Real file system mock
    mockly.window, // Real window mock
    mockly.workspace, // Real workspace mock
    mockly.commands, // Real commands mock
    mockly.node.path // Real path utilities mock
)
```

**Why Mockly is Better:**

1. **Comprehensive coverage** - Mockly mocks ALL VSCode APIs, not just what you think you need
2. **Realistic behavior** - Mockly mocks behave like real VSCode APIs
3. **Maintained** - Mockly is kept up-to-date with VSCode API changes
4. **Consistent** - All packages use the same mock implementations
5. **No shared imports** - Tests never see the shared library

**The Golden Rule:**

> **"If you're mocking @fux/shared, you're doing it wrong. Use Mockly instead."**
>
> - Mockly = ✅ Correct approach
> - Hard-coded mocks = ❌ Wrong approach
> - Importing shared during tests = ❌ Never do this

#### 6.5.1. :: Unit Testing Core Services

> ⚠️ **CRITICAL WARNING** ⚠️
>
> **Core packages MUST NEVER import from @fux/shared during tests.**
>
> - Use Mockly shims ONLY
> - NO shared library imports
> - NO shared adapter imports
> - Tests should be completely isolated from shared

**Pattern:** Test core services with Mockly shims for shared adapters

```typescript
// packages/{feature}/core/__tests__/Feature.service.test.ts
import { mockly, mocklyService } from '@fux/mockly'
import { FeatureService } from '../src/services/Feature.service.js'

describe('FeatureService', () => {
    let service: FeatureService

    beforeEach(() => {
        mocklyService.reset()
        // Core services can use Mockly since shared adapters are abstractions
        // that Mockly already mocks - no need to reinvent the wheel
        service = new FeatureService(
            mockly.workspace.fs, // Mockly's mocked file system
            mockly.window, // Mockly's mocked window
            mockly.workspace // Mockly's mocked workspace
        )
    })

    it('should handle file not found', async () => {
        // Mockly provides realistic VSCode-like behavior
        mockly.workspace.fs.access = vi.fn().mockRejectedValue(new Error('Not found'))

        await service.performAction('/nonexistent')

        expect(mockly.window.showErrorMessage).toHaveBeenCalledWith('Path not found: /nonexistent')
    })

    it('should process file successfully', async () => {
        // Mockly adapters provide the same interface as real shared adapters
        mockly.workspace.fs.access = vi.fn().mockResolvedValue(undefined)
        mockly.workspace.fs.readFile = vi.fn().mockResolvedValue('file content')
        mockly.workspace.fs.writeFile = vi.fn().mockResolvedValue(undefined)

        await service.performAction('/test/path')

        expect(mockly.workspace.fs.writeFile).toHaveBeenCalledWith('/test/path', expect.any(String))
    })
})
```

**Why Mockly for Core Services:**

- **Shared adapters are abstractions** of VSCode values that Mockly already mocks
- **No need to reinvent** the wheel with custom mocks
- **Mockly provides realistic behavior** that matches the shared adapter interfaces
- **Consistent testing approach** across all package types
- **Better test isolation** and maintainability

#### 6.5.2. :: Integration Testing Extensions

**Pattern:** Test extensions with DI container and Mockly shims

```typescript
// packages/{feature}/ext/__tests__/integration/Feature.integration.test.ts
describe('Feature Integration', () => {
    let container: AwilixContainer
    let mocklyService: IMocklyService

    beforeEach(async () => {
        container = await createDIContainer(mockContext)
        mocklyService = container.resolve<IMocklyService>('mocklyService')
        mocklyService.reset()
    })

    it('should complete full workflow', async () => {
        const featureService = container.resolve('iFeatureService')
        // Test integration...
    })
})
```

#### 6.5.3. :: 🚨 TROUBLESHOOTING: "NO SHARED DURING TESTS" VIOLATIONS 🚨

**When You See These Errors, You're Violating the "No Shared During Tests" Rule:**

##### 6.5.3.1. :: VSCode Import Errors

**Symptoms:**

```
Error: Cannot find package 'vscode' imported from 'libs/shared/dist/vscode/adapters/Window.adapter.js'
```

**Root Cause:** Your test is importing from `@fux/shared`, which contains VSCode value imports. The shared library is being loaded during tests.

**The Fix:**

1. **Remove ALL imports from @fux/shared in test files**
2. **Use Mockly shims instead**
3. **Ensure your DI container only contains Mockly services**

##### 6.5.3.2. :: Module Resolution Failures

**Symptoms:**

```
Module not found: Can't resolve '@fux/shared' in 'packages/note-hub/core/__tests__/...'
```

**Root Cause:** Your test is trying to import from shared, but the test environment doesn't have access to it.

**The Fix:**

1. **Don't import from shared in tests**
2. **Use Mockly for all dependencies**
3. **Create test-specific DI containers**

##### 6.5.3.3. :: Circular Dependency Warnings

**Symptoms:**

```
Circular dependency detected: packages/note-hub/core -> libs/shared -> packages/note-hub/core
```

**Root Cause:** Core package tests are importing from shared, creating a dependency loop.

**The Fix:**

1. **Break the cycle by removing shared imports**
2. **Use Mockly for all test dependencies**
3. **Ensure tests are completely isolated**

##### 6.5.3.4. :: Test Environment Crashes

**Symptoms:**

```
TypeError: Cannot read properties of undefined (reading 'workspace')
```

**Root Cause:** Test is trying to access VSCode APIs that aren't available in the test environment.

**The Fix:**

1. **Mock VSCode at the module level**
2. **Use Mockly for all VSCode API access**
3. **Never import shared adapters in tests**

**The Complete Fix Pattern:**

```typescript
// ❌ WRONG - This will cause VSCode import failures
import { TreeItemAdapter } from '@fux/shared'

// ✅ CORRECT - Use Mockly directly
import { mockly } from '@fux/mockly'

// ❌ WRONG - Hard-coded mocks
vi.mock('@fux/shared', () => ({
    /* mocks */
}))

// ✅ CORRECT - Mock VSCode, use Mockly for services
vi.mock('vscode', () => ({
    /* VSCode mocks */
}))

// ❌ WRONG - Importing shared in tests
const adapter = new TreeItemAdapter()

// ✅ CORRECT - Use Mockly shims
const service = new FeatureService(mockly.workspace.fs, mockly.window)
```

### 6.6. :: Testing Troubleshooting Guide

**When You See These Errors, You're Violating the "No Shared During Tests" Rule:**

1. **VSCode Import Errors:**

    ```
    Error: Cannot find package 'vscode' imported from 'libs/shared/dist/...'
    ```

2. **Module Resolution Failures:**

    ```
    Error: Cannot resolve module '@fux/shared' in test environment
    ```

3. **Circular Dependency Warnings:**

    ```
    Warning: Circular dependency detected
    ```

4. **Test Environment Crashes:**
    ```
    TypeError: Cannot read properties of undefined (reading 'workspace')
    ```

**Root Cause:**

- Shared library imports VSCode APIs
- Tests don't have VSCode available
- Importing shared during tests tries to resolve VSCode
- This causes the test environment to fail

**The Fix:**

- Remove ALL shared imports from test files
- Use Mockly shims for all dependencies
- Ensure test setup provides Mockly services through DI
- Verify no shared library code is executed during tests

### 6.7. :: Migration Checklist

When fixing injection patterns in existing packages:

- [ ] **Audit Dependencies:** Ensure no circular imports between packages
- [ ] **Inject Shared Adapters:** All core services should use shared adapters
- [ ] **Use Factory Functions:** Complex services should use `asFunction` registration
- [ ] **Remove Shared Imports from Tests:** Ensure NO @fux/shared imports in test files
- [ ] **Use Mockly in Test Setup:** All test dependencies should come from Mockly
- [ ] **Verify Test Isolation:** Tests should not execute any shared library code
- [ ] **Register Everything:** All services must be in the DI container
- [ ] **Import Interfaces:** Use proper interface imports from core packages
- [ ] **Test Integration:** Verify DI container resolves all dependencies
- [ ] **Remove Manual Construction:** No services created outside container
- [ ] **Validate Hierarchy:** Confirm shared → core → ext dependency flow

### 6.7. :: Troubleshooting VSCode Import Errors in Tests

**Error:** `Cannot find package 'vscode' imported from '.../shared/src/vscode/adapters/Window.adapter.ts'`

**Root Cause:** You're importing from `@fux/shared` during tests, but shared packages need VSCode to be available.

**Solutions:**

1. **For Core Package Tests:**

    ```typescript
    // ❌ WRONG - Don't import from shared during tests
    import { WindowAdapter } from '@fux/shared'

    // ✅ CORRECT - Use Mockly shims directly
    import { mockly } from '@fux/mockly'
    const service = new FeatureService(mockly.window, mockly.workspace)
    ```

2. **For Extension Package Tests:**

    ```typescript
    // ❌ WRONG - Don't import from shared during tests
    import { WindowAdapter } from '@fux/shared'

    // ✅ CORRECT - Use DI container with Mockly shims
    const container = await createDIContainer(mockContext)
    const service = container.resolve('iFeatureService')
    ```

3. **Check Your Vitest Config:**

    ```typescript
    // ❌ WRONG - Don't alias vscode to test-adapter in core packages
    resolve: {
        alias: {
            'vscode': path.resolve(__dirname, '../../vscode-test-adapter.ts'),
        }
    }

    // ✅ CORRECT - Only alias shared and mockly
    resolve: {
        alias: {
            '@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
            '@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
        }
    }
    ```

**Remember:** The `vscode-test-adapter.ts` is ONLY for shared package tests and should be located within the shared package itself (`libs/shared/vscode-test-adapter.ts`). Core and extension packages should use Mockly directly.

### 6.7. :: Common Injection Scenarios

#### 6.7.1. :: File System Operations

**Pattern:** Core services inject FileSystemAdapter for file operations

```typescript
// Core service
export class FileProcessorService {
    constructor(private readonly fileSystem: IFileSystem) {}

    async processFile(path: string): Promise<void> {
        const content = await this.fileSystem.readFile(path)
        // Process content...
        await this.fileSystem.writeFile(path, processedContent)
    }
}

// Extension injection
container.register({
    iFileProcessor: asFunction(
        (cradle: { iFileSystem: IFileSystem }) => new FileProcessorService(cradle.iFileSystem)
    ).singleton(),
})
```

#### 6.7.2. :: User Interface Operations

**Pattern:** Core services inject WindowAdapter for user interactions

```typescript
// Core service
export class UserInteractionService {
    constructor(private readonly window: IWindow) {}

    async confirmAction(message: string): Promise<boolean> {
        const choice = await this.window.showInformationMessage(message, 'Yes', 'No')
        return choice === 'Yes'
    }
}

// Extension injection
container.register({
    iUserInteraction: asFunction(
        (cradle: { iWindow: IWindow }) => new UserInteractionService(cradle.iWindow)
    ).singleton(),
})
```

#### 6.7.3. :: Workspace Operations

**Pattern:** Core services inject WorkspaceAdapter for workspace operations

```typescript
// Core service
export class WorkspaceManagerService {
    constructor(private readonly workspace: IWorkspace) {}

    async getWorkspaceFolders(): Promise<string[]> {
        const folders = await this.workspace.workspaceFolders
        return folders.map((folder) => folder.uri.fsPath)
    }
}

// Extension injection
container.register({
    iWorkspaceManager: asFunction(
        (cradle: { iWorkspace: IWorkspace }) => new WorkspaceManagerService(cradle.iWorkspace)
    ).singleton(),
})
```

### 6.8. :: VSCode Test Adapter Ownership

**Important:** The `vscode-test-adapter.ts` file belongs exclusively to the shared package and should not be referenced by other packages.

#### 6.8.1. :: Correct Location

```typescript
// ✅ CORRECT - vscode-test-adapter.ts is inside the shared package
libs/shared/
├── src/
├── __tests__/
├── vscode-test-adapter.ts  // ← This file belongs here
├── vitest.functional.config.ts
└── vitest.coverage.config.ts
```

#### 6.8.2. :: Shared Package Configuration

The shared package's vitest config should reference the adapter locally:

```typescript
// libs/shared/vitest.functional.config.ts
export default defineConfig({
    resolve: {
        alias: {
            vscode: path.resolve(__dirname, './vscode-test-adapter.ts'),
        },
    },
})
```

#### 6.8.3. :: Other Packages Must NOT Reference It

**Core and Extension Packages:**

```typescript
// ❌ WRONG - Don't reference the shared package's test adapter
resolve: {
    alias: {
        'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
    }
}

// ✅ CORRECT - Only alias shared and mockly
resolve: {
    alias: {
        '@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
        '@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
    }
}
```

#### 6.8.4. :: Why This Architecture?

1. **Encapsulation:** Shared package contains everything it needs for testing
2. **Ownership:** Clear ownership of the test adapter
3. **No Cross-Package Dependencies:** Other packages don't depend on shared's test utilities
4. **Consistency:** Follows the established pattern of package self-containment

#### 6.8.5. :: Migration Steps

If you currently have `vscode-test-adapter.ts` at the workspace root:

1. **Move the file** to `libs/shared/vscode-test-adapter.ts`
2. **Update shared package vitest configs** to reference it locally
3. **Remove any references** from other package vitest configs
4. **Delete the root-level file** after confirming shared tests still work

###### END: Package Injection Patterns & Relationships (END) <!-- Close Fold -->

## 7. :: Packaging Script <!-- Start Fold -->

### 6.1. :: Role

The role of the packaging script is to create a self-contained VSIX with a clean, production-only `node_modules` folder. It **MUST NOT** bundle third-party dependencies into the `extension.cjs`.

### 6.2. :: Responsibilities

1. **Clean and Prepare:** It creates a temporary deployment directory.
2. **Copy Artifacts:** It copies the necessary project files (`dist`, `assets`, `README.md`, etc.) into the deployment directory.
3. **Prepare `package.json`:** It copies the original `package.json`, removes the `dependencies` and `devDependencies` properties, and updates the `version` for dev builds. This is crucial because `vsce` uses this file for metadata, but we don't want it to run an `install` step.
4. **Resolve Dependency Tree:** It runs `pnpm list --prod --json --depth=Infinity` on the original extension package to get a complete, structured list of all production dependencies and their exact locations on disk.
5. **Manually Construct `node_modules`:** It recursively walks the resolved dependency tree and physically copies each required package from its source location (usually the monorepo's central `.pnpm` store) into the deployment directory's `node_modules` folder. This creates a flat, physical `node_modules` structure that is compatible with `vsce`.
6. **Filter Workspace Packages:** It automatically skips workspace packages (those with `link:` versions) since they are not needed in the final VSIX.
7. **Copy Nested Dependencies:** It recursively copies all nested dependencies to ensure complete dependency resolution (e.g., `awilix` requires `camel-case` and `fast-glob`).
8. **Package VSIX:** It runs `vsce package` on the deployment directory to create the final VSIX file. The `--no-dependencies` flag **MUST** be used to prevent `vsce` from running its own dependency checks, which would fail against the manually constructed `node_modules` folder.

### 6.3. :: Package Script Configuration

**Package Script (`scripts/create-vsix.js`):**

- Must exclude build-only dependencies from production bundle
- Should only include runtime dependencies in the final VSIX
- Use `pnpm list --prod --json --depth=Infinity` to get production dependencies only
- Ensure `devDependencies` are not included in the final package

###### END: Packaging Script (END) <!-- Close Fold -->

## 8. :: Common Build Issues <!-- Start Fold -->

### 7.1. :: TypeScript Declaration Errors

Ensure core packages have `declaration: true` and `declarationMap: true` in `tsconfig.lib.json`.

### 7.2. :: Bundle Size Issues

Check for unnecessary dependencies (like TypeScript AST usage) and consider individual exports.

### 7.3. :: Import Resolution Errors

Verify `tsconfig.json` has proper `references` and `emitDeclarationOnly: true`.

### 7.4. :: Inconsistent tsconfig.json

Leads to subtle build and type errors—keep them aligned.

### 7.5. :: Missing Path Mappings

When TypeScript reports "File not found" errors for source directories, check that all `@fux/*` packages have proper path mappings in `tsconfig.base.json` and that `libs/shared/tsconfig.lib.json` includes explicit path overrides.

### 7.6. :: Path Sanitization Issues

The `PathUtilsAdapter.santizePath()` method is designed for filenames only, not full file paths. Always sanitize individual components before joining paths to avoid drive letter corruption.

### 7.7. :: TypeScript Configuration Troubleshooting

#### 7.7.1. :: "File not found" Errors for Source Directories

**Problem:** The TypeScript language server in VS Code reports errors like:

```
File 'd:/path/to/project/libs/shared/src' not found.
```

**Root Cause:** Incorrect or polluted `paths` alias configuration in the TypeScript composite project setup. Placing `paths` in the root `tsconfig.base.json` causes all projects to inherit all paths, leading to resolution errors for projects that do not have a direct dependency on those paths.

**Solution:**

1. **Remove `paths` from `tsconfig.base.json`:** The `compilerOptions.paths` property **MUST** be removed from the root `tsconfig.base.json` file to prevent path pollution.

2. **Define `paths` in the Root `tsconfig.json`:** Add all workspace path aliases to the `compilerOptions.paths` property in the **root `tsconfig.json`** file. This provides a global mapping for the IDE and tooling without affecting individual project builds.

    ```json
    // In the root tsconfig.json
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["libs/shared/src"],
            "@fux/ghost-writer-core": ["packages/ghost-writer/core/src"],
            // ... all other packages
        }
    }
    ```

3. **Define Relative `paths` in Library `tsconfig.lib.json`:** For each `core` or `shared` library, its `tsconfig.lib.json` **MUST** define a `paths` property that maps only its direct workspace dependencies using the correct **relative paths**.

    ```json
    // In packages/my-feature/core/tsconfig.lib.json, which depends on @fux/shared
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared/src"]
        }
    }
    ```

**Verification:** After making these changes, restart the VS Code TypeScript server to ensure the errors are resolved. The workspace audit script (`scripts/audit-feature-structure.ts`) also validates this configuration.

#### 7.7.2. :: Path Mapping Best Practices

- **Base Config:** Use absolute paths from workspace root in `tsconfig.base.json`
- **Package Config:** Use relative paths in individual package `tsconfig.lib.json` files
- **Consistency:** Ensure all `@fux/*` packages referenced in imports have corresponding path mappings
- **Validation:** Always test TypeScript compilation after adding new packages or changing path mappings

### 7.8. :: Performance Optimization

- **Bundle Size:** Use individual exports, externalize heavy dependencies, and enable tree-shaking
- **Build Time:** Leverage Nx caching and proper dependency ordering with `dependsOn: ["^build"]`
- **Type Safety:** Ensure proper TypeScript configuration for declaration generation
- **Dependency Hygiene:** No unused or duplicate dependencies in any package

### 7.9. :: Webview State Management

- **Directive:** When updating the state of a VS Code webview, a targeted `postMessage` approach **SHOULD** be preferred over replacing the entire HTML content.
- **Pattern:**
    1. The extension host sends a message to the webview containing only the data that has changed (e.g., `{ command: 'settingUpdated', settingId: '...', value: '...' }`).
    2. A script within the webview listens for these messages and performs the necessary, specific DOM manipulations to reflect the new state.
- **Rationale:** This pattern is more performant as it avoids a full re-parse and re-render of the webview's HTML. It is also more reliable and less prone to race conditions or content-flashing artifacts that can occur with full HTML replacement.

###### END: Common Build Issues (END) <!-- Close Fold -->

## 9. :: Package Generators <!-- Start Fold -->

The workspace includes Nx generators for creating new packages with the correct configuration from the start.

### 8.1. :: Available Generators

- **`./generators:shared`**: Creates shared library packages (utilities, common services)
- **`./generators:core`**: Creates core library packages (business logic for features)
- **`./generators:ext`**: Creates VSCode extension packages (UI and VSCode-specific implementation)

### 8.2. :: Generator Usage

**Creating a shared package:**

```bash
nx g ./generators:shared --name=utilities --description="Common utilities and services"
```

**Creating a core package:**

```bash
nx g ./generators:core --name=my-feature --description="My feature core functionality" --directory=packages/my-feature
```

**Creating an extension package:**

```bash
nx g ./generators:ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature --directory=packages/my-feature
```

### 8.3. :: Complete Feature Creation Workflow

**Creating a complete feature with both core and extension packages:**

1. **Create the core package:**

    ```bash
    nx g ./generators:core --name=my-feature --description="My feature core functionality" --directory=packages/my-feature
    ```

2. **Create the extension package:**

    ```bash
    nx g ./generators:ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature --directory=packages/my-feature
    ```

3. **Build both packages:**

    ```bash
    nx run @fux/my-feature-core:build
    nx run @fux/my-feature-ext:build
    ```

4. **Package the extension for development:**

    ```bash
    nx run @fux/my-feature-ext:package:dev
    ```

5. **Package the extension for production:**
    ```bash
    nx run @fux/my-feature-ext:package
    ```

### 8.4. :: Generator Features

- **Automatic Configuration**: Uses global targets from `nx.json`
- **Workspace Integration**: Automatically updates `pnpm-workspace.yaml` and Nx configuration
- **Best Practices**: Individual exports, proper TypeScript configuration, optimized bundle sizes
- **Extension-Specific**: VSCode manifest, DI container setup, command registration

### 8.5. :: Generator Benefits

- **Consistency**: All packages follow the same proven configuration
- **Performance**: Optimized bundle sizes and build times
- **Maintainability**: Uses global targets for easy updates
- **Type Safety**: Proper TypeScript declaration generation
- **Tree-shaking**: Individual exports enable better optimization

For detailed generator documentation, see `generators/README.md`.

###### END: Package Generators (END) <!-- Close Fold -->

## 9. :: Build Commands Reference <!-- Start Fold -->

### 9.1. :: Individual Package Commands

```bash
# Build a core package
nx build @fux/ghost-writer-core

# Build an extension package
nx build @fux/ghost-writer-ext

# Build with production configuration
nx build @fux/ghost-writer-ext --configuration=production
```

### 9.2. :: Batch Commands

```bash
# Build all packages
nx run-many --target=build --all

# Build all extension packages
nx run-many --target=build --projects=@fux/*-ext

# Build all core packages
nx run-many --target=build --projects=@fux/*-core
```

### 9.3. :: Packaging Commands

```bash
# Create development package
nx run @fux/ghost-writer-ext:package:dev

# Create production package
nx run @fux/ghost-writer-ext:package
```

### 9.4. :: Clean Commands

```bash
# Clean cache for a specific project
nx run @fux/ghost-writer-ext:clean:cache

# Clean dist for a specific project
nx run @fux/ghost-writer-ext:clean:dist

# Clean both cache and dist
nx run @fux/ghost-writer-ext:clean
```

###### END: Build Commands Reference (END) <!-- Close Fold -->

## 10. :: Common Pitfalls & Lessons Learned <!-- Start Fold -->

### 10.1. :: Package.json Module Type Mismatch

**Problem:** TypeScript compilation shows warning: `"Package type is set to "module" but "cjs" format is included. Going to use "esm" format instead."`

**Root Cause:** Mismatch between `package.json` configuration and build output format:

- `package.json` has `"type": "module"` (indicating ESM)
- Build configuration uses `"format": ["cjs"]` (producing CommonJS)

**Solution:** Remove `"type": "module"` from `package.json` for VS Code extension packages that use CommonJS build format.

**Affected Packages:** All extension packages that use `@nx/esbuild:esbuild` with `"format": ["cjs"]`:

- `packages/project-butler/ext/package.json`
- `packages/context-cherry-picker/ext/package.json`
- `packages/note-hub/ext/package.json`
- `packages/ghost-writer/ext/package.json`
- `packages/dynamicons/ext/package.json`
- `packages/ai-agent-interactor/ext/package.json`

**Prevention:** When creating new extension packages, ensure `package.json` doesn't include `"type": "module"` if the build configuration uses CommonJS format.

### 10.2. :: Unused Variables Best Practice

**Problem:** ESLint errors like `'line' is defined but never used. Allowed unused args must match /^_/u`

**Root Cause:** Function parameters or variables that are declared but never used

**Solution:** Prefix unused variables with `_` to indicate they are intentionally unused:

```typescript
// ❌ Wrong - causes ESLint error
function processData(data: string, line: number) {
    console.log(data)
    // line is never used
}

// ✅ Correct - ESLint compliant
function processData(data: string, _line: number) {
    console.log(data)
    // _line is intentionally unused
}
```

**Best Practices:**

- **Function Parameters:** Prefix with `_` if the parameter is required by the interface but not used in implementation
- **Variables:** Prefix with `_` if declared but intentionally unused
- **Consistency:** Always use `_` prefix, never remove parameters that are part of a required interface
- **Documentation:** Consider adding a comment explaining why the parameter is unused if it's not obvious

**Common Scenarios:**

- Adapter implementations where interface requires parameters you don't need
- Event handlers where you only need some parameters
- Callback functions where you only use specific arguments

### 10.3. :: TypeScript Import Errors

**Problem:** TypeScript errors like `'"@fux/shared"' has no exported member named 'ExtensionContext'`

**Root Cause:** Importing VS Code types from `@fux/shared` instead of directly from `vscode`

**Solution:** Import VS Code types directly from `vscode`:

```typescript
// ❌ Wrong
import type { ExtensionContext, Disposable, Uri } from '@fux/shared'

// ✅ Correct
import type { ExtensionContext, Disposable, Uri } from 'vscode'
```

**Common Types to Import from vscode:**

- `ExtensionContext`
- `Disposable`
- `Uri`
- `TreeView`
- `TreeDataProvider`
- `TreeItem`
- `TreeItemCollapsibleState`
- `ProgressLocation`

### 10.4. :: Container Scope Issues

**Problem:** `Cannot find name 'container'` in catch blocks or other scopes

**Root Cause:** Container variable declared inside try block but accessed in catch block

**Solution:** Declare container variable outside try block:

```typescript
let container: any = null

try {
    container = await createDIContainer(context)
    // ... rest of code
} catch (error) {
    if (container) {
        // Safe to use container here
    }
}
```

### 10.5. :: Extraneous Dependencies Problem

**Issue:** After fixing TypeScript errors, the packaging process fails with extraneous dependencies errors.

**Root Cause:**

- Build-only dependencies (e.g., `puppeteer`, `sharp`, `svgo`, `tsx`) were incorrectly placed in `dependencies` instead of `devDependencies`
- These dependencies are used only during asset generation and build scripts, not at runtime
- When the extension package depends on the core package, these build dependencies get pulled in as production dependencies

**Solution:**

- Move all build-only dependencies to `devDependencies` in both core and extension packages
- Ensure only runtime dependencies remain in `dependencies`

### 10.6. :: Node.js Module Import Issues

**Issue:** Direct Node.js module imports in extension code cause packaging failures.

**Root Cause:**

- VSCode extensions should not include Node.js built-in modules as dependencies
- Direct imports of `node:fs`, `node:path`, etc. cause these modules to be bundled

**Solution:**

- Use VSCode's built-in file system API through workspace adapters
- Create proper abstractions that use shared module adapters instead of direct Node.js imports

### **VSCode Type Version Management**

- **Type Imports Are Safe:** `import type { ExtensionContext, Uri } from 'vscode'` is completely safe and won't cause hoisting issues
- **Value Imports Are Problematic:** `import * as vscode from 'vscode'` or `import { ExtensionContext } from 'vscode'` cause hoisting and bundling issues
- **Auditor Enforcement:** The structure auditor only flags value imports, not type imports, because type imports are removed at runtime
- **Best Practice:** Use type imports for VSCode types when you need them, but prefer shared adapters for runtime functionality

###### END: Common Pitfalls & Lessons Learned (END) <!-- Close Fold -->

## 11. :: Migration Checklist <!-- Start Fold -->

When migrating existing code to SOP v3:

- [ ] Move build-only dependencies to `devDependencies`
- [ ] Ensure all adapters are in shared package
- [ ] Remove direct VSCode value imports
- [ ] Update TypeScript configurations
- [ ] Verify build target configurations
- [ ] Test packaging process
- [ ] Run full validation chain
- [ ] Update documentation
- [ ] Implement universal targets
- [ ] Verify structure auditor compliance

###### END: Migration Checklist (END) <!-- Close Fold -->

## 12. :: Nx Workspace Maintenance & Best Practices <!-- Start Fold -->

All contributors must follow the Nx optimizations and best practices outlined in [docs/Nx_Optimizations.md](./Nx_Optimizations.md). This document covers:

- DRY global build targets for all packages
- Smart caching and named inputs
- Efficient asset management
- Use of Nx affected commands in CI
- Regular Nx upgrades and cache maintenance
- Dependency visualization and documentation

**Always consult the Nx_Optimizations.md file before making changes to build targets, project structure, or CI workflows.**

###### END: Nx Workspace Maintenance & Best Practices (END) <!-- Close Fold -->
