// Main entry point for the dynamicons assets package
export { AssetOrchestrator } from './orchestrators/asset-orchestrator.js'
export type { OrchestrationResult, ScriptResult } from './orchestrators/asset-orchestrator.js'

export { IconProcessor } from './processors/icon-processor.js'
export { ThemeProcessor } from './processors/theme-processor.js'
export { PreviewProcessor } from './processors/preview-processor.js'
export { SyncProcessor } from './processors/sync-processor.js'

export { ErrorHandler, ErrorType, ErrorSeverity } from './utils/error-handler.js'
export type { ErrorInfo } from './utils/error-handler.js'
export { validateModels } from './utils/model-validator.js'
export { TreeFormatter } from './utils/tree-formatter.js'

// Re-export constants for convenience
export { assetConstants } from './_config/asset.constants.js'
