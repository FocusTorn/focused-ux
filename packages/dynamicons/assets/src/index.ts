// Asset processing package for Dynamicons
// Handles external icon import, optimization, and theme generation

export * from './models/file_icons.model.js'
export * from './models/folder_icons.model.js'

// Asset processing exports
export { AssetProcessingOrchestrator } from '../scripts/asset-orchestrator.js'
export { AssetProcessor } from '../scripts/asset-processor.js'
export { AssetValidator } from '../scripts/asset-validator.js'
export { AssetChangeDetector } from '../scripts/change-detector.js'
export { AssetManifestGenerator } from '../scripts/asset-manifest.js'
