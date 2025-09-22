# Plugin Troubleshooting Guide

This document records common issues encountered when working with Nx plugins and their solutions.

## Audit-Structure Executor Issues

### Problem: "Cannot find configuration for task @fux/context-cherry-picker-ext:audit-structure:test"

**Root Cause**: The audit-structure executor was implemented in `plugins/recommended` but wasn't configured in individual project.json files.

**Solution**: Added audit-structure targets to project.json files:

```json
{
    "targets": {
        "audit-structure": {
            "executor": "@fux/recommended:audit-structure",
            "options": {
                "mode": "all",
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:code": {
            "executor": "@fux/recommended:audit-structure:code",
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:test": {
            "executor": "@fux/recommended:audit-structure:test",
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:all": {
            "executor": "@fux/recommended:audit-structure:all",
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        }
    }
}
```

### Problem: "Cannot find configuration for task @fux/context-cherry-picker-core:audit"

**Root Cause**: The old `audit` and `audit:full` targets were removed from nx.json, but projects were still trying to extend them.

**Solution**: Updated project.json to extend the new audit-structure targets:

```json
{
    "targets": {
        "audit": { "extends": "audit-structure" },
        "audit:code": { "extends": "audit-structure:code" },
        "audit:test": { "extends": "audit-structure:test" },
        "audit:all": { "extends": "audit-structure:all" }
    }
}
```

### Problem: Plugin Build Failure - "Could not resolve plugins/recommended/src/index.ts"

**Root Cause**: The main entry point `plugins/recommended/src/index.ts` was empty, causing the build to fail.

**Solution**: Added proper exports to the index.ts file:

```typescript
// Export executors
export * from './executors/audit-structure/audit-structure'
export * from './executors/audit-structure/schema'

// Export generators
export * from './generators/tests/tests'
export * from './generators/tests/schema'
```

### Problem: Missing Global Targets in nx.json

**Root Cause**: The audit-structure executor variants weren't available globally, requiring individual project configuration.

**Solution**: Added global targets to nx.json with proper defaults:

```json
{
    "targetDefaults": {
        "audit-structure": {
            "executor": "@fux/recommended:audit-structure",
            "dependsOn": ["build", "^build"],
            "inputs": ["default", "^default"],
            "outputs": [],
            "cache": true,
            "options": {
                "mode": "all",
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:code": {
            "executor": "@fux/recommended:audit-structure:code",
            "dependsOn": ["build", "^build"],
            "inputs": ["default", "^default"],
            "outputs": [],
            "cache": true,
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:test": {
            "executor": "@fux/recommended:audit-structure:test",
            "dependsOn": ["build", "^build"],
            "inputs": ["default", "^default"],
            "outputs": [],
            "cache": true,
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        },
        "audit-structure:all": {
            "executor": "@fux/recommended:audit-structure:all",
            "dependsOn": ["build", "^build"],
            "inputs": ["default", "^default"],
            "outputs": [],
            "cache": true,
            "options": {
                "warnOnly": false,
                "verbose": false
            }
        }
    }
}
```

## Common Plugin Development Issues

### Problem: Executor Not Found After Implementation

**Root Cause**: Plugin not built or executors.json not properly configured.

**Solutions**:

1. Ensure `executors.json` properly references the implementation:

    ```json
    {
        "executors": {
            "audit-structure": {
                "implementation": "./dist/executors/audit-structure/audit-structure",
                "schema": "./dist/executors/audit-structure/schema.json",
                "description": "Audits project structure for violations"
            }
        }
    }
    ```

2. Build the plugin: `nx build @fux/recommended`

3. Verify the dist folder contains the compiled files

### Problem: Schema Validation Errors

**Root Cause**: TypeScript interface doesn't match JSON schema.

**Solution**: Ensure schema.d.ts matches schema.json:

```typescript
// schema.d.ts
export interface AuditStructureExecutorSchema {
    mode?: 'code' | 'test' | 'all'
    warnOnly?: boolean
    verbose?: boolean
}
```

```json
// schema.json
{
    "properties": {
        "mode": {
            "type": "string",
            "enum": ["code", "test", "all"],
            "default": "all"
        },
        "warnOnly": {
            "type": "boolean",
            "default": false
        },
        "verbose": {
            "type": "boolean",
            "default": false
        }
    }
}
```

### Problem: Test Mocking Issues

**Root Cause**: Jest mocks not properly configured for executor dependencies.

**Solution**: Mock external dependencies in test files:

```typescript
// Mock the test-structure-checks module
jest.mock('./test-structure-checks', () => ({
    auditTestStructure: jest.fn(),
}))

// Mock the code-structure-checks module
jest.mock('./code-structure-checks', () => ({
    auditCodeStructure: jest.fn(),
}))

const mockAuditTestStructure = auditTestStructure as jest.MockedFunction<typeof auditTestStructure>
const mockAuditCodeStructure = auditCodeStructure as jest.MockedFunction<typeof auditCodeStructure>
```

## Best Practices

### 1. Plugin Structure

- Always include a main `index.ts` with proper exports
- Use consistent naming for executors and generators
- Include comprehensive README documentation

### 2. Target Configuration

- Set up global targets in nx.json for reusability
- Use `extends` in project.json to inherit global configurations
- Include proper dependencies (`dependsOn: ["build", "^build"]`)

### 3. Testing

- Mock external dependencies to isolate unit tests
- Test all executor variants and options
- Include error handling scenarios

### 4. Documentation

- Document all options and their defaults
- Provide usage examples
- Include troubleshooting information

## Debugging Commands

```bash
# Check if plugin is built
ls plugins/recommended/dist/

# Build plugin
nx build @fux/recommended

# Test executor directly
nx run @fux/context-cherry-picker-core:audit-structure:test

# Check project configuration
nx show project @fux/context-cherry-picker-core

# List available targets
nx show project @fux/context-cherry-picker-core --web
```

## Plugin Structure & Configuration

### Problem: Incorrect Plugin Location

**Error**: Executor not found when placed in wrong directory structure.

```
Error: Cannot find configuration for task @fux/project-name:target-name
```

**Root Cause**: Nx plugins need to be in the `plugins/` directory with proper structure.

**Solution**: Create dedicated `plugins/plugin-name/` with:

- `executors.json` - Registers executors with Nx
- `package.json` - Defines plugin metadata and entry points
- `project.json` - Nx project configuration
- Proper TypeScript configuration

### Problem: Missing Plugin Registration

**Error**:

```
Unable to resolve local plugin with import path @fux/plugin-name
```

**Root Cause**: Plugin wasn't properly registered in Nx's plugin system.

**Solution**:

- Added `"executors": "./executors.json"` to `package.json`
- Created `executors.json` with proper executor mapping
- Ensured plugin was built before use

### Problem: Incorrect Export Structure

**Error**:

```
implementation is not a function
```

**Root Cause**: Executor was exported as named export instead of default export.

**Solution**: Changed from:

```typescript
export async function executorName(...)
```

To:

```typescript
export default async function executorName(...)
```

## Executor Implementation

### Problem: Missing Schema Files

**Error**: TypeScript compilation errors due to missing type definitions.

**Root Cause**: Executor schema wasn't properly typed.

**Solution**: Created both:

- `schema.json` - JSON schema for validation
- `schema.d.ts` - TypeScript definitions

### Problem: Incorrect Asset Configuration

**Error**: Schema files not copied to dist during build.

**Root Cause**: `project.json` wasn't configured to copy non-TypeScript files.

**Solution**: Added assets configuration:

```json
"assets": [
  {
    "input": "./plugins/plugin-name/src",
    "glob": "**/!(*.ts)",
    "output": "."
  },
  {
    "input": "./plugins/plugin-name/src",
    "glob": "**/*.d.ts",
    "output": "."
  }
]
```

## TypeScript Configuration

### Problem: Inconsistent Type Checking

**Error**: `check-types` target not catching same errors as `build` target.

**Root Cause**: Different TypeScript configurations between targets.

**Initial Attempt**: Switched to esbuild for type checking:

```json
"check-types": {
  "executor": "@nx/esbuild:esbuild",
  "options": {
    "skipTypeCheck": false,
    "main": "{projectRoot}/src/index.ts"
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

### Problem: Wrong Entry Point for Extensions

**Error**:

```
Could not resolve "packages/project-name/src/index.ts"
```

**Root Cause**: Extension packages use `src/extension.ts`, not `src/index.ts`.

**Solution**: Updated nx.json to handle both patterns:

- Extensions: `src/extension.ts`
- Libraries: `src/index.ts`

### Problem: Redundant Strict Flag

**Error**: Added `--strict` flag to tsc command.

**Root Cause**: Assumed strict mode wasn't enabled.

**Solution**: Removed `--strict` flag since `tsconfig.base.json` already has `"strict": true`.

## Integration Testing

### Problem: Authentication Timeouts

**Error**:

```
Timed out waiting for authentication provider to register
```

**Root Cause**: External services trying to authenticate during tests.

**Initial Attempt**: Added direct disable flags:

```typescript
;('--disable-authentication', '--disable-extensions')
```

**Problem**: Caused warnings:

```
Warning: 'disable-authentication' is not in the list of known options
```

**Final Solution**: Used `--disable-extension` flags:

```typescript
;('--disable-extension', 'extension-name', '--disable-extension', 'another-extension')
```

### Problem: Noisy Test Output

**Error**: Tests cluttered with irrelevant startup messages.

**Solution**: Implemented output filtering:

```typescript
const filterPattern = filterPatterns.join("', '")
const command = `powershell -Command "& {command ${args.join(' ')} 2>&1 | Select-String -NotMatch '${filterPattern}'}"`
```

## Nx Target Configuration

### Problem: Hardcoded Paths in Targets

**Error**: Duplicated configuration across multiple projects.

**Root Cause**: Each project had its own target with hardcoded paths.

**Solution**: Created shared target default in `nx.json`:

```json
"target-name": {
  "executor": "@fux/plugin-name:executor-name",
  "dependsOn": ["build"],
  "cache": false,
  "options": {
    "config": "{projectRoot}/config-file.json",
    "timeout": 20000,
    "filterOutput": true
  }
}
```

### Problem: Missing Dependencies

**Error**: Tests running before build completed.

**Solution**: Added proper dependency chain:

```json
"dependsOn": ["build"]
```

## Testing & Mocking Issues

### Problem: Incomplete API Mocking

**Error**:

```
TypeError: Cannot read properties of undefined (reading 'api')
api.method is not a function
```

**Root Cause**: Mock setup was incomplete.

**Solution**: Enhanced API mock:

```typescript
vi.mock('api-module', () => ({
    commands: {
        registerCommand: vi.fn(),
        executeCommand: vi.fn(),
    },
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showErrorMessage: vi.fn(),
    },
    // ... other properties
}))
```

### Problem: Testing Integration Logic in Unit Tests

**Error**: Unit tests trying to test integration scenarios.

**Root Cause**: Confusion between unit and integration test responsibilities.

**Solution**:

- Unit tests: Focus on command registration, activation, error handling
- Integration tests: Test actual API interactions
- Removed problematic tests that required full context

### Problem: Incorrect Mock Return Values

**Error**:

```
AssertionError: expected "spy" to be called with arguments: [ Array(1) ]
Received: 1st spy call: [ "Failed to activate: Command registration failed", ]
```

**Root Cause**: Mock wasn't set up to allow error propagation.

**Solution**: Fixed mock to return proper disposable:

```typescript
vi.mocked(api.commands.registerCommand).mockReturnValue({
    dispose: vi.fn(),
})
```

## Path Resolution Problems

### Problem: Absolute vs Relative Paths

**Error**:

```
The specified path does not exist: 'absolute/path/to/file'
```

**Root Cause**: Executor running from project root but receiving absolute paths.

**Solution**: Convert absolute paths to relative:

```typescript
const relativePath = path.startsWith(projectRoot) ? path.substring(projectRoot.length + 1) : path
```

### Problem: Working Directory Mismatch

**Error**: Commands failing due to wrong working directory.

**Root Cause**: Executor context vs command execution context mismatch.

**Solution**: Explicitly set `cwd` in `execSync`:

```typescript
execSync(command, {
    stdio: 'inherit',
    cwd: projectRoot,
})
```

## Command Execution Issues

### Problem: Missing npx Prefix

**Error**:

```
command-name : The term 'command-name' is not recognized
```

**Root Cause**: Command not in PATH.

**Solution**: Use `npx command-name` instead of `command-name`.

### Problem: PowerShell Command Escaping

**Error**: PowerShell command syntax errors.

**Root Cause**: Improper escaping of command arguments.

**Solution**: Proper PowerShell command construction:

```typescript
const command = `powershell -Command "& {npx command-name ${args.join(' ')} 2>&1 | Select-String -NotMatch '${filterPattern}'}"`
```

## TypeScript Error Handling

### Problem: Using `any` Type

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

## Key Lessons Learned

1. **Plugin Structure**: Nx plugins must be in `plugins/` directory with proper registration
2. **Export Patterns**: Use default exports for executors, not named exports
3. **Schema Files**: Always create both JSON schema and TypeScript definitions
4. **Asset Configuration**: Configure build to copy non-TypeScript files
5. **Type Checking**: Use consistent TypeScript configuration across targets
6. **Integration Testing**: Disable extensions, not direct flags, to avoid warnings
7. **Path Resolution**: Always convert absolute paths to relative when changing context
8. **Command Execution**: Use `npx` for CLI tools, set explicit working directory
9. **Mocking**: Complete API mocks prevent undefined property errors
10. **Test Scope**: Unit tests for registration/activation, integration tests for API interaction
11. **Error Handling**: Use `unknown` type with type guards instead of `any`
12. **Dependencies**: Always specify proper target dependencies in Nx

## Prevention Strategies

1. **Start Simple**: Begin with basic plugin structure, add complexity gradually
2. **Test Early**: Run tests frequently during development
3. **Check Documentation**: Always reference Nx plugin documentation
4. **Use TypeScript**: Leverage type checking to catch errors early
5. **Mock Completely**: Ensure all used APIs are properly mocked
6. **Validate Paths**: Always verify path resolution in different contexts
7. **Test Both Modes**: Test both filtered and unfiltered output modes
8. **Document Changes**: Keep track of configuration changes and their reasons

## Future Improvements

1. **Error Recovery**: Add better error handling and recovery mechanisms
2. **Configuration Validation**: Validate all configuration options before execution
3. **Performance Optimization**: Cache compilation results when possible
4. **Better Logging**: Add structured logging for debugging
5. **Cross-Platform Support**: Ensure commands work on all platforms
6. **Plugin Testing**: Add unit tests for the executor itself
7. **Documentation**: Create user-facing documentation for the executor
8. **Configuration Options**: Add more configuration options for different use cases

## Related Files

- `plugins/recommended/src/index.ts` - Main plugin entry point
- `plugins/recommended/executors.json` - Executor registry
- `plugins/recommended/src/executors/audit-structure/` - Executor implementation
- `nx.json` - Global target defaults
- `packages/*/project.json` - Project-specific configurations
