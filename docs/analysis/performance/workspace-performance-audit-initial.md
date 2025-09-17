## Workspace Performance Audit (Initial)

**Date**: (auto-generated during session)

### Executive Summary

- **Scope**: Initial baseline for representative builds using PAE aliases with cache bypass.
- **Overall health**: Baseline captured; further analysis recommended for tests, lint, and dependency graph.
- **Immediate opportunities**: Validate ESLint project graph performance, confirm esbuild externalization, and standardize build configs across packages.

### Baseline Measurements (Builds, --skip-nx-cache)

- **shared build**: 23.86s
- **mockly build**: 16.11s
- **project-butler core build**: 14.93s
- **project-butler ext build**: 25.16s
- **dynamicons core build**: 23.39s
- **dynamicons ext build**: 25.03s

Notes:

- Measurements were taken via PowerShell Measure-Command wrapping PAE aliases.
- Times exclude cache effects to reflect true execution cost.

### Findings

- **Extension builds (~25s)** for `project-butler` and `dynamicons` are the slowest among sampled projects.
- **Core builds (15–24s)** vary; investigate TypeScript project references and esbuild settings.
- **Shared build (23.86s)** suggests potential TypeScript or esbuild optimization opportunities in common libs.

### Recommended Next Steps

1. Builds
    - Verify esbuild externalization settings and third-party bundling: ensure all heavy deps are externalized consistently.
    - Confirm consistent targetDefaults across packages (bundle, platform, external, thirdParty).
    - Inspect per-package tsconfig to ensure incremental and proper module settings.
2. ESLint
    - Measure lint times across representative packages; enable caching and validate rule set cost.
    - Investigate "creating project graph node with eslint plugin" overhead and align file patterns.
3. Tests (Vite/Vitest)
    - Capture per-package test baselines (t, tc) with and without coverage.
    - Validate watch performance and parallelism.
4. Dependency Graph
    - Confirm no circular dependencies; validate dependency order for parallel builds.
5. Caching
    - Record cache hit rates on repeated runs; validate inputs for accurate invalidation.

### Proposed Measurement Commands (PowerShell)

- Build (baseline, no cache):
    - `shared b -s`
    - `mockly b -s`
    - `pbc b -s`, `pbe b -s`
    - `dcc b -s`, `dce b -s`
- Lint:
    - `shared l`, `mockly l`, `pbc l`, `pbe l`, `dcc l`, `dce l`
- Tests:
    - `pbc t`, `pbc tc`
    - `pbe t`, `pbe tc`

### Success Metrics

- Reduce slowest extension build by 20–30%.
- Standardize build configuration to minimize variance across packages.
- Achieve high cache hit rates on repeated builds/tests (>80%).

### Appendix

- Workspace context: Nx 21.4.1, pnpm, PAE aliases for execution.
- Next report: Expand to lint/test timings and cache effectiveness, then propose targeted optimizations.

### Baseline Measurements (Lint, --skip-nx-cache)

- shared lint: 23.29s
- mockly lint: 19.30s
- project-butler core lint: 19.05s
- project-butler ext lint: 17.54s
- dynamicons core lint: 21.15s
- dynamicons ext lint: 23.27s

### Baseline Measurements (Tests, no coverage, --skip-nx-cache)

- project-butler core test: 20.19s
- project-butler ext test: 23.15s
- dynamicons core test: 37.05s
- dynamicons ext test: 26.96s

### Baseline Measurements (Tests, coverage, --skip-nx-cache)

- project-butler core coverage: 25.14s
- project-butler ext coverage: 32.92s

### Additional Findings

- Lint duration is significant across shared and dynamicons; rule cost and file globs likely contributing.
- Tests without coverage are notably high for dynamicons core; investigate test setup and expensive imports.
- Coverage overhead adds ~5–10s for project-butler; acceptable but can be tuned.

### Concrete Action Plan

- Builds
    - Unify esbuild options via targetDefaults and verify external: ["vscode"] and other heavy packages.
    - Audit per-package tsconfig for incremental and module settings; align across packages.
- Lint
    - Enable and validate ESLint cache location per project (nx default is set); confirm effectiveness.
    - Trim globs to exclude docs/assets from lint inputs; ensure namedInputs lint set is applied.
    - Profile top costly rules and disable or narrow them where non-critical.
- Tests
    - Split slow suites (dynamicons core) and mock expensive modules; move heavy integration into integration lane.
    - Validate Vitest pool and threads; ensure no unnecessary serial execution.
    - Use coverage only on PR/CI lanes requiring it; keep fast feedback lane without coverage.
- Caching
    - Measure second-run cache hits for builds, lint, and tests; target >80%.
    - Verify namedInputs for production/test include only relevant files to avoid over-invalidation.

### Next Validation Steps

- Re-run sampled tasks without --skip-nx-cache to confirm cache effectiveness.
- Capture second-run timings and update success metrics.

---

Finalized initial workspace performance audit. Next report will include cache-hit validation and targeted remediations with before/after metrics.
