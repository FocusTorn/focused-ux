# Test Directory for @fux/@fux/mockly

This directory contains the test files for the @fux/@fux/mockly package, following the established testing patterns from the FocusedUX project.

## Directory Structure

```
__tests__/
├── _setup.ts              # Global test setup with Mockly and console control
├── helpers.ts              # Common test utilities and mock setup functions
├── README.md               # This file
├── services/               # Tests for service classes
├── adapters/               # Tests for adapter classes
└── coverage/               # Coverage-only tests (if applicable)
```

## Test Setup

### Console Output Control

Tests are configured to be silent by default for stability. To enable console output for debugging:

```bash
# PowerShell
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/mockly

# Or set globally for the session
$env:ENABLE_TEST_CONSOLE="true"
nx test @fux/mockly
```

### Mockly Integration

This package uses Mockly for VSCode API mocking. The `_setup.ts` file automatically:

- Resets Mockly state between tests
- Provides access to `mockly` and `mocklyService` exports
- Handles console output control

### Test Helpers

The `helpers.ts` file provides comprehensive utilities:

#### Mock Setup Functions

- `setupWindowMocks()` - Configure window-related mocks with enhanced functionality
- `setupWorkspaceMocks()` - Configure workspace and file system mocks
- `setupTerminalMocks()` - Configure terminal-related mocks
- `setupFileSystemMocks()` - Configure Node.js file system mocks
- `setupPathMocks()` - Configure path utility mocks

#### Utility Functions

- `resetAllMocks()` - Reset all mocks to initial state
- `setupTestEnvironment()` - Complete test environment setup with all mocks
- `createMockUri()` - Create mock URI objects for testing
- `createMockTextDocument()` - Create mock text document objects
- `createMockTextEditor()` - Create mock text editor objects

#### Service Creation

- `createTestService()` - Template for creating test service instances (customize for your needs)

## Test Patterns

### Service Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestEnvironment } from './helpers'

describe('YourService', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
    })

    it('should do something', () => {
        // Your test logic here using mocks.window, mocks.workspace, etc.
    })
})
```

### Adapter Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'

describe('YourAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should implement interface correctly', () => {
        // Test interface compliance
    })
})
```

### Mock Usage Examples

#### Window Mocks

```typescript
it('should show error message', () => {
    const service = new YourService(mocks.window)
    service.showError('test error')

    expect(mocks.window.showErrorMessage).toHaveBeenCalledWith('test error')
})
```

#### Workspace Mocks

```typescript
it('should read file', async () => {
    mocks.workspace.fs.readFile.mockResolvedValue('file content')

    const service = new YourService(mocks.workspace.fs)
    const result = await service.readFile('/test/path')

    expect(result).toBe('file content')
    expect(mocks.workspace.fs.readFile).toHaveBeenCalledWith('/test/path')
})
```

#### Path Utility Mocks

```typescript
it('should join paths correctly', () => {
    mocks.path.join.mockReturnValue('/joined/path')

    const service = new YourService(mocks.path)
    const result = service.joinPaths('path1', 'path2')

    expect(result).toBe('/joined/path')
    expect(mocks.path.join).toHaveBeenCalledWith('path1', 'path2')
})
```

## Running Tests

```bash
# Run functional tests only
nx test @fux/mockly

# Run all tests including coverage
nx test @fux/mockly:test:full

# Run with console output enabled
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/mockly
```

## Customization

1. **Update `helpers.ts`**: Customize the helper functions for your specific service requirements
2. **Add service-specific mocks**: Create additional mock setup functions as needed
3. **Extend test patterns**: Add new test utilities based on your testing needs
4. **Customize `createTestService()`**: Replace the placeholder with actual service creation logic

## Best Practices

- Use Mockly for VSCode API mocking instead of direct `vi.mock('vscode')`
- Use the helper functions to maintain consistent mock setup across all tests
- Keep tests focused on behavior, not implementation details
- Enable console output only when debugging specific issues
- Follow the established naming conventions for test files
- Use the returned mock objects from helper functions for consistent testing
- Reset mocks in `beforeEach` blocks to ensure test isolation

## Mockly Integration Benefits

- **Consistent API**: All tests use the same mock interfaces
- **State Management**: Automatic reset between tests via `mocklyService.reset()`
- **Realistic Behavior**: Mocks behave like real VSCode APIs
- **Easy Override**: Simple to override specific methods for test scenarios
- **Type Safety**: Full TypeScript support for all mock objects
