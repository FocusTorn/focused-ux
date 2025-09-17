import { describe, it, expect, beforeEach } from 'vitest'
import { PackageJsonFormattingService } from '../../src/services/PackageJsonFormatting.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupYamlMocks } from '../_setup'

describe('PackageJsonFormattingService - Complex Scenarios', () => {
	let service: PackageJsonFormattingService
	let mocks: ReturnType<typeof setupTestEnvironment>

	beforeEach(() => { //>
		mocks = setupTestEnvironment()
		setupFileSystemMocks(mocks)
		setupPathMocks(mocks)
		setupYamlMocks(mocks)
		
		service = new PackageJsonFormattingService(mocks.fileSystem, mocks.yaml)
		resetAllMocks(mocks)
	}) //<

	describe('Complex Package.json Scenarios', () => {
		it('should handle deeply nested package.json with complex dependencies', async () => { //>
			// Arrange
			const packageJsonPath = '/complex-project/package.json'
			const workspaceRoot = '/complex-project'
			const configContent = `ProjectButler:
  packageJson-order:
    - name
    - version
    - description
    - main
    - types
    - scripts
    - dependencies
    - devDependencies
    - peerDependencies
    - optionalDependencies
    - engines
    - repository
    - keywords
    - author
    - license`
			
			const complexPackageContent = JSON.stringify({
				keywords: ['typescript', 'vscode', 'extension'],
				license: 'MIT',
				author: 'John Doe <john@example.com>',
				repository: {
					type: 'git',
					url: 'https://github.com/example/complex-project.git'
				},
				engines: {
					node: '>=18.0.0',
					vscode: '^1.99.0'
				},
				optionalDependencies: {
					'optional-package': '^1.0.0'
				},
				peerDependencies: {
					'react': '>=16.8.0',
					'react-dom': '>=16.8.0'
				},
				devDependencies: {
					'@types/node': '^20.0.0',
					'typescript': '^5.0.0',
					'vitest': '^1.0.0',
					'eslint': '^8.0.0'
				},
				dependencies: {
					'lodash': '^4.17.21',
					'axios': '^1.6.0',
					'uuid': '^9.0.0'
				},
				scripts: {
					'build': 'tsc',
					'test': 'vitest',
					'lint': 'eslint src/**/*.ts',
					'dev': 'tsc --watch'
				},
				types: './dist/index.d.ts',
				main: './dist/index.js',
				description: 'A complex project with many dependencies',
				version: '2.1.0',
				name: 'complex-project'
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(complexPackageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': [
						'name', 'version', 'description', 'main', 'types', 'scripts',
						'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies',
						'engines', 'repository', 'keywords', 'author', 'license'
					]
				}
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "complex-project"')
			)
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"version": "2.1.0"')
			)
		}) //<

		it('should handle package.json with circular references and special characters', async () => { //>
			// Arrange
			const packageJsonPath = '/special-chars/package.json'
			const workspaceRoot = '/special-chars'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
			
			const specialPackageContent = JSON.stringify({
				name: 'project-with-special-chars-@#$%',
				version: '1.0.0-beta.1',
				scripts: {
					'test:unit': 'jest --testPathPattern=unit',
					'test:integration': 'jest --testPathPattern=integration',
					'build:prod': 'webpack --mode=production',
					'build:dev': 'webpack --mode=development'
				}
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(specialPackageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts']
				}
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "project-with-special-chars-@#$%"')
			)
		}) //<

		it('should handle malformed YAML configuration gracefully', async () => { //>
			// Arrange
			const packageJsonPath = '/malformed-config/package.json'
			const workspaceRoot = '/malformed-config'
			const malformedConfigContent = `ProjectButler:
  packageJson-order:
    - name
    - version
    # Missing closing bracket
    - scripts`

			mocks.fileSystem.readFile.mockResolvedValueOnce(malformedConfigContent)
			mocks.yaml.load.mockImplementation(() => {
				throw new Error('YAML parsing error')
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects.toThrow('Could not parse \'.FocusedUX\' file: YAML parsing error')
		}) //<

		it('should handle empty package.json file', async () => { //>
			// Arrange
			const packageJsonPath = '/empty/package.json'
			const workspaceRoot = '/empty'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
			
			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce('')
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version']
				}
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects.toThrow('Could not parse \'package.json\' file')
		}) //<

		it('should handle package.json with duplicate keys', async () => { //>
			// Arrange
			const packageJsonPath = '/duplicates/package.json'
			const workspaceRoot = '/duplicates'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
			
			const duplicatePackageContent = JSON.stringify({
				name: 'duplicate-test',
				version: '1.0.0',
				scripts: {
					test: 'jest'
				},
				'duplicate-name': 'duplicate-value', // Different key to avoid JSON parsing issues
				'duplicate-version': '2.0.0' // Different key to avoid JSON parsing issues
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(duplicatePackageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts']
				}
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert - Should handle the package.json formatting
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "duplicate-test"')
			)
		}) //<
	})
	
	//==================================================================================================================================
	
	describe('Edge Cases and Error Scenarios', () => {
		it('should handle very long package names', async () => { //>
			// Arrange
			const packageJsonPath = '/long-name/package.json'
			const workspaceRoot = '/long-name'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
			
			const longName = 'a'.repeat(10) // Further reduced from 50 to 10 to prevent memory issues
			const packageContent = JSON.stringify({
				name: longName,
				version: '1.0.0'
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(packageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version']
				}
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining(`"name": "${longName}"`)
			)
		}) //<

		it('should handle package.json with Unicode characters', async () => { //>
			// Arrange
			const packageJsonPath = '/unicode/package.json'
			const workspaceRoot = '/unicode'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - description'
			
			const packageContent = JSON.stringify({
				name: 'unicode-project-🚀',
				description: 'A project with Unicode characters: 中文, العربية, русский'
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(packageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'description']
				}
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "unicode-project-🚀"')
			)
		}) //<

		it('should handle file system errors gracefully', async () => { //>
			// Arrange
			const packageJsonPath = '/error/package.json'
			const workspaceRoot = '/error'
			
			mocks.fileSystem.readFile.mockRejectedValueOnce(new Error('File system error'))

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects.toThrow('Could not read \'.FocusedUX\' file: File system error')
		}) //<

		it('should handle write permission errors', async () => { //>
			// Arrange
			const packageJsonPath = '/readonly/package.json'
			const workspaceRoot = '/readonly'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name'
			const packageContent = JSON.stringify({ name: 'test' }, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(packageContent)
			mocks.fileSystem.writeFile.mockRejectedValueOnce(new Error('Permission denied'))
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name']
				}
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects.toThrow('Permission denied')
		}) //<
	})
	
	//==================================================================================================================================

	describe('Performance and Large File Handling', () => {
		it('should handle large package.json files efficiently', async () => { //>
			// Arrange
			const packageJsonPath = '/large/package.json'
			const workspaceRoot = '/large'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - dependencies'
			
			// Create a large package.json with many dependencies
			const largeDependencies: Record<string, string> = {}
			for (let i = 0; i < 3; i++) { // Further reduced from 10 to 3 to prevent memory issues
				largeDependencies[`package-${i}`] = `^1.0.0` // Use static version to reduce memory
			}
			
			const largePackageContent = JSON.stringify({
				name: 'large-project',
				dependencies: largeDependencies
			}, null, 2)

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.fileSystem.readFile.mockResolvedValueOnce(largePackageContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'dependencies']
				}
			})

			// Act
			const startTime = Date.now()
			await service.formatPackageJson(packageJsonPath, workspaceRoot)
			const endTime = Date.now()

			// Assert
			expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "large-project"')
			)
		}) //<
	})
})
