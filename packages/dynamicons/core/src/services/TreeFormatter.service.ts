export interface TreeFormatterNode {
	label: string
	details?: string
	isDirectory?: boolean
	children?: TreeFormatterNode[]
}

export interface ITreeFormatterService {
	formatTree: (rootNode: TreeFormatterNode) => string
}

export class TreeFormatterService implements ITreeFormatterService {
	private _generateTreeString(node: TreeFormatterNode, prefix: string): string {
		let output = ''
		const childrenCount = node.children?.length ?? 0

		for (let i = 0; i < childrenCount; i++) {
			const child = node.children![i]
			const isLastChild = i === childrenCount - 1
			const connector = isLastChild ? '└─' : '├─'
			const linePrefix = ' '

			let line = `${prefix}${connector}${linePrefix}${child.label}`

			if (child.isDirectory) {
				line += '/'
			}
			if (child.details) {
				line += ` ${child.details}`
			}
			output += `${line}\n`

			if (child.children && child.children.length > 0) {
				const childPrefix = prefix + (isLastChild ? '   ' : '│  ')

				output += this._generateTreeString(child, childPrefix)
			}
		}
		return output
	}

	public formatTree(rootNode: TreeFormatterNode): string {
		let output = `${rootNode.label}`

		if (rootNode.isDirectory) {
			output += '/'
		}
		if (rootNode.details) {
			output += ` ${rootNode.details}`
		}
		output += '\n'

		output += this._generateTreeString(rootNode, '')
		return output.trimEnd()
	}
}