import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock vscode module
vi.mock('vscode', () => ({
	TreeItemCheckboxState: {
		Checked: 1,
		Unchecked: 0,
	},
	EventEmitter: class EventEmitter {

		constructor() {}
		event = { dispose: vi.fn() }
		fire = vi.fn()
		dispose = vi.fn()
	
	},
	Event: class Event {

		constructor() {}
	
	},
	Disposable: class Disposable {

		constructor() {}
		dispose = vi.fn()
	
	},
}))
