# Functional Tests

**Focus**: End state values and behavior verification
**Purpose**: Ensure the code works correctly for users

## What to Test

- ✅ What the code produces (return values, side effects)
- ✅ How the code transforms inputs (data transformation)
- ✅ That the logic executes correctly (functional correctness)
- ✅ Integration between components (end-to-end behavior)

## What NOT to Test

- ❌ Internal implementation details
- ❌ Exact sequence of operations
- ❌ Whether specific methods were called
- ❌ Internal state changes during execution

## Test Philosophy

Functional tests should answer the question: **"Does this code work correctly for the user?"**

They focus on **outcomes** rather than **implementation**, making them:

- **Robust** - Won't break when internal implementation changes
- **User-focused** - Test what actually matters to users
- **Maintainable** - Less brittle and easier to update
- **Fast** - Focus on essential behavior, not implementation details

## Example

```typescript
// ✅ CORRECT - Test the end state value
it('should return formatted URI', () => {
    const adapter = new UriAdapter(mockUri)
    expect(adapter.toString()).toBe('file:///test/path')
})

// ❌ INCORRECT - Test implementation details
it('should call vscode.Uri.toString', () => {
    const adapter = new UriAdapter(mockUri)
    adapter.toString()
    expect(mockUri.toString).toHaveBeenCalled() // Implementation detail
})
```

## When to Move to Unit Tests

If a functional test fails repeatedly and you need to debug internal behavior:

1. Move the test to `../unit/`
2. Add detailed assertions for internal behavior
3. Ensure proper component isolation with mocks
4. Once working, consider if it can be simplified back to functional

## Relationship to Unit Tests

- **Functional tests** focus on user outcomes and integration
- **Unit tests** focus on internal component behavior and isolation
- Use functional tests for normal testing
- Use unit tests only when you need to debug internal behavior
