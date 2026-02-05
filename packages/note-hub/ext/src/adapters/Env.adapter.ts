import * as vscode from 'vscode'
import type { IEnv } from '@fux/note-hub-core'

export class EnvAdapter implements IEnv {

	get machineId(): string { return vscode.env.machineId }
	get sessionId(): string { return vscode.env.sessionId }
	get language(): string { return vscode.env.language }
	get appName(): string { return vscode.env.appName }
	get appRoot(): string { return vscode.env.appRoot }
	get appHost(): string { return vscode.env.appHost }
	get uiKind(): number { return vscode.env.uiKind }

	get clipboard() {
		return {
			readText: async () => vscode.env.clipboard.readText(),
			writeText: async (value: string) => vscode.env.clipboard.writeText(value),
		}
	}

}
