# Extension Functional Tests

This directory contains integration tests that validate the VSCode extension functionality.

## Test Strategy

- **Command Testing**: Test command registration and execution
- **Adapter Testing**: Test VSCode adapter implementations
- **Error Handling**: Test error scenarios and user feedback
- **Mockly Integration**: Use Mockly for VSCode API mocking

## Test Structure

- `extension.test.ts` - Test extension activation and command registration
- `adapters.test.ts` - Test VSCode adapter implementations
- `commands.test.ts` - Test command handlers and execution
