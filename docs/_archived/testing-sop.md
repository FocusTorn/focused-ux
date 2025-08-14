# SOP: Testing Standards and Procedures

## 1. :: Overview <!-- Start Fold -->

This document outlines the testing standards and procedures for the FocusedUX monorepo. It covers unit testing, integration testing, and the use of the Mockly library for VSCode API simulation.

### 1.1. :: Testing Philosophy

- **Test-Driven Development (TDD)**: Write tests before implementing features when possible
- **Comprehensive Coverage**: Aim for high test coverage, especially for core business logic
- **Isolation**: Tests should be independent and not rely on external state
- **Readability**: Tests should be self-documenting and easy to understand
- **Maintainability**: Tests should be easy to update when requirements change

### 1.2. :: Testing Stack

- **Test Runner**: Vitest (configured in `vitest.config.ts`)
- **Mocking**: Vitest's built-in mocking capabilities + Mockly library
- **Coverage**: V8 coverage provider with HTML, JSON, and text reports
- **Assertions**: Vitest's expect API

###### END: Overview <!-- Close Fold -->

## 2. :: Mockly Library <!-- Start Fold -->

The Mockly library (`@fux/mockly`) provides a comprehensive VSCode API simulation for testing. It allows testing VSCode extension code without requiring a full VSCode environment.

### 2.1. :: Core Features

**VSCode API Simulation:**
- `workspace` - File system operations, configuration, workspace folders
- `window` - UI interactions, progress, input boxes, messages
- `commands` - Command registration and execution
- `extensions` - Extension management
- `env` - Environment information

**VSCode Types and Classes:**
- `Uri` - File URI handling
- `Position` - Text position
- `Range` - Text range
- `Disposable` - Resource cleanup
- `EventEmitter` - Event handling

**Node.js Utilities:**
- `path` - Path manipulation
- `fs` - File system operations

### 2.2. :: Usage in Tests

```typescript
import { mockly, mocklyService } from '@fux/mockly'

// Use the mockly API directly
const uri = mockly.Uri.file('/test/path')
const content = await mockly.workspace.fs.readFile(uri)

// Or use the service for advanced scenarios
mocklyService.reset() // Reset state between tests
```

### 2.3. :: Mockly Service Reset

Always reset the Mockly service between tests to ensure isolation:

```typescript
import { mocklyService } from '@fux/mockly'

beforeEach(() => {
    mocklyService.reset()
})
```

###### END: Mockly Library <!-- Close Fold -->

## 3. :: Test Structure <!-- Start Fold -->

### 3.1. :: File Organization

```
packages/{feature}/ext/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── core/                 # Core package tests
│   │   ├── service-name.test.ts
│   │   └── ...
│   └── integration/          # Integration tests (optional)
│       ├── feature-name.test.ts
│       └── ...
└── vitest.config.ts          # Vitest configuration
```

### 3.2. :: Test File Naming

- **Unit Tests**: `{service-name}.test.ts`
- **Integration Tests**: `{feature-name}.test.ts`
- **Setup Files**: `setup.ts`

### 3.3. :: Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServiceName } from '@fux/{feature}-core'
import type { IServiceInterface } from '@fux/{feature}-core'

describe('ServiceName', () => {
    let service: ServiceName
    let mockDependency: IServiceInterface

    beforeEach(() => {
        // Setup mocks
        mockDependency = {
            method: vi.fn(),
            // ... other methods
        }

        // Create service instance
        service = new ServiceName(mockDependency)
    })

    describe('methodName', () => {
        it('should do something when condition is met', () => {
            // Arrange
            const input = 'test'
            mockDependency.method.mockReturnValue('expected')

            // Act
            const result = service.methodName(input)

            // Assert
            expect(result).toBe('expected')
            expect(mockDependency.method).toHaveBeenCalledWith(input)
        })

        it('should handle error conditions', () => {
            // Arrange
            mockDependency.method.mockRejectedValue(new Error('Test error'))

            // Act & Assert
            expect(service.methodName('test')).rejects.toThrow('Test error')
        })
    })
})
```

###### END: Test Structure <!-- Close Fold -->

## 4. :: Test Setup Configuration <!-- Start Fold -->

### 4.1. :: Global Setup (`setup.ts`)

```typescript
import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock VSCode module if needed
vi.mock('vscode', () => ({
    TreeItemCheckboxState: {
        Checked: 1,
        Unchecked: 0,
    },
    EventEmitter: class EventEmitter {
        constructor() {}
        event = { dispose: vi.fn() }
        fire = vi.fn()
        dispose = vi.fn()
    },
    // ... other VSCode types as needed
}))
```

### 4.2. :: Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/dist/**',
            ],
        },
        setupFiles: ['./test/setup.ts'],
    },
    resolve: {
        alias: {
            '@fux/{feature}-core': path.resolve(__dirname, '../core/src/index.ts'),
            '@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
            '@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
        },
    },
    define: {
        'process.env.NODE_ENV': '"test"',
    },
    optimizeDeps: {
        exclude: ['vscode'],
    },
})
```

###### END: Test Setup Configuration <!-- Close Fold -->

## 5. :: Mocking Strategies <!-- Start Fold -->

### 5.1. :: Service Dependencies

**Interface-Based Mocking:**
```typescript
import type { IFileSystem, IWindow } from '@fux/shared'

const mockFileSystem: IFileSystem = {
    stat: vi.fn(),
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    // ... implement all interface methods
}

const mockWindow: IWindow = {
    showErrorMessage: vi.fn(),
    showTimedInformationMessage: vi.fn(),
    // ... implement all interface methods
}
```

### 5.2. :: VSCode API Mocking

**Using Mockly:**
```typescript
import { mockly } from '@fux/mockly'

// Mock file system operations
await mockly.workspace.fs.writeFile(mockly.Uri.file('/test.txt'), new TextEncoder().encode('content'))

// Mock window interactions
mockly.window.showErrorMessage = vi.fn()
mockly.window.showInformationMessage = vi.fn().mockResolvedValue('user choice')

// Mock commands
mockly.commands.executeCommand = vi.fn().mockResolvedValue('command result')
```

### 5.3. :: Async Operations

**Promise Mocking:**
```typescript
// Mock successful async operations
mockFileSystem.readFile = vi.fn().mockResolvedValue('file content')

// Mock failed async operations
mockFileSystem.readFile = vi.fn().mockRejectedValue(new Error('File not found'))

// Mock async operations with delays
mockFileSystem.readFile = vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve('content'), 100))
)
```

### 5.4. :: Event Emitters

**Using Mockly EventEmitter:**
```typescript
import { mockly } from '@fux/mockly'

const eventEmitter = new mockly.EventEmitter<string>()
const listener = vi.fn()

eventEmitter.event(listener)
eventEmitter.fire('test event')

expect(listener).toHaveBeenCalledWith('test event')
```

###### END: Mocking Strategies <!-- Close Fold -->

## 6. :: Testing Patterns <!-- Start Fold -->

### 6.1. :: Service Testing

**Dependency Injection Testing:**
```typescript
describe('ServiceName', () => {
    let service: ServiceName
    let mockDependency: IServiceInterface

    beforeEach(() => {
        mockDependency = createMockService()
        service = new ServiceName(mockDependency)
    })

    it('should call dependency method with correct parameters', () => {
        const input = 'test input'
        service.processInput(input)

        expect(mockDependency.process).toHaveBeenCalledWith(input)
    })
})
```

### 6.2. :: Error Handling Testing

**Exception Testing:**
```typescript
it('should handle file not found errors', async () => {
    mockFileSystem.readFile = vi.fn().mockRejectedValue(new Error('File not found'))

    await expect(service.loadFile('/nonexistent.txt')).rejects.toThrow('File not found')
    expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('Failed to load file')
})
```

### 6.3. :: Async Testing

**Promise Testing:**
```typescript
it('should process async operations correctly', async () => {
    const result = await service.processAsync('input')
    
    expect(result).toBe('expected output')
    expect(mockDependency.asyncMethod).toHaveBeenCalledWith('input')
})
```

### 6.4. :: State Testing

**State Management Testing:**
```typescript
it('should maintain correct state after operations', () => {
    expect(service.getState()).toBe('initial')
    
    service.updateState('new state')
    
    expect(service.getState()).toBe('new state')
})
```

###### END: Testing Patterns <!-- Close Fold -->

## 7. :: Integration Testing <!-- Start Fold -->

### 7.1. :: When to Use Integration Tests

- **Service Interactions**: Testing how multiple services work together
- **End-to-End Workflows**: Testing complete user workflows
- **External Dependencies**: Testing integration with VSCode APIs
- **Configuration**: Testing configuration loading and validation

### 7.2. :: Integration Test Structure

```typescript
describe('Feature Integration', () => {
    let mocklyService: IMocklyService

    beforeEach(() => {
        mocklyService = container.resolve<IMocklyService>('mocklyService')
        mocklyService.reset()
    })

    it('should complete full workflow', async () => {
        // Setup test environment
        await mocklyService.workspace.fs.writeFile(
            mocklyService.Uri.file('/test.txt'),
            new TextEncoder().encode('test content')
        )

        // Execute workflow
        const result = await executeWorkflow('/test.txt')

        // Verify results
        expect(result).toBeDefined()
        expect(mocklyService.window.showInformationMessage).toHaveBeenCalled()
    })
})
```

###### END: Integration Testing <!-- Close Fold -->

## 8. :: Test Commands <!-- Start Fold -->

### 8.1. :: Running Tests

**Using Aka Aliases (Recommended):**
```bash
# Run tests for a specific package
{package-alias} t

# Run tests with coverage (terminal output)
{package-alias} tc

# Run tests with coverage (HTML report)
{package-alias} tcw

# Examples:
gw t          # Run tests for ghost-writer
ccp tc        # Run tests with coverage for context-cherry-picker
pb tcw        # Run tests with HTML coverage for project-butler
```

**Using Nx:**
```bash
# Run tests for a specific package
nx test @fux/{feature}-ext

# Run tests with coverage
nx test @fux/{feature}-ext --coverage

# Run tests in watch mode
nx test @fux/{feature}-ext --watch

# Run specific test file
nx test @fux/{feature}-ext --testNamePattern="ServiceName"
```

**Using Vitest Directly:**
```bash
# Run tests in package directory
cd packages/{feature}/ext
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch
```

### 8.2. :: Coverage Reports

Coverage reports are generated in:
- **HTML**: `packages/{feature}/ext/coverage/html/index.html`
- **JSON**: `packages/{feature}/ext/coverage/coverage-final.json`
- **Console**: Terminal output

### 8.3. :: Test Output

Test output includes:
- Test results and statistics
- Coverage information
- Failed test details with stack traces
- Performance metrics

### 8.4. :: Available Testing Aliases

The following testing aliases are available through the aka script:

| Alias | Command | Description |
|-------|---------|-------------|
| `t` | `test` | Run tests for the package |
| `tc` | `test --coverage` | Run tests with coverage output in terminal |
| `tcw` | `test --coverage --reporter=html` | Run tests with coverage output in HTML format |

**Usage Examples:**
```bash
# Basic test execution
gw t          # Run tests for ghost-writer
ccp t         # Run tests for context-cherry-picker
pb t          # Run tests for project-butler

# Coverage testing
gw tc         # Run tests with coverage for ghost-writer
ccp tc        # Run tests with coverage for context-cherry-picker
pb tc         # Run tests with coverage for project-butler

# HTML coverage reports
gw tcw        # Generate HTML coverage report for ghost-writer
ccp tcw       # Generate HTML coverage report for context-cherry-picker
pb tcw        # Generate HTML coverage report for project-butler
```

###### END: Test Commands <!-- Close Fold -->

## 9. :: Best Practices <!-- Start Fold -->

### 9.1. :: Test Organization

- **Group Related Tests**: Use `describe` blocks to organize related test cases
- **Clear Test Names**: Use descriptive test names that explain the scenario
- **Arrange-Act-Assert**: Structure tests with clear sections
- **One Assertion Per Test**: Focus each test on a single behavior

### 9.2. :: Mocking Best Practices

- **Mock at Interface Level**: Mock dependencies through their interfaces
- **Reset Mocks**: Always reset mocks between tests
- **Verify Interactions**: Check that mocks are called with expected parameters
- **Avoid Over-Mocking**: Only mock what's necessary for the test

### 9.3. :: Test Data

- **Use Constants**: Define test data as constants for reusability
- **Minimal Test Data**: Use the minimum data needed for the test
- **Realistic Data**: Use realistic test data that represents actual usage
- **Edge Cases**: Include tests for edge cases and error conditions

### 9.4. :: Performance

- **Fast Tests**: Keep tests fast to encourage frequent execution
- **Avoid External Dependencies**: Don't rely on external services in unit tests
- **Efficient Mocking**: Use efficient mocking strategies
- **Parallel Execution**: Ensure tests can run in parallel

### 9.5. :: Maintenance

- **Update Tests with Code**: Update tests when changing implementation
- **Refactor Test Code**: Keep test code clean and maintainable
- **Remove Obsolete Tests**: Remove tests for removed functionality
- **Document Complex Tests**: Add comments for complex test scenarios

###### END: Best Practices <!-- Close Fold -->

## 10. :: Troubleshooting <!-- Start Fold -->

### 10.1. :: Common Issues

**Module Resolution Errors:**
- Check `vitest.config.ts` alias configuration
- Ensure paths are correctly resolved
- Verify TypeScript configuration

**Mocking Issues:**
- Ensure mocks are reset between tests
- Check that mocks implement the correct interface
- Verify mock function signatures

**Async Test Failures:**
- Use `async/await` for async tests
- Ensure proper error handling
- Check for unhandled promise rejections

**Coverage Issues:**
- Verify coverage exclusions in config
- Check that source files are included
- Ensure tests are actually running

### 10.2. :: Debugging Tests

**Using Debugger:**
```typescript
it('should debug this test', () => {
    debugger // Set breakpoint
    // Test code here
})
```

**Verbose Logging:**
```typescript
// Enable console logging in specific tests
console.log = vi.fn().mockImplementation(console.log)
```

**Test Isolation:**
```typescript
// Run single test
it.only('should run only this test', () => {
    // Test code here
})
```

###### END: Troubleshooting <!-- Close Fold -->

## 11. :: References <!-- Start Fold -->

### 11.1. :: Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Mockly Library Documentation](./mockly/README.md)
- [VSCode Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

### 11.2. :: Example Implementations

- **Context Cherry Picker**: `packages/context-cherry-picker/ext/test/`
- **Ghost Writer**: `packages/ghost-writer/ext/test/`
- **Project Butler**: `packages/project-butler/ext/test/`

### 11.3. :: Configuration Files

- **Global Vitest Config**: `vitest.config.ts`
- **Package Vitest Config**: `packages/{feature}/ext/vitest.config.ts`
- **Test Setup**: `packages/{feature}/ext/test/setup.ts`

###### END: References <!-- Close Fold --> 