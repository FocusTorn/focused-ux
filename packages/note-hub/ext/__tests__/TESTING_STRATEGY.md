# Notes Hub Extension Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Notes Hub extension, including unit tests, integration tests, and end-to-end command testing to ensure all functionality works as intended. This strategy is based on actual implementation patterns and lessons learned from comprehensive testing.

## Testing Philosophy

### 1. **Mock vs. Real Implementation Testing**

- **Unit Tests**: Use enhanced Mockly to test individual components in isolation
- **Integration Tests**: Test component interactions with realistic mock data
- **End-to-End Tests**: Verify complete command workflows from user input to final state

### 2. **State Verification**

- Test both the **process** (method calls, events) and the **end state** (file system, editor state)
- Verify that all side effects are properly handled
- Ensure data consistency across the entire system
- **CRITICAL**: Always verify editor state, not just file system operations

### 3. **Mock Object Consistency**

- **Use the correct mock instance**: Service uses injected mocks, not global Mockly service
- **Verify editor opening**: Always check `expect(mockWindow.showTextDocument).toHaveBeenCalled()`
- **Verify active editor state**: Always check `expect(mockWindow.activeTextEditor).toBeDefined()`

### 4. **Mockly Optimization Strategy** ⚠️ **NEW**

- **Maximize Mockly Usage**: Use mockly services wherever possible instead of manual mocks
- **Document Mockly Gaps**: Clearly identify and document what mockly cannot cover
- **Fallback Strategy**: Use manual mocks only for interfaces that mockly cannot provide
- **Consistent Pattern**: Follow the established pattern of ✅ MOCKLY CAN COVER vs ❌ MOCKLY CANNOT COVER

#### Mockly Coverage Analysis:

```typescript
// ✅ MOCKLY CAN COVER: VSCode core services
iWindow = {
    ...mockly.window,
    showInputBox: vi.fn().mockResolvedValue('new-folder'), // Custom behavior
} as unknown as IWindow

// ✅ MOCKLY CAN COVER: Workspace file system operations
iWorkspace = {
    ...mockly.workspace,
    fs: {
        // Ensure all required fs methods are available
        stat: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        createDirectory: vi.fn().mockResolvedValue(undefined), // Custom behavior
        readDirectory: vi.fn(),
        delete: vi.fn(),
        copy: vi.fn(),
        rename: vi.fn(),
    },
} as unknown as IWorkspace

// ✅ MOCKLY CAN COVER: Node.js utilities
const iFspAccess = mockly.node.fs.access as any
const iFspRename = vi.fn() // ❌ MOCKLY CANNOT COVER: rename method not available

// ✅ MOCKLY CAN COVER: Path utilities
(p: string, c: string) => mockly.node.path.join(p, c) as any,
(p: string) => mockly.node.path.normalize(p) as any,
(p: string) => mockly.node.path.dirname(p) as any,
(s: string) => ({
    name: mockly.node.path.basename(s, mockly.node.path.extname(s)),
    ext: mockly.node.path.extname(s),
}) as any,
(s: string) => mockly.node.path.extname(s) as any,

// ❌ MOCKLY CANNOT COVER: Custom interfaces specific to shared library
iCommon = {
    errMsg: vi.fn(),
    infoMsg: vi.fn(),
    warnMsg: vi.fn(),
    debugMsg: vi.fn(),
} as unknown as ICommonUtilsService

// ❌ MOCKLY CANNOT COVER: Custom service interfaces
iProviderManager = {
    getProviderForNote: vi.fn().mockResolvedValue({ /* ... */ }),
    getProviderInstance: vi.fn().mockReturnValue({ notesDir: '/notes/project' }),
    revealNotesHubItem: vi.fn(),
}
```

### 5. **Node Utilities via Mockly (Tests)**

- In tests, prefer Mockly's Node adapters for path and fs utilities to maintain consistency with the mocked VSCode environment
- Use `mockly.node.path.join|dirname|basename|parse|extname|normalize` instead of `require('node:path')`
- Example injection into services under test:

```ts
import { mockly } from '@fux/mockly'

actionService = new NotesHubActionService(
    /* ... */
    mockly.node.path.join,
    mockly.node.path.dirname,
    mockly.node.path.basename,
    mockly.node.path.parse,
    mockly.node.path.extname
    /* ... */
)
```

### 6. **Environment Clipboard via Mockly (Tests) ⚠️ NEW**

- Prefer Mockly env clipboard shims over manual iEnv mocks in tests.
- Use `mockly.env.clipboard.writeText` and `mockly.env.clipboard.readText` where clipboard is needed (copy/cut/paste flows).

```ts
// Inject env from DI as usual, or use mockly.env directly in tests
vi.spyOn(mockly.env.clipboard, 'writeText').mockResolvedValue(undefined)
vi.spyOn(mockly.env.clipboard, 'readText').mockResolvedValue('file:///notes/project/note.md')
```

## Enhanced Mockly Capabilities

### MockTextDocument

```typescript
// Enhanced document with proper VSCode TextDocument interface
const doc = new MockTextDocument(uri, content)
// Trailing newlines are preserved; getText() returns exact content
expect(doc.getText()).toBe(content)
expect(doc.lineCount).toBe(2)
expect(doc.positionAt(10)).toEqual(new Position(1, 2))
```

### MockTextEditor

```typescript
// Enhanced editor with selection and cursor management
const editor = new MockTextEditor(doc)
editor.moveCursor(1, 5)
editor.selectText(0, 0, 1, 10)
expect(editor.selection.start.line).toBe(0)
```

### MockFileSystem

```typescript
// Enhanced file system with proper URI handling
await mocklyService.workspace.fs.createDirectory(uri)
await mocklyService.workspace.fs.writeFile(uri, content)
const fileContent = await mocklyService.workspace.fs.readFile(uri)
expect(fileContent).toBeDefined()
```

### MockWindow

```typescript
// Enhanced window with editor tracking
await mockWindow.showTextDocument(doc)
expect(mockWindow.activeTextEditor).toBeDefined()
expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe(expectedPath)
```

## Critical Testing Patterns

### 1. **Editor State Verification** ⚠️ **REQUIRED**

```typescript
// ALWAYS verify editor was opened
expect(mockWindow.showTextDocument).toHaveBeenCalled()

// ALWAYS verify active editor is set
expect(mockWindow.activeTextEditor).toBeDefined()
// Normalize path separators for cross-platform
expect(mockWindow.activeTextEditor?.document.uri.fsPath.replace(/\\/g, '/')).toBe(expectedFilePath)

// Test editor functionality
const editor = mockWindow.activeTextEditor
if (editor) {
    editor.moveCursor(1, 5)
    expect(editor.selection.start).toEqual({ line: 1, character: 5 })
}
```

### 2. **Mock Object Setup** ⚠️ **CRITICAL**

```typescript
// Prefer the shared helper to keep tests lean and consistent
import { makeMockWindowWithEditor } from './helpers/mockWindow'

const mockWindow = makeMockWindowWithEditor()
```

### 3. **Service Integration Testing** ⚠️ **ESSENTIAL**

```typescript
// Service uses injected mocks, not global Mockly service
actionService = new NotesHubActionService(
    mockContext,
    mockWindow, // ← Use local mockWindow
    mockWorkspace // ← Use local mockWorkspace
    // ... other dependencies
)

// Verify against the correct mock instance
expect(mockWindow.showTextDocument).toHaveBeenCalled() // ✅ CORRECT
expect(mocklyService.window.showTextDocument).toHaveBeenCalled() // ❌ WRONG
```

## Command Testing Strategy

### 1. **New Note Commands**

#### `newNoteInFolder` (Enhanced Integration)

```typescript
describe('newNoteInFolder Command', () => {
    it('should create note and open editor end-to-end with proper file system state', async () => {
        // Setup test directory
        const testDir = '/test/notes/project'
        mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

        // Create folder item
        const folderItem = new NotesHubItem('project', testDir, true)

        // Mock input box to return a note name
        vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('TestNote')

        // Execute note creation
        await actionService.newNoteInFolder(folderItem)

        // Verify file was created in mock file system
        const expectedFilePath = '/test/notes/project/TestNote.md'
        const fileContent = await mocklyService.workspace.fs.readFile(
            mocklyService.Uri.file(expectedFilePath)
        )
        expect(fileContent).toBeDefined()

        // Verify file content
        const contentText = new TextDecoder().decode(fileContent)
        expect(contentText).toContain('# TestNote')

        // Verify provider was refreshed
        expect(mockProvider.refresh).toHaveBeenCalled()

        // Verify editor was opened
        expect(mockWindow.showTextDocument).toHaveBeenCalled()

        // Verify active text editor is set
        expect(mockWindow.activeTextEditor).toBeDefined()
        expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe(expectedFilePath)
    })
})
```

### 2. **Multiple Note Creation Testing**

```typescript
it('should handle multiple note creations and maintain proper editor state', async () => {
    // Create first note
    vi.spyOn(mockWindow, 'showInputBox').mockResolvedValueOnce('Note1')
    await actionService.newNoteInFolder(folderItem)

    // Verify first note was created and editor opened
    const file1Content = await mocklyService.workspace.fs.readFile(
        mocklyService.Uri.file('/test/notes/project/Note1.md')
    )
    expect(file1Content).toBeDefined()
    expect(mockWindow.showTextDocument).toHaveBeenCalledTimes(1)

    // Create second note
    vi.spyOn(mockWindow, 'showInputBox').mockResolvedValueOnce('Note2')
    await actionService.newNoteInFolder(folderItem)

    // Verify second note was created and editor opened
    const file2Content = await mocklyService.workspace.fs.readFile(
        mocklyService.Uri.file('/test/notes/project/Note2.md')
    )
    expect(file2Content).toBeDefined()
    expect(mockWindow.showTextDocument).toHaveBeenCalledTimes(2)

    // Verify active editor points to the most recently created note
    expect(mockWindow.activeTextEditor).toBeDefined()
    expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe('/test/notes/project/Note2.md')
})
```

## Integration Testing Patterns

### 1. **Provider Integration**

```typescript
describe('Provider Integration', () => {
    it('should use correct provider for different note types', async () => {
        // Test project notes use project provider
        // Test remote notes use remote provider
        // Test global notes use global provider
    })

    it('should refresh providers after operations', async () => {
        // Verify all providers are refreshed after file operations
        // Check that tree view updates properly
    })
})
```

### 2. **Configuration Integration**

```typescript
describe('Configuration Integration', () => {
    it('should respect user configuration', async () => {
        // Test custom notes directories
        // Test file extensions
        // Test default templates
    })
})
```

### 3. **Event System Integration**

```typescript
describe('Event System Integration', () => {
    it('should emit proper events', async () => {
        // Test file creation events
        // Test file modification events
        // Test provider refresh events
    })
})
```

## End-to-End Testing Scenarios

### 1. **Complete Note Creation Workflow**

```typescript
describe('Complete Note Creation Workflow', () => {
    it('should handle full note creation from command to editor', async () => {
        // 1. User executes newNoteInFolder command
        // 2. Input box prompts for note name
        // 3. File is created with proper content
        // 4. Editor is opened with the new document
        // 5. Provider is refreshed
        // 6. Tree view is updated
        // 7. Verify all state is consistent

        // CRITICAL: Verify both file system AND editor state
        expect(mocklyService.workspace.fs.readFile(uri)).toBeDefined()
        expect(mockWindow.showTextDocument).toHaveBeenCalled()
        expect(mockWindow.activeTextEditor).toBeDefined()
    })
})
```

### 2. **Multi-Operation Workflow**

```typescript
describe('Multi-Operation Workflow', () => {
    it('should handle complex operations sequence', async () => {
        // 1. Create note
        // 2. Rename note
        // 3. Move note to different folder
        // 4. Delete original folder
        // 5. Verify all operations completed successfully
        // 6. Verify file system state is consistent
        // 7. Verify editor state is consistent
    })
})
```

## Testing Best Practices

### 1. **Setup and Teardown**

```typescript
beforeEach(() => {
    // Reset Mockly state
    mocklyService.reset()

    // Setup test file system
    mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

    // Clear all mocks
    vi.clearAllMocks()
})

afterEach(() => {
    // Verify no side effects
    // Note: Use readFile instead of non-existent getFileSystemState
    const files = await mocklyService.workspace.fs.readDirectory(mocklyService.Uri.file('/test'))
    expect(files.length).toBe(expectedCount)
})
```

### 2. **State Verification** ⚠️ **CRITICAL**

```typescript
// Always verify end state, not just method calls
const fileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file(expectedPath))
expect(fileContent).toBeDefined()

// ALWAYS verify editor state
expect(mockWindow.showTextDocument).toHaveBeenCalled()
expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe(expectedPath)
expect(mockProvider.refresh).toHaveBeenCalled()
```

### 3. **Error Handling**

```typescript
it('should handle errors gracefully', async () => {
    // Setup error condition
    vi.spyOn(mocklyService.workspace.fs, 'writeFile').mockRejectedValue(
        new Error('Permission denied')
    )

    // Execute operation
    await expect(actionService.newNoteInFolder(folderItem)).rejects.toThrow()

    // Verify error was handled properly
    expect(mockWindow.showErrorMessage).toHaveBeenCalled()
})
```

### 4. **Async Operation Testing**

```typescript
it('should handle async operations correctly', async () => {
    // Use proper async/await
    const result = await actionService.someAsyncOperation()

    // Verify async state changes
    expect(result).toBeDefined()
    const fileContent = await mocklyService.workspace.fs.readFile(
        mocklyService.Uri.file(expectedPath)
    )
    expect(fileContent).toBeDefined()
})
```

## Debugging and Troubleshooting

### 1. **Console Output Control** ⚠️ **UPDATED**

#### Environment Variable Method (Recommended):

```pwsh
# Enable console output for all tests in the session
$env:ENABLE_TEST_CONSOLE="true"; nh t

# Or set the environment variable first
$env:ENABLE_TEST_CONSOLE="true"
nh t
```

#### Programmatic Method:

```typescript
import { enableTestConsoleOutput } from '../setup'

describe('My Test Suite', () => {
    beforeEach(() => {
        // Enable console output for this test suite
        enableTestConsoleOutput()
    })

    it('should show console output', () => {
        console.log('🔍 This will now be visible!')
        // Test code here
    })
})
```

#### Console Output Strategies:

- **Environment Variable**: Set `ENABLE_TEST_CONSOLE=true` to enable console output globally
- **Programmatic Control**: Use `enableTestConsoleOutput()` function in specific tests
- **Default Behavior**: Console output is silenced by default to reduce test noise
- **Debugging**: Enable console output when investigating test failures or complex scenarios

### 2. **State Inspection**

```typescript
// Print current state for debugging
console.log('=== Test State ===')
console.log('Active Editor:', mockWindow.activeTextEditor?.document.uri.fsPath)
console.log('Provider calls:', mockProvider.refresh.mock.calls.length)

// Note: printFileSystem and printEditorState don't exist in current Mockly
// Use readFile and readDirectory instead
```

### 2. **Mock Verification**

```typescript
// Verify mocks were called correctly
expect(mocklyService.workspace.fs.writeFile).toHaveBeenCalledWith(
    expect.objectContaining({ fsPath: expectedPath }),
    expect.any(Uint8Array)
)
```

### 3. **Timing Issues**

```typescript
// Use waitFor for async state changes
await waitFor(
    () => {
        expect(mockWindow.activeTextEditor).toBeDefined()
    },
    { timeout: 1000 }
)
```

## Performance Testing

### 1. **Large File Operations**

```typescript
it('should handle large files efficiently', async () => {
    const largeContent = 'x'.repeat(1000000) // 1MB file

    // Measure operation time
    const start = performance.now()
    await actionService.createLargeNote(largeContent)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1000) // Should complete within 1 second
})
```

### 2. **Multiple Operations**

```typescript
it('should handle multiple operations efficiently', async () => {
    const operations = Array.from({ length: 100 }, (_, i) =>
        actionService.newNoteInFolder(folderItem, `Note${i}`)
    )

    const start = performance.now()
    await Promise.all(operations)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
})
```

## Continuous Integration

### 1. **Test Coverage Requirements**

- Minimum 90% line coverage
- 100% coverage for critical paths (note creation, file operations)
- All public methods must have tests
- **CRITICAL**: All editor state verification must be tested

### 2. **Performance Benchmarks**

- Note creation: < 100ms
- File operations: < 50ms
- Large file handling: < 1000ms

### 3. **Automated Testing**

- Run tests on every commit
- Performance regression testing
- Cross-platform compatibility testing

## Nx Aliases and Type Checking

- Use workspace aliases to ensure consistent execution context:
    - `nh tsc` → Type checks the ext project (`@fux/note-hub-ext:check-types`)
    - `nh test` → Runs the ext tests (`@fux/note-hub-ext:test`)
- The ext `tsconfig.json` is scoped to source files only for type-check (`include: src/**/*.ts`, `exclude: __tests__/**`) to avoid `rootDir` violations from test-time imports of core modules.

## Lessons Learned & Critical Rules

### 1. **Mock Object Consistency** ⚠️ **NEVER VIOLATE**

- **Service uses injected mocks**: Always verify against the mock instance passed to the service
- **Don't mix mocklyService and local mocks**: Use one or the other consistently
- **Verify the correct mock**: `mockWindow.showTextDocument` not `mocklyService.window.showTextDocument`

### 2. **Editor State Verification** ⚠️ **ALWAYS REQUIRED**

- **File creation alone is insufficient**: Must verify editor was opened
- **Active editor must be set**: Always check `mockWindow.activeTextEditor`
- **Editor functionality must work**: Test cursor movement, selection, document modification

### 3. **Interface Compliance** ⚠️ **MANDATORY**

- **Mock objects must implement complete interfaces**: Not just partial implementations
- **All required properties must be mocked**: Even if not directly used in tests
- **Type safety is critical**: Avoid `any` types where possible

### 4. **Test Reliability** ⚠️ **ESSENTIAL**

- **Never skip tests without fixing root causes**: This creates technical debt
- **Investigate integration layer first**: When mocks don't work, check the integration
- **Verify after each fix**: Build and test to ensure no regressions

## Conclusion

This testing strategy ensures that:

1. **All commands work end-to-end** with proper state management
2. **Mockly provides realistic VSCode behavior** for comprehensive testing
3. **Tests catch both functional and performance issues** before they reach users
4. **The extension maintains quality** as new features are added
5. **Editor state verification is comprehensive** and reliable
6. **Mock object usage is consistent** and correct

By following these patterns, we can confidently verify that the Notes Hub extension works correctly in all scenarios and provides a reliable user experience. The enhanced integration tests now provide comprehensive coverage of both file system operations and editor integration workflows.
