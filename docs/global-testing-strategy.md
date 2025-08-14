## 1. :: Global Testing Strategy (Draft) <!-- Start Fold -->

This document captures practical testing strategies across the monorepo. It is intentionally living and adaptive. It is NOT a single source of truth; testing is fluid and package-specific. Use these sections as strong starting points and troubleshooting references, then adapt to local constraints.

### 1.1. :: Structure

- **Libs packages**: `@fux/shared`, `@fux/mockly`
- **Core packages**: Domain/service logic (no VSCode value imports)
- **Ext packages**: VSCode extensions (UI/adapters/providers/commands)

###### END: Global Testing Strategy (Draft) (END) <!-- Close Fold -->

## 2. :: Core Principles <!-- Start Fold -->

- Determinism first: Prefer synchronous, deterministic flows; mock timers, isolate I/O, control randomness.
- Adapter boundaries: VSCode value imports MUST live in shared adapters; tests for consumers use adapters, not raw VSCode.
- Localize mocks: Mock only what’s needed per file. Prefer narrow `vi.mock('vscode', ...)` stubs.
- Cross-platform assertions: Normalize paths before comparing; avoid platform-coupled expectations.
- Silence by default: Suppress console output in tests unless explicitly enabled for debugging.
- Minimal fixture shape: Provide only the properties a test uses; smaller mocks are more maintainable.

###### END: Core Principles (END) <!-- Close Fold -->

## 2.5 :: Test Lanes: Functional vs Coverage (All Packages) <!-- Start Fold -->

- **Goal:** Keep day-to-day feedback fast while preserving 100% coverage guarantees.
- **Directory Layout (convention):**
    - Functional tests (default fast lane): `__tests__/` excluding `__tests__/coverage/**`.
    - Coverage-only tests: `__tests__/coverage/**` for defensive, logging, and non-behavioral branches.
- **Configs (per package):**
    - Functional: `vitest.functional.config.ts` excluding `__tests__/coverage/**`.
    - Full + coverage: `vitest.coverage.config.ts` including both globs.
    - Shared setup filename: `_setup.ts` (renamed from `setup.ts`) for console/mocks.
- **Nx Targets & Aliases:**
    - `test` → functional lane (fast). Example: `shared t`, `core t`, `ext t`.
    - `test:full` → full + coverage lane (enables coverage reporters). Example: `shared tc`, `core tc`, `ext tc`.
- **Guardrails:**
    - Only place tests in `coverage/` if their sole purpose is to exercise unreachable/defensive/log-only paths.
    - Keep behavior and contract tests in the functional lane.
    - Prefer removing coverage-only tests that do not move metrics or verify behavior.
- **CI:**
    - PR validation: functional lane.
    - Nightly/coverage job: coverage lane with thresholds.

###### END: Test Lanes: Functional vs Coverage (All Packages) (END) <!-- Close Fold -->

## 3. :: Libs Packages Strategy (Shared + Mockly) <!-- Start Fold -->

### 3.1. :: @fux/shared <!-- Start Fold -->

#### Policies

- Do NOT use `@fux/mockly` in shared tests. `@fux/shared` directly wraps VSCode values into adapters.
- Use localized `vi.mock('vscode', ...)` per test file with only the required symbols.

#### What Worked (Best Practices)

- Localized `vscode` mocks per file with only required symbols (e.g., `Uri.file`, `window.showInformationMessage`).
- Hoisted pre-import mocks to break static cycles: mock `../src/vscode/adapters/Uri.adapter.js` before importing `VSCodeUriFactory` in tests that exercise factory defaults.
- Console control via env: In `libs/shared/__tests__/setup.ts`, silence `console.*` unless `ENABLE_TEST_CONSOLE=true`.
- Timer determinism: Use `vi.useFakeTimers()` where applicable; explicitly run/clear timers.
- Path normalization: Replace `\\` with `/` prior to assertions; prefer path-content checks over exact platform-specific strings.
- Target defensive branches, not logs: Assert behavioral outcomes (fallback URIs, filtered inputs) rather than console side effects.
- Narrow factories: Use minimal fake implementations for adapters and factories to keep tests predictable and small.

#### What Did Not Work / To Avoid

- Using Mockly inside shared tests: Creates circular dependency risk and violates adapter boundary rules.
- Asserting on console output: Leads to brittle tests and noise; logs are diagnostics, not behavior.
- Top-level variables inside `vi.mock` factories: Vitest hoists `vi.mock`; referencing outer variables causes ReferenceErrors.
- Relying on real timers/config: Non-deterministic durations cause flakiness.
- Platform-specific path assertions: Breaks on Windows vs POSIX.

#### Pitfalls & Error Corrections (Catalog)

1. Static initialization loop (UriAdapter ↔ VSCodeUriFactory)
    - Symptom: Importing `VSCodeUriFactory` triggers `UriAdapter` default factory before tests can override.
    - Fix: Hoist a mock for `../src/vscode/adapters/Uri.adapter.js` before importing the factory in tests that need it.

2. Vitest hoist ReferenceError in `vi.mock`
    - Symptom: "There was an error when mocking a module" due to referencing top-level variables inside mock factory.
    - Fix: Define spies within the `vi.mock` factory and assert via `await import('vscode')` instance.

3. Timer-driven UI behavior
    - Symptom: Flaky tests around dropdown/description resets.
    - Fix: Mock duration sources; when needed, use fake timers and advance explicitly.

4. Path separator inconsistencies
    - Symptom: Failing assertions on Windows due to `\\`.
    - Fix: Normalize paths (`.replace(/\\/g, '/')`) prior to compare.

5. Over-mocking VSCode
    - Symptom: Large, drifting mocks across many tests.
    - Fix: Per-test, provide only the symbols exercised; keep mocks tiny.

#### Test Lanes & Commands

- Quick: `shared t`
- Coverage: `shared tc`

#### Implementation Details (Functional/Coverage Split)

- **Directory layout:**
    - Functional: `libs/shared/__tests__/**/*.test.ts`
    - Coverage-only: `libs/shared/__tests__/coverage/**/*.test.ts`
- **Vitest configs:**
    - `libs/shared/vitest.functional.config.ts` → `test.include` targets `__tests__/**/*.ts` and excludes `__tests__/coverage/**`; `setupFiles` = `__tests__/_setup.ts`.
    - `libs/shared/vitest.coverage.config.ts` → includes both functional and coverage-only test globs; `setupFiles` = `__tests__/_setup.ts`; coverage reporters set (v8/istanbul).
- **Nx targets:**
    - `@fux/shared:test` → functional config.
    - `@fux/shared:test:full` → coverage config.
- **Rules for placement:**
    - Put timing, log-only, and defensive-guard assertions under `coverage/`.
    - Keep adapter behavior and contract tests in the functional lane.
- **Naming:** Prefer directory-based separation over suffixes for clarity; if needed, optional suffix `.coverage.test.ts` within the `coverage/` directory.

#### Coverage Targets (Guidance)

- Aim for ~100% statements/lines; exclude `src/_interfaces/**` as needed. Console-only lines may remain uncovered.

#### Troubleshooting

- "Mock hoisting" error: Ensure spies are declared inside `vi.mock` factory; avoid outer-scope references.
- Circular import: Hoist `vi.mock('../src/vscode/adapters/Uri.adapter.js', ...)` before importing factories.
- Flaky timers: Use fake timers and explicit `vi.runAllTimers()` or set deterministic durations via config mocks.
- Platform path failures: Normalize paths in assertions.
- Noisy tests: Toggle `ENABLE_TEST_CONSOLE=true` only when debugging.

> Note: To improve coverage without changing behavior, non-essential console logging used purely for debugging MAY be commented out (or marked with c8 ignore) in libs. Prefer preserving warn/error that inform users; remove or comment verbose info/logs.

###### END: @fux/shared (END) <!-- Close Fold -->

### 3.2. :: @fux/mockly <!-- Start Fold -->

#### Policies

- Tests verify Mockly shim semantics; keep fast and isolated.
- Avoid coupling to shared adapters or specific consumer packages.

#### What Worked (Best Practices)

- In-memory state and path normalization ensuring cross-platform consistency.
- Deterministic document/editor semantics (e.g., trailing newline preservation in `MockTextDocument`).
- Use of `mockly.env.clipboard` for workflows requiring clipboard.

#### What Did Not Work / To Avoid

- Over-expanding shim surfaces beyond realistic VSCode contracts.
- Coupling Mockly tests to DI containers or specific consumer wiring.

#### Pitfalls & Error Corrections (Catalog)

- Ensure shim behaviors match VSCode contracts; add missing members only when required by consumers.
- Preserve document semantics precisely (e.g., `getText()` mirrors content including trailing newline when applicable).

#### Test Lanes & Commands

- Quick: `mockly t`
- Coverage: `mockly tc`

#### Coverage Targets (Guidance)

- High coverage on core shims and observable behavior; avoid asserting on console.

#### Troubleshooting

- Cross-platform path behavior: normalize and compare predictable shapes.
- Isolation: reset internal state between tests if applicable.

###### END: @fux/mockly (END) <!-- Close Fold -->

###### END: Libs Packages Strategy (Shared + Mockly) (END) <!-- Close Fold -->

## 4. :: Toolchain Resilience & Safeguards (Stdlib/TypeScript) <!-- Start Fold -->

- **Safe Cleanup:** When removing generated artifacts, scope deletion to the package (e.g., `libs/shared/**/*.d.ts, *.js.map`). Do not touch `node_modules/**`.
- **Check-Types Config:** If using a check-only tsconfig, avoid `composite` with `noEmit: true`. Use `noEmit: true` without `composite`, or keep `composite` in build configs only.
- **Stdlib Verification:** If errors like `TS2318 Cannot find global type 'Array'` or missing `lib.dom.d.ts` appear:
    - Reinstall toolchain: `pnpm add -D -w typescript@<workspace-version>` then `pnpm install`.
    - Confirm stdlibs exist: `node_modules/typescript/lib/lib.es2022.d.ts`, `lib.dom.d.ts`.
    - Re-run: `shared tsc`.
- **Pin Libraries:** Explicitly set `compilerOptions.lib` where appropriate (e.g., `["ES2022", "DOM"]`) for packages that need DOM types.
- **Source of Truth:** Keep `tsconfig.base.json` paths stable; prefer additive changes and avoid transient rewrites.

###### END: Toolchain Resilience & Safeguards (Stdlib/TypeScript) (END) <!-- Close Fold -->

## 5. :: Core Packages Strategy (Draft) <!-- Start Fold -->

### 4.1. :: Applicability

- Domain logic, services, and utilities that must remain decoupled from VSCode values.

### 4.2. :: Guidance

- DI-first: Resolve services via container where practical in integration tests; isolate in unit tests with narrow constructor wiring.
- Adapters over values: Import types only from VSCode; interact through `@fux/shared` adapters.
- Mockly usage: Allowed where it simulates environment (fs/path/window) without coupling core logic to VSCode.
- State verification: Prefer verifying outputs and side effects (e.g., fs writes, returned models) over internal calls.

### 4.3. :: Pitfalls to Avoid

- Importing VSCode values directly; keep value imports in shared.
- Large, shared global mocks that leak across tests; prefer per-suite isolation.

###### END: Core Packages Strategy (Draft) (END) <!-- Close Fold -->

## 6. :: Extension Packages Strategy (Draft) <!-- Start Fold -->

### 5.1. :: Applicability

- VSCode extensions (providers, commands, UI flows).

### 5.2. :: Guidance

- Integration via DI: Resolve services via the DI container; override adapters with Mockly shims (`iWorkspace`, `iWindow`, `iEnv`).
- Editor-state verification: Always assert editor opened and active editor set when workflows require it.
- Mockly-first: Prefer Mockly’s `workspace.fs`, `node.path.*`, and env clipboard shims; inject where appropriate.
- Path normalization: Normalize `fsPath` for cross-platform assertions.

### 5.3. :: Pitfalls to Avoid

- Asserting against the wrong window instance (use the injected mock instance).
- Timing flakiness; prefer deterministic durations and fake timers in UI tests.

###### END: Extension Packages Strategy (Draft) (END) <!-- Close Fold -->

## 7. :: Non-Authoritative Guidance Notice <!-- Start Fold -->

These strategies encode what worked, what did not, and the best practices we have converged on. They are strong defaults—not mandates. Testing is fluid and dynamic; adapt as needed for each package while honoring architectural rules (e.g., adapter boundaries, DI, determinism).

###### END: Non-Authoritative Guidance Notice (END) <!-- Close Fold -->
