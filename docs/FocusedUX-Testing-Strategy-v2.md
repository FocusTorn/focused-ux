# FocusedUX Testing Strategy v2

## Overview

This document outlines the testing strategy for the new **Core/Extension Package Architecture** established in the FocusedUX project. This strategy builds upon the original testing approach but is specifically designed for packages that follow the separation of business logic (core) from VSCode integration (extension).

## Package Architecture Pattern

### Core Package (`@fux/package-name-core`)
- **Purpose**: Pure business logic, no VSCode dependencies
- **Dependencies**: Minimal external dependencies (e.g., `js-yaml` for YAML parsing)
- **No DI Container**: Services are directly instantiated with dependencies
- **No Shared/Mockly**: Self-contained "guinea pig" packages

### Extension Package (`@fux/package-name-ext`)
- **Purpose**: Lightweight VSCode wrapper for core logic
- **Dependencies**: Core package + VSCode APIs
- **No DI Container**: Direct service instantiation
- **VSCode Adapters**: Abstract VSCode API calls

## Directory Structure

```
packages/package-name/
├── core/
│   ├── __tests__/
│   │   ├── _setup.ts                    # Global test setup
│   │   ├── README.md                    # Test documentation
│   │   ├── functional/                  # Main test directory
│   │   │   ├── _readme.md              # Functional test docs
│   │   │   └── *.service.test.ts       # Service tests
│   │   ├── unit/                       # Specific isolated tests
│   │   │   ├── _readme.md              # Unit test docs
│   │   │   └── *.test.ts               # Unit tests
│   │   └── coverage/                   # Coverage reports
│   │       └── _readme.md              # Coverage docs
│   ├── src/
│   │   ├── _interfaces/                # Service interfaces
│   │   ├── services/                   # Business logic services
│   │   └── index.ts                    # Package exports
│   ├── vitest.functional.config.ts     # Functional test config
│   ├── vitest.coverage.config.ts       # Coverage test config
│   └── project.json                    # Nx build configuration
└── ext/
    ├── __tests__/
    │   ├── _setup.ts                    # Global test setup with VSCode mocks
    │   ├── README.md                    # Test documentation
    │   ├── functional/                  # Main test directory
    │   │   ├── _readme.md              # Functional test docs
    │   │   ├── extension.test.ts       # Main extension test
    │   │   └── adapters/*.adapter.test.ts # Adapter tests
    │   ├── unit/                       # Specific isolated tests
    │   │   └── _readme.md              # Unit test docs
    │   └── coverage/                   # Coverage reports
    │       └── _readme.md              # Coverage docs
    ├── src/
    │   ├── adapters/                   # VSCode API adapters
    │   ├── extension.ts                # Main extension entry point
    │   └── index.ts                    # Package exports
    ├── vitest.functional.config.ts     # Functional test config
    ├── vitest.coverage.config.ts       # Coverage test config
    └── project.json                    # Nx build configuration
```

## Testing Patterns

### 1. Core Package Testing

#### Service Testing Pattern
```typescript
// packages/package-name/core/__tests__/functional/ServiceName.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceName } from '../../src/services/ServiceName.service'
import { setupTestEnvironment, resetAllMocks } from '../_setup'

describe('ServiceName', () => {
  let service: ServiceName
  let mockFileSystem: any
  let mockPath: any

  beforeEach(() => {
    setupTestEnvironment()
    mockFileSystem = {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      stat: vi.fn()
    }
    mockPath = {
      join: vi.fn(),
      dirname: vi.fn()
    }
    service = new ServiceName(mockFileSystem, mockPath)
  })

  afterEach(() => {
    resetAllMocks()
  })

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      mockFileSystem.readFile.mockResolvedValue('test content')

      // Act
      const result = await service.methodName('test/path')

      // Assert
      expect(result).toBe('expected result')
      expect(mockFileSystem.readFile).toHaveBeenCalledWith('test/path')
    })
  })
})
```

#### Test Setup Pattern
```typescript
// packages/package-name/core/__tests__/_setup.ts
import { vi, beforeAll, afterAll } from 'vitest'

// Global test environment setup
beforeAll(() => {
  vi.useFakeTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

export interface TestMocks {
  fileSystem: any
  path: any
  yaml: any
}

export function setupTestEnvironment(): TestMocks {
  // Setup mocks and return mock objects
}

export function resetAllMocks(): void {
  vi.clearAllMocks()
}
```

### 2. Extension Package Testing

#### Extension Testing Pattern
```typescript
// packages/package-name/ext/__tests__/functional/extension.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { activate, deactivate } from '../../src/extension'
import * as vscode from 'vscode'

// Mock the core package
vi.mock('@fux/package-name-core', () => ({
  ServiceName: vi.fn().mockImplementation(() => ({
    methodName: vi.fn().mockResolvedValue('mock result')
  })),
  // ... other services
}))

describe('Extension', () => {
  let context: any

  beforeEach(() => {
    vi.clearAllMocks()
    context = {
      subscriptions: {
        push: vi.fn()
      }
    }
  })

  describe('activate', () => {
    it('should register all commands successfully', () => {
      // Act
      activate(context as any)

      // Assert
      expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(4)
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'package-name.commandName',
        expect.any(Function)
      )
    })

    it('should add disposables to context subscriptions', () => {
      // Arrange
      const mockDisposable = { dispose: vi.fn() }
      vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

      // Act
      activate(context as any)

      // Assert
      expect(context.subscriptions.push).toHaveBeenCalledTimes(1)
      expect(context.subscriptions.push).toHaveBeenCalledWith(
        mockDisposable,
        mockDisposable,
        mockDisposable,
        mockDisposable
      )
    })
  })
})
```

#### Adapter Testing Pattern
```typescript
// packages/package-name/ext/__tests__/functional/adapters/AdapterName.adapter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdapterName } from '../../../src/adapters/AdapterName.adapter'
import * as vscode from 'vscode'

describe('AdapterName', () => {
  let adapter: AdapterName

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new AdapterName()
  })

  describe('methodName', () => {
    it('should call VSCode API correctly', () => {
      // Arrange
      const mockResult = 'test result'
      vi.mocked(vscode.someApi).mockReturnValue(mockResult)

      // Act
      const result = adapter.methodName('test/path')

      // Assert
      expect(result).toBe(mockResult)
      expect(vscode.someApi).toHaveBeenCalledWith('test/path')
    })
  })
})
```

#### Global Test Setup Pattern
```typescript
// packages/package-name/ext/__tests__/_setup.ts
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// 1) Mock external dependencies
vi.mock('js-yaml', () => ({
  load: vi.fn((content: string) => {
    // Simple mock implementation for testing
    if (!content || content.trim() === '') return undefined
    if (content.includes('ProjectButler')) {
      return {
        ProjectButler: {
          'packageJson-order': ['name', 'version', 'scripts']
        }
      }
    }
    return {}
  })
}))

// 2) Mock VSCode globally
vi.mock('vscode', () => ({
  commands: {
    registerCommand: vi.fn()
  },
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    createTerminal: vi.fn(),
    activeTextEditor: null,
    activeTerminal: null
  },
  workspace: {
    workspaceFolders: [
      { uri: { fsPath: '/test/workspace' } }
    ],
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      stat: vi.fn(),
      copy: vi.fn()
    }
  },
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path }))
  },
  FileType: {
    Directory: 1,
    File: 2
  },
  Terminal: class MockTerminal {
    constructor(public name?: string) {}
    sendText = vi.fn()
    show = vi.fn()
  },
  TextEditor: class MockTextEditor {
    document = {
      uri: { fsPath: '/test/file.txt' }
    }
  }
}))

// 3) Use fake timers globally
beforeAll(() => {
  vi.useFakeTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

// 4) Keep mocks clean between tests
afterEach(() => {
  vi.clearAllMocks()
})
```

## Vitest Configuration

### Functional Test Configuration
```typescript
// packages/package-name/core/vitest.functional.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: ['./__tests__/_setup.ts'],
    },
  }),
)
```

### Coverage Test Configuration
```typescript
// packages/package-name/core/vitest.coverage.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.coverage.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: ['./__tests__/_setup.ts'],
      coverage: {
        reportsDirectory: './__tests__/coverage',
      },
    },
  }),
)
```

## Nx Configuration

### Core Package Project Configuration
```json
// packages/package-name/core/project.json
{
  "name": "@fux/package-name-core",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/package-name/core",
        "main": "packages/package-name/core/src/index.ts",
        "tsConfig": "packages/package-name/core/tsconfig.lib.json",
        "assets": ["packages/package-name/core/*.md"]
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "configFile": "packages/package-name/core/vitest.functional.config.ts"
      }
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "configFile": "packages/package-name/core/vitest.coverage.config.ts"
      }
    }
  }
}
```

### Extension Package Project Configuration
```json
// packages/package-name/ext/project.json
{
  "name": "@fux/package-name-ext",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/package-name/ext",
        "main": "packages/package-name/ext/src/extension.ts",
        "tsConfig": "packages/package-name/ext/tsconfig.json",
        "assets": ["packages/package-name/ext/*.md"]
      }
    },
    "package": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/package-name/ext",
        "configFile": "packages/package-name/ext/vite.config.ts"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "configFile": "packages/package-name/ext/vitest.functional.config.ts"
      }
    },
    "test:full": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "configFile": "packages/package-name/ext/vitest.coverage.config.ts"
      }
    }
  }
}
```

## Testing Best Practices

### 1. Service Testing
- **Test business logic in isolation**: Mock all external dependencies
- **Use descriptive test names**: Clear what behavior is being tested
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test error conditions**: Ensure graceful error handling
- **Mock file system operations**: Use consistent mock patterns

### 2. Extension Testing
- **Mock VSCode APIs globally**: Use comprehensive VSCode mocks
- **Test command registration**: Verify all commands are registered
- **Test error handling**: Ensure activation errors are handled gracefully
- **Mock core package**: Provide realistic mock implementations
- **Test adapter functionality**: Verify VSCode API abstraction

### 3. Mocking Strategy
- **Consistent mock patterns**: Use similar mock structures across tests
- **Realistic mock data**: Provide meaningful mock return values
- **Global vs local mocks**: Use global mocks for common dependencies
- **Mock cleanup**: Clear mocks between tests

### 4. Test Organization
- **Functional tests**: Main test directory for integration tests
- **Unit tests**: Specific isolated test cases
- **Coverage tests**: Separate configuration for coverage reporting
- **Test documentation**: README files in each test directory

## Command Aliases

### Core Package Commands
```bash
# Build core package
pmc build

# Test core package (functional)
pmc test

# Test core package (coverage)
pmc test:full

# TypeScript check
pmc tsc

# Lint core package
pmc lint
```

### Extension Package Commands
```bash
# Build extension package
pme build

# Package extension for distribution
pme package

# Test extension package (functional)
pme test

# Test extension package (coverage)
pme test:full

# TypeScript check
pme tsc

# Lint extension package
pme lint
```

### Combined Package Commands
```bash
# Test both packages
pm test

# Build both packages
pm build

# TypeScript check both packages
pm tsc
```

## Migration Guide

### From Monolithic to Core/Ext Architecture

1. **Extract Business Logic**
   - Move business logic to core package
   - Create service interfaces
   - Remove VSCode dependencies from core

2. **Create VSCode Adapters**
   - Abstract VSCode API calls
   - Create adapter interfaces
   - Implement adapter classes

3. **Update Extension**
   - Import core services
   - Use adapters for VSCode operations
   - Register commands with core logic

4. **Update Tests**
   - Move service tests to core package
   - Create adapter tests in extension package
   - Update extension tests with new architecture

5. **Update Build Configuration**
   - Configure Nx targets for both packages
   - Set up Vitest configurations
   - Update command aliases

## Quality Gates

### Core Package
- [ ] All services have functional tests
- [ ] 100% test coverage for business logic
- [ ] No VSCode dependencies
- [ ] Clean interfaces defined
- [ ] TypeScript compilation passes

### Extension Package
- [ ] Extension activation test passes
- [ ] All adapters have tests
- [ ] Command registration tested
- [ ] Error handling tested
- [ ] TypeScript compilation passes

### Integration
- [ ] Both packages build successfully
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] Clean separation of concerns

## Conclusion

This testing strategy v2 provides a comprehensive framework for testing the new Core/Extension package architecture. It ensures:

- **Clean separation of concerns** between business logic and VSCode integration
- **Comprehensive test coverage** for both core services and extension functionality
- **Consistent testing patterns** across all packages
- **Maintainable test code** with clear organization and documentation
- **Quality assurance** through automated testing and quality gates

By following this strategy, teams can confidently develop and maintain packages that follow the established architecture patterns while ensuring high code quality and reliability. 