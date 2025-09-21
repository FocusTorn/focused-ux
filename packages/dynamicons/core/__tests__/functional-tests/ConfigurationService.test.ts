import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConfigurationService } from '../../src/services/ConfigurationService.js'
import {
	setupTestEnvironment,
	resetAllMocks,
	setupWorkspaceMocks,
} from '../__mocks__/helpers'
import {
	setupConfigurationSuccessScenario,
	setupConfigurationErrorScenario,
	createDynamiconsMockBuilder,
} from '../__mocks__/mock-scenario-builder'

describe('ConfigurationService', () => {
	let service: ConfigurationService
	let mocks: ReturnType<typeof setupTestEnvironment>

	beforeEach(() => {
		mocks = setupTestEnvironment()
		resetAllMocks(mocks)
		setupWorkspaceMocks(mocks)
		service = new ConfigurationService(mocks.workspace, mocks.commonUtils)
	})

	describe('getUserIconsDirectory', () => {
		it('should return user icons directory when configured', async () => {
			const expectedPath = '/path/to/user/icons'

			setupConfigurationSuccessScenario(mocks, {
				key: 'userIconsDirectory',
				value: expectedPath,
			})

			const result = await service.getUserIconsDirectory()

			expect(result).toBe(expectedPath)
		})

		it('should return undefined when not configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'userIconsDirectory',
				value: undefined,
			})

			const result = await service.getUserIconsDirectory()

			expect(result).toBeUndefined()
		})

		it('should return undefined when empty string', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'userIconsDirectory',
				value: '',
			})

			const result = await service.getUserIconsDirectory()

			expect(result).toBeUndefined()
		})
	})

	describe('getCustomMappings', () => {
		it('should return custom mappings when configured', async () => {
			const expectedMappings = {
				'file:.ts': '_typescript',
				'folder:src': '_source',
			}

			setupConfigurationSuccessScenario(mocks, {
				key: 'customIconMappings',
				value: expectedMappings,
			})

			const result = await service.getCustomMappings()

			expect(result).toEqual(expectedMappings)
		})

		it('should return undefined when not configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'customIconMappings',
				value: undefined,
			})

			const result = await service.getCustomMappings()

			expect(result).toBeUndefined()
		})

		it('should return empty object when configured as empty', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'customIconMappings',
				value: {},
			})

			const result = await service.getCustomMappings()

			expect(result).toEqual({})
		})
	})

	describe('getHideArrowsSetting', () => {
		it('should return true when configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'hideExplorerArrows',
				value: true,
			})

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(true)
		})

		it('should return false when configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'hideExplorerArrows',
				value: false,
			})

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(false)
		})

		it('should return null when configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'hideExplorerArrows',
				value: null,
			})

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(null)
		})

		it('should return undefined when not configured', async () => {
			setupConfigurationSuccessScenario(mocks, {
				key: 'hideExplorerArrows',
				value: undefined,
			})

			const result = await service.getHideArrowsSetting()

			expect(result).toBeUndefined()
		})
	})

	describe('updateCustomMappings', () => {
		it('should update mappings when changes are made', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const newMappings = { 'file:.ts': '_new', 'folder:src': '_source' }
			
			// Setup configuration mock for this specific test
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(originalMappings)
			mockUpdate.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(originalMappings)
			expect(mockUpdate).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})

		it('should not update when no changes are made', async () => {
			const mappings = { 'file:.ts': '_typescript' }
			
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(mappings)
			mockUpdate.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(mappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(mappings)
			expect(mockUpdate).not.toHaveBeenCalled()
		})

		it('should handle update function returning false', async () => {
			const mappings = { 'file:.ts': '_typescript' }
			
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(mappings)

			const updateFn = vi.fn().mockResolvedValue(false)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(mappings)
			expect(mockUpdate).not.toHaveBeenCalled()
		})

		it('should handle update function returning boolean true', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const updatedMappings = { 'file:.ts': '_new' }
			
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(originalMappings)
			mockUpdate.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockImplementation(async (mappings) => {
				mappings['file:.ts'] = '_new'
				return true
			})

			await service.updateCustomMappings(updateFn)

			// The updateFn is called with a mutable copy that gets modified by the mock
			expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ 'file:.ts': '_new' }))
			expect(mockUpdate).toHaveBeenCalledWith('customIconMappings', updatedMappings, true)
		})

		it('should handle config update error', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const newMappings = { 'file:.ts': '_new' }
			const updateError = new Error('Update failed')
			
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(originalMappings)
			mockUpdate.mockRejectedValue(updateError)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await expect(service.updateCustomMappings(updateFn)).rejects.toThrow('Failed to update icon mappings: Update failed')
			expect(mockUpdate).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})

		it('should handle empty original mappings', async () => {
			const newMappings = { 'file:.ts': '_typescript' }
			
			const mockConfig = mocks.workspace.getConfiguration().get as any
			const mockUpdate = mocks.workspace.getConfiguration().update as any
			
			mockConfig.mockReturnValue(undefined)
			mockUpdate.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith({})
			expect(mockUpdate).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})
	})

	describe('Enhanced Mock Strategy Examples', () => {
		it('should demonstrate builder pattern for complex scenarios', async () => {
			// Using the fluent builder API for complex mock composition
			createDynamiconsMockBuilder(mocks)
				.configuration({
					key: 'userIconsDirectory',
					value: '/path/to/icons',
				})
				.build()

			const result = await service.getUserIconsDirectory()

			expect(result).toBe('/path/to/icons')
		})

		it('should demonstrate error scenario handling', async () => {
			createDynamiconsMockBuilder(mocks)
				.error('configuration', 'Configuration service unavailable')
				.build()

			await expect(service.getUserIconsDirectory()).rejects.toThrow()
		})
	})
})
