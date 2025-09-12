## **[2025-09-12 02:52:05] Package: Dynamicons Extension – runtime deps and assets in VSIX**

### **Summary**

Ensured external runtime dependencies and `@fux/dynamicons-assets` are available at runtime by externalizing in the bundle and staging required modules/assets into the VSIX `node_modules`.

### **Root Cause Analysis**

- **Missing externals in VSIX**: `strip-json-comments` and assets package not present in `node_modules` after install, causing activation/theme load failures.
- **Bundle externalization mismatch**: Items marked external in build weren’t shipped in VSIX contents.

### **What Was Tried and Failed**

- Directly copying workspace packages (junctions/symlinks) → Windows copy errors; reverted to explicit `dist` copy for assets.

### **Critical Failures and Recovery**

1. **Activation failure: missing module**
    - **Failure**: “Cannot find module 'strip-json-comments'”.
    - **Root Cause**: Externalized but not staged into VSIX.
    - **Recovery**: Add to dependencies and stage into `node_modules` during packaging.
    - **Prevention**: Dependency contract test (externals ∈ dependencies; pnpm-resolved path exists).

2. **Theme JSON missing**
    - **Failure**: Unable to read `.../@fux/dynamicons-assets/dist/assets/themes/*.json`.
    - **Root Cause**: Assets package not present in VSIX `node_modules`.
    - **Recovery**: Copy workspace package `dist` to staged `node_modules/@fux/dynamicons-assets`.
    - **Prevention**: Staging integrity test for assets paths.

### **Files Created/Modified**

- `packages/dynamicons/ext/project.json` — `external` updated to include `@fux/dynamicons-assets`.
- `packages/dynamicons/ext/.vscodeignore` — Ensures `!node_modules/**` included for runtime deps.

### **Prevention Strategy**

- Dependency contract and staging integrity tests in packager.
- Keep assets externalized from `extension.cjs`; stage `dist` under `node_modules/@fux/dynamicons-assets`.

