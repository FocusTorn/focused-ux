# VS Code Extension Build & Packaging Guide

This guide outlines the standard configuration for building and packaging VS Code extensions in the FocusedUX monorepo.

## 1. :: Package Structure

The monorepo follows a consistent structure with three main package types:

- **`shared`** (Library): Located in `libs/shared/`, provides common services and utilities.
- **`core`** (Library): Located in `packages/{feature}/core/`, contains business logic for features.
- **`ext`** (Application): Located in `packages/{feature}/ext/`, contains the VSCode extension implementation.

## 2. :: Build Targets

### 2.1. :: Library Build (`core` and `shared` packages)

- **Executor:** `@nx/esbuild:esbuild`
- **Configuration:** `bundle: false`. This transpiles TypeScript to JavaScript but does not bundle dependencies, preserving `import` statements for the final application build.

### 2.2. :: Extension Build (`ext` packages)

- **Executor:** `@nx/esbuild:esbuild`
- **Configuration:** `bundle: true`. This creates a single, optimized `extension.cjs` file.
- **External Dependencies:** The `external` array in the build options is used to list Node.js packages that should not be bundled (e.g., `vscode`, `awilix`, `js-yaml`). These will be included as runtime dependencies in the final VSIX package.

**Example `project.json` for an `ext` package:**

```json
{
    "name": "@fux/my-feature-ext",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/my-feature/ext/src/extension.ts"],
                "outputPath": "packages/my-feature/ext/dist",
                "format": ["cjs"],
                "platform": "node",
                "bundle": true,
                "external": ["vscode", "awilix"],
                "sourcemap": true
                // ... other options
            }
        },
        "package": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node _scripts/create-vsix.js packages/my-feature/ext"
            }
        },
        "package:dev": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node _scripts/create-vsix.js packages/my-feature/ext --dev"
            }
        }
    }
}
```

## 3. :: Packaging (`package` and `package:dev` targets)

All packaging is handled by the central `_scripts/create-vsix.js` script. This script performs a robust, multi-step process to create a self-contained VSIX package.

### 3.1. :: Packaging Process

1.  A temporary deployment directory is created.
2.  A clean `package.json` containing only production `dependencies` is generated.
3.  `npm install` is run within the temporary directory to create a clean, `npm`-compatible `node_modules` folder.
4.  The bundled `dist` output and other assets (`README.md`, etc.) are copied into the directory.
5.  `vsce package` is run on this clean, self-contained directory to produce the final `.vsix` file.

This process ensures that all externalized Node packages are correctly included and resolvable at runtime, avoiding "Cannot find module" errors.

## 4. :: Build Commands

### 4.1. :: Building a Package

```bash
# Build a core or ext package
nx build @fux/my-feature-ext
```

### 4.2. :: Packaging an Extension

```bash
# Create a development VSIX package for local testing
nx package:dev @fux/my-feature-ext

# Create a production-ready VSIX package
nx package @fux/my-feature-ext
```

## 5. :: Best Practices

- **Static Imports:** Always use static `import` statements for externalized Node packages to ensure the bundler can correctly identify them.
- **Dependency Management:**
    - Place workspace dependencies (e.g., `@fux/my-feature-core`) in `devDependencies` in the `ext` package's `package.json`.
    - Place externalized Node packages (e.g., `awilix`) in `dependencies` in the `ext` package's `package.json`.
- **`.vscodeignore`:** Ensure the `.vscodeignore` file in each `ext` package is configured to include the `dist/` and `node_modules/` directories and exclude all source files.

For more detailed information, see the main [SOP.md](./SOP.md) and [Externalize_Node_Packages.md](./Externalize_Node_Packages.md).
