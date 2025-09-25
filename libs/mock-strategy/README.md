# Mock Strategy Library

A standardized mock strategy library for FocusedUX packages, providing consistent interfaces and helpers for testing core business logic and VSCode extension packages.

## Overview

This library provides:

- **Core Package Mocks** - For business logic packages (file system, path operations, etc.)
- **Extension Package Mocks** - For VSCode extension packages (commands, window, workspace, etc.)
- **Shared Library Package Mocks** - For shared utility packages (process operations, child process, etc.)
- **Tool Package Mocks** - For CLI tool packages (readline, file streams, CLI interactions, etc.)
- **Plugin Package Mocks** - For Nx plugin packages (workspace operations, generators, executors, etc.)
- **Fluent Builder APIs** - Composable mock scenarios for complex test setups
- **Type-Safe Interfaces** - Consistent mock types across all packages
- **Utility Functions** - Validation helpers and state management

## Installation

```bash
# Add to package dependencies
pnpm add @fux/mock-strategy
```

## Usage

### Core Package Testing

```typescript
import {
    CoreTestMocks,
    setupCoreTestEnvironment,
    createCoreMockBuilder,
} from '@fux/mock-strategy/core'

describe('My Core Service', () => {
    let mocks: CoreTestMocks

    beforeEach(() => {
        mocks = setupCoreTestEnvironment()
    })

    it('should read file successfully', () => {
        const builder = createCoreMockBuilder(mocks)
            .fileRead({
                sourcePath: '/test/file.txt',
                content: 'test content',
            })
            .build()

        // Your test logic here
    })

    it('should handle file system errors', () => {
        const builder = createCoreMockBuilder(mocks)
            .fileSystemError('read', 'Permission denied', {
                sourcePath: '/test/file.txt',
            })
            .build()

        // Your test logic here
    })
})
```

### Extension Package Testing

```typescript
import {
    ExtensionTestMocks,
    setupExtensionTestEnvironment,
    createExtensionMockBuilder,
} from '@fux/mock-strategy/ext'

describe('My Extension Command', () => {
    let mocks: ExtensionTestMocks

    beforeEach(() => {
        mocks = setupExtensionTestEnvironment()
    })

    it('should register command successfully', () => {
        const builder = createExtensionMockBuilder(mocks)
            .commandRegistration({
                commandName: 'myExtension.command',
                shouldSucceed: true,
            })
            .build()

        // Your test logic here
    })

    it('should handle text editor operations', () => {
        const builder = createExtensionMockBuilder(mocks)
            .textEditor({
                fileName: '/test/file.ts',
                content: 'const test = "hello";',
                selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
            })
            .build()

        // Your test logic here
    })
})
```

### Shared Library Package Testing

```typescript
import { LibTestMocks, setupLibTestEnvironment, createLibMockBuilder } from '@fux/mock-strategy/lib'

describe('My Shared Library', () => {
    let mocks: LibTestMocks

    beforeEach(() => {
        mocks = setupLibTestEnvironment()
    })

    it('should execute process successfully', () => {
        const builder = createLibMockBuilder(mocks)
            .processSuccess({
                command: 'npm install',
                exitCode: 0,
                stdout: 'Installation complete',
            })
            .build()

        // Your test logic here
    })

    it('should handle process errors', () => {
        const builder = createLibMockBuilder(mocks)
            .processError({
                command: 'npm install',
                exitCode: 1,
                stderr: 'Permission denied',
            })
            .build()

        // Your test logic here
    })
})
```

### Tool Package Testing

```typescript
import {
    ToolTestMocks,
    setupToolTestEnvironment,
    createToolMockBuilder,
} from '@fux/mock-strategy/tool'

describe('My CLI Tool', () => {
    let mocks: ToolTestMocks

    beforeEach(() => {
        mocks = setupToolTestEnvironment()
    })

    it('should handle CLI interactions', () => {
        const builder = createToolMockBuilder(mocks)
            .cliSuccess({
                input: 'user input',
                output: 'tool output',
            })
            .build()

        // Your test logic here
    })

    it('should process files correctly', () => {
        const builder = createToolMockBuilder(mocks)
            .fileProcessing({
                sourcePath: '/input/file.txt',
                targetPath: '/output/file.txt',
                content: 'processed content',
            })
            .build()

        // Your test logic here
    })
})
```

### Plugin Package Testing

```typescript
import {
    PluginTestMocks,
    setupPluginTestEnvironment,
    createPluginMockBuilder,
} from '@fux/mock-strategy/plugin'

describe('My Nx Plugin', () => {
    let mocks: PluginTestMocks

    beforeEach(() => {
        mocks = setupPluginTestEnvironment()
    })

    it('should generate files successfully', () => {
        const builder = createPluginMockBuilder(mocks)
            .generatorSuccess({
                projectName: 'my-project',
                options: { name: 'test-component' },
            })
            .build()

        // Your test logic here
    })

    it('should execute commands successfully', () => {
        const builder = createPluginMockBuilder(mocks)
            .executorSuccess({
                projectName: 'my-project',
                target: 'build',
                output: 'Build completed',
            })
            .build()

        // Your test logic here
    })
})
```

### Advanced Usage

#### Mock State Management

```typescript
import { mockStateManager } from '@fux/mock-strategy'

describe('Complex Test Suite', () => {
    beforeEach(() => {
        // Register mocks for reuse
        mockStateManager.register('core', coreMocks)
        mockStateManager.register('ext', extMocks)
    })

    afterEach(() => {
        // Reset all registered mocks
        mockStateManager.resetAll()
    })
})
```

#### Validation Helpers

```typescript
import { validateMockCall, validateMockCallWith } from '@fux/mock-strategy'

it('should call mock with correct arguments', () => {
    // Your test logic

    validateMockCall(mocks.fileSystem.readFile, 1, ['/test/file.txt'])
    validateMockCallWith(mocks.vscode.window.showInformationMessage, ['Success!'])
})
```

## API Reference

### Core Package Mocks

#### `CoreTestMocks`

Interface containing all core package mock functions:

- `fileSystem` - File system operations (read, write, copy, delete, etc.)
- `path` - Path manipulation functions
- `yaml` - YAML parsing (optional)
- `buffer` - Buffer operations (optional)

#### `CoreMockBuilder`

Fluent builder for core package scenarios:

- `.fileRead(options)` - Setup file read scenario
- `.fileWrite(options)` - Setup file write scenario
- `.fileCopy(options)` - Setup file copy scenario
- `.fileDelete(options)` - Setup file delete scenario
- `.fileSystemError(operation, message, options)` - Setup error scenario
- `.windowsPath(source, target)` - Setup Windows path handling
- `.unixPath(source, target)` - Setup Unix path handling

### Extension Package Mocks

#### `ExtensionTestMocks`

Interface containing all VSCode extension mock functions:

- `vscode.commands` - Command registration and execution
- `vscode.window` - Window operations and UI
- `vscode.workspace` - Workspace and file system operations
- `vscode.Uri` - URI creation and parsing
- `context` - Extension context and state

#### `ExtensionMockBuilder`

Fluent builder for extension package scenarios:

- `.textEditor(options)` - Setup active text editor
- `.noActiveEditor()` - Setup no active editor scenario
- `.commandRegistration(options)` - Setup command registration
- `.windowMessage(type, message)` - Setup window message display

### Shared Library Package Mocks

#### `LibTestMocks`

Interface containing all shared library mock functions:

- `fileSystem` - File system operations
- `path` - Path manipulation functions
- `process` - Process operations and environment
- `childProcess` - Child process execution
- `util` - Node.js utility functions
- `os` - Operating system information

#### `LibMockBuilder`

Fluent builder for shared library scenarios:

- `.processSuccess(options)` - Setup successful process execution
- `.processError(options)` - Setup failed process execution
- `.fileRead(options)` - Setup file read scenario
- `.fileWrite(options)` - Setup file write scenario
- `.windowsPath()` - Setup Windows path handling
- `.unixPath()` - Setup Unix path handling

### Tool Package Mocks

#### `ToolTestMocks`

Interface containing all CLI tool mock functions:

- `fileSystem` - File system operations
- `path` - Path manipulation functions
- `process` - Process operations with stdin/stdout/stderr
- `childProcess` - Child process execution
- `readline` - Interactive CLI interfaces
- `fs` - File streams and watching
- `os` - Operating system information

#### `ToolMockBuilder`

Fluent builder for tool package scenarios:

- `.cliSuccess(options)` - Setup successful CLI interaction
- `.cliError(options)` - Setup failed CLI interaction
- `.fileProcessing(options)` - Setup file processing scenario
- `.windowsPath()` - Setup Windows path handling
- `.unixPath()` - Setup Unix path handling

### Plugin Package Mocks

#### `PluginTestMocks`

Interface containing all Nx plugin mock functions:

- `fileSystem` - File system operations
- `path` - Path manipulation functions
- `process` - Process operations
- `childProcess` - Child process execution
- `nx` - Nx workspace operations
- `logger` - Logging functions
- `tree` - File tree operations
- `workspace` - Workspace configuration

#### `PluginMockBuilder`

Fluent builder for plugin package scenarios:

- `.generatorSuccess(options)` - Setup successful generator execution
- `.generatorError(options)` - Setup failed generator execution
- `.executorSuccess(options)` - Setup successful executor execution
- `.executorError(options)` - Setup failed executor execution
- `.windowsPath()` - Setup Windows path handling
- `.unixPath()` - Setup Unix path handling

### Utility Functions

#### `validateMockCall(mockFn, callCount, args?)`

Validate mock function was called expected number of times with optional arguments.

#### `validateMockCallWith(mockFn, args)`

Validate mock function was called with specific arguments.

#### `validateMockCallTimes(mockFn, callCount)`

Validate mock function was called specific number of times.

#### `MockStateManager`

Manage multiple mock instances:

- `.register(key, mocks)` - Register mocks with key
- `.get(key)` - Retrieve mocks by key
- `.reset(key)` - Reset specific mocks
- `.resetAll()` - Reset all registered mocks
- `.clear()` - Clear all registered mocks

## Best Practices

### 1. Use Fluent Builders

Prefer the fluent builder pattern for complex scenarios:

```typescript
// Good
const mocks = createCoreMockBuilder(testMocks)
    .fileRead({ sourcePath: '/test/file.txt', content: 'test' })
    .windowsPath('/test/file.txt', '/backup/file.txt')
    .build()

// Avoid
setupFileReadScenario(testMocks, { sourcePath: '/test/file.txt', content: 'test' })
setupWindowsPathScenario(testMocks, '/test/file.txt', '/backup/file.txt')
```

### 2. Reset Mocks Between Tests

Always reset mocks to ensure test isolation:

```typescript
afterEach(() => {
    resetCoreMocks(mocks) // or resetExtensionMocks(mocks)
})
```

### 3. Use Type-Safe Interfaces

Leverage TypeScript interfaces for better IDE support:

```typescript
// Good - type-safe
const mocks: CoreTestMocks = setupCoreTestEnvironment()

// Avoid - any type
const mocks: any = setupCoreTestEnvironment()
```

### 4. Validate Mock Calls

Use validation helpers to ensure mocks are called correctly:

```typescript
it('should call file system operations', () => {
    // Test logic

    validateMockCall(mocks.fileSystem.readFile, 1)
    validateMockCallWith(mocks.fileSystem.writeFile, ['/output.txt', 'content'])
})
```

## Migration Guide

### From Individual \_setup.ts Files

**Before:**

```typescript
// packages/my-package/core/__tests__/_setup.ts
import { vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    // ... many more mocks
}))

// Complex setup logic...
```

**After:**

```typescript
// packages/my-package/core/__tests__/__mocks__/globals.ts
import { setupCoreTestEnvironment } from '@fux/mock-strategy/core'

const mocks = setupCoreTestEnvironment()
// Simple, standardized setup
```

### From Manual Mock Creation

**Before:**

```typescript
const mockReadFile = vi.fn().mockResolvedValue('content')
const mockWriteFile = vi.fn().mockResolvedValue(undefined)
// ... many more manual mocks
```

**After:**

```typescript
import { createCoreMockBuilder } from '@fux/mock-strategy/core'

const mocks = createCoreMockBuilder(testMocks)
    .fileRead({ sourcePath: '/test.txt', content: 'content' })
    .build()
```

## Contributing

When adding new mock scenarios:

1. **Follow the fluent builder pattern** - Use method chaining for composability
2. **Provide type-safe interfaces** - Use TypeScript interfaces for all mock types
3. **Include validation helpers** - Add utility functions for common assertions
4. **Document usage examples** - Update README with clear examples
5. **Test the mocks** - Ensure mocks work correctly in various scenarios

## Version History

- **1.0.0** - Initial release with core and extension mock strategies
