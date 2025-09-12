# SOP v2: FocusedUX Core/Extension Architecture

## **Overview**

This document outlines the **confirmed final architecture** for the FocusedUX monorepo, based on the working implementations in Ghost Writer and Project Butler packages. This architecture provides a clean separation between business logic (core) and VSCode integration (extension) while maintaining simplicity and testability.

## **Command Execution Protocol**

### **PAE Alias Mandate**

**CRITICAL RULE**: ALWAYS use PAE aliases for all project operations.

#### **Pre-Execution Requirements**

```bash
# ALWAYS run this first to discover available commands
pae help
```

#### **Command Execution Patterns**

```bash
# ❌ NEVER do this
nx test @fux/package-name-core
nx build @fux/package-name-ext
pnpm run build --filter=@fux/package-name

# ✅ ALWAYS do this
{package-alias} t      # Test package (full)
{package-alias}c t     # Test package core
{package-alias}e t     # Test package extension
{package-alias} b      # Build package
{package-alias} tc     # Test with coverage
{package-alias} ti     # Test integration
```

#### **Package-Specific Aliases**

- **Dynamicons**: `dc`, `dcc`, `dce`
- **Ghost Writer**: `gw`, `gwc`, `gwe`
- **Project Butler**: `pb`, `pbc`, `pbe`
- **Note Hub**: `nh`, `nhc`, `nhe`
- **Context Cherry Picker**: `ccp`, `ccpc`, `ccpe`

#### **Target Aliases**

- **Build**: `b`
- **Test**: `t`, `tc` (with coverage), `ti` (integration), `tf` (full)
- **Package**: `p`, `pd` (dev)
- **Lint**: `l`, `lf` (full)
- **Validate**: `v`, `vf` (full)
- **Audit**: `a`, `af` (full)

#### **Verification Steps**

- [ ] **PAE aliases discovered** via `pae help`
- [ ] **Package-specific aliases identified** for target package
- [ ] **Command patterns verified** before execution
- [ ] **No raw nx commands used** unless explicitly required

### **Workspace Analysis Protocol**

#### **Pre-Package Analysis Requirements**

```bash
# ALWAYS understand workspace before focusing on specific packages
nx_workspace
```

#### **Workspace Mapping Checklist**

- [ ] **All package dependencies** and relationships identified
- [ ] **Package types** (core/ext/shared/tool) and roles understood
- [ ] **Build configurations** and variations mapped
- [ ] **Testing strategies** across packages analyzed
- [ ] **Target package context** within overall system established

## **Confirmed Architecture Pattern**

### **Core Package (`@fux/package-name-core`)**

- **Purpose**: Pure business logic, no VSCode dependencies
- **Dependencies**: Minimal external dependencies (e.g., `js-yaml` for YAML parsing)
- **No DI Container**: Services are directly instantiated with dependencies
- **No Shared Dependencies**: Self-contained "guinea pig" packages
- **Complete Interface Implementation**: All service interface methods must be implemented
- **VSCode Imports**: Type imports only (`import type { Uri } from 'vscode'`)
- **Build**: `@nx/esbuild:esbuild` with `bundle: false`, `format: ["esm"]`

### **Extension Package (`@fux/package-name-ext`)**

- **Purpose**: Lightweight VSCode wrapper for core logic
- **Dependencies**: Core package + VSCode APIs
- **No DI Container**: Direct service instantiation
- **VSCode Adapters**: Local adapters with VSCode value imports
- **No Shared Dependencies**: Self-contained with local adapters only
- **Build**: `@nx/esbuild:esbuild` with `bundle: true`, `format: ["cjs"]`

## **VSCode Import Patterns**

### **Core Package VSCode Imports**

- **Pattern**: Type imports only
- **Implementation**: `import type { Uri } from 'vscode'`
- **Rationale**: Core packages remain pure business logic without VSCode dependencies
- **Testing**: Test business logic in complete isolation without VSCode mocking

### **Extension Package VSCode Imports**

- **Pattern**: Local adapters with VSCode value imports
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

## **Package Structure**

### **Core Package Structure**

```
packages/package-name/core/
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
│   ├── functional-tests/     # Main test directory
│   │   ├── _readme.md        # Functional test docs
│   │   └── *.service.test.ts # Service tests
│   ├── unit/                 # Specific isolated tests
│   │   └── _readme.md        # Unit test docs
│   └── coverage-tests/       # Coverage reports
│       └── _readme.md        # Coverage docs
├── package.json              # Core package config
├── project.json              # Nx build config
├── tsconfig.json             # TypeScript config
├── tsconfig.lib.json         # Library build config
├── vitest.config.ts          # Test config
└── vitest.coverage.config.ts # Coverage test config
```

### **Extension Package Structure**

```
packages/package-name/ext/
├── src/
│   ├── adapters/             # VSCode API adapters
│   ├── _interfaces/          # Extension interfaces
│   ├── _config/              # Extension configuration
│   ├── services/             # Extension-specific services
│   ├── extension.ts          # Main extension entry point
│   └── index.ts              # Package exports
├── __tests__/
│   ├── _setup.ts             # Global test setup
│   ├── functional-tests/     # Main test directory
│   │   ├── _readme.md        # Functional test docs
│   │   ├── extension.test.ts # Main extension test
│   │   └── adapters/         # Adapter tests
│   ├── unit/                 # Specific isolated tests
│   │   └── _readme.md        # Unit test docs
│   └── coverage-tests/       # Coverage reports
│       └── _readme.md        # Coverage docs
├── assets/                   # Extension assets
├── package.json              # Extension config
├── project.json              # Nx build config
├── tsconfig.json             # TypeScript config
├── .vscodeignore             # VSIX packaging
├── vitest.config.ts          # Test config
└── vitest.coverage.config.ts # Coverage test config
```

## **Build Configuration**

### **Universal Build Executor Rule**

**CRITICAL**: ALL packages MUST use `@nx/esbuild:esbuild` as the build executor, regardless of package type or bundling needs.

**Rationale**:

- **Performance**: ESBuild is significantly faster than Vite, Rollup, or Webpack for TypeScript compilation
- **Consistency**: Single build system across all packages for maintainability
- **Nx Integration**: Superior caching and incremental build support
- **TypeScript Support**: Native TypeScript compilation without bundling when `bundle: false`

**Forbidden Executors**:

- ❌ `@nx/vite:build` - Use ESBuild instead
- ❌ `@nx/rollup:rollup` - Use ESBuild instead
- ❌ `@nx/webpack:webpack` - Use ESBuild instead
- ❌ `@nx/tsc:tsc` - Use ESBuild instead

### **Core Package Configuration**

**`package.json`:**

```json
{
    "name": "@fux/package-name-core",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "default": "./dist/index.js"
        }
    },
    "dependencies": {
        "js-yaml": "^4.1.0"
    },
    "devDependencies": {
        "@types/js-yaml": "^4.0.9",
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "vitest": "^3.2.4"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/package-name-core",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "main": "packages/package-name/core/src/index.ts",
                "outputPath": "packages/package-name/core/dist",
                "tsConfig": "packages/package-name/core/tsconfig.lib.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "keepNames": true,
                "declarationRootDir": "packages/package-name/core/src",
                "thirdParty": false,
                "deleteOutputPath": true,
                "external": ["vscode", "js-yaml"]
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"],
            "options": {}
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
            ],
            "options": {}
        }
    }
}
```

**`tsconfig.lib.json`:**

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "./dist",
        "declaration": true,
        "declarationMap": true,
        "types": ["node"]
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### **Tool Package Configuration**

**`package.json`:**

```json
{
    "name": "@fux/tool-name",
    "version": "0.1.0",
    "type": "module",
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "dependencies": {
        "dependency1": "^1.0.0"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/tool-name",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "main": "libs/tools/tool-name/src/index.ts",
                "outputPath": "libs/tools/tool-name/dist",
                "tsConfig": "libs/tools/tool-name/tsconfig.json",
                "platform": "node",
                "format": ["esm"],
                "bundle": false,
                "sourcemap": true,
                "target": "es2022",
                "external": ["dependency1", "dependency2"]
            }
        }
    }
}
```

### **Extension Package Configuration**

**`package.json`:**

```json
{
    "name": "fux-package-name",
    "displayName": "F-UX: Package Name",
    "description": "Description of the extension",
    "publisher": "NewRealityDesigns",
    "version": "0.1.0",
    "private": true,
    "main": "./dist/extension.cjs",
    "dependencies": {
        "@fux/package-name-core": "workspace:*",
        "js-yaml": "^4.1.0"
    },
    "devDependencies": {
        "@types/node": "^24.0.10",
        "@types/vscode": "^1.99.3",
        "@types/js-yaml": "^4.0.9",
        "typescript": "^5.8.3",
        "vitest": "^3.2.4",
        "@vitest/coverage-v8": "^3.2.4"
    },
    "contributes": {
        "commands": [
            {
                "command": "fux-package-name.commandName",
                "title": "Package Name: Command Title",
                "category": "Package Name"
            }
        ]
    },
    "activationEvents": ["*"],
    "engines": {
        "vscode": "^1.99.3"
    }
}
```

**`project.json`:**

```json
{
    "name": "@fux/package-name-ext",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "dependsOn": ["^build"],
            "options": {
                "entryPoints": ["packages/package-name/ext/src/extension.ts"],
                "outputPath": "packages/package-name/ext/dist",
                "format": ["cjs"],
                "metafile": true,
                "platform": "node",
                "bundle": true,
                "external": ["vscode", "js-yaml"],
                "sourcemap": true,
                "main": "packages/package-name/ext/src/extension.ts",
                "tsConfig": "packages/package-name/ext/tsconfig.json",
                "assets": [
                    {
                        "glob": "**/*",
                        "input": "packages/package-name/ext/assets/",
                        "output": "./assets/"
                    }
                ],
                "thirdParty": true
            }
        },
        "package": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node scripts/create-vsix.js packages/package-name/ext vsix_packages"
            }
        },
        "package:dev": {
            "executor": "nx:run-commands",
            "dependsOn": ["build"],
            "options": {
                "command": "node scripts/create-vsix.js packages/package-name/ext vsix_packages --dev",
                "outputPath": "vsix_packages"
            },
            "cache": false,
            "inputs": ["production", "^production", "{workspaceRoot}/scripts/create-vsix.js"],
            "outputs": ["{options.outputPath}"]
        },
        "test": {
            "executor": "@nx/vite:test",
            "outputs": ["{options.reportsDirectory}"],
            "dependsOn": ["^build"],
            "options": {}
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
            ],
            "options": {}
        }
    }
}
```

**`tsconfig.json`:**

```json
{
    "extends": "../../../tsconfig.base.json",
    "compilerOptions": {
        "target": "ES2022",
        "module": "CommonJS",
        "moduleResolution": "node",
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

## **Implementation Patterns**

### **Core Package Implementation**

**Service Pattern:**

```typescript
// packages/package-name/core/src/features/feature-name/services/Feature.service.ts
export class FeatureService {
    constructor(
        private readonly dependency1: IDependency1,
        private readonly dependency2: IDependency2
    ) {}

    async performAction(input: string): Promise<string> {
        // Business logic here
        const result = await this.dependency1.process(input)
        return this.dependency2.format(result)
    }
}
```

**Interface Pattern:**

```typescript
// packages/package-name/core/src/features/feature-name/_interfaces/IFeatureService.ts
export interface IFeatureService {
    performAction(input: string): Promise<string>
}
```

**Export Pattern:**

```typescript
// packages/package-name/core/src/index.ts
// Individual exports for manual tree-shaking
export type { IFeatureService } from './features/feature-name/_interfaces/IFeatureService.js'
export { FeatureService } from './features/feature-name/services/Feature.service.js'
export { constants } from './_config/constants.js'
```

### **Extension Package Implementation**

**Adapter Pattern:**

```typescript
// packages/package-name/ext/src/adapters/VSCodeAdapter.adapter.ts
export class VSCodeAdapter {
    constructor(private readonly vscodeApi: typeof vscode) {}

    async showMessage(message: string): Promise<void> {
        await this.vscodeApi.window.showInformationMessage(message)
    }
}
```

**Extension Entry Point:**

```typescript
// packages/package-name/ext/src/extension.ts
import * as vscode from 'vscode'
import { FeatureService } from '@fux/package-name-core'
import { VSCodeAdapter } from './adapters/VSCodeAdapter.adapter'

export function activate(context: vscode.ExtensionContext): void {
    // Create adapters
    const vscodeAdapter = new VSCodeAdapter(vscode)

    // Create core services
    const featureService = new FeatureService(vscodeAdapter)

    // Register commands
    const disposable = vscode.commands.registerCommand('fux-package-name.commandName', async () => {
        const result = await featureService.performAction('input')
        await vscodeAdapter.showMessage(result)
    })

    context.subscriptions.push(disposable)
}

export function deactivate(): void {}
```

## **Testing Strategy Alignment Workflow**

### **Testing Strategy as Authority**

- **Authority Document**: The `docs/FocusedUX-Testing-Strategy.md` is the authoritative source for all testing dependencies and patterns
- **Alignment Process**: When aligning packages, reference the testing strategy document rather than comparing packages
- **Documentation-First**: Check existing documentation before implementing solutions to prevent reinvention

### **Testing Strategy Alignment Steps**

1. **Reference Testing Strategy**: Check `docs/FocusedUX-Testing-Strategy.md` for required dependencies and patterns
2. **Identify Missing Elements**: Compare package implementation against strategy document requirements
3. **Update Implementation**: Add missing dependencies or configurations to align with strategy
4. **Update Documentation**: Ensure strategy document is complete and current
5. **Verify Alignment**: Run tests to confirm proper alignment

### **Strategy Document Maintenance**

- **Completeness**: Keep testing strategy documentation complete with all required dependencies
- **Current State**: Update strategy document when new patterns or dependencies are identified
- **Authority**: Use strategy document as single source of truth for all testing implementations

## **Testing Patterns**

### **Core Package Testing**

**Test Setup:**

```typescript
// packages/package-name/core/__tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Mock external dependencies
vi.mock('js-yaml', () => ({
    load: vi.fn(),
}))

// Use fake timers globally
beforeAll(() => {
    vi.useFakeTimers()
})

afterAll(() => {
    vi.useRealTimers()
})

// Keep mocks clean between tests
afterEach(() => {
    vi.clearAllMocks()
})
```

**Service Test Pattern:**

```typescript
// packages/package-name/core/__tests__/functional/FeatureService.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { FeatureService } from '../../src/features/feature-name/services/Feature.service.js'
import type {
    IDependency1,
    IDependency2,
} from '../../src/features/feature-name/_interfaces/IFeatureService.js'

// Mock dependencies
class MockDependency1 implements IDependency1 {
    process = vi.fn()
}

class MockDependency2 implements IDependency2 {
    format = vi.fn()
}

describe('FeatureService', () => {
    let service: FeatureService
    let mockDep1: MockDependency1
    let mockDep2: MockDependency2

    beforeEach(() => {
        mockDep1 = new MockDependency1()
        mockDep2 = new MockDependency2()
        service = new FeatureService(mockDep1, mockDep2)
    })

    describe('performAction', () => {
        it('should process input correctly', async () => {
            // Arrange
            mockDep1.process.mockResolvedValue('processed')
            mockDep2.format.mockReturnValue('formatted')

            // Act
            const result = await service.performAction('test')

            // Assert
            expect(result).toBe('formatted')
            expect(mockDep1.process).toHaveBeenCalledWith('test')
            expect(mockDep2.format).toHaveBeenCalledWith('processed')
        })
    })
})
```

### **Extension Package Testing**

**Test Setup:**

```typescript
// packages/package-name/ext/__tests__/_setup.ts
import { beforeEach, afterEach } from 'vitest'

// Global test setup for extension package
beforeEach(() => {
    // Clear any test state
})

afterEach(() => {
    // Cleanup after each test
})
```

**Extension Test Pattern:**

```typescript
// packages/package-name/ext/__tests__/functional/extension.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activate, deactivate } from '../../src/extension.js'

describe('Extension', () => {
    let mockContext: any

    beforeEach(() => {
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
    })

    describe('activate', () => {
        it('should activate without errors', () => {
            expect(() => {
                activate(mockContext)
            }).not.toThrow()
        })

        it('should register commands', () => {
            activate(mockContext)
            expect(mockContext.subscriptions).toHaveLength(1)
        })
    })

    describe('deactivate', () => {
        it('should deactivate without errors', () => {
            expect(() => {
                deactivate()
            }).not.toThrow()
        })
    })
})
```

## **Vitest Configuration**

### **Core Package Test Config**

```typescript
// packages/package-name/core/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
        },
    })
)
```

### **Extension Package Test Config**

```typescript
// packages/package-name/ext/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
        },
    })
)
```

## **Key Architectural Principles**

### **1. No DI Containers**

- Core packages use direct service instantiation
- Extension packages use direct service instantiation
- Dependencies are passed as constructor parameters
- Simple and testable architecture

### **2. No Shared Dependencies in Core**

- Core packages are self-contained "guinea pig" packages
- Only external dependencies are minimal utilities (e.g., `js-yaml`)
- No `@fux/shared` or `@fux/mockly` dependencies
- Enables independent testing and validation

### **3. Thin Extension Wrappers**

- Extension packages contain only VSCode integration code
- Business logic is in core packages
- Adapters abstract VSCode API calls
- Minimal extension code

### **4. Simple Testing**

- Core packages test business logic with mock dependencies
- Extension packages test VSCode integration only
- No complex DI container mocking
- Clear separation of concerns

### **5. Individual Exports**

- Core packages use individual exports for tree-shaking
- No barrel exports for better optimization
- Clear public API surface

## **Command Aliases**

### **Core Package Commands**

```bash
# Build core package
{alias}c build

# Test core package (functional)
{alias}c test

# Test core package (coverage)
{alias}c test:full

# TypeScript check
{alias}c tsc

# Lint core package
{alias}c lint
```

### **Extension Package Commands**

```bash
# Build extension package
{alias}e build

# Package extension for distribution
{alias}e package

# Package extension for development
{alias}e package:dev

# Test extension package (functional)
{alias}e test

# Test extension package (coverage)
{alias}e test:full

# TypeScript check
{alias}e tsc

# Lint extension package
{alias}e lint
```

### **Combined Package Commands**

```bash
# Test both packages
{alias} test

# Build both packages
{alias} build

# TypeScript check both packages
{alias} tsc
```

## **Migration from Old Architecture**

### **Step 1: Extract Business Logic**

1. Move business logic to core package
2. Create service interfaces
3. Remove VSCode dependencies from core

### **Step 2: Create VSCode Adapters**

1. Abstract VSCode API calls
2. Create adapter interfaces
3. Implement adapter classes

### **Step 3: Update Extension**

1. Import core services
2. Use adapters for VSCode operations
3. Register commands with core logic

### **Step 4: Update Tests**

1. Move service tests to core package
2. Create adapter tests in extension package
3. Update extension tests with new architecture

### **Step 5: Update Build Configuration**

1. Configure Nx targets for both packages
2. Set up Vitest configurations
3. Update command aliases

## **Quality Gates**

### **Core Package**

- [ ] All services have functional tests
- [ ] 100% test coverage for business logic
- [ ] No VSCode dependencies
- [ ] Clean interfaces defined
- [ ] TypeScript compilation passes

### **Extension Package**

- [ ] Extension activation test passes
- [ ] All adapters have tests
- [ ] Command registration tested
- [ ] Error handling tested
- [ ] TypeScript compilation passes

### **Integration**

- [ ] Both packages build successfully
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Clean separation of concerns

## **Conclusion**

This architecture provides:

- **Clean separation of concerns** between business logic and VSCode integration
- **Simple and testable** code structure without complex DI containers
- **Independent core packages** that can be tested and validated separately
- **Thin extension wrappers** that focus only on VSCode integration
- **Consistent patterns** across all packages in the monorepo

The confirmed implementations in Ghost Writer and Project Butler demonstrate that this architecture is working, maintainable, and scalable for the FocusedUX monorepo.

---

## **Asset Processing Workflow**

### **Core Package Asset Processing**

**Workflow Steps**:

1. **Asset Discovery**: Scan source directories for SVG, theme, and image assets
2. **Manifest Generation**: Create comprehensive asset metadata with hashes and timestamps
3. **Change Detection**: Compare current state with manifest to identify modifications
4. **Selective Processing**: Process only changed assets for efficiency
5. **Output Generation**: Store processed assets in core package's dist/assets directory

**Nx Target Usage**:

```bash
# Full asset processing with change detection
{alias} process-assets

# Incremental processing (changed assets only)
{alias} process-assets:incremental

# Force all assets processing
{alias} process-assets:all

# Generate manifest only
{alias} assets:manifest

# Detect changes only
{alias} assets:detect
```

### **Extension Package Asset Copying**

**Workflow Steps**:

1. **Dependency Check**: Ensure core package assets are processed
2. **Asset Copying**: Copy processed assets from core's dist/assets to extension's dist/assets
3. **Structure Preservation**: Maintain directory structure during copying
4. **Validation**: Verify copied assets are accessible

**Nx Target Usage**:

```bash
# Copy assets from core to extension
{alias} copy-assets
```

### **Build Integration**

**Target Dependencies**:

- Core package: `build` → `process-assets`
- Extension package: `copy-assets` → `@fux/dynamicons-core:process-assets` → `build`

**Critical Rules**:

- Asset processing MUST occur AFTER core package build
- Extension copying MUST occur AFTER core asset processing
- Never reverse dependency order to prevent asset deletion

---

## **Performance Measurement Protocol**

### **Before Implementation**

**Baseline Establishment**:

1. **Build Time Measurement**: Measure current build times for asset-heavy builds
2. **Asset Processing Time**: Measure time spent on asset operations
3. **Cache Hit Rates**: Establish current Nx cache effectiveness
4. **Memory Usage**: Measure peak memory during asset processing

**Measurement Commands**:

```bash
# Measure build time
time {alias} build

# Measure asset processing time
time {alias} process-assets

# Check cache status
nx show projects --graph
```

### **After Implementation**

**Performance Validation**:

1. **Build Time Comparison**: Compare before/after build times
2. **Asset Processing Efficiency**: Measure incremental vs full processing times
3. **Cache Effectiveness**: Verify Nx caching improvements
4. **Memory Optimization**: Confirm reduced memory usage

**Validation Commands**:

```bash
# Measure optimized build time
time {alias} build

# Test incremental processing
time {alias} process-assets:incremental

# Verify cache hits
nx show projects --graph
```

### **Performance Documentation**

**Required Metrics**:

- Build time reduction percentage
- Asset processing time improvement
- Cache hit rate improvement
- Memory usage optimization
- Specific performance bottlenecks addressed

**Documentation Format**:

```markdown
### Performance Impact

- **Build Time Reduction**: X% improvement
- **Asset Processing**: X% faster
- **Cache Efficiency**: X% improvement
- **Memory Usage**: X% reduction
```

---

## **Documentation-First Approach**

### **Development Workflow**

**Before Implementation**:

1. **Check Existing Documentation**: Review `./docs/` for existing solutions
2. **Reference Established Patterns**: Use documented patterns when available
3. **Documentation Gap Analysis**: Identify what needs to be documented
4. **Pattern Validation**: Verify patterns align with architectural principles

**During Implementation**:

1. **Follow Documented Patterns**: Implement using established guidance
2. **Document Deviations**: Note any deviations from documented patterns
3. **Update Documentation**: Keep documentation current with implementation
4. **Pattern Validation**: Ensure implementation follows documented principles

**After Implementation**:

1. **Document Success**: Record successful implementations in Actions Log
2. **Document Failures**: Record what was tried and failed
3. **Update Strategies**: Enhance documentation with new learnings
4. **Pattern Recognition**: Identify new patterns for future use

### **Documentation Sources**

**Primary Sources**:

- `docs/Architecture.md` - Architectural patterns and principles
- `docs/SOP.md` - Operational procedures and workflows
- `docs/FocusedUX-Testing-Strategy.md` - Testing patterns and strategies
- `docs/Actions-Log.md` - Previous implementations and lessons learned

**Documentation Priority**:

1. **Architecture**: Core principles and patterns
2. **SOP**: Operational procedures and workflows
3. **Testing**: Testing strategies and patterns
4. **Actions Log**: Implementation history and lessons learned

### **Anti-Pattern Prevention**

**Documentation Violations**:

- Creating new solutions when comprehensive documentation exists
- Performing unnecessary analysis when documented patterns are available
- Asking questions already answered in documentation
- Overcomplicating responses instead of following established guidance

**Required Actions**:

- Always check docs first before creating new solutions
- Reference existing patterns directly in responses
- Implement documented solutions without additional analysis
- Acknowledge documentation as the source of the approach
