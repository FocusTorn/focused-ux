# Extension Package Mock Strategy

## Overview

Extension packages (`packages/{feature}/ext/`) are VSCode wrapper packages that provide CJS bundles and handle VSCode-specific functionality. They require specialized mocking strategies to handle VSCode APIs, extension activation, and command registration.

## Architecture Characteristics

- **Package Type**: Extension (`ext`)
- **Module System**: CommonJS (CJS)
- **Dependencies**: VSCode APIs, core packages
- **Build Target**: Bundle with `@nx/esbuild:esbuild`
- **Testing Focus**: VSCode integration, command registration, extension lifecycle

## Mock Strategy Components

### 1. `__mocks__/globals.ts` - Global Test Environment

```typescript
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupExtensionTestEnvironment, resetExtensionMocks } from '@fux/mock-strategy'

// Setup extension-specific test environment
beforeAll(() => {
    setupExtensionTestEnvironment()
})

afterAll(() => {
    resetExtensionMocks()
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

### 2. `__mocks__/helpers.ts` - Extension-Specific Utilities

```typescript
import { vi } from 'vitest'
import { createMockExtensionContext, createMockVSCodeAPI } from '@fux/mock-strategy'

export const createExtensionTestHelpers = () => {
    const mockContext = createMockExtensionContext()
    const mockVSCode = createMockVSCodeAPI()

    return {
        mockContext,
        mockVSCode,
        createMockCommand: (command: string) => ({
            command,
            title: `Mock ${command}`,
            category: 'Mock Category',
        }),
        createMockDisposable: () => ({
            dispose: vi.fn(),
        }),
        createMockWorkspaceFolder: (name: string, uri: string) => ({
            name,
            uri: { fsPath: uri },
            index: 0,
        }),
    }
}

export const mockVSCodeCommands = {
    registerCommand: vi.fn(),
    registerTextEditorCommand: vi.fn(),
    executeCommand: vi.fn(),
    getCommands: vi.fn(),
}

export const mockVSCodeWindow = {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    createOutputChannel: vi.fn(),
    activeTextEditor: null,
    visibleTextEditors: [],
}

export const mockVSCodeWorkspace = {
    workspaceFolders: [],
    getConfiguration: vi.fn(),
    onDidChangeConfiguration: vi.fn(),
    onDidChangeWorkspaceFolders: vi.fn(),
    findFiles: vi.fn(),
    openTextDocument: vi.fn(),
}
```

### 3. `__mocks__/mock-scenario-builder.ts` - Extension Scenarios

```typescript
import { vi } from 'vitest'
import { createExtensionTestHelpers } from './helpers'

export class ExtensionMockScenarioBuilder {
    private helpers = createExtensionTestHelpers()
    private mocks: Record<string, any> = {}

    constructor() {
        this.reset()
    }

    reset() {
        this.mocks = {}
        vi.clearAllMocks()
        return this
    }

    withExtensionContext(context: Partial<any> = {}) {
        this.mocks.context = { ...this.helpers.mockContext, ...context }
        return this
    }

    withVSCodeAPI(api: Partial<any> = {}) {
        this.mocks.vscode = { ...this.helpers.mockVSCode, ...api }
        return this
    }

    withWorkspaceFolders(folders: string[] = []) {
        this.mocks.workspaceFolders = folders.map((folder, index) =>
            this.helpers.createMockWorkspaceFolder(`folder${index}`, folder)
        )
        return this
    }

    withActiveEditor(content: string = '', language: string = 'typescript') {
        this.mocks.activeEditor = {
            document: {
                getText: vi.fn().mockReturnValue(content),
                languageId: language,
                uri: { fsPath: '/mock/file.ts' },
                isDirty: false,
            },
            selection: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
            },
        }
        return this
    }

    withConfiguration(config: Record<string, any> = {}) {
        this.mocks.configuration = {
            get: vi.fn().mockImplementation((key: string) => {
                const keys = key.split('.')
                let value = config
                for (const k of keys) {
                    value = value?.[k]
                }
                return value
            }),
            update: vi.fn(),
            inspect: vi.fn(),
        }
        return this
    }

    withCommands(commands: string[] = []) {
        this.mocks.commands = commands.map((cmd) => this.helpers.createMockCommand(cmd))
        return this
    }

    build() {
        return {
            ...this.mocks,
            helpers: this.helpers,
        }
    }
}

export const createExtensionScenario = () => new ExtensionMockScenarioBuilder()
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
import { setupExtensionTestEnvironment, resetExtensionMocks } from '@fux/mock-strategy'

beforeAll(() => {
    setupExtensionTestEnvironment()
})

afterAll(() => {
    resetExtensionMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})
```

**Step 3**: Update your `__mocks__/helpers.ts`

```typescript
import { createExtensionTestHelpers } from '@fux/mock-strategy'

// Import base helpers and extend with package-specific mocks
export const { mockContext, mockVSCode, createMockCommand } = createExtensionTestHelpers()

// Add your package-specific mock helpers here
export const createPackageSpecificMock = () => {
    // Your package-specific mocking logic
}
```

**Step 4**: Update your `__mocks__/mock-scenario-builder.ts`

```typescript
import { createExtensionScenario } from '@fux/mock-strategy'

// Import base scenario builder and extend with package-specific scenarios
export const createPackageScenario = () => {
    const baseScenario = createExtensionScenario()

    return baseScenario.withPackageSpecificMocks().withCustomVSCodeAPI()
}
```

### Option 2: Legacy Manual Setup

If you prefer to maintain your existing setup, ensure you have:

1. **VSCode API Mocking**: Mock all VSCode APIs used by your extension
2. **Extension Context Mocking**: Mock the extension context and its properties
3. **Command Registration Mocking**: Mock command registration and execution
4. **Workspace Mocking**: Mock workspace folders, configuration, and file operations

## Mock Strategy Decision Guidelines

### When to Use Mock Strategy Library Functions

Use the library functions for:

- **Standard VSCode API mocking** (commands, window, workspace)
- **Extension context setup** (activation, deactivation)
- **Common extension patterns** (command registration, configuration)
- **Base test environment setup**

### When to Use Package `__mocks__` Files

Use package-specific mocks for:

- **Package-specific VSCode APIs** not covered by the library
- **Custom extension behaviors** unique to your package
- **Integration with specific core packages**
- **Package-specific configuration handling**

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

### Extension Activation Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createExtensionScenario } from '../__mocks__/mock-scenario-builder'

describe('Extension Activation', () => {
    it('should activate extension successfully', async () => {
        const scenario = createExtensionScenario().withExtensionContext().withVSCodeAPI().build()

        // Mock the activation function
        const activate = vi.fn().mockResolvedValue(undefined)

        await activate(scenario.context)

        expect(activate).toHaveBeenCalledWith(scenario.context)
    })
})
```

### Command Registration Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createExtensionScenario } from '../__mocks__/mock-scenario-builder'

describe('Command Registration', () => {
    it('should register commands on activation', () => {
        const scenario = createExtensionScenario()
            .withVSCodeAPI()
            .withCommands(['myCommand'])
            .build()

        const registerCommand = vi.fn()
        scenario.vscode.commands.registerCommand = registerCommand

        // Test command registration
        registerCommand('myCommand', expect.any(Function))

        expect(registerCommand).toHaveBeenCalled()
    })
})
```

### Configuration Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createExtensionScenario } from '../__mocks__/mock-scenario-builder'

describe('Configuration Handling', () => {
    it('should read configuration values', () => {
        const scenario = createExtensionScenario()
            .withConfiguration({ 'myExtension.setting': 'value' })
            .build()

        const config = scenario.configuration.get('myExtension.setting')

        expect(config).toBe('value')
    })
})
```

## Best Practices

1. **Mock VSCode APIs Consistently**: Use the same mocking patterns across all extension tests
2. **Test Extension Lifecycle**: Always test activation and deactivation
3. **Mock Command Execution**: Test both command registration and execution
4. **Handle Async Operations**: Properly mock and test async VSCode operations
5. **Test Error Scenarios**: Mock VSCode API failures and test error handling
6. **Isolate Extension Logic**: Mock VSCode APIs to focus on extension-specific logic
7. **Test Configuration Changes**: Mock configuration updates and test reactivity

## Common Anti-Patterns

❌ **Don't**: Mock VSCode APIs inconsistently across tests
❌ **Don't**: Skip testing extension activation/deactivation
❌ **Don't**: Mock core package functionality in extension tests
❌ **Don't**: Use real VSCode APIs in tests
❌ **Don't**: Forget to mock async VSCode operations
❌ **Don't**: Test VSCode API behavior instead of extension logic

## Integration with Core Packages

Extension packages should:

- **Import core packages** for business logic
- **Mock core package functions** when testing extension-specific behavior
- **Test integration points** between extension and core packages
- **Use dependency injection** to make core packages testable

## Example Extension Test Structure

```
packages/my-feature/ext/__tests__/
├── __mocks__/
│   ├── globals.ts              # Global test setup
│   ├── helpers.ts              # Extension-specific helpers
│   └── mock-scenario-builder.ts # Extension scenarios
├── functional-tests/
│   ├── activation.test.ts      # Extension activation tests
│   ├── commands.test.ts        # Command registration/execution
│   ├── configuration.test.ts   # Configuration handling
│   └── integration.test.ts     # Core package integration
└── isolated-tests/
    └── adhoc.test.ts           # Temporary/ad-hoc tests
```

This structure ensures comprehensive testing of extension functionality while maintaining clear separation between extension-specific and core package logic.
