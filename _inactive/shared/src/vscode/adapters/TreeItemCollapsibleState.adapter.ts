import * as vscode from 'vscode'

export class TreeItemCollapsibleStateAdapter {

	get None(): number { return vscode.TreeItemCollapsibleState.None }
	get Collapsed(): number { return vscode.TreeItemCollapsibleState.Collapsed }
	get Expanded(): number { return vscode.TreeItemCollapsibleState.Expanded }

}
