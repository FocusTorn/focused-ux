import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import * as vscode from 'vscode'
import { constants } from '../../src/_config/constants.js'
import { activate } from '../../src/extension.js'

describe('Note Hub Commands (integration, mocked VSCode)', () => {
	let context: any

	beforeEach(async () => {
		// Non-Mockly: ExtensionContext minimal stub; Mockly does not supply it.
		context = { subscriptions: [], globalState: { update: vi.fn(), get: vi.fn() } }
		await activate(context as any)
	})

	it('registers core commands under nh.* and they are executable', async () => {
		const cmds = await vscode.commands.getCommands(false)
		const expected = [
			constants.commands.newProjectFolder,
			constants.commands.newRemoteFolder,
			constants.commands.newGlobalFolder,
			constants.commands.newProjectNote,
			constants.commands.newRemoteNote,
			constants.commands.newGlobalNote,
			constants.commands.newNestedNote,
			constants.commands.newNestedFolder,
			constants.commands.openNote,
			constants.commands.openNotePreview,
			constants.commands.addFrontmatter,
			constants.commands.copyItem,
			constants.commands.cutItem,
			constants.commands.pasteItem,
			constants.commands.renameItem,
		]

		for (const id of expected) {
			expect(cmds.includes(id)).toBe(true)
		}
	})
})
