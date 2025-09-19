# VS Code Test Executor Development Pitfalls & Solutions

## Overview

This document captures all the pitfalls, errors, and corrections encountered during the development of the `@fux/vscode-test-executor` plugin. This serves as a reference for future development and helps avoid repeating the same mistakes.

## Table of Contents

1. [Plugin Structure & Configuration](#plugin-structure--configuration)
2. [Executor Implementation](#executor-implementation)
3. [TypeScript Configuration](#typescript-configuration)
4. [VS Code Integration Testing](#vs-code-integration-testing)
5. [Nx Target Configuration](#nx-target-configuration)
6. [Testing & Mocking Issues](#testing--mocking-issues)
7. [Path Resolution Problems](#path-resolution-problems)
8. [Command Execution Issues](#command-execution-issues)

---

## Plugin Structure & Configuration

### Pitfall 1: Incorrect Plugin Location

**Error**: Initially tried to place executor in `libs/vscode-test-cli-config/`

```
Error: Cannot find configuration for task @fux/project-butler-ext:test:integration
```

**Root Cause**: Nx plugins need to be in the `plugins/` directory with proper structure.

**Solution**: Created dedicated `plugins/vscode-test-executor/` with:

- `executors.json` - Registers executors with Nx
- `package.json` - Defines plugin metadata and entry points
- `project.json` - Nx project configuration
- Proper TypeScript configuration

### Pitfall 2: Missing Plugin Registration

**Error**:

```
Unable to resolve local plugin with import path @fux/vscode-test-executor
```

**Root Cause**: Plugin wasn't properly registered in Nx's plugin system.

**Solution**:

- Added `"executors": "./executors.json"` to `package.json`
- Created `executors.json` with proper executor mapping
- Ensured plugin was built before use

### Pitfall 3: Incorrect Export Structure

**Error**:

```
implementation is not a function
```

**Root Cause**: Executor was exported as named export instead of default export.

**Solution**: Changed from:

```typescript
export async function vscodeTestExecutor(...)
```

To:

```typescript
export default async function vscodeTestExecutor(...)
```

---

## Executor Implementation

### Pitfall 4: Missing Schema Files

**Error**: TypeScript compilation errors due to missing type definitions.

**Root Cause**: Executor schema wasn't properly typed.

**Solution**: Created both:

- `schema.json` - JSON schema for validation
- `schema.d.ts` - TypeScript definitions

### Pitfall 5: Incorrect Asset Configuration

**Error**: Schema files not copied to dist during build.

**Root Cause**: `project.json` wasn't configured to copy non-TypeScript files.

**Solution**: Added assets configuration:

```json
"assets": [
  {
    "input": "./plugins/vscode-test-executor/src",
    "glob": "**/!(*.ts)",
    "output": "."
  },
  {
    "input": "./plugins/vscode-test-executor/src",
    "glob": "**/*.d.ts",
    "output": "."
  }
]
```

---

## TypeScript Configuration

### Pitfall 6: Inconsistent Type Checking

**Error**: `check-types` target not catching same errors as `build` target.

**Root Cause**: Different TypeScript configurations between targets.

**Initial Attempt**: Switched to esbuild for type checking:

```json
"check-types": {
  "executor": "@nx/esbuild:esbuild",
  "options": {
    "skipTypeCheck": false,
    "main": "{projectRoot}/src/extension.ts"
  }
}
```

**Problem**: Too slow (running both tsc AND esbuild).

**Final Solution**: Fixed tsc configuration:

```json
"check-types": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit --project {projectRoot}/tsconfig.json"
  }
}
```

### Pitfall 7: Wrong Entry Point for Extensions

**Error**:

```
Could not resolve "packages/project-butler/ext/src/index.ts"
```

**Root Cause**: Extension packages use `src/extension.ts`, not `src/index.ts`.

**Solution**: Updated nx.json to handle both patterns:

- Extensions: `src/extension.ts`
- Libraries: `src/index.ts`

### Pitfall 8: Redundant Strict Flag

**Error**: Added `--strict` flag to tsc command.

**Root Cause**: Assumed strict mode wasn't enabled.

**Solution**: Removed `--strict` flag since `tsconfig.base.json` already has `"strict": true`.

---

## VS Code Integration Testing

### Pitfall 9: GitHub Authentication Timeouts

**Error**:

```
Timed out waiting for authentication provider 'github' to register
```

**Root Cause**: VS Code was trying to authenticate with GitHub during tests.

**Initial Attempt**: Added direct disable flags:

```typescript
;('--disable-github-authentication', '--disable-github-copilot', '--disable-github-copilot-chat')
```

**Problem**: Caused warnings:

```
Warning: 'disable-github-authentication' is not in the list of known options
```

**Final Solution**: Used `--disable-extension` flags:

```typescript
;('--disable-extension',
    'vscode.github-authentication',
    '--disable-extension',
    'GitHub.copilot',
    '--disable-extension',
    'GitHub.copilot-chat',
    '--disable-extension',
    'github.vscode-pull-request-github',
    '--disable-extension',
    'github.codespaces',
    '--disable-extension',
    'github.copilot-labs')
```

### Pitfall 10: Noisy Test Output

**Error**: Tests cluttered with irrelevant VS Code startup messages.

**Solution**: Implemented PowerShell filtering:

```typescript
const filterPattern = filterPatterns.join("', '")
const command = `powershell -Command "& {npx vscode-test ${args.join(' ')} 2>&1 | Select-String -NotMatch '${filterPattern}'}"`
```

---

## Nx Target Configuration

### Pitfall 11: Hardcoded Paths in Targets

**Error**: Duplicated configuration across multiple projects.

**Root Cause**: Each project had its own test:integration target with hardcoded paths.

**Solution**: Created shared target default in `nx.json`:

```json
"test:integration": {
  "executor": "@fux/vscode-test-executor:test-integration",
  "dependsOn": ["build"],
  "cache": false,
  "options": {
    "tsConfig": "{projectRoot}/__tests__/integration-tests/tsconfig.test.json",
    "config": "{projectRoot}/__tests__/integration-tests/.vscode-test.mjs",
    "timeout": 20000,
    "filterOutput": true
  }
}
```

### Pitfall 12: Missing Dependencies

**Error**: Tests running before build completed.

**Solution**: Added proper dependency chain:

```json
"dependsOn": ["build"]
```

---

## Testing & Mocking Issues

### Pitfall 13: Incomplete VS Code API Mocking

**Error**:

```
TypeError: Cannot read properties of undefined (reading 'vscode')
commands.executeCommand is not a function
```

**Root Cause**: Mock setup in `_setup.ts` was incomplete.

**Solution**: Enhanced vscode mock:

```typescript
vi.mock('vscode', () => ({
    commands: {
        registerCommand: vi.fn(),
        executeCommand: vi.fn(), // Added missing mock
    },
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        createTerminal: vi.fn(),
        activeTextEditor: null,
        activeTerminal: null,
    },
    // ... other properties
}))
```

### Pitfall 14: Testing Integration Logic in Unit Tests

**Error**: Unit tests trying to test VS Code integration scenarios.

**Root Cause**: Confusion between unit and integration test responsibilities.

**Solution**:

- Unit tests: Focus on command registration, activation, error handling
- Integration tests: Test actual VS Code API interactions
- Removed problematic tests that required full VS Code context

### Pitfall 15: Incorrect Mock Return Values

**Error**:

```
AssertionError: expected "spy" to be called with arguments: [ Array(1) ]
Received: 1st spy call: [ "Failed to activate Project Butler: Command registration failed", ]
```

**Root Cause**: Mock wasn't set up to allow error propagation.

**Solution**: Fixed mock to return proper disposable:

```typescript
vi.mocked(vscode.commands.registerCommand).mockReturnValue({
    dispose: vi.fn(),
})
```

---

## Path Resolution Problems

### Pitfall 16: Absolute vs Relative Paths

**Error**:

```
The specified path does not exist: 'packages/project-butler/ext/__tests__/integration-tests/tsconfig.test.json'
```

**Root Cause**: Executor running from project root but receiving absolute paths.

**Solution**: Convert absolute paths to relative:

```typescript
const relativeTsConfig =
    tsConfig.startsWith(projectRoot) ? tsConfig.substring(projectRoot.length + 1) : tsConfig
```

### Pitfall 17: Working Directory Mismatch

**Error**: Commands failing due to wrong working directory.

**Root Cause**: Executor context vs command execution context mismatch.

**Solution**: Explicitly set `cwd` in `execSync`:

```typescript
execSync(command, {
    stdio: 'inherit',
    cwd: projectRoot,
})
```

---

## Command Execution Issues

### Pitfall 18: Missing npx Prefix

**Error**:

```
vscode-test : The term 'vscode-test' is not recognized
```

**Root Cause**: `vscode-test` not in PATH.

**Solution**: Use `npx vscode-test` instead of `vscode-test`.

### Pitfall 19: PowerShell Command Escaping

**Error**: PowerShell command syntax errors.

**Root Cause**: Improper escaping of command arguments.

**Solution**: Proper PowerShell command construction:

```typescript
const command = `powershell -Command "& {npx vscode-test ${args.join(' ')} 2>&1 | Select-String -NotMatch '${filterPattern}'}"`
```

---

## TypeScript Error Handling

### Pitfall 20: Using `any` Type

**Error**:

```
warning  Unexpected any. Specify a different type  ts/no-explicit-any
```

**Root Cause**: Using `any` type for error parameters.

**Solution**: Use `unknown` with type guards:

```typescript
catch (error: unknown) {
  if (error instanceof Error) {
    // Handle Error instance
  } else {
    // Handle other types
  }
}
```

---

## Key Lessons Learned

1. **Plugin Structure**: Nx plugins must be in `plugins/` directory with proper registration
2. **Export Patterns**: Use default exports for executors, not named exports
3. **Schema Files**: Always create both JSON schema and TypeScript definitions
4. **Asset Configuration**: Configure build to copy non-TypeScript files
5. **Type Checking**: Use consistent TypeScript configuration across targets
6. **VS Code Testing**: Disable extensions, not direct flags, to avoid warnings
7. **Path Resolution**: Always convert absolute paths to relative when changing context
8. **Command Execution**: Use `npx` for CLI tools, set explicit working directory
9. **Mocking**: Complete API mocks prevent undefined property errors
10. **Test Scope**: Unit tests for registration/activation, integration tests for API interaction
11. **Error Handling**: Use `unknown` type with type guards instead of `any`
12. **Dependencies**: Always specify proper target dependencies in Nx

---

## Prevention Strategies

1. **Start Simple**: Begin with basic plugin structure, add complexity gradually
2. **Test Early**: Run tests frequently during development
3. **Check Documentation**: Always reference Nx plugin documentation
4. **Use TypeScript**: Leverage type checking to catch errors early
5. **Mock Completely**: Ensure all used APIs are properly mocked
6. **Validate Paths**: Always verify path resolution in different contexts
7. **Test Both Modes**: Test both filtered and unfiltered output modes
8. **Document Changes**: Keep track of configuration changes and their reasons

---

## Future Improvements

1. **Error Recovery**: Add better error handling and recovery mechanisms
2. **Configuration Validation**: Validate all configuration options before execution
3. **Performance Optimization**: Cache compilation results when possible
4. **Better Logging**: Add structured logging for debugging
5. **Cross-Platform Support**: Ensure PowerShell commands work on all platforms
6. **Plugin Testing**: Add unit tests for the executor itself
7. **Documentation**: Create user-facing documentation for the executor
8. **Configuration Options**: Add more configuration options for different use cases

---

_This document should be updated as new pitfalls are discovered and resolved._
