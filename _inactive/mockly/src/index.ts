import { createDIContainer } from './injection.js'
import type { IMocklyService } from './_interfaces/IMocklyService.js'

// Create the DI container
const container = createDIContainer()

// Resolve the mockly service
const mocklyService = container.resolve<IMocklyService>('mocklyService')

// Export the mockly API (simulating the vscode namespace)
export const mockly = {
	// Core VSCode API simulation
	get workspace() { return mocklyService.workspace },
	get window() { return mocklyService.window },
	get commands() { return mocklyService.commands },
	get extensions() { return mocklyService.extensions },
	get env() { return mocklyService.env },

	// VSCode types and classes
	get Uri() { return mocklyService.Uri },
	get Position() { return mocklyService.Position },
	get Range() { return mocklyService.Range },
	get Disposable() { return mocklyService.Disposable },
	get EventEmitter() { return mocklyService.EventEmitter },

	// Node.js utilities
	get node() { return mocklyService.node },

	// Version info
	get version() { return mocklyService.version },
}

// Export the service instance for advanced usage and testing
export { mocklyService }

// Export the container for advanced DI usage
export { container }

// Export types
export type { IMocklyService }

// Export services
export { CoreUtilitiesService } from './services/CoreUtilities.service.js'
export { MockUriFactoryService } from './services/MockUriFactory.service.js'

// Export additional VSCode types and classes
export * from './_vscCore/vscClasses.js'
export * from './_vscCore/vscEnums.js'
export * from './_vscCore/vscInterfaces.js'

// Testing helpers (intentionally optional; used by consumer tests)
export { createMockWindowWithEditor } from './testing/createMockWindowWithEditor.js'
