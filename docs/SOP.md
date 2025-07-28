# SOP: FocusedUX New Mono-Extension

## 1. :: Project Overview

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

## 2. :: Package Archetypes

The monorepo consists of three primary package archetypes, each with a distinct purpose and configuration.

- **`shared` (Library):** Located in `libs/shared/`, contains shared services and abstractions (e.g., file utilities, VS Code API wrappers) intended for runtime use by other packages.
- **`core` (Library):** Located in `packages/{feature}/core/`, contains a feature's abstract business logic. It is built to be tree-shakeable and is consumed by `ext` packages.
- **`ext` (Application):** Located in `packages/{feature}/ext/`, contains the VSCode extension implementation. It depends on a `core` package and is bundled into a final, executable artifact.

---

## 3. :: Key Configuration Principles

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
    - `"rootDir": "src"` for clean output structure
- **`package.json`:**
    - MUST define the `"main"` field pointing to the bundled output (e.g., `./dist/extension.cjs`).
    - MUST NOT include `"module"`, `"types"`, or `"exports"`, as it is not consumed as a library.
    - MUST move workspace dependencies to `devDependencies` since they're bundled.
- **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.

### 3.5. :: Build & Task Execution (`nx.json`)

- **Global Targets:** The workspace defines standardized global targets in `nx.json` under `targetDefaults`:
    - `build:core`: For shared libraries with declaration generation
    - `build:extension`: For VSCode extensions with bundling and optimization
- **Dependency Graph:** All `build` targets MUST include `"dependsOn": ["^build"]` to ensure Nx builds dependencies first.
- **Caching:** Cacheable operations (`build`, `lint`, etc.) SHOULD be defined in the `tasksRunnerOptions` section.

### 3.6. :: PowerShell Aliases (`custom_pnpm_aliases.ps1`)

- **Command Structure:** Aliases MUST be implemented to construct and execute the idiomatic `pnpm nx <target> <project>` command.
- **Alias Mapping:** New aliases SHOULD be added to the central `$packageAliases` hashtable for dynamic generation.

---

## 4. :: Code Generation and Scaffolding

### 4.1. :: Use of Native Generators

- **Directive**: When creating scaffolding or code generation logic, Nx's native generator capabilities (e.g., `@nx/devkit`) **MUST** be used in favor of custom, standalone scripts. This ensures that new code adheres to workspace conventions, integrates with the Nx graph, and remains maintainable alongside the core tooling.

### 4.2. :: Default Functionality of Generated Code

- **Directive**: A generated module or package **MUST** be fully functional and runnable "out-of-the-box" without requiring manual correction.
- **Directive**: This includes, but is not limited to, correct build configurations, valid launch/task definitions, and complete dependency injection setups for all essential, shared services (e.g., `IPathUtilsService`, `ICommonUtilsService`). Commenting out essential registrations in generated code is a deviation.

---

## 5. :: Build Configuration Discoveries

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

---

## 6. :: Standard Workflow

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

---

## 7. :: Technical Constraints & Best Practices

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

### 7.3. :: Dependency Injection with Awilix

- **Framework**: The project uses **awilix** for dependency injection across all packages
- **Container Setup**: Each extension package includes an `injection.ts` file that sets up the DI container
- **Service Registration**: All services (core, shared, and adapters) are registered in the DI container
- **Dynamic Imports**: Awilix must be dynamically imported to avoid bundling issues:

    ```typescript
    // Correct - dynamic import
    const { createContainer, asClass, asFunction } = await import('awilix')

    // Incorrect - static import (causes bundling)
    import { createContainer, asClass, asFunction } from 'awilix'
    ```

- **Externalization**: Awilix must be listed in `external` in extension build options and in `dependencies` in `package.json`

### 7.4. :: Externalization of Node Packages

- Any node package used at runtime (e.g., `awilix`, `js-yaml`) must:
    - Be listed in `external` in ext build options
    - Be in `dependencies` (not `devDependencies`) in ext `package.json`
    - Be dynamically imported everywhere (including in shared/core) to avoid accidental bundling
- **Never use static imports for externalized packages** in any code that may be bundled into an extension

### 7.5. :: Common Build Issues

- **TypeScript Declaration Errors**: Ensure core packages have `declaration: true` and `declarationMap: true` in `tsconfig.lib.json`
- **Bundle Size Issues**: Check for unnecessary dependencies (like TypeScript AST usage) and consider individual exports
- **Import Resolution Errors**: Verify `tsconfig.json` has proper `references` and `emitDeclarationOnly: true`
- **Static imports of externalized packages** cause bundling—always use dynamic import
- **Inconsistent tsconfig.json** leads to subtle build and type errors—keep them aligned
- **Missing Path Mappings**: When TypeScript reports "File not found" errors for source directories, check that all `@fux/*` packages have proper path mappings in `tsconfig.base.json` and that `libs/shared/tsconfig.lib.json` includes explicit path overrides

### 7.6. :: TypeScript Configuration Troubleshooting

#### 7.6.1. :: "File not found" Errors for Source Directories

**Problem**: TypeScript reports errors like:

```
File 'd:/path/to/project/libs/shared/src' not found.
File 'd:/path/to/project/packages/ghost-writer/core/src' not found.
```

**Root Cause**: Missing or incomplete path mappings in TypeScript configuration files.

**Solution**:

1. **Update `tsconfig.base.json`** to include all missing package path mappings:

    ```json
    {
        "compilerOptions": {
            "paths": {
                "@fux/ghost-writer-core": ["packages/ghost-writer/core/src"],
                "@fux/project-butler-core": ["packages/project-butler/core/src"],
                "@fux/shared": ["libs/shared/src"],
                "@fux/note-hub-core": ["packages/note-hub/core/src"],
                "@fux/dynamicons-core": ["packages/dynamicons/core/src"],
                "@fux/context-cherry-picker-core": ["packages/context-cherry-picker/core/src"],
                "@fux/ai-agent-interactor-core": ["packages/ai-agent-interactor/core/src"]
            }
        }
    }
    ```

2. **Update `libs/shared/tsconfig.lib.json`** with explicit path overrides:
    ```json
    {
        "compilerOptions": {
            "paths": {
                "@fux/ghost-writer-core": ["../../packages/ghost-writer/core/src"],
                "@fux/project-butler-core": ["../../packages/project-butler/core/src"],
                "@fux/shared": ["./src"],
                "@fux/note-hub-core": ["../../packages/note-hub/core/src"],
                "@fux/dynamicons-core": ["../../packages/dynamicons/core/src"],
                "@fux/context-cherry-picker-core": [
                    "../../packages/context-cherry-picker/core/src"
                ],
                "@fux/ai-agent-interactor-core": ["../../packages/ai-agent-interactor/core/src"]
            }
        }
    }
    ```

**Verification**: Run `npx tsc --noEmit` in the affected package directory to confirm the error is resolved.

#### 7.6.2. :: Path Mapping Best Practices

- **Base Config**: Use absolute paths from workspace root in `tsconfig.base.json`
- **Package Config**: Use relative paths in individual package `tsconfig.lib.json` files
- **Consistency**: Ensure all `@fux/*` packages referenced in imports have corresponding path mappings
- **Validation**: Always test TypeScript compilation after adding new packages or changing path mappings

### 7.7. :: Performance Optimization

- **Bundle Size**: Use individual exports, externalize heavy dependencies, and enable tree-shaking
- **Build Time**: Leverage Nx caching and proper dependency ordering with `dependsOn: ["^build"]`
- **Type Safety**: Ensure proper TypeScript configuration for declaration generation
- **Dependency Hygiene**: No unused or duplicate dependencies in any package

---

## 8. :: Package Generators

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

---

## 9. :: Build Commands Reference

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

---

## Nx Workspace Maintenance & Best Practices

All contributors must follow the Nx optimizations and best practices outlined in [docs/Nx_Optimizations.md](./Nx_Optimizations.md). This document covers:

- DRY global build targets for all packages
- Smart caching and named inputs
- Efficient asset management
- Use of Nx affected commands in CI
- Regular Nx upgrades and cache maintenance
- Dependency visualization and documentation

**Always consult the Nx_Optimizations.md file before making changes to build targets, project structure, or CI workflows.**

For detailed build and packaging information, see [docs/Build_and_Packaging_Guide.md](./Build_and_Packaging_Guide.md).

For technical details on externalizing Node packages, see [docs/Externalize_Node_Packages.md](./Externalize_Node_Packages.md).

---
