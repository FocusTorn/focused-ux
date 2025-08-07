# SOP: FocusedUX New Mono-Extension

## 1. :: Project Overview <!-- Start Fold -->

The **Focused-UX (F-UX)** project is a monorepo designed to produce a suite of VS Code extensions. The architecture follows a modular approach where each feature is developed as a self-contained, installable VS Code extension through a `core`/`ext` package pair.

### 1.1. :: Current Package Structure

The workspace contains the following packages:

**Shared Libraries:**

- `@fux/libs/shared` - Common services and utilities

**Feature Packages:**

- `@fux/ghost-writer-core` & `@fux/ghost-writer-ext`
- `@fux/context-cherry-picker-core` & `@fux/context-cherry-picker-ext`
- `@fux/dynamicons-core` & `@fux/dynamicons-ext`
- `@fux/note-hub-core` & `@fux/note-hub-ext`
- `@fux/project-butler-core` & `@fux/project-butler-ext`
- `@fux/ai-agent-interactor-core` & `@fux/ai-agent-interactor-ext`

###### END: Project Overview (END) <!-- Close Fold -->

## 2. :: Package Archetypes <!-- Start Fold -->

The monorepo consists of three primary package archetypes, each with a distinct purpose and configuration.

- **`shared` (Library):** Located in `libs/shared/`, contains shared services and abstractions (e.g., file utilities, VS Code API wrappers) intended for runtime use by other packages.
- **`core` (Library):** Located in `packages/{feature}/core/`, contains a feature's abstract business logic. It is built to be tree-shakeable and is consumed by `ext` packages.
- **`ext` (Application):** Located in `packages/{feature}/ext/`, contains the VSCode extension implementation. It depends on a `core` package and is bundled into a final, executable artifact.

---

###### END: Package Archetypes (END) <!-- Close Fold -->

## 2.1. :: Package Structure Decision Tree <!-- Start Fold -->

When creating a new package, use the following decision tree to determine the appropriate structure:

### Decision Tree

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

### Package Type Examples

**VS Code Extensions (core/ext pattern):**

- `packages/ghost-writer-core` + `packages/ghost-writer-ext`
- `packages/dynamicons-core` + `packages/dynamicons-ext`
- `packages/context-cherry-picker-core` + `packages/context-cherry-picker-ext`

**Shared Libraries (shared pattern):**

- `libs/shared` - Common services and VS Code adapters

**Standalone Tools (tool pattern):**

- `libs/tools/structure-auditor` - Runs with `tsx src/main.ts`
- `libs/tools/cursor-memory-optimizer` - Runs with `tsx src/index.ts`
- `libs/tools/prune-nx-cache` - Utility scripts

### Tool Pattern Configuration

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
        },
        "lint": {
            "executor": "@nx/eslint:lint"
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

**Key Differences from Library Pattern:**

- No build step required (runs directly with tsx)
- Runtime dependencies in `dependencies`, build tools in `devDependencies`
- No declaration generation
- Uses `nx:run-commands` executor for execution
- No `tsconfig.lib.json` or `tsconfig.spec.json`

###### END: Package Structure Decision Tree (END) <!-- Close Fold -->

## 3. :: Key Configuration Principles <!-- Start Fold -->

### 3.1. :: Dependency Flow

- **`core`:** MUST only have production `dependencies` on other `core` or `shared` packages. It MAY have `devDependencies` on development tools.
- **`ext`:** MUST depend on its corresponding `core` package as a production `dependency`. It MAY depend on `shared` packages as `dependencies`.
- **`shared`:** This package SHOULD have minimal dependencies and MUST NOT depend on any `core` or `ext` packages to avoid circular dependencies.

### 3.2. :: Workspace (`pnpm-workspace.yaml`)

- All new packages, regardless of type, MUST be included in the `packages` list in the root `pnpm-workspace.yaml` file.

### 3.3. :: `core` & `shared` Packages (Libraries)

- **Purpose:** To be consumed as a library.
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: false` for its `build` target. This executor efficiently handles TypeScript transpilation and generates declaration files (`.d.ts`).
- **`project.json`:** MUST use the global `build:core` target defined in `nx.json`:
    ```json
    {
        "build": {
            "extends": "build:core"
        }
    }
    ```
- **`tsconfig.lib.json`:** MUST include:
    - `"emitDeclarationOnly": true` to generate only type declarations
    - `"declaration": true` and `"declarationMap": true` for proper type support
    - `"rootDir": "src"` to ensure a clean output structure
- **`package.json`:**
    - MUST define `"main"`, `"types"`, and a wildcard `"exports"` map to support deep imports.

#### 3.3.1. :: Core Package Configuration Details

**`package.json`:**

- **`dependencies`**: **MUST** list all third-party libraries that are used at runtime within the `core` logic. For example, if a service uses `typescript` to parse code, `typescript` must be a production dependency here.
- **`devDependencies`**: Should generally be empty, containing only type definitions (`@types/*`) if necessary.

**`project.json`:**

- The `build` target **MUST** have the following options:
    - `"bundle": false`: `core` packages are libraries, not standalone bundles.
    - `"external": ["dep1", "dep2", ...]` : This array **MUST** list every third-party package from the `dependencies` section of its `package.json`. This provides essential metadata to the build system.

**`tsconfig.lib.json`:**

- **`references`**: **MUST** include a path to the `tsconfig.lib.json` of any local `workspace:*` dependencies (e.g., `../../../libs/shared/tsconfig.lib.json`).
- **`paths`**: **MUST** contain mappings for all `workspace:*` dependencies to their `src` directory.

### 3.4. :: `ext` Package (Application)

- **Purpose:** To be published as a final, bundled VS Code extension.
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: true` to create a single, optimized output file.
- **`project.json`:** MUST use the global `build:extension` target defined in `nx.json`:
    ```json
    {
        "build": {
            "extends": "build:extension"
        }
    }
    ```
- **`tsconfig.json`:** MUST include:
    - Proper `references` to core packages

#### 3.4.1. :: Third-Party Dependency Management

- **Externalization Strategy:** Third-party runtime dependencies are externalized from the bundle to keep the CJS file size small.
- **Packaging Process:** The `create-vsix.js` script manually constructs `node_modules` by copying resolved dependencies from the workspace during packaging.
- **Dependency Resolution:** All third-party dependencies listed in the `ext` package's `package.json` are automatically resolved and included in the final VSIX package.
- **Bundle Optimization:** This approach results in significantly smaller bundle sizes while maintaining full functionality.
    - `"rootDir": "src"` for clean output structure
- **`package.json`:**
    - MUST define the `"main"` field pointing to the bundled output (e.g., `./dist/extension.cjs`).
    - MUST NOT include `"module"`, `"types"`, or `"exports"`, as it is not consumed as a library.
    - **Crucially, all consumed workspace packages (e.g., `@fux/shared`, `@fux/my-feature-core`) MUST be listed in `dependencies`, not `devDependencies`.** This ensures their own production dependencies are correctly installed by the packaging script.
- **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.

#### 3.4.2. :: Extension Package Configuration Details

**`package.json`:**

- **`dependencies`**: **MUST** list the superset of all third-party dependencies required by the entire feature (both `ext` and its corresponding `core` package). It **MUST** also list its local `workspace:*` dependencies (e.g., `@fux/<feature>-core`, `@fux/shared`). This file dictates the versions that will be installed in the final package.
- **`devDependencies`**: Should generally only contain type definitions (`@types/*`) and other build-time tools like `typescript`.

**`project.json`:**

- The `build` target **MUST** have the following options:
    - `"bundle": true`: This is the critical setting that creates the self-contained extension.
    - `"external": ["vscode", "dep1", "dep2", ...]` : This array **MUST** contain `"vscode"` and all third-party runtime dependencies listed in the `ext` package's `package.json`. Third-party dependencies are externalized to keep the CJS bundle size small and are resolved during packaging via the `create-vsix.js` script.
    - `"assets"`: **MUST** be configured to copy the extension's `assets` directory to the output `dist` folder.

**`tsconfig.json`:**

- **`references`**: **MUST** include paths to the `tsconfig.lib.json` of all `workspace:*` dependencies (e.g., `../core/tsconfig.lib.json`, `../../../libs/shared/tsconfig.lib.json`).

### 3.5. :: Build & Task Execution (`nx.json`)

- **Global Targets:** The workspace defines standardized global targets in `nx.json` under `targetDefaults`:
    - `build:core`: For shared libraries with declaration generation
    - `build:extension`: For VSCode extensions with bundling and optimization
- **Dependency Graph:** All `build` targets MUST include `"dependsOn": ["^build"]` to ensure Nx builds dependencies first.
- **Caching:** Cacheable operations (`build`, `lint`, etc.) SHOULD be defined in the `tasksRunnerOptions` section.

### 3.6. :: PowerShell Aliases (`custom_pnpm_aliases.ps1`)

- **Command Structure:** Aliases MUST be implemented to construct and execute the idiomatic `pnpm nx <target> <project>` command.
- **Alias Mapping:** New aliases SHOULD be added to the central `$packageAliases` hashtable for dynamic generation.

###### END: Key Configuration Principles (END) <!-- Close Fold -->

## 4. :: Code Generation and Scaffolding <!-- Start Fold -->

### 4.1. :: Use of Native Generators

- **Directive**: When creating scaffolding or code generation logic, Nx's native generator capabilities (e.g., `@nx/devkit`) **MUST** be used in favor of custom, standalone scripts. This ensures that new code adheres to workspace conventions, integrates with the Nx graph, and remains maintainable alongside the core tooling.

### 4.2. :: Default Functionality of Generated Code

- **Directive**: A generated module or package **MUST** be fully functional and runnable "out-of-the-box" without requiring manual correction.
- **Directive**: This includes, but is not limited to, correct build configurations, valid launch/task definitions, and complete dependency injection setups for all essential, shared services (e.g., `IPathUtilsService`, `ICommonUtilsService`). Commenting out essential registrations in generated code is a deviation.

###### END: Code Generation and Scaffolding (END) <!-- Close Fold -->

## 5. :: Build Configuration Discoveries <!-- Start Fold -->

### 5.1. :: ESBuild vs SWC

- **Discovery**: ESBuild provides better performance and more control over bundling than SWC for our use case.
- **Core Packages**: Use ESBuild with `bundle: false` and `declarationRootDir` for optimal declaration generation.
- **Extension Packages**: Use ESBuild with `bundle: true`, tree-shaking, and minification for optimal bundle sizes.

### 5.2. :: TypeScript Configuration

- **Discovery**: `emitDeclarationOnly: true` in `tsconfig.lib.json` prevents TypeScript compilation conflicts during ESBuild bundling.
- **Core Packages**: Must have `declaration: true` and `declarationMap: true` for proper type support.
- **Extension Packages**: Must reference core packages in `tsconfig.json` but not compile their source files.

### 5.3. :: Bundle Size Optimization

- **Discovery**: Individual exports (manual tree-shaking) can significantly reduce bundle size compared to barrel exports.
- **Strategy**: Use individual exports in shared packages to enable better tree-shaking in extensions.
- **Result**: Project Butler extension achieves 0.14 MB bundle size vs 3.57 MB for Ghost Writer (due to TypeScript AST dependencies).

### 5.4. :: Global Targets

- **Discovery**: Global targets in `nx.json` eliminate configuration duplication and ensure consistency.
- **Implementation**: All packages now use `build:core` or `build:extension` targets instead of duplicating configuration.
- **Benefits**: Simplified maintenance, consistent builds, and easier new package creation.

###### END: Build Configuration Discoveries (END) <!-- Close Fold -->

## 6. :: Standard Workflow <!-- Start Fold -->

### 6.1. :: Creating New Features

1. **Use Generators:** Use the built-in Nx generators to create new packages:

    ```bash
    # Create a core package
    nx g ./generators:core --name=my-feature --description="My feature core functionality" --directory=packages/my-feature

    # Create an extension package
    nx g ./generators:ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature --directory=packages/my-feature
    ```

2. **Implement Logic:** The `core` and `ext` packages will be implemented following the principles outlined above.

3. **Verify:** The build will be tested from the monorepo root using the `pnpm nx build <project-name>` command to ensure correctness.

### 6.2. :: Development Workflow

1. **Build Dependencies:** Ensure all core packages are built before building extensions
2. **Build Extension:** Build the extension package for testing
3. **Package for Testing:** Create a development VSIX package for local installation
4. **Test:** Install and test the extension in VSCode
5. **Iterate:** Make changes and repeat the build/test cycle

###### END: Standard Workflow (END) <!-- Close Fold -->

## 7. :: Technical Constraints & Best Practices <!-- Start Fold -->

### 7.1. :: TypeScript Configuration

- **Core packages**: Must have `declaration: true` and `declarationMap: true` in `tsconfig.lib.json`
- **Extension packages**: Must reference core packages in `tsconfig.json` but not compile their source files
- **Project references**: Ext packages must reference `tsconfig.lib.json` files, not main `tsconfig.json` files
- **Composite mode**: Core packages must have `composite: true` in both `tsconfig.json` and `tsconfig.lib.json`

### 7.2. :: VSCode Type Version Management

- **All packages must use the same `@types/vscode` version** to avoid TypeScript compatibility issues
- **Current standard**: `"@types/vscode": "^1.99.3"` (compatible with Cursor)
- **Critical constraint**: For extensions to work in Cursor, VSCode version must be 1.99.3 or lower
- **Configuration API**: Use type assertions (`as`) instead of generic type arguments for `WorkspaceConfiguration.get()` calls

### 7.2.1. :: VSCode Adapters and Types Centralization

- **VSCode adapters and types MUST be centralized in the shared package only**
- **Core packages**: MUST NOT contain any VSCode adapters, VSCode API usage, or VSCode value imports
- **Extension packages**: MUST NOT contain VSCode adapters; they should use adapters from the shared package
- **Shared package**: Contains all VSCode adapters and provides interfaces for VSCode API interactions
- **Type imports**: Core and ext packages MAY import VSCode types for interface definitions, but MUST NOT use VSCode APIs directly
- **Adapter pattern**: All VSCode API interactions must go through adapters in the shared package to maintain decoupling

**Exceptions:**

- Test files and setup files may contain VSCode imports for mocking purposes
- NO exceptions for extension.ts files - all VSCode coupling must be in shared package only

### 7.3. :: Dependency Injection with Awilix

- **Framework**: The project uses **awilix** for dependency injection across all packages.
- **Container Setup**: Each extension package includes an `injection.ts` file that sets up the DI container.
- **Service Registration**: All services (core, shared, and adapters) are registered in the DI container.
- **Static Imports**: `awilix` and other externalized packages **MUST** be imported using static, top-level `import` statements to allow the bundler to correctly externalize them.

    ```typescript
    // Correct - static import
    import { createContainer, asClass, asFunction } from 'awilix'
    ```

- **Externalization**: Awilix must be listed in `external` in extension build options and in `dependencies` in `package.json`.

#### 7.3.1. :: Dependency Injection Best Practices

- **One Container Per Extension:** Each extension has its own DI container, created in its `injection.ts` file.
- **Use Factories for Dependencies:** Services that depend on other services or adapters **MUST** be registered using factory functions (`asFunction`) to ensure `awilix` can correctly resolve the dependency graph.
- **Register All Dependencies:** The container **MUST** provide a concrete implementation for every interface required by the services it resolves. This includes adapters for VS Code APIs (`IWindow`, `IWorkspace`) and shared utilities (`IPathUtilsService`, etc.).
- **Import Required Interfaces:** All interfaces used in DI registration **MUST** be imported from their respective packages to ensure proper typing and resolution.

#### 7.3.2. :: Common DI Pitfalls & Troubleshooting

- **`AwilixResolutionError`:** This is the most common error and almost always means a dependency is missing from the container.
    - **Symptom:** `Could not resolve 'someService'.`
    - **Cause:** The `injection.ts` file is missing a registration for `someService` or one of its transitive dependencies.
    - **Solution:** Trace the dependency chain for the service that failed to resolve and ensure every required interface has a corresponding adapter or service registered in the container.

- **Hallucinated Adapters:** Do not assume an adapter exists in `@fux/shared`.
    - **Symptom:** TypeScript error `Module '"@fux/shared"' has no exported member 'SomeAdapter'`.
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

### 7.4. :: Externalization of Node Packages

- Any node package used at runtime (e.g., `awilix`, `js-yaml`) must:
    - Be listed in `external` in the `ext` package's build options (`project.json`).
    - Be in `dependencies` (not `devDependencies`) in the `ext` package's `package.json`.
    - Be imported using **static `import` statements** everywhere (including in `shared`/`core` packages) to ensure the bundler can correctly identify and externalize it.
- **Never use dynamic `import()` for externalized packages**, as this will cause them to be incorrectly bundled.

### 7.5. :: Packaging Script (`scripts/create-vsix.js`)

The role of the packaging script is to create a self-contained VSIX with a clean, production-only `node_modules` folder. It **MUST NOT** bundle third-party dependencies into the `extension.cjs`.

Its responsibilities are:

1.  **Clean and Prepare:** It creates a temporary deployment directory.
2.  **Copy Artifacts:** It copies the necessary project files (`dist`, `assets`, `README.md`, etc.) into the deployment directory.
3.  **Prepare `package.json`:** It copies the original `package.json`, removes the `dependencies` and `devDependencies` properties, and updates the `version` for dev builds. This is crucial because `vsce` uses this file for metadata, but we don't want it to run an `install` step.
4.  **Resolve Dependency Tree:** It runs `pnpm list --prod --json --depth=Infinity` on the original extension package to get a complete, structured list of all production dependencies and their exact locations on disk.
5.  **Manually Construct `node_modules`:** It recursively walks the resolved dependency tree and physically copies each required package from its source location (usually the monorepo's central `.pnpm` store) into the deployment directory's `node_modules` folder. This creates a flat, physical `node_modules` structure that is compatible with `vsce`.
6.  **Filter Workspace Packages:** It automatically skips workspace packages (those with `link:` versions) since they are not needed in the final VSIX.
7.  **Copy Nested Dependencies:** It recursively copies all nested dependencies to ensure complete dependency resolution (e.g., `awilix` requires `camel-case` and `fast-glob`).
8.  **Package VSIX:** It runs `vsce package` on the deployment directory to create the final VSIX file. The `--no-dependencies` flag **MUST** be used to prevent `vsce` from running its own dependency checks, which would fail against the manually constructed `node_modules` folder.

### 7.6. :: Common Build Issues

- **TypeScript Declaration Errors**: Ensure core packages have `declaration: true` and `declarationMap: true` in `tsconfig.lib.json`.
- **Bundle Size Issues**: Check for unnecessary dependencies (like TypeScript AST usage) and consider individual exports.
- **Import Resolution Errors**: Verify `tsconfig.json` has proper `references` and `emitDeclarationOnly: true`.
- **Inconsistent tsconfig.json**: Leads to subtle build and type errors—keep them aligned.
- **Missing Path Mappings**: When TypeScript reports "File not found" errors for source directories, check that all `@fux/*` packages have proper path mappings in `tsconfig.base.json` and that `libs/shared/tsconfig.lib.json` includes explicit path overrides.
- **Path Sanitization Issues**: The `PathUtilsAdapter.santizePath()` method is designed for filenames only, not full file paths. Always sanitize individual components before joining paths to avoid drive letter corruption.

### 7.7. :: TypeScript Configuration Troubleshooting

#### 7.7.1. :: "File not found" Errors for Source Directories

**Problem**: The TypeScript language server in VS Code reports errors like:

```
File 'd:/path/to/project/libs/shared/src' not found.
```

**Root Cause**: Incorrect or polluted `paths` alias configuration in the TypeScript composite project setup. Placing `paths` in the root `tsconfig.base.json` causes all projects to inherit all paths, leading to resolution errors for projects that do not have a direct dependency on those paths.

**Solution**:

1.  **Remove `paths` from `tsconfig.base.json`**: The `compilerOptions.paths` property **MUST** be removed from the root `tsconfig.base.json` file to prevent path pollution.

2.  **Define `paths` in the Root `tsconfig.json`**: Add all workspace path aliases to the `compilerOptions.paths` property in the **root `tsconfig.json`** file. This provides a global mapping for the IDE and tooling without affecting individual project builds.

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

3.  **Define Relative `paths` in Library `tsconfig.lib.json`**: For each `core` or `shared` library, its `tsconfig.lib.json` **MUST** define a `paths` property that maps only its direct workspace dependencies using the correct **relative paths**.

    ```json
    // In packages/my-feature/core/tsconfig.lib.json, which depends on @fux/shared
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared/src"]
        }
    }
    ```

**Verification**: After making these changes, restart the VS Code TypeScript server to ensure the errors are resolved. The workspace audit script (`scripts/audit-feature-structure.ts`) also validates this configuration.

#### 7.7.2. :: Path Mapping Best Practices

- **Base Config**: Use absolute paths from workspace root in `tsconfig.base.json`
- **Package Config**: Use relative paths in individual package `tsconfig.lib.json` files
- **Consistency**: Ensure all `@fux/*` packages referenced in imports have corresponding path mappings
- **Validation**: Always test TypeScript compilation after adding new packages or changing path mappings

### 7.8. :: Performance Optimization

- **Bundle Size**: Use individual exports, externalize heavy dependencies, and enable tree-shaking
- **Build Time**: Leverage Nx caching and proper dependency ordering with `dependsOn: ["^build"]`
- **Type Safety**: Ensure proper TypeScript configuration for declaration generation
- **Dependency Hygiene**: No unused or duplicate dependencies in any package

### 7.9. :: Webview State Management

- **Directive**: When updating the state of a VS Code webview, a targeted `postMessage` approach **SHOULD** be preferred over replacing the entire HTML content.
- **Pattern**:
    1.  The extension host sends a message to the webview containing only the data that has changed (e.g., `{ command: 'settingUpdated', settingId: '...', value: '...' }`).
    2.  A script within the webview listens for these messages and performs the necessary, specific DOM manipulations to reflect the new state.
- **Rationale**: This pattern is more performant as it avoids a full re-parse and re-render of the webview's HTML. It is also more reliable and less prone to race conditions or content-flashing artifacts that can occur with full HTML replacement.

###### END: Technical Constraints & Best Practices (END) <!-- Close Fold -->

## 8. :: Package Generators <!-- Start Fold -->

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

````bash
nx g ./generators:ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature --directory=packages/my-feature```

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
````

### 8.3. :: Batch Commands

````bash
# Build all packages
nx run-many --target=build --all

# Build all extension packages
nx run-many --target=build --projects=@fux/*-ext

# Build all core packages
nx run-many --target=build --projects=@fux/*-core```

### 9.3. :: Packaging Commands

```bash
# Create development package
nx run @fux/ghost-writer-ext:package:dev

# Create production package
nx run @fux/ghost-writer-ext:package
````

### 8.4. :: Clean Commands

```bash
# Clean cache for a specific project
nx run @fux/ghost-writer-ext:clean:cache

# Clean dist for a specific project
nx run @fux/ghost-writer-ext:clean:dist

# Clean both cache and dist
nx run @fux/ghost-writer-ext:clean
```

###### END: Build Commands Reference (END) <!-- Close Fold -->

## 9. :: Common Pitfalls & Lessons Learned <!-- Start Fold -->

### 9.1. :: Package.json Module Type Mismatch

**Problem**: TypeScript compilation shows warning: `"Package type is set to "module" but "cjs" format is included. Going to use "esm" format instead."`

**Root Cause**: Mismatch between `package.json` configuration and build output format:

- `package.json` has `"type": "module"` (indicating ESM)
- Build configuration uses `"format": ["cjs"]` (producing CommonJS)

**Solution**: Remove `"type": "module"` from `package.json` for VS Code extension packages that use CommonJS build format.

**Affected Packages**: All extension packages that use `@nx/esbuild:esbuild` with `"format": ["cjs"]`:

- `packages/project-butler/ext/package.json`
- `packages/context-cherry-picker/ext/package.json`
- `packages/note-hub/ext/package.json`
- `packages/ghost-writer/ext/package.json`
- `packages/dynamicons/ext/package.json`
- `packages/ai-agent-interactor/ext/package.json`

**Prevention**: When creating new extension packages, ensure `package.json` doesn't include `"type": "module"` if the build configuration uses CommonJS format.

### 9.2. :: Unused Variables Best Practice

**Problem**: ESLint errors like `'line' is defined but never used. Allowed unused args must match /^_/u`

**Root Cause**: Function parameters or variables that are declared but never used

**Solution**: Prefix unused variables with `_` to indicate they are intentionally unused:
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

**Best Practices**:
- **Function Parameters**: Prefix with `_` if the parameter is required by the interface but not used in implementation
- **Variables**: Prefix with `_` if declared but intentionally unused
- **Consistency**: Always use `_` prefix, never remove parameters that are part of a required interface
- **Documentation**: Consider adding a comment explaining why the parameter is unused if it's not obvious

**Common Scenarios**:
- Adapter implementations where interface requires parameters you don't need
- Event handlers where you only need some parameters
- Callback functions where you only use specific arguments

### 9.3. :: TypeScript Import Errors

**Problem**: TypeScript errors like `'"@fux/shared"' has no exported member named 'ExtensionContext'`

**Root Cause**: Importing VS Code types from `@fux/shared` instead of directly from `vscode`

**Solution**: Import VS Code types directly from `vscode`:

```typescript
// ❌ Wrong
import type { ExtensionContext, Disposable, Uri } from '@fux/shared'

// ✅ Correct
import type { ExtensionContext, Disposable, Uri } from 'vscode'
```

**Common Types to Import from vscode**:

- `ExtensionContext`
- `Disposable`
- `Uri`
- `TreeView`
- `TreeDataProvider`
- `TreeItem`
- `TreeItemCollapsibleState`
- `ProgressLocation`

### 9.4. :: Container Scope Issues

**Problem**: `Cannot find name 'container'` in catch blocks or other scopes

**Root Cause**: Container variable declared inside try block but accessed in catch block

**Solution**: Declare container variable outside try block:

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

###### END: Common Pitfalls & Lessons Learned (END) <!-- Close Fold -->

## 10. :: Nx Workspace Maintenance & Best Practices <!-- Start Fold -->

All contributors must follow the Nx optimizations and best practices outlined in [docs/Nx_Optimizations.md](./Nx_Optimizations.md). This document covers:

- DRY global build targets for all packages
- Smart caching and named inputs
- Efficient asset management
- Use of Nx affected commands in CI
- Regular Nx upgrades and cache maintenance
- Dependency visualization and documentation

**Always consult the Nx_Optimizations.md file before making changes to build targets, project structure, or CI workflows.**

###### END: Nx Workspace Maintenance & Best Practices (END) <!-- Close Fold -->
