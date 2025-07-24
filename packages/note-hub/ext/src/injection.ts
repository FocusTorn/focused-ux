import { createContainer, asClass, asValue, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { NotesHubService, NotesHubActionService, NotesHubConfigService, NotesHubProviderManager } from '@focused-ux/notes-hub-core'
import { NotesHubModule } from './NotesHub.module.js'
// import adapters and utility services as needed

export function createDIContainer(context: ExtensionContext): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  })

  // Register VSCode context
  container.register({
    extensionContext: asValue(context),
  })

  // Register core services
  container.register({
    notesHubService: asClass(NotesHubService).singleton(),
    notesHubActionService: asClass(NotesHubActionService).singleton(),
    notesHubConfigService: asClass(NotesHubConfigService).singleton(),
    notesHubProviderManager: asClass(NotesHubProviderManager).singleton(),
    notesHubModule: asClass(NotesHubModule).singleton(),
  })

  // Register adapters and utility services here as needed

  return container
}