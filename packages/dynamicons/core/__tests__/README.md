# Dynamicons Core Package Testing

## Overview

This directory contains comprehensive tests for the `@fux/dynamicons-core` package, which provides pure business logic for dynamic icon theme generation without any VSCode dependencies.

## Test Structure

### **Functional Tests** (`functional/`)

- **Purpose**: Test service functionality and business logic
- **Scope**: Complete service behavior and integration
- **Files**: `*.service.test.ts` for each service
- **Setup**: Uses `_setup.ts` for global test configuration

### **Unit Tests** (`unit/`)

- **Purpose**: Test isolated functions and utilities
- **Scope**: Individual function behavior and edge cases
- **Files**: `*.test.ts` for specific utilities
- **Setup**: Minimal setup, focused on isolation

### **Coverage Tests** (`coverage/`)

- **Purpose**: Generate and analyze test coverage reports
- **Scope**: Coverage analysis and reporting
- **Files**: Coverage documentation and reports
- **Setup**: Coverage-specific configuration

## Test Execution

### **Standard Tests**

```bash
# Run core package tests only
dc t

# Run core package tests with full dependency chain
dc tf
```

### **Coverage Tests**

```bash
# Run tests with coverage
dc tc

# Run tests with coverage and full dependency chain
dc tfc
```

## Test Configuration

- **Executor**: `@nx/vite:test` (direct executor, not extends)
- **Setup File**: `./__tests__/_setup.ts` for global test setup
- **Test Organization**: `__tests__/functional/` structure
- **Coverage**: Integrated coverage reporting

## Architecture Compliance

This package follows the **Core Package Architecture Pattern**:

- ✅ **Pure business logic** - No VSCode dependencies
- ✅ **Self-contained** - No shared package dependencies
- ✅ **Direct instantiation** - No DI container
- ✅ **Type imports only** - `import type { Uri } from 'vscode'` for interfaces

## Test Patterns

### **Service Testing**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DynamiconService } from '../../src/services/DynamiconService'

describe('DynamiconService', () => {
    let service: DynamiconService

    beforeEach(() => {
        service = new DynamiconService()
    })

    it('should generate dynamic icons correctly', () => {
        // Test implementation
    })
})
```

### **Utility Testing**

```typescript
import { describe, it, expect } from 'vitest'
import { generateIconPath } from '../../src/utils/iconUtils'

describe('iconUtils', () => {
    it('should generate correct icon paths', () => {
        // Test implementation
    })
})
```

## Coverage Requirements

- **Minimum Coverage**: 90% for all source files
- **Critical Paths**: 100% coverage for core business logic
- **Edge Cases**: Comprehensive testing of error conditions
- **Integration**: Full service integration testing

## Troubleshooting

### **Common Issues**

1. **Import Errors**: Ensure all imports use relative paths
2. **Mock Issues**: Use `_setup.ts` for global mock configuration
3. **Coverage Gaps**: Check for untested edge cases and error paths

### **Performance**

- **Test Speed**: Core tests should run quickly (< 5 seconds)
- **Isolation**: Tests should not depend on external services
- **Parallelization**: Tests can run in parallel for speed

## Maintenance

- **Regular Updates**: Update tests when business logic changes
- **Coverage Monitoring**: Monitor coverage trends over time
- **Pattern Consistency**: Maintain consistent test patterns across services
