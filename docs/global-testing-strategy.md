# Global Testing Strategy

This document captures practical testing strategies across the monorepo. It is intentionally living and adaptive. It is NOT a single source of truth; testing is fluid and package-specific. Use these sections as strong starting points and troubleshooting references, then adapt to local constraints.

## 1. :: Structure <!-- Start Fold -->

- **Libs packages**: `@fux/shared`, `@fux/mockly`
- **Core packages**: Domain/service logic (no VSCode value imports)
- **Ext packages**: VSCode extensions (UI/adapters/providers/commands)

###### END: Structure <!-- Close Fold -->

## 2. :: Core Principles <!-- Start Fold -->

- Determinism first: Prefer synchronous, deterministic flows; mock timers, isolate I/O, control randomness.
- Adapter boundaries: VSCode value imports MUST live in shared adapters; tests for consumers use adapters, not raw VSCode.
- Localize mocks: Mock only what's needed per file. Prefer narrow `vi.mock('vscode', ...)` stubs.
- Cross-platform assertions: Normalize paths before comparing; avoid platform-coupled expectations.
- Silence by default: Suppress console output in tests unless explicitly enabled for debugging.
- Minimal fixture shape: Provide only the properties a test uses; smaller mocks are more maintainable.

###### END: Core Principles <!-- Close Fold -->

## 3. :: Test Lanes: Functional vs Coverage (All Packages) <!-- Start Fold -->

- **Goal:** Keep day-to-day feedback fast while preserving 100% coverage guarantees.
- **Directory Layout (convention):**
    - Functional tests (default fast lane): `__tests__/` excluding `__tests__/coverage/**`.
    - Coverage-only tests: `__tests__/coverage/**` for defensive, logging, and non-behavioral branches.
- **Configs (per package):**
    - Functional: `vitest.functional.config.ts` excluding `__tests__/coverage/**`.
    - Full + coverage: `vitest.coverage.config.ts` including both globs.
    - Shared setup filename: `_setup.ts` (renamed from `setup.ts`) for console/mocks.
- **Nx Targets:**
    - `test` → functional lane (fast) for target package only.
    - `test:full` → full + coverage lane (enables coverage reporters) for target package and all dependencies.
- **Aka Aliases:**
    - `t` → `test` (functional tests for target package)
    - `tf` → `test:full` (coverage tests for target package and dependencies)
    - `tc` → `test:full` with coverage output
    - `tfc` → `test:full` with coverage output
    - `tch` → `test:full` with coverage output
- **Guardrails:**
    - Only place tests in `coverage/` if their sole purpose is to exercise unreachable/defensive/log-only paths.
    - Keep behavior and contract tests in the functional lane.
    - Prefer removing coverage-only tests that do not move metrics or verify behavior.
- **CI:**
    - PR validation: functional lane.
    - Nightly/coverage job: coverage lane with thresholds.

###### END: Test Lanes: Functional vs Coverage (All Packages) (END) <!-- Close Fold -->

## 4. :: Libs Packages Strategy (Shared + Mockly) <!-- Start Fold -->

### 4.1. :: @fux/shared <!-- Start Fold -->

#### 4.1.1. Policies

- Do NOT use `@fux/mockly` in shared tests. `@fux/shared` directly wraps VSCode values into adapters.
- Use localized `vi.mock('vscode', ...)` per test file with only the required symbols.

#### 4.1.2. What Worked (Best Practices)

- Localized `vscode` mocks per file with only required symbols (e.g., `Uri.file`, `window.showInformationMessage`).
- Hoisted pre-import mocks to break static cycles: mock `../src/vscode/adapters/Uri.adapter.js` before importing `VSCodeUriFactory` in tests that exercise factory defaults.
- Console control via env: In `libs/shared/__tests__/_setup.ts`, silence `console.*` unless `ENABLE_TEST_CONSOLE=true`.
- Timer determinism: Use `vi.useFakeTimers()` where applicable; explicitly run/clear timers.
- Path normalization: Replace `\\` with `/` prior to assertions; prefer path-content checks over exact platform-specific strings.
- Target defensive branches, not logs: Assert behavioral outcomes (fallback URIs, filtered inputs) rather than console side effects.
- Narrow factories: Use minimal fake implementations for adapters and factories to keep tests predictable and small.

#### 4.1.3. What Did Not Work / To Avoid

- Using Mockly inside shared tests: Creates circular dependency risk and violates adapter boundary rules.
- Asserting on console output: Leads to brittle tests and noise; logs are diagnostics, not behavior.
- Top-level variables inside `vi.mock` factories: Vitest hoists `vi.mock`; referencing outer variables causes ReferenceErrors.
- Relying on real timers/config: Non-deterministic durations cause flakiness.
- Platform-specific path assertions: Breaks on Windows vs POSIX.

#### 4.1.4. Pitfalls & Error Corrections (Catalog)

1. Static initialization loop (UriAdapter ↔ VSCodeUriFactory)
    - Symptom: Importing `VSCodeUriFactory` triggers `UriAdapter` default factory before tests can override.
    - Fix: Hoist a mock for `../src/vscode/adapters/Uri.adapter.js` before importing the factory in tests that need it.

2. Vitest hoist ReferenceError in `vi.mock`
    - Symptom: "There was an error when mocking a module" due to referencing top-level variables inside mock factory.
    - Fix: Define spies within the `vi.mock` factory and assert via `await import('vscode')` instance.

3. Timer-driven UI behavior
    - Symptom: Flaky tests around dropdown/description resets.
    - Fix: Mock duration sources; when needed, use fake timers and advance explicitly.

4. Path separator inconsistencies
    - Symptom: Failing assertions on Windows due to `\\`.
    - Fix: Normalize paths (`.replace(/\\/g, '/')`) prior to compare.

5. Over-mocking VSCode
    - Symptom: Large, drifting mocks across many tests.
    - Fix: Per-test, provide only the symbols exercised; keep mocks tiny.

#### 4.1.5. Test Lanes & Commands

- Quick: `shared t` (functional tests for shared package only)
- Coverage: `shared tf` (coverage tests for shared package and dependencies)

#### 4.1.6. Implementation Details (Functional/Coverage Split)

- **Directory layout:**
    - Functional: `libs/shared/__tests__/**/*.test.ts`
    - Coverage-only: `libs/shared/__tests__/coverage/**/*.test.ts`
- **Vitest configs:**
    - `libs/shared/vitest.functional.config.ts` → `test.include` targets `__tests__/**/*.ts` and excludes `__tests__/coverage/**`; `setupFiles` = `__tests__/_setup.ts`.
    - `libs/shared/vitest.coverage.config.ts` → includes both functional and coverage-only test globs; `setupFiles` = `__tests__/_setup.ts`; coverage reporters set (v8/istanbul).
- **Nx targets:**
    - `@fux/shared:test` → functional config.
    - `@fux/shared:test:full` → coverage config.
- **Rules for placement:**
    - Put timing, log-only, and defensive-guard assertions under `coverage/`.
    - Keep adapter behavior and contract tests in the functional lane.
- **Naming:** Prefer directory-based separation over suffixes for clarity; if needed, optional suffix `.coverage.test.ts` within the `coverage/` directory.

#### 4.1.7. Coverage Targets (Guidance)

- Aim for ~100% statements/lines; exclude `src/_interfaces/**` as needed. Console-only lines may remain uncovered.

#### 4.1.8. Troubleshooting

- "Mock hoisting" error: Ensure spies are declared inside `vi.mock` factory; avoid outer-scope references.
- Circular import: Hoist `vi.mock('../src/vscode/adapters/Uri.adapter.js', ...)` before importing factories.
- Flaky timers: Use fake timers and explicit `vi.runAllTimers()` or set deterministic durations via config mocks.
- Platform path failures: Normalize paths in assertions.
- Noisy tests: Toggle `ENABLE_TEST_CONSOLE=true` only when debugging.

> Note: To improve coverage without changing behavior, non-essential console logging used purely for debugging MAY be commented out (or marked with c8 ignore) in libs. Prefer preserving warn/error that inform users; remove or comment verbose info/logs.

#### 4.1.9. Current Test Structure Example

**File Organization:**

```
libs/shared/
├── __tests__/
│   ├── _setup.ts                           # Global test setup
│   ├── window.adapter.test.ts              # Functional tests
│   ├── uri.adapter.test.ts                 # Functional tests
│   ├── file-system.adapter.test.ts         # Functional tests
│   └── coverage/                           # Coverage-only tests
│       ├── window.adapter.branches.test.ts # Defensive branch coverage
│       ├── window.adapter.duration-branches.test.ts
│       └── path-utils.adapter.branches.test.ts
├── vitest.functional.config.ts             # Fast lane config
└── vitest.coverage.config.ts               # Coverage lane config
```

**Vitest Functional Config:**

```typescript
import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
    ...base,
    root: __dirname,
    test: {
        ...base.test,
        setupFiles: ['./__tests__/_setup.ts'],
        // Exclude coverage-only tests from functional runs
        exclude: ['**/__tests__/coverage/**'],
    },
    resolve: {
        alias: {
            '@fux/shared': path.resolve(__dirname, './src/index.ts'),
            '@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
            vscode: path.resolve(__dirname, '../../vscode-test-adapter.ts'),
        },
    },
    optimizeDeps: { exclude: ['vscode'] },
})
```

**Vitest Coverage Config:**

```typescript
import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
    ...base,
    root: __dirname,
    test: {
        ...base.test,
        setupFiles: ['./__tests__/_setup.ts'],
        // Include everything (functional + coverage-only tests)
        coverage: {
            ...base.test?.coverage,
            enabled: true,
            reporter: ['text', 'html'],
        },
    },
    resolve: {
        alias: {
            '@fux/shared': path.resolve(__dirname, './src/index.ts'),
            '@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
            vscode: path.resolve(__dirname, '../../vscode-test-adapter.ts'),
        },
    },
    optimizeDeps: { exclude: ['vscode'] },
})
```

**Project.json Test Targets:**

```json
{
    "test": {
        "executor": "@nx/vite:test",
        "outputs": ["{options.reportsDirectory}"],
        "options": {
            "configFile": "libs/shared/vitest.functional.config.ts",
            "reporters": "default"
        }
    },
    "test:full": {
        "executor": "@nx/vite:test",
        "outputs": ["{options.reportsDirectory}"],
        "options": {
            "configFile": "libs/shared/vitest.coverage.config.ts",
            "reporters": "default"
        }
    }
}
```

**Setup File (\_setup.ts):**

```typescript
import { vi } from 'vitest'
import process from 'node:process'
import type { IUri } from '../src/_interfaces/IVSCode.js'
import type { IUriFactory } from '../src/_interfaces/IUriFactory.js'
import { UriAdapter } from '../src/vscode/adapters/Uri.adapter.js'

const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

class LocalMockUriFactory implements IUriFactory {
    file(path: string): IUri {
        const mockUri = {
            fsPath: path,
            path,
            scheme: 'file',
            authority: '',
            query: '',
            fragment: '',
            toString: () => `file://${path}`,
        }
        return new UriAdapter(mockUri as any)
    }
    // ... other methods
}

UriAdapter.setFactory(new LocalMockUriFactory())
```

###### END: @fux/shared (END) <!-- Close Fold -->

### 4.2. :: @fux/mockly <!-- Start Fold -->

#### 4.2.1. Policies

- Tests verify Mockly shim semantics; keep fast and isolated.
- Avoid coupling to shared adapters or specific consumer packages.

#### 4.2.2. What Worked (Best Practices)

- In-memory state and path normalization ensuring cross-platform consistency.
- Deterministic document/editor semantics (e.g., trailing newline preservation in `MockTextDocument`).
- Use of `mockly.env.clipboard` for workflows requiring clipboard.

#### 4.2.3. What Did Not Work / To Avoid

- Over-expanding shim surfaces beyond realistic VSCode contracts.
- Coupling Mockly tests to DI containers or specific consumer wiring.

#### 4.2.4. Pitfalls & Error Corrections (Catalog)

- Ensure shim behaviors match VSCode contracts; add missing members only when required by consumers.
- Preserve document semantics precisely (e.g., `getText()` mirrors content including trailing newline when applicable).

#### 4.2.5. Test Lanes & Commands

- Quick: `mockly t` (functional tests for mockly package only)
- Coverage: `mockly tf` (coverage tests for mockly package and dependencies)

#### 4.2.6. Coverage Targets (Guidance)

- High coverage on core shims and observable behavior; avoid asserting on console.

#### 4.2.7. Troubleshooting

- Cross-platform path behavior: normalize and compare predictable shapes.
- Isolation: reset internal state between tests if applicable.

###### END: @fux/mockly (END) <!-- Close Fold -->

###### END: Libs Packages Strategy (Shared + Mockly) (END) <!-- Close Fold -->

## 5. :: Core Packages Strategy <!-- Start Fold -->

### 5.1. :: Applicability

- Domain logic, services, and utilities that must remain decoupled from VSCode values.
- Business logic that will be consumed by extension packages and potentially orchestrator packages.

### 5.2. :: Testing Approach

**Mockly-First Strategy:** Core packages should use Mockly for testing since shared adapters are abstractions of VSCode values that Mockly already mocks.

**Why Mockly for Core:**
- Shared adapters are thin wrappers around VSCode APIs
- Mockly provides realistic VSCode-like behavior at the source
- No need to reinvent mocking logic
- Consistent testing approach across all package types

### 5.3. :: Test Structure

**Directory Layout:**
```
packages/{feature}/core/
├── __tests__/
│   ├── _setup.ts                           # Test setup with Mockly
│   ├── services/
│   │   ├── FeatureService.test.ts          # Functional tests
│   │   └── AnotherService.test.ts
│   └── coverage/                           # Coverage-only tests
│       ├── FeatureService.branches.test.ts # Defensive branch coverage
│       └── ErrorHandling.test.ts           # Error path coverage
├── vitest.functional.config.ts             # Fast lane config
└── vitest.coverage.config.ts               # Coverage lane config
```

**Setup File (_setup.ts):**
```typescript
import { vi } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'

// Reset Mockly state between tests
beforeEach(() => {
    mocklyService.reset()
})

// Mock console output unless debugging
if (process.env.ENABLE_TEST_CONSOLE !== 'true') {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}
```

### 5.4. :: Testing Patterns

#### 5.4.1. :: Service Testing with Mockly

```typescript
// packages/{feature}/core/__tests__/services/FeatureService.test.ts
import { mockly, mocklyService } from '@fux/mockly'
import { FeatureService } from '../../src/services/FeatureService.js'

describe('FeatureService', () => {
    let service: FeatureService

    beforeEach(() => {
        mocklyService.reset()
        // Inject Mockly shims directly - they implement the same interfaces
        service = new FeatureService(
            mockly.workspace.fs,  // Mockly's mocked file system
            mockly.window,        // Mockly's mocked window
            mockly.workspace      // Mockly's mocked workspace
        )
    })

    it('should process file successfully', async () => {
        // Mockly provides realistic VSCode-like behavior
        mockly.workspace.fs.access = vi.fn().mockResolvedValue(undefined)
        mockly.workspace.fs.readFile = vi.fn().mockResolvedValue('file content')
        mockly.workspace.fs.writeFile = vi.fn().mockResolvedValue(undefined)
        
        await service.processFile('/test/path')
        
        expect(mockly.workspace.fs.writeFile).toHaveBeenCalledWith('/test/path', expect.any(String))
    })

    it('should handle file not found errors', async () => {
        mockly.workspace.fs.access = vi.fn().mockRejectedValue(new Error('Not found'))
        
        await expect(service.processFile('/nonexistent')).rejects.toThrow('Not found')
        expect(mockly.window.showErrorMessage).toHaveBeenCalledWith('File not found: /nonexistent')
    })
})
```

#### 5.4.2. :: Business Logic Testing

```typescript
it('should apply business rules correctly', async () => {
    // Test business logic independent of VSCode APIs
    const result = await service.applyBusinessRule('input data')
    
    expect(result).toMatchObject({
        status: 'success',
        processedData: expect.any(String)
    })
})

it('should validate input parameters', () => {
    expect(() => service.processData('')).toThrow('Input cannot be empty')
    expect(() => service.processData(null)).toThrow('Input is required')
})
```

### 5.5. :: Mockly Usage Best Practices

**✅ DO:**
- Use `mocklyService.reset()` in `beforeEach` for test isolation
- Mock specific Mockly methods when you need custom behavior
- Test business logic independently of VSCode API behavior
- Use Mockly's realistic defaults when possible

**❌ DON'T:**
- Create custom mocks for shared adapter interfaces
- Assume Mockly behavior without testing it
- Skip `mocklyService.reset()` between tests
- Test VSCode API behavior instead of business logic

### 5.6. :: Test Lanes & Commands

- Quick: `{package-alias} t` (functional tests for target package only)
- Coverage: `{package-alias} tf` (coverage tests for target package and dependencies)

**Examples:**
- `gw t` → functional tests for ghost-writer-core only
- `gw tf` → coverage tests for ghost-writer-core and all dependencies

### 5.7. :: Coverage Targets

- Aim for 100% on business logic and service methods
- Coverage-only tests should focus on defensive branches and error paths
- Exclude interface definitions and type-only files

### 5.8. :: Pitfalls to Avoid

- **Importing VSCode values directly:** Keep value imports in shared only
- **Large, shared global mocks:** Prefer per-suite isolation with Mockly
- **Testing VSCode API behavior:** Focus on business logic outcomes
- **Complex mock setup:** Use Mockly's realistic defaults when possible

###### END: Core Packages Strategy (END) <!-- Close Fold -->

## 6. :: Extension Packages Strategy <!-- Start Fold -->

### 6.1. :: Applicability

- VSCode extensions (providers, commands, UI flows).
- Integration between core logic and VSCode extension context.

### 6.2. :: Testing Approach

**Integration-First Strategy:** Extension packages should use integration testing with the DI container and Mockly shims for realistic VSCode behavior.

**Why Integration for Extensions:**
- Extensions orchestrate multiple services and adapters
- DI container wiring is complex and should be tested
- Mockly provides realistic VSCode environment simulation
- End-to-end workflows are more valuable than isolated unit tests

### 6.3. :: Test Structure

**Directory Layout:**
```
packages/{feature}/ext/
├── __tests__/
│   ├── _setup.ts                           # Test setup with Mockly
│   ├── integration/                        # Integration tests (primary)
│   │   ├── FeatureWorkflow.test.ts         # End-to-end workflows
│   │   └── CommandExecution.test.ts        # Command integration tests
│   ├── unit/                               # Unit tests (minimal)
│   │   └── Adapter.test.ts                 # Local adapter tests
│   └── coverage/                           # Coverage-only tests
│       └── ErrorHandling.test.ts           # Error path coverage
├── vitest.functional.config.ts             # Fast lane config
└── vitest.coverage.config.ts               # Coverage lane config
```

**Setup File (_setup.ts):**
```typescript
import { vi } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'
import { createDIContainer } from '../src/injection.js'

// Reset Mockly state between tests
beforeEach(() => {
    mocklyService.reset()
})

// Mock console output unless debugging
if (process.env.ENABLE_TEST_CONSOLE !== 'true') {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}
```

### 6.4. :: Testing Patterns

#### 6.4.1. :: Integration Testing with DI Container

```typescript
// packages/{feature}/ext/__tests__/integration/FeatureWorkflow.test.ts
import { mockly, mocklyService } from '@fux/mockly'
import { createDIContainer } from '../../src/injection.js'
import type { AwilixContainer } from 'awilix'

describe('Feature Workflow Integration', () => {
    let container: AwilixContainer
    let mockContext: any

    beforeEach(async () => {
        mocklyService.reset()
        
        // Create mock VSCode context
        mockContext = {
            subscriptions: [],
            workspaceState: mockly.Memento,
            globalState: mockly.Memento,
            extensionPath: '/test/extension',
            storagePath: '/test/storage',
        }
        
        // Create DI container with Mockly shims
        container = await createDIContainer(mockContext)
    })

    it('should complete full user workflow', async () => {
        // Setup test environment
        await mockly.workspace.fs.writeFile(
            mockly.Uri.file('/test/workspace/file.txt'),
            new TextEncoder().encode('test content')
        )
        
        // Execute workflow through DI container
        const featureService = container.resolve('iFeatureService')
        const result = await featureService.executeWorkflow('/test/workspace/file.txt')
        
        // Verify end-to-end behavior
        expect(result).toBeDefined()
        expect(mockly.window.showInformationMessage).toHaveBeenCalledWith(
            expect.stringContaining('Workflow completed')
        )
    })

    it('should handle command execution', async () => {
        // Test command registration and execution
        const commandService = container.resolve('iCommandService')
        
        await commandService.executeCommand('feature.processFile', '/test/file.txt')
        
        expect(mockly.commands.executeCommand).toHaveBeenCalledWith(
            'feature.processFile',
            '/test/file.txt'
        )
    })
})
```

#### 6.4.2. :: Command Testing

```typescript
it('should register commands correctly', async () => {
    const extension = container.resolve('extensionService')
    
    // Verify commands are registered
    expect(mockly.commands.registerCommand).toHaveBeenCalledWith(
        'feature.processFile',
        expect.any(Function)
    )
})

it('should handle command errors gracefully', async () => {
    // Mock file system error
    mockly.workspace.fs.access = vi.fn().mockRejectedValue(new Error('Permission denied'))
    
    const commandService = container.resolve('iCommandService')
    
    await expect(commandService.executeCommand('feature.processFile', '/protected/file.txt'))
        .rejects.toThrow('Permission denied')
    
    expect(mockly.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process file')
    )
})
```

#### 6.4.3. :: UI Provider Testing

```typescript
it('should provide tree view data', async () => {
    const treeProvider = container.resolve('iTreeDataProvider')
    
    // Mock workspace data
    mockly.workspace.workspaceFolders = [
        { uri: mockly.Uri.file('/test/workspace'), name: 'Test Workspace' }
    ]
    
    const treeItems = await treeProvider.getChildren()
    
    expect(treeItems).toHaveLength(1)
    expect(treeItems[0].label).toBe('Test Workspace')
})

it('should handle empty workspace gracefully', async () => {
    const treeProvider = container.resolve('iTreeDataProvider')
    
    // Mock empty workspace
    mockly.workspace.workspaceFolders = []
    
    const treeItems = await treeProvider.getChildren()
    
    expect(treeItems).toHaveLength(0)
})
```

### 6.5. :: Mockly Usage Best Practices

**✅ DO:**
- Use `mocklyService.reset()` in `beforeEach` for test isolation
- Mock VSCode context and environment realistically
- Test end-to-end workflows through the DI container
- Verify UI interactions and command executions
- Use Mockly's built-in mocks (Uri, Memento, etc.)

**❌ DON'T:**
- Test individual services in isolation (use integration approach)
- Mock VSCode APIs directly (use Mockly shims)
- Skip DI container setup in tests
- Test implementation details instead of user workflows

### 6.6. :: Test Lanes & Commands

- Quick: `{package-alias} t` (functional tests for target package only)
- Coverage: `{package-alias} tf` (coverage tests for target package and dependencies)

**Examples:**
- `gw t` → functional tests for ghost-writer-ext only
- `gw tf` → coverage tests for ghost-writer-ext and all dependencies

### 6.7. :: Coverage Targets

- Aim for high coverage on workflow execution paths
- Focus on user-facing functionality and error handling
- Coverage-only tests should target defensive branches and edge cases

### 6.8. :: Pitfalls to Avoid

- **Asserting against wrong window instance:** Use the injected mock instance
- **Timing flakiness:** Prefer deterministic durations and fake timers in UI tests
- **Over-mocking:** Let Mockly handle most VSCode API simulation
- **Testing implementation details:** Focus on user workflow outcomes

### 6.9. :: Testing Extension Lifecycle

```typescript
it('should activate extension correctly', async () => {
    const extension = container.resolve('extensionService')
    
    await extension.activate()
    
    expect(mockly.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Extension activated')
    )
})

it('should deactivate extension gracefully', async () => {
    const extension = container.resolve('extensionService')
    
    await extension.deactivate()
    
    // Verify cleanup
    expect(extension.isActive).toBe(false)
})
```

###### END: Extension Packages Strategy (END) <!-- Close Fold -->

## 7. :: Toolchain Resilience & Safeguards (Stdlib/TypeScript) <!-- Start Fold -->

- **Safe Cleanup:** When removing generated artifacts, scope deletion to the package (e.g., `libs/shared/**/*.d.ts, *.js.map`). Do not touch `node_modules/**`.
- **Check-Types Config:** If using a check-only tsconfig, avoid `composite` with `noEmit: true`. Use `noEmit: true` without `composite`, or keep `composite` in build configs only.
- **Stdlib Verification:** If errors like `TS2318 Cannot find global type 'Array'` or missing `lib.dom.d.ts` appear:
    - Reinstall toolchain: `pnpm add -D -w typescript@<workspace-version>` then `pnpm install`.
    - Confirm stdlibs exist: `node_modules/typescript/lib/lib.es2022.d.ts`, `lib.dom.d.ts`.
    - Re-run: `shared tsc`.
- **Pin Libraries:** Explicitly set `compilerOptions.lib` where appropriate (e.g., `["ES2022", "DOM"]`) for packages that need DOM types.
- **Source of Truth:** Keep `tsconfig.base.json` paths stable; prefer additive changes and avoid transient rewrites.

###### END: Toolchain Resilience & Safeguards (Stdlib/TypeScript) (END) <!-- Close Fold -->

## 8. :: Aka Aliases & Test Commands <!-- Start Fold -->

### 8.1. :: Nx Test Targets

The workspace provides two fundamental test targets:

- **`test`**: Runs tests for the target package only (fast lane)
- **`test:full`**: Runs tests for the target package and all packages in its dependency chain (coverage lane)

### 8.2. :: Aka Aliases

The `aka` package provides convenient aliases that add necessary flags to alter the test resultset:

| Alias | Command                          | Description                                            |
| ----- | -------------------------------- | ------------------------------------------------------ |
| `t`   | `test`                           | Run functional tests for target package only           |
| `tf`  | `test:full`                      | Run coverage tests for target package and dependencies |
| `tc`  | `test:full` with coverage output | Run coverage tests with terminal coverage output       |
| `tfc` | `test:full` with coverage output | Run coverage tests with terminal coverage output       |
| `tch` | `test:full` with coverage output | Run coverage tests with terminal coverage output       |

### 8.3. :: Usage Examples

**Functional Testing (Fast Lane):**

```bash
# Run functional tests for target package only
gw t          # ghost-writer-ext functional tests
ccp t         # context-cherry-picker-ext functional tests
pb t          # project-butler-ext functional tests
shared t      # shared library functional tests
```

**Coverage Testing (Full Lane):**

```bash
# Run coverage tests for target package and dependencies
gw tf         # ghost-writer-ext + all dependencies
ccp tf        # context-cherry-picker-ext + all dependencies
pb tf         # project-butler-ext + all dependencies
shared tf     # shared library + all dependencies
```

**Coverage with Output:**

```bash
# Run coverage tests with coverage output
gw tc         # ghost-writer-ext coverage with output
ccp tc        # context-cherry-picker-ext coverage with output
pb tc         # project-butler-ext coverage with output
```

### 8.4. :: Command Equivalents

**Using Nx Directly:**

```bash
# Functional tests
nx test @fux/ghost-writer-ext
nx test @fux/context-cherry-picker-ext

# Coverage tests
nx test:full @fux/ghost-writer-ext
nx test:full @fux/context-cherry-picker-ext
```

**Using Vitest Directly:**

```bash
# In package directory
cd packages/ghost-writer/ext
pnpm test                    # Uses vitest.functional.config.ts
pnpm test:full              # Uses vitest.coverage.config.ts
```

###### END: Aka Aliases & Test Commands (END) <!-- Close Fold -->

## 9. :: Non-Authoritative Guidance Notice <!-- Start Fold -->

These strategies encode what worked, what did not, and the best practices we have converged on. They are strong defaults—not mandates. Testing is fluid and dynamic; adapt as needed for each package while honoring architectural rules (e.g., adapter boundaries, DI, determinism).

###### END: Non-Authoritative Guidance Notice (END) <!-- Close Fold -->
