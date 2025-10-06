# Library Package Mock Strategy

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

## Overview

Library packages (`libs/shared/` and `libs/{name}/`) are shared utility packages that provide reusable functionality across the monorepo. They require specialized mocking strategies to handle Node.js modules, external dependencies, and utility functions while maintaining pure business logic.

## Architecture Characteristics

- **Package Type**: Library (`lib`)
- **Module System**: ESM (ES Modules)
- **Dependencies**: Node.js modules, external packages, no VSCode imports
- **Build Target**: Library with `@nx/esbuild:esbuild`
- **Testing Focus**: Pure functions, utility logic, external dependency integration

## Mock Strategy Components

### 1. `__mocks__/globals.ts` - Global Test Environment

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupLibraryTestEnvironment, resetLibraryMocks } from '@fux/mock-strategy'

// Setup library-specific test environment
beforeAll(() => {
    setupLibraryTestEnvironment()
})

afterAll(() => {
    resetLibraryMocks()
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
```

### 2. `__mocks__/helpers.ts` - Library-Specific Utilities

```typescript
import { vi } from 'vitest'
import { createMockNodeModules, createMockExternalDeps } from '@fux/mock-strategy'

export const createLibraryTestHelpers = () => {
    const mockNodeModules = createMockNodeModules()
    const mockExternalDeps = createMockExternalDeps()

    return {
        mockNodeModules,
        mockExternalDeps,
        createMockFileSystem: () => ({
            readFileSync: vi.fn(),
            writeFileSync: vi.fn(),
            existsSync: vi.fn(),
            mkdirSync: vi.fn(),
            readdirSync: vi.fn(),
            statSync: vi.fn(),
            unlinkSync: vi.fn(),
            rmdirSync: vi.fn(),
        }),
        createMockPath: () => ({
            join: vi.fn(),
            resolve: vi.fn(),
            dirname: vi.fn(),
            basename: vi.fn(),
            extname: vi.fn(),
            relative: vi.fn(),
            isAbsolute: vi.fn(),
        }),
        createMockProcess: () => ({
            argv: ['node', 'script.js'],
            env: {},
            platform: 'linux',
            cwd: vi.fn(),
            exit: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
        }),
        createMockHttpClient: () => ({
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            request: vi.fn(),
        }),
        createMockDatabase: () => ({
            connect: vi.fn(),
            query: vi.fn(),
            close: vi.fn(),
            transaction: vi.fn(),
        }),
    }
}

export const mockNodeFS = {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
}

export const mockNodePath = {
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    extname: vi.fn(),
    relative: vi.fn(),
    isAbsolute: vi.fn(),
}

export const mockNodeProcess = {
    argv: ['node', 'script.js'],
    env: {},
    platform: 'linux',
    cwd: vi.fn(),
    exit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
}

export const mockExternalAPIs = {
    fetch: vi.fn(),
    axios: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
    lodash: {
        get: vi.fn(),
        set: vi.fn(),
        merge: vi.fn(),
        cloneDeep: vi.fn(),
    },
}
```

### 3. `__mocks__/mock-scenario-builder.ts` - Library Scenarios

```typescript
import { vi } from 'vitest'
import { createLibraryTestHelpers } from './helpers'

export class LibraryMockScenarioBuilder {
    private helpers = createLibraryTestHelpers()
    private mocks: Record<string, any> = {}

    constructor() {
        this.reset()
    }

    reset() {
        this.mocks = {}
        vi.clearAllMocks()
        return this
    }

    withFileSystem(files: Record<string, string> = {}) {
        this.mocks.fileSystem = {
            ...this.helpers.createMockFileSystem(),
            readFileSync: vi.fn().mockImplementation((path: string) => {
                return files[path] || 'mock file content'
            }),
            existsSync: vi.fn().mockImplementation((path: string) => {
                return path in files
            }),
        }
        return this
    }

    withPathOperations(operations: Record<string, any> = {}) {
        this.mocks.path = {
            ...this.helpers.createMockPath(),
            ...operations,
        }
        return this
    }

    withProcessEnvironment(env: Record<string, string> = {}) {
        this.mocks.process = {
            ...this.helpers.createMockProcess(),
            env: { ...process.env, ...env },
        }
        return this
    }

    withHttpClient(responses: Record<string, any> = {}) {
        this.mocks.httpClient = {
            ...this.helpers.createMockHttpClient(),
            get: vi.fn().mockImplementation((url: string) => {
                return Promise.resolve(responses[url] || { data: 'mock response' })
            }),
            post: vi.fn().mockImplementation((url: string, data: any) => {
                return Promise.resolve(responses[url] || { data: 'mock response' })
            }),
        }
        return this
    }

    withDatabase(queries: Record<string, any> = {}) {
        this.mocks.database = {
            ...this.helpers.createMockDatabase(),
            query: vi.fn().mockImplementation((sql: string) => {
                return Promise.resolve(queries[sql] || [])
            }),
        }
        return this
    }

    withExternalDependencies(deps: Record<string, any> = {}) {
        this.mocks.externalDeps = {
            ...this.helpers.mockExternalDeps,
            ...deps,
        }
        return this
    }

    withNodeModules(modules: Record<string, any> = {}) {
        this.mocks.nodeModules = {
            ...this.helpers.mockNodeModules,
            ...modules,
        }
        return this
    }

    withMockData(data: Record<string, any> = {}) {
        this.mocks.data = data
        return this
    }

    withErrorScenario(error: Error) {
        this.mocks.error = error
        return this
    }

    build() {
        return {
            ...this.mocks,
            helpers: this.helpers,
        }
    }
}

export const createLibraryScenario = () => new LibraryMockScenarioBuilder()
```

## Migration Guide

### Option 1: Migrate to Mock Strategy Library (Recommended)

**Step 1**: Install the mock strategy library

```bash
# Already available in the workspace
```

**Step 2**: Update your `__mocks__/globals.ts`

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupLibraryTestEnvironment, resetLibraryMocks } from '@fux/mock-strategy'

beforeAll(() => {
    setupLibraryTestEnvironment()
})

afterAll(() => {
    resetLibraryMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})
```

**Step 3**: Update your `__mocks__/helpers.ts`

```typescript
import { createLibraryTestHelpers } from '@fux/mock-strategy'

// Import base helpers and extend with package-specific mocks
export const { mockNodeModules, mockExternalDeps, createMockFileSystem } =
    createLibraryTestHelpers()

// Add your package-specific mock helpers here
export const createPackageSpecificMock = () => {
    // Your package-specific mocking logic
}
```

**Step 4**: Update your `__mocks__/mock-scenario-builder.ts`

```typescript
import { createLibraryScenario } from '@fux/mock-strategy'

// Import base scenario builder and extend with package-specific scenarios
export const createPackageScenario = () => {
    const baseScenario = createLibraryScenario()

    return baseScenario.withPackageSpecificMocks().withCustomNodeModules()
}
```

### Option 2: Legacy Manual Setup

If you prefer to maintain your existing setup, ensure you have:

1. **Node.js Module Mocking**: Mock all Node.js modules used by your library
2. **External Dependency Mocking**: Mock external packages and APIs
3. **File System Mocking**: Mock file operations and path manipulations
4. **Process Mocking**: Mock process environment and system interactions

## Testing Patterns

### Pure Function Testing

```typescript
import { describe, it, expect } from 'vitest'
import { createLibraryScenario } from '../__mocks__/mock-scenario-builder'
import { myUtilityFunction } from '../src/utils'

describe('My Utility Function', () => {
    it('should process data correctly', () => {
        const scenario = createLibraryScenario()
            .withMockData({ input: 'test', expected: 'processed' })
            .build()

        const result = myUtilityFunction(scenario.data.input)

        expect(result).toBe(scenario.data.expected)
    })
})
```

### File System Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createLibraryScenario } from '../__mocks__/mock-scenario-builder'

describe('File Operations', () => {
    it('should read and process files', () => {
        const scenario = createLibraryScenario()
            .withFileSystem({
                '/path/to/file.txt': 'file content',
                '/path/to/config.json': '{"key": "value"}',
            })
            .build()

        const fs = scenario.fileSystem
        const content = fs.readFileSync('/path/to/file.txt')

        expect(content).toBe('file content')
        expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.txt')
    })
})
```

### External API Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createLibraryScenario } from '../__mocks__/mock-scenario-builder'

describe('External API Integration', () => {
    it('should handle API responses', async () => {
        const scenario = createLibraryScenario()
            .withHttpClient({
                'https://api.example.com/data': { data: { id: 1, name: 'test' } },
            })
            .build()

        const httpClient = scenario.httpClient
        const response = await httpClient.get('https://api.example.com/data')

        expect(response.data).toEqual({ id: 1, name: 'test' })
    })
})
```

### Error Handling Testing

```typescript
import { describe, it, expect } from 'vitest'
import { createLibraryScenario } from '../__mocks__/mock-scenario-builder'

describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
        const scenario = createLibraryScenario().withErrorScenario(new Error('Mock error')).build()

        expect(() => {
            throw scenario.error
        }).toThrow('Mock error')
    })
})
```

## Integration with Other Packages

Library packages should:

- **Provide pure utility functions** for other packages to use
- **Mock external dependencies** to ensure reliable testing
- **Test integration points** with other packages
- **Use dependency injection** to make functions testable

## Library Package-Specific Examples

### **PAE (Project Alias Expander) Library Examples**

```typescript
// libs/project-alias-expander/__tests__/__mocks__/helpers.ts
export interface PaeTestMocks extends LibTestMocks {
    stripJsonComments: ReturnType<typeof vi.fn>
    url: {
        fileURLToPath: ReturnType<typeof vi.fn>
    }
}

// libs/project-alias-expander/__tests__/functional-tests/cli.test.ts
describe('CLI', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)

        // File-level mock setup used by multiple tests
        vi.mocked(runNx).mockImplementation((args) => {
            if (process.env.PAE_ECHO === '1') {
                console.log(`NX_CALL -> ${args.join(' ')}`)
            }
            return 0
        })
    })
})

// Using PAE specific scenarios
const builder = await createPaeMockBuilder(mocks)
await builder
    .configExists({ configPath: '/config.json', configContent: validConfig })
    .commandSuccess({ command: 'nx', args: ['build'], exitCode: 0 })
    .build()
```

### **Shell Output Control for Library Packages**

```typescript
// Use conditional output functions in your library code
conditionalWriteHost('Refreshing [PWSH] PAE aliases...', 'Yellow')
conditionalEcho('Aliases refreshed!')

// PowerShell script example
Write-Host "Refreshing [PWSH] PAE aliases..." -ForegroundColor Yellow
Write-Host "[PWSH] PAE aliases refreshed!" -ForegroundColor Green

// Bash script example
echo "Refreshing [GitBash] PAE aliases..."
echo "[GitBash] PAE aliases refreshed!"
```

### **Library Package-Specific Anti-Patterns**

- **❌ Mock Core Package Functionality**: Don't mock core package functionality in library tests
- **❌ Use Real External APIs in Tests**: Don't use real external APIs in tests
- **❌ Test External Dependency Behavior**: Don't test external dependency behavior instead of library logic

## Example Library Test Structure

```
libs/my-library/__tests__/
├── __mocks__/
│   ├── globals.ts              # Global test setup
│   ├── helpers.ts              # Library-specific helpers
│   └── mock-scenario-builder.ts # Library scenarios
├── functional-tests/
│   ├── utils/
│   │   ├── data-processing.test.ts # Data processing tests
│   │   └── validation.test.ts     # Validation tests
│   ├── integrations/
│   │   ├── api-client.test.ts    # API client tests
│   │   └── file-operations.test.ts # File operation tests
│   └── edge-cases/
│       ├── error-handling.test.ts # Error scenario tests
│       └── boundary-conditions.test.ts # Edge case tests
└── isolated-tests/
    └── adhoc.test.ts           # Temporary/ad-hoc tests
```

This structure ensures comprehensive testing of library functionality while maintaining clear separation between library-specific and external dependency logic.

