# SOP: FocusedUX New Mono-Extension

## 1. :: Project Overview

The **Focused-UX (F-UX)** project is a monorepo designed to produce a suite of VS Code extensions. The architecture follows two primary goals:

1.  **Standalone Extensions:** Each feature (e.g., "Ghost Writer") is developed as a self-contained, installable VS Code extension. This is achieved through a `core`/`ext` package pair.
2.  **Orchestrator Extension:** A primary extension, named **"Focused UX"**, serves as an orchestrator. It consumes the `core` library of each feature, combining all functionalities into a single, unified extension. This provides users with a complete experience without needing to install multiple individual extensions.

This dual approach necessitates a strict separation of concerns.

## 2. :: Package Archetypes

The monorepo consists of four primary package archetypes, each with a distinct purpose and configuration.

- **`shared-services` (Library):** A library containing shared services and abstractions (e.g., file utilities, VS Code API wrappers) intended for runtime use by other packages.
- **`shared-tools` (Tooling):** A library containing shared build scripts, utilities, or other development-time logic. It is built like a `core` library and consumed as a `devDependency` by other packages.
- **`core` (Library):** A framework-agnostic library containing a feature's abstract business logic. It is built to be tree-shakeable and is consumed by `ext` packages and the orchestrator.
- **`ext` (Application):** A lightweight VS Code extension that depends on a `core` package. It contains only VS Code-specific implementation and is bundled into a final, executable artifact.

---

## 3. :: Key Configuration Principles

### 3.1. :: Dependency Flow

- **`core`:** MUST only have production `dependencies` on other `core` or `shared-services` packages. It MAY have `devDependencies` on `shared-tools`.
- **`ext`:** MUST depend on its corresponding `core` package as a production `dependency`. It MAY depend on `shared-tools` as a `devDependency`.
- **`shared-services` & `shared-tools`:** These packages SHOULD have minimal dependencies and MUST NOT depend on any `core` or `ext` packages to avoid circular dependencies.

### 3.2. :: Workspace (`pnpm-workspace.yaml`)

- All new packages, regardless of type, MUST be included in the `packages` list in the root `pnpm-workspace.yaml` file.

### 3.3. :: `core` & `shared-services` Packages (Libraries)

- **Purpose:** To be consumed as a library.
- **Build Strategy:** MUST use the `@nx/js:swc` executor for its `build` target. This executor efficiently handles both TypeScript transpilation and the generation of declaration files (`.d.ts`).
- **`project.json`:** MUST define a single `build` target using the `@nx/js:swc` executor.
- **`tsconfig.lib.json`:** MUST define `"rootDir": "src"` to ensure a clean output structure without the `src` directory in the final `dist` folder.
- **`package.json`:**
    - MUST define `"main"`, `"types"`, and a wildcard `"exports"` map to support deep imports.

### 3.4. :: `ext` Package (Application)

- **Purpose:** To be published as a final, bundled VS Code extension.
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: true` to create a single, optimized output file.
- **`project.json`:** MUST define a single `build` target using the `@nx/esbuild:esbuild` executor.
- **`package.json`:**
    - MUST define the `"main"` field pointing to the bundled output (e.g., `./dist/extension.js`).
    - MUST NOT include `"module"`, `"types"`, or `"exports"`, as it is not consumed as a library.
- **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.

### 3.5. :: `shared-tools` Package (Tooling)

- **Purpose:** To provide shared, buildable tooling and scripts.
- **Build:** MUST be configured and built identically to a `core` (Library) package, using the `@nx/js:swc` executor for its `build` target.

### 3.6. :: Build & Task Execution (`nx.json`)

- **Dependency Graph:** All `build` targets in `targetDefaults` MUST include `"dependsOn": ["^build"]` to ensure Nx builds dependencies first.
- **Caching:** Cacheable operations (`build`, `lint`, etc.) SHOULD be defined in the `tasksRunnerOptions` section.

### 3.7. :: PowerShell Aliases (`custom_pnpm_aliases.ps1`)

- **Command Structure:** Aliases MUST be implemented to construct and execute the idiomatic `pnpm nx <target> <project>` command.
- **Alias Mapping:** New aliases SHOULD be added to the central `$packageAliases` hashtable for dynamic generation.

---

## 4. :: Code Generation and Scaffolding

### 4.1. :: Use of Native Generators

- **Directive**: When creating scaffolding or code generation logic, Nx's native generator capabilities (e.g., `@nx/devkit`) **MUST** be used in favor of custom, standalone scripts. This ensures that new code adheres to workspace conventions, integrates with the Nx graph, and remains maintainable alongside the core tooling.

### 4.2. :: Default Functionality of Generated Code

- **Directive**: A generated module or package **MUST** be fully functional and runnable "out-of-the-box" without requiring manual correction.
- **Directive**: This includes, but is not limited to, correct build configurations, valid launch/task definitions, and complete dependency injection setups for all essential, shared services (e.g., `IPathUtilsService`, `ICommonUtilsService`). Commenting out essential registrations in generated code is a deviation.

---

## 5. :: Standard Workflow

1.  **Provide Context:** The new file and folder structure for the `mono-extension-name` will be provided.
2.  **Update Workspace:** The `pnpm-workspace.yaml` will be updated to include the new packages.
3.  **Implement Logic:** The `core` and `ext` packages will be implemented following the principles outlined above.
4.  **Verify:** The build will be tested from the monorepo root using the `pnpm nx build <project-name>` command to ensure correctness.
