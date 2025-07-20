# Package Templates

This document shows the simplified `project.json` templates for core and extension packages using the global targets defined in `nx.json`.

## Core Package Template

For packages that provide shared functionality (like `@fux/utilities`, `@fux/ghost-writer-core`, etc.):

```json
{
    "name": "@fux/package-name-core",
    "$schema": "../../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "packages/package-name/core/src",
    "projectType": "library",
    "targets": {
        "build": {
            "extends": "build:core"
        },
        "lint": {}
    }
}
```

## Extension Package Template

For VSCode extensions (like `@fux/ghost-writer-ext`, `@fux/project-butler-ext`, etc.):

```json
{
    "name": "@fux/package-name-ext",
    "$schema": "../../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "packages/package-name/ext/src",
    "projectType": "application",
    "targets": {
        "build": {
            "extends": "build:extension"
        },
        "package:dev": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node ./_scripts/create-dev-vsix.js package-name/ext"
            }
        },
        "package": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "outputs": ["{workspaceRoot}/vsix_packages/package-name.vsix"],
            "options": {
                "command": "vsce package --no-dependencies -o ../../vsix_packages/package-name.vsix",
                "cwd": "{projectRoot}"
            }
        },
        "publish": {
            "executor": "nx:run-commands",
            "dependsOn": ["package"],
            "options": {
                "command": "vsce publish",
                "cwd": "{projectRoot}"
            }
        },
        "lint": {}
    }
}
```

## Required TypeScript Configuration

### Core Package (`tsconfig.lib.json`)

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "baseUrl": ".",
        "rootDir": "src",
        "outDir": "dist",
        "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
        "emitDeclarationOnly": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "references": []
}
```

### Extension Package (`tsconfig.lib.json`)

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "baseUrl": ".",
        "rootDir": "src",
        "outDir": "dist",
        "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
        "emitDeclarationOnly": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "references": [{ "path": "../core/tsconfig.lib.json" }]
}
```

## Benefits

1. **Consistency**: All packages use the same proven build configuration
2. **Maintainability**: Changes to build logic only need to be made in `nx.json`
3. **Simplicity**: New packages only need minimal configuration
4. **Performance**: Optimized bundle sizes and build times
5. **Type Safety**: Proper TypeScript declaration generation

## Global Targets

The global targets are defined in `nx.json` under `targetDefaults`:

- `build:core`: For shared libraries that generate declarations
- `build:extension`: For VSCode extensions that bundle dependencies

These targets include all the optimizations we've discovered:

- Proper dependency ordering
- TypeScript declaration generation
- ESBuild bundling with tree-shaking
- Asset copying
- Minification for production
