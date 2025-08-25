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
import { NotesHubConfigService, NotesHubProviderManager, NotesHubActionService, NotesHubService } from '@fux/note-hub-core'

//--------------------------------------------------------------------------------------------------------------<<

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

		// Create core services
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

		const providerManager = new NotesHubProviderManager(
			contextAdapter,
			windowAdapter,
			workspaceAdapter,
			commandsAdapter,
			commonUtilsAdapter,
			frontmatterUtilsAdapter,
			pathUtilsAdapter,
			{ File: 1, Directory: 2, SymbolicLink: 64 },
			{}, // treeItemAdapter
			{}, // themeIconAdapter
			{}, // themeColorAdapter
			uriAdapter,
			{}, // treeItemCollapsibleStateAdapter
		)

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
			{},
			{},
			{},
			uriAdapter,
			{},
		)

		// Create main service
		notesHubService = new NotesHubService(
			workspaceAdapter,
			windowAdapter,
			commandsAdapter,
			configService,
			actionService,
			providerManager,
		)

		// Initialize and register commands
		await notesHubService.initializeNotesHub()
		context.subscriptions.push({ dispose: () => notesHubService?.dispose() })
		isActivated = true
	}
	catch (error) {
		console.error(`[${constants.extension.name}] Error during NotesHub initialization:`, error)
	}

	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {
	console.log(`[${constants.extension.name}] Deactivated.`)
	isActivated = false
	notesHubService = undefined
}
