import * as vscode from 'vscode'
import type { IProgress, IProgressOptions } from '../../_interfaces/IVSCode.js'

export class ProgressAdapter {

	static async withProgress<T>(
		options: IProgressOptions,
		task: (progress: IProgress) => Promise<T>,
	): Promise<T> {
		return await vscode.window.withProgress(options, task)
	}

}
