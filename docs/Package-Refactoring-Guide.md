# Package Refactoring Guide

## **Overview**

This guide provides a systematic approach for refactoring existing packages to align with the Project Butler architectural patterns. The goal is to establish consistent core/extension separation, proper testing strategies, and clean dependency management across all packages.

## **End Goals**

### **Architectural Alignment**

- **Clean Core/Extension Separation**: Business logic in core packages, VSCode integration in extension packages
- **Guinea Pig Package Principles**: Core packages self-contained without shared dependencies
- **Direct Service Instantiation**: No DI containers in core packages, direct dependency injection
- **Thin Extension Wrappers**: Extension packages contain only VSCode integration code

### **Testing Strategy Alignment**

- **Mockly Integration**: Proper use of Mockly for VSCode API mocking
- **Functional Test Focus**: Main tests in `__tests__/functional/` directory
- **Real Pattern Validation**: Test actual runtime behavior, not just mock replacements
- **Clean Test Setup**: Global VSCode mocking with proper test isolation

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
    - [ ] Are tests using Mockly properly?
    - [ ] Are tests organized in functional/unit/coverage structure?
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
    │   ├── services/             # Business logic services
    │   └── index.ts              # Public exports
    ├── __tests__/
    │   ├── _setup.ts             # Global test setup
    │   ├── functional/           # Main tests
    │   ├── unit/                 # Isolated tests
    │   └── coverage/             # Coverage-only tests
    ├── package.json              # Core package config
    ├── project.json              # Nx build config
    ├── tsconfig.json             # TypeScript config
    ├── tsconfig.lib.json         # Library build config
    ├── vitest.functional.config.ts
    └── vitest.coverage.config.ts
    ```

2. **Implement Core Services**:
    - Extract business logic from existing code
    - Create service interfaces
    - Implement direct dependency injection
    - Ensure no shared dependencies

3. **Configure Build System**:
    - Set up `@nx/esbuild:esbuild` with `bundle: false`
    - Configure proper TypeScript settings
    - Set up test targets with Mockly integration

### **Phase 3: Extension Package Refactoring**

1. **Refactor Extension Package**:

    ```
    packages/{package}/ext/
    ├── src/
    │   ├── adapters/             # VSCode API adapters
    │   ├── extension.ts          # Main extension entry
    │   └── index.ts              # Public exports
    ├── __tests__/
    │   ├── _setup.ts             # Global VSCode mocking
    │   ├── functional/           # Extension tests
    │   └── coverage/             # Coverage tests
    ├── package.json              # Extension config
    ├── project.json              # Nx build config
    ├── tsconfig.json             # TypeScript config
    ├── .vscodeignore             # VSIX packaging
    ├── vitest.functional.config.ts
    └── vitest.coverage.config.ts
    ```

2. **Implement VSCode Adapters**:
    - Create adapters for all VSCode API usage
    - Implement thin wrapper around core services
    - Use direct service instantiation

3. **Update Extension Entry Point**:
    - Register commands with proper error handling
    - Implement proper activation/deactivation
    - Use adapter pattern for VSCode APIs

### **Phase 4: Testing Implementation**

1. **Set Up Test Infrastructure**:
    - Configure global VSCode mocking
    - Set up Mockly integration
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
    - Update DI container configurations
    - Update TypeScript path mappings

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
- [ ] **Build Configuration**: Extension package build system configured
- [ ] **Test Infrastructure**: Extension package test setup implemented

#### **Testing Implementation**

- [ ] **Mockly Integration**: Proper Mockly setup and usage
- [ ] **Global VSCode Mocking**: Comprehensive VSCode API mocking
- [ ] **Core Tests**: All core services tested with real behavior validation
- [ ] **Extension Tests**: All extension functionality tested
- [ ] **Test Organization**: Tests properly organized in functional/unit/coverage
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
- [ ] **DI Container Updates**: DI containers updated for new architecture
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
4. Use dependency injection to wire components

### **Challenge: Existing DI Container in Core Package**

**Solution**:

1. Remove DI container from core package
2. Use direct service instantiation
3. Pass dependencies as constructor parameters
4. Mock dependencies in tests

### **Challenge: Complex Test Mocking**

**Solution**:

1. Use Mockly for VSCode API mocking
2. Create simple mock objects for dependencies
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

1. Use global VSCode mocking to avoid repeated setup
2. Clear mocks in `beforeEach` blocks
3. Use targeted mocking instead of global approaches
4. Optimize test data and setup

## **Verification Checklist**

### **Architecture Compliance**

- [ ] Core package contains only business logic
- [ ] Extension package is thin VSCode wrapper
- [ ] No DI containers in core package
- [ ] No shared dependencies in core package
- [ ] All VSCode API usage goes through adapters

### **Testing Compliance**

- [ ] Tests use Mockly for VSCode API mocking
- [ ] Tests are organized in functional/unit/coverage structure
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

## **Lessons Learned from Ghost Writer Refactoring**

### **Dependency Management Insights**

**Problem**: Ghost Writer had unnecessary dependencies (`awilix`, `js-yaml`, `@fux/mockly`) in the extension package that violated the thin wrapper principle.

**Solution**:

- **Remove DI Container Dependencies**: Extension packages should not use `awilix` or other DI containers - use direct instantiation instead
- **Remove Unnecessary Dependencies**: Only include dependencies that are actually needed for VSCode integration
- **Follow Project Butler Pattern**: Use the exact same dependency structure as the reference package:
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
      "dependsOn": ["^build"],
      "options": {
        "configFile": "{projectRoot}/vitest.functional.config.ts",
        "reporters": "default"
      }
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

## **Post-Refactoring Maintenance**

### **Ongoing Compliance**

- Monitor for architectural violations
- Ensure new features follow established patterns
- Maintain test coverage and performance
- Update documentation as patterns evolve

### **Pattern Evolution**

- Document new patterns discovered during refactoring
- Update this guide with lessons learned
- Share successful approaches across packages
- Maintain consistency as the codebase evolves

---

> **Note**: This guide should be updated as new patterns are discovered and lessons are learned from each refactoring effort. Always document successful approaches and challenges encountered to improve future refactoring efforts.
