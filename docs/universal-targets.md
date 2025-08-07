# Universal Targets Implementation

## Overview

Universal targets are eight specific Nx targets that must exist in **all** project.json files across the workspace. These targets provide consistent linting, type checking, validation, and auditing capabilities across all packages.

## Universal Targets Definition

The following eleven targets are considered universal and must exist in all project.json files:

1. **`lint`** - ESLint validation for the current package
2. **`lint:full`** - Full dependency chain linting (current package + all dependencies)
3. **`check-types`** - TypeScript type checking for the current package
4. **`check-types:full`** - Full dependency chain type checking
5. **`validate`** - Combined lint, check-types, and audit for the current package
6. **`validate:full`** - Combined lint:full, check-types:full, and audit:full for the full dependency chain
7. **`audit`** - Structure auditing for the current package
8. **`audit:full`** - Full dependency chain structure auditing
9. **`clean`** - Clean all build artifacts (dist, coverage, .nx)
10. **`clean:dist`** - Clean only dist directory
11. **`clean:cache`** - Clean only .nx cache directory

## Implementation Pattern

All universal targets follow a consistent dynamic pattern using `dependsOn` instead of hardcoded commands:

### Core Pattern

```json
{
    "lint": { "extends": "lint" },
    "lint:full": { "extends": "lint:full" },
    "check-types": { "extends": "check-types" },
    "check-types:full": { "extends": "check-types:full" },
    "validate": { "extends": "validate" },
    "validate:full": { "extends": "validate:full" },
    "audit": { "extends": "audit" },
    "audit:full": { "extends": "audit:full" },
    "clean": { "extends": "clean" },
    "clean:dist": { "extends": "clean:dist" },
    "clean:cache": { "extends": "clean:cache" }
}
```

### Ext Pattern

```json
{
    "lint": { "extends": "lint" },
    "lint:full": { "extends": "lint:full" },
    "check-types": { "extends": "check-types" },
    "check-types:full": { "extends": "check-types:full" },
    "validate": { "extends": "validate" },
    "validate:full": { "extends": "validate:full" },
    "audit": { "extends": "audit" },
    "audit:full": { "extends": "audit:full" },
    "clean": { "extends": "clean" },
    "clean:dist": { "extends": "clean:dist" },
    "clean:cache": { "extends": "clean:cache" }
}
```

## Package Status

All packages now have the correct universal targets implementation:

### ✅ Core Packages

- [x] **ai-agent-interactor/core** - Updated with universal targets
- [x] **context-cherry-picker/core** - Reference implementation
- [x] **dynamicons/core** - Updated with universal targets
- [x] **ghost-writer/core** - Updated with universal targets
- [x] **note-hub/core** - Updated with universal targets
- [x] **project-butler/core** - Updated with universal targets

### ✅ Ext Packages

- [x] **ai-agent-interactor/ext** - Updated with universal targets
- [x] **context-cherry-picker/ext** - Updated with universal targets
- [x] **dynamicons/ext** - Updated with universal targets
- [x] **ghost-writer/ext** - Updated with universal targets
- [x] **note-hub/ext** - Updated with universal targets
- [x] **project-butler/ext** - Updated with universal targets

### ✅ Lib Packages

- [x] **mockly** - Updated with universal targets
- [x] **shared** - Updated with universal targets

## Validation

The structure auditor (`libs/tools/structure-auditor`) validates that all packages have the correct universal targets implementation. The auditor checks:

1. **Existence** - All eleven universal targets must exist
2. **Executor** - Targets must use the correct executor (`nx:run-commands` for full targets)
3. **Dependencies** - Targets must use the correct `dependsOn` arrays
4. **Options** - Targets must have the correct options configuration
5. **Extends** - Targets must extend the correct global target

## Usage

### Running Universal Targets

```bash
# Run lint for current package
nx lint <package-name>

# Run lint for full dependency chain
nx lint:full <package-name>

# Run type checking for current package
nx check-types <package-name>

# Run type checking for full dependency chain
nx check-types:full <package-name>

# Run validation for current package (lint + check-types + audit)
nx validate <package-name>

# Run validation for full dependency chain (lint:full + check-types:full + audit:full)
nx validate:full <package-name>

# Run audit for current package
nx audit <package-name>

# Run audit for full dependency chain
nx audit:full <package-name>

# Clean all build artifacts
nx clean <package-name>

# Clean only dist directory
nx clean:dist <package-name>

# Clean only cache directory
nx clean:cache <package-name>
```

### Examples

```bash
# Validate the context-cherry-picker core package
nx validate @fux/context-cherry-picker-core

# Validate the full dependency chain for context-cherry-picker ext
nx validate:full @fux/context-cherry-picker-ext

# Lint the shared library
nx lint @fux/shared

# Type check the full dependency chain for ghost-writer
nx check-types:full @fux/ghost-writer-core

# Audit the ghost-writer package
nx audit @fux/ghost-writer-ext

# Audit the full dependency chain for ghost-writer
nx audit:full @fux/ghost-writer-ext

# Clean all build artifacts for ghost-writer
nx clean @fux/ghost-writer-ext

# Clean only dist directory for ghost-writer
nx clean:dist @fux/ghost-writer-ext

# Clean only cache directory for ghost-writer
nx clean:cache @fux/ghost-writer-ext
```

## Benefits

1. **Consistency** - All packages have the same validation capabilities
2. **Dependency Awareness** - Full targets automatically handle dependencies
3. **Maintainability** - Centralized pattern reduces duplication
4. **Automation** - Structure auditor ensures compliance
5. **Developer Experience** - Consistent commands across all packages

## Migration Notes

- All packages have been migrated from hardcoded commands to dynamic `dependsOn` patterns
- The `validate` and `validate:full` targets now include audit functionality
- The `audit` and `audit:full` targets were added to all packages
- The `clean`, `clean:dist`, and `clean:cache` targets were added to all packages
- All targets now use the correct executor and options configuration
- The structure auditor validates compliance automatically
