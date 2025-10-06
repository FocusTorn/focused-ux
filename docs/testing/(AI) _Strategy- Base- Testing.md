# (AI) Strategy - Base Testing

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

**AI Agent Directive**: Follow this protocol exactly for all testing decisions across all package types.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **MANDATORY PRE-RESPONSE VALIDATION FRAMEWORK**

### **CRITICAL EXECUTION CHECKLIST**

**CRITICAL**: Before ANY response involving FocusedUX project testing operations, execute this validation sequence:

**STEP 1: PAE ALIAS COMPLIANCE**

- [ ] **Alias Discovery**: Will I attempt `pae help` first to discover available aliases?
- [ ] **Workspace Root**: When I need to return to the workspace root, will I use `cd D:/_dev/_Projects/_fux/_FocusedUX` ?
- [ ] **Alias Usage**: Will I use appropriate alias for the operation (e.g., `pae dc b` for dynamicons build)?
- [ ] **Fallback Protocol**: Will I only use direct nx commands if no alias exists or alias fails?
- [ ] **Documentation**: Will I document any missing aliases that should be added to PAE system?

**STEP 2: BUILD ERROR RESOLUTION**

- [ ] **Error Resolution**: Will I fix build errors immediately before proceeding?
- [ ] **No Git Usage**: Will I need to revert a files contents, will I use a file's context from a within the current conversation?
- [ ] **Cache Bypass**: Will I use `--skip-nx-cache` for troubleshooting when needed?

**STEP 3: DOCUMENTATION FIRST COMPLIANCE**

- [ ] **Architecture Check**: Have I checked **ARCHITECTURE_DOCS** for package structure and patterns?
- [ ] **Testing Check**: Have I checked **TESTING_STRATEGY** for testing patterns?

**STEP 4: PACKAGE ANALYSIS COMPLIANCE**

- [ ] **Project Details**: Will I use `nx_project_details` to understand package dependencies?
- [ ] **Architectural Deviations**: Will I check for deviations from standard patterns?
- [ ] **Package Type Verification**: Will I verify package type (core vs ext vs shared vs tool) and role?

**STEP 5: SELF-CORRECTION**

- [ ] **Violation Detection**: If I detect any protocol violation, will I acknowledge immediately?

**VIOLATION PENALTY**: Any failure to complete this checklist constitutes a critical failure requiring immediate acknowledgment and correction.

## **CORE TESTING PRINCIPLES**

### **Universal Testing Requirements**

1. **Mock External Dependencies**: Always mock external APIs, databases, and file systems
2. **Test Pure Functions**: Focus on testing pure business logic without side effects
3. **Mock Node.js Modules**: Mock Node.js modules to isolate functionality
4. **Test Error Scenarios**: Test both success and error paths
5. **Use Deterministic Data**: Use consistent mock data for predictable tests
6. **Isolate Logic**: Mock external dependencies to focus on package-specific logic
7. **Test Edge Cases**: Test boundary conditions and edge cases

### **Test Organization Rules**

- **All tests go in `__tests__/functional-tests/`** (not integration-tests)
- **Integration tests are for VSCode integration only**
- **Use `@fux/mock-strategy` for mocking**
- **Test files should be <500 lines**
- **Use descriptive test names**
- **Group related tests with `describe()` blocks**

### **Coverage Requirements**

- **Test all public service methods**
- **Test configuration loading and validation**
- **Test error handling scenarios**
- **Test all execution paths**

## **PACKAGE TYPE TESTING RULES**

### **Core Packages** (`packages/{feature}/core/`)

- **Pure business logic testing**
- **ESM module format**
- **No VSCode imports**
- **Focus on utility functions and business logic**

### **Extension Packages** (`packages/{feature}/ext/`)

- **VSCode wrapper testing**
- **CJS bundle format**
- **VSCode API integration testing**
- **Extension lifecycle testing**

### **Shared Packages** (`libs/shared/`)

- **In-repo utility testing**
- **ESM module format**
- **No VSCode dependencies**
- **Cross-package functionality testing**

### **Tool Packages** (`libs/tools/{name}/`)

- **Standalone utility testing**
- **ESM module format**
- **Command-line interface testing**
- **Tool-specific functionality testing**

## **TESTING FRAMEWORK REQUIREMENTS**

### **Vitest Configuration**

- **Framework**: Vitest (mandatory)
- **Test Runner**: Vitest test runner
- **Mocking**: Vitest mocking capabilities
- **Coverage**: Vitest coverage reporting

### **Mock Strategy Requirements**

- **Use `setupPaeTestEnvironment()` and `resetPaeMocks()`**
- **Create mocks with `createPaeMockBuilder()`**
- **Mock external dependencies appropriately**
- **Use scenario builders for complex mocking**

### **Test Structure Requirements**

- **Use `describe()` blocks for grouping**
- **Use `it()` blocks for individual tests**
- **Use `beforeEach()` and `afterEach()` for setup/cleanup**
- **Use `expect()` assertions**
- **Use `vi.mocked()` for type safety**

## **COMMON TESTING PATTERNS**

### **Service Testing Pattern**

```typescript
describe('ServiceName', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    })

    it('should perform expected action', async () => {
        // Test implementation
    })
})
```

### **Configuration Testing Pattern**

```typescript
describe('Configuration Loading', () => {
    it('should load valid configuration', () => {
        // Test configuration loading
    })

    it('should handle invalid configuration', () => {
        // Test error handling
    })
})
```

### **Error Handling Testing Pattern**

```typescript
describe('Error Handling', () => {
    it('should handle specific error condition', () => {
        // Test error scenario
    })
})
```

## **ANTI-PATTERNS TO AVOID**

### **Testing Violations**

- ❌ VSCode mocking in shared tests
- ❌ Test files >500 lines
- ❌ Skipping tests for deadlines
- ❌ Tests calling complex methods without mocking
- ❌ Tests in wrong directory (integration-tests for CLI)
- ❌ Testing implementation details instead of behavior
- ❌ Using real external APIs in tests
- ❌ Non-deterministic test data

### **Mock Violations**

- ❌ Over-mocking everything
- ❌ Mocking implementation details
- ❌ Complex mock chains
- ❌ Mocking what you're testing
- ❌ Inconsistent mock patterns
- ❌ Forgetting cleanup
- ❌ Mocking too early
- ❌ Hardcoded mock values

## **TESTING COMMAND EXECUTION**

### **PAE Aliases (MANDATORY)**

- **MANDATORY**: `pae help` → Discover available commands
- **MANDATORY**: `pae {alias} b` → Build
- **MANDATORY**: `pae {alias} t` → Test (fast)
- **MANDATORY**: `pae {alias} tc` → Test with coverage
- **MANDATORY**: `pae {alias} tcw` → Test with coverage (watch)

### **Profile Loading**

- **MANDATORY**: Wait for "FocusedUX project profile loaded"
- **MANDATORY**: Wait for "Module loaded: PAE aliases"
- **MANDATORY**: Retry if `pae help` shows minimal output

## **TESTING WORKFLOW**

### **Pre-Testing Checklist**

1. **Read rules** → MANDATORY: Read this file first before any action
2. **Discover tools** → MANDATORY: Run `pae help` to see available commands
3. **Check docs** → MANDATORY: Look in `docs/` before creating solutions
4. **Build** → MANDATORY: Build before testing
5. **Execute** → MANDATORY: Execute tests

### **Test Development Process**

1. **Setup test environment** using PAE aliases
2. **Create test structure** following patterns
3. **Implement test cases** covering all scenarios
4. **Run tests** using PAE aliases
5. **Fix failures** iteratively
6. **Validate coverage** meets requirements

## **SUCCESS METRICS**

After implementing proper testing strategies:

- ✅ **100% test coverage** for public methods
- ✅ **Zero test-related failures**
- ✅ **Consistent test patterns** across packages
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized test control)
- ✅ **Better debugging** (consistent test behavior)

## **VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: VSCode imports in core → "This belongs in ext"
- **MANDATORY**: Business logic in extensions → "This belongs in core"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"
- **MANDATORY**: Creating solutions without checking docs → "STOP! Check docs/ first - this is a critical violation"

### **Pattern Recognition**

- Package path → Determines type and rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- PAE alias compliance verification
- Documentation first verification
- Package analysis execution
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
