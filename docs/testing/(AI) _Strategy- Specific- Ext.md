# (AI) Strategy - Specific Ext

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **AI Testing Documentation References**

- **AI_TESTING_BASE**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **AI_MOCKING_BASE**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **AI_TROUBLESHOOTING**: `docs/testing/(AI) _Troubleshooting- Base.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all extension package testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **EXTENSION PACKAGE TESTING REQUIREMENTS**

### **Extension Package Definition**

- **Location**: `packages/{feature}/ext/`
- **Purpose**: VSCode extension wrapper for core logic
- **Format**: CJS bundle (production), CJS unbundled (development)
- **Dependencies**: VSCode API, core package, external packages
- **Testing Focus**: Extension lifecycle, VSCode integration, adapter patterns, command registration

### **Extension Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `packages/{feature}/ext/__tests__/functional-tests/`
- **Integration Tests**: `packages/{feature}/ext/__tests__/integration-tests/`
- **Mock Strategy**: Use `@fux/mock-strategy/ext` functions
- **Coverage**: 100% coverage for public methods
- **Build Dependencies**: Unit tests use `build:dev`, integration tests use `build`

## **MANDATORY: FOLDING MARKERS**

**CRITICAL**: All extension test files must use folding markers. See **AI_TESTING_BASE** for complete folding marker documentation and examples.

### **Quick Reference**

- **Setup variables**: Wrap with `// SETUP ----------------->>` and `//----------------------------------------------------<<`
- **`beforeEach`/`afterEach`**: Wrap with `//>` and `//<`
- **`it` blocks**: Wrap with `//>` and `//<`
- **Space requirement**: All folding markers must be preceded by a space

## **EXTENSION TESTING PATTERNS**

### **Extension Activation Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '@fux/mock-strategy/ext'
import { activate } from '../src/extension.js'

describe('Extension Activation', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>
    let mockContext: any
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)

        mockContext = {
            subscriptions: [],
            extensionPath: '/test/extension/path',
        }
    }) //<

    it('should activate extension successfully', async () => {
        //>
        mocks.vscode.commands.registerCommand.mockReturnValue({ dispose: vi.fn() })
        mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)

        const result = await activate(mockContext)

        expect(result).toBeUndefined()
        expect(mocks.vscode.commands.registerCommand).toHaveBeenCalled()
        expect(mockContext.subscriptions).toHaveLength(4)
    }) //<

    it('should handle activation errors gracefully', async () => {
        //>
        mocks.vscode.commands.registerCommand.mockImplementation(() => {
            throw new Error('Registration failed')
        })

        await expect(activate(mockContext)).rejects.toThrow('Registration failed')
    }) //<
})
```

### **Adapter Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '@fux/mock-strategy/ext'
import { FileSystemAdapter } from '../src/adapters/FileSystem.adapter.js'

describe('FileSystemAdapter', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>
    let adapter: FileSystemAdapter
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)

        adapter = new FileSystemAdapter()
    }) //<

    it('should read file using VSCode API', async () => {
        //>
        const mockUri = { fsPath: '/test/file.json' }
        const mockDocument = { getText: vi.fn().mockReturnValue('{"test": "data"}') }

        mocks.vscode.workspace.openTextDocument.mockResolvedValue(mockDocument)

        const result = await adapter.readFile(mockUri)

        expect(result).toEqual('{"test": "data"}')
        expect(mocks.vscode.workspace.openTextDocument).toHaveBeenCalledWith(mockUri)
    }) //<

    it('should handle file read errors', async () => {
        //>
        const mockUri = { fsPath: '/nonexistent/file.json' }

        mocks.vscode.workspace.openTextDocument.mockRejectedValue(new Error('File not found'))

        await expect(adapter.readFile(mockUri)).rejects.toThrow('File not found')
    }) //<
})
```

### **Command Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '@fux/mock-strategy/ext'

describe('Command Execution', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>
    let commandHandler: any
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)

        // Import command handler function
        commandHandler = vi.fn()
    }) //<

    it('should execute command with valid URI', async () => {
        //>
        const mockUri = { fsPath: '/test/file.json' }
        mocks.vscode.window.activeTextEditor = {
            document: { uri: mockUri },
        }

        await commandHandler(mockUri)

        expect(commandHandler).toHaveBeenCalledWith(mockUri)
    }) //<

    it('should handle command execution errors', async () => {
        //>
        const mockUri = { fsPath: '/invalid/file.json' }
        commandHandler.mockRejectedValue(new Error('Command failed'))

        await expect(commandHandler(mockUri)).rejects.toThrow('Command failed')
    }) //<
})
```

## **EXTENSION-SPECIFIC MOCKING REQUIREMENTS**

### **EXTENSION Mock Strategy**

- **Use**: `setupExtTestEnvironment()` and `resetExtMocks()` from `@fux/mock-strategy/ext`
- **Interface**: `ExtTestMocks` interface
- **Scope**: Extension-specific mocking patterns
- **Integration**: Works with VSCode API mocks

### **EXTENSION Mock Patterns**

```typescript
// Extension-specific mock setup
const mocks = await setupExtTestEnvironment()

// Extension-specific mock reset
await resetExtMocks(mocks)

// Extension-specific mock usage
mocks.vscode.commands.registerCommand.mockReturnValue({ dispose: vi.fn() })
mocks.vscode.window.showInformationMessage.mockResolvedValue('User clicked OK')
mocks.vscode.workspace.openTextDocument.mockResolvedValue(mockDocument)
```

### **VSCode API Mocking**

```typescript
// Mock VSCode API responses
mocks.vscode.window.activeTextEditor = {
    document: { uri: { fsPath: '/test/file.json' } },
}

// Mock command registration
mocks.vscode.commands.registerCommand.mockImplementation((command, handler) => {
    return { dispose: vi.fn() }
})

// Mock workspace operations
mocks.vscode.workspace.openTextDocument.mockResolvedValue({
    getText: vi.fn().mockReturnValue('file content'),
})
```

## **EXTENSION TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Extension Activation**: Test extension activation and deactivation
2. **Command Registration**: Test all command registrations
3. **Adapter Patterns**: Test all VSCode API adapters
4. **Core Integration**: Test integration with core package
5. **Error Handling**: Test all error scenarios and user notifications
6. **VSCode API Usage**: Test all VSCode API interactions
7. **Extension Lifecycle**: Test extension startup and shutdown

### **Coverage Organization**

```typescript
describe('Extension', () => {
    describe('Activation', () => {
        it('should activate successfully', () => {
            // Test activation
        })

        it('should handle activation errors', () => {
            // Test activation error handling
        })
    })

    describe('Command Registration', () => {
        it('should register all commands', () => {
            // Test command registration
        })

        it('should handle registration failures', () => {
            // Test registration error handling
        })
    })

    describe('Adapters', () => {
        it('should implement VSCode API adapters', () => {
            // Test adapter implementation
        })

        it('should handle adapter errors', () => {
            // Test adapter error handling
        })
    })

    describe('Core Integration', () => {
        it('should integrate with core services', () => {
            // Test core integration
        })

        it('should handle core service errors', () => {
            // Test core error handling
        })
    })

    describe('Error Handling', () => {
        it('should handle specific error condition', () => {
            // Test error scenario
        })
    })
})
```

## **EXTENSION-SPECIFIC TESTING SCENARIOS**

### **Extension Lifecycle Testing**

```typescript
describe('Extension Lifecycle', () => {
    it('should activate and register commands', async () => {
        const mockContext = { subscriptions: [] }

        await activate(mockContext)

        expect(mockContext.subscriptions).toHaveLength(4)
        expect(mocks.vscode.commands.registerCommand).toHaveBeenCalledTimes(4)
    })

    it('should handle activation failures', async () => {
        const mockContext = { subscriptions: [] }
        mocks.vscode.commands.registerCommand.mockImplementation(() => {
            throw new Error('Registration failed')
        })

        await expect(activate(mockContext)).rejects.toThrow('Registration failed')
    })
})
```

### **Command Execution Testing**

```typescript
describe('Command Execution', () => {
    it('should execute command with active editor', async () => {
        const mockUri = { fsPath: '/test/file.json' }
        mocks.vscode.window.activeTextEditor = {
            document: { uri: mockUri },
        }

        await formatPackageJsonCommand(mockUri)

        expect(mocks.vscode.window.showInformationMessage).toHaveBeenCalledWith(
            expect.stringContaining('Package.json formatted successfully')
        )
    })

    it('should handle command with no active editor', async () => {
        mocks.vscode.window.activeTextEditor = undefined

        await formatPackageJsonCommand()

        expect(mocks.vscode.window.showErrorMessage).toHaveBeenCalledWith('No active file selected')
    })
})
```

### **VSCode API Integration Testing**

```typescript
describe('VSCode API Integration', () => {
    it('should show success messages', async () => {
        mocks.vscode.window.showInformationMessage.mockResolvedValue('OK')

        await showSuccessMessage('Operation completed')

        expect(mocks.vscode.window.showInformationMessage).toHaveBeenCalledWith(
            'Operation completed',
            'OK'
        )
    })

    it('should show error messages', async () => {
        mocks.vscode.window.showErrorMessage.mockResolvedValue('OK')

        await showErrorMessage('Operation failed')

        expect(mocks.vscode.window.showErrorMessage).toHaveBeenCalledWith('Operation failed', 'OK')
    })
})
```

## **INTEGRATION TESTING REQUIREMENTS**

### **Integration Test Configuration**

- **Location**: `packages/{feature}/ext/__tests__/integration-tests/`
- **Framework**: VSCode Test CLI
- **Build Dependency**: Uses `build` (production bundle)
- **Environment**: Full VSCode test environment

### **Integration Test Patterns**

```typescript
// Integration test example
describe('Extension Integration', () => {
    it('should create backup via context menu', async () => {
        // Test actual VSCode extension behavior
        const result = await vscode.commands.executeCommand('fux-project-butler.createBackup')
        expect(result).toBeUndefined()
    })

    it('should format package.json via command palette', async () => {
        // Test command palette execution
        const result = await vscode.commands.executeCommand('fux-project-butler.formatPackageJson')
        expect(result).toBeUndefined()
    })
})
```

## **EXTENSION TESTING COMMAND EXECUTION**

### **PAE Aliases for Extension Packages**

- **MANDATORY**: `pae {feature-ext} b` → Build extension (production)
- **MANDATORY**: `pae {feature-ext} bd` → Build extension (development)
- **MANDATORY**: `pae {feature-ext} t` → Test extension unit tests (uses build:dev)
- **MANDATORY**: `pae {feature-ext} tc` → Test extension with coverage (uses build:dev)
- **MANDATORY**: `pae {feature-ext} ti` → Test extension integration (uses build)

### **EXTENSION Testing Workflow**

1. **Setup**: Use `setupExtTestEnvironment()` and `resetExtMocks()`
2. **Mock**: Use extension-specific mock patterns
3. **Test**: Implement comprehensive extension coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods
6. **Integrate**: Run integration tests with production build

## **EXTENSION-SPECIFIC ANTI-PATTERNS**

### **Extension Testing Violations**

- ❌ Business logic in extension tests (belongs in core)
- ❌ Testing implementation details instead of behavior
- ❌ Using real VSCode instances in unit tests
- ❌ Non-deterministic test data
- ❌ Incomplete mock coverage
- ❌ Skipping VSCode API testing
- ❌ **Missing folding markers** in test files
- ❌ **Inconsistent test file organization** without proper folding structure
- ❌ Integration tests using build:dev instead of build

### **EXTENSION Mock Violations**

- ❌ Not using `@fux/mock-strategy/ext` functions
- ❌ Inconsistent mock patterns across extension tests
- ❌ Hardcoded mock values
- ❌ Missing mock cleanup
- ❌ Over-mocking extension functionality
- ❌ Not mocking VSCode APIs properly

## **EXTENSION TESTING QUALITY GATES**

### **Quality Gates Checklist**

- [ ] All extension activation paths tested
- [ ] All command registrations tested
- [ ] All adapter implementations tested
- [ ] Core integration tested
- [ ] Error handling scenarios tested
- [ ] VSCode API interactions tested
- [ ] Integration tests use production build
- [ ] Mock strategy follows documented approach
- [ ] Test isolation maintained (no test interference)
- [ ] Coverage tests target specific uncovered lines
- [ ] **Test files use folding markers** (`//>` `//<` for it blocks and beforeEach/afterEach, `// SETUP ----------------->>` and `//----------------------------------------------------<<` for setup sections)
- [ ] **Setup sections properly wrapped** with `// SETUP ----------------->>` and `//----------------------------------------------------<<`

### **Quality Gates**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No anti-patterns detected
- [ ] Mock strategy follows documented approach
- [ ] Test organization follows established patterns
- [ ] Documentation alignment verified

## **EXTENSION TESTING SUCCESS METRICS**

After implementing proper extension testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across extension packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)
- ✅ **Reliable VSCode integration** (proper extension testing)

## **EXTENSION TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Business logic in extension → "This belongs in core"
- **MANDATORY**: Core logic in extension tests → "Test core separately"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"
- **MANDATORY**: Missing folding markers → "Add folding markers for test organization"
- **MANDATORY**: Integration tests using wrong build → "Use build for integration, build:dev for unit tests"

### **Pattern Recognition**

- Extension path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Extension package type verification
- Mock strategy compliance verification
- Test coverage validation
- Anti-pattern violation detection
- Build dependency verification (dev vs prod)

### **HIGH PRIORITY (Execute before proceeding)**

- Test execution and validation
- Build error resolution
- Pattern compliance verification
- Tool usage verification

### **MEDIUM PRIORITY (Execute during normal operation)**

- Documentation updates
- Pattern recognition
- Performance measurement
- Status reporting

### **LOW PRIORITY (Execute when time permits)**

- Process improvements
- Pattern documentation
- Lesson sharing
- Future planning

## **DYNAMIC MANAGEMENT NOTE**

This document is optimized for AI internal processing and may be updated dynamically based on operational needs and pattern recognition. The structure prioritizes natural compliance over complex enforcement mechanisms.
