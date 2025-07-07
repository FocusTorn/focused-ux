// ESLint & Imports -->>

//= MISC ======================================================================================================
import micromatch from 'micromatch'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextFormattingService } from '../_interfaces/IContextFormattingService.js'
import type { FileSystemEntry } from '../_interfaces/ccp.types.js'
import type { ITreeFormatterService, TreeFormatterNode } from '../_interfaces/ITreeFormatterService.js'
import type { IFileUtilsService } from '../_interfaces/IFileUtilsService.js'
import type { IPath } from '../_interfaces/IPath.js'

//--------------------------------------------------------------------------------------------------------------<<

interface InternalTreeNode { //>
	entry: FileSystemEntry
	children: InternalTreeNode[]
} //<

export class ContextFormattingService implements IContextFormattingService {

	constructor(
		private readonly treeFormatter: ITreeFormatterService,
		private readonly fileUtils: IFileUtilsService,
		private readonly path: IPath,
	) {}

	public generateProjectTreeString(
		treeEntriesMap: Map<string, FileSystemEntry>,
		projectRootUri: string,
		projectRootName: string,
		outputFilterAlwaysShow: string[],
		outputFilterAlwaysHide: string[],
		outputFilterShowIfSelected: string[],
		initialCheckedUris: string[],
	): string {
		const entriesForTreeDisplay = Array.from(treeEntriesMap.values()).filter((entry) => {
			const relativePath = entry.relativePath
			const isExplicitlySelected = initialCheckedUris.includes(entry.uri)

			if (micromatch.isMatch(relativePath, outputFilterAlwaysShow))
				return true
			if (micromatch.isMatch(relativePath, outputFilterAlwaysHide))
				return false
			if (micromatch.isMatch(relativePath, outputFilterShowIfSelected))
				return isExplicitlySelected
			return true
		})

		const internalTreeRoot = this._buildInternalTree(entriesForTreeDisplay, projectRootUri, projectRootName)

		if (internalTreeRoot) {
			const formatterTreeRoot = this._transformToFormatterTree(internalTreeRoot)

			return this.treeFormatter.formatTree(formatterTreeRoot)
		}

		if (treeEntriesMap.size > 0 || entriesForTreeDisplay.length > 0) {
			return `${projectRootName}/\n`
		}
		return ''
	}

	private _buildInternalTree(entries: FileSystemEntry[], projectRootUri: string, projectRootName: string): InternalTreeNode | null {
		if (entries.length === 0)
			return null

		const rootEntry: FileSystemEntry = {
			uri: projectRootUri,
			isFile: false,
			name: projectRootName,
			relativePath: '',
		}
		const rootNode: InternalTreeNode = { entry: rootEntry, children: [] }
		const map: { [key: string]: InternalTreeNode } = { '': rootNode }

		const sortedEntries = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))

		for (const entry of sortedEntries) {
			if (entry.relativePath === '') {
				if (entry.uri === projectRootUri) {
					rootNode.entry = entry
				}
				continue
			}

			const parts = entry.relativePath.split('/')
			let currentPath = ''
			let parentNode = rootNode

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i]
				const isLastPart = i === parts.length - 1
				const nodePathKey = currentPath ? `${currentPath}/${part}` : part

				if (!map[nodePathKey]) {
					const nodeEntryForMap = isLastPart
						? entry
						: {
							uri: this.path.join(projectRootUri, nodePathKey),
							isFile: false,
							name: part,
							relativePath: nodePathKey,
						}
					const newNode: InternalTreeNode = { entry: nodeEntryForMap, children: [] }

					map[nodePathKey] = newNode
					parentNode.children.push(newNode)
					parentNode.children.sort((a, b) => {
						if (a.entry.isFile === b.entry.isFile) {
							return a.entry.name.localeCompare(b.entry.name)
						}
						return a.entry.isFile ? 1 : -1
					})
				}
				parentNode = map[nodePathKey]
				currentPath = nodePathKey
			}
		}
		return rootNode
	}

	private _transformToFormatterTree(node: InternalTreeNode): TreeFormatterNode {
		const formatterNode: TreeFormatterNode = {
			label: node.entry.name,
			isDirectory: !node.entry.isFile,
			children: node.children.map(child => this._transformToFormatterTree(child)),
		}

		if (node.entry.isFile && node.entry.size !== undefined) {
			formatterNode.details = `[${this.fileUtils.formatFileSize(node.entry.size)}]`
		}
		return formatterNode
	}

}
