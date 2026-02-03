# FocusedUX AI Architecture

## **REFERENCE FILES**

### **Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **AI Testing Documentation References**

- **AI_TESTING_BASE**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **AI_MOCKING_BASE**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **AI_TROUBLESHOOTING**: `docs/testing/(AI) _Troubleshooting- Base.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all package classification and architectural decisions.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

## **PACKAGE CLASSIFICATION SYSTEM**

### **Package Type Definitions**

The FocusedUX monorepo follows a **standardized package classification system** that determines architectural patterns, build configurations, and testing strategies.

#### **Quick Reference - Package Types**

- **Core Packages**: `packages/{kebab-case-feature}/core/` - Feature business logic
- **Extension Packages**: `packages/{kebab-case-feature}/ext/` - VSCode extension wrappers
- **Accessory Packages**: `packages/{kebab-case-feature}/{kebab-case-utility}/` - Feature utilities
- **Shared Libraries**: `libs/{kebab-case-name}/` - Shared/consumed libraries
- **Utilities**: `utilities/{kebab-case-name}/` - Repository tools
- **Plugins**: `plugins/{kebab-case-name}/` - Nx workspace plugins

#### **Key Architectural Rules**

- **Core Packages**: ESM modules, type imports only, no VSCode value imports
- **Extension Packages**: CJS bundles, VSCode API integration, adapter patterns
- **Build System**: Target inheritance via `build:core` and `build:ext` patterns
- **Testing**: Package-specific strategies using `@fux/mock-strategy`

## **PACKAGE SELECTION GUIDELINES**

### **When to Create Each Package Type**

#### **1. :: Core Package** (`packages/{kebab-case-feature}/core/`)

**✅ CORRECT Usage**:

- Business logic for VSCode extensions
- Pure functionality without VSCode dependencies
- Self-contained feature implementation
- Data processing and transformation logic

**❌ INCORRECT Usage**:

- VSCode-specific code or API calls
- UI components or presentation logic
- Extension lifecycle management
- Asset processing (use accessory package)

#### **2. :: Extension Package** (`packages/{kebab-case-feature}/ext/`)

**✅ CORRECT Usage**:

- VSCode extension implementations
- VSCode API integration
- Extension-specific configuration
- Command and menu registration

**❌ INCORRECT Usage**:

- Business logic (belongs in core)
- Pure utility functions
- Standalone tools
- Shared functionality

#### **3. :: Accessory Package** (`packages/{kebab-case-feature}/{kebab-case-utility}/`)

**✅ CORRECT Usage**:

- Feature-specific processing logic
- Dynamic asset processing and generation
- Feature-specific utilities
- Specialized tooling for the feature

**❌ INCORRECT Usage**:

- Shared utilities (use libs)
- Business logic (use core)
- VSCode extensions (use ext)

#### **4. :: Shared Library** (`libs/{kebab-case-name}/`)

**✅ CORRECT Usage**:

- Utilities used by multiple features
- Common abstractions and helpers
- Testing utilities and mock strategies
- Shared business logic components

**❌ INCORRECT Usage**:

- Feature-specific logic
- VSCode-specific functionality
- Single-use utilities

#### **5. :: Utility** (`utilities/{kebab-case-name}/`)

**✅ CORRECT Usage**:

- CLI tools and development utilities
- Standalone executables
- Development automation scripts
- Global tools for repository management

**❌ INCORRECT Usage**:

- Shared libraries (use libs)
- Business logic (use core)
- VSCode extensions (use ext)

#### **6. :: Plugin** (`plugins/{kebab-case-name}/`)

**✅ CORRECT Usage**:

- Custom Nx executors and generators
- Workspace development tooling
- Build and deployment automation
- Nx-specific functionality

**❌ INCORRECT Usage**:

- Business logic or VSCode extensions
- Standalone utilities
- Shared libraries

## **CRITICAL ARCHITECTURAL RULES**

### **VSCode Import Patterns**

#### **✅ CORRECT - Core Packages (Type Imports Only)**

```typescript
// Core packages - type imports only
import type { Uri, Position, Range } from 'vscode'

// Use interfaces for VSCode types
interface VSCodeUri {
    fsPath: string
    scheme: string
}
```

#### **✅ CORRECT - Extension Packages (Value Imports Allowed)**

```typescript
// Extension packages - value imports allowed
import { Uri, window, commands, workspace } from 'vscode'

// Direct VSCode API usage in extensions
const uri = Uri.file('/path/to/file')
await window.showInformationMessage('Extension activated')
```

#### **❌ INCORRECT - Core Packages (NEVER Use Value Imports)**

```typescript
// Core packages - NEVER use value imports
import { Uri } from 'vscode' // ❌ This violates architecture
import { window } from 'vscode' // ❌ This violates architecture
```

### **Adapter Architecture**

#### **Core Package Adapter Pattern**

```typescript
// Core packages define interfaces only
export interface FileSystemAdapter {
    readFile(path: string): Promise<string>
    writeFile(path: string, content: string): Promise<void>
}

// Core services use adapters
export class DataProcessor {
    constructor(private fileSystem: FileSystemAdapter) {}

    async processFile(path: string): Promise<void> {
        const content = await this.fileSystem.readFile(path)
        // Process content...
    }
}
```

#### **Extension Package Adapter Implementation**

```typescript
// Extension packages implement adapters
import { workspace, Uri } from 'vscode'
import type { FileSystemAdapter } from '@fux/{feature}-core'

export class VSCodeFileSystemAdapter implements FileSystemAdapter {
    async readFile(path: string): Promise<string> {
        const uri = Uri.file(path)
        const document = await workspace.openTextDocument(uri)
        return document.getText()
    }

    async writeFile(path: string, content: string): Promise<void> {
        const uri = Uri.file(path)
        const encoder = new TextEncoder()
        await workspace.fs.writeFile(uri, encoder.encode(content))
    }
}
```

### **Dependency Management**

#### **Core Package Dependencies**

```json
{
    "dependencies": {
        "[runtime-dependency]": "[version]"
    },
    "devDependencies": {
        "@fux/mock-strategy": "workspace:*",
        "@types/node": "^24.7.0",
        "typescript": "^5.9.3",
        "vitest": "^3.2.4"
    }
}
```

#### **Extension Package Dependencies**

```json
{
    "dependencies": {
        "@fux/{kebab-case-feature}-core": "workspace:*",
        "[runtime-dependency]": "[version]"
    },
    "devDependencies": {
        "@fux/mock-strategy": "workspace:*",
        "@types/vscode": "^1.104.0",
        "@types/node": "^24.7.0",
        "typescript": "^5.9.3",
        "vitest": "^3.2.4"
    }
}
```

## **BUILD SYSTEM ARCHITECTURE**

### **Universal Build Executor Rule**

**CRITICAL**: ALL packages MUST use `@nx/esbuild:esbuild` as the build executor, regardless of package type or bundling needs.

#### **Global Build Targets**

- **`build:core`**: Core package pattern (ESM, unbundled, declarations)
- **`build:ext`**: Extension package pattern (CJS, bundled, VSCode-compatible)

### **Core Package Build Configuration**

```json
{
    "name": "@fux/{kebab-case-feature}-core",
    "tags": ["npm:private", "core"],
    "implicitDependencies": [],
    "targets": {
        "build": {
            "extends": "build:core",
            "options": {
                "external": ["vscode", "[package-specific-external]"]
            }
        }
    }
}
```

### **Extension Package Build Configuration**

```json
{
    "name": "@fux/{kebab-case-feature}-ext",
    "tags": ["npm:private", "ext"],
    "implicitDependencies": ["@fux/{kebab-case-feature}-core"],
    "targets": {
        "build": {
            "extends": "build:ext",
            "options": {
                "external": ["vscode", "[package-specific-external]"]
            }
        }
    }
}
```

### **Package.json Configuration Patterns**

#### **Core Package Package.json**

```json
{
    "name": "@fux/{kebab-case-feature}-core",
    "version": "[version]",
    "type": "module",
    "private": true,
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "default": "./dist/index.js"
        }
    },
    "devDependencies": {
        "@fux/mock-strategy": "workspace:*",
        "@types/node": "^24.7.0",
        "typescript": "^5.9.3",
        "vitest": "^3.2.4"
    }
}
```

#### **Extension Package Package.json**

```json
{
    "name": "fux-{kebab-case-feature}",
    "displayName": "F-UX: [Feature Display Name]",
    "description": "[Feature description]",
    "publisher": "NewRealityDesigns",
    "version": "[version]",
    "dependencies": {
        "@fux/{kebab-case-feature}-core": "workspace:*",
        "[runtime-dependency]": "[version]"
    },
    "devDependencies": {
        "@fux/mock-strategy": "workspace:*",
        "@types/vscode": "^1.104.0",
        "@types/node": "^24.7.0",
        "typescript": "^5.9.3",
        "vitest": "^3.2.4"
    },
    "contributes": {
        "commands": [
            {
                "command": "[kebab-case-feature].[kebab-case-command]",
                "title": "[Feature]: [Command Title]",
                "category": "[Feature]"
            }
        ]
    },
    "activationEvents": ["onStartupFinished"],
    "engines": {
        "vscode": "^1.99.3"
    },
    "private": true,
    "main": "./dist/extension.cjs"
}
```

## **PACKAGE STRUCTURE STANDARDS**

### **Core Package Structure**

```
packages/{kebab-case-feature}/core/
├── src/
│   ├── _interfaces/          # Service interfaces
│   │   ├── [kebab-case-service].interface.ts
│   │   └── index.ts
│   ├── _config/              # Configuration constants
│   │   ├── [kebab-case-config].config.ts
│   │   └── index.ts
│   ├── services/             # Business logic services
│   │   ├── [kebab-case-service].service.ts
│   │   └── index.ts
│   └── index.ts              # Package exports
├── __tests__/                # Test structure
│   ├── functional-tests/
│   └── _reports/
├── package.json              # Package configuration
├── project.json              # Nx configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.lib.json         # Library TypeScript configuration
├── vitest.config.ts          # Vitest configuration
└── vitest.coverage.config.ts # Coverage configuration
```

### **Extension Package Structure**

```
packages/{kebab-case-feature}/ext/
├── src/
│   ├── adapters/             # VSCode API adapters
│   │   ├── [kebab-case-adapter].adapter.ts
│   │   └── index.ts
│   ├── commands/             # VSCode commands
│   │   ├── [kebab-case-command].command.ts
│   │   └── index.ts
│   ├── extension.ts          # Extension entry point
│   └── index.ts              # Package exports
├── __tests__/                # Test structure
│   ├── functional-tests/
│   ├── integration-tests/
│   └── _reports/
├── assets/                   # Static assets (if needed)
├── package.json              # Package configuration
├── project.json              # Nx configuration
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest configuration
└── vitest.coverage.config.ts # Coverage configuration
```

### **Accessory Package Structure**

```
packages/{kebab-case-feature}/{kebab-case-utility}/
├── src/
│   ├── processors/           # Processing logic
│   │   ├── [kebab-case-processor].processor.ts
│   │   └── index.ts
│   ├── generators/           # Generation logic
│   │   ├── [kebab-case-generator].generator.ts
│   │   └── index.ts
│   └── index.ts              # Package exports
├── __tests__/                # Test structure
├── package.json              # Package configuration
├── project.json              # Nx configuration
└── tsconfig.json             # TypeScript configuration
```

## **NAMING CONVENTIONS**

### **Package Names**

- **Core Packages**: `@fux/{kebab-case-feature}-core`
- **Extension Packages**: `fux-{kebab-case-feature}`
- **Accessory Packages**: `@fux/{kebab-case-feature}-{kebab-case-utility}`
- **Shared Libraries**: `@fux/{kebab-case-name}`
- **Utilities**: `@fux/{kebab-case-name}`
- **Plugins**: `@fux/{kebab-case-name}`

### **Directory Names**

- **Features**: Use kebab-case (e.g., `ghost-writer`, `project-butler`)
- **Utilities**: Use kebab-case (e.g., `assets`, `themes`, `config`)
- **Tools**: Use kebab-case (e.g., `project-alias-expander`)
- **Libraries**: Use kebab-case (e.g., `mock-strategy`)

### **File Names**

- **TypeScript**: Use kebab-case (e.g., `asset-processor.ts`)
- **Test Files**: Use kebab-case with `.test.ts` suffix
- **Configuration**: Use kebab-case (e.g., `vitest.config.ts`)

### **Variable and Function Names**

- **Variables**: Use camelCase (e.g., `fileSystemAdapter`)
- **Functions**: Use camelCase (e.g., `processData`)
- **Classes**: Use PascalCase (e.g., `DataProcessor`)
- **Interfaces**: Use PascalCase with `I` prefix or descriptive suffix (e.g., `IDataProcessor` or `DataProcessorInterface`)

## **PACKAGE TESTING STRATEGIES**

### **Testing Framework Requirements**

- **Framework**: Vitest (mandatory)
- **Mock Strategy**: Use `@fux/mock-strategy` functions
- **Coverage**: 100% coverage for public methods
- **Build Dependencies**: Tests depend on appropriate build targets

**📋 CRITICAL REFERENCE**: See comprehensive testing strategies in `./docs/testing` directory for complete testing patterns and examples.

#### **Package-Specific Testing References**

- **Core Packages**: See **CORE_TESTS** for business logic testing patterns
- **Extension Packages**: See **EXT_TESTS** for VSCode integration testing patterns
- **Shared Libraries**: See **LIBS_TESTS** for utility testing patterns
- **Utilities**: See **UTIL_TESTS** for tool testing patterns

## **ASSET MANAGEMENT**

### **Static Assets**

#### **Extension Package Assets**

```
packages/{kebab-case-feature}/ext/assets/
├── icons/                    # Static icon files
├── themes/                   # Static theme files
├── images/                   # Static image files
└── [other-static-assets]/   # Other static content
```

**Usage**: Static assets that don't require processing should be placed in the `assets/` directory and referenced directly in extension configuration.

### **Dynamic Asset Processing**

#### **Accessory Package for Asset Processing**

```
packages/{kebab-case-feature}/assets/
├── src/
│   ├── processors/           # Asset processing logic
│   ├── generators/           # Asset generation logic
│   └── index.ts
├── source-assets/            # Source asset files
└── dist-assets/              # Generated asset files
```

**Usage**: When assets require dynamic processing, generation, or transformation, create an accessory package dedicated to asset management.

## **PACKAGING SYSTEMS**

### **VSCode Extension Packaging (VPACK)**

**Purpose**: Standard executor for creating locally installable VSIX packages

**Usage**: All VSCode extensions MUST use `@fux/vpack:pack` executor

```json
{
    "targets": {
        "package": {
            "extends": "package",
            "executor": "@fux/vpack:pack",
            "options": {
                "targetPath": "packages/{kebab-case-feature}/ext",
                "outputPath": "vsix_packages",
                "deployPath": ".vpack/deploy",
                "freshDeploy": true,
                "keepDeploy": true,
                "contentsPath": ".vpack/contents",
                "extractContents": true,
                "dev": false
            }
        }
    }
}
```

### **Global CLI Packaging (NPACK)**

**Purpose**: Create locally installable global CLI packages

**Usage**: Utilities that need global CLI installation

```json
{
    "targets": {
        "build:install": {
            "executor": "@fux/npack:pack",
            "dependsOn": ["build"],
            "outputs": ["{projectRoot}/*.tgz"],
            "options": {
                "keepTemp": false,
                "freshTemp": true,
                "debug": false
            }
        }
    }
}
```

## **PACKAGE ANTI-PATTERNS**

### **Architecture Violations**

- ❌ **Business logic in extensions** - Core logic belongs in core packages
- ❌ **VSCode value imports in core** - Use type imports only
- ❌ **Direct VSCode API calls in core** - Use adapters in extensions
- ❌ **Shared dependencies in core** - Keep core packages self-contained
- ❌ **DI containers in core** - Use direct service instantiation

### **Build Violations**

- ❌ **Build deps in dependencies** - Use devDependencies for build tools
- ❌ **Missing externalization** - Externalize VSCode and Node.js APIs
- ❌ **Caching packaging targets** - Packaging should not be cached
- ❌ **Direct Node.js imports in extensions** - Use proper externalization

### **Testing Violations**

- ❌ **VSCode mocking in shared tests** - Use appropriate mock strategies
- ❌ **Test files >500 lines** - Split large test files
- ❌ **Skipping tests for deadlines** - Maintain test coverage
- ❌ **Tests calling complex methods without mocking** - Mock external dependencies

### **Naming Violations**

- ❌ **Mixed naming conventions** - Use consistent kebab-case for files/directories
- ❌ **Inconsistent package names** - Follow established naming patterns
- ❌ **Non-descriptive names** - Use clear, descriptive naming
- ❌ **Abbreviations without context** - Avoid unclear abbreviations

## **PACKAGE QUALITY GATES**

### **Quality Gates Checklist**

- [ ] Package follows correct architectural pattern
- [ ] Build configuration extends appropriate global target
- [ ] VSCode imports follow type-only pattern (core) or value pattern (ext)
- [ ] Testing strategy follows package-specific patterns
- [ ] Mock strategy uses appropriate `@fux/mock-strategy` functions
- [ ] Test coverage meets 100% for public methods
- [ ] No anti-patterns detected
- [ ] Package dependencies are minimal and appropriate
- [ ] Naming conventions followed consistently
- [ ] Asset management follows established patterns
- [ ] Packaging system used correctly (VPACK for extensions, NPACK for CLI tools)

### **Quality Gates**

- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] No architectural violations detected
- [ ] Mock strategy follows documented approach
- [ ] Documentation alignment verified
- [ ] Package classification verified
- [ ] Naming consistency verified
- [ ] Asset management verified

## **PACKAGE SUCCESS METRICS**

After implementing proper package classification:

- ✅ **Consistent architectural patterns** across all packages
- ✅ **Zero build-related failures** due to incorrect configurations
- ✅ **Faster development** (3x speed improvement with clear patterns)
- ✅ **Improved maintainability** (standardized package structure)
- ✅ **Better testing** (package-specific testing strategies)
- ✅ **Clean separation of concerns** (core vs extension logic)
- ✅ **Proper asset management** (static vs dynamic asset handling)
- ✅ **Standardized packaging** (VPACK for extensions, NPACK for CLI tools)

## **PACKAGE VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Business logic in extensions → "This belongs in core"
- **MANDATORY**: VSCode value imports in core → "Use type imports only"
- **MANDATORY**: Direct nx commands → "Use PAE aliases"
- **MANDATORY**: Test failures → "Check if build is clean first"
- **MANDATORY**: Documentation questions → "Check docs/ before creating"
- **MANDATORY**: Package confusion → "Check package type and path"
- **MANDATORY**: Creating solutions without checking docs → "STOP! Check docs/ first - this is a critical violation"
- **MANDATORY**: Inconsistent naming → "Follow kebab-case conventions"
- **MANDATORY**: Wrong packaging system → "Use VPACK for extensions, NPACK for CLI tools"

### **Pattern Recognition**

- Package path → Determines type and rules
- Command structure → Determines execution pattern
- File extension → Determines build configuration
- Import source → Determines architecture compliance
- Error context → Determines troubleshooting approach
- User question type → Determines response strategy
- Naming pattern → Determines convention compliance
- Asset type → Determines management approach

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Package type verification
- Architectural compliance verification
- Build configuration validation
- Anti-pattern violation detection
- VSCode import compliance verification
- Naming convention verification
- Packaging system verification

### **HIGH PRIORITY (Execute before proceeding)**

- Test execution and validation
- Build error resolution
- Pattern compliance verification
- Tool usage verification
- Asset management verification

### **MEDIUM PRIORITY (Execute during normal operation)**

- Documentation updates
- Pattern recognition
- Performance measurement
- Status reporting

### **LOW PRIORITY (Execute when time permits)**

- Process improvements
- Pattern documentation
- Lesson sharing
- Future planning

## **DYNAMIC MANAGEMENT NOTE**

This document is optimized for AI internal processing and may be updated dynamically based on operational needs and pattern recognition. The structure prioritizes natural compliance over complex enforcement mechanisms.
