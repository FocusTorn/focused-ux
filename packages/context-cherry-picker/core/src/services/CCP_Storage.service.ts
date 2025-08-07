// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState } from '@fux/shared'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IStorageService } from '../_interfaces/IStorageService.js'
import type { ISavedStateItem } from '../_interfaces/ISavedStateItem.js'
import { constants as localCcpConstants } from '../_config/constants.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IContext } from '../_interfaces/IContext.js'
import type { IPath } from '../_interfaces/IPath.js'

//--------------------------------------------------------------------------------------------------------------<<

interface SavedStateStorageEntry { //>
	label: string
	timestamp: number
	checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>
} //<

interface SavedStatesFileFormat { //>
	[id: string]: SavedStateStorageEntry
} //<

const STORAGE_FILE_NAME = `${localCcpConstants.extension.id}.savedStates.json`

export class StorageService implements IStorageService { //>

	private storageFileUri: string
	private initializationPromise: Promise<void> | null = null

	constructor(
		private readonly context: IContext,
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
	) {
		this.storageFileUri = this.path.join(this.context.globalStorageUri, STORAGE_FILE_NAME)
	}

	private _initializeStorage(): Promise<void> { //>
		if (!this.initializationPromise) {
			this.initializationPromise = (async () => {
				try {
					await this.fileSystem.stat(this.storageFileUri)
				}
				catch (_error: any) {
					try {
						await this.fileSystem.createDirectory(this.context.globalStorageUri)
						await this.fileSystem.writeFile(this.storageFileUri, new TextEncoder().encode(JSON.stringify({}, null, 2)))
						console.log(`[${localCcpConstants.extension.nickName}] Storage file initialized at ${this.storageFileUri}`)
					}
					catch (createError) {
						console.error(`[${localCcpConstants.extension.nickName}] Critical error creating storage file ${this.storageFileUri}:`, createError)
						throw createError
					}
				}
			})()
		}
		return this.initializationPromise
	} //<

	private async readStorage(): Promise<SavedStatesFileFormat> { //>
		await this._initializeStorage()
		try {
			const fileContents = await this.fileSystem.readFile(this.storageFileUri)

			return JSON.parse(fileContents) as SavedStatesFileFormat
		}
		catch (error) {
			console.error(`[${localCcpConstants.extension.nickName}] Error reading storage file ${this.storageFileUri}:`, error)
			return {}
		}
	} //<

	private async writeStorage(data: SavedStatesFileFormat): Promise<void> { //>
		await this._initializeStorage()
		try {
			await this.fileSystem.writeFile(this.storageFileUri, new TextEncoder().encode(JSON.stringify(data, null, 2)))
		}
		catch (error) {
			console.error(`[${localCcpConstants.extension.nickName}] Error writing storage file ${this.storageFileUri}:`, error)
			throw error
		}
	} //<

	async saveState(name: string, checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>): Promise<void> { //>
		const storage = await this.readStorage()
		const id = Date.now().toString()

		storage[id] = {
			label: name,
			timestamp: Date.now(),
			checkedItems,
		}
		await this.writeStorage(storage)
	} //<

	async loadState(id: string): Promise<Array<{ uriString: string, checkboxState: TreeItemCheckboxState }> | undefined> { //>
		const storage = await this.readStorage()

		return storage[id]?.checkedItems
	} //<

	async loadAllSavedStates(): Promise<ISavedStateItem[]> { //>
		const storage = await this.readStorage()

		return Object.entries(storage).map(([id, data]) => ({
			id,
			label: data.label,
			timestamp: data.timestamp,
			checkedItems: data.checkedItems,
		}))
	} //<

	async deleteState(id: string): Promise<void> { //>
		const storage = await this.readStorage()

		if (storage[id]) {
			delete storage[id]
			await this.writeStorage(storage)
		}
	} //<

}
