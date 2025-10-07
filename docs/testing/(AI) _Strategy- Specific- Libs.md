# (AI) Strategy - Specific Libs

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
- **AI_TROUBLESHOOTING**: `docs/testing/(AI) _Troubleshooting- Base.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all library package testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **LIBRARY PACKAGE TESTING REQUIREMENTS**

### **Library Package Definition**

- **Location**: `libs/{name}/` or `libs/tools/{name}/`
- **Purpose**: In-repo utilities, cross-package functionality, standalone tools
- **Format**: ESM modules
- **Dependencies**: No VSCode dependencies
- **Testing Focus**: Pure functions, utility logic, external dependency integration

### **Library Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `libs/{name}/__tests__/functional-tests/`
- **Mock Strategy**: Use `@fux/mock-strategy/lib` functions
- **Coverage**: 100% coverage for public methods

## **MANDATORY: FOLDING MARKERS**

**CRITICAL**: All library test files must use folding markers. See **AI_TESTING_BASE** for complete folding marker documentation and examples.

### **Quick Reference**

- **Setup variables**: Wrap with `// SETUP ----------------->>` and `//----------------------------------------------------<<`
- **`beforeEach`/`afterEach`**: Wrap with `//>` and `//<`
- **`it` blocks**: Wrap with `//>` and `//<`
- **Space requirement**: All folding markers must be preceded by a space

## **LIBRARY TESTING PATTERNS**

### **Service Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'

describe('ServiceName', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)
    }) //<

    it('should perform expected action', async () => {
        //>
        // Test implementation
    }) //<
})
```

### **Utility Function Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'

describe('UtilityFunction', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)
    }) //<

    it('should process input correctly', () => {
        //>
        // Test utility function
    }) //<
})
```

### **Configuration Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'

describe('Configuration Loading', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)
    }) //<

    it('should load valid configuration', () => {
        //>
        // Test configuration loading
    }) //<

    it('should handle invalid configuration', () => {
        //>
        // Test error handling
    }) //<
})
```

## **LIBRARY-SPECIFIC MOCKING REQUIREMENTS**

### **Library Mock Strategy**

- **Use**: `setupLibTestEnvironment()` and `resetLibMocks()` from `@fux/mock-strategy/lib`
- **Interface**: `LibTestMocks` interface
- **Scope**: Library-specific mocking patterns
- **Integration**: Works with global mocks

### **Library Mock Patterns**

```typescript
// Library-specific mock setup
const mocks = await setupLibTestEnvironment()

// Library-specific mock reset
await resetLibMocks(mocks)

// Library-specific mock usage
mocks.fileSystem.readFile.mockResolvedValue('content')
mocks.process.spawn.mockReturnValue({ status: 0 })
```

## **LIBRARY TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Public Service Methods**: All public methods must be tested
2. **Configuration Loading**: Test configuration loading and validation
3. **Error Handling**: Test all error scenarios and edge cases
4. **External Dependencies**: Test integration with external dependencies
5. **Utility Functions**: Test all utility functions and helpers
6. **Edge Cases**: Test boundary conditions and edge cases

### **Coverage Organization**

```typescript
describe('ServiceName', () => {
    describe('Public Methods', () => {
        it('should execute method successfully', () => {
            // Test successful execution
        })

        it('should handle method errors', () => {
            // Test error handling
        })
    })

    describe('Configuration', () => {
        it('should load valid configuration', () => {
            // Test configuration loading
        })

        it('should validate configuration', () => {
            // Test configuration validation
        })
    })

    describe('Error Handling', () => {
        it('should handle specific error condition', () => {
            // Test error scenario
        })
    })

    describe('Edge Cases', () => {
        it('should handle boundary conditions', () => {
            // Test edge cases
        })
    })
})
```

## **LIBRARY-SPECIFIC TESTING SCENARIOS**

### **File System Operations**

```typescript
describe('File System Operations', () => {
    it('should read file successfully', async () => {
        mocks.fileSystem.readFile.mockResolvedValue('file content')

        const result = await service.readFile('path/to/file')

        expect(result).toBe('file content')
        expect(mocks.fileSystem.readFile).toHaveBeenCalledWith('path/to/file')
    })

    it('should handle file read errors', async () => {
        mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))

        await expect(service.readFile('nonexistent/file')).rejects.toThrow('File not found')
    })
})
```

### **Process Execution**

```typescript
describe('Process Execution', () => {
    it('should execute command successfully', async () => {
        mocks.process.spawn.mockReturnValue({ status: 0, output: 'success' })

        const result = await service.executeCommand('test-command')

        expect(result.status).toBe(0)
        expect(mocks.process.spawn).toHaveBeenCalledWith('test-command')
    })

    it('should handle command failures', async () => {
        mocks.process.spawn.mockReturnValue({ status: 1, error: 'Command failed' })

        const result = await service.executeCommand('failing-command')

        expect(result.status).toBe(1)
        expect(result.error).toBe('Command failed')
    })
})
```

### **Data Processing**

```typescript
describe('Data Processing', () => {
    it('should process data correctly', () => {
        const input = { data: 'test' }
        const expected = { processed: 'test' }

        const result = service.processData(input)

        expect(result).toEqual(expected)
    })

    it('should handle invalid data', () => {
        expect(() => service.processData(null)).toThrow('Invalid input')
    })
})
```

## **LIBRARY TESTING COMMAND EXECUTION**

### **PAE Aliases for Libraries**

- **MANDATORY**: `pae {lib-name} b` → Build library
- **MANDATORY**: `pae {lib-name} t` → Test library (fast)
- **MANDATORY**: `pae {lib-name} tc` → Test library with coverage
- **MANDATORY**: `pae {lib-name} tcw` → Test library with coverage (watch)

### **Library Testing Workflow**

1. **Setup**: Use `setupLibTestEnvironment()` and `resetLibMocks()`
2. **Mock**: Use library-specific mock patterns
3. **Test**: Implement comprehensive test coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **LIBRARY-SPECIFIC ANTI-PATTERNS**

### **Library Testing Violations**

- ❌ VSCode mocking in library tests
- ❌ Testing implementation details instead of behavior
- ❌ Using real external APIs in tests
- ❌ Non-deterministic test data
- ❌ Incomplete mock coverage
- ❌ Skipping error scenario testing
- ❌ **Missing folding markers** in test files
- ❌ **Inconsistent test file organization** without proper folding structure

### **Library Mock Violations**

- ❌ Not using `@fux/mock-strategy/lib` functions
- ❌ Inconsistent mock patterns across library tests
- ❌ Hardcoded mock values
- ❌ Missing mock cleanup
- ❌ Over-mocking library functionality

## **LIBRARY TESTING QUALITY GATES**

### **Quality Gates Checklist**

- [ ] All public service methods tested
- [ ] Configuration loading and validation tested
- [ ] Error handling scenarios tested
- [ ] Edge cases and boundary conditions tested
- [ ] External dependency integration tested
- [ ] Mock strategy follows documented approach
- [ ] Test isolation maintained (no test interference)
- [ ] Coverage tests target specific uncovered lines
- [ ] **Test files use folding markers** (`//>` `//<` for it blocks and beforeEach/afterEach, `// SETUP ----------------->>` and `//----------------------------------------------------<<` for setup sections)
- [ ] **Setup sections properly wrapped** with `// SETUP ----------------->>` and `//----------------------------------------------------<<`

### **Quality Gates**

- [ ] All tests pass
- [ ] No anti-patterns detected
- [ ] Mock strategy follows documented approach
- [ ] Test organization follows established patterns
- [ ] Documentation alignment verified

## **LIBRARY TESTING SUCCESS METRICS**

After implementing proper library testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across library packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **LIBRARY TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: VSCode imports in library → "This belongs in extension"
- **MANDATORY**: Business logic in library → "This belongs in core"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"
- **MANDATORY**: Missing folding markers → "Add folding markers for test organization"

### **Pattern Recognition**

- Library path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Library package type verification
- Mock strategy compliance verification
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
