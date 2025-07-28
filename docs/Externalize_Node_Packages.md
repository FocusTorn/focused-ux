# Externalizing Node Packages in FocusedUX Monorepo

## Purpose

This guide outlines the precise steps required to externalize Node packages (e.g., `awilix`, `js-yaml`) in VS Code extensions. Externalizing means a package is not bundled into the extension's output but is instead loaded at runtime from a `node_modules` folder included within the VSIX package.

---

## Why Externalize?

- **Performance:** Prevents bloating the main `extension.cjs` bundle with large third-party libraries.
- **Correctness:** Ensures that packages with native bindings or complex dependencies are loaded correctly by the VS Code runtime.

---

## Steps to Externalize a Node Package

### 1. **Mark as External in `esbuild` Config**

- In the `ext` package's `project.json`, add the package name to the `external` array in the `build` target's options:

    ```json
    "build": {
        "executor": "@nx/esbuild:esbuild",
        "options": {
            "external": ["vscode", "awilix", "js-yaml", "micromatch"]
        }
    }
    ```

- This instructs `esbuild` to generate a `require('package-name')` statement instead of bundling the package's source code.

### 2. **Use Static Imports in All Code**

- **Static `import` statements** (e.g., `import * as yaml from 'js-yaml'`) are required for `esbuild`'s static analysis to correctly identify and externalize a module.
- **Dynamic `import()` statements MUST NOT be used** for externalized packages, as they interfere with the bundler's externalization mechanism. This rule applies to all code, including `core` and `shared` libraries that are consumed by the extension.

**Correct Pattern:**

```typescript
// At the top of the file
import * as yaml from 'js-yaml'

// Usage within the code
const doc = yaml.load(str)
```

### 3. **List as a Production Dependency in `package.json`**

- The package **MUST** be listed in the `ext` package's `dependencies` (not `devDependencies`) in `package.json`:

    ```json
    "dependencies": {
      "awilix": "^12.0.5",
      "js-yaml": "^4.1.0"
    }
    ```

- This is critical for the packaging script (`_scripts/create-vsix.js`), which uses this list to install the necessary runtime dependencies into the final VSIX package.

---

## Example: Externalizing `js-yaml`

1.  **`project.json` (`ext` package):**
    ```json
    "external": ["vscode", "js-yaml"]
    ```
2.  **Static import in `shared`/`core`:**
    ```typescript
    import * as yaml from 'js-yaml'
    // ...
    const config = yaml.load(fileContent)
    ```
3.  **`package.json` (`ext` package):**
    ```json
    "dependencies": {
      "js-yaml": "^4.1.0"
    }
    ```

---

## Common Pitfalls

- **Dynamic imports in `shared`/`core`** will cause the package to be bundled, overriding the `external` configuration.
- **Forgetting to add the package to `dependencies`** in the `ext` package will cause the packaging script to fail or, worse, produce a VSIX that fails at runtime with a "Cannot find module" error.

---

## Checklist for Externalizing a Node Package

- [ ] Add package name to `external` array in the `ext` package's `project.json`.
- [ ] Use **static `import` statements** for the package in all `core`, `shared`, and `ext` source files.
- [ ] Add the package to the `dependencies` section of the `ext` package's `package.json`.
- [ ] Audit all related source files to ensure no dynamic `import()` statements for the package remain.
