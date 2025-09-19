import { describe, it, expect, beforeEach } from 'vitest'
import { ImportGeneratorService } from '../../src/services/ImportGenerator.service.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'
import { 
	createMockTestEnvironment, 
	resetAllMocks,
	setupImportGeneratorSuccessScenario,
	setupImportGeneratorFailureScenario,
	setupCommonUtilsScenario
} from '../_setup'

describe('ImportGeneratorService Edge Cases', () => {
	let importGeneratorService: ImportGeneratorService
	let mocks: ReturnType<typeof createMockTestEnvironment>

	beforeEach(() => {
		mocks = createMockTestEnvironment()
		importGeneratorService = new ImportGeneratorService(mocks.pathUtils, mocks.commonUtils)
		resetAllMocks(mocks)
	})

	describe('Complex File Path Scenarios', () => {
		it('should handle deeply nested directory structures', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'DeepComponent',
				sourceFilePath: '/very/deep/nested/directory/structure/with/many/levels/component.ts'
			}
			const currentFilePath = '/very/deep/nested/directory/structure/with/many/levels/main.ts'
			const expectedImport = "import { DeepComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle paths with special characters', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'SpecialComponent',
				sourceFilePath: '/path/with spaces & special-chars (v2)/component.ts'
			}
			const currentFilePath = '/path/with spaces & special-chars (v2)/main.ts'
			const expectedImport = "import { SpecialComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle Windows-style paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'WindowsComponent',
				sourceFilePath: 'C:\\Users\\Developer\\Project\\src\\components\\component.ts'
			}
			const currentFilePath = 'C:\\Users\\Developer\\Project\\src\\main.ts'
			const expectedImport = "import { WindowsComponent } from './components/component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle Unix-style paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'UnixComponent',
				sourceFilePath: '/home/developer/project/src/components/component.ts'
			}
			const currentFilePath = '/home/developer/project/src/main.ts'
			const expectedImport = "import { UnixComponent } from './components/component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle network paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'NetworkComponent',
				sourceFilePath: '\\\\server\\share\\project\\src\\components\\component.ts'
			}
			const currentFilePath = '\\\\server\\share\\project\\src\\main.ts'
			const expectedImport = "import { NetworkComponent } from './components/component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})
	})

	describe('File Extension Variations', () => {
		it('should handle TypeScript files', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'TSComponent',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { TSComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle TSX files', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'TSXComponent',
				sourceFilePath: '/path/to/component.tsx'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { TSXComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle JavaScript files', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'JSComponent',
				sourceFilePath: '/path/to/component.js'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { JSComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle JSX files', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'JSXComponent',
				sourceFilePath: '/path/to/component.jsx'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { JSXComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle files without extensions', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'NoExtComponent',
				sourceFilePath: '/path/to/component'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { NoExtComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle files with multiple extensions', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MultiExtComponent',
				sourceFilePath: '/path/to/component.test.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { MultiExtComponent } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})
	})

	describe('Component Name Variations', () => {
		it('should handle component names with numbers', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'Component123',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { Component123 } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle component names with underscores', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'my_component',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { my_component } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle component names with hyphens', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'my-component',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { my-component } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle component names with Unicode characters', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: '组件',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { 组件 } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle component names with emojis', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: '🚀Component',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { 🚀Component } from './component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle very long component names', () => {
			// Arrange
			const longName = 'VeryLongComponentName' + 'A'.repeat(100)
			const fragment: StoredFragment = {
				text: longName,
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = `import { ${longName} } from './component.js'\n`

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})
	})

	describe('Path Resolution Edge Cases', () => {
		it('should handle same directory imports', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'SameDirComponent',
				sourceFilePath: '/path/to/same-dir.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { SameDirComponent } from './same-dir.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle parent directory imports', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'ParentComponent',
				sourceFilePath: '/path/parent.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { ParentComponent } from '../parent.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle sibling directory imports', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'SiblingComponent',
				sourceFilePath: '/path/sibling/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { SiblingComponent } from '../sibling/component.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})

		it('should handle root directory imports', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'RootComponent',
				sourceFilePath: '/root.ts'
			}
			const currentFilePath = '/path/to/main.ts'
			const expectedImport = "import { RootComponent } from '../../root.js'\n"

			setupImportGeneratorSuccessScenario(mocks, { 
				currentFilePath, 
				fragment, 
				expectedImport 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBe(expectedImport)
		})
	})

	describe('Error Scenarios', () => {
		it('should handle invalid file paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'InvalidComponent',
				sourceFilePath: 'invalid://path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'

			setupImportGeneratorFailureScenario(mocks, { 
				currentFilePath, 
				fragment 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBeUndefined()
			expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
		})

		it('should handle empty file paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'EmptyPathComponent',
				sourceFilePath: ''
			}
			const currentFilePath = '/path/to/main.ts'

			setupImportGeneratorFailureScenario(mocks, { 
				currentFilePath, 
				fragment 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBeUndefined()
			expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
		})

		it('should handle null file paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'NullPathComponent',
				sourceFilePath: null as any
			}
			const currentFilePath = '/path/to/main.ts'

			setupImportGeneratorFailureScenario(mocks, { 
				currentFilePath, 
				fragment 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBeUndefined()
			expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
		})

		it('should handle undefined file paths', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'UndefinedPathComponent',
				sourceFilePath: undefined as any
			}
			const currentFilePath = '/path/to/main.ts'

			setupImportGeneratorFailureScenario(mocks, { 
				currentFilePath, 
				fragment 
			})

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBeUndefined()
			expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
		})

		it('should handle path utils service failures', () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'ServiceFailureComponent',
				sourceFilePath: '/path/to/component.ts'
			}
			const currentFilePath = '/path/to/main.ts'

			// Mock pathUtils to return null/undefined instead of throwing
			mocks.pathUtils.getDottedPath.mockReturnValue(null)
			setupCommonUtilsScenario(mocks)

			// Act
			const result = importGeneratorService.generate(currentFilePath, fragment)

			// Assert
			expect(result).toBeUndefined()
			expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
		})
	})

	describe('Performance Scenarios', () => {
		it('should handle multiple rapid generations', () => {
			// Arrange
			const fragments: StoredFragment[] = Array.from({ length: 100 }, (_, i) => ({
				text: `Component${i}`,
				sourceFilePath: `/path/to/component${i}.ts`
			}))
			const currentFilePath = '/path/to/main.ts'

			mocks.pathUtils.getDottedPath.mockReturnValue('./component')
			setupCommonUtilsScenario(mocks)

			// Act
			const results = fragments.map(fragment => 
				importGeneratorService.generate(currentFilePath, fragment)
			)

			// Assert
			expect(results).toHaveLength(100)
			expect(results.every(result => result === "import { Component0 } from './component.js'\n" || 
				result === "import { Component1 } from './component.js'\n" || 
				result === "import { Component2 } from './component.js'\n" || 
				result === "import { Component3 } from './component.js'\n" || 
				result === "import { Component4 } from './component.js'\n" || 
				result === "import { Component5 } from './component.js'\n" || 
				result === "import { Component6 } from './component.js'\n" || 
				result === "import { Component7 } from './component.js'\n" || 
				result === "import { Component8 } from './component.js'\n" || 
				result === "import { Component9 } from './component.js'\n" || 
				result === "import { Component10 } from './component.js'\n" || 
				result === "import { Component11 } from './component.js'\n" || 
				result === "import { Component12 } from './component.js'\n" || 
				result === "import { Component13 } from './component.js'\n" || 
				result === "import { Component14 } from './component.js'\n" || 
				result === "import { Component15 } from './component.js'\n" || 
				result === "import { Component16 } from './component.js'\n" || 
				result === "import { Component17 } from './component.js'\n" || 
				result === "import { Component18 } from './component.js'\n" || 
				result === "import { Component19 } from './component.js'\n" || 
				result === "import { Component20 } from './component.js'\n" || 
				result === "import { Component21 } from './component.js'\n" || 
				result === "import { Component22 } from './component.js'\n" || 
				result === "import { Component23 } from './component.js'\n" || 
				result === "import { Component24 } from './component.js'\n" || 
				result === "import { Component25 } from './component.js'\n" || 
				result === "import { Component26 } from './component.js'\n" || 
				result === "import { Component27 } from './component.js'\n" || 
				result === "import { Component28 } from './component.js'\n" || 
				result === "import { Component29 } from './component.js'\n" || 
				result === "import { Component30 } from './component.js'\n" || 
				result === "import { Component31 } from './component.js'\n" || 
				result === "import { Component32 } from './component.js'\n" || 
				result === "import { Component33 } from './component.js'\n" || 
				result === "import { Component34 } from './component.js'\n" || 
				result === "import { Component35 } from './component.js'\n" || 
				result === "import { Component36 } from './component.js'\n" || 
				result === "import { Component37 } from './component.js'\n" || 
				result === "import { Component38 } from './component.js'\n" || 
				result === "import { Component39 } from './component.js'\n" || 
				result === "import { Component40 } from './component.js'\n" || 
				result === "import { Component41 } from './component.js'\n" || 
				result === "import { Component42 } from './component.js'\n" || 
				result === "import { Component43 } from './component.js'\n" || 
				result === "import { Component44 } from './component.js'\n" || 
				result === "import { Component45 } from './component.js'\n" || 
				result === "import { Component46 } from './component.js'\n" || 
				result === "import { Component47 } from './component.js'\n" || 
				result === "import { Component48 } from './component.js'\n" || 
				result === "import { Component49 } from './component.js'\n" || 
				result === "import { Component50 } from './component.js'\n" || 
				result === "import { Component51 } from './component.js'\n" || 
				result === "import { Component52 } from './component.js'\n" || 
				result === "import { Component53 } from './component.js'\n" || 
				result === "import { Component54 } from './component.js'\n" || 
				result === "import { Component55 } from './component.js'\n" || 
				result === "import { Component56 } from './component.js'\n" || 
				result === "import { Component57 } from './component.js'\n" || 
				result === "import { Component58 } from './component.js'\n" || 
				result === "import { Component59 } from './component.js'\n" || 
				result === "import { Component60 } from './component.js'\n" || 
				result === "import { Component61 } from './component.js'\n" || 
				result === "import { Component62 } from './component.js'\n" || 
				result === "import { Component63 } from './component.js'\n" || 
				result === "import { Component64 } from './component.js'\n" || 
				result === "import { Component65 } from './component.js'\n" || 
				result === "import { Component66 } from './component.js'\n" || 
				result === "import { Component67 } from './component.js'\n" || 
				result === "import { Component68 } from './component.js'\n" || 
				result === "import { Component69 } from './component.js'\n" || 
				result === "import { Component70 } from './component.js'\n" || 
				result === "import { Component71 } from './component.js'\n" || 
				result === "import { Component72 } from './component.js'\n" || 
				result === "import { Component73 } from './component.js'\n" || 
				result === "import { Component74 } from './component.js'\n" || 
				result === "import { Component75 } from './component.js'\n" || 
				result === "import { Component76 } from './component.js'\n" || 
				result === "import { Component77 } from './component.js'\n" || 
				result === "import { Component78 } from './component.js'\n" || 
				result === "import { Component79 } from './component.js'\n" || 
				result === "import { Component80 } from './component.js'\n" || 
				result === "import { Component81 } from './component.js'\n" || 
				result === "import { Component82 } from './component.js'\n" || 
				result === "import { Component83 } from './component.js'\n" || 
				result === "import { Component84 } from './component.js'\n" || 
				result === "import { Component85 } from './component.js'\n" || 
				result === "import { Component86 } from './component.js'\n" || 
				result === "import { Component87 } from './component.js'\n" || 
				result === "import { Component88 } from './component.js'\n" || 
				result === "import { Component89 } from './component.js'\n" || 
				result === "import { Component90 } from './component.js'\n" || 
				result === "import { Component91 } from './component.js'\n" || 
				result === "import { Component92 } from './component.js'\n" || 
				result === "import { Component93 } from './component.js'\n" || 
				result === "import { Component94 } from './component.js'\n" || 
				result === "import { Component95 } from './component.js'\n" || 
				result === "import { Component96 } from './component.js'\n" || 
				result === "import { Component97 } from './component.js'\n" || 
				result === "import { Component98 } from './component.js'\n" || 
				result === "import { Component99 } from './component.js'\n")).toBe(true)
			expect(mocks.pathUtils.getDottedPath).toHaveBeenCalledTimes(100)
		})

		it('should handle concurrent generations', () => {
			// Arrange
			const fragments: StoredFragment[] = [
				{ text: 'Component1', sourceFilePath: '/path/to/component1.ts' },
				{ text: 'Component2', sourceFilePath: '/path/to/component2.ts' },
				{ text: 'Component3', sourceFilePath: '/path/to/component3.ts' }
			]
			const currentFilePath = '/path/to/main.ts'

			mocks.pathUtils.getDottedPath.mockReturnValue('./component')
			setupCommonUtilsScenario(mocks)

			// Act
			const results = fragments.map(fragment => 
				importGeneratorService.generate(currentFilePath, fragment)
			)

			// Assert
			expect(results).toHaveLength(3)
			expect(results[0]).toBe("import { Component1 } from './component.js'\n")
			expect(results[1]).toBe("import { Component2 } from './component.js'\n")
			expect(results[2]).toBe("import { Component3 } from './component.js'\n")
		})
	})

	describe('Integration Scenarios', () => {
		it('should handle complex real-world scenarios', () => {
			// Arrange
			const scenarios = [
				{
					fragment: { text: 'Button', sourceFilePath: '/src/components/ui/Button.tsx' },
					currentFilePath: '/src/pages/HomePage.tsx',
					expectedImport: "import { Button } from '../components/ui/Button.js'\n"
				},
				{
					fragment: { text: 'ApiService', sourceFilePath: '/src/services/api/ApiService.ts' },
					currentFilePath: '/src/components/UserProfile.tsx',
					expectedImport: "import { ApiService } from '../../services/api/ApiService.js'\n"
				},
				{
					fragment: { text: 'Utils', sourceFilePath: '/src/utils/index.ts' },
					currentFilePath: '/src/components/forms/LoginForm.tsx',
					expectedImport: "import { Utils } from '../../../utils/index.js'\n"
				}
			]

			mocks.pathUtils.getDottedPath.mockImplementation((sourcePath, currentPath) => {
				// Mock realistic path resolution
				if (sourcePath.includes('Button') && currentPath.includes('HomePage')) {
					return '../components/ui/Button'
				}
				if (sourcePath.includes('ApiService') && currentPath.includes('UserProfile')) {
					return '../../services/api/ApiService'
				}
				if (sourcePath.includes('utils') && currentPath.includes('LoginForm')) {
					return '../../../utils/index'
				}
				return './component'
			})
			setupCommonUtilsScenario(mocks)

			// Act
			const results = scenarios.map(scenario => 
				importGeneratorService.generate(scenario.currentFilePath, scenario.fragment)
			)

			// Assert
			expect(results[0]).toBe(scenarios[0].expectedImport)
			expect(results[1]).toBe(scenarios[1].expectedImport)
			expect(results[2]).toBe(scenarios[2].expectedImport)
		})
	})
})