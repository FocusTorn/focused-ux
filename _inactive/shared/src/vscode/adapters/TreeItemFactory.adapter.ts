import * as vscode from 'vscode'
import type { TreeItemFactory } from '../../_interfaces/IVSCode.js'

export class TreeItemFactoryAdapter implements TreeItemFactory {

	create(
		label: string | vscode.TreeItemLabel,
		collapsibleState: vscode.TreeItemCollapsibleState,
		checkboxState?: vscode.TreeItemCheckboxState,
	): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(label, collapsibleState)

		if (checkboxState !== undefined) {
			treeItem.checkboxState = checkboxState
		}
		return treeItem
	}

	createWithIcon(
		label: string,
		iconPath: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
	): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(label, collapsibleState)

		treeItem.iconPath = new vscode.ThemeIcon(iconPath)
		return treeItem
	}

	createWithCommand(
		label: string,
		command: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
	): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(label, collapsibleState)

		treeItem.command = { command, title: label }
		return treeItem
	}

}

export class UriFactory {

	static file(path: string): vscode.Uri {
		return vscode.Uri.file(path)
	}

}
