# Externalizing Third-Party Packages v3

## Overview

This document outlines the process and requirements for externalizing third-party packages in VSCode extensions within the FocusedUX workspace, based on the confirmed final architecture patterns.

## Why Externalize?

Third-party packages are externalized (not bundled) into the main extension bundle for several reasons:

1. **Performance**: Bundling large dependencies increases extension startup time
2. **Size**: Keeps the main bundle small and focused
3. **Caching**: Allows VSCode to cache dependencies separately
4. **Maintainability**: Easier to update dependencies without rebuilding the entire extension

## Confirmed Architecture Pattern

### Core Package (`@fux/package-name-core`)

- **Dependencies**: Minimal external dependencies (e.g., `js-yaml` for YAML parsing)
- **Build**: `@nx/esbuild:esbuild` with `bundle: false`, `format: ["esm"]`
- **Externalization**: All dependencies externalized in build configuration

### Extension Package (`@fux/package-name-ext`)

- **Dependencies**: Core package + VSCode APIs + minimal runtime dependencies
- **Build**: `@nx/esbuild:esbuild` with `bundle: true`, `format: ["cjs"]`
- **Externalization**: All dependencies externalized in build configuration

## How It Works

### 1. Build Configuration

In the `project.json` file, third-party packages are listed in the `external` array:

**Core Package:**

```json
{
    "build": {
        "executor": "@nx/esbuild:esbuild",
        "options": {
            "external": ["vscode", "dependency1", "dependency2"]
        }
    }
}
```

**Extension Package:**

```json
{
    "build": {
        "executor": "@nx/esbuild:esbuild",
        "options": {
            "external": ["vscode", "dependency1", "dependency2"]
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

### Core/Ext Pattern

```
packages/package-name/
├── core/           # Business logic (no VSCode dependencies)
│   ├── package.json
│   ├── project.json
│   └── src/
├── ext/            # VSCode extension wrapper
│   ├── package.json
│   ├── project.json
│   ├── .vscodeignore  # ← Required for node_modules inclusion
│   └── src/
└── all/            # Combined package (optional)
```

## Dependency Management

### Core Package Dependencies

**Minimal Dependencies:**

```json
{
    "dependencies": {
        "essential-dependency": "^1.0.0"
    },
    "devDependencies": {
        "@types/essential-dependency": "^1.0.0",
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "vitest": "^3.2.4"
    }
}
```

**Key Principles:**

- Only include essential runtime dependencies
- Keep dependencies minimal for "guinea pig" package compliance
- No shared dependencies (`@fux/shared`, `@fux/mockly`)
- No DI container dependencies (`awilix`)

### Extension Package Dependencies

**Thin Wrapper Dependencies:**

```json
{
    "dependencies": {
        "@fux/package-name-core": "workspace:*",
        "essential-dependency": "^1.0.0"
    },
    "devDependencies": {
        "@types/node": "^24.0.10",
        "@types/vscode": "^1.99.3",
        "@types/essential-dependency": "^1.0.0",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4",
        "@vitest/coverage-v8": "^3.2.4"
    }
}
```

**Key Principles:**

- Only include core package and essential runtime dependencies
- No DI container dependencies
- No unnecessary build dependencies
- Follow established patterns exactly

## Common Issues and Solutions

### Issue: "Cannot find module 'package-name'"

**Cause**: The package is not properly externalized or the `node_modules` folder is not included in the VSIX.

**Solutions:**

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

### Issue: Unnecessary Dependencies in Extension Package

**Cause**: Extension packages including DI containers or unnecessary build dependencies.

**Solution**: Follow established patterns:

```json
{
    "dependencies": {
        "@fux/package-name-core": "workspace:*"
    },
    "devDependencies": {
        "@types/node": "^24.0.10",
        "@types/vscode": "^1.99.3",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4",
        "@vitest/coverage-v8": "^3.2.4"
    }
}
```

## Best Practices

1. **Minimize Dependencies**: Only include essential third-party packages
2. **Use Workspace Dependencies**: For internal packages, use `workspace:*` instead of external packages
3. **Keep .vscodeignore Updated**: Ensure it includes all necessary files and folders
4. **Test Packaging**: Always test the packaged extension to ensure dependencies are available
5. **Document Dependencies**: Keep the `package.json` dependencies list accurate and minimal
6. **Follow Established Patterns**: Use the exact same dependency structure as working packages

## Validation Checklist

Before packaging an extension, verify:

- [ ] All third-party packages are listed in `external` array in `project.json`
- [ ] `.vscodeignore` file exists and includes `!node_modules/**`
- [ ] Dependencies are in `dependencies` (not `devDependencies`) in `package.json`
- [ ] No phantom dependencies in `pnpm list`
- [ ] Extension activates without "Cannot find module" errors
- [ ] VSIX contains `node_modules` folder with all dependencies
- [ ] Extension package follows established dependency patterns
- [ ] Core package has minimal dependencies only

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

## Lessons Learned

### Dependency Management Insights

**Problem**: Packages had unnecessary dependencies that violated architectural principles.

**Solution**:

- **Remove DI Container Dependencies**: Extension packages should not use `awilix` or other DI containers - use direct instantiation instead
- **Remove Unnecessary Dependencies**: Only include dependencies that are actually needed for VSCode integration
- **Follow Established Patterns**: Use the exact same dependency structure as working packages

### Build Configuration Insights

**Problem**: Build configuration had unnecessary external dependencies that were not actually needed.

**Solution**:

- **Minimal External Dependencies**: Only externalize what's actually needed
- **Remove Build Dependencies**: Don't externalize build-time dependencies like `typescript`, `awilix`, `js-yaml`

### Package Structure Insights

**Problem**: Complex package structures with unnecessary dependencies.

**Solution**:

- **Simple Core Packages**: Core packages should have minimal dependencies
- **Thin Extension Wrappers**: Extension packages should only include essential dependencies
- **Consistent Patterns**: Follow the exact same patterns as working packages

## Conclusion

Proper externalization of third-party packages is essential for:

- **Clean separation of concerns** between core and extension packages
- **Minimal dependency footprints** for better performance
- **Consistent packaging** across all extensions
- **Maintainable codebase** with clear dependency boundaries

By following the established patterns, teams can ensure that their extensions are properly packaged and distributed with all necessary dependencies.
