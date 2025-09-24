# Isolated Tests

**Purpose**: ADHOC one-off tests that are not run when executing the main test suite. These tests are used for debugging, experimentation, or temporary test scenarios.

## Guidelines

- **Not Part of Main Suite**: These tests are excluded from the main test run
- **Debugging**: Use for debugging specific issues or behaviors
- **Experimentation**: Test new ideas or approaches without affecting main tests
- **Temporary**: Mark tests as temporary and clean up when no longer needed
- **Naming Convention**: Use `.test-isolated.ts` suffix to distinguish from main tests

## Usage Examples

```typescript
// debug-specific-issue.test-isolated.ts
import { describe, it, expect } from 'vitest'
import { SomeService } from '../../src/services/SomeService.js'

describe('Debug Tests - SomeService (ISOLATED)', () => {
    it('should debug specific behavior', () => {
        // Temporary test for debugging
        const service = new SomeService()
        // Debug specific scenario
        console.log('Debug output:', service.debugMethod())
    })
})
```

## Running Isolated Tests

```bash
# Run isolated tests specifically
pnpm exec vitest run isolated-tests

# Run with pattern matching
pnpm exec vitest run --testNamePattern="ISOLATED"
```

## Cleanup

- **Regular Cleanup**: Remove isolated tests that are no longer needed
- **Documentation**: Document why isolated tests exist and when they should be removed
- **Review**: Regularly review isolated tests during code reviews

