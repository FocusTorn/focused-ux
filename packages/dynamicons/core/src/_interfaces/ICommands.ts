import type { Disposable } from 'vscode'

export interface ICommands {
	registerCommand(command: string, callback: (...args: any[]) => any): any
	executeCommand(command: string, ...args: any[]): Promise<any>
}
