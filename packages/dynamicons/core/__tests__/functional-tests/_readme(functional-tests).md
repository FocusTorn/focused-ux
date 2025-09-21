# Dynamicons Core Functional Tests

## Overview

Functional tests for the `@fux/dynamicons-core` package test complete service behavior and business logic integration. These tests ensure that the core package provides reliable, predictable functionality for dynamic icon theme generation.

## Test Files

### **Service Tests**

- `DynamiconService.test.ts` - Core dynamicon generation service
- `IconThemeService.test.ts` - Icon theme management service
- `AssetBuilderService.test.ts` - Asset building and compilation service

### **Integration Tests**

- `ServiceIntegration.test.ts` - Cross-service integration testing
- `WorkflowIntegration.test.ts` - Complete workflow testing

## Test Patterns

### **Service Testing Pattern**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DynamiconService } from '../../../src/services/DynamiconService'

describe('DynamiconService', () => {
    let service: DynamiconService

    beforeEach(() => {
        service = new DynamiconService()
    })

    describe('generateDynamicon', () => {
        it('should generate dynamicon with valid input', () => {
            const input = {
                /* test input */
            }
            const result = service.generateDynamicon(input)

            expect(result).toBeDefined()
            expect(result.success).toBe(true)
        })

        it('should handle invalid input gracefully', () => {
            const input = {
                /* invalid input */
            }
            const result = service.generateDynamicon(input)

            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })
})
```

### **Integration Testing Pattern**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DynamiconService } from '../../../src/services/DynamiconService'
import { IconThemeService } from '../../../src/services/IconThemeService'

describe('Service Integration', () => {
    let dynamiconService: DynamiconService
    let themeService: IconThemeService

    beforeEach(() => {
        dynamiconService = new DynamiconService()
        themeService = new IconThemeService()
    })

    it('should integrate dynamicon generation with theme creation', () => {
        // Test complete workflow
    })
})
```

## Test Categories

### **1. Core Functionality Tests**

- **Dynamicon Generation**: Test icon generation algorithms
- **Theme Compilation**: Test theme file generation
- **Asset Building**: Test asset compilation and optimization

### **2. Error Handling Tests**

- **Invalid Input**: Test graceful handling of bad input
- **Missing Dependencies**: Test behavior when dependencies are missing
- **File System Errors**: Test handling of file system issues

### **3. Performance Tests**

- **Large Icon Sets**: Test performance with many icons
- **Memory Usage**: Test memory efficiency
- **Processing Speed**: Test generation speed

### **4. Integration Tests**

- **Service Communication**: Test inter-service communication
- **Data Flow**: Test complete data flow through services
- **Workflow Completion**: Test end-to-end workflows

## Test Data

### **Test Icons**

- **Simple Icons**: Basic geometric shapes
- **Complex Icons**: Detailed, multi-path icons
- **Edge Cases**: Icons with unusual properties

### **Test Themes**

- **Light Theme**: Standard light theme configuration
- **Dark Theme**: Standard dark theme configuration
- **Custom Themes**: User-defined theme configurations

## Assertions

### **Success Assertions**

```typescript
expect(result).toBeDefined()
expect(result.success).toBe(true)
expect(result.data).toHaveProperty('icons')
expect(result.data.icons).toHaveLength(expectedCount)
```

### **Error Assertions**

```typescript
expect(result.success).toBe(false)
expect(result.error).toBeDefined()
expect(result.error.message).toContain('expected error message')
```

### **Performance Assertions**

```typescript
expect(performance.now() - startTime).toBeLessThan(maxTime)
expect(memoryUsage).toBeLessThan(maxMemory)
```

## Test Isolation

### **Service Isolation**

- Each service is tested independently
- Dependencies are mocked or stubbed
- No external service calls

### **Data Isolation**

- Each test uses fresh test data
- No shared state between tests
- Cleanup after each test

### **File System Isolation**

- Tests use temporary directories
- No modification of real files
- Cleanup of test artifacts

## Coverage Goals

- **Service Methods**: 100% coverage of public methods
- **Error Paths**: 100% coverage of error handling
- **Integration Points**: 100% coverage of service interactions
- **Edge Cases**: 90% coverage of edge case handling

## Performance Requirements

- **Test Execution**: < 5 seconds for all functional tests
- **Memory Usage**: < 100MB peak memory usage
- **CPU Usage**: < 50% CPU usage during tests
- **Parallel Execution**: Tests can run in parallel

## Maintenance

### **Regular Updates**

- Update tests when service interfaces change
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
