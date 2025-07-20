// Individual exports for manual tree-shaking
// Interfaces
export type { IStorageService } from './_interfaces/IStorageService.js'
export type { IPathUtilsService, ICommonUtilsService } from './_interfaces/IUtilServices.js'
export type { IClipboardService } from './features/clipboard/_interfaces/IClipboardService.js'
export type { IImportGeneratorService } from './features/import-generator/_interfaces/IImportGeneratorService.js'
export type { IConsoleLoggerService } from './features/console-logger/_interfaces/IConsoleLoggerService.js'

// Services
export { ClipboardService } from './features/clipboard/services/Clipboard.service.js'
export { ImportGeneratorService } from './features/import-generator/services/ImportGenerator.service.js'
export { ConsoleLoggerService } from './features/console-logger/services/ConsoleLogger.service.js'

// Constants
export { ghostWriterConstants } from './_config/constants.js'

// Legacy barrel exports (for backward compatibility)
// export * from './_interfaces/IStorageService.js'
// export * from './_interfaces/IUtilServices.js'
// export * from './features/clipboard/_interfaces/IClipboardService.js'
// export * from './features/import-generator/_interfaces/IImportGeneratorService.js'
// export * from './features/console-logger/_interfaces/IConsoleLoggerService.js'
// export { ClipboardService } from './features/clipboard/services/Clipboard.service.js'
// export { ImportGeneratorService } from './features/import-generator/services/ImportGenerator.service.js'
// export { ConsoleLoggerService } from './features/console-logger/services/ConsoleLogger.service.js'
// export { ghostWriterConstants } from './_config/constants.js'
