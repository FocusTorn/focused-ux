# Actions Log

## 📋 **CRITICAL: Log Entry Guidelines** <!-- Start Fold -->

**Why This Matters:** The Actions Log serves as our collective memory and troubleshooting guide. When done right, it prevents future developers from repeating the same mistakes and provides a roadmap for solving similar problems.

### **🚦 Entry Creation Policy (Gating Conditions)**

Only add an Actions Log entry when one of the following is true:

- **Retro invoked**: The `retro` command has been issued for the session
- **Resolution confirmed**: It has been explicitly stated that the issue is resolved
- **Explicit request**: There is a direct request to add an Actions Log entry

If none of the above are true, do not add an entry yet. Capture notes locally and add the entry later when a gating condition is met.

#### **Completeness Gate (REQUIRED Sections)**

An entry MUST include all of the following sections, or it will be rejected:

- **Key Implementations**
- **Critical Lessons Learned**
- **What Was Tried and Failed**
- **Outcomes**
- **Anti-Patterns Identified** (when applicable)

### **🎯 Getting Started: The Basics**

#### **When to Create an Entry**

Create a log entry whenever you:

- **Solve a complex problem** that took multiple attempts
- **Discover a new pattern** that others should follow
- **Fix something that broke** and you want to prevent it from breaking again
- **Implement a significant change** that affects multiple parts of the system

#### **When NOT to Create an Entry**

Skip the log for:

- Simple bug fixes with obvious solutions
- Routine maintenance tasks
- Minor formatting changes

### **📅 Date Accuracy: The Foundation**

#### **Why Dates Matter**

Your log entry date should reflect **when the work was actually completed**, not when you wrote the entry. This matters because:

- **File timestamps** tell the real story of when changes happened
- **Git commits** might not match when the actual work was done
- **Future developers** need to understand the real timeline of problem-solving

#### **Getting the Right Date**

Before creating an entry, check when the files were actually modified:

```powershell
# Quick check - when were the key files last modified?
$paths = @(
    "packages\note-hub\core\src\**\*.ts",
    "packages\note-hub\ext\src\**\*.ts",
    "libs\shared\src\**\*.ts",
    "libs\mockly\src\**\*.ts"
)

$maxDate = $paths | ForEach-Object { Get-ChildItem $_ -Recurse } |
    Measure-Object -Property LastWriteTime -Maximum |
    Select-Object -ExpandProperty Maximum

Get-Date $maxDate -Format "yyyy-MM-dd"
```

**Use this format:** `## YYYY-MM-DD` (e.g., `## 2025-08-17`)

### **📝 Entry Structure: The Complete Template**

Here's the structure every log entry should follow (all sections marked REQUIRED must be present):

```markdown
## YYYY-MM-DD <!-- Start Fold -->

### Entry Title: Brief Description of What Was Accomplished <!-- Start Fold -->

**High-Level Summary:** One sentence that captures what you achieved and why it matters.

#### Key Implementations: <!-- REQUIRED -->

- **Specific Change 1:** What you actually implemented or modified
- **Specific Change 2:** Another change you made
- **Specific Change 3:** Any additional changes

#### Critical Lessons Learned: <!-- REQUIRED -->

- **Lesson 1:** Actionable insight that can guide future work
- **Lesson 2:** Another key learning from this experience
- **Lesson 3:** Any additional insights worth sharing

#### What Was Tried and Failed: <!-- REQUIRED -->

- ❌ **First Attempt:** What you tried that didn't work (be specific)
- ❌ **Second Attempt:** Another approach that failed
- ❌ **Third Attempt:** Yet another unsuccessful attempt

#### Outcomes: <!-- REQUIRED -->

- **Outcome 1:** Specific result or improvement achieved
- **Outcome 2:** Another concrete result
- **Outcome 3:** Any additional benefits

#### Anti-Patterns Identified:

- ❌ **Anti-Pattern 1:** General principle of what NOT to do
- ❌ **Anti-Pattern 2:** Another principle to avoid
- ❌ **Anti-Pattern 3:** Any other anti-patterns

###### END: Entry Title: Brief Description of What Was Accomplished <!-- Close Fold -->

###### END: YYYY-MM-DD <!-- Close Fold -->
```

### **💡 Pro Tips for Great Entries**

#### **Make It Actionable**

- **Don't just describe what happened** - explain what others should do differently
- **Include specific commands** that worked (e.g., `nh tsc` → PASS)
- **Document the exact error messages** you encountered and how you solved them

#### **Focus on the Journey (MANDATORY)**

- **What Was Tried and Failed** is mandatory for reproducibility and institutional learning
- **Include the troubleshooting steps** that led you to the solution
- **Document the "aha moments"** that unlocked the problem

#### **Keep It Scannable**

- Use **bold text** for key concepts
- Use **❌ emojis** for failures and anti-patterns
- Use **✅ emojis** for successes and best practices
- Keep **bullet points concise** and action-oriented

### **🚀 Ready to Write Your First Entry?**

1. **Check the file dates** to get the right date
2. **Follow the template structure** exactly
3. **Focus on lessons learned** and failed attempts
4. **Make it actionable** for future developers
5. **Use the fold markers** for VSCode navigation

Remember: **Every great log entry saves someone else hours of troubleshooting.** Take the time to make yours valuable!

###### END: Log Entry Guidelines <!-- Close Fold -->

## 2025-08-16 <!-- Start Fold -->

### Shared/Mockly: TS Path Mapping to Resolve '@fux/shared' in Mockly <!-- Start Fold -->

**High-Level Summary:** Fixed mockly type-check failures (TS2307) by adding workspace path mappings for `@fux/shared`, enabling the mockly build/check-types to resolve shared exports during compilation.

#### Key Implementations:

- Updated `tsconfig.base.json` `compilerOptions.paths`:
    - `"@fux/shared": ["libs/shared/src/index.ts"]`
    - `"@fux/shared/*": ["libs/shared/src/*"]`

#### Outcomes:

- `nh tsc` → PASS across dependent projects (mockly and ext chain successfully type-check).
- No further TS2307 errors for `@fux/shared` in `libs/mockly/src/services/MockUriFactory.service.ts`.

###### END: Shared/Mockly: TS Path Mapping to Resolve '@fux/shared' in Mockly <!-- Close Fold -->

### Shared Library: TypeScript Recovery & Safeguards After Cleanup <!-- Start Fold -->

**High-Level Summary:** Recovered TypeScript standard library resolution after an aggressive cleanup removed generated declaration/map files and surfaced missing stdlib errors. Stabilized `check-types` and documented safe cleanup and recovery procedures.

#### Key Implementations:

- Restored TypeScript stdlib availability by ensuring workspace TypeScript is installed and resolved correctly (verify `node_modules/typescript/lib/lib.es2022.d.ts`, `lib.dom.d.ts`).
- Revalidated `@fux/shared` type-checks via the dedicated target to green.
- Added safeguards and a safe cleanup recipe to avoid repeat incidents.

#### Outcomes:

- `shared tsc` → PASS (post-recovery).
- No further TS2318/TS6053 errors related to missing standard libraries.

#### Notes & Safeguards:

- Prefer targeted cleanup within the package directory. Avoid commands that could impact toolchain files in `node_modules`.
- If using a check-only tsconfig, avoid the `composite` + `noEmit: true` conflict; either drop `composite` or allow declarations to emit in build-only configs.

###### END: Shared Library: TypeScript Recovery & Safeguards After Cleanup <!-- Close Fold -->

### Shared Library: Functional vs Coverage Test Split Implemented <!-- Start Fold -->

**High-Level Summary:** Separated functional tests from coverage-only tests in `@fux/shared` to keep day-to-day feedback fast while preserving 100% coverage enforcement in a dedicated lane.

#### Key Implementations:

- Directory split:
    - Functional: `libs/shared/__tests__/`
    - Coverage-only: `libs/shared/__tests__/coverage/`
- Vitest configs:
    - `libs/shared/vitest.functional.config.ts` excludes `__tests__/coverage/**` and uses `__tests__/_setup.ts`.
    - `libs/shared/vitest.coverage.config.ts` includes both functional and coverage-only tests; same setup file.
- Nx targets:
    - `@fux/shared:test` → functional lane (`shared t`)
    - `@fux/shared:test:full` → full + coverage lane (`shared tc`)
- Renamed setup: `setup.ts` → `_setup.ts` and updated references.

#### Outcomes:

- Faster developer loop with functional tests only.
- Retained 100% coverage via the coverage lane.

#### Notes:

- Coverage-only tests focus on defensive and logging branches; remove any that do not impact metrics or behavior.

###### END: Shared Library: Functional vs Coverage Test Split Implemented <!-- Close Fold -->

### Workspace: Adopted Functional vs Coverage Split Across All Packages <!-- Start Fold -->

**High-Level Summary:** Promoted the test split pattern (functional vs coverage lanes) to a workspace-wide convention. Documented global guidance and CI usage, keeping package configs consistent.

#### Key Implementations:

- Global guidance added to testing strategy under "Test Lanes: Functional vs Coverage (All Packages)".
- Standardized conventions for directories, Vitest configs, Nx targets, and setup filename (`_setup.ts`).

#### Outcomes:

- Consistent developer workflows across libs, core, and ext projects.
- Faster PR validation while preserving coverage enforcement in targeted jobs.

#### Next Steps:

- Propagate configs to core/ext packages following the documented pattern.

###### END: Workspace: Adopted Functional vs Coverage Split Across All Packages <!-- Close Fold -->

### Shared Library: 100% Coverage Achieved Across All Metrics <!-- Start Fold -->

**High-Level Summary:** Finalized `libs/shared` coverage to 100% for statements, branches, functions, and lines. Closed the last branch gap by adding a focused test for the `FileSystemAdapter.stat()` directory path and ensured TS-sound test mocks for `TreeItem`.

#### Key Implementations:

- Added `__tests__/file-system.adapter.directory-branch.test.ts` to cover `stats.isDirectory()` true branch, bringing `FileSystem.adapter.ts` to 100% branches.
- Adjusted `__tests__/tree-item.adapter.branches.test.ts` mock to declare `resourceUri` and `iconPath` on the `TreeItem` class for TypeScript correctness.
- Verified with `shared tc -s` (coverage) and `shared tsc` (type checks).

#### Outcomes:

- `shared tc -s` → PASS. Coverage (v8): 100% Statements, 100% Branches, 100% Functions, 100% Lines for `@fux/shared`.
- Adapters aggregate at 100% branch coverage; no remaining uncovered lines.

#### Notes:

- Shared tests continue to avoid `@fux/mockly` per policy; all `vscode` API usage is locally mocked per test file.

###### END: Shared Library: 100% Coverage Achieved Across All Metrics <!-- Close Fold -->

### Shared Library: Coverage Hardening to 99.75% and Testing Primer Alignment <!-- Start Fold -->

**High-Level Summary:** Expanded and refined `libs/shared` test suite to close remaining coverage gaps and align with the testing primer. Achieved ~99.75% overall coverage with all critical adapters fully covered; remaining uncovered lines are benign logging or defensive no-op branches.

#### Key Implementations:

- Added targeted tests for adapters/services:
    - `VSCodeUriFactory`: error catch path for `file()` and `create()` wrapper; `joinPath` filtering; `dirname` invalid fallback.
    - `PathUtilsAdapter`: whitespace inputs, empty relative-path returns, and exception path from `path.relative`.
    - `TreeItemAdapter`: `resourceUri` set/clear, `iconPath` undefined branch, `ThemeColorAdapter.create()`.
    - `WindowAdapter`: guarded `showErrorMessage`, `showTextDocument` unwrap/raw, `_getDuration` early-return and config path, status bar overloads, dropdown/description duration flows.
- Fixed hoisted mock pitfalls by defining spies inside `vi.mock` factories and asserting through the imported `vscode` module.

#### Outcomes:

- `shared tc` → PASS. 48 files, 57 tests passed.
- Coverage (v8): Statements 99.75%, Branches 92.88%, Functions 99.40%, Lines 99.75%.
- No reliance on `@fux/mockly` in shared tests; localized `vi.mock('vscode', ...)` per file, per primer.

#### Notes on "benign logging" branches:

- The only lines not covered are internal `console.log`/`console.warn`/`console.error` statements and defensive return guards (e.g., in `VSCodeUriFactory` and UI helpers). They do not affect behavior or outputs—only diagnostics. We intentionally avoid asserting on console side effects to keep tests deterministic and quiet unless debugging is enabled.

#### How to Re-run:

- Quick: `shared t`
- Coverage: `shared tc`

###### END: Shared Library: Coverage Hardening to 99.75% and Testing Primer Alignment <!-- Close Fold -->

###### END: 2025-08-16 <!-- Close Fold -->

## 2025-08-15 <!-- Start Fold -->

### Core Package Testing: DI Architecture & Mockly Integration Lessons <!-- Start Fold -->

**High-Level Summary:** Conducted comprehensive retrospective on note-hub-core refactoring, identifying critical lessons about core package testing architecture and DI patterns that must be followed across all core packages.

#### Key Implementations:

- **Complete DI Refactor:** Refactored note-hub-core to be fully DI-reliant, eliminating all direct `@fux/shared` imports
- **Testing Architecture Rules:** Established "No Shared During Tests" rule - core package tests must NEVER import from `@fux/shared`
- **Mockly Integration:** Implemented Mockly as complete replacement for shared library during testing via DI container injection

#### Critical Lessons Learned:

- **Test Environment Isolation:** Must isolate test environment from VSCode imports at module level, not just service level
- **Complete Implementation First:** Implement full architectural changes before testing, avoid incremental fixes
- **Mockly vs Hard-Coded Mocks:** Never create hard-coded mocks when comprehensive mock libraries exist
- **DI Architecture Understanding:** Core container injects functionality into ext packages and orchestrator extensions

#### Outcomes:

- note-hub-core builds error-free with full DI architecture
- Established clear testing patterns for all future core package development
- Updated project rules with critical testing anti-patterns and best practices

#### Anti-Patterns Identified:

- ❌ Aliasing `@fux/shared` to mock files in test configurations
- ❌ Partial replacement of shared dependencies - must be complete replacement
- ❌ Testing before completing architectural refactoring
- ❌ Creating hard-coded mocks when comprehensive mock libraries exist

###### END: Core Package Testing: DI Architecture & Mockly Integration Lessons <!-- Close Fold -->

### Mockly Usage Optimization & Testing Strategy Enhancement <!-- Start Fold -->

**High-Level Summary:** Successfully analyzed and optimized test file usage of mockly services, identifying what can be covered by mockly vs. what requires manual mocks. Updated testing strategy to maximize mockly usage while clearly documenting gaps and fallback strategies. Implemented solution for enabling console output in tests.

#### Key Implementations:

- **Mockly Coverage Analysis**: Systematically identified all services and utilities that can be provided by mockly vs. custom interfaces
- **Console Output Solution**: Implemented conditional console output control in test setup files

#### Mockly Coverage Analysis Results:

##### ✅ **MOCKLY CAN COVER:**

- VSCode core services: `window`, `workspace`, `commands`, `extensions`, `env`
- VSCode types: `Uri`, `Position`, `Range`, `Disposable`, `EventEmitter`
- Node.js utilities: `node.fs.access`, `node.path.*` (join, dirname, basename, parse, extname, normalize)
- File system operations: `workspace.fs.*` (stat, readFile, writeFile, readDirectory, delete, copy, rename)

##### ❌ **MOCKLY CANNOT COVER:**

- Custom interfaces specific to shared library: `ICommonUtilsService`, `IFrontmatterUtilsService`, `IPathUtilsService`
- Custom service interfaces: `INotesHubProviderManager`, `INotesHubProvider`
- Node.js `fs.rename` method (not available in mockly.node.fs)
- Extension-specific context and configuration

#### Console Output Solution:

**Problem Identified:** Test setup files were mocking console methods (`console.log`, `console.info`, etc.) to reduce test noise, preventing debugging output from being visible.

**Solution Implemented:**

1. **Environment Variable Control**: `ENABLE_TEST_CONSOLE=true` enables console output globally
2. **Programmatic Control**: `enableTestConsoleOutput()` function enables console output in specific tests
3. **Conditional Setup**: Test setup now conditionally enables/disables console output based on configuration

**Usage Examples:**

```bash
# Enable console output for debugging
ENABLE_TEST_CONSOLE=true nh t

# Programmatic control in tests
import { enableTestConsoleOutput } from '../setup'
enableTestConsoleOutput()
console.log('🔍 Debug output now visible!')
```

#### Testing Strategy Updates:

- **Mockly Optimization Guidelines**: Clear patterns for maximizing mockly usage
- **Fallback Strategies**: Documented when and how to use manual mocks
- **Console Output Control**: Comprehensive debugging strategies
- **Best Practices**: Updated patterns based on actual implementation findings

#### Impact and Benefits:

- **Improved Test Debugging**: Developers can now see console output when investigating test failures
- **Better Mockly Usage**: Clear guidelines for maximizing mockly coverage
- **Reduced Manual Mocking**: More consistent use of mockly's built-in capabilities

#### Files Modified:

- `packages/note-hub/ext/__tests__/setup.ts` - Added conditional console output control

#### Next Steps:

- Apply similar console output control to other package test setups
- Consider adding mockly configuration options for more granular control
- Monitor test performance and reliability with the new console output system

###### END: Mockly Usage Optimization & Testing Strategy Enhancement <!-- Close Fold -->

###### END: 2025-08-15 <!-- Close Fold -->

## 2025-08-12 <!-- Start Fold -->

### Alias CLI: fix `nh tc` and add `-echo` preview flag <!-- Start Fold -->

**High-Level Summary:** Fixed alias expansion so `tc` correctly maps to multi-word targets, and introduced an ephemeral `-echo` flag to preview the resolved Nx command without running it.

#### Key Implementations:

- Updated `libs/tools/aka/src/main.ts`:
    - Split multi-word target shortcuts (e.g., `tc` → `test --coverage`) before expansion and invocation
    - Added support for `-echo` (mapped to `--aka-echo`) that temporarily sets `AKA_ECHO=1` for a single invocation and restores prior state
    - Ensured run-many aliases (`ext|core|all`) respect `-echo`
- Extended `.vscode/shell/pnpm_aliases.json` `expandables` with `"echo": "aka-echo"`

#### Outcomes:

- `nh tc` now runs `test:full --coverage` for `@fux/note-hub-ext`
- `nh tc -echo` prints: `NX_CALL -> test:full @fux/note-hub-ext --coverage`
- `ext tc -echo` prints a `run-many` invocation with `--coverage`
- Lint checks pass for the modified files

###### END: Alias CLI: fix `nh tc` and add `-echo` preview flag <!-- Close Fold -->

### Note Hub: Decouple TreeItemCollapsibleState via shared adapter <!-- Start Fold -->

**High-Level Summary:** Removed direct usage of `vscode.TreeItemCollapsibleState` in core code and replaced it with a shared `TreeItemCollapsibleStateAdapter` to keep VSCode value imports isolated to shared adapters.

#### Key Implementations:

- Added `libs/shared/src/vscode/adapters/TreeItemCollapsibleState.adapter.ts` and exported it from `libs/shared/src/index.ts`
- Updated `packages/note-hub/core/src/models/NotesHubItem.ts` and `packages/note-hub/core/src/providers/BaseNotesDataProvider.ts` to use the adapter
- Adjusted tsconfig path mappings where needed to keep type checks green

#### Outcomes:

- Core no longer imports VSCode enums directly
- Aligns with repo rule: VSCode value imports must live in shared adapters
- `nh tsc` → PASS

###### END: Note Hub: Decouple TreeItemCollapsibleState via shared adapter <!-- Close Fold -->

### Note Hub: Decouple command registration via shared adapter <!-- Start Fold -->

**High-Level Summary:** Replaced direct `vscode.commands.registerCommand` usage in `@fux/note-hub-ext` with the shared `ICommands` adapter to enforce adapter-based decoupling and testability.

#### Key Implementations:

- Updated `packages/note-hub/ext/src/NotesHub.module.ts` to accept `ICommands` via constructor and use `commandsAdapter.registerCommand(...)` for all registrations
- Updated DI wiring in `packages/note-hub/ext/src/injection.ts` to pass `iCommands` into `NotesHubModule`

#### Outcomes:

- Extension code no longer depends on `vscode.commands` directly
- Improves adherence to repo rule: value imports for VSCode APIs must come only from shared adapters
- Type checks remain green (`nh tsc`)

###### END: Note Hub: Decouple command registration via shared adapter <!-- Close Fold -->

### Alias Launcher migrated to TS CLI (`@fux/aka`) with PS shim <!-- Start Fold -->

**High-Level Summary:** Moved complex alias resolution logic out of PowerShell into a typed, testable TypeScript CLI under `libs/tools/aka`. The `aka.ps1` script now forwards all invocations to the CLI via `tsx`, ensuring consistent flag expansion and "full" target semantics across shells.

#### Key Implementations:

- Added `libs/tools/aka` with `src/main.ts` implementing:
    - Target shortcuts expansion (`l`→`lint`, `lf`→`lint:full`)
    - Short/long flag expansion: `-f`→`--fix`, `-s`→`--skip-nx-cache`, `-fs`/`-sf` supported; `--fix`, `--skip-nx-cache` passthrough
    - Full alias semantics: aliases marked `full` in `.vscode/shell/pnpm_aliases.json` map `l|lint|test|validate` to `lint:full|test:full|validate:full`
    - Two-pass lint when `--fix` is present (with and then without `--fix`)
    - Run-many support for `ext|core|all`
- Moved PS shim into package: `libs/tools/aka/ps/aka.ps1`
- Updated `.vscode/shell/profile.ps1` to source the package shim directly
- Removed legacy stub; no `.vscode/shell/aka.ps1` needed anymore

#### Outcomes:

- `nh l` now correctly lints the entire dependency chain from `ext` down
- `nhc l` lints only core; `nhc lf` lints core + deps
- `nhe l` lints only ext; `nhe lf` lints ext + deps
- Flags accepted in any order/combination: `-f`, `-s`, `-fs`, `--fix`, `--skip-nx-cache`

#### Notes:

- CLI reads `.vscode/shell/pnpm_aliases.json` as the single source of truth
- Echo mode available for quick verification: `AKA_ECHO=1 tsx libs/tools/aka/src/main.ts nh l -fs`

###### END: Alias Launcher migrated to TS CLI (`@fux/aka`) with PS shim <!-- Close Fold -->

### Shared Mock Window Helper Extraction (Enhanced Integration Tests) <!-- Start Fold -->

**High-Level Summary:** Extracted the large inline `IWindow` mock from `notes-hub-action.enhanced-integration.test.ts` into a reusable helper to reduce duplication and improve readability while preserving editor utilities used in tests.

#### Key Implementations:

- Created `packages/note-hub/ext/__tests__/helpers/mockWindow.ts` exporting `makeMockWindowWithEditor()`
- Updated `notes-hub-action.enhanced-integration.test.ts` to consume the helper
- Preserved editor helpers: `moveCursor`, `selectText`, `modifyDocument`

#### Outcomes:

- Cleaner tests with reduced boilerplate
- Consistent editor-state testing across suites
- Test suite remains green: 58 passed, 2 skipped

#### Lessons Learned:

- Centralize complex mocks used across multiple tests to avoid drift
- Keep editor verification utilities together for consistent usage patterns

###### END: Shared Mock Window Helper Extraction (Enhanced Integration Tests) <!-- Close Fold -->

### Mockly Node Utilities Adoption & Type-Check Stabilization <!-- Start Fold -->

**High-Level Summary:** Standardized tests to use Mockly's Node path utilities and stabilized type-checking by scoping the ext project's check-types target to source files only. All tests and type checks pass via Nx aliases.

#### Key Implementations:

- **Mockly Node Path Utilities**: Replaced direct `require('node:path').*` usage in tests with `mockly.node.path.*` for consistency with the Mockly environment
    - File: `packages/note-hub/ext/__tests__/integration/notes-hub-action.integration.test.ts`
    - Added `import { mockly } from '@fux/mockly'`
    - Injected `mockly.node.path.join|dirname|basename|parse|extname` into `NotesHubActionService` and `NotesHubConfigService`

- **Type-Check Scope Fix**: Updated `packages/note-hub/ext/tsconfig.json` to exclude tests from the `check-types` target to avoid `rootDir` TS6059 cross-boundary errors
    - `include`: `src/**/*.ts`
    - `exclude`: `__tests__/**`

- **Aliases for Developer Workflow**: Validated and adopted workspace aliases
    - `nh tsc`: type checks the ext project
    - `nh test`: runs tests for the ext project

#### Result:

- `nh tsc` → PASS
- `nh test` → PASS (11 files, 60 tests: 58 passed, 2 skipped)

#### Lessons Learned:

- **Use Mockly for Node adapters in tests** to maintain environment parity and cross-platform path normalization
- **Keep check-types inputs bounded to project sources** to avoid `rootDir` violations when tests import other package sources
- **Prefer aliases** (`nh tsc`, `nh test`) to ensure correct Nx context

###### END: Mockly Node Utilities Adoption & Type-Check Stabilization <!-- Close Fold -->

###### END: 2025-08-12 <!-- Close Fold -->

## 2025-08-11 <!-- Start Fold -->

### Note Hub DI-Based Integration Testing & Mockly Enhancements <!-- Start Fold -->

**High-Level Summary:** Migrated integration tests to resolve services via the DI container, reduced brittle mocks by adopting Mockly shims (workspace.fs, node.fs.rename), and fixed MockTextDocument newline semantics. Clarified test lanes and simplified coverage usage.

#### Key Implementations:

- Integration tests resolve via `createDIContainer`; adapters overridden with Mockly (`iWorkspace`, `iWindow`, `iEnv`)
- Added Mockly `node.fs.rename` shim wired to in-memory `workspace.fs.rename`
- Preserved trailing newlines in `MockTextDocument.setContent`
- Normalized path separators in cross-platform assertions
- Simplified `test:full` (no coverage/verbose); use `tc`/`tcw` for coverage
- Global build-before-test via Nx targetDefaults (cache keeps runs fast)
- Added Mockly env clipboard shim to remove manual clipboard mocks (writeText/readText)

#### Outcomes:

- Note Hub tests: 58 passed, 2 skipped
- Type checks: green

#### Lessons Learned:

- Prefer DI resolution for integration to mirror runtime
- Prefer Mockly shims over ad-hoc mocks; normalize paths in asserts
- Keep coverage in dedicated lanes; keep `test` fast and focused
- Extend Mockly where low-risk gaps exist (e.g., env.clipboard) to reduce test boilerplate

###### END: Note Hub DI-Based Integration Testing & Mockly Enhancements <!-- Close Fold -->

###### END: 2025-08-11 <!-- Close Fold -->

## 2024-12-19 - Dual Vitest Configuration Pattern Implementation

### **Goals and Outcomes**

Successfully implemented a standardized dual Vitest configuration pattern across the monorepo, resolving persistent test execution issues and establishing a maintainable testing architecture.

### **What Was Tried and Failed**

- ❌ **Single Dynamic Config Approach:** Attempted to use a single `vitest.config.ts` with dynamic `include` logic based on `process.argv.includes('--coverage')`, but the `@nx/vite:test` executor silently ignored this logic
- ❌ **Unified Config with CLI Flags:** Tried modifying the unified config to handle both functional and coverage test patterns, but coverage tests were never included despite correct file paths and `process.argv` parsing
- ❌ **Direct VSCode Mocking in Tests:** Initially allowed direct `vi.mock('vscode')` calls in URI coverage tests, which conflicted with the global `vscode` alias to Mockly and caused test failures
- ❌ **Base Config Path Assumptions:** Created base configs assuming all packages would have tests in `__tests__/functional/` subdirectories, but mockly had tests directly in `__tests__/`
- ❌ **Project.json Configuration Bloat:** Initially added explicit `configFile` options to project.json files, violating the user's architectural preference for minimal configuration

### **Key Implementations**

- **Dynamic Config Injection:** Enhanced `aka` CLI tool to dynamically inject appropriate Vitest config files based on test target and coverage flags
- **Base Configuration Standardization:** Created `vitest.functional.base.ts` and `vitest.coverage.base.ts` for consistent test configuration across packages
- **Project.json Minimalism:** Removed explicit `configFile` options from all project.json files, maintaining clean configuration
- **Mockly Integration Fixes:** Corrected violations of Mockly-based VSCode API testing strategy by removing direct `vi.mock('vscode')` calls

### **Critical Fixes Applied**

- **Nx Executor Behavior:** Identified that `@nx/vite:test` executor silently ignores dynamic `include` logic in Vitest configs, requiring dual-config approach
- **Base Config Flexibility:** Updated base configs to accommodate both flat (`__tests__/*.test.ts`) and nested (`__tests__/functional/**/*.test.ts`) test organization patterns
- **Test Assertion Corrections:** Fixed URI test assertions to match Mockly's VSCode API behavior differences (fsPath, toString, query handling)
- **Configuration Injection:** Implemented relative path resolution for `--configFile` arguments to ensure Nx compatibility

### **Lessons Learned**

- **Executor Limitations:** Always investigate executor behavior before assuming configuration syntax issues
- **Mock Library Differences:** Mockly's VSCode API implementation may differ from actual VSCode behavior, requiring test adjustments
- **Base Configuration Design:** Base configs must accommodate multiple organizational patterns, not assume single structure
- **User Architectural Preferences:** Project.json minimalism is a core architectural principle that must be respected across all packages

### **Architectural Impact**

- Established standardized dual-config pattern for all packages (shared, mockly, project-butler-core, project-butler-ext)
- Enhanced `aka` CLI tool to support dynamic configuration injection for multiple packages
- Updated Global Testing Strategy documentation to prevent future architectural deviations
- Maintained clean project.json files while ensuring proper test execution and coverage reporting

---

### 2025-08-18 — Restore visible Vitest output for shared

- **Goal**: Ensure `shared t` and `shared tc` display clear test output after unified config refactor.
- **Key Changes**:
    - Set `root: __dirname` in `libs/shared/vitest.config.ts` to anchor relative globs.
    - Added `reporters: ['default']` and `silent: false` to guarantee visible output.
- **Verification**:
    - Ran `shared t -s --verbose` and observed per‑file/per‑test output.
    - Ran `shared tc -s --verbose` and observed coverage output and totals.
- **What was tried and failed**:
    - Relying on default reporters produced minimal/no visible output under Nx, especially with cache.
    - Running without `root` set caused relative `include` globs to resolve incorrectly, leading to confusing/no output.
    - Re‑running with cache on masked execution; success messages appeared without Vitest logs.
- **Lessons**:
    - Always set explicit reporters and `silent: false` in per‑package Vitest configs.
    - Use `-s --verbose` on aliases to bypass Nx cache when validating execution.
    - Set `root: __dirname` whenever using relative include patterns.

**Notes:**

_Entry dates have been corrected to match actual file modification dates based on file system timestamps. The original log had incorrect dates that didn't reflect when the work was actually completed._

_This log serves as a living document of successful implementation patterns and solutions. Each entry should include actionable insights that can be applied to future development work. New entries are to be added to the top._
