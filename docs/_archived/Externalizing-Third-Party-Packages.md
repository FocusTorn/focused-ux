# Externalizing Third-Party Packages

## Overview

This document outlines the process and requirements for externalizing third-party packages in VSCode extensions within the FocusedUX workspace.

## Why Externalize?

Third-party packages are externalized (not bundled) into the main extension bundle for several reasons:

1. **Performance**: Bundling large dependencies increases extension startup time
2. **Size**: Keeps the main bundle small and focused
3. **Caching**: Allows VSCode to cache dependencies separately
4. **Maintainability**: Easier to update dependencies without rebuilding the entire extension

## How It Works

### 1. Build Configuration

In the `project.json` file, third-party packages are listed in the `external` array:

```json
{
    "build": {
        "executor": "@nx/esbuild:esbuild",
        "options": {
            "external": ["vscode", "js-yaml", "awilix"]
        }
    }
}
```

### 2. Packaging Process

The `create-vsix.js` script handles the packaging:

1. **Dependency Resolution**: Uses `pnpm list --prod --json --depth=Infinity` to get the complete dependency tree
2. **Node Modules Creation**: Creates a `node_modules` folder in the deployment directory
3. **Dependency Copying**: Copies all production dependencies and their transitive dependencies
4. **VSIX Packaging**: Uses `vsce` to create the final VSIX file

### 3. VSCodeIgnore Configuration

The `.vscodeignore` file must be configured to include the `node_modules` folder:

```gitignore
# 1. Ignore everything by default.
**/*

# 2. Re-include the bundled extension code.
!dist/extension.cjs
!dist/extension.cjs.map

# 3. Re-include the assets.
!assets/**

# 4. Re-include the production node_modules.
!node_modules/**

# 5. Re-include essential package metadata.
!package.json
!README.md
!LICENSE.txt
!CHANGELOG.md
```

## Package Structure

### Core/Ext Pattern (e.g., Context Cherry Picker)

```
packages/context-cherry-picker/
├── core/           # Business logic (no VSCode dependencies)
├── ext/            # VSCode extension wrapper
│   ├── package.json
│   ├── project.json
│   ├── .vscodeignore  # ← Required for node_modules inclusion
│   └── src/
└── all/            # Combined package (optional)
```

### All-in-One Pattern (e.g., Project Maid All)

```
packages/project-maid/
└── all/            # Single package with direct VSCode integration
    ├── package.json
    ├── project.json
    ├── .vscodeignore  # ← Required for node_modules inclusion
    └── src/
```

## Project Maid All - Expanded Functionality

The Project Maid All package demonstrates a simplified, all-in-one approach that includes all Project Butler functionality:

### Features

- **Format Package.json**: Reorders package.json keys according to `.FocusedUX` configuration
- **CD to Here**: Changes terminal directory to the selected file/folder location
- **Create Backup**: Creates numbered backup files (.bak, .bak2, etc.)
- **Enter Poetry Shell**: Opens a Poetry shell in the current directory

### Context Menu Integration

All commands are organized in a flyout submenu called "Project Maid All" in the explorer context menu, keeping the interface clean and organized.

### Activation

The extension activates on startup (`"activationEvents": ["*"]`) due to its small size and lightweight nature.

## Common Issues and Solutions

### Issue: "Cannot find module 'package-name'"

**Cause**: The package is not properly externalized or the `node_modules` folder is not included in the VSIX.

**Solutions**:

1. Ensure the package is listed in the `external` array in `project.json`
2. Verify the `.vscodeignore` file includes `!node_modules/**`
3. Check that the package is in the `dependencies` (not `devDependencies`) in `package.json`

### Issue: Missing .vscodeignore file

**Cause**: The packaging script excludes `node_modules` by default.

**Solution**: Create a `.vscodeignore` file that re-includes `node_modules`:

```gitignore
**/*
!dist/extension.cjs
!dist/extension.cjs.map
!assets/**
!node_modules/**
!package.json
!README.md
!LICENSE.txt
!CHANGELOG.md
```

### Issue: Phantom dependencies

**Cause**: Dependencies that appear in `pnpm list` but not in `package.json`.

**Solution**: Clean up the package dependencies:

```bash
# Remove phantom dependencies
pnpm remove <package-name>

# Reinstall to clean lockfile
pnpm install
```

## Best Practices

1. **Minimize Dependencies**: Only include essential third-party packages
2. **Use Workspace Dependencies**: For internal packages, use `workspace:*` instead of external packages
3. **Keep .vscodeignore Updated**: Ensure it includes all necessary files and folders
4. **Test Packaging**: Always test the packaged extension to ensure dependencies are available
5. **Document Dependencies**: Keep the `package.json` dependencies list accurate and minimal

## Validation Checklist

Before packaging an extension, verify:

- [ ] All third-party packages are listed in `external` array in `project.json`
- [ ] `.vscodeignore` file exists and includes `!node_modules/**`
- [ ] Dependencies are in `dependencies` (not `devDependencies`) in `package.json`
- [ ] No phantom dependencies in `pnpm list`
- [ ] Extension activates without "Cannot find module" errors
- [ ] VSIX contains `node_modules` folder with all dependencies

## Examples

### Working Configuration (Context Cherry Picker)

```json
// project.json
{
    "build": {
        "options": {
            "external": ["vscode", "awilix", "gpt-tokenizer", "js-yaml", "micromatch"]
        }
    }
}
```

```json
// package.json
{
    "dependencies": {
        "@fux/context-cherry-picker-core": "workspace:*",
        "@fux/shared": "workspace:*",
        "awilix": "^12.0.5",
        "gpt-tokenizer": "^3.0.1",
        "js-yaml": "^4.1.0",
        "micromatch": "^4.0.8"
    }
}
```

### Working Configuration (Project Maid All)

```json
// project.json
{
    "build": {
        "options": {
            "external": ["vscode", "js-yaml"]
        }
    }
}
```

```json
// package.json
{
    "dependencies": {
        "js-yaml": "^4.1.0"
    }
}
```

## Troubleshooting Commands

```bash
# Check dependencies
pnpm list --prod --json --depth=Infinity --filter <package-name>

# Test packaging
nx package:dev @fux/<package-name>

# Clean and rebuild
nx clean @fux/<package-name>
nx build @fux/<package-name>

# Check VSIX contents
Expand-Archive -Path vsix_packages/<package-name>-dev.vsix -DestinationPath tmp/vsix-test -Force
ls tmp/vsix-test/extension
```
