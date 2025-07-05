import { asClass, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import {
	registerSharedDependencies,
	CommonUtilsService,
	FileUtilsService,
	PathUtilsService,
	ShellUtilsService,
	WorkspaceUtilsService,
} from '@fux/shared-services'
import { ProjectButlerService } from './services/ProjectButler.service.js'
import { ProjectButlerModule } from './ProjectButler.module.js'

export function createDIContainer(context: ExtensionContext): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// 1. Register foundational dependencies (VS Code adapters, node primitives)
	registerSharedDependencies(container, context)

	// 2. Register shared utility services needed by this extension
	container.register({
		commonUtils: asClass(CommonUtilsService).singleton(),
		fileUtils: asClass(FileUtilsService).singleton(),
		pathUtils: asClass(PathUtilsService).singleton(),
		shellUtils: asClass(ShellUtilsService).singleton(),
		workspaceUtils: asClass(WorkspaceUtilsService).singleton(),
	})

	// 3. Register this extension's specific services and module
	container.register({
		projectButlerService: asClass(ProjectButlerService).singleton(),
		projectButlerModule: asClass(ProjectButlerModule).singleton(),
	})

	return container
}
