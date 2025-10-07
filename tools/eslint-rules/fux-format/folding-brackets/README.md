# Folding Brackets ESLint Rule

This ESLint rule enforces consistent bracket folding formatting for objects and arrays.

## Allowed Formats

### Single Line Format

When properties are on the opening line (no folding marker):

```json
{ "key1": "value1", "key2": "value2", "key3": "value3", "key4": "value4" }
```

### Standard Block Format

When no property is on the opening line (no folding marker):

```json
{
    "key1": "value1",
    "key2": "value2",
    "key3": "value3",
    "key4": "value4"
}
```

### Folding Block Format

When a folding marker (`//>`) is present:

```json
{
    "key1": "value1", //>
    "key2": "value2",
    "key3": "value3",
    "key4": "value4"
}
```

## Rules

1. **No property on opening line** → Standard block format (all properties on separate lines)
2. **Property on opening line + no folding marker** → Single line format (all properties inline)
3. **Folding marker present** → Folding block format (first property inline with triple space + folding marker, rest on separate lines)

## Testing

Run the tests with:

```bash
npm test
```

## Usage

Add to your ESLint configuration:

```javascript
import foldingBracketsRule from './tools/eslint-rules/fux-format/folding-brackets'

export default {
    rules: {
        'folding-brackets': foldingBracketsRule,
    },
}
```
