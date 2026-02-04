import * as vscode from 'vscode'

export class TreeItemAdapter {
	create(label: string, collapsibleState: vscode.TreeItemCollapsibleState, resourceUri?: vscode.Uri): vscode.TreeItem {
		let item: vscode.TreeItem
		if (resourceUri) {
			item = new vscode.TreeItem(resourceUri, collapsibleState)
			item.label = label
		} else {
			item = new vscode.TreeItem(label, collapsibleState)
		}
		return item
	}
}
