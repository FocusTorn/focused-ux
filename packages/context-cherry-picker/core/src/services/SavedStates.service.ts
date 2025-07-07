// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter } from 'vscode'
import type { Event, TreeItemLabel } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ISavedStatesService } from '../_interfaces/ISavedStatesService.js'
import type { IStorageService } from '../_interfaces/IStorageService.js'
import { SavedStateItem } from '../models/SavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export class SavedStatesService implements ISavedStatesService { //>

	private _onDidChangeTreeData: EventEmitter<SavedStateItem | undefined | null | void> = new EventEmitter<SavedStateItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<SavedStateItem | undefined | null | void> = this._onDidChangeTreeData.event

	constructor(
		private readonly storageService: IStorageService,
	) {}

	getTreeItem(
		element: SavedStateItem,
	): SavedStateItem {
		return element
	}

	async getChildren(
		element?: SavedStateItem,
	): Promise<SavedStateItem[]> {
		if (element) {
			return []
		}

		const savedStatesData = await this.storageService.loadAllSavedStates()

		return savedStatesData.map((data) => {
			const labelString = typeof data.label === 'string' ? data.label : (data.label as TreeItemLabel)?.label || 'Unnamed State'

			return new SavedStateItem(data.id, labelString, data.timestamp, data.checkedItems)
		})
	}

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

}
