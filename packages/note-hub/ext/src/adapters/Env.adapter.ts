import type { IEnv } from '@fux/shared'
import * as vscode from 'vscode'

export class EnvAdapter implements IEnv {

	public get clipboard() {
		return {
			readText: (): Promise<string> => {
				return Promise.resolve(vscode.env.clipboard.readText())
			},
			writeText: (text: string): Promise<void> => {
				return Promise.resolve(vscode.env.clipboard.writeText(text))
			},
		}
	}

}
