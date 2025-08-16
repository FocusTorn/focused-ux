# FocusedUX Package Generators

This directory contains Nx generators for creating different types of packages in the FocusedUX monorepo.

## Available Generators

### 1. Shared Package Generator (`shared`)

Creates a shared library package that provides common functionality to other packages.

**Usage:**

```bash
nx g ./generators:shared --name=utilities --description="Common utilities and services"
```

**Creates:**

- Package with `build:core` target
- TypeScript configuration for declaration generation
- Individual exports for tree-shaking
- Proper package.json with exports

### 2. Core Package Generator (`core`)

Creates a core library package that contains business logic for a specific feature.

**Usage:**

```bash
nx g ./generators:core --name=ghost-writer --description="Ghost Writer core functionality"  --directory=packages/ghost-writer
```

**Creates:**

- Package with `build:core` target
- TypeScript configuration for declaration generation
- Individual exports for tree-shaking
- Proper package.json with exports

### 3. Extension Package Generator (`ext`)

Creates a VSCode extension package that provides the UI and VSCode-specific implementation.

**Usage:**

```bash
nx g ./generators:ext --name=ghost-writer --displayName="F-UX: Ghost Writer" --description="Dynamically generate frequently used code" --corePackage=ghost-writer --directory=packages/ghost-writer
```

**Creates:**

- Package with `build:extension` target
- VSCode extension manifest (package.json)
- Basic extension structure with DI container
- TypeScript configuration with core package reference
- Packaging and publishing targets

### 4. Library Package Generator (`lib`)

Creates a library package in the `libs/` directory for internal utilities and tools.

**Usage:**

```bash
nx g ./generators:lib --name=utilities --description="Internal utility functions" --directory=libs
```

**Creates:**

- Library with `build:core` target
- TypeScript configuration for declaration generation
- Proper package.json with exports

### 5. Test Scaffold Generator (`test-scaffold`)

Creates a comprehensive test directory structure with Mockly integration, vitest configuration, and helper utilities for VSCode extension testing.

**Usage:**

```bash
# For a core package
nx g ./generators:test-scaffold --project=my-feature --packageType=core

# For an extension package
nx g ./generators:test-scaffold --project=my-feature-ext --packageType=ext

# For a shared library
nx g ./generators:test-scaffold --project=utilities --packageType=shared
```

**Creates:**

- `__tests__/` directory with comprehensive test structure
- `_setup.ts` with Mockly integration and console control
- `helpers.ts` with mock setup functions and utilities
- `vitest.functional.config.ts` for functional testing
- `vitest.coverage.config.ts` for coverage testing
- Sample test files demonstrating usage patterns
- Directory structure for services and adapters
- Comprehensive README documentation
- Automatic project.json updates with test targets

**Features:**

- **Mockly Integration**: Full integration with the Mockly VSCode API mocking library
- **Comprehensive Mocks**: Pre-configured mocks for window, workspace, terminal, file system, and path utilities
- **Test Organization**: Structured directories for services, adapters, and coverage tests
- **Vitest Configuration**: Separate configs for functional and coverage testing
- **Helper Utilities**: Functions for creating mock objects and setting up test environments
- **Documentation**: Extensive README files with examples and best practices

## Generator Features

### ✅ **Automatic Configuration**

- Uses global targets from `nx.json` (`build:core`, `build:extension`)
- Proper TypeScript configuration with `emitDeclarationOnly: true`
- Correct package.json structure for each package type

### ✅ **Workspace Integration**

- Automatically adds packages to `pnpm-workspace.yaml`
- Updates Nx workspace configuration
- Proper dependency management

### ✅ **Best Practices**

- Individual exports for tree-shaking
- Proper TypeScript declaration generation
- Optimized bundle sizes
- Consistent naming conventions

### ✅ **Extension-Specific Features**

- VSCode extension manifest with proper structure
- Dependency injection setup with Awilix
- Command registration and activation events
- Packaging and publishing targets

## Package Structure

### Shared/Core Packages

```
packages/package-name/
├── src/
│   └── index.ts          # Individual exports
├── package.json          # Library configuration
├── project.json          # Nx configuration
├── tsconfig.json         # TypeScript configuration
└── tsconfig.lib.json     # Library TypeScript configuration
```

### Extension Packages

```
packages/package-name/ext/
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── injection.ts      # DI container setup
│   ├── index.ts          # Module exports
│   └── _config/
│       └── constants.ts  # Extension constants
├── assets/
│   └── icon.png          # Extension icon
├── package.json          # VSCode extension manifest
├── project.json          # Nx configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.lib.json     # Library TypeScript configuration
└── .vscodeignore         # VSCode packaging ignore
```

## Usage Examples

### Creating a Complete Feature

1. **Create the core package:**

    ```bash
    nx g ./generators:core --name=my-feature --description="My feature core functionality"
    ```

2. **Create the extension package:**

    ```bash
    nx g ./generators:ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature
    ```

3. **Build both packages:**
    ```bash
    nx run @fux/my-feature-core:build
    nx run @fux/my-feature-ext:build
    ```

### Benefits

- **Consistency**: All packages follow the same proven configuration
- **Performance**: Optimized bundle sizes and build times
- **Maintainability**: Uses global targets for easy updates
- **Type Safety**: Proper TypeScript declaration generation
- **Tree-shaking**: Individual exports enable better optimization

## Configuration

The generators use the global targets defined in `nx.json`:

- `build:core`: For shared and core packages
- `build:extension`: For VSCode extension packages

These targets include all the optimizations we've discovered:

- Proper dependency ordering
- TypeScript declaration generation
- ESBuild bundling with tree-shaking
- Asset copying
- Minification for production

---

## Notes

- These generators are now invoked using the local path syntax (`./generators:core`, `./generators:ext`, `./generators:shared`).
- The previous `@fux/core`, `@fux/ext`, and `@fux/shared` commands are no longer valid unless the generators are published as a package and installed as a plugin.

---
