# Ghost Writer Extension Package Architecture Plan

## **Overview**

The Ghost Writer extension package is a thin VSCode wrapper around the core package. It contains only VSCode integration code and uses direct service instantiation without dependency injection containers.

## **Architecture Principles**

### **Thin Wrapper Pattern**
- **Minimal VSCode Integration**: Only VSCode-specific code
- **Direct Service Instantiation**: No DI containers
- **Adapter Pattern**: All VSCode API usage through adapters
- **Error Handling**: Proper error handling and user feedback

### **Command Registration**
- **Command Handlers**: Simple async functions that use core services
- **Error Boundaries**: Proper error handling for each command
- **User Feedback**: Appropriate user messages for success/failure

## **Package Structure**

```
src/
├── adapters/             # VSCode API adapters
├── _interfaces/          # Extension-specific interfaces
├── _config/              # Extension constants
├── extension.ts          # Main extension entry point
└── index.ts              # Public exports
```

## **Service Architecture**

### **Core Service Integration**
- **Direct Instantiation**: Create core services directly
- **Dependency Injection**: Pass VSCode adapters as dependencies
- **No DI Container**: Avoid dependency injection containers

### **VSCode Adapters**
- **StorageAdapter**: VSCode storage API adapter
- **WindowAdapter**: VSCode window API adapter
- **WorkspaceAdapter**: VSCode workspace API adapter
- **CommandsAdapter**: VSCode commands API adapter

## **Command Handlers**

### **1. Store Code Fragment**
- **Purpose**: Store selected text in clipboard
- **Dependencies**: ClipboardService, WindowAdapter
- **Flow**: Get selection → Store → Show feedback

### **2. Insert Import Statement**
- **Purpose**: Generate and insert import statement
- **Dependencies**: ClipboardService, ImportGeneratorService, WindowAdapter
- **Flow**: Retrieve fragment → Generate import → Insert → Clear

### **3. Log Selected Variable**
- **Purpose**: Generate console.log for selected variable
- **Dependencies**: ConsoleLoggerService, WindowAdapter, WorkspaceAdapter
- **Flow**: Get selection → Generate log → Insert → Show feedback

## **Dependency Management**

### **External Dependencies**
- **@fux/ghost-writer-core**: Core business logic
- **vscode**: VSCode extension API
- **typescript**: Moved to devDependencies

### **Removed Dependencies**
- **@fux/shared**: Use dependency injection instead
- **awilix**: No DI containers in extension
- **js-yaml**: Move to core if needed

## **Testing Strategy**

### **Test Organization**
```
__tests__/
├── _setup.ts             # Global VSCode mocking
├── functional/           # Extension integration tests
└── coverage/             # Coverage tests
```

### **Testing Approach**
- **Mockly Integration**: Use Mockly for VSCode API mocking
- **Command Testing**: Test command registration and execution
- **Adapter Testing**: Test VSCode adapter implementations
- **Error Handling**: Test error scenarios and user feedback

## **Build Configuration**

### **Nx Configuration**
- **Executor**: `@nx/esbuild:esbuild` with `bundle: true`
- **Output**: CommonJS format for VSCode compatibility
- **Assets**: Include extension assets
- **External**: Externalize VSCode and core dependencies

### **VSIX Packaging**
- **Package Target**: Create VSIX package
- **Assets**: Include extension assets and metadata
- **Dependencies**: Bundle only necessary dependencies

## **Migration Strategy**

1. **Remove DI Container**: Replace awilix with direct instantiation
2. **Create Adapters**: Move VSCode API usage to adapters
3. **Update Dependencies**: Remove shared dependencies
4. **Fix Build Configuration**: Correct TypeScript and Nx settings
5. **Implement Tests**: Create comprehensive test suite

## **Extension Entry Point**

### **Activation**
```typescript
export function activate(context: ExtensionContext): void {
  // Create services directly
  const storageAdapter = new StorageAdapter(context.globalState)
  const clipboardService = new ClipboardService(storageAdapter)
  
  // Register commands
  const disposables = [
    commands.registerCommand('command.id', handler)
  ]
  
  context.subscriptions.push(...disposables)
}
```

### **Deactivation**
```typescript
export function deactivate(): void {
  // Cleanup if needed
}
```

## **Error Handling**

### **Command Error Handling**
- **Try-Catch Blocks**: Wrap all command handlers
- **User Feedback**: Show appropriate error messages
- **Logging**: Log errors for debugging

### **Service Error Handling**
- **Graceful Degradation**: Handle service failures gracefully
- **Fallback Behavior**: Provide fallback when services fail
- **User Communication**: Inform users of issues

## **Success Criteria**

- [ ] Extension is thin VSCode wrapper
- [ ] No DI containers in extension package
- [ ] All VSCode API usage through adapters
- [ ] Proper error handling and user feedback
- [ ] All tests pass with proper coverage
- [ ] VSIX packaging works correctly
- [ ] No shared dependencies
- [ ] Direct service instantiation 