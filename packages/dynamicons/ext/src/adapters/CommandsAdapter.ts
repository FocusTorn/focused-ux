import type { ICommands } from '@fux/dynamicons-core'
import * as vscode from 'vscode'

export class CommandsAdapter implements ICommands {
	registerCommand(command: string, callback: (...args: any[]) => any): any {
		return vscode.commands.registerCommand(command, callback)
	}

	async executeCommand(command: string, ...args: any[]): Promise<any> {
		return vscode.commands.executeCommand(command, ...args)
	}
} 