# Test Structure Violations Audit List

## Overview

This document defines violations found in test files that deviate from the Enhanced Mock Strategy. These violations should be caught by an automated auditor to ensure consistent test structure across the codebase.

## Violation Categories

### 1. Duplicate Mock Class Definitions

#### Violation: Creating Local Mock Classes Instead of Using Global Mocks

**Pattern**: Test files creating their own mock classes for services already mocked globally
**Examples Found**:

```typescript
// ❌ VIOLATION: Duplicate MockFileSystem class
class MockFileSystem {
    readFile = vi.fn()
    writeFile = vi.fn()
}

// ❌ VIOLATION: Duplicate MockPath class
class MockPath {
    join = vi.fn()
}
```

**Detection Rules**:

- Look for class definitions with names starting with `Mock` + service name
- Check if the service is already mocked in `globals.ts` or `helpers.ts`
- Flag any duplicate mock classes for: `FileSystem`, `Path`, `Yaml`, `Tokenizer`, `Micromatch`

**Correct Pattern**:

```typescript
// ✅ CORRECT: Use global mocks
let mocks: ReturnType<typeof setupTestEnvironment>
mocks = setupTestEnvironment()
// Use mocks.fileSystem, mocks.path, etc.
```

### 2. Incorrect Mock Setup Order

#### Violation: Calling resetAllMocks After Setup Functions

**Pattern**: Resetting mocks after they've been configured
**Examples Found**:

```typescript
// ❌ VIOLATION: Wrong order
mocks = setupTestEnvironment()
setupFileSystemMocks(mocks)
setupPathMocks(mocks)
resetAllMocks(mocks) // This clears the setup!

// ✅ CORRECT: Reset first, then setup
mocks = setupTestEnvironment()
resetAllMocks(mocks)
setupFileSystemMocks(mocks)
setupPathMocks(mocks)
```

**Detection Rules**:

- Look for `resetAllMocks(mocks)` calls
- Ensure it's called before any `setup*Mocks(mocks)` calls
- Flag if `resetAllMocks` appears after setup functions

### 3. Missing Helper Function Calls

#### Violation: Not Using Required Helper Functions

**Pattern**: Test files not calling necessary setup functions from `helpers.ts`
**Examples Found**:

```typescript
// ❌ VIOLATION: Missing helper calls
beforeEach(() => {
    mocks = setupTestEnvironment()
    resetAllMocks(mocks)
    // Missing: setupFileSystemMocks(mocks)
    // Missing: setupPathMocks(mocks)
})

// ✅ CORRECT: Using all required helpers
beforeEach(() => {
    mocks = setupTestEnvironment()
    resetAllMocks(mocks)
    setupFileSystemMocks(mocks)
    setupPathMocks(mocks)
    setupYamlMocks(mocks)
})
```

**Detection Rules**:

- Check if test uses file system operations → requires `setupFileSystemMocks`
- Check if test uses path operations → requires `setupPathMocks`
- Check if test uses YAML operations → requires `setupYamlMocks`
- Check if test uses tokenizer operations → requires `setupTokenizerMocks`
- Check if test uses micromatch operations → requires `setupMicromatchMocks`

### 4. Inconsistent Service Instantiation

#### Violation: Using Local Mocks Instead of Global Mocks in Service Constructors

**Pattern**: Passing local mock instances to service constructors instead of global mocks
**Examples Found**:

```typescript
// ❌ VIOLATION: Using local mocks
const mockFileSystem = new MockFileSystem()
const mockPath = new MockPath()
service = new SomeService(mockFileSystem as any, mockPath as any)

// ✅ CORRECT: Using global mocks
service = new SomeService(mocks.fileSystem as any, mocks.path as any)
```

**Detection Rules**:

- Look for service constructor calls
- Check if parameters reference local mock variables instead of `mocks.*`
- Flag any service instantiation using local mock classes

### 5. Direct Global Mock References

#### Violation: Referencing Global Mocks Directly Instead of Through Helpers

**Pattern**: Using global mock variables directly instead of through the mocks object
**Examples Found**:

```typescript
// ❌ VIOLATION: Direct global reference
mockYaml.load.mockReturnValue({})
mockMicromatch.isMatch.mockReturnValue(false)

// ✅ CORRECT: Through mocks object
mocks.yaml.load.mockReturnValue({})
mocks.micromatch.isMatch.mockReturnValue(false)
```

**Detection Rules**:

- Look for direct references to `mockYaml`, `mockMicromatch`, etc.
- Ensure all mock operations go through `mocks.*` object
- Flag any direct global mock variable usage

### 6. Missing Scenario Builder Usage

#### Violation: Not Using Scenario Builder for Complex Test Setup

**Pattern**: Manually setting up mocks instead of using scenario builder functions
**Examples Found**:

```typescript
// ❌ VIOLATION: Manual mock setup
mocks.fileSystem.readFile.mockResolvedValue('content')
mocks.yaml.load.mockReturnValue({})
mocks.micromatch.isMatch.mockReturnValue(false)

// ✅ CORRECT: Using scenario builder
setupFileExplorerSuccessScenario(mocks, {
    operation: 'getChildren',
    entries: [...],
    expectedChildren: [...]
})
```

**Detection Rules**:

- Look for manual mock setup in test cases
- Check if scenario builder functions are available for the service being tested
- Flag manual mock setup when scenario builder alternatives exist

### 7. Inconsistent Import Patterns

#### Violation: Missing or Incorrect Imports from Mock Infrastructure

**Pattern**: Not importing required functions from mock infrastructure
**Examples Found**:

```typescript
// ❌ VIOLATION: Missing imports
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
// Missing: setupFileSystemMocks, setupPathMocks, etc.

// ✅ CORRECT: Complete imports
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupYamlMocks,
} from '../__mocks__/helpers'
```

**Detection Rules**:

- Check if test uses file system operations but doesn't import `setupFileSystemMocks`
- Check if test uses path operations but doesn't import `setupPathMocks`
- Check if test uses YAML operations but doesn't import `setupYamlMocks`
- Check if test uses tokenizer operations but doesn't import `setupTokenizerMocks`
- Check if test uses micromatch operations but doesn't import `setupMicromatchMocks`

### 8. Declare Global Statements

#### Violation: Unnecessary Global Declarations

**Pattern**: Declaring global variables that are already handled by the mock infrastructure
**Examples Found**:

```typescript
// ❌ VIOLATION: Unnecessary global declarations
declare global {
    var mockYaml: any
    var mockMicromatch: any
}

// ✅ CORRECT: Let globals.ts handle global declarations
// No need for local global declarations
```

**Detection Rules**:

- Look for `declare global` statements in test files
- Flag any global declarations that duplicate what's in `globals.ts`
- Ensure global declarations are only in `globals.ts`

### 9. Mock Service Class Patterns

#### Violation: Inconsistent Mock Service Class Structure

**Pattern**: Mock service classes not following consistent patterns
**Examples Found**:

```typescript
// ❌ VIOLATION: Inconsistent mock class
class MockSomeService {
    method1 = vi.fn()
    method2 = vi.fn()
    // Missing proper initialization
}

// ✅ CORRECT: Consistent mock class
class MockSomeService {
    method1 = vi.fn()
    method2 = vi.fn()

    constructor() {
        // Proper initialization if needed
    }
}
```

**Detection Rules**:

- Check mock class consistency
- Ensure all methods are properly mocked with `vi.fn()`
- Verify proper initialization patterns

### 10. Test Structure Patterns

#### Violation: Inconsistent Test Structure

**Pattern**: Tests not following the Enhanced Mock Strategy structure
**Examples Found**:

```typescript
// ❌ VIOLATION: Inconsistent structure
describe('SomeService', () => {
    let service: SomeService
    let mockDependency: MockDependency

    beforeEach(() => {
        // Inconsistent setup
    })
})

// ✅ CORRECT: Consistent structure
describe('SomeService', () => {
    let service: SomeService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)

        service = new SomeService(mocks.fileSystem as any, mocks.path as any)
    })
})
```

**Detection Rules**:

- Check for consistent `mocks` variable declaration
- Verify proper `beforeEach` structure
- Ensure service instantiation follows patterns

## Auditor Implementation Guidelines

### File Patterns to Check

- `**/*.test.ts` - All test files
- `**/__tests__/**/*.test.ts` - Test files in **tests** directories
- `**/__mocks__/**/*.ts` - Mock infrastructure files

### Required Checks

1. **Import Analysis**: Verify all required mock functions are imported
2. **Class Analysis**: Check for duplicate mock class definitions
3. **Setup Order**: Verify correct mock setup order
4. **Service Instantiation**: Check service constructor parameters
5. **Global Usage**: Verify proper global mock usage
6. **Scenario Builder**: Check for manual vs scenario builder usage
7. **Structure Consistency**: Verify test structure patterns

### Severity Levels

- **CRITICAL**: Violations that break the Enhanced Mock Strategy
- **HIGH**: Violations that cause test inconsistencies
- **MEDIUM**: Violations that reduce maintainability
- **LOW**: Violations that are style inconsistencies

### Auto-Fix Suggestions

- Replace local mock classes with global mocks
- Fix mock setup order
- Add missing helper function calls
- Update service instantiation to use global mocks
- Remove unnecessary global declarations
- Convert manual mock setup to scenario builder usage

## Summary

This audit list captures all the violations found during the test file optimization process. An automated auditor should check for these patterns and provide specific fixes to ensure all test files follow the Enhanced Mock Strategy consistently.
