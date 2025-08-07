import * as vscode from 'vscode'
import type { ITerminal, ITerminalProvider } from '../../_interfaces/IVSCode.js'

export class TerminalAdapter implements ITerminalProvider {

	public get activeTerminal(): ITerminal | undefined {
		return vscode.window.activeTerminal
	}

	public createTerminal(name: string): ITerminal {
		return vscode.window.createTerminal(name)
	}

}
