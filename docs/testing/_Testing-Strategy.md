# FocusedUX Testing Strategy v3

## **REFERENCE FILES**

### **Documentation References**

- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`
- **SOP_DOCS**: `docs/_SOP.md`
- **ACTIONS_LOG**: `docs/Actions-Log.md`

### **Testing Documentation References**

- **MOCK_STRATEGY_CORE**: `docs/testing/Mock-Strategy-Core.md`
- **MOCK_STRATEGY_EXT**: `docs/testing/Mock-Strategy-Ext.md`
- **MOCK_STRATEGY_LIB**: `docs/testing/Mock-Strategy-Lib.md`
- **MOCK_STRATEGY_TOOL**: `docs/testing/Mock-Strategy-Tool.md`
- **MOCK_STRATEGY_PLUGIN**: `docs/testing/Mock-Strategy-Plugin.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General__v2.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/Troubleshooting - Tests.md`

### **Command References**

- **FLUENCY_CMD**: `@Deep Dive - Fluency of a package.md`
- **FLUENCY_PHASE_1**: `@fluency-phase1-Identity.md`
- **FLUENCY_PHASE_2**: `@fluency-phase2-Architecture.md`
- **FLUENCY_PHASE_6**: `@fluency-phase6-Synthesis.md`

---

> **📖 Enhanced Mock Strategy**: This project uses an Enhanced Mock Strategy with centralized mock scenarios. See **MOCK_STRATEGY_CORE** and **MOCK_STRATEGY_EXT** for detailed documentation on the three-component mock system (`globals.ts`, `helpers.ts`, `mock-scenario-builder.ts`).

## 🚀 Quick Reference for AI Agents

### Package Types & Testing Approach

- **Core Packages** (`packages/{feature}/core/`): Pure business logic, Vitest only, no VSCode deps
- **Extension Packages** (`packages/{feature}/ext/`): VSCode wrapper, dual testing (Vitest + Integration)
- **Shared Packages** (`libs/`): Utilities, Vitest only, no VSCode deps
- **Tools** (`libs/tools/`): Standalone utilities, Vitest only, minimal external deps

### Critical Commands (ALWAYS use PAE aliases)

- `{alias} b` - Build first (MANDATORY before testing)
- `{alias} t` - Fast tests
- `{alias} tc` - Tests with coverage
- `{alias} ti` - Integration tests (extensions only)

### Critical Mocking Rules

- **Scenario Builders First**: Always start with scenario builders for complex mocking
- **Global Mock Integration**: Ensure global mocks integrate with local test needs
- **Environment Variable Control**: Use environment variables for realistic test scenarios
- **Mock Normalization**: Mock normalization logic must match real implementation exactly
- **ESM Import Requirements**: Use ESM imports in test helpers, not require() statements
- **Cache Clearing Strategy**: Test isolation requires both cache clearing AND proper mock integration
- **Global Mock Analysis**: Complex mocking scenarios should start with global mock analysis before local approaches
- **Shell Detection Mocking** → Always use scenario builder, never manual mocking
- **Complex Multi-Step Setups** → Use scenario builder pattern
- **Simple Single Function Mocks** → Use standard vi.mocked() approach
- **Node.js Built-ins** → Use globals.ts for consistent mocking
- **Rule of Thumb**: If you need more than 2 mocks working together, use scenario builder

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

> **📖 For detailed troubleshooting**: See [Test Troubleshooting Guide](./Troubleshooting%20-%20Tests.md) for solutions to common test failures including `process.exit()` testing, mock issues, and shell script output problems.

## 📋 Package Classification Matrix

| Package Type | Path                       | Testing              | Dependencies     |
| ------------ | -------------------------- | -------------------- | ---------------- |
| Core         | `packages/{feature}/core/` | Vitest only          | Minimal external |
| Extension    | `packages/{feature}/ext/`  | Vitest + Integration | Core + VSCode    |
| Shared       | `libs/`                    | Vitest only          | No VSCode        |
| Tools        | `libs/tools/`              | Vitest only          | Minimal external |

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

### Coverage Test Configuration

```typescript
// vitest.coverage.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../../vitest.coverage.base'

export default mergeConfig(
    mergeConfig(functionalConfig, baseCoverageConfig),
    defineConfig({
        test: {
            include: ['__tests__/**/*.{test,test-cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        },
    })
)
```

### Coverage Test Naming Convention

Coverage test files should be named using the pattern:

```
{module-name}.test-cov.ts
```

For example:

- `core.test-cov.ts` - covers uncovered lines in the core module
- `ext.test-cov.ts` - covers uncovered lines in the extension module
- `lib.test-cov.ts` - covers uncovered lines in the shared library module
- `tool.test-cov.ts` - covers uncovered lines in the tool module
- `plugin.test-cov.ts` - covers uncovered lines in the plugin module

### Running Coverage Tests

Coverage tests are automatically included when running:

```bash
pae ms tc  # Runs tests including coverage tests
```

Standard tests (without coverage tests) can be run with:

```bash
pae ms t   # Runs only functional tests
pae ms t -c # Runs functional tests with coverage report
```

### Coverage Test Guidelines

1. **Targeted Coverage**: Only test the specific uncovered lines identified by the coverage report
2. **Minimal Tests**: Write the smallest possible test to cover the uncovered line
3. **Clear Comments**: Document which lines are being covered
4. **No Duplication**: Don't duplicate functionality already tested in functional tests
5. **Edge Cases**: Focus on edge cases, error conditions, and boundary values

### Coverage Goals

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

## 🧪 Testing Patterns by Package Type

### Core Package Testing

> **📖 Enhanced Mock Strategy**: The FocusedUX project uses an Enhanced Mock Strategy with centralized mock scenarios. See [Core Package Mock Strategy](./Mock-Strategy-Core.md) and [Extension Package Mock Strategy](./Mock-Strategy-Ext.md) for detailed documentation.

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

> **📖 Enhanced Mock Strategy**: The FocusedUX project uses a sophisticated three-component mock system instead of a single `_setup.ts` file. See [Core Package Mock Strategy](./Mock-Strategy-Core.md) and [Extension Package Mock Strategy](./Mock-Strategy-Ext.md) for complete documentation.

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

### Test Target Explanations

#### Test Target Types

```bash
t    # Test just the functional tests
t -c # Test just the functional tests, but show the coverage reporting
tc   # Test the functional tests and the coverage tests (test-cov) and show the coverage report
ti   # Integration tests (extensions only)
```

#### Test Directory Structure

- **`__tests__/functional-tests/`** - Main integration tests that test actual functionality and behavior
- **`__tests__/coverage-tests/`** - Tests specifically designed to achieve 100% code coverage for uncovered lines
- **`__tests__/integration-tests/`** - VS Code extension integration tests (extensions only)
- **`__tests__/isolated-tests/`** - Specific isolated tests for particular scenarios

#### Test Target Purposes

- **`t`** - Fast functional testing for development and CI
- **`t -c`** - Functional testing with coverage reporting to identify uncovered lines
- **`tc`** - Complete testing including coverage tests to achieve 100% coverage
- **`ti`** - Integration testing for VSCode extension functionality

---

**Key Principles:**

1. **No DI Containers** - Direct service instantiation
2. **No Shared Dependencies in Core** - Self-contained packages
3. **Thin Extension Wrappers** - Business logic in core only
4. **Simple Testing** - Clear separation of concerns
5. **Individual Exports** - Tree-shaking optimization

## VS Code Test Helper Integration (Current)

Purpose: use the monorepo helper (`@fux/vscode-test-cli-config`) for integration tests without pulling it into extension builds.

- **Current Implementation**: Uses `@fux/vscode-test-executor` for integration tests
- **Configuration**: Integration tests use the `test:integration` target with proper dependencies
- **Helper**: `@fux/vscode-test-cli-config` provides the underlying test configuration

### Benefits

- Keep extension builds fast and stable (no unintended graph edges)
- Keep the helper strictly test-only
- Simplified configuration through the executor plugin

---

## Integration Testing Reference (Current)

This reflects the current working setup using the `@fux/vscode-test-executor` plugin.

### Directory layout (extension)

```
packages/{feature}/ext/
├── __tests__/
│   ├── integration-tests/
│   │   ├── mocked-workspace/
│   │   │   └── package.json
│   │   ├── suite/
│   │   │   ├── extension.integration.test.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.test.json
│   │   └── .vscode-test.mjs
│   └── _setup.ts
└── src/
    └── extension.ts
```

### project.json (extension targets)

```json
{
    "targets": {
        "test:integration": {
            "executor": "@fux/vscode-test-executor:test-integration",
            "dependsOn": ["build"],
            "cache": false,
            "options": {
                "tsConfig": "{projectRoot}/__tests__/integration-tests/tsconfig.test.json",
                "config": "{projectRoot}/__tests__/integration-tests/.vscode-test.mjs",
                "timeout": 20000,
                "filterOutput": true
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

---

## 🎭 Enhanced Mock Strategy

### Overview

The FocusedUX project uses an **Enhanced Mock Strategy** that combines centralized mock scenarios with individual test flexibility. This approach reduces code duplication by 60% while maintaining test clarity and maintainability.

> **📖 For detailed documentation**: See [Core Package Mock Strategy](./Mock-Strategy-Core.md) and [Extension Package Mock Strategy](./Mock-Strategy-Ext.md)

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

#### Shell Detection Scenarios

```typescript
// Shell detection is a common complex scenario
export function setupShellDetectionScenario(
    mocks: TestMocks,
    shellType: 'powershell' | 'gitbash' | 'unknown'
): void {
    mocks.shell.detectShell.mockReturnValue(shellType)
}

// Usage in tests
it('should detect PowerShell correctly', () => {
    setupShellDetectionScenario(mocks, 'powershell')

    const result = service.detectShellType()
    expect(result).toBe('pwsh')
})
```

#### Global Mock Integration Patterns

**Global mocks can override real implementations and prevent local mocks from working.**

##### **Problem Pattern:**

```typescript
// ❌ PROBLEMATIC: Global mock hardcodes return values
vi.mock('../../src/shell.js', () => ({
    detectShellTypeCached: vi.fn().mockReturnValue('powershell'),
}))

// ❌ PROBLEMATIC: Service mock hardcodes return values
vi.mock('../../src/services/ExpandableProcessor.service.js', () => ({
    ExpandableProcessorService: vi.fn().mockImplementation(() => ({
        detectShellType: vi.fn().mockReturnValue('pwsh'), // Hardcoded!
    })),
}))
```

##### **Solution Pattern:**

```typescript
// ✅ CORRECT: Global mock integrates with other mocked functions
vi.mock('../../src/shell.js', () => {
    const detectShell = vi.fn().mockImplementation(() => {
        // Check environment variables for realistic behavior
        if (process.env.PSModulePath) return 'powershell'
        if (process.env.MSYS_ROOT) return 'gitbash'
        return 'unknown'
    })

    const detectShellTypeCached = vi.fn().mockImplementation(() => {
        return detectShell() // Use the mocked function
    })

    return { detectShell, detectShellTypeCached, clearShellDetectionCache: vi.fn() }
})

// ✅ CORRECT: Service mock uses mocked dependencies
vi.mock('../../src/services/ExpandableProcessor.service.js', () => ({
    ExpandableProcessorService: vi.fn().mockImplementation(() => ({
        detectShellType: vi.fn().mockImplementation(() => {
            // Use the mocked detectShellTypeCached function
            const result = mockDetectShellTypeCached()

            // Normalize like real implementation
            if (result === 'powershell') return 'pwsh'
            if (result === 'gitbash') return 'linux'
            return 'cmd'
        }),
    })),
}))
```

#### ESM Import Requirements

**ESM imports vs require() statements affect module resolution in test environments.**

##### **❌ PROBLEMATIC: require() in test helpers**

```typescript
// This causes module resolution issues
const config = vi.mocked(require('../../src/config.js'))
const shell = vi.mocked(require('../../src/shell.js'))
```

##### **✅ CORRECT: ESM imports in test helpers**

```typescript
import * as config from '../../src/config.js'
import * as shell from '../../src/shell.js'

export function setupPaeTestEnvironment(): PaeTestMocks {
    const mockedConfig = vi.mocked(config)
    const mockedShell = vi.mocked(shell)
    // ...
}
```

#### Test Isolation Strategy

**Test isolation requires both cache clearing AND proper mock integration.**

##### **Complete Test Isolation Pattern:**

```typescript
beforeEach(async () => {
    // 1. Clear shell detection cache
    clearShellDetectionCache()

    // 2. Clear environment variables
    delete process.env.PSModulePath
    delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL

    // 3. Clear all mocks
    vi.clearAllMocks()
})

it('should detect PowerShell on Windows', () => {
    // 4. Set specific environment variables for this test
    process.env.PSModulePath = 'C:\\Program Files\\PowerShell\\Modules'

    const result = expandableProcessor.detectShellType()
    expect(result).toBe('pwsh')
})
```

#### Debugging Mock Issues

**When mocks aren't working, follow this debugging approach:**

1. **Check Spy Call Count**: If spy call count is 0, the mocked function is never called
2. **Console Logging**: Add console.log to verify which implementation is called
3. **Environment Variable Logging**: Verify environment variables are set correctly
4. **Global Mock Analysis**: Check if global mocks are overriding local implementations
5. **Import Timing**: Verify mocks are applied before modules are imported

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

### Recent Implementations

#### Project Butler Core (PBC) - Enhanced Mock Strategy

- **Status**: ✅ Fully implemented and optimized
- **Components**: `globals.ts`, `helpers.ts`, `mock-scenario-builder.ts`
- **Key Features**: Node.js API mocks (`node:fs/promises`, `js-yaml`, `node:path`), timer setup, console control
- **Test Files**: All functional tests updated to use scenario functions and builder pattern
- **Benefits**: 60% reduction in mock setup code, improved test readability

#### Ghost Writer Core (GWC) - Enhanced Mock Strategy

- **Status**: ✅ Fully implemented and optimized
- **Components**: `globals.ts`, `helpers.ts`, `mock-scenario-builder.ts`
- **Key Features**: Service interface mocks, clipboard scenarios, import generation scenarios
- **Test Files**: All functional tests updated to use Enhanced Mock Strategy
- **Benefits**: Type-safe mock interfaces, centralized scenario management

#### Dynamicons Core (DCC) - Enhanced Mock Strategy

- **Status**: ✅ Fully implemented and optimized
- **Components**: `globals.ts`, `helpers.ts`, `mock-scenario-builder.ts`
- **Key Features**: VSCode API mocks (`strip-json-comments`, `vscode`), icon theme scenarios, configuration scenarios
- **Test Files**: All functional tests updated with scenario functions and builder pattern examples
- **Benefits**: Comprehensive mock coverage, fluent API for complex compositions

### Extension Package Mock Strategy

The extension packages (`packages/project-butler/ext/`, `packages/ghost-writer/ext/`) use specialized mock strategies for VSCode API testing that complement the core package strategies.

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

---

## Testing Strategy Alignment Workflow

### Testing Strategy as Authority

- **Authority Document**: This document is the authoritative source for all testing dependencies and patterns
- **Alignment Process**: When aligning packages, reference this document rather than comparing packages
- **Documentation-First**: Check existing documentation before implementing solutions to prevent reinvention

### Testing Strategy Alignment Steps

1. **Reference Testing Strategy**: Check this document for required dependencies and patterns
2. **Identify Missing Elements**: Compare package implementation against strategy document requirements
3. **Update Implementation**: Add missing dependencies or configurations to align with strategy
4. **Update Documentation**: Ensure strategy document is complete and current
5. **Verify Alignment**: Run tests to confirm proper alignment

### Strategy Document Maintenance

- **Completeness**: Keep testing strategy documentation complete with all required dependencies
- **Current State**: Update strategy document when new patterns or dependencies are identified
- **Authority**: Use strategy document as single source of truth for all testing implementations

---

## Package-Specific Testing Strategies

### Tools (`libs/tools/`)

- **Testing Strategy**: Direct execution tests, CLI testing patterns
- **Test Structure**: `__tests__/` directory with execution-focused tests
- **Dependencies**: Minimal external dependencies

#### CLI Testing Implementation Notes

**MANDATORY**: When testing CLI main functions, proper cleanup of `process.argv` is critical for test isolation:

```typescript
// ✅ CORRECT: Save, modify, and restore process.argv
it('should handle CLI arguments correctly', () => {
    const originalArgv = process.argv

    try {
        // Modify process.argv for test
        process.argv = ['node', 'cli.js', 'test-command', '--flag']

        // Execute function under test
        main()

        // Assert expected behavior
        expect(someFunction).toHaveBeenCalledWith('test-command')
    } finally {
        // MANDATORY: Restore original process.argv
        process.argv = originalArgv
    }
})
```

**Critical**: Without proper cleanup, tests can interfere with each other and cause unpredictable test failures.

### Shared Libraries (`libs/`)

- **Testing Strategy**: Standard library testing, unit tests
- **Test Structure**: `__tests__/` directory with utility-focused tests
- **Dependencies**: No VSCode dependencies

### Core Packages (`packages/{feature}/core`)

- **Testing Strategy**: Core package testing pattern, business logic validation
- **Test Structure**:
    - `__tests__/functional-tests/` - Main integration tests
    - `__tests__/isolated-tests/` - Specific isolated tests
    - `__tests__/coverage-tests/` - Coverage reports

**MANDATORY Test File Organization**:

- **Functional Tests**: `{module-name}.test.ts` in `functional-tests/` directory
- **Coverage Tests**: `{module-name}.test-cov.ts` in `coverage-tests/` directory
- **Integration Tests**: `{module-name}.integration.test.ts` in `integration-tests/` directory (extensions only)

**Critical**: Never mix functional and coverage tests in the same file. Coverage tests should only test uncovered lines identified by coverage reports.

- **Dependencies**: Minimal external dependencies, no VSCode value imports

### Extension Packages (`packages/{feature}/ext`)

- **Testing Strategy**: Extension package testing pattern, dual testing strategy
- **Test Structure**:
    - `__tests__/functional-tests/` - Standard Vitest tests
    - `__tests__/integration-tests/` - VS Code extension integration tests
    - `__tests__/isolated-tests/` - Specific isolated tests
    - `__tests__/coverage-tests/` - Coverage reports

**MANDATORY Test File Organization**:

- **Functional Tests**: `{module-name}.test.ts` in `functional-tests/` directory
- **Coverage Tests**: `{module-name}.test-cov.ts` in `coverage-tests/` directory
- **Integration Tests**: `{module-name}.integration.test.ts` in `integration-tests/` directory
- **Dependencies**: Core package + VSCode APIs

