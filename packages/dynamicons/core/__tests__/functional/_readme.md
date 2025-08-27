# Functional Tests

This directory contains functional tests for the Dynamicons core package.

## Test Organization

- **Service Tests**: Test business logic services with mock dependencies
- **Integration Tests**: Test service interactions and workflows
- **Configuration Tests**: Test configuration loading and validation

## Test Patterns

- Use direct dependency injection with mock classes
- Test real runtime behavior, not just mock replacements
- Validate actual service functionality
- Use descriptive test names that explain the behavior being tested

## Mock Strategy

- Create simple mock classes that implement service interfaces
- Use `vi.fn()` for method mocking
- Provide realistic mock return values
- Clear mocks between tests for isolation
