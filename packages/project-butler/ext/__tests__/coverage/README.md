# Coverage-Only Tests

This directory contains tests that are specifically designed to exercise code paths for coverage purposes.

## Purpose

According to the Global Testing Strategy, coverage-only tests should:

- Target defensive branches and error paths
- Exercise unreachable/log-only paths
- Focus on coverage metrics rather than behavior verification
- Be excluded from functional test runs for performance

## Test Placement Rules

- **Functional tests** (behavior and contract tests) go in the main `__tests__/` directory
- **Coverage-only tests** (defensive branches, error paths) go in this `coverage/` directory
- Tests in this directory are only run during `test:full` (coverage) runs
- Tests in this directory are excluded from `test` (functional) runs

## Naming Convention

Use descriptive names that indicate the purpose:

- `ErrorHandling.coverage.test.ts` - Tests error paths
- `DefensiveBranches.coverage.test.ts` - Tests defensive code
- `EdgeCases.coverage.test.ts` - Tests edge case scenarios

## Running Tests

**For complete, up-to-date alias descriptions, see `.vscode/shell/pnpm_aliases.json`**

```bash
# Run only functional tests (fast lane)
pbe t

# Run functional tests for target package AND all dependencies (full chain)
pbe tf

# Run coverage tests for target package only
pbe tc

# Run coverage tests for target package AND all dependencies (full chain with coverage)
pbe tfc
```
