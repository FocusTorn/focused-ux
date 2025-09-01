# Package Refactoring Guide v3

## **Overview**

This guide provides a systematic approach for refactoring existing packages to align with the **confirmed final architecture** patterns. The goal is to establish consistent core/extension separation, proper testing strategies, and clean dependency management across all packages.

## **End Goals**

### **Architectural Alignment**

- **Clean Core/Extension Separation**: Business logic in core packages, VSCode integration in extension packages
- **Guinea Pig Package Principles**: Core packages self-contained without shared dependencies
- **Reasonable Dependencies**: Services have a reasonable number of dependencies based on their functionality, not excessive dependencies like 9+ in the old architecture
- **Focused Service Design**: Each service has a clear, focused responsibility with dependencies that make sense for that responsibility
- **Thin Extension Wrappers**: Extension packages contain only VSCode integration code while preserving all VSCode extension configuration (contributes, activationEvents, etc.)

### **Testing Strategy Alignment**

- **Simple Mock Dependencies**: Use direct mock classes for dependencies
- **Functional Test Focus**: Main tests in `__tests__/functional-tests/` directory
- **Real Pattern Validation**: Test actual runtime behavior, not just mock replacements
- **Clean Test Setup**: Global dependency mocking with proper test isolation

### **Build System Consistency**

- **Nx Configuration**: Standardized `project.json` files with proper targets
- **TypeScript Configuration**: Correct `tsconfig` files for core vs extension packages
- **Dependency Management**: Proper externalization and dependency categorization
- **Package Structure**: Consistent directory organization and file naming

## **Pre-Refactoring Assessment**

### **Current State Analysis**

Before beginning refactoring, assess the current package:

1. **Architecture Assessment**:
    - [ ] Is business logic mixed with VSCode integration?
    - [ ] Are there direct VSCode imports outside adapters?
    - [ ] Is there a DI container in the core package?
    - [ ] Are shared dependencies used in core package?

2. **Testing Assessment**:
    - [ ] Are tests using simple mock dependencies?
    - [ ] Are tests organized in functional-tests/unit/coverage-tests structure?
    - [ ] Are there complex mock hierarchies?
    - [ ] Are tests validating real runtime behavior?

3. **Build Assessment**:
    - [ ] Are `project.json` files following standard patterns?
    - [ ] Are TypeScript configurations correct?
    - [ ] Are dependencies properly externalized?
    - [ ] Are package names and paths consistent?

### **Refactoring Complexity Rating**

Rate the package complexity to plan effort:

- **Low Complexity**: Simple package with minimal VSCode integration
- **Medium Complexity**: Moderate business logic with some VSCode dependencies
- **High Complexity**: Complex package with extensive VSCode integration and business logic

## **Refactoring Process**

### **Phase 1: Architecture Planning**

1. **Create Architecture Plan Documents**:

    ```
    packages/{package}/core/ARCHITECTURE_PLAN.md
    packages/{package}/ext/ARCHITECTURE_PLAN.md
    ```

2. **Define Service Breakdown**:
    - Identify all business logic components
    - Plan service separation and interfaces
    - Define adapter requirements for VSCode APIs

3. **Dependency Analysis**:
    - Map all current dependencies
    - Identify what can be moved to core vs extension
    - Plan for guinea pig package compliance

### **Phase 2: Core Package Creation**

1. **Create Core Package Structure**:

    ```
    packages/{package}/core/
    ├── src/
    │   ├── _interfaces/          # Service interfaces
    │   ├── _config/              # Configuration constants
    │   ├── features/             # Feature-specific services
    │   │   └── feature-name/
    │   │       ├── _interfaces/  # Feature interfaces
    │   │       └── services/     # Feature services
    │   └── index.ts              # Package exports
    ├── __tests__/
    │   ├── _setup.ts             # Global test setup
    │   ├── functional-tests/     # Main tests
│   ├── unit/                 # Isolated tests
│   └── coverage-tests/       # Coverage-only tests
    ├── package.json              # Core package config
    ├── project.json              # Nx build config
    ├── tsconfig.json             # TypeScript config
    ├── tsconfig.lib.json         # Library build config
    ├── vitest.config.ts          # Test config
    └── vitest.coverage.config.ts # Coverage test config
    ```

2. **Implement Core Services**:
    - Extract business logic from existing code
    - Create service interfaces
    - Implement direct dependency injection
    - Ensure no shared dependencies

3. **Configure Build System**:
    - Set up `@nx/esbuild:esbuild` with `bundle: false`
    - Configure proper TypeScript settings
    - Set up test targets with simple mocking

### **Phase 3: Extension Package Refactoring**

1. **Refactor Extension Package**:

    ```
    packages/{package}/ext/
    ├── src/
    │   ├── adapters/             # VSCode API adapters
    │   ├── _interfaces/          # Extension interfaces
    │   ├── _config/              # Extension configuration
    │   ├── services/             # Extension-specific services
    │   ├── extension.ts          # Main extension entry point
    │   └── index.ts              # Package exports
    ├── __tests__/
    │   ├── _setup.ts             # Global test setup
    │   ├── functional-tests/     # Extension tests
│   └── coverage-tests/       # Coverage tests
    ├── assets/                   # Extension assets
    ├── package.json              # Extension config
    ├── project.json              # Nx build config
    ├── tsconfig.json             # TypeScript config
    ├── .vscodeignore             # VSIX packaging
    ├── vitest.config.ts          # Test config
    └── vitest.coverage.config.ts # Coverage test config
    ```

2. **Implement VSCode Adapters**:
    - Create adapters for all VSCode API usage
    - Implement thin wrapper around core services
    - Use direct service instantiation

3. **Update Extension Entry Point**:
    - Register commands with proper error handling
    - Implement proper activation/deactivation
    - Use adapter pattern for VSCode APIs

4. **Preserve VSCode Extension Configuration**:
    - **CRITICAL**: Maintain all `contributes` sections in package.json (commands, views, menus, configuration)
    - **CRITICAL**: Preserve all `activationEvents` and extension metadata
    - **CRITICAL**: Keep all VSCode extension-specific configuration intact
    - Only remove business logic dependencies, not VSCode extension configuration

### **Phase 4: Testing Implementation**

1. **Set Up Test Infrastructure**:
    - Configure global dependency mocking
    - Set up simple mock classes
    - Create test helper functions

2. **Implement Core Tests**:
    - Test all business logic services
    - Use direct dependency injection with mocks
    - Validate real runtime behavior

3. **Implement Extension Tests**:
    - Test command registration and execution
    - Test adapter implementations
    - Test error handling and user feedback

### **Phase 5: Build System Configuration**

1. **Update Nx Configuration**:
    - Configure proper build targets
    - Set up test targets with coverage
    - Configure package targets for VSIX creation

2. **Update TypeScript Configuration**:
    - Core package: `tsconfig.lib.json` with declarations
    - Extension package: `tsconfig.json` with CommonJS
    - Proper path mappings and references

3. **Update Package Configuration**:
    - Correct package names and dependencies
    - Proper externalization of dependencies
    - Correct module formats

### **Phase 6: Integration and Verification**

1. **Update All Consumers**:
    - Update imports in dependent packages
    - Update TypeScript path mappings
    - Update documentation

2. **Update Documentation**:
    - Update README files
    - Update test documentation
    - Update architectural documentation

3. **Update Aliases and Scripts**:
    - Update CLI aliases
    - Update build scripts
    - Update CI/CD configurations

## **High-Level TODO Template**

### **Package: {Package Name}**

#### **Pre-Refactoring**

- [ ] **Assessment Complete**: Current state analysis documented
- [ ] **Architecture Plan**: Core and extension architecture plans created
- [ ] **Dependency Analysis**: All dependencies mapped and categorized
- [ ] **Complexity Rating**: Refactoring complexity assessed

#### **Core Package Creation**

- [ ] **Directory Structure**: Core package directory structure created
- [ ] **Service Interfaces**: All service interfaces defined
- [ ] **Business Logic Extraction**: Core services implemented
- [ ] **Direct Instantiation**: Services use direct dependency injection
- [ ] **No Shared Dependencies**: Core package is self-contained
- [ ] **Build Configuration**: Core package build system configured
- [ ] **Test Infrastructure**: Core package test setup implemented

#### **Extension Package Refactoring**

- [ ] **Adapter Implementation**: VSCode API adapters created
- [ ] **Thin Wrapper**: Extension acts as thin wrapper around core
- [ ] **Command Registration**: All commands properly registered
- [ ] **Error Handling**: Proper error handling and user feedback
- [ ] **VSCode Extension Configuration Preserved**: All contributes, activationEvents, and extension metadata maintained
- [ ] **Build Configuration**: Extension package build system configured
- [ ] **Test Infrastructure**: Extension package test setup implemented

#### **Source Code Refactoring (CRITICAL)**

- [ ] **Remove Shared Dependencies**: Eliminate all `@fux/shared` imports from core package
- [ ] **Remove DI Container**: Eliminate all `awilix` usage from extension package
- [ ] **Direct Service Instantiation**: Replace DI container with direct service instantiation
- [ ] **Local Adapter Implementation**: Create local adapters instead of using shared ones
- [ ] **Business Logic Extraction**: Move all business logic from extension to core package
- [ ] **Interface Alignment**: Ensure all interfaces align with confirmed architecture
- [ ] **Import Cleanup**: Remove all unnecessary imports and dependencies
- [ ] **Code Validation**: Verify source code follows guinea pig package principles

#### **Testing Implementation**

- [ ] **Simple Mock Dependencies**: Direct mock classes for dependencies
- [ ] **Global Dependency Mocking**: Comprehensive dependency mocking
- [ ] **Core Tests**: All core services tested with real behavior validation
- [ ] **Extension Tests**: All extension functionality tested
- [ ] **Test Organization**: Tests properly organized in functional-tests/unit/coverage-tests
- [ ] **Test Performance**: Tests run efficiently without performance issues

#### **Build System Configuration**

- [ ] **Nx Targets**: All build, test, and package targets configured
- [ ] **TypeScript Configuration**: Proper TypeScript settings for core and extension
- [ ] **Dependency Management**: Dependencies properly externalized and categorized
- [ ] **Package Configuration**: Package names, versions, and formats correct
- [ ] **VSIX Packaging**: Extension packages correctly for VSIX creation

#### **Integration and Verification**

- [ ] **Consumer Updates**: All dependent packages updated
- [ ] **Import Updates**: All imports updated to new package structure
- [ ] **Path Mapping Updates**: TypeScript path mappings updated
- [ ] **Documentation Updates**: All documentation updated
- [ ] **Alias Updates**: CLI aliases updated for new package structure

#### **Quality Assurance**

- [ ] **Build Verification**: All packages build successfully
- [ ] **Test Verification**: All tests pass with proper coverage
- [ ] **Type Check Verification**: All TypeScript checks pass
- [ ] **Lint Verification**: All linting checks pass
- [ ] **Integration Testing**: End-to-end functionality verified
- [ ] **Performance Testing**: No performance regressions

#### **Documentation and Cleanup**

- [ ] **Actions Log Entry**: Refactoring documented in Actions Log
- [ ] **Architecture Documentation**: New architecture documented
- [ ] **Testing Strategy**: Testing approach documented
- [ ] **Migration Guide**: Guide for migrating from old to new structure
- [ ] **Cleanup**: Remove old files and configurations
- [ ] **Verification**: Final verification of all changes

## **Common Challenges and Solutions**

### **Challenge: Complex Business Logic Mixed with VSCode Integration**

**Solution**:

1. Identify pure business logic components
2. Extract to core services with clear interfaces
3. Create VSCode adapters for all API usage
4. **BREAK DOWN INTO SMALLER SERVICES** where appropriate, with reasonable dependencies
5. Use direct dependency injection with reasonable dependencies

### **Challenge: Existing DI Container in Core Package**

**Solution**:

1. Remove DI container from core package
2. **REDUCE DEPENDENCIES TO REASONABLE LEVEL** (not excessive 9+)
3. Use direct service instantiation with reasonable dependencies
4. Pass dependencies as constructor parameters
5. Mock dependencies in tests

### **Challenge: Complex Test Mocking**

**Solution**:

1. Use simple mock classes for dependencies
2. Create mock objects for dependencies
3. Test real runtime behavior, not just mocks
4. Use integration tests for complex scenarios

### **Challenge: Dependency Conflicts**

**Solution**:

1. Analyze all dependencies and their purposes
2. Move build dependencies to `devDependencies`
3. Externalize runtime dependencies properly
4. Ensure core package has minimal dependencies

### **Challenge: Test Performance Issues**

**Solution**:

1. Use global dependency mocking to avoid repeated setup
2. Clear mocks in `beforeEach` blocks
3. Use targeted mocking instead of global approaches
4. Optimize test data and setup

### **Challenge: Preserving VSCode Extension Configuration**

**Problem**: When refactoring extension packages, it's easy to accidentally remove essential VSCode extension configuration.

**Solution**:

1. **CRITICAL**: Never remove `contributes` sections from extension package.json
2. **CRITICAL**: Preserve all `activationEvents`, `engines`, and extension metadata
3. **CRITICAL**: Keep all VSCode extension-specific configuration intact
4. Only remove business logic dependencies (`awilix`, `@fux/shared`, etc.)
5. Maintain all commands, views, menus, and configuration sections
6. Verify extension still activates and registers all commands after refactoring

**Common Mistake**: Removing VSCode extension configuration while trying to make the package "thinner"

## **Verification Checklist**

### **Architecture Compliance**

- [ ] Core package contains only business logic
- [ ] Extension package is thin VSCode wrapper
- [ ] No DI containers in core package
- [ ] No shared dependencies in core package
- [ ] All VSCode API usage goes through adapters
- [ ] VSCode extension configuration preserved (contributes, activationEvents, etc.)

### **Testing Compliance**

- [ ] Tests use simple mock classes for dependencies
- [ ] Tests are organized in functional-tests/unit/coverage-tests structure
- [ ] Tests validate real runtime behavior
- [ ] Tests have proper isolation and cleanup
- [ ] Test performance is acceptable

### **Build System Compliance**

- [ ] All Nx targets configured correctly
- [ ] TypeScript configurations are appropriate
- [ ] Dependencies are properly externalized
- [ ] Package configurations are correct
- [ ] VSIX packaging works correctly

### **Integration Compliance**

- [ ] All consumers updated
- [ ] All imports updated
- [ ] All path mappings updated
- [ ] All documentation updated
- [ ] All aliases updated

## **Success Metrics**

### **Architectural Metrics**

- Core package has zero shared dependencies
- Extension package is under 50KB (excluding assets)
- All VSCode API usage goes through adapters
- No DI containers in core packages

### **Testing Metrics**

- 100% test coverage for core business logic
- Tests run in under 30 seconds
- No test flakiness or interference
- All tests validate real behavior

### **Build Metrics**

- All packages build successfully
- All TypeScript checks pass
- All linting checks pass
- VSIX packages are properly sized

### **Integration Metrics**

- All dependent packages work correctly
- No import or path resolution errors
- All CLI aliases work correctly
- End-to-end functionality verified

## **Source Code Refactoring (CRITICAL STEP)**

### **Why Source Code Refactoring is Essential**

**⚠️ CRITICAL WARNING**: The infrastructure setup (test directories, build configurations, package.json updates) is **NOT ENOUGH**. The actual source code must be refactored to align with the confirmed architecture.

**⚠️ CRITICAL WARNING**: Simply replacing DI containers with direct instantiation is **NOT ENOUGH**. Services must be redesigned to have reasonable dependencies based on their functionality.

**⚠️ CRITICAL WARNING**: Completing interface refactoring is **NOT ENOUGH**. All methods in service interfaces must be implemented, not just the constructor changes.

**⚠️ CRITICAL WARNING**: VSCode API decoupling is **ESSENTIAL**. Core packages must use local interfaces (e.g., `IUri`, `IUriFactory`) instead of direct VSCode value imports and API calls.

**Common Mistake**: Updating configuration files and test infrastructure without refactoring the actual source code, resulting in packages that still violate guinea pig package principles.

**Common Mistake**: Replacing DI containers with direct instantiation but keeping excessive dependencies (9+) that don't align with the service's core responsibility.

**Common Mistake**: Creating refactored service files but not completing the implementation - missing method implementations can cause runtime errors even when TypeScript checks pass.

**Common Mistake**: Using VSCode value imports and direct API calls in core packages instead of creating local interfaces for complete decoupling.

### **What Must Be Refactored in Source Code**

#### **Dependency Principle: Reasonable vs Excessive**

The goal is not to arbitrarily limit dependencies, but to ensure they make sense for the service's responsibility:

- **Reasonable Dependencies**: Dependencies that directly support the service's core functionality
- **Excessive Dependencies**: Dependencies that are not essential to the service's primary responsibility
- **Complex Services**: May legitimately need more dependencies, but should still be focused and cohesive

**Examples**:

- A file processing service might need 4-5 dependencies (file system, path utils, config, logging, validation)
- A simple utility service should have 1-3 dependencies
- A complex orchestration service might need 6-8 dependencies if they're all essential

The key is that each dependency should have a clear, justifiable purpose for that specific service.

#### **Core Package Source Code Changes**

1. **Remove All Shared Dependencies**:

    ```typescript
    // ❌ BEFORE - Violates guinea pig package principle
    import type { IWindow, ICommands, IWorkspace } from '@fux/shared'
    import { UriAdapter } from '@fux/shared'

    // ✅ AFTER - Self-contained core package
    import type { IWindow, ICommands, IWorkspace } from './_interfaces/IWindow.js'
    // Create local adapter implementations
    ```

2. **VSCode API Decoupling with Local Interfaces**:

    ```typescript
    // ❌ BEFORE - Direct VSCode value usage in core package
    import { Uri } from 'vscode' // ❌ Value import

    export class IconActionsService {
        constructor(private readonly fileSystem: IFileSystem) {}

        async processFile(path: string) {
            const uri = Uri.file(path) // ❌ Direct VSCode API call
            // ...
        }
    }

    // ✅ AFTER - Local interface implementation
    import type { Uri } from 'vscode' // ✅ Type import only

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

    export class IconActionsService {
        constructor(
            private readonly fileSystem: IFileSystem,
            private readonly uriFactory: IUriFactory
        ) {}

        async processFile(path: string) {
            const uri = this.uriFactory.file(path) // ✅ Local interface usage
            // ...
        }
    }
    ```

3. **Reasonable Dependencies Based on Functionality**:

    ```typescript
    // ❌ BEFORE - Excessive dependencies (9+) for a single service
    constructor(
        private readonly context: IContext,
        private readonly window: IWindow,
        private readonly commands: ICommands,
        private readonly path: IPath,
        private readonly commonUtils: ICommonUtils,
        private readonly fileSystem: IFileSystem,
        private readonly iconThemeGenerator: IIconThemeGeneratorService,
        private readonly configService: IConfigurationService,
        private readonly iconPicker: IIconPickerService,
    ) {}

    // ✅ AFTER - Reasonable dependencies for the service's responsibility
    constructor(
        private readonly fileSystem: IFileSystemAdapter,
        private readonly path: IPathAdapter,
        private readonly configService: IConfigurationService, // If needed for this service
    ) {}
    ```

4. **Direct Service Instantiation**:

    ```typescript
    // ❌ BEFORE - DI container usage
    const service = container.resolve('myService')

    // ✅ AFTER - Direct instantiation
    const service = new MyService(dependency1, dependency2)
    ```

5. **Local Interface Definitions**:
    ```typescript
    // ✅ Create local interfaces in core package
    export interface IWindow {
        showInformationMessage(message: string): Promise<string | undefined>
        showErrorMessage(message: string): Promise<string | undefined>
    }
    ```

#### **Extension Package Source Code Changes**

1. **Remove DI Container**:

    ```typescript
    // ❌ BEFORE - awilix usage
    import { createContainer, asClass } from 'awilix'
    const container = createContainer()
    container.register({ service: asClass(MyService) })

    // ✅ AFTER - Direct instantiation
    const service = new MyService(dependency1, dependency2)
    ```

2. **Thin Wrapper Implementation**:

    ```typescript
    // ❌ BEFORE - Business logic in extension
    export class ExtensionService {
        async processData() {
            // Complex business logic here
        }
    }

    // ✅ AFTER - Thin wrapper around core
    export async function activate(context: ExtensionContext) {
        const coreService = new CoreService(mockDependencies)
        const command = commands.registerCommand('myCommand', () => {
            coreService.processData()
        })
    }
    ```

3. **Local Adapter Implementation**:

    ```typescript
    // ✅ Create local adapters instead of using shared ones
    class LocalWindowAdapter implements IWindow {
        constructor(private vscodeWindow: typeof vscode.window) {}

        async showInformationMessage(message: string) {
            return this.vscodeWindow.showInformationMessage(message)
        }
    }
    ```

### **Source Code Refactoring Checklist**

- [ ] **Core Package**:
    - [ ] Remove all `@fux/shared` imports
    - [ ] Create local interface definitions
    - [ ] Implement local adapter classes
    - [ ] **REDUCE DEPENDENCIES TO REASONABLE LEVEL** (not excessive 9+)
    - [ ] Use direct service instantiation
    - [ ] Remove any DI container usage
    - [ ] Ensure self-contained business logic
    - [ ] **BREAK DOWN COMPLEX SERVICES** into smaller, focused services where appropriate
    - [ ] **COMPLETE ALL METHOD IMPLEMENTATIONS** - ensure no methods are missing from interfaces

- [ ] **Extension Package**:
    - [ ] Remove all `awilix` imports and usage
    - [ ] Remove all `@fux/shared` imports
    - [ ] Implement direct service instantiation
    - [ ] Create local VSCode adapters
    - [ ] Move all business logic to core package
    - [ ] Ensure thin wrapper architecture

- [ ] **Validation**:
    - [ ] Core package builds without shared dependencies
    - [ ] Extension package builds without DI container
    - [ ] All imports are local or external only
    - [ ] Business logic is properly separated
    - [ ] **SERVICES HAVE REASONABLE DEPENDENCIES** (not excessive 9+)
- [ ] **ALL SERVICE METHODS ARE IMPLEMENTED** (no missing implementations)
- [ ] **VSCode API DECOUPLING COMPLETE** (local interfaces replace direct VSCode value imports and API calls)
- [ ] Tests pass with new architecture
- [ ] **EXTENSION CONSTRUCTOR PARAMETERS ARE CORRECT** (proper dependency order and types)

## **Lessons Learned**

### **Critical Implementation Lessons**

**Problem**: During refactoring, several critical implementation issues were discovered that went beyond the initial architecture setup.

**Key Lessons Learned**:

1. **Missing Method Implementations**:
    - **Issue**: Service interfaces were refactored but not all methods were implemented in the concrete classes
    - **Symptom**: TypeScript compilation passed but runtime errors occurred when calling missing methods
    - **Solution**: Always verify that all interface methods are implemented in concrete service classes
    - **Prevention**: Add thorough functional tests that exercise all service methods

2. **Constructor Parameter Mismatches**:
    - **Issue**: Extension package had incorrect constructor parameter order/types when instantiating services
    - **Symptom**: TypeScript compilation failed with parameter type mismatches
    - **Solution**: Carefully verify constructor parameter order and types when creating service instances
    - **Prevention**: Use TypeScript strict mode and proper type checking

3. **Missing Dependency Chain Setup**:
    - **Issue**: Refactored services required additional dependencies that weren't created in the extension
    - **Symptom**: Runtime errors due to missing dependency services
    - **Solution**: Create a complete dependency chain when refactoring service constructors
    - **Prevention**: Map out all dependencies before refactoring and ensure all are properly instantiated

4. **Test Infrastructure Not Reflecting Real Usage**:
    - **Issue**: Tests were passing but not validating actual runtime behavior
    - **Symptom**: Tests showed green but extension failed when actually running
    - **Solution**: Write functional tests that mirror real extension usage patterns
    - **Prevention**: Always test actual command registration and service method calls

**Refactoring Validation Strategy**:

- [ ] **Build Verification**: Both core and extension packages build successfully
- [ ] **Type Checking**: All TypeScript errors resolved
- [ ] **Method Implementation**: All interface methods have concrete implementations
- [ ] **Dependency Chain**: All required dependencies are properly instantiated
- [ ] **Functional Testing**: Tests exercise real runtime behavior
- [ ] **Extension Integration**: Extension properly registers commands and activates

### **Dependency Management Insights**

**Problem**: Packages had unnecessary dependencies that violated architectural principles.

**Solution**:

- **Remove DI Container Dependencies**: Extension packages should not use `awilix` or other DI containers - use direct instantiation instead
- **Remove Unnecessary Dependencies**: Only include dependencies that are actually needed for VSCode integration
- **Follow Established Patterns**: Use the exact same dependency structure as working packages:
    ```json
    "dependencies": {
      "@fux/{package}-core": "workspace:*"
    },
    "devDependencies": {
      "@types/node": "^24.0.10",
      "@types/vscode": "^1.99.3",
      "typescript": "^5.8.3",
      "vitest": "^3.2.4",
      "@vitest/coverage-v8": "^3.2.4"
    }
    ```

### **Test Configuration Insights**

**Problem**: Extension package test configuration was using `extends: "vite:test"` which caused "Cannot find configuration for task" errors.

**Solution**:

- **Use Direct Executor Configuration**: Instead of extending targets, use direct executor configuration:
    ```json
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": ["^build"]
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": [
        {
          "dependencies": true,
          "target": "test",
          "params": "forward"
        }
      ]
    }
    ```
- **Remove Mockly Dependencies**: Extension tests should not depend on `@fux/mockly` - use simple mocks instead
- **Simple Test Setup**: Use basic test setup without complex mocking libraries

### **Build Configuration Insights**

**Problem**: Build configuration had unnecessary external dependencies that were not actually needed.

**Solution**:

- **Minimal External Dependencies**: Only externalize what's actually needed:
    ```json
    "external": ["vscode"]
    ```
- **Remove Build Dependencies**: Don't externalize build-time dependencies like `typescript`, `awilix`, `js-yaml`

### **Type Import vs Value Import Insights**

**Problem**: Position adapter was using `import type` but trying to instantiate the class.

**Solution**:

- **Use Value Imports for Instantiation**: When you need to create instances, use regular imports:
    ```typescript
    import { Position as VSCodePosition } from 'vscode' // For instantiation
    ```
- **Use Type Imports for Types Only**: Use `import type` only when you need the type, not the value:
    ```typescript
    import type { ExtensionContext } from 'vscode' // For types only
    ```

### **Test Mocking Strategy Insights**

**Problem**: Extension tests were using complex Mockly setup that wasn't necessary.

**Solution**:

- **Simple Mock Objects**: Use simple mock objects for extension tests:
    ```typescript
    mockContext = {
        subscriptions: [],
        globalState: {
            get: vi.fn(),
            update: vi.fn(),
        },
        workspaceState: {
            get: vi.fn(),
            update: vi.fn(),
        },
    }
    ```
- **No Mockly in Extension Tests**: Extension tests don't need Mockly - use Vitest's built-in mocking capabilities

### **Architecture Validation Insights**

**Problem**: Structure auditor was complaining about adapters being outside shared package, but this was incorrect for the new architecture.

**Solution**:

- **Ignore Outdated Auditor Rules**: The structure auditor may have outdated rules that don't match the new architecture
- **Focus on Functional Validation**: Instead of relying on static analysis, validate that the architecture works functionally
- **Test Real Behavior**: Ensure that the refactored package actually works correctly rather than just passing static checks

## **Test Configuration Migration Patterns**

### **Double Execution Elimination**

**Problem**: Test commands were running twice due to conflicting configurations between global `targetDefaults` and PAE script injection.

**Solution**:

- **Pattern Replication Protocol**: When a working solution exists, replicate it exactly rather than trying to improve it
- **Remove Global Conflicts**: Remove `configFile` options from `nx.json` `targetDefaults` to allow PAE script to handle config injection
- **Use Proven Executor**: Use `@nx/vite:test` executor with proper configuration instead of complex `nx:run-commands`
- **Single Execution Verification**: Always use `-s -stream` flags to verify no duplicate test runs before considering a solution complete

### **Test Configuration Migration Steps**

1. **Copy Working Pattern**: Use the exact `project.json` test target configuration from working packages:

    ```json
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": ["^build"]
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "dependsOn": [
        {
          "dependencies": true,
          "target": "test",
          "params": "forward"
        }
      ]
    }
    ```

2. **Remove Extends**: Replace `extends: "test"` and `extends: "test:full"` with explicit executor configuration

3. **Verify Single Execution**: Test all commands with `-s -stream` flags:
    - `{alias} t -s -stream` - Should show single execution
    - `{alias} tf -s -stream` - Should show single execution for each package in dependency chain

4. **PAE Script Integration**: Ensure no conflicting `configFile` options in local packages to allow PAE script to handle config injection

### **Configuration Hierarchy Understanding**

**Key Principle**: Global configurations can conflict with local overrides. The hierarchy is:

1. Global `targetDefaults` in `nx.json`
2. Local package `project.json` targets
3. PAE script dynamic injection

**Best Practice**: Remove global `targetDefaults` for test targets and let local packages handle their own configuration with PAE script support.

### **Anti-Patterns for Test Configuration**

- **🚫 Over-Engineering**: Don't use complex executors when simpler ones achieve the same result
- **🚫 Ignoring Working Patterns**: Don't attempt to improve working test configurations without first understanding why they work
- **🚫 Incomplete Verification**: Don't assume test configuration is complete without explicit single-execution verification
- **🚫 Global Configuration Conflicts**: Don't have conflicting `configFile` options in both global `targetDefaults` and local package configurations

## **Post-Refactoring Maintenance**

### **Ongoing Compliance**

- Monitor for architectural violations
- Ensure new features follow established patterns
- Maintain test coverage and performance
- Update documentation as patterns evolve

### **Known Issues**

#### **EventEmitter Warning During Packaging**

**Issue**: `MaxListenersExceededWarning` appears during VSIX packaging showing "11 exit listeners added to [process]".

**Root Cause**: **Nx's `run-commands` executor** adds multiple exit listeners for task management, cleanup, and graceful shutdown handling. The warning comes from Nx's `RunningNodeProcess.addListeners` method, not from `vsce` or our packaging script.

**Why 11 Listeners**: Complex build pipelines with multiple task dependencies (build, test, package) cause Nx to accumulate exit listeners for:

- Process cleanup handlers for each dependent task
- Signal handlers for graceful shutdown
- Resource cleanup for temporary files/processes
- Cache management listeners
- Progress reporting handlers

**Impact**: None - packaging completes successfully and produces valid VSIX files.

**Status**: Known characteristic of Nx's task execution system for complex build pipelines. This is normal Nx behavior, not a bug.

**Technical Details**: The warning originates from Nx's `SeriallyRunningTasks` and `RunningNodeProcess` classes in `running-tasks.js`, which manage child process execution and cleanup.

### **Pattern Evolution**

- Document new patterns discovered during refactoring
- Update this guide with lessons learned
- Share successful approaches across packages
- Maintain consistency as the codebase evolves

---

> **Note**: This guide should be updated as new patterns are discovered and lessons are learned from each refactoring effort. Always document successful approaches and challenges encountered to improve future refactoring efforts.
