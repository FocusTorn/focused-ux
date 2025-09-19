import { describe, it, expect, beforeEach } from 'vitest'
import { ClipboardService } from '../../src/services/Clipboard.service.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'
import { 
	createMockTestEnvironment, 
	resetAllMocks,
	setupClipboardStoreScenario,
	setupClipboardRetrieveScenario,
	setupClipboardClearScenario
} from '../_setup'

describe('ClipboardService Edge Cases', () => {
	let clipboardService: ClipboardService
	let mocks: ReturnType<typeof createMockTestEnvironment>

	beforeEach(() => {
		mocks = createMockTestEnvironment()
		clipboardService = new ClipboardService(mocks.storage)
		resetAllMocks(mocks)
	})

	describe('Large Data Handling', () => {
		it('should handle very large text fragments', async () => {
			// Arrange
			const largeText = 'A'.repeat(100000) // 100KB of text
			const fragment: StoredFragment = {
				text: largeText,
				sourceFilePath: '/path/to/large-file.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle very long file paths', async () => {
			// Arrange
			const longPath = '/very/long/path/' + 'subdir/'.repeat(100) + 'file.ts'
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: longPath
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle fragments with metadata', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts',
				timestamp: '2024-01-01T00:00:00.000Z',
				metadata: {
					lineNumber: 42,
					includeClassName: true,
					includeFunctionName: false,
					logStatement: 'console.log(\'MyComponent:\', MyComponent);\n',
					insertLine: 43
				}
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})
	})

	describe('Special Characters and Encoding', () => {
		it('should handle Unicode characters in text', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'const 变量 = "测试"; const 🚀 = "rocket";',
				sourceFilePath: '/path/to/unicode.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle special characters in file paths', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/with spaces & special-chars (v2)/component.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle newlines and tabs in text', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'const multiLine = `line1\nline2\twith tab`;',
				sourceFilePath: '/path/to/multiline.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle empty text fragments', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: '',
				sourceFilePath: '/path/to/empty.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})
	})

	describe('Concurrent Operations', () => {
		it('should handle concurrent store operations', async () => {
			// Arrange
			const fragment1: StoredFragment = {
				text: 'Component1',
				sourceFilePath: '/path/to/component1.ts'
			}
			const fragment2: StoredFragment = {
				text: 'Component2',
				sourceFilePath: '/path/to/component2.ts'
			}

			mocks.storage.update.mockResolvedValue(undefined)

			// Act
			const promises = [
				clipboardService.store(fragment1),
				clipboardService.store(fragment2)
			]

			await Promise.all(promises)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledTimes(2)
		})

		it('should handle concurrent retrieve operations', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts'
			}

			mocks.storage.get.mockResolvedValue(fragment)

			// Act
			const promises = [
				clipboardService.retrieve(),
				clipboardService.retrieve()
			]

			const results = await Promise.all(promises)

			// Assert
			expect(results).toEqual([fragment, fragment])
			expect(mocks.storage.get).toHaveBeenCalledTimes(2)
		})

		it('should handle store and retrieve operations concurrently', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts'
			}

			mocks.storage.update.mockResolvedValue(undefined)
			mocks.storage.get.mockResolvedValue(fragment)

			// Act
			const promises = [
				clipboardService.store(fragment),
				clipboardService.retrieve()
			]

			await Promise.all(promises)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
			expect(mocks.storage.get).toHaveBeenCalledWith('fux-ghost-writer.clipboard')
		})
	})

	describe('Error Recovery Scenarios', () => {
		it('should handle storage service temporary failures', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts'
			}

			// First call fails, second succeeds
			mocks.storage.update
				.mockRejectedValueOnce(new Error('Temporary storage failure'))
				.mockResolvedValueOnce(undefined)

			// Act & Assert - First attempt should fail
			await expect(clipboardService.store(fragment))
				.rejects.toThrow('Temporary storage failure')

			// Second attempt should succeed
			await clipboardService.store(fragment)
			expect(mocks.storage.update).toHaveBeenCalledTimes(2)
		})

		it('should handle partial storage failures', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts'
			}

			mocks.storage.update.mockRejectedValue(new Error('Storage quota exceeded'))

			// Act & Assert
			await expect(clipboardService.store(fragment))
				.rejects.toThrow('Storage quota exceeded')
		})

		it('should handle corrupted storage data', async () => {
			// Arrange
			mocks.storage.get.mockResolvedValue('corrupted-data')

			// Act
			const result = await clipboardService.retrieve()

			// Assert
			expect(result).toBe('corrupted-data')
		})
	})

	describe('Performance and Memory', () => {
		it('should handle rapid successive operations', async () => {
			// Arrange
			const fragments: StoredFragment[] = Array.from({ length: 100 }, (_, i) => ({
				text: `Component${i}`,
				sourceFilePath: `/path/to/component${i}.ts`
			}))

			mocks.storage.update.mockResolvedValue(undefined)

			// Act
			const promises = fragments.map(fragment => clipboardService.store(fragment))
			await Promise.all(promises)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledTimes(100)
		})

		it('should handle memory-intensive operations', async () => {
			// Arrange
			const largeFragments: StoredFragment[] = Array.from({ length: 10 }, (_, i) => ({
				text: 'X'.repeat(10000), // 10KB each
				sourceFilePath: `/path/to/large-component${i}.ts`
			}))

			mocks.storage.update.mockResolvedValue(undefined)

			// Act
			const promises = largeFragments.map(fragment => clipboardService.store(fragment))
			await Promise.all(promises)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledTimes(10)
		})
	})

	describe('Boundary Conditions', () => {
		it('should handle maximum line length', async () => {
			// Arrange
			const longLine = 'const ' + 'a'.repeat(10000) + ' = "very long variable name";'
			const fragment: StoredFragment = {
				text: longLine,
				sourceFilePath: '/path/to/long-line.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle fragments with only whitespace', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: '   \n\t  \n   ',
				sourceFilePath: '/path/to/whitespace.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})

		it('should handle fragments with control characters', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'const control = "\x00\x01\x02\x03";',
				sourceFilePath: '/path/to/control.ts'
			}

			setupClipboardStoreScenario(mocks, { fragment })

			// Act
			await clipboardService.store(fragment)

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
		})
	})

	describe('Integration Scenarios', () => {
		it('should handle complete workflow with edge cases', async () => {
			// Arrange
			const fragment: StoredFragment = {
				text: 'const 🚀 = "rocket"; const 变量 = "test";',
				sourceFilePath: '/path/with spaces & special-chars/unicode-component.ts',
				timestamp: '2024-01-01T00:00:00.000Z',
				metadata: {
					lineNumber: 42,
					includeClassName: true,
					includeFunctionName: false,
					logStatement: 'console.log(\'🚀:\', 🚀);\n',
					insertLine: 43
				}
			}

			// Setup mock to handle the sequence of calls
			mocks.storage.update = vi.fn().mockResolvedValue(undefined)
			mocks.storage.get = vi.fn()
				.mockResolvedValueOnce(fragment)  // First retrieve
				.mockResolvedValueOnce(undefined) // After clear
				.mockResolvedValueOnce(fragment)   // Final retrieve

			// Act & Assert - Store
			await clipboardService.store(fragment)
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)

			// Act & Assert - Retrieve
			let retrieved = await clipboardService.retrieve()
			expect(retrieved).toEqual(fragment)

			// Act & Assert - Clear
			await clipboardService.clear()
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', undefined)

			// Act & Assert - Retrieve after clear
			retrieved = await clipboardService.retrieve()
			expect(retrieved).toBeUndefined()

			// Act & Assert - Store again
			await clipboardService.store(fragment)
			expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)

			// Act & Assert - Final retrieve
			retrieved = await clipboardService.retrieve()
			expect(retrieved).toEqual(fragment)
		})

		it('should handle mixed operation types', async () => {
			// Arrange
			const fragments: StoredFragment[] = [
				{ text: 'Component1', sourceFilePath: '/path1.ts' },
				{ text: 'Component2', sourceFilePath: '/path2.ts' },
				{ text: 'Component3', sourceFilePath: '/path3.ts' }
			]

			mocks.storage.update.mockResolvedValue(undefined)
			mocks.storage.get.mockResolvedValue(fragments[0])

			// Act
			await clipboardService.store(fragments[0])
			const retrieved = await clipboardService.retrieve()
			await clipboardService.clear()
			await clipboardService.store(fragments[1])
			await clipboardService.store(fragments[2])

			// Assert
			expect(mocks.storage.update).toHaveBeenCalledTimes(4) // 3 stores + 1 clear
			expect(mocks.storage.get).toHaveBeenCalledTimes(1)
			expect(retrieved).toEqual(fragments[0])
		})
	})
})

