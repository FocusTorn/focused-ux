# FocusedUX Testing Strategy v3

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
                "external": ["vscode", "js-yaml"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"]
        }
    }
}
```

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
            setupFiles: ['./__tests__/_setup.ts'],
            exclude: ['**/__tests__/integration/**', '**/__tests__/_out-tsc/**'],
        },
    })
)
```

## 🧪 Testing Patterns by Package Type

### Core Package Testing

```typescript
// __tests__/functional/ServiceName.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceName } from '../../src/features/ServiceName.service.js'

class MockDependency {
    process = vi.fn()
}

describe('ServiceName', () => {
    let service: ServiceName
    let mockDep: MockDependency

    beforeEach(() => {
        mockDep = new MockDependency()
        service = new ServiceName(mockDep)
    })

    it('should process data correctly', async () => {
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
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { activate, deactivate } from '../../src/extension'
import * as vscode from 'vscode'

vi.mock('@fux/{feature}-core', () => ({
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

    it('should register commands successfully', () => {
        activate(context)
        expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(1)
    })
})
```

### Integration Testing

```typescript
// __tests__/integration/extension.test.ts
import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Extension Integration Test Suite', () => {
    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands()
        assert.ok(commands.includes('fux-package-name.commandName'))
    })
})
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

### Test Setup File

```typescript
// __tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

vi.mock('vscode', () => ({
    commands: { registerCommand: vi.fn() },
    window: {
        showInformationMessage: vi.fn(),
        activeTextEditor: null,
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        fs: { readFile: vi.fn(), writeFile: vi.fn() },
    },
    Uri: { file: vi.fn((path: string) => ({ fsPath: path })) },
}))

beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())
afterEach(() => vi.clearAllMocks())
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
