// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= NODE JS ===================================================================================================
import type {
	access as fspAccessType,
	copyFile as fspCopyFileType,
	readFile as fspReadFileType,
	writeFile as fspWriteFileType,
	mkdir as fspMkdirType,
} from 'node:fs/promises'
import type {
	PathLike,
	MakeDirectoryOptions,
	WriteFileOptions,
	readFileSync as nodeFsReadFileSyncType,
} from 'node:fs'

//= MISC ======================================================================================================
import stripJsonComments from 'strip-json-comments'

//= IMPLEMENTATION TYPES ======================================================================================
import type {
	IFileUtilsService,
	ICommonUtilsService,
	IPathUtilsService,
	IWindow,
} from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class FileUtilsService implements IFileUtilsService {

	private readonly _iFspAccess: typeof fspAccessType
	private readonly _iFspCopyFile: typeof fspCopyFileType
	private readonly _iFspWriteFile: typeof fspWriteFileType
	private readonly _iFspMkdir: typeof fspMkdirType

	constructor(
		private readonly iWindow: IWindow,
		private readonly commonUtils: ICommonUtilsService,
		private readonly pathUtils: IPathUtilsService,
		iFspAccess: typeof fspAccessType,
		iFspCopyFile: typeof fspCopyFileType,
		private readonly iFsReadFileSync: typeof nodeFsReadFileSyncType,
		private readonly iFspReadFile: typeof fspReadFileType,
		iFspWriteFile: typeof fspWriteFileType,
		iFspMkdir: typeof fspMkdirType,
	) {
		this._iFspAccess = iFspAccess
		this._iFspCopyFile = iFspCopyFile
		this._iFspWriteFile = iFspWriteFile
		this._iFspMkdir = iFspMkdir
	}

	public async readFile(
		filePath: string,
		encoding: BufferEncoding = 'utf-8',
	): Promise<string> { //>
		// Use santizePath which normalizes and resolves if necessary
		const absolutePath = this.pathUtils.santizePath(filePath)

		return this.iFspReadFile(absolutePath, { encoding })
	} //<

	public async writeFile(
		filePath: string,
		data: string,
		options?: WriteFileOptions,
	): Promise<void> { //>
		const absolutePath = this.pathUtils.santizePath(filePath)

		return this._iFspWriteFile(absolutePath, data, options)
	} //<

	public async createFileBackup(fileUri: Uri): Promise<void> { //>
		try {
			const sourcePath = fileUri.fsPath
			const baseName = this.pathUtils.iPathBasename(sourcePath)
			const directory = this.pathUtils.iPathDirname(sourcePath)
			let backupNumber = 1
			let backupFileName: string
			let destinationPath: string
			let fileExists = false

			do {
				backupFileName = `${baseName}.bak${backupNumber > 1 ? backupNumber : ''}`
				destinationPath = this.pathUtils.iPathJoin(directory, backupFileName)
				try {
					await this._iFspAccess(destinationPath)
					fileExists = true
					backupNumber++
				}
				catch (error: any) {
					if (error.code === 'ENOENT') {
						fileExists = false
					}
					else {
						throw error
					}
				}
			} while (fileExists)

			await this._iFspCopyFile(sourcePath, destinationPath)
			this.iWindow.showInformationMessage(`Backup created: ${backupFileName}`)
		}
		catch (error) {
			this.commonUtils.errMsg(`Error creating backup for ${fileUri.fsPath}`, error)
		}
	} //<

	public readJsonFileSync<T = any>(
		filePath: string,
		encoding: BufferEncoding = 'utf-8',
	): T | undefined { //>
		try {
			const absolutePath = this.pathUtils.santizePath(filePath)
			const fileContent = this.iFsReadFileSync(absolutePath, encoding)
			const contentWithoutComments = stripJsonComments(fileContent.toString())

			return JSON.parse(contentWithoutComments) as T
		}
		catch (error) {
			this.commonUtils.errMsg(`Error reading or parsing JSON file synchronously: ${filePath}`, error)
			return undefined
		}
	} //<

	public async readJsonFileAsync<T = any>(
		filePath: string,
		encoding: BufferEncoding = 'utf-8',
	): Promise<T | undefined> { //>
		try {
			const absolutePath = this.pathUtils.santizePath(filePath)
			const fileContent = await this.iFspReadFile(absolutePath, { encoding })
			const contentWithoutComments = stripJsonComments(fileContent.toString())

			return JSON.parse(contentWithoutComments) as T
		}
		catch (error) {
			this.commonUtils.errMsg(`Error reading or parsing JSON file asynchronously: ${filePath}`, error)
			return undefined
		}
	} //<

	public formatFileSize(bytes: number): string { //>
		if (bytes < 1024)
			return `${bytes} B`

		const kb = bytes / 1024

		if (kb < 1024)
			return `${kb.toFixed(2)} KB`
		return `${(kb / 1024).toFixed(2)} MB`
	} //<

	public async iFspWriteFile(
		path: PathLike | import('node:fs/promises').FileHandle,
		data: string | Uint8Array,
		options?: WriteFileOptions,
	): Promise<void> { //>
		return this._iFspWriteFile(path, data, options)
	} //<

	public async iFspAccess(path: PathLike, mode?: number): Promise<void> { //>
		return this._iFspAccess(path, mode)
	} //<

	public async iFspMkdir(
		path: PathLike,
		options?: MakeDirectoryOptions,
	): Promise<string | undefined> { //>
		return this._iFspMkdir(path, options)
	} //<

	public async iFspCopyFile(src: string, dest: string): Promise<void> {
		return this._iFspCopyFile(src, dest)
	}

} // <
