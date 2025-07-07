import { EventEmitter, TreeItem, TreeItemCollapsibleState, ThemeIcon, Uri } from 'vscode'
import type { TreeDataProvider, Event, Disposable } from 'vscode'
import type { IFileExplorerService, FileExplorerItem as CoreFileExplorerItem } from '@fux/context-cherry-picker-core'

export class FileExplorerViewProvider implements TreeDataProvider<CoreFileExplorerItem>, Disposable {

	private _onDidChangeTreeData: EventEmitter<CoreFileExplorerItem | undefined | null | void> = new EventEmitter()
	readonly onDidChangeTreeData: Event<CoreFileExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event
	private serviceListener: Disposable

	constructor(private readonly service: IFileExplorerService) {
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
			? TreeItemCollapsibleState.Collapsed
			: TreeItemCollapsibleState.None

		const item = new TreeItem(element.label, element.collapsibleState ?? collapsibleState)

		item.id = element.uri
		item.resourceUri = Uri.file(element.uri)
		item.checkboxState = element.checkboxState
		item.tooltip = element.tooltip
		item.description = element.description
		item.iconPath = element.type === 'directory' ? new ThemeIcon('folder') : new ThemeIcon('file')
		item.contextValue = element.type
		return item
	}

	getChildren(element?: CoreFileExplorerItem): Promise<CoreFileExplorerItem[]> {
		return this.service.getChildren(element)
	}

}
