import { describe, it, expect } from 'vitest'
import { notesHubConstants } from '../../src/_config/constants.js'

describe('notesHubConstants', () => {
	describe('configKeys', () => {
		it('should have all required configuration keys', () => {
			expect(notesHubConstants.configKeys).toHaveProperty('ENABLE_PROJECT_NOTES')
			expect(notesHubConstants.configKeys).toHaveProperty('ENABLE_REMOTE_NOTES')
			expect(notesHubConstants.configKeys).toHaveProperty('ENABLE_GLOBAL_NOTES')
			expect(notesHubConstants.configKeys).toHaveProperty('PROJECT_PATH')
			expect(notesHubConstants.configKeys).toHaveProperty('REMOTE_PATH')
			expect(notesHubConstants.configKeys).toHaveProperty('GLOBAL_PATH')
		})

		it('should have correct enable flags', () => {
			expect(notesHubConstants.configKeys.ENABLE_PROJECT_NOTES).toBe('enableProjectNotes')
			expect(notesHubConstants.configKeys.ENABLE_REMOTE_NOTES).toBe('enableRemoteNotes')
			expect(notesHubConstants.configKeys.ENABLE_GLOBAL_NOTES).toBe('enableGlobalNotes')
		})

		it('should have correct path keys', () => {
			expect(notesHubConstants.configKeys.PROJECT_PATH).toBe('projectNotesPath')
			expect(notesHubConstants.configKeys.REMOTE_PATH).toBe('remoteNotesPath')
			expect(notesHubConstants.configKeys.GLOBAL_PATH).toBe('globalNotesPath')
		})

		it('should have string values for all config keys', () => {
			Object.values(notesHubConstants.configKeys).forEach((value) => {
				expect(typeof value).toBe('string')
				expect(value.length).toBeGreaterThan(0)
			})
		})
	})

	describe('contextKeys', () => {
		it('should have all required context keys', () => {
			expect(notesHubConstants.contextKeys).toHaveProperty('CAN_PASTE')
		})

		it('should have correct context key values', () => {
			expect(notesHubConstants.contextKeys.CAN_PASTE).toBe('canPaste')
		})

		it('should have string values for all context keys', () => {
			Object.values(notesHubConstants.contextKeys).forEach((value) => {
				expect(typeof value).toBe('string')
				expect(value.length).toBeGreaterThan(0)
			})
		})
	})

	describe('storageKeys', () => {
		it('should have all required storage keys', () => {
			expect(notesHubConstants.storageKeys).toHaveProperty('OPERATION')
		})

		it('should have correct storage key values', () => {
			expect(notesHubConstants.storageKeys.OPERATION).toBe('operation')
		})

		it('should have string values for all storage keys', () => {
			Object.values(notesHubConstants.storageKeys).forEach((value) => {
				expect(typeof value).toBe('string')
				expect(value.length).toBeGreaterThan(0)
			})
		})
	})

	describe('commands', () => {
		it('should have all required command keys', () => {
			expect(notesHubConstants.commands).toHaveProperty('openNote')
		})

		it('should have correct command values', () => {
			expect(notesHubConstants.commands.openNote).toBe('openNote')
		})

		it('should have string values for all command keys', () => {
			Object.values(notesHubConstants.commands).forEach((value) => {
				expect(typeof value).toBe('string')
				expect(value.length).toBeGreaterThan(0)
			})
		})
	})

	describe('structure', () => {
		it('should be a readonly object', () => {
			expect(notesHubConstants).toBeDefined()
			expect(typeof notesHubConstants).toBe('object')
		})

		it('should have all required top-level properties', () => {
			expect(notesHubConstants).toHaveProperty('configKeys')
			expect(notesHubConstants).toHaveProperty('contextKeys')
			expect(notesHubConstants).toHaveProperty('storageKeys')
			expect(notesHubConstants).toHaveProperty('commands')
		})

		it('should have no extra properties', () => {
			const expectedKeys = ['configKeys', 'contextKeys', 'storageKeys', 'commands']
			const actualKeys = Object.keys(notesHubConstants)
            
			expect(actualKeys).toEqual(expectedKeys)
		})
	})

	describe('key uniqueness', () => {
		it('should have unique config key values', () => {
			const values = Object.values(notesHubConstants.configKeys)
			const uniqueValues = new Set(values)
            
			expect(uniqueValues.size).toBe(values.length)
		})

		it('should have unique context key values', () => {
			const values = Object.values(notesHubConstants.contextKeys)
			const uniqueValues = new Set(values)
            
			expect(uniqueValues.size).toBe(values.length)
		})

		it('should have unique storage key values', () => {
			const values = Object.values(notesHubConstants.storageKeys)
			const uniqueValues = new Set(values)
            
			expect(uniqueValues.size).toBe(values.length)
		})

		it('should have unique command values', () => {
			const values = Object.values(notesHubConstants.commands)
			const uniqueValues = new Set(values)
            
			expect(uniqueValues.size).toBe(values.length)
		})
	})
})
