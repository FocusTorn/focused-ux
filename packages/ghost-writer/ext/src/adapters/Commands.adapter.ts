import type { commands as vscodeCommands, Disposable, ExtensionContext } from 'vscode'

export class CommandsAdapter {

	constructor(
		private readonly commands: typeof vscodeCommands,
		private readonly context: ExtensionContext,
	) {}

	registerCommand(
		command: string,
		callback: (...args: any[]) => any,
		thisArg?: any,
	): Disposable {
		return this.commands.registerCommand(command, callback, thisArg)
	}

}
