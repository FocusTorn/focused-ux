import { describe, it, expect } from 'vitest'
import { TreeFormatterService, type TreeFormatterNode } from '../../src/services/TreeFormatter.service.js'

describe('TreeFormatterService', () => {
	let service: TreeFormatterService

	beforeEach(() => {
		service = new TreeFormatterService()
	})

	describe('formatTree', () => {
		it('should format a simple root node without children', () => {
			const rootNode: TreeFormatterNode = {
				label: 'root',
				isDirectory: true
			}

			const result = service.formatTree(rootNode)
			expect(result).toBe('root/')
		})

		it('should format a root node with details', () => {
			const rootNode: TreeFormatterNode = {
				label: 'project',
				details: 'TypeScript project',
				isDirectory: true
			}

			const result = service.formatTree(rootNode)
			expect(result).toBe('project/ TypeScript project')
		})

		it('should format a tree with single level children', () => {
			const rootNode: TreeFormatterNode = {
				label: 'src',
				isDirectory: true,
				children: [
					{ label: 'index.ts', isDirectory: false },
					{ label: 'utils.ts', isDirectory: false },
					{ label: 'components', isDirectory: true }
				]
			}

			const result = service.formatTree(rootNode)
			const expected = [
				'src/',
				'├─ index.ts',
				'├─ utils.ts',
				'└─ components/'
			].join('\n')

			expect(result).toBe(expected)
		})

		it('should format a tree with nested children', () => {
			const rootNode: TreeFormatterNode = {
				label: 'project',
				isDirectory: true,
				children: [
					{
						label: 'src',
						isDirectory: true,
						children: [
							{ label: 'index.ts', isDirectory: false },
							{ label: 'utils.ts', isDirectory: false }
						]
					},
					{
						label: 'tests',
						isDirectory: true,
						children: [
							{ label: 'index.test.ts', isDirectory: false }
						]
					}
				]
			}

			const result = service.formatTree(rootNode)
			const expected = [
				'project/',
				'├─ src/',
				'│  ├─ index.ts',
				'│  └─ utils.ts',
				'└─ tests/',
				'   └─ index.test.ts'
			].join('\n')

			expect(result).toBe(expected)
		})

		it('should format children with details', () => {
			const rootNode: TreeFormatterNode = {
				label: 'files',
				isDirectory: true,
				children: [
					{ label: 'config.json', details: '2.1KB', isDirectory: false },
					{ label: 'data.csv', details: '15.3KB', isDirectory: false }
				]
			}

			const result = service.formatTree(rootNode)
			const expected = [
				'files/',
				'├─ config.json 2.1KB',
				'└─ data.csv 15.3KB'
			].join('\n')

			expect(result).toBe(expected)
		})

		it('should handle empty children array', () => {
			const rootNode: TreeFormatterNode = {
				label: 'empty',
				isDirectory: true,
				children: []
			}

			const result = service.formatTree(rootNode)
			expect(result).toBe('empty/')
		})

		it('should handle undefined children', () => {
			const rootNode: TreeFormatterNode = {
				label: 'no-children',
				isDirectory: true
			}

			const result = service.formatTree(rootNode)
			expect(result).toBe('no-children/')
		})

		it('should handle complex nested structure', () => {
			const rootNode: TreeFormatterNode = {
				label: 'monorepo',
				isDirectory: true,
				children: [
					{
						label: 'packages',
						isDirectory: true,
						children: [
							{
								label: 'app1',
								isDirectory: true,
								children: [
									{ label: 'package.json', isDirectory: false },
									{ label: 'src', isDirectory: true }
								]
							},
							{
								label: 'app2',
								isDirectory: true,
								children: [
									{ label: 'package.json', isDirectory: false }
								]
							}
						]
					},
					{ label: 'README.md', isDirectory: false }
				]
			}

			const result = service.formatTree(rootNode)
			const expected = [
				'monorepo/',
				'├─ packages/',
				'│  ├─ app1/',
				'│  │  ├─ package.json',
				'│  │  └─ src/',
				'│  └─ app2/',
				'│     └─ package.json',
				'└─ README.md'
			].join('\n')

			expect(result).toBe(expected)
		})

		it('should handle file nodes without isDirectory flag', () => {
			const rootNode: TreeFormatterNode = {
				label: 'mixed',
				isDirectory: true,
				children: [
					{ label: 'file1.txt' },
					{ label: 'folder', isDirectory: true }
				]
			}

			const result = service.formatTree(rootNode)
			const expected = [
				'mixed/',
				'├─ file1.txt',
				'└─ folder/'
			].join('\n')

			expect(result).toBe(expected)
		})
	})
}) 