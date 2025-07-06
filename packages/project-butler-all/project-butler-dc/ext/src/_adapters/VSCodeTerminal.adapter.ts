import type { ITerminal, ITerminalProvider } from '@fux/project-butler-dc-core'
import * as vscode from 'vscode'

export class VSCodeTerminalAdapter implements ITerminalProvider {
	public get activeTerminal(): ITerminal | undefined {
		return vscode.window.activeTerminal
	}

	public createTerminal(name: string): ITerminal {
		return vscode.window.createTerminal(name)
	}
}