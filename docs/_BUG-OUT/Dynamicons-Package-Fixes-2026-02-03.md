# Dynamicons Package Fixes - 2026-02-03

## Overview

This document details the comprehensive fixes applied to the `packages/dynamicons` package ecosystem to resolve test discovery issues, broken package references, and VSIX packaging problems.

---

## Issues Identified

### 1. Test Discovery Including node_modules Tests
**Symptom**: Running `nx run @fux/dynamicons-ext:test` was executing 332 tests instead of 67, including tests from `@fux/dynamicons-assets` and `@fux/dynamicons-core` via node_modules symlinks.

**Root Cause**: The ext's vitest.config.ts did not exclude `node_modules` from test discovery. When workspace dependencies are linked via pnpm, their test files become visible.

### 2. Broken Package Target Reference
**Symptom**: The `package` and `package:dev` targets in ext's project.json referenced `@fux/vsix-packager:cli` which did not exist.

**Root Cause**: The project referenced a non-existent `@fux/vsix-packager` project instead of using the available `@fux/vpack:pack` executor.

### 3. Missing Workspace Dependencies in VSIX
**Symptom**: The packaged VSIX did not include workspace dependencies (`@fux/dynamicons-assets`, `@fux/dynamicons-core`) in node_modules.

**Root Cause**: The vpack executor skipped dependencies with `link:` versions (workspace packages) when copying to the deploy directory.

### 4. External Dependency Not Available
**Symptom**: `strip-json-comments` was marked as external in the build but not available in the VSIX node_modules.

**Root Cause**: The dependency was in `devDependencies` of core (not `dependencies`), so `pnpm list --prod` didn't include it. Being marked external meant it wasn't bundled either.

---

## Fixes Applied

### Fix 1: Exclude node_modules from Test Discovery

**File**: `packages/dynamicons/ext/vitest.config.ts`

**Change**: Added `**/node_modules/**` to the exclude array.

```typescript
// BEFORE
exclude: [
    '**/__tests__/integration-tests/**',
    '**/__tests__/_out-tsc/**',
],

// AFTER
exclude: [
    '**/__tests__/integration-tests/**',
    '**/__tests__/_out-tsc/**',
    '**/node_modules/**',
],
```

**Impact**: Ext tests now correctly run only 67 tests (its own tests) instead of 332.

---

### Fix 2: Update Package Targets to Use vpack Executor

**File**: `packages/dynamicons/ext/project.json`

**Change**: Replaced the broken `nx:run-commands` targets with proper `@fux/vpack:pack` executor configuration.

```json
// BEFORE
"package": {
    "executor": "nx:run-commands",
    "dependsOn": ["build"],
    "options": {
        "commands": [
            "nx run @fux/vsix-packager:cli",
            "node libs/vsix-packager/dist/cli/index.js packages/dynamicons/ext vsix_packages"
        ],
        "parallel": false
    }
}

// AFTER
"package": {
    "executor": "@fux/vpack:pack",
    "dependsOn": ["build"],
    "outputs": ["{options.outputPath}"],
    "options": {
        "targetPath": "packages/dynamicons/ext",
        "outputPath": "vsix_packages",
        "deployPath": "packages/dynamicons/ext/.vpack/deploy",
        "freshDeploy": true,
        "keepDeploy": true,
        "contentsPath": "packages/dynamicons/ext/.vpack/contents",
        "extractContents": true,
        "dev": false
    }
}
```

**Impact**: Packaging now works correctly using the proper vpack executor.

---

### Fix 3: Remove strip-json-comments from External List

**File**: `packages/dynamicons/ext/project.json`

**Change**: Removed `strip-json-comments` from the external array in the build target.

```json
// BEFORE
"external": [
    "vscode",
    "strip-json-comments",
    "@fux/dynamicons-assets"
]

// AFTER
"external": [
    "vscode",
    "@fux/dynamicons-assets"
]
```

**Impact**: `strip-json-comments` is now bundled into the extension instead of requiring a separate node_modules entry.

---

### Fix 4: Enhanced vpack to Handle Workspace Dependencies

**File**: `plugins/vpack/src/executors/pack/pack.ts`

**Change**: Modified the `copyDependencyTree` function to handle workspace `link:` dependencies by:
1. Copying their `package.json`, `dist/`, and `assets/` folders
2. Recursively resolving their own dependencies

```typescript
// Added helper function
function resolveWorkspacePkgDeps(pkgPath: string, processed: Set<string>): void {
    try {
        const wsDepListOutput = execSync(`pnpm list --prod --json --depth=Infinity`, {
            cwd: pkgPath,
            encoding: 'utf-8',
            timeout: 60000,
        })
        const wsDepList = JSON.parse(wsDepListOutput)
        const wsProjectDeps = wsDepList.length > 0 ? wsDepList[0].dependencies : undefined
        if (wsProjectDeps) {
            copyDependencyTree(wsProjectDeps, processed)
        }
    } catch (err) {
        logger.warn(`Could not resolve dependencies for workspace package at ${pkgPath}: ${err}`)
    }
}

// Modified copyDependencyTree to handle workspace deps
if (isWorkspaceDep && depInfo?.path) {
    // Handle workspace dependencies - copy built output only
    const destPath = join(deployNodeModules, depName)
    const sourcePath = depInfo.path as string

    if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true })
        
        // Copy package.json (required)
        const pkgJsonSrc = join(sourcePath, 'package.json')
        if (existsSync(pkgJsonSrc)) {
            cpSync(pkgJsonSrc, join(destPath, 'package.json'))
        }
        
        // Copy dist folder (built output)
        const distSrc = join(sourcePath, 'dist')
        if (existsSync(distSrc)) {
            cpSync(distSrc, join(destPath, 'dist'), { recursive: true })
        }
        
        // Copy assets folder if present (for asset packages)
        const assetsSrc = join(sourcePath, 'assets')
        if (existsSync(assetsSrc)) {
            cpSync(assetsSrc, join(destPath, 'assets'), { recursive: true })
        }
        
        logger.info(`Copied workspace dependency: ${depName}`)
    }
    
    // Resolve and copy dependencies of the workspace package
    resolveWorkspacePkgDeps(sourcePath, processed)
}
```

**Impact**: Workspace dependencies are now properly included in the VSIX with their built output.

---

## Verified Architecture

The dynamicons package ecosystem now correctly implements the intended architecture:

### Package Structure

| Package                  | Type        | Format     | Purpose                                    |
| ------------------------ | ----------- | ---------- | ------------------------------------------ |
| `@fux/dynamicons-core`   | Library     | ESM        | Pure business logic with interfaces        |
| `@fux/dynamicons-assets` | Library     | ESM        | Asset generation (icons, themes, previews) |
| `@fux/dynamicons-ext`    | Application | CJS Bundle | VSCode extension wrapper                   |

### Key Architecture Points

1. **Core Package**
   - Uses only TYPE imports from vscode (`import type { Uri } from 'vscode'`)
   - All VSCode interactions through interfaces (IWindow, ICommands, IContext, etc.)
   - Pure business logic with no runtime vscode dependencies

2. **Assets Package**
   - Encapsulates all asset generation
   - CLI for generating themes, icons, and previews
   - Exports theme files and icon assets

3. **Ext Package**
   - Small wrapper (~47KB bundled)
   - Provides adapter implementations for core interfaces
   - References assets via node_modules for theme paths

### VSIX Structure

```
extension/
├── dist/
│   └── extension.cjs          # Bundled extension code
├── node_modules/
│   └── @fux/
│       ├── dynamicons-assets/
│       │   ├── assets/        # Icons, themes
│       │   ├── dist/          # Built assets
│       │   └── package.json
│       └── dynamicons-core/
│           ├── dist/          # Built core (also bundled)
│           └── package.json
├── assets/
│   └── logo.jpeg
├── package.json
├── README.md
└── LICENSE.txt
```

---

## Test Results After Fixes

| Package                | Tests   | Status           |
| ---------------------- | ------- | ---------------- |
| @fux/dynamicons-core   | 100     | ✅ Passed         |
| @fux/dynamicons-assets | 165     | ✅ Passed         |
| @fux/dynamicons-ext    | 67      | ✅ Passed         |
| **Total**              | **332** | ✅ **All Passed** |

---

## Commands to Verify

```bash
# Run all dynamicons tests
nx run @fux/dynamicons-core:test
nx run @fux/dynamicons-assets:test
nx run @fux/dynamicons-ext:test

# Build and package
nx run @fux/dynamicons-ext:build
nx run @fux/dynamicons-ext:package

# Dev package (with hash suffix)
nx run @fux/dynamicons-ext:package:dev

# Check VSIX contents
Get-ChildItem -Path "packages\dynamicons\ext\.vpack\contents\dynamicons\extension" -Recurse -Name
```

---

## Files Modified

1. `packages/dynamicons/ext/vitest.config.ts` - Added node_modules exclusion
2. `packages/dynamicons/ext/project.json` - Updated package targets, removed strip-json-comments from externals
3. `plugins/vpack/src/executors/pack/pack.ts` - Enhanced to handle workspace dependencies

---

## Related Documentation

- Architecture: `docs/_Architecture.md`
- Package Archetypes: `docs/_Package-Archetypes.md`
- Testing Strategy: `docs/testing/_Testing-Strategy.md`
- vpack Plugin: `plugins/vpack/README.md`

---

---

## Additional Fixes (Same Session)

### Fix 5: Missing package.json Export in Assets Package

**Symptom**: `CRITICAL: Cannot resolve @fux/dynamicons-assets package. Error: ERR_PACKAGE_PATH_NOT_EXPORTED`

**Root Cause**: The assets package.json `exports` field didn't include `./package.json`, which is needed by `require.resolve('@fux/dynamicons-assets/package.json')`.

**File**: `packages/dynamicons/assets/package.json`

```json
// BEFORE
"exports": {
    "./themes/*": "./dist/assets/themes/*",
    ...
}

// AFTER
"exports": {
    "./package.json": "./package.json",
    "./themes/*": "./dist/assets/themes/*",
    ...
}
```

---

### Fix 6: Windows Path Handling in AssetPathResolver

**Symptom**: Theme paths were malformed on Windows: `...package.json\dist\assets\themes\...`

**Root Cause**: Used `.replace('/package.json', '')` which doesn't work with Windows backslashes.

**File**: `packages/dynamicons/ext/src/utils/asset-path-resolver.ts`

```typescript
// BEFORE
this.assetsPackagePath = require.resolve('@fux/dynamicons-assets/package.json')
    .replace('/package.json', '')

// AFTER
import { dirname } from 'path'
// ...
const packageJsonPath = require.resolve('@fux/dynamicons-assets/package.json')
this.assetsPackagePath = dirname(packageJsonPath)
```

---

### Fix 7: Incorrect Icon Relative Paths in Theme Generation

**Symptom**: Icons not loading - theme file had wrong relative paths.

**Root Cause**: Theme file at `dist/assets/themes/` referenced icons with `../assets/icons/` but icons are at `assets/icons/` (not in dist). The path should be `../../../assets/icons/`.

**File**: `packages/dynamicons/assets/src/processors/theme-processor.ts`

```typescript
// BEFORE
iconPath: `../assets/icons/file_icons/${icon.iconName}.svg`
iconPath: `../assets/icons/folder_icons/folder-${icon.iconName}.svg`
iconPath: `../assets/icons/folder_icons/folder-${icon.iconName}-open.svg`
iconPath: `../assets/icons/language_icons/${icon.iconName}`

// AFTER
iconPath: `../../../assets/icons/file_icons/${icon.iconName}.svg`
iconPath: `../../../assets/icons/folder_icons/folder-${icon.iconName}.svg`
iconPath: `../../../assets/icons/folder_icons/folder-${icon.iconName}-open.svg`
iconPath: `../../../assets/icons/language_icons/${icon.iconName}`
```

**Important**: After changing theme-processor.ts, you must:
1. Delete `packages/dynamicons/assets/dist/`
2. Rebuild: `nx run @fux/dynamicons-assets:build --skip-nx-cache`
3. Regenerate: `nx run @fux/dynamicons-assets:generate-assets --skip-nx-cache`

---

### Fix 8: Updated Integration Test Targets to Use Proper Executor

**File**: `packages/dynamicons/ext/project.json`

**Change**: Replaced `nx:run-commands` with `@fux/vscode-test-executor:test-integration`.

```json
// BEFORE
"test:integration": {
    "executor": "nx:run-commands",
    "dependsOn": ["build", "test:compile"],
    "options": {
        "commands": [
            "nx run @fux/vscode-test-cli-config:build",
            "vscode-test --config .vscode-test.mjs"
        ],
        "cwd": "packages/dynamicons/ext"
    }
}

// AFTER
"test:integration": {
    "executor": "@fux/vscode-test-executor:test-integration",
    "dependsOn": ["build"],
    "cache": false,
    "options": {
        "tsConfig": "{projectRoot}/__tests__/integration-tests/tsconfig.test.json",
        "config": "{projectRoot}/.vscode-test.mjs",
        "timeout": 20000,
        "filterOutput": true
    }
}
```

---

### Fix 9: Language Icons Referencing Non-Existent Folder

**Symptom**: Icons not loading - theme referenced `assets/icons/language_icons/` which doesn't exist.

**Root Cause**: The theme-processor generated paths to `language_icons/` folder, but all icons (including language icons) are in `file_icons/`. Also, language icon paths were missing the `.svg` extension.

**File**: `packages/dynamicons/assets/src/processors/theme-processor.ts`

```typescript
// BEFORE
iconPath: `../../../assets/icons/language_icons/${icon.iconName}`

// AFTER
iconPath: `../../../assets/icons/file_icons/${icon.iconName}.svg`
```

---

### Fix 10: Color Theme File Path Wrong

**Symptom**: `Unable to load focused-ux-colors.theme.json`

**Root Cause**: `package.json` pointed to `dist/assets/themes/focused-ux-colors.theme.json` but the file is at `assets/themes/focused-ux-colors.theme.json`.

**File**: `packages/dynamicons/ext/package.json`

```json
// BEFORE
"path": "./node_modules/@fux/dynamicons-assets/dist/assets/themes/focused-ux-colors.theme.json"

// AFTER
"path": "./node_modules/@fux/dynamicons-assets/assets/themes/focused-ux-colors.theme.json"
```

---

### Fix 11: Default File/Folder/Root Icons Not Defined

**Symptom**: Plain folders and root folder icons missing.

**Root Cause**: Theme had `"file": "file"`, `"folder": "basic"`, `"rootFolder": "root"` but no corresponding icon definitions (`_file`, `_folder-basic`, `_folder-root`) existed.

**File**: `packages/dynamicons/assets/src/processors/theme-processor.ts`

```typescript
// BEFORE - No icon definitions for defaults, wrong references
file: fileIconsModel.file.iconName,  // "file" - no definition exists
folder: folderIconsModel.folder.iconName,  // "basic" - no definition exists

// AFTER - Added icon definitions and correct references
// 1. Added icon definitions for defaults:
themeManifest.iconDefinitions[`_${defaultFileIconName}`] = {
    iconPath: `../../../assets/icons/file_icons/${defaultFileIconName}.svg`,
}
themeManifest.iconDefinitions[`_folder-${defaultFolderIconName}`] = {
    iconPath: `../../../assets/icons/folder_icons/folder-${defaultFolderIconName}.svg`,
}
// ... same for -open variants and root folder

// 2. Changed references to use underscore prefix:
file: `_${fileIconsModel.file.iconName}`,  // "_file"
folder: `_folder-${folderIconsModel.folder.iconName}`,  // "_folder-basic"
folderExpanded: `_folder-${folderIconsModel.folder.iconName}-open`,  // "_folder-basic-open"
rootFolder: `_folder-${folderIconsModel.rootFolder.iconName}`,  // "_folder-root"
rootFolderExpanded: `_folder-${folderIconsModel.rootFolder.iconName}-open`,  // "_folder-root-open"
```

---

### Fix 12: Comprehensive Integration Tests Added

**Issue**: Integration tests ran against development extension, not packaged VSIX, missing file existence issues.

**Added Tests** (30 total):
- Extension lifecycle (4 tests)
- Command registration (2 tests)
- Theme files validation (5 tests)
- Configuration (4 tests)
- Command execution (5 tests)
- Icon theme integration (2 tests)
- Menu contributions (2 tests)
- Color theme (2 tests)
- Asset path validation (4 tests) - **NEW**
  - `All icon paths in theme should reference existing icon folder`
  - `Icon paths should have .svg extension`
  - `Default icons should be properly defined`
  - `Sample icon files should exist`

---

### Fix 13: Test Mode Skip Activation Prompt

**Issue**: Extension showed "activate icon theme?" dialog during tests, blocking execution.

**File**: `packages/dynamicons/ext/src/extension.ts`

```typescript
// ADDED
async function activateIconThemeIfNeeded(...) {
    // Skip activation prompt during tests
    if (process.env.VSCODE_TEST === '1') {
        return
    }
    // ... rest of function
}
```

---

### Fix 14: TypeScript Test Config Missing declarationMap Override

**Issue**: Test compilation failed with `TS5069: Option 'declarationMap' cannot be specified without 'declaration'`

**File**: `packages/dynamicons/ext/__tests__/tsconfig.test.json`

```json
// ADDED
"declarationMap": false
```

---

## Complete File Change Summary

| File                                                                          | Changes                                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/dynamicons/ext/vitest.config.ts`                                    | Added node_modules exclusion                                                                    |
| `packages/dynamicons/ext/project.json`                                        | Updated package targets, removed strip-json-comments external, updated integration test targets |
| `packages/dynamicons/assets/package.json`                                     | Added `./package.json` export                                                                   |
| `packages/dynamicons/ext/package.json`                                        | Fixed color theme path                                                                          |
| `packages/dynamicons/ext/src/utils/asset-path-resolver.ts`                    | Used `dirname()` for cross-platform path handling                                               |
| `packages/dynamicons/ext/src/extension.ts`                                    | Added test mode check to skip activation prompt                                                 |
| `packages/dynamicons/assets/src/processors/theme-processor.ts`                | Fixed icon paths, language icons, default icons (6 changes)                                     |
| `packages/dynamicons/ext/__tests__/tsconfig.test.json`                        | Added `declarationMap: false`                                                                   |
| `packages/dynamicons/ext/__tests__/integration-tests/suite/extension.test.ts` | Comprehensive tests (30 total)                                                                  |
| `plugins/vpack/src/executors/pack/pack.ts`                                    | Enhanced to handle workspace dependencies                                                       |

---

## Test Coverage Summary

| Suite                  | Tests  | Coverage                                     |
| ---------------------- | ------ | -------------------------------------------- |
| Extension Lifecycle    | 4      | Presence, metadata, activation, events       |
| Command Registration   | 2      | All 7 commands registered                    |
| Theme Files            | 5      | Contribution, path, JSON validity, structure |
| Configuration          | 4      | Properties, defaults, reading values         |
| Command Execution      | 5      | All commands executable                      |
| Icon Theme Integration | 2      | Theme settings, activation                   |
| Menu Contributions     | 2      | Context menus, submenus                      |
| Color Theme            | 2      | Contribution, file existence                 |
| Asset Path Validation  | 4      | Folder refs, .svg extension, defaults, files |
| **Total**              | **30** |                                              |

---

## Future Considerations

1. **Orchestrator Extension**: The architecture supports having multiple core packages consumed by a main orchestrator extension
2. **Dependency Optimization**: The vpack enhancement can be further optimized to only copy production-needed files
3. **Cache Improvements**: Consider adding caching to the workspace dependency resolution in vpack
4. **Theme Path Constants**: Consider using a constant for the relative path prefix to avoid duplication
5. **VSIX Content Tests**: Consider adding post-package tests that extract and verify VSIX contents directly
