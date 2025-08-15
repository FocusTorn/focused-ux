import { describe, it, expect } from 'vitest'
import { createTestContainer } from './_setup.js'

describe('Test Setup Infrastructure', () => {
	it('should create a test container', () => {
		const container = createTestContainer()

		expect(container).toBeDefined()
	})

	it('should have Mockly services registered', () => {
		const container = createTestContainer()
		
		// Check that Mockly services are available
		expect(container.resolve('iFileSystem')).toBeDefined()
		expect(container.resolve('iWindow')).toBeDefined()
		expect(container.resolve('iWorkspace')).toBeDefined()
		expect(container.resolve('iCommands')).toBeDefined()
		expect(container.resolve('iPathUtils')).toBeDefined()
		expect(container.resolve('iProcess')).toBeDefined()
		expect(container.resolve('iEnv')).toBeDefined()
		expect(container.resolve('iConfigurationService')).toBeDefined()
		expect(container.resolve('iCommonUtils')).toBeDefined()
		
		// Check that shared adapter mocks are available
		expect(container.resolve('treeItemAdapter')).toBeDefined()
		expect(container.resolve('themeIconAdapter')).toBeDefined()
		expect(container.resolve('themeColorAdapter')).toBeDefined()
		expect(container.resolve('uriAdapter')).toBeDefined()
		expect(container.resolve('treeItemCollapsibleStateAdapter')).toBeDefined()
	})

	it('should provide working Mockly services', () => {
		const container = createTestContainer()
		
		const fileSystem = container.resolve('iFileSystem')
		const window = container.resolve('iWindow')
		const workspace = container.resolve('iWorkspace')
		
		// These should be Mockly services with working methods
		expect(typeof fileSystem.access).toBe('function')
		expect(typeof window.showInformationMessage).toBe('function')
		expect(typeof workspace.fs.readFile).toBe('function')
	})
})
