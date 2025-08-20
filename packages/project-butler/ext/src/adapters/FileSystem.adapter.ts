import * as vscode from 'vscode'
import { Buffer } from 'node:buffer'

export interface IFileSystemAdapter {
	readFile(path: string): Promise<string>
	writeFile(path: string, content: string): Promise<void>
	stat(path: string): Promise<{ type: 'file' | 'directory' }>
	copyFile(source: string, destination: string): Promise<void>
}

export class FileSystemAdapter implements IFileSystemAdapter {
	async readFile(path: string): Promise<string> {
		const uri = vscode.Uri.file(path)
		const bytes = await vscode.workspace.fs.readFile(uri)
		return Buffer.from(bytes).toString()
	}

	async writeFile(path: string, content: string): Promise<void> {
		const uri = vscode.Uri.file(path)
		const bytes = Buffer.from(content)
		await vscode.workspace.fs.writeFile(uri, bytes)
	}

	async stat(path: string): Promise<{ type: 'file' | 'directory' }> {
		const uri = vscode.Uri.file(path)
		const stats = await vscode.workspace.fs.stat(uri)
		return {
			type: stats.type === vscode.FileType.Directory ? 'directory' : 'file'
		}
	}

	async copyFile(source: string, destination: string): Promise<void> {
		const sourceUri = vscode.Uri.file(source)
		const destUri = vscode.Uri.file(destination)
		await vscode.workspace.fs.copy(sourceUri, destUri)
	}
} 