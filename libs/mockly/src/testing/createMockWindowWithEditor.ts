import { vi } from 'vitest'
import { mocklyService } from '../index.js'

/**
 * Factory for a mock window that can open a document and expose an active text editor.
 * - Intended for integration/behavior tests that need editor state assertions.
 * - Keeps semantics consistent across suites (cursor/selection helpers included).
 */
export function createMockWindowWithEditor(defaultInput: string = 'TestNote') {
	const windowMock: any = {
		...mocklyService.window,
		activeTextEditor: undefined,
		showErrorMessage: vi.fn(),
		withProgress: vi.fn().mockImplementation(async <T>(
			_options: { title: string, cancellable: boolean },
			task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
		): Promise<T> => {
			return await task({ report: vi.fn() })
		}),
		showInformationMessage: vi.fn().mockResolvedValue(undefined),
		showWarningMessage: vi.fn().mockResolvedValue(undefined),
		showInputBox: vi.fn().mockResolvedValue(defaultInput),
		showTextDocument: vi.fn().mockImplementation(async (doc: any) => {
			const editor: any = {
				document: doc,
				selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
				moveCursor: vi.fn().mockImplementation((line: number, character: number) => {
					editor.selection.start = { line, character }
					editor.selection.end = { line, character }
				}),
				selectText: vi.fn().mockImplementation((startLine: number, startChar: number, endLine: number, endChar: number) => {
					editor.selection.start = { line: startLine, character: startChar }
					editor.selection.end = { line: endLine, character: endChar }
				}),
				modifyDocument: vi.fn().mockImplementation((content: string) => {
					if (doc.setContent)
						doc.setContent(content)
				}),
			}

			windowMock.activeTextEditor = editor
			return editor
		}),
	}

	return windowMock
}
