# (AI) Strategy - Specific Utilities

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

**AI Agent Directive**: Follow this protocol exactly for all utility package testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **UTILITY PACKAGE TESTING REQUIREMENTS**

### **Utility Package Definition**

- **Location**: `libs/tools/{name}/` or `utilities/{name}/`
- **Purpose**: Standalone utility functions, command-line tools, helper functions
- **Format**: ESM modules
- **Dependencies**: Minimal external dependencies
- **Testing Focus**: Utility function testing, command-line interface testing, helper function testing

### **Utility Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `libs/tools/{name}/__tests__/functional-tests/` or `utilities/{name}/__tests__/functional-tests/`
- **Mock Strategy**: Use utility-specific mock patterns
- **Coverage**: 100% coverage for public methods

## **UTILITY TESTING PATTERNS**

### **Utility Function Testing Pattern**

```typescript
import { setupUtilityTestEnvironment, resetUtilityMocks } from '../../__mocks__/helpers.js'

describe('Utility Function', () => {
    let mocks: Awaited<ReturnType<typeof setupUtilityTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupUtilityTestEnvironment()
        await resetUtilityMocks(mocks)
    })

    it('should execute utility function correctly', () => {
        // Test utility function
    })
})
```

### **Command-Line Interface Testing Pattern**

```typescript
import { setupUtilityTestEnvironment, resetUtilityMocks } from '../../__mocks__/helpers.js'

describe('Command-Line Interface', () => {
    let mocks: Awaited<ReturnType<typeof setupUtilityTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupUtilityTestEnvironment()
        await resetUtilityMocks(mocks)
    })

    it('should execute CLI command correctly', () => {
        // Test CLI functionality
    })
})
```

### **Helper Function Testing Pattern**

```typescript
import { setupUtilityTestEnvironment, resetUtilityMocks } from '../../__mocks__/helpers.js'

describe('Helper Function', () => {
    let mocks: Awaited<ReturnType<typeof setupUtilityTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupUtilityTestEnvironment()
        await resetUtilityMocks(mocks)
    })

    it('should execute helper function correctly', () => {
        // Test helper function
    })
})
```

## **UTILITY-SPECIFIC MOCKING REQUIREMENTS**

### **Utility Mocking**

- **Use**: Utility-specific mock patterns
- **Scope**: Utility function mocking patterns
- **Integration**: Works with utility mocks
- **Focus**: Utility behavior simulation

### **Utility Mock Patterns**

```typescript
// Utility mock setup
const mocks = await setupUtilityTestEnvironment()

// Utility mock reset
await resetUtilityMocks(mocks)

// Utility mock usage
mocks.utility.processData.mockReturnValue(processedData)
mocks.utility.executeCommand.mockResolvedValue(commandResult)
```

## **UTILITY TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Utility Functions**: Test all utility functions
2. **Command-Line Interface**: Test CLI functionality and argument parsing
3. **Helper Functions**: Test helper functions and utilities
4. **Error Handling**: Test utility-specific error scenarios
5. **Configuration**: Test utility configuration handling
6. **Output Generation**: Test utility output generation

### **Coverage Organization**

```typescript
describe('UtilityName', () => {
    describe('Utility Functions', () => {
        it('should execute utility function correctly', () => {
            // Test utility function
        })
    })

    describe('Command-Line Interface', () => {
        it('should execute CLI command correctly', () => {
            // Test CLI functionality
        })

        it('should handle CLI errors', () => {
            // Test CLI error handling
        })
    })

    describe('Helper Functions', () => {
        it('should execute helper function correctly', () => {
            // Test helper function
        })

        it('should handle helper function errors', () => {
            // Test helper function error handling
        })
    })

    describe('Error Handling', () => {
        it('should handle utility-specific errors', () => {
            // Test error scenarios
        })
    })
})
```

## **UTILITY-SPECIFIC TESTING SCENARIOS**

### **Utility Functions**

```typescript
describe('Utility Functions', () => {
    it('should execute utility function successfully', () => {
        mocks.utility.processData.mockReturnValue(processedData)

        const result = utility.processData(inputData)

        expect(result).toEqual(processedData)
        expect(mocks.utility.processData).toHaveBeenCalledWith(inputData)
    })

    it('should handle utility function errors', () => {
        mocks.utility.processData.mockImplementation(() => {
            throw new Error('Utility error')
        })

        expect(() => utility.processData(inputData)).toThrow('Utility error')
    })
})
```

### **Command-Line Interface**

```typescript
describe('Command-Line Interface', () => {
    it('should execute CLI command correctly', () => {
        mocks.utility.executeCommand.mockResolvedValue(commandResult)

        const result = utility.executeCommand(command, args)

        expect(result).toEqual(commandResult)
        expect(mocks.utility.executeCommand).toHaveBeenCalledWith(command, args)
    })

    it('should handle CLI command errors', () => {
        mocks.utility.executeCommand.mockRejectedValue(new Error('CLI error'))

        expect(() => utility.executeCommand(command, args)).rejects.toThrow('CLI error')
    })
})
```

### **Helper Functions**

```typescript
describe('Helper Functions', () => {
    it('should execute helper function correctly', () => {
        mocks.utility.helperFunction.mockReturnValue(helperResult)

        const result = utility.helperFunction(input)

        expect(result).toEqual(helperResult)
        expect(mocks.utility.helperFunction).toHaveBeenCalledWith(input)
    })

    it('should handle helper function errors', () => {
        mocks.utility.helperFunction.mockImplementation(() => {
            throw new Error('Helper error')
        })

        expect(() => utility.helperFunction(input)).toThrow('Helper error')
    })
})
```

## **UTILITY TESTING COMMAND EXECUTION**

### **PAE Aliases for Utilities**

- **MANDATORY**: `pae {utility-name} b` → Build utility
- **MANDATORY**: `pae {utility-name} t` → Test utility (fast)
- **MANDATORY**: `pae {utility-name} tc` → Test utility with coverage
- **MANDATORY**: `pae {utility-name} tcw` → Test utility with coverage (watch)

### **Utility Testing Workflow**

1. **Setup**: Use `setupUtilityTestEnvironment()` and `resetUtilityMocks()`
2. **Mock**: Use utility-specific mock patterns
3. **Test**: Implement comprehensive test coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **UTILITY-SPECIFIC ANTI-PATTERNS**

### **Utility Testing Violations**

- ❌ Testing utility logic without mocking
- ❌ Not mocking utility function calls
- ❌ Using real utility calls in tests
- ❌ Non-deterministic test data
- ❌ Incomplete utility mock coverage
- ❌ Skipping utility function testing

### **Utility Mock Violations**

- ❌ Not using utility-specific mock patterns
- ❌ Inconsistent mock patterns across utility tests
- ❌ Hardcoded utility responses
- ❌ Missing utility mock cleanup
- ❌ Over-mocking utility functionality

## **UTILITY TESTING SUCCESS METRICS**

After implementing proper utility testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across utility packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **UTILITY TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Utility logic not mocked → "Mock utility function calls"
- **MANDATORY**: Utility functionality not tested → "Test utility functionality"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"

### **Pattern Recognition**

- Utility path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Utility package type verification
- Utility mock compliance verification
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
