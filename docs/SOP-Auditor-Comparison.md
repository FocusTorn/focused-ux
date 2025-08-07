# SOP vs Auditor Comparison: Universal Targets

## Overview

This document compares the current SOP requirements with the structure auditor's validation rules for universal targets across all project types (core, ext, lib).

## Universal Targets Definition

The auditor now enforces **universal targets** that must exist in **all** project.json files across the workspace:

- `lint` - ESLint validation
- `lint:full` - Full dependency chain linting
- `check-types` - TypeScript type checking
- `check-types:full` - Full dependency chain type checking
- `validate` - Combined lint and check-types
- `validate:full` - Combined lint:full and check-types:full

## Current SOP Status vs Auditor Requirements

### ✅ SOP Covers These Areas

| Area                | SOP Section     | Status      | Notes                                        |
| ------------------- | --------------- | ----------- | -------------------------------------------- |
| Package Structure   | Section 2       | ✅ Complete | Well documented archetypes and decision tree |
| Build Configuration | Section 3.3-3.4 | ✅ Complete | Detailed build strategies for core/ext       |
| Dependency Flow     | Section 3.1     | ✅ Complete | Clear dependency rules                       |
| TypeScript Config   | Section 7.1     | ✅ Complete | Comprehensive TS configuration               |
| VSCode Adapters     | Section 7.2.1   | ✅ Complete | Centralization requirements                  |
| DI with Awilix      | Section 7.3     | ✅ Complete | Dependency injection patterns                |
| Externalization     | Section 7.4     | ✅ Complete | Node package externalization                 |
| Common Pitfalls     | Section 9       | ✅ Complete | Lessons learned                              |

### ❌ SOP Missing Universal Targets

| Target             | SOP Status        | Auditor Requirement          | Gap                                    |
| ------------------ | ----------------- | ---------------------------- | -------------------------------------- |
| `lint`             | ❌ Not documented | ✅ Required for all projects | Missing universal target documentation |
| `lint:full`        | ❌ Not documented | ✅ Required for all projects | Missing dynamic pattern documentation  |
| `check-types`      | ❌ Not documented | ✅ Required for all projects | Missing universal target documentation |
| `check-types:full` | ❌ Not documented | ✅ Required for all projects | Missing dynamic pattern documentation  |
| `validate`         | ❌ Not documented | ✅ Required for all projects | Missing universal target documentation |
| `validate:full`    | ❌ Not documented | ✅ Required for all projects | Missing dynamic pattern documentation  |

## Detailed Auditor Requirements

### Universal Target Structure

All projects (core, ext, lib) must implement these targets with the exact structure:

#### 1. `lint` Target

```json
{
    "lint": {
        "executor": "@nx/eslint:lint",
        "dependsOn": ["^build"],
        "inputs": ["lint"]
    }
}
```

#### 2. `lint:full` Target

```json
{
    "lint:full": {
        "executor": "nx:run-commands",
        "dependsOn": ["^lint", "lint"],
        "options": {
            "commands": [],
            "parallel": false
        }
    }
}
```

#### 3. `check-types` Target

```json
{
    "check-types": {
        "executor": "@nx/js:tsc",
        "outputs": ["{options.outputPath}"],
        "dependsOn": ["^build"],
        "options": {
            "tsConfig": "{projectRoot}/tsconfig.lib.json",
            "main": "{projectRoot}/src/index.ts",
            "outputPath": "{projectRoot}/dist"
        }
    }
}
```

#### 4. `check-types:full` Target

```json
{
    "check-types:full": {
        "executor": "nx:run-commands",
        "dependsOn": ["^check-types", "check-types"],
        "options": {
            "commands": [],
            "parallel": false
        }
    }
}
```

#### 5. `validate` Target

```json
{
    "validate": {
        "executor": "nx:run-commands",
        "dependsOn": ["lint", "check-types"],
        "options": {
            "commands": [],
            "parallel": false
        }
    }
}
```

#### 6. `validate:full` Target

```json
{
    "validate:full": {
        "executor": "nx:run-commands",
        "dependsOn": ["lint:full", "check-types:full"],
        "options": {
            "commands": [],
            "parallel": false
        }
    }
}
```

## Required SOP Updates

### 1. Add Universal Targets Section

**New Section 3.7: Universal Targets**

```markdown
### 3.7. :: Universal Targets

All packages (core, ext, lib) MUST implement the following universal targets that provide consistent validation and testing capabilities across the workspace.

#### 3.7.1. :: Required Universal Targets

**`lint` Target:**

- **Executor**: `@nx/eslint:lint`
- **Purpose**: ESLint validation for the current package
- **Dependencies**: `^build` (ensures dependencies are built first)
- **Configuration**: Uses workspace ESLint configuration

**`lint:full` Target:**

- **Executor**: `nx:run-commands`
- **Purpose**: Full dependency chain linting (current package + all dependencies)
- **Dependencies**: `^lint` (dependencies) + `lint` (current package)
- **Configuration**: Empty commands array, parallel: false

**`check-types` Target:**

- **Executor**: `@nx/js:tsc`
- **Purpose**: TypeScript type checking for the current package
- **Dependencies**: `^build` (ensures dependencies are built first)
- **Configuration**: Uses project-specific tsconfig.lib.json

**`check-types:full` Target:**

- **Executor**: `nx:run-commands`
- **Purpose**: Full dependency chain type checking
- **Dependencies**: `^check-types` (dependencies) + `check-types` (current package)
- **Configuration**: Empty commands array, parallel: false

**`validate` Target:**

- **Executor**: `nx:run-commands`
- **Purpose**: Combined lint and check-types for current package
- **Dependencies**: `lint` + `check-types`
- **Configuration**: Empty commands array, parallel: false

**`validate:full` Target:**

- **Executor**: `nx:run-commands`
- **Purpose**: Combined lint:full and check-types:full for full dependency chain
- **Dependencies**: `lint:full` + `check-types:full`
- **Configuration**: Empty commands array, parallel: false

#### 3.7.2. :: Universal Target Implementation

All packages MUST implement these targets using the exact structure specified above. The auditor will validate:

1. **Existence**: All six targets must be present
2. **Executors**: Correct executor for each target type
3. **Dependencies**: Proper dependsOn arrays matching the pattern
4. **Options**: Correct options configuration for run-commands targets

#### 3.7.3. :: Dynamic Pattern Benefits

The universal targets use a dynamic pattern that:

- **Automatically handles dependencies**: `^` prefix ensures dependencies are built/validated first
- **Reduces boilerplate**: Empty commands arrays let Nx handle execution
- **Ensures consistency**: Same pattern across all package types
- **Enables full-chain validation**: `:full` targets validate entire dependency trees
```

### 2. Update Package Structure Decision Tree

**Section 2.1: Package Structure Decision Tree**

Add to the decision tree:

```markdown
### Universal Targets Requirement

**All packages MUST implement universal targets regardless of type:**

- `lint` - ESLint validation
- `lint:full` - Full dependency chain linting
- `check-types` - TypeScript type checking
- `check-types:full` - Full dependency chain type checking
- `validate` - Combined validation
- `validate:full` - Full dependency chain validation

**Implementation Pattern:**

- Use dynamic `dependsOn` arrays with `^` prefix for dependencies
- Use `nx:run-commands` executor for combined targets
- Use empty `commands` arrays and `parallel: false` for run-commands
```

### 3. Update Build Commands Reference

**Section 9: Build Commands Reference**

Add new section:

````markdown
### 9.5. :: Universal Target Commands

```bash
# Lint current package
nx lint @fux/package-name

# Lint full dependency chain
nx lint:full @fux/package-name

# Check types for current package
nx check-types @fux/package-name

# Check types for full dependency chain
nx check-types:full @fux/package-name

# Validate current package (lint + check-types)
nx validate @fux/package-name

# Validate full dependency chain
nx validate:full @fux/package-name
```
````

**Alias Commands:**

```bash
# Using project aliases
gw l          # lint ghost-writer-core
gw lf         # lint:full ghost-writer-core
gw tc         # check-types ghost-writer-core
gw tcf        # check-types:full ghost-writer-core
gw v          # validate ghost-writer-core
gw vf         # validate:full ghost-writer-core
```

````

### 4. Update Common Pitfalls Section

**Section 9: Common Pitfalls & Lessons Learned**

Add new subsection:

```markdown
### 9.5. :: Universal Targets Issues

**Problem**: Auditor reports missing or invalid universal targets

**Root Cause**: Package doesn't implement the required universal target structure

**Solution**: Implement all six universal targets with exact structure:

1. **Copy from CCP**: Use `packages/context-cherry-picker/core/project.json` as the reference implementation
2. **Verify structure**: Ensure dependsOn arrays and options match exactly
3. **Test validation**: Run `nx validate` and `nx validate:full` to verify functionality

**Common Issues**:
- **Missing targets**: All six targets must be present
- **Wrong executors**: Use correct executor for each target type
- **Invalid dependsOn**: Must match exact pattern (e.g., `['^lint', 'lint']` for lint:full)
- **Wrong options**: run-commands targets must have `{ commands: [], parallel: false }`

**Prevention**: Always use the CCP package as the reference implementation when creating new packages.
````

## Implementation Priority

### Phase 1: Documentation Updates

1. ✅ Add Universal Targets section to SOP
2. ✅ Update Package Structure Decision Tree
3. ✅ Update Build Commands Reference
4. ✅ Update Common Pitfalls section

### Phase 2: Package Updates

1. **Core packages**: Add missing `validate` and `validate:full` targets
2. **Ext packages**: Update `validate` and `validate:full` to use dynamic pattern
3. **Lib packages**: Add all universal targets

### Phase 3: Validation

1. **Run auditor**: Verify all packages pass validation
2. **Test commands**: Ensure all universal targets work correctly
3. **Update CI**: Include universal target validation in CI pipeline

## Conclusion

The SOP needs significant updates to document the universal targets requirement. The auditor is now enforcing a consistent pattern across all package types that ensures:

- **Consistency**: All packages follow the same validation pattern
- **Dependency awareness**: Full-chain validation includes all dependencies
- **Maintainability**: Dynamic pattern reduces boilerplate and errors
- **Quality**: Comprehensive validation across the entire workspace

The CCP package serves as the reference implementation for all universal targets.
