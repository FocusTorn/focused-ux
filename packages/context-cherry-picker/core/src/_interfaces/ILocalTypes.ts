// Local type definitions to replace @fux/shared dependencies
// Following the Core Package = Complete Business Logic Architecture pattern

export interface IEvent<T = any> {
    (listener: (e: T) => any, thisArgs?: any): any
    (listener: (e: T) => any, thisArgs?: any): any
}

export interface ITreeItemCheckboxState {
    Unchecked: 0
    Checked: 1
}

export interface ITreeItemCollapsibleState {
    None: 0
    Collapsed: 1
    Expanded: 2
}

export interface ITreeItemLabel {
    label: string
    highlights?: [number, number][]
}

export interface IFileSystem {
    readFile(path: string): Promise<string>
    writeFile(path: string, content: string): Promise<void>
    stat(path: string): Promise<{ type: 'file' | 'directory' }>
    readdir(path: string): Promise<DirectoryEntry[]>
    mkdir(path: string): Promise<void>
    rmdir(path: string): Promise<void>
    unlink(path: string): Promise<void>
    access(path: string): Promise<void>
    copyFile(source: string, destination: string): Promise<void>
}

export interface DirectoryEntry {
    name: string
    type: 'file' | 'directory'
    path: string
}

export interface IConfigurationService {
    get<T>(key: string): T | undefined
    get<T>(key: string, defaultValue: T): T
    update(key: string, value: any): Promise<void>
}

export interface IEventEmitter<T = any> {
    event: IEvent<T>
    fire(data: T): void
    dispose(): void
}

// Local EventEmitter implementation
export class EventEmitterAdapter<T = any> implements IEventEmitter<T> {
    private listeners: Array<(data: T) => void> = []

    get event(): IEvent<T> {
        return (listener: (data: T) => void) => {
            this.listeners.push(listener)
            return {
                dispose: () => {
                    const index = this.listeners.indexOf(listener)
                    if (index !== -1) {
                        this.listeners.splice(index, 1)
                    }
                }
            }
        }
    }

    fire(data: T): void {
        this.listeners.forEach(listener => listener(data))
    }

    dispose(): void {
        this.listeners = []
    }
}
