import type { IWorkspace, IConfiguration } from '@fux/dynamicons-core'
import * as vscode from 'vscode'

class ConfigurationAdapter implements IConfiguration {
	constructor(private config: vscode.WorkspaceConfiguration) {}

	get<T>(key: string, defaultValue?: T): T | undefined {
		return this.config.get(key, defaultValue)
	}

	async update(key: string, value: any, isGlobal?: boolean): Promise<void> {
		await this.config.update(key, value, isGlobal)
	}
}

export class WorkspaceAdapter implements IWorkspace {
	getConfiguration(section?: string): IConfiguration {
		return new ConfigurationAdapter(vscode.workspace.getConfiguration(section))
	}

	onDidChangeConfiguration(listener: (e: any) => void): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration(listener)
	}
} 