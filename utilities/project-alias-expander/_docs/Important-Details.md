# PAE Important Details & Subtle Behaviors

## Overview

This document highlights critical but subtle aspects of the Project Alias Expander (PAE) system that may not be immediately obvious but are essential for proper understanding and maintenance.

## Table of Contents

- [Overview](#overview)
- [Table of Contents](#table-of-contents)
- [Expandable Flag Template Processing](#expandable-flag-template-processing)
    - [Critical Behavior](#critical-behavior)
    - [Implementation Pattern](#implementation-pattern)
    - [Why This Matters](#why-this-matters)
    - [Common Mistake](#common-mistake)
    - [Location](#location)
- [Flag Format Validation and Error Handling](#flag-format-validation-and-error-handling)
    - [Critical Behavior](#critical-behavior-1)
    - [Implementation Pattern](#implementation-pattern-1)
    - [Why This Matters](#why-this-matters-1)
    - [Common Mistake](#common-mistake-1)
    - [Location](#location-1)
- [Command Execution Flow](#command-execution-flow)
- [Error Handling Strategies](#error-handling-strategies)
- [Package Resolution Logic](#package-resolution-logic)
- [Service Architecture Patterns](#service-architecture-patterns)
- [Type System Enforcement](#type-system-enforcement)
- [Local Development Workflow](#local-development-workflow)
- [Quick Reference](#quick-reference)
    - [Key Files to Understand](#key-files-to-understand)
    - [Critical Patterns](#critical-patterns)
    - [Common Gotchas](#common-gotchas)

## Expandable Flag Template Processing

### Critical Behavior

Template variable mapping requires careful handling of default values vs. provided arguments. The system uses explicit variable mapping where provided values replace defaults entirely, not append to them.

### Implementation Pattern

```typescript
// Initialize variables object with defaults
const variables: Record<string, string> = {}

if (value !== undefined) {
    // Custom value provided - use it instead of default
    variables.value = value

    // Apply mutation if it exists
    if (typeof expandable === 'object' && expandable.mutation) {
        const mutatedValue = this.applyMutation(value, expandable.mutation)
        variables.value = mutatedValue.toString()
    }
} else {
    // No custom value - use default
    variables.value = typeof expandable === 'object' ? expandable.default || '' : ''
}
```

### Why This Matters

- **Prevents incorrect expansion**: Without explicit mapping, `-b="2"` would become `--bail 1 2` instead of `--bail 2`
- **Template consistency**: Ensures templates always receive the correct variable values
- **Mutation support**: Allows for value transformations before template processing

### Common Mistake

**Assumption**: Template processing automatically handles value replacement
**Reality**: Explicit variable mapping is required to prevent default value contamination

### Location

- **File**: `src/services/ExpandableProcessor.service.ts`
- **Method**: `expandFlags()`
- **Key Logic**: Variable initialization and override pattern

## Flag Format Validation and Error Handling

### Critical Behavior

Strict flag format enforcement prevents ambiguous command parsing and improves user experience. The system enforces specific formats (`-{flag}` or `-{flag}=value`) and throws descriptive errors for invalid formats.

### Implementation Pattern

```typescript
parseExpandableFlag(arg: string): { key: string, value: string | undefined } {
    // Support: -{flag} or -{flag}=value (quotes are handled by shell)
    // Flags must be single characters or single words, no combo flags allowed

    // Check for value format first: -flag=value
    const valueMatch = arg.match(/^-([a-zA-Z0-9_-]+)=(.*)$/)

    if (valueMatch) {
        return { key: valueMatch[1], value: valueMatch[2] }
    }

    // Check if it's a simple flag (no value) - must be single word, no special chars except underscore/hyphen
    if (arg.match(/^-[a-zA-Z0-9_-]+$/)) {
        return { key: arg.slice(1), value: undefined }
    }

    // Invalid format - return special error indicator
    return { key: '__INVALID_FLAG__', value: arg }
}

// In expandFlags method
if (key === '__INVALID_FLAG__') {
    throw new Error(`Invalid flag format: ${value}. Expected -{flag} or -{flag}=value`)
}
```

### Why This Matters

- **Prevents combo flags**: Stops `-fs` from being parsed as `-f -s`
- **Clear error messages**: Provides specific feedback on invalid formats
- **Consistent parsing**: Ensures all flags follow the same pattern
- **User experience**: Prevents confusing command behavior

### Common Mistake

**Assumption**: Flexible flag parsing allows for more user convenience
**Reality**: Strict validation prevents ambiguous parsing and combo flag issues

### Location

- **File**: `src/services/ExpandableProcessor.service.ts`
- **Method**: `parseExpandableFlag()` and `expandFlags()`
- **Key Logic**: Regex validation and error throwing pattern

---

<!-- To be filled in -->

## Command Execution Flow

<!-- To be filled in -->

## Error Handling Strategies

<!-- To be filled in -->

## Package Resolution Logic

<!-- To be filled in -->

## Service Architecture Patterns

<!-- To be filled in -->

## Type System Enforcement

<!-- To be filled in -->

## Local Development Workflow

<!-- To be filled in -->

## Quick Reference

### Key Files to Understand

- `src/services/ExpandableProcessor.service.ts` - Flag expansion and template processing
- `src/services/ConfigLoader.service.ts` - Configuration loading and caching
- `src/services/PackageResolutionService.ts` - Package and alias resolution
- `src/services/CommandExecution.service.ts` - Command execution patterns
- `src/commands/AliasCommand.ts` - Main command orchestration

### Critical Patterns

1. **Template Variable Mapping**: Always initialize defaults, then override with provided values
2. **Configuration Loading**: YAML-only with strict validation, no fallback to legacy formats
3. **Package Resolution**: Handle both PackageDefinition objects and direct string references
4. **Command Execution**: Use `runCommand` for consistency, avoid specialized methods
5. **Error Handling**: Colorized messages with conditional debug information

### Common Gotchas

- Template processing doesn't automatically handle value replacement
- Direct string references in nxPackages need different resolution logic
- Flag format validation must be strict to prevent combo flag issues
- Legacy type definitions must be completely removed during migration
