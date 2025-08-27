# Coverage Tests

**Focus**: Code coverage and edge case testing
**Purpose**: Ensure comprehensive code coverage and test edge cases

## What These Tests Are For

- **Code Coverage**: Tests that exercise specific code paths to achieve coverage targets
- **Edge Cases**: Tests for boundary conditions and error scenarios
- **Uncovered Branches**: Tests for code paths that functional tests don't cover
- **Integration Coverage**: Tests that verify integration between components

## File Naming Convention

- **`.test-cov.ts` files**: Coverage tests organized by functionality/component
- **`.test.ts` files**: Functional tests (end state values)
- **`.test-unit.ts` files**: Unit tests (internal behavior, debugging)

## Test Organization

Coverage tests are organized by the component or functionality they cover:

- `window.adapter.test-cov.ts` - Window adapter coverage tests
- `tree-item.test-cov.ts` - Tree item adapter coverage tests
- `path-utils.test-cov.ts` - Path utilities coverage tests
- `uri-handler.test-cov.ts` - URI handler coverage tests
- `extension-api.test-cov.ts` - Extension API coverage tests
- `file-system.test-cov.ts` - File system coverage tests
- `common-utils.test-cov.ts` - Common utilities coverage tests
- `vscode-uri-factory.test-cov.ts` - VSCode URI factory coverage tests

## When These Tests Run

- **Functional tests** (`shared t`, `shared tf`): Only `.test.ts` files
- **Coverage tests** (`shared tc`, `shared tfc`): Both `.test.ts` and `.test-cov.ts` files

## Test Philosophy

Coverage tests answer the question: **"Are we testing all the code paths?"**

They focus on **completeness** rather than **user outcomes**, making them:

- **Comprehensive** - Cover edge cases and error paths
- **Coverage-focused** - Target specific uncovered code branches
- **Integration-heavy** - Test how components work together
- **Error-scenario focused** - Test failure modes and error handling

## Example

```typescript
// ✅ CORRECT - Test edge case for coverage
it('should handle empty string input gracefully', () => {
    const adapter = new UriAdapter('')
    expect(adapter.path).toBe('')
    expect(adapter.fsPath).toBe('')
})

// ✅ CORRECT - Test error scenario for coverage
it('should throw error for invalid URI format', () => {
    expect(() => new UriAdapter('invalid:uri:format')).toThrow()
})
```

## Relationship to Other Test Types

- **Functional tests** focus on user outcomes and normal behavior
- **Unit tests** focus on internal component behavior and isolation
- **Coverage tests** focus on completeness and edge case coverage

## Best Practices

- Keep coverage tests focused on uncovered code paths
- Test edge cases and error scenarios
- Ensure tests actually improve coverage metrics
- Consider if coverage tests can be simplified into functional tests
- Document why each coverage test exists (what path it covers)
- Organize tests by component/functionality for better maintainability
