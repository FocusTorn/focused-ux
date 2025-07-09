### VS Code Extension Build & Packaging Guide

This guide outlines the standard configuration for the `build` and `package:dev` targets within a `project.json` file for a VS Code extension in this monorepo. Adhering to this structure ensures consistency and leverages Nx's capabilities.

#### 1. The `build` Target

The `build` target is responsible for compiling the TypeScript source code into JavaScript that the VS Code extension host can execute.

**Key Configuration:**

-   **`executor`**: MUST be set to `@nx/esbuild:esbuild`. This uses the fast and efficient esbuild bundler.
-   **`outputs`**: MUST be `["{options.outputPath}"]`. This tells Nx where to find the build artifacts for caching.
-   **`dependsOn`**: MUST be `["^build"]`. This is a critical setting that ensures all workspace library dependencies (like a `core` package) are built *before* this extension package is built.
-   **`options`**:
    -   **`main`**: The path to the extension's entry point file, typically `.../src/extension.ts`.
    -   **`outputPath`**: The directory where the final bundled code will be placed, typically `.../dist`.
    -   **`tsConfig`**: The path to the package's `tsconfig.json` file.
    -   **`platform`**: MUST be `"node"`, as VS Code extensions run in a Node.js environment.
    -   **`format`**: MUST be `["cjs"]` (CommonJS). The VS Code extension host requires this module format.
    -   **`bundle`**: MUST be `true`. This bundles all source code and dependencies into a single file.
    -   **`external`**: MUST be `["vscode"]`. The `vscode` module is provided by the VS Code runtime and must not be bundled.
    -   **`assets`**: An array to copy static files (like icons or HTML views) into the `dist` directory.

**Example `build` Target:**

~~~json
"build": {
    "executor": "@nx/esbuild:esbuild",
    "outputs": [ "{options.outputPath}" ],
    "defaultConfiguration": "production",
    "dependsOn": [ "^build" ],
    "options": {
        "main": "packages/my-extension/ext/src/extension.ts",
        "outputPath": "packages/my-extension/ext/dist",
        "tsConfig": "packages/my-extension/ext/tsconfig.json",
        "platform": "node",
        "format": [ "cjs" ],
        "bundle": true,
        "external": [ "vscode" ],
        "assets": [
            {
                "glob": "**/*",
                "input": "packages/my-extension/ext/assets",
                "output": "assets"
            }
        ]
    },
    "configurations": {
        "production": { "minify": true },
        "development": { "minify": false }
    }
}
~~~

#### 2. The `package:dev` Target

The `package:dev` target uses a custom script to create a versioned `.vsix` file for local installation and testing. This allows for rapid iteration without affecting the official version number.

**Key Configuration:**

-   **`executor`**: MUST be `nx:run-commands`.
-   **`dependsOn`**: MUST be `["build"]` to ensure the package is built before packaging.
-   **`options.command`**: The command to execute. It runs the `_scripts/create-dev-vsix.js` script, passing the relative path to the extension package directory (e.g., `context-cherry-picker/ext`) as an argument.

**Example `package:dev` Target:**

~~~json
"package:dev": {
    "executor": "nx:run-commands",
    "dependsOn": ["build"],
    "options": {
        "command": "node ./_scripts/create-dev-vsix.js context-cherry-picker/ext"
    }
}
~~~















# Dependency Injection Pitfalls

## The Dependency Injection Failure (The Root Cause)

This was the most critical and subtle issue, causing the commands to fail silently. The awilix DI container was creating an instance but was failing to inject its dependencies.

**The Problem:** The build process, which uses a combination of SWC for the core library and esbuild for the ext bundle, was altering the constructor parameter names of the ProjectButlerService. awilix relies on these names to know which dependencies to inject. When it couldn't find registered services matching the new, mangled names, it injected undefined for all of them.

**The Silent Failure:** When a command was run, it would call a service method (e.g., createBackup). That method would immediately try to use a dependency (e.g., this.window.showErrorMessage(...)). Since this.window was undefined, this threw a TypeError. The try...catch block in the method would catch this error, but then it would also try to call this.window.showErrorMessage(), throwing a second, unhandled TypeError that caused the command to crash without any visible output.

**The Final Solution (injection.ts):** The definitive fix was to stop relying on awilix's automatic resolution for the ProjectButlerService. Instead, we adopted a more robust, manual instantiation pattern:

1. The adapter classes (VSCodeWindowAdapter, FileSystemAdapter, etc.) were registered normally.
2. We then manually resolved each of these adapters from the container using container.resolve<T>('dependencyName').
3. A new instance of ProjectButlerService was created by passing these fully-resolved, working adapters to its constructor.
4. This complete, guaranteed-to-work instance was then registered back into the container using asValue.
        
        
        