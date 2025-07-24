// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

let notesHubModuleInstance: any

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${constants.extension.name}] Activating...`)

	const container = createDIContainer(context)
	notesHubModuleInstance = container.resolve('notesHubModule')

	try {
		context.subscriptions.push(...notesHubModuleInstance.registerCommands(context))
		await notesHubModuleInstance.initializeModule()
		context.subscriptions.push({ dispose: () => notesHubModuleInstance?.dispose() })
	} catch (error) {
		console.error(`[${constants.extension.name}] Error during NotesHubModule initialization:`, error)
	}

	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {
	console.log(`[${constants.extension.name}] Deactivated.`)
}