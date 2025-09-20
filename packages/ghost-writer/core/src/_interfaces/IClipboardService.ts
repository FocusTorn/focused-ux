export interface StoredFragment {
    text: string
    sourceFilePath: string
    timestamp?: string
    metadata?: {
        lineNumber?: number
        includeClassName?: boolean
        includeFunctionName?: boolean
        logStatement?: string
        insertLine?: number
        [key: string]: any
    }
}

export interface IClipboardService {
    store: (fragment: StoredFragment) => Promise<void>
    retrieve: () => Promise<StoredFragment | undefined>
    clear: () => Promise<void>
}
