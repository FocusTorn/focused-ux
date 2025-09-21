# Functional Tests

This directory contains integration tests that validate the real runtime behavior of the ghost-writer core services.

## Test Strategy

- **Real Behavior Validation**: Test actual service interactions
- **Direct Instantiation**: Use direct dependency injection with mocks
- **Integration Focus**: Test how services work together
- **Mock Dependencies**: Mock external dependencies while testing real logic

## Test Structure

- `ClipboardService.test.ts` - Test clipboard functionality
- `ImportGeneratorService.test.ts` - Test import generation
- `ConsoleLoggerService.test.ts` - Test console logging generation
