# VSIX Packager Actions Log

---

## **Latest Entries**

## **[2025-09-12 02:52:05] Refactor to buildable lib + packaging correctness**

### **Summary**

Successfully converted `vsix-packager` into a buildable library and fixed runtime packaging gaps so external deps resolve at runtime and the VSIX is produced via `vsce` with correct contents.

### **Root Cause Analysis**

- **Monolithic script limitations**: `scripts/create-vsix.js` lacked modularity, testability, and consistent dependency handling.
- **Runtime dep resolution**: Externals marked in extension build were not reliably present in VSIX `node_modules`, causing activation errors.

### **What Was Tried and Failed**

- Attempted copying workspace packages directly, which hit Windows junction/symlink issues and was reverted to skip `link:` and explicitly stage only required runtime assets.
- Initially generated manifests/README instead of using package originals; removed in favor of `vsce` defaults and actual files.

### **Critical Failures and Recovery**

1. **Missing runtime deps in VSIX**:
    - **Failure**: Extension activation failed on missing modules (e.g., `strip-json-comments`, `@fux/dynamicons-assets`).
    - **Root Cause**: Externals were not staged into VSIX `node_modules`.
    - **Recovery**: Externalize in build; copy resolved external dependencies into staging; for workspace runtime assets, copy their `dist` to `node_modules`.
    - **Prevention**: Add dependency contract and staging integrity tests.

2. **Over-implementation of manifest/README**:
    - **Failure**: Redundant generation caused drift/warnings.
    - **Root Cause**: Not relying on `vsce` and real package files.
    - **Recovery**: Removed manifest generation; use package `README.md` and `LICENSE.txt` as-is.
    - **Prevention**: Keep packager focused on staging and `vsce` orchestration only.

### **Files Created/Modified**

- `libs/tools/vsix-packager/src/orchestrator/vsix-packager.ts` — Orchestrates staging, dependency copy, and `vsce` packaging.
- `libs/tools/vsix-packager/src/packaging/vsce-wrapper.ts` — Wraps `vsce package` (uses `--no-dependencies`).
- `libs/tools/vsix-packager/src/dependencies/pnpm-resolver.ts` — Uses `pnpm list --prod --json` to resolve externals; skips `link:`.
- `libs/tools/vsix-packager/project.json` — Buildable lib settings; externals configured; `thirdParty: false`.
- `libs/tools/vsix-packager/tsconfig.json` — ESM NodeNext config for tool code.

### **Prevention Strategy**

- Add tests: dependency contract (externals ∈ dependencies), staging integrity (node_modules contains externals; workspace assets staged under `dist/...`), VSIX contents validation.
- Keep `vsce` as the source of truth for manifest; only stage files and deps.
- Treat workspace runtime assets explicitly: copy `dist` to `node_modules` under the same package name.
