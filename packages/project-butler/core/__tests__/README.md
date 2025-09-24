# Test Directory for @fux/project-butler-core

This directory contains the test files for the @fux/project-butler-core package, following the established testing patterns from the FocusedUX project.

## Directory Structure

```
__tests__/
├── _setup.ts              # Global test setup with console control
├── helpers.ts              # Common test utilities and mock setup functions
├── README.md               # This file
├── unit/                   # Unit tests for service classes
├── functional/             # Functional tests for service orchestration
└── coverage/               # Coverage-only tests (if applicable)
```

## Test Setup

### Console Output Control

Tests are configured to be silent by default for stability. To enable console output for debugging:

```bash
# PowerShell
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/project-butler-core

# Or set globally for the session
$env:ENABLE_TEST_CONSOLE="true"
nx test @fux/project-butler-core
```

### Test Environment

This package uses a simplified test environment without shared dependencies:

- **No Shared Library**: This is the "guinea pig" package, so no @fux/shared dependencies
- **Direct Mocking**: Services are tested with direct dependency injection
- **File System Mocking**: Node.js file system operations are mocked
- **Console Control**: Configurable console output for debugging

### Test Helpers

The `helpers.ts` file provides comprehensive utilities:

#### Mock Setup Functions

- `setupFileSystemMocks()` - Configure file system operation mocks
- `setupPathMocks()` - Configure path utility mocks
- `setupYamlMocks()` - Configure YAML parsing mocks

#### Utility Functions

- `resetAllMocks()` - Reset all mocks to initial state
- `setupTestEnvironment()` - Complete test environment setup with all mocks
- `createMockFileSystem()` - Create mock file system for testing
- `createMockPathUtils()` - Create mock path utilities for testing

#### Service Creation

- `createTestService()` - Template for creating test service instances

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
        // Your test logic here using mocks.fileSystem, mocks.path, etc.
    })
})
```

### Functional Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createDIContainer } from '../src/injection'

describe('ProjectButlerManager Integration', () => {
    let container: ReturnType<typeof createDIContainer>

    beforeEach(() => {
        container = createDIContainer()
    })

    it('should orchestrate services correctly', () => {
        // Test service orchestration
    })
})
```

### Mock Usage Examples

#### File System Mocks

```typescript
it('should read file', async () => {
    mocks.fileSystem.readFile.mockResolvedValue('file content')

    const service = new YourService(mocks.fileSystem)
    const result = await service.readFile('/test/path')

    expect(result).toBe('file content')
    expect(mocks.fileSystem.readFile).toHaveBeenCalledWith('/test/path')
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
nx test @fux/project-butler-core

# Run all tests including coverage
nx test @fux/project-butler-core:test:full

# Run with console output enabled
$env:ENABLE_TEST_CONSOLE="true"; nx test @fux/project-butler-core
```

## Customization

1. **Update `helpers.ts`**: Customize the helper functions for your specific service requirements
2. **Add service-specific mocks**: Create additional mock setup functions as needed
3. **Extend test patterns**: Add new test utilities based on your testing needs
4. **Customize `createTestService()`**: Replace the placeholder with actual service creation logic

## Best Practices

- Use direct dependency injection for testing instead of complex mock hierarchies
- Use the helper functions to maintain consistent mock setup across all tests
- Keep tests focused on behavior, not implementation details
- Enable console output only when debugging specific issues
- Follow the established naming conventions for test files
- Use the returned mock objects from helper functions for consistent testing
- Reset mocks in `beforeEach` blocks to ensure test isolation

## Service Testing Strategy

### Unit Tests

- Test each service in isolation
- Mock all external dependencies
- Test error conditions and edge cases
- Achieve 100% coverage for business logic

### Functional Tests

- Test service orchestration through DI container
- Validate service interactions
- Test complete workflows
- Ensure proper error propagation

### Mock Strategy

- Mock file system operations to avoid real disk I/O
- Mock path utilities for cross-platform consistency
- Mock YAML parsing for configuration testing
- Use realistic mock data for comprehensive testing

