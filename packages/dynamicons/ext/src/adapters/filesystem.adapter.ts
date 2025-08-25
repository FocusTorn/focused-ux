import type { IFileSystem, IUri } from '@fux/dynamicons-core'

import * as vscode from 'vscode'

export class FileSystemAdapter implements IFileSystem {

	async stat(pathOrUri: string | IUri): Promise<any> {
		const uri = this._toVSCodeUri(pathOrUri)
		const stats = await vscode.workspace.fs.stat(uri)

		return {
			isDirectory: () => stats.type === vscode.FileType.Directory,
			isFile: () => stats.type === vscode.FileType.File,
			size: stats.size,
			ctime: stats.ctime,
			mtime: stats.mtime,
		}
	}

	async readdir(pathOrUri: string | IUri, options?: { withFileTypes?: boolean }): Promise<string[] | any[]> {
		const uri = this._toVSCodeUri(pathOrUri)
		const entries = await vscode.workspace.fs.readDirectory(uri)
		
		if (options?.withFileTypes) {
			return entries.map(([name, type]: [string, vscode.FileType]) => ({
				name,
				isDirectory: () => type === vscode.FileType.Directory,
				isFile: () => type === vscode.FileType.File,
				isSymbolicLink: () => type === vscode.FileType.SymbolicLink,
			}))
		}
		return entries.map(([name]: [string, vscode.FileType]) => name)
	}

	async readFile(pathOrUri: string | IUri, _options?: any): Promise<string | any> {
		const uri = this._toVSCodeUri(pathOrUri)
		const content = await vscode.workspace.fs.readFile(uri)
		
		return new TextDecoder().decode(content)
	}

	async writeFile(pathOrUri: string | IUri, data: string | Uint8Array, _options?: any): Promise<void> {
		const uri = this._toVSCodeUri(pathOrUri)
		const content = typeof data === 'string' ? new TextEncoder().encode(data) : data

		return vscode.workspace.fs.writeFile(uri, content)
	}

	async access(pathOrUri: string | IUri, _mode?: number): Promise<void> {
		const uri = this._toVSCodeUri(pathOrUri)

		await vscode.workspace.fs.stat(uri)
	}

	async mkdir(pathOrUri: string | IUri, _options?: any): Promise<string | undefined> {
		const uri = this._toVSCodeUri(pathOrUri)

		await vscode.workspace.fs.createDirectory(uri)
		return undefined
	}

	async copyFile(src: string | IUri, dest: string | IUri): Promise<void> {
		const srcUri = this._toVSCodeUri(src)
		const destUri = this._toVSCodeUri(dest)

		return vscode.workspace.fs.copy(srcUri, destUri)
	}

	readFileSync(_path: any, _options?: any): string | any {
		throw new Error('readFileSync is not supported in VSCode extensions. Use readFile instead.')
	}

	private _toVSCodeUri(pathOrUri: string | IUri): vscode.Uri {
		if (typeof pathOrUri === 'string') {
			return vscode.Uri.file(pathOrUri)
		}
		// Convert IUri to vscode.Uri
		return vscode.Uri.parse(pathOrUri.toString())
	}

}
