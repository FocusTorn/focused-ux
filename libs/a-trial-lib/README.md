# @fux/a-trial-lib

A comprehensive trial library package demonstrating proper testing strategies and mock implementations following the FocusedUX library testing guide.

## Overview

This package serves as a reference implementation for library packages in the FocusedUX monorepo, showcasing:

- **Comprehensive Testing Strategy**: Complete implementation of the Enhanced Mock Strategy
- **Library Package Patterns**: Proper ESM module structure with external dependencies
- **Mock Strategy Components**: Three-component mock system (globals.ts, helpers.ts, mock-scenario-builder.ts)
- **Test Organization**: Functional tests, coverage tests, and isolated tests
- **Type Safety**: Full TypeScript implementation with proper interfaces

## Features

- **Data Processing**: Process and transform data with metadata support
- **Configuration Management**: Load and merge configurations from JSON/YAML
- **Validation Utilities**: Comprehensive input validation with detailed error reporting
- **Service Orchestration**: Main service class coordinating all operations
- **External Dependencies**: Proper integration with `js-yaml` for configuration loading

## Package Structure

```
libs/a-trial-lib/
├── src/
│   ├── index.ts                    # Main exports
│   ├── types/TrialTypes.ts         # Type definitions
│   ├── utils/
│   │   ├── DataProcessor.ts        # Data processing utilities
│   │   ├── ConfigLoader.ts         # Configuration loading
│   │   └── ValidationUtils.ts      # Input validation
│   └── services/
│       └── TrialService.ts         # Main service orchestrator
├── __tests__/
│   ├── __mocks__/
│   │   ├── globals.ts              # Global test environment setup
│   │   ├── helpers.ts              # Test utilities and mock creators
│   │   └── mock-scenario-builder.ts # Composable mock scenarios
│   ├── functional-tests/           # Main integration tests
│   │   ├── utils/                  # Utility function tests
│   │   └── services/               # Service tests
│   ├── coverage-tests/             # Coverage-specific tests
│   └── isolated-tests/             # Isolated scenario tests
├── vitest.config.ts                # Functional test configuration
├── vitest.coverage.config.ts       # Coverage test configuration
├── package.json                    # Package configuration
├── project.json                    # Nx project configuration
└── tsconfig.json                   # TypeScript configuration
```

## Testing Strategy

This package implements the **Enhanced Mock Strategy** with three key components:

### 1. Global Test Environment (`globals.ts`)

- Sets up library-specific test environment using `@fux/mock-strategy/lib`
- Controls console output for clean test runs
- Manages global timers and mock cleanup

### 2. Test Helpers (`helpers.ts`)

- Extends `LibTestMocks` with package-specific mock interfaces
- Provides `setupTrialLibTestEnvironment()` and `resetTrialLibMocks()`
- Type-safe mock interfaces for all package components

### 3. Mock Scenario Builder (`mock-scenario-builder.ts`)

- Composable mock scenarios for complex test setups
- Fluent API for building test scenarios
- Reusable scenario functions for common patterns

## Usage Examples

### Basic Data Processing

```typescript
import { TrialService } from '@fux/a-trial-lib'

const service = new TrialService({ debug: true })
await service.initialize()

const result = await service.processData('Hello, World!', { source: 'example' })
console.log(result.content) // "Hello, World!"
```

### Configuration Management

```typescript
import { ConfigLoader } from '@fux/a-trial-lib'

// Load from JSON
const config = ConfigLoader.loadFromJson(
    JSON.stringify({
        name: 'my-config',
        version: '1.0.0',
        enabled: true,
        settings: { timeout: 5000 },
    })
)

// Merge configurations
const merged = ConfigLoader.merge(baseConfig, { version: '2.0.0' })
```

### Data Validation

```typescript
import { ValidationUtils } from '@fux/a-trial-lib'

const result = ValidationUtils.validateConfig({
    name: 'test',
    version: '1.0.0',
    enabled: true,
})

if (!result.isValid) {
    console.error('Validation errors:', result.errors)
}
```

## Testing Commands

```bash
# Fast functional testing for development
nx test @fux/a-trial-lib

# Functional testing with coverage reporting
nx test @fux/a-trial-lib --coverage

# Complete testing including coverage tests (100% coverage goal)
nx run @fux/a-trial-lib:test:coverage-tests

# Build before testing (MANDATORY)
nx build @fux/a-trial-lib
```

## Mock Strategy Examples

### Using Scenario Builders

```typescript
import { createTrialLibMockBuilder } from '../__mocks__/mock-scenario-builder'

// Complex scenario setup
const scenario = createTrialLibMockBuilder(mocks)
    .configLoadSuccess({
        configContent: '{"name": "test"}',
        configType: 'json',
        expectedConfig: { name: 'test', version: '1.0.0', enabled: true, settings: {} },
    })
    .dataProcessingSuccess({
        input: 'test data',
        expectedOutput: { id: 'test', content: 'test data', metadata: {}, timestamp: new Date() },
    })
    .build()
```

### Using Individual Scenario Functions

```typescript
import { setupConfigLoadSuccessScenario } from '../__mocks__/mock-scenario-builder'

// Simple scenario setup
setupConfigLoadSuccessScenario(mocks, {
    configContent: '{"name": "test"}',
    configType: 'json',
    expectedConfig: { name: 'test', version: '1.0.0', enabled: true, settings: {} },
})
```

## Architecture Compliance

This package follows all FocusedUX library package requirements:

- ✅ **ESM Module System**: Uses `"type": "module"` and ESM imports
- ✅ **No VSCode Dependencies**: Pure Node.js library with external dependencies
- ✅ **Proper Build Configuration**: Uses `@nx/esbuild:esbuild` with `bundle: false, format: ['esm']`
- ✅ **External Dependencies**: Properly externalizes `js-yaml` and other runtime dependencies
- ✅ **Comprehensive Testing**: Implements Enhanced Mock Strategy with scenario builders
- ✅ **Type Safety**: Full TypeScript implementation with proper interfaces
- ✅ **Test Organization**: Follows documented test directory structure

## Dependencies

### Runtime Dependencies

- `js-yaml`: YAML configuration parsing

### Development Dependencies

- `@fux/mock-strategy`: Enhanced mock strategy implementation
- `@types/js-yaml`: TypeScript definitions for js-yaml
- `@types/node`: Node.js type definitions
- `@vitest/coverage-v8`: Coverage reporting
- `typescript`: TypeScript compiler
- `vitest`: Testing framework

## Contributing

This package serves as a reference implementation. When contributing:

1. Follow the established patterns for mock strategy implementation
2. Use scenario builders for complex test setups
3. Maintain 100% test coverage
4. Follow the documented test organization structure
5. Ensure all tests pass before submitting changes

## License

MIT License - see LICENSE file for details.
