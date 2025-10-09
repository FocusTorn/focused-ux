# (AI) Strategy - Specific Core

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

**AI Agent Directive**: Follow this protocol exactly for all core package testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **CORE PACKAGE TESTING REQUIREMENTS**

### **Core Package Definition**

- **Location**: `packages/{feature}/core/`
- **Purpose**: Pure business logic, self-contained feature implementation
- **Format**: ESM modules
- **Dependencies**: No VSCode value imports (type imports only)
- **Testing Focus**: Business logic, service methods, pure functions, data processing

### **Core Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `packages/{feature}/core/__tests__/functional-tests/`
- **Mock Strategy**: Use `@fux/mock-strategy/lib` functions
- **Coverage**: 100% coverage for public methods
- **Build Dependencies**: Tests depend on `build` (unbundled, with sourcemaps)

## **MANDATORY: FOLDING MARKERS**

**CRITICAL**: All core test files must use folding markers. See **AI_TESTING_BASE** for complete folding marker documentation and examples.

### **Quick Reference**

- **Setup variables**: Wrap with `// SETUP ----------------->>` and `//----------------------------------------------------<<`
- **`beforeEach`/`afterEach`**: Wrap with `//>` and `//<`
- **`it` blocks**: Wrap with `//>` and `//<`
- **Space requirement**: All folding markers must be preceded by a space

## **CORE TESTING PATTERNS**

### **Service Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'
import { ServiceName } from '../src/services/ServiceName.js'

describe('ServiceName', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    let service: ServiceName
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)

        service = new ServiceName(mocks.fileSystem, mocks.path)
    }) //<

    it('should execute business logic successfully', async () => {
        //>
        const mockData = { input: 'test' }
        mocks.fileSystem.readFile.mockResolvedValue(JSON.stringify(mockData))

        const result = await service.processBusinessLogic('path/to/data')

        expect(result).toBeDefined()
        expect(mocks.fileSystem.readFile).toHaveBeenCalledWith('path/to/data')
    }) //<

    it('should handle business logic errors', async () => {
        //>
        mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))

        await expect(service.processBusinessLogic('nonexistent')).rejects.toThrow('File not found')
    }) //<
})
```

### **Manager Service Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'
import { ManagerService } from '../src/services/ManagerService.js'

describe('ManagerService', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    let manager: ManagerService
    let subService1: any
    let subService2: any
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)

        subService1 = new SubService1(mocks.fileSystem)
        subService2 = new SubService2(mocks.path)
        manager = new ManagerService({
            subService1,
            subService2,
        })
    }) //<

    it('should orchestrate multiple services', async () => {
        //>
        const input = { data: 'test' }
        subService1.process.mockResolvedValue({ processed: true })
        subService2.validate.mockResolvedValue({ valid: true })

        const result = await manager.orchestrate(input)

        expect(result).toEqual({ processed: true, valid: true })
        expect(subService1.process).toHaveBeenCalledWith(input)
        expect(subService2.validate).toHaveBeenCalledWith(input)
    }) //<
})
```

### **Data Processing Testing Pattern**

```typescript
import { setupLibTestEnvironment, resetLibMocks } from '@fux/mock-strategy/lib'
import { DataProcessor } from '../src/services/DataProcessor.js'

describe('DataProcessor', () => {
    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupLibTestEnvironment>>
    let processor: DataProcessor
    //----------------------------------------------------<<

    beforeEach(async () => {
        //>
        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)

        processor = new DataProcessor(mocks.yaml)
    }) //<

    it('should process valid data', () => {
        //>
        const input = { name: 'test', value: 123 }
        const expected = { name: 'test', value: 123, processed: true }

        const result = processor.processData(input)

        expect(result).toEqual(expected)
    }) //<

    it('should validate data structure', () => {
        //>
        const invalidInput = { name: null }

        expect(() => processor.processData(invalidInput)).toThrow('Invalid data structure')
    }) //<
})
```

## **CORE-SPECIFIC MOCKING REQUIREMENTS**

### **CORE Mock Strategy**

- **Use**: `setupLibTestEnvironment()` and `resetLibMocks()` from `@fux/mock-strategy/lib`
- **Interface**: `LibTestMocks` interface
- **Scope**: Core-specific mocking patterns
- **Integration**: Works with global mocks

### **CORE Mock Patterns**

```typescript
// Core-specific mock setup
const mocks = await setupLibTestEnvironment()

// Core-specific mock reset
await resetLibMocks(mocks)

// Core-specific mock usage
mocks.fileSystem.readFile.mockResolvedValue('content')
mocks.yaml.parse.mockReturnValue({ parsed: 'data' })
mocks.path.join.mockReturnValue('joined/path')
```

### **VSCode Type Import Mocking**

```typescript
// For VSCode type imports (NOT value imports)
import type { Uri } from 'vscode'

// Mock VSCode types when needed for testing
const mockUri = {
    fsPath: '/test/path',
    scheme: 'file',
} as unknown as Uri
```

## **CORE TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Public Service Methods**: All public methods must be tested
2. **Business Logic**: Test all business logic paths and decision trees
3. **Data Processing**: Test data transformation and validation
4. **Error Handling**: Test all error scenarios and edge cases
5. **Service Integration**: Test service-to-service communication
6. **Configuration Handling**: Test configuration loading and validation
7. **Pure Functions**: Test all utility functions and helpers

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

    describe('Business Logic', () => {
        it('should process valid input', () => {
            // Test business logic
        })

        it('should handle invalid input', () => {
            // Test input validation
        })
    })

    describe('Data Processing', () => {
        it('should transform data correctly', () => {
            // Test data transformation
        })

        it('should validate data structure', () => {
            // Test data validation
        })
    })

    describe('Error Handling', () => {
        it('should handle specific error condition', () => {
            // Test error scenario
        })
    })

    describe('Service Integration', () => {
        it('should integrate with other services', () => {
            // Test service communication
        })
    })
})
```

## **CORE-SPECIFIC TESTING SCENARIOS**

### **Business Logic Testing**

```typescript
describe('Business Logic', () => {
    it('should execute complex business rules', async () => {
        const input = { type: 'premium', amount: 1000 }
        const expected = { type: 'premium', amount: 1000, discount: 0.1 }

        const result = await service.processBusinessRules(input)

        expect(result).toEqual(expected)
    })

    it('should handle business rule violations', async () => {
        const invalidInput = { type: 'invalid', amount: -100 }

        await expect(service.processBusinessRules(invalidInput)).rejects.toThrow(
            'Invalid business rule'
        )
    })
})
```

### **Data Validation Testing**

```typescript
describe('Data Validation', () => {
    it('should validate required fields', () => {
        const validData = { name: 'test', email: 'test@example.com' }

        expect(service.validateData(validData)).toBe(true)
    })

    it('should reject invalid data', () => {
        const invalidData = { name: '', email: 'invalid-email' }

        expect(() => service.validateData(invalidData)).toThrow('Validation failed')
    })
})
```

### **Service Communication Testing**

```typescript
describe('Service Communication', () => {
    it('should coordinate between services', async () => {
        const mockSubService1 = vi.fn().mockResolvedValue({ processed: true })
        const mockSubService2 = vi.fn().mockResolvedValue({ validated: true })

        service.setSubServices(mockSubService1, mockSubService2)

        const result = await service.coordinateServices('input')

        expect(mockSubService1).toHaveBeenCalledWith('input')
        expect(mockSubService2).toHaveBeenCalledWith('input')
        expect(result).toEqual({ processed: true, validated: true })
    })
})
```

## **CORE TESTING COMMAND EXECUTION**

### **PAE Aliases for Core Packages**

- **MANDATORY**: `pae {feature-core} b` → Build core package
- **MANDATORY**: `pae {feature-core} t` → Test core package (fast)
- **MANDATORY**: `pae {feature-core} tc` → Test core package with coverage
- **MANDATORY**: `pae {feature-core} tcw` → Test core package with coverage (watch)

### **CORE Testing Workflow**

1. **Setup**: Use `setupLibTestEnvironment()` and `resetLibMocks()`
2. **Mock**: Use core-specific mock patterns
3. **Test**: Implement comprehensive business logic coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **CORE-SPECIFIC ANTI-PATTERNS**

### **Core Testing Violations**

- ❌ VSCode value imports in core tests
- ❌ Testing implementation details instead of behavior
- ❌ Using real external APIs in tests
- ❌ Non-deterministic test data
- ❌ Incomplete mock coverage
- ❌ Skipping business logic testing
- ❌ **Missing folding markers** in test files
- ❌ **Inconsistent test file organization** without proper folding structure
- ❌ Testing VSCode-specific functionality (belongs in ext)

### **CORE Mock Violations**

- ❌ Not using `@fux/mock-strategy/lib` functions
- ❌ Inconsistent mock patterns across core tests
- ❌ Hardcoded mock values
- ❌ Missing mock cleanup
- ❌ Over-mocking core functionality
- ❌ Mocking VSCode value imports (use type imports only)

## **CORE TESTING QUALITY GATES**

### **Quality Gates Checklist**

- [ ] All public service methods tested
- [ ] Business logic paths tested
- [ ] Data processing and validation tested
- [ ] Error handling scenarios tested
- [ ] Service integration tested
- [ ] Configuration handling tested
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
- [ ] No VSCode value imports detected

## **CORE TESTING SUCCESS METRICS**

After implementing proper core testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across core packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)
- ✅ **Pure business logic testing** (no VSCode dependencies)

## **CORE TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: VSCode value imports in core → "Use type imports only"
- **MANDATORY**: Extension logic in core → "This belongs in ext"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"
- **MANDATORY**: Missing folding markers → "Add folding markers for test organization"

### **Pattern Recognition**

- Core path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Core package type verification
- Mock strategy compliance verification
- Test coverage validation
- Anti-pattern violation detection
- VSCode import compliance verification

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
