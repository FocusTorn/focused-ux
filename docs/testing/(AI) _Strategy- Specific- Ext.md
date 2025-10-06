# (AI) Strategy - Specific Ext

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/_Troubleshooting - Tests.md`

### **AI Testing Documentation References**

- **AI_TESTING_BASE**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **AI_MOCKING_BASE**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **AI_TROUBLESHOOTING**: `docs/testing/(AI) _Troubleshooting- Tests.md`

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
- **Purpose**: VSCode wrapper, CJS bundle
- **Format**: CJS modules
- **Dependencies**: VSCode API integration
- **Testing Focus**: VSCode API integration, extension lifecycle, wrapper functionality

### **Extension Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `packages/{feature}/ext/__tests__/functional-tests/`
- **Mock Strategy**: Use VSCode API mocking patterns
- **Coverage**: 100% coverage for public methods

## **EXTENSION TESTING PATTERNS**

### **VSCode API Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '../../__mocks__/helpers.js'

describe('VSCode API Integration', () => {
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)
    })

    it('should integrate with VSCode API', async () => {
        // Test VSCode API integration
    })
})
```

### **Extension Lifecycle Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '../../__mocks__/helpers.js'

describe('Extension Lifecycle', () => {
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)
    })

    it('should activate extension successfully', () => {
        // Test extension activation
    })

    it('should deactivate extension properly', () => {
        // Test extension deactivation
    })
})
```

### **Wrapper Functionality Testing Pattern**

```typescript
import { setupExtTestEnvironment, resetExtMocks } from '../../__mocks__/helpers.js'

describe('Wrapper Functionality', () => {
    let mocks: Awaited<ReturnType<typeof setupExtTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtTestEnvironment()
        await resetExtMocks(mocks)
    })

    it('should wrap core functionality', () => {
        // Test wrapper functionality
    })
})
```

## **EXTENSION-SPECIFIC MOCKING REQUIREMENTS**

### **VSCode API Mocking**

- **Use**: VSCode API mock patterns
- **Scope**: VSCode-specific mocking patterns
- **Integration**: Works with core package mocks
- **Focus**: VSCode API behavior simulation

### **Extension Mock Patterns**

```typescript
// VSCode API mock setup
const mocks = await setupExtTestEnvironment()

// VSCode API mock reset
await resetExtMocks(mocks)

// VSCode API mock usage
mocks.vscode.window.showInformationMessage.mockResolvedValue('User clicked OK')
mocks.vscode.workspace.getConfiguration.mockReturnValue(mockConfig)
```

## **EXTENSION TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **VSCode API Integration**: Test all VSCode API interactions
2. **Extension Lifecycle**: Test activation, deactivation, and lifecycle events
3. **Wrapper Functionality**: Test wrapper methods and core integration
4. **Error Handling**: Test VSCode-specific error scenarios
5. **Configuration**: Test VSCode configuration integration
6. **User Interface**: Test VSCode UI interactions

### **Coverage Organization**

```typescript
describe('ExtensionName', () => {
    describe('VSCode API Integration', () => {
        it('should integrate with VSCode API', () => {
            // Test VSCode API integration
        })
    })

    describe('Extension Lifecycle', () => {
        it('should activate extension', () => {
            // Test extension activation
        })

        it('should deactivate extension', () => {
            // Test extension deactivation
        })
    })

    describe('Wrapper Functionality', () => {
        it('should wrap core functionality', () => {
            // Test wrapper functionality
        })
    })

    describe('Error Handling', () => {
        it('should handle VSCode-specific errors', () => {
            // Test error scenarios
        })
    })
})
```

## **EXTENSION-SPECIFIC TESTING SCENARIOS**

### **VSCode API Interactions**

```typescript
describe('VSCode API Interactions', () => {
    it('should show information message', async () => {
        mocks.vscode.window.showInformationMessage.mockResolvedValue('User clicked OK')

        const result = await extension.showMessage('Test message')

        expect(result).toBe('User clicked OK')
        expect(mocks.vscode.window.showInformationMessage).toHaveBeenCalledWith('Test message')
    })

    it('should handle VSCode API errors', async () => {
        mocks.vscode.window.showInformationMessage.mockRejectedValue(new Error('VSCode API error'))

        await expect(extension.showMessage('Test message')).rejects.toThrow('VSCode API error')
    })
})
```

### **Extension Lifecycle Events**

```typescript
describe('Extension Lifecycle Events', () => {
    it('should handle extension activation', () => {
        mocks.vscode.extensions.getExtension.mockReturnValue(mockExtension)

        const result = extension.activate()

        expect(result).toBe(true)
        expect(mocks.vscode.extensions.getExtension).toHaveBeenCalled()
    })

    it('should handle extension deactivation', () => {
        extension.deactivate()

        expect(mocks.vscode.extensions.getExtension).toHaveBeenCalled()
    })
})
```

### **Configuration Integration**

```typescript
describe('Configuration Integration', () => {
    it('should read VSCode configuration', () => {
        mocks.vscode.workspace.getConfiguration.mockReturnValue(mockConfig)

        const config = extension.getConfiguration()

        expect(config).toEqual(mockConfig)
        expect(mocks.vscode.workspace.getConfiguration).toHaveBeenCalled()
    })

    it('should handle configuration errors', () => {
        mocks.vscode.workspace.getConfiguration.mockImplementation(() => {
            throw new Error('Configuration error')
        })

        expect(() => extension.getConfiguration()).toThrow('Configuration error')
    })
})
```

## **EXTENSION TESTING COMMAND EXECUTION**

### **PAE Aliases for Extensions**

- **MANDATORY**: `pae {ext-name} b` → Build extension
- **MANDATORY**: `pae {ext-name} t` → Test extension (fast)
- **MANDATORY**: `pae {ext-name} tc` → Test extension with coverage
- **MANDATORY**: `pae {ext-name} tcw` → Test extension with coverage (watch)

### **Extension Testing Workflow**

1. **Setup**: Use `setupExtTestEnvironment()` and `resetExtMocks()`
2. **Mock**: Use VSCode API mock patterns
3. **Test**: Implement comprehensive test coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **EXTENSION-SPECIFIC ANTI-PATTERNS**

### **Extension Testing Violations**

- ❌ Testing business logic in extension tests
- ❌ Not mocking VSCode API calls
- ❌ Using real VSCode API in tests
- ❌ Non-deterministic test data
- ❌ Incomplete VSCode API mock coverage
- ❌ Skipping extension lifecycle testing

### **Extension Mock Violations**

- ❌ Not using VSCode API mock patterns
- ❌ Inconsistent mock patterns across extension tests
- ❌ Hardcoded VSCode API responses
- ❌ Missing VSCode API mock cleanup
- ❌ Over-mocking extension functionality

## **EXTENSION TESTING SUCCESS METRICS**

After implementing proper extension testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across extension packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **EXTENSION TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Business logic in extension → "This belongs in core"
- **MANDATORY**: VSCode API not mocked → "Mock VSCode API calls"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"

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
- VSCode API mock compliance verification
- Test coverage validation
- Anti-pattern violation detection

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
