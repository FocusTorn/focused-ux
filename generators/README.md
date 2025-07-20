# FocusedUX Package Generators

This directory contains Nx generators for creating different types of packages in the FocusedUX monorepo.

## Available Generators

### 1. Shared Package Generator (`shared`)

Creates a shared library package that provides common functionality to other packages.

**Usage:**

```bash
nx g @fux/shared --name=utilities --description="Common utilities and services"
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
nx g @fux/core --name=ghost-writer --description="Ghost Writer core functionality"
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
nx g @fux/ext --name=ghost-writer --displayName="F-UX: Ghost Writer" --description="Dynamically generate frequently used code" --corePackage=ghost-writer
```

**Creates:**

- Package with `build:extension` target
- VSCode extension manifest (package.json)
- Basic extension structure with DI container
- TypeScript configuration with core package reference
- Packaging and publishing targets

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
    nx g @fux/core --name=my-feature --description="My feature core functionality"
    ```

2. **Create the extension package:**

    ```bash
    nx g @fux/ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature
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
