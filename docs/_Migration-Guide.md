# Migration Guide

## Overview

This document outlines best practices, common pitfalls, troubleshooting strategies, and lessons learned for migrating FocusedUX packages and systems.

## Table of Contents

- [Overview](#overview)
- [Table of Contents](#table-of-contents)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Troubleshooting](#troubleshooting)
- [Architecture Migration Patterns](#architecture-migration-patterns)
- [Configuration Migration Strategies](#configuration-migration-strategies)
- [Testing Migration Approaches](#testing-migration-approaches)
- [Tool Integration Migrations](#tool-integration-migrations)
- [Error Handling Patterns](#error-handling-patterns)
- [Performance Considerations](#performance-considerations)
- [Documentation Updates](#documentation-updates)
- [Quick Reference](#quick-reference)
    - [Migration Checklist](#migration-checklist)
    - [Common Commands](#common-commands)
- [Related Documentation](#related-documentation)

## Best Practices

<!-- To be filled in -->

## Common Pitfalls

### Legacy Code Identification and Removal

**Problem**: Systematic identification of duplicated functionality prevents architectural debt accumulation.

**Common Mistakes**:

- Keeping both old and new implementations "just in case"
- Not identifying which implementation is correctly wired
- Leaving unused legacy code that creates confusion
- Not removing legacy implementations completely

**Solution Pattern**:

1. Compare implementations side-by-side
2. Identify which is correctly wired and actively used
3. Remove unused/incorrect versions immediately
4. Use codebase search to find duplicate patterns
5. Analyze usage patterns before removal
6. Remove legacy implementations completely

**Benefits**:

- Cleaner codebase with no confusion
- Better maintainability
- Prevents bugs from legacy code
- Reduces architectural debt

**Example Process**:

```bash
# Find duplicate patterns
grep -r "AliasCommand" src/
grep -r "runNx" src/

# Analyze usage
# Remove unused implementations
# Update all references
```

## Troubleshooting

<!-- To be filled in -->

## Architecture Migration Patterns

### Service-Based Architecture Migration

**Pattern**: Replace monolithic command classes with focused services for better separation of concerns and testability.

**Implementation**:

- Extract specific responsibilities into dedicated services (CommandResolutionService, PackageResolutionService, TargetResolutionService, ConfigurationValidator)
- Create clear interfaces for each service
- Compose services in the main command class
- Use dependency injection for service composition

**Benefits**:

- Better testability through isolated service testing
- Clearer responsibilities and single responsibility principle
- Easier maintenance and debugging
- More flexible configuration and extension

**Example Structure**:

```typescript
class AliasCommand {
    private commandResolver: CommandResolutionService
    private packageResolver: PackageResolutionService
    private targetResolver: TargetResolutionService
    private configValidator: ConfigurationValidator

    constructor(dependencies: ServiceDependencies) {
        // Compose services with clear interfaces
    }
}
```

### Command Execution Consolidation

**Pattern**: Migrate specialized methods to use general-purpose methods for consistency.

**Implementation**:

- Remove specialized methods like `runNx()`
- Update all calls to use `runCommand()` with proper argument structure
- Ensure single execution path for all commands

**Benefits**:

- Single execution path reduces complexity
- Easier testing with consistent interface
- Better command generation capabilities
- Eliminates legacy execution patterns

**Migration Example**:

```typescript
// Before (legacy)
await this.runNx([target, project, ...flags])

// After (consolidated)
await this.runCommand('nx', [target, project, ...flags])
```

## Configuration Migration Strategies

### Clean Break Migration Strategy

**Pattern**: Complete commitment to new configuration format (YAML-only) eliminates complexity and prevents fallback confusion.

**Implementation**:

- Remove all legacy format support immediately rather than maintaining dual compatibility
- Delete JSON parsing logic completely
- Remove legacy type definitions (AliasValue, nxTargets, etc.)
- Update all validation to be strict for new format only
- Remove fallback mechanisms and compatibility layers

**Benefits**:

- Eliminates format ambiguity and confusion
- Reduces code complexity significantly
- Forces proper migration completion
- Prevents configuration drift and mixed formats

**Migration Steps**:

1. Identify all legacy format references
2. Remove JSON parsing and validation logic
3. Update type definitions to remove legacy properties
4. Update all services to use new format only
5. Remove fallback mechanisms
6. Test with new format exclusively

**Example**:

```typescript
// Before (dual support)
if (this.validator.isOldFormat(config)) {
    throw new Error('Old configuration format detected')
}

// After (clean break)
// No legacy format checks - only new format supported
```

### TypeScript Type System Enforcement

**Pattern**: Remove legacy types immediately and let TypeScript compiler catch inconsistencies.

**Implementation**:

- Delete legacy type definitions (AliasValue, legacy config properties)
- Update all type references to use new interfaces
- Remove legacy properties from interfaces
- Let TypeScript compiler enforce consistency

**Benefits**:

- Compile-time error detection prevents runtime issues
- Prevents type mismatches and inconsistencies
- Forces proper migration completion
- Improves code quality and maintainability

**Example**:

```typescript
// Before (legacy types)
interface AliasConfig {
    nxTargets?: Record<string, string>
    commands?: Record<string, string>
    // ... legacy properties
}

// After (clean types)
interface AliasConfig {
    targets: {
        'nx-targets': Record<string, string>
        'not-nx-targets': Record<string, string>
    }
    'expandable-commands': Record<string, string>
    // ... only new properties
}
```

## Testing Migration Approaches

<!-- To be filled in -->

## Tool Integration Migrations

<!-- To be filled in -->

## Error Handling Patterns

<!-- To be filled in -->

## Performance Considerations

<!-- To be filled in -->

## Documentation Updates

<!-- To be filled in -->

## Quick Reference

### Migration Checklist

- [ ] Identify legacy code and duplicated functionality
- [ ] Plan service-based architecture migration
- [ ] Remove legacy format support completely
- [ ] Update type definitions and interfaces
- [ ] Implement strict validation
- [ ] Test local development workflow
- [ ] Update error handling patterns
- [ ] Consolidate command execution methods
- [ ] Document new patterns and approaches

### Common Commands

```bash
# Local testing with tsx
tsx libs/project-alias-expander/src/cli.ts [command]

# Build and test
nx build @fux/project-alias-expander
nx test @fux/project-alias-expander

# Install globally
npm install @fux/project-alias-expander
```

## Related Documentation

- [Architecture Documentation](_Architecture.md)
- [Package Archetypes](_Package-Archetypes.md)
- [Standard Operating Procedures](_SOP.md)
- [Testing Strategy](testing/_Testing-Strategy.md)
