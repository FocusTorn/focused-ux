import type { TreeDataProvider, Event, Disposable, TreeItem } from 'vscode'
import { TreeItemFactoryAdapter, UriFactory, EventEmitterAdapter } from '@fux/shared'
import type { IFileExplorerService, FileExplorerItem as CoreFileExplorerItem } from '@fux/context-cherry-picker-core'

export class FileExplorerViewProvider implements TreeDataProvider<CoreFileExplorerItem>, Disposable {

	private _onDidChangeTreeData: EventEmitterAdapter<CoreFileExplorerItem | undefined | null | void>
	readonly onDidChangeTreeData: Event<CoreFileExplorerItem | undefined | null | void>
	private serviceListener: Disposable
	private treeItemFactory: TreeItemFactoryAdapter

	constructor(private readonly service: IFileExplorerService) {
		this._onDidChangeTreeData = new EventEmitterAdapter<CoreFileExplorerItem | undefined | null | void>()
		this.onDidChangeTreeData = this._onDidChangeTreeData.event
		this.treeItemFactory = new TreeItemFactoryAdapter()
		this.serviceListener = this.service.onDidChangeTreeData((item) => {
			this._onDidChangeTreeData.fire(item)
		})
	}

	dispose() {
		this.serviceListener.dispose()
		this._onDidChangeTreeData.dispose()
	}

	getTreeItem(element: CoreFileExplorerItem): TreeItem {
		const collapsibleState = element.type === 'directory'
			? this.treeItemFactory.create('', 1).collapsibleState // Collapsed
			: this.treeItemFactory.create('', 0).collapsibleState // None

		const item = this.treeItemFactory.create(element.label, element.collapsibleState ?? collapsibleState)

		item.id = element.uri
		item.resourceUri = UriFactory.file(element.uri)
		item.checkboxState = element.checkboxState
		item.tooltip = element.tooltip
		item.description = element.description
		item.iconPath = element.type === 'directory' ? this.treeItemFactory.createWithIcon('', 'folder').iconPath : this.treeItemFactory.createWithIcon('', 'file').iconPath
		item.contextValue = element.type
		return item
	}

	getChildren(element?: CoreFileExplorerItem): Promise<CoreFileExplorerItem[]> {
		return this.service.getChildren(element)
	}

}
