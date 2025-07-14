import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { AiAgentInteractorService } from '@fux/ai-agent-interactor-core'

export function createDIContainer(_context: ExtensionContext): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	container.register({
		interactorService: asClass(AiAgentInteractorService).singleton(),
	})

	return container
}