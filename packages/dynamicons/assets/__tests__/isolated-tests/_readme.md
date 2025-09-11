# Dynamicons Core Isolated Tests

## Overview

Isolated tests for the `@fux/dynamicons-core` package test isolated functions and utilities in complete isolation. These tests focus on individual function behavior, edge cases, and specific utility functionality.

## Test Files

### **Utility Tests**

- `iconUtils.test.ts` - Icon path generation and manipulation utilities
- `themeUtils.test.ts` - Theme configuration and validation utilities
- `assetUtils.test.ts` - Asset processing and optimization utilities

### **Helper Tests**

- `validationUtils.test.ts` - Input validation and sanitization utilities
- `colorUtils.test.ts` - Color manipulation and conversion utilities
- `fileUtils.test.ts` - File system utility functions

## Test Patterns

### **Utility Testing Pattern**

```typescript
import { describe, it, expect } from 'vitest'
import { generateIconPath, validateIconName } from '../../../src/utils/iconUtils'

describe('iconUtils', () => {
    describe('generateIconPath', () => {
        it('should generate correct path for valid icon name', () => {
            const iconName = 'typescript'
            const result = generateIconPath(iconName)

            expect(result).toBe('icons/typescript.svg')
        })

        it('should handle special characters in icon name', () => {
            const iconName = 'c++'
            const result = generateIconPath(iconName)

            expect(result).toBe('icons/c++.svg')
        })

        it('should throw error for invalid icon name', () => {
            expect(() => generateIconPath('')).toThrow('Icon name cannot be empty')
        })
    })

    describe('validateIconName', () => {
        it('should return true for valid icon names', () => {
            expect(validateIconName('typescript')).toBe(true)
            expect(validateIconName('c++')).toBe(true)
            expect(validateIconName('react-native')).toBe(true)
        })

        it('should return false for invalid icon names', () => {
            expect(validateIconName('')).toBe(false)
            expect(validateIconName('a'.repeat(100))).toBe(false)
            expect(validateIconName('invalid/name')).toBe(false)
        })
    })
})
```

### **Pure Function Testing**

```typescript
import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex } from '../../../src/utils/colorUtils'

describe('colorUtils', () => {
    describe('hexToRgb', () => {
        it('should convert valid hex colors', () => {
            expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
            expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 })
            expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 })
        })

        it('should handle short hex colors', () => {
            expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 })
            expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 })
        })

        it('should throw error for invalid hex colors', () => {
            expect(() => hexToRgb('invalid')).toThrow('Invalid hex color')
            expect(() => hexToRgb('#GG0000')).toThrow('Invalid hex color')
        })
    })
})
```

## Test Categories

### **1. Input Validation Tests**

- **Valid Input**: Test with expected valid inputs
- **Invalid Input**: Test with various invalid inputs
- **Edge Cases**: Test boundary conditions and edge cases
- **Type Safety**: Test TypeScript type constraints

### **2. Output Validation Tests**

- **Correct Output**: Verify correct results for valid inputs
- **Error Output**: Verify appropriate errors for invalid inputs
- **Format Validation**: Verify output format and structure
- **Consistency**: Verify consistent output for same inputs

### **3. Performance Tests**

- **Execution Speed**: Test function performance
- **Memory Usage**: Test memory efficiency
- **Scalability**: Test with large inputs
- **Optimization**: Verify optimized code paths

### **4. Edge Case Tests**

- **Boundary Values**: Test at function boundaries
- **Empty Inputs**: Test with empty strings, arrays, objects
- **Null/Undefined**: Test with null and undefined values
- **Special Characters**: Test with special characters and symbols

## Test Data

### **Valid Test Data**

```typescript
const validIconNames = [
    'typescript',
    'javascript',
    'react',
    'vue',
    'angular',
    'nodejs',
    'python',
    'java',
    'c++',
    'c#',
]

const validColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#F0F0F0']
```

### **Invalid Test Data**

```typescript
const invalidIconNames = [
    '',
    'a'.repeat(100),
    'invalid/name',
    'invalid\\name',
    'invalid*name',
    'invalid?name',
]

const invalidColors = ['invalid', '#GG0000', '#12345', '#1234567', 'red', 'rgb(255,0,0)']
```

## Assertions

### **Success Assertions**

```typescript
expect(result).toBe(expectedValue)
expect(result).toEqual(expectedObject)
expect(result).toHaveProperty('expectedProperty')
expect(result).toBeInstanceOf(ExpectedClass)
```

### **Error Assertions**

```typescript
expect(() => functionCall()).toThrow()
expect(() => functionCall()).toThrow('expected error message')
expect(() => functionCall()).toThrow(ExpectedError)
```

### **Type Assertions**

```typescript
expect(typeof result).toBe('string')
expect(Array.isArray(result)).toBe(true)
expect(result).toBeNull()
expect(result).toBeUndefined()
```

## Test Isolation

### **Function Isolation**

- Each function is tested independently
- No dependencies between test functions
- No shared state between tests

### **Data Isolation**

- Each test uses fresh test data
- No modification of shared data
- Cleanup after each test

### **Environment Isolation**

- No external dependencies
- No file system access
- No network calls

## Coverage Goals

- **Function Coverage**: 100% coverage of all functions
- **Branch Coverage**: 100% coverage of all code branches
- **Line Coverage**: 100% coverage of all code lines
- **Edge Case Coverage**: 90% coverage of edge cases

## Performance Requirements

- **Test Execution**: < 1 second for all unit tests
- **Memory Usage**: < 10MB peak memory usage
- **CPU Usage**: < 10% CPU usage during tests
- **Parallel Execution**: All tests can run in parallel

## Maintenance

### **Regular Updates**

- Update tests when utility functions change
- Add tests for new utility functions
- Remove tests for deprecated functions

### **Coverage Monitoring**

- Monitor coverage trends
- Identify uncovered code paths
- Plan test improvements

### **Performance Monitoring**

- Monitor test execution times
- Identify performance regressions
- Optimize slow tests
