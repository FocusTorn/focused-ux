# Unit Tests

**Focus**: Internal behavior and component isolation
**Purpose**: Test individual components in isolation with detailed verification

## When to Use
- 🔍 Functional test fails repeatedly and root cause is unclear
- 🔍 Need to verify specific internal behavior
- 🔍 Testing individual components in isolation
- 🔍 Debugging complex integration issues
- 🔍 Testing edge cases in internal logic
- 🔍 Performance testing and optimization

## What to Test
- Internal method calls and sequences
- State changes during execution
- Error handling in specific code paths
- Performance characteristics
- Memory usage patterns
- Complex algorithm behavior
- Component isolation and mocking

## What NOT to Test
- ❌ User-facing behavior (use functional tests for that)
- ❌ End state values (use functional tests for that)
- ❌ Integration between components (use functional tests for that)

## Test Philosophy
Unit tests answer the question: **"How does this individual component work internally?"**

They focus on **mechanisms** rather than **outcomes**, making them:
- **Detailed** - Can test specific internal behaviors
- **Debug-friendly** - Help identify root causes of failures
- **Performance-aware** - Can test timing and resource usage
- **Isolated** - Test components in isolation with mocks
- **Implementation-specific** - May need updates when internal code changes

## Example
```typescript
// ✅ CORRECT - Test internal behavior
it('should create EventEmitter and wire events correctly', () => {
    const adapter = new TreeDataProviderAdapter()
    
    // Test internal state
    expect(adapter['_onDidChangeTreeData']).toBeInstanceOf(EventEmitter)
    expect(typeof adapter.onDidChangeTreeData).toBe('function')
    
    // Test internal event wiring
    const listener = vi.fn()
    adapter.onDidChangeTreeData(listener)
    adapter['_onDidChangeTreeData'].fire('test')
    expect(listener).toHaveBeenCalledWith('test')
})

// ❌ INCORRECT - Test user-facing behavior here
it('should return tree items', () => {
    // This belongs in functional tests
})
```

## Migration Strategy
When moving tests from functional to unit:

1. **Identify the failing functional test**
2. **Move it to this directory**
3. **Add detailed internal assertions**
4. **Ensure proper component isolation with mocks**
5. **Once working, consider if it can be simplified back to functional**
6. **Keep unit tests focused on internal behavior only**

## Best Practices
- Keep unit tests minimal and focused
- Use them only when functional tests can't provide the detail needed
- Consider them temporary - move back to functional when possible
- Document why each unit test exists
- Use clear, descriptive names that explain the internal behavior being tested
- Ensure proper mocking and isolation of dependencies 