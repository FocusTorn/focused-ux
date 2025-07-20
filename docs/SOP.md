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
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: false` for its `build` target. This executor efficiently handles TypeScript transpilation and generates declaration files (`.d.ts`).
- **`project.json`:** MUST use the global `build:core` target defined in `nx.json`:
    ```json
    {
        "build": {
            "extends": "build:core"
        }
    }
    ```
- **`tsconfig.lib.json`:** MUST include:
    - `"emitDeclarationOnly": true` to generate only type declarations
    - `"declaration": true` and `"declarationMap": true` for proper type support
    - `"rootDir": "src"` to ensure a clean output structure
- **`package.json`:**
    - MUST define `"main"`, `"types"`, and a wildcard `"exports"` map to support deep imports.

### 3.4. :: `ext` Package (Application)

- **Purpose:** To be published as a final, bundled VS Code extension.
- **Build Strategy:** MUST use the `@nx/esbuild:esbuild` executor with `bundle: true` to create a single, optimized output file.
- **`project.json`:** MUST use the global `build:extension` target defined in `nx.json`:
    ```json
    {
        "build": {
            "extends": "build:extension"
        }
    }
    ```
- **`tsconfig.lib.json`:** MUST include:
    - `"emitDeclarationOnly": true` to prevent TypeScript compilation conflicts
    - Proper `references` to core packages
- **`package.json`:**
    - MUST define the `"main"` field pointing to the bundled output (e.g., `./dist/extension.cjs`).
    - MUST NOT include `"module"`, `"types"`, or `"exports"`, as it is not consumed as a library.
    - MUST move workspace dependencies to `devDependencies` since they're bundled.
- **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.

### 3.5. :: `shared-tools` Package (Tooling)

- **Purpose:** To provide shared, buildable tooling and scripts.
- **Build:** MUST be configured and built identically to a `core` (Library) package, using the global `build:core` target.

### 3.6. :: Build & Task Execution (`nx.json`)

- **Global Targets:** The workspace defines standardized global targets in `nx.json` under `targetDefaults`:
    - `build:core`: For shared libraries with declaration generation
    - `build:extension`: For VSCode extensions with bundling and optimization
- **Dependency Graph:** All `build` targets MUST include `"dependsOn": ["^build"]` to ensure Nx builds dependencies first.
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

## 5. :: Build Configuration Discoveries

### 5.1. :: ESBuild vs SWC

- **Discovery**: ESBuild provides better performance and more control over bundling than SWC for our use case.
- **Core Packages**: Use ESBuild with `bundle: false` and `declarationRootDir` for optimal declaration generation.
- **Extension Packages**: Use ESBuild with `bundle: true`, tree-shaking, and minification for optimal bundle sizes.

### 5.2. :: TypeScript Configuration

- **Discovery**: `emitDeclarationOnly: true` in `tsconfig.lib.json` prevents TypeScript compilation conflicts during ESBuild bundling.
- **Core Packages**: Must have `declaration: true` and `declarationMap: true` for proper type support.
- **Extension Packages**: Must reference core packages in `tsconfig.lib.json` but not compile their source files.

### 5.3. :: Bundle Size Optimization

- **Discovery**: Individual exports (manual tree-shaking) can significantly reduce bundle size compared to barrel exports.
- **Strategy**: Use individual exports in shared packages to enable better tree-shaking in extensions.
- **Result**: Project Butler extension achieves 0.14 MB bundle size vs 3.57 MB for Ghost Writer (due to TypeScript AST dependencies).

### 5.4. :: Global Targets

- **Discovery**: Global targets in `nx.json` eliminate configuration duplication and ensure consistency.
- **Implementation**: All packages now use `build:core` or `build:extension` targets instead of duplicating configuration.
- **Benefits**: Simplified maintenance, consistent builds, and easier new package creation.

---

## 6. :: Standard Workflow

1.  **Provide Context:** The new file and folder structure for the `mono-extension-name` will be provided.
2.  **Update Workspace:** The `pnpm-workspace.yaml` will be updated to include the new packages.
3.  **Create Packages:** Use the templates from `docs/package-templates.md` for consistent configuration.
4.  **Implement Logic:** The `core` and `ext` packages will be implemented following the principles outlined above.
5.  **Verify:** The build will be tested from the monorepo root using the `pnpm nx build <project-name>` command to ensure correctness.

---

## 7. :: Troubleshooting

### 7.1. :: Common Build Issues

- **TypeScript Declaration Errors**: Ensure core packages have `declaration: true` and `declarationMap: true` in `tsconfig.lib.json`.
- **Bundle Size Issues**: Check for unnecessary dependencies (like TypeScript AST usage) and consider individual exports.
- **Import Resolution Errors**: Verify `tsconfig.lib.json` has proper `references` and `emitDeclarationOnly: true`.

### 7.2. :: Performance Optimization

- **Bundle Size**: Use individual exports, externalize heavy dependencies, and enable tree-shaking.
- **Build Time**: Leverage Nx caching and proper dependency ordering with `dependsOn: ["^build"]`.
- **Type Safety**: Ensure proper TypeScript configuration for declaration generation.

---

## 8. :: Package Templates

For detailed templates and examples, see `docs/package-templates.md` which provides:

- Complete `project.json` templates for core and extension packages
- Required TypeScript configuration files
- Step-by-step setup instructions
- Best practices for optimal bundle sizes and build performance

## 9. :: Package Generators

The workspace includes Nx generators for creating new packages with the correct configuration from the start.

### 9.1. :: Available Generators

- **`@fux/shared`**: Creates shared library packages (utilities, common services)
- **`@fux/core`**: Creates core library packages (business logic for features)
- **`@fux/ext`**: Creates VSCode extension packages (UI and VSCode-specific implementation)

### 9.2. :: Generator Usage

**Creating a shared package:**

```bash
nx g @fux/shared --name=utilities --description="Common utilities and services"
```

**Creating a core package:**

```bash
nx g @fux/core --name=my-feature --description="My feature core functionality"
```

**Creating an extension package:**

```bash
nx g @fux/ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature
```

### 9.2.1. :: Complete Feature Creation Workflow

**Creating a complete feature with both core and extension packages:**

1. **Create the core package:**

    ```bash
    nx g @fux/core --name=my-feature --description="My feature core functionality"
    ```

2. **Create the extension package:**

    ```bash
    nx g @fux/ext --name=my-feature --displayName="F-UX: My Feature" --description="My feature extension" --corePackage=my-feature
    ```

3. **Build both packages:**

    ```bash
    nx run @fux/my-feature-core:build
    nx run @fux/my-feature-ext:build
    ```

4. **Package the extension for development:**

    ```bash
    nx run @fux/my-feature-ext:package:dev
    ```

5. **Package the extension for production:**
    ```bash
    nx run @fux/my-feature-ext:package
    ```

### 9.3. :: Generator Features

- **Automatic Configuration**: Uses global targets from `nx.json`
- **Workspace Integration**: Automatically updates `pnpm-workspace.yaml` and Nx configuration
- **Best Practices**: Individual exports, proper TypeScript configuration, optimized bundle sizes
- **Extension-Specific**: VSCode manifest, DI container setup, command registration

### 9.4. :: Generator Benefits

- **Consistency**: All packages follow the same proven configuration
- **Performance**: Optimized bundle sizes and build times
- **Maintainability**: Uses global targets for easy updates
- **Type Safety**: Proper TypeScript declaration generation
- **Tree-shaking**: Individual exports enable better optimization

For detailed generator documentation, see `generators/README.md`.
