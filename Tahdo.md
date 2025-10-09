# Mock Strategy Migration - Lessons Learned

## 1. :: Shorthand Reference Mapping and Explanations

### 1.1. :: Alias Mapping

- **\_strat**: `docs/testing/_Testing-Strategy.md`
- **\_ts**: `docs/testing/_Troubleshooting - Tests.md`
- **lib guide**: `docs/testing/Library-Testing-AI-Guide.md`

### 1.2. :: Details for shorthand execution details:

#### 1.2.1. Add to strat

You will understand that _add to strat_ means to do the following:

1. Add the needed documentation to **\_strat**
2. Ensure there is a `### **Documentation References**` to **\_strat** within **guide**
3. Add or modify a concise section with a pointer to the main file for more detail to **guide**

#### 1.2.2. Add to trouble

You will understand that _add to trouble_ means to do the following:

1. Add the needed documentation to **\_ts**
2. Ensure there is a `### **Documentation References**` to **\_strat** within **guide**
3. Add or modify a concise section with a pointer to the main file for more detail to **guide**

---

## 2. :: Mock Strategy Architecture Classification

- Learning: Node.js built-ins like `fs/promises`, `path`, `os` are generic system-level modules that should be in shared/common mock strategies, not tied to specific package types like "lib" or "core"
- Pattern: Proper separation of concerns in mock strategy hierarchy where common Node.js modules belong in general sections, while business logic and extension-specific mocks have dedicated strategies
- Implementation: Reorganized mock strategy to use `@ms-core` for business logic packages instead of `@ms-lib`, recognizing that Node.js built-ins are not library-specific but core system dependencies
- Benefit: Creates logical separation where common system modules are reusable across all package types, while specialized mocks remain appropriately scoped

- **Not documented**: The distinction between what belongs in `@ms-lib` vs `@ms-core` vs `@ms-ext` mock strategies is not clearly documented in testing strategy documentation

- **Mistake/Assumption**: Initially assumed `project-butler-core` should use `@ms-lib` mock strategy because it contained Node.js built-ins
- **Correction**: User correctly identified that Node.js built-ins are not library-specific and should be in core-level mocking, leading to proper use of `@ms-core` strategy

- **Recommendation**:
    - Add clear documentation in testing strategy explaining the distinction between mock strategy types: `@ms-lib` for shared utilities, `@ms-core` for business logic, `@ms-ext` for VSCode extensions
    - Create decision tree documentation for choosing appropriate mock strategy based on package type and dependency patterns

- **Response**: ❌
    - The Node.js built-ins are not even specific to core packages either. We need to create a "general".
    - Add clear documentation in testing strategy explaining the distinction between mock strategy types:
        - `@ms-gen` for general mocking, such as node built-ins
        - `@ms-lib` for shared/consumed libraries
        - `@ms-core` for business logic
        - `@ms-ext` for VSCode extension wrappers
        - `@ms-util` for repo utilities
        - Create decision tree documentation for choosing appropriate mock strategy based on
            - package type
            - dependency patterns
            - @\_Package-Archetypes.md

---

## 3. :: ESM Module Import Resolution Patterns

- Learning: ESM packages with `"type": "module"` cannot use `require()` statements and need proper ESM import syntax, even in test files
- Pattern: Use direct ESM imports at module level instead of dynamic `require()` calls within functions, with proper alias resolution through `tsconfig.base.json` paths and `vitest.config.ts` resolve aliases
- Implementation: Converted `require('@ms-core')` calls to direct imports like `import { setupCoreTestEnvironment } from '@ms-core'` and configured path aliases in both TypeScript config and Vitest config
- Benefit: Eliminates module resolution errors and ensures consistent ESM compatibility across all test files

- **Not documented**: The requirement for ESM-compatible imports in test files and the dual configuration needed in both `tsconfig.base.json` and `vitest.config.ts` for path aliases

- **Mistake/Assumption**: Attempted to use `require()` statements within functions in ESM packages, causing "is not a function" errors during test execution
- **Correction**: User suggested using path aliases in `tsconfig.base.json`, which led to proper ESM import configuration and resolution

- **Recommendation**:
    - Document ESM compatibility requirements for test files in testing strategy
    - Add troubleshooting section covering dual configuration requirements for path aliases in both TypeScript and Vitest configs
    - Create checklist for ESM package testing setup including import syntax requirements

- **Response**: ⚠️
    - Document ESM compatibility requirements for test files in testing strategy
    - Add troubleshooting section covering dual configuration requirements for path aliases in both TypeScript and Vitest configs
        - Create checklist for ESM package testing setup including import syntax requirements

---

## 4. :: Mock Strategy Extension Pattern

- Learning: Project-specific mock builders can successfully extend global mock builders while maintaining their specialized scenario-building capabilities
- Pattern: Create project-specific mock builders that extend global builders (e.g., `ProjectButlerMockBuilder extends CoreMockBuilder`) and override the `build()` method to return the correct interface type
- Implementation: Refactored existing scenario builders to extend global builders, maintaining all existing fluent API methods while gaining access to global mock setup functions
- Benefit: Combines the best of both worlds - standardized global mocking infrastructure with project-specific scenario builders that remain readable and maintainable

- **Not documented**: The pattern for extending global mock builders while maintaining project-specific interfaces and fluent APIs

- **Mistake/Assumption**: Initially considered replacing project-specific scenario builders entirely with global ones, losing valuable domain-specific fluent APIs
- **Correction**: Realized that extending global builders while keeping project-specific builders as extensions preserves both standardization and usability

- **Recommendation**:
    - Document the extension pattern for mock builders in testing strategy
    - Create template examples showing how to extend global builders while maintaining project-specific fluent APIs
    - Add guidelines for when to extend vs replace existing mock builders

- **Response**: ⚠️
    - Document the extension pattern for mock builders in testing strategy
    - Create template examples showing how to extend global builders while maintaining project-specific fluent APIs
    - Add guidelines for when to extend vs replace existing mock builders

---

## 5. :: Build Target Dependency Strategy for Testing

- Learning: Different test types benefit from different build configurations - unit tests work better with dev builds (unbundled, sourcemaps) while integration tests should use production builds (bundled, minified)
- Pattern: Configure test targets with appropriate build dependencies - unit tests depend on `build:dev` for better debugging, integration tests depend on `build` for real-world validation
- Implementation: Updated `project.json` to have unit tests (`test`, `test:coverage-tests`, `test:deps`) depend on `build:dev` while integration tests (`test:integration`) depend on production `build`
- Benefit: Provides optimal debugging experience for unit tests while ensuring integration tests validate actual production artifacts

- **Not documented**: The rationale for different build dependencies for different test types and the specific benefits of dev vs prod builds for testing scenarios

- **Mistake/Assumption**: Initially configured all test targets to use production builds, missing the debugging benefits of dev builds for unit testing
- **Correction**: User provided critical feedback that integration tests should use prod builds while unit tests benefit from dev builds, leading to optimal dual-build strategy

- **Recommendation**:
    - Document the dual-build testing strategy in testing strategy with clear rationale for each test type
    - Add configuration examples showing proper build dependencies for different test targets
    - Create troubleshooting guide for test debugging issues related to build configuration

- **Response**: ⚠️
    - Document the dual-build testing strategy in testing strategy with clear rationale for each test type
    - Add configuration examples showing proper build dependencies for different test targets
    - Create troubleshooting guide for test debugging issues related to build configuration

---

## 6. :: Package Resolution and Alias Configuration

- Learning: Complex monorepo setups require coordinated configuration across multiple files - path aliases must be defined in both `tsconfig.base.json` and individual `vitest.config.ts` files for proper resolution
- Pattern: Use path aliases in base TypeScript config with corresponding resolve aliases in Vitest config, ensuring both build-time and test-time resolution work correctly
- Implementation: Added path aliases like `@ms-core`, `@ms-ext` to `tsconfig.base.json` and corresponding resolve aliases in individual package `vitest.config.ts` files using absolute path resolution
- Benefit: Enables clean import syntax while maintaining proper module resolution across different execution contexts (build vs test)

- **Not documented**: The dual configuration requirements for path aliases and the specific pattern for Vitest resolve alias configuration using absolute paths

- **Mistake/Assumption**: Initially tried using direct relative imports and then package dependencies, not recognizing the need for coordinated alias configuration
- **Correction**: User suggested path aliases and provided the correct alias naming convention, leading to successful resolution strategy

- **Recommendation**:
    - Document the dual configuration pattern for path aliases in monorepo testing setup
    - Add troubleshooting section for module resolution issues in test environments
    - Create template configurations for new packages showing proper alias setup

- **Response**: ⚠️
    - Document the dual configuration pattern for path aliases in monorepo testing setup
    - Add troubleshooting section for module resolution issues in test environments
    - Create template configurations for new packages showing proper alias setup

---

## 7. :: Function Name Matching in Mock Strategy Integration

- Learning: When integrating with global mock strategies, exact function name matching is critical - imported functions must match the exact names exported by the global strategy
- Pattern: Use proper import aliasing when function names don't match exactly between global and local implementations (e.g., `setupFileSystemMocks as setupGlobalFileSystemMocks`)
- Implementation: Corrected imports to match exact function names from global mock strategy, using aliasing where needed to avoid naming conflicts
- Benefit: Prevents "is not a function" errors and ensures proper integration with global mock infrastructure

- **Not documented**: The importance of exact function name matching when integrating with global mock strategies and the use of import aliasing for name conflicts

- **Mistake/Assumption**: Assumed function names would be prefixed (e.g., `setupCoreFileSystemMocks`) when they were actually named without prefixes (e.g., `setupFileSystemMocks`)
- **Correction**: Checked actual exports from global mock strategy and corrected import names to match exactly

- **Recommendation**:
    - Document the function name matching requirement in mock strategy integration guidelines
    - Add troubleshooting section for "is not a function" errors related to import name mismatches
    - Create reference documentation showing exact function names available in each global mock strategy

- **Response**: ✅ No action required

---

- [1. :: Shorthand Reference Mapping and Explanations](#1--shorthand-reference-mapping-and-explanations)
    - [1.1. :: Alias Mapping](#11--alias-mapping)
    - [1.2. :: Details for shorthand execution details:](#12--details-for-shorthand-execution-details)
        - [1.2.1. Add to strat](#121-add-to-strat)
        - [1.2.2. Add to trouble](#122-add-to-trouble)
- [2. :: Mock Strategy Architecture Classification](#2--mock-strategy-architecture-classification)
- [3. :: ESM Module Import Resolution Patterns](#3--esm-module-import-resolution-patterns)
- [4. :: Mock Strategy Extension Pattern](#4--mock-strategy-extension-pattern)
- [5. :: Build Target Dependency Strategy for Testing](#5--build-target-dependency-strategy-for-testing)
- [6. :: Package Resolution and Alias Configuration](#6--package-resolution-and-alias-configuration)
- [7. :: Function Name Matching in Mock Strategy Integration](#7--function-name-matching-in-mock-strategy-integration)
- [High‑impact, non‑ESLint project graph optimizations](#highimpact-noneslint-project-graph-optimizations)
- [Dependency Graph Hygiene – Findings and Recommendations](#dependency-graph-hygiene--findings-and-recommendations)
    - [Boundary Enforcement (Proposed depConstraints – warn)](#boundary-enforcement-proposed-depconstraints--warn)
    - [Tags and Constraints](#tags-and-constraints)
    - [Release Config Noise (Non‑blocking)](#release-config-noise-nonblocking)
    - [Target/Outputs Hygiene](#targetoutputs-hygiene)

## High‑impact, non‑ESLint project graph optimizations

Report and explain the findings from:

<!-- 1. Affected‑only everywhere (not used)
    - Prefer `nx affected -t build,test,lint --parallel` over all‑project scans.
    - In CI use merge base; locally use `--base` when needed. -->

2. Target defaults and inputs
    - Tighten `namedInputs.default` to exclude docs/assets/fixtures/videos.
    - Create lean `namedInputs.lint`/`namedInputs.test`; avoid `**/*` catch‑alls.
    - Keep `targetDefaults.build/test/lint` on minimal named inputs.

3. Dependency graph hygiene
    - Remove deprecated/unused projects and targets.
    - Fix circular deps; enforce boundaries with focused `depConstraints` (warn).
    - Use tags to constrain cross‑area imports (shrinks reachable graph).

4. TypeScript config scope
    - Narrow `tsconfig.*.json` includes to `src/**/*`.
    - Reduce `paths` wildcards; prefer precise mappings.
    - Add project refs only for buildable, truly depended‑on libs.

5. Executor/output slimming
    - Ensure each target has `outputs` for caching.
    - Split heavyweight meta targets to avoid graph fan‑out.

6. Nx daemon and cache
    - Keep daemon enabled; avoid toggling.
    - Use Nx Cloud for remote cache; use `--skip-nx-cache` only for audits.
    - Prefer `run-many --affected`; bound `--maxParallel`.

7. File watching and ignore lists
    - Expand `.gitignore`/`.nxignore` to exclude screenshots/recordings/datasets.
    - Exclude generated artifacts from `namedInputs.default`.

<!-- [✔] Tooling/plugin footprint
    - Remove unused Nx plugins.
    - Avoid project‑graph plugins that scan non‑code files.
    - Consolidate custom executors; reuse built‑ins. -->

9. Build system externalization
    - Externalize big deps and Node/VSC APIs in esbuild.
    - Keep non‑runtime deps in `devDependencies` to reduce transitive graph.

10. CI flow
    - Use affected runs + parallelized steps by target; restore Nx cache early.
    - Gate expensive validations (full coverage, deep audits) to scheduled jobs.

11. Workspace layout and boundaries
    - Flat, predictable layout; avoid deep nesting that expands globs.
    - Use tags (e.g., `type:shared/core/ext/tool`) and one‑way flow constraints.

---

## Dependency Graph Hygiene – Findings and Recommendations

<!--
1. Deprecated/Unused Projects
    - **@fux/source**
        - Root is workspace root (`.`) and exposes no targets.
        - Likely a placeholder/stale artifact; it adds noise to the graph.
        - **Recommendation**: Remove or convert into a documented meta project if intentionally kept. -->

3. Boundary Enforcement (Proposed depConstraints – warn)
    - **shared**: may depend on nothing (or only `shared`).
    - **core**: may depend on `shared` (no `ext`, no `tool`).
    - **ext**: may depend on `core` and `shared` (no `tool`).
    - **tool**: may depend on `shared` (optionally `core`), but not `ext`.
    - Rationale: Enforces one‑way flow (`shared → core → ext`; `tool` separate), reduces reachable subgraphs, and prevents accidental drift.

### Boundary Enforcement (Proposed depConstraints – warn)

- **shared**: may depend on nothing (or only `shared`).
- **core**: may depend on `shared` (no `ext`, no `tool`).
- **ext**: may depend on `core` and `shared` (no `tool`).
- **tool**: may depend on `shared` (optionally `core`), but not `ext`.
- Rationale: Enforces one‑way flow (`shared → core → ext`; `tool` separate), reduces reachable subgraphs, and prevents accidental drift.

### Tags and Constraints

- Adopt and apply a simple taxonomy: `tag:type:shared`, `tag:type:core`, `tag:type:ext`, `tag:type:tool`.
- Enforce via `depConstraints` (warn) to constrain cross‑area imports and shrink the effective graph.

### Release Config Noise (Non‑blocking)

- Duplicate entries observed in the release project list (e.g., `@fux/project-butler-core`, `@fux/project-butler-ext` repeated).
- Recommendation: Deduplicate to reduce maintenance overhead; no runtime impact.

### Target/Outputs Hygiene

- Ensure each custom/heavy target defines `outputs` to maximize cache effectiveness.
- Keep target menus focused; split very heavy “meta” targets to avoid graph fan‑out during planning.
