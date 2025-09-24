# Functional Tests

**Purpose**: Main vitest test suites containing the core functionality tests. These tests verify that the package's features work correctly and meet the expected behavior.

## Guidelines

- **Core Functionality**: Test all main features and user-facing functionality
- **Integration Tests**: Test how different components work together
- **Error Handling**: Verify proper error handling and recovery
- **Edge Cases**: Test boundary conditions and unusual inputs
- **Performance**: Test performance-critical paths where applicable

## Test Organization

Tests are organized by service/component:

- `CCP_Manager-orchestration.test.ts` - Manager service orchestration tests
- `CCP_Storage.service.test.ts` - Storage service tests
- `ContextDataCollectorService.test.ts` - Context data collection tests
- `ContextFormattingService.test.ts` - Context formatting tests
- `FileContentProviderService.test.ts` - File content provider tests
- `FileExplorerService.test.ts` - File explorer service tests
- `FileUtils.service.test.ts` - File utilities tests
- `FileUtilsService.test.ts` - File utilities service tests
- `GoogleGenAiService.test.ts` - Google GenAI service tests
- `ManagerService.test.ts` - Manager service tests
- `QuickSettingsService.test.ts` - Quick settings service tests
- `SavedStatesService.test.ts` - Saved states service tests
- `StorageService.test.ts` - Storage service tests
- `TokenizerService.test.ts` - Tokenizer service tests
- `TreeFormatter.service.test.ts` - Tree formatter service tests
- `TreeFormatterService.test.ts` - Tree formatter service tests

## Running Functional Tests

```bash
# Run all functional tests
pnpm exec vitest run functional-tests

# Run specific test file
pnpm exec vitest run functional-tests/ManagerService.test.ts

# Run with watch mode
pnpm exec vitest functional-tests
```



