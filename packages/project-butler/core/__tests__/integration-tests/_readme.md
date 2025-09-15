# Integration Tests

**Focus**: End-to-end testing in real VS Code environment
**Purpose**: Test extension functionality in actual VS Code workspace

## Overview

Integration tests run the Dynamicons extension in a real VS Code environment to verify:

- Extension activation and registration
- Command availability and execution
- UI interactions and notifications
- File system operations
- Workspace integration

## Test Structure

- **suite/**: Test suite files containing actual test cases
- **mocked-workspace/**: Workspace files for testing file operations
- **index.ts**: Test runner entry point

## Test Categories

- **Extension Lifecycle**: Activation, deactivation, registration
- **Command Integration**: Command availability and execution
- **UI Integration**: Notifications, dialogs, status updates
- **File System**: File operations, workspace interactions
- **Configuration**: Extension settings and preferences

## Test Patterns

- Use real VS Code API calls
- Test actual extension behavior
- Verify UI interactions
- Test file system operations
- Validate command execution

## Mock Strategy

- Minimal mocking - use real VS Code APIs
- Mock external dependencies only
- Use realistic test data
- Test actual user workflows

## Test Focus

- Extension activation
- Command registration
- UI notifications
- File operations
- Workspace integration
- Error handling in real environment

## Coverage Goals

- 100% extension activation coverage
- All commands tested in real environment
- UI interactions verified
- File system operations tested
- Error scenarios covered

## Performance Requirements

- Tests complete within 30 seconds
- No memory leaks during test execution
- Clean extension state after tests
- Proper cleanup of test resources

## Maintenance

- Update tests when extension API changes
- Add tests for new commands
- Verify UI changes in integration tests
- Monitor test performance and reliability
