# Dynamicons Extension Functional Tests

## Overview

Functional tests for the `@fux/dynamicons-ext` package test extension logic, adapters, and command registration in an isolated test environment with mocked VSCode APIs. These tests ensure fast execution and comprehensive coverage without requiring a full VS Code instance.

## Test Files

### **Extension Tests**

- `extension.test.ts` - Main extension activation and initialization
- `ExtensionManager.test.ts` - Extension management and lifecycle
- `CommandManager.test.ts` - Command registration and handling

### **Adapter Tests**

- `FileSystemAdapter.test.ts` - File system operations through VSCode API
- `WorkspaceAdapter.test.ts` - Workspace operations through VSCode API
- `ConfigurationAdapter.test.ts` - Configuration operations through VSCode API
- `UIAdapter.test.ts` - UI operations through VSCode API

### **Service Tests**

- `DynamiconService.test.ts` - Core dynamicon generation service
- `ThemeService.test.ts` - Theme management and compilation
- `AssetService.test.ts` - Asset building and optimization

## Test Patterns

### **Extension Testing Pattern**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExtensionManager } from '../../../src/services/ExtensionManager'
import * as vscode from 'vscode'

// Mock VSCode APIs
vi.mock('vscode', () => ({
    commands: {
        registerCommand: vi.fn(),
        registerTextEditorCommand: vi.fn(),
    },
    workspace: {
        getConfiguration: vi.fn(),
        onDidChangeConfiguration: vi.fn(),
    },
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
    },
}))

describe('ExtensionManager', () => {
    let extensionManager: ExtensionManager

    beforeEach(() => {
        extensionManager = new ExtensionManager()
        vi.clearAllMocks()
    })

    it('should register commands on activation', () => {
        extensionManager.activate()

        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
            'dynamicons.generate',
            expect.any(Function)
        )
    })

    it('should handle command execution correctly', async () => {
        const mockCommand = vi.fn()
        vi.mocked(vscode.commands.registerCommand).mockImplementation((id, callback) => {
            if (id === 'dynamicons.generate') {
                mockCommand.mockImplementation(callback)
            }
            return { dispose: vi.fn() }
        })

        extensionManager.activate()
        await mockCommand()

        expect(mockCommand).toHaveBeenCalled()
    })
})
```

### **Adapter Testing Pattern**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileSystemAdapter } from '../../../src/adapters/FileSystemAdapter'
import * as vscode from 'vscode'

vi.mock('vscode', () => ({
    workspace: {
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
        },
    },
    Uri: {
        file: vi.fn(),
    },
}))

describe('FileSystemAdapter', () => {
    let adapter: FileSystemAdapter

    beforeEach(() => {
        adapter = new FileSystemAdapter()
        vi.clearAllMocks()
    })

    it('should read file contents through VSCode API', async () => {
        const mockContent = Buffer.from('test content')
        vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(mockContent)

        const result = await adapter.readFile('test.txt')

        expect(result).toBe('test content')
        expect(vscode.workspace.fs.readFile).toHaveBeenCalled()
    })

    it('should handle file read errors gracefully', async () => {
        vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('File not found'))

        await expect(adapter.readFile('nonexistent.txt')).rejects.toThrow('File not found')
    })
})
```

### **Service Testing Pattern**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DynamiconService } from '../../../src/services/DynamiconService'
import { FileSystemAdapter } from '../../../src/adapters/FileSystemAdapter'

vi.mock('../../../src/adapters/FileSystemAdapter')

describe('DynamiconService', () => {
    let service: DynamiconService
    let mockFileSystemAdapter: vi.Mocked<FileSystemAdapter>

    beforeEach(() => {
        mockFileSystemAdapter = {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            exists: vi.fn(),
        } as any

        service = new DynamiconService(mockFileSystemAdapter)
    })

    it('should generate dynamicon with valid configuration', async () => {
        mockFileSystemAdapter.readFile.mockResolvedValue('{"theme": "dark"}')
        mockFileSystemAdapter.writeFile.mockResolvedValue()

        const result = await service.generateDynamicon('test-config.json')

        expect(result.success).toBe(true)
        expect(mockFileSystemAdapter.readFile).toHaveBeenCalledWith('test-config.json')
        expect(mockFileSystemAdapter.writeFile).toHaveBeenCalled()
    })

    it('should handle configuration errors gracefully', async () => {
        mockFileSystemAdapter.readFile.mockRejectedValue(new Error('Config not found'))

        const result = await service.generateDynamicon('invalid-config.json')

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
    })
})
```

## Test Categories

### **1. Extension Logic Tests**

- **Extension Activation**: Test extension activation and initialization
- **Command Registration**: Test command registration and handling
- **Event Handling**: Test VSCode event handling
- **Lifecycle Management**: Test extension lifecycle events

### **2. Adapter Tests**

- **File System Operations**: Test file reading, writing, and management
- **Workspace Operations**: Test workspace configuration and state
- **Configuration Operations**: Test configuration reading and writing
- **UI Operations**: Test user interface interactions

### **3. Service Tests**

- **Core Services**: Test core business logic services
- **Integration Services**: Test service integration and communication
- **Error Handling**: Test error handling and recovery
- **Performance**: Test service performance and optimization

### **4. Mock Strategy Tests**

- **VSCode API Mocking**: Test VSCode API mocking and stubbing
- **Dependency Injection**: Test dependency injection and mocking
- **Test Isolation**: Test test isolation and cleanup
- **Mock Verification**: Test mock verification and assertions

## Test Data

### **Mock VSCode APIs**

```typescript
const mockVSCode = {
    commands: {
        registerCommand: vi.fn(),
        registerTextEditorCommand: vi.fn(),
        executeCommand: vi.fn(),
    },
    workspace: {
        getConfiguration: vi.fn(),
        onDidChangeConfiguration: vi.fn(),
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
        },
    },
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
    },
    Uri: {
        file: vi.fn(),
    },
}
```

### **Test Configurations**

```typescript
const testConfigurations = {
    valid: {
        theme: 'dark',
        icons: ['typescript', 'javascript', 'react'],
        output: './themes',
    },
    invalid: {
        theme: 'invalid',
        icons: [],
        output: '',
    },
    empty: {},
}
```

## Assertions

### **Success Assertions**

```typescript
expect(result).toBeDefined()
expect(result.success).toBe(true)
expect(vscode.commands.registerCommand).toHaveBeenCalled()
expect(mockAdapter.readFile).toHaveBeenCalledWith('expected-file.txt')
```

### **Error Assertions**

```typescript
expect(result.success).toBe(false)
expect(result.error).toBeDefined()
expect(result.error.message).toContain('expected error message')
expect(mockAdapter.readFile).toHaveBeenCalledTimes(1)
```

### **Mock Assertions**

```typescript
expect(mockFunction).toHaveBeenCalled()
expect(mockFunction).toHaveBeenCalledWith(expectedArgs)
expect(mockFunction).toHaveBeenCalledTimes(expectedCount)
expect(mockFunction).toHaveBeenLastCalledWith(expectedArgs)
```

## Test Isolation

### **Extension Isolation**

- Each test uses fresh extension instance
- No shared state between tests
- Cleanup after each test

### **Mock Isolation**

- Each test uses fresh mocks
- No shared mock state between tests
- Clear mocks between tests

### **Service Isolation**

- Each service is tested independently
- Dependencies are mocked or stubbed
- No external service calls

## Coverage Goals

- **Extension Logic**: 100% coverage of extension logic
- **Adapter Methods**: 100% coverage of adapter methods
- **Service Methods**: 100% coverage of service methods
- **Error Handling**: 100% coverage of error handling

## Performance Requirements

- **Test Execution**: < 5 seconds for all functional tests
- **Memory Usage**: < 100MB peak memory usage
- **CPU Usage**: < 30% CPU usage during tests
- **Parallel Execution**: Tests can run in parallel

## Maintenance

### **Regular Updates**

- Update tests when extension logic changes
- Add tests for new functionality
- Remove tests for deprecated features

### **Mock Maintenance**

- Keep mocks up to date with VSCode API changes
- Ensure mocks accurately reflect real API behavior
- Update mock implementations as needed

### **Coverage Monitoring**

- Monitor coverage trends
- Identify uncovered code paths
- Plan test improvements
