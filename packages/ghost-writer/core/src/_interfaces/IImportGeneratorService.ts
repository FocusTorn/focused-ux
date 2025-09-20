import type { StoredFragment } from './IClipboardService.js'

export interface IImportGeneratorService {
    generate: (currentFilePath: string, fragment: StoredFragment) => string | undefined
}
