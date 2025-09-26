# FocusedUX Testing Strategy - Coverage-Only Testing

This document provides advanced techniques and patterns specifically for achieving 100% test coverage, including branch coverage, edge cases, and complex mocking scenarios.

## 🎯 Coverage Testing Goals

### Target Metrics

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### Coverage Test Structure

- **Location**: `__tests__/coverage-tests/` directory
- **Naming**: `{module-name}.test-cov.ts`
- **Purpose**: Test only uncovered lines identified by coverage reports
- **Separation**: Never mix with functional tests

## 🔧 Advanced Mocking Techniques for Branch Coverage

### 1. Global Function Mocking

**Use Case**: Trigger specific code paths in conditional statements

```typescript
// Mock String.prototype.match to return null for fallback coverage
it('should cover fallback branch when match returns null', () => {
    const originalMatch = String.prototype.match
    String.prototype.match = vi.fn().mockReturnValue(null)

    try {
        const result = processString('test input')
        expect(result).toBe('fallback value')
    } finally {
        String.prototype.match = originalMatch
    }
})
```

### 2. JSON Parsing Error Simulation

**Use Case**: Cover catch blocks in JSON parsing

```typescript
// Mock JSON.stringify to return invalid JSON
it('should cover JSON parse error in catch block', () => {
    const originalStringify = JSON.stringify
    JSON.stringify = vi.fn().mockReturnValue('invalid json')

    try {
        expect(() => parseConfig('test')).toThrow('Invalid JSON')
    } finally {
        JSON.stringify = originalStringify
    }
})
```

### 3. Environment Variable Mocking

**Use Case**: Cover different environment variable states

```typescript
// Mock process.env for different scenarios
it('should cover different environment variable states', () => {
    const originalEnv = process.env.TEST_VAR

    // Test undefined state
    delete process.env.TEST_VAR
    expect(getConfigValue()).toBe('default')

    // Test specific value
    process.env.TEST_VAR = 'custom'
    expect(getConfigValue()).toBe('custom')

    // Restore
    if (originalEnv !== undefined) {
        process.env.TEST_VAR = originalEnv
    }
})
```

### 4. Prototype Method Mocking

**Use Case**: Cover fallback branches in regex processing

```typescript
// Mock specific regex patterns to trigger fallbacks
it('should cover regex fallback branches', () => {
    const originalMatch = String.prototype.match

    // Mock to return null for specific pattern
    String.prototype.match = vi.fn().mockImplementation(function (pattern) {
        if (pattern.toString().includes('specific-pattern')) {
            return null
        }
        return originalMatch.call(this, pattern)
    })

    try {
        const result = processWithRegex('test input')
        expect(result).toBe('fallback result')
    } finally {
        String.prototype.match = originalMatch
    }
})
```

### 5. Conditional Branch Coverage

**Use Case**: Cover all branches in complex conditional statements

```typescript
// Test all branches of complex conditionals
describe('complex conditional coverage', () => {
    it('should cover first branch', () => {
        mockCondition1(true)
        mockCondition2(false)
        expect(complexFunction()).toBe('branch1')
    })

    it('should cover second branch', () => {
        mockCondition1(false)
        mockCondition2(true)
        expect(complexFunction()).toBe('branch2')
    })

    it('should cover third branch', () => {
        mockCondition1(false)
        mockCondition2(false)
        expect(complexFunction()).toBe('branch3')
    })
})
```

## 🎨 Creative Mocking Patterns

### 1. Chained Mock Returns

**Use Case**: Cover different return values in sequence

```typescript
// Mock function to return different values on subsequent calls
it('should cover different return values', () => {
    const mockFn = vi
        .fn()
        .mockReturnValueOnce('first')
        .mockReturnValueOnce('second')
        .mockReturnValue('default')

    expect(processWithMock(mockFn)).toBe('first')
    expect(processWithMock(mockFn)).toBe('second')
    expect(processWithMock(mockFn)).toBe('default')
})
```

### 2. Error Throwing Mock

**Use Case**: Cover error handling paths

```typescript
// Mock function to throw on specific calls
it('should cover error handling', () => {
    const mockFn = vi
        .fn()
        .mockReturnValueOnce('success')
        .mockImplementationOnce(() => {
            throw new Error('Simulated error')
        })

    expect(() => processWithMock(mockFn)).toThrow('Simulated error')
})
```

### 3. Conditional Mock Behavior

**Use Case**: Cover different mock behaviors based on input

```typescript
// Mock function with conditional behavior
it('should cover conditional mock behavior', () => {
    const mockFn = vi.fn().mockImplementation((input) => {
        if (input === 'special') {
            return 'special result'
        }
        return 'default result'
    })

    expect(processWithMock(mockFn, 'special')).toBe('special result')
    expect(processWithMock(mockFn, 'normal')).toBe('default result')
})
```

## 🔍 Edge Case Coverage Techniques

### 1. Boundary Value Testing

**Use Case**: Cover edge cases at boundaries

```typescript
// Test boundary values
describe('boundary value coverage', () => {
    it('should handle empty string', () => {
        expect(processString('')).toBe('empty')
    })

    it('should handle null input', () => {
        expect(processString(null)).toBe('null')
    })

    it('should handle undefined input', () => {
        expect(processString(undefined)).toBe('undefined')
    })

    it('should handle maximum length', () => {
        const maxString = 'a'.repeat(1000)
        expect(processString(maxString)).toBe('max')
    })
})
```

### 2. Type Coercion Coverage

**Use Case**: Cover different type coercion scenarios

```typescript
// Test type coercion edge cases
it('should cover type coercion scenarios', () => {
    expect(processValue(0)).toBe('zero')
    expect(processValue('0')).toBe('string zero')
    expect(processValue(false)).toBe('false')
    expect(processValue('false')).toBe('string false')
})
```

### 3. Async Error Coverage

**Use Case**: Cover async error scenarios

```typescript
// Test async error handling
it('should cover async error scenarios', async () => {
    const mockAsyncFn = vi.fn().mockRejectedValue(new Error('Async error'))

    await expect(processAsync(mockAsyncFn)).rejects.toThrow('Async error')
})
```

## 📊 Coverage Analysis Tools

### 1. Coverage Report Analysis

```bash
# Generate detailed coverage report
pae {alias} tc

# Analyze uncovered lines
# Look for:
# - Uncovered branches in conditional statements
# - Uncovered catch blocks
# - Uncovered fallback branches
# - Uncovered optional parameter branches
```

### 2. Branch Coverage Identification

```typescript
// Identify branches that need coverage
// Look for patterns like:
if (condition) {
    // Branch 1 - needs coverage
} else {
    // Branch 2 - needs coverage
}

// Or:
condition ? branch1 : branch2
```

### 3. Line Coverage Gaps

```typescript
// Common uncovered line patterns:
// - Error handling blocks
// - Fallback values
// - Optional parameter handling
// - Default case in switch statements
// - Finally blocks in try-catch
```

## 🚫 Coverage Testing Anti-Patterns

### 1. Don't Test Implementation Details

```typescript
// ❌ BAD: Testing internal implementation
it('should call internal method', () => {
    const spy = vi.spyOn(obj, 'internalMethod')
    obj.publicMethod()
    expect(spy).toHaveBeenCalled()
})

// ✅ GOOD: Testing behavior
it('should return expected result', () => {
    const result = obj.publicMethod()
    expect(result).toBe('expected')
})
```

### 2. Don't Over-Mock

```typescript
// ❌ BAD: Mocking everything
vi.mock('./module', () => ({
    function1: vi.fn(),
    function2: vi.fn(),
    function3: vi.fn(),
}))

// ✅ GOOD: Mock only what's necessary
vi.mock('./module', () => ({
    function1: vi.fn().mockReturnValue('test'),
}))
```

### 3. Don't Ignore Error Scenarios

```typescript
// ❌ BAD: Only testing happy path
it('should process valid input', () => {
    expect(processInput('valid')).toBe('processed')
})

// ✅ GOOD: Testing error scenarios too
it('should handle invalid input', () => {
    expect(() => processInput('invalid')).toThrow('Invalid input')
})
```

## 🎯 Coverage Testing Checklist

### Before Writing Coverage Tests

- [ ] Run coverage report to identify uncovered lines
- [ ] Analyze uncovered branches and conditions
- [ ] Identify error handling paths that need coverage
- [ ] Check for fallback values and default cases

### During Coverage Test Writing

- [ ] Write minimal tests that only cover uncovered lines
- [ ] Use creative mocking techniques for edge cases
- [ ] Test all branches of conditional statements
- [ ] Cover error scenarios and catch blocks
- [ ] Test boundary values and edge cases

### After Writing Coverage Tests

- [ ] Verify 100% coverage is achieved
- [ ] Ensure tests are maintainable and clear
- [ ] Check that tests don't break with code changes
- [ ] Document any complex mocking patterns used

## 🔗 Related Documentation

- [Main Testing Strategy](./_Testing-Strategy.md) - Overall testing approach
- [Mock Strategy General](./Mock-Strategy_General.md) - Mocking guidelines
- [Troubleshooting Guide](./Troubleshooting%20-%20Tests.md) - Common issues and solutions
- [Coverage Test Guidelines](../libs/mock-strategy/__tests__/coverage-tests/_readme.md) - Coverage test structure
