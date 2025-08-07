// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { 
	ITreeItem, 
	TreeItemCollapsibleState, 
	IThemeIcon, 
	IThemeColor, 
	IUri, 
	TreeItemLabel 
} from '@fux/shared'
import { 
	TreeItemAdapter, 
	ThemeIconAdapter, 
	ThemeColorAdapter, 
	UriAdapter 
} from '@fux/shared'

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
	public parentUri?: IUri
	public frontmatter?: { [key: string]: string }
	public fileName: string

	// TreeItem interface compatibility
	get label(): TreeItemLabel | string { return this.treeItem.label }
	set label(value: TreeItemLabel | string) { this.treeItem.label = value }

	get resourceUri(): IUri | undefined { return this.treeItem.resourceUri }
	set resourceUri(value: IUri | undefined) { this.treeItem.resourceUri = value }

	get description(): string | undefined { return this.treeItem.description }
	set description(value: string | undefined) { this.treeItem.description = value }

	get tooltip(): string | undefined { return this.treeItem.tooltip }
	set tooltip(value: string | undefined) { this.treeItem.tooltip = value }

	get contextValue(): string | undefined { return this.treeItem.contextValue }
	set contextValue(value: string | undefined) { this.treeItem.contextValue = value }

	get iconPath(): IThemeIcon | undefined { return this.treeItem.iconPath }
	set iconPath(value: IThemeIcon | undefined) { this.treeItem.iconPath = value }

	get collapsibleState(): TreeItemCollapsibleState { return this.treeItem.collapsibleState }
	set collapsibleState(value: TreeItemCollapsibleState) { this.treeItem.collapsibleState = value }

	constructor(
		fileName: string,
		filePath: string,
		isDirectory: boolean,
		parentUri?: IUri,
		frontmatter?: { [key: string]: string },
	) {
		const displayLabel = (
			frontmatter?.Label && (frontmatter.Label.trim() !== '' && frontmatter.Label.trim() !== 'fn')
				? frontmatter.Label
				: fileName
		)
		
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
		this.treeItem = TreeItemAdapter.create(
			displayLabel, 
			isDirectory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
			(resourceUri as UriAdapter).uri
		)
		
		this.treeItem.description = frontmatter?.Desc
		this.treeItem.tooltip = this.filePath
		this.treeItem.contextValue = isDirectory ? 'notesHubFolderItem' : 'notesHubFileItem'
		
		if (isDirectory) {
			this.treeItem.iconPath = ThemeIconAdapter.create('folder')
		}
		else {
			this.treeItem.iconPath = this.iconPathFromFrontmatter(frontmatter)
		}
	}

	private getPriorityThemeColor(
		priority: number,
	): IThemeColor {
		const colorId = priorityColorIds[Math.min(priority, priorityColorIds.length - 1)]
		return ThemeColorAdapter.create(colorId)
	}

	public iconPathFromFrontmatter(
		frontmatterData?: { [key: string]: string },
	): IThemeIcon {
		if (!frontmatterData) {
			return ThemeIconAdapter.create(NOTESHUB_DEFAULT_NOTE_ICON, ThemeColorAdapter.create(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}

		const iconName = frontmatterData.Codicon || frontmatterData.Icon || NOTESHUB_DEFAULT_NOTE_ICON
		const match = iconName.match(/^([{[($]{0,2})(.*?)([}\])$]?)$/)
		const usedIcon = match?.[2] || iconName
		const priority = Number.parseInt(frontmatterData.Priority, 10)

		return Number.isNaN(priority)
			? ThemeIconAdapter.create(usedIcon)
			: ThemeIconAdapter.create(usedIcon, this.getPriorityThemeColor(priority))
	}
}