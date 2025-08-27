import * as vscode from 'vscode'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IDisposable } from '../_interfaces/IDisposable.js'

export class CommandsAdapter implements ICommands {

	registerCommand(command: string, callback: (...args: any[]) => any): IDisposable {
		return vscode.commands.registerCommand(command, callback)
	}

	async executeCommand<T>(command: string, ...args: any[]): Promise<T | undefined> {
		return vscode.commands.executeCommand(command, ...args)
	}

}
