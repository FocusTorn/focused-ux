# 🎯 PROJECT BUTLER REFACTORING ALIGNMENT TRACKER

## **OBJECTIVE**

Transform Project Butler into a **perfect architectural blueprint** for DI-reliant packages, establishing clean patterns for all other packages in the monorepo.

## **📊 CURRENT STATE ASSESSMENT**

### **✅ ALREADY CORRECT**

- [x] Core service properly injected with dependencies
- [x] Clear interface separation in `_interfaces/` directory
- [x] Extension properly consumes core via DI
- [x] No direct VSCode imports in core
- [x] Clean command registration pattern
- [x] Proper package structure (core + ext)

### **🔧 NEEDS REFACTORING**

- [ ] **Core Package DI Purity** (Remove all `@fux/shared` imports)
- [ ] **Test Infrastructure** (Add Mockly, create `_setup.ts`)
- [ ] **Injection Simplification** (Remove manual service construction)
- [ ] **Interface Localization** (Create local interface definitions)

## **🚀 REFACTORING PHASES**

### **PHASE 1: Core Package DI Purity**

**Status**: ✅ COMPLETED (Corrected Approach)  
**Goal**: 100% DI injection, use VSCode types where appropriate

**Tasks**:

- [x] Remove `@fux/shared` type imports from core
- [x] Use VSCode type imports for standard interfaces (FileStat)
- [x] Ensure all dependencies are injected
- [x] Validate no shared library code in core

**Files to Modify**:

- `packages/project-butler/core/src/services/ProjectButler.service.ts`
- `packages/project-butler/core/src/index.ts`
- `packages/project-butler/core/src/_interfaces/ITerminal.ts`
- `packages/project-butler/core/src/_interfaces/IWindow.ts`

**Success Criteria**:

- Zero imports from `@fux/shared` in core package
- All dependencies injected via constructor
- Use VSCode types for standard interfaces (FileStat)
- Clean separation from VSCode APIs

---

### **PHASE 2: Test Infrastructure Setup**

**Status**: 🚧 NOT STARTED  
**Goal**: Complete test isolation with Mockly

**Tasks**:

- [ ] Add `@fux/mockly` to core devDependencies
- [ ] Create `packages/project-butler/core/__tests__/_setup.ts`
- [ ] Set up Mockly mocks for all VSCode APIs
- [ ] Create test helper functions
- [ ] Ensure no shared library code runs during tests

**Files to Create/Modify**:

- `packages/project-butler/core/package.json` (add mockly)
- `packages/project-butler/core/__tests__/_setup.ts` (new)
- `packages/project-butler/core/vitest.config.ts` (if needed)

**Success Criteria**:

- Mockly properly integrated
- No shared library code execution during tests
- Complete VSCode API mocking
- Test helper functions available

---

### **PHASE 3: Extension Injection Alignment**

**Status**: 🚧 NOT STARTED  
**Goal**: Pure DI patterns, no manual construction

**Tasks**:

- [ ] Simplify `injection.ts` to use pure DI
- [ ] Remove manual service construction
- [ ] Ensure clean shared → core → ext flow
- [ ] Validate extension activation works correctly

**Files to Modify**:

- `packages/project-butler/ext/src/injection.ts`

**Success Criteria**:

- Pure DI container setup
- No manual service construction
- Clean activation flow
- Proper error handling

---

### **PHASE 4: Testing & Validation**

**Status**: 🚧 NOT STARTED  
**Goal**: All tests pass, architecture validated

**Tasks**:

- [ ] Write comprehensive tests for core services
- [ ] Validate DI injection works correctly
- [ ] Ensure test isolation (no shared library execution)
- [ ] Verify extension activation in test environment

**Success Criteria**:

- All tests pass
- DI injection validated
- Test isolation confirmed
- Extension activation verified

## **📚 PATTERNS TO ESTABLISH**

### **DI Injection Pattern**

```typescript
// Target pattern for all core packages
export class CoreService {
    constructor(
        private readonly dependency1: IDependency1,
        private readonly dependency2: IDependency2
        // ... all dependencies injected
    ) {}
}
```

### **Interface Definition Pattern**

```typescript
// Local interfaces in core packages
export interface ILocalInterface {
    // Define locally, don't import from shared
    // This ensures complete decoupling
}
```

### **Test Setup Pattern**

```typescript
// Standard _setup.ts pattern
export function createTestContainer() {
    // Mockly services + local mocks
    // No shared library imports
    // Complete test isolation
}
```

### **Extension Pattern**

```typescript
// Clean extension activation
export async function activate(context: ExtensionContext) {
    const container = await createDIContainer(context)
    const service = container.resolve('serviceName')
    // Clean, simple, DI-driven
}
```

## **🔍 CURRENT ARCHITECTURE ANALYSIS**

### **Core Package Structure**

```
packages/project-butler/core/
├── src/
│   ├── _interfaces/          # Local interface definitions
│   │   ├── IFileSystem.ts
│   │   ├── IProcess.ts
│   │   ├── ITerminal.ts
│   │   ├── IWindow.ts
│   │   └── IProjectButlerService.ts
│   ├── services/
│   │   └── ProjectButler.service.ts  # Main service
│   └── index.ts              # Exports
```

### **Extension Package Structure**

```
packages/project-butler/ext/
├── src/
│   ├── _adapters/            # Local VSCode adapters
│   ├── _config/              # Configuration
│   ├── extension.ts          # Main activation
│   └── injection.ts          # DI container setup
```

## **🎯 SUCCESS METRICS**

### **Architectural Purity**

- [ ] Core package has zero shared library dependencies
- [ ] All services are 100% DI injected
- [ ] No direct VSCode API usage in core
- [ ] Clean interface boundaries

### **Test Infrastructure**

- [ ] Mockly properly integrated
- [ ] Complete test isolation achieved
- [ ] No shared library code execution during tests
- [ ] Comprehensive test coverage

### **Extension Integration**

- [ ] Pure DI container setup
- [ ] Clean activation flow
- [ ] Proper error handling
- [ ] No manual service construction

## **📝 PROGRESS LOG**

### **Session Start**: [Current Date]

**Status**: Planning phase completed, ready to begin Phase 1

**Next Action**: Begin Phase 2 - Test Infrastructure Setup

---

## **🔄 NEXT STEPS**

1. **Start Phase 1**: Begin with core package DI purity
2. **Track Progress**: Update this document as we complete tasks
3. **Validate Patterns**: Ensure each phase establishes reusable patterns
4. **Document Lessons**: Capture insights for other packages

---

_This document tracks the architectural refactoring of Project Butler to establish clean, reusable patterns for all packages in the monorepo._
