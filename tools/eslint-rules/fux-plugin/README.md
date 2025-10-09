# @fux/eslint-plugin

FocusedUX custom ESLint rules plugin providing specialized formatting and linting rules for the FocusedUX project.

## Installation

```bash
# Already included in the project
# Located at: tools/eslint-rules/fux-plugin/
```

## Rules

### `@fux/padding`

Universal padding rule that extends `padding-line-between-statements` to support custom statement types and patterns.

**Features:**

- Custom statement types (it, describe, test, etc.)
- Flexible configuration for any code patterns
- Auto-fix support
- Extensible with custom matchers

**Usage:**

```javascript
'@fux/padding': [
  'error',
  {
    patterns: [
      { blankLine: 'always', prev: '*', next: 'describe' },
      { blankLine: 'never', prev: 'describe', next: 'it' },
      { blankLine: 'never', prev: 'it', next: 'it' },
    ],
  },
]
```

### `@fux/folding-brackets`

Custom rule for enforcing consistent bracket folding patterns in code.

**Features:**

- Enforces folding marker placement
- Supports various bracket types
- Auto-fix support

## Configurations

### `recommended`

Basic recommended configuration with all fux rules enabled.

```javascript
{
  plugins: ['@fux'],
  extends: ['plugin:@fux/recommended']
}
```

### `test-files`

Specialized configuration for test files with optimized spacing rules.

```javascript
{
  plugins: ['@fux'],
  extends: ['plugin:@fux/test-files']
}
```

## Usage in ESLint Config

```javascript
import fuxPlugin from './tools/eslint-rules/fux-plugin/index.js'

export default [
  {
    files: ['**/*.test.ts'],
    plugins: {
      '@fux': fuxPlugin,
    },
    rules: {
      // Use predefined config
      ...fuxPlugin.configs['test-files'].rules,

      // Or configure manually
      '@fux/padding': ['error', { patterns: [...] }],
      '@fux/folding-brackets': 'error',
    },
  },
]
```

## Rule Names

- `@fux/padding` - Universal padding between statements
- `@fux/folding-brackets` - Bracket folding enforcement

## Contributing

To add new rules:

1. Create rule file in `rules/` directory
2. Export rule from `index.js`
3. Add to appropriate configs
4. Update documentation

## Examples

### Test File Formatting

```typescript
// ✅ Correct spacing
describe('My Suite', () => {
    it('should do something', () => {
        // test
    })
    it('should do something else', () => {
        // test
    })
})

// ❌ Incorrect spacing (will be auto-fixed)
describe('My Suite', () => {
    it('should do something', () => {
        // test
    })

    it('should do something else', () => {
        // test
    })
})
```

### Custom Patterns

```javascript
'@fux/padding': [
  'error',
  {
    patterns: [
      { blankLine: 'always', prev: '*', next: 'customFunction' }
    ],
    customMatchers: {
      'customFunction': 'myCustomFunction\\s*\\('
    }
  }
]
```
