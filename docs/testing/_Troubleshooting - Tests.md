# Test Troubleshooting Guide

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/Mock-Strategy_General.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/Troubleshooting - Tests.md`

---

This document provides solutions to common test failures and issues encountered in the FocusedUX project.

## 🚨 Common Test Failures

### Mock Configuration Error Resolution

**Problem**: Missing exports in mocked Node.js modules cause test failures even when the mocked module isn't directly used in the test code.

**Symptoms:**

- Tests fail with "No 'export' is defined on the 'node:module' mock" errors
- Mocked modules work in some tests but fail in others
- Indirect imports from mocked modules cause failures
- Tests pass individually but fail when run together

**Root Cause**: Incomplete Node.js module mocks that only include exports directly used in tests, missing standard exports that may be imported indirectly.

**Solution**: Use Mock-Strategy_General library functions instead of manual mock creation.

```typescript
// ❌ PROBLEMATIC: Incomplete manual mock
vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('win32'),
        arch: vi.fn().mockReturnValue('x64'),
        // Missing: cpus, freemem, totalmem, uptime, networkInterfaces, hostname, loadavg, endianness, EOL
    },
}))

// ✅ CORRECT: Use Mock-Strategy_General library
import { setupLibTestEnvironment } from '@fux/mock-strategy/lib'

beforeEach(() => {
    const mocks = setupLibTestEnvironment()
    // All Node.js module exports are properly mocked
})
```

**Prevention**: Always use Mock-Strategy_General library functions for Node.js module mocking. Don't manually create Node.js module mocks.

### Test Implementation Iteration Issues

**Problem**: Complex test suites fail with cascading errors that are difficult to debug when implemented all at once.

**Symptoms:**

- Multiple test failures that seem unrelated
- Mock configuration issues that are hard to isolate
- Tests pass individually but fail when run together
- Difficult to identify root cause of failures

**Root Cause**: Implementing all tests at once without incremental validation leads to multiple issues compounding.

**Solution**: Implement tests incrementally, running tests after each major section.

```typescript
// ✅ CORRECT: Incremental test development
describe('ConfigLoader', () => {
    // Step 1: Set up basic structure
    let mocks: ReturnType<typeof setupPackageTestEnvironment>

    beforeEach(() => {
        mocks = setupPackageTestEnvironment()
    })

    // Step 2: Implement one section at a time
    describe('loadConfig', () => {
        it('should load valid configuration', async () => {
            // Test implementation
        })
    })

    // Step 3: Run tests, fix any issues, then move to next section
    describe('reloadConfig', () => {
        it('should reload configuration', async () => {
            // Test implementation
        })
    })
})
```

**Prevention**: Always implement tests incrementally, running tests after each describe block to catch and fix issues early.

### ESM Module Resolution Errors

**Problem**: ESM-based library packages fail with "Cannot find module" errors in test files.

**Symptoms:**

- "Cannot find module" errors for relative imports
- Module resolution failures in test environments
- Tests work in some environments but fail in others
- Import statements fail to resolve correctly

**Root Cause**: Missing .js extensions in relative imports and incorrect relative pathing in ESM test environments.

**Solution**: Always use .js extensions for relative imports and count directory levels correctly.

```typescript
// ❌ PROBLEMATIC: Missing .js extensions
import { setupPackageTestEnvironment } from '../../__mocks__/helpers'
import { MyUtility } from '../../../src/utils/MyUtility'

// ✅ CORRECT: ESM imports with .js extensions
import { setupPackageTestEnvironment } from '../../__mocks__/helpers.js'
import { MyUtility } from '../../../src/utils/MyUtility.js'
```

**Prevention**: Always use .js extensions for relative imports in test files and verify correct relative pathing.

### Process.exit() Testing Issues

**Problem**: Tests fail when trying to test code that calls `process.exit()`

**Symptoms:**

- Tests hang or timeout
- `process.exit` mock not working as expected
- Tests pass individually but fail when run together

**Root Cause**: `process.exit()` behaves differently in test environments - it throws rather than actually exiting the process.

**Solution**: Expect `process.exit()` to throw in test environments

```typescript
// ✅ CORRECT: Expect process.exit() to throw
it('should exit with error code on failure', () => {
    expect(() => main()).toThrow()
})

// ❌ INCORRECT: Don't try to mock process.exit
it('should exit with error code on failure', () => {
    const exitSpy = vi.fn()
    process.exit = exitSpy as any
    main()
    expect(exitSpy).toHaveBeenCalledWith(1)
})
```

**Why this works:**

- `process.exit()` throws in test environments, which is the expected behavior
- Test runners catch these throws and treat them as test completion
- This is the standard pattern across all Node.js testing frameworks

**MANDATORY Pattern**: Always use `expect(() => function()).toThrow()` for testing code that calls `process.exit()`. Never attempt to mock `process.exit` directly.

**Common Scenarios:**

```typescript
// Help command test
it('should display help and exit', () => {
    process.argv = ['node', 'cli.js', '--help']
    expect(() => main()).toThrow()
})

// Error condition test
it('should exit with error on invalid input', () => {
    process.argv = ['node', 'cli.js', 'invalid-command']
    expect(() => main()).toThrow()
})

// Success path that doesn't exit
it('should not exit on successful operation', () => {
    process.argv = ['node', 'cli.js', 'valid-command']
    expect(() => main()).not.toThrow()
})
```

### Shell Script Output Interference

**Problem**: PowerShell or Bash scripts generate unwanted output during tests

**Symptoms:**

- Test output cluttered with shell script messages
- Tests pass but output is noisy
- Shell script output interferes with test debugging

**Root Cause**: Generated shell scripts include `Write-Host` or `echo` commands that execute during tests.

**Solution**: Use shell output control from mock strategy library

```typescript
// In your test setup
import { setupShellOutputControl } from '@fux/mock-strategy/lib'

// Suppress shell output during tests
setupShellOutputControl({ enableConsoleOutput: false })
```

**For PowerShell scripts:**

```powershell
# Wrap Write-Host commands
if ($env:ENABLE_TEST_CONSOLE -ne "false") {
    Write-Host "Refreshing aliases..." -ForegroundColor Yellow
}
```

**For Bash scripts:**

```bash
# Wrap echo commands
if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then
    echo "Refreshing aliases..."
fi
```

### Mock Not Working / Function Not Mocked

**Problem**: Mocked functions still execute real implementation

**Symptoms:**

- `toHaveBeenCalled()` assertions fail
- Tests behave unexpectedly
- Mocked function still performs real operations

**Root Causes & Solutions:**

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

### Regex Debugging and Testing

**Problem**: Complex regex patterns fail in tests or behave unexpectedly

**Symptoms:**

- Regex patterns work in isolation but fail in tests
- Unexpected regex behavior in test environments
- Difficulty understanding complex regex patterns
- Tests fail due to regex edge cases

**Root Cause**: Complex regex patterns require isolated testing to understand behavior and edge cases.

**Solution**: Use Node.js command line testing to debug regex patterns before implementing tests

```bash
# Test regex patterns in isolation
node -e "
const pattern = /Write-Host\s+[^;]+/g;
const text = 'Write-Host \"Hello World\" -ForegroundColor Yellow';
const matches = text.match(pattern);
console.log('Matches:', matches);
"

# Test regex with different inputs
node -e "
const pattern = /echo\s+(-[a-zA-Z]*\s+)?([^;]+)/g;
const testCases = [
    'echo Hello World',
    'echo -n Hello World',
    'echo -e \"Hello\\nWorld\"'
];
testCases.forEach(test => {
    const matches = test.match(pattern);
    console.log('Input:', test);
    console.log('Matches:', matches);
    console.log('---');
});
"
```

**Testing Regex Patterns in Code:**

```typescript
// Test regex patterns in isolation before using in tests
it('should debug regex pattern behavior', () => {
    const pattern = /Write-Host\s+[^;]+/g
    const testInput = 'Write-Host "Hello World" -ForegroundColor Yellow'

    // Debug the pattern
    const matches = testInput.match(pattern)
    console.log('Pattern:', pattern)
    console.log('Input:', testInput)
    console.log('Matches:', matches)

    // Test the pattern
    expect(matches).toHaveLength(1)
    expect(matches[0]).toBe('Write-Host "Hello World" -ForegroundColor Yellow')
})
```

**Common Regex Debugging Techniques:**

1. **Test in Node.js CLI**: Use `node -e` to test patterns quickly
2. **Log Pattern and Input**: Always log the pattern and input for debugging
3. **Test Edge Cases**: Test with empty strings, special characters, and boundary conditions
4. **Use Regex Testers**: Online regex testers can help understand pattern behavior
5. **Break Down Complex Patterns**: Test parts of complex patterns separately

**MANDATORY Pattern**: Always test complex regex patterns in isolation before implementing them in tests. Use Node.js command line testing to understand pattern behavior.

### Test Pollution / Tests Affecting Each Other

**Problem**: Tests pass individually but fail when run together

**Symptoms:**

- Mock state persists between tests
- Environment variables affect other tests
- Tests depend on execution order
- CLI tests fail when run together

**Solutions:**

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

3. **Clean up process.argv manipulation**:

```typescript
it('should test CLI with specific args', () => {
    const originalArgv = process.argv
    process.argv = ['node', 'cli.js', 'test-command']

    try {
        // Test logic that depends on process.argv
        expect(() => main()).toThrow() // or not.toThrow()
    } finally {
        // CRITICAL: Always restore original process.argv
        process.argv = originalArgv
    }
})
```

4. **Use `afterEach` cleanup**:

```typescript
afterEach(() => {
    vi.restoreAllMocks()
})
```

### Process.argv Test Isolation

**Problem**: CLI tests fail when run together due to `process.argv` state pollution

**Symptoms:**

- Tests pass individually but fail in suite
- CLI functions behave differently in different test contexts
- Tests show unexpected command line arguments

**Root Cause**: `process.argv` is a global Node.js variable that persists between tests. When one test modifies it, subsequent tests inherit the modified state.

**Solution**: Always save and restore `process.argv` in CLI tests

```typescript
// ✅ CORRECT: Proper process.argv cleanup
it('should handle help command', () => {
    const originalArgv = process.argv
    process.argv = ['node', 'cli.js', '--help']

    try {
        expect(() => main()).toThrow() // process.exit() throws in tests
    } finally {
        process.argv = originalArgv
    }
})

it('should handle valid command', () => {
    const originalArgv = process.argv
    process.argv = ['node', 'cli.js', 'valid-command']

    try {
        expect(() => main()).not.toThrow()
    } finally {
        process.argv = originalArgv
    }
})
```

**❌ CRITICAL VIOLATION - Don't do this:**

```typescript
// ❌ BAD: No cleanup - causes test pollution
it('should handle help command', () => {
    process.argv = ['node', 'cli.js', '--help']
    expect(() => main()).toThrow()
    // process.argv is now modified for all subsequent tests!
})
```

**Advanced Pattern - Multiple argv scenarios:**

```typescript
describe('CLI argument handling', () => {
    let originalArgv: string[]

    beforeEach(() => {
        originalArgv = [...process.argv]
    })

    afterEach(() => {
        process.argv = originalArgv
    })

    it('should handle help', () => {
        process.argv = ['node', 'cli.js', '--help']
        expect(() => main()).toThrow()
    })

    it('should handle version', () => {
        process.argv = ['node', 'cli.js', '--version']
        expect(() => main()).toThrow()
    })

    it('should handle valid command', () => {
        process.argv = ['node', 'cli.js', 'build']
        expect(() => main()).not.toThrow()
    })
})
```

**Why this is critical:**

- `process.argv` is a global variable shared across all tests
- CLI functions often read `process.argv` to determine behavior
- Without cleanup, tests can interfere with each other's expected behavior
- This is a common source of flaky tests in CLI applications

### Mock Configuration Structure for Complex CLI Testing

**Problem**: CLI tests fail with "Cannot read properties of undefined" errors

**Symptoms:**

- Tests fail when accessing config properties like `config.packages` or `config.expandables`
- Mock configs are incomplete and don't match real config structure
- Tests work individually but fail when config is accessed in different ways

**Root Cause**: CLI applications expect complete configuration objects with all necessary sections. Incomplete mock configs cause undefined property access.

**Solution**: Use complete mock configurations that match real config expectations

```typescript
// ❌ BAD: Incomplete mock config
const mockConfig = {
    packages: {
        'test-package': { targets: ['build'] },
    },
    // Missing: package-targets, not-nx-targets, expandables
}

// ✅ GOOD: Complete mock config
const mockConfig = {
    packages: {
        'test-package': { targets: ['build'] },
        help: { targets: ['help'] },
    },
    'package-targets': {
        'test-package': ['build', 'test'],
    },
    'not-nx-targets': ['help', 'version'],
    expandables: {
        test: 'test-package',
    },
}
```

**Better Solution: Use Mock Strategy Library**

The mock strategy library (`@fux/mock-strategy/lib`) provides a reusable CLI config scenario:

```typescript
import { setupCliConfigScenario, createLibMockBuilder } from '@fux/mock-strategy/lib'

// Direct function usage
it('should handle help command', () => {
    setupCliConfigScenario(mocks, {
        packages: { help: { targets: ['help'] } },
        notNxTargets: ['help', 'version'],
    })

    process.argv = ['node', 'cli.js', 'help']
    expect(() => main()).toThrow()
})

// Fluent builder pattern
it('should handle complex CLI scenario', async () => {
    const builder = await createLibMockBuilder(mocks)
    builder
        .cliConfig({
            packages: { 'test-package': { targets: ['build', 'test'] } },
            packageTargets: { v: 'validate:deps' },
            notNxTargets: ['help', 'version'],
            expandables: { f: 'fix', s: 'skip-nx-cache' },
        })
        .build()

    process.argv = ['node', 'cli.js', 'test-package', 'v']
    expect(() => main()).not.toThrow()
})
```

**Why Use Scenarios:**

- **Reusability** - Create once, use in multiple tests
- **Consistency** - All tests use the same base structure
- **Maintainability** - Update config structure in one place
- **Flexibility** - Override specific sections as needed
- **Documentation** - Scenarios serve as living documentation of expected config structure

### Mock Call Assertion Failures

**Problem**: `expect(mock).toHaveBeenCalledWith()` fails

**Symptoms:**

- Mock shows as called but with different parameters
- Parameter type mismatches
- Partial parameter matching issues

**Solutions:**

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

### ESLint Errors in Tests

**Problem**: ESLint errors in test files

**Common Issues & Solutions:**

1. **`require()` statements**:

```typescript
// ❌ BAD: Causes ESLint error
const childProcess = require('node:child_process')

// ✅ GOOD: Use proper imports
import { spawnSync } from 'node:child_process'
```

2. **Unused variables**:

```typescript
// ❌ BAD: Unused variable
const { command, args } = options

// ✅ GOOD: Prefix unused variables with underscore
const { command: _command, args: _args } = options
```

3. **`any` types**:

```typescript
// ❌ BAD: Using any
const mock = {} as any

// ✅ GOOD: Use proper type assertions
const mock = {} as unknown as SpecificType
```

### TypeScript Compilation Errors in Tests

**Problem**: TypeScript errors when mocking VSCode APIs or complex interfaces

**Common Issues & Solutions:**

1. **VSCode Uri Mocking**:

```typescript
// ❌ BAD: Missing properties
vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })

// ✅ GOOD: Proper type assertion
const mockUri = { fsPath: filePath } as vscode.Uri
vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
```

2. **FileStat Mocking**:

```typescript
// ❌ BAD: Missing required properties
vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: fileTypeValue })

// ✅ GOOD: Include all required properties
vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({
    type: fileTypeValue,
    ctime: 0,
    mtime: 0,
    size: 0,
})
```

3. **WorkspaceFolder Mocking**:

```typescript
// ❌ BAD: Missing required properties
const mockWorkspaceFolder = {
    uri: { fsPath: workspacePath },
}

// ✅ GOOD: Complete WorkspaceFolder interface
const mockWorkspaceFolder = {
    uri: { fsPath: workspacePath } as vscode.Uri,
    name: 'test-workspace',
    index: 0,
} as vscode.WorkspaceFolder
```

4. **Terminal Mocking**:

```typescript
// ❌ BAD: Missing required properties
const mockTerminal = {
    sendText: vi.fn(),
    show: vi.fn(),
    name: terminalName,
} as vscode.Terminal

// ✅ GOOD: Complete Terminal interface
const mockTerminal = {
    sendText: vi.fn(),
    show: vi.fn(),
    name: terminalName,
    processId: Promise.resolve(12345),
    creationOptions: {},
    exitStatus: undefined,
    state: { isInteractedWith: false },
    shellIntegration: undefined,
    hide: vi.fn(),
    dispose: vi.fn(),
} as unknown as vscode.Terminal
```

**Key Principles for VSCode Mocking:**

1. **Always use type assertions** (`as vscode.Type`) for partial mock objects
2. **Include all required properties** when mocking complex interfaces
3. **Use `as unknown as vscode.Type`** for complex type conversions
4. **Be consistent** across all mock calls in the same function
5. **Test your mocks** by running the tests to catch TypeScript errors early

**Common Error Messages and Solutions:**

- `"Argument of type '{ fsPath: string; }' is not assignable to parameter of type 'Uri'"` → Use `as vscode.Uri`
- `"Type '{ ... }' is missing the following properties from type 'FileStat'"` → Add missing properties
- `"Conversion of type '{ ... }' to type 'Terminal' may be a mistake"` → Use `as unknown as vscode.Terminal`
- `"Type '{ ... }' is missing the following properties from type 'WorkspaceFolder'"` → Add `name` and `index` properties

## 🎭 Scenario Builder Troubleshooting

### **"Cannot find module" Error**

**Symptoms**: `Error: Cannot find module '../../src/config.js'`

**Cause**: Wrong import paths in `helpers.ts`

**Solution**: Fix the relative paths:

```typescript
// ❌ Wrong paths
const config = vi.mocked(require('../../src/config.js'))
const shell = vi.mocked(require('../../src/shell.js'))

// ✅ Correct paths (adjust based on your directory structure)
const config = vi.mocked(require('../../../src/config.js'))
const shell = vi.mocked(require('../../../src/shell.js'))
```

### **"createPaeMockBuilder is not a function" Error**

**Symptoms**: `TypeError: createPaeMockBuilder is not a function`

**Cause**: Wrong import path or missing export

**Solution**: Check import path:

```typescript
// ❌ Wrong import
import { createPaeMockBuilder } from '../__mocks__/helpers'

// ✅ Correct import
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
```

### **"Mock not working" Error**

**Symptoms**: Mock returns real values instead of mocked values

**Cause**: Global mock conflicts or cache issues

**Solution**: Use scenario builder instead of manual mocking - it handles these issues automatically.

### **"Scenario builder methods not available" Error**

**Symptoms**: `TypeError: mockBuilder.shellDetection is not a function`

**Cause**: Missing scenario methods in builder

**Solution**: Extend the scenario builder with needed methods:

```typescript
// Add to mock-scenario-builder.ts
shellDetection(type: 'powershell' | 'gitbash' | 'unknown'): PaeMockBuilder {
    this.mocks.shell.detectShell.mockReturnValue(type)
    return this
}
```

### **Shell Detection Mocking Issues**

**Problem**: Shell detection mocking fails with cache conflicts or global mock interference

**Symptoms**:

- Mock returns real shell detection values
- Tests pass individually but fail when run together
- Cache not clearing between tests

**Root Cause**: Shell detection functions often have internal caching that conflicts with manual mocking

**Solution**: Always use scenario builders for shell detection mocking:

```typescript
// ❌ DON'T: Manual mocking approach
const spy = vi.spyOn(shellModule, 'detectShellTypeCached').mockReturnValue('powershell')
// Problems: Cache conflicts, global mock interference, inconsistent behavior

// ✅ DO: Use scenario builder approach
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'

it('should detect PowerShell on Windows', () => {
    const mockBuilder = createPaeMockBuilder()
    mockBuilder.shellDetection('powershell').build()

    const result = expandableProcessor.detectShellType()
    expect(result).toBe('pwsh')
})
```

**Why Scenario Builders Work Better:**

1. **Handles Caching**: Scenario builders properly manage shell detection cache
2. **Avoids Global Conflicts**: Works with global mocks without interference
3. **Consistent Behavior**: Same approach across all shell detection tests
4. **Easy to Maintain**: Changes to shell detection logic update all tests

## 🔧 Global Mock Integration Issues

### **"Global Mock Override" Problem**

**Symptoms**:

- Tests fail with hardcoded values despite local mocking attempts
- Spy call count is 0 (mocked function never called)
- Tests return hardcoded values regardless of local mock setup

**Cause**: Global mocks are overriding local implementations

**Solution**: Update global mocks to integrate with local test needs:

```typescript
// ❌ PROBLEMATIC: Global mock hardcodes return values
vi.mock('../../src/shell.js', () => ({
    detectShellTypeCached: vi.fn().mockReturnValue('powershell'),
}))

// ✅ CORRECT: Global mock integrates with environment variables
vi.mock('../../src/shell.js', () => {
    const detectShell = vi.fn().mockImplementation(() => {
        if (process.env.PSModulePath) return 'powershell'
        if (process.env.MSYS_ROOT) return 'gitbash'
        return 'unknown'
    })

    const detectShellTypeCached = vi.fn().mockImplementation(() => {
        return detectShell() // Use the mocked function
    })

    return { detectShell, detectShellTypeCached, clearShellDetectionCache: vi.fn() }
})
```

### **"Mock Normalization Mismatch" Problem**

**Symptoms**: Tests expect normalized values but get raw values

**Cause**: Mock normalization logic doesn't match real implementation

**Solution**: Ensure mock normalization matches real implementation:

```typescript
// ✅ CORRECT: Mock normalization matches real implementation
detectShellType: vi.fn().mockImplementation(() => {
    const result = mockDetectShellTypeCached()

    // Normalize like real implementation
    if (result === 'powershell') return 'pwsh'
    if (result === 'gitbash') return 'linux'
    return 'cmd'
})
```

### **"ESM Import Issues" Problem**

**Symptoms**: `SyntaxError: Unexpected token '{'` or module resolution errors

**Cause**: Using require() statements in test helpers

**Solution**: Convert to ESM imports:

```typescript
// ❌ PROBLEMATIC: require() in test helpers
const config = vi.mocked(require('../../src/config.js'))
const shell = vi.mocked(require('../../src/shell.js'))

// ✅ CORRECT: ESM imports in test helpers
import * as config from '../../src/config.js'
import * as shell from '../../src/shell.js'

export function setupPaeTestEnvironment(): PaeTestMocks {
    const mockedConfig = vi.mocked(config)
    const mockedShell = vi.mocked(shell)
    // ...
}
```

### **"Test Isolation Failures" Problem**

**Symptoms**: Tests interfere with each other, returning wrong values

**Cause**: Insufficient test isolation setup

**Solution**: Implement complete test isolation:

```typescript
beforeEach(async () => {
    // 1. Clear shell detection cache
    clearShellDetectionCache()

    // 2. Clear environment variables
    delete process.env.PSModulePath
    delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
    delete process.env.PSExecutionPolicyPreference
    delete process.env.MSYS_ROOT
    delete process.env.MINGW_ROOT
    delete process.env.WSL_DISTRO_NAME
    delete process.env.WSLENV
    delete process.env.SHELL

    // 3. Clear all mocks
    vi.clearAllMocks()
})

afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
    clearShellDetectionCache()
})
```

### **"Debugging Mock Issues" Problem**

**Symptoms**: Difficult to determine why mocks aren't working

**Solution**: Use systematic debugging approach:

```typescript
it('should detect PowerShell on Windows', () => {
    // Debug: Log environment variables
    console.log('PSModulePath:', process.env.PSModulePath)

    // Debug: Log cache status
    console.log('Cache cleared:' /* check cache status */)

    // Debug: Log spy calls
    const spy = vi.spyOn(shellModule, 'detectShellTypeCached')
    console.log('Spy call count:', spy.mock.calls.length)

    // Set environment variables
    process.env.PSModulePath = 'C:\\Program Files\\PowerShell\\Modules'

    const result = expandableProcessor.detectShellType()
    expect(result).toBe('pwsh')
})
```

## 🔧 Debugging Tips

### 1. Use `vi.mocked()` for type safety

```typescript
const mockFn = vi.mocked(actualFunction)
expect(mockFn).toHaveBeenCalledWith('expected')
```

### 2. Check mock call history

```typescript
console.log(mockFunction.mock.calls)
console.log(mockFunction.mock.results)
```

### 3. Use `vi.spyOn()` for existing functions

```typescript
const spy = vi.spyOn(console, 'log')
// Test logic
expect(spy).toHaveBeenCalledWith('expected message')
spy.mockRestore()
```

### 4. Enable verbose logging

```typescript
vi.setConfig({ testTimeout: 10000 })
```

### 5. Use `vi.hoisted()` for early mocking

```typescript
const mockFn = vi.hoisted(() => vi.fn())
vi.mock('./module', () => ({ myFunction: mockFn }))
```

### VSCode Extension Testing Issues

**Problem**: Tests fail when testing VSCode extensions

**Symptoms:**

- Command registration issues
- Extension state not resetting between tests
- VSCode API mocks not working correctly
- Tests pass but runtime fails

**Solutions:**

1. **Command registration issues**:

```typescript
// Test actual VSCode integration
it('should register commands', async () => {
    const context = { subscriptions: [] }
    await activate(context as any)

    // Verify command was registered
    expect(vscode.commands.registerCommand).toHaveBeenCalled()
})
```

2. **Extension state issues**:

```typescript
// Reset state between tests
beforeEach(() => {
    vi.clearAllMocks()
    // Reset any global state
})
```

3. **Mock not working**:

```typescript
// Ensure mocks applied before activation
vi.mock('vscode', () => ({
    commands: { registerCommand: vi.fn() },
    window: { showInformationMessage: vi.fn() },
}))

// Import after mocking
import * as vscode from 'vscode'
```

### Build Failures

**Problem**: Build fails with various errors

**Common Issues & Solutions:**

1. **"No inputs were found"**:

```bash
# Check path resolution consistency
nx build package-name --verbose
```

2. **Missing dependencies**:

```json
// Verify externalization in project.json
{
    "targets": {
        "build": {
            "options": {
                "external": ["vscode", "fs", "path"]
            }
        }
    }
}
```

3. **TypeScript errors**:

```json
// Check module resolution settings
{
    "compilerOptions": {
        "moduleResolution": "node",
        "esModuleInterop": true
    }
}
```

### Common Solutions

**Double test execution**:

```json
// Remove global targetDefaults conflicts
{
    "targetDefaults": {
        "test": {
            "dependsOn": ["^build"]
        }
    }
}
```

**Cache issues**:

```bash
# Use --skip-nx-cache flag
nx test package-name --skip-nx-cache
```

**Path resolution**:

```typescript
// Use consistent absolute/relative paths
import { join } from 'path'
const configPath = join(__dirname, 'config.json')
```

## 🚨 Critical Anti-Patterns

### NEVER Simplify Mocks to Make Tests Pass

**❌ CRITICAL VIOLATION:**

```typescript
// Don't simplify mock to make test pass
vi.mock('./module', () => ({
    complexFunction: vi.fn().mockReturnValue('simple'), // Too simple!
}))
```

**✅ CORRECT APPROACH:**

```typescript
// Mock reflects real behavior
vi.mock('./module', () => ({
    complexFunction: vi.fn().mockImplementation((input) => {
        if (!input) throw new Error('Input required')
        if (input.length > 100) throw new Error('Input too long')
        return processComplexInput(input)
    }),
}))
```

### The Golden Rule

> **If your mock doesn't behave like the real thing, your test is worthless.**

## 📚 Additional Resources

- [Mock Strategy General Guidelines](./Mock-Strategy_General.md)
- [Core Package Mock Strategy](./Mock-Strategy-Core.md)
- [Extension Package Mock Strategy](./Mock-Strategy-Ext.md)
- [Testing Strategy Overview](./_Testing-Strategy.md)

## 🆘 Still Having Issues?

If you're still encountering test failures after trying these solutions:

1. **Check the test logs** for specific error messages
2. **Run tests individually** to isolate the issue
3. **Use `--verbose` flag** for more detailed output
4. **Check mock call history** to see what's actually being called
5. **Verify test isolation** by running tests in different orders
6. **Ask for help** - include the specific error message and test code

