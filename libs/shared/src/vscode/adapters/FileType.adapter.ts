import * as vscode from 'vscode'
import type { IFileType } from '../../_interfaces/IVSCode.js'

export class FileTypeAdapter implements IFileType {

	get Unknown(): number { return vscode.FileType.Unknown }
	get File(): number { return vscode.FileType.File }
	get Directory(): number { return vscode.FileType.Directory }
	get SymbolicLink(): number { return vscode.FileType.SymbolicLink }

}
