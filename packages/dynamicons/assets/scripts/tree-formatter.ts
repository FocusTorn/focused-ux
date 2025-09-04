#!/usr/bin/env node

// ANSI colors for different depths
const ANSI = {
	reset: '\x1B[0m',
	red: '\x1B[31m',
	cyan: '\x1B[36m',
	yellow: '\x1B[33m',
}

// Tree node interface
interface TreeNode {
	name: string
	children?: TreeNode[]
	isLast?: boolean
	depth: number
	color?: string
}

// Validation arrays interface for easy input
interface ValidationArrays {
	orphanedFileIcons?: string[]
	orphanedFolderIcons?: string[]
	orphanedLanguageIcons?: string[]
	duplicateFileIcons?: string[]
	duplicateFolderIcons?: string[]
	duplicateLanguageIcons?: string[]
	orphanedFileAssignments?: string[]
	orphanedFolderAssignments?: string[]
	orphanedLanguageAssignments?: string[]
	invalidLanguageIds?: string[]
}

/**
 * TreeFormatter - Handles all tree formatting logic with proper depth colors and prefix calculations
 */
export class TreeFormatter {
	private depthColors = {
		1: ANSI.cyan,    // cyan for top-level groups (FILE, FOLDER, LANGUAGE)
		2: ANSI.yellow,  // yellow for section headers (MODEL: ..., DIRECTORY: ...)
		3: ANSI.reset,   // reset (no color) for actual items
	}

	/**
	 * Build tree structure from validation arrays
	 */
	buildTreeFromArrays(arrays: ValidationArrays): TreeNode[] {
		const nodes: TreeNode[] = []

		// FILE group
		if (this.hasFileData(arrays)) {
			const fileNode: TreeNode = {
				name: 'FILE',
				depth: 1,
				color: this.depthColors[1],
				children: []
			}

			if (arrays.orphanedFileAssignments?.length) {
				fileNode.children!.push({
					name: 'MODEL: ASSIGNED ICON NOT FOUND',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.orphanedFileAssignments.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			if (arrays.duplicateFileIcons?.length) {
				fileNode.children!.push({
					name: 'MODEL: DUPLICATE ASSIGNMENT',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.duplicateFileIcons.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			if (arrays.orphanedFileIcons?.length) {
				fileNode.children!.push({
					name: 'DIRECTORY: UNASSIGNED ICON',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.orphanedFileIcons.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			nodes.push(fileNode)
		}

		// FOLDER group
		if (this.hasFolderData(arrays)) {
			const folderNode: TreeNode = {
				name: 'FOLDER',
				depth: 1,
				color: this.depthColors[1],
				children: []
			}

			if (arrays.orphanedFolderAssignments?.length) {
				folderNode.children!.push({
					name: 'MODEL: ASSIGNED ICON NOT FOUND',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.orphanedFolderAssignments.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			if (arrays.duplicateFolderIcons?.length) {
				folderNode.children!.push({
					name: 'MODEL: DUPLICATE ASSIGNMENT',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.duplicateFolderIcons.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			if (arrays.orphanedFolderIcons?.length) {
				folderNode.children!.push({
					name: 'DIRECTORY: UNASSIGNED ICON',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.orphanedFolderIcons.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			nodes.push(folderNode)
		}

		// LANGUAGE group
		if (this.hasLanguageData(arrays)) {
			const languageNode: TreeNode = {
				name: 'LANGUAGE',
				depth: 1,
				color: this.depthColors[1],
				children: []
			}

			if (arrays.orphanedLanguageAssignments?.length) {
				languageNode.children!.push({
					name: 'MODEL: ASSIGNED ICON NOT FOUND',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.orphanedLanguageAssignments.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

			if (arrays.duplicateLanguageIcons?.length) {
				languageNode.children!.push({
					name: 'MODEL: DUPLICATE ASSIGNMENT ID',
					depth: 2,
					color: this.depthColors[2],
					children: arrays.duplicateLanguageIcons.map(name => ({
						name,
						depth: 3,
						color: this.depthColors[3]
					}))
				})
			}

					// Note: MODEL: INVALID LANGUAGE ID section removed as requested

			nodes.push(languageNode)
		}

		// Mark last children
		nodes.forEach(node => this.markLastChildren(node))

		return nodes
	}

	/**
	 * Output tree directly to console
	 */
	outputTree(data: TreeNode): void {
		this.outputNode(data, [])
	}

	/**
	 * Format tree as string
	 */
	formatTree(data: TreeNode): string {
		const lines: string[] = []
		this.collectNodeLines(data, [], lines)
		return lines.join('\n')
	}

	/**
	 * Helper methods
	 */
	private hasFileData(arrays: ValidationArrays): boolean {
		return !!(arrays.orphanedFileIcons?.length || arrays.duplicateFileIcons?.length || arrays.orphanedFileAssignments?.length)
	}

	private hasFolderData(arrays: ValidationArrays): boolean {
		return !!(arrays.orphanedFolderIcons?.length || arrays.duplicateFolderIcons?.length || arrays.orphanedFolderAssignments?.length)
	}

	private hasLanguageData(arrays: ValidationArrays): boolean {
		return !!(arrays.orphanedLanguageIcons?.length || arrays.duplicateLanguageIcons?.length || arrays.orphanedLanguageAssignments?.length || arrays.invalidLanguageIds?.length)
	}

	private markLastChildren(node: TreeNode): void {
		if (!node.children?.length) return

		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i]
			child.isLast = i === node.children.length - 1
			this.markLastChildren(child)
		}
	}

	private outputNode(node: TreeNode, parentLastFlags: boolean[]): void {
		const prefix = this.makePrefix(parentLastFlags, node.isLast || false)
		const color = node.color || ANSI.reset
		
		console.log(`${prefix}${color}${node.name}${ANSI.reset}`)

		if (node.children?.length) {
			const newParentFlags = [...parentLastFlags, node.isLast || false]
			node.children.forEach(child => {
				this.outputNode(child, newParentFlags)
			})
		}
	}

	private collectNodeLines(node: TreeNode, parentLastFlags: boolean[], lines: string[]): void {
		const prefix = this.makePrefix(parentLastFlags, node.isLast || false)
		const color = node.color || ANSI.reset
		
		lines.push(`${prefix}${color}${node.name}${ANSI.reset}`)

		if (node.children?.length) {
			const newParentFlags = [...parentLastFlags, node.isLast || false]
			node.children.forEach(child => {
				this.collectNodeLines(child, newParentFlags, lines)
			})
		}
	}

	private makePrefix(parentLastFlags: boolean[], isLastSelf: boolean): string {
		const trunk = parentLastFlags.map(isLastParent =>
			(isLastParent ? '   ' : '│  ')).join('')
		const tail = isLastSelf ? '└─ ' : '├─ '

		return `${trunk}${tail}`
	}
}

/**
 * Display structured error output using TreeFormatter
 */
export function displayStructuredErrors(
	themeErrors: string[],
	orphanedFileIcons: string[],
	orphanedFolderIcons: string[],
	orphanedLanguageIcons: string[],
	duplicateFileIcons: string[],
	duplicateFolderIcons: string[],
	duplicateLanguageIcons: string[],
	orphanedFileAssignments: string[],
	orphanedFolderAssignments: string[],
	orphanedLanguageAssignments: string[],
	invalidLanguageIds: string[],
): void {
	const formatter = new TreeFormatter()

	// Display theme errors (if any)
	if (themeErrors.length > 0) {
		console.log(`\n❌ THEME ERRORS (${themeErrors.length}):`)
		themeErrors.forEach((error, index) => {
			const prefix = index === themeErrors.length - 1 ? '└─' : '├─'
			console.log(`   ${prefix} ${error}`)
		})
	}

	// Calculate total model errors
	const totalModelErrors = orphanedFileIcons.length + orphanedFolderIcons.length + 
		orphanedLanguageIcons.length + duplicateFileIcons.length + duplicateFolderIcons.length + 
		orphanedFileAssignments.length + orphanedFolderAssignments.length + 
		orphanedLanguageAssignments.length + invalidLanguageIds.length

	if (totalModelErrors > 0) {
		// Header in red
		console.log(`\n${ANSI.red}❌ MODEL ERRORS (${totalModelErrors}):${ANSI.reset}`)

		// Build and output tree
		const treeNodes = formatter.buildTreeFromArrays({
			orphanedFileIcons,
			orphanedFolderIcons,
			orphanedLanguageIcons,
			duplicateFileIcons,
			duplicateFolderIcons,
			duplicateLanguageIcons,
			orphanedFileAssignments,
			orphanedFolderAssignments,
			orphanedLanguageAssignments,
			invalidLanguageIds,
		})

		// Output each top-level node with correct isLast flags
		treeNodes.forEach((node, index) => {
			// Mark if this is the last top-level node
			node.isLast = index === treeNodes.length - 1
			formatter.outputTree(node)
		})
	}
}
