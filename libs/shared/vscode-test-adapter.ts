// Lightweight VSCode test adapter backed by @fux/mockly
// This file is resolved by Vitest via the alias in vitest.config.ts
// so any `import * as vscode from 'vscode'` in code under test will use Mockly.
// The @fux/mockly import is resolved at runtime by Vitest aliases

import { mockly } from '@fux/mockly'

// Core VSCode API shims
export const workspace = {
	...mockly.workspace,
	createFileSystemWatcher: () => ({
		onDidCreate: mockly.EventEmitter.prototype.on,
		onDidChange: mockly.EventEmitter.prototype.on,
		onDidDelete: mockly.EventEmitter.prototype.on,
		dispose: () => {},
	}),
} as any

export const window = mockly.window as any
export const commands = {
	...mockly.commands,
	executeCommand: (command: string, ...args: any[]) => {
		if (command === 'setContext') {
			return Promise.resolve()
		}
		return mockly.commands.executeCommand(command, ...args)
	},
} as any
export const extensions = mockly.extensions as any
export const env = mockly.env as any

// VSCode types/classes
export const Uri = mockly.Uri as any
export const Position = mockly.Position as any
export const Range = mockly.Range as any
export const Disposable = mockly.Disposable as any
export const EventEmitter = mockly.EventEmitter as any

// VSCode enums/types that some adapters expect
export const TreeItemCollapsibleState = {
	None: 0,
	Collapsed: 1,
	Expanded: 2,
} as const

export const TreeItem = class {

	constructor(
		public label: string,
		public collapsibleState?: typeof TreeItemCollapsibleState[keyof typeof TreeItemCollapsibleState],
	) {}

}

export const RelativePattern = class {

	constructor(public base: any, public pattern: string) {}

}

export const ThemeColor = class {

	constructor(public id: string) {}

}

export const ThemeIcon = class {

	constructor(public id: string, public color?: typeof ThemeColor) {}

}

// File system watcher interface
export interface FileSystemWatcher {
	onDidCreate: any
	onDidChange: any
	onDidDelete: any
	dispose: () => void
}

// Export all as a single object for compatibility
export default {
	workspace,
	window,
	commands,
	extensions,
	env,
	Uri,
	Position,
	Range,
	Disposable,
	EventEmitter,
	TreeItemCollapsibleState,
	TreeItem,
	RelativePattern,
	ThemeColor,
	ThemeIcon,
}
