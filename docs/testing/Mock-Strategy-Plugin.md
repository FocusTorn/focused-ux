# Plugin Package Mock Strategy

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

Plugin packages (`libs/plugins/{name}/`) are specialized packages that extend Nx functionality with custom generators, executors, and schematics. They require unique mocking strategies to handle Nx plugin APIs, generator execution, and workspace integration.

## Architecture Characteristics

- **Package Type**: Plugin (`plugin`)
- **Module System**: ESM (ES Modules)
- **Dependencies**: Nx APIs, workspace configuration, Node.js modules
- **Build Target**: Library with `@nx/esbuild:esbuild`
- **Testing Focus**: Generator execution, executor functionality, workspace integration

## Mock Strategy Components

### 1. `__mocks__/globals.ts` - Global Test Environment

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupPluginTestEnvironment, resetPluginMocks } from '@fux/mock-strategy'

// Setup plugin-specific test environment
beforeAll(() => {
    setupPluginTestEnvironment()
})

afterAll(() => {
    resetPluginMocks()
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

### 2. `__mocks__/helpers.ts` - Plugin-Specific Utilities

```typescript
import { vi } from 'vitest'
import { createMockNxAPI, createMockWorkspace } from '@fux/mock-strategy'

export const createPluginTestHelpers = () => {
    const mockNx = createMockNxAPI()
    const mockWorkspace = createMockWorkspace()

    return {
        mockNx,
        mockWorkspace,
        createMockGenerator: (name: string, schema: any = {}) => ({
            name,
            description: `Mock ${name} generator`,
            schema,
            implementation: vi.fn(),
        }),
        createMockExecutor: (name: string, options: any = {}) => ({
            name,
            description: `Mock ${name} executor`,
            options,
            implementation: vi.fn(),
        }),
        createMockTree: () => ({
            root: '/mock/workspace',
            read: vi.fn(),
            write: vi.fn(),
            exists: vi.fn(),
            delete: vi.fn(),
            rename: vi.fn(),
            listDir: vi.fn(),
            children: vi.fn(),
            visit: vi.fn(),
        }),
        createMockProjectConfiguration: (name: string, config: any = {}) => ({
            name,
            root: `apps/${name}`,
            sourceRoot: `apps/${name}/src`,
            projectType: 'application',
            targets: {},
            tags: [],
            ...config,
        }),
    }
}

export const mockNxGenerators = {
    generateFiles: vi.fn(),
    readProjectConfiguration: vi.fn(),
    updateProjectConfiguration: vi.fn(),
    addDependenciesToPackageJson: vi.fn(),
    installPackagesTask: vi.fn(),
    formatFiles: vi.fn(),
}

export const mockNxExecutors = {
    runExecutor: vi.fn(),
    readTargetOptions: vi.fn(),
    parseTargetString: vi.fn(),
    targetOptions: vi.fn(),
}

export const mockNxWorkspace = {
    getWorkspacePath: vi.fn(),
    readWorkspaceConfiguration: vi.fn(),
    updateWorkspaceConfiguration: vi.fn(),
    getProjectConfiguration: vi.fn(),
    getProjects: vi.fn(),
}

export const mockNxTree = {
    read: vi.fn(),
    write: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
    rename: vi.fn(),
    listDir: vi.fn(),
    children: vi.fn(),
    visit: vi.fn(),
}
```

### 3. `__mocks__/mock-scenario-builder.ts` - Plugin Scenarios

```typescript
import { vi } from 'vitest'
import { createPluginTestHelpers } from './helpers'

export class PluginMockScenarioBuilder {
    private helpers = createPluginTestHelpers()
    private mocks: Record<string, any> = {}

    constructor() {
        this.reset()
    }

    reset() {
        this.mocks = {}
        vi.clearAllMocks()
        return this
    }

    withNxAPI(api: Partial<any> = {}) {
        this.mocks.nx = { ...this.helpers.mockNx, ...api }
        return this
    }

    withWorkspace(workspace: Partial<any> = {}) {
        this.mocks.workspace = { ...this.helpers.mockWorkspace, ...workspace }
        return this
    }

    withTree(tree: Partial<any> = {}) {
        this.mocks.tree = { ...this.helpers.createMockTree(), ...tree }
        return this
    }

    withProjectConfiguration(projectName: string, config: any = {}) {
        this.mocks.projectConfig = this.helpers.createMockProjectConfiguration(projectName, config)
        return this
    }

    withGenerator(name: string, schema: any = {}) {
        this.mocks.generator = this.helpers.createMockGenerator(name, schema)
        return this
    }

    withExecutor(name: string, options: any = {}) {
        this.mocks.executor = this.helpers.createMockExecutor(name, options)
        return this
    }

    withWorkspaceConfiguration(config: any = {}) {
        this.mocks.workspaceConfig = {
            version: 2,
            projects: {},
            generators: {},
            executors: {},
            ...config,
        }
        return this
    }

    withFileSystem(files: Record<string, string> = {}) {
        this.mocks.fileSystem = files
        return this
    }

    withPackageJson(packageJson: any = {}) {
        this.mocks.packageJson = {
            name: 'mock-workspace',
            version: '1.0.0',
            dependencies: {},
            devDependencies: {},
            ...packageJson,
        }
        return this
    }

    build() {
        return {
            ...this.mocks,
            helpers: this.helpers,
        }
    }
}

export const createPluginScenario = () => new PluginMockScenarioBuilder()
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
import { setupPluginTestEnvironment, resetPluginMocks } from '@fux/mock-strategy'

beforeAll(() => {
    setupPluginTestEnvironment()
})

afterAll(() => {
    resetPluginMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})
```

**Step 3**: Update your `__mocks__/helpers.ts`

```typescript
import { createPluginTestHelpers } from '@fux/mock-strategy'

// Import base helpers and extend with package-specific mocks
export const { mockNx, mockWorkspace, createMockGenerator } = createPluginTestHelpers()

// Add your package-specific mock helpers here
export const createPackageSpecificMock = () => {
    // Your package-specific mocking logic
}
```

**Step 4**: Update your `__mocks__/mock-scenario-builder.ts`

```typescript
import { createPluginScenario } from '@fux/mock-strategy'

// Import base scenario builder and extend with package-specific scenarios
export const createPackageScenario = () => {
    const baseScenario = createPluginScenario()

    return baseScenario.withPackageSpecificMocks().withCustomNxAPI()
}
```

### Option 2: Legacy Manual Setup

If you prefer to maintain your existing setup, ensure you have:

1. **Nx API Mocking**: Mock all Nx APIs used by your plugin
2. **Workspace Mocking**: Mock workspace configuration and project management
3. **Tree Mocking**: Mock file system operations and tree manipulation
4. **Generator/Executor Mocking**: Mock generator and executor execution

## Mock Strategy Decision Guidelines

### When to Use Mock Strategy Library Functions

Use the library functions for:

- **Standard Nx API mocking** (generators, executors, workspace)
- **Tree manipulation** (file operations, project configuration)
- **Common plugin patterns** (generator execution, executor implementation)
- **Base test environment setup**

### When to Use Package `__mocks__` Files

Use package-specific mocks for:

- **Package-specific Nx APIs** not covered by the library
- **Custom plugin behaviors** unique to your package
- **Integration with specific workspace configurations**
- **Package-specific generator/executor logic**

### When to Use File-Level Mocks

Use file-level mocks for:

- **Single test file requirements** that don't need global setup
- **Temporary mocking** for specific test scenarios
- **Isolated functionality testing** that doesn't affect other tests

### When to Use Inline Mocks

Use inline mocks for:

- **Simple one-off mocks** in individual tests
- **Test-specific data** that doesn't need reusability
- **Quick prototyping** before moving to more structured approaches

## Testing Patterns

### Generator Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createPluginScenario } from '../__mocks__/mock-scenario-builder'

describe('My Generator', () => {
    it('should generate files correctly', async () => {
        const scenario = createPluginScenario()
            .withTree()
            .withGenerator('my-generator', { name: 'string' })
            .withFileSystem({ 'apps/my-app/src/main.ts': 'console.log("hello")' })
            .build()

        const generator = scenario.generator
        const tree = scenario.tree

        // Mock the generator implementation
        generator.implementation.mockImplementation((tree, options) => {
            tree.write('apps/my-app/src/main.ts', 'console.log("generated")')
        })

        await generator.implementation(tree, { name: 'my-app' })

        expect(tree.write).toHaveBeenCalledWith(
            'apps/my-app/src/main.ts',
            'console.log("generated")'
        )
    })
})
```

### Executor Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createPluginScenario } from '../__mocks__/mock-scenario-builder'

describe('My Executor', () => {
    it('should execute successfully', async () => {
        const scenario = createPluginScenario()
            .withExecutor('my-executor', { target: 'string' })
            .withProjectConfiguration('my-app', { targets: { build: { executor: 'my-executor' } } })
            .build()

        const executor = scenario.executor
        const projectConfig = scenario.projectConfig

        // Mock the executor implementation
        executor.implementation.mockResolvedValue({ success: true })

        const result = await executor.implementation({ target: 'my-app' }, projectConfig)

        expect(result).toEqual({ success: true })
    })
})
```

### Workspace Integration Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createPluginScenario } from '../__mocks__/mock-scenario-builder'

describe('Workspace Integration', () => {
    it('should read workspace configuration', () => {
        const scenario = createPluginScenario()
            .withWorkspaceConfiguration({
                projects: {
                    'my-app': { root: 'apps/my-app', projectType: 'application' },
                },
            })
            .build()

        const workspaceConfig = scenario.workspaceConfig
        const projectConfig = workspaceConfig.projects['my-app']

        expect(projectConfig.root).toBe('apps/my-app')
        expect(projectConfig.projectType).toBe('application')
    })
})
```

## Best Practices

1. **Mock Nx APIs Consistently**: Use the same mocking patterns across all plugin tests
2. **Test Generator Output**: Verify that generators produce the expected files and configurations
3. **Test Executor Execution**: Test both successful and error scenarios for executors
4. **Mock File System Operations**: Use tree mocks to test file operations without affecting the real file system
5. **Test Workspace Integration**: Verify that plugins integrate correctly with workspace configuration
6. **Test Error Scenarios**: Mock Nx API failures and test error handling
7. **Isolate Plugin Logic**: Mock Nx APIs to focus on plugin-specific logic

## Common Anti-Patterns

❌ **Don't**: Mock Nx APIs inconsistently across tests
❌ **Don't**: Skip testing generator file output
❌ **Don't**: Skip testing executor error scenarios
❌ **Don't**: Use real file system operations in tests
❌ **Don't**: Forget to mock async Nx operations
❌ **Don't**: Test Nx API behavior instead of plugin logic
❌ **Don't**: Mock core package functionality in plugin tests

## Integration with Workspace

Plugin packages should:

- **Integrate with workspace configuration** for project management
- **Use Nx APIs** for file operations and project manipulation
- **Test workspace integration** to ensure plugins work correctly
- **Mock workspace state** to test plugin behavior in isolation

## Example Plugin Test Structure

```
libs/plugins/my-plugin/__tests__/
├── __mocks__/
│   ├── globals.ts              # Global test setup
│   ├── helpers.ts              # Plugin-specific helpers
│   └── mock-scenario-builder.ts # Plugin scenarios
├── functional-tests/
│   ├── generators/
│   │   ├── my-generator.test.ts # Generator tests
│   │   └── schema.test.ts      # Schema validation tests
│   ├── executors/
│   │   ├── my-executor.test.ts # Executor tests
│   │   └── options.test.ts     # Options validation tests
│   └── integration.test.ts     # Workspace integration tests
└── isolated-tests/
    └── adhoc.test.ts           # Temporary/ad-hoc tests
```

This structure ensures comprehensive testing of plugin functionality while maintaining clear separation between plugin-specific and workspace integration logic.

