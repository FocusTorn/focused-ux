# Integration Testing Strategy

## Overview

This document outlines the strategy for integration testing VS Code extensions in the FocusedUX project, based on lessons learned from debugging and resolving integration test issues.

## Architecture

### Test Framework

- **Framework**: `@vscode/test-cli` (v0.0.11)
- **Test Runner**: Mocha with VS Code extension host
- **Configuration**: `.vscode-test.mjs` files in extension packages
- **Compilation**: TypeScript compilation to `out-tsc/` directory

### Test Structure

```
packages/{feature}/ext/
├── test/
│   ├── suite/
│   │   ├── index.ts          # Mocha hooks and setup
│   │   ├── *.test.ts         # Test files
│   │   └── ...
│   └── test-workspace/       # Test workspace files
├── out-tsc/                  # Compiled test files
│   └── suite/
├── .vscode-test.mjs          # Test configuration
└── tsconfig.test.json        # Test TypeScript config
```

## Critical Configuration Requirements

### 1. Environment Variable Setup

**CRITICAL**: The `VSCODE_TEST` environment variable must be set to `'1'` in the test configuration to prevent UI operations from hanging.

```javascript
// .vscode-test.mjs
export default defineConfig({
    // ... other config
    env: {
        VSCODE_TEST: '1',
    },
    // ... rest of config
})
```

**Why this matters**:

- Extensions use `process.env.VSCODE_TEST === '1'` to detect test environment
- Without this, UI operations like `window.showInformationMessage()` hang in tests
- This was the root cause of the project-butler test hanging issue

### 2. Setup Files Configuration

Use `setupFiles` instead of `--require` parameter to avoid module resolution issues:

```javascript
// .vscode-test.mjs
export default defineConfig({
    // ... other config
    setupFiles: ['./out-tsc/suite/index.js'],
    // ... rest of config
})
```

**Why this matters**:

- `--require` parameter can cause module resolution issues in extension host context
- `setupFiles` is resolved relative to configuration file location
- More reliable path resolution in test environment

### 3. Test Compilation Configuration

```json
// tsconfig.test.json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./out-tsc",
        "rootDir": "./test",
        "module": "CommonJS",
        "moduleResolution": "node",
        "types": ["node", "mocha"],
        "composite": false,
        "declaration": false,
        "sourceMap": true,
        "tsBuildInfoFile": "./out-tsc/tsconfig.test.tsbuildinfo"
    },
    "include": ["test/**/*.ts"]
}
```

## Test Implementation Patterns

### 1. Mocha Hooks Setup

```typescript
// test/suite/index.ts
import * as vscode from 'vscode'

export const mochaHooks = {
    async beforeAll() {
        console.log('--- Global setup: Activating extension ---')
        const ext = vscode.extensions.getExtension('YourExtension.id')
        if (ext && !ext.isActive) {
            await ext.activate()
        }
        console.log('--- Extension activated ---')
    },

    async afterAll() {
        console.log('--- Global teardown: Closing editors ---')
        await vscode.commands.executeCommand('workbench.action.closeAllEditors')
        console.log('--- Teardown complete ---')
        await new Promise((resolve) => setTimeout(resolve, 500))
    },
}
```

### 2. Test Suite Structure

```typescript
// test/suite/feature.test.ts
import * as assert from 'node:assert'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs'

suite('Feature Test Suite', () => {
    let testFile = ''
    let testWorkspaceRoot = ''

    suiteSetup(() => {
        testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
        assert.ok(testWorkspaceRoot, 'Test workspace should be available')
        testFile = path.join(testWorkspaceRoot, 'test-file.txt')
        if (!fs.existsSync(testFile)) {
            fs.writeFileSync(testFile, 'Test content')
        }
    })

    suiteTeardown(() => {
        // Clean up test files
        const testDir = path.dirname(testFile)
        if (fs.existsSync(testDir)) {
            const testFiles = fs.readdirSync(testDir)
            for (const file of testFiles) {
                if (file.startsWith('test-file')) {
                    fs.unlinkSync(path.join(testDir, file))
                }
            }
        }
    })

    test('Should perform feature operation', async () => {
        const fileUri = vscode.Uri.file(testFile)

        // Verify command registration
        const commands = await vscode.commands.getCommands()
        const targetCommand = commands.find((cmd) => cmd.includes('yourCommand'))
        assert.ok(targetCommand, 'Command should be registered')

        // Execute command
        await vscode.commands.executeCommand('your-extension.yourCommand', fileUri)

        // Verify results
        // ... assertions
    })
})
```

### 3. Extension Environment Detection

```typescript
// src/extension.ts
import process from 'node:process'

const IS_TEST_ENVIRONMENT = process.env.VSCODE_TEST === '1'

export function activate(context: vscode.ExtensionContext) {
    // ... extension setup

    const disposables = [
        vscode.commands.registerCommand('your-extension.command', async (uri?: vscode.Uri) => {
            try {
                await performOperation(uri, service, window)
            } catch (error: any) {
                if (IS_TEST_ENVIRONMENT) {
                    throw error // Let test handle the error
                }
                await window.showErrorMessage(`Error: ${error.message}`)
            }
        }),
    ]
}

async function performOperation(
    uri: vscode.Uri | undefined,
    service: Service,
    window: WindowAdapter
): Promise<void> {
    // ... operation logic

    if (!IS_TEST_ENVIRONMENT) {
        await window.showInformationMessage('Operation completed successfully')
    }
}
```

## Project.json Configuration

### Integration Test Targets

```json
{
    "test:compile": {
        "executor": "nx:run-commands",
        "outputs": ["{projectRoot}/out-tsc"],
        "options": {
            "commands": [
                "rimraf ./out-tsc/suite",
                "tsc -p packages/{feature}/ext/tsconfig.test.json"
            ]
        }
    },
    "test:integration": {
        "executor": "nx:run-commands",
        "dependsOn": ["build", "test:compile"],
        "options": {
            "commands": [
                "rimraf ./.vscode-test/user-data",
                "powershell -Command \"& {vscode-test --config .vscode-test.mjs --verbose 2>&1 | Select-String -NotMatch 'extensionEnabledApiProposals', 'ChatSessionStore', 'update#setState disabled', 'update#ctor', 'Started local extension host', 'Settings Sync'}\""
            ],
            "cwd": "packages/{feature}/ext"
        },
        "description": "Run VS Code extension integration tests using @vscode/test-cli"
    },
    "test:integration:full": {
        "executor": "nx:run-commands",
        "dependsOn": ["build", "test:compile"],
        "options": {
            "commands": [
                "rimraf ./.vscode-test/user-data",
                "powershell -Command \"& {vscode-test --config .vscode-test.mjs --verbose --timeout 20000 --reporter spec 2>&1 | Select-String -NotMatch 'extensionEnabledApiProposals', 'ChatSessionStore', 'update#setState disabled', 'update#ctor', 'Started local extension host', 'Settings Sync'}\""
            ],
            "cwd": "packages/{feature}/ext"
        },
        "description": "Run VS Code extension integration tests with detailed output"
    }
}
```

## Common Issues and Solutions

### 1. Command Execution Hanging

**Symptoms**: Test times out after command execution starts
**Root Cause**: Missing `VSCODE_TEST='1'` environment variable
**Solution**: Add environment variable to `.vscode-test.mjs` configuration

### 2. Module Resolution Errors

**Symptoms**: `Cannot find module './out-tsc/suite/index.js'`
**Root Cause**: Using `--require` parameter instead of `setupFiles`
**Solution**: Use `setupFiles` configuration option

### 3. UI Operations Hanging

**Symptoms**: `window.showInformationMessage()` never completes
**Root Cause**: Not detecting test environment properly
**Solution**: Ensure `IS_TEST_ENVIRONMENT` is `true` in test context

### 4. Test Environment Detection

**Symptoms**: Extension behaves like production instead of test mode
**Root Cause**: Environment variable not set or not detected
**Solution**: Verify `process.env.VSCODE_TEST === '1'` in extension

## Debugging Strategies

### 1. Add Comprehensive Logging

```typescript
// During debugging, add detailed logging
console.log('=== COMMAND EXECUTION STARTED ===')
console.log('Environment:', process.env.VSCODE_TEST)
console.log('IS_TEST_ENVIRONMENT:', IS_TEST_ENVIRONMENT)
console.log('Command parameters:', uri?.toString())
```

### 2. Use Timeout Wrappers

```typescript
// Test with timeout to identify hanging operations
const commandPromise = vscode.commands.executeCommand('your.command')
const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Command timed out')), 5000)
)

await Promise.race([commandPromise, timeoutPromise])
```

### 3. Step-by-Step Verification

```typescript
// Verify each step of the test process
console.log('Step 1: Command registration')
const commands = await vscode.commands.getCommands()
console.log(
    'Available commands:',
    commands.filter((cmd) => cmd.includes('your'))
)

console.log('Step 2: Command execution')
await vscode.commands.executeCommand('your.command')

console.log('Step 3: Result verification')
// ... assertions
```

## Best Practices

### 1. Test Isolation

- Use dedicated test workspace
- Clean up test files in `suiteTeardown`
- Use isolated user data directory
- Disable other extensions during tests

### 2. Error Handling

- Always check `IS_TEST_ENVIRONMENT` before UI operations
- Throw errors in test environment for proper test failure reporting
- Use descriptive error messages for debugging

### 3. Test Reliability

- Add appropriate timeouts for async operations
- Use `suiteSetup` and `suiteTeardown` for proper test lifecycle
- Verify command registration before execution
- Test both success and failure scenarios

### 4. Performance Considerations

- Keep test files focused and small
- Avoid unnecessary file system operations
- Use efficient cleanup strategies
- Monitor test execution times

## Integration with Build System

### Nx Integration

- Use `dependsOn: ["build", "test:compile"]` for proper dependency ordering
- Leverage Nx caching for faster test execution
- Use project-specific working directories

### TypeScript Configuration

- Separate test TypeScript configuration
- Use CommonJS module format for test compatibility
- Generate source maps for debugging
- Avoid composite builds for test compilation

## Future Improvements

### 1. Test Utilities

Consider creating shared test utilities for:

- Common test setup patterns
- File system test helpers
- Command execution wrappers
- Environment detection helpers

### 2. Test Coverage

- Add integration tests for all extension commands
- Test error scenarios and edge cases
- Validate extension activation and deactivation
- Test workspace-specific functionality

### 3. Performance Optimization

- Parallel test execution where possible
- Optimized test workspace setup
- Reduced test execution time
- Better resource cleanup

## Conclusion

Integration testing for VS Code extensions requires careful attention to environment configuration, proper test isolation, and understanding of the extension host lifecycle. The key lessons learned from the project-butler debugging session emphasize the importance of:

1. **Environment Variable Configuration**: Always set `VSCODE_TEST='1'`
2. **Setup File Configuration**: Use `setupFiles` instead of `--require`
3. **Test Environment Detection**: Properly detect and handle test vs production modes
4. **UI Operation Handling**: Skip UI operations in test environment
5. **Comprehensive Debugging**: Add detailed logging during development

Following these patterns ensures reliable, maintainable integration tests that properly validate extension functionality without hanging or timing out.
