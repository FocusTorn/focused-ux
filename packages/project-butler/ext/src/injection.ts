import { createContainer, InjectionMode, asValue, asClass } from 'awilix'
import { ProjectButlerService } from '@fux/project-butler-core'
import type { ITerminalProvider } from '@fux/project-butler-core'
import { ConfigurationService, TerminalAdapter, WindowAdapter, ProcessAdapter, WorkspaceAdapter } from '@fux/shared'
import type { IFileSystem } from '@fux/shared'
import { FileSystemAdapter } from './_adapters/FileSystem.adapter.js'

import type { ExtensionContext } from 'vscode'

export async function createDIContainer(_context: ExtensionContext): Promise<import('awilix').AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})
    
	// Register Adapters
	container.register({
		fileSystem: asClass(FileSystemAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
		process: asClass(ProcessAdapter).singleton(),
		terminalProvider: asClass(TerminalAdapter).singleton(),
	})

	// Manually construct services that have dependencies to ensure correct wiring
	const workspaceAdapter = container.resolve('workspace')
	const processAdapter = new ProcessAdapter(workspaceAdapter)
	
	const configurationService = new ConfigurationService(
		container.resolve('fileSystem') as IFileSystem,
		processAdapter,
	)

	const windowAdapter = new WindowAdapter(
		configurationService,
	) as any

	const projectButlerService = new ProjectButlerService(
		container.resolve('fileSystem') as IFileSystem,
		windowAdapter,
		container.resolve('terminalProvider') as ITerminalProvider,
		processAdapter,
	)

	// Register the manually created instances as values
	container.register({
		configurationService: asValue(configurationService),
		window: asValue(windowAdapter),
		process: asValue(processAdapter),
		projectButlerService: asValue(projectButlerService),
	})

	return container
}
