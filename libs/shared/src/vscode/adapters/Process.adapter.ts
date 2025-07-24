import type { IProcess } from '../../_interfaces/IProcess.js'
import { exec } from 'node:child_process'
import * as vscode from 'vscode'

export class ProcessAdapter implements IProcess {

	public exec(
		command: string,
		options: { cwd: string },
		callback: (error: Error | null, stdout: string, stderr: string) => void,
	): void {
		exec(command, options, callback)
	}

	public getWorkspaceRoot(): string | undefined {
		return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
	}

}
