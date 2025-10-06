# (AI) Strategy - Specific Plugins

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

**AI Agent Directive**: Follow this protocol exactly for all plugin package testing decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **PLUGIN PACKAGE TESTING REQUIREMENTS**

### **Plugin Package Definition**

- **Location**: `plugins/{name}/`
- **Purpose**: Nx plugin functionality, generator and executor testing
- **Format**: ESM modules
- **Dependencies**: Nx plugin API integration
- **Testing Focus**: Plugin functionality, generator testing, executor testing, plugin lifecycle

### **Plugin Testing Framework**

- **Framework**: Vitest (mandatory)
- **Test Location**: `plugins/{name}/__tests__/functional-tests/`
- **Mock Strategy**: Use plugin-specific mock patterns
- **Coverage**: 100% coverage for public methods

## **PLUGIN TESTING PATTERNS**

### **Plugin Functionality Testing Pattern**

```typescript
import { setupPluginTestEnvironment, resetPluginMocks } from '../../__mocks__/helpers.js'

describe('Plugin Functionality', () => {
    let mocks: Awaited<ReturnType<typeof setupPluginTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPluginTestEnvironment()
        await resetPluginMocks(mocks)
    })

    it('should execute plugin functionality', async () => {
        // Test plugin functionality
    })
})
```

### **Generator Testing Pattern**

```typescript
import { setupPluginTestEnvironment, resetPluginMocks } from '../../__mocks__/helpers.js'

describe('Generator Testing', () => {
    let mocks: Awaited<ReturnType<typeof setupPluginTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPluginTestEnvironment()
        await resetPluginMocks(mocks)
    })

    it('should generate files correctly', () => {
        // Test generator functionality
    })
})
```

### **Executor Testing Pattern**

```typescript
import { setupPluginTestEnvironment, resetPluginMocks } from '../../__mocks__/helpers.js'

describe('Executor Testing', () => {
    let mocks: Awaited<ReturnType<typeof setupPluginTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPluginTestEnvironment()
        await resetPluginMocks(mocks)
    })

    it('should execute commands correctly', () => {
        // Test executor functionality
    })
})
```

## **PLUGIN-SPECIFIC MOCKING REQUIREMENTS**

### **Plugin Mocking**

- **Use**: Plugin-specific mock patterns
- **Scope**: Nx plugin API mocking patterns
- **Integration**: Works with Nx plugin mocks
- **Focus**: Plugin behavior simulation

### **Plugin Mock Patterns**

```typescript
// Plugin mock setup
const mocks = await setupPluginTestEnvironment()

// Plugin mock reset
await resetPluginMocks(mocks)

// Plugin mock usage
mocks.nx.generateFiles.mockResolvedValue(generatedFiles)
mocks.nx.runCommand.mockReturnValue(commandResult)
```

## **PLUGIN TESTING COVERAGE REQUIREMENTS**

### **Mandatory Coverage Areas**

1. **Plugin Functionality**: Test all plugin functionality
2. **Generator Testing**: Test generator methods and file generation
3. **Executor Testing**: Test executor methods and command execution
4. **Plugin Lifecycle**: Test plugin activation and deactivation
5. **Error Handling**: Test plugin-specific error scenarios
6. **Configuration**: Test plugin configuration handling

### **Coverage Organization**

```typescript
describe('PluginName', () => {
    describe('Plugin Functionality', () => {
        it('should execute plugin functionality', () => {
            // Test plugin functionality
        })
    })

    describe('Generator Testing', () => {
        it('should generate files correctly', () => {
            // Test generator functionality
        })

        it('should handle generator errors', () => {
            // Test generator error handling
        })
    })

    describe('Executor Testing', () => {
        it('should execute commands correctly', () => {
            // Test executor functionality
        })

        it('should handle executor errors', () => {
            // Test executor error handling
        })
    })

    describe('Error Handling', () => {
        it('should handle plugin-specific errors', () => {
            // Test error scenarios
        })
    })
})
```

## **PLUGIN-SPECIFIC TESTING SCENARIOS**

### **Plugin Functionality**

```typescript
describe('Plugin Functionality', () => {
    it('should execute plugin functionality successfully', async () => {
        mocks.nx.generateFiles.mockResolvedValue(generatedFiles)

        const result = await plugin.executeFunctionality(options)

        expect(result).toEqual(generatedFiles)
        expect(mocks.nx.generateFiles).toHaveBeenCalledWith(options)
    })

    it('should handle plugin functionality errors', async () => {
        mocks.nx.generateFiles.mockRejectedValue(new Error('Plugin error'))

        await expect(plugin.executeFunctionality(options)).rejects.toThrow('Plugin error')
    })
})
```

### **Generator Testing**

```typescript
describe('Generator Testing', () => {
    it('should generate files correctly', () => {
        mocks.nx.generateFiles.mockResolvedValue(generatedFiles)

        const result = generator.generate(options)

        expect(result).toEqual(generatedFiles)
        expect(mocks.nx.generateFiles).toHaveBeenCalledWith(options)
    })

    it('should handle generator errors', () => {
        mocks.nx.generateFiles.mockImplementation(() => {
            throw new Error('Generator error')
        })

        expect(() => generator.generate(options)).toThrow('Generator error')
    })
})
```

### **Executor Testing**

```typescript
describe('Executor Testing', () => {
    it('should execute commands correctly', () => {
        mocks.nx.runCommand.mockReturnValue(commandResult)

        const result = executor.execute(options)

        expect(result).toEqual(commandResult)
        expect(mocks.nx.runCommand).toHaveBeenCalledWith(options)
    })

    it('should handle executor errors', () => {
        mocks.nx.runCommand.mockImplementation(() => {
            throw new Error('Executor error')
        })

        expect(() => executor.execute(options)).toThrow('Executor error')
    })
})
```

## **PLUGIN TESTING COMMAND EXECUTION**

### **PAE Aliases for Plugins**

- **MANDATORY**: `pae {plugin-name} b` → Build plugin
- **MANDATORY**: `pae {plugin-name} t` → Test plugin (fast)
- **MANDATORY**: `pae {plugin-name} tc` → Test plugin with coverage
- **MANDATORY**: `pae {plugin-name} tcw` → Test plugin with coverage (watch)

### **Plugin Testing Workflow**

1. **Setup**: Use `setupPluginTestEnvironment()` and `resetPluginMocks()`
2. **Mock**: Use plugin-specific mock patterns
3. **Test**: Implement comprehensive test coverage
4. **Execute**: Use PAE aliases for testing
5. **Validate**: Ensure 100% coverage for public methods

## **PLUGIN-SPECIFIC ANTI-PATTERNS**

### **Plugin Testing Violations**

- ❌ Testing Nx plugin logic without mocking
- ❌ Not mocking Nx plugin API calls
- ❌ Using real Nx plugin calls in tests
- ❌ Non-deterministic test data
- ❌ Incomplete Nx plugin mock coverage
- ❌ Skipping plugin lifecycle testing

### **Plugin Mock Violations**

- ❌ Not using plugin-specific mock patterns
- ❌ Inconsistent mock patterns across plugin tests
- ❌ Hardcoded Nx plugin responses
- ❌ Missing Nx plugin mock cleanup
- ❌ Over-mocking plugin functionality

## **PLUGIN TESTING SUCCESS METRICS**

After implementing proper plugin testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across plugin packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **PLUGIN TESTING VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Nx plugin logic not mocked → "Mock Nx plugin API calls"
- **MANDATORY**: Plugin functionality not tested → "Test plugin functionality"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"

### **Pattern Recognition**

- Plugin path → Determines testing rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Plugin package type verification
- Plugin mock compliance verification
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
