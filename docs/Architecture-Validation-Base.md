# Knowledge Audit Base - Shared Concepts and Patterns

## **DOCUMENT PURPOSE**

**Primary Consumer**: AI Agent performing systematic audits
**Objective**: Centralized reference for shared audit concepts and validation patterns
**Scope**: Common architectural patterns, validation criteria, and anti-patterns

## **CRITICAL CONTEXT**

### **PROBLEM STATEMENT**

- **Issue**: Audit processes require consistent validation across different contexts
- **Risk**: Inconsistent validation leads to missed issues and architectural violations
- **Impact**: Build failures, test issues, integration problems

### **SOLUTION APPROACH**

**REFERENCE DOCUMENTS:**

- **Primary**: `docs/Package-Specific-Details.md` - Complete pattern reference
- **Secondary**: `docs/Architecture.md` - Overall architecture context
- **Tertiary**: `docs/FocusedUX-Testing-Strategy.md` - Testing patterns

**PATTERN CLASSIFICATION:**

- **Intentional Patterns**: Documented architectural decisions (e.g., integration testing frameworks)
- **Feature-Specific Requirements**: Package-specific needs (e.g., asset processing)
- **Actual Deviations**: Real issues requiring correction

**CRITICAL RULE**: Without systematic analysis, intentional patterns cannot be distinguished from actual problems.

## **SHARED VALIDATION CRITERIA**

### **GENERAL VALIDATION PATTERNS**

**SUCCESS INDICATORS:**
✅ **Complete Analysis**: All required validation steps completed
✅ **No Errors**: No configuration or architectural errors detected
✅ **Pattern Compliance**: Follows documented architectural patterns
✅ **Dependency Integrity**: All dependencies properly resolved
✅ **Implementation Ready**: Clear path forward for implementation

**FAILURE INDICATORS:**
❌ **Incomplete Analysis**: Missing required validation steps
❌ **Configuration Errors**: Build or configuration issues detected
❌ **Pattern Violations**: Deviations from documented patterns
❌ **Dependency Issues**: Unresolved or circular dependencies
❌ **Implementation Blocked**: Issues preventing implementation

### **DECISION POINTS**

**CONTINUATION CRITERIA:**

- **IF** all validations pass **THEN** proceed to implementation
- **IF** workspace is healthy **THEN** proceed to package-specific analysis
- **IF** deviations are intentional **THEN** document and proceed

**BLOCKING CRITERIA:**

- **IF** actual issues found **THEN** resolve before proceeding
- **IF** workspace has errors **THEN** fix before proceeding
- **IF** unclear whether intentional **THEN** consult reference documentation

## **ARCHITECTURAL PATTERNS**

### **PACKAGE TYPE MATRIX**

| Package Type | Location Pattern           | Role                         | Architecture                      | Bundle  | Format    | External                |
| ------------ | -------------------------- | ---------------------------- | --------------------------------- | ------- | --------- | ----------------------- |
| Core         | `packages/{feature}/core/` | Pure business logic          | Self-contained, type imports only | `false` | `["esm"]` | `["vscode", "deps..."]` |
| Extension    | `packages/{feature}/ext/`  | VSCode integration           | Local adapters, CommonJS bundle   | `true`  | `["cjs"]` | `["vscode"]`            |
| Shared       | `libs/shared/`             | Utilities for other packages | Pure functions, clear exports     | `false` | `["esm"]` | `["deps..."]`           |
| Tool         | `libs/tools/{tool-name}/`  | Standalone utilities         | Direct execution, minimal deps    | `false` | `["esm"]` | `["deps..."]`           |

### **CORE PACKAGE VALIDATION**

**CRITICAL CHECKLIST:**

- [ ] **No Shared Dependencies**: Self-contained with minimal external dependencies
- [ ] **Type Imports Only**: `import type { Uri } from 'vscode'` pattern
- [ ] **Direct Service Instantiation**: No DI containers used
- [ ] **Pure Business Logic**: No VSCode integration code

**VALIDATION CRITERIA:**
✅ **Self-Contained**: No shared package dependencies
✅ **Type-Safe**: Only VSCode type imports, no value imports
✅ **Direct Architecture**: Services instantiated directly, no DI containers
✅ **Pure Logic**: Business logic without VSCode integration

### **EXTENSION PACKAGE VALIDATION**

**CRITICAL CHECKLIST:**

- [ ] **Core Package Dependency**: Primary dependency on core package
- [ ] **Local Adapters**: VSCode integration through local adapters
- [ ] **CommonJS Bundle**: Bundle format for VSCode compatibility
- [ ] **Minimal Dependencies**: Minimal dependencies beyond core package

**VALIDATION CRITERIA:**
✅ **Core Dependency**: Depends on core package as primary dependency
✅ **Adapter Pattern**: Uses local adapters for VSCode API integration
✅ **VSCode Compatible**: CommonJS bundle for VSCode compatibility
✅ **Minimal Dependencies**: Minimal dependencies beyond core package

### **SHARED PACKAGE VALIDATION**

**CRITICAL CHECKLIST:**

- [ ] **Utility Consumption**: Used by other packages
- [ ] **No VSCode Dependencies**: Pure utility functions
- [ ] **Proper Exports**: Clear public API

**VALIDATION CRITERIA:**
✅ **Utility Focus**: Consumed by other packages for utility functions
✅ **Platform Independent**: No VSCode dependencies
✅ **Clear API**: Proper exports with clear public interface

### **TOOL PACKAGE VALIDATION**

**CRITICAL CHECKLIST:**

- [ ] **Standalone Execution**: Runs directly with tsx
- [ ] **No Build Step**: Direct execution without build process
- [ ] **Self-Contained**: Minimal dependencies

**VALIDATION CRITERIA:**
✅ **Direct Execution**: Runs directly with tsx command
✅ **No Build Required**: Direct execution without build step
✅ **Self-Contained**: Minimal dependencies for standalone operation

## **BUILD CONFIGURATION PATTERNS**

### **CORE PACKAGE BUILD CONFIG**

```json
{
    "bundle": false,
    "format": ["esm"],
    "external": ["vscode", "dependency1", "dependency2"],
    "declaration": true,
    "declarationMap": true
}
```

### **EXTENSION PACKAGE BUILD CONFIG**

```json
{
    "bundle": true,
    "format": ["cjs"],
    "external": ["vscode"],
    "entryPoints": ["packages/package-name/ext/src/extension.ts"]
}
```

### **BUILD CONFIGURATION VALIDATION**

**CRITICAL CHECKLIST:**

- [ ] **Bundle Setting**: Matches package type (false for core, true for extension)
- [ ] **Format Setting**: ES modules for core, CommonJS for extension
- [ ] **External Dependencies**: All dependencies properly externalized
- [ ] **Entry Point**: Correct entry point for package type

**VALIDATION CRITERIA:**
✅ **Core Package**: `bundle: false`, `format: ["esm"]`, all deps externalized
✅ **Extension Package**: `bundle: true`, `format: ["cjs"]`, VSCode + deps externalized

## **TESTING ARCHITECTURE PATTERNS**

### **CORE PACKAGE TESTING**

- **Isolation**: Test business logic without VSCode dependencies
- **Speed**: Fast execution without complex mocking
- **Coverage**: 100% testable without external dependencies

### **EXTENSION PACKAGE TESTING**

- **Integration**: Test VSCode integration through local adapters
- **Realism**: Test actual adapter implementations
- **Coverage**: Test adapter patterns and VSCode API usage

### **SPECIAL TESTING REQUIREMENTS**

- **Integration tests**: May require VS Code extension host
- **Compilation tests**: May need separate TypeScript compilation
- **Custom test targets**: May have specialized testing needs

## **COMMON PITFALLS AND ANTI-PATTERNS**

### **1. ASSUMING UNIFORM PATTERNS**

**Problem**: Treating all packages as identical
**Solution**: Always check for variations and deviations
**Prevention**: Systematic analysis of all package variations

### **2. MISSING DEPENDENCIES**

**Problem**: Not checking for shared package dependencies
**Solution**: Analyze all dependencies, not just core packages
**Prevention**: Complete dependency mapping in workspace analysis

### **3. IGNORING TESTING COMPLEXITY**

**Problem**: Assuming all packages have the same testing needs
**Solution**: Check for integration tests, compilation tests, etc.
**Prevention**: Systematic testing strategy analysis

### **4. OVERLOOKING ENTRY POINT VARIATIONS**

**Problem**: Assuming all packages use the same entry point
**Solution**: Verify main field and entry point patterns
**Prevention**: Entry point pattern analysis in systematic review

### **5. NOT CHECKING BUILD EXTERNALIZATION**

**Problem**: Assuming all packages externalize the same dependencies
**Solution**: Verify what's in the external array
**Prevention**: Build configuration analysis in systematic review

## **IMPLEMENTATION VALIDATION PATTERNS**

### **BUILD VERIFICATION**

```bash
# Always run builds first
nx run @fux/package-name:build
```

### **TEST EXECUTION**

```bash
# Core packages - should be fast and isolated
nx run @fux/package-name-core:test

# Extension packages - may include integration tests
nx run @fux/package-name-ext:test
```

### **DEPENDENCY CHAIN VALIDATION**

```bash
# Verify dependent packages still work
nx run @fux/dependent-package:build
nx run @fux/dependent-package:test
```

### **FULL VALIDATION**

```bash
# Run complete validation suite
nx run @fux/package-name:validate
nx run @fux/package-name:audit
```

## **DEVIATION ANALYSIS PROCESS**

### **DEVIATION CLASSIFICATION**

**INTENTIONAL PATTERNS:**

- Documented in Package-Specific-Details.md as feature-specific variations
- Have clear rationale and purpose
- Don't break architectural assumptions

**ACTUAL ISSUES:**

- Not documented in reference materials
- Represent configuration problems
- Require correction before proceeding

### **DEVIATION DOCUMENTATION PROCESS**

1. **Check Reference**: Consult Package-Specific-Details.md for intentional patterns
2. **Classify Deviation**: Mark as intentional variation or actual issue
3. **Document Purpose**: Record rationale and purpose of deviation
4. **Plan Implementation**: Determine how to handle in implementation
5. **Verify Assumptions**: Ensure deviation doesn't break architectural assumptions
6. **Update Reference**: Add to Package-Specific-Details.md if new intentional pattern

### **DEVIATION VALIDATION CRITERIA**

✅ **Intentional Pattern**: Deviation documented in Package-Specific-Details.md as feature-specific variation
✅ **Actual Issue**: Deviation not documented and represents configuration problem
✅ **Standard Compliance**: Package follows documented patterns for its type

## **REFERENCE INTEGRATION**

### **PRIMARY REFERENCES**

- **Package-Specific-Details.md**: Complete pattern reference for all package variations
- **Architecture.md**: Overall architecture context and design principles
- **FocusedUX-Testing-Strategy.md**: Testing patterns and implementation guides

### **REFERENCE CONSULTATION PROCESS**

1. **Before Analysis**: Review relevant reference documents
2. **During Analysis**: Consult references for pattern validation
3. **After Analysis**: Update references with new patterns discovered
4. **For Deviations**: Always check references before classifying as issues

### **REFERENCE UPDATE CRITERIA**

- **New Intentional Patterns**: Document in Package-Specific-Details.md
- **Architectural Changes**: Update Architecture.md
- **Testing Patterns**: Update FocusedUX-Testing-Strategy.md
- **Process Improvements**: Update this foundation document

## **CONCLUSION**

This foundation document provides the shared concepts and patterns used across all audit processes. It ensures consistent validation and prevents architectural violations through systematic analysis and pattern recognition.

**Remember**: Always consult this foundation before performing any audit, and update it when new patterns or anti-patterns are discovered.
