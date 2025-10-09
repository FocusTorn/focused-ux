# (AI) Troubleshooting - Tests

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **TESTING_STRATEGY**: `docs/testing/_Testing-Strategy.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/(AI) _Troubleshooting- Tests.md`

### **AI Testing Documentation References**

- **AI_TESTING_BASE**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **AI_MOCKING_BASE**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **AI_LIBS_SPECIFIC**: `docs/testing/(AI) _Strategy- Specific- Libs.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all test troubleshooting decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **MANDATORY TROUBLESHOOTING PROTOCOL**

### **CRITICAL TROUBLESHOOTING SEQUENCE**

**MANDATORY**: Execute this sequence for EVERY test failure:

1. **Check Build Status**: Ensure build is clean before investigating test failures
2. **Verify Mock Setup**: Check if mocks are properly configured
3. **Validate Test Environment**: Ensure test environment is properly set up
4. **Check Error Context**: Analyze error message and context
5. **Apply Solution**: Implement appropriate solution based on error type
6. **Verify Fix**: Re-run tests to confirm fix

**VIOLATION PENALTY**: Any deviation from this sequence constitutes a critical failure requiring immediate acknowledgment and correction.

## **COMMON TEST FAILURES AND SOLUTIONS**

### **Build-Related Failures**

#### **"Build failed before tests"**

**Symptoms**:

- Tests fail with build errors
- TypeScript compilation errors
- Missing dependencies

**Solutions**:

1. **Fix build errors first**:

    ```bash
    pae {package} b
    ```

2. **Check for TypeScript errors**:

    ```bash
    npx tsc --noEmit
    ```

3. **Verify dependencies**:
    ```bash
    pnpm install
    ```

#### **"Module not found" errors**

**Symptoms**:

- `Cannot find module` errors
- Import path resolution failures
- Missing file errors

**Solutions**:

1. **Check import paths**:

    ```typescript
    // ❌ BAD: Wrong path
    import { service } from './Service'

    // ✅ GOOD: Correct path
    import { service } from './Service.js'
    ```

2. **Verify file existence**:

    ```bash
    ls -la path/to/file
    ```

3. **Check ESM import requirements**:
    ```typescript
    // Always use .js extension for ESM imports
    import { helper } from '../../__mocks__/helpers.js'
    ```

### **Mock-Related Failures**

#### **"Mock not working" / "Function not mocked"**

**Symptoms**:

- Mocked function still executes real implementation
- `toHaveBeenCalled()` assertions fail
- Tests behave unexpectedly

**Solutions**:

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

### **Test Environment Failures**

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

### **Scenario Builder Failures**

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

### **ESM Import Failures**

#### **"ESM import resolution errors"**

**Symptoms**:

- `Cannot resolve module` errors
- Import path resolution failures
- Module not found errors

**Solutions**:

1. **Use correct ESM import paths**:

    ```typescript
    // ❌ BAD: Missing .js extension
    import { helper } from '../../__mocks__/helpers'

    // ✅ GOOD: Include .js extension
    import { helper } from '../../__mocks__/helpers.js'
    ```

2. **Check directory depth**:

    ```typescript
    // From __tests__/functional-tests/services/ConfigLoader.service.test.ts
    import { setupPaeTestEnvironment } from '../../__mocks__/helpers.js'

    // From __tests__/functional-tests/utils/SomeUtil.test.ts
    import { setupPaeTestEnvironment } from '../../__mocks__/helpers.js'
    ```

3. **Verify file existence**:
    ```bash
    ls -la libs/project-alias-expander/__tests__/__mocks__/helpers.js
    ```

### **Node.js Module Mock Failures**

#### **"No export is defined on the mock"**

**Symptoms**:

- `No "cpus" export is defined on the "node:os" mock`
- Missing exports in Node.js module mocks
- Mock not returning all required exports

**Solutions**:

1. **Add missing exports to global mocks**:

    ```typescript
    // In packages/{package}/__tests__/__mocks__/globals.ts
    vi.mock('node:os', () => ({
        default: {
            cpus: vi.fn(),
            freemem: vi.fn(),
            totalmem: vi.fn(),
            uptime: vi.fn(),
            networkInterfaces: vi.fn(),
            hostname: vi.fn(),
            loadavg: vi.fn(),
            endianness: vi.fn(),
            EOL: '\n',
        },
        cpus: vi.fn(),
        freemem: vi.fn(),
        totalmem: vi.fn(),
        uptime: vi.fn(),
        networkInterfaces: vi.fn(),
        hostname: vi.fn(),
        loadavg: vi.fn(),
        endianness: vi.fn(),
        EOL: '\n',
    }))
    ```

2. **Use mock strategy library**:

    ```typescript
    import { setupLibTestEnvironment } from '@fux/mock-strategy/lib'

    const mocks = await setupLibTestEnvironment()
    // This handles all Node.js module mocking
    ```

## **DEBUGGING TECHNIQUES**

### **Mock Debugging**

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

### **Test Environment Debugging**

1. **Enable verbose logging**:

    ```typescript
    vi.setConfig({ testTimeout: 10000 })
    ```

2. **Use `vi.hoisted()` for early mocking**:

    ```typescript
    const mockFn = vi.hoisted(() => vi.fn())
    vi.mock('./module', () => ({ myFunction: mockFn }))
    ```

3. **Check test isolation**:
    ```typescript
    beforeEach(() => {
        vi.clearAllMocks()
        vi.clearAllTimers()
    })
    ```

## **ERROR RECOVERY PROTOCOL**

### **When Tests Fail**

1. **Identify Error Type**: Categorize the error (build, mock, environment, etc.)
2. **Apply Appropriate Solution**: Use the corresponding solution from this document
3. **Verify Fix**: Re-run tests to confirm the fix works
4. **Document Solution**: If it's a new error pattern, document it for future reference

### **When Solutions Don't Work**

1. **Check Build Status**: Ensure build is clean
2. **Verify Mock Setup**: Check if mocks are properly configured
3. **Check Test Environment**: Ensure test environment is properly set up
4. **Review Error Context**: Analyze the full error message and stack trace
5. **Apply Alternative Solutions**: Try different approaches from this document

## **SUCCESS METRICS**

After implementing proper troubleshooting strategies:

- ✅ **Zero test-related failures**
- ✅ **Faster error resolution** (3x speed improvement)
- ✅ **Consistent troubleshooting patterns** across packages
- ✅ **Improved debugging** (systematic approach)
- ✅ **Better maintainability** (documented solutions)

## **VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Test failures → "Check build status first"
- **MANDATORY**: Mock failures → "Check mock setup and configuration"
- **MANDATORY**: Environment failures → "Check test environment setup"
- **MANDATORY**: Import failures → "Check ESM import requirements"

### **Pattern Recognition**

- Error type → Determines troubleshooting approach
- Error context → Determines solution strategy
- Test scope → Determines debugging technique
- Package type → Determines specific solutions
- User question type → Determines response strategy

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Build status verification
- Mock setup validation
- Test environment verification
- Error type identification

### **HIGH PRIORITY (Execute before proceeding)**

- Solution application
- Fix verification
- Error recovery execution
- Pattern compliance verification

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

---

## **4. :: ESM Module Import Resolution Issues**

### **4.1. :: Module Resolution Errors**

**Error**: `Cannot find package '@ms-core' imported from...`

**Root Cause**: Path aliases not configured or ESM import syntax not used

**Solutions**:

1. **Verify Path Aliases**: Check both `tsconfig.base.json` and `vitest.config.ts`

    ```json
    // tsconfig.base.json
    {
        "compilerOptions": {
            "baseUrl": ".",
            "paths": {
                "@ms-core": ["libs/mock-strategy/src/core/index.ts"]
            }
        }
    }
    ```

    ```typescript
    // vitest.config.ts
    export default defineConfig({
        resolve: {
            alias: {
                '@ms-core': resolve(__dirname, '../../../libs/mock-strategy/src/core/index.ts'),
            },
        },
    })
    ```

2. **Check ESM Import Syntax**: Use `import` not `require`
    - **✅ CORRECT**: `import { setupCoreTestEnvironment } from '@ms-core'`
    - **❌ INCORRECT**: `const { setupCoreTestEnvironment } = require('@ms-core')`

3. **Verify Package Build**: Ensure mock strategy is built (`pae ms b`)

### **4.2. :: Dual Configuration Requirements**

**Error**: Tests pass but builds fail (or vice versa)

**Root Cause**: Path aliases only configured in one location

**Solution**: Configure aliases in both locations for dual resolution

- **Build-time resolution**: `tsconfig.base.json`
- **Test-time resolution**: `vitest.config.ts`

---

## **5. :: Function Name Matching Issues**

### **5.1. :: Function Not Found Errors**

**Error**: `(0, setupFileSystemMocks) is not a function`

**Root Cause**: Imported function name doesn't match actual export name

**Solutions**:

1. **Check Exact Function Names**: Verify actual exports from global mock strategy

    ```typescript
    // Check what's actually exported
    import * as coreStrategy from '@ms-core'
    console.log(Object.keys(coreStrategy))
    ```

2. **Use Import Aliasing**: Resolve naming conflicts

    ```typescript
    import {
        setupFileSystemMocks as setupGlobalFileSystemMocks,
        setupPathMocks as setupGlobalPathMocks,
    } from '@ms-gen'
    ```

3. **Common Name Mistakes**:
    - **Assumed**: `setupCoreFileSystemMocks` (with prefix)
    - **Actual**: `setupFileSystemMocks` (no prefix)

### **5.2. :: Reference Documentation**

Each global mock strategy provides these exact function names:

- **`@ms-gen`**: `setupFileSystemMocks`, `setupPathMocks`, `setupOsMocks`, `setupProcessMocks`
- **`@ms-core`**: `setupCoreTestEnvironment`, `resetCoreMocks`
- **`@ms-ext`**: `setupExtensionTestEnvironment`, `resetExtensionMocks`, `setupVSCodeMocks`

---

## **6. :: Build Dependency Issues**

### **6.1. :: Test Debugging Problems**

**Error**: Tests pass but debugging is difficult or slow

**Root Cause**: Wrong build dependency for test type

**Solution**: Use appropriate build dependencies

```json
{
    "targets": {
        "test": {
            "dependsOn": ["build:dev", "^build"] // Dev build for debugging
        },
        "test:integration": {
            "dependsOn": ["build", "^build"] // Prod build for real-world testing
        }
    }
}
```

### **6.2. :: Build Configuration Rationale**

- **Unit Tests with `build:dev`**:
    - Unbundled code for step-through debugging
    - Sourcemaps for detailed error traces
    - Faster rebuild cycles for iteration

- **Integration Tests with `build`**:
    - Bundled/minified production artifacts
    - Real-world performance validation
    - Actual deployment artifact testing

---

## **7. :: Mock Strategy Architecture Issues**

### **7.1. :: Wrong Mock Strategy Selection**

**Error**: Node.js built-ins in wrong strategy (e.g., `path` in `@ms-lib`)

**Root Cause**: Incorrect understanding of mock strategy hierarchy

**Solution**: Use proper mock strategy hierarchy

- **`@ms-gen`** → Node.js built-ins (`fs/promises`, `path`, `os`, `child_process`)
- **`@ms-core`** → Business logic packages (extends `@ms-gen`)
- **`@ms-ext`** → VSCode extensions (extends `@ms-gen`)
- **`@ms-lib`** → Shared/consumed libraries

### **7.2. :: Mock Strategy Extension Problems**

**Error**: "Cannot extend class" or "Property not accessible"

**Root Cause**: Incorrect extension pattern or access modifiers

**Solution**: Use proper extension pattern

```typescript
// Base class with protected mocks
export class GeneralMockBuilder {
    constructor(protected mocks: GeneralTestMocks) {}
}

// Extended class with override
export class CoreMockBuilder extends GeneralMockBuilder {
    override build(): CoreTestMocks {
        return this.mocks as CoreTestMocks
    }
}
```

---

## **DYNAMIC MANAGEMENT NOTE**

This document is optimized for AI internal processing and may be updated dynamically based on operational needs and pattern recognition. The structure prioritizes natural compliance over complex enforcement mechanisms.
