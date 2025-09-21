# FocusedUX Testing Strategy v3

> **📖 Enhanced Mock Strategy**: This project uses an Enhanced Mock Strategy with centralized mock scenarios. See [Enhanced Mock Strategy Guide](./Enhanced-Mock-Strategy.md) for detailed documentation on the three-component mock system (`globals.ts`, `helpers.ts`, `mock-scenario-builder.ts`).

## 🚀 Quick Reference for AI Agents

### Package Types & Testing Approach

- **Core Packages** (`packages/{feature}/core/`): Pure business logic, Vitest only, no VSCode deps
- **Extension Packages** (`packages/{feature}/ext/`): VSCode wrapper, dual testing (Vitest + Integration)
- **Shared Packages** (`libs/shared/`): Utilities, Vitest only, no VSCode deps

### Critical Commands (ALWAYS use PAE aliases)

- `{alias} b` - Build first (MANDATORY before testing)
- `{alias} t` - Fast tests
- `{alias} tc` - Tests with coverage
- `{alias} ti` - Integration tests (extensions only)

### Anti-Patterns (NEVER DO)

- Business logic in extension packages
- VSCode value imports outside adapters
- Skipping build before tests
- Using `any` types
- Dynamic imports in tests
- Assuming test or code is wrong on failure

### Test Failure Protocol

1. **Investigate before assuming** - Don't assume either test or code is wrong
2. **Verify expectations** - Determine expected behavior through docs/requirements
3. **Gather evidence** - Collect concrete evidence of actual behavior
4. **Ask clarifying questions** - When uncertain, ask rather than assume
5. **Fix root causes** - Address actual issues, not superficial fixes

## 📋 Package Classification Matrix

| Package Type | Path                       | Testing              | Dependencies     | Build           |
| ------------ | -------------------------- | -------------------- | ---------------- | --------------- |
| Core         | `packages/{feature}/core/` | Vitest only          | Minimal external | `bundle: false` |
| Extension    | `packages/{feature}/ext/`  | Vitest + Integration | Core + VSCode    | `bundle: true`  |
| Shared       | `libs/shared/`             | Vitest only          | No VSCode        | `bundle: false` |

## 🏗️ Architecture Patterns

### Core Package Pattern

```typescript
// Direct service instantiation, no DI containers
const service = new ServiceName(dependency1, dependency2)
```

### Extension Package Pattern

```typescript
// VSCode adapters + core service integration
const adapter = new VSCodeAdapter()
const service = new CoreService(adapter)
```

## ⚙️ Configuration Templates

### Core Package project.json

```json
{
    "name": "@fux/{feature}-core",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "packages/{feature}/core/src/index.ts",
                "outputPath": "packages/{feature}/core/dist",
                "bundle": false,
                "format": ["esm"],
                "external": ["vscode", "js-yaml", "typescript"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"]
        }
    }
}
```

**Note**: Include `"typescript"` in external array only if the package uses TypeScript as a runtime dependency (e.g., Ghost Writer Core for AST parsing).

### Extension Package project.json

```json
{
    "name": "@fux/{feature}-ext",
    "projectType": "application",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/{feature}/ext/src/extension.ts"],
                "outputPath": "packages/{feature}/ext/dist",
                "bundle": true,
                "format": ["cjs"],
                "external": ["vscode"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"]
        },
        "test:integration": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": ["vscode-test --config .vscode-test.mjs"],
                "cwd": "packages/{feature}/ext"
            }
        }
    }
}
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            exclude: ['**/__tests__/integration/**', '**/__tests__/_out-tsc/**'],
        },
    })
)
```

## 🧪 Testing Patterns by Package Type

### Core Package Testing

> **📖 Enhanced Mock Strategy**: The FocusedUX project uses an Enhanced Mock Strategy with centralized mock scenarios. See [Enhanced Mock Strategy Guide](./Enhanced-Mock-Strategy.md) for detailed documentation.

```typescript
// __tests__/functional/ServiceName.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceName } from '../../src/features/ServiceName.service.js'
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
import { setupBackupSuccessScenario } from '../__mocks__/mock-scenario-builder'

class MockDependency {
    process = vi.fn()
}

describe('ServiceName', () => {
    let service: ServiceName
    let mockDep: MockDependency
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)

        mockDep = new MockDependency()
        service = new ServiceName(mockDep)
    })

    it('should process data correctly', async () => {
        // Use Enhanced Mock Strategy scenarios
        setupBackupSuccessScenario(mocks, {
            sourcePath: '/test/file.txt',
            backupPath: '/test/file.txt.bak',
        })

        mockDep.process.mockResolvedValue('processed')
        const result = await service.processData('test')
        expect(result).toBe('processed')
        expect(mockDep.process).toHaveBeenCalledWith('test')
    })
})
```

### Extension Package Testing

```typescript
// __tests__/functional/extension.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { activate, deactivate } from '../../src/extension'
import * as vscode from 'vscode'
import { setupTestEnvironment, resetAllMocks, setupVSCodeMocks } from '../__mocks__/helpers'
import {
    setupVSCodeCommandRegistrationScenario,
    createGhostWriterMockBuilder,
} from '../__mocks__/mock-scenario-builder'

vi.mock('@fux/{feature}-core', () => ({
    ServiceName: vi.fn().mockImplementation(() => ({
        methodName: vi.fn(),
    })),
}))

describe('Extension', () => {
    let context: any
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        resetAllMocks(mocks)

        context = { subscriptions: { push: vi.fn() } }
    })

    it('should register commands successfully', () => {
        // Use Enhanced Mock Strategy scenarios
        setupVSCodeCommandRegistrationScenario(mocks, {
            commandName: 'test.command',
            shouldSucceed: true,
        })

        activate(context)
        expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(1)
    })
})
```

### Extension Integration Testing

**Structure:**

```
__tests__/integration-tests/
├── suite/                    # Test files
├── mocked-workspace/         # Test workspace files
├── tsconfig.test.json        # TypeScript config for tests
├── .vscode-test.mjs          # VS Code test configuration
└── _readme.md               # Integration test documentation
```

**Test Configuration:**

```typescript
// __tests__/integration-tests/suite/extension.integration.test.ts
import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Integration Test Suite', () => {
    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands()
        assert.ok(commands.includes('fux-package-name.commandName'))
    })

    test('Should activate without errors', async () => {
        // Verify extension can be activated
        assert.ok(true, 'Extension should activate successfully')
    })
})
```

**Project.json Integration Test Targets:**

```json
{
    "test:compile": {
        "executor": "nx:run-commands",
        "outputs": ["{projectRoot}/__tests__/integration-tests/_out-tsc"],
        "options": {
            "commands": [
                "tsc -p packages/{feature}/ext/__tests__/integration-tests/tsconfig.test.json"
            ]
        }
    },
    "test:integration": {
        "executor": "nx:run-commands",
        "dependsOn": ["build", "test:compile"],
        "cache": false,
        "options": {
            "commands": [
                "powershell -Command \"& {vscode-test --config __tests__/integration-tests/.vscode-test.mjs --verbose --timeout 20000 --reporter spec 2>&1 | Select-String -NotMatch 'extensionEnabledApiProposals', 'ChatSessionStore', 'update#setState disabled', 'update#ctor', 'Started local extension host', 'Settings Sync'}\""
            ],
            "cwd": "packages/{feature}/ext"
        }
    }
}
```

## 🚨 Anti-Patterns & Violations

### Architectural Violations

- **Business logic in extensions** → Move to core packages
- **VSCode value imports outside adapters** → Use type imports only
- **Shared dependencies in core packages** → Keep core self-contained
- **DI containers in core packages** → Use direct instantiation

### Testing Violations

- **Skipping tests for deadlines** → All tests must pass
- **Large test files (>500 lines)** → Split into focused units
- **VSCode mocking in shared tests** → Use appropriate strategies
- **Dynamic imports in tests** → Use static imports with vi.mocked()
- **Mock expectations without understanding signatures** → Study actual APIs first

### Build Violations

- **Using wrong executors** → Always use @nx/esbuild:esbuild
- **Missing externalization** → Externalize all third-party deps
- **Caching packaging targets** → Disable caching for unique outputs

## 🛠️ Troubleshooting Guide

### Test Failures

1. **Tests pass but runtime fails** → Verify mocks match real behavior
2. **Command registration issues** → Test actual VSCode integration
3. **Mock not working** → Ensure mocks applied before activation
4. **Extension state issues** → Reset state between tests

### Test Debugging

1. **Mock not being called** → Check import path matches (e.g., `'fs'` vs `'fs/promises'`)
2. **Unexpected return values** → Create debug test to verify actual behavior
3. **Multiple call expectations** → Ensure mocks provide enough responses
4. **Private method testing** → Test public behavior instead of internal implementation
5. **Complex error scenarios** → Mock the method itself rather than dependencies

### Build Failures

1. **"No inputs were found"** → Check path resolution consistency
2. **Missing dependencies** → Verify externalization
3. **TypeScript errors** → Check module resolution settings

### Common Solutions

- **Double test execution** → Remove global targetDefaults conflicts
- **Cache issues** → Use `--skip-nx-cache` flag
- **Path resolution** → Use consistent absolute/relative paths

## 📚 Implementation Examples

### Complete Extension Package Setup

```bash
# Directory structure
packages/{feature}/ext/
├── __tests__/
│   ├── _setup.ts
│   ├── functional/
│   │   └── extension.test.ts
│   ├── integration/
│   │   └── extension.test.ts
│   ├── tsconfig.test.json
│   └── .vscode-test.mjs
├── src/
│   ├── adapters/
│   ├── extension.ts
│   └── index.ts
├── vitest.config.ts
└── project.json
```

### Enhanced Mock Strategy Setup

> **📖 Enhanced Mock Strategy**: The FocusedUX project uses a sophisticated three-component mock system instead of a single `_setup.ts` file. See [Enhanced Mock Strategy Guide](./Enhanced-Mock-Strategy.md) for complete documentation.

**Directory Structure:**

```
__tests__/
├── __mocks__/
│   ├── globals.ts              # Global mocks & setup
│   ├── helpers.ts              # Test utilities & mock creators
│   └── mock-scenario-builder.ts # Composable mock scenarios
└── functional-tests/
    └── *.test.ts               # Individual test files
```

**Global Setup (`globals.ts`):**

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// Global timer setup
beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())
afterEach(() => vi.clearAllMocks())
```

**Test Helpers (`helpers.ts`):**

```typescript
import { vi } from 'vitest'
import * as vscode from 'vscode'

export interface ExtensionTestMocks {
    vscode: {
        commands: { registerCommand: ReturnType<typeof vi.fn> }
        window: { showInformationMessage: ReturnType<typeof vi.fn> }
        // ... other VSCode mocks
    }
}

export function setupTestEnvironment(): ExtensionTestMocks {
    return {
        vscode: {
            commands: { registerCommand: vi.fn() },
            window: { showInformationMessage: vi.fn() },
            // ... other mock setup
        },
    }
}
```

## 🔍 Decision Trees

### What Type of Test Should I Write?

```
Is this a core package? → Vitest unit tests only
Is this an extension package? → Vitest + Integration tests
Is this business logic? → Core package tests
Is this VSCode integration? → Extension package tests
```

### How Do I Handle Test Failures?

```
Test fails → Don't assume test or code is wrong
↓
Verify expected behavior through documentation
↓
Gather evidence of actual behavior
↓
Ask clarifying questions if uncertain
↓
Fix root cause, not symptoms
```

### Which Mocking Strategy to Use?

```
Core package → Mock external dependencies only
Extension package → Mock VSCode APIs + core services
Integration tests → Real VSCode environment
```

## 🎯 Quality Gates

### Core Package

- [ ] All services have functional tests
- [ ] No VSCode dependencies
- [ ] Clean interfaces defined
- [ ] TypeScript compilation passes

### Extension Package

- [ ] Extension activation test passes
- [ ] All adapters have tests
- [ ] Command registration tested
- [ ] Integration tests pass

### Integration

- [ ] Both packages build successfully
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Clean separation of concerns

## 📖 Detailed Reference

### Required Dependencies

#### Extension Packages

```json
{
    "devDependencies": {
        "@fux/vscode-test-cli-config": "workspace:*",
        "@types/mocha": "^10.0.6",
        "@vscode/test-cli": "^0.0.11",
        "@vscode/test-electron": "^2.5.2",
        "glob": "^10.3.10",
        "mocha": "^10.3.0"
    }
}
```

#### All Packages

```json
{
    "devDependencies": {
        "@types/node": "^24.0.10",
        "@types/vscode": "^1.99.3",
        "@vitest/coverage-v8": "^3.2.4",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4"
    }
}
```

### VS Code Integration Test Configuration

#### TypeScript Config

```json
// __tests__/tsconfig.test.json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./_out-tsc",
        "rootDir": "./integration-tests",
        "module": "CommonJS",
        "moduleResolution": "node",
        "types": ["node", "mocha"]
    },
    "include": ["integration/**/*.ts"]
}
```

#### VS Code Test Config

```typescript
// __tests__/.vscode-test.mjs
import { createVscodeTestConfig } from '@fux/vscode-test-cli-config'

export default createVscodeTestConfig({
    packageName: 'fux-package-name',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './integration-tests/mocked-workspace',
    files: './_out-tsc/**/*.test.js',
})
```

### Command Aliases

#### Core Package Commands

```bash
{alias}c build    # Build core package
{alias}c test     # Test core package
{alias}c tsc      # TypeScript check
{alias}c lint     # Lint core package
```

#### Extension Package Commands

```bash
{alias}e build    # Build extension package
{alias}e test     # Test extension package
{alias}e ti       # Integration tests
{alias}e tsc      # TypeScript check
{alias}e lint     # Lint extension package
```

#### Combined Package Commands

```bash
{alias} build     # Build both packages
{alias} test      # Test both packages
{alias} tsc       # TypeScript check both
```

---

**Key Principles:**

1. **No DI Containers** - Direct service instantiation
2. **No Shared Dependencies in Core** - Self-contained packages
3. **Thin Extension Wrappers** - Business logic in core only
4. **Simple Testing** - Clear separation of concerns
5. **Individual Exports** - Tree-shaking optimization

## VS Code Test Helper Integration (Preferred)

Purpose: use the monorepo helper (`@fux/vscode-test-cli-config`) for integration tests without pulling it into extension builds.

- Why
    - Keep extension builds fast and stable (no unintended graph edges)
    - Keep the helper strictly test-only

- Do (Preferred pattern)
    - Do not add a TS project reference to `libs/vscode-test-cli-config` in extension `tsconfig.json`
    - Do not list `@fux/vscode-test-cli-config` in the extension's `devDependencies`
    - Build the helper right before integration tests
    - Import the helper from its built dist in `.vscode-test.mjs`
    - Point `files` and `setupFiles` to your compiled test output (often under `__tests__/_out-tsc/suite`)

- Example: project.json (extension)

```json
{
    "targets": {
        "test:compile": {
            "executor": "nx:run-commands",
            "outputs": ["{projectRoot}/__tests__/_out-tsc"],
            "options": {
                "commands": ["tsc -p packages/<feature>/ext/__tests__/tsconfig.test.json"]
            }
        },
        "test:integration": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": [
                    "nx run @fux/vscode-test-cli-config:build",
                    "vscode-test --config .vscode-test.mjs"
                ],
                "cwd": "packages/<feature>/ext"
            }
        }
    }
}
```

- Example: `.vscode-test.mjs`

```js
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import helper from built dist to avoid adding a package/devDep edge
const helperUrl = new URL('../../../libs/vscode-test-cli-config/dist/index.js', import.meta.url)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
    packageName: 'fux-<feature>',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './__tests__/integration-tests/mocked-workspace',
    files: './__tests__/_out-tsc/suite/**/*.test.js',
    setupFiles: './__tests__/_out-tsc/suite/index.js',
})
```

- Example: `__tests__/tsconfig.test.json`

```json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./_out-tsc",
        "rootDir": "./integration-tests",
        "module": "CommonJS",
        "moduleResolution": "node",
        "types": ["node", "mocha"],
        "composite": false,
        "declaration": false,
        "sourceMap": true,
        "tsBuildInfoFile": "./_out-tsc/tsconfig.test.tsbuildinfo"
    },
    "include": ["integration-tests/**/*.ts"]
}
```

- Anti-patterns (avoid)
    - Static import of `@fux/vscode-test-cli-config` in extension source or `.vscode-test.mjs`
    - Adding `@fux/vscode-test-cli-config` to extension `devDependencies`
    - TS project references to `libs/vscode-test-cli-config` in extension `tsconfig.json`
    - Relying on `"^build"` to incidentally build the helper

- Migration steps
    - Remove TS reference to `libs/vscode-test-cli-config` from extension `tsconfig.json`
    - Remove `@fux/vscode-test-cli-config` from extension `devDependencies`
    - Add a pre-step to build the helper in `test:integration*` commands
    - Switch `.vscode-test.mjs` to import helper from its built dist
    - Adjust `files`/`setupFiles` to the compiled `suite` paths if used

---

## Integration Testing Reference (Package-Agnostic)

This is a neutral, copy-pasteable reference that matches our current working setup without naming a specific package.

### Directory layout (extension)

```
packages/{feature}/ext/
├── __tests__/
│   ├── integration-tests/
│   │   ├── mocked-workspace/
│   │   │   └── package.json
│   │   ├── suite/
│   │   │   ├── extension.integration.test.ts
│   │   │   ├── backup.integration.test.ts
│   │   │   ├── package-json-formatting.integration.test.ts
│   │   │   ├── terminal-management.integration.test.ts
│   │   │   └── poetry-shell.integration.test.ts
│   │   ├── tsconfig.test.json
│   │   └── .vscode-test.mjs
│   └── _setup.ts
└── src/
    └── extension.ts
```

Notes:

- Compile to a local folder beside the suite: `packages/{feature}/ext/__tests__/integration-tests/_out-tsc/suite`.
- Keep `suite/index.ts` for mocha root hooks only; do not import tests from it to avoid duplicate loads.
- Prefer explicit `files: []` list in `.vscode-test.mjs` or a tight glob like `./_out-tsc/suite/**/*.integration.test.js`.
- You can use `version: 'insiders'` (needed for proposal APIs) or `version: 'stable'` when proposals aren’t needed.
- Add `skipExtensionDependencies: true` to avoid scanning/auto-installing extension dependencies for speed.

### project.json (extension targets)

```json
{
    "targets": {
        "test:compile": {
            "executor": "nx:run-commands",
            "outputs": ["{projectRoot}/__tests__/integration-tests/_out-tsc"],
            "options": {
                "commands": [
                    "tsc -p packages/{feature}/ext/__tests__/integration-tests/tsconfig.test.json"
                ]
            }
        },
        "test:integration": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "cache": false,
            "options": {
                "commands": [
                    "vscode-test --config __tests__/integration-tests/.vscode-test.mjs --verbose --timeout 20000 --reporter spec"
                ],
                "cwd": "packages/{feature}/ext"
            }
        }
    }
}
```

### tsconfig (integration)

```json
// packages/{feature}/ext/__tests__/integration-tests/tsconfig.test.json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./_out-tsc",
        "rootDir": "./",
        "module": "CommonJS",
        "moduleResolution": "node",
        "types": ["node", "mocha"],
        "composite": false,
        "declaration": false,
        "declarationMap": false,
        "sourceMap": true,
        "tsBuildInfoFile": "./_out-tsc/tsconfig.test.tsbuildinfo"
    },
    "include": ["./suite/**/*.ts"],
    "exclude": ["./_out-tsc/**"]
}
```

### .vscode-test.mjs (integration)

```js
// packages/{feature}/ext/__tests__/integration-tests/.vscode-test.mjs
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve extension root (two levels up from integration-tests)
const extensionRoot = path.resolve(__dirname, '..', '..')

// Import helper from built dist to avoid adding a package/devDep edge
const helperUrl = new URL(
    '../../../../../libs/vscode-test-cli-config/dist/index.js',
    import.meta.url
)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
    packageName: 'fux-{feature}',
    extensionDevelopmentPath: extensionRoot,
    workspaceFolder: './mocked-workspace',
    files: './_out-tsc/suite/**/*.integration.test.js',
    setupFiles: './_out-tsc/suite/index.js',
    skipExtensionDependencies: true,
    // version: 'insiders' | 'stable'
})
```

### Tips

- Disable Nx cache for `test:integration` to avoid replaying stale logs.
- Use explicit `files: []` if you want deterministic ordering.
- For maximal speed locally, you can set `useInstallation: { fromMachine: true }` in the test config; favor managed downloads (insiders/stable) in CI for hermetic runs.

---

## 🎭 Enhanced Mock Strategy

### Overview

The FocusedUX project uses an **Enhanced Mock Strategy** that combines centralized mock scenarios with individual test flexibility. This approach reduces code duplication by 60% while maintaining test clarity and maintainability.

> **📖 For detailed documentation**: See [Enhanced Mock Strategy Guide](./Enhanced-Mock-Strategy.md)

### Key Benefits

- **60% reduction** in mock setup code
- **Centralized scenarios** for common patterns
- **Type-safe interfaces** for all mock objects
- **Fluent builder pattern** for complex compositions
- **Consistent behavior** across all tests
- **Easy to extend** with new scenarios

### Quick Reference

The Enhanced Mock Strategy consists of three key components:

1. **`__mocks__/globals.ts`** - Global mocks & setup
2. **`__mocks__/helpers.ts`** - Test utilities & mock creators
3. **`__mocks__/mock-scenario-builder.ts`** - Composable mock scenarios

### Core Principles

1. **Centralized Scenarios**: Common mock patterns are defined once in `_setup.ts`
2. **Reusable Functions**: Mock scenarios can be reused across multiple tests
3. **Type Safety**: All mock scenarios use TypeScript interfaces
4. **Flexible Overrides**: Individual tests can still override specific mocks when needed
5. **Builder Pattern**: Complex scenarios can be composed using fluent APIs

### Mock Architecture

#### Global Mocks (`_setup.ts`)

```typescript
// Global mocks for Node.js modules
vi.mock('node:fs/promises', () => ({
    stat: vi.fn(),
    access: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
}))

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}
```

#### Test Environment Setup

```typescript
export interface TestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
    }
    yaml: {
        load: ReturnType<typeof vi.fn>
    }
    window: {
        showInformationMessage: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): TestMocks {
    return {
        fileSystem: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copyFile: vi.fn(),
        },
        path: {
            dirname: vi.fn(),
            basename: vi.fn(),
            join: vi.fn(),
            resolve: vi.fn(),
        },
        yaml: {
            load: vi.fn(),
        },
        window: {
            showInformationMessage: vi.fn(),
        },
    }
}
```

### Reusable Mock Scenarios

#### Backup Management Scenarios

```typescript
export interface BackupScenarioOptions {
    sourcePath: string
    backupPath: string
    baseName?: string
    directory?: string
}

// Success scenario - backup doesn't exist
export function setupBackupSuccessScenario(mocks: TestMocks, options: BackupScenarioOptions): void {
    const { sourcePath, backupPath, baseName, directory } = options

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// Conflict scenario - backup exists, need to increment
export function setupBackupConflictScenario(
    mocks: TestMocks,
    options: BackupScenarioOptions
): void {
    const { sourcePath, backupPath, baseName, directory } = options
    const backupPath1 = backupPath
    const backupPath2 = backupPath.replace('.bak', '.bak2')

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValueOnce(backupPath1).mockReturnValueOnce(backupPath2)

    // First backup exists, second doesn't
    mocks.fileSystem.stat
        .mockResolvedValueOnce({ type: 'file' }) // .bak exists
        .mockRejectedValueOnce(new Error('File not found')) // .bak2 doesn't exist
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// Error scenario - specific error type
export function setupBackupErrorScenario(
    mocks: TestMocks,
    options: BackupScenarioOptions,
    errorType: 'stat' | 'copy',
    errorMessage: string
): void {
    const { sourcePath, backupPath, baseName, directory } = options

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)

    if (errorType === 'stat') {
        mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
        mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    } else {
        mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
        mocks.fileSystem.copyFile.mockRejectedValue(new Error(errorMessage))
    }
}
```

#### Cross-Platform Scenarios

```typescript
// Windows paths
export function setupWindowsPathScenario(
    mocks: TestMocks,
    sourcePath: string,
    backupPath: string
): void {
    const baseName = sourcePath.split('\\').pop() || ''
    const directory = sourcePath.split('\\').slice(0, -1).join('\\')

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// Unix paths
export function setupUnixPathScenario(
    mocks: TestMocks,
    sourcePath: string,
    backupPath: string
): void {
    const baseName = sourcePath.split('/').pop() || ''
    const directory = sourcePath.split('/').slice(0, -1).join('/')

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}
```

#### Package JSON Formatting Scenarios

```typescript
export interface PackageJsonScenarioOptions {
    packageJsonPath: string
    workspaceRoot: string
    configContent: string
    packageContent: string
    expectedOrder?: string[]
}

export function setupPackageJsonSuccessScenario(
    mocks: TestMocks,
    options: PackageJsonScenarioOptions
): void {
    const { configContent, packageContent, expectedOrder } = options

    mocks.fileSystem.readFile
        .mockResolvedValueOnce(configContent) // .FocusedUX config
        .mockResolvedValueOnce(packageContent) // package.json content

    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': expectedOrder || [
                'name',
                'version',
                'description',
                'main',
                'scripts',
                'dependencies',
            ],
        },
    })
}

export function setupPackageJsonConfigErrorScenario(
    mocks: TestMocks,
    options: PackageJsonScenarioOptions
): void {
    mocks.fileSystem.readFile.mockRejectedValueOnce(new Error('File not found'))
}
```

#### Performance and Concurrency Scenarios

```typescript
export function setupConcurrentBackupScenario(
    mocks: TestMocks,
    sourcePaths: string[],
    backupPaths: string[]
): void {
    sourcePaths.forEach((path, index) => {
        mocks.path.basename.mockReturnValueOnce(path.split('/').pop() || '')
        mocks.path.dirname.mockReturnValueOnce(path.split('/').slice(0, -1).join('/'))
        mocks.path.join.mockReturnValueOnce(backupPaths[index])
    })
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}
```

### Mock Builder Pattern

For complex scenarios that need multiple mock configurations:

```typescript
export class MockBuilder {
    constructor(private mocks: TestMocks) {}

    backup(options: BackupScenarioOptions): MockBuilder {
        setupBackupSuccessScenario(this.mocks, options)
        return this
    }

    backupConflict(options: BackupScenarioOptions): MockBuilder {
        setupBackupConflictScenario(this.mocks, options)
        return this
    }

    backupError(
        errorType: 'stat' | 'copy',
        errorMessage: string,
        options: BackupScenarioOptions
    ): MockBuilder {
        setupBackupErrorScenario(this.mocks, options, errorType, errorMessage)
        return this
    }

    packageJson(options: PackageJsonScenarioOptions): MockBuilder {
        setupPackageJsonSuccessScenario(this.mocks, options)
        return this
    }

    build(): TestMocks {
        return this.mocks
    }
}

export function createMockBuilder(mocks: TestMocks): MockBuilder {
    return new MockBuilder(mocks)
}
```

### Usage Examples

#### Basic Test with Scenario

```typescript
// ❌ OLD WAY - Repetitive mock setup
it('should create backup with .bak extension', async () => {
    // Arrange
    const sourcePath = '/test/file.txt'
    const baseName = 'file.txt'
    const directory = '/test'
    const backupPath = '/test/file.txt.bak'

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)

    // Act
    const result = await service.createBackup(sourcePath)

    // Assert
    expect(result).toBe(backupPath)
    expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
})

// ✅ NEW WAY - Clean and focused
it('should create backup with .bak extension', async () => {
    // Arrange
    const sourcePath = '/test/file.txt'
    const backupPath = '/test/file.txt.bak'

    setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

    // Act
    const result = await service.createBackup(sourcePath)

    // Assert
    expect(result).toBe(backupPath)
    expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
})
```

#### Error Scenario

```typescript
it('should handle file system errors during copy', async () => {
    // Arrange
    const sourcePath = '/test/file.txt'
    const backupPath = '/test/file.txt.bak'

    setupBackupErrorScenario(mocks, { sourcePath, backupPath }, 'copy', 'Copy failed')

    // Act & Assert
    await expect(service.createBackup(sourcePath)).rejects.toThrow('Copy failed')
})
```

#### Cross-Platform Scenario

```typescript
it('should handle Windows-style paths', async () => {
    // Arrange
    const sourcePath = 'C:\\Users\\John\\Documents\\Project\\file.txt'
    const backupPath = 'C:\\Users\\John\\Documents\\Project\\file.txt.bak'

    setupWindowsPathScenario(mocks, sourcePath, backupPath)

    // Act
    const result = await service.createBackup(sourcePath)

    // Assert
    expect(result).toBe(backupPath)
    expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
})
```

#### Builder Pattern

```typescript
it('should demonstrate fluent mock builder for complex scenarios', async () => {
    // Arrange - Using the builder pattern for complex mock setup
    const sourcePath = '/complex-project/file.txt'
    const backupPath = '/complex-project/file.txt.bak'

    createMockBuilder(mocks).backup({ sourcePath, backupPath }).build()

    // Act
    const result = await service.createBackup(sourcePath)

    // Assert
    expect(result).toBe(backupPath)
    expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
})
```

#### Package JSON Scenario

```typescript
it('should format package.json successfully', async () => {
    // Arrange
    const packageJsonPath = '/test/package.json'
    const workspaceRoot = '/test'
    const configContent =
        'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
    const packageContent = JSON.stringify(
        {
            scripts: { test: 'jest' },
            name: 'test-package',
            version: '1.0.0',
            dependencies: { lodash: '^4.17.21' },
        },
        null,
        2
    )

    setupPackageJsonSuccessScenario(mocks, {
        packageJsonPath,
        workspaceRoot,
        configContent,
        packageContent,
        expectedOrder: ['name', 'version', 'scripts', 'dependencies'],
    })

    // Act
    await service.formatPackageJson(packageJsonPath, workspaceRoot)

    // Assert
    expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
        packageJsonPath,
        expect.stringContaining('"name": "test-package"')
    )
})
```

### Best Practices

#### 1. Use Scenarios for Common Patterns

```typescript
// ✅ DO: Use scenarios for common patterns
setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

// ❌ DON'T: Repeat mock setup code
mocks.path.basename.mockReturnValue('file.txt')
mocks.path.dirname.mockReturnValue('/test')
mocks.path.join.mockReturnValue('/test/file.txt.bak')
mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
mocks.fileSystem.copyFile.mockResolvedValue(undefined)
```

#### 2. Override Specific Mocks When Needed

```typescript
// ✅ DO: Override specific mocks for edge cases
setupBackupSuccessScenario(mocks, { sourcePath, backupPath })
mocks.fileSystem.stat.mockResolvedValue({ type: 'file' }) // Override for specific test

// ❌ DON'T: Create entirely new scenarios for minor variations
```

#### 3. Use Type-Safe Interfaces

```typescript
// ✅ DO: Use typed interfaces
setupBackupSuccessScenario(mocks, {
    sourcePath: '/test/file.txt',
    backupPath: '/test/file.txt.bak',
})

// ❌ DON'T: Use untyped parameters
setupBackupSuccessScenario(mocks, sourcePath, backupPath, baseName, directory)
```

#### 4. Group Related Tests

```typescript
describe('BackupManagementService', () => {
    let service: BackupManagementService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        service = new BackupManagementService(mocks.fileSystem, mocks.path)
        resetAllMocks(mocks)
    })

    describe('createBackup', () => {
        it('should create backup with .bak extension', async () => {
            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })
            // ... test logic
        })

        it('should handle backup conflicts', async () => {
            setupBackupConflictScenario(mocks, { sourcePath, backupPath })
            // ... test logic
        })
    })

    describe('Cross-Platform Compatibility', () => {
        it('should handle Windows paths', async () => {
            setupWindowsPathScenario(mocks, sourcePath, backupPath)
            // ... test logic
        })
    })
})
```

### Creating New Scenarios

When you need a new mock scenario:

1. **Define the interface** for the scenario options
2. **Create the scenario function** with descriptive name
3. **Add to the builder pattern** if it's commonly used
4. **Document the scenario** with usage examples

```typescript
// 1. Define interface
export interface NewScenarioOptions {
    input: string
    expectedOutput: string
    errorMessage?: string
}

// 2. Create scenario function
export function setupNewScenario(mocks: TestMocks, options: NewScenarioOptions): void {
    const { input, expectedOutput, errorMessage } = options

    mocks.someService.process.mockResolvedValue(expectedOutput)
    if (errorMessage) {
        mocks.someService.process.mockRejectedValue(new Error(errorMessage))
    }
}

// 3. Add to builder (optional)
export class MockBuilder {
    // ... existing methods

    newScenario(options: NewScenarioOptions): MockBuilder {
        setupNewScenario(this.mocks, options)
        return this
    }
}
```

### Migration Guide

To migrate existing tests to use the Enhanced Mock Strategy:

1. **Update directory structure** to use `__mocks__/` instead of `_setup.ts`
2. **Import from new locations** (`helpers.ts` and `mock-scenario-builder.ts`)
3. **Replace repetitive mock setup** with scenario calls
4. **Use builder pattern** for complex compositions
5. **Test the migration** to ensure behavior is preserved

```typescript
// Before migration (old _setup.ts approach)
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
} from '../_setup'

// After migration (Enhanced Mock Strategy)
import { setupTestEnvironment, resetAllMocks, setupVSCodeMocks } from '../__mocks__/helpers'
import {
    setupBackupSuccessScenario,
    setupBackupConflictScenario,
    setupBackupErrorScenario,
    createMockBuilder,
} from '../__mocks__/mock-scenario-builder'
```

### Extension Package Mock Strategy

The extension package (`packages/project-butler/ext/`) uses a specialized mock strategy for VSCode API testing that complements the core package strategy.

#### ⚠️ Critical TypeScript Pitfalls in Setup Files

When creating VSCode mocks in `_setup.ts` files, be aware of these common TypeScript pitfalls that can cause compilation errors:

**1. VSCode Uri Mocking Pitfall**

```typescript
// ❌ WRONG - Causes TypeScript error: missing properties
vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })

// ✅ CORRECT - Proper type assertion
const mockUri = { fsPath: filePath } as vscode.Uri
vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
```

**2. FileStat Mocking Pitfall**

```typescript
// ❌ WRONG - Missing required properties
vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: fileTypeValue })

// ✅ CORRECT - Include all required properties
vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({
    type: fileTypeValue,
    ctime: 0,
    mtime: 0,
    size: 0,
})
```

**3. WorkspaceFolder Mocking Pitfall**

```typescript
// ❌ WRONG - Missing required properties
const mockWorkspaceFolder = {
    uri: { fsPath: workspacePath },
}

// ✅ CORRECT - Complete WorkspaceFolder interface
const mockWorkspaceFolder = {
    uri: { fsPath: workspacePath } as vscode.Uri,
    name: 'test-workspace',
    index: 0,
} as vscode.WorkspaceFolder
```

**4. Terminal Mocking Pitfall**

```typescript
// ❌ WRONG - Missing required properties, causes type conversion error
const mockTerminal = {
    sendText: vi.fn(),
    show: vi.fn(),
    name: terminalName,
} as vscode.Terminal

// ✅ CORRECT - Complete Terminal interface with proper type assertion
const mockTerminal = {
    sendText: vi.fn(),
    show: vi.fn(),
    name: terminalName,
    processId: Promise.resolve(12345),
    creationOptions: {},
    exitStatus: undefined,
    state: { isInteractedWith: false },
    shellIntegration: undefined,
    hide: vi.fn(),
    dispose: vi.fn(),
} as unknown as vscode.Terminal
```

**5. Multiple Uri Mocking Pitfall**

```typescript
// ❌ WRONG - Inconsistent type handling
vi.mocked(vscode.Uri.file)
    .mockReturnValueOnce({ fsPath: sourcePath })
    .mockReturnValueOnce({ fsPath: destinationPath })

// ✅ CORRECT - Consistent type assertions
const mockSourceUri = { fsPath: sourcePath } as vscode.Uri
const mockDestUri = { fsPath: destinationPath } as vscode.Uri
vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockSourceUri).mockReturnValueOnce(mockDestUri)
```

**Key Principles for VSCode Mocking:**

1. **Always use type assertions** (`as vscode.Type`) for partial mock objects
2. **Include all required properties** when mocking complex interfaces
3. **Use `as unknown as vscode.Type`** for complex type conversions
4. **Be consistent** across all mock calls in the same function
5. **Test your mocks** by running the tests to catch TypeScript errors early

**Common Error Messages and Solutions:**

- `"Argument of type '{ fsPath: string; }' is not assignable to parameter of type 'Uri'"` → Use `as vscode.Uri`
- `"Type '{ ... }' is missing the following properties from type 'FileStat'"` → Add missing properties
- `"Conversion of type '{ ... }' to type 'Terminal' may be a mistake"` → Use `as unknown as vscode.Terminal`
- `"Type '{ ... }' is missing the following properties from type 'WorkspaceFolder'"` → Add `name` and `index` properties

#### VSCode-Specific Mock Scenarios

```typescript
// File System Operations
export function setupVSCodeFileReadScenario(
    mocks: ExtensionTestMocks,
    options: VSCodeFileScenarioOptions
): void {
    const { filePath, content = 'file content' } = options
    const buffer = Buffer.from(content)

    vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
    vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)
}

// Command Registration
export function setupVSCodeCommandRegistrationScenario(
    mocks: ExtensionTestMocks,
    options: VSCodeCommandScenarioOptions
): void {
    const { shouldSucceed = true, errorMessage = 'Command failed' } = options
    const mockDisposable = { dispose: vi.fn() }

    if (shouldSucceed) {
        vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)
    } else {
        vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
            throw new Error(errorMessage)
        })
    }
}

// Window/UI Messages
export function setupVSCodeWindowMessageScenario(
    mocks: ExtensionTestMocks,
    messageType: 'info' | 'warning' | 'error',
    message: string
): void {
    switch (messageType) {
        case 'info':
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)
            break
        case 'warning':
            vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined)
            break
        case 'error':
            vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(undefined)
            break
    }
}
```

#### Extension Mock Builder Pattern

```typescript
export class ExtensionMockBuilder {
    constructor(private mocks: ExtensionTestMocks) {}

    fileRead(options: VSCodeFileScenarioOptions): ExtensionMockBuilder {
        setupVSCodeFileReadScenario(this.mocks, options)
        return this
    }

    commandRegistration(options: VSCodeCommandScenarioOptions): ExtensionMockBuilder {
        setupVSCodeCommandRegistrationScenario(this.mocks, options)
        return this
    }

    windowMessage(
        messageType: 'info' | 'warning' | 'error',
        message: string
    ): ExtensionMockBuilder {
        setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
        return this
    }

    build(): ExtensionTestMocks {
        return this.mocks
    }
}
```

#### Extension Test Usage Examples

**Before (Manual Mock Setup):**

```typescript
it('should read file content', async () => {
    // Manual mock setup
    const path = '/test/file.txt'
    const content = 'file content'
    const buffer = Buffer.from(content)

    vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)
    vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: path })

    const result = await adapter.readFile(path)
    expect(result).toBe(content)
})
```

**After (Using Scenarios):**

```typescript
it('should read file content', async () => {
    // Clean scenario setup
    const path = '/test/file.txt'
    const content = 'file content'

    setupVSCodeFileReadScenario(mocks, { filePath: path, content })

    const result = await adapter.readFile(path)
    expect(result).toBe(content)
})
```

**Complex Extension Test (Using Builder):**

```typescript
it('should handle command registration with error', () => {
    // Fluent API for complex scenarios
    createExtensionMockBuilder(mocks)
        .commandRegistration({
            commandName: 'test',
            shouldSucceed: false,
            errorMessage: 'Registration failed',
        })
        .windowMessage('error', 'Failed to activate Project Butler: Registration failed')
        .build()

    activate(context as any)

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to activate Project Butler: Registration failed'
    )
})
```

#### Extension Mock Strategy Benefits

- **VSCode API Focus**: Specialized for VSCode extension testing
- **Global Mock Integration**: Works seamlessly with global VSCode mocks
- **Command Testing**: Simplified command registration and execution testing
- **File System Testing**: Easy file operation mock setup
- **UI Testing**: Streamlined window message and dialog testing
- **Error Scenario Testing**: Built-in error handling scenarios

### Benefits Summary

- **60% reduction** in mock setup code
- **Improved maintainability** with centralized scenarios
- **Better readability** with focused test logic
- **Type safety** with TypeScript interfaces
- **Flexible approach** supporting multiple usage patterns
- **Consistent behavior** across all tests
- **Easy to extend** with new scenarios as needed
- **Dual Strategy**: Core package + Extension package mock strategies
- **VSCode Integration**: Specialized extension testing support

This comprehensive mocking strategy provides the perfect balance between centralized control and individual test flexibility, making your test suite more maintainable, readable, and efficient across both core business logic and VSCode extension functionality.

