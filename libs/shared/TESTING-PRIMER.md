### Shared Library Testing – Continuation Primer

#### Goal

- Achieve and sustain **100% coverage** (statements, branches, functions, lines) for `libs/shared`, excluding `src/_interfaces/**`.
- Keep tests isolated from `@fux/mockly`; mock `vscode` APIs locally per test.
- Maintain green builds and stable tests (`shared t`, `shared tc`).

#### Current Status

- Vitest config scoped to `libs/shared` with `vscode` alias and coverage exclude for interfaces.
- Tests cover most adapters/services; coverage is high and stable.
- One extra test around `VSCodeUriFactory` may need a hoisted mock of `UriAdapter` to avoid static initialization issues.

#### Completed Work (high level)

- Config:
    - `libs/shared/vitest.config.ts`: aliases `vscode` to the test adapter; excludes `src/_interfaces/**` from coverage; runs within `libs/shared` root.
    - `libs/shared/tsconfig.lib.json`: excludes `src/__tests__/**` from library compilation.
- Test architecture:
    - Removed reliance on `@fux/mockly` in shared tests; no circular deps with `@fux/mockly`.
    - Prefer per-file `vi.mock('vscode', ...)` and targeted stubs over a global setup file.
    - Timers and progress flows are mocked to ensure synchronous, deterministic assertions.
- Coverage expansion:
    - Added micro-tests for adapters/services including (examples):
        - `Uri.adapter`, `VSCodeUriFactory`, `PathUtils.adapter`, `Window.adapter`
        - `FileSystem.adapter`, `Workspace.adapter`, `QuickPick.adapter`, `Terminal.adapter`
        - `Configuration.service`, `CommonUtils.adapter`, `Process.adapter`
        - `TreeItem.adapter`, `TreeItemFactory.adapter`, `TreeItemCollapsibleState.adapter`, `TreeDataProvider.adapter`
        - `Position.adapter`, `RelativePattern.adapter`, `DocumentSymbol.adapter`, `Extensions.adapter`, `Env.adapter`, `Context.adapter`, `Range.adapter`, `FileType.adapter`
- Auditor alignment:
    - Structure-auditor updated to enforce tsconfig excludes and prevent problematic patterns in `libs/shared`.

#### Remaining Work to Reach 100%

- Fix the static-initializer pitfall in extra `VSCodeUriFactory` test:
    - Hoist `vi.mock('../src/vscode/adapters/Uri.adapter.js', () => ({ UriAdapter: class { constructor(public uri: any) {} } }))` before importing `VSCodeUriFactory`.
- Close any residual uncovered branches/lines (re-run coverage to confirm):
    - PathUtils: warning/catch paths for invalid inputs and `path.relative` errors.
    - VSCodeUriFactory: error logging branches, `joinPath` filtering.
    - Window: timed UI message branches (dropdown/description reset after duration).
    - TreeItem / TreeItemFactory / TreeItemCollapsibleState: edge defaulting/guards.
    - Uri.adapter: factory/setter and invalid value guards.
    - FileSystem / CommonUtils / Extension / Position / RelativePattern / WorkspaceCCP: remaining edge branches.
- Add coverage thresholds to config if desired (optional, after green 100%).
- Update docs after completion:
    - `docs/Actions-Log.md`: note shared coverage milestone.
    - If testing guidance changed, update `packages/note-hub/ext/__tests__/TESTING_STRATEGY.md` accordingly.

#### How to Run

- Quick cycles:
    - `shared t` — run tests without coverage (fast).
    - `shared tc` — run tests with coverage.
- Optional debug:
    - `ENABLE_TEST_CONSOLE=true shared t` — enable console output inside tests when debugging.

#### Mocking Policy (shared)

- Do not import `@fux/mockly` from shared tests.
- Prefer localized `vi.mock('vscode', ...)` per test file; only mock the symbols used.
- When `UriAdapter` static default factory causes constructor errors:
    - Hoist a mock for `../src/vscode/adapters/Uri.adapter.js` before importing the subject under test.

#### Troubleshooting

- Nx hash/InvalidSymbol issues: `nx reset`, `nx daemon --stop`, then delete `.nx/`.
- Timer-based tests: use `vi.useFakeTimers()` and clear/run timers deterministically.
- Module resolution during tests: ensure imports go through `@fux/shared` or relative paths that the config aliases resolve.

#### Acceptance Criteria

- `shared tc` shows 100% across metrics for `libs/shared` (excluding `src/_interfaces/**`).
- All tests deterministic (no timeouts, no flakiness), no reliance on `@fux/mockly`.
- Auditor and type checks remain green across the chain.
