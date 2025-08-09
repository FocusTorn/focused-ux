import * as vscode from 'vscode'
import type { ITreeItem, IThemeIcon, IThemeColor, IUri } from '../../_interfaces/IVSCode.js'
import { UriAdapter } from './Uri.adapter.js'

export class TreeItemAdapter implements ITreeItem {

	constructor(private treeItem: vscode.TreeItem) {}

	get label(): string | vscode.TreeItemLabel | undefined { return this.treeItem.label }
	set label(value: string | vscode.TreeItemLabel | undefined) { this.treeItem.label = value }

	get resourceUri(): IUri | undefined {
		return this.treeItem.resourceUri ? new UriAdapter(this.treeItem.resourceUri) : undefined
	}

	set resourceUri(value: IUri | undefined) {
		this.treeItem.resourceUri = value ? (value as UriAdapter).uri : undefined
	}

	get description(): string | boolean | undefined { return this.treeItem.description }
	set description(value: string | boolean | undefined) { this.treeItem.description = value }

	get tooltip(): string | vscode.MarkdownString | undefined { return this.treeItem.tooltip }
	set tooltip(value: string | vscode.MarkdownString | undefined) { this.treeItem.tooltip = value }

	get contextValue(): string | undefined { return this.treeItem.contextValue }
	set contextValue(value: string | undefined) { this.treeItem.contextValue = value }

	get iconPath(): IThemeIcon | undefined {
		return this.treeItem.iconPath ? new ThemeIconAdapter(this.treeItem.iconPath as vscode.ThemeIcon) : undefined
	}

	set iconPath(value: IThemeIcon | undefined) {
		this.treeItem.iconPath = value ? (value as ThemeIconAdapter).themeIcon : undefined
	}

	get collapsibleState(): vscode.TreeItemCollapsibleState | undefined { return this.treeItem.collapsibleState }
	set collapsibleState(value: vscode.TreeItemCollapsibleState | undefined) { this.treeItem.collapsibleState = value }

	static create(
		label: string | vscode.TreeItemLabel,
		collapsibleState: vscode.TreeItemCollapsibleState,
		resourceUri?: vscode.Uri,
	): ITreeItem {
		const treeItem = new vscode.TreeItem(label, collapsibleState)

		if (resourceUri) {
			treeItem.resourceUri = resourceUri
		}
		return new TreeItemAdapter(treeItem)
	}

	// Expose the underlying VS Code TreeItem for providers that must return a real TreeItem
	public toVsCode(): vscode.TreeItem {
		return this.treeItem
	}

}

export class ThemeIconAdapter implements IThemeIcon {

	constructor(public readonly themeIcon: vscode.ThemeIcon) {}

	get id(): string { return this.themeIcon.id }
	get color(): IThemeColor | undefined {
		return this.themeIcon.color ? new ThemeColorAdapter(this.themeIcon.color) : undefined
	}

	static create(id: string, color?: vscode.ThemeColor): IThemeIcon {
		const themeIcon = new vscode.ThemeIcon(id, color)

		return new ThemeIconAdapter(themeIcon)
	}

}

export class ThemeColorAdapter implements IThemeColor {

	constructor(public readonly themeColor: vscode.ThemeColor) {}

	get id(): string { return this.themeColor.id }

	static create(id: string): IThemeColor {
		const themeColor = new vscode.ThemeColor(id)

		return new ThemeColorAdapter(themeColor)
	}

}
