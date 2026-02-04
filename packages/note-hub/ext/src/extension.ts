// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import * as vscode from 'vscode'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { constants } from './_config/constants.js'
import { ExtensionContextAdapter } from './adapters/ExtensionContext.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'
import { CommandsAdapter } from './adapters/Commands.adapter.js'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathUtilsAdapter } from './adapters/PathUtils.adapter.js'
import { CommonUtilsAdapter } from './adapters/CommonUtils.adapter.js'
import { WorkspaceUtilsAdapter } from './adapters/WorkspaceUtils.adapter.js'
import { FrontmatterUtilsAdapter } from './adapters/FrontmatterUtils.adapter.js'
import { UriAdapter } from './adapters/Uri.adapter.js'
import { TreeItemAdapter } from './adapters/TreeItem.adapter.js'
import { ThemeIconAdapter } from './adapters/ThemeIcon.adapter.js'
import { ThemeColorAdapter } from './adapters/ThemeColor.adapter.js'
import { TreeItemCollapsibleStateAdapter } from './adapters/TreeItemCollapsibleState.adapter.js'
import { NotesHubConfigService, NotesHubProviderManager, NotesHubActionService, NotesHubService } from '@fux/note-hub-core'

//--------------------------------------------------------------------------------------------------------------<<

// TOP-LEVEL LOG - This runs when the module is loaded, BEFORE activate()
console.log('[F-UX: Notes Hub] MODULE LOADED - Extension code is running')

let notesHubService: NotesHubService | undefined
let isActivated = false

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Prevent multiple activations
	if (isActivated) {
		console.log(`[${constants.extension.name}] Already activated.`)
		return
	}

	console.log(`[${constants.extension.name}] Activating...`)

	try {
		console.log(`[${constants.extension.name}] Creating adapters...`)
		// Create adapters
		const contextAdapter = new ExtensionContextAdapter(context)
		const windowAdapter = new WindowAdapter()
		const workspaceAdapter = new WorkspaceAdapter(vscode.workspace)
		const commandsAdapter = new CommandsAdapter()
		const fileSystemAdapter = new FileSystemAdapter()
		const pathUtilsAdapter = new PathUtilsAdapter()
		const commonUtilsAdapter = new CommonUtilsAdapter(windowAdapter)
		const workspaceUtilsAdapter = new WorkspaceUtilsAdapter(workspaceAdapter)
		const frontmatterUtilsAdapter = new FrontmatterUtilsAdapter(fileSystemAdapter)
		const uriAdapter = new UriAdapter()
		const treeItemAdapter = new TreeItemAdapter()
		const themeIconAdapter = new ThemeIconAdapter()
		const themeColorAdapter = new ThemeColorAdapter()
		console.log(`[${constants.extension.name}] Adapters created successfully`)

		// Create core services
		console.log(`[${constants.extension.name}] Creating NotesHubConfigService...`)
		const configService = new NotesHubConfigService(
			workspaceAdapter,
			pathUtilsAdapter,
			workspaceUtilsAdapter,
			commonUtilsAdapter,
			commandsAdapter,
			fileSystemAdapter,
			os.homedir,
			path.join,
			path.normalize,
			uriAdapter,
		)
		console.log(`[${constants.extension.name}] NotesHubConfigService created`)

		console.log(`[${constants.extension.name}] Creating NotesHubProviderManager...`)
		const providerManager = new NotesHubProviderManager(
			contextAdapter,
			windowAdapter,
			workspaceAdapter,
			commandsAdapter,
			commonUtilsAdapter,
			frontmatterUtilsAdapter,
			pathUtilsAdapter,
			{ File: 1, Directory: 2, SymbolicLink: 64 },
			treeItemAdapter,
			themeIconAdapter,
			themeColorAdapter,
			uriAdapter,
			TreeItemCollapsibleStateAdapter,
		)
		console.log(`[${constants.extension.name}] NotesHubProviderManager created`)

		console.log(`[${constants.extension.name}] Creating NotesHubActionService...`)
		const actionService = new NotesHubActionService(
			contextAdapter,
			commandsAdapter,
			windowAdapter,
			workspaceAdapter,
			{ machineId: '', sessionId: '', language: '', appName: '', appRoot: '', appHost: '', uiKind: 1, clipboard: { readText: async () => '', writeText: async () => {} } },
			commonUtilsAdapter,
			frontmatterUtilsAdapter,
			pathUtilsAdapter,
			{ get: <T>(key: string, defaultValue?: T): T => defaultValue as T, update: async () => {}, delete: async () => {} },
			providerManager,
			path.join,
			path.dirname,
			path.basename,
			path.parse,
			path.extname,
			fs.access,
			fs.rename,
			{ File: 1, Directory: 2, SymbolicLink: 64 },
			treeItemAdapter,
			themeIconAdapter,
			themeColorAdapter,
			uriAdapter,
			TreeItemCollapsibleStateAdapter,
		)
		console.log(`[${constants.extension.name}] NotesHubActionService created`)

		// Create main service
		console.log(`[${constants.extension.name}] Creating NotesHubService...`)
		notesHubService = new NotesHubService(
			workspaceAdapter,
			windowAdapter,
			commandsAdapter,
			configService,
			actionService,
			providerManager,
		)
		console.log(`[${constants.extension.name}] NotesHubService created`)

		// Initialize and register commands
		console.log(`[${constants.extension.name}] Calling initializeNotesHub()...`)
		await notesHubService.initializeNotesHub()
		console.log(`[${constants.extension.name}] initializeNotesHub() completed`)
		context.subscriptions.push({ dispose: () => notesHubService?.dispose() })
		isActivated = true
	}
	catch (error) {
		console.error(`[${constants.extension.name}] Error during NotesHub initialization:`, error)
		// Log full error details
		if (error instanceof Error) {
			console.error(`[${constants.extension.name}] Error name:`, error.name)
			console.error(`[${constants.extension.name}] Error message:`, error.message)
			console.error(`[${constants.extension.name}] Error stack:`, error.stack)
		}
	}

	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {
	console.log(`[${constants.extension.name}] Deactivated.`)
	isActivated = false
	notesHubService = undefined
}
