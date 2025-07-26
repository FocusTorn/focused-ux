# Feature Structure & Best Practices for FocusedUX Monorepo

## Overview

This document outlines the agreed structure for all features in the FocusedUX monorepo, summarizes issues that have been overcome, and highlights pitfalls to avoid. The goal is to make it easy to enforce the correct structure for all features and for the future orchestrator extension.

---

## 1. **Feature Package Structure**

Each feature must be split into:

- **shared**: Contains logic, types, and utilities used by multiple features (cross-cutting concerns only).
- **core**: Contains all business logic, services, and feature-specific code. No VSCode or extension glue.
- **ext**: A thin VSCode extension wrapper. Only DI, activation, and VSCode command registration. No business logic.

**Example:**

```
packages/
  ghost-writer/
    core/
    ext/
  project-butler/
    core/
    ext/
  dynamicons/
    core/
    ext/
libs/
  shared/
```

---

## 2. **Build Configuration**

- **core**: Uses `@nx/esbuild:esbuild` with `bundle: false`, ESM output, declaration files, and no unnecessary options.
- **ext**: Uses `@nx/esbuild:esbuild` with `bundle: true`, CJS output, and `external` for any runtime node packages (e.g., `awilix`).
- **No use of global build targets** (`extends: build:extension` or `build:core`)—all build targets are explicit and inlined for clarity and maintainability.

---

## 3. **TypeScript Configuration**

- Each ext package must have a single `tsconfig.json` with:
    - `outDir: ./dist`
    - `rootDir: src`
    - `composite: false`
    - `declaration: false`
    - `declarationMap: false`
    - `include: ["src/**/*.ts"]`
    - `references` to its core and shared packages
- **No `tsconfig.lib.json` in ext**—only in core if needed for declaration output.
- All ext `tsconfig.json` files must be identical except for the `references` paths.

### 3a. **TypeScript Project References**

- **Ext packages must reference `tsconfig.lib.json` files**, not main `tsconfig.json` files:
    ```json
    // ✅ Correct - references actual compilation targets
    "references": [
        { "path": "../core/tsconfig.lib.json" },
        { "path": "../../../libs/shared/tsconfig.lib.json" }
    ]

    // ❌ Wrong - causes "File not found" errors for dist directories
    "references": [
        { "path": "../core" },
        { "path": "../../../libs/shared" }
    ]
    ```
- **Core packages must have `composite: true`** in both `tsconfig.json` and `tsconfig.lib.json` for proper project reference resolution.
- **This prevents persistent TypeScript errors** about missing `dist` directories and ensures proper project reference resolution.

---

## 4. **VSCode Type Version Management**

- **All packages must use the same `@types/vscode` version** to avoid TypeScript compatibility issues.
- **Current standard**: `"@types/vscode": "^1.99.3"` (compatible with Cursor).
- **Critical constraint**: For extensions to work in Cursor, VSCode version must be 1.99.3 or lower.
- **Never use newer versions** of `@types/vscode` in individual packages, as this causes:
    - Incompatibility with Cursor's VSCode engine
    - TypeScript errors with generic type arguments on VSCode API methods
    - Inconsistent type checking across the monorepo
    - Build failures due to type mismatches

### 4a. **VSCode Configuration API Type Safety**

- **Problem**: `WorkspaceConfiguration.get<T>()` method signature changes between VSCode type versions, and DI-resolved services may lose type information.
- **Solution**: Use type assertions instead of generic type arguments for configuration values:

    ```ts
    // ❌ Wrong - causes TS2347 errors with DI-resolved services
    const workspaceService = container.resolve('workspace')
    const config = workspaceService.getConfiguration(CONFIG_PREFIX)
    const userIconsDir = config.get<string>(CONFIG_KEYS.userIconsDirectory)

    // ✅ Correct - type-safe and compatible with Cursor
    const workspaceService = container.resolve('workspace')
    const config = workspaceService.getConfiguration(CONFIG_PREFIX)
    const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
    const customMappings = config.get(CONFIG_KEYS.customIconMappings) as
        | Record<string, string>
        | undefined
    ```

    **Note**: Direct `vscode.workspace.getConfiguration()` calls work fine with generics, but DI-resolved services require type assertions.

- **Pattern**: Always use `as` type assertions for configuration values from DI-resolved services to ensure compatibility with Cursor's VSCode engine.

---

## 5. **Externalization of Node Packages**

- Any node package used at runtime (e.g., `awilix`, `js-yaml`) must:
    - Be listed in `external` in ext build options
    - Be in `dependencies` (not `devDependencies`) in ext `package.json`
    - Be dynamically imported everywhere (including in shared/core) to avoid accidental bundling
- **Never use static imports for externalized packages** in any code that may be bundled into an extension.

---

## 5a. **TypeScript Typing for Dynamic Imports**

- When using dynamic imports for externalized Node packages (e.g., `awilix`), assign imported properties to local variables with correct types using `as typeof import('package')`.
- Example:
    ```ts
    let createContainer: typeof import('awilix').createContainer
    let InjectionMode: typeof import('awilix').InjectionMode
    if (!createContainer) {
        const awilixModule = (await import('awilix')) as typeof import('awilix')
        createContainer = awilixModule.createContainer
        InjectionMode = awilixModule.InjectionMode
    }
    ```
- This avoids TypeScript errors like "Cannot find name" and ensures type safety for all runtime usages of dynamically imported modules.

---

## 6. **Dependency Hygiene**

- No unused or duplicate dependencies in any package.
- No `tslib`, `picomatch`, or other unused packages left over from templates or experiments.
- Only feature-specific dependencies in core/ext; cross-feature utilities go in shared.

---

## 7. **Common Pitfalls & Issues Overcome**

- **Static imports of externalized packages** cause bundling—always use dynamic import.
- **Inconsistent tsconfig.json** leads to subtle build and type errors—keep them aligned.
- **Copy-paste of build targets** is preferred over `extends` for clarity and maintainability.
- **Unused tsconfig.lib.json** in ext causes confusion—remove it.
- **Forgetting to add runtime deps to dependencies** causes runtime errors for users.
- **TypeScript errors with Awilix**: Use type assertions, not type arguments, on DI container resolves.
- **VSCode type version mismatches**: Always use the same `@types/vscode` version across all packages.
- **Configuration API type errors**: Use type assertions (`as`) instead of generic type arguments for `WorkspaceConfiguration.get()` calls.
- **TypeScript project reference errors**: Ext packages must reference `tsconfig.lib.json` files, not main `tsconfig.json` files, and core packages must have `composite: true` to prevent "File not found" errors for missing `dist` directories.

---

## 8. **Enforcement & Future Orchestrator**

- All new features must follow this structure and config pattern.
- The orchestrator extension will import and compose the core packages from all features, using the same DI and build patterns.
- Periodic audits and automation scripts are recommended to enforce alignment.

---

**Follow this guide for every new feature and for the orchestrator to ensure maintainability, testability, and a smooth developer experience.**
