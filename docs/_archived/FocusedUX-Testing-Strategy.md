# FocusedUX Testing Strategy

## **Quick Reference**

### **Testing Approach Decision Tree**

```
Are you testing a SHARED package?
├─ YES → Use Mockly (import vscode normally)
└─ NO → Are you testing a CORE package?
    ├─ YES → Use Mockly via DI injection
    └─ NO → Are you testing an EXTENSION package?
        ├─ YES → Use standard vi.mock('vscode') (confirm with user first)
        └─ Performance-critical test?
            ├─ YES → Use comprehensive vi.mock('vscode') (document exception)
            └─ NO → Use standard VSCode mocking patterns
```

### **Test Lane Selection**

| Scenario    | Command          | Coverage | Speed   | Use Case                          |
| ----------- | ---------------- | -------- | ------- | --------------------------------- |
| Development | `t`              | ❌       | ⚡ Fast | Daily development, quick feedback |
| Validation  | `tc`             | ✅       | 🐌 Slow | CI/CD, coverage enforcement       |
| Debugging   | `t -s --verbose` | ❌       | ⚡ Fast | Troubleshooting, detailed output  |

### **Common Patterns Quick Reference**

#### **Shared Package Testing**

```typescript
// ✅ CORRECT - Import normally, Mockly handles mocking
import * as vscode from 'vscode'

describe('Window Tests', () => {
    it('should show message', async () => {
        await vscode.window.showInformationMessage('test')
        // Test assertions here...
    })
})
```

#### **Core Package Testing**

```typescript
// ✅ CORRECT - Use Mockly via DI injection
import { mockly } from '@fux/mockly'

const container = createCoreContainer({
    fileSystem: mockly.workspace.fs,
    window: mockly.window,
    // ... other dependencies
})
```

#### **Extension Package Testing**

```typescript
// ✅ CORRECT - Use standard VSCode mocking (confirm architecture with user first)
vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        showQuickPick: vi.fn(),
    },
    workspace: {
        getConfiguration: vi.fn(),
        onDidChangeConfiguration: vi.fn(),
    },
    Uri: {
        file: vi.fn(),
    },
    // ... other VSCode APIs as needed
}))
```

---

## **Core Testing Architecture**

### **Shared Package Testing with Mockly**

**CRITICAL: Shared packages use Mockly for testing, NOT direct VSCode mocking.**

- **Shared packages import VSCode types and values for implementation** (during actual runtime)
- **Tests import VSCode normally** - the `vscode-test-adapter.ts` redirects to Mockly
- **Mockly provides comprehensive VSCode API mocks** - no manual mocking needed
- **Full decoupling** through DI and adapters

### **❌ FORBIDDEN: Direct VSCode Mocking**

**NEVER use `vi.mock('vscode')` in shared package test files. This completely bypasses Mockly and breaks the testing architecture.**

```typescript
// ❌ WRONG - This breaks Mockly integration
vi.mock('vscode', () => ({
    window: { showInformationMessage: vi.fn() },
}))

// ✅ CORRECT - Import normally, let Mockly handle mocking
import * as vscode from 'vscode'
const message = await vscode.window.showInformationMessage('test')
```

### **Test File Management and Performance**

**CRITICAL: Large test files can cause significant performance issues and hanging behavior.**

- **Test File Size Limits**: Keep test files under 500 lines for optimal performance
- **Focused Test Organization**: Group related functionality in separate test files
- **Proactive Splitting**: Split large test files before they cause performance issues
- **Internal Method Mocking**: Mock complex internal methods to prevent test timeouts

#### **Test File Splitting Guidelines**

```typescript
// ✅ GOOD - Focused test files by functionality
IconActionsService.quickpick.test.ts  // Quick pick functionality
IconActionsService.assign.test.ts     // Icon assignment
IconActionsService.theme.test.ts      // Theme generation
IconActionsService.utils.test.ts      // Utility methods

// ❌ BAD - Large monolithic test file
IconActionsService.test.ts  // 750+ lines, causes performance issues
```

#### **Internal Method Mocking**

```typescript
// ✅ CORRECT - Mock complex internal methods to prevent timeouts
const service = new IconActionsService(mockDependencies)
vi.spyOn(service, 'regenerateAndApplyTheme').mockResolvedValue(undefined)

// ❌ WRONG - Calling complex internal methods can cause timeouts
await service.regenerateAndApplyTheme() // May cause test to hang
```
```

### **⚠️ EXCEPTION: Performance-Critical Test Files**

**ONLY when Mockly is not available or when dealing with performance-critical test files that import VSCode directly:**

- **Use comprehensive VSCode mocks** that include ALL required exports
- **Measure performance impact** before and after to validate improvements
- **Apply targeted optimizations** only to specific slow tests, avoiding global changes
- **Document the exception** with clear rationale for future maintenance

```typescript
// ⚠️ ALLOWED ONLY for performance-critical tests when Mockly unavailable
vi.mock('vscode', () => ({
    TreeItem: vi.fn().mockImplementation((label, collapsibleState) => ({
        label,
        collapsibleState,
        description: undefined,
        tooltip: undefined,
        contextValue: undefined,
        iconPath: undefined,
        command: undefined,
    })),
    ThemeIcon: vi.fn().mockImplementation((id, color) => ({ id, color })),
    EventEmitter: vi.fn().mockImplementation(() => ({
        event: vi.fn(),
        fire: vi.fn(),
        dispose: vi.fn(),
    })),
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    // Include ALL other required exports...
}))
```

### **✅ CORRECT: Normal VSCode Imports**

Tests should import VSCode APIs normally:

```typescript
// ✅ CORRECT - This will use Mockly via the test adapter
import * as vscode from 'vscode'

describe('Window Tests', () => {
    it('should show message', async () => {
        // Mockly provides the mock implementation automatically
        await vscode.window.showInformationMessage('test')
        // Test assertions here...
    })
})
```

---

## **Core Package Testing Architecture**

### **Architectural Compliance Verification**

Core packages MUST follow strict architectural patterns to maintain separation of concerns:

#### **✅ CORRECT: Core Package Architecture**

```typescript
// ✅ CORRECT - Core package container accepts dependencies as parameters
export function createCoreContainer(dependencies: {
    fileSystem: {
        access: (path: string) => Promise<void>
        copyFile: (src: string, dest: string) => Promise<void>
        stat: (path: string) => Promise<import('vscode').FileStat>
        readFile: (path: string) => Promise<string>
        writeFile: (path: string, data: Uint8Array) => Promise<void>
    }
    window: {
        showErrorMessage: (message: string) => Promise<string | undefined>
        showTimedInformationMessage: (message: string, duration?: number) => void
    }
    terminal: {
        activeTerminal: import('vscode').Terminal | undefined
        createTerminal: (options?: import('vscode').TerminalOptions) => import('vscode').Terminal
    }
}) {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY,
    })

    // Register dependencies as provided
    container.register({
        fileSystem: asValue(dependencies.fileSystem),
        window: asValue(dependencies.window),
        terminal: asValue(dependencies.terminal),
    })

    // Register core services
    container.register({
        projectButlerService: asClass(ProjectButlerService).singleton(),
    })

    return container
}
```

#### **❌ FORBIDDEN: Direct Shared Imports**

```typescript
// ❌ WRONG - Core package importing shared adapters directly
import { FileSystemAdapter } from '@fux/shared'

export class ProjectButlerService {
    constructor(private fileSystem: FileSystemAdapter) {}
    // This creates tight coupling and makes testing difficult
}
```

### **Testing Setup Patterns**

#### **Vitest Wrapper Functions**

Create Vitest-compatible mocks around Mockly methods to enable spying:

```typescript
// ✅ CORRECT - Wrapper functions for spying
const mockShowErrorMessage = vi.fn().mockImplementation((message: string) => {
    return mockly.window.showErrorMessage(message)
})

const mockFsStat = vi.fn().mockImplementation((path: string) => {
    return mockly.workspace.fs.stat(path)
})

const mockTerminalSendText = vi.fn().mockImplementation((text: string) => {
    return mockly.window.activeTerminal?.sendText(text)
})
```

#### **Mock Clearing Protocol**

Prevent test state leakage with `beforeEach` clearing:

```typescript
beforeEach(() => {
    // Clear all wrapper mocks to prevent test interference
    mockShowErrorMessage.mockClear()
    mockFsStat.mockClear()
    mockTerminalSendText.mockClear()
    // ... clear all other mocks
})
```

#### **Test Service Creation**

Create test services with mock dependencies:

```typescript
function createTestProjectButlerService() {
    return createCoreContainer({
        fileSystem: {
            access: mockFsAccess,
            copyFile: mockFsCopyFile,
            stat: mockFsStat,
            readFile: mockFsReadFile,
            writeFile: mockFsWriteFile,
        },
        window: {
            showErrorMessage: mockShowErrorMessage,
            showTimedInformationMessage: mockShowTimedInformationMessage,
        },
        terminal: {
            activeTerminal: mockly.window.activeTerminal,
            createTerminal: vi.fn().mockReturnValue({
                sendText: mockTerminalSendText,
                show: mockTerminalShow,
                // ... other terminal methods
            }),
        },
    })
}
```

### **Verification Checklist**

Before implementing core package testing, verify:

- [ ] **No direct shared imports** in core package source code
- [ ] **Dependencies accepted as parameters** in container creation
- [ ] **Mockly used for testing** via DI injection
- [ ] **Vitest wrapper functions** created for spying capabilities
- [ ] **Mock clearing** implemented in `beforeEach`
- [ ] **Test isolation** maintained between test cases
- [ ] **Architectural compliance** verified against patterns

---

## **Extension Package Testing**

### **Thin Wrapper Principle**

Extension packages must act as thin wrappers around core functionality:

#### **✅ CORRECT: Extension Testing**

```typescript
// ✅ CORRECT - Test only VSCode integration, mock shared adapters
vi.mock('@fux/shared', () => ({
    FileSystemAdapter: vi.fn().mockImplementation(() => ({
        stat: mockFsStat,
        access: mockFsAccess,
        copyFile: mockFsCopyFile,
        readFile: mockFsReadFile,
        writeFile: mockFsWriteFile,
    })),
    WindowAdapter: vi.fn().mockImplementation(() => ({
        showErrorMessage: mockShowErrorMessage,
        showTimedInformationMessage: mockShowTimedInformationMessage,
    })),
    // ... other adapters
}))

// Test VSCode integration only
describe('Extension Activation', () => {
    it('should register commands', () => {
        // Test command registration
        expect(mockExtensionAPI.registerCommand).toHaveBeenCalledWith(
            'fux.projectButler.updateTerminalPath',
            expect.any(Function)
        )
    })
})
```

#### **❌ FORBIDDEN: Business Logic in Extensions**

```typescript
// ❌ WRONG - Testing business logic in extension
describe('File System Operations', () => {
    it('should copy files', async () => {
        // This belongs in core package tests, not extension tests
        await fileSystem.copyFile('/src/file.txt', '/dest/file.txt')
        expect(mockFsCopyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt')
    })
})
```

### **DI Container Mocking**

Mock the DI container directly to ensure proper test isolation:

```typescript
vi.mock('../src/injection.js', async () => {
    const actual = await vi.importActual('../src/injection.js')
    return {
        ...actual,
        createDIContainer: vi.fn().mockImplementation(async () => {
            const { createContainer, InjectionMode, asValue } = await import('awilix')

            const container = createContainer({
                injectionMode: InjectionMode.PROXY,
            })

            // Register mock adapters and services
            container.register({
                fileSystem: asValue({
                    stat: mockFsStat,
                    access: mockFsAccess,
                    // ... other methods
                }),
                // ... other dependencies
            })

            return container
        }),
    }
})
```

---

## **Test Lanes**

The monorepo uses two test lanes to balance speed and coverage:

### **Functional Tests (Fast, No Coverage)**

- **Purpose**: Verify functionality works correctly
- **Coverage**: Disabled for speed
- **Files**: `**/*.test.ts` only
- **Command**: `t` (target package only) or `tf` (full dependency chain)

### **Coverage Tests (Slower, With Coverage)**

- **Purpose**: Measure code coverage and run edge cases
- **Coverage**: Enabled with detailed reporting
- **Files**: Both `**/*.test.ts` and `**/*.cov.ts`
- **Command**: `tc` (target package only) or `tfc` (full dependency chain)

**Note**: For detailed alias descriptions, see `.vscode/shell/pnpm_aliases.json`

---

## **🚨 CRITICAL TESTING ARCHITECTURE RULE 🚨**

### **Core Packages: NO Shared Imports During Tests**

**Core packages should NEVER import from @fux/shared during tests. EVER.**

This is a fundamental architectural rule that prevents circular dependency issues and ensures proper test isolation. When testing core packages:

- ❌ **NO imports from @fux/shared**
- ❌ **NO shared library involvement**
- ❌ **NO shared adapter imports**
- ✅ **ONLY Mockly shims injected through DI**
- ✅ **ONLY Mockly services for all dependencies**

**Why This Rule Exists:**

1. **Shared packages import VSCode** - They need VSCode to create adapters
2. **Core packages import shared types** - They need interfaces for type safety
3. **Tests don't have VSCode** - VSCode isn't available in test environments
4. **Importing shared during tests** - Causes VSCode import failures

**The Solution:**

- **Shared packages** test their adapters by mocking VSCode directly with `vi.mock('vscode')`
- **Core packages** test business logic by injecting Mockly shims directly (no shared imports)
- **Extension packages** test integration using DI containers with Mockly shims

### **🚨 WHY NOT HARD-CODED MOCKS? 🚨**

**The Problem with Hard-Coded Mocks:**

When you create hard-coded mocks like this:

```typescript
// ❌ WRONG - Hard-coded mocks
vi.mock('@fux/shared', () => ({
    TreeItemAdapter: {
        create: vi.fn().mockReturnValue({
            /* hard-coded object */
        }),
    },
    UriAdapter: {
        file: vi.fn().mockReturnValue({
            /* hard-coded object */
        }),
    },
}))
```

**What Happens:**

1. **You're reinventing the wheel** - Mockly already provides comprehensive VSCode API mocks
2. **Your mocks become stale** - They don't match the real adapter behavior
3. **Tests become brittle** - Hard-coded values break when adapters change
4. **You're still importing shared** - Even though you're mocking it, the import still happens

**The Right Approach - Use Mockly:**

```typescript
// ✅ CORRECT - Use Mockly shims
import { mockly, mocklyService } from '@fux/mockly'

// Mockly provides real VSCode API mocks that adapters can use
const service = new FeatureService(
    mockly.workspace.fs, // Real file system mock
    mockly.window, // Real window mock
    mockly.workspace, // Real workspace mock
    mockly.commands, // Real commands mock
    mockly.node.path // Real path utilities mock
)
```

**Why Mockly is Better:**

1. **Comprehensive coverage** - Mockly mocks ALL VSCode APIs, not just what you think you need
2. **Realistic behavior** - Mockly mocks behave like real VSCode APIs
3. **Maintained** - Mockly is kept up-to-date with VSCode API changes
4. **Consistent** - All packages use the same mock implementations
5. **No shared imports** - Tests never see the shared library

**The Golden Rule:**

> **"If you're mocking @fux/shared, you're doing it wrong. Use Mockly instead."**
>
> - Mockly = ✅ Correct approach
> - Hard-coded mocks = ❌ Wrong approach
> - Importing shared during tests = ❌ Never do this

## **VSCode Test Adapter Ownership**

### **Important Rules**

**The `vscode-test-adapter.ts` file belongs exclusively to the shared package and should not be referenced by other packages.**

#### **Correct Location**

```typescript
// ✅ CORRECT - vscode-test-adapter.ts is inside the shared package
libs/shared/
├── src/
├── __tests__/
├── vscode-test-adapter.ts  // ← This file belongs here
├── vitest.functional.config.ts
└── vitest.coverage.config.ts
```

#### **Shared Package Configuration**

The shared package's vitest config should reference the adapter locally:

```typescript
// libs/shared/vitest.functional.config.ts
export default defineConfig({
    resolve: {
        alias: {
            vscode: path.resolve(__dirname, './vscode-test-adapter.ts'),
        },
    },
})
```

#### **Other Packages Must NOT Reference It**

**Core and Extension Packages:**

```typescript
// ❌ WRONG - Don't reference the shared package's test adapter
resolve: {
    alias: {
        'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
    }
}

// ✅ CORRECT - Only alias shared and mockly
resolve: {
    alias: {
        '@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
        '@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
    }
}
```

#### **Why This Architecture?**

1. **Encapsulation:** Shared package contains everything it needs for testing
2. **Ownership:** Clear ownership of the test adapter
3. **No Cross-Package Dependencies:** Other packages don't depend on shared's test utilities
4. **Consistency:** Follows the established pattern of package self-containment

## **Troubleshooting Guide**

### **🚨 "NO SHARED DURING TESTS" VIOLATIONS 🚨**

**When You See These Errors, You're Violating the "No Shared During Tests" Rule:**

#### **VSCode Import Errors**

**Symptoms:**

```
Error: Cannot find package 'vscode' imported from 'libs/shared/dist/vscode/adapters/Window.adapter.js'
```

**Root Cause:** Your test is importing from `@fux/shared`, which contains VSCode value imports. The shared library is being loaded during tests.

**The Fix:**

1. **Remove ALL imports from @fux/shared in test files**
2. **Use Mockly shims instead**
3. **Ensure your DI container only contains Mockly services**

#### **Module Resolution Failures**

**Symptoms:**

```
Module not found: Can't resolve '@fux/shared' in 'packages/note-hub/core/__tests__/...'
```

**Root Cause:** Your test is trying to import from shared, but the test environment doesn't have access to it.

**The Fix:**

1. **Don't import from shared in tests**
2. **Use Mockly for all dependencies**
3. **Create test-specific DI containers**

#### **Circular Dependency Warnings**

**Symptoms:**

```
Circular dependency detected: packages/note-hub/core -> libs/shared -> packages/note-hub/core
```

**Root Cause:** Core package tests are importing from shared, creating a dependency loop.

**The Fix:**

1. **Break the cycle by removing shared imports**
2. **Use Mockly for all test dependencies**
3. **Ensure tests are completely isolated**

#### **Test Environment Crashes**

**Symptoms:**

```
TypeError: Cannot read properties of undefined (reading 'workspace')
```

**Root Cause:** Test is trying to access VSCode APIs that aren't available in the test environment.

**The Fix:**

1. **Mock VSCode at the module level**
2. **Use Mockly for all VSCode API access**
3. **Never import shared adapters in tests**

**The Complete Fix Pattern:**

```typescript
// ❌ WRONG - This will cause VSCode import failures
import { TreeItemAdapter } from '@fux/shared'

// ✅ CORRECT - Use Mockly directly
import { mockly } from '@fux/mockly'

// ❌ WRONG - Hard-coded mocks
vi.mock('@fux/shared', () => ({
    /* mocks */
}))

// ✅ CORRECT - Mock VSCode, use Mockly for services
vi.mock('vscode', () => ({
    /* VSCode mocks */
}))

// ❌ WRONG - Importing shared in tests
const adapter = new TreeItemAdapter()

// ✅ CORRECT - Use Mockly shims
const service = new FeatureService(mockly.workspace.fs, mockly.window)
```

### **Common Issues and Solutions**

#### **Tests Not Running**

```bash
# Check if tests are actually running vs output suppressed
{alias} t --skip-nx-cache --verbose

# Verify test discovery
{alias} t --list
```

#### **Mockly Integration Issues**

```typescript
// Problem: Tests failing with Mockly methods
// Solution: Use wrapper functions for spying
const mockMethod = vi.fn().mockImplementation((...args) => {
    return mockly.actualMethod(...args)
})
```

#### **Performance Issues**

```bash
# Measure test performance
{alias} t --reporter=verbose

# Identify slow tests
{alias} t --reporter=json | jq '.testResults[].duration'
```

#### **Coverage Issues**

```bash
# Check coverage configuration
{alias} tc --coverage

# Verify coverage files are included
{alias} tc --list
```

### **Debugging Commands**

| Issue            | Command                               | Purpose                     |
| ---------------- | ------------------------------------- | --------------------------- |
| Test discovery   | `{alias} t --list`                    | See which tests are found   |
| Output debugging | `{alias} t --skip-nx-cache --verbose` | See raw test output         |
| Performance      | `{alias} t --reporter=verbose`        | Detailed timing information |
| Coverage         | `{alias} tc --coverage`               | Verify coverage collection  |

---

## **Best Practices**

### **Test Organization**

- **Group related tests** in describe blocks
- **Use descriptive test names** that explain the scenario
- **Keep tests focused** - one assertion per test when possible
- **Use setup/teardown** for common test state

### **Mock Management**

- **Create wrapper functions** for Mockly methods when spying needed
- **Clear mocks in beforeEach** to prevent test interference
- **Use comprehensive mocks** when direct VSCode mocking is required
- **Document exceptions** to direct VSCode mocking

### **Performance Optimization**

- **Measure before optimizing** - identify actual bottlenecks
- **Target specific slow tests** - avoid global optimizations
- **Use appropriate test lanes** - functional for development, coverage for validation
- **Monitor for regressions** - ensure optimizations don't break functionality

### **Documentation**

- **Update Actions Log** for significant testing changes
- **Document new patterns** in this strategy
- **Include failure documentation** - what was tried and failed
- **Share learnings** across the team

## **Migration Checklist**

### **When Fixing Injection Patterns in Existing Packages**

- [ ] **Audit Dependencies:** Ensure no circular imports between packages
- [ ] **Inject Shared Adapters:** All core services should use shared adapters
- [ ] **Use Factory Functions:** Complex services should use `asFunction` registration
- [ ] **Remove Shared Imports from Tests:** Ensure NO @fux/shared imports in test files
- [ ] **Use Mockly in Test Setup:** All test dependencies should come from Mockly
- [ ] **Verify Test Isolation:** Tests should not execute any shared library code
- [ ] **Register Everything:** All services must be in the DI container
- [ ] **Import Interfaces:** Use proper interface imports from core packages
- [ ] **Test Integration:** Verify DI container resolves all dependencies
- [ ] **Remove Manual Construction:** No services created outside container
- [ ] **Validate Hierarchy:** Confirm shared → core → ext dependency flow

### **VSCode Test Adapter Migration Steps**

If you currently have `vscode-test-adapter.ts` at the workspace root:

1. **Move the file** to `libs/shared/vscode-test-adapter.ts`
2. **Update shared package vitest configs** to reference it locally
3. **Remove any references** from other package vitest configs
4. **Delete the root-level file** after confirming shared tests still work

---

> **Note**: This strategy applies to all packages in the FocusedUX monorepo. For package-specific guidance, consult individual package documentation.
