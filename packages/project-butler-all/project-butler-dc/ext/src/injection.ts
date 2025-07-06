import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import {
	ProjectButlerService,
	
} from '@fux/project-butler-dc-core'
import type { IFileSystem, IProcess, ITerminalProvider, IWindow } from '@fux/project-butler-dc-core'
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
		window: asClass(VSCodeWindowAdapter).singleton(),
	})

	// Manually construct the service to ensure dependencies are correctly wired
	const projectButlerService = new ProjectButlerService(
		container.resolve<IFileSystem>('fileSystem'),
		container.resolve<IWindow>('window'),
		container.resolve<ITerminalProvider>('terminalProvider'),
		container.resolve<IProcess>('process'),
	)

	// Register the manually created instance as a value
	container.register({
		projectButlerService: asValue(projectButlerService),
	})

	return container
}
