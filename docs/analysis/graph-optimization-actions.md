## Graph optimization checklist (no code changes yet)

### 1 Tighten named inputs and target defaults

- Exclude non-sources in `namedInputs.default` (docs/assets/fixtures/screenshots/videos).
- Create minimal `namedInputs.lint` and `namedInputs.test`; avoid `**/*` catch‑alls.
- Keep `targetDefaults.build/test/lint` tied only to the lean named inputs.
- Ensure every custom target defines `outputs` for correct caching.

### 2 Dependency graph hygiene

- Remove deprecated/unused projects and duplicated/meta targets.
- Split heavyweight `nx:run-commands` meta targets into focused targets.
- Keep only necessary cross-project targets to reduce graph fan‑out.

### 3 Enforce boundaries with tags (warn-level)

- Apply tags consistently: `core`, `ext`, `shared`, `tool`.
- Configure `@nx/enforce-module-boundaries` (warn):
    - Allowed: `ext → core, shared`; `core → shared`; `shared → shared`; `tool → shared, tool`.
    - Disallowed: `core → ext`; `shared → core|ext|tool`; `ext → tool` (unless explicitly justified).

### 4 Eliminate circular dependencies

- Detect cycles (focus on `ext ↔ core`, `core ↔ shared`).
- Break cycles by moving common code to `shared`, introducing interfaces in `shared`, and removing upward imports.

### 5 TypeScript scope slimming

- Narrow `tsconfig.*.json` `include` to `src/**/*`.
- Replace broad `paths` wildcards with precise mappings.
- Keep project refs only for buildable, truly depended‑on libs.

### 6 Nx daemon and cache strategy

- Keep Nx daemon enabled.
- Use Nx Cloud for remote cache; use `--skip-nx-cache` only for audits.
- Prefer affected-based runs in CI; bound `--maxParallel` to machine capacity.

### 7 Ignore lists and file watching

- Expand `.gitignore`/`.nxignore` to exclude screenshots/recordings/datasets/coverage and generated artifacts.
- Ensure `dist`, `.nx`, and tooling outputs are consistently ignored across packages.

### 8 Validation (when approved)

- Graph and cycles: `nx graph --focus=<project>`; optionally `pnpm dlx madge --circular --extensions ts ./packages ./libs`
- Boundary warnings: `nx run-many -t lint`
- Cache correctness: compare first vs second run for `build`, `lint`, `test`
- Affected-only: CI `nx affected -t build,test,lint --parallel`; local `nx affected -t build,test,lint --base <ref> --parallel`
