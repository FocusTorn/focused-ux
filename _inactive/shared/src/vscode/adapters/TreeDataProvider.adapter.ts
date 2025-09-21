import * as vscode from 'vscode'
import type { TreeDataProvider, Event, Disposable } from 'vscode'

export interface ITreeDataProviderAdapter<T> {
	onDidChangeTreeData: Event<T | undefined | null | void>
	getTreeItem: (element: T) => vscode.TreeItem
	getChildren: (element?: T) => Promise<T[]>
	dispose: () => void
}

export class TreeDataProviderAdapter<T> implements TreeDataProvider<T>, Disposable {

	private _onDidChangeTreeData: vscode.EventEmitter<T | undefined | null | void> = new vscode.EventEmitter()
	readonly onDidChangeTreeData: Event<T | undefined | null | void> = this._onDidChangeTreeData.event
	private serviceListener: Disposable

	constructor(
		private readonly service: {
			onDidChangeTreeData: (listener: (item: T | undefined | null | void) => void) => Disposable
			getChildren: (element?: T) => Promise<T[]>
		},
		private readonly treeItemFactory: (element: T) => vscode.TreeItem,
	) {
		this.serviceListener = this.service.onDidChangeTreeData((item) => {
			this._onDidChangeTreeData.fire(item)
		})
	}

	dispose() {
		this.serviceListener.dispose()
		this._onDidChangeTreeData.dispose()
	}

	getTreeItem(element: T): vscode.TreeItem {
		return this.treeItemFactory(element)
	}

	getChildren(element?: T): Promise<T[]> {
		return this.service.getChildren(element)
	}

}
