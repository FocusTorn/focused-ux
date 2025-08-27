import { describe, it, expect, beforeEach } from 'vitest'
import { PackageJsonFormattingService } from '../../src/services/PackageJsonFormatting.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupYamlMocks } from '../_setup'

describe('PackageJsonFormattingService', () => {
	let service: PackageJsonFormattingService
	let mocks: ReturnType<typeof setupTestEnvironment>

	beforeEach(() => {
		mocks = setupTestEnvironment()
		setupFileSystemMocks(mocks)
		setupPathMocks(mocks)
		setupYamlMocks(mocks)
		
		service = new PackageJsonFormattingService(mocks.fileSystem, mocks.yaml)
		resetAllMocks(mocks)
	})

	describe('formatPackageJson', () => {
		it('should format package.json successfully', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
			const packageContent = JSON.stringify({
				scripts: { test: 'jest' },
				name: 'test-package',
				version: '1.0.0',
				dependencies: { lodash: '^4.17.21' },
			}, null, 2)

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent) // .FocusedUX config
				.mockResolvedValueOnce(packageContent) // package.json

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts', 'dependencies'],
				},
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.readFile).toHaveBeenCalledWith('/test/.FocusedUX')
			expect(mocks.fileSystem.readFile).toHaveBeenCalledWith(packageJsonPath)
			expect(mocks.yaml.load).toHaveBeenCalledWith(configContent)
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "test-package"'),
			)
		})

		it('should handle missing .FocusedUX file', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'

			mocks.fileSystem.readFile.mockRejectedValueOnce(new Error('File not found'))

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects
				.toThrow('Could not read \'.FocusedUX\' file: File not found')
		})

		it('should handle invalid YAML in .FocusedUX', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'invalid: yaml: content:'

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.yaml.load.mockImplementation(() => {
				throw new Error('Invalid YAML')
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects
				.toThrow('Failed to parse YAML from \'.FocusedUX\': Invalid YAML')
		})

		it('should handle missing packageJson-order configuration', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  other-config: value'

			mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'other-config': 'value',
				},
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects
				.toThrow('Configuration Error: \'ProjectButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.')
		})

		it('should handle missing package.json file', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent)
				.mockRejectedValueOnce(new Error('Package.json not found'))

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version'],
				},
			})

			// Act & Assert
			await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
				.rejects
				.toThrow('Failed to read package.json: Package.json not found')
		})

		it('should ensure name is always first in order', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - version\n    - scripts'
			const packageContent = JSON.stringify({
				name: 'test-package',
				version: '1.0.0',
				scripts: { test: 'jest' },
			}, null, 2)

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent)
				.mockResolvedValueOnce(packageContent)

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['version', 'scripts'],
				},
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "test-package"'),
			)
			
			// Verify the order is correct
			const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
			const parsed = JSON.parse(writtenContent)
			const keys = Object.keys(parsed)

			expect(keys[0]).toBe('name')
			expect(keys[1]).toBe('version')
			expect(keys[2]).toBe('scripts')
		})

		it('should handle unknown keys by placing them at the end', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
			const packageContent = JSON.stringify({
				name: 'test-package',
				version: '1.0.0',
				unknownKey: 'value',
				scripts: { test: 'jest' },
			}, null, 2)

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent)
				.mockResolvedValueOnce(packageContent)

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version'],
				},
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
			const parsed = JSON.parse(writtenContent)
			const keys = Object.keys(parsed)
			
			expect(keys[0]).toBe('name')
			expect(keys[1]).toBe('version')
			expect(keys[2]).toBe('unknownKey')
			expect(keys[3]).toBe('scripts')
		})

		it('should preserve comment-like keys', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
			const packageContent = JSON.stringify({
				'name': 'test-package',
				'version': '1.0.0',
				'=comment=': 'This is a comment',
				'scripts': { test: 'jest' },
			}, null, 2)

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent)
				.mockResolvedValueOnce(packageContent)

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version'],
				},
			})

			// Act
			await service.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
			const parsed = JSON.parse(writtenContent)
			
			expect(parsed['=comment=']).toBe('This is a comment')
		})
	})

	describe('getUnknownKeys', () => {
		it('should identify unknown keys correctly', () => {
			// Arrange
			const packageData = {
				name: 'test',
				version: '1.0.0',
				unknownKey: 'value',
				scripts: { test: 'jest' },
			}
			const masterOrder = ['name', 'version', 'scripts']

			// Act
			const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

			// Assert
			expect(unknownKeys).toEqual(['unknownKey'])
		})

		it('should ignore comment-like keys', () => {
			// Arrange
			const packageData = {
				'name': 'test',
				'=comment=': 'This is a comment',
				'unknownKey': 'value',
			}
			const masterOrder = ['name']

			// Act
			const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

			// Assert
			expect(unknownKeys).toEqual(['unknownKey'])
		})
	})
})
