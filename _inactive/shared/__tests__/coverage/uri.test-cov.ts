import { describe, it, expect } from 'vitest'
import * as vscode from 'vscode'
import { UriAdapter } from '../../src/vscode/adapters/Uri.adapter.js'

describe('URI Coverage Tests', () => {
	describe('UriAdapter', () => {
		it('handles different URI formats correctly', () => {
			const mockUri = new vscode.Uri('file', '', '/path/to/file.txt', '', '')
			const fileAdapter = new UriAdapter(mockUri)

			expect(fileAdapter.path).toBe('/path/to/file.txt')
			expect(fileAdapter.fsPath).toBe('/path/to/file.txt')
			expect(fileAdapter.toString()).toBe('file:///path/to/file.txt')
		})

		it('exposes path properties correctly', () => {
			const mockUri = new vscode.Uri('file', '', '/test/path', 'param=value', '')
			const uri = new UriAdapter(mockUri)

			expect(uri.path).toBe('/test/path')
			expect(uri.query).toBe('param=value')
			expect(uri.fsPath).toBe('/test/path')
			expect(uri.toString()).toBe('file:///test/path?param=value')
		})

		it('handles different URI types', () => {
			const mockUri = new vscode.Uri('file', '', '/another/path', '', '')
			const uri = new UriAdapter(mockUri)

			expect(uri.path).toBe('/another/path')
			expect(uri.query).toBe('')
			expect(uri.fsPath).toBe('/another/path')
			expect(uri.toString()).toBe('file:///another/path')
		})

		it('handles URIs with query parameters', () => {
			const mockUri = new vscode.Uri('file', '', '/search', 'q=test&type=file', '')
			const uri = new UriAdapter(mockUri)

			expect(uri.path).toBe('/search')
			expect(uri.query).toBe('q=test&type=file')
			expect(uri.fsPath).toBe('/search')
			expect(uri.toString()).toBe('file:///search?q=test&type=file')
		})

		it('exposes path/query/fsPath/toString', () => {
			const mockUri = new vscode.Uri('uri', '', '/p', 'q=1', '')
			const a = new UriAdapter(mockUri)

			expect(a.path).toBe('/p')
			expect(a.query).toBe('q=1')
			expect(a.fsPath).toBe('/p')
			expect(a.toString()).toBe('uri:///p?q=1')
		})
	})
}) 