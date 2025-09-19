# Test Directory for @fux/project-butler-ext

This directory contains the test files for the @fux/project-butler-ext package, following the established testing patterns from the FocusedUX project.

## Directory Structure

```
__tests__/
├── __mocks__/
│   ├── globals.ts          # Global mocks and test setup
│   ├── helpers.ts          # Test helper functions and utilities
│   └── mock-scenario-builder.ts # Mock scenario builder functions
├── README.md               # This file
├── functional-tests/       # Functional tests for command execution
├── integration-tests/      # Integration tests for extension behavior
└── coverage-tests/        # Coverage-only tests (if applicable)
```

## Test Setup

### Console Output Control

Tests are configured to be silent by default for stability. To enable console output for debugging:

```bash
# PowerShell
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/project-butler-ext

# Or set globally for the session
$env:ENABLE_TEST_CONSOLE="true"
nx test @fux/project-butler-ext
```

### Test Environment

This package tests the VSCode extension integration:

- **Extension Activation**: Test extension activation and command registration
- **Command Execution**: Test all 4 commands with proper error handling
- **Adapter Integration**: Test VSCode adapters with core services
- **DI Container**: Test dependency injection setup and wiring

### Test Helpers

The `helpers.ts` file provides comprehensive utilities:

#### Mock Setup Functions

- `setupVSCodeMocks()` - Configure VSCode API mocks
- `setupExtensionMocks()` - Configure extension-specific mocks
- `setupCommandMocks()` - Configure command execution mocks

#### Utility Functions

- `resetAllMocks()` - Reset all mocks to initial state
- `setupTestEnvironment()` - Complete test environment setup with all mocks
- `createMockExtensionContext()` - Create mock extension context
- `createMockUri()` - Create mock URI objects for testing

#### Extension Testing

- `createTestExtension()` - Create extension instance for testing
- `executeCommand()` - Execute commands with proper mocking

## Test Patterns

### Extension Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestEnvironment } from './helpers'

describe('Extension Activation', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
    })

    it('should activate successfully', () => {
        // Test extension activation
    })
})
```

### Command Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'

describe('Command Execution', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should execute formatPackageJson command', async () => {
        // Test command execution
    })
})
```

### Mock Usage Examples

#### VSCode Mocks

```typescript
it('should register commands', () => {
    const extension = createTestExtension(mocks.vscode)
    extension.activate(mocks.context)

    expect(mocks.vscode.commands.registerCommand).toHaveBeenCalledTimes(4)
})
```

#### Command Execution

```typescript
it('should handle command errors', async () => {
    mocks.window.showErrorMessage.mockResolvedValue(undefined)

    await executeCommand('fux-project-butler.formatPackageJson', mocks)

    expect(mocks.window.showErrorMessage).toHaveBeenCalled()
})
```

## Running Tests

```bash
# Run functional tests only
nx test @fux/project-butler-ext

# Run all tests including coverage
nx test @fux/project-butler-ext:test:full

# Run with console output enabled
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/project-butler-ext
```

## Customization

1. **Update `helpers.ts`**: Customize the helper functions for your specific extension requirements
2. **Add extension-specific mocks**: Create additional mock setup functions as needed
3. **Extend test patterns**: Add new test utilities based on your testing needs
4. **Customize `createTestExtension()`**: Replace the placeholder with actual extension creation logic

## Best Practices

- Mock VSCode APIs comprehensively for consistent testing
- Test command registration and execution separately
- Test error handling and user feedback
- Keep tests focused on extension behavior, not core logic
- Enable console output only when debugging specific issues
- Follow the established naming conventions for test files
- Use the returned mock objects from helper functions for consistent testing
- Reset mocks in `beforeEach` blocks to ensure test isolation

## Extension Testing Strategy

### Unit Tests

- Test extension activation and command registration
- Test adapter implementations
- Test error handling and user feedback
- Test DI container setup

### Functional Tests

- Test complete command execution flow
- Test service integration through adapters
- Test error propagation from core to extension
- Test user experience and feedback

### Mock Strategy

- Mock all VSCode APIs to avoid real VSCode dependencies
- Mock core services to test extension in isolation
- Use realistic mock data for comprehensive testing
- Test both success and error scenarios
