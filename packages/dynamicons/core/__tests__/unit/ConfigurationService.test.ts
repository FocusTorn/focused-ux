import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfigurationService } from '../../src/services/ConfigurationService.js'
import type { IWorkspace } from '../../src/_interfaces/IWorkspace.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'

// Mock dependencies
const mockWorkspace: IWorkspace = {
	getConfiguration: vi.fn(),
}

const mockCommonUtils: ICommonUtils = {
	delay: vi.fn(),
	errMsg: vi.fn(),
}

describe('ConfigurationService', () => {
	let service: ConfigurationService
	let mockConfig: any

	beforeEach(() => {
		vi.clearAllMocks()
		mockConfig = {
			get: vi.fn(),
			update: vi.fn(),
		}
		;(mockWorkspace.getConfiguration as any).mockReturnValue(mockConfig)
		service = new ConfigurationService(mockWorkspace, mockCommonUtils)
	})

	describe('getUserIconsDirectory', () => {
		it('should return user icons directory when configured', async () => {
			const expectedPath = '/path/to/user/icons'

			mockConfig.get.mockReturnValue(expectedPath)

			const result = await service.getUserIconsDirectory()

			expect(result).toBe(expectedPath)
			expect(mockConfig.get).toHaveBeenCalledWith('userIconsDirectory')
		})

		it('should return undefined when not configured', async () => {
			mockConfig.get.mockReturnValue(undefined)

			const result = await service.getUserIconsDirectory()

			expect(result).toBeUndefined()
		})

		it('should return undefined when empty string', async () => {
			mockConfig.get.mockReturnValue('')

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

			mockConfig.get.mockReturnValue(expectedMappings)

			const result = await service.getCustomMappings()

			expect(result).toEqual(expectedMappings)
			expect(mockConfig.get).toHaveBeenCalledWith('customIconMappings')
		})

		it('should return undefined when not configured', async () => {
			mockConfig.get.mockReturnValue(undefined)

			const result = await service.getCustomMappings()

			expect(result).toBeUndefined()
		})

		it('should return empty object when configured as empty', async () => {
			mockConfig.get.mockReturnValue({})

			const result = await service.getCustomMappings()

			expect(result).toEqual({})
		})
	})

	describe('getHideArrowsSetting', () => {
		it('should return true when configured', async () => {
			mockConfig.get.mockReturnValue(true)

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(true)
			expect(mockConfig.get).toHaveBeenCalledWith('hideExplorerArrows')
		})

		it('should return false when configured', async () => {
			mockConfig.get.mockReturnValue(false)

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(false)
		})

		it('should return null when configured', async () => {
			mockConfig.get.mockReturnValue(null)

			const result = await service.getHideArrowsSetting()

			expect(result).toBe(null)
		})

		it('should return undefined when not configured', async () => {
			mockConfig.get.mockReturnValue(undefined)

			const result = await service.getHideArrowsSetting()

			expect(result).toBeUndefined()
		})
	})

	describe('updateCustomMappings', () => {
		it('should update mappings when changes are made', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const newMappings = { 'file:.ts': '_new', 'folder:src': '_source' }
			
			mockConfig.get.mockReturnValue(originalMappings)
			mockConfig.update.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(originalMappings)
			expect(mockConfig.update).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})

		it('should not update when no changes are made', async () => {
			const mappings = { 'file:.ts': '_typescript' }
			
			mockConfig.get.mockReturnValue(mappings)
			mockConfig.update.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(mappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(mappings)
			expect(mockConfig.update).not.toHaveBeenCalled()
		})

		it('should handle update function returning false', async () => {
			const mappings = { 'file:.ts': '_typescript' }
			
			mockConfig.get.mockReturnValue(mappings)

			const updateFn = vi.fn().mockResolvedValue(false)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith(mappings)
			expect(mockConfig.update).not.toHaveBeenCalled()
		})

		it('should handle update function returning boolean true', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const updatedMappings = { 'file:.ts': '_new' }
			
			mockConfig.get.mockReturnValue(originalMappings)
			mockConfig.update.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockImplementation(async (mappings) => {
				mappings['file:.ts'] = '_new'
				return true
			})

			await service.updateCustomMappings(updateFn)

			// The updateFn is called with a mutable copy that gets modified by the mock
			expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ 'file:.ts': '_new' }))
			expect(mockConfig.update).toHaveBeenCalledWith('customIconMappings', updatedMappings, true)
		})

		it('should handle config update error', async () => {
			const originalMappings = { 'file:.ts': '_old' }
			const newMappings = { 'file:.ts': '_new' }
			const updateError = new Error('Update failed')
			
			mockConfig.get.mockReturnValue(originalMappings)
			mockConfig.update.mockRejectedValue(updateError)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await expect(service.updateCustomMappings(updateFn)).rejects.toThrow('Failed to update icon mappings: Update failed')
			expect(mockConfig.update).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})

		it('should handle empty original mappings', async () => {
			const newMappings = { 'file:.ts': '_typescript' }
			
			mockConfig.get.mockReturnValue(undefined)
			mockConfig.update.mockResolvedValue(undefined)

			const updateFn = vi.fn().mockResolvedValue(newMappings)

			await service.updateCustomMappings(updateFn)

			expect(updateFn).toHaveBeenCalledWith({})
			expect(mockConfig.update).toHaveBeenCalledWith('customIconMappings', newMappings, true)
		})
	})
})
