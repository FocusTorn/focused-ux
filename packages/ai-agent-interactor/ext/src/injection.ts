import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { AiAgentInteractorService } from '@fux/ai-agent-interactor-core'

export async function createDIContainer(_context: ExtensionContext): Promise<AwilixContainer> {
	const awilixModule = await import('awilix') as typeof import('awilix')
	const createContainer = awilixModule.createContainer
	const InjectionMode = awilixModule.InjectionMode
	const asClass = awilixModule.asClass
	const asValue = awilixModule.asValue
	
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	container.register({
		interactorService: asClass(AiAgentInteractorService).singleton(),
	})

	return container
}