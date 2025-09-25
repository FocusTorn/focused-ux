# Coverage Tests Directory

This directory contains test files specifically designed to achieve 100% code coverage for the mock-strategy library.

## Naming Convention

Coverage test files should be named using the pattern:

```
{module-name}.test-cov.ts
```

For example:

- `core.test-cov.ts` - covers uncovered lines in the core module
- `ext.test-cov.ts` - covers uncovered lines in the extension module
- `lib.test-cov.ts` - covers uncovered lines in the shared library module
- `tool.test-cov.ts` - covers uncovered lines in the tool module
- `plugin.test-cov.ts` - covers uncovered lines in the plugin module

## Purpose

These tests are specifically written to cover:

- Edge cases not covered by functional tests
- Error paths and exception handling
- Optional parameter branches
- Uncovered conditional statements
- Boundary conditions

## Running Coverage Tests

Coverage tests are automatically included when running:

```bash
pae ms tc  # Runs tests including coverage tests
```

Standard tests (without coverage tests) can be run with:

```bash
pae ms t   # Runs only functional tests
pae ms t -c # Runs functional tests with coverage report
```

## Guidelines

1. **Targeted Coverage**: Only test the specific uncovered lines identified by the coverage report
2. **Minimal Tests**: Write the smallest possible test to cover the uncovered line
3. **Clear Comments**: Document which lines are being covered
4. **No Duplication**: Don't duplicate functionality already tested in functional tests
5. **Edge Cases**: Focus on edge cases, error conditions, and boundary values

## Coverage Goals

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%
