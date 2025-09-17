# Ghost Writer Integration Tests

This directory contains integration tests for the Ghost Writer extension.

## Structure

- `suite/` - Test files
- `mocked-workspace/` - Test workspace files
- `_out-tsc/` - Compiled test output
- `tsconfig.test.json` - TypeScript configuration for tests
- `.vscode-test.mjs` - VS Code test configuration

## Running Tests

```bash
# Compile integration tests
nx run @fux/ghost-writer-ext:test:compile

# Run integration tests
nx run @fux/ghost-writer-ext:test:integration

# Run integration tests with full output
nx run @fux/ghost-writer-ext:test:integration:noisy
```
