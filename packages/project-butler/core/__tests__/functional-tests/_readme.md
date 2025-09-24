# Functional Tests

**Purpose**: Main vitest test suites containing the core functionality tests. These tests verify that the package's features work correctly and meet the expected behavior.

## Guidelines

- **Core Functionality**: Test all main features and user-facing functionality
- **Integration Tests**: Test how different components work together
- **Error Handling**: Verify proper error handling and recovery
- **Edge Cases**: Test boundary conditions and unusual inputs
- **Performance**: Test performance-critical paths where applicable

## Test Organization

Tests are organized by service/component based on the existing test files in this directory.

## Running Functional Tests

```bash
# Run all functional tests
pnpm exec vitest run functional-tests

# Run specific test file
pnpm exec vitest run functional-tests/SomeService.test.ts

# Run with watch mode
pnpm exec vitest functional-tests
```



