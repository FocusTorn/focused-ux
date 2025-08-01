import type { ICommands } from '@fux/shared'
import * as vscode from 'vscode'

export class CommandsAdapter implements ICommands {
	public executeCommand(command: string, ...args: any[]): Thenable<any> {
		return vscode.commands.executeCommand(command, ...args)
	}
}