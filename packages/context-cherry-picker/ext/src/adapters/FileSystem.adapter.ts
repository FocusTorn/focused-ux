import type { IFileSystem, FileStat, DirectoryEntry } from '@fux/context-cherry-picker-core/'
import * as vscode from 'vscode'
import { Uri } from 'vscode'

function fromVSCodeFileType(type: vscode.FileType): 'file' | 'directory' | 'unknown' {
	if (type & vscode.FileType.File)
		return 'file'
	if (type & vscode.FileType.Directory)
		return 'directory'
	return 'unknown'
}

export class FileSystemAdapter implements IFileSystem {

	async stat(uri: string): Promise<FileStat> {
		const statResult = await vscode.workspace.fs.stat(Uri.file(uri))

		return {
			type: fromVSCodeFileType(statResult.type),
			size: statResult.size,
		}
	}

	async readDirectory(uri: string): Promise<DirectoryEntry[]> {
		const entries = await vscode.workspace.fs.readDirectory(Uri.file(uri))

		return entries.reduce<DirectoryEntry[]>((acc, [name, type]) => {
			const entryType = fromVSCodeFileType(type)

			if (entryType !== 'unknown') {
				acc.push({ name, type: entryType })
			}
			return acc
		}, [])
	}

	readFile(uri: string): Promise<Uint8Array> {
		return Promise.resolve(vscode.workspace.fs.readFile(Uri.file(uri)))
	}

	writeFile(uri: string, content: Uint8Array): Promise<void> {
		return Promise.resolve(vscode.workspace.fs.writeFile(Uri.file(uri), content))
	}

	createDirectory(uri: string): Promise<void> {
		return Promise.resolve(vscode.workspace.fs.createDirectory(Uri.file(uri)))
	}

}
