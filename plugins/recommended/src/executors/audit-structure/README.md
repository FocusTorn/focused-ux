# Audit Structure Executor

The `audit-structure` executor validates project structure for violations of architectural patterns and test structure based on the Enhanced Mock Strategy.

## Variants

The executor supports three variants:

- `audit-structure:code` - Audits code structure for architectural violations
- `audit-structure:test` - Audits test structure for Enhanced Mock Strategy violations
- `audit-structure:all` - Audits both code and test structure (same as `audit-structure`)

## Usage

### Via Nx CLI

```bash
# Audit test structure only
nx run <project>:audit-structure:test

# Audit code structure only
nx run <project>:audit-structure:code

# Audit all structure
nx run <project>:audit-structure:all

# With options
nx run <project>:audit-structure:test --warnOnly=true --verbose=true
```

### Via Project Configuration

Add to your `project.json`:

```json
{
    "targets": {
        "audit-structure:test": {
            "executor": "@fux/recommended:audit-structure:test",
            "options": {
                "warnOnly": false,
                "verbose": true
            }
        }
    }
}
```

## Options

| Option     | Type                        | Default | Description                                            |
| ---------- | --------------------------- | ------- | ------------------------------------------------------ |
| `mode`     | `'code' \| 'test' \| 'all'` | `'all'` | Audit mode (overridden by executor name)               |
| `warnOnly` | `boolean`                   | `false` | If true, exit with code 0 even if violations are found |
| `verbose`  | `boolean`                   | `false` | If true, show detailed output with line/column numbers |

## Test Structure Violations

The test audit checks for the following violations based on the Enhanced Mock Strategy:

### 1. Duplicate Mock Class Definitions

- **Severity**: CRITICAL
- **Pattern**: Creating local mock classes instead of using global mocks
- **Example**: `class MockFileSystem` instead of using `mocks.fileSystem`

### 2. Incorrect Mock Setup Order

- **Severity**: HIGH
- **Pattern**: Calling `resetAllMocks()` after setup functions
- **Example**: Setup mocks, then reset them (clears the setup!)

### 3. Missing Helper Function Calls

- **Severity**: MEDIUM
- **Pattern**: Not importing required setup functions
- **Example**: Using file system operations without importing `setupFileSystemMocks`

### 4. Inconsistent Service Instantiation

- **Severity**: HIGH
- **Pattern**: Using local mock variables in service constructors
- **Example**: `new Service(mockFileSystem as any)` instead of `new Service(mocks.fileSystem as any)`

### 5. Direct Global Mock References

- **Severity**: MEDIUM
- **Pattern**: Referencing global mocks directly instead of through helpers
- **Example**: `mockYaml.load` instead of `mocks.yaml.load`

### 6. Unnecessary Global Declarations

- **Severity**: LOW
- **Pattern**: Declaring global variables already handled by mock infrastructure
- **Example**: `declare global { var mockYaml: any }`

### 7. Inconsistent Test Structure

- **Severity**: MEDIUM
- **Pattern**: Tests not following Enhanced Mock Strategy structure
- **Example**: Missing `let mocks: ReturnType<typeof setupTestEnvironment>`

### 8. Missing Scenario Builder Usage

- **Severity**: MEDIUM
- **Pattern**: Manual mock setup instead of using scenario builder functions
- **Example**: `mocks.fileSystem.readFile.mockResolvedValue()` instead of using `setupFileExplorerSuccessScenario()`

### 9. Mock Service Class Patterns

- **Severity**: MEDIUM/LOW
- **Pattern**: Mock service classes not following consistent patterns
- **Example**: Missing `vi.fn()` mocking or constructor initialization

## Code Structure Violations

The code audit checks for the following violations based on FocusedUX architectural patterns:

### 1. Forbidden Shared References

- **Severity**: CRITICAL
- **Pattern**: References to `@fux/shared` package
- **Example**: `import { something } from '@fux/shared'`
- **Rationale**: In refactored end state, all packages must be completely self-contained

### 2. Forbidden Mockly References

- **Severity**: CRITICAL
- **Pattern**: References to `@fux/mockly` package
- **Example**: `import { createContainer } from '@fux/mockly'`
- **Rationale**: All packages must use direct instantiation, not DI containers

### 3. Core Package VSCode Value Import

- **Severity**: CRITICAL
- **Pattern**: VSCode value imports in core packages
- **Example**: `import { Uri } from 'vscode'` (should be `import type { Uri } from 'vscode'`)
- **Rationale**: Core packages must use type imports only

### 4. Extension Package VSCode Value Import

- **Severity**: HIGH
- **Pattern**: VSCode value imports outside adapter files in extensions
- **Example**: VSCode imports in non-adapter files
- **Rationale**: Extension packages should create local adapters with VSCode value imports

### 5. Dynamic Import

- **Severity**: HIGH
- **Pattern**: Dynamic imports (`import()` or `require()`)
- **Example**: `const module = await import('./module')`
- **Rationale**: Dynamic imports not allowed, refactor to static imports

### 6. Direct Node.js Module Import

- **Severity**: HIGH
- **Pattern**: Direct Node.js built-in module imports in extensions
- **Example**: `import { readFile } from 'fs'` in extension code
- **Rationale**: VSCode extensions should not include Node.js built-in modules

### 7. Business Logic in Extension Package

- **Severity**: HIGH
- **Pattern**: Business logic patterns in extension packages
- **Example**: Service classes, data processing functions in extensions
- **Rationale**: Extension packages should be thin wrappers, business logic belongs in core

### 8. DI Container Patterns in Core Package

- **Severity**: CRITICAL
- **Pattern**: DI container usage in core packages
- **Example**: `createContainer()`, `asFunction()`, `awilix` usage
- **Rationale**: Core packages should use direct instantiation, not DI containers

## Output

The executor provides detailed output with:

- 🔍 Project being audited
- 📋 Audit mode
- 🧪 Test structure audit results
- 🏗️ Code structure audit results (when implemented)
- 📊 Summary statistics
- 🚨 Detailed violation reports with severity levels

### Severity Icons

- 🔴 CRITICAL - Violations that break the Enhanced Mock Strategy
- 🟠 HIGH - Violations that cause test inconsistencies
- 🟡 MEDIUM - Violations that reduce maintainability
- 🔵 LOW - Violations that are style inconsistencies

## Examples

### Successful Audit

```
🔍 Auditing structure for: context-cherry-picker
📋 Mode: test

🧪 Running test structure audit...
✅ No test structure violations found
📊 Test audit summary: 0 violations in 0/5 files

✅ All structure checks passed!
```

### Audit with Test Violations

```
🔍 Auditing structure for: context-cherry-picker
📋 Mode: test

🧪 Running test structure audit...
🚨 Test Structure Violations Found:

📁 Duplicate Mock Class Definitions (2 violations)
  🔴 src/test.test.ts:5:1: Duplicate mock class 'MockFileSystem' found. Use global mocks from setupTestEnvironment() instead.
    💡 Suggestion: Replace with: let mocks: ReturnType<typeof setupTestEnvironment>

📊 Test audit summary: 2 violations in 1/5 files

❌ Structure violations found. Exiting with code 1.
```

### Audit with Code Violations

```
🔍 Auditing structure for: context-cherry-picker
📋 Mode: code

🏗️  Running code structure audit...
🚨 Code Structure Violations Found:

📁 Forbidden Shared References (1 violations)
  🔴 src/service.ts:3:1: Package references @fux/shared. In refactored end state, all packages must be completely self-contained.
    💡 Suggestion: Remove @fux/shared dependency and implement required functionality directly in this package

📁 Core Package VSCode Value Import (1 violations)
  🔴 src/adapter.ts:5:1: Core packages must use type imports only. Use "import type { Uri } from vscode" instead of value imports.
    💡 Suggestion: Change to: import type { Api } from vscode

📊 Code audit summary: 2 violations in 2/10 files

❌ Structure violations found. Exiting with code 1.
```

### Audit with Both Test and Code Violations

```
🔍 Auditing structure for: context-cherry-picker
📋 Mode: all

🧪 Running test structure audit...
🚨 Test Structure Violations Found:

📁 Duplicate Mock Class Definitions (1 violations)
  🔴 src/test.test.ts:5:1: Duplicate mock class 'MockFileSystem' found.

📊 Test audit summary: 1 violations in 1/5 files

🏗️  Running code structure audit...
🚨 Code Structure Violations Found:

📁 Forbidden Shared References (1 violations)
  🔴 src/service.ts:3:1: Package references @fux/shared.

📊 Code audit summary: 1 violations in 1/10 files

❌ Structure violations found. Exiting with code 1.
```

## Implementation Status

- ✅ Test structure audit - Fully implemented
- ✅ Code structure audit - Fully implemented
- ✅ Schema and options - Complete
- ✅ Error handling and reporting - Complete
- ✅ Tests - Complete
