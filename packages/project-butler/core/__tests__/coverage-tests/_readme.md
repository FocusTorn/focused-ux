# Coverage Tests for @fux/project-maid-core

This directory contains tests specifically designed to achieve 100% code coverage by targeting uncovered branches, statements, and edge cases.

## Purpose

These tests focus on defensive programming branches, error handling paths, and edge cases that may not be covered by the main functional and unit tests.

## Test Files

Currently, no coverage-specific tests are needed as the main test suite achieves 100% coverage.

## Coverage Targets

### PackageJsonFormattingService
- Error handling for missing .FocusedUX file
- Error handling for invalid YAML content
- Error handling for missing packageJson-order configuration
- Error handling for missing package.json file
- Error handling for file write failures
- Unknown key handling and validation
- Comment-like key preservation
- Name field prioritization logic

### TerminalManagementService
- File vs directory path handling
- Error handling for file system operations

### BackupManagementService
- Backup file naming logic (.bak, .bak2, etc.)
- File existence checking
- Error handling for file operations
- Path manipulation and validation

### PoetryShellService
- Directory vs file path handling
- Error handling for file system operations
- Command generation logic

### ProjectMaidManagerService
- Service delegation validation
- Error propagation through service chain

## Best Practices

- **Defensive Programming**: Test all error conditions and edge cases
- **Branch Coverage**: Ensure all conditional branches are tested
- **Error Propagation**: Validate that errors properly propagate through the service chain
- **Edge Cases**: Test boundary conditions and unusual inputs
- **Logging Branches**: Test any logging or debugging code paths

## Coverage Validation

Run coverage tests with:
```bash
pmc tc  # Test with coverage
```

Target coverage metrics:
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100% 