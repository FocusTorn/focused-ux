import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageService } from '@fux/context-cherry-picker-core'
import { TreeItemCheckboxState } from '@fux/mockly'
import type { IFileSystem } from '@fux/context-cherry-picker-core'

describe('StorageService', () => {
	let storageService: StorageService
	let mockContext: any
	let mockFileSystem: IFileSystem
	let mockPath: any

	beforeEach(() => {
		// Create mock dependencies
		mockContext = {
			globalStorageUri: '/test/storage',
		}

		mockFileSystem = {
			readDirectory: vi.fn(),
			stat: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			access: vi.fn(),
			copyFile: vi.fn(),
			createDirectory: vi.fn(),
		}

		mockPath = {
			join: vi.fn((...args: string[]) => args.join('/')),
			dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
			basename: vi.fn((path: string) => path.split('/').pop() || ''),
			extname: vi.fn((path: string) => {
				const ext = path.split('.').pop()

				return ext ? `.${ext}` : ''
			}),
			isAbsolute: vi.fn((path: string) => path.startsWith('/')),
			relative: vi.fn((from: string, to: string) => to.replace(from, '')),
			resolve: vi.fn((...args: string[]) => args.join('/')),
		}

		// Create service instance
		storageService = new StorageService(
			mockContext,
			mockFileSystem,
			mockPath,
		)
	})

	describe('saveState', () => {
		it('should save state successfully', async () => {
			const stateName = 'test-state'
			const stateData = [
				{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked },
				{ uriString: 'file:///test/file2.ts', checkboxState: TreeItemCheckboxState.Unchecked },
			]

			mockFileSystem.stat = vi.fn().mockRejectedValue(new Error('File not found'))
			mockFileSystem.createDirectory = vi.fn().mockResolvedValue(undefined)
			mockFileSystem.writeFile = vi.fn().mockResolvedValue(undefined)

			await storageService.saveState(stateName, stateData)

			expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
				expect.stringContaining('ccp.savedStates.json'),
				expect.any(Uint8Array),
			)
		})

		it('should handle file write errors', async () => {
			const stateName = 'test-state'
			const stateData = []

			mockFileSystem.stat = vi.fn().mockRejectedValue(new Error('File not found'))
			mockFileSystem.createDirectory = vi.fn().mockResolvedValue(undefined)
			mockFileSystem.writeFile = vi.fn().mockRejectedValue(new Error('Write failed'))

			await expect(storageService.saveState(stateName, stateData)).rejects.toThrow('Write failed')
		})
	})

	describe('loadState', () => {
		it('should load state successfully', async () => {
			const stateId = '1234567890'
			const expectedData = [
				{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked },
			]
			const mockFileContent = JSON.stringify({
				[stateId]: {
					label: 'test-state',
					timestamp: Date.now(),
					checkedItems: expectedData,
				},
			})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)

			const result = await storageService.loadState(stateId)

			expect(result).toEqual(expectedData)
		})

		it('should return undefined when state not found', async () => {
			const stateId = 'non-existent-state'
			const mockFileContent = JSON.stringify({})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)

			const result = await storageService.loadState(stateId)

			expect(result).toBeUndefined()
		})

		it('should handle invalid JSON gracefully', async () => {
			const stateId = 'test-state'
			const invalidJson = 'invalid json content'

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(invalidJson)

			const result = await storageService.loadState(stateId)

			// Service should handle invalid JSON gracefully and return undefined
			expect(result).toBeUndefined()
		})
	})

	describe('loadAllSavedStates', () => {
		it('should return all saved states', async () => {
			const mockFileContent = JSON.stringify({
				1234567890: {
					label: 'test-state-1',
					timestamp: Date.now(),
					checkedItems: [{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked }],
				},
				1234567891: {
					label: 'test-state-2',
					timestamp: Date.now(),
					checkedItems: [{ uriString: 'file:///test/file2.ts', checkboxState: TreeItemCheckboxState.Unchecked }],
				},
			})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)

			const result = await storageService.loadAllSavedStates()

			expect(result).toHaveLength(2)
			expect(result[0]).toHaveProperty('id', '1234567890')
			expect(result[0]).toHaveProperty('label', 'test-state-1')
			expect(result[1]).toHaveProperty('id', '1234567891')
			expect(result[1]).toHaveProperty('label', 'test-state-2')
		})

		it('should return empty array when no states exist', async () => {
			const mockFileContent = JSON.stringify({})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)

			const result = await storageService.loadAllSavedStates()

			expect(result).toEqual([])
		})
	})

	describe('deleteState', () => {
		it('should delete state successfully', async () => {
			const stateId = '1234567890'
			const mockFileContent = JSON.stringify({
				[stateId]: {
					label: 'test-state',
					timestamp: Date.now(),
					checkedItems: [],
				},
			})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)
			mockFileSystem.writeFile = vi.fn().mockResolvedValue(undefined)

			await storageService.deleteState(stateId)

			expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
				expect.stringContaining('ccp.savedStates.json'),
				expect.any(Uint8Array),
			)
		})

		it('should handle state not found during deletion', async () => {
			const stateId = 'non-existent-state'
			const mockFileContent = JSON.stringify({})

			mockFileSystem.stat = vi.fn().mockResolvedValue({})
			mockFileSystem.readFile = vi.fn().mockResolvedValue(mockFileContent)

			await storageService.deleteState(stateId)

			// Should not throw and should not write anything
			expect(mockFileSystem.writeFile).not.toHaveBeenCalled()
		})
	})
})
