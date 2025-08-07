import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectButlerService } from '@fux/project-butler-core'
import type { IFileSystem, IProcess } from '@fux/shared'
import type { IWindow, ITerminalProvider } from '@fux/project-butler-core'

describe('ProjectButlerService', () => {
	let projectButlerService: ProjectButlerService
	let mockFileSystem: IFileSystem
	let mockWindow: IWindow
	let mockTerminalProvider: ITerminalProvider
	let mockProcess: IProcess
	let mockTerminal: any

	beforeEach(() => {
		// Create mock terminal
		mockTerminal = {
			sendText: vi.fn(),
			show: vi.fn(),
		}

		// Create mock dependencies
		mockFileSystem = {
			stat: vi.fn(),
			access: vi.fn(),
			copyFile: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
		}

		mockWindow = {
			activeTextEditorUri: 'file:///test/path/file.txt',
			showErrorMessage: vi.fn(),
			showTimedInformationMessage: vi.fn(),
		}

		mockTerminalProvider = {
			activeTerminal: mockTerminal,
			createTerminal: vi.fn().mockReturnValue(mockTerminal),
		}

		mockProcess = {
			getWorkspaceRoot: vi.fn(),
		}

		// Create service instance
		projectButlerService = new ProjectButlerService(
			mockFileSystem,
			mockWindow,
			mockTerminalProvider,
			mockProcess,
		)
	})

	describe('updateTerminalPath', () => {
		it('should update terminal path with provided URI', async () => {
			const testUri = 'file:///test/directory'

			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'directory' })

			await projectButlerService.updateTerminalPath(testUri)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(testUri)
			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/directory"')
			expect(mockTerminal.show).toHaveBeenCalled()
		})

		it('should update terminal path with file URI (should use directory)', async () => {
			const testUri = 'file:///test/path/file.txt'

			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'file' })

			await projectButlerService.updateTerminalPath(testUri)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(testUri)
			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/path"')
			expect(mockTerminal.show).toHaveBeenCalled()
		})

		it('should use active text editor URI when no URI provided', async () => {
			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'file' })

			await projectButlerService.updateTerminalPath()

			expect(mockFileSystem.stat).toHaveBeenCalledWith('file:///test/path/file.txt')
			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/path"')
		})

		it('should show error when no URI available', async () => {
			mockWindow.activeTextEditorUri = undefined

			await projectButlerService.updateTerminalPath()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'No file or folder context to update terminal path.',
			)
		})

		it('should create new terminal when no active terminal', async () => {
			mockTerminalProvider.activeTerminal = undefined
			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'directory' })

			await projectButlerService.updateTerminalPath('file:///test/directory')

			expect(mockTerminalProvider.createTerminal).toHaveBeenCalledWith('F-UX Terminal')
			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/directory"')
		})

		it('should handle file system errors', async () => {
			const error = new Error('File not found')

			mockFileSystem.stat = vi.fn().mockRejectedValue(error)

			await projectButlerService.updateTerminalPath('file:///test/directory')

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Error updating terminal path: File not found',
			)
		})
	})

	describe('createBackup', () => {
		it('should create backup with default naming', async () => {
			const testUri = 'file:///test/path/file.txt'

			mockFileSystem.access = vi.fn().mockRejectedValue(new Error('File not found'))
			mockFileSystem.copyFile = vi.fn().mockResolvedValue(undefined)

			await projectButlerService.createBackup(testUri)

			expect(mockFileSystem.copyFile).toHaveBeenCalledWith(
				testUri,
				expect.stringContaining('file.txt.bak'),
			)
			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'Backup created: file.txt.bak',
			)
		})

		it('should create backup with incremented number when file exists', async () => {
			const testUri = 'file:///test/path/file.txt'

			// First backup exists, second doesn't
			mockFileSystem.access
				.mockResolvedValueOnce(undefined) // .bak exists
				.mockRejectedValueOnce(new Error('File not found')) // .bak2 doesn't exist
			mockFileSystem.copyFile = vi.fn().mockResolvedValue(undefined)

			await projectButlerService.createBackup(testUri)

			expect(mockFileSystem.copyFile).toHaveBeenCalledWith(
				testUri,
				expect.stringContaining('file.txt.bak2'),
			)
			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'Backup created: file.txt.bak2',
			)
		})

		it('should use active text editor URI when no URI provided', async () => {
			mockFileSystem.access = vi.fn().mockRejectedValue(new Error('File not found'))
			mockFileSystem.copyFile = vi.fn().mockResolvedValue(undefined)

			await projectButlerService.createBackup()

			expect(mockFileSystem.copyFile).toHaveBeenCalledWith(
				'file:///test/path/file.txt',
				expect.stringContaining('file.txt.bak'),
			)
		})

		it('should show error when no URI available', async () => {
			mockWindow.activeTextEditorUri = undefined

			await projectButlerService.createBackup()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'No file selected or open to back up.',
			)
		})

		it('should handle copy file errors', async () => {
			const error = new Error('Permission denied')

			mockFileSystem.access = vi.fn().mockRejectedValue(new Error('File not found'))
			mockFileSystem.copyFile = vi.fn().mockRejectedValue(error)

			await projectButlerService.createBackup('file:///test/path/file.txt')

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Error creating backup: Permission denied',
			)
		})
	})

	describe('enterPoetryShell', () => {
		it('should enter poetry shell with directory context', async () => {
			const testUri = 'file:///test/project/file.py'

			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'file' })

			await projectButlerService.enterPoetryShell(testUri)

			expect(mockTerminalProvider.createTerminal).toHaveBeenCalledWith('Poetry Shell')
			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/project" && poetry shell')
			expect(mockTerminal.show).toHaveBeenCalled()
		})

		it('should enter poetry shell with directory URI', async () => {
			const testUri = 'file:///test/project'

			mockFileSystem.stat = vi.fn().mockResolvedValue({ type: 'directory' })

			await projectButlerService.enterPoetryShell(testUri)

			expect(mockTerminal.sendText).toHaveBeenCalledWith('cd "file:///test/project" && poetry shell')
		})

		it('should enter poetry shell without context', async () => {
			mockWindow.activeTextEditorUri = undefined
			await projectButlerService.enterPoetryShell()

			expect(mockTerminalProvider.createTerminal).toHaveBeenCalledWith('Poetry Shell')
			expect(mockTerminal.sendText).toHaveBeenCalledWith('poetry shell')
			expect(mockTerminal.show).toHaveBeenCalled()
		})

		it('should handle file system errors', async () => {
			const error = new Error('Directory not found')

			mockFileSystem.stat = vi.fn().mockRejectedValue(error)

			await projectButlerService.enterPoetryShell('file:///test/project')

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Failed to enter Poetry shell: Directory not found',
			)
		})
	})

	describe('formatPackageJson', () => {
		const mockConfigContent = `
TerminalButler:
  packageJson-order:
    - name
    - version
    - description
    - main
    - dependencies
    - devDependencies
    - scripts
`

		const mockPackageContent = `{
  "version": "1.0.0",
  "name": "test-package",
  "description": "A test package",
  "dependencies": {
    "test": "^1.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  },
  "scripts": {
    "test": "vitest"
  }
}`

		it('should format package.json correctly', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn()
				.mockResolvedValueOnce(mockConfigContent) // .FocusedUX
				.mockResolvedValueOnce(mockPackageContent) // package.json
			mockFileSystem.writeFile = vi.fn().mockResolvedValue(undefined)

			await projectButlerService.formatPackageJson(testUri)

			expect(mockFileSystem.readFile).toHaveBeenCalledWith(expect.stringContaining('.FocusedUX'))
			expect(mockFileSystem.readFile).toHaveBeenCalledWith(testUri)
			expect(mockFileSystem.writeFile).toHaveBeenCalled()
			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'Successfully formatted package.json',
			)
		})

		it('should show error when not a package.json file', async () => {
			const testUri = 'file:///test/project/other.json'

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'This command can only be run on a package.json file.',
			)
		})

		it('should show error when no URI available', async () => {
			mockWindow.activeTextEditorUri = undefined

			await projectButlerService.formatPackageJson()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'No package.json file selected or active.',
			)
		})

		it('should show error when workspace root not found', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue(undefined)

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Could not find workspace root. Cannot format package.json.',
			)
		})

		it('should show error when .FocusedUX file cannot be read', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn().mockRejectedValue(new Error('File not found'))

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Could not read \'.FocusedUX\' file: File not found',
			)
		})

		it('should show error when .FocusedUX YAML is invalid', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn().mockResolvedValue('invalid: yaml: content')

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				expect.stringContaining('Failed to parse YAML from \'.FocusedUX\':'),
			)
		})

		it('should show error when packageJson-order not found in config', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn().mockResolvedValue('OtherConfig: value')

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Configuration Error: \'TerminalButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.',
			)
		})

		it('should show error when package.json has unknown keys', async () => {
			const testUri = 'file:///test/project/package.json'
			const invalidPackageContent = `{
  "name": "test-package",
  "unknownKey": "value",
  "version": "1.0.0"
}`

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn()
				.mockResolvedValueOnce(mockConfigContent)
				.mockResolvedValueOnce(invalidPackageContent)

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Validation Failed: Found top-level key \'unknownKey\' which is not in the allowed ordering list defined in .FocusedUX.',
			)
		})

		it('should preserve comment-like keys', async () => {
			const testUri = 'file:///test/project/package.json'
			const packageWithComments = `{
  "version": "1.0.0",
  "name": "test-package",
  "=comment=": "This is a comment",
  "dependencies": {
    "test": "^1.0.0"
  }
}`

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn()
				.mockResolvedValueOnce(mockConfigContent)
				.mockResolvedValueOnce(packageWithComments)
			mockFileSystem.writeFile = vi.fn().mockResolvedValue(undefined)

			await projectButlerService.formatPackageJson(testUri)

			expect(mockFileSystem.writeFile).toHaveBeenCalled()

			const writtenContent = mockFileSystem.writeFile.mock.calls[0][1]
			const decodedContent = new TextDecoder().decode(writtenContent)

			expect(decodedContent).toContain('"=comment="')
		})

		it('should handle package.json read errors', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn()
				.mockResolvedValueOnce(mockConfigContent)
				.mockRejectedValueOnce(new Error('File not found'))

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Failed to read package.json: File not found',
			)
		})

		it('should handle package.json write errors', async () => {
			const testUri = 'file:///test/project/package.json'

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue('/test/project')
			mockFileSystem.readFile = vi.fn()
				.mockResolvedValueOnce(mockConfigContent)
				.mockResolvedValueOnce(mockPackageContent)
			mockFileSystem.writeFile = vi.fn().mockRejectedValue(new Error('Permission denied'))

			await projectButlerService.formatPackageJson(testUri)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Failed to write updated package.json: Permission denied',
			)
		})
	})
})
