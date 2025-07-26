# Externalizing Node Packages in FocusedUX Monorepo

## Purpose
This guide outlines the precise steps required to externalize Node packages (e.g., `awilix`, `js-yaml`, `picomatch`, `typescript`) in extension, shared, and core packages. It is written for AI and automation agents to ensure consistent, correct, and future-proof handling of external dependencies.

---

## Why Externalize?
- **Externalizing** means a package is not bundled into the extension's output, but is instead loaded at runtime from `node_modules`.
- This is required for large, native, or peer-dependent packages, and for any package that should be upgradable or shared at runtime.

---

## Steps to Externalize a Node Package

### 1. **Mark as External in esbuild Config**
- In the extension's `project.json`, add the package name to the `external` array in the esbuild build options:

```json
"external": ["vscode", "awilix", "js-yaml", "typescript"]
```
- This prevents esbuild from bundling the package into the output.

### 2. **Use Dynamic Imports in All Code Paths**
- **Static imports** (e.g., `import * as yaml from 'js-yaml'`) in any code that is ultimately bundled into the extension will cause the package to be bundled, even if marked as external.
- **Instead, use dynamic imports** everywhere the package is used, including in shared and core packages.

**Pattern:**
```ts
let yaml: typeof import('js-yaml');
async function getYaml() {
  if (!yaml) {
    yaml = (await import('js-yaml'));
  }
  return yaml;
}
// Usage:
const doc = (await getYaml()).load(str);
```
- For CJS, use `require()` dynamically.
- For ESM, use `await import()` as above.
- **Do not use type arguments on dynamic imports.** Use type assertions if needed.

### 3. **List as a Dependency in package.json**
- The package **must** be listed in the extension's `dependencies` (not just devDependencies) in `package.json`:

```json
"dependencies": {
  "awilix": "^12.0.5",
  "js-yaml": "^4.1.0"
}
```
- This ensures it is installed in `node_modules` and included in the packaged `.vsix`.
- Remove from `devDependencies` if present.

### 4. **Remove Unused or Duplicate References**
- Remove the package from `devDependencies`, `peerDependencies`, and `optionalDependencies` if not needed.
- Remove from the `external` array if no longer used.

### 5. **Workspace-Wide Consistency**
- If the package is used in shared or core, **all imports must be dynamic** to prevent accidental bundling in any extension that consumes them.
- Audit all packages for static imports of the externalized package.

---

## Example: Externalizing `js-yaml`

1. **esbuild config**:
   ```json
   "external": ["js-yaml"]
   ```
2. **Dynamic import in shared/core:**
   ```ts
   let yaml: typeof import('js-yaml');
   async function getYaml() {
     if (!yaml) yaml = (await import('js-yaml'));
     return yaml;
   }
   // Usage:
   const doc = (await getYaml()).load(str);
   ```
3. **package.json:**
   ```json
   "dependencies": {
     "js-yaml": "^4.1.0"
   }
   ```

---

## Common Pitfalls
- **Static imports in shared/core** will always cause bundling, even if marked as external in the extension.
- **Forgetting to add to dependencies** will cause runtime errors for users.
- **Leaving in devDependencies** is harmless but unnecessary.
- **TypeScript errors:** Use type assertions, not type arguments, on dynamic imports.

---

## Checklist for Externalizing a Node Package
- [ ] Add to `external` in extension's esbuild config
- [ ] Use dynamic import everywhere in shared/core/ext
- [ ] Add to `dependencies` in extension's package.json
- [ ] Remove from devDependencies/peerDependencies/optionalDependencies
- [ ] Audit for static imports in all packages

---

**Follow this guide for every package you wish to externalize.** 