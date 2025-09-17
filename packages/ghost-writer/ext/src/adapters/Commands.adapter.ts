import * as vscode from 'vscode'
import type { ICommandsAdapter } from '@fux/ghost-writer-core'

export class CommandsAdapter implements ICommandsAdapter {

	registerCommand(
		command: string,
		callback: (...args: any[]) => any,
		thisArg?: any,
	): vscode.Disposable {
		return vscode.commands.registerCommand(command, callback, thisArg)
	}

}
