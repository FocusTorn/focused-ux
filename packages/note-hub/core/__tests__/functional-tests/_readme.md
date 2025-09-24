# Functional Tests

**Purpose**: Main vitest test suites containing the core functionality tests. These tests verify that the package's features work correctly and meet the expected behavior.

This directory contains integration tests that validate the real runtime behavior of the note hub core services.

## Guidelines

- **Core Functionality**: Test all main features and user-facing functionality
- **Integration Tests**: Test how different components work together
- **Error Handling**: Verify proper error handling and recovery
- **Edge Cases**: Test boundary conditions and unusual inputs
- **Performance**: Test performance-critical paths where applicable

## Test Organization

Tests are organized by service/component:

- `NotesHubManager-orchestration.test.ts` - Manager service orchestration tests

## Running Functional Tests

```bash
# Run all functional tests
pnpm exec vitest run functional-tests

# Run specific test file
pnpm exec vitest run functional-tests/NotesHubManager-orchestration.test.ts

# Run with watch mode
pnpm exec vitest functional-tests
```


