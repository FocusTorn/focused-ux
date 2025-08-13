import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClipboardService } from '@fux/ghost-writer-core'
import type { IStorageService, StoredFragment } from '@fux/ghost-writer-core'

describe('ClipboardService', () => {
	let clipboardService: ClipboardService
	let mockStorageService: IStorageService

	beforeEach(() => {
		mockStorageService = {
			get: vi.fn(),
			update: vi.fn(),
			keys: vi.fn(() => []),
		}

		clipboardService = new ClipboardService(mockStorageService)
	})

	describe('store', () => {
		it('should store a fragment successfully', async () => {
			const fragment: StoredFragment = {
				text: 'test import statement',
				sourceFilePath: '/test/file.ts',
			}

			await clipboardService.store(fragment)

			expect(mockStorageService.update).toHaveBeenCalledWith(
				'fux-ghost-writer.clipboard',
				fragment,
			)
		})

		it('should handle storage errors', async () => {
			const fragment: StoredFragment = {
				text: 'test import statement',
				sourceFilePath: '/test/file.ts',
			}

			const error = new Error('Storage error')

			mockStorageService.update = vi.fn().mockRejectedValue(error)

			await expect(clipboardService.store(fragment)).rejects.toThrow('Storage error')
		})
	})

	describe('retrieve', () => {
		it('should retrieve a stored fragment', async () => {
			const fragment: StoredFragment = {
				text: 'test import statement',
				sourceFilePath: '/test/file.ts',
			}

			mockStorageService.get = vi.fn().mockResolvedValue(fragment)

			const result = await clipboardService.retrieve()

			expect(result).toEqual(fragment)
			expect(mockStorageService.get).toHaveBeenCalledWith('fux-ghost-writer.clipboard')
		})

		it('should return undefined when no fragment is stored', async () => {
			mockStorageService.get = vi.fn().mockResolvedValue(undefined)

			const result = await clipboardService.retrieve()

			expect(result).toBeUndefined()
		})

		it('should handle retrieval errors', async () => {
			const error = new Error('Retrieval error')

			mockStorageService.get = vi.fn().mockRejectedValue(error)

			await expect(clipboardService.retrieve()).rejects.toThrow('Retrieval error')
		})
	})

	describe('clear', () => {
		it('should clear stored fragment', async () => {
			await clipboardService.clear()

			expect(mockStorageService.update).toHaveBeenCalledWith(
				'fux-ghost-writer.clipboard',
				undefined,
			)
		})

		it('should handle clear errors', async () => {
			const error = new Error('Clear error')

			mockStorageService.update = vi.fn().mockRejectedValue(error)

			await expect(clipboardService.clear()).rejects.toThrow('Clear error')
		})
	})

	describe('integration', () => {
		it('should store and retrieve fragment correctly', async () => {
			const fragment: StoredFragment = {
				text: 'import { Component } from "react"',
				sourceFilePath: '/test/component.tsx',
			}

			// Store fragment
			await clipboardService.store(fragment)
			expect(mockStorageService.update).toHaveBeenCalledWith(
				'fux-ghost-writer.clipboard',
				fragment,
			)

			// Retrieve fragment
			mockStorageService.get = vi.fn().mockResolvedValue(fragment)

			const retrieved = await clipboardService.retrieve()

			expect(retrieved).toEqual(fragment)

			// Clear fragment
			await clipboardService.clear()
			expect(mockStorageService.update).toHaveBeenCalledWith(
				'fux-ghost-writer.clipboard',
				undefined,
			)
		})
	})
})
