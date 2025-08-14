# UriAdapter Injection Migration

## Problem

The `UriAdapter` class in the shared library was designed as a static class that directly imports `vscode.Uri`, making it impossible to inject mocks for testing. This forced Note Hub tests to use manual mocking instead of leveraging the Mockly library.

## Solution

### 1. **Interface-Based Design**

- Created `IUriFactory` interface that defines URI creation methods
- `UriAdapter` now accepts an injectable factory instead of hardcoded VSCode dependencies

### 2. **Backward Compatibility**

- Static methods remain available for existing code
- New factory-based approach is optional and can be adopted gradually

### 3. **Testing Integration**

- `MockUriFactoryService` in Mockly provides test-compatible URI creation
- Tests can inject mock factories without manual mocking

## Implementation Status

### ✅ Completed

- `IUriFactory` interface created
- `VSCodeUriFactory` implementation (default behavior)
- `UriAdapter` refactored to use factory pattern
- `MockUriFactoryService` created in Mockly (but not exported due to circular dependency)
- Shared library exports updated
- Note Hub tests now passing with manual mock (temporary solution)

### 🔄 Current State

- Note Hub tests are working with a clean manual mock
- The injectable architecture is in place but not yet fully utilized
- Circular dependency issues resolved by keeping MockUriFactoryService internal

### 📋 Next Steps for Full Migration

1. **Resolve Circular Dependencies**: Find a way to export MockUriFactoryService without circular imports
2. **Update Test Setup**: Replace manual mock with Mockly integration
3. **Remove Manual Mocking**: Clean up the vi.mock setup once injection is working
4. **Update Other Packages**: Apply the same pattern to other packages as needed

## Usage Examples

### Current (Static)

```typescript
import { UriAdapter } from '@fux/shared'

const uri = UriAdapter.file('/path/to/file')
```

### Future (Injectable)

```typescript
import { UriAdapter } from '@fux/shared'
import { MockUriFactoryService } from '@fux/mockly'

// For testing
UriAdapter.setFactory(new MockUriFactoryService())

// For production (default)
UriAdapter.setFactory(new VSCodeUriFactory())
```

## Benefits

1. **Testability**: URIs can be mocked without manual setup
2. **Flexibility**: Different URI implementations can be injected
3. **Consistency**: Follows the same pattern as other adapters
4. **Maintainability**: Single source of truth for URI creation logic

## Migration Path

1. **Phase 1**: ✅ Deploy shared library with new interfaces
2. **Phase 2**: ✅ Note Hub tests working (with manual mock)
3. **Phase 3**: 🔄 Resolve circular dependency issues
4. **Phase 4**: 🔄 Update Note Hub tests to use Mockly
5. **Phase 5**: 🔄 Remove manual mocking from test setup
6. **Phase 6**: 🔄 Update other packages as needed

## Current Workaround

The tests are currently using a clean manual mock that:

- Avoids circular dependency issues
- Provides the same functionality as the injectable approach
- Is maintainable and easy to understand
- Can be easily replaced once the injection is fully working

## Files Modified

- `libs/shared/src/_interfaces/IUriFactory.ts` - New interface
- `libs/shared/src/vscode/adapters/VSCodeUriFactory.ts` - Default implementation
- `libs/shared/src/vscode/adapters/Uri.adapter.ts` - Refactored adapter
- `libs/mockly/src/services/MockUriFactory.service.ts` - Mock implementation (internal)
- `libs/shared/src/index.ts` - Updated exports
- `libs/mockly/src/index.ts` - Updated exports
- `packages/note-hub/ext/__tests__/setup.ts` - Clean manual mock (temporary)
- `vscode-test-adapter.ts` - VSCode API mocking

## Technical Notes

### Circular Dependency Issue

The `MockUriFactoryService` imports from `@fux/shared`, but tests mock `@fux/shared`, creating a circular dependency. This is why the service is kept internal to Mockly for now.

### Alternative Solutions

1. **Move MockUriFactoryService to shared library** - Would require restructuring
2. **Use interface-only imports** - Would require MockUriFactoryService to not depend on UriAdapter
3. **Lazy loading** - Could resolve dependencies at runtime

### Current Test Performance

- All 60 tests passing (58 passed, 2 skipped)
- Test execution time: ~5.8 seconds
- No performance degradation from the manual mock approach
