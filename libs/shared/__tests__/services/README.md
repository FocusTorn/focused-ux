# Service Tests Directory

This directory contains tests for service classes in the @fux/@fux/shared package.

## Directory Structure

```
services/
├── README.md                    # This file
├── your-service.test.ts         # Tests for YourService class
├── another-service.test.ts      # Tests for AnotherService class
└── shared/                      # Tests for shared services
    └── utility-service.test.ts  # Tests for utility services
```

## Test Organization

### 1. **Service-Specific Tests**

- Create one test file per service class
- Name files as `{service-name}.test.ts`
- Group related tests using `describe` blocks

### 2. **Test Structure**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestEnvironment } from '../helpers'
import { YourService } from '../../src/services/YourService'

describe('YourService', () => {
    let service: YourService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        service = new YourService(mocks.window, mocks.workspace.fs, mocks.terminal)
    })

    describe('constructor', () => {
        it('should initialize with dependencies', () => {
            expect(service).toBeDefined()
        })
    })

    describe('public methods', () => {
        it('should perform expected behavior', () => {
            // Test implementation
        })
    })
})
```

### 3. **Mock Usage**

- Use the mock objects returned by `setupTestEnvironment()`
- Override mock behavior for specific test scenarios
- Verify mock calls to ensure proper integration

### 4. **Test Categories**

- **Unit Tests**: Test individual methods in isolation
- **Integration Tests**: Test service interactions with dependencies
- **Edge Case Tests**: Test error conditions and boundary cases

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock Verification**: Always verify that mocks are called correctly
3. **Realistic Data**: Use realistic test data that matches production scenarios
4. **Error Handling**: Test both success and failure paths
5. **Async Testing**: Use proper async/await patterns for asynchronous operations

## Example Service Test

```typescript
describe('FileService', () => {
    let service: FileService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        service = new FileService(mocks.workspace.fs, mocks.window)
    })

    describe('readFile', () => {
        it('should read file content successfully', async () => {
            const filePath = '/test/file.txt'
            const fileContent = 'Hello, World!'

            // Mock file system response
            mocks.workspace.fs.readFile.mockResolvedValue(fileContent)

            // Execute service method
            const result = await service.readFile(filePath)

            // Verify result
            expect(result).toBe(fileContent)

            // Verify mock calls
            expect(mocks.workspace.fs.readFile).toHaveBeenCalledWith(filePath)
        })

        it('should handle file not found errors', async () => {
            const filePath = '/nonexistent/file.txt'

            // Mock file system error
            mocks.workspace.fs.readFile.mockRejectedValue(new Error('File not found'))

            // Mock error message display
            mocks.window.showErrorMessage.mockResolvedValue('Error shown')

            // Execute and verify error handling
            await expect(service.readFile(filePath)).rejects.toThrow('File not found')
            expect(mocks.window.showErrorMessage).toHaveBeenCalledWith('File not found')
        })
    })
})
```

## Coverage Considerations

- Ensure all public methods are tested
- Test both success and error paths
- Cover edge cases and boundary conditions
- Test async operations properly
- Verify proper cleanup and resource management
