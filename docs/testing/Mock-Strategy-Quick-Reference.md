# Mock Strategy Quick Reference

## 🚀 Quick Start

### 1. Basic Test Setup

```typescript
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockStorageContext,
} from '../__mocks__/helpers'

beforeEach(() => {
    mocks = setupTestEnvironment()
    setupVSCodeMocks(mocks)
    resetAllMocks(mocks)
    mockContext = createMockStorageContext()
})
```

### 2. Mock Creators

```typescript
import {
    createMockTextEditor,
    createMockConfiguration,
    createMockStorageContext,
} from '../__mocks__/helpers'

// Create mock objects
const mockEditor = createMockTextEditor({
    fileName: '/test/file.ts',
    content: 'const test = "hello world";',
})

const mockConfig = createMockConfiguration()
mockConfig.get.mockReturnValue(true)
```

### 3. Mock Scenarios

```typescript
import {
    setupVSCodeTextEditorScenario,
    setupVSCodeCommandRegistrationScenario,
    setupVSCodeWindowMessageScenario,
} from '../__mocks__/mock-scenario-builder'

// Use scenarios for complex setup
setupVSCodeTextEditorScenario(mocks, {
    fileName: '/test/file.ts',
    content: 'const test = "hello world";',
})

setupVSCodeCommandRegistrationScenario(mocks, {
    commandName: 'test.command',
    shouldSucceed: true,
})
```

### 4. Builder Pattern

```typescript
import { createGhostWriterMockBuilder } from '../__mocks__/mock-scenario-builder'

// Fluent API for complex scenarios
createGhostWriterMockBuilder(mocks)
    .textEditor({ fileName: '/test/file.ts' })
    .commandRegistration({ commandName: 'test.command' })
    .windowMessage('info', 'Test message')
    .build()
```

## 📁 File Structure

```
__tests__/
├── __mocks__/
│   ├── globals.ts              # Global mocks & setup
│   ├── helpers.ts              # Test utilities & mock creators
│   └── mock-scenario-builder.ts # Composable mock scenarios
└── functional-tests/
    └── *.test.ts               # Individual test files
```

## 🎯 When to Use What

| Use Case            | Component                  | Example                                                                          |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| Module mocking      | `globals.ts`               | `vi.mock('vscode', () => ({ ... }))`                                             |
| Simple mock objects | `helpers.ts`               | `createMockTextEditor(options)`                                                  |
| Complex scenarios   | `mock-scenario-builder.ts` | `setupVSCodeTextEditorScenario(mocks, options)`                                  |
| Multiple scenarios  | Builder pattern            | `createGhostWriterMockBuilder(mocks).textEditor().commandRegistration().build()` |

## ⚡ Common Patterns

### Text Editor Testing

```typescript
// Simple
const mockEditor = createMockTextEditor({ fileName: '/test/file.ts' })

// Complex
setupVSCodeTextEditorScenario(mocks, {
    fileName: '/test/file.ts',
    content: 'const test = "hello world";',
    selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
})
```

### Command Registration Testing

```typescript
// Success
setupVSCodeCommandRegistrationScenario(mocks, {
    commandName: 'test.command',
    shouldSucceed: true,
})

// Error
setupVSCodeCommandRegistrationScenario(mocks, {
    commandName: 'test.command',
    shouldSucceed: false,
    errorMessage: 'Registration failed',
})
```

### Configuration Testing

```typescript
// Simple
const mockConfig = createMockConfiguration()
mockConfig.get.mockReturnValue(true)

// Complex
setupVSCodeWorkspaceConfigScenario(mocks, {
    configKey: 'test.setting',
    configValue: true,
})
```

### Window Messages

```typescript
setupVSCodeWindowMessageScenario(mocks, 'info', 'Test message')
setupVSCodeWindowMessageScenario(mocks, 'warning', 'Warning message')
setupVSCodeWindowMessageScenario(mocks, 'error', 'Error message')
```

## 🚨 Common Pitfalls

### ❌ Don't Forget Mock Reset

```typescript
beforeEach(() => {
    mocks = setupTestEnvironment()
    setupVSCodeMocks(mocks)
    resetAllMocks(mocks) // ← Always include this!
})
```

### ❌ Don't Use Scenarios for Simple Cases

```typescript
// Too complex for simple case
setupVSCodeTextEditorScenario(mocks, { fileName: '/test/file.ts' })

// Better for simple case
const mockEditor = createMockTextEditor({ fileName: '/test/file.ts' })
mocks.vscode.window.activeTextEditor = mockEditor
```

### ❌ Don't Forget Type Assertions

```typescript
// Wrong
vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })

// Correct
const mockUri = { fsPath: filePath } as vscode.Uri
vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
```

## 📖 Full Documentation

For complete documentation, see [Enhanced Mock Strategy Guide](./Enhanced-Mock-Strategy.md)


