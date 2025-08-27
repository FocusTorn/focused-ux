# FocusedUX Architectural Patterns

## **VSCode Import Patterns**

### **Core Packages**

- **Pattern**: Use type imports only
- **Implementation**: `import type { Uri } from 'vscode'`
- **Rationale**: Core packages remain pure business logic without VSCode dependencies
- **Testing**: Test business logic in complete isolation without VSCode mocking
- **Local Interface Pattern**: Define local interfaces (e.g., `IUri`, `IUriFactory`) to replace VSCode value usage

**Important Distinction**:

- ✅ **Type imports are fine**: `import type { Uri } from 'vscode'` - These don't violate decoupling
- ❌ **Value imports are forbidden**: `import { Uri } from 'vscode'` - These violate decoupling
- ❌ **Direct API calls are forbidden**: `Uri.file(path)` - These violate decoupling

### **Extension Packages**

- **Pattern**: Create local adapters with VSCode value imports
- **Implementation**:

    ```typescript
    // src/adapters/Window.adapter.ts
    import * as vscode from 'vscode'

    export interface IWindowAdapter {
        showInformationMessage: (message: string) => Promise<void>
    }

    export class WindowAdapter implements IWindowAdapter {
        async showInformationMessage(message: string): Promise<void> {
            await vscode.window.showInformationMessage(message)
        }
    }
    ```

- **Rationale**: Extension packages handle VSCode integration through local adapters
- **Testing**: Test VSCode integration through local adapters with API mocks

### **No Shared Package Usage**

- **Rule**: Each package is completely self-contained
- **Rationale**: Enables independent testing and validation
- **Implementation**: No dependencies on `@fux/shared` or other shared packages

## **Testing Architecture**

### **Core Package Testing**

- **Isolation**: Test business logic without VSCode dependencies
- **Speed**: Fast execution without complex mocking
- **Coverage**: 100% testable without external dependencies
- **Pattern**: Mock all external dependencies, test pure business logic

### **Extension Package Testing**

- **Integration**: Test VSCode integration through local adapters
- **Realism**: Test actual adapter implementations
- **Coverage**: Test adapter patterns and VSCode API usage
- **Pattern**: Test adapters with VSCode API mocks, validate integration flows

### **Comprehensive Testing Benefits**

- **Deep Validation**: Core packages can be tested without VSCode complexity
- **Fast Execution**: Core tests run in milliseconds
- **Deterministic**: No external state or timing dependencies
- **Regression Prevention**: Independent test suites prevent cross-package regressions

## **Package Structure**

### **Core Package Structure**

```
packages/{feature}/core/
├── src/
│   ├── _interfaces/          # Define interfaces only
│   ├── services/             # Business logic
│   └── index.ts
├── __tests__/
│   └── functional-tests/     # Test business logic in isolation
└── package.json              # No shared dependencies
```

### **Extension Package Structure**

```
packages/{feature}/ext/
├── src/
│   ├── adapters/             # Local VSCode adapters
│   ├── extension.ts          # VSCode integration
│   └── index.ts
├── __tests__/
│   └── functional-tests/     # Test VSCode integration
└── package.json              # Dependencies on core package only
```

## **Migration Guide**

### **From Shared Adapters to Local Adapters**

1. **Core packages**: Change VSCode imports to type imports
2. **Extension packages**: Create local adapters in `src/adapters/`
3. **Remove shared dependencies**: No more `@fux/shared` imports
4. **Update tests**: Test core logic in isolation, test adapters separately

### **Example Migration**

```typescript
// Before (incorrect)
// Core package
import { Uri } from 'vscode' // ❌ Value import

// After (correct)
// Core package
import type { Uri } from 'vscode' // ✅ Type import

// Create local interface
export interface IUri {
    fsPath: string
    scheme: string
    authority: string
    path: string
    query: string
    fragment: string
    toString: () => string
    with: (change: {
        /* ... */
    }) => IUri
}

export interface IUriFactory {
    file: (path: string) => IUri
    parse: (value: string) => IUri
    create: (uri: any) => IUri
    joinPath: (base: IUri, ...paths: string[]) => IUri
}

// Extension package
import * as vscode from 'vscode' // ✅ Value import for adapters
export class UriAdapter implements IUriFactory {
    constructor(private vscodeUri: typeof vscode.Uri) {}

    file(path: string): IUri {
        const uri = this.vscodeUri.file(path)
        return this._toIUri(uri)
    }

    private _toIUri(uri: vscode.Uri): IUri {
        return {
            fsPath: uri.fsPath,
            scheme: uri.scheme,
            // ... other properties
        }
    }
}
```

## **Benefits**

### **Testing Benefits**

- **Core packages**: Test business logic without VSCode complexity
- **Extension packages**: Test VSCode integration patterns
- **Independent validation**: Each package can be tested separately
- **Fast execution**: Core tests run without VSCode context

### **Architectural Benefits**

- **Self-contained**: Each package is independent
- **Clear separation**: Business logic vs VSCode integration
- **Maintainable**: Changes in one package don't affect others
- **Scalable**: Easy to add new packages following the same pattern
