# FocusedUX Testing Strategy v3

## Overview

This document outlines the **comprehensive testing strategy** for the FocusedUX project, based on the **confirmed final Core/Extension Package Architecture** established through working implementations in Ghost Writer and Project Butler packages. This strategy provides **failsafe, one-stop-shop guidance** for implementing comprehensive testing patterns that follow the separation of business logic (core) from VSCode integration (extension).

## Package Architecture Pattern

### Core Package (`@fux/package-name-core`)

- **Purpose**: Pure business logic, no VSCode dependencies
- **Dependencies**: Minimal external dependencies (e.g., `js-yaml` for YAML parsing)
- **No DI Container**: Services are directly instantiated with dependencies
- **No Shared Dependencies**: Self-contained "guinea pig" packages

### Extension Package (`@fux/package-name-ext`)

- **Purpose**: Lightweight VSCode wrapper for core logic
- **Dependencies**: Core package + VSCode APIs + `@fux/vscode-test-cli-config`
- **No DI Container**: Direct service instantiation
- **VSCode Adapters**: Abstract VSCode API calls
- **Dual Testing Strategy**: Standard Vitest tests + VS Code integration tests

## Directory Structure

```
packages/package-name/
├── core/
│   ├── __tests__/
│   │   ├── _setup.ts                    # Global test setup
│   │   ├── README.md                    # Test documentation
│   │   ├── functional-tests/            # Main test directory
│   │   │   ├── _readme.md              # Functional test docs
│   │   │   ├── *.service.test.ts       # Service tests
│   │   │   ├── *.adapter.test.ts       # Adapter tests
│   │   │   └── *.test.ts               # Other functional tests
│   │   ├── isolated-tests/             # Specific isolated tests
│   │   │   ├── _readme.md              # Isolated test docs
│   │   │   └── *.test.ts               # Isolated tests
│   │   ├── integration-tests/          # VS Code integration tests
│   │   │   ├── _readme.md              # Integration test docs
│   │   │   ├── suite/                  # Test suites
│   │   │   ├── mocked-workspace/       # Mock workspace files
│   │   │   └── index.ts                # Test runner entry point
│   │   ├── coverage-tests/             # Coverage reports
│   │   │   └── _readme.md              # Coverage docs
│   │   └── _reports/                   # Test reports and coverage output
│   │       └── coverage/               # Coverage reports
│   ├── src/
│   │   ├── _interfaces/                # Service interfaces
│   │   ├── _config/                    # Configuration constants
│   │   ├── features/                   # Feature-specific services
│   │   └── index.ts                    # Package exports
│   ├── vitest.config.ts                # Test config
│   ├── vitest.coverage.config.ts       # Coverage test config
│   └── project.json                    # Nx build configuration
└── ext/
    ├── __tests__/
    │   ├── _setup.ts                    # Global test setup + test helpers
    │   ├── README.md                    # Test documentation
    │   ├── functional-tests/           # Standard Vitest tests
    │   │   ├── _readme.md              # Functional test docs
    │   │   ├── extension.test.ts       # Main extension test
    │   │   └── adapters/*.adapter.test.ts # Adapter tests
    │   ├── integration/                 # VS Code integration tests
    │   │   ├── mocked-workspace/       # Test workspace files
    │   │   ├── *.test.ts               # Integration test files
    │   │   └── index.ts                # Integration test entry point
    │   ├── isolated-tests/             # Specific isolated tests
│   │   └── _readme.md              # Isolated test docs
    │   ├── coverage-tests/             # Coverage reports
    │   │   └── _readme.md              # Coverage docs
    │   ├── _out-tsc/                   # Compiled integration tests
    │   ├── _reports/                   # Test reports and coverage output
    │   │   └── coverage/               # Coverage reports
    │   ├── tsconfig.test.json          # Integration test TypeScript config
    │   └── .vscode-test.mjs            # VS Code test configuration
    ├── src/
    │   ├── adapters/                   # VSCode API adapters
    │   ├── _interfaces/                # Extension interfaces
    │   ├── _config/                    # Extension configuration
    │   ├── services/                   # Extension-specific services
    │   ├── extension.ts                # Main extension entry point
    │   └── index.ts                    # Package exports
    ├── vitest.config.ts                # Standard test config
    ├── vitest.coverage.config.ts       # Coverage test config
    └── project.json                    # Nx build configuration
```

## Required Dependencies for Extension Packages

### **VS Code Integration Testing Dependencies**

Extension packages require specific dependencies for VS Code integration testing:

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

**Purpose of Each Dependency:**

- **`@fux/vscode-test-cli-config`**: Custom VS Code test CLI configuration package
- **`@vscode/test-cli`**: VS Code test CLI tool for running integration tests
- **`@vscode/test-electron`**: VS Code test electron runner for end-to-end testing
- **`@types/mocha`**: TypeScript types for Mocha test framework
- **`mocha`**: Test framework for VS Code integration tests
- **`glob`**: File pattern matching for test discovery

### **Standard Testing Dependencies**

All packages require these standard testing dependencies:

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

## Dual Testing Strategy for Extension Packages

Extension packages implement a **dual testing strategy** that provides comprehensive coverage:

### **1. Standard Vitest Tests** (`test`, `test:full`)

- **Purpose**: Test extension logic, adapters, and command registration
- **Environment**: Isolated test environment with mocked VSCode APIs
- **Speed**: Fast execution, no VS Code instance required
- **Coverage**: Unit and integration testing of extension components

### **2. VS Code Integration Tests** (`test:integration`)

- **Purpose**: Test actual extension behavior in real VS Code environment
- **Environment**: Full VS Code instance with extension loaded
- **Speed**: Slower execution, requires VS Code startup
- **Coverage**: End-to-end testing of extension functionality

### **Test Separation Strategy**

```typescript
// vitest.config.ts - Standard tests only
export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            exclude: [
                '**/__tests__/integration/**', // Source files
                '**/__tests__/_out-tsc/**', // Compiled integration tests
            ],
        },
    })
)
```

### **Integration Test Configuration**

#### **TypeScript Configuration for Integration Tests**

```json
// packages/package-name/ext/__tests__/tsconfig.test.json
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
    "include": ["integration/**/*.ts"]
}
```

#### **Integration Test Compilation**

Integration tests are compiled to JavaScript for VS Code test runner compatibility:

- **Source**: `integration/*.ts` files
- **Output**: `_out-tsc/*.js` files with source maps
- **Purpose**: VS Code test runner requires compiled JavaScript
- **Configuration**: Uses `tsconfig.test.json` for compilation

#### **Test Reports and Coverage**

- **Reports Directory**: `_reports/` for all test outputs
- **Coverage Reports**: `_reports/coverage/` for coverage data
- **Integration Test Outputs**: `_out-tsc/` for compiled tests
- **Source Maps**: `.js.map` files for debugging compiled tests

## Testing Patterns

### 1. Core Package Testing

#### Service Testing Pattern

```typescript
// packages/package-name/core/__tests__/functional/ServiceName.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceName } from '../../src/features/feature-name/services/ServiceName.service.js'
import type {
    IDependency1,
    IDependency2,
} from '../../src/features/feature-name/_interfaces/IServiceName.js'

// Mock dependencies
class MockDependency1 implements IDependency1 {
    process = vi.fn()
}

class MockDependency2 implements IDependency2 {
    format = vi.fn()
}

describe('ServiceName', () => {
    let service: ServiceName
    let mockDep1: MockDependency1
    let mockDep2: MockDependency2

    beforeEach(() => {
        mockDep1 = new MockDependency1()
        mockDep2 = new MockDependency2()
        service = new ServiceName(mockDep1, mockDep2)
    })

    describe('methodName', () => {
        it('should perform expected behavior', async () => {
            // Arrange
            mockDep1.process.mockResolvedValue('processed')
            mockDep2.format.mockReturnValue('formatted')

            // Act
            const result = await service.methodName('test')

            // Assert
            expect(result).toBe('formatted')
            expect(mockDep1.process).toHaveBeenCalledWith('test')
            expect(mockDep2.format).toHaveBeenCalledWith('processed')
        })
    })
})
```

#### Test Setup Pattern

```typescript
// packages/package-name/core/__tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Mock external dependencies
vi.mock('js-yaml', () => ({
    load: vi.fn(),
}))

// Use fake timers globally
beforeAll(() => {
    vi.useFakeTimers()
})

afterAll(() => {
    vi.useRealTimers()
})

// Keep mocks clean between tests
afterEach(() => {
    vi.clearAllMocks()
})
```

### 2. Extension Package Testing

#### 2.1 Standard Vitest Testing Pattern

**Note**: Based on lessons learned from Dynamicons refactoring, extension tests must validate actual runtime behavior, not just mock interactions.

```typescript
// packages/package-name/ext/__tests__/functional/extension.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activate, deactivate } from '../../src/extension.js'

describe('Extension', () => {
    let mockContext: any

    beforeEach(() => {
        mockContext = {
            subscriptions: [],
            globalState: {
                get: vi.fn(),
                update: vi.fn(),
            },
            workspaceState: {
                get: vi.fn(),
                update: vi.fn(),
            },
        }
    })

    describe('activate', () => {
        it('should activate without errors', () => {
            expect(() => {
                activate(mockContext)
            }).not.toThrow()
        })

        it('should register commands', () => {
            activate(mockContext)
            expect(mockContext.subscriptions).toHaveLength(1)
        })

        it('should log activation message', () => {
            const consoleSpy = vi.spyOn(console, 'log')

            activate(mockContext)

            expect(consoleSpy).toHaveBeenCalledWith('[Extension] Activating...')
            expect(consoleSpy).toHaveBeenCalledWith('[Extension] Activated.')
        })
    })

    describe('deactivate', () => {
        it('should deactivate without errors', () => {
            expect(() => {
                deactivate()
            }).not.toThrow()
        })
    })

    describe('integration', () => {
        it('should activate and deactivate successfully', () => {
            expect(() => {
                activate(mockContext)
                deactivate()
            }).not.toThrow()
        })
    })
})
```

#### Adapter Testing Pattern

```typescript
// packages/package-name/ext/__tests__/functional/adapters/AdapterName.adapter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdapterName } from '../../../src/adapters/AdapterName.adapter.js'

describe('AdapterName', () => {
    let adapter: AdapterName

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new AdapterName()
    })

    describe('methodName', () => {
        it('should call VSCode API correctly', () => {
            // Arrange
            const mockResult = 'test result'
            vi.mocked(vscode.someApi).mockReturnValue(mockResult)

            // Act
            const result = adapter.methodName('test/path')

            // Assert
            expect(result).toBe(mockResult)
            expect(vscode.someApi).toHaveBeenCalledWith('test/path')
        })
    })
})
```

#### Global Test Setup Pattern

```typescript
// packages/package-name/ext/__tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import type * as vscode from 'vscode'

// 1) Mock external dependencies
vi.mock('js-yaml', () => ({
    load: vi.fn(),
}))

// 2) Mock vscode globally
vi.mock('vscode', () => ({
    commands: {
        registerCommand: vi.fn(),
    },
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        createTerminal: vi.fn(),
        activeTextEditor: null,
        activeTerminal: null,
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copy: vi.fn(),
        },
    },
    Uri: {
        file: vi.fn((path: string) => ({ fsPath: path })),
    },
    FileType: {
        Directory: 1,
        File: 2,
    },
}))

// 3) Use fake timers globally
beforeAll(() => {
    vi.useFakeTimers()
})

afterAll(() => {
    vi.useRealTimers()
})

// 4) Keep mocks clean between tests
afterEach(() => {
    vi.clearAllMocks()
})

// Console output configuration
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
    console.log('🔍 Test console output enabled')
} else {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface ExtensionTestMocks {
    vscode: {
        commands: {
            registerCommand: ReturnType<typeof vi.fn>
        }
        window: {
            showInformationMessage: ReturnType<typeof vi.fn>
            showWarningMessage: ReturnType<typeof vi.fn>
            showErrorMessage: ReturnType<typeof vi.fn>
            activeTextEditor: vscode.TextEditor | undefined
            createTerminal: ReturnType<typeof vi.fn>
            activeTerminal: vscode.Terminal | undefined
        }
        workspace: {
            fs: {
                readFile: ReturnType<typeof vi.fn>
                writeFile: ReturnType<typeof vi.fn>
                stat: ReturnType<typeof vi.fn>
                copy: ReturnType<typeof vi.fn>
            }
            workspaceFolders: vscode.WorkspaceFolder[] | undefined
        }
        Uri: {
            file: ReturnType<typeof vi.fn>
        }
        FileType: {
            Directory: vscode.FileType.Directory
            File: vscode.FileType.File
        }
    }
    context: {
        subscriptions: vscode.Disposable[]
    }
}

export function setupTestEnvironment(): ExtensionTestMocks {
    // Implementation details...
}

export function resetAllMocks(mocks: ExtensionTestMocks): void {
    // Implementation details...
}

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void {
    // Implementation details...
}

export function createMockExtensionContext(): vscode.ExtensionContext {
    // Implementation details...
}

export function createMockUri(path: string): vscode.Uri {
    // Implementation details...
}
```

#### 2.2 VS Code Integration Testing Pattern

**Purpose**: Test extension behavior in a real VS Code environment with actual file system operations and UI interactions.

##### **Integration Test Structure**

```typescript
// packages/package-name/ext/__tests__/integration/extension.test.ts
import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Integration Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.')

    test('Should register commands', async () => {
        // Test command registration
        const commands = await vscode.commands.getCommands()
        assert.ok(commands.includes('fux-package-name.commandName'))
    })

    test('Should execute command successfully', async () => {
        // Test actual command execution
        const result = await vscode.commands.executeCommand('fux-package-name.commandName')
        assert.ok(result)
    })
})
```

##### **Integration Test Configuration**

```typescript
// packages/package-name/ext/__tests__/tsconfig.test.json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./_out-tsc",
        "rootDir": "./integration-tests",
        "module": "CommonJS",
        "moduleResolution": "node",
        "types": [
            "node",
            "mocha"
        ],
        "composite": false,
        "declaration": false,
        "sourceMap": true,
        "tsBuildInfoFile": "./_out-tsc/tsconfig.test.tsbuildinfo"
    },
    "include": [
        "integration/**/*.ts"
    ]
}
```

##### **VS Code Test Configuration**

```typescript
// packages/package-name/ext/__tests__/.vscode-test.mjs
import { createVscodeTestConfig } from '@fux/vscode-test-cli-config'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default createVscodeTestConfig({
    packageName: 'fux-package-name',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './__tests__/integration-tests/mocked-workspace',
    files: './__tests__/_out-tsc/**/*.test.js',
    setupFiles: './__tests__/_out-tsc/index.js',
})
```

##### **Integration Test Entry Point**

```typescript
// packages/package-name/ext/__tests__/integration-tests/index.ts
import * as path from 'path'
import { runTests } from '@vscode/test-electron'

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../')
        const extensionTestsPath = path.resolve(__dirname, './suite/index')

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
        })
    } catch (err) {
        console.error('Failed to run tests')
        process.exit(1)
    }
}

main()
```

## Vitest Configuration

### Functional Test Configuration

```typescript
// packages/package-name/core/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
        },
    })
)
```

### Coverage Test Configuration

```typescript
// packages/package-name/core/vitest.coverage.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.coverage.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            coverage: {
                reportsDirectory: './__tests__/coverage',
            },
        },
    })
)
```

### Extension Package Test Configuration

```typescript
// packages/package-name/ext/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            exclude: [
                '**/__tests__/integration/**', // Source files
                '**/__tests__/_out-tsc/**', // Compiled integration tests
            ],
        },
    })
)
```

### Extension Package Coverage Configuration

```typescript
// packages/package-name/ext/vitest.coverage.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../../vitest.coverage.base'

export default mergeConfig(
    mergeConfig(functionalConfig, baseCoverageConfig),
    defineConfig({
        // Any package-specific overrides for coverage can go here
    })
)
```

## Nx Configuration

### Core Package Project Configuration

```json
// packages/package-name/core/project.json
{
    "name": "@fux/package-name-core",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "main": "packages/package-name/core/src/index.ts",
                "outputPath": "packages/package-name/core/dist",
                "tsConfig": "packages/package-name/core/tsconfig.lib.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "keepNames": true,
                "declarationRootDir": "packages/package-name/core/src",
                "thirdParty": false,
                "deleteOutputPath": true,
                "external": ["vscode", "js-yaml"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"],
            "options": {}
        },
        "test:full": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": [
                {
                    "dependencies": true,
                    "target": "test",
                    "params": "forward"
                }
            ],
            "options": {}
        }
    }
}
```

### Extension Package Project Configuration

```json
// packages/package-name/ext/project.json
{
    "name": "@fux/package-name-ext",
    "projectType": "application",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/package-name/ext/src/extension.ts"],
                "outputPath": "packages/package-name/ext/dist",
                "format": ["cjs"],
                "metafile": true,
                "platform": "node",
                "bundle": true,
                "external": ["vscode"],
                "sourcemap": true,
                "main": "packages/package-name/ext/src/extension.ts",
                "tsConfig": "packages/package-name/ext/tsconfig.json",
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/package-name/ext/assets/",
                        "output": "./assets/"
                    }
                ]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"]
        },
        "test:full": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": [
                {
                    "dependencies": true,
                    "target": "test",
                    "params": "forward"
                }
            ]
        },
        "test:compile": {
            "executor": "nx:run-commands",
            "outputs": ["{projectRoot}/__tests__/_out-tsc"],
            "options": {
                "commands": ["tsc -p packages/package-name/ext/__tests__/tsconfig.test.json"]
            }
        },
        "test:integration": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": [
                    "powershell -Command \"& {vscode-test --config .vscode-test.mjs --verbose --timeout 20000 --reporter spec 2>&1 | Select-String -NotMatch 'extensionEnabledApiProposals', 'ChatSessionStore', 'update#setState disabled', 'update#ctor', 'Started local extension host', 'Settings Sync'}\""
                ],
                "cwd": "packages/package-name/ext"
            },
            "description": "Run VS Code extension integration tests with detailed output"
        },
        "test:integration:noisy": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": [
                    "vscode-test --config .vscode-test.mjs --verbose --timeout 20000 --reporter spec"
                ],
                "cwd": "packages/package-name/ext"
            },
            "description": "Run VS Code extension integration tests with full output"
        }
    }
}
```

### Alias Integration

The `pax` tool automatically expands feature aliases to target extension packages for integration tests:

```bash
# These commands automatically target the extension package
pb ti          # → test:integration @fux/project-butler-ext
gw ti          # → test:integration @fux/ghost-writer-ext
```

{
"name": "@fux/package-name-ext",
"targets": {
"build": {
"executor": "@nx/esbuild:esbuild",
"outputs": ["{options.outputPath}"],
"dependsOn": ["^build"],
"options": {
"entryPoints": ["packages/package-name/ext/src/extension.ts"],
"outputPath": "packages/package-name/ext/dist",
"format": ["cjs"],
"metafile": true,
"platform": "node",
"bundle": true,
"external": ["vscode", "js-yaml"],
"sourcemap": true,
"main": "packages/package-name/ext/src/extension.ts",
"tsConfig": "packages/package-name/ext/tsconfig.json",
"assets": [
{
"glob": "**/*",
"input": "packages/package-name/ext/assets/",
"output": "./assets/"
}
],
"thirdParty": true
}
},
"test": {
"executor": "@nx/vite:test",
"outputs": ["{options.reportsDirectory}"],
"dependsOn": ["^build"],
"options": {}
},
"test:full": {
"executor": "@nx/vite:test",
"outputs": ["{options.reportsDirectory}"],
"dependsOn": [
{
"dependencies": true,
"target": "test",
"params": "forward"
}
],
"options": {}
}
}
}

````

## Testing Best Practices

### 1. Service Testing

- **Test business logic in isolation**: Mock all external dependencies
- **Use descriptive test names**: Clear what behavior is being tested
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test error conditions**: Ensure graceful error handling
- **Mock external dependencies**: Use consistent mock patterns

### 2. Extension Testing

- **Test command registration**: Verify all commands are registered
- **Test error handling**: Ensure activation errors are handled gracefully
- **Test adapter functionality**: Verify VSCode API abstraction
- **Test integration**: Ensure core services are properly integrated

### 3. Mocking Strategy

- **Consistent mock patterns**: Use similar mock structures across tests
- **Realistic mock data**: Provide meaningful mock return values
- **Global vs local mocks**: Use global mocks for common dependencies
- **Mock cleanup**: Clear mocks between tests

### 4. Test Organization

- **Functional tests**: Main test directory for integration tests
- **Unit tests**: Specific isolated test cases
- **Coverage tests**: Separate configuration for coverage reporting
- **Test documentation**: README files in each test directory

## Command Aliases

### Core Package Commands

```bash
# Build core package
{alias}c build

# Test core package (functional)
{alias}c test

# Test core package (entire dependency chain)
{alias}c test:full

# TypeScript check
{alias}c tsc

# Lint core package
{alias}c lint
````

### Extension Package Commands

```bash
# Build extension package
{alias}e build

# Package extension for distribution
{alias}e package

# Test extension package (functional)
{alias}e test

# Test extension package (entire dependency chain)
{alias}e test:full

# TypeScript check
{alias}e tsc

# Lint extension package
{alias}e lint
```

### Combined Package Commands

```bash
# Test both packages
{alias} test

# Build both packages
{alias} build

# TypeScript check both packages
{alias} tsc
```

## Migration Guide

### From Monolithic to Core/Ext Architecture

1. **Extract Business Logic**
    - Move business logic to core package
    - Create service interfaces
    - Remove VSCode dependencies from core

2. **Create VSCode Adapters**
    - Abstract VSCode API calls
    - Create adapter interfaces
    - Implement adapter classes

3. **Update Extension**
    - Import core services
    - Use adapters for VSCode operations
    - Register commands with core logic

4. **Update Tests**
    - Move service tests to core package
    - Create adapter tests in extension package
    - Update extension tests with new architecture

5. **Update Build Configuration**
    - Configure Nx targets for both packages
    - Set up Vitest configurations
    - Update command aliases

## Quality Gates

### Core Package

- [ ] All services have functional tests
- [ ] 100% test coverage for business logic
- [ ] No VSCode dependencies
- [ ] Clean interfaces defined
- [ ] TypeScript compilation passes

### Extension Package

- [ ] Extension activation test passes
- [ ] All adapters have tests
- [ ] Command registration tested
- [ ] Error handling tested
- [ ] TypeScript compilation passes

### Integration

- [ ] Both packages build successfully
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Clean separation of concerns

## Key Architectural Principles

### 1. No DI Containers

- Core packages use direct service instantiation
- Extension packages use direct service instantiation
- Dependencies are passed as constructor parameters
- Simple and testable architecture

### 2. No Shared Dependencies in Core

- Core packages are self-contained "guinea pig" packages
- Only external dependencies are minimal utilities (e.g., `js-yaml`)
- No `@fux/shared` or `@fux/mockly` dependencies
- Enables independent testing and validation

### 3. Thin Extension Wrappers

- Extension packages contain only VSCode integration code
- Business logic is in core packages
- Adapters abstract VSCode API calls
- Minimal extension code

### 4. Simple Testing

- Core packages test business logic with mock dependencies
- Extension packages test VSCode integration only
- No complex DI container mocking
- Clear separation of concerns

### 5. Individual Exports

- Core packages use individual exports for tree-shaking
- No barrel exports for better optimization
- Clear public API surface

## Lessons Learned from Ghost Writer, Project Butler, and Dynamicons

### Critical Testing Lessons from Dynamicons Refactoring

**Problem**: Tests were passing but not validating actual runtime behavior, leading to runtime failures in production.

**Key Lessons**:

1. **Mock Adapter Instantiation Issues**:
    - **Issue**: Extension tests were not properly intercepting adapter constructor calls
    - **Solution**: Properly mock adapter modules and ensure mocks are applied before extension activation
    - **Prevention**: Verify that mocks are actually being used by checking call counts and parameters

2. **Command Registration Validation**:
    - **Issue**: Tests needed to validate that commands are actually registered with VSCode
    - **Solution**: Test both command registration and that handlers are proper functions
    - **Prevention**: Always test end-to-end extension activation and command registration

3. **Service Method Implementation Testing**:
    - **Issue**: Missing method implementations weren't caught by tests
    - **Solution**: Write functional tests that call all service methods, not just constructor tests
    - **Prevention**: Ensure test coverage includes all public methods

4. **Extension Activation State Management**:
    - **Issue**: Multiple test runs failed due to extension activation state persistence
    - **Solution**: Properly reset extension state between tests or structure tests to account for state
    - **Prevention**: Design extension activation to be idempotent or properly resettable

5. **Dynamic Import Violations**:
    - **Issue**: Test files used `await import()` for mocking, violating auditor rules
    - **Solution**: Remove all dynamic imports and use static imports with `vi.mocked()`
    - **Prevention**: Use standard Vitest mocking patterns instead of dynamic imports

6. **Mock Precision Requirements**:
    - **Issue**: Test mocks didn't match actual API signatures and parameter patterns
    - **Solution**: Ensure mocks precisely match real method signatures and behavior
    - **Prevention**: Understand actual implementation details before writing mock expectations

**Enhanced Testing Strategy**:

- [ ] **Real Runtime Validation**: Tests exercise actual service method calls
- [ ] **Command Registration Testing**: Verify commands are registered and handlers exist
- [ ] **Mock Interception Verification**: Confirm mocks are actually being used
- [ ] **Complete Method Coverage**: Test all public methods, not just constructors
- [ ] **Extension State Management**: Handle activation state properly in tests
- [ ] **Static Import Usage**: Use static imports with `vi.mocked()` instead of dynamic imports
- [ ] **Mock Precision**: Ensure mocks match actual API signatures and parameter patterns

### Dependency Management Insights

**Problem**: Ghost Writer had unnecessary dependencies (`awilix`, `js-yaml`, `@fux/mockly`) in the extension package that violated the thin wrapper principle.

**Solution**:

- **Remove DI Container Dependencies**: Extension packages should not use `awilix` or other DI containers - use direct instantiation instead
- **Remove Unnecessary Dependencies**: Only include dependencies that are actually needed for VSCode integration
- **Follow Project Butler Pattern**: Use the exact same dependency structure as the reference package:
    ```json
    "dependencies": {
      "@fux/{package}-core": "workspace:*"
    },
    "devDependencies": {
      "@types/node": "^24.0.10",
      "@types/vscode": "^1.99.3",
      "typescript": "^5.8.3",
      "vitest": "^3.2.4",
      "@vitest/coverage-v8": "^3.2.4"
    }
    ```

### Test Configuration Insights

**Problem**: Extension package test configuration was using `extends: "vite:test"` which caused "Cannot find configuration for task" errors.

**Solution**:

- **Use Direct Executor Configuration**: Instead of extending targets, use direct executor configuration:
    ```json
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": ["^build"]
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": [
        {
          "dependencies": true,
          "target": "test",
          "params": "forward"
        }
      ]
    }
    ```
- **Remove Mockly Dependencies**: Extension tests should not depend on `@fux/mockly` - use simple mocks instead
- **Simple Test Setup**: Use basic test setup without complex mocking libraries

### Build Configuration Insights

**Problem**: Build configuration had unnecessary external dependencies that were not actually needed.

**Solution**:

- **Minimal External Dependencies**: Only externalize what's actually needed:
    ```json
    "external": ["vscode"]
    ```
- **Remove Build Dependencies**: Don't externalize build-time dependencies like `typescript`, `awilix`, `js-yaml`

### Type Import vs Value Import Insights

**Problem**: Position adapter was using `import type` but trying to instantiate the class.

**Solution**:

- **Use Value Imports for Instantiation**: When you need to create instances, use regular imports:
    ```typescript
    import { Position as VSCodePosition } from 'vscode' // For instantiation
    ```
- **Use Type Imports for Types Only**: Use `import type` only when you need the type, not the value:
    ```typescript
    import type { ExtensionContext } from 'vscode' // For types only
    ```

### Test Mocking Strategy Insights

**Problem**: Extension tests were using complex Mockly setup that wasn't necessary.

**Solution**:

- **Simple Mock Objects**: Use simple mock objects for extension tests:
    ```typescript
    mockContext = {
        subscriptions: [],
        globalState: {
            get: vi.fn(),
            update: vi.fn(),
        },
        workspaceState: {
            get: vi.fn(),
            update: vi.fn(),
        },
    }
    ```
- **No Mockly in Extension Tests**: Extension tests don't need Mockly - use Vitest's built-in mocking capabilities

### **Adapter Testing Anti-Patterns and Solutions**

**Critical Problem**: Tests that pass in isolation but fail in real-world runtime scenarios due to oversimplified mocking.

#### **❌ Common Anti-Patterns**

1. **Mocking Masked Reality**: Tests use comprehensive mocks that always return valid objects, but real VSCode API calls can return `undefined` or `null`
2. **No Integration Testing**: Tests validate adapters in isolation but don't test actual integration with VSCode API in realistic scenarios
3. **Defensive Programming Not Tested**: While adapters might have null-safe operators, tests never simulate the failure conditions
4. **Type Safety Issues**: Using `any` types masks potential type mismatches

#### **✅ Required Testing Patterns**

1. **Defensive Programming Tests**: Test scenarios where VSCode API returns unexpected values:

    ```typescript
    describe('error handling', () => {
        it('should handle null input gracefully', () => {
            const result = adapter.create(null as any)
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[UriAdapter] Invalid URI provided to create():',
                null
            )
            expect(result.fsPath).toBe('/invalid-uri')
        })

        it('should handle undefined input gracefully', () => {
            const result = adapter.create(undefined as any)
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[UriAdapter] Invalid URI provided to create():',
                undefined
            )
            expect(result.fsPath).toBe('/invalid-uri')
        })
    })
    ```

2. **Integration Scenarios**: Test real-world usage patterns:

    ```typescript
    describe('integration scenarios', () => {
        it('should handle real-world extension URI usage', () => {
            const extensionUri = mockVscode.Uri.file('/extension/path')
            const assetsPath = 'assets/themes'

            const createdUri = adapter.create(extensionUri)
            const joinedUri = adapter.joinPath(createdUri, assetsPath)

            expect(createdUri).toBe(extensionUri)
            expect(joinedUri.fsPath).toBe('/extension/path/assets/themes')
        })
    })
    ```

3. **Proper Interface Definitions**: Replace `any` types with proper interfaces:

    ```typescript
    // ❌ WRONG
    create(uri: any): vscode.Uri

    // ✅ CORRECT
    create(uri: vscode.Uri | string): vscode.Uri
    ```

4. **Comprehensive Error Testing**: Test all edge cases and failure modes:

    ```typescript
    describe('file method', () => {
        it('should handle empty path gracefully', () => {
            const result = adapter.file('')
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[UriAdapter] Invalid path provided to file():',
                ''
            )
            expect(result.fsPath).toBe('/invalid-path')
        })

        it('should handle null path gracefully', () => {
            const result = adapter.file(null as any)
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[UriAdapter] Invalid path provided to file():',
                null
            )
            expect(result.fsPath).toBe('/invalid-path')
        })
    })
    ```

#### **🔍 Detection Methods**

1. **Runtime Error Analysis**: Look for errors like `this.uriAdapter.create is not a function`
2. **Test vs Reality Gap**: If tests pass but runtime fails, suspect oversimplified mocking
3. **Type Safety Review**: Check for `any` types in adapter interfaces
4. **Integration Test Coverage**: Verify that real-world usage patterns are tested

#### **🛠️ Systematic Review Process**

1. **Identify Adapter Usage**: Find all `adapter.method()` calls in extension code
2. **Check Interface Completeness**: Ensure all used methods are defined in interfaces
3. **Add Defensive Programming**: Implement null-safe operations with proper error handling
4. **Create Integration Tests**: Test actual VSCode API integration scenarios
5. **Add Error Handling Tests**: Test all edge cases and failure modes
6. **Replace `any` Types**: Use proper TypeScript types throughout

#### **📋 Mandatory Test Categories**

For every adapter, ensure tests cover:

- ✅ **Happy Path**: Normal operation with valid inputs
- ✅ **Error Handling**: Invalid inputs (null, undefined, empty strings)
- ✅ **Edge Cases**: Boundary conditions and unusual inputs
- ✅ **Integration Scenarios**: Real-world usage patterns
- ✅ **Type Safety**: Proper TypeScript types, no `any` types
- ✅ **Defensive Programming**: Graceful degradation on failures

### VS Code Extension Testing Limitations

**Critical Insight**: While testing coverage is valuable, VS Code extensions have inherent testing limitations that require different approaches.

#### What Testing Coverage CAN Catch ✅

1. **TypeScript/Compilation Errors**:
    - **Example**: Missing properties in mocks, incorrect types
    - **How**: TypeScript compiler catches these during build
    - **Coverage**: Unit tests with proper mocking

2. **Logic Errors**:
    - **Example**: Incorrect file path construction, wrong method calls
    - **How**: Unit tests with mocked dependencies
    - **Coverage**: High - can test individual functions in isolation

3. **API Contract Violations**:
    - **Example**: Wrong parameter types, missing required properties
    - **How**: Integration tests with real VS Code API adapters
    - **Coverage**: Good - can test service interactions

#### What Testing Coverage CANNOT Easily Catch ❌

1. **VS Code Extension-Specific Behaviors**:
    - **Example**: File explorer focus changes, theme selection prompts
    - **Why**: These are VS Code UI behaviors that happen outside your code
    - **Challenge**: Requires full VS Code environment to reproduce

2. **Timing and Race Conditions**:
    - **Example**: Delays needed for theme switching (25ms)
    - **Why**: Depends on VS Code's internal timing
    - **Challenge**: Hard to mock or predict in tests

3. **VS Code's Automatic Refresh Behavior**:
    - **Example**: When VS Code automatically refreshes vs. when it doesn't
    - **Why**: This is VS Code's internal implementation detail
    - **Challenge**: Not part of your extension's API surface

4. **User Experience Issues**:
    - **Example**: "The explorer view changes to focus on the active editor"
    - **Why**: These are visual/UX behaviors
    - **Challenge**: Requires manual testing or complex UI automation

#### Best Practices for VS Code Extension Testing

1. **Unit test your business logic** ✅ (Core package testing)
2. **Integration test your VS Code API usage** ✅ (Extension package testing)
3. **Manual test user workflows** ✅ (Essential for UX issues)
4. **Monitor for VS Code API changes** ✅ (Stay updated)
5. **Use VS Code's extension development tools** ✅ (Debug in real environment)

#### Testing Strategy for UI/UX Issues

**Problem**: Issues like file explorer focus changes, theme selection prompts, and refresh behavior cannot be easily automated.

**Solution**:

- **Manual Testing Workflows**: Create documented manual testing procedures for UI behaviors
- **User Feedback Integration**: Establish processes to capture and address user-reported UX issues
- **VS Code Extension Development Tools**: Use VS Code's built-in debugging and development tools
- **Real Environment Testing**: Always test in actual VS Code environment, not just mocked tests

**Example Manual Testing Checklist**:

```markdown
## VS Code Extension UI Testing Checklist

### Icon Assignment Workflow

- [ ] Select file → Icon picker shows only file icons
- [ ] Select folder → Icon picker shows only folder icons
- [ ] Assign icon → No file explorer focus changes
- [ ] Assign icon → No theme selection prompts
- [ ] Assign icon → Icons refresh automatically
- [ ] Theme switching → No unwanted side effects

### Extension Installation/Uninstallation

- [ ] Install extension → No errors
- [ ] Uninstall extension → Clean removal
- [ ] Reinstall extension → No conflicts
- [ ] Extension activation → Proper initialization
```

#### Anti-Patterns for VS Code Extension Testing

- **🚫 Over-Reliance on Automated Tests**: Don't assume automated tests catch all issues
- **🚫 Ignoring UI/UX Testing**: Don't skip manual testing of user workflows
- **🚫 Mocking VS Code Internal Behaviors**: Don't try to mock VS Code's internal refresh mechanisms
- **🚫 Ignoring User Feedback**: Don't dismiss user-reported issues as "not testable"

### Architecture Validation Insights

**Problem**: Structure auditor was complaining about adapters being outside shared package, but this was incorrect for the new architecture.

**Solution**:

- **Ignore Outdated Auditor Rules**: The structure auditor may have outdated rules that don't match the new architecture
- **Focus on Functional Validation**: Instead of relying on static analysis, validate that the architecture works functionally
- **Test Real Behavior**: Ensure that the refactored package actually works correctly rather than just passing static checks

## Test Configuration Migration Patterns

### Double Execution Elimination

**Problem**: Test commands were running twice due to conflicting configurations between global `targetDefaults` and PAX script injection.

**Solution**:

- **Pattern Replication Protocol**: When a working solution exists (Project Butler), replicate it exactly rather than trying to improve it
- **Remove Global Conflicts**: Remove `configFile` options from `nx.json` `targetDefaults` to allow PAX script to handle config injection
- **Use Proven Executor**: Use `@nx/vite:test` executor with proper configuration instead of complex `nx:run-commands`
- **Single Execution Verification**: Always use `-s -stream` flags to verify no duplicate test runs before considering a solution complete

### Test Configuration Migration Steps

1. **Copy Working Pattern**: Use the exact `project.json` test target configuration from Project Butler:

    ```json
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": ["^build"]
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": [
        {
          "dependencies": true,
          "target": "test",
          "params": "forward"
        }
      ]
    }
    ```

2. **Remove Extends**: Replace `extends: "test"` and `extends: "test:full"` with explicit executor configuration

3. **Verify Single Execution**: Test all commands with `-s -stream` flags:
    - `{alias} t -s -stream` - Should show single execution
    - `{alias} tf -s -stream` - Should show single execution for each package in dependency chain

4. **PAX Script Integration**: Ensure no conflicting `configFile` options in local packages to allow PAX script to handle config injection

### Configuration Hierarchy Understanding

**Key Principle**: Global configurations can conflict with local overrides. The hierarchy is:

1. Global `targetDefaults` in `nx.json`
2. Local package `project.json` targets
3. PAX script dynamic injection

**Best Practice**: Remove global `targetDefaults` for test targets and let local packages handle their own configuration with PAX script support.

### Anti-Patterns for Test Configuration

- **🚫 Over-Engineering**: Don't use complex executors when simpler ones achieve the same result
- **🚫 Ignoring Working Patterns**: Don't attempt to improve working test configurations without first understanding why they work
- **🚫 Incomplete Verification**: Don't assume test configuration is complete without explicit single-execution verification
- **🚫 Global Configuration Conflicts**: Don't have conflicting `configFile` options in both global `targetDefaults` and local package configurations

## Conclusion

This testing strategy v2 provides a comprehensive framework for testing the confirmed Core/Extension package architecture. It ensures:

- **Clean separation of concerns** between business logic and VSCode integration
- **Comprehensive test coverage** for both core services and extension functionality
- **Consistent testing patterns** across all packages
- **Maintainable test code** with clear organization and documentation
- **Quality assurance** through automated testing and quality gates

By following this strategy, teams can confidently develop and maintain packages that follow the established architecture patterns while ensuring high code quality and reliability.

The confirmed implementations in Ghost Writer and Project Butler demonstrate that this testing strategy is working, maintainable, and scalable for the FocusedUX monorepo.

This implementation guide provides a **complete, failsafe approach** to implementing comprehensive testing for extension packages with **no questions left unanswered**.

## Comprehensive Implementation Guide

### Step-by-Step Extension Package Testing Setup

This guide provides a **failsafe, one-stop-shop** approach to implementing comprehensive testing for extension packages based on the Project Butler pattern.

#### **Step 1: Directory Structure Setup**

```bash
# Create the complete testing directory structure
mkdir -p packages/package-name/ext/__tests__/{functional,isolated-tests,integration-tests,coverage,_out-tsc}
mkdir -p packages/package-name/ext/__tests__/integration-tests/suite
mkdir -p packages/package-name/ext/__tests__/integration-tests/mocked-workspace
```

#### **Step 2: Configuration Files**

**1. Integration Test TypeScript Configuration**

```json
// packages/package-name/ext/__tests__/tsconfig.test.json
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
    "include": ["integration/**/*.ts"]
}
```

**2. VS Code Test Configuration**

```typescript
// packages/package-name/ext/__tests__/.vscode-test.mjs
import { createVscodeTestConfig } from '@fux/vscode-test-cli-config'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default createVscodeTestConfig({
    packageName: 'fux-package-name',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './integration-tests/mocked-workspace',
    files: './_out-tsc/**/*.test.js',
    setupFiles: './_out-tsc/index.js',
})
```

**3. Standard Vitest Configuration**

```typescript
// packages/package-name/ext/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            exclude: ['**/__tests__/integration/**', '**/__tests__/_out-tsc/**'],
        },
    })
)
```

#### **Step 3: Test Setup Files**

**1. Global Test Setup with Helpers**

```typescript
// packages/package-name/ext/__tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import type * as vscode from 'vscode'

// Mock external dependencies
vi.mock('js-yaml', () => ({
    load: vi.fn(),
}))

// Mock vscode globally
vi.mock('vscode', () => ({
    commands: { registerCommand: vi.fn() },
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        createTerminal: vi.fn(),
        activeTextEditor: null,
        activeTerminal: null,
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copy: vi.fn(),
        },
    },
    Uri: { file: vi.fn((path: string) => ({ fsPath: path })) },
    FileType: { Directory: 1, File: 2 },
}))

// Global test lifecycle
beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())
afterEach(() => vi.clearAllMocks())

// Console output configuration
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface ExtensionTestMocks {
    vscode: {
        commands: { registerCommand: ReturnType<typeof vi.fn> }
        window: {
            showInformationMessage: ReturnType<typeof vi.fn>
            showWarningMessage: ReturnType<typeof vi.fn>
            showErrorMessage: ReturnType<typeof vi.fn>
            activeTextEditor: vscode.TextEditor | undefined
            createTerminal: ReturnType<typeof vi.fn>
            activeTerminal: vscode.Terminal | undefined
        }
        workspace: {
            fs: {
                readFile: ReturnType<typeof vi.fn>
                writeFile: ReturnType<typeof vi.fn>
                stat: ReturnType<typeof vi.fn>
                copy: ReturnType<typeof vi.fn>
            }
            workspaceFolders: vscode.WorkspaceFolder[] | undefined
        }
        Uri: { file: ReturnType<typeof vi.fn> }
        FileType: { Directory: vscode.FileType.Directory; File: vscode.FileType.File }
    }
    context: { subscriptions: vscode.Disposable[] }
}

export function setupTestEnvironment(): ExtensionTestMocks {
    const mockTerminal = { sendText: vi.fn(), show: vi.fn() } as any
    const mockTextEditor = { document: { uri: { fsPath: '/test/file.txt' } } } as any
    const mockWorkspaceFolder = { uri: { fsPath: '/test' } } as any

    const vscode = {
        commands: { registerCommand: vi.fn() },
        window: {
            showInformationMessage: vi.fn(),
            showWarningMessage: vi.fn(),
            showErrorMessage: vi.fn(),
            activeTextEditor: mockTextEditor,
            createTerminal: vi.fn().mockReturnValue(mockTerminal),
            activeTerminal: mockTerminal,
        },
        workspace: {
            fs: {
                readFile: vi.fn(),
                writeFile: vi.fn(),
                stat: vi.fn(),
                copy: vi.fn(),
            },
            workspaceFolders: [mockWorkspaceFolder],
        },
        Uri: { file: vi.fn().mockImplementation((path: string) => ({ fsPath: path })) },
        FileType: { Directory: 1, File: 2 },
    }

    const context = { subscriptions: [] }

    return { vscode, context }
}

export function resetAllMocks(mocks: ExtensionTestMocks): void {
    Object.values(mocks.vscode.commands).forEach((mock) => mock.mockReset())
    Object.values(mocks.vscode.window).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.vscode.workspace.fs).forEach((mock) => mock.mockReset())
    mocks.vscode.Uri.file.mockReset()
}

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void {
    mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showWarningMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showErrorMessage.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from('file content'))
    mocks.vscode.workspace.fs.writeFile.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.stat.mockResolvedValue({ type: mocks.vscode.FileType.File })
    mocks.vscode.workspace.fs.copy.mockResolvedValue(undefined)
}

export function createMockExtensionContext(): vscode.ExtensionContext {
    return {
        subscriptions: [],
        workspaceState: {} as any,
        globalState: {} as any,
        extensionPath: '/test/extension',
        globalStoragePath: '/test/global',
        logPath: '/test/log',
        extensionUri: { fsPath: '/test/extension' } as any,
        storageUri: { fsPath: '/test/storage' } as any,
        globalStorageUri: { fsPath: '/test/global' } as any,
        logUri: { fsPath: '/test/log' } as any,
        extensionMode: 1,
        environmentVariableCollection: {} as any,
        secrets: {} as any,
        asAbsolutePath: vi.fn(),
        storagePath: '/test/storage',
        extension: {} as any,
        languageModelAccessInformation: {} as any,
    }
}

export function createMockUri(path: string): vscode.Uri {
    return {
        fsPath: path,
        scheme: 'file',
        authority: '',
        path,
        query: '',
        fragment: '',
        with: vi.fn(),
        toJSON: vi.fn(),
    } as any
}
```

#### **Step 4: Project.json Configuration**

```json
{
    "name": "@fux/package-name-ext",
    "projectType": "application",
    "targets": {
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"]
        },
        "test:full": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": [
                {
                    "dependencies": true,
                    "target": "test",
                    "params": "forward"
                }
            ]
        },
        "test:compile": {
            "executor": "nx:run-commands",
            "outputs": ["{projectRoot}/__tests__/_out-tsc"],
            "options": {
                "commands": ["tsc -p packages/package-name/ext/__tests__/tsconfig.test.json"]
            }
        },
        "test:integration": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": [
                    "powershell -Command \"& {vscode-test --config .vscode-test.mjs --verbose --timeout 20000 --reporter spec 2>&1 | Select-String -NotMatch 'extensionEnabledApiProposals', 'ChatSessionStore', 'update#setState disabled', 'update#ctor', 'Started local extension host', 'Settings Sync'}\""
                ],
                "cwd": "packages/package-name/ext"
            },
            "description": "Run VS Code extension integration tests with detailed output"
        },
        "test:integration:noisy": {
            "executor": "nx:run-commands",
            "dependsOn": ["build", "test:compile"],
            "options": {
                "commands": [
                    "vscode-test --config .vscode-test.mjs --verbose --timeout 20000 --reporter spec"
                ],
                "cwd": "packages/package-name/ext"
            },
            "description": "Run VS Code extension integration tests with full output"
        }
    }
}
```

#### **Step 5: Test Implementation**

**1. Standard Extension Test**

```typescript
// packages/package-name/ext/__tests__/functional/extension.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { activate, deactivate } from '../../src/extension'
import * as vscode from 'vscode'

// Mock the core package
vi.mock('@fux/package-name-core', () => ({
    ServiceName: vi.fn().mockImplementation(() => ({
        methodName: vi.fn(),
    })),
}))

describe('Extension', () => {
    let context: any

    beforeEach(() => {
        vi.clearAllMocks()
        context = { subscriptions: { push: vi.fn() } }
    })

    describe('activate', () => {
        it('should register all commands successfully', () => {
            activate(context as any)
            expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(1)
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-package-name.commandName',
                expect.any(Function)
            )
        })

        it('should add disposables to context subscriptions', () => {
            const mockDisposable = { dispose: vi.fn() }
            vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)
            activate(context as any)
            expect(context.subscriptions.push).toHaveBeenCalledWith(mockDisposable)
        })
    })

    describe('deactivate', () => {
        it('should log deactivation message', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            deactivate()
            expect(consoleSpy).toHaveBeenCalledWith('F-UX: Package Name is now deactivated!')
            consoleSpy.mockRestore()
        })
    })
})
```

**2. Integration Test**

```typescript
// packages/package-name/ext/__tests__/integration/extension.test.ts
import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Integration Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.')

    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands()
        assert.ok(commands.includes('fux-package-name.commandName'))
    })

    test('Should execute command successfully', async () => {
        const result = await vscode.commands.executeCommand('fux-package-name.commandName')
        assert.ok(result)
    })
})
```

#### **Step 6: Verification Commands**

```bash
# Test standard Vitest tests
nx run @fux/package-name-ext:test

# Test entire dependency chain
nx run @fux/package-name-ext:test:full

# Test with coverage (via pax aliases)
pn tc   # → test with coverage for package
pn tfc  # → test:full with coverage for entire dependency chain

# Compile integration tests
nx run @fux/package-name-ext:test:compile

# Run integration tests
nx run @fux/package-name-ext:test:integration

# Test alias integration (if configured)
pn ti  # Should expand to test:integration @fux/package-name-ext
```

### **Critical Success Factors**

1. **✅ Proper Test Separation**: Standard tests and integration tests must be completely separate
2. **✅ Correct Exclude Patterns**: Vitest config must exclude integration tests
3. **✅ Proper Dependencies**: Integration tests depend on `build` and `test:compile`
4. **✅ Correct File Organization**: All test files in `__tests__/` directory
5. **✅ Comprehensive Mocking**: All external dependencies properly mocked
6. **✅ Test Helper Consolidation**: All helpers in `_setup.ts` with clear section headings

### **Common Pitfalls to Avoid**

- **❌ Mixing Test Types**: Don't run integration tests in standard Vitest
- **❌ Missing Exclusions**: Don't forget to exclude `_out-tsc/` in Vitest config
- **❌ Incomplete Mocking**: Don't skip mocking external dependencies
- **❌ Wrong File Locations**: Don't put integration tests outside `__tests__/`
- **❌ Missing Dependencies**: Don't forget `test:compile` dependency for integration tests

This implementation guide provides a **complete, failsafe approach** to implementing comprehensive testing for extension packages with **no questions left unanswered**.
