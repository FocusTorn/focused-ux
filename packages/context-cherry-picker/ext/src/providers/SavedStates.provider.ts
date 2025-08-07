import type { TreeDataProvider, Event, TreeItem } from 'vscode'
import { TreeItemFactoryAdapter, EventEmitterAdapter } from '@fux/shared'
import type { ISavedStatesService, SavedStateItem as CoreSavedStateItem } from '@fux/context-cherry-picker-core'
import { ccpConstants } from '@fux/context-cherry-picker-core'

export class SavedStatesViewProvider implements TreeDataProvider<CoreSavedStateItem> {

	private _onDidChangeTreeData: EventEmitterAdapter<CoreSavedStateItem | undefined | null | void>
	readonly onDidChangeTreeData: Event<CoreSavedStateItem | undefined | null | void>
	private treeItemFactory: TreeItemFactoryAdapter

	constructor(private readonly service: ISavedStatesService) {
		this._onDidChangeTreeData = new EventEmitterAdapter<CoreSavedStateItem | undefined | null | void>()
		this.onDidChangeTreeData = this._onDidChangeTreeData.event
		this.treeItemFactory = new TreeItemFactoryAdapter()
		this.service.onDidChangeTreeData(() => this._onDidChangeTreeData.fire(undefined))
	}

	getTreeItem(element: CoreSavedStateItem): TreeItem {
		const item = this.treeItemFactory.createWithIcon(element.label, 'save')

		item.id = element.id
		item.description = `${element.checkedItems.length} items`
		item.tooltip = `Saved on: ${new Date(element.timestamp).toLocaleString()}`
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
