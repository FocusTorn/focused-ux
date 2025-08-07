import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asValue, asClass, asFunction } from 'awilix'
import type { ExtensionContext } from 'vscode'
import * as vscode from 'vscode'
import type { ICommands, IContext, IFileSystem as ISharedFileSystem, IPath as ISharedPath, IQuickPick, IWindow, IWorkspace, IUri } from '@fux/shared'
import type { ICommonUtils, IFileSystem, IPath, IIconActionsService, IIconThemeGeneratorService } from '@fux/dynamicons-core'

// Core Services & Interfaces
import {
	IconActionsService,
	IconThemeGeneratorService,
} from '@fux/dynamicons-core'

// Shared Adapters
import {
	CommandsAdapter,
	ContextAdapter,
	FileSystemAdapter as SharedFileSystemAdapter,
	PathAdapter as SharedPathAdapter,
	QuickPickAdapter,
	WindowAdapter,
	WorkspaceAdapter,
	UriAdapter,
} from '@fux/shared'

// Local adapters for core package interfaces
class DynamiconsFileSystemAdapter implements IFileSystem {

	constructor(private readonly sharedFileSystem: ISharedFileSystem, private readonly workspace: IWorkspace, private readonly uriAdapter: typeof UriAdapter) {}

	private _toVSCodeUri(pathOrUri: string | IUri): vscode.Uri {
		if (typeof pathOrUri === 'string') {
			if (!pathOrUri.trim()) {
				throw new Error(`Invalid empty string path provided.`)
			}
			return vscode.Uri.file(pathOrUri)
		}
		else if (pathOrUri && 'fsPath' in pathOrUri) {
			return (pathOrUri as UriAdapter).uri
		}
		throw new Error(`Invalid path/URI type provided: ${typeof pathOrUri}. Expected string or IUri.`)
	}

	public async stat(pathOrUri: string | IUri): Promise<any> {
		const uri = this._toVSCodeUri(pathOrUri)
		const stats = await this.workspace.fs.stat(uri)

		return {
			isDirectory: () => stats.type === vscode.FileType.Directory,
			isFile: () => stats.type === vscode.FileType.File,
			size: stats.size,
			ctime: stats.ctime,
			mtime: stats.mtime,
		}
	}

	public async readdir(pathOrUri: string | IUri, _options?: { withFileTypes?: boolean }): Promise<string[] | any[]> {
		const uri = this._toVSCodeUri(pathOrUri)
		const entries = await this.workspace.fs.readDirectory(uri)
		
		if (_options?.withFileTypes) {
			return entries.map(([name, type]: [string, vscode.FileType]) => ({
				name,
				isDirectory: () => type === vscode.FileType.Directory,
				isFile: () => type === vscode.FileType.File,
				isSymbolicLink: () => type === vscode.FileType.SymbolicLink,
			}))
		}
		return entries.map(([name]: [string, vscode.FileType]) => name)
	}

	public async readFile(pathOrUri: string | IUri, _options?: any): Promise<string | any> {
		try {
			const uri = this._toVSCodeUri(pathOrUri)
			const content = await this.workspace.fs.readFile(uri)
			
			return new TextDecoder().decode(content)
		}
		catch (error) {
			if (typeof pathOrUri === 'string') {
				try {
					const content = await this.sharedFileSystem.readFile(pathOrUri)

					return content
				}
				catch (fallbackError) {
					throw new Error(`Failed to read file: ${pathOrUri}. Original error: ${error}. Fallback error: ${fallbackError}`)
				}
			}
			throw new Error(`Failed to read file: ${(pathOrUri as IUri).fsPath}. Original error: ${error}.`)
		}
	}

	public async writeFile(pathOrUri: string | IUri, data: string | Uint8Array, _options?: any): Promise<void> {
		const uri = this._toVSCodeUri(pathOrUri)
		const content = typeof data === 'string' ? new TextEncoder().encode(data) : data

		return this.workspace.fs.writeFile(uri, content)
	}

	public async access(pathOrUri: string | IUri, _mode?: number): Promise<void> {
		const uri = this._toVSCodeUri(pathOrUri)

		await this.workspace.fs.stat(uri)
	}

	public async mkdir(pathOrUri: string | IUri, _options?: any): Promise<string | undefined> {
		const uri = this._toVSCodeUri(pathOrUri)

		await this.workspace.fs.createDirectory(uri)
		return undefined
	}

	public async copyFile(src: string | IUri, dest: string | IUri): Promise<void> {
		const srcUri = this._toVSCodeUri(src)
		const destUri = this._toVSCodeUri(dest)

		return this.workspace.fs.copy(srcUri, destUri)
	}

	public readFileSync(_path: any, _options?: any): string | any {
		throw new Error('readFileSync is not supported in VSCode extensions. Use readFile instead.')
	}

}

class DynamiconsPathAdapter implements IPath {

	constructor(private readonly sharedPath: ISharedPath) {}

	public basename(p: string, _ext?: string): string {
		return this.sharedPath.basename(p)
	}

	public parse(p: string): any {
		return this.sharedPath.parse(p)
	}

	public join(...paths: string[]): string {
		console.log(`[DynamiconsPathAdapter] join called with paths:`, paths)

		const result = this.sharedPath.join(...paths)

		console.log(`[DynamiconsPathAdapter] join result:`, result)
		return result
	}

	public dirname(p: string): string {
		return this.sharedPath.dirname(p)
	}

	public relative(from: string, to: string): string {
		return this.sharedPath.relative(from, to)
	}

}

// Local adapter for ICommonUtils
class DynamiconsCommonUtilsAdapter implements ICommonUtils {

	constructor(private readonly window: IWindow) {}

	public async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	public errMsg(msg: string, _err?: any): void {
		this.window.showErrorMessage(msg)
	}

}

// Cradle interface for typed resolutions
export interface Cradle {
	// Shared Adapters
	sharedFileSystem: ISharedFileSystem
	sharedPath: ISharedPath
	
	// Core Adapters
	context: IContext
	commands: ICommands
	commonUtils: ICommonUtils
	fileSystem: IFileSystem
	path: IPath
	quickPick: IQuickPick
	window: IWindow
	workspace: IWorkspace
	uriAdapter: typeof UriAdapter

	// Core Services
	iconThemeGeneratorService: IIconThemeGeneratorService
	iconActionsService: IIconActionsService
}

export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// 1. Register Adapters
	container.register({
		context: asValue(new ContextAdapter(context)),
		commands: asClass(CommandsAdapter).singleton(),
		sharedFileSystem: asClass(SharedFileSystemAdapter).singleton(),
		sharedPath: asClass(SharedPathAdapter).singleton(),
		quickPick: asClass(QuickPickAdapter).singleton(),
		window: asClass(WindowAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
		uriAdapter: asValue(UriAdapter),
	})

	// 2. Register adapters that depend on other adapters
	container.register({
		commonUtils: asFunction((cradle: Cradle) => new DynamiconsCommonUtilsAdapter(cradle.window)).singleton(),
		fileSystem: asFunction((cradle: Cradle) => new DynamiconsFileSystemAdapter(cradle.sharedFileSystem, cradle.workspace, cradle.uriAdapter)).singleton(),
		path: asFunction((cradle: Cradle) => new DynamiconsPathAdapter(cradle.sharedPath)).singleton(),
	})

	// 3. Manually construct and register core services using factory functions
	container.register({
		iconThemeGeneratorService: asFunction((cradle: Cradle) =>
			new IconThemeGeneratorService(
				cradle.fileSystem,
				cradle.path,
				cradle.commonUtils,
				cradle.uriAdapter,
			),
		).singleton(),

		iconActionsService: asFunction((cradle: Cradle) =>
			new IconActionsService(
				cradle.context,
				cradle.window,
				cradle.commands,
				cradle.workspace,
				cradle.path,
				cradle.quickPick,
				cradle.commonUtils,
				cradle.fileSystem,
				cradle.iconThemeGeneratorService,
				cradle.uriAdapter,
			),
		).singleton(),
	})

	return container
}
