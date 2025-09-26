# PAE Test Coverage and Mock Strategy Development - Lessons Learned

## Overview

This document captures key learning patterns, solutions, and insights from the PAE (Project Alias Expander) test coverage improvement and mock strategy library development session.

## Lessons Learned

### **Test Structure and Organization**

- Learning: Line-coverage tests should be separate from functional tests and follow a specific naming convention
- Pattern: Use `{module-name}.test-cov.ts` in `coverage-tests/` directory for line-coverage-only tests
- Implementation: Moved line-coverage tests from `functional-tests/lib.test.ts` to `coverage-tests/lib.test-cov.ts`
- Benefit: Clear separation of concerns, follows project guidelines, easier maintenance
- Not documented: The `_readme.md` guidelines exist but weren't initially followed, causing test placement confusion

### **Global Mock Placement for Node.js Built-ins**

- Learning: Moving `node:child_process` mock to global setup (`globals.ts`) resolves ESLint errors and provides better consistency
- Pattern: Global mocks in `globals.ts` for Node.js built-ins that multiple tests need
- Implementation: Added `vi.mock('node:child_process', ...)` to `libs/project-alias-expander/__tests__/__mocks__/globals.ts`
- Benefit: Eliminates `require()` statements in tests that cause ESLint violations
- Not documented: While the docs mention global mocks, they don't specifically address this ESLint issue with `require()` statements

### **Environment Variable Control for Shell Output**

- Learning: PowerShell and Bash scripts can be controlled via environment variables to suppress output during tests
- Pattern: Wrap shell script output commands with conditional checks based on `ENABLE_TEST_CONSOLE` environment variable
- Implementation: Both PowerShell (`Write-Host`) and Bash (`echo`) commands need conditional wrapping
- Benefit: Prevents test output noise while maintaining script functionality
- Not documented: The docs don't mention controlling shell script output during tests

### **Mock Configuration Structure for Complex CLI Testing**

- Learning: When testing CLI applications, mock configs need to include all necessary sections to prevent undefined property access
- Pattern: Mock configs must be complete JSON structures that match real config expectations
- Implementation: Include `packages`, `package-targets`, `not-nx-targets`, and `expandables` sections
- Benefit: Prevents "Cannot read properties of undefined" errors in CLI tests
- Not documented: The docs don't address the need for complete mock configurations in CLI testing scenarios

### **Process.exit() Testing Pattern**

- Learning: When testing code that calls `process.exit()`, the standard approach is to expect it to throw in test environments rather than trying to mock it
- Pattern: `expect(() => main()).toThrow()` instead of mocking `process.exit`
- Implementation: Used in `main-execution.test.ts` for help, unknown alias, and missing command scenarios
- Benefit: `process.exit()` throws in test environments, which is the expected behavior
- Not documented: The current docs don't mention this specific pattern for testing exit scenarios

### **Test Isolation with process.argv Manipulation**

- Learning: When testing CLI main functions, proper cleanup of `process.argv` is critical for test isolation
- Pattern: Save original `process.argv`, modify for test, restore in `finally` block
- Implementation: Used in multiple CLI tests with `const originalArgv = process.argv` and restoration
- Benefit: Without proper cleanup, tests can interfere with each other
- Not documented: While the docs mention test isolation, they don't specifically address `process.argv` cleanup patterns

### **Shared Mock Strategy Library Development**

- Learning: Reusable mock scenarios should be moved to shared libraries for broader application
- Pattern: Create `setupCliConfigScenario` in `@fux/mock-strategy/lib` for CLI testing
- Implementation: Moved CLI config scenario from PAE-specific to shared mock-strategy library
- Benefit: Promotes reusability and consistency across packages
- Not documented: The docs don't address when and how to promote package-specific patterns to shared libraries

### **Build Configuration Debugging**

- Learning: Missing commas in JSON configuration can cause targets to resolve to `nx:noop`
- Pattern: Check JSON syntax in `nx.json` when build targets fail unexpectedly
- Implementation: Fixed missing comma after `executor` property in `build:core` target
- Benefit: Prevents silent build failures and confusing error messages
- Not documented: The docs don't mention this specific JSON syntax pitfall in Nx configuration

### **Coverage Testing Techniques**

- Learning: Achieving 100% branch coverage requires creative mocking techniques for edge cases
- Pattern: Mock global functions like `String.prototype.match` to trigger specific code paths
- Implementation: Used to cover fallback branches in regex processing functions
- Benefit: Ensures complete test coverage of error handling and edge cases
- Not documented: The docs don't address advanced mocking techniques for branch coverage

### **Global CLI Tool Troubleshooting**

- Learning: Global CLI tools can fail due to missing build output directories, not just `node_modules` corruption
- Pattern: Check for missing `dist` directories when global tools fail with "Cannot find module" errors
- Implementation: Running `nx run @fux/project-alias-expander:build` created the missing `dist` directory
- Benefit: Prevents unnecessary `node_modules` reinstallation and identifies root cause
- Not documented: The docs don't address this specific troubleshooting scenario for global CLI tools

### **Documentation Organization and Cross-References**

- Learning: Troubleshooting information should be separated from main strategy documents for better visibility
- Pattern: Create dedicated troubleshooting guides and cross-reference them from main documentation
- Implementation: Created `docs/testing/Troubleshooting - Tests.md` and moved relevant content from `_Testing-Strategy.md`
- Benefit: Improves discoverability and organization of troubleshooting information
- Not documented: The docs don't address when to create separate troubleshooting documents

### **Regex Debugging and Testing**

- Learning: Complex regex patterns require isolated testing to understand behavior and edge cases
- Pattern: Use Node.js command line testing to debug regex patterns before implementing tests
- Implementation: Used `node -e` commands to test regex patterns and understand their behavior
- Benefit: Prevents test failures and ensures correct understanding of regex behavior
- Not documented: The docs don't address debugging techniques for complex regex patterns in tests

## Key Achievements

### **Test Coverage Results**

- **100% line coverage** achieved for mock-strategy library
- **100% branch coverage** achieved through creative mocking techniques
- **100% function coverage** maintained
- **250/250 tests passing** across all test suites

### **Architecture Improvements**

- **Shared mock strategy library** created with reusable CLI config scenarios
- **Global mock setup** established for Node.js built-ins
- **Environment variable control** implemented for shell script output
- **Troubleshooting documentation** organized and cross-referenced

### **Testing Patterns Established**

- **Test structure separation** between functional and coverage tests
- **Process.argv isolation** patterns for CLI testing
- **Process.exit() testing** approach for exit scenarios
- **Mock configuration completeness** requirements for CLI testing

## Tools and Techniques Used

### **Testing Tools**

- **Vitest** for test execution and coverage
- **Node.js command line** for regex debugging
- **ESLint** for code quality enforcement

### **Mocking Techniques**

- **Global mocks** for Node.js built-ins
- **Prototype mocking** for branch coverage
- **Environment variable mocking** for shell output control
- **JSON.stringify mocking** for error scenario testing

### **Debugging Approaches**

- **Isolated regex testing** with Node.js command line
- **Build configuration analysis** for Nx target resolution
- **Global CLI tool troubleshooting** for missing build outputs
- **Coverage analysis** for identifying uncovered branches

## Future Applications

These lessons learned can be applied to:

- **Other package testing** in the FocusedUX monorepo
- **CLI tool development** and testing
- **Mock strategy library** expansion
- **Documentation organization** improvements
- **Build configuration** debugging
- **Test coverage** improvement projects

## Related Documentation

- `docs/testing/_Testing-Strategy.md` - Main testing strategy
- `docs/testing/Troubleshooting - Tests.md` - Troubleshooting guide
- `docs/testing/Mock-Strategy_General.md` - Mock strategy guidelines
- `libs/mock-strategy/__tests__/coverage-tests/_readme.md` - Coverage test guidelines
