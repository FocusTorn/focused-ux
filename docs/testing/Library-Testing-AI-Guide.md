# Library Package Testing - AI Agent Instructions

## **REFERENCE FILES**

### **Documentation References**

- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`
- **SOP_DOCS**: `docs/_SOP.md`
- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_LIB**: `docs/testing/Mock-Strategy-Lib.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General.md`

---

## 🎯 **MANDATORY: Library Package Testing Requirements**

### **Package Classification**

- **Path**: `libs/{name}/` or `libs/shared/`
- **Type**: Library package
- **Module System**: ESM (ES Modules)
- **Build Target**: `@nx/esbuild:esbuild` with `bundle: false, format: ['esm']`
- **Dependencies**: Node.js modules, external packages, **NO VSCode imports**

### **Testing Strategy**

- **Framework**: Vitest only (no VSCode integration tests)
- **Focus**: Pure functions, utility logic, external dependency integration
- **Mock Strategy**: Use `@fux/mock-strategy/lib` functions
- **⚠️ IMPORTANT**: Always check **MOCK_STRATEGY_GENERAL** for the current list of available mock strategy functions, as they evolve based on multi-package mocking needs

### **ESM Import Path Pattern**

- **Pattern**: `{relative-pathing}/__mocks__/helpers.js` where `{relative-pathing}` accounts for directory depth
- **Example**: From `__tests__/functional-tests/utils/` use `../../__mocks__/helpers.js`
- **Rule**: Always use `.js` extension for ESM imports, count directory levels from test file to `__mocks__/`

### **ESM TypeScript Compliance**

- **❌ ANTI-PATTERN**: Never use dynamic imports (`await import()`) in test functions
- **✅ CORRECT**: Use static ESM imports with `vi.mock()` at module level for external dependencies
- **Benefit**: Maintains type safety, ESM compliance, and prevents async complexity in tests

### **Mock State Management**

- **⚠️ IMPORTANT**: See **TESTING_STRATEGY** for complete mock state management patterns
- **Key Rule**: Use `vi.clearAllMocks()` before specific assertions when testing constructor behavior or call count verification
- **Anti-Pattern**: Don't assume mock call counts are isolated per test when using shared beforeEach setup

---

## 📁 **MANDATORY: Directory Structure**

```
libs/{package-name}/
├── __tests__/                          # Test directory
│   ├── __mocks__/                      # Mock strategy components
│   │   ├── globals.ts                  # Global test environment
│   │   ├── helpers.ts                  # Test utilities & mock creators
│   │   └── mock-scenario-builder.ts    # Composable mock scenarios
│   ├── functional-tests/               # Main integration tests
│   │   ├── utils/                      # Utility function tests
│   │   ├── integrations/               # Integration tests
│   │   └── edge-cases/                 # Edge case tests
│   ├── coverage-tests/                 # Coverage-specific tests
│   │   └── {module-name}.test-cov.ts   # Coverage test files
│   └── isolated-tests/                 # Isolated scenario tests
├── src/                                # Source code
│   ├── index.ts                        # Main export
│   └── {module}.ts                     # Module files
├── package.json                        # Package configuration
├── project.json                        # Nx project configuration
├── vitest.config.ts                    # Functional test config
├── vitest.coverage.config.ts           # Coverage test config
└── tsconfig.json                       # TypeScript configuration
```

---

## ⚙️ **MANDATORY: Package Configuration**

### **⚠️ CRITICAL: Preserve Existing Structure**

When modifying existing packages:

- **NEVER remove organizational comments, dividers, or folding markers**
- **ONLY modify what needs to be changed**
- **ADD new targets without removing existing ones**
- **PRESERVE existing target configurations unless specifically updating them**
- **MAINTAIN existing organizational structure and comments**

### **package.json Requirements**

```json
{
    "name": "@fux/{package-name}",
    "type": "module",
    "main": "dist/index.js",
    "dependencies": {
        // Only Node.js and external packages
    },
    "devDependencies": {
        "@fux/mock-strategy": "workspace:*",
        "@types/node": "^24.0.10",
        "@vitest/coverage-v8": "^3.2.4",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4"
    }
}
```

### **project.json Targets**

**⚠️ IMPORTANT**: When modifying existing `project.json` files:

- **PRESERVE all existing targets and their configurations**
- **ADD new targets (build:dev, build:prod) alongside existing ones**
- **MAINTAIN existing organizational comments and structure**
- **ONLY modify specific target options when explicitly updating them**

```json
{
    "targets": {
        // Existing targets remain unchanged
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": false,
                "format": ["esm"],
                "external": ["vscode"]
            }
        },
        // ADD new targets without removing existing ones
        "build:dev": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": false,
                "format": ["esm"],
                "external": ["vscode"],
                "sourcemap": true,
                "minify": false,
                "treeShaking": false
            }
        },
        "build:prod": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": true,
                "format": ["esm"],
                "external": ["vscode"],
                "sourcemap": false,
                "minify": true,
                "treeShaking": true
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"],
            "options": {
                "configFile": "libs/{package-name}/vitest.config.ts",
                "reportsDirectory": "__tests__/_reports/functional"
            }
        },
        "test:coverage-tests": {
            "executor": "@nx/vite:test",
            "dependsOn": ["^build"],
            "options": {
                "configFile": "libs/{package-name}/vitest.coverage.config.ts",
                "reportsDirectory": "__tests__/_reports/coverage"
            }
        }
    }
}
```

---

## 🧪 **MANDATORY: Test Configuration Files**

### **vitest.config.ts**

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                '__tests__/functional-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
        },
    })
)
```

### **vitest.coverage.config.ts**

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../vitest.coverage.base'

export default mergeConfig(
    mergeConfig(functionalConfig, baseCoverageConfig),
    defineConfig({
        test: {
            include: ['__tests__/**/*.{test,test-cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        },
    })
)
```

---

## 🎭 **MANDATORY: Mock Strategy Implementation**

### **1. Global Test Environment (`__mocks__/globals.ts`)**

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'

// Setup library-specific test environment
beforeAll(() => {
    setupLibTestEnvironment()
})

afterAll(() => {
    resetLibMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})

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
```

### **2. Test Helpers (`__mocks__/helpers.ts`)**

```typescript
import { vi } from 'vitest'
import { setupLibTestEnvironment, resetLibMocks, LibTestMocks } from '@fux/mock-strategy/lib'

// Extend with package-specific mock interfaces
export interface PackageTestMocks extends LibTestMocks {
    // Add package-specific mocks here
    customService: ReturnType<typeof vi.fn>
    utilities: {
        processData: ReturnType<typeof vi.fn>
    }
}

export function setupPackageTestEnvironment(): PackageTestMocks {
    const baseMocks = setupLibTestEnvironment()

    return {
        ...baseMocks,
        customService: vi.fn(),
        utilities: {
            processData: vi.fn(),
        },
    }
}

export function resetPackageMocks(mocks: PackageTestMocks): void {
    resetLibMocks(mocks)
    mocks.customService.mockReset()
    mocks.utilities.processData.mockReset()
}
```

### **3. Mock Scenario Builder (`__mocks__/mock-scenario-builder.ts`)**

```typescript
import { vi } from 'vitest'
import { PackageTestMocks, setupPackageTestEnvironment } from './helpers'
import {
    setupLibFileSystemMocks,
    setupLibPathMocks,
    setupLibProcessMocks,
    setupLibChildProcessMocks,
    LibMockBuilder,
} from '@fux/mock-strategy/lib'

// Package-specific scenario interfaces
export interface PackageScenarioOptions {
    input: string
    expectedOutput: string
    shouldError?: boolean
    errorMessage?: string
}

// Package-specific scenario functions
export function setupPackageSuccessScenario(
    mocks: PackageTestMocks,
    options: PackageScenarioOptions
): void {
    mocks.customService.mockResolvedValue(options.expectedOutput)
    mocks.utilities.processData.mockReturnValue(options.expectedOutput)
}

export function setupPackageErrorScenario(
    mocks: PackageTestMocks,
    options: PackageScenarioOptions
): void {
    mocks.customService.mockRejectedValue(new Error(options.errorMessage || 'Test error'))
    mocks.utilities.processData.mockImplementation(() => {
        throw new Error(options.errorMessage || 'Test error')
    })
}

// Enhanced Package Mock Builder
export class PackageMockBuilder {
    constructor(private mocks: PackageTestMocks) {}

    success(options: PackageScenarioOptions): PackageMockBuilder {
        setupPackageSuccessScenario(this.mocks, options)
        return this
    }

    error(options: PackageScenarioOptions): PackageMockBuilder {
        setupPackageErrorScenario(this.mocks, options)
        return this
    }

    // File system scenarios
    fileExists(path: string, exists: boolean = true): PackageMockBuilder {
        this.mocks.fileSystem.existsSync.mockImplementation((p: string) =>
            p === path ? exists : false
        )
        return this
    }

    fileContent(path: string, content: string): PackageMockBuilder {
        this.mocks.fileSystem.readFileSync.mockImplementation((p: string) =>
            p === path ? content : '{}'
        )
        return this
    }

    // Process scenarios
    processArgv(argv: string[]): PackageMockBuilder {
        this.mocks.process.argv = argv
        return this
    }

    processEnv(env: Record<string, string>): PackageMockBuilder {
        this.mocks.process.env = env
        return this
    }

    build(): PackageTestMocks {
        return this.mocks
    }
}

export function createPackageMockBuilder(mocks?: PackageTestMocks): PackageMockBuilder {
    const testMocks = mocks || setupPackageTestEnvironment()
    return new PackageMockBuilder(testMocks)
}
```

---

## 📝 **MANDATORY: Test Implementation Patterns**

### **⚠️ CRITICAL: ESM Import Paths**

**MANDATORY**: In ESM-based library packages, all relative imports in test files MUST include the `.js` extension:

```typescript
// ✅ CORRECT - ESM imports with .js extension and correct relative pathing
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers.js'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'
import { MyUtility } from '../../../src/utils/MyUtility.js'

// ❌ INCORRECT - Missing .js extension causes module resolution errors
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder'
import { MyUtility } from '../../../src/utils/MyUtility'
```

**Why**: ESM requires explicit file extensions for relative imports. Without `.js` extensions, tests will fail with "Cannot find module" errors.

### **Basic Test Structure**

```typescript
// __tests__/functional-tests/utils/MyUtility.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers.js'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'
import { MyUtility } from '../../../src/utils/MyUtility.js'

describe('MyUtility', () => {
    let mocks: ReturnType<typeof setupPackageTestEnvironment>

    beforeEach(() => {
        mocks = setupPackageTestEnvironment()
        resetPackageMocks(mocks)
    })

    it('should process data correctly', () => {
        // Use scenario builder for complex setups
        const scenario = createPackageMockBuilder(mocks)
            .success({ input: 'test', expectedOutput: 'processed' })
            .build()

        const result = MyUtility.processData('test')
        expect(result).toBe('processed')
    })

    it('should handle errors gracefully', () => {
        // Use scenario builder for error scenarios
        const scenario = createPackageMockBuilder(mocks)
            .error({
                input: 'test',
                expectedOutput: '',
                shouldError: true,
                errorMessage: 'Processing failed',
            })
            .build()

        expect(() => MyUtility.processData('test')).toThrow('Processing failed')
    })
})
```

### **CLI Tool Testing Pattern**

```typescript
// __tests__/functional-tests/cli/CLI.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers.js'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'

describe('CLI Tool', () => {
    let mocks: ReturnType<typeof setupPackageTestEnvironment>

    beforeEach(() => {
        mocks = setupPackageTestEnvironment()
        resetPackageMocks(mocks)
    })

    it('should handle CLI arguments correctly', () => {
        const originalArgv = process.argv

        try {
            // Modify process.argv for test
            process.argv = ['node', 'cli.js', 'test-command', '--flag']

            // Execute function under test
            const result = CLI.main()

            // Assert expected behavior
            expect(result).toBe(0)
        } finally {
            // MANDATORY: Restore original process.argv
            process.argv = originalArgv
        }
    })
})
```

### **Coverage Test Pattern**

```typescript
// __tests__/coverage-tests/core.test-cov.ts
import { describe, it, expect } from 'vitest'
import { MyModule } from '../../src/core/MyModule.js'

describe('MyModule Coverage', () => {
    it('should cover error handling path', () => {
        // Test only the uncovered lines identified by coverage report
        expect(() => MyModule.processInvalidInput(null)).toThrow('Invalid input')
    })

    it('should cover edge case boundary', () => {
        // Test boundary conditions that weren't covered
        expect(MyModule.calculateBoundary(0)).toBe(0)
        expect(MyModule.calculateBoundary(Number.MAX_VALUE)).toBe(Number.MAX_VALUE)
    })
})
```

---

## 🚫 **MANDATORY: Anti-Patterns to Avoid**

### **❌ NEVER DO:**

- **Mock VSCode APIs** - Library packages don't use VSCode
- **Use VSCode value imports** - Only type imports allowed
- **Skip build before tests** - Always build first
- **Use `any` types** - Use proper TypeScript types
- **Dynamic imports in tests** - Use static imports with `vi.mocked()`
- **Simplify mocks to make tests pass** - Mock should reflect real behavior
- **Test external dependency behavior** - Test your package logic, not external deps
- **Use real external APIs in tests** - Always mock external dependencies
- **Missing .js extensions in ESM imports** - Causes "Cannot find module" errors

### **✅ ALWAYS DO:**

- **Mock external dependencies** - HTTP clients, databases, file systems
- **Test pure functions** - Focus on business logic without side effects
- **Use scenario builders for complex setups** - 3+ mocks working together
- **Reset mocks between tests** - Use `beforeEach` with `resetPackageMocks()`
- **Use ESM imports with .js extensions** - `import * as module from './module.js'`
- **Test error scenarios** - Both success and failure paths
- **Use deterministic data** - Consistent mock data for predictable tests

---

## 🎯 **MANDATORY: Mock Strategy Decision Matrix**

| Scenario Type            | Use Approach                        | Example                                                                   |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| **Shell Detection**      | ✅ **ALWAYS scenario builder**      | `createPackageMockBuilder(mocks).shellDetection('powershell').build()`    |
| **File Operations**      | ✅ **RECOMMENDED scenario builder** | `createPackageMockBuilder(mocks).fileExists('/path').build()`             |
| **Command Execution**    | ✅ **RECOMMENDED scenario builder** | `createPackageMockBuilder(mocks).processSuccess({command: 'nx'}).build()` |
| **CLI Testing**          | ✅ **Complex multi-step setups**    | Multiple scenario builder calls                                           |
| **Config Loading**       | ✅ **Business logic testing**       | `createPackageMockBuilder(mocks).configExists({path, content}).build()`   |
| **Single Function Mock** | ✅ **Standard mock**                | `mocks.customService.mockReturnValue('value')`                            |
| **Node.js Built-ins**    | ✅ **Global mocks**                 | Already handled in `globals.ts`                                           |

**Rule of Thumb**: If you need more than 2 mocks working together → Use Scenario Builder

---

## 📊 **MANDATORY: Test Target Usage**

```bash
# Fast functional testing for development
pae {alias} t

# Functional testing with coverage reporting
pae {alias} t -c

# Complete testing including coverage tests (100% coverage goal)
pae {alias} tc

# Build before testing (MANDATORY)
pae {alias} b
```

---

## 🏗️ **MANDATORY: Implementation Checklist**

### **Package Setup**

- [ ] Package classified as library (`libs/`)
- [ ] ESM module system (`"type": "module"`)
- [ ] No VSCode dependencies
- [ ] Uses `@nx/esbuild:esbuild` executor
- [ ] Includes `@fux/mock-strategy` dependency
- [ ] **PRESERVES existing organizational structure and comments**
- [ ] **ONLY modifies necessary configurations**
- [ ] **ADDS new targets without removing existing ones**

### **Test Structure**

- [ ] `__tests__/` directory exists
- [ ] `__mocks__/` directory with three components
- [ ] `functional-tests/` directory organized
- [ ] `coverage-tests/` directory for coverage tests
- [ ] `isolated-tests/` directory for specific scenarios

### **Mock Strategy**

- [ ] `globals.ts` uses `@fux/mock-strategy/lib`
- [ ] `helpers.ts` extends `LibTestMocks`
- [ ] `mock-scenario-builder.ts` implements fluent API
- [ ] All tests use proper mock reset patterns
- [ ] Scenario builders used for complex setups

### **Test Implementation**

- [ ] All external dependencies mocked
- [ ] Pure function testing focus
- [ ] Error scenarios tested
- [ ] CLI testing uses proper `process.argv` cleanup
- [ ] Coverage tests target specific uncovered lines

### **Quality Gates**

- [ ] All tests pass
- [ ] No anti-patterns detected
- [ ] Mock strategy follows documented approach
- [ ] Test organization follows established patterns
- [ ] Documentation alignment verified

---

## 🎯 **SUCCESS CRITERIA**

A library package test suite is successful when:

1. **✅ Perfect Alignment** - Follows all documented patterns
2. **✅ Zero Anti-Patterns** - Clean, maintainable mock structure
3. **✅ Comprehensive Coverage** - Tests all functionality and edge cases
4. **✅ Scenario Builder Usage** - Complex mocking uses fluent API
5. **✅ External Dependency Mocking** - All external APIs properly mocked
6. **✅ Test Isolation** - Tests don't interfere with each other
7. **✅ CLI Testing Compliance** - Proper process management for CLI tools

**Status: ✅ READY FOR PRODUCTION**

---

## 🔧 **BUILD CONFIGURATION ENHANCEMENTS**

### **Development vs Production Builds**

For libraries that need different build configurations for development and production:

```json
{
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": false,
                "format": ["esm"],
                "external": ["vscode"],
                "sourcemap": true,
                "minify": false
            }
        },
        "build:dev": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": false,
                "format": ["esm"],
                "external": ["vscode"],
                "sourcemap": true,
                "minify": false,
                "treeShaking": false
            }
        },
        "build:prod": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "libs/{package-name}/src/index.ts",
                "outputPath": "libs/{package-name}/dist",
                "bundle": true,
                "format": ["esm"],
                "external": ["vscode"],
                "sourcemap": false,
                "minify": true,
                "treeShaking": true
            }
        }
    }
}
```

### **When to Use Different Build Configurations**

- **Standard Library** (`build`): Use for most libraries consumed by other packages
- **Development Build** (`build:dev`): Use for debugging and development with source maps
- **Production Build** (`build:prod`): Use for libraries that need to be bundled for distribution

**Status: ✅ READY FOR PRODUCTION**
