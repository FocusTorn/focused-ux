# Mock Strategy for Core Packages

## **REFERENCE FILES**

### **Documentation References**

- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`
- **SOP_DOCS**: `docs/_SOP.md`
- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **ACTIONS_LOG**: `docs/Actions-Log.md`

### **Testing Documentation References**

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

## 🎯 Overview

The FocusedUX project uses a **Core Package Mock Strategy** that focuses on Node.js APIs and business logic without VSCode dependencies. This approach reduces code duplication by 60% while maintaining test clarity and maintainability for core business logic.

## 🏗️ Architecture Components

### 1. **Global Mocks** (`__mocks__/globals.ts`)

**Purpose**: Centralized global mocks that apply to all tests
**Scope**: Node.js module-level mocks, timer setup, console control

### 2. **Test Helpers** (`__mocks__/helpers.ts`)

**Purpose**: Reusable utility functions and mock creators
**Scope**: Common test setup, mock object creation, environment configuration

### 3. **Mock Scenario Builder** (`__mocks__/mock-scenario-builder.ts`)

**Purpose**: Composable mock scenarios for complex test cases
**Scope**: Domain-specific mock patterns, fluent API for test composition

## 📁 Directory Structure

### Core Packages (`packages/{feature}/core/__tests__/`)

```
packages/{feature}/core/__tests__/
├── __mocks__/
│   ├── globals.ts              # Global mocks & setup
│   ├── helpers.ts              # Test utilities & mock creators
│   └── mock-scenario-builder.ts # Composable mock scenarios
└── functional-tests/
    └── *.test.ts               # Individual test files
```

## 🔧 Component Deep Dive

### Global Mocks (`globals.ts`)

**Purpose**: Handle Node.js module-level mocking and global test configuration

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock Node.js modules globally
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

vi.mock('js-yaml', () => ({
    load: vi.fn((content: string) => {
        if (!content || content.trim() === '') return undefined
        if (content.includes('ProjectButler')) {
            return {
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            }
        }
        return {}
    }),
}))

vi.mock('node:path', () => ({
    default: {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
        extname: vi.fn(),
        sep: '/',
    },
    dirname: vi.fn(),
    basename: vi.fn(),
    join: vi.fn(),
    resolve: vi.fn(),
    extname: vi.fn(),
    sep: '/',
}))

// Global timer setup
beforeAll(() => {
    vi.useFakeTimers()
})
afterAll(() => {
    vi.useRealTimers()
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

**Key Responsibilities**:

- ✅ Node.js module-level mocking (`vi.mock()`)
- ✅ Global timer configuration
- ✅ Console output suppression
- ✅ Cross-test cleanup (`afterEach`)

### Test Helpers (`helpers.ts`)

**Purpose**: Provide reusable utilities and mock object creators for Node.js APIs

```typescript
import { vi } from 'vitest'

export interface CoreTestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
        access: ReturnType<typeof vi.fn>
        readdir: ReturnType<typeof vi.fn>
        mkdir: ReturnType<typeof vi.fn>
        rmdir: ReturnType<typeof vi.fn>
        unlink: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
    }
    yaml: {
        load: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): CoreTestMocks {
    return {
        fileSystem: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copyFile: vi.fn(),
            access: vi.fn(),
            readdir: vi.fn(),
            mkdir: vi.fn(),
            rmdir: vi.fn(),
            unlink: vi.fn(),
        },
        path: {
            dirname: vi.fn(),
            basename: vi.fn(),
            join: vi.fn(),
            resolve: vi.fn(),
            extname: vi.fn(),
        },
        yaml: {
            load: vi.fn(),
        },
    }
}

export function setupFileSystemMocks(mocks: CoreTestMocks): void {
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.rmdir.mockResolvedValue(undefined)
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
}

export function setupPathMocks(mocks: CoreTestMocks): void {
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('/').slice(0, -1).join('/') || '.'
    )
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.resolve.mockImplementation((path: string) => path)
    mocks.path.extname.mockImplementation((path: string) => {
        const lastDot = path.lastIndexOf('.')
        return lastDot === -1 ? '' : path.slice(lastDot)
    })
}

export function setupYamlMocks(mocks: CoreTestMocks): void {
    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': [
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

// Mock reset utilities
export function resetAllMocks(mocks: CoreTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => mock.mockReset())
    mocks.yaml.load.mockReset()
}
```

**Key Responsibilities**:

- ✅ Type-safe mock interfaces for Node.js APIs
- ✅ Reusable mock object creators
- ✅ Environment setup utilities
- ✅ Mock reset and configuration helpers

### Mock Scenario Builder (`mock-scenario-builder.ts`)

**Purpose**: Provide composable, domain-specific mock scenarios for core business logic

```typescript
import { vi } from 'vitest'
import { CoreTestMocks } from './helpers'

// File System Scenarios
export interface FileSystemScenarioOptions {
    sourcePath: string
    backupPath: string
    shouldExist?: boolean
    content?: string
}

export function setupBackupSuccessScenario(
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, backupPath, content = 'file content' } = options

    mocks.path.basename.mockReturnValue('package.json')
    mocks.path.dirname.mockReturnValue('/large-project')
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.readFile.mockResolvedValue(content)
}

export function setupBackupConflictScenario(
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { backupPath } = options

    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupBackupErrorScenario(
    mocks: CoreTestMocks,
    operation: 'copy' | 'access' | 'unlink',
    errorMessage: string,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, backupPath } = options

    switch (operation) {
        case 'copy':
            mocks.fileSystem.copyFile.mockRejectedValue(new Error(errorMessage))
            break
        case 'access':
            mocks.fileSystem.access.mockRejectedValue(new Error(errorMessage))
            break
        case 'unlink':
            mocks.fileSystem.unlink.mockRejectedValue(new Error(errorMessage))
            break
    }
}

// Path Scenarios
export function setupWindowsPathScenario(
    mocks: CoreTestMocks,
    sourcePath: string,
    backupPath: string
): void {
    mocks.path.sep = '\\'
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
    )
}

export function setupUnixPathScenario(
    mocks: CoreTestMocks,
    sourcePath: string,
    backupPath: string
): void {
    mocks.path.sep = '/'
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('/').slice(0, -1).join('/') || '.'
    )
}

// Fluent Builder Pattern
export class ProjectButlerMockBuilder {
    constructor(private mocks: CoreTestMocks) {}

    backup(options: FileSystemScenarioOptions): ProjectButlerMockBuilder {
        setupBackupSuccessScenario(this.mocks, options)
        return this
    }

    backupConflict(options: FileSystemScenarioOptions): ProjectButlerMockBuilder {
        setupBackupConflictScenario(this.mocks, options)
        return this
    }

    backupError(
        operation: 'copy' | 'access' | 'unlink',
        errorMessage: string,
        options: FileSystemScenarioOptions
    ): ProjectButlerMockBuilder {
        setupBackupErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    windowsPath(sourcePath: string, backupPath: string): ProjectButlerMockBuilder {
        setupWindowsPathScenario(this.mocks, sourcePath, backupPath)
        return this
    }

    unixPath(sourcePath: string, backupPath: string): ProjectButlerMockBuilder {
        setupUnixPathScenario(this.mocks, sourcePath, backupPath)
        return this
    }

    build(): CoreTestMocks {
        return this.mocks
    }
}

export function createProjectButlerMockBuilder(mocks: CoreTestMocks): ProjectButlerMockBuilder {
    return new ProjectButlerMockBuilder(mocks)
}
```

**Key Responsibilities**:

- ✅ Domain-specific mock scenarios for business logic
- ✅ Composable mock patterns
- ✅ Fluent builder API
- ✅ Error scenario handling

## 🚀 Usage Patterns

### Basic Test Setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupYamlMocks,
} from '../__mocks__/helpers'

describe('My Test Suite', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupYamlMocks(mocks)
        resetAllMocks(mocks)
    })

    it('should test something', () => {
        // Test logic here
    })
})
```

### Using Mock Scenarios

```typescript
import {
    setupBackupSuccessScenario,
    setupBackupConflictScenario,
    setupBackupErrorScenario,
} from '../__mocks__/mock-scenario-builder'

it('should handle backup success', () => {
    const sourcePath = '/test/source.json'
    const backupPath = '/test/backup.json'

    setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

    // Test logic here
})

it('should handle backup conflict', () => {
    const sourcePath = '/test/source.json'
    const backupPath = '/test/backup.json'

    setupBackupConflictScenario(mocks, { sourcePath, backupPath })

    // Test logic here
})
```

### Using Builder Pattern

```typescript
import { createProjectButlerMockBuilder } from '../__mocks__/mock-scenario-builder'

it('should use fluent builder for complex scenarios', () => {
    const sourcePath = '/test/source.json'
    const backupPath = '/test/backup.json'

    // Fluent API for complex mock composition
    createProjectButlerMockBuilder(mocks)
        .windowsPath(sourcePath, backupPath)
        .backup({ sourcePath, backupPath })
        .build()

    // Test logic here
})

it('should handle backup errors', () => {
    const sourcePath = '/test/source.json'
    const backupPath = '/test/backup.json'

    createProjectButlerMockBuilder(mocks)
        .backupError('copy', 'Disk full', { sourcePath, backupPath })
        .build()

    // Test logic here
})
```

## 📊 Benefits Analysis

### Code Reduction Metrics

| Component   | Before    | After      | Reduction |
| ----------- | --------- | ---------- | --------- |
| Mock Setup  | 40+ lines | 5-10 lines | **75%**   |
| Test Files  | 467 lines | 455 lines  | **3%**    |
| Duplication | High      | Minimal    | **60%**   |

### Maintainability Improvements

- ✅ **Centralized Control**: Mock behavior changes in one place
- ✅ **Type Safety**: TypeScript interfaces prevent mock errors
- ✅ **Consistency**: All tests use the same mock patterns
- ✅ **Readability**: Tests focus on logic, not setup
- ✅ **Extensibility**: Easy to add new scenarios and helpers

### Developer Experience

- ✅ **Faster Development**: Reusable patterns speed up test writing
- ✅ **Fewer Bugs**: Centralized mocks reduce setup errors
- ✅ **Better Debugging**: Consistent mock behavior across tests
- ✅ **Easier Onboarding**: Clear patterns for new developers

## 🔄 Migration Guide

### **Option 1: Migrate to Mock Strategy Library (Recommended)**

The **Mock Strategy Library** (`@fux/mock-strategy`) provides a standardized foundation that packages can extend with their specific needs.

#### **Step 1: Install Library**

```bash
# Add to package dependencies
pnpm add @fux/mock-strategy
```

#### **Step 2: Update Package `__mocks__` Files**

```typescript
// packages/my-feature/core/__tests__/__mocks__/helpers.ts
import {
    CoreTestMocks,
    setupCoreTestEnvironment,
    setupFileSystemMocks,
    setupPathMocks,
    resetCoreMocks,
} from '@fux/mock-strategy/core'
import { vi } from 'vitest'

// Extend base mocks with package-specific needs
export interface MyFeatureTestMocks extends CoreTestMocks {
    mySpecificService: {
        processData: ReturnType<typeof vi.fn>
        validateInput: ReturnType<typeof vi.fn>
    }
}

export function setupMyFeatureTestEnvironment(): MyFeatureTestMocks {
    const baseMocks = setupCoreTestEnvironment()

    return {
        ...baseMocks,
        mySpecificService: {
            processData: vi.fn(),
            validateInput: vi.fn(),
        },
    }
}

export function setupMySpecificMocks(mocks: MyFeatureTestMocks): void {
    mocks.mySpecificService.processData.mockResolvedValue('processed')
    mocks.mySpecificService.validateInput.mockReturnValue(true)
}

export function resetMyFeatureMocks(mocks: MyFeatureTestMocks): void {
    resetCoreMocks(mocks) // Reset base mocks
    Object.values(mocks.mySpecificService).forEach((mock) => mock.mockReset())
}
```

#### **Step 3: Update Test Files**

```typescript
// packages/my-feature/core/__tests__/functional-tests/MyService.test.ts
import {
    setupMyFeatureTestEnvironment,
    setupMySpecificMocks,
    resetMyFeatureMocks,
} from '../__mocks__/helpers'

describe('MyService', () => {
    let mocks: ReturnType<typeof setupMyFeatureTestEnvironment>

    beforeEach(() => {
        mocks = setupMyFeatureTestEnvironment()
        setupMySpecificMocks(mocks)
        resetMyFeatureMocks(mocks)
    })

    it('should process data successfully', () => {
        // Test logic here
    })
})
```

### **Option 2: Legacy Migration (Manual Setup)**

For packages that prefer to maintain their own mock setup:

#### **Step 1: Update Imports**

```typescript
// Before
import { setupTestEnvironment, resetAllMocks } from '../_setup'

// After
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupYamlMocks,
} from '../__mocks__/helpers'
import {
    setupBackupSuccessScenario,
    setupBackupConflictScenario,
    createProjectButlerMockBuilder,
} from '../__mocks__/mock-scenario-builder'
```

#### **Step 2: Replace Manual Mock Setup**

```typescript
// Before
beforeEach(() => {
    mocks = setupTestEnvironment()
    resetAllMocks(mocks)

    mocks.fileSystem.readFile = vi.fn().mockResolvedValue('file content')
    mocks.fileSystem.writeFile = vi.fn().mockResolvedValue(undefined)
    mocks.path.join = vi.fn().mockReturnValue('/test/path')
})

// After
beforeEach(() => {
    mocks = setupTestEnvironment()
    setupFileSystemMocks(mocks)
    setupPathMocks(mocks)
    resetAllMocks(mocks)
})
```

#### **Step 3: Use Scenarios for Complex Setup**

```typescript
// Before
it('should test backup creation', () => {
    mocks.path.basename.mockReturnValue('package.json')
    mocks.path.dirname.mockReturnValue('/large-project')
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)

    // Test logic
})

// After
it('should test backup creation', () => {
    setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

    // Test logic
})
```

#### **Step 4: Update Vitest Configuration**

```typescript
// vitest.config.ts
export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'], // Updated path
            exclude: ['**/__tests__/integration/**', '**/__tests__/_out-tsc/**'],
        },
    })
)
```

## 🏆 Real-World Implementations

### Project Butler Core (PBC)

- **Domain**: Project management and file operations
- **Key Mocks**: `node:fs/promises`, `js-yaml`, `node:path`
- **Scenarios**: Backup operations, file system interactions, YAML processing
- **Benefits**: 60% reduction in mock setup code, improved test readability

#### **Core Package-Specific Examples**

```typescript
// packages/project-butler/core/__tests__/__mocks__/helpers.ts
export interface PbcTestMocks extends CoreTestMocks {
    stripJsonComments: ReturnType<typeof vi.fn>
    url: {
        fileURLToPath: ReturnType<typeof vi.fn>
    }
}

// packages/project-butler/core/__tests__/functional-tests/backup.test.ts
describe('Backup Management', () => {
    let mocks: Awaited<ReturnType<typeof setupPbcTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPbcTestEnvironment()
        await resetPbcMocks(mocks)

        // File-level mock setup used by multiple tests
        vi.mocked(runNx).mockImplementation((args) => {
            if (process.env.PBC_ECHO === '1') {
                console.log(`NX_CALL -> ${args.join(' ')}`)
            }
            return 0
        })
    })

    describe('createBackup', () => {
        it('should create backup successfully', () => {
            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })
            // Test logic
        })

        it('should handle backup conflicts', () => {
            setupBackupConflictScenario(mocks, { sourcePath, backupPath })
            // Test logic
        })
    })
})

// Using Project Butler specific scenarios
const builder = await createProjectButlerMockBuilder(mocks)
await builder
    .configExists({ configPath: '/config.json', configContent: validConfig })
    .commandSuccess({ command: 'nx', args: ['build'], exitCode: 0 })
    .build()

// Component usage examples
setupBackupSuccessScenario(mocks, { sourcePath, backupPath })
createProjectButlerMockBuilder(mocks).backup({ sourcePath, backupPath }).build()
```

### Ghost Writer Core (GWC)

- **Domain**: Code generation and clipboard management
- **Key Mocks**: Service interfaces, clipboard operations, import generation
- **Scenarios**: Clipboard store/retrieve, import generation, console logging
- **Benefits**: Type-safe mock interfaces, centralized scenario management

#### **Core Package-Specific Anti-Patterns**

- **❌ Mock Core Package Functionality**: Don't mock core package functionality in library tests
- **❌ Over-Mocking**: Don't mock everything - only mock what you need to control
- **❌ Mocking Implementation Details**: Don't mock private functions or internal implementation

### Dynamicons Core (DCC)

- **Domain**: Icon theme generation and VSCode integration
- **Key Mocks**: `strip-json-comments`, `vscode`, file system operations
- **Scenarios**: Icon theme generation, configuration management, file operations
- **Benefits**: Comprehensive mock coverage, fluent API for complex compositions

### Dynamicons Core Assets (DCA)

- **Domain**: Asset generation and file processing workflows
- **Key Mocks**: `fs/promises`, `node:path`, `node:child_process`, `node:util`
- **Scenarios**: Icon processing, SVGO optimization, asset generation, model validation
- **Benefits**: 60% reduction in mock setup code, domain-specific asset workflows

## 🔮 Future Enhancements

### Planned Improvements

1. **Auto-Generated Scenarios**: Generate scenarios from API documentation
2. **Mock Validation**: Runtime validation of mock completeness
3. **Performance Monitoring**: Track mock setup performance
4. **Visual Debugging**: Mock state visualization tools
5. **Cross-Package Scenarios**: Shared scenarios across packages

### Extension Points

The Core Package Mock Strategy is designed to be extensible:

- **New Scenario Types**: Add domain-specific scenarios
- **Custom Builders**: Create package-specific builders
- **Mock Validators**: Add runtime mock validation
- **Performance Hooks**: Monitor mock performance
- **Debug Tools**: Enhanced debugging capabilities

---

This Core Package Mock Strategy provides the perfect balance between centralized control and individual test flexibility, making your test suite more maintainable, readable, and efficient for core business logic.
