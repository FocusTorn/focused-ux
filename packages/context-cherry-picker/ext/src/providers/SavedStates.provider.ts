import { EventEmitter, TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode'
import type { TreeDataProvider, Event } from 'vscode'
import type { ISavedStatesService, SavedStateItem as CoreSavedStateItem } from '@fux/context-cherry-picker-core'
import { ccpConstants } from '@fux/context-cherry-picker-core'

export class SavedStatesViewProvider implements TreeDataProvider<CoreSavedStateItem> {

	private _onDidChangeTreeData: EventEmitter<CoreSavedStateItem | undefined | null | void> = new EventEmitter()
	readonly onDidChangeTreeData: Event<CoreSavedStateItem | undefined | null | void> = this._onDidChangeTreeData.event

	constructor(private readonly service: ISavedStatesService) {
		this.service.onDidChangeTreeData(() => this._onDidChangeTreeData.fire(undefined))
	}

	getTreeItem(element: CoreSavedStateItem): TreeItem {
		const item = new TreeItem(element.label, TreeItemCollapsibleState.None)

		item.id = element.id
		item.description = `${element.checkedItems.length} items`
		item.tooltip = `Saved on: ${new Date(element.timestamp).toLocaleString()}`
		item.iconPath = new ThemeIcon('save')
		item.contextValue = 'savedStateEntry'
		item.command = {
			command: ccpConstants.commands.contextCherryPicker.loadSavedState,
			title: 'Load State',
			arguments: [element],
		}
		return item
	}

	getChildren(element?: CoreSavedStateItem): Promise<CoreSavedStateItem[]> {
		return this.service.getChildren(element)
	}

}
