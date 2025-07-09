import type { Disposable } from 'vscode'
import { commands as VsCodeCommands } from 'vscode'
import type { ICommands } from '@fux/dynamicons-core'

export class CommandsAdapter implements ICommands {

	registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
		return VsCodeCommands.registerCommand(command, callback, thisArg)
	}

	executeCommand<T = unknown>(command: string, ...rest: any[]): Thenable<T | undefined> {
		return VsCodeCommands.executeCommand<T>(command, ...rest)
	}

	getCommands(filterInternal?: boolean): Thenable<string[]> {
		return VsCodeCommands.getCommands(filterInternal)
	}

}
