# FocusedUX Testing Strategy

## **REFERENCE FILES**

### **Global Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`

### **Testing Documentation References**

- **BASE_TESTING_STRATEGY**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **MOCK_STRATEGY_GENERAL**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **TROUBLESHOOTING_TESTS**: `docs/testing/(AI) _Troubleshooting- Tests.md`
- **COVERAGE_STRATEGY**: `docs/testing/_Testing-Strategy(Coverage-Only).md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for all testing decisions across all package types.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All rules apply to all actions
4. **FAILURE TO COMPLY**: Violating these rules constitutes a critical protocol violation

---

## **1. :: Mock Strategy Architecture**

### **1.1. :: Mock Strategy Types and Selection**

The FocusedUX mock strategy follows a hierarchical architecture based on package types and dependency patterns:

#### **Mock Strategy Hierarchy**

- **`@ms-gen`** → General mocking (Node.js built-ins like `fs/promises`, `path`, `os`, `child_process`, etc.)
- **`@ms-lib`** → Shared/consumed libraries
- **`@ms-core`** → Business logic packages
- **`@ms-ext`** → VSCode extension wrappers
- **`@ms-util`** → Repo utilities
- **`@ms-plugin`** → Plugin packages
- **`@ms-tool`** → Direct execution tools

#### **Decision Tree for Mock Strategy Selection**

1. **Package Type Check** (see `@_Package-Archetypes.md`):
    - **Core Package** → Use `@ms-core`
    - **Extension Package** → Use `@ms-ext`
    - **Shared Library** → Use `@ms-lib`
    - **Utility Package** → Use `@ms-util`
    - **Plugin Package** → Use `@ms-plugin`
    - **Tool Package** → Use `@ms-tool`

2. **Dependency Pattern Check**:
    - **Node.js built-ins only** → Use `@ms-gen`
    - **Node.js built-ins + business logic** → Use `@ms-core` (extends `@ms-gen`)
    - **Node.js built-ins + VSCode APIs** → Use `@ms-ext` (extends `@ms-gen`)
    - **Third-party libraries** → Use `@ms-lib`

3. **Mock Strategy Extension Pattern**:
    - All strategies extend `@ms-gen` for common Node.js modules
    - Package-specific strategies add their specialized mocks
    - Project-specific builders extend global builders while maintaining fluent APIs

### **1.2. :: ESM Module Import Resolution**

#### **ESM Compatibility Requirements**

All packages in FocusedUX use `"type": "module"` and require ESM-compatible imports:

- **✅ CORRECT**: `import { setupCoreTestEnvironment } from '@ms-core'`
- **❌ INCORRECT**: `const { setupCoreTestEnvironment } = require('@ms-core')`

#### **Dual Configuration Requirements**

Path aliases must be configured in **both** locations:

1. **`tsconfig.base.json`** (build-time resolution):

    ```json
    {
        "compilerOptions": {
            "baseUrl": ".",
            "paths": {
                "@ms-gen": ["libs/mock-strategy/src/gen/index.ts"],
                "@ms-core": ["libs/mock-strategy/src/core/index.ts"],
                "@ms-ext": ["libs/mock-strategy/src/ext/index.ts"]
            }
        }
    }
    ```

2. **`vitest.config.ts`** (test-time resolution):
    ```typescript
    export default defineConfig({
        resolve: {
            alias: {
                '@ms-gen': resolve(__dirname, '../../../libs/mock-strategy/src/gen/index.ts'),
                '@ms-core': resolve(__dirname, '../../../libs/mock-strategy/src/core/index.ts'),
                '@ms-ext': resolve(__dirname, '../../../libs/mock-strategy/src/ext/index.ts'),
            },
        },
    })
    ```

#### **ESM Testing Setup Checklist**

- [ ] Package has `"type": "module"` in `package.json`
- [ ] All imports use ESM syntax (`import` not `require`)
- [ ] Path aliases configured in `tsconfig.base.json`
- [ ] Path aliases configured in `vitest.config.ts`
- [ ] Mock files use `.ts` extensions
- [ ] No dynamic `require()` calls in test files

### **1.3. :: Mock Strategy Extension Pattern**

#### **Extension Architecture**

Project-specific mock builders extend global builders while maintaining specialized scenario-building capabilities:

```typescript
// Global builder provides base functionality
export class GeneralMockBuilder {
    constructor(protected mocks: GeneralTestMocks) {}

    fileRead(options: FileSystemScenarioOptions): GeneralMockBuilder {
        setupFileReadScenario(this.mocks, options)
        return this
    }
}

// Project-specific builder extends and specializes
export class ProjectButlerMockBuilder extends GeneralMockBuilder {
    constructor(mocks: CoreTestMocks) {
        super(mocks)
    }

    backup(options: BackupScenarioOptions): ProjectButlerMockBuilder {
        setupBackupSuccessScenario(this.mocks, options)
        return this
    }

    override build(): CoreTestMocks {
        return this.mocks as CoreTestMocks
    }
}
```

#### **Extension Guidelines**

- **When to Extend**: Always extend global builders to maintain standardization
- **When to Replace**: Never replace - always extend to preserve existing APIs
- **Interface Preservation**: Maintain project-specific fluent APIs
- **Type Safety**: Override `build()` method to return correct interface type

---

## **2. :: Build Target Dependency Strategy**

### **2.1. :: Dual-Build Testing Strategy**

Different test types benefit from different build configurations:

#### **Build Configuration by Test Type**

- **Unit Tests** → Depend on `build:dev` (unbundled, sourcemaps, declarations)
    - **Benefits**: Better debugging, faster iteration, detailed error traces
    - **Use Cases**: `test`, `test:coverage-tests`, `test:deps`

- **Integration Tests** → Depend on `build` (bundled, minified, production-ready)
    - **Benefits**: Real-world validation, production artifact testing
    - **Use Cases**: `test:integration`

#### **Configuration Example**

```json
{
    "targets": {
        "test": {
            "dependsOn": ["build:dev", "^build"]
        },
        "test:integration": {
            "dependsOn": ["build", "^build"]
        }
    }
}
```

#### **Rationale**

- **Unit Tests with Dev Builds**: Enable step-through debugging, detailed stack traces, and faster rebuild cycles
- **Integration Tests with Prod Builds**: Validate actual production artifacts and real-world performance characteristics

---

## **3. :: Function Name Matching in Mock Strategy Integration**

### **3.1. :: Critical Requirements**

When integrating with global mock strategies, exact function name matching is essential:

- **✅ CORRECT**: Import exact names from global strategy
- **❌ INCORRECT**: Assume prefixed function names

#### **Common Mistakes**

- **Assumption**: `setupCoreFileSystemMocks` (with prefix)
- **Reality**: `setupFileSystemMocks` (no prefix)
- **Solution**: Check actual exports and use exact names

#### **Import Aliasing for Name Conflicts**

```typescript
import {
    setupFileSystemMocks as setupGlobalFileSystemMocks,
    setupPathMocks as setupGlobalPathMocks,
} from '@ms-gen'
```

### **3.2. :: Reference Documentation**

Each global mock strategy provides these exact function names:

- **`@ms-gen`**: `setupFileSystemMocks`, `setupPathMocks`, `setupOsMocks`, `setupProcessMocks`
- **`@ms-core`**: `setupCoreTestEnvironment`, `resetCoreMocks`
- **`@ms-ext`**: `setupExtensionTestEnvironment`, `resetExtensionMocks`, `setupVSCodeMocks`

---

## **4. :: Troubleshooting Common Issues**

### **4.1. :: Module Resolution Errors**

**Error**: `Cannot find package '@ms-core' imported from...`

**Solutions**:

1. Verify path aliases in both `tsconfig.base.json` and `vitest.config.ts`
2. Check that mock strategy package is built (`pae ms b`)
3. Ensure ESM import syntax is used

### **4.2. :: Function Not Found Errors**

**Error**: `(0, setupFileSystemMocks) is not a function`

**Solutions**:

1. Check exact function names in global mock strategy exports
2. Use import aliasing to avoid naming conflicts
3. Verify imports are from correct strategy package

### **4.3. :: Build Dependency Issues**

**Error**: Tests fail due to build configuration

**Solutions**:

1. Verify test targets depend on appropriate build configuration
2. Use `build:dev` for unit tests, `build` for integration tests
3. Check that build targets exist in `project.json`

---

## **5. :: Package-Specific Testing Strategies**

For detailed package-specific strategies, see:

- **Core Packages**: `docs/testing/(AI) _Strategy- Specific- Core.md`
- **Extension Packages**: `docs/testing/(AI) _Strategy- Specific- Ext.md`
- **Shared Libraries**: `docs/testing/(AI) _Strategy- Specific- Libs.md`
- **Utilities**: `docs/testing/(AI) _Strategy- Specific- Utilities.md`
- **Plugins**: `docs/testing/(AI) _Strategy- Specific- Plugins.md`

---

## **6. :: Implementation Checklist**

### **New Package Testing Setup**

- [ ] Determine package type and appropriate mock strategy
- [ ] Configure path aliases in `tsconfig.base.json`
- [ ] Configure path aliases in `vitest.config.ts`
- [ ] Create project-specific mock helpers extending global strategy
- [ ] Create project-specific scenario builder extending global builder
- [ ] Configure appropriate build dependencies for test targets
- [ ] Verify ESM compatibility and import syntax

### **Existing Package Migration**

- [ ] Update mock strategy selection based on package type
- [ ] Migrate to global mock strategy while preserving scenario builders
- [ ] Update imports to use exact function names
- [ ] Configure dual path aliases for ESM compatibility
- [ ] Test migration with existing test suite
- [ ] Update documentation references
