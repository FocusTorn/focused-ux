import { describe, it, expect, beforeEach } from 'vitest'
import { ImportGeneratorService } from '../../src/services/ImportGenerator.service.js'
import type { IPathUtilsService, ICommonUtilsService } from '../../src/_interfaces/IUtilServices.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'

// Mock services
class MockPathUtilsService implements IPathUtilsService {
	getDottedPath(from: string, to: string): string | undefined {
		// Mock different path scenarios based on actual file paths
		if (from.includes('/deep/nested/component.ts') && to.includes('main')) {
			return './deep/nested/component'
		}
		if (from.includes('RelativeComponent') && to.includes('main')) {
			return './components/RelativeComponent'
		}
		if (from.includes('/invalid/path/component.ts') && to.includes('main')) {
			return undefined // Simulate path resolution failure
		}
		if (from.includes('EmptyComponent') && to.includes('main')) {
			return './components/EmptyComponent'
		}
		if (from.includes('SpecialComponent') && to.includes('main')) {
			return './components/SpecialComponent'
		}
		if (from.includes('WindowsComponent') && to.includes('main')) {
			return './components/WindowsComponent'
		}
		if (from.includes('SpaceComponent') && to.includes('main')) {
			return './components with spaces/SpaceComponent'
		}
		if (from.includes('component') && to.includes('main')) {
			return './components/MyComponent'
		}
		if (from.includes('utils') && to.includes('main')) {
			return './utils/helper'
		}
		return undefined
	}
}

class MockCommonUtilsService implements ICommonUtilsService {
	public errorMessages: string[] = []
	errMsg(message: string): void {
		this.errorMessages.push(message)
	}
}

describe('ImportGeneratorService - Edge Cases', () => {
	let importGeneratorService: ImportGeneratorService
	let mockPathUtils: MockPathUtilsService
	let mockCommonUtils: MockCommonUtilsService

	beforeEach(() => {
		mockPathUtils = new MockPathUtilsService()
		mockCommonUtils = new MockCommonUtilsService()
		importGeneratorService = new ImportGeneratorService(mockPathUtils, mockCommonUtils)
	})

	describe('File Extension Handling', () => {
		it('should handle .tsx files', () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/project/src/components/MyComponent.tsx',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { MyComponent } from \'./components/MyComponent.js\'\n')
		})

		it('should handle .js files', () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/project/src/components/MyComponent.js',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { MyComponent } from \'./components/MyComponent.js\'\n')
		})

		it('should handle files without extensions', () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/project/src/components/MyComponent',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { MyComponent } from \'./components/MyComponent.js\'\n')
		})
	})

	describe('Complex Path Scenarios', () => {
		it('should handle deeply nested paths', () => {
			const fragment: StoredFragment = {
				text: 'DeepComponent',
				sourceFilePath: '/project/src/deep/nested/component.ts',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { DeepComponent } from \'./deep/nested/component.js\'\n')
		})

		it('should handle relative paths', () => {
			const fragment: StoredFragment = {
				text: 'RelativeComponent',
				sourceFilePath: './components/RelativeComponent.ts',
			}

			const result = importGeneratorService.generate('./main.ts', fragment)

			expect(result).toBe('import { RelativeComponent } from \'./components/RelativeComponent.js\'\n')
		})
	})

	describe('Error Handling', () => {
		it('should handle invalid path scenarios', () => {
			const fragment: StoredFragment = {
				text: 'InvalidComponent',
				sourceFilePath: '/invalid/path/component.ts',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBeUndefined()
			expect(mockCommonUtils.errorMessages).toContain('Could not determine relative path for import.')
		})

		it('should handle empty fragment text', () => {
			const fragment: StoredFragment = {
				text: '',
				sourceFilePath: '/project/src/components/EmptyComponent.ts',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import {  } from \'./components/EmptyComponent.js\'\n')
		})

		it('should handle special characters in component names', () => {
			const fragment: StoredFragment = {
				text: 'Component$With$Special$Chars',
				sourceFilePath: '/project/src/components/SpecialComponent.ts',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { Component$With$Special$Chars } from \'./components/SpecialComponent.js\'\n')
		})
	})

	describe('Path Edge Cases', () => {
		it('should handle Windows-style paths', () => {
			const fragment: StoredFragment = {
				text: 'WindowsComponent',
				sourceFilePath: 'C:\\project\\src\\components\\WindowsComponent.ts',
			}

			const result = importGeneratorService.generate('C:\\project\\src\\main.ts', fragment)

			expect(result).toBe('import { WindowsComponent } from \'./components/WindowsComponent.js\'\n')
		})

		it('should handle paths with spaces', () => {
			const fragment: StoredFragment = {
				text: 'SpaceComponent',
				sourceFilePath: '/project/src/components with spaces/SpaceComponent.ts',
			}

			const result = importGeneratorService.generate('/project/src/main.ts', fragment)

			expect(result).toBe('import { SpaceComponent } from \'./components with spaces/SpaceComponent.js\'\n')
		})
	})
})
