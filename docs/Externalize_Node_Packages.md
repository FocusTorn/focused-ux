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

## Preventing TypeScript Errors When Externalizing

### 1. **Explicit Parameter Typing in Callbacks**
When externalizing dependencies, ensure all callback parameters have explicit types to prevent implicit `any` errors:

```ts
// ❌ Wrong - implicit any
const entries = await this.fileSystem.readDirectory(uri)
const childrenUris = entries.map(entry => this.path.join(uri, entry.name))

// ✅ Correct - explicit typing
const entries = await this.fileSystem.readDirectory(uri)
const childrenUris = entries.map((entry: DirectoryEntry) => this.path.join(uri, entry.name))
```

### 2. **Array Method Parameter Typing**
Always type parameters in array methods like `map`, `filter`, `reduce`, `sort`:

```ts
// ❌ Wrong - implicit any
const promises = entries.map(async (entry) => { /* ... */ })
const resolved = items.filter((item): item is ValidType => item !== null)
const sorted = items.sort((a, b) => a.name.localeCompare(b.name))
const sum = counts.reduce((sum, count) => sum + count, 0)

// ✅ Correct - explicit typing
const promises = entries.map(async (entry: DirectoryEntry) => { /* ... */ })
const resolved = items.filter((item: any): item is ValidType => item !== null)
const sorted = items.sort((a: Item, b: Item) => a.name.localeCompare(b.name))
const sum = counts.reduce((sum: number, count: number) => sum + count, 0)
```

### 3. **Interface and Type Definitions**
Ensure all interfaces and types are properly defined and imported:

```ts
// Define or import the types you're using
interface DirectoryEntry {
  name: string
  type: 'file' | 'directory'
  // ... other properties
}

// Use explicit typing in all callbacks
const processEntries = (entries: DirectoryEntry[]) => {
  return entries.map((entry: DirectoryEntry) => {
    // Process entry with full type safety
  })
}
```

### 4. **Type Guards and Assertions**
Use type guards and assertions when dealing with unknown types:

```ts
// Type guard for filtering
const isValidItem = (item: any): item is ValidItem => {
  return item && typeof item.name === 'string'
}

// Usage with explicit typing
const validItems = items.filter((item: any): item is ValidItem => isValidItem(item))
```

### 5. **Prevention Checklist**
Before externalizing any dependency, ensure:
- [ ] All callback parameters have explicit types
- [ ] Array methods (`map`, `filter`, `reduce`, `sort`) have typed parameters
- [ ] All interfaces and types are properly defined
- [ ] Type guards are used for unknown types
- [ ] No implicit `any` types in callback functions

---

## Checklist for Externalizing a Node Package
- [ ] Add to `external` in extension's esbuild config
- [ ] Use dynamic import everywhere in shared/core/ext
- [ ] Add to `dependencies` in extension's package.json
- [ ] Remove from devDependencies/peerDependencies/optionalDependencies
- [ ] Audit for static imports in all packages

---

**Follow this guide for every package you wish to externalize.** 