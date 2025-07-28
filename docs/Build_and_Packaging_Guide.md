# VS Code Extension Build & Packaging Guide

This guide outlines the standard configuration for building and packaging VS Code extensions in the FocusedUX monorepo. The workspace uses global targets defined in `nx.json` to ensure consistency across all packages.

## 1. :: Package Structure

The monorepo follows a consistent structure with three main package types:

- **`shared`** (Library): Located in `libs/shared/`, provides common services and utilities
- **`core`** (Library): Located in `packages/{feature}/core/`, contains business logic for features
- **`ext`** (Application): Located in `packages/{feature}/ext/`, contains VSCode extension implementation

## 2. :: Global Build Targets

The workspace defines standardized global targets in `nx.json` that all packages extend:

### 2.1. :: `build:core` Target

Used by shared libraries and core packages for library compilation.

**Configuration:**
```json
"build:core": {
    "executor": "@nx/esbuild:esbuild",
    "dependsOn": ["^build"],
    "outputs": ["{options.outputPath}"],
    "options": {
        "outputPath": "{projectRoot}/dist",
        "main": "{projectRoot}/src/index.ts",
        "tsConfig": "{projectRoot}/tsconfig.lib.json",
        "platform": "node",
        "format": ["esm"],
        "bundle": false,
        "sourcemap": true,
        "target": "es2022",
        "keepNames": true,
        "declaration": true,
        "declarationRootDir": "{projectRoot}/src",
        "thirdParty": false,
        "deleteOutputPath": true
    }
}
```

**Usage in `project.json`:**
```json
"build": {
    "extends": "build:core"
}
```

### 2.2. :: `build:extension` Target

Used by VSCode extension packages for bundling and optimization.

**Configuration:**
```json
"build:extension": {
    "executor": "@nx/esbuild:esbuild",
    "dependsOn": ["^build"],
    "outputs": ["{options.outputPath}"],
    "options": {
        "main": "{projectRoot}/src/extension.ts",
        "outputPath": "{projectRoot}/dist",
        "tsConfig": "{projectRoot}/tsconfig.json",
        "platform": "node",
        "format": ["cjs"],
        "bundle": true,
        "external": ["vscode"],
        "outExtension": { ".js": ".cjs" },
        "sourcemap": false,
        "target": "es2022",
        "keepNames": true,
        "treeShaking": true,
        "metafile": true,
        "declarationRootDir": "{projectRoot}/src",
        "assets": [
            {
                "glob": "**/*",
                "input": "{projectRoot}/assets",
                "output": "assets"
            }
        ],
        "deleteOutputPath": true
    },
    "configurations": {
        "development": {
            "minify": false
        },
        "production": {
            "minify": true
        }
    }
}
```

**Usage in `project.json`:**
```json
"build": {
    "extends": "build:extension"
}
```

## 3. :: Package Configuration

### 3.1. :: Core Packages

**Purpose:** Framework-agnostic libraries containing business logic.

**Key Requirements:**
- Use `build:core` target
- Generate TypeScript declarations
- Support tree-shaking through individual exports
- No bundling (library consumption)

**Example `project.json`:**
```json
{
    "name": "@fux/ghost-writer-core",
    "targets": {
        "build": {
            "extends": "build:core"
        }
    }
}
```

### 3.2. :: Extension Packages

**Purpose:** VSCode extensions that consume core packages.

**Key Requirements:**
- Use `build:extension` target
- Bundle all dependencies (except `vscode`)
- Include assets from `assets/` directory
- Generate optimized CommonJS output

**Example `project.json`:**
```json
{
    "name": "@fux/ghost-writer-ext",
    "targets": {
        "build": {
            "extends": "build:extension"
        },
        "package:dev": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node ./_scripts/create-dev-vsix.js ghost-writer/ext"
            }
        },
        "package": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node ./_scripts/create-prod-vsix.js ghost-writer/ext"
            }
        }
    }
}
```

## 4. :: TypeScript Configuration

### 4.1. :: Core Packages (`tsconfig.lib.json`)

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "./dist",
        "declaration": true,
        "declarationMap": true,
        "emitDeclarationOnly": true,
        "rootDir": "src"
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "node_modules"]
}
```

### 4.2. :: Extension Packages (`tsconfig.json`)

```json
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "src"
    },
    "include": ["src/**/*"],
    "references": [
        { "path": "../core" }
    ]
}
```

## 5. :: Packaging Targets

### 5.1. :: Development Packaging (`package:dev`)

Creates a versioned `.vsix` file for local testing without affecting the official version.

**Configuration:**
```json
"package:dev": {
    "executor": "nx:run-commands",
    "dependsOn": ["build"],
    "options": {
        "command": "node ./_scripts/create-dev-vsix.js {package-directory}"
    }
}
```

### 5.2. :: Production Packaging (`package`)

Creates a production-ready `.vsix` file with proper versioning.

**Configuration:**
```json
"package": {
    "executor": "nx:run-commands",
    "dependsOn": ["build"],
    "options": {
        "command": "node ./_scripts/create-prod-vsix.js {package-directory}"
    }
}
```

## 6. :: Build Commands

### 6.1. :: Building Individual Packages

```bash
# Build a core package
nx build @fux/ghost-writer-core

# Build an extension package
nx build @fux/ghost-writer-ext

# Build with production configuration
nx build @fux/ghost-writer-ext --configuration=production
```

### 6.2. :: Building Multiple Packages

```bash
# Build all packages
nx run-many --target=build --all

# Build all extension packages
nx run-many --target=build --projects=@fux/*-ext

# Build all core packages
nx run-many --target=build --projects=@fux/*-core
```

### 6.3. :: Packaging Extensions

```bash
# Create development package
nx run @fux/ghost-writer-ext:package:dev

# Create production package
nx run @fux/ghost-writer-ext:package
```

## 7. :: Best Practices

### 7.1. :: Bundle Optimization

- Use individual exports in core packages for better tree-shaking
- Externalize heavy dependencies when possible
- Enable minification for production builds
- Use `--skip-nx-cache` for troubleshooting build issues

### 7.2. :: Asset Management

- Place static assets in the `assets/` directory
- Assets are automatically copied to `dist/assets/` during build
- Use relative paths in extension code to reference assets

### 7.3. :: Dependency Management

- Core packages should have minimal dependencies
- Extension packages bundle their dependencies
- Use workspace dependencies for internal packages
- Move workspace dependencies to `devDependencies` in extensions

## 8. :: Troubleshooting

### 8.1. :: Common Issues

- **Build failures**: Check that all dependencies are built first
- **Bundle size issues**: Review dependencies and consider tree-shaking
- **Type errors**: Ensure TypeScript configurations are correct
- **Asset not found**: Verify assets are in the correct directory

### 8.2. :: Cache Issues

- Use `nx reset` to clear the entire workspace cache
- Use `--skip-nx-cache` to bypass caching for a single build
- Check `.nx/cache` directory for cache-related issues

For more detailed information about the workspace structure and best practices, see [docs/SOP.md](./SOP.md) and [docs/Nx_Optimizations.md](./Nx_Optimizations.md).

For technical details on externalizing Node packages, see [docs/Externalize_Node_Packages.md](./Externalize_Node_Packages.md).




