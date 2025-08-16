import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import { ProjectButlerService } from './services/ProjectButler.service.js'
import type { IProjectButlerService } from './_interfaces/IProjectButlerService.js'

/**
 * Core DI container for Project Butler business logic
 * This container manages all core services and their dependencies
 */
export interface ICoreContainer {
	projectButlerService: IProjectButlerService
}

/**
 * Creates and configures the core DI container
 * @param dependencies - External dependencies that will be injected
 * @returns Configured DI container
 */
export function createCoreContainer(dependencies: {
	fileSystem: {
		access: (path: string) => Promise<void>
		copyFile: (src: string, dest: string) => Promise<void>
		stat: (path: string) => Promise<import('vscode').FileStat>
		readFile: (path: string) => Promise<string>
		writeFile: (path: string, data: Uint8Array) => Promise<void>
	}
	window: {
		activeTextEditorUri: string | undefined
		showErrorMessage: (message: string) => void
		showTimedInformationMessage: (message: string, duration?: number) => void
	}
	terminalProvider: {
		activeTerminal: import('vscode').Terminal | undefined
		createTerminal: (name: string) => import('vscode').Terminal
	}
	process: {
		getWorkspaceRoot: () => string | undefined
	}
}) {
	const container = createContainer<ICoreContainer>({
		injectionMode: InjectionMode.CLASSIC,
	})

	// Register core services
	container.register({
		projectButlerService: asClass(ProjectButlerService).inject(() => ({
			fileSystem: dependencies.fileSystem,
			window: dependencies.window,
			terminalProvider: dependencies.terminalProvider,
			process: dependencies.process,
		})),
	})

	return container
}

/**
 * Type for the core container instance
 */
export type CoreContainer = ReturnType<typeof createCoreContainer> 