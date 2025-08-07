import * as vscode from 'vscode'
import type { IEnv, IClipboard } from '../../_interfaces/IVSCode.js'

export class EnvAdapter implements IEnv {

	get clipboard(): IClipboard {
		return new ClipboardAdapter()
	}

}

export class ClipboardAdapter implements IClipboard {

	async readText(): Promise<string> {
		return await vscode.env.clipboard.readText()
	}

	async writeText(text: string): Promise<void> {
		return await vscode.env.clipboard.writeText(text)
	}

}
