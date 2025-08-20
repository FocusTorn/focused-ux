import { describe, it, expect, beforeEach } from 'vitest'
import { ImportGeneratorService } from '../../src/features/import-generator/services/ImportGenerator.service.js'
import type { IPathUtilsService, ICommonUtilsService } from '../../src/_interfaces/IUtilServices.js'
import type { StoredFragment } from '../../src/features/clipboard/_interfaces/IClipboardService.js'

// Mock path utils service
class MockPathUtilsService implements IPathUtilsService {
  getDottedPath(from: string, to: string): string | undefined {
    // Simple mock implementation
    if (from === '/path/to/component.ts' && to === '/path/to/main.ts') {
      return './component'
    }
    if (from === '/path/to/utils/helper.ts' && to === '/path/to/main.ts') {
      return './utils/helper'
    }
    return undefined
  }
}

// Mock common utils service
class MockCommonUtilsService implements ICommonUtilsService {
  public errorMessages: string[] = []

  errMsg(message: string): void {
    this.errorMessages.push(message)
  }
}

describe('ImportGeneratorService', () => {
  let importGeneratorService: ImportGeneratorService
  let mockPathUtils: MockPathUtilsService
  let mockCommonUtils: MockCommonUtilsService

  beforeEach(() => {
    mockPathUtils = new MockPathUtilsService()
    mockCommonUtils = new MockCommonUtilsService()
    importGeneratorService = new ImportGeneratorService(mockPathUtils, mockCommonUtils)
  })

  describe('generate', () => {
    it('should generate import statement for valid paths', () => {
      const fragment: StoredFragment = {
        text: 'MyComponent',
        sourceFilePath: '/path/to/component.ts'
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBe("import { MyComponent } from './component.js'\n")
    })

    it('should generate import statement for nested paths', () => {
      const fragment: StoredFragment = {
        text: 'Helper',
        sourceFilePath: '/path/to/utils/helper.ts'
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBe("import { Helper } from './utils/helper.js'\n")
    })

    it('should return undefined when path cannot be determined', () => {
      const fragment: StoredFragment = {
        text: 'UnknownComponent',
        sourceFilePath: '/unknown/path.ts'
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBeUndefined()
      expect(mockCommonUtils.errorMessages).toContain('Could not determine relative path for import.')
    })

    it('should handle different file extensions', () => {
      const fragment: StoredFragment = {
        text: 'Component',
        sourceFilePath: '/path/to/component.tsx'
      }

      // Mock path utils to return path with extension
      mockPathUtils.getDottedPath = (from: string, to: string) => {
        if (from === '/path/to/component.tsx' && to === '/path/to/main.ts') {
          return './component.tsx'
        }
        return undefined
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBe("import { Component } from './component.js'\n")
    })

    it('should handle complex component names', () => {
      const fragment: StoredFragment = {
        text: 'MyComplexComponent',
        sourceFilePath: '/path/to/component.ts'
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBe("import { MyComplexComponent } from './component.js'\n")
    })
  })

  describe('integration', () => {
    it('should handle multiple imports from same source', () => {
      const fragment1: StoredFragment = {
        text: 'ComponentA',
        sourceFilePath: '/path/to/component.ts'
      }
      const fragment2: StoredFragment = {
        text: 'ComponentB',
        sourceFilePath: '/path/to/component.ts'
      }

      // Mock path utils to handle multiple calls
      mockPathUtils.getDottedPath = (from: string, to: string) => {
        if (from === '/path/to/component.ts' && to === '/path/to/main.ts') {
          return './component'
        }
        return undefined
      }

      const result1 = importGeneratorService.generate('/path/to/main.ts', fragment1)
      const result2 = importGeneratorService.generate('/path/to/main.ts', fragment2)

      expect(result1).toBe("import { ComponentA } from './component.js'\n")
      expect(result2).toBe("import { ComponentB } from './component.js'\n")
    })

    it('should handle error scenarios gracefully', () => {
      const fragment: StoredFragment = {
        text: 'Component',
        sourceFilePath: '/invalid/path.ts'
      }

      const result = importGeneratorService.generate('/path/to/main.ts', fragment)

      expect(result).toBeUndefined()
      expect(mockCommonUtils.errorMessages).toHaveLength(1)
      expect(mockCommonUtils.errorMessages[0]).toBe('Could not determine relative path for import.')
    })
  })
}) 