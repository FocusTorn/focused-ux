# SOP v2: Build System & Architecture Guidelines

## 1. Build Issues After Error Fixes

### 1.1. Extraneous Dependencies Problem

**Issue:** After fixing TypeScript errors, the packaging process fails with extraneous dependencies errors.

**Root Cause:**

- Build-only dependencies (e.g., `puppeteer`, `sharp`, `svgo`, `tsx`) were incorrectly placed in `dependencies` instead of `devDependencies`
- These dependencies are used only during asset generation and build scripts, not at runtime
- When the extension package depends on the core package, these build dependencies get pulled in as production dependencies

**Solution:**

- Move all build-only dependencies to `devDependencies` in both core and extension packages
- Ensure only runtime dependencies remain in `dependencies`

### 1.2. Node.js Module Import Issues

**Issue:** Direct Node.js module imports in extension code cause packaging failures.

**Root Cause:**

- VSCode extensions should not include Node.js built-in modules as dependencies
- Direct imports of `node:fs`, `node:path`, etc. cause these modules to be bundled

**Solution:**

- Use VSCode's built-in file system API through workspace adapters
- Create proper abstractions that use shared module adapters instead of direct Node.js imports

## 2. TypeScript Configurations & Build Targets

### 2.1. TypeScript Configuration Requirements

**Core Package (`tsconfig.lib.json`):**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Extension Package (`tsconfig.json`):**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "CommonJS",
        "moduleResolution": "node",
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 2.2. Build Target Configuration

**Core Package (`project.json`):**

```json
{
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "main": "packages/dynamicons/core/src/index.ts",
                "outputPath": "packages/dynamicons/core/dist",
                "tsConfig": "packages/dynamicons/core/tsconfig.lib.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "keepNames": true,
                "declarationRootDir": "packages/dynamicons/core/src",
                "thirdParty": false,
                "deleteOutputPath": true,
                "external": ["@fux/shared", "strip-json-comments"]
            }
        }
    }
}
```

**Extension Package (`project.json`):**

```json
{
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/dynamicons/ext/src/extension.ts"],
                "outputPath": "packages/dynamicons/ext/dist",
                "format": ["cjs"],
                "metafile": true,
                "platform": "node",
                "bundle": true,
                "external": [
                    "vscode",
                    "awilix",
                    "js-yaml",
                    "strip-json-comments",
                    "@fux/shared",
                    "@fux/dynamicons-core"
                ],
                "sourcemap": true,
                "main": "packages/dynamicons/ext/src/extension.ts",
                "tsConfig": "packages/dynamicons/ext/tsconfig.json",
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/dynamicons/ext/assets/",
                        "output": "./assets/"
                    }
                ]
            }
        }
    }
}
```

### 2.3. Package Script Configuration

**Package Script (`scripts/create-vsix.js`):**

- Must exclude build-only dependencies from production bundle
- Should only include runtime dependencies in the final VSIX
- Use `pnpm list --prod --json --depth=Infinity` to get production dependencies only
- Ensure `devDependencies` are not included in the final package

## 3. Lint, Type-Check, and Validate Targets

> **Note:** This section has been superseded by the [Universal Targets](#6-universal-targets) section. All packages now use the universal targets pattern defined in `nx.json` and validated by the structure auditor.

### 3.1. Base Targets (Individual Package)

**`lint`:** Lint only the current package without dependencies

```json
{
    "lint": {
        "executor": "@nx/eslint:lint",
        "outputs": ["{options.outputFile}"],
        "options": {
            "lintFilePatterns": ["packages/dynamicons/ext/**/*.ts"],
            "fix": false
        }
    }
}
```

**`check-types`:** TypeScript type checking for current package

```json
{
    "check-types": {
        "executor": "@nx/typescript:tsc",
        "outputs": ["{options.outputPath}"],
        "options": {
            "tsConfig": "packages/dynamicons/ext/tsconfig.json",
            "noEmit": true
        }
    }
}
```

**`validate`:** Run both lint and type-check

```json
{
    "validate": {
        "executor": "nx:run-commands",
        "dependsOn": ["lint", "check-types"],
        "options": {
            "commands": ["nx lint @fux/dynamicons-ext", "nx check-types @fux/dynamicons-ext"],
            "parallel": false
        }
    }
}
```

### 3.2. Full Targets (Dependency Chain)

**`lint:full`:** Lint the full dependency chain

```json
{
    "lint:full": {
        "executor": "@nx/eslint:lint",
        "outputs": ["{options.outputFile}"],
        "dependsOn": ["^lint"],
        "options": {
            "lintFilePatterns": ["packages/dynamicons/ext/**/*.ts"],
            "fix": false
        }
    }
}
```

**`validate:full`:** Run both lint:full and check-types:full

```json
{
    "validate:full": {
        "executor": "nx:run-commands",
        "dependsOn": ["lint:full", "check-types:full"],
        "options": {
            "commands": [
                "nx lint:full @fux/dynamicons-ext",
                "nx check-types:full @fux/dynamicons-ext"
            ],
            "parallel": false
        }
    }
}
```

> **Important:** The above examples show the legacy implementation. All packages now use the universal targets pattern. See [Section 6: Universal Targets](#6-universal-targets) for the current implementation.

## 4. Critical Rules

### 4.1. Adapter Architecture

**Rule:** All adapters MUST be in the shared package (`@fux/shared`).

**Rationale:**

- Ensures consistent abstraction across all packages
- Prevents duplication of adapter logic
- Maintains single source of truth for VSCode API abstractions

**Implementation:**

- Create adapters in `libs/shared/src/vscode/adapters/`
- Export adapters from `libs/shared/src/index.ts`
- Import adapters from `@fux/shared` in all packages

**Example:**

```typescript
// ✅ Correct - Import from shared package
import { FileSystemAdapter, PathAdapter } from '@fux/shared'

// ❌ Incorrect - Create local adapters
class LocalFileSystemAdapter implements IFileSystem {
    // Implementation
}
```

### 4.2. VSCode Value Import Restrictions

**Rule:** NO VSCode values are to be imported outside of adapters in the shared package.

**Rationale:**

- Maintains decoupling from VSCode API
- Enables complete dependency injection
- Facilitates testing and mocking

**Implementation:**

- Only import VSCode types (using `import type`) outside of adapters
- All VSCode value imports must be in shared package adapters
- Use shared adapters for all VSCode API interactions

**Example:**

```typescript
// ✅ Correct - Import only types
import type { ExtensionContext, Uri } from 'vscode'

// ✅ Correct - Use shared adapter
import { UriAdapter } from '@fux/shared'
const uri = UriAdapter.file(path)

// ❌ Incorrect - Direct VSCode value import
import { Uri } from 'vscode'
const uri = Uri.file(path)
```

### 4.3. Dependency Management

**Rule:** Build-only dependencies must be in `devDependencies`.

**Rationale:**

- Prevents extraneous dependencies in production packages
- Reduces VSIX package size
- Avoids packaging issues

**Implementation:**

- Runtime dependencies: `dependencies`
- Build/development dependencies: `devDependencies`
- Script-only dependencies: `devDependencies`

**Example:**

```json
{
    "dependencies": {
        "@fux/shared": "workspace:*",
        "awilix": "^12.0.5",
        "js-yaml": "^4.1.0"
    },
    "devDependencies": {
        "puppeteer": "^24.10.0",
        "sharp": "^0.34.2",
        "svgo": "^3.3.2",
        "tsx": "^4.20.1"
    }
}
```

### 4.4. Externalization Strategy

**Rule:** All third-party dependencies must be properly externalized.

**Rationale:**

- Ensures clean dependency management
- Prevents bundling issues
- Maintains compatibility with VSCode extension requirements

**Implementation:**

- List all runtime dependencies in `external` array in build configuration
- Use static imports for externalized packages
- Never use dynamic imports for externalized packages

**Example:**

```json
{
    "external": [
        "vscode",
        "awilix",
        "js-yaml",
        "strip-json-comments",
        "@fux/shared",
        "@fux/dynamicons-core"
    ]
}
```

### 4.5. Extraneous Dependencies Prevention

**Rule:** Build-only dependencies must NEVER be in `dependencies` section.

**Rationale:**

- Prevents extraneous dependencies errors during packaging
- Ensures only runtime dependencies are bundled with the extension
- Maintains clean production package size

**Implementation:**

- Identify build-only dependencies (e.g., `puppeteer`, `sharp`, `svgo`, `tsx`)
- Move all build-only dependencies to `devDependencies`
- Verify that only runtime dependencies remain in `dependencies`

**Example:**

```json
// ✅ Correct - Build-only deps in devDependencies
{
    "dependencies": {
        "@fux/shared": "workspace:*",
        "awilix": "^12.0.5"
    },
    "devDependencies": {
        "puppeteer": "^24.10.0",
        "sharp": "^0.34.2",
        "svgo": "^3.3.2",
        "tsx": "^4.20.1"
    }
}

// ❌ Incorrect - Build-only deps in dependencies
{
    "dependencies": {
        "@fux/shared": "workspace:*",
        "puppeteer": "^24.10.0",  // Should be in devDependencies
        "sharp": "^0.34.2"        // Should be in devDependencies
    }
}
```

### 4.6. Node.js Module Import Restrictions

**Rule:** NO direct Node.js module imports in extension code.

**Rationale:**

- VSCode extensions should not include Node.js built-in modules as dependencies
- Direct imports cause these modules to be bundled, leading to packaging failures
- Maintains compatibility with VSCode extension requirements

**Implementation:**

- Use VSCode's built-in file system API through workspace adapters
- Create proper abstractions that use shared module adapters
- Never import `node:fs`, `node:path`, or other Node.js built-ins directly

**Example:**

```typescript
// ✅ Correct - Use VSCode's built-in file system
import { workspace } from 'vscode'
const fs = workspace.fs

// ✅ Correct - Use shared adapter
import { FileSystemAdapter } from '@fux/shared'
const fs = new FileSystemAdapter()

// ❌ Incorrect - Direct Node.js import
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
```

**Common Node.js modules to avoid:**

- `node:fs` / `node:fs/promises`
- `node:path`
- `node:url`
- `node:os`
- `node:crypto`
- `node:child_process`

### 4.7. Shared Path Alias Resolution

**Rule:** The TypeScript path alias for `@fux/shared` must point to the package root (`libs/shared`), not `libs/shared/src`.

**Rationale:**

- Ensures consumers use the referenced project's declaration output instead of inlining sources
- Prevents `rootDir` and `include` errors in composite projects under NodeNext/ESM
- Aligns all packages on a consistent import strategy for the shared adapters

**Implementation:**

- In each consumer `tsconfig.lib.json`, set the path mapping to the package root
- Keep a project reference to `libs/shared/tsconfig.lib.json`

**Example (Correct):**

```json
{
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared"]
        }
    },
    "references": [{ "path": "../../../libs/shared/tsconfig.lib.json" }]
}
```

**Example (Incorrect):**

```json
{
    "compilerOptions": {
        "paths": {
            "@fux/shared": ["../../../libs/shared/src"]
        }
    }
}
```

## 5. Migration Checklist

When migrating existing code to SOP v2:

- [ ] Move build-only dependencies to `devDependencies`
- [ ] Ensure all adapters are in shared package
- [ ] Remove direct VSCode value imports
- [ ] Update TypeScript configurations
- [ ] Verify build target configurations
- [ ] Test packaging process
- [ ] Run full validation chain
- [ ] Update documentation

## 6. Universal Targets

### 6.1. Overview

Universal targets are eight specific Nx targets that must exist in **all** project.json files across the workspace. These targets provide consistent linting, type checking, validation, and auditing capabilities across all packages.

### 6.2. Universal Targets Definition

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

### 6.3. Implementation Pattern

All universal targets follow a consistent dynamic pattern using `dependsOn` instead of hardcoded commands:

#### Core Pattern

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

#### Ext Pattern

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

### 6.4. Global Targets in nx.json

The universal targets are powered by global targets defined in `nx.json` under `targetDefaults`:

#### Lint Targets

```json
{
    "lint": {
        "executor": "@nx/eslint:lint",
        "dependsOn": ["^build"],
        "options": {
            "lintFilePatterns": [
                "{projectRoot}/**/*.ts",
                "{projectRoot}/**/*.tsx",
                "{projectRoot}/**/*.js",
                "{projectRoot}/**/*.jsx",
                "{projectRoot}/**/*.json",
                "{projectRoot}/**/*.jsonc"
            ]
        }
    },
    "lint:full": {
        "executor": "@nx/eslint:lint",
        "dependsOn": [
            {
                "target": "lint",
                "projects": "dependencies",
                "params": "forward"
            }
        ],
        "options": {
            "lintFilePatterns": [
                "{projectRoot}/**/*.ts",
                "{projectRoot}/**/*.tsx",
                "{projectRoot}/**/*.js",
                "{projectRoot}/**/*.jsx",
                "{projectRoot}/**/*.json",
                "{projectRoot}/**/*.jsonc"
            ]
        }
    }
}
```

#### Check-Types Targets

```json
{
    "check-types": {
        "executor": "@nx/js:tsc",
        "outputs": ["{options.outputPath}"],
        "dependsOn": ["^build"],
        "options": {
            "main": "{projectRoot}/src/index.ts",
            "outputPath": "{projectRoot}/dist",
            "tsConfig": "{projectRoot}/tsconfig.json"
        }
    },
    "check-types:full": {
        "executor": "@nx/js:tsc",
        "outputs": ["{options.outputPath}"],
        "dependsOn": [
            {
                "target": "check-types",
                "projects": "dependencies",
                "params": "forward"
            }
        ],
        "options": {
            "main": "{projectRoot}/src/index.ts",
            "outputPath": "{projectRoot}/dist",
            "tsConfig": "{projectRoot}/tsconfig.json"
        }
    }
}
```

#### Validate Targets

```json
{
    "validate": {
        "executor": "nx:run-commands",
        "dependsOn": [
            {
                "target": "lint",
                "params": "forward"
            },
            {
                "target": "check-types"
            },
            {
                "target": "audit"
            }
        ],
        "options": {
            "commands": [],
            "parallel": false
        }
    },
    "validate:full": {
        "executor": "nx:run-commands",
        "dependsOn": [
            {
                "target": "lint:full",
                "params": "forward"
            },
            {
                "target": "check-types"
            },
            {
                "target": "audit:full",
                "params": "forward"
            }
        ],
        "options": {
            "commands": [],
            "parallel": false
        }
    }
}
```

#### Audit Targets

```json
{
    "audit": {
        "executor": "nx:run-commands",
        "options": {
            "command": "tsx libs/tools/structure-auditor/src/main.ts {projectName}",
            "cwd": "{workspaceRoot}"
        }
    },
    "audit:full": {
        "executor": "nx:run-commands",
        "dependsOn": [
            {
                "target": "audit",
                "projects": "dependencies",
                "params": "forward"
            }
        ],
        "options": {
            "command": "tsx libs/tools/structure-auditor/src/main.ts {projectName}",
            "cwd": "{workspaceRoot}"
        }
    }
}
```

#### Clean Targets

```json
{
    "clean": {
        "executor": "nx:run-commands",
        "options": {
            "command": "rimraf {projectRoot}/dist {projectRoot}/coverage {projectRoot}/.nx",
            "cwd": "{workspaceRoot}"
        }
    },
    "clean:dist": {
        "executor": "nx:run-commands",
        "options": {
            "command": "rimraf {projectRoot}/dist",
            "cwd": "{workspaceRoot}"
        }
    },
    "clean:cache": {
        "executor": "nx:run-commands",
        "options": {
            "command": "rimraf {projectRoot}/.nx",
            "cwd": "{workspaceRoot}"
        }
    }
}
```

### 6.5. Usage Examples

#### Running Universal Targets

```bash
# Lint current package
nx lint @fux/ghost-writer-ext

# Lint full dependency chain
nx lint:full @fux/ghost-writer-ext

# Check types for current package
nx check-types @fux/ghost-writer-ext

# Check types for full dependency chain
nx check-types:full @fux/ghost-writer-ext

# Validate current package (lint + check-types + audit)
nx validate @fux/ghost-writer-ext

# Validate full dependency chain
nx validate:full @fux/ghost-writer-ext

# Audit current package
nx audit @fux/ghost-writer-ext

# Audit full dependency chain
nx audit:full @fux/ghost-writer-ext

# Clean all build artifacts
nx clean @fux/ghost-writer-ext

# Clean only dist directory
nx clean:dist @fux/ghost-writer-ext

# Clean only cache directory
nx clean:cache @fux/ghost-writer-ext
```

#### Using Aliases

```bash
# Using project aliases
gw l          # lint ghost-writer-ext
gw lf         # lint:full ghost-writer-ext
gw tc         # check-types ghost-writer-ext
gw tcf        # check-types:full ghost-writer-ext
gw v          # validate ghost-writer-ext
gw vf         # validate:full ghost-writer-ext
gw a          # audit ghost-writer-ext
gw af         # audit:full ghost-writer-ext
gw c          # clean ghost-writer-ext
gw cd         # clean:dist ghost-writer-ext
gw cc         # clean:cache ghost-writer-ext
```

### 6.6. Benefits

1. **Consistency** - All packages have the same validation capabilities
2. **Dependency Awareness** - Full targets automatically handle dependencies
3. **Maintainability** - Centralized pattern reduces duplication
4. **Automation** - Structure auditor ensures compliance
5. **Developer Experience** - Consistent commands across all packages
6. **Quality Assurance** - Comprehensive validation including structure auditing

### 6.7. Validation

The structure auditor (`libs/tools/structure-auditor`) validates that all packages have the correct universal targets implementation. The auditor checks:

1. **Existence** - All eleven universal targets must exist
2. **Executor** - Targets must use the correct executor (`nx:run-commands` for full targets)
3. **Dependencies** - Targets must use the correct `dependsOn` arrays
4. **Options** - Targets must have the correct options configuration
5. **Extends** - Targets must extend the correct global target

### 6.8. Migration Notes

- All packages have been migrated from hardcoded commands to dynamic `dependsOn` patterns
- The `validate` and `validate:full` targets now include audit functionality
- The `audit` and `audit:full` targets were added to all packages
- The `clean`, `clean:dist`, and `clean:cache` targets were added to all packages
- All targets now use the correct executor and options configuration
- The structure auditor validates compliance automatically
