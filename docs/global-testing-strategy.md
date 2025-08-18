# Global Testing Strategy

## Overview

This document outlines the testing strategy for the FocusedUX monorepo, focusing on the shared library architecture and how VSCode APIs are handled during testing.

## Core Testing Architecture

### Shared Package Testing with Mockly

**CRITICAL: Shared packages use Mockly for testing, NOT direct VSCode mocking.**

- **Shared packages import VSCode types and values for implementation** (during actual runtime)
- **Tests import VSCode normally** - the `vscode-test-adapter.ts` redirects to Mockly
- **Mockly provides comprehensive VSCode API mocks** - no manual mocking needed
- **Full decoupling** through DI and adapters

### ❌ FORBIDDEN: Direct VSCode Mocking

**NEVER use `vi.mock('vscode')` in test files. This completely bypasses Mockly and breaks the testing architecture.**

```typescript
// ❌ WRONG - This breaks Mockly integration
vi.mock('vscode', () => ({
    window: { showInformationMessage: vi.fn() },
}))

// ✅ CORRECT - Import normally, let Mockly handle mocking
import * as vscode from 'vscode'
const message = await vscode.window.showInformationMessage('test')
```

### ✅ CORRECT: Normal VSCode Imports

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

## Test Lanes

The monorepo uses two test lanes to balance speed and coverage:

### Functional Tests (Fast, No Coverage)

- **Purpose**: Verify functionality works correctly
- **Coverage**: Disabled for speed
- **Files**: `**/*.test.ts` only
- **Command**: `t` (target package only) or `tf` (full dependency chain)

### Coverage Tests (Slower, With Coverage)

- **Purpose**: Measure code coverage and run edge cases
- **Coverage**: Enabled with detailed reporting
- **Files**: Both `**/*.test.ts` and `**/*.cov.ts`
- **Command**: `tc` (target package only) or `tfc` (full dependency chain)

**Note**: For detailed alias descriptions, see `.vscode/shell/pnpm_aliases.json`

## Dual Vitest Configuration Pattern

### Standard Package Structure

All packages follow a standardized dual Vitest configuration pattern:

```
package/
├── vitest.functional.config.ts    # Fast tests, no coverage
├── vitest.coverage.config.ts      # Slower tests with coverage
└── project.json                   # Nx targets
```

### Configuration Files

#### `vitest.functional.config.ts`

- **Purpose**: Fast functional testing
- **Coverage**: Disabled
- **Includes**: `__tests__/**/*.test.ts` only
- **Base**: Extends `vitest.functional.base.ts`

#### `vitest.coverage.config.ts`

- **Purpose**: Coverage measurement and edge case testing
- **Coverage**: Enabled with detailed reporting
- **Includes**: Both `__tests__/**/*.test.ts` and `__tests__/**/*.cov.ts`
- **Base**: Extends `vitest.coverage.base.ts`

### Project.json Configuration

Packages should have minimal test targets in `project.json`:

```json
{
    "test": {
        "executor": "@nx/vite:test",
        "outputs": ["{options.reportsDirectory}"]
    },
    "test:full": {
        "executor": "@nx/vite:test",
        "outputs": ["{options.reportsDirectory}"],
        "dependsOn": ["^test"]
    }
}
```

**Note**: The `aka` CLI tool dynamically injects the correct config file based on the test target and coverage flags, so explicit `configFile` options are not needed in `project.json`.

### Dynamic Config Injection

The `aka` CLI tool automatically injects the correct Vitest config:

- **`t` command**: Uses `vitest.functional.config.ts`
- **`tc` command**: Uses `vitest.coverage.config.ts`
- **`tf` command**: Uses `vitest.functional.config.ts` for full chain
- **`tfc` command**: Uses `vitest.coverage.config.ts` for full chain

This ensures consistent behavior across all packages without bloating `project.json` files.

## VSCode Testing Strategy

### Test Adapter Architecture

The `vscode-test-adapter.ts` file acts as a bridge during tests:

1. **Tests import `vscode` normally**
2. **Vitest alias redirects `vscode` → `./vscode-test-adapter.ts`**
3. **Test adapter exports Mockly instances** with VSCode API compatibility
4. **Tests get working VSCode APIs** without manual mocking

### Mockly Integration

Mockly provides:

- **Complete VSCode API coverage** - all classes, methods, and properties
- **Consistent behavior** across all tests
- **Easy maintenance** - one place to update mocks
- **Type safety** - full TypeScript support

### Testing Best Practices

1. **Import VSCode APIs normally** in tests
2. **Let Mockly handle all mocking** - no manual `vi.mock` calls
3. **Use the actual VSCode API** - Mockly provides working implementations
4. **Test adapters, not mocks** - focus on adapter behavior, not mock setup

## Package-Specific Testing

### Shared Library (`libs/shared`)

- **Uses Mockly** via `vscode-test-adapter.ts`
- **No direct VSCode imports** in source code (only in test adapter)
- **Adapters wrap VSCode APIs** for DI injection

### Core Packages (`packages/{feature}/core`)

- **Business logic only** - no VSCode dependencies
- **Use shared adapters** injected via DI
- **Test with mocked adapters** or real shared library

### Extension Packages (`packages/{feature}/ext`)

- **VSCode extension entry points**
- **Integrate core services** with shared adapters
- **Test with Mockly** for VSCode API mocking

## Common Testing Patterns

### Adapter Testing

```typescript
// ✅ CORRECT - Test the adapter, not the mock
import { WindowAdapter } from '../src/vscode/adapters/Window.adapter.js'
import * as vscode from 'vscode'

describe('WindowAdapter', () => {
    it('should delegate to VSCode API', async () => {
        const adapter = new WindowAdapter()
        await adapter.showInformationMessage('test')
        // Mockly handles the actual VSCode call
    })
})
```

### Service Testing

```typescript
// ✅ CORRECT - Test with injected adapters
import { MyService } from '../src/services/My.service.js'
import { WindowAdapter } from '../src/vscode/adapters/Window.adapter.js'

describe('MyService', () => {
    it('should use injected window adapter', () => {
        const mockWindow = new WindowAdapter()
        const service = new MyService(mockWindow)
        // Test service behavior with adapter
    })
})
```

## Troubleshooting

### Tests Not Using Mockly

**Problem**: Tests are failing with "No export defined" errors
**Cause**: `vi.mock('vscode')` is bypassing the test adapter
**Solution**: Remove `vi.mock('vscode')` calls and import normally

### Missing VSCode Classes

**Problem**: Tests can't find VSCode classes like `TreeItem`, `Position`, etc.
**Cause**: Test adapter missing exports or Mockly not providing the class
**Solution**: Add missing class to `vscode-test-adapter.ts` or update Mockly

### Inconsistent Mock Behavior

**Problem**: Different tests get different VSCode API behavior
**Cause**: Mix of Mockly and manual mocking
**Solution**: Use only Mockly, remove all manual VSCode mocks

### No Test Output Visible (Vitest + Nx)

- **Problem**: Test target reports success but no per‑test output is shown.
- **Root Causes**:
    - Reporters not explicitly set in per‑package Vitest config (default/minimal output).
    - Nx cache returning cached results, hiding actual Vitest run output.
    - Relative `include` globs resolved from the wrong directory when `root` is not set.
- **Solutions**:
    - In the package Vitest config, set `reporters: ['default']` and `silent: false`.
    - Set `root: __dirname` when using relative `include` globs.
    - Verify execution by running aliases with cache disabled and verbosity: `t -s --verbose` (and `tc -s --verbose` for coverage).
    - For one‑off deeper visibility, you can pass reporters via CLI passthrough: `-- --reporter=default --reporter=verbose`.
    - When using dynamic includes based on `--coverage`, confirm both lanes collect the intended files (functional only vs functional + coverage).

## **Dual Vitest Configuration Pattern**

### **Standard Package Structure**

Each package following this pattern should have:

- `vitest.functional.config.ts` - For fast functional tests (no coverage)
- `vitest.coverage.config.ts` - For comprehensive tests with coverage
- Minimal `project.json` with no explicit `configFile` options

### **Configuration Injection via Aka CLI**

The `aka` CLI tool dynamically injects the correct config file based on:

- Test target (`test` vs `test:full`)
- Presence of `--coverage` flag
- Project-specific directory mapping

### **Base Configuration Files**

- `vitest.functional.base.ts` - Base config for functional tests
- `vitest.coverage.base.ts` - Base config for coverage tests
- Both use broad include patterns: `__tests__/**/*.test.ts`

### **❌ FORBIDDEN: Direct VSCode Mocking**

Never use `vi.mock('vscode')` directly in test files. Always rely on Mockly via the aliased `vscode-test-adapter.ts`.

## **Nx Executor Behavior and Configuration**

### **Critical Limitations**

- The `@nx/vite:test` executor silently ignores dynamic `include` logic in Vitest configs
- Dynamic `include` patterns based on `process.argv` parsing are not honored
- Solution: Use dual-config approach with dynamic injection via CLI tools

### **Verification Pattern**

```typescript
// This will NOT work with @nx/vite:test executor
include: process.argv.includes('--coverage') ?
    ['coverage/**/*.test.ts']
:   ['functional/**/*.test.ts']

// Solution: Use separate configs with CLI injection
// vitest.functional.config.ts
include: ['__tests__/**/*.test.ts']

// vitest.coverage.config.ts
include: ['__tests__/**/*.test.ts', '__tests__/coverage/**/*.test-cov.ts']
```

### **Investigation Protocol**

When configuration changes don't produce expected results:

1. **Investigate executor behavior first** before assuming configuration syntax issues
2. **Verify that executors honor dynamic configuration logic**
3. **Use CLI injection patterns** when executors ignore dynamic logic

## **Base Configuration Flexibility**

### **Organizational Pattern Accommodation**

Base configurations MUST accommodate different package test organization patterns:

- **Flat Structure:** `__tests__/*.test.ts` (e.g., mockly)
- **Nested Structure:** `__tests__/functional/**/*.test.ts` (e.g., shared)
- **Mixed Structure:** Both patterns in the same workspace

### **Required Flexibility**

```typescript
// Use broad patterns that work for all structures
include: ['__tests__/**/*.test.ts']
exclude: ['**/*.d.ts', '**/*.config.*', '**/__tests__/_reports/**']
```

### **Verification Requirements**

- Test base configs with packages using different organizational patterns
- Ensure no assumptions about subdirectory structure
- Allow package-specific configs to override when needed

## **Mock Library Integration**

### **Mockly VSCode API Differences**

When using Mockly for VSCode API mocking, be aware of behavior differences:

- `fsPath` may return `D:/path` instead of `/path` on Windows
- `toString()` may include extra characters (e.g., `??` instead of `?`)
- Query parameters may be handled differently

### **Verification Pattern**

```typescript
// Always verify mock behavior matches expectations
const uri = new UriAdapter('file:///test/path')
console.log('fsPath:', uri.fsPath) // Check actual output
console.log('toString:', uri.toString()) // Check actual output
```

### **Enhancement Protocol**

- If mock behavior differs significantly from actual API, enhance the mock library
- If differences are minor, adjust tests to match mock behavior
- Document all differences in testing strategy documentation

## **Project.json Minimalism**

### **Required Pattern**

Project.json files MUST be kept minimal and avoid explicit configuration options:

```json
{
    "test": {
        "extends": "vite:test",
        "dependsOn": ["^build"]
    },
    "test:full": {
        "extends": "vite:test",
        "dependsOn": ["^test"]
    }
}
```

### **Forbidden in Project.json**

- Explicit `configFile` options in test targets
- Redundant configuration that can be handled by base configs
- Package-specific overrides that duplicate base functionality

### **Configuration Injection**

- Use CLI tools (e.g., `aka`) to dynamically inject configuration
- Keep project.json focused on dependencies and basic structure
- Delegate complex configuration to dedicated config files

## Summary

- **Mockly is the single source of truth** for VSCode API mocking
- **Never use `vi.mock('vscode')`** - it breaks the architecture
- **Import VSCode normally** in tests - Mockly handles the rest
- **Test adapters and services**, not mock setup
- **Maintain consistency** by using the established Mockly pattern
