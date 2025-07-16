import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import { ProjectButlerService } from '@fux/project-butler-core'
import type { IFileSystem, IProcess, ITerminalProvider } from '@fux/project-butler-core'
import { ConfigurationService } from '@fux/utilities'
import { FileSystemAdapter } from './_adapters/FileSystem.adapter.js'
import { ProcessAdapter } from './_adapters/Process.adapter.js'
import { VSCodeTerminalAdapter } from './_adapters/VSCodeTerminal.adapter.js'
import { VSCodeWindowAdapter } from './_adapters/VSCodeWindow.adapter.js'

export function createDIContainer(): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Register Adapters
	container.register({
		fileSystem: asClass(FileSystemAdapter).singleton(),
		process: asClass(ProcessAdapter).singleton(),
		terminalProvider: asClass(VSCodeTerminalAdapter).singleton(),
	})

	// Manually construct services that have dependencies to ensure correct wiring
	const configurationService = new ConfigurationService(
		container.resolve<IFileSystem>('fileSystem'),
		container.resolve<IProcess>('process'),
	)

	const windowAdapter = new VSCodeWindowAdapter(
		configurationService,
	)

	const projectButlerService = new ProjectButlerService(
		container.resolve<IFileSystem>('fileSystem'),
		windowAdapter,
		container.resolve<ITerminalProvider>('terminalProvider'),
		container.resolve<IProcess>('process'),
	)

	// Register the manually created instances as values
	container.register({
		configurationService: asValue(configurationService),
		window: asValue(windowAdapter),
		projectButlerService: asValue(projectButlerService),
	})

	return container
}
