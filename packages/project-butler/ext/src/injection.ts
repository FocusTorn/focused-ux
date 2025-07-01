import { container } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import {
	SharedServicesModule,
	CommonUtilsService,
	ShellUtilsService,
	PathUtilsService,
	FileUtilsService,
	WorkspaceUtilsService,
} from '@fux/shared-services'
import type {
	ICommonUtilsService,
	IShellUtilsService,
	IPathUtilsService,
	IFileUtilsService,
	IWorkspaceUtilsService,
} from '@fux/shared-services'
import { ProjectButlerService } from '@fux/project-butler-core'
import type { IProjectButlerService } from '@fux/project-butler-core'
import { ProjectButlerModule } from './ProjectButler.module.js'

export function registerDependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)
	container.registerSingleton<IPathUtilsService>('IPathUtilsService', PathUtilsService)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IShellUtilsService>('IShellUtilsService', ShellUtilsService)
	container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.registerSingleton<IWorkspaceUtilsService>('IWorkspaceUtilsService', WorkspaceUtilsService)
	container.registerSingleton<IProjectButlerService>('IProjectButlerService', ProjectButlerService)
	container.registerSingleton(ProjectButlerModule)
}