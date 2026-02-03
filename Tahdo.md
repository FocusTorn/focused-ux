
- [1. :: Shorthand Reference Mapping and Explanations](#1--shorthand-reference-mapping-and-explanations)
    - [1.1. :: Alias Mapping](#11--alias-mapping)
    - [1.2. :: Details for shorthand execution details:](#12--details-for-shorthand-execution-details)
        - [1.2.1. Add to strat](#121-add-to-strat)
        - [1.2.2. Add to trouble](#122-add-to-trouble)
- [2. :: Mock Strategy Architecture Classification](#2--mock-strategy-architecture-classification)
- [3. :: ESM Module Import Resolution Patterns](#3--esm-module-import-resolution-patterns)
- [4. :: Mock Strategy Extension Pattern](#4--mock-strategy-extension-pattern)
- [5. :: Build Target Dependency Strategy for Testing](#5--build-target-dependency-strategy-for-testing)
- [6. :: Package Resolution and Alias Configuration](#6--package-resolution-and-alias-configuration)
- [7. :: Function Name Matching in Mock Strategy Integration](#7--function-name-matching-in-mock-strategy-integration)
- [High‑impact, non‑ESLint project graph optimizations](#highimpact-noneslint-project-graph-optimizations)
- [Dependency Graph Hygiene – Findings and Recommendations](#dependency-graph-hygiene--findings-and-recommendations)
    - [Boundary Enforcement (Proposed depConstraints – warn)](#boundary-enforcement-proposed-depconstraints--warn)
    - [Tags and Constraints](#tags-and-constraints)
    - [Release Config Noise (Non‑blocking)](#release-config-noise-nonblocking)
    - [Target/Outputs Hygiene](#targetoutputs-hygiene)

## High‑impact, non‑ESLint project graph optimizations

Report and explain the findings from:

<!-- 1. Affected‑only everywhere (not used)
    - Prefer `nx affected -t build,test,lint --parallel` over all‑project scans.
    - In CI use merge base; locally use `--base` when needed. -->

2. Target defaults and inputs
    - Tighten `namedInputs.default` to exclude docs/assets/fixtures/videos.
    - Create lean `namedInputs.lint`/`namedInputs.test`; avoid `**/*` catch‑alls.
    - Keep `targetDefaults.build/test/lint` on minimal named inputs.

3. Dependency graph hygiene
    - Remove deprecated/unused projects and targets.
    - Fix circular deps; enforce boundaries with focused `depConstraints` (warn).
    - Use tags to constrain cross‑area imports (shrinks reachable graph).

4. TypeScript config scope
    - Narrow `tsconfig.*.json` includes to `src/**/*`.
    - Reduce `paths` wildcards; prefer precise mappings.
    - Add project refs only for buildable, truly depended‑on libs.

5. Executor/output slimming
    - Ensure each target has `outputs` for caching.
    - Split heavyweight meta targets to avoid graph fan‑out.

6. Nx daemon and cache
    - Keep daemon enabled; avoid toggling.
    - Use Nx Cloud for remote cache; use `--skip-nx-cache` only for audits.
    - Prefer `run-many --affected`; bound `--maxParallel`.

7. File watching and ignore lists
    - Expand `.gitignore`/`.nxignore` to exclude screenshots/recordings/datasets.
    - Exclude generated artifacts from `namedInputs.default`.

<!-- [✔] Tooling/plugin footprint
    - Remove unused Nx plugins.
    - Avoid project‑graph plugins that scan non‑code files.
    - Consolidate custom executors; reuse built‑ins. -->

9. Build system externalization
    - Externalize big deps and Node/VSC APIs in esbuild.
    - Keep non‑runtime deps in `devDependencies` to reduce transitive graph.

10. CI flow
    - Use affected runs + parallelized steps by target; restore Nx cache early.
    - Gate expensive validations (full coverage, deep audits) to scheduled jobs.

11. Workspace layout and boundaries
    - Flat, predictable layout; avoid deep nesting that expands globs.
    - Use tags (e.g., `type:shared/core/ext/tool`) and one‑way flow constraints.

---

## Dependency Graph Hygiene – Findings and Recommendations

<!--
1. Deprecated/Unused Projects
    - **@fux/source**
        - Root is workspace root (`.`) and exposes no targets.
        - Likely a placeholder/stale artifact; it adds noise to the graph.
        - **Recommendation**: Remove or convert into a documented meta project if intentionally kept. -->

3. Boundary Enforcement (Proposed depConstraints – warn)
    - **shared**: may depend on nothing (or only `shared`).
    - **core**: may depend on `shared` (no `ext`, no `tool`).
    - **ext**: may depend on `core` and `shared` (no `tool`).
    - **tool**: may depend on `shared` (optionally `core`), but not `ext`.
    - Rationale: Enforces one‑way flow (`shared → core → ext`; `tool` separate), reduces reachable subgraphs, and prevents accidental drift.

### Boundary Enforcement (Proposed depConstraints – warn)

- **shared**: may depend on nothing (or only `shared`).
- **core**: may depend on `shared` (no `ext`, no `tool`).
- **ext**: may depend on `core` and `shared` (no `tool`).
- **tool**: may depend on `shared` (optionally `core`), but not `ext`.
- Rationale: Enforces one‑way flow (`shared → core → ext`; `tool` separate), reduces reachable subgraphs, and prevents accidental drift.

### Tags and Constraints

- Adopt and apply a simple taxonomy: `tag:type:shared`, `tag:type:core`, `tag:type:ext`, `tag:type:tool`.
- Enforce via `depConstraints` (warn) to constrain cross‑area imports and shrink the effective graph.

### Release Config Noise (Non‑blocking)

- Duplicate entries observed in the release project list (e.g., `@fux/project-butler-core`, `@fux/project-butler-ext` repeated).
- Recommendation: Deduplicate to reduce maintenance overhead; no runtime impact.

### Target/Outputs Hygiene

- Ensure each custom/heavy target defines `outputs` to maximize cache effectiveness.
- Keep target menus focused; split very heavy “meta” targets to avoid graph fan‑out during planning.
