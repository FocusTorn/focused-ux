export interface IFileSystemAdapter {
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, content: string) => Promise<void>
    stat: (path: string) => Promise<{ type: 'file' | 'directory' }>
    copyFile: (source: string, destination: string) => Promise<void>
}
