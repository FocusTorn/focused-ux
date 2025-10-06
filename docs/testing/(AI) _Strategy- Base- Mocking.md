# (AI) Strategy - Base Mocking

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/_Troubleshooting - Tests.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all mocking decisions across all package types.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **MANDATORY MOCK STRATEGY DECISION TREE**

### **CRITICAL DECISION TREE EXECUTION**

**MANDATORY**: Execute this decision tree for EVERY mocking scenario:

```
Do you need multiple related mocks working together?
├─ YES → Scenario Builder (RECOMMENDED FIRST CHOICE)
└─ NO → Is this a native Node.js built-in module that needs mocking?
    ├─ YES → packages/{package}/__tests__/__mocks__/globals.ts (MANDATORY)
    └─ NO → Is this mock/helper/scenario used by multiple packages?
        ├─ YES → libs/mock-strategy/
        └─ NO → Is this mock/helper/scenario used by multiple test files in the same package?
            ├─ YES → packages/{package}/__tests__/__mocks__/
            └─ NO → Is this mock/helper/scenario used by multiple tests in the same file?
                ├─ YES → Define in test file (beforeEach, shared setup)
                └─ NO → Define within the specific it() block
```

**VIOLATION PENALTY**: Any deviation from this decision tree constitutes a critical failure requiring immediate acknowledgment and correction.

## **SCENARIO BUILDER EXTENSION PROTOCOL**

### **MANDATORY SCENARIO BUILDER USAGE**

**CRITICAL RULE**: When scenario builder methods don't exist, you MUST extend the package-level scenario builder, NOT revert to direct mocking.

### **Extension Process**

1. **Identify Missing Method**: Determine what scenario builder method is needed
2. **Locate Package Scenario Builder**: Find `packages/{package}/__tests__/__mocks__/mock-scenario-builder.ts`
3. **Add Method to Builder**: Extend the builder class with the new method
4. **Implement Scenario Logic**: Add the scenario implementation
5. **Use Extended Builder**: Use the new method in tests

### **Example Extension Pattern**

```typescript
// In packages/{package}/__tests__/__mocks__/mock-scenario-builder.ts
export class PaeMockBuilder {
    // ... existing methods ...

    configLoader(): ConfigLoaderScenarioBuilder {
        return new ConfigLoaderScenarioBuilder(this.mocks)
    }
}

export class ConfigLoaderScenarioBuilder {
    constructor(private mocks: PaeTestMocks) {}

    loadConfig(): ConfigLoaderScenarioBuilder {
        // Implement config loading scenario
        return this
    }

    withValidYaml(config: any): ConfigLoaderScenarioBuilder {
        // Implement valid YAML scenario
        return this
    }

    withErrorHandling(errorType: string): ConfigLoaderScenarioBuilder {
        // Implement error handling scenario
        return this
    }
}
```

## **MOCK HIERARCHY ENFORCEMENT**

### **MANDATORY MOCK PLACEMENT RULES**

1. **Scenario Builders** (`packages/{package}/__tests__/__mocks__/mock-scenario-builder.ts`)
    - **When**: ANY complex mocking scenario (3+ mocks, related behavior, stateful interactions)
    - **What**: Composable mock scenarios, business logic testing, realistic test conditions
    - **MANDATORY**: Use scenario builders for any mocking that involves multiple related mocks

2. **Global Mock Strategy** (`libs/mock-strategy/`)
    - **When**: Create mocks that multiple packages will use
    - **What**: Common Node.js APIs, standard patterns, cross-package functionality
    - **MANDATORY**: Use for standard Node.js module mocking

3. **Package-Level Global Mocks** (`packages/{package}/__tests__/__mocks__/globals.ts`)
    - **When**: Native Node.js built-in modules need to be mocked for the entire package
    - **What**: Node.js built-in modules that cause ESLint violations or need consistent mocking
    - **MANDATORY**: All native Node.js packages that are mocked must be added to `globals.ts`

4. **Package-Level Mocks** (`packages/{package}/__tests__/__mocks__/`)
    - **When**: Create mocks, helpers, and scenarios that multiple test files within the same package will use
    - **What**: Package-specific APIs, scenarios, helpers not covered by global mocks

5. **File-Level Mocks** (Within individual test files)
    - **When**: Create mocks that multiple tests within the same file will use
    - **What**: Test-specific setup, file-specific scenarios, repeated mock patterns

6. **Test-Level Mocks** (Within individual `it()` blocks)
    - **When**: Create mocks that only one specific test will use
    - **What**: Test-specific scenarios, one-off mock behaviors, isolated test logic

## **ESM IMPORT PATH REQUIREMENTS**

### **MANDATORY ESM IMPORT PATTERN**

- **Pattern**: `{relative-pathing}/__mocks__/helpers.js` where `{relative-pathing}` accounts for directory depth
- **Example**: From `__tests__/functional-tests/utils/` use `../../__mocks__/helpers.js`
- **Rule**: Always use `.js` extension for ESM imports, count directory levels from test file to `__mocks__/`

### **Import Path Calculation**

```typescript
// From __tests__/functional-tests/services/ConfigLoader.service.test.ts
import { setupPaeTestEnvironment } from '../../__mocks__/helpers.js'

// From __tests__/functional-tests/utils/SomeUtil.test.ts
import { setupPaeTestEnvironment } from '../../__mocks__/helpers.js'

// From __tests__/functional-tests/SomeOther.test.ts
import { setupPaeTestEnvironment } from '../__mocks__/helpers.js'
```

## **SCENARIO BUILDER USAGE PROTOCOL**

### **MANDATORY SCENARIO BUILDER PATTERN**

```typescript
// MANDATORY: Use scenario builder for complex mocking
const scenario = await createPaeMockBuilder(mocks)
    .configLoader()
    .loadConfig()
    .withValidYaml(validConfig)
    .withFileModificationDetection()
    .withErrorHandling('permission-denied')
    .build()
```

### **When to Use Scenario Builder**

- **Service method testing** (ConfigLoader, CommandExecution, etc.)
- **Complex multi-step mock setups** (3+ mocks working together)
- **File system operation testing**
- **Error scenario testing** with multiple failure points
- **Concurrent access testing**
- **Any test requiring more than 2 mock interactions**

### **When to Use Direct Mocking**

- **Single function mocks**
- **Simple return value scenarios**
- **One-off mock implementations**

## **MOCK CREATION PROTOCOL**

### **MANDATORY MOCK CREATION SEQUENCE**

1. **Check Decision Tree**: Execute decision tree first
2. **Validate Scenario Builder**: Check if scenario builder exists
3. **Extend if Missing**: Add missing scenarios to package-level mocks
4. **Execute Scenario**: Use scenario builder, never revert to direct mocking
5. **Verify Integration**: Ensure mocks work with global mocks

### **Mock Integration Requirements**

- **Global mocks call other mocked functions**, not hardcode values
- **Mock normalization logic matches real implementation** exactly
- **Environment variable control** is used for realistic test scenarios
- **Mock functions are designed** to work with test environment changes

## **ANTI-PATTERNS TO AVOID**

### **CRITICAL MOCKING VIOLATIONS**

- ❌ **NEVER SIMPLIFY MOCKS TO MAKE TESTS PASS**
- ❌ **NEVER REVERT TO DIRECT MOCKING** when scenario builder exists
- ❌ **NEVER HARDCODE MOCK VALUES** instead of using dynamic implementations
- ❌ **NEVER SKIP SCENARIO BUILDER** for complex mocking needs
- ❌ **NEVER IGNORE DECISION TREE** for mock placement

### **Mock Strategy Violations**

- ❌ Over-mocking everything
- ❌ Mocking implementation details
- ❌ Complex mock chains
- ❌ Mocking what you're testing
- ❌ Inconsistent mock patterns
- ❌ Forgetting cleanup
- ❌ Mocking too early
- ❌ Hardcoded mock values

## **ERROR RECOVERY PROTOCOL**

### **Common Mock Errors and Solutions**

#### **"Mock not working" / "Function not mocked"**

**Causes & Solutions**:

1. **Module imported before mock**:

    ```typescript
    // ❌ BAD: Import before mock
    import { myFunction } from './module'
    vi.mock('./module', () => ({ myFunction: vi.fn() }))

    // ✅ GOOD: Mock before import
    vi.mock('./module', () => ({ myFunction: vi.fn() }))
    import { myFunction } from './module'
    ```

2. **Mock not properly configured**:

    ```typescript
    // ❌ BAD: Mock not implemented
    vi.mock('./module', () => ({ myFunction: vi.fn() }))

    // ✅ GOOD: Mock with implementation
    vi.mock('./module', () => ({
        myFunction: vi.fn().mockReturnValue('expected value'),
    }))
    ```

#### **"Scenario builder not working"**

**Solutions**:

1. **Check builder initialization**:

    ```typescript
    // ❌ BAD: Not awaiting builder creation
    const builder = createMockBuilder(mocks)

    // ✅ GOOD: Await builder creation
    const builder = await createMockBuilder(mocks)
    ```

2. **Verify scenario completion**:

    ```typescript
    // ❌ BAD: Forgetting to call build()
    await builder.configExists({ configPath: '/config.json' })

    // ✅ GOOD: Complete the scenario
    await builder.configExists({ configPath: '/config.json' }).build()
    ```

## **SUCCESS METRICS**

After implementing proper mock strategies:

- ✅ **60% reduction** in mock setup code
- ✅ **75% reduction** in test file complexity
- ✅ **100% consistency** across test files
- ✅ **Zero mock-related test failures**
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized mock control)

## **VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Complex mocking needs → "Use scenario builder"
- **MANDATORY**: Missing scenario builder method → "Extend scenario builder"
- **MANDATORY**: Direct mocking for complex scenarios → "STOP! Use scenario builder"
- **MANDATORY**: Hardcoded mock values → "Use dynamic implementations"
- **MANDATORY**: Mock simplification → "STOP! Maintain realistic behavior"

### **Pattern Recognition**

- Mock complexity → Determines scenario builder usage
- Package type → Determines mock placement
- Test scope → Determines mock level
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Decision tree execution
- Scenario builder validation
- Mock hierarchy compliance
- Anti-pattern violation detection

### **HIGH PRIORITY (Execute before proceeding)**

- Mock creation and integration
- Error recovery execution
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
