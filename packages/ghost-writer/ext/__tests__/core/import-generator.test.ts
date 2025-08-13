import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportGeneratorService } from '@fux/ghost-writer-core'
import type { IPathUtilsService, ICommonUtilsService, StoredFragment } from '@fux/ghost-writer-core'

describe('ImportGeneratorService', () => {
	let importGeneratorService: ImportGeneratorService
	let mockPathUtils: IPathUtilsService
	let mockCommonUtils: ICommonUtilsService

	beforeEach(() => {
		mockPathUtils = {
			getDottedPath: vi.fn(),
			getRelativePath: vi.fn(),
			normalizePath: vi.fn(),
			isAbsolutePath: vi.fn(),
			joinPaths: vi.fn(),
		}

		mockCommonUtils = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			warnMsg: vi.fn(),
			debugMsg: vi.fn(),
		}

		importGeneratorService = new ImportGeneratorService(mockPathUtils, mockCommonUtils)
	})

	describe('generate', () => {
		it('should generate import statement successfully', () => {
			const fragment: StoredFragment = {
				text: 'Component',
				sourceFilePath: '/src/components/Component.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../components/Component'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { Component } from \'../components/Component.js\'\n')
			expect(mockPathUtils.getDottedPath).toHaveBeenCalledWith(
				'/src/components/Component.tsx',
				'/src/pages/HomePage.tsx',
			)
		})

		it('should handle different file extensions', () => {
			const fragment: StoredFragment = {
				text: 'Utility',
				sourceFilePath: '/src/utils/utility.ts',
			}

			const currentFilePath = '/src/services/service.ts'
			const relativePath = '../utils/utility'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { Utility } from \'../utils/utility.js\'\n')
		})

		it('should handle nested paths', () => {
			const fragment: StoredFragment = {
				text: 'DeepComponent',
				sourceFilePath: '/src/components/deep/nested/DeepComponent.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../components/deep/nested/DeepComponent'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { DeepComponent } from \'../components/deep/nested/DeepComponent.js\'\n')
		})

		it('should handle same directory imports', () => {
			const fragment: StoredFragment = {
				text: 'Helper',
				sourceFilePath: '/src/utils/helper.ts',
			}

			const currentFilePath = '/src/utils/main.ts'
			const relativePath = './helper'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { Helper } from \'./helper.js\'\n')
		})

		it('should return undefined when relative path cannot be determined', () => {
			const fragment: StoredFragment = {
				text: 'Component',
				sourceFilePath: '/src/components/Component.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(undefined)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBeUndefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Could not determine relative path for import.',
			)
		})

		it('should handle complex component names', () => {
			const fragment: StoredFragment = {
				text: 'MyComplexComponent',
				sourceFilePath: '/src/components/MyComplexComponent.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../components/MyComplexComponent'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { MyComplexComponent } from \'../components/MyComplexComponent.js\'\n')
		})

		it('should handle files with multiple dots in name', () => {
			const fragment: StoredFragment = {
				text: 'Config',
				sourceFilePath: '/src/config/app.config.ts',
			}

			const currentFilePath = '/src/main.ts'
			const relativePath = './config/app.config'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { Config } from \'./config/app.js\'\n')
		})

		it('should handle empty fragment text', () => {
			const fragment: StoredFragment = {
				text: '',
				sourceFilePath: '/src/components/Empty.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../components/Empty'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import {  } from \'../components/Empty.js\'\n')
		})

		it('should handle whitespace in fragment text', () => {
			const fragment: StoredFragment = {
				text: '  Component  ',
				sourceFilePath: '/src/components/Component.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../components/Component'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import {   Component   } from \'../components/Component.js\'\n')
		})
	})

	describe('edge cases', () => {
		it('should handle root level imports', () => {
			const fragment: StoredFragment = {
				text: 'RootComponent',
				sourceFilePath: '/RootComponent.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../RootComponent'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { RootComponent } from \'../RootComponent.js\'\n')
		})

		it('should handle very deep nested paths', () => {
			const fragment: StoredFragment = {
				text: 'DeepNestedComponent',
				sourceFilePath: '/src/a/b/c/d/e/f/g/h/DeepNestedComponent.tsx',
			}

			const currentFilePath = '/src/pages/HomePage.tsx'
			const relativePath = '../a/b/c/d/e/f/g/h/DeepNestedComponent'

			mockPathUtils.getDottedPath = vi.fn().mockReturnValue(relativePath)

			const result = importGeneratorService.generate(currentFilePath, fragment)

			expect(result).toBe('import { DeepNestedComponent } from \'../a/b/c/d/e/f/g/h/DeepNestedComponent.js\'\n')
		})
	})
})
