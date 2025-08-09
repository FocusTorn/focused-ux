// Lightweight VSCode test adapter backed by @fux/mockly
// This file is resolved by Vitest via the alias in vitest.config.ts
// so any `import * as vscode from 'vscode'` in code under test will use Mockly.

import { mockly } from '@fux/mockly'

// Core VSCode API shims
export const workspace = mockly.workspace as any
export const window = mockly.window as any
export const commands = mockly.commands as any
export const extensions = mockly.extensions as any
export const env = mockly.env as any

// VSCode types/classes
export const Uri = mockly.Uri as any
export const Position = mockly.Position as any
export const Range = mockly.Range as any
export const Disposable = mockly.Disposable as any
export const EventEmitter = mockly.EventEmitter as any

// VSCode enums/types that some adapters expect
export enum ProgressLocation { Notification = 15 }

// Re-export default for namespace import patterns
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
	ProgressLocation,
}
