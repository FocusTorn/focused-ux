# Library Package Testing - AI Agent Instructions

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/Troubleshooting - Tests.md`

---

## 🚀 **QUICK REFERENCE**

**Service Testing**: Always use `createPackageMockBuilder(mocks).serviceMethod().build()`
**Complex Scenarios**: Always use scenario builder for 3+ mock interactions
**File Operations**: Use scenario builder for file system testing
**Error Handling**: Use scenario builder for multi-step error scenarios

## 🎯 **CRITICAL: Mock Strategy Foundation**

**⚠️ MANDATORY FIRST STEP**: Before implementing ANY mocking, read **MOCK_STRATEGY_GENERAL** (`docs/testing/Mock-Strategy_General.md`)

**This document is the FOUNDATION for accurate, consistent, and repeatable mocking across the entire project.**

### **Why Mock-Strategy_General is Critical:**

- **Prevents Manual Mock Creation** - Use library functions instead of reinventing mocks
- **Ensures Complete Node.js Module Coverage** - All standard exports included
- **Provides Consistent Patterns** - Same approach across all packages
- **Avoids Common Pitfalls** - Pre-tested implementations prevent errors
- **Saves Development Time** - No need to debug incomplete mocks

### **Mock Strategy Decision Tree:**

```
Need to mock something?
├─ Is it a Node.js built-in module? → Use Mock-Strategy_General library functions
├─ Is it a complex multi-step scenario? → Use scenario builders from Mock-Strategy_General
├─ Is it a simple single function? → Use standard vi.mocked() approach
└─ Is it package-specific? → Extend Mock-Strategy_General patterns
```

**Rule of Thumb**: If you're manually creating mocks for Node.js modules, you're doing it wrong. Use Mock-Strategy_General first.

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

### **Mock Configuration Error Resolution**

**Quick Reference**: See **TESTING_STRATEGY** for complete guidance on preventing missing export errors in Node.js module mocks.

**Key Points**:

- Use Mock-Strategy_General library functions instead of manual mock creation
- Ensure all mocked Node.js modules include complete export definitions
- Always use library functions first, extend patterns rather than starting from scratch

### **Test Implementation Iteration Pattern**

**Quick Reference**: See **TESTING_STRATEGY** for detailed incremental test development methodology.

**Key Points**:

- Implement tests in sections, running tests after each major section
- Use continuous validation to catch issues early
- Fix issues in isolation before moving to the next section

### **ESM Import Path Requirements**

**Quick Reference**: See **TESTING_STRATEGY** for complete ESM import patterns and **TROUBLESHOOTING_TESTS** for error resolution.

**Key Points**:

- Always use .js extensions for relative imports in test files
- Count directory levels correctly from test file to target module
- Follow ESM import requirements strictly

## 🎯 **MANDATORY: Mock Strategy Decision Matrix**

| Scenario Type                 | Use Approach                        | Example                                                       |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| **Node.js Built-in Modules**  | ✅ **ALWAYS Mock-Strategy_General** | `setupLibTestEnvironment()` from `@fux/mock-strategy/lib`     |
| **Service Method Testing**    | ✅ **ALWAYS scenario builder**      | `createPackageMockBuilder(mocks).serviceMethod().build()`     |
| **Complex Multi-Step Setups** | ✅ **ALWAYS scenario builder**      | Multiple chained scenario builder calls                       |
| **File System Operations**    | ✅ **RECOMMENDED scenario builder** | `createPackageMockBuilder(mocks).fileExists('/path').build()` |
| **Single Function Mock**      | ✅ **Standard mock**                | `mocks.customService.mockReturnValue('value')`                |

**Rule of Thumb**: If you need more than 2 mocks working together → Use Scenario Builder
**Critical Rule**: If you're mocking Node.js built-ins → Use Mock-Strategy_General library functions

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

### **Service Testing Pattern**

```typescript
// ✅ CORRECT - Use scenario builder for service testing
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'

it('should handle complex service scenarios', async () => {
    const scenario = createPackageMockBuilder(mocks)
        .serviceMethod('loadConfig')
        .withSuccessResponse(validConfig)
        .withErrorHandling('file-not-found')
        .build()

    // Test implementation
})

// ❌ INCORRECT - Direct mocking for complex scenarios
it('should handle complex service scenarios', async () => {
    configLoader.loadConfig.mockResolvedValue(validConfig)
    configLoader.loadConfig.mockRejectedValueOnce(error)
    // Complex setup continues...
})
```

### **Comprehensive Service Test Coverage**

**MANDATORY**: Service classes require comprehensive test coverage across all functional areas and scenarios.

#### **Test Organization Structure**

```typescript
// __tests__/functional-tests/services/ConfigLoader.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers.js'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'
import { ConfigLoader } from '../../../src/services/ConfigLoader.service.js'

describe('ConfigLoader', () => {
    // SETUP ----------------->>
    let mocks: ReturnType<typeof setupPackageTestEnvironment>
    let configLoader: any
    let tempDir: string
    let tempConfigPath: string

    beforeEach(() => {
        mocks = setupPackageTestEnvironment()
        configLoader = ConfigLoader.getInstance()
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.yaml')
    })

    afterEach(() => {
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        configLoader.clearCache()
        clearAllCaches()
    })
    //----------------------------------------------------<<

    describe('loadConfig', () => {
        // SETUP ----------------->>
        const validConfig = { nxPackages: { 'my-app': { build: 'nx build my-app' } } }
        //----------------------------------------------------<<

        it('should load valid configuration successfully', async () => {
            // Use scenario builder for complex service testing
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withValidYaml(validConfig)
                .build()

            const result = await configLoader.loadConfig(tempConfigPath)
            expect(result).toEqual(validConfig)
        })

        it('should handle file not found error', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('file-not-found')
                .build()

            await expect(configLoader.loadConfig('/nonexistent.yaml')).rejects.toThrow(
                'File not found'
            )
        })
    })

    describe('reloadConfig', () => {
        // SETUP ----------------->>
        const initialConfig = { nxPackages: { app1: { build: 'nx build app1' } } }
        const modifiedConfig = { nxPackages: { app1: { build: 'nx build app1 --prod' } } }
        //----------------------------------------------------<<

        it('should reload configuration when file is modified', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .reloadConfig()
                .withFileModificationDetection()
                .withInitialConfig(initialConfig)
                .withModifiedConfig(modifiedConfig)
                .build()

            const result = await configLoader.reloadConfig(tempConfigPath)
            expect(result).toEqual(modifiedConfig)
        })
    })

    describe('error handling', () => {
        it('should handle YAML parsing errors', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('yaml-parse-error')
                .build()

            await expect(configLoader.loadConfig(tempConfigPath)).rejects.toThrow('Invalid YAML')
        })

        it('should handle permission denied errors', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('permission-denied')
                .build()

            await expect(configLoader.loadConfig('/protected/file.yaml')).rejects.toThrow(
                'Permission denied'
            )
        })
    })

    describe('configuration validation', () => {
        it('should validate required nxPackages section', async () => {
            const invalidConfig = { otherSection: {} }

            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withInvalidConfig(invalidConfig)
                .build()

            const result = await configLoader.loadConfig(tempConfigPath)
            expect(configLoader.getValidationErrors()).toContain('nxPackages section is required')
        })
    })

    describe('cache management', () => {
        it('should clear cache successfully', () => {
            configLoader.clearCache()
            expect(configLoader.getCachedConfig()).toBeNull()
        })

        it('should clear all caches', () => {
            clearAllCaches()
            expect(configLoader.getCachedConfig()).toBeNull()
        })
    })

    describe('concurrent access', () => {
        it('should handle concurrent loads safely', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withConcurrentAccess()
                .build()

            const promises = [
                configLoader.loadConfig(tempConfigPath),
                configLoader.loadConfig(tempConfigPath),
                configLoader.loadConfig(tempConfigPath),
            ]

            const results = await Promise.all(promises)
            expect(results).toHaveLength(3)
            expect(results.every((result) => result !== null)).toBe(true)
        })
    })

    describe('edge cases', () => {
        it('should handle empty configuration file', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withEmptyConfig()
                .build()

            const result = await configLoader.loadConfig(tempConfigPath)
            expect(result).toEqual({})
        })

        it('should handle malformed file paths', async () => {
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('invalid-path')
                .build()

            await expect(configLoader.loadConfig('invalid://path')).rejects.toThrow(
                'Invalid file path'
            )
        })
    })
})
```

#### **Test Scenario Categories**

**MANDATORY**: Every service test suite must include these categories:

1. **Success Scenarios** - Normal operation with valid inputs
2. **Error Scenarios** - File system errors, parsing errors, validation errors
3. **Edge Cases** - Empty files, malformed data, boundary conditions
4. **Concurrent Access** - Multiple simultaneous operations
5. **Cache Management** - Cache clearing, invalidation, persistence
6. **Configuration Validation** - Required fields, data types, constraints

#### **Service Test Coverage Checklist**

- [ ] **All public methods tested** - Every public method has at least one test
- [ ] **Success paths covered** - Normal operation scenarios tested
- [ ] **Error paths covered** - All error conditions tested
- [ ] **Edge cases covered** - Boundary conditions and unusual inputs
- [ ] **Concurrent access tested** - Multiple simultaneous operations
- [ ] **Cache behavior tested** - Cache management and invalidation
- [ ] **Validation tested** - Input validation and error handling
- [ ] **Integration scenarios** - Complex multi-step workflows

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

### **Test File Folding Markers**

**MANDATORY**: All test files must use folding markers for better organization and readability.

#### **Folding Marker Types**

- **`//>` and `//<`** - Wrap individual `it` blocks and `beforeEach`/`afterEach` functions
- **`// SETUP ----------------->>` and `//----------------------------------------------------<<`** - Wrap main setup constants and variables

#### **Folding Marker Usage**

```typescript
// __tests__/functional-tests/services/ConfigLoader.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupPackageTestEnvironment, resetPackageMocks } from '../../__mocks__/helpers.js'
import { createPackageMockBuilder } from '../../__mocks__/mock-scenario-builder.js'
import { ConfigLoader } from '../../../src/services/ConfigLoader.service.js'

describe('ConfigLoader', () => {
    // SETUP ----------------->>
    let mocks: ReturnType<typeof setupPackageTestEnvironment>
    let configLoader: any
    let tempDir: string
    let tempConfigPath: string

    beforeEach(() => {
        //>
        mocks = setupPackageTestEnvironment()
        configLoader = ConfigLoader.getInstance()
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.yaml')
    }) //<

    afterEach(() => {
        //>
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        configLoader.clearCache()
        clearAllCaches()
    }) //<
    //----------------------------------------------------<<

    describe('loadConfig', () => {
        it('should load valid configuration successfully', async () => {
            //>
            const validConfig = { nxPackages: { 'my-app': { build: 'nx build my-app' } } }

            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withValidYaml(validConfig)
                .build()

            const result = await configLoader.loadConfig(tempConfigPath)
            expect(result).toEqual(validConfig)
        }) //<

        it('should handle file not found error', async () => {
            //>
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('file-not-found')
                .build()

            await expect(configLoader.loadConfig('/nonexistent.yaml')).rejects.toThrow(
                'File not found'
            )
        }) //<
    })

    describe('error handling', () => {
        it('should handle YAML parsing errors', async () => {
            //>
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('yaml-parse-error')
                .build()

            await expect(configLoader.loadConfig(tempConfigPath)).rejects.toThrow('Invalid YAML')
        }) //<

        it('should handle permission denied errors', async () => {
            //>
            const scenario = createPackageMockBuilder(mocks)
                .configLoader()
                .loadConfig()
                .withErrorHandling('permission-denied')
                .build()

            await expect(configLoader.loadConfig('/protected/file.yaml')).rejects.toThrow(
                'Permission denied'
            )
        }) //<
    })
})
```

#### **Folding Marker Rules**

- **`it` blocks**: Always wrapped with `//>` and `//<` at the end of the line, preceded by a space
- **`beforeEach`/`afterEach`**: Always wrapped with `//>` and `//<` at the end of the line, preceded by a space
- **Setup sections**: Wrapped with `// SETUP ----------------->>` and `//----------------------------------------------------<<` for main setup constants and variables only
- **`describe` blocks**: NO folding markers - they are not wrapped
- **Test-specific constants**: Go inside individual test cases without setup markers
- **Space requirement**: All folding markers must be preceded by a space

#### **Benefits of Folding Markers**

- **Better organization** - Clear visual separation of test sections
- **Improved readability** - Easy to navigate large test files
- **Consistent structure** - Standardized test file organization
- **Faster development** - Quick access to specific test sections

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
- **Direct service mocking for complex scenarios** - Use scenario builder instead
- **Multiple mockResolvedValueOnce chains** - Use scenario builder fluent API
- **Complex mock setup without scenario builder** - Violates testing strategy
- **Manual Node.js module mock creation** - Use Mock-Strategy_General library functions
- **Incomplete Node.js module mocks** - Use complete library mocks with all exports
- **Implementing all tests at once** - Use incremental test development

### **✅ ALWAYS DO:**

- **Mock external dependencies** - HTTP clients, databases, file systems
- **Test pure functions** - Focus on business logic without side effects
- **Use Mock-Strategy_General library functions** - For all Node.js built-in module mocking
- **Use scenario builders for service testing** - Follows documented patterns
- **Use scenario builders for 3+ mock interactions** - Maintains consistency
- **Reference scenario builder examples** - Ensures proper implementation
- **Reset mocks between tests** - Use `beforeEach` with `resetPackageMocks()`
- **Use ESM imports with .js extensions** - `import * as module from './module.js'`
- **Test error scenarios** - Both success and failure paths
- **Use deterministic data** - Consistent mock data for predictable tests
- **Implement tests incrementally** - Run tests after each major section
- **Use complete Node.js module mocks** - Include all standard exports

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

- [ ] **Mock-Strategy_General library used for Node.js built-in modules** - Never manually create Node.js module mocks
- [ ] `globals.ts` uses `@fux/mock-strategy/lib` functions
- [ ] `helpers.ts` extends `LibTestMocks` from Mock-Strategy_General
- [ ] `mock-scenario-builder.ts` implements fluent API patterns from Mock-Strategy_General
- [ ] **Service tests use scenario builder pattern**
- [ ] **Complex scenarios use scenario builder instead of direct mocking**
- [ ] All tests use proper mock reset patterns
- [ ] Scenario builders used for complex setups
- [ ] **No manual Node.js module mock creation** - All Node.js modules use library functions

### **Test Implementation**

- [ ] All external dependencies mocked
- [ ] Pure function testing focus
- [ ] Error scenarios tested
- [ ] CLI testing uses proper `process.argv` cleanup
- [ ] Coverage tests target specific uncovered lines
- [ ] **Test files use folding markers** (`//>` `//<` for it blocks and beforeEach/afterEach, `// SETUP ----------------->>` and `//----------------------------------------------------<<` for setup sections)
- [ ] **Setup sections properly wrapped** with `// SETUP ----------------->>` and `//----------------------------------------------------<<`

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
