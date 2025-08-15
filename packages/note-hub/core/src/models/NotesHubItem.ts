// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
// Local interface definitions to avoid importing from shared
//= IMPLEMENTATION TYPES ======================================================================================

import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'

export interface ITreeItem {
	label: string | TreeItemLabel | undefined
	resourceUri?: IUri
	description?: string | boolean
	tooltip?: string | any
	contextValue?: string
	iconPath?: IThemeIcon
	collapsibleState: number | undefined
}

export interface IThemeIcon {
	readonly id: string
	readonly color?: IThemeColor
}

export interface IThemeColor {
	readonly id: string
}

export interface IUri {
	path: string
	query: string
	fsPath: string
	toString: () => string
}

export interface TreeItemLabel {
	label: string
	highlights?: [number, number][]
}

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
	public parentUri?: IUri
	public frontmatter?: { [key: string]: string }
	public fileName: string

	// Injected services
	private treeItemAdapter: any
	private themeIconAdapter: any
	private themeColorAdapter: any
	private uriAdapter: any
	private treeItemCollapsibleStateAdapter: any

	// TreeItem interface compatibility
	get label(): TreeItemLabel | string {
		const label = this.treeItem.label

		return label || this.fileName
	}

	set label(value: TreeItemLabel | string) { this.treeItem.label = value }

	get resourceUri(): IUri | undefined {
		const iUri = this.treeItem.resourceUri

		return iUri ? (iUri as any).uri : undefined
	}

	set resourceUri(value: IUri | undefined) {
		this.treeItem.resourceUri = value ? this.uriAdapter.file(value.fsPath) : undefined
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

	get collapsibleState(): number {
		const state = this.treeItem.collapsibleState

		return state ?? this.treeItemCollapsibleStateAdapter.None
	}

	set collapsibleState(value: number) { this.treeItem.collapsibleState = value as any }

	constructor(
		fileName: string,
		filePath: string,
		isDirectory: boolean,
		treeItemAdapter: any,
		themeIconAdapter: any,
		themeColorAdapter: any,
		uriAdapter: any,
		treeItemCollapsibleStateAdapter: any,
		parentUri?: IUri,
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

		// Store injected services
		this.treeItemAdapter = treeItemAdapter
		this.themeIconAdapter = themeIconAdapter
		this.themeColorAdapter = themeColorAdapter
		this.uriAdapter = uriAdapter
		this.treeItemCollapsibleStateAdapter = treeItemCollapsibleStateAdapter

		if (!filePath || filePath.trim() === '') {
			console.error('Error creating NotesHubItem: filePath is invalid.', filePath)
			throw new Error('Invalid filePath provided for NotesHubItem')
		}

		const resourceUri = this.uriAdapter.file(filePath)

		// Ensure we only ever pass a string as the label to VS Code's TreeItem
		const safeLabel: string = typeof displayLabel === 'string' ? displayLabel : String(displayLabel)

		this.treeItem = this.treeItemAdapter.create(
			safeLabel,
			isDirectory ? this.treeItemCollapsibleStateAdapter.Collapsed as any : this.treeItemCollapsibleStateAdapter.None as any,
			(resourceUri as any).uri,
		)
		
		// Only assign description when it's a proper string; otherwise leave undefined
		this.treeItem.description = typeof (frontmatter as any)?.Desc === 'string' ? (frontmatter as any).Desc : undefined
		this.treeItem.tooltip = this.filePath
		this.treeItem.contextValue = isDirectory ? 'notesHubFolderItem' : 'notesHubFileItem'
		
		if (isDirectory) {
			this.treeItem.iconPath = this.themeIconAdapter.create('folder')
		}
		else {
			this.treeItem.iconPath = this.iconPathFromFrontmatter(frontmatter)
		}
	}

	// Allow provider to unwrap to a raw VS Code TreeItem when needed
	public toVsCode(): any {
		return (this.treeItem as unknown as any).toVsCode?.() ?? this.treeItem
	}

	private getPriorityThemeColor(
		priority: number,
	): IThemeColor {
		if (Number.isNaN(priority) || priority < 0) {
			priority = 0
		}
		
		const colorId = priorityColorIds[Math.min(priority, priorityColorIds.length - 1)] || priorityColorIds[0]

		return this.themeColorAdapter.create(colorId)
	}

	public iconPathFromFrontmatter(
		frontmatterData?: { [key: string]: string },
	): IThemeIcon {
		if (!frontmatterData) {
			return this.themeIconAdapter.create(NOTESHUB_DEFAULT_NOTE_ICON, this.themeColorAdapter.create(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}

		const iconName = frontmatterData.Codicon || frontmatterData.Icon || NOTESHUB_DEFAULT_NOTE_ICON
		
		if (!iconName || typeof iconName !== 'string') {
			return this.themeIconAdapter.create(NOTESHUB_DEFAULT_NOTE_ICON, this.themeColorAdapter.create(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}
		
		const match = iconName.match(/^([{[($]{0,2})(.*?)([}\])$]?)$/)
		const usedIcon = match?.[2] || iconName
		const priority = Number.parseInt(frontmatterData.Priority, 10)

		return Number.isNaN(priority)
			? this.themeIconAdapter.create(usedIcon)
			: this.themeIconAdapter.create(usedIcon, this.getPriorityThemeColor(priority))
	}

}
