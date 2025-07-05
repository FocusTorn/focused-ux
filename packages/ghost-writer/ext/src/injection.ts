// ESLint & Imports -->>

//= AWILIX ====================================================================================================
import { asClass } from 'awilix'
import type { AwilixContainer } from 'awilix'

//= VSCODE ====================================================================================================
import type { ExtensionContext } from 'vscode'

//= SHARED SERVICES ===========================================================================================
import { createDIContainer as createSharedDIContainer } from '@fux/shared-services'

//= GHOST-WRITER CORE =========================================================================================
import {
	ClipboardService,
	ConsoleLoggerService,
	ImportGeneratorService,
} from '@fux/ghost-writer-core'

//= GHOST-WRITER EXT ==========================================================================================
import { GhostWriterModule } from './GhostWriter.module.js'
import { StorageAdapter } from './services/Storage.adapter.js'

//--------------------------------------------------------------------------------------------------------------<<

export function createDIContainer(context: ExtensionContext): AwilixContainer { //>
	// 1. Create the base container from shared services, which includes all common
	//    services, adapters, and primitives.
	const container = createSharedDIContainer(context)

	// 2. Register Ghost Writer Core Services
	container.register({
		clipboardService: asClass(ClipboardService).singleton(),
		consoleLoggerService: asClass(ConsoleLoggerService).singleton(),
		importGeneratorService: asClass(ImportGeneratorService).singleton(),
	})

	// 3. Register Ghost Writer Extension Adapters & Main Module
	container.register({
		// This adapter implements IStorageService for the core services to use
		storageService: asClass(StorageAdapter).singleton(),
		// The main module that orchestrates the extension's features
		ghostWriterModule: asClass(GhostWriterModule).singleton(),
	})

	return container
} //<
