import { ProjectButlerService } from '@fux/project-butler-core'
import type { ITerminalProvider } from '@fux/project-butler-core'
import { ConfigurationService } from '@fux/shared'
import type { IFileSystem, IProcess } from '@fux/shared'
import { FileSystemAdapter } from './_adapters/FileSystem.adapter.js'
import { ProcessAdapter } from './_adapters/Process.adapter.js'
import { VSCodeTerminalAdapter } from './_adapters/VSCodeTerminal.adapter.js'
import { VSCodeWindowAdapter } from './_adapters/VSCodeWindow.adapter.js'
import type { ExtensionContext } from 'vscode'

let createContainer: typeof import('awilix').createContainer
let InjectionMode: typeof import('awilix').InjectionMode
let asValue: typeof import('awilix').asValue
let asClass: typeof import('awilix').asClass

export async function createDIContainer(_context: ExtensionContext): Promise<import('awilix').AwilixContainer> {
	if (!createContainer) {
		const awilixModule = await import('awilix') as typeof import('awilix')

		createContainer = awilixModule.createContainer
		InjectionMode = awilixModule.InjectionMode
		asValue = awilixModule.asValue
		asClass = awilixModule.asClass
	}

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
		container.resolve('fileSystem') as IFileSystem,
		container.resolve('process') as IProcess,
	)

	const windowAdapter = new VSCodeWindowAdapter(
		configurationService,
	)

	const projectButlerService = new ProjectButlerService(
		container.resolve('fileSystem') as IFileSystem,
		windowAdapter,
		container.resolve('terminalProvider') as ITerminalProvider,
		container.resolve('process') as IProcess,
	)

	// Register the manually created instances as values
	container.register({
		configurationService: asValue(configurationService),
		window: asValue(windowAdapter),
		projectButlerService: asValue(projectButlerService),
	})

	return container
}
