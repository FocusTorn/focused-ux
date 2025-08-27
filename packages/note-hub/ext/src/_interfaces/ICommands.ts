import type { IDisposable } from './IDisposable.js'

export interface ICommands {
	registerCommand: (command: string, callback: (...args: any[]) => any) => IDisposable
	executeCommand: <T>(command: string, ...args: any[]) => Promise<T | undefined>
}
