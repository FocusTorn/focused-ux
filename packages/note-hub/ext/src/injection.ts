import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { NotesHubService, NotesHubActionService, NotesHubConfigService, NotesHubProviderManager } from '@fux/note-hub-core'
import { NotesHubModule } from './NotesHub.module.js'
// import adapters and utility services as needed

export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
  const awilixModule = await import('awilix') as typeof import('awilix')
  const createContainer = awilixModule.createContainer
  const InjectionMode = awilixModule.InjectionMode
  const asValue = awilixModule.asValue
  const asClass = awilixModule.asClass
  
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