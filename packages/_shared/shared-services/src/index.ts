// ESLint & Imports -->>

// This file is the public API of the shared-services package. It should export all and only the modules,
// services, and types that are intended for consumption by other packages.

//= CONTAINER =================================================================================================
export { registerSharedDependencies } from './container.js'

//= INTERFACES & TYPES ========================================================================================
export * from './interfaces.js'

//= VSCODE ADAPTERS ===========================================================================================
export { CommandsAdapter } from './_vscode_adapters/Commands.adapter.js'
export { EnvAdapter } from './_vscode_adapters/Env.adapter.js'
export { WindowAdapter } from './_vscode_adapters/Window.adapter.js'
export { WorkspaceAdapter } from './_vscode_adapters/Workspace.adapter.js'

//= SERVICE IMPLEMENTATIONS ===================================================================================
// These are the concrete implementations of the services, which are registered with the DI container.
export { CommonUtilsService } from './services/CommonUtils.service.js'
export { FileUtilsService } from './services/FileUtils.service.js'
export { FrontmatterUtilsService } from './services/FrontmatterUtils.service.js'
export { PathUtilsService } from './services/PathUtils.service.js'
export { QuickPickUtilsService } from './services/QuickPickUtils.service.js'
export { ShellUtilsService } from './services/ShellUtils.service.js'
export { TokenizerService } from './services/Tokenizer.service.js'
export { TreeFormatterService } from './services/TreeFormatter.service.js'
export { WorkspaceUtilsService } from './services/WorkspaceUtils.service.js'
