// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type {
	ITreeItem,
	IThemeIcon,
	IThemeColor,
	TreeItemLabel,
} from '@fux/shared'
import {
	TreeItemAdapter,
	ThemeIconAdapter,
	ThemeColorAdapter,
	UriAdapter,
} from '@fux/shared'
import type { Uri } from 'vscode'
import { TreeItemCollapsibleState } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================

import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'

//--------------------------------------------------------------------------------------------------------------<<

const NOTESHUB_DEFAULT_NOTE_ICON = 'dash'
const NOTESHUB_DEFAULT_NOTE_COLOR_ID = 'notesHub.foreground'

const priorityColorIds: string[] = [
	'notesHub.priority0',
	'notesHub.priority1',
	'notesHub.priority2',
	'notesHub.priority3',
	'notesHub.priority4',
	'notesHub.priority5',
]

export class NotesHubItem implements INotesHubItem {

	private treeItem: ITreeItem

	public filePath: string
	public isDirectory: boolean
	public parentUri?: Uri
	public frontmatter?: { [key: string]: string }
	public fileName: string

	// TreeItem interface compatibility
	get label(): TreeItemLabel | string {
		const label = this.treeItem.label

		return label || this.fileName
	}

	set label(value: TreeItemLabel | string) { this.treeItem.label = value }

	get resourceUri(): Uri | undefined {
		const iUri = this.treeItem.resourceUri

		return iUri ? (iUri as UriAdapter).uri : undefined
	}

	set resourceUri(value: Uri | undefined) {
		this.treeItem.resourceUri = value ? UriAdapter.create(value) : undefined
	}

	get description(): string | undefined {
		const desc = this.treeItem.description

		return typeof desc === 'string' ? desc : undefined
	}

	set description(value: string | undefined) { this.treeItem.description = value }

	get tooltip(): string | undefined {
		const tooltip = this.treeItem.tooltip

		return typeof tooltip === 'string' ? tooltip : undefined
	}

	set tooltip(value: string | undefined) { this.treeItem.tooltip = value }

	get contextValue(): string | undefined { return this.treeItem.contextValue }
	set contextValue(value: string | undefined) { this.treeItem.contextValue = value }

	get iconPath(): IThemeIcon | undefined { return this.treeItem.iconPath }
	set iconPath(value: IThemeIcon | undefined) { this.treeItem.iconPath = value }

	get collapsibleState(): TreeItemCollapsibleState {
		const state = this.treeItem.collapsibleState

		return state || TreeItemCollapsibleState.None
	}

	set collapsibleState(value: TreeItemCollapsibleState) { this.treeItem.collapsibleState = value }

	constructor(
		fileName: string,
		filePath: string,
		isDirectory: boolean,
		parentUri?: Uri,
		frontmatter?: { [key: string]: string },
	) {
		let displayLabel = fileName
		
		if (frontmatter?.Label && typeof frontmatter.Label === 'string') {
			const trimmedLabel = frontmatter.Label.trim()

			if (trimmedLabel !== '' && trimmedLabel !== 'fn') {
				displayLabel = frontmatter.Label
			}
		}
		
		this.fileName = fileName
		this.filePath = filePath
		this.isDirectory = isDirectory
		this.parentUri = parentUri
		this.frontmatter = frontmatter

		if (!filePath || filePath.trim() === '') {
			console.error('Error creating NotesHubItem: filePath is invalid.', filePath)
			throw new Error('Invalid filePath provided for NotesHubItem')
		}

		const resourceUri = UriAdapter.file(filePath)

		// Ensure we only ever pass a string as the label to VS Code's TreeItem
		const safeLabel: string = typeof displayLabel === 'string' ? displayLabel : String(displayLabel)

		this.treeItem = TreeItemAdapter.create(
			safeLabel,
			isDirectory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
			(resourceUri as UriAdapter).uri,
		)
		
		// Only assign description when it's a proper string; otherwise leave undefined
		this.treeItem.description = typeof (frontmatter as any)?.Desc === 'string' ? (frontmatter as any).Desc : undefined
		this.treeItem.tooltip = this.filePath
		this.treeItem.contextValue = isDirectory ? 'notesHubFolderItem' : 'notesHubFileItem'
		
		if (isDirectory) {
			this.treeItem.iconPath = ThemeIconAdapter.create('folder')
		}
		else {
			this.treeItem.iconPath = this.iconPathFromFrontmatter(frontmatter)
		}
	}

	// Allow provider to unwrap to a raw VS Code TreeItem when needed
	public toVsCode(): any {
		return (this.treeItem as unknown as TreeItemAdapter as any).toVsCode?.() ?? this.treeItem
	}

	private getPriorityThemeColor(
		priority: number,
	): IThemeColor {
		if (Number.isNaN(priority) || priority < 0) {
			priority = 0
		}
		
		const colorId = priorityColorIds[Math.min(priority, priorityColorIds.length - 1)] || priorityColorIds[0]

		return ThemeColorAdapter.create(colorId)
	}

	public iconPathFromFrontmatter(
		frontmatterData?: { [key: string]: string },
	): IThemeIcon {
		if (!frontmatterData) {
			return ThemeIconAdapter.create(NOTESHUB_DEFAULT_NOTE_ICON, ThemeColorAdapter.create(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}

		const iconName = frontmatterData.Codicon || frontmatterData.Icon || NOTESHUB_DEFAULT_NOTE_ICON
		
		if (!iconName || typeof iconName !== 'string') {
			return ThemeIconAdapter.create(NOTESHUB_DEFAULT_NOTE_ICON, ThemeColorAdapter.create(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}
		
		const match = iconName.match(/^([{[($]{0,2})(.*?)([}\])$]?)$/)
		const usedIcon = match?.[2] || iconName
		const priority = Number.parseInt(frontmatterData.Priority, 10)

		return Number.isNaN(priority)
			? ThemeIconAdapter.create(usedIcon)
			: ThemeIconAdapter.create(usedIcon, this.getPriorityThemeColor(priority))
	}

}
