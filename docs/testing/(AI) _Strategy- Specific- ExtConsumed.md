# (AI) Strategy - Specific ExtConsumed

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

**AI Agent Directive**: Follow this protocol exactly for all extension consumption testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **EXTENSION CONSUMPTION TESTING REQUIREMENTS**

### **Extension Consumption Definition**

- **Location**: `packages/{feature}/core/` consuming `packages/{feature}/ext/`
- **Purpose**: Testing core package consumption of extension functionality
- **Format**: ESM modules consuming CJS bundles
- **Dependencies**: Core-ext integration testing
- **Testing Focus**: Extension consumption patterns, asset processing, core-ext integration

### **Extension Consumption Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `packages/{feature}/core/__tests__/functional-tests/`
- **Mock Strategy**: Use extension consumption mock patterns
- **Coverage**: 100% coverage for public methods

## **EXTENSION CONSUMPTION TESTING PATTERNS**

### **Core-Ext Integration Testing Pattern**

```typescript
import { setupExtConsumedTestEnvironment, resetExtConsumedMocks } from '../../__mocks__/helpers.js'

describe('Core-Ext Integration', () => {
    let mocks: Awaited<ReturnType<typeof setupExtConsumedTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtConsumedTestEnvironment()
        await resetExtConsumedMocks(mocks)
    })

    it('should consume extension functionality', async () => {
        // Test core-ext integration
    })
})
```

### **Asset Processing Testing Pattern**

```typescript
import { setupExtConsumedTestEnvironment, resetExtConsumedMocks } from '../../__mocks__/helpers.js'

describe('Asset Processing', () => {
    let mocks: Awaited<ReturnType<typeof setupExtConsumedTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtConsumedTestEnvironment()
        await resetExtConsumedMocks(mocks)
    })

    it('should process extension assets', () => {
        // Test asset processing
    })
})
```

### **Extension Consumption Testing Pattern**

```typescript
import { setupExtConsumedTestEnvironment, resetExtConsumedMocks } from '../../__mocks__/helpers.js'

describe('Extension Consumption', () => {
    let mocks: Awaited<ReturnType<typeof setupExtConsumedTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupExtConsumedTestEnvironment()
        await resetExtConsumedMocks(mocks)
    })

    it('should consume extension methods', () => {
        // Test extension consumption
    })
})
```

## **EXTENSION CONSUMPTION-SPECIFIC MOCKING REQUIREMENTS**

### **Extension Consumption Mocking**

- **Use**: Extension consumption mock patterns
- **Scope**: Core-ext integration mocking patterns
- **Integration**: Works with extension mocks
- **Focus**: Extension consumption behavior simulation

### **Extension Consumption Mock Patterns**

```typescript
// Extension consumption mock setup
const mocks = await setupExtConsumedTestEnvironment()

// Extension consumption mock reset
await resetExtConsumedMocks(mocks)

// Extension consumption mock usage
mocks.extension.processAssets.mockResolvedValue(processedAssets)
mocks.extension.generateOutput.mockReturnValue(generatedOutput)
```

## **EXTENSION CONSUMPTION TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Core-Ext Integration**: Test all core-ext integration points
2. **Asset Processing**: Test asset processing and generation
3. **Extension Consumption**: Test extension method consumption
4. **Error Handling**: Test extension consumption error scenarios
5. **Configuration**: Test extension configuration consumption
6. **Output Generation**: Test extension output generation

### **Coverage Organization**

```typescript
describe('ExtensionConsumption', () => {
    describe('Core-Ext Integration', () => {
        it('should integrate with extension', () => {
            // Test core-ext integration
        })
    })

    describe('Asset Processing', () => {
        it('should process extension assets', () => {
            // Test asset processing
        })

        it('should generate extension output', () => {
            // Test output generation
        })
    })

    describe('Extension Consumption', () => {
        it('should consume extension methods', () => {
            // Test extension consumption
        })
    })

    describe('Error Handling', () => {
        it('should handle extension consumption errors', () => {
            // Test error scenarios
        })
    })
})
```

## **EXTENSION CONSUMPTION-SPECIFIC TESTING SCENARIOS**

### **Core-Ext Integration**

```typescript
describe('Core-Ext Integration', () => {
    it('should integrate with extension successfully', async () => {
        mocks.extension.processAssets.mockResolvedValue(processedAssets)

        const result = await coreService.processWithExtension(assets)

        expect(result).toEqual(processedAssets)
        expect(mocks.extension.processAssets).toHaveBeenCalledWith(assets)
    })

    it('should handle extension integration errors', async () => {
        mocks.extension.processAssets.mockRejectedValue(new Error('Extension error'))

        await expect(coreService.processWithExtension(assets)).rejects.toThrow('Extension error')
    })
})
```

### **Asset Processing**

```typescript
describe('Asset Processing', () => {
    it('should process extension assets', () => {
        mocks.extension.generateOutput.mockReturnValue(generatedOutput)

        const result = coreService.processAssets(inputAssets)

        expect(result).toEqual(generatedOutput)
        expect(mocks.extension.generateOutput).toHaveBeenCalledWith(inputAssets)
    })

    it('should handle asset processing errors', () => {
        mocks.extension.generateOutput.mockImplementation(() => {
            throw new Error('Asset processing error')
        })

        expect(() => coreService.processAssets(inputAssets)).toThrow('Asset processing error')
    })
})
```

### **Extension Consumption**

```typescript
describe('Extension Consumption', () => {
    it('should consume extension methods', () => {
        mocks.extension.consumeMethod.mockReturnValue(consumedResult)

        const result = coreService.consumeExtension(methodName, params)

        expect(result).toEqual(consumedResult)
        expect(mocks.extension.consumeMethod).toHaveBeenCalledWith(methodName, params)
    })

    it('should handle extension consumption errors', () => {
        mocks.extension.consumeMethod.mockImplementation(() => {
            throw new Error('Consumption error')
        })

        expect(() => coreService.consumeExtension(methodName, params)).toThrow('Consumption error')
    })
})
```

## **EXTENSION CONSUMPTION TESTING COMMAND EXECUTION**

### **PAE Aliases for Extension Consumption**

- **MANDATORY**: `pae {core-name} b` → Build core package
- **MANDATORY**: `pae {core-name} t` → Test core package (fast)
- **MANDATORY**: `pae {core-name} tc` → Test core package with coverage
- **MANDATORY**: `pae {core-name} tcw` → Test core package with coverage (watch)

### **Extension Consumption Testing Workflow**

1. **Setup**: Use `setupExtConsumedTestEnvironment()` and `resetExtConsumedMocks()`
2. **Mock**: Use extension consumption mock patterns
3. **Test**: Implement comprehensive test coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **EXTENSION CONSUMPTION-SPECIFIC ANTI-PATTERNS**

### **Extension Consumption Testing Violations**

- ❌ Testing extension logic in core tests
- ❌ Not mocking extension consumption calls
- ❌ Using real extension calls in tests
- ❌ Non-deterministic test data
- ❌ Incomplete extension consumption mock coverage
- ❌ Skipping core-ext integration testing

### **Extension Consumption Mock Violations**

- ❌ Not using extension consumption mock patterns
- ❌ Inconsistent mock patterns across extension consumption tests
- ❌ Hardcoded extension consumption responses
- ❌ Missing extension consumption mock cleanup
- ❌ Over-mocking extension consumption functionality

## **EXTENSION CONSUMPTION TESTING SUCCESS METRICS**

After implementing proper extension consumption testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across extension consumption packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **EXTENSION CONSUMPTION TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Extension logic in core → "This belongs in extension"
- **MANDATORY**: Extension consumption not mocked → "Mock extension consumption calls"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"

### **Pattern Recognition**

- Extension consumption path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Extension consumption package type verification
- Extension consumption mock compliance verification
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
