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
    - **Dependencies**: TypeScript compiler API (runtime dependency)
    - **Responsibilities**: Generate log statements with context information

### **Service Interfaces**

All services implement interfaces defined in `_interfaces/` directory:

- `IClipboardService`
- `IImportGeneratorService`
- `IConsoleLoggerService`
- `IStorageService`
- `IPathUtilsService`
- `ICommonUtilsService`

### **Dependency Injection Strategy**

- **Direct Instantiation**: All services use constructor injection
- **No DI Container**: Core package does not use dependency injection containers
- **Interface-Based**: All dependencies are injected via interfaces
- **Mockable**: All dependencies can be easily mocked for testing

## **Package Structure**

```
src/
├── _interfaces/           # All service interfaces centralized
├── _config/              # Constants and configuration
├── services/             # All services in flat structure
└── index.ts              # Public exports
```

## **Dependency Management**

### **External Dependencies**

- **typescript**: Runtime dependency (used by ConsoleLoggerService)
- **@types/node**: Dev dependency for Node.js types

### **Internal Dependencies**

- All dependencies injected via interfaces
- No direct imports of external services
- Pure business logic with no VSCode dependencies

## **Testing Strategy**

### **Test Organization**

```
__tests__/
├── _setup.ts             # Global test setup
├── functional-tests/      # Main integration tests
├── isolated-tests/       # Unit tests
└── coverage-tests/       # Coverage-only tests
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
- **External**: VSCode and TypeScript dependencies externalized

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
- ✅ **Flat Structure**: Simple, maintainable organization
- ✅ **Standard Exports**: Clean barrel exports like PBC

## **Migration Strategy**

1. ✅ **Centralize Interfaces**: All interfaces in `_interfaces/` directory
2. ✅ **Flatten Services**: All services in `services/` directory
3. ✅ **Update Exports**: Simple barrel exports like PBC
4. ✅ **Fix Package.json**: Standard ESM configuration
5. ✅ **Update Build Config**: Proper externalization
6. ✅ **Update Tests**: Import paths updated for new structure

## **Success Criteria**

- ✅ Core package has zero shared dependencies
- ✅ All services use direct dependency injection
- ✅ All interfaces centralized in `_interfaces/`
- ✅ All services in flat `services/` structure
- ✅ Simple barrel exports like PBC
- ✅ Standard package.json configuration
- ✅ Proper build externalization
- ✅ Tests updated for new structure
- ✅ Package is self-contained and testable
