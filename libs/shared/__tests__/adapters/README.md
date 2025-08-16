# Adapter Tests Directory

This directory contains tests for adapter classes in the @fux/@fux/shared package.

## Directory Structure

```
adapters/
├── README.md                    # This file
├── window-adapter.test.ts       # Tests for WindowAdapter class
├── workspace-adapter.test.ts    # Tests for WorkspaceAdapter class
└── shared/                      # Tests for shared adapters
    └── common-adapter.test.ts   # Tests for common adapters
```

## Test Organization

### 1. **Adapter-Specific Tests**

- Create one test file per adapter class
- Name files as `{adapter-name}.test.ts`
- Focus on interface compliance and behavior verification

### 2. **Test Structure**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'
import { WindowAdapter } from '../../src/adapters/WindowAdapter'

describe('WindowAdapter', () => {
    let adapter: WindowAdapter
    let mockWindow: any

    beforeEach(() => {
        // Create minimal mocks for adapter testing
        mockWindow = {
            showInformationMessage: vi.fn(),
            showErrorMessage: vi.fn(),
            showWarningMessage: vi.fn(),
        }

        adapter = new WindowAdapter(mockWindow)
    })

    describe('interface compliance', () => {
        it('should implement all required methods', () => {
            expect(typeof adapter.showInformationMessage).toBe('function')
            expect(typeof adapter.showErrorMessage).toBe('function')
            expect(typeof adapter.showWarningMessage).toBe('function')
        })
    })

    describe('method delegation', () => {
        it('should delegate showInformationMessage to window', () => {
            const message = 'Test message'
            adapter.showInformationMessage(message)

            expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(message)
        })
    })
})
```

### 3. **Testing Focus**

- **Interface Compliance**: Ensure all required methods exist
- **Method Delegation**: Verify calls are properly forwarded
- **Error Handling**: Test error propagation
- **Type Safety**: Ensure proper TypeScript compliance

### 4. **Mock Strategy**

- Use minimal mocks that only provide what the adapter needs
- Focus on the adapter's behavior, not the underlying implementation
- Test the adapter as a thin wrapper around external APIs

## Best Practices

1. **Interface Testing**: Verify all interface requirements are met
2. **Minimal Mocks**: Use the simplest mocks possible
3. **Behavior Verification**: Test that the adapter behaves as expected
4. **Error Propagation**: Ensure errors are properly handled and forwarded
5. **Type Safety**: Maintain strict TypeScript compliance

## Example Adapter Test

```typescript
describe('FileSystemAdapter', () => {
    let adapter: FileSystemAdapter
    let mockFs: any

    beforeEach(() => {
        mockFs = {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            createDirectory: vi.fn(),
            delete: vi.fn(),
        }

        adapter = new FileSystemAdapter(mockFs)
    })

    describe('readFile', () => {
        it('should delegate readFile calls', async () => {
            const filePath = '/test/file.txt'
            const fileContent = 'Hello, World!'

            mockFs.readFile.mockResolvedValue(fileContent)

            const result = await adapter.readFile(filePath)

            expect(result).toBe(fileContent)
            expect(mockFs.readFile).toHaveBeenCalledWith(filePath)
        })

        it('should propagate readFile errors', async () => {
            const filePath = '/nonexistent/file.txt'
            const error = new Error('File not found')

            mockFs.readFile.mockRejectedValue(error)

            await expect(adapter.readFile(filePath)).rejects.toThrow('File not found')
            expect(mockFs.readFile).toHaveBeenCalledWith(filePath)
        })
    })

    describe('writeFile', () => {
        it('should delegate writeFile calls', async () => {
            const filePath = '/test/file.txt'
            const content = 'New content'

            mockFs.writeFile.mockResolvedValue(undefined)

            await adapter.writeFile(filePath, content)

            expect(mockFs.writeFile).toHaveBeenCalledWith(filePath, content)
        })
    })
})
```

## Coverage Considerations

- Test all public methods defined in the interface
- Verify error handling and propagation
- Test edge cases (null/undefined inputs)
- Ensure proper method delegation
- Test async operations correctly

## Integration with Service Tests

Adapters are typically tested in isolation, but they should also be tested as part of service integration:

```typescript
describe('Service with Adapter', () => {
    let service: YourService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        service = new YourService(
            new WindowAdapter(mocks.window),
            new FileSystemAdapter(mocks.workspace.fs)
        )
    })

    it('should use adapters correctly', () => {
        // Test service behavior through adapters
    })
})
```

## Mockly Integration

When testing adapters that wrap Mockly services:

```typescript
import { mockly } from '@fux/mockly'

describe('MocklyAdapter', () => {
    let adapter: MocklyAdapter

    beforeEach(() => {
        adapter = new MocklyAdapter(mockly.window)
    })

    it('should use Mockly window service', () => {
        // Test adapter integration with Mockly
    })
})
```
