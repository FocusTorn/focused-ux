// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import {
	CommonUtilsService,
	FileUtilsService,
	FrontmatterUtilsService,
	PathUtilsService,
	SharedServicesModule,
	WorkspaceUtilsService,
} from '@fux/shared-services'
import type {
	ICommonUtilsService,
	IFileUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IWorkspaceUtilsService,
} from '@fux/shared-services'
import { NotesHubModule } from './NotesHub.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerNotesHubDependencies(context: ExtensionContext): void { //>
	// 1. Register low-level adapters and primitives.
	SharedServicesModule.registerDependencies(container, context)

	// 2. Register the specific high-level shared services needed by this package.
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.registerSingleton<IFrontmatterUtilsService>('IFrontmatterUtilsService', FrontmatterUtilsService)
	container.registerSingleton<IPathUtilsService>('IPathUtilsService', PathUtilsService)
	container.registerSingleton<IWorkspaceUtilsService>('IWorkspaceUtilsService', WorkspaceUtilsService)

	// 3. Register this extension's own dependencies.
	NotesHubModule.registerDependencies(container)
} //<
