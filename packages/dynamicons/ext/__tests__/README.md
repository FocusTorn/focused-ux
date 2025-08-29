# Dynamicons Extension Package Testing

## Overview

This directory contains comprehensive tests for the `@fux/dynamicons-ext` package, which provides VSCode integration for dynamic icon theme generation. This package implements a **dual testing strategy** with both standard Vitest tests and VS Code integration tests.

## Test Structure

### **Functional Tests** (`functional-tests/`)

- **Purpose**: Test extension logic, adapters, and command registration
- **Environment**: Isolated test environment with mocked VSCode APIs
- **Speed**: Fast execution, no VS Code instance required
- **Files**: `*.test.ts` for extension components and adapters

### **Integration Tests** (`integration/`)

- **Purpose**: Test actual extension behavior in real VS Code environment
- **Environment**: Full VS Code instance with extension loaded
- **Speed**: Slower execution, requires VS Code startup
- **Files**: `*.test.ts` for end-to-end testing

### **Unit Tests** (`unit/`)

- **Purpose**: Test isolated functions and utilities
- **Scope**: Individual function behavior and edge cases
- **Files**: `*.test.ts` for specific utilities
- **Setup**: Minimal setup, focused on isolation

### **Coverage Tests** (`coverage-tests/`)

- **Purpose**: Generate and analyze test coverage reports
- **Scope**: Coverage analysis and reporting
- **Files**: Coverage documentation and reports
- **Setup**: Coverage-specific configuration

## Dual Testing Strategy

### **1. Standard Vitest Tests** (`test`, `test:full`)

**Purpose**: Test extension logic, adapters, and command registration
**Environment**: Isolated test environment with mocked VSCode APIs
**Speed**: Fast execution, no VS Code instance required
**Coverage**: Unit and integration testing of extension components

### **2. VS Code Integration Tests** (`test:integration`)

**Purpose**: Test actual extension behavior in real VS Code environment
**Environment**: Full VS Code instance with extension loaded
**Speed**: Slower execution, requires VS Code startup
**Coverage**: End-to-end testing of extension functionality

## Test Execution

### **Standard Tests**

```bash
# Run extension package tests only
dc t

# Run extension package tests with full dependency chain
dc tf
```

### **Integration Tests**

```bash
# Run VS Code integration tests
dc ti

# Run integration tests with full dependency chain
dc tfi
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
- **Test Organization**: `__tests__/functional-tests/` structure
- **Integration Tests**: `__tests__/integration/` with VS Code test runner
- **Coverage**: Integrated coverage reporting

## Architecture Compliance

This package follows the **Extension Package Architecture Pattern**:

- ✅ **VSCode Integration** - Lightweight wrapper for core logic
- ✅ **Core Package Dependency** - Depends on `@fux/dynamicons-core`
- ✅ **Local Adapters** - VSCode integration through local adapters
- ✅ **Dual Testing Strategy** - Standard tests + VS Code integration tests

## Test Patterns

### **Extension Testing**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { ExtensionManager } from '../../src/services/ExtensionManager'

describe('ExtensionManager', () => {
    let extensionManager: ExtensionManager

    beforeEach(() => {
        extensionManager = new ExtensionManager()
    })

    it('should register commands correctly', () => {
        // Test command registration
    })

    it('should handle VSCode API calls through adapters', () => {
        // Test adapter integration
    })
})
```

### **Adapter Testing**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { FileSystemAdapter } from '../../src/adapters/FileSystemAdapter'

describe('FileSystemAdapter', () => {
    let adapter: FileSystemAdapter

    beforeEach(() => {
        adapter = new FileSystemAdapter()
    })

    it('should read file contents through VSCode API', () => {
        // Test VSCode API integration
    })
})
```

### **Integration Testing**

```typescript
import { describe, it, expect } from 'vitest'
import * as vscode from 'vscode'

describe('Dynamicons Extension Integration', () => {
    it('should activate extension correctly', async () => {
        // Test extension activation in VS Code
    })

    it('should register commands in VS Code', async () => {
        // Test command registration in VS Code
    })
})
```

## Test Categories

### **1. Extension Logic Tests**

- **Command Registration**: Test command registration and handling
- **Extension Activation**: Test extension activation and initialization
- **Configuration Management**: Test configuration loading and validation
- **Event Handling**: Test VSCode event handling

### **2. Adapter Tests**

- **File System Adapter**: Test file system operations through VSCode API
- **Workspace Adapter**: Test workspace operations through VSCode API
- **Configuration Adapter**: Test configuration operations through VSCode API
- **UI Adapter**: Test UI operations through VSCode API

### **3. Integration Tests**

- **Extension Activation**: Test extension activation in VS Code
- **Command Execution**: Test command execution in VS Code
- **File Operations**: Test file operations in VS Code workspace
- **Configuration Changes**: Test configuration changes in VS Code

### **4. Error Handling Tests**

- **VSCode API Errors**: Test handling of VSCode API errors
- **File System Errors**: Test handling of file system errors
- **Configuration Errors**: Test handling of configuration errors
- **Extension Errors**: Test handling of extension errors

## Test Data

### **Test Workspaces**

- **Empty Workspace**: Workspace with no files
- **Simple Workspace**: Workspace with basic file structure
- **Complex Workspace**: Workspace with complex file structure
- **Multi-root Workspace**: Workspace with multiple root folders

### **Test Files**

- **Icon Files**: SVG icon files for testing
- **Configuration Files**: Theme configuration files
- **Test Files**: Various file types for testing
- **Large Files**: Large files for performance testing

## Assertions

### **Success Assertions**

```typescript
expect(result).toBeDefined()
expect(result.success).toBe(true)
expect(commands).toContain('dynamicons.generate')
expect(extension).toBeActive()
```

### **Error Assertions**

```typescript
expect(result.success).toBe(false)
expect(result.error).toBeDefined()
expect(result.error.message).toContain('expected error message')
```

### **VSCode Assertions**

```typescript
expect(vscode.commands.registerCommand).toHaveBeenCalled()
expect(vscode.workspace.getConfiguration).toHaveBeenCalled()
expect(extension.isActive).toBe(true)
```

## Test Isolation

### **Extension Isolation**

- Each test uses fresh extension instance
- No shared state between tests
- Cleanup after each test

### **Workspace Isolation**

- Each test uses isolated workspace
- No modification of real workspaces
- Cleanup of test artifacts

### **VSCode API Isolation**

- Mock VSCode APIs for standard tests
- Isolated VS Code instance for integration tests
- No interference between tests

## Coverage Goals

- **Extension Logic**: 100% coverage of extension logic
- **Adapter Methods**: 100% coverage of adapter methods
- **Error Handling**: 100% coverage of error handling
- **Integration Points**: 100% coverage of integration points

## Performance Requirements

- **Standard Tests**: < 10 seconds for all standard tests
- **Integration Tests**: < 30 seconds for all integration tests
- **Memory Usage**: < 200MB peak memory usage
- **CPU Usage**: < 50% CPU usage during tests

## Maintenance

### **Regular Updates**

- Update tests when extension logic changes
- Add tests for new functionality
- Remove tests for deprecated features

### **Coverage Monitoring**

- Monitor coverage trends
- Identify uncovered code paths
- Plan test improvements

### **Performance Monitoring**

- Monitor test execution times
- Identify performance regressions
- Optimize slow tests
