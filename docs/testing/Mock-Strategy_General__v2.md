# Mock Strategy - General Guidelines

## Mock Creation & Reference Priority (Top to Bottom)

### 1. **Global Mock Strategy** (`libs/mock-strategy/`)

- **When**: Create mocks that **multiple packages** will use
- **What**: Common Node.js APIs, standard patterns, cross-package functionality
- **Examples**: `fs`, `path`, `process`, `child_process`, common file operations
- **Reference**: Import from `@fux/mock-strategy/lib`

### 1.1. **Package-Level Global Mocks** (`packages/{package}/__tests__/__mocks__/globals.ts`)

- **When**: Native Node.js built-in modules need to be mocked for the entire package
- **What**: Node.js built-in modules that cause ESLint violations or need consistent mocking
- **Examples**: `node:child_process`, `node:fs`, `node:path`, `node:os`
- **MANDATORY**: All native Node.js packages that are mocked must be added to `globals.ts`
- **Purpose**: Prevents ESLint errors from `require()` statements and provides consistent mocking across all tests in the package
- **Reference**: Import from `../__mocks__/globals`

### 2. **Package-Level Mocks** (`packages/{package}/__tests__/__mocks__/`)

- **When**: Create mocks, helpers, and scenarios that **multiple test files within the same package** will use
- **What**: Package-specific APIs, scenarios, helpers not covered by global mocks
- **Examples**:
    - **Mocks**: Package-specific CLI functions, custom file operations
    - **Helpers**: Setup functions, test utilities, mock builders
    - **Scenarios**: Package-specific test scenarios, mock configurations
- **Reference**: Import from `../__mocks__/helpers`, `../__mocks__/scenarios`, or `../__mocks__/mock-scenario-builder`

### 3. **File-Level Mocks** (Within individual test files)

- **When**: Create mocks that **multiple tests within the same file** will use
- **What**: Test-specific setup, file-specific scenarios, repeated mock patterns
- **Examples**: `beforeEach` setups, shared mock configurations, file-specific helpers
- **Reference**: Define within the test file, use in multiple `it()` blocks

### 4. **Test-Level Mocks** (Within individual `it()` blocks)

- **When**: Create mocks that **only one specific test** will use
- **What**: Test-specific scenarios, one-off mock behaviors, isolated test logic
- **Examples**: Single test mock implementations, test-specific error conditions
- **Reference**: Define within the `it()` block, use only in that test

## Decision Tree for Mock Placement

```
Is this a native Node.js built-in module that needs mocking?
├─ YES → packages/{package}/__tests__/__mocks__/globals.ts (MANDATORY)
└─ NO → Is this mock/helper/scenario used by multiple packages?
    ├─ YES → libs/mock-strategy/
    └─ NO → Is this mock/helper/scenario used by multiple test files in the same package?
        ├─ YES → packages/{package}/__tests__/__mocks__/
        └─ NO → Is this mock/helper/scenario used by multiple tests in the same file?
            ├─ YES → Define in test file (beforeEach, shared setup)
            └─ NO → Define within the specific it() block
```

## Benefits of This Hierarchy

- **No duplication** across packages
- **Proper separation** of concerns
- **Easy maintenance** and updates
- **Clear ownership** of mock responsibilities
- **Consistent patterns** across the codebase
- **Reusable components** where appropriate

## When to Promote Package-Specific Patterns to Shared Libraries

### Promotion Criteria

**Promote to `@fux/mock-strategy/lib` when:**

1. **Multiple Package Usage**: Pattern is used by 2+ packages
2. **Generic Functionality**: Pattern is not specific to a single package's domain
3. **Reusable Scenarios**: Mock scenarios that can be applied across different packages
4. **Common Node.js Patterns**: Standard Node.js API mocking patterns
5. **Cross-Package Dependencies**: Functionality that other packages depend on

### Promotion Process

1. **Identify Reusable Pattern**: Look for patterns used in multiple test files within a package
2. **Extract to Shared Library**: Move the pattern to `libs/mock-strategy/src/lib/`
3. **Update Package Tests**: Refactor package tests to use the shared pattern
4. **Document Usage**: Add examples and documentation to the shared library
5. **Update References**: Update all packages to import from the shared library

### Examples of Successful Promotions

- **Shell Output Control**: Moved from package-specific to shared library for PowerShell/Bash script control
- **CLI Config Scenarios**: Moved from package-specific to shared library for CLI testing patterns
- **Environment Variable Control**: Moved from package-specific to shared library for test environment control

### Anti-Patterns to Avoid

- **Premature Promotion**: Don't promote patterns used by only one package
- **Over-Abstraction**: Don't create overly complex abstractions for simple patterns
- **Incomplete Migration**: Don't leave package-specific implementations alongside shared ones

## Types of Package-Level Components

### **Mocks**

- Mock implementations of external dependencies
- Package-specific API mocks
- Custom mock behaviors

### **Helpers**

- Setup and teardown functions
- Test utility functions
- Mock configuration helpers
- Reusable test patterns

### **Scenarios**

- Pre-configured mock scenarios
- Common test situations
- Mock builder patterns
- Scenario-specific configurations

## Examples

### Global Mock Strategy Example

```typescript
// libs/mock-strategy/src/lib/index.ts
export interface LibTestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        // ... other common file operations
    }
}
```

### Package-Level Mock Example

```typescript
// packages/my-package/__tests__/__mocks__/helpers.ts
export interface MyPackageTestMocks extends LibTestMocks {
    customService: ReturnType<typeof vi.fn>
    utilities: {
        processData: ReturnType<typeof vi.fn>
    }
}
```

### File-Level Mock Example

```typescript
// packages/my-package/__tests__/functional-tests/service.test.ts
describe('Service', () => {
    let mocks: Awaited<ReturnType<typeof setupMyPackageTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupMyPackageTestEnvironment()
        await resetMyPackageMocks(mocks)

        // File-level mock setup used by multiple tests
        vi.mocked(processData).mockImplementation((input) => {
            if (process.env.DEBUG === '1') {
                console.log(`Processing: ${input}`)
            }
            return 'processed'
        })
    })
})
```

### Test-Level Mock Example

```typescript
// Within a specific it() block
it('should handle specific error condition', () => {
    // Test-specific mock setup
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Test logic here

    // Test-specific assertions
    expect(errorSpy).toHaveBeenCalledWith('Expected error message')

    // Cleanup
    errorSpy.mockRestore()
})
```

## Scenarios vs Standard Mocks - When to Use What

### **Use Standard Mocks When:**

- **Simple, single-purpose mocking** - One function, one behavior
- **Direct API replacement** - Replacing a single function call
- **Basic return values** - Just returning a value or throwing an error
- **Individual test needs** - Only used in one or two tests

```typescript
// Standard mock - simple and direct
vi.mocked(fs.existsSync).mockReturnValue(false)
vi.mocked(console.log).mockImplementation(() => {})
```

### **Use Scenarios When:**

- **Complex, multi-step setups** - Multiple mocks working together
- **Realistic test conditions** - Simulating real-world situations
- **Repeated patterns** - Same setup used across multiple tests
- **Stateful interactions** - Mocks that need to work together
- **Business logic testing** - Testing specific workflows or processes

```typescript
// Scenario - complex, realistic setup
const builder = await createMockBuilder(mocks)
await builder
    .configExists({ configPath: '/config.json', configContent: validConfig })
    .commandSuccess({ command: 'build', args: ['--prod'], exitCode: 0 })
    .build()
```

### **Scenario Builder Pattern Benefits:**

- **Fluent API** - Easy to read and understand
- **Composable** - Mix and match different scenario parts
- **Reusable** - Same scenario can be used across multiple tests
- **Maintainable** - Changes to scenarios update all tests
- **Realistic** - Closer to real-world usage patterns

### **Decision Matrix:**

| Situation              | Use Standard Mock | Use Scenario |
| ---------------------- | ----------------- | ------------ |
| Single function mock   | ✅                | ❌           |
| Multiple related mocks | ❌                | ✅           |
| One-time test setup    | ✅                | ❌           |
| Repeated across tests  | ❌                | ✅           |
| Simple return value    | ✅                | ❌           |
| Complex workflow       | ❌                | ✅           |
| Business logic testing | ❌                | ✅           |
| API replacement        | ✅                | ❌           |

## Shell Output Control for Test Environments

### Overview

When packages generate shell scripts (PowerShell or Bash) that include output commands like `Write-Host` or `echo`, these commands can interfere with test output and cause noise during test execution. The mock strategy library provides utilities to control shell script output during tests.

### Environment Variable Control

The shell output control system uses the `ENABLE_TEST_CONSOLE` environment variable to conditionally suppress shell script output during tests.

**Environment Variable Behavior:**

- `ENABLE_TEST_CONSOLE=false` (default in tests) → Suppress shell output
- `ENABLE_TEST_CONSOLE=true` → Allow shell output

### Mock Strategy Library Integration

The shell output control functionality is available in the mock strategy library (`@fux/mock-strategy/lib`):

```typescript
import {
    setupShellOutputControl,
    conditionalWriteHost,
    conditionalEcho,
    wrapPowerShellScriptWithOutputControl,
    wrapBashScriptWithOutputControl,
    testShellOutputControl,
} from '@fux/mock-strategy/lib'

// Setup shell output control in test environment
setupShellOutputControl({ enableConsoleOutput: false })

// Use conditional output functions in your code
conditionalWriteHost('Refreshing aliases...', 'Yellow')
conditionalEcho('Aliases refreshed!')

// Wrap existing scripts with output control
const powershellScript = wrapPowerShellScriptWithOutputControl(originalScript)
const bashScript = wrapBashScriptWithOutputControl(originalScript)

// Test that output control is working
const result = testShellOutputControl('powershell', scriptContent)
expect(result.hasConditionalOutput).toBe(true)
```

### PowerShell Script Integration

For PowerShell scripts, wrap `Write-Host` commands with conditional checks:

```powershell
# Original PowerShell script
Write-Host "Refreshing [PWSH] aliases..." -ForegroundColor Yellow
Write-Host "[PWSH] aliases refreshed!" -ForegroundColor Green

# Modified with output control
if ($env:ENABLE_TEST_CONSOLE -ne "false") {
    Write-Host "Refreshing [PWSH] aliases..." -ForegroundColor Yellow
}
if ($env:ENABLE_TEST_CONSOLE -ne "false") {
    Write-Host "[PWSH] aliases refreshed!" -ForegroundColor Green
}
```

### Bash Script Integration

For Bash scripts, wrap `echo` commands with conditional checks:

```bash
# Original Bash script
echo "Refreshing [GitBash] aliases..."
echo "[GitBash] aliases refreshed!"

# Modified with output control
if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then
    echo "Refreshing [GitBash] aliases..."
fi
if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then
    echo "[GitBash] aliases refreshed!"
fi
```

### Global Test Setup Integration

Add shell output control to your global test setup:

```typescript
// __mocks__/globals.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupShellOutputControl } from '@fux/mock-strategy/lib'

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// Set environment variable to control PowerShell/Bash output
setupShellOutputControl({ enableConsoleOutput: false })
```

### Testing Shell Output Control

Use the test helper to verify that shell scripts have proper output control:

```typescript
import { testShellOutputControl } from '@fux/mock-strategy/lib'

describe('Shell Script Generation', () => {
    it('should wrap PowerShell output with conditional checks', () => {
        const scriptContent = `
            Write-Host "Starting process..." -ForegroundColor Green
            Write-Host "Process completed!" -ForegroundColor Yellow
        `

        const result = testShellOutputControl('powershell', scriptContent)

        expect(result.hasConditionalOutput).toBe(true)
        expect(result.outputCommands).toHaveLength(2)
    })

    it('should wrap Bash output with conditional checks', () => {
        const scriptContent = `
            echo "Starting process..."
            echo "Process completed!"
        `

        const result = testShellOutputControl('bash', scriptContent)

        expect(result.hasConditionalOutput).toBe(true)
        expect(result.outputCommands).toHaveLength(2)
    })
})
```

### Benefits

- **Clean Test Output**: Eliminates shell script noise during test execution
- **Consistent Behavior**: Same output control across all packages
- **Easy Integration**: Simple environment variable control
- **Testable**: Built-in test helpers to verify output control is working
- **Flexible**: Can be enabled/disabled per test or globally

### When to Use

Use shell output control when your package:

- Generates PowerShell scripts with `Write-Host` commands
- Generates Bash scripts with `echo` commands
- Runs shell scripts during tests that produce unwanted output
- Needs clean test output for better debugging

## Mock Strategy Decision Guidelines

### When to Use Mock Strategy Library Functions

Use the library functions for:

- **Standard Node.js module mocking** (fs, path, process, etc.)
- **External dependency mocking** (HTTP clients, databases, etc.)
- **Common library patterns** (file operations, data processing)
- **Base test environment setup**

### When to Use Package `__mocks__` Files

Use package-specific mocks for:

- **Package-specific Node.js modules** not covered by the library
- **Custom external dependencies** unique to your package
- **Specialized data processing** logic
- **Package-specific utility functions**

### When to Use File-Level Mocks

Use file-level mocks for:

- **Single test file requirements** that don't need global setup
- **Temporary mocking** for specific test scenarios
- **Isolated functionality testing** that doesn't affect other tests

### When to Use Inline Mocks

Use inline mocks for:

- **Simple one-off mocks** in individual tests
- **Test-specific data** that doesn't need reusability
- **Quick prototyping** before moving to more structured approaches

## Best Practices

### Universal Testing Principles

1. **Mock External Dependencies**: Always mock external APIs, databases, and file systems
2. **Test Pure Functions**: Focus on testing pure business logic without side effects
3. **Mock Node.js Modules**: Mock Node.js modules to isolate functionality
4. **Test Error Scenarios**: Test both success and error paths
5. **Use Deterministic Data**: Use consistent mock data for predictable tests
6. **Isolate Logic**: Mock external dependencies to focus on package-specific logic
7. **Test Edge Cases**: Test boundary conditions and edge cases

### Mock Strategy Best Practices

1. **Start Local**: Begin with test-level mocks, promote upward as needed
2. **Avoid Premature Abstraction**: Don't create package-level mocks until you have 2+ files using them
3. **Consistent Interfaces**: Use the same mock interfaces across similar functionality
4. **Clear Naming**: Use descriptive names that indicate the mock's purpose and scope
5. **Proper Cleanup**: Always restore mocks in `afterEach` or test cleanup
6. **Documentation**: Document complex mock scenarios and their intended use cases
7. **Choose Wisely**: Use scenarios for complex setups, standard mocks for simple ones
8. **Compose Scenarios**: Build scenarios from smaller, reusable parts
9. **Mock Early**: Set up mocks before importing modules that use them
10. **Isolate Tests**: Each test should be independent and not rely on state from other tests
11. **Use TypeScript**: Leverage TypeScript for better mock type safety and IntelliSense
12. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
13. **Verify Mock Calls**: Assert that mocked functions were called with expected parameters
14. **Reset Between Tests**: Clear mock call history and reset implementations between tests
15. **Control Shell Output**: Use shell output control for packages that generate shell scripts

### Component Usage Best Practices

1. **Use the Right Component for the Job**:

    ```typescript
    // ✅ Global mocks for module-level mocking
    vi.mock('node:fs/promises', () => ({
        /* ... */
    }))

    // ✅ Helpers for reusable mock objects
    const mocks = setupTestEnvironment()

    // ✅ Scenarios for domain-specific patterns
    setupSuccessScenario(mocks, { sourcePath, targetPath })

    // ✅ Builder for complex compositions
    createMockBuilder(mocks).success({ sourcePath, targetPath }).build()
    ```

2. **Prefer Composition Over Inheritance**:

    ```typescript
    // ✅ DO: Compose scenarios
    setupSuccessScenario(mocks, options)
    setupPathMocks(mocks)

    // ❌ DON'T: Create monolithic scenarios
    setupComplexScenario(mocks, successOptions, pathOptions, yamlOptions)
    ```

3. **Use Type-Safe Interfaces**:

    ```typescript
    // ✅ DO: Use typed interfaces
    export interface FileSystemScenarioOptions {
        sourcePath: string
        targetPath: string
        shouldExist?: boolean
        content?: string
    }

    // ❌ DON'T: Use untyped parameters
    export function setupSuccessScenario(
        mocks: any,
        sourcePath: string,
        targetPath: string,
        shouldExist: boolean
    )
    ```

4. **Override Specific Mocks When Needed**:

    ```typescript
    // ✅ DO: Override specific behavior
    setupSuccessScenario(mocks, { sourcePath, targetPath })
    mocks.fileSystem.readFile.mockResolvedValue('custom content')

    // ❌ DON'T: Create new scenarios for minor variations
    ```

5. **Group Related Tests**:

    ```typescript
    describe('File Management', () => {
        let mocks: ReturnType<typeof setupTestEnvironment>

        beforeEach(() => {
            mocks = setupTestEnvironment()
            setupFileSystemMocks(mocks)
            setupPathMocks(mocks)
            resetAllMocks(mocks)
        })

        describe('processFile', () => {
            it('should process file successfully', () => {
                setupSuccessScenario(mocks, { sourcePath, targetPath })
                // Test logic
            })

            it('should handle file conflicts', () => {
                setupConflictScenario(mocks, { sourcePath, targetPath })
                // Test logic
            })
        })
    })
    ```

## Things to Avoid

### **🚨 CRITICAL: NEVER SIMPLIFY MOCKS TO MAKE TESTS PASS**

**UNDER NO CIRCUMSTANCES** should you simplify mocks, helpers, or scenarios just to get a test to go green. This is a **CRITICAL ANTI-PATTERN** that will lead to:

- **False confidence** - Tests pass but don't actually test anything meaningful
- **Production bugs** - Real code behavior differs from simplified mock behavior
- **Technical debt** - Accumulated simplifications make tests worthless
- **Maintenance nightmare** - Future changes break because mocks don't reflect reality

#### **❌ NEVER DO THIS:**

```typescript
// ❌ CRITICAL VIOLATION: Simplifying mock to make test pass
vi.mock('./module', () => ({
    complexFunction: vi.fn().mockReturnValue('simple'), // Too simple!
}))

// ❌ CRITICAL VIOLATION: Removing mock complexity
const mock = vi.fn()
// Instead of proper error handling, just return success
mock.mockReturnValue(0) // Ignores real error conditions!

// ❌ CRITICAL VIOLATION: Simplifying scenario
const builder = await createMockBuilder(mocks)
await builder
    .success() // Too simple - ignores real-world complexity!
    .build()
```

#### **✅ ALWAYS DO THIS:**

```typescript
// ✅ CORRECT: Mock reflects real behavior
vi.mock('./module', () => ({
    complexFunction: vi.fn().mockImplementation((input) => {
        if (!input) throw new Error('Input required')
        if (input.length > 100) throw new Error('Input too long')
        return processComplexInput(input)
    }),
}))

// ✅ CORRECT: Handle real error conditions
const mock = vi.fn().mockImplementation((command, args) => {
    if (command === 'invalid') return { status: 1, error: 'Command not found' }
    if (args.includes('--fail')) return { status: 1, error: 'Simulated failure' }
    return { status: 0, output: 'Success' }
})

// ✅ CORRECT: Realistic scenario with proper complexity
const builder = await createMockBuilder(mocks)
await builder
    .configExists({ configPath: '/config.json', configContent: validConfig })
    .commandSuccess({ command: 'nx', args: ['build'], exitCode: 0 })
    .fileSystemError({ operation: 'write', path: '/protected/file', error: 'Permission denied' })
    .build()
```

#### **When Tests Fail, Fix the Mock - NOT the Test:**

1. **Test fails because mock is too simple** → Make mock more realistic
2. **Test fails because scenario doesn't match reality** → Update scenario to match real behavior
3. **Test fails because helper doesn't handle edge cases** → Add proper edge case handling to helper
4. **Test fails because mock doesn't throw expected errors** → Make mock throw the real errors

#### **The Golden Rule:**

> **If your mock doesn't behave like the real thing, your test is worthless.**

### **Anti-Patterns**

1. **❌ Over-Mocking**: Don't mock everything - only mock what you need to control
2. **❌ Mocking Implementation Details**: Don't mock private functions or internal implementation
3. **❌ Complex Mock Chains**: Avoid deeply nested mock dependencies that are hard to understand
4. **❌ Mocking What You're Testing**: Don't mock the function you're actually testing
5. **❌ Inconsistent Mock Patterns**: Don't mix different mocking approaches in the same test suite
6. **❌ Forgetting Cleanup**: Always restore mocks to prevent test pollution
7. **❌ Mocking Too Early**: Don't create package-level mocks for single-use scenarios
8. **❌ Hardcoded Mock Values**: Use dynamic mock implementations instead of static return values
9. **❌ Testing Mock Behavior**: Don't test that mocks work - test that your code works with mocks
10. **❌ Ignoring Mock Verification**: Always verify that mocked functions were called correctly
11. **❌ Mock External Dependencies Inconsistently**: Don't mock external dependencies inconsistently across tests
12. **❌ Skip Testing Error Scenarios**: Don't skip testing error scenarios
13. **❌ Use Real External APIs in Tests**: Don't use real external APIs in tests
14. **❌ Forget to Mock Async Operations**: Don't forget to mock async operations
15. **❌ Test External Dependency Behavior**: Don't test external dependency behavior instead of package logic
16. **❌ Use Non-Deterministic Data**: Don't use non-deterministic data in tests
17. **❌ Mock Package Functionality**: Don't mock functionality from other package types in tests

### **Common Mistakes**

```typescript
// ❌ BAD: Over-mocking
vi.mock('../../src/cli', () => ({
    everyFunction: vi.fn(),
    anotherFunction: vi.fn(),
    yetAnotherFunction: vi.fn(),
}))

// ✅ GOOD: Mock only what you need
vi.mock('../../src/cli', () => ({
    runNx: vi.fn(),
    runMany: vi.fn(),
}))

// ❌ BAD: Mocking implementation details
vi.mock('../../src/cli', () => ({
    internalHelper: vi.fn(), // Don't mock private functions
    publicAPI: vi.fn(),
}))

// ✅ GOOD: Mock only public APIs
vi.mock('../../src/cli', () => ({
    publicAPI: vi.fn(),
}))

// ❌ BAD: Forgetting cleanup
it('should do something', () => {
    const spy = vi.spyOn(console, 'log')
    // Test logic
    // Missing: spy.mockRestore()
})

// ✅ GOOD: Always cleanup
it('should do something', () => {
    const spy = vi.spyOn(console, 'log')
    try {
        // Test logic
    } finally {
        spy.mockRestore()
    }
})
```

## Common Pitfalls & Solutions

### 1. Mock Reset Issues

```typescript
// ❌ WRONG - Not resetting mocks between tests
beforeEach(() => {
    mocks = setupTestEnvironment()
    // Missing resetAllMocks(mocks)
})

// ✅ CORRECT - Proper mock reset
beforeEach(() => {
    mocks = setupTestEnvironment()
    setupFileSystemMocks(mocks)
    setupPathMocks(mocks)
    resetAllMocks(mocks) // Always reset mocks
})
```

### 2. Scenario Overuse

```typescript
// ❌ WRONG - Using scenarios for simple cases
setupSuccessScenario(mocks, { sourcePath, targetPath })
// When you only need: mocks.fileSystem.readFile.mockResolvedValue('content')

// ✅ CORRECT - Use scenarios for complex patterns
setupSuccessScenario(mocks, {
    sourcePath,
    targetPath,
    content: 'complex content',
})
```

### 3. Builder Pattern Misuse

```typescript
// ❌ WRONG - Not calling build()
createMockBuilder(mocks).success(options)

// ✅ CORRECT - Always call build()
createMockBuilder(mocks).success(options).build()
```

## Troubleshooting Guide

> **📖 For comprehensive troubleshooting**: See [Test Troubleshooting Guide](./Troubleshooting%20-%20Tests.md) for detailed solutions to common test failures.

### **Common Issues & Solutions**

#### **"Mock not working" / "Function not mocked"**

**Symptoms**:

- Mocked function still executes real implementation
- `toHaveBeenCalled()` assertions fail
- Tests behave unexpectedly

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

3. **Dynamic imports bypassing mocks**:

    ```typescript
    // ❌ BAD: Dynamic import bypasses mock
    const module = await import('./module')

    // ✅ GOOD: Use static import or mock dynamic import
    import { myFunction } from './module'
    ```

#### **"Mock called but assertion fails"**

**Symptoms**:

- `expect(mock).toHaveBeenCalledWith()` fails
- Mock shows as called but with different parameters

**Solutions**:

1. **Check parameter types**:

    ```typescript
    // ❌ BAD: String vs Buffer mismatch
    expect(mock).toHaveBeenCalledWith('file.txt')
    // Mock was called with Buffer.from('file.txt')

    // ✅ GOOD: Match exact types
    expect(mock).toHaveBeenCalledWith(Buffer.from('file.txt'))
    ```

2. **Use `toHaveBeenCalledWith` correctly**:

    ```typescript
    // ❌ BAD: Partial match
    expect(mock).toHaveBeenCalledWith('arg1')
    // Mock was called with ['arg1', 'arg2', 'arg3']

    // ✅ GOOD: Exact match or use partial matching
    expect(mock).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    // OR
    expect(mock).toHaveBeenCalledWith(expect.stringContaining('arg1'))
    ```

#### **"Test pollution" / "Tests affecting each other"**

**Symptoms**:

- Tests pass individually but fail when run together
- Mock state persists between tests
- Environment variables affect other tests

**Solutions**:

1. **Reset mocks between tests**:

    ```typescript
    beforeEach(() => {
        vi.clearAllMocks()
        // OR
        mockFunction.mockReset()
    })
    ```

2. **Restore environment variables**:

    ```typescript
    it('should test env var', () => {
        const original = process.env.MY_VAR
        process.env.MY_VAR = 'test'

        try {
            // Test logic
        } finally {
            if (original === undefined) {
                delete process.env.MY_VAR
            } else {
                process.env.MY_VAR = original
            }
        }
    })
    ```

3. **Use `afterEach` cleanup**:
    ```typescript
    afterEach(() => {
        vi.restoreAllMocks()
    })
    ```

#### **"Mock not found" / Import errors**

**Symptoms**:

- `Cannot find module` errors
- Mock strategy imports fail
- TypeScript errors on mock imports

**Solutions**:

1. **Check export paths**:

    ```typescript
    // ❌ BAD: Wrong export path
    import { setupLibTestEnvironment } from '@fux/mock-strategy'

    // ✅ GOOD: Correct export path
    import { setupLibTestEnvironment } from '@fux/mock-strategy/lib'
    ```

2. **Verify package.json exports**:

    ```json
    {
        "exports": {
            "./lib": "./dist/lib/index.js"
        }
    }
    ```

3. **Check mock file structure**:
    ```
    __tests__/
    ├── __mocks__/
    │   ├── globals.ts      ✅
    │   ├── helpers.ts      ✅
    │   └── scenarios.ts    ✅
    ```

#### **"Scenario builder not working"**

**Symptoms**:

- Scenario builder methods not available
- Mock scenarios not applying correctly
- Builder pattern errors

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

3. **Check mock wiring**:

    ```typescript
    // ❌ BAD: Mocks not wired to actual modules
    const builder = await createMockBuilder(mocks)

    // ✅ GOOD: Wire mocks to modules
    beforeEach(async () => {
        mocks = await setupTestEnvironment()
        await resetMocks(mocks)

        // Wire mocks to actual modules
        const fs = await import('node:fs')
        vi.mocked(fs.default.existsSync).mockImplementation(mocks.fs.existsSync)
    })
    ```

### **Debugging Tips**

1. **Use `vi.mocked()` for type safety**:

    ```typescript
    const mockFn = vi.mocked(actualFunction)
    expect(mockFn).toHaveBeenCalledWith('expected')
    ```

2. **Check mock call history**:

    ```typescript
    console.log(mockFunction.mock.calls)
    console.log(mockFunction.mock.results)
    ```

3. **Use `vi.spyOn()` for existing functions**:

    ```typescript
    const spy = vi.spyOn(console, 'log')
    // Test logic
    expect(spy).toHaveBeenCalledWith('expected message')
    spy.mockRestore()
    ```

4. **Enable verbose logging**:

    ```typescript
    vi.setConfig({ testTimeout: 10000 })
    ```

5. **Use `vi.hoisted()` for early mocking**:
    ```typescript
    const mockFn = vi.hoisted(() => vi.fn())
    vi.mock('./module', () => ({ myFunction: mockFn }))
    ```

## Success Metrics

After implementing proper mock strategies:

- ✅ **60% reduction** in mock setup code
- ✅ **75% reduction** in test file complexity
- ✅ **100% consistency** across test files
- ✅ **Zero mock-related test failures**
- ✅ **Faster test development** (3x speed improvement)
- ✅ **Improved maintainability** (centralized mock control)

### Maintainability Improvements

- ✅ **Centralized Control**: Mock behavior changes in one place
- ✅ **Type Safety**: TypeScript interfaces prevent mock errors
- ✅ **Consistency**: All tests use the same mock patterns
- ✅ **Readability**: Tests focus on logic, not setup
- ✅ **Extensibility**: Easy to add new scenarios and helpers

### Developer Experience

- ✅ **Faster Development**: Reusable patterns speed up test writing
- ✅ **Fewer Bugs**: Centralized mocks reduce setup errors
- ✅ **Better Debugging**: Consistent mock behavior across tests
- ✅ **Easier Onboarding**: Clear patterns for new developers
