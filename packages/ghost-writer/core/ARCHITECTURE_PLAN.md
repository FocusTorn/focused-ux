# Ghost Writer Core Package Architecture Plan

## **Overview**

The Ghost Writer core package contains pure business logic for code generation and manipulation features. It is designed to be completely self-contained without any VSCode dependencies or shared package dependencies.

## **Service Architecture**

### **Core Services**

1. **ClipboardService**
   - **Purpose**: Manages temporary storage of code fragments
   - **Dependencies**: IStorageService (injected)
   - **Responsibilities**: Store, retrieve, and clear code fragments

2. **ImportGeneratorService**
   - **Purpose**: Generates import statements based on code fragments
   - **Dependencies**: IPathUtilsService, ICommonUtilsService (injected)
   - **Responsibilities**: Analyze code fragments and generate appropriate import statements

3. **ConsoleLoggerService**
   - **Purpose**: Generates console.log statements for debugging
   - **Dependencies**: None (pure business logic)
   - **Responsibilities**: Generate log statements with context information

### **Service Interfaces**

All services implement interfaces defined in `_interfaces/` directory:
- `IClipboardService`
- `IImportGeneratorService`
- `IConsoleLoggerService`

### **Dependency Injection Strategy**

- **Direct Instantiation**: All services use constructor injection
- **No DI Container**: Core package does not use dependency injection containers
- **Interface-Based**: All dependencies are injected via interfaces
- **Mockable**: All dependencies can be easily mocked for testing

## **Package Structure**

```
src/
├── _interfaces/           # Service interfaces
├── _config/              # Constants and configuration
├── features/             # Feature-based organization
│   ├── clipboard/
│   │   ├── _interfaces/
│   │   └── services/
│   ├── import-generator/
│   │   ├── _interfaces/
│   │   └── services/
│   └── console-logger/
│       ├── _interfaces/
│       └── services/
└── index.ts              # Public exports
```

## **Dependency Management**

### **External Dependencies**
- **typescript**: Moved to devDependencies (build-time only)
- **@fux/shared**: Removed - core package should be self-contained

### **Internal Dependencies**
- All dependencies injected via interfaces
- No direct imports of external services
- Pure business logic with no VSCode dependencies

## **Testing Strategy**

### **Test Organization**
```
__tests__/
├── _setup.ts             # Global test setup
├── functional/           # Main integration tests
├── unit/                 # Isolated service tests
└── coverage/             # Coverage-only tests
```

### **Testing Approach**
- **Mockly Integration**: Use Mockly for any VSCode API mocking
- **Direct Instantiation**: Test services with direct dependency injection
- **Real Behavior Validation**: Test actual runtime behavior, not just mocks
- **Interface Testing**: Test all service interfaces thoroughly

## **Build Configuration**

### **Nx Configuration**
- **Executor**: `@nx/esbuild:esbuild` with `bundle: false`
- **Output**: ESM format with declarations
- **External**: All VSCode and shared dependencies externalized

### **TypeScript Configuration**
- **tsconfig.json**: Base configuration
- **tsconfig.lib.json**: Library build configuration
- **Project References**: Proper TypeScript project references

## **Guinea Pig Package Compliance**

- ✅ **Self-Contained**: No shared dependencies
- ✅ **Pure Business Logic**: No VSCode integration
- ✅ **Direct Instantiation**: No DI containers
- ✅ **Interface-Based**: All dependencies via interfaces
- ✅ **Testable**: Easy to test with mocks

## **Migration Strategy**

1. **Remove Shared Dependencies**: Move all shared functionality to adapters
2. **Create Service Interfaces**: Define clear interfaces for all dependencies
3. **Implement Direct Injection**: Replace DI container with direct instantiation
4. **Update Tests**: Create comprehensive test suite with Mockly
5. **Fix Build Configuration**: Correct TypeScript and Nx configurations

## **Success Criteria**

- [ ] Core package has zero shared dependencies
- [ ] All services use direct dependency injection
- [ ] All tests pass with proper coverage
- [ ] Build system works correctly
- [ ] Package is self-contained and testable 