import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asClass } from 'awilix'
import { MocklyService } from './services/Mockly.service.js'

export function createDIContainer(): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Register the main MocklyService
	container.register({
		mocklyService: asClass(MocklyService).singleton(),
	})

	return container
}
