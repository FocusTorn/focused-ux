# ESLint Rules Test Suite

This directory contains comprehensive tests for the FocusedUX ESLint plugin rules.

## Test Structure

- `folding-brackets.test.js` - Tests for the folding-brackets rule
- `padding.test.js` - Tests for the padding rule
- `plugin-integration.test.js` - Integration tests for the entire plugin

## Running Tests

### All Tests

```bash
nx test @focused-ux/eslint-rules
```

### Individual Rule Tests

```bash
# Test only folding-brackets rule
nx test @focused-ux/eslint-rules --testPathPattern="folding-brackets"

# Test only padding rule
nx test @focused-ux/eslint-rules --testPathPattern="padding"

# Test only integration tests
nx test @focused-ux/eslint-rules --testPathPattern="plugin-integration"
```

### With Coverage

```bash
nx run @focused-ux/eslint-rules:test:coverage
```

### Specific Test Types

```bash
# Test only rule-specific tests
nx run @focused-ux/eslint-rules:test:rules

# Test only integration tests
nx run @focused-ux/eslint-rules:test:integration
```

### Watch Mode

```bash
nx test @focused-ux/eslint-rules --watch
```

## Test Coverage

The test suite covers:

### Folding Brackets Rule

- ✅ Single-line blocks (should pass)
- ✅ Multi-line blocks with correct folding markers (`//>` and `//<`)
- ❌ Multi-line blocks missing opening marker
- ❌ Multi-line blocks missing closing marker
- ❌ Multi-line blocks missing both markers
- ✅ Nested objects/arrays (should be ignored)
- ✅ Empty blocks (should pass)

### Padding Rule

- ✅ Valid spacing patterns
- ❌ Missing required blank lines
- ❌ Unexpected blank lines
- ✅ Custom matchers for test functions
- ✅ Array patterns (multiple statement types)
- ✅ Wildcard patterns
- ✅ Auto-fix functionality

### Plugin Integration

- ✅ Plugin structure and exports
- ✅ Recommended configuration
- ✅ Test files configuration
- ✅ Custom configuration support
- ✅ Rule interaction and conflicts

## Test Patterns

### Valid Code Examples

```javascript
// Folding brackets - correct
const obj = {
    //>
    a: 1,
    b: 2,
} //<

// Padding - correct spacing
const setup = 1

describe('test', () => {
    it('first', () => {})
    it('second', () => {})
})
```

### Invalid Code Examples

```javascript
// Folding brackets - missing markers
const obj = {
    a: 1,
    b: 2,
}

// Padding - missing blank line
const setup = 1
describe('test', () => {
    it('first', () => {})

    it('second', () => {})
})
```

## Adding New Tests

When adding new test cases:

1. **Follow the RuleTester pattern** - Use valid/invalid arrays
2. **Include error messages** - Specify expected messageId
3. **Test auto-fix** - Include output property for fixable rules
4. **Cover edge cases** - Empty blocks, nested structures, etc.
5. **Test configurations** - Different rule options and patterns

## Debugging Tests

To debug failing tests:

1. **Check rule logic** - Verify the rule implementation
2. **Validate test data** - Ensure test code matches expectations
3. **Check parser options** - Verify ecmaVersion and sourceType
4. **Review error messages** - Confirm messageId matches rule definition

## Performance Considerations

- Tests run quickly (< 1 second for full suite)
- RuleTester is optimized for ESLint rules
- Integration tests use real ESLint engine
- Coverage collection adds ~2-3 seconds overhead
