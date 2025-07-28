import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asClass } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { AiAgentInteractorService } from '@fux/ai-agent-interactor-core'

export async function createDIContainer(_context: ExtensionContext): Promise<AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	container.register({
		interactorService: asClass(AiAgentInteractorService).singleton(),
	})

	return container
}
