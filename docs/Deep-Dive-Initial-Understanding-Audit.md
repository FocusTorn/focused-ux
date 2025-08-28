# Deep Dive Initial Understanding Audit

## **Overview**

This document outlines the **critical systematic process** that must be followed before making any package-related changes in the FocusedUX monorepo. This process prevents assumptions and ensures all architectural variations are properly understood and accounted for.

## **Why This Process is Critical**

### **The Problem**

- Packages in this monorepo have **significant variations** in their architecture
- **Assuming all packages follow the same pattern** leads to incorrect implementations
- **Missing architectural deviations** can cause build failures, test issues, and integration problems

### **Real Example: Project Butler vs Ghost Writer**

- **Ghost Writer Extension**: Depends only on `@fux/ghost-writer-core`
- **Project Butler Extension**: Depends on `@fux/vscode-test-cli-config` AND `@fux/project-butler-core`
- **Build Configuration**: Project Butler externalizes `js-yaml` in addition to `vscode`
- **Testing**: Project Butler has integration tests, compilation tests, and special test targets
- **Entry Points**: Project Butler uses `extension.ts`, Ghost Writer uses `index.ts`

**Without systematic analysis, these critical differences would be missed!**

## **The 6-Step Systematic Analysis Process**

### **Step 0: AKA Alias Discovery and Workspace Analysis**

**CRITICAL**: Before any package analysis, discover available aliases and understand the entire workspace architecture.

#### **0.1 AKA Alias Discovery**

```bash
# ALWAYS run this first to discover available commands
aka help
```

**Check for:**

- **Package-specific aliases**: `dc`, `gw`, `pb`, `nh`, etc.
- **Target aliases**: `b`, `t`, `tc`, `ti`, `tf`, etc.
- **Expandable flags**: `s`, `v`, `stream`, etc.

#### **0.2 Workspace Architecture Analysis**

```bash
# Understand the entire workspace structure
nx_workspace
```

**Map the workspace to understand:**

- **All package dependencies** and relationships
- **Package types** (core/ext/shared/tool) and their roles
- **Build configurations** and variations
- **Testing strategies** across packages
- **How the target package fits** into the overall system

#### **0.3 Command Execution Protocol**

**ALWAYS use AKA aliases instead of raw nx commands:**

```bash
# ❌ NEVER do this
nx test @fux/package-name-core
nx build @fux/package-name-ext

# ✅ ALWAYS do this
{package-alias} t      # Test package (full)
{package-alias}c t     # Test package core
{package-alias}e t     # Test package extension
```

### **Step 1: Deep Dive Initial Understanding Audit**

**CRITICAL**: Use `nx_project_details` to analyze the package before making any changes.

#### **1.1 Package Dependencies Analysis**

```bash
# Always run this first
nx_project_details @fux/package-name
```

**Check for:**

- **Core packages**: Should have minimal external dependencies
- **Extension packages**: Should depend on their core package
- **Shared packages**: May be consumed by multiple packages
- **Tool packages**: Should be standalone utilities

#### **1.2 Package Type and Role Verification**

- **Core packages**: `packages/{feature}/core/` - Pure business logic
- **Extension packages**: `packages/{feature}/ext/` - VSCode integration
- **Shared packages**: `libs/shared/` - Utilities for other packages
- **Tool packages**: `libs/tools/{tool-name}/` - Standalone utilities

#### **1.3 Build Configuration Analysis**

**Core packages should have:**

- `bundle: false` (library mode)
- `format: ["esm"]` (ES modules)
- `external: ["vscode", "dependency1", "dependency2"]` (all dependencies externalized)

**Extension packages should have:**

- `bundle: true` (application mode)
- `format: ["cjs"]` (CommonJS for VSCode)
- `external: ["vscode"]` (or additional dependencies as needed)

#### **1.4 CRITICAL: Package Variations and Deviations Analysis**

**This is the most important step!** Check for deviations from standard patterns:

##### **Extension Dependencies**

- **Standard**: Extension depends only on its core package
- **Variation**: Extension depends on additional shared packages
    - Example: `@fux/project-butler-ext` depends on `@fux/vscode-test-cli-config`

##### **Build Externalization**

- **Standard**: Only `vscode` externalized
- **Variation**: Additional dependencies externalized
    - Example: `external: ["vscode", "js-yaml"]`

##### **Testing Complexity**

- **Standard**: Basic `test` and `test:full` targets
- **Variation**: Integration tests, compilation tests, special test targets
    - Example: `test:compile`, `test:integration`, `test:integration:full`

##### **Entry Point Patterns**

- **Standard**: Uses `index.ts` as main entry point
- **Variation**: Uses `extension.ts` or other entry points
    - Example: `main: "packages/project-butler/ext/src/extension.ts"`

##### **Package.json Patterns**

- **Standard**: `packageMain: "./dist/index.cjs"`
- **Variation**: Different main field patterns
    - Example: `packageMain: "./dist/extension.cjs"`

##### **Additional Targets**

- **Standard**: `build`, `test`, `lint`, `audit`
- **Variation**: Custom targets beyond standard patterns
    - Example: `test:compile`, `test:integration`, `package:dev`

#### **1.5 Document Architectural Deviations**

**For each deviation found:**

- **Document the variation** and its purpose
- **Understand the rationale** behind the deviation
- **Plan how to handle** the variation in your implementation
- **Verify the deviation** doesn't break your assumptions

### **Step 2: Architectural Pattern Validation**

#### **2.1 Core Package Validation**

- ✅ **No shared dependencies** - Self-contained "guinea pig" packages
- ✅ **Type imports only** - `import type { Uri } from 'vscode'`
- ✅ **Direct service instantiation** - No DI containers
- ✅ **Pure business logic** - No VSCode integration code

#### **2.2 Extension Package Validation**

- ✅ **Depends on core package** - Primary dependency
- ✅ **Local adapters** - VSCode integration through local adapters
- ✅ **CommonJS bundle** - For VSCode compatibility
- ✅ **Minimal dependencies** - Beyond core package

#### **2.3 Shared Package Validation**

- ✅ **Utility consumption** - Used by other packages
- ✅ **No VSCode dependencies** - Pure utility functions
- ✅ **Proper exports** - Clear public API

#### **2.4 Tool Package Validation**

- ✅ **Standalone execution** - Runs directly with tsx
- ✅ **No build step** - Direct execution
- ✅ **Self-contained** - Minimal dependencies

### **Step 3: Build Configuration Verification**

#### **3.1 Core Package Build Config**

```json
{
    "bundle": false,
    "format": ["esm"],
    "external": ["vscode", "dependency1", "dependency2"],
    "declaration": true,
    "declarationMap": true
}
```

#### **3.2 Extension Package Build Config**

```json
{
    "bundle": true,
    "format": ["cjs"],
    "external": ["vscode"],
    "entryPoints": ["packages/package-name/ext/src/extension.ts"]
}
```

#### **3.3 TypeScript Configuration**

- **Core packages**: `tsconfig.lib.json` for build, `tsconfig.json` for IDE
- **Extension packages**: Single `tsconfig.json` with cross-project references
- **Output directories**: Unique paths to prevent conflicts

### **Step 4: Testing Architecture Alignment**

#### **4.1 Core Package Testing**

- **Isolation**: Test business logic without VSCode dependencies
- **Speed**: Fast execution without complex mocking
- **Coverage**: 100% testable without external dependencies

#### **4.2 Extension Package Testing**

- **Integration**: Test VSCode integration through local adapters
- **Realism**: Test actual adapter implementations
- **Coverage**: Test adapter patterns and VSCode API usage

#### **4.3 Special Testing Requirements**

- **Integration tests**: May require VS Code extension host
- **Compilation tests**: May need separate TypeScript compilation
- **Custom test targets**: May have specialized testing needs

### **Step 5: Implementation Validation**

#### **5.1 Build Verification**

```bash
# Always run builds first
nx run @fux/package-name:build
```

#### **5.2 Test Execution**

```bash
# Core packages - should be fast and isolated
nx run @fux/package-name-core:test

# Extension packages - may include integration tests
nx run @fux/package-name-ext:test
```

#### **5.3 Dependency Chain Validation**

```bash
# Verify dependent packages still work
nx run @fux/dependent-package:build
nx run @fux/dependent-package:test
```

#### **5.4 Full Validation**

```bash
# Run complete validation suite
nx run @fux/package-name:validate
nx run @fux/package-name:audit
```

## **Pre-Implementation Checklist**

**Before making any package changes, verify:**

### **Workspace-Level Analysis (ALWAYS FIRST)**

- [ ] **AKA aliases discovered** via `aka help`
- [ ] **Workspace architecture understood** via `nx_workspace`
- [ ] **All package dependencies mapped** and relationships identified
- [ ] **Broader context established** before focusing on specific packages
- [ ] **Command execution protocol verified** (using AKA aliases, not raw nx)

### **Package-Level Analysis (THEN SPECIFIC)**

- [ ] **Package dependencies analyzed** via `nx_project_details`
- [ ] **Package type and role confirmed** (core/ext/shared/tool)
- [ ] **Build configuration matches** package type requirements
- [ ] **VSCode imports follow** correct pattern for package type
- [ ] **Testing strategy aligns** with package architecture
- [ ] **All dependent packages identified** and considered
- [ ] **Implementation plan accounts** for architectural constraints
- [ ] **Package variations and deviations documented** and understood
- [ ] **Special testing requirements identified** and planned for
- [ ] **Entry point and dependency patterns verified**

## **Common Pitfalls to Avoid**

### **1. Ignoring AKA Alias Mandate**

- **Problem**: Using raw `nx` commands instead of `aka` aliases
- **Solution**: Always run `aka help` first and use package-specific aliases
- **Prevention**: Make AKA alias discovery Step 0 of the analysis process

### **2. Focusing on Individual Packages Without Workspace Analysis**

- **Problem**: Diving into specific packages without understanding the broader context
- **Solution**: Always start with workspace-level analysis using `nx_workspace`
- **Prevention**: Make workspace analysis mandatory before package-specific work

### **3. Assuming All Packages Follow the Same Pattern**

- **Problem**: Treating all extensions as identical
- **Solution**: Always check for variations and deviations
- **Prevention**: Systematic analysis of all package variations

### **4. Missing Additional Dependencies**

- **Problem**: Not checking for shared package dependencies
- **Solution**: Analyze all dependencies, not just core packages
- **Prevention**: Complete dependency mapping in workspace analysis

### **5. Ignoring Testing Complexity**

- **Problem**: Assuming all packages have the same testing needs
- **Solution**: Check for integration tests, compilation tests, etc.
- **Prevention**: Systematic testing strategy analysis

### **6. Overlooking Entry Point Variations**

- **Problem**: Assuming all packages use the same entry point
- **Solution**: Verify main field and entry point patterns
- **Prevention**: Entry point pattern analysis in systematic review

### **7. Not Checking Build Externalization**

- **Problem**: Assuming all packages externalize the same dependencies
- **Solution**: Verify what's in the external array
- **Prevention**: Build configuration analysis in systematic review

## **Examples of Package Variations**

### **Ghost Writer (Standard Pattern)**

```json
{
    "dependencies": ["@fux/ghost-writer-core"],
    "external": ["vscode"],
    "main": "./dist/index.cjs",
    "entryPoints": ["packages/ghost-writer/ext/src/index.ts"]
}
```

### **Project Butler (Variation Pattern)**

```json
{
    "dependencies": ["@fux/vscode-test-cli-config", "@fux/project-butler-core"],
    "external": ["vscode", "js-yaml"],
    "main": "./dist/extension.cjs",
    "entryPoints": ["packages/project-butler/ext/src/extension.ts"],
    "targets": ["test:compile", "test:integration", "test:integration:full"]
}
```

## **Conclusion**

**Always follow this systematic process before making package changes.** The variations between packages are significant and can cause serious issues if not properly understood and accounted for. This process ensures you have complete understanding of the package architecture before making any modifications.

**Remember**: The time spent on systematic analysis is always less than the time spent fixing problems caused by incorrect assumptions!
