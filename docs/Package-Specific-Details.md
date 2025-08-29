# Package-Specific Details

## **Overview**

This document serves as the **source of truth** for package-specific variations, overrides, and architectural patterns in the FocusedUX monorepo. It distinguishes between intentional architectural patterns and actual deviations that need correction.

## **Standard Patterns (All Packages)**

### **Extension Dependencies**

- **Standard**: Extension depends on core package + `@fux/vscode-test-cli-config` (when integration testing is implemented)
- **Fallback**: Extension depends only on core package (when integration testing is not implemented)
- **Rationale**: Integration testing framework for VS Code extensions is optional and depends on testing requirements

### **Build Externalization**

- **Standard**: Externalize `vscode` + any third-party dependencies
- **Rationale**: Follows `docs/Externalizing-Third-Party-Packages.md` guidelines
- **Implementation**: All third-party packages must be externalized to prevent bundling issues

### **Testing Complexity**

- **Standard**: `test:compile`, `test:integration`, `test:integration:full` targets (when integration testing is implemented)
- **Fallback**: Basic `test` and `test:full` targets (when integration testing is not implemented)
- **Rationale**: VS Code extension testing requires integration with extension host, but this is optional based on testing needs

## **Entry Point Standards**

### **Core Packages**

- **Standard**: `index.ts` as main entry point
- **Output**: `./dist/index.js`
- **Format**: ES modules (`format: ["esm"]`)
- **Bundle**: `false` (library mode)

### **Extension Packages**

- **Standard**: `extension.ts` as main entry point
- **Output**: `./dist/extension.cjs`
- **Format**: CommonJS (`format: ["cjs"]`)
- **Bundle**: `true` (application mode)
- **Rationale**: VS Code extension entry point convention

## **Feature-Specific Variations**

### **Dynamicons Package**

- **Asset Processing**: `process-assets` and `build-assets` targets in **core package**
- **Rationale**: Icon theme generation is **business logic** that belongs in core package
- **Architecture**: Core package contains complete business logic including asset generation
- **Extension Role**: Extension package is pure VSCode adapter that copies core-generated assets
- **Orchestrator Ready**: Core package is self-sufficient and ready for orchestrator consumption
- **Dependencies**: Externalizes `["vscode", "strip-json-comments"]`
- **Build Dependencies**: Core package build depends on asset processing completion
- **Pattern**: This is the **correct architectural pattern** - core contains complete business logic
- **Asset Pipeline**: See `docs/dynamicons-asset-pipeline.md` for complete workflow documentation
- **Current Issue**: Asset pipeline has cross-package dependencies that need architectural correction

### **Project Butler Package**

- **Dependencies**: Extension depends on `@fux/vscode-test-cli-config` AND `@fux/project-butler-core`
- **Externalization**: Externalizes `["vscode", "js-yaml"]`
- **Testing**: Has integration tests, compilation tests, and special test targets
- **Entry Point**: Uses `extension.ts` as main entry point
- **Rationale**: Project configuration management requires additional dependencies

### **Ghost Writer Package**

- **Dependencies**: Extension depends only on `@fux/ghost-writer-core`
- **Externalization**: Externalizes only `["vscode"]`
- **Testing**: Basic testing targets only
- **Entry Point**: Uses `index.ts` as main entry point
- **Rationale**: Simple extension with minimal dependencies

## **Package Type Classifications**

### **Core Packages** (`packages/{feature}/core/`)

- **Purpose**: Pure business logic, self-contained "guinea pig" packages
- **Dependencies**: Minimal external dependencies, no shared package dependencies
- **VSCode Integration**: Type imports only (`import type { Uri } from 'vscode'`)
- **Architecture**: Direct service instantiation, no DI containers

### **Extension Packages** (`packages/{feature}/ext/`)

- **Purpose**: VSCode integration and user interface
- **Dependencies**: Primary dependency on core package, optional integration testing framework
- **Architecture**: Local adapters for VSCode APIs, CommonJS bundle for VSCode compatibility

### **Shared Packages** (`libs/shared/`)

- **Purpose**: Utilities consumed by other packages
- **Dependencies**: No VSCode dependencies, pure utility functions
- **Architecture**: Clear public API, proper exports

### **Tool Packages** (`libs/tools/{tool-name}/`)

- **Purpose**: Standalone utilities
- **Dependencies**: Minimal dependencies, self-contained
- **Architecture**: Direct execution with tsx, no build step

## **Build Configuration Patterns**

### **Core Package Build Config**

```json
{
    "bundle": false,
    "format": ["esm"],
    "external": ["vscode", "dependency1", "dependency2"],
    "declaration": true,
    "declarationMap": true
}
```

### **Extension Package Build Config**

```json
{
    "bundle": true,
    "format": ["cjs"],
    "external": ["vscode", "additional-dependencies"],
    "entryPoints": ["packages/package-name/ext/src/extension.ts"]
}
```

## **Testing Architecture Patterns**

### **Core Package Testing**

- **Isolation**: Test business logic without VSCode dependencies
- **Speed**: Fast execution without complex mocking
- **Coverage**: 100% testable without external dependencies

### **Extension Package Testing**

- **Integration**: Test VSCode integration through local adapters
- **Realism**: Test actual adapter implementations
- **Coverage**: Test adapter patterns and VSCode API usage

### **Integration Testing (Optional)**

- **Framework**: `@fux/vscode-test-cli-config`
- **Targets**: `test:compile`, `test:integration`, `test:integration:full`
- **Requirements**: VS Code extension host, complex setup

## **Documentation References**

- **Architecture**: `./docs/Architecture.md` - Overall project architecture
- **Testing Strategy**: `./docs/FocusedUX-Testing-Strategy.md` - Testing patterns and implementation
- **Externalization**: `./docs/Externalizing-Third-Party-Packages.md` - Dependency externalization guidelines
- **Deep Dive Audit**: `./docs/Deep-Dive-Initial-Understanding-Audit.md` - Systematic analysis process

## **Maintenance Guidelines**

### **Adding New Packages**

1. **Determine package type** (core/ext/shared/tool)
2. **Follow standard patterns** for the package type
3. **Document any variations** in this file
4. **Update build configurations** to match package type
5. **Implement appropriate testing** strategy

### **Modifying Existing Packages**

1. **Check this document** for existing patterns
2. **Follow established variations** for the package
3. **Update this document** if new variations are introduced
4. **Maintain consistency** with similar packages

### **Package Analysis Process**

1. **Use `nx_project_details`** to understand current configuration
2. **Compare against this document** to identify intentional vs. actual deviations
3. **Document new patterns** if they represent intentional architectural decisions
4. **Fix actual deviations** that don't align with intended patterns
