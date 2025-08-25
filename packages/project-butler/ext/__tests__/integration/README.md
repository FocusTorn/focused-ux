# Project Butler Integration Tests

This directory contains VS Code extension integration tests that run in a real VS Code extension host environment. These tests validate that the extension works correctly when actually installed and running in VS Code.

## What These Tests Do

Integration tests run in a **real VS Code instance** and test:

- ✅ **Extension Activation**: Verifies the extension activates properly
- ✅ **Command Registration**: Ensures all commands are registered correctly
- ✅ **Command Execution**: Tests actual command execution in real VS Code
- ✅ **File System Operations**: Tests real file operations (formatting, backups)
- ✅ **Error Handling**: Validates graceful error handling
- ✅ **UI Integration**: Tests command palette integration

## Test Structure

```
integration/
├── runTest.ts              # Main test runner
├── vscode-test.config.ts   # VS Code test configuration
├── suite/
│   ├── index.ts            # Test suite entry point
│   ├── extension.test.ts   # Basic extension tests
│   └── commands.test.ts    # Command execution tests
└── README.md               # This file
```

## Running Integration Tests

### Prerequisites

1. **Build the extension first**:
   ```bash
   nx build @fux/project-butler-ext
   ```

2. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

### Running Tests

#### Basic Integration Tests
```bash
nx test:integration @fux/project-butler-ext
```

#### Full Integration Tests (with all dependencies)
```bash
nx test:integration:full @fux/project-butler-ext
```

#### Manual Execution
```bash
cd packages/project-butler/ext
node __tests__/integration/runTest.js
```

## What Happens During Testing

1. **VS Code Launch**: A real VS Code instance is launched in test mode
2. **Extension Installation**: Your extension is installed in the test VS Code instance
3. **Extension Activation**: The extension is activated automatically
4. **Test Execution**: Tests run in the real VS Code environment
5. **File Operations**: Real files are created, modified, and tested
6. **Command Execution**: Commands are executed as if a user was using them
7. **Cleanup**: Test files and VS Code instance are cleaned up

## Test Coverage

### Extension Tests (`extension.test.ts`)
- Extension activation and registration
- Command availability in command palette
- Basic command execution

### Command Tests (`commands.test.ts`)
- **Format Package.json**: Tests JSON formatting with real files
- **Create Backup**: Tests backup file creation
- **Update Terminal Path**: Tests terminal integration
- **Enter Poetry Shell**: Tests Poetry shell integration
- Error handling for edge cases
- Multiple command execution

## Test Environment

The tests run in an isolated VS Code environment with:
- Disabled extensions (except yours)
- Separate user data directory
- Separate extensions directory
- Disabled telemetry and updates
- Test workspace with real file system

## Troubleshooting

### Common Issues

1. **Extension Not Found**: Ensure the extension is built before running tests
2. **Timeout Errors**: Increase timeout in `vscode-test.config.ts`
3. **File Permission Errors**: Ensure test directories are writable
4. **VS Code Download Issues**: Check network connectivity for VS Code download

### Debug Mode

To run tests in debug mode, modify `runTest.ts`:
```typescript
await runTests({ 
  extensionDevelopmentPath, 
  extensionTestsPath,
  launchArgs: [
    '--disable-extensions',
    '--disable-workspace-trust',
    '--disable-telemetry',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-features=VSCodeWebNode',
    '--remote-debugging-port=9222' // Add this for debugging
  ]
})
```

## Adding New Tests

1. **Create test file** in `suite/` directory
2. **Import required modules**:
   ```typescript
   import * as assert from 'assert'
   import * as vscode from 'vscode'
   import * as path from 'path'
   import * as fs from 'fs'
   ```
3. **Use test structure**:
   ```typescript
   suite('Test Suite Name', () => {
     test('Test Description', async () => {
       // Test implementation
     })
   })
   ```
4. **Add to suite index** if needed

## Benefits Over Unit Tests

- **Real Environment**: Tests run in actual VS Code, not mocked environment
- **File System**: Real file operations, not mocked file system
- **Command Execution**: Actual command execution, not just function calls
- **UI Integration**: Tests command palette and UI interactions
- **Extension Host**: Tests extension host integration
- **User Experience**: Validates actual user workflows

## Performance Considerations

- Integration tests are slower than unit tests (VS Code startup time)
- Each test run downloads VS Code if not cached
- File system operations add overhead
- Use sparingly for critical functionality validation

## Best Practices

1. **Keep tests focused**: Test one specific functionality per test
2. **Clean up resources**: Always clean up test files and directories
3. **Handle async operations**: Use proper async/await patterns
4. **Test error cases**: Include tests for error scenarios
5. **Use descriptive names**: Make test names clear and descriptive
