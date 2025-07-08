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