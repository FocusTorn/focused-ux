# Functional Tests for @fux/project-butler-core

This directory contains functional tests that validate the complete service orchestration and integration patterns.

## Test Files

- **ProjectMaidManager.service.test.ts** - Tests the main orchestrator service with real DI container integration

## Test Patterns

### DI Container Integration Tests

These tests validate that the dependency injection container properly wires all services together and that the complete service chain works correctly.

```typescript
describe('ProjectMaidManager Integration', () => {
    let container: ReturnType<typeof createDIContainer>
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupYamlMocks(mocks)

        container = createDIContainer({
            fileSystem: mocks.fileSystem,
            yaml: mocks.yaml,
            path: mocks.path,
        })

        resetAllMocks(mocks)
    })

    it('should format package.json through complete service chain', async () => {
        // Test complete workflow from manager through all services
    })
})
```

## Best Practices

- **Real DI Container**: Use the actual `createDIContainer` function to test real service wiring
- **Complete Workflows**: Test end-to-end scenarios that exercise multiple services
- **Mock Integration**: Use mocks that simulate real adapter behavior
- **Service Chain Validation**: Ensure services properly delegate to each other
- **Error Propagation**: Test that errors properly propagate through the service chain

## Test Coverage

These tests validate:

- Service orchestration through the ProjectMaidManager
- Complete workflow execution
- Error handling across service boundaries
- DI container configuration and wiring
- Real-world usage patterns
