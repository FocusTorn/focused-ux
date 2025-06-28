# SOP: FocusedUX New Mono-Extension

## 1.0 Project Overview

The **Focused-UX (F-UX)** project is a monorepo designed to produce a suite of VS Code extensions. The architecture follows two primary goals:

1.  **Standalone Extensions:** Each feature (e.g., "Chronocopy", "Autoterm") is developed as a self-contained, installable VS Code extension. This is achieved through a `core`/`ext` package pair.
2.  **Orchestrator Extension:** A primary extension, named **"Focused UX"**, serves as an orchestrator. It consumes the `core` library of each feature, combining all functionalities into a single, unified extension. This provides users with a complete experience without needing to install multiple individual extensions.

This dual approach necessitates a strict separation of concerns.

## 2.0 Package Archetypes

The monorepo consists of four primary package archetypes, each with a distinct purpose and configuration.

- **`core` (Library):** A framework-agnostic library containing a feature's abstract business logic. It is built to be tree-shakeable and is consumed by `ext` packages and the orchestrator.
- **`ext` (Application):** A lightweight VS Code extension that depends on a `core` package. It contains only VS Code-specific implementation and is bundled into a final, executable artifact.
- **`shared-config` (Configuration):** A package that exports shareable configurations (e.g., ESLint, Prettier). It has no build step and is consumed as a `devDependency`.
- **`shared-utils` (Tooling):** A library containing shared build scripts, utilities, or other development-time logic. It is built like a `core` library and consumed as a `devDependency` by other packages.

---

## 3.0 Key Configuration Principles

### 3.1 Dependency Flow

- **`core`:** MUST only have production `dependencies`. It MUST NOT have `devDependencies` on other workspace packages.
- **`ext`:** MUST depend on its corresponding `core` package as a production `dependency`. It MAY depend on `shared-utils` or `shared-config` as `devDependencies`.
- **`shared-utils` & `shared-config`:** These packages SHOULD have minimal dependencies and MUST NOT depend on any `core` or `ext` packages to avoid circular dependencies.

### 3.2 Workspace (`pnpm-workspace.yaml`)

- All new packages, regardless of type, MUST be included in the `packages` list in the root `pnpm-workspace.yaml` file.

### 3.3 `core` Package (Library)

- **Purpose:** To be consumed as a library.
- **Build Strategy:** MUST use a two-step build process orchestrated by `nx:run-commands` to ensure fast, correct, and tree-shakeable output.
    1.  **Transpilation:** Use `@nx/js:swc` to quickly transpile TypeScript to per-file JavaScript.
    2.  **Type Generation:** Use `@nx/js:tsc` with `emitDeclarationOnly: true` to generate corresponding `.d.ts` files.
- **`project.json`:** MUST define three targets: `build` (the orchestrator), `build-js` (for SWC), and `build-dts` (for TSC).
- **`tsconfig.lib.json`:** MUST define `"rootDir": "src"` to ensure a clean output structure without the `src` directory.
- **`package.json`:**
    - MUST define `"main"`, `"types"`, and a wildcard `"exports"` map to support deep imports.
    - The `build` script SHOULD simply be `nx run-many --target=build`.

### 3.4 `ext` Package (Application)

- **Purpose:** To be published as a final, bundled VS Code extension.
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: true` to create a single, optimized output file.
- **`project.json`:** MUST define a single `build` target using the `@nx/esbuild:esbuild` executor.
- **`package.json`:**
    - MUST define the `"main"` field pointing to the bundled output (e.g., `./dist/index.js`).
    - MUST NOT include `"module"`, `"types"`, or `"exports"`, as it is not consumed as a library.
- **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.

### 3.5 Shared Packages (`shared-config` & `shared-utils`)

- **`shared-config`:**
    - **Purpose:** To export raw configuration files (e.g., `eslint.config.js`).
    - **Build:** MUST NOT have a build step or a `dist` directory. Files are consumed directly from the source.
    - **`package.json`:** The `"main"` field should point directly to the primary config file (e.g., `"main": "index.js"`).
- **`shared-utils`:**
    - **Purpose:** To provide shared, buildable tooling and scripts.
    - **Build:** MUST be configured and built identically to a `core` (Library) package, using the `swc` + `tsc` strategy.

### 3.6 Build & Task Execution (`nx.json`)

- **Dependency Graph:** All `build` targets in `targetDefaults` MUST include `"dependsOn": ["^build"]` to ensure Nx builds dependencies first.
- **Caching:** Cacheable operations (`build`, `lint`, etc.) SHOULD be defined in the `tasksRunnerOptions` section.

### 3.7 PowerShell Aliases (`custom_pnpm_aliases.ps1`)

- **Command Structure:** Aliases MUST be implemented to construct and execute the idiomatic `pnpm nx <target> <project>` command.
- **Alias Mapping:** New aliases SHOULD be added to the central `$packageAliases` hashtable for dynamic generation.

---

## 4.0 Standard Workflow

1.  **Provide Context:** The new file and folder structure for the `mono-extension-name` will be provided.
2.  **Update Workspace:** The `pnpm-workspace.yaml` will be updated to include the new packages.
3.  **Implement Logic:** The `core` and `ext` packages will be implemented following the principles outlined above.
4.  **Verify:** The build will be tested from the monorepo root using the `pnpm nx build <project-name>` command to ensure correctness.
