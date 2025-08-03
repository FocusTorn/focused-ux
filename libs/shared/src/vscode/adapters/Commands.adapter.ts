import * as vscode from 'vscode'
import type { ICommands } from '../../_interfaces/IVSCode.js'

export class CommandsAdapter implements ICommands {
	registerCommand(command: string, callback: (...args: any[]) => any) {
		return vscode.commands.registerCommand(command, callback)
	}
} 