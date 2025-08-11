import type { IMocklyService } from '../_interfaces/IMocklyService.js'
import type { Uri, Disposable } from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { CoreUtilitiesService } from './CoreUtilities.service.js'
import { Position as MockPosition, Range as MockRange, Disposable as MockDisposable, EventEmitter as MockEventEmitter } from '../_vscCore/vscClasses.js'
import { MockWindow } from '../_vscCore/MockWindow.js'
import { MockFileSystem } from '../_vscCore/MockFileSystem.js'
import { MockTextDocument } from '../_vscCore/MockTextDocument.js'
import type { Buffer } from 'node:buffer'

// Proper Uri mock class
class MockUri implements Uri {

	readonly scheme: string
	readonly authority: string
	readonly path: string
	readonly query: string
	readonly fragment: string

	constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
		this.scheme = scheme
		this.authority = authority
		this.path = path
		this.query = query
		this.fragment = fragment
	}

	get fsPath(): string {
		return this.scheme === 'file' ? this.path : this.path
	}

	toString(): string {
		return `${this.scheme}://${this.authority}${this.path}${this.query ? `?${this.query}` : ''}${this.fragment ? `#${this.fragment}` : ''}`
	}

	toJSON(): any {
		return {
			scheme: this.scheme,
			authority: this.authority,
			path: this.path,
			query: this.query,
			fragment: this.fragment,
		}
	}

	with(change: { scheme?: string, authority?: string, path?: string, query?: string, fragment?: string }): Uri {
		return new MockUri(
			change.scheme ?? this.scheme,
			change.authority ?? this.authority,
			change.path ?? this.path,
			change.query ?? this.query,
			change.fragment ?? this.fragment,
		)
	}

	static file(path: string): Uri {
		// Normalize path to use forward slashes for consistency across platforms
		const normalizedPath = path.replace(/\\/g, '/')

		return new MockUri('file', '', normalizedPath, '', '')
	}

	static parse(uri: string): Uri {
		// Simple parser for file URIs
		if (uri.startsWith('file://')) {
			return new MockUri('file', '', uri.substring(7), '', '')
		}
		return new MockUri('file', '', uri, '', '')
	}

	static joinPath(base: Uri, ...paths: string[]): Uri {
		const basePath = base.fsPath
		const joinedPath = path.join(basePath, ...paths)
		
		// Normalize path to use forward slashes for consistency across platforms
		const normalizedPath = joinedPath.replace(/\\/g, '/')

		return new MockUri('file', '', normalizedPath, '', '')
	}

	static from(uri: Uri): Uri {
		return new MockUri(uri.scheme, uri.authority, uri.path, uri.query, uri.fragment)
	}

}

export class MocklyService implements IMocklyService {

	private registeredCommands = new Map<string, (...args: any[]) => any>()
	private eventListeners = new Map<string, MockEventEmitter<any>>()
	private mockFileSystem: MockFileSystem
	private mockWindow: MockWindow
	private utils: CoreUtilitiesService

	// Private configuration storage
	private configurationStorage = new Map<string, any>()
	
	// Configuration for test console output
	private allowTestConsoleOutput = false

	constructor() {
		this.utils = new CoreUtilitiesService()
		this.mockFileSystem = new MockFileSystem(this.utils)
		this.mockWindow = new MockWindow(this.utils)
		
		// Set the workspace and window properties after initialization
		this.workspace.fs = this.mockFileSystem
		this.window = this.mockWindow
		
		// Initialize with some default commands
		this.registerDefaultCommands()
		this.utils.info('MocklyService initialized')
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  CONFIGURATION METHODS                                                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	/**
	 * Enable or disable test console output
	 * @param allow - Whether to allow test console output to pass through
	 */
	setTestConsoleOutput(allow: boolean): void {
		this.allowTestConsoleOutput = allow
		this.utils.info(`Test console output ${allow ? 'enabled' : 'disabled'}`)
	}

	/**
	 * Get current test console output setting
	 */
	getTestConsoleOutput(): boolean {
		return this.allowTestConsoleOutput
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  WORKSPACE API                                                                                  │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	workspace = {
		fs: {} as any, // Will be set in constructor

		workspaceFolders: [{
			uri: {
				fsPath: '/workspace',
				toString: () => 'file:///workspace',
				scheme: 'file',
				authority: '',
				path: '/workspace',
				query: '',
				fragment: '',
			} as any,
		}],

		onDidChangeConfiguration: (listener: (e: any) => void): Disposable => {
			const emitter = this.getOrCreateEventEmitter('onDidChangeConfiguration')
			const _disposable = emitter.event(listener)

			return new MockDisposable(() => {
				// Clean up listener
			})
		},

		createFileSystemWatcher: (_pattern: any): any => {
			return {
				onDidCreate: this.getOrCreateEventEmitter('onDidCreateFiles').event,
				onDidChange: this.getOrCreateEventEmitter('onDidChangeFiles').event,
				onDidDelete: this.getOrCreateEventEmitter('onDidDeleteFiles').event,
				dispose: () => {
					// Clean up watcher
				},
			}
		},

		openTextDocument: async (uri: any): Promise<any> => {
			try {
				const content = await this.workspace.fs.readFile(uri)

				return new MockTextDocument(uri, new TextDecoder().decode(content))
			}
			catch (_error) {
				// If file doesn't exist, create a new document
				return new MockTextDocument(uri, '')
			}
		},

		getConfiguration: (section?: string): any => {
			const sectionPrefix = section ? `${section}.` : ''
			
			return {
				get: <T>(key: string, defaultValue?: T): T => {
					const fullKey = sectionPrefix + key
					const value = this.configurationStorage.get(fullKey)

					return value !== undefined ? value : (defaultValue as T)
				},
				update: async (key: string, value: any, _target?: any): Promise<void> => {
					const fullKey = sectionPrefix + key

					this.configurationStorage.set(fullKey, value)
					this.utils.debug(`Configuration updated: ${fullKey} = ${JSON.stringify(value)}`)
					return Promise.resolve()
				},
				has: (key: string): boolean => {
					const fullKey = sectionPrefix + key

					return this.configurationStorage.has(fullKey)
				},
				inspect: <T>(key: string): { key: string, defaultValue?: T, globalValue?: T, workspaceValue?: T, workspaceFolderValue?: T } | undefined => {
					const fullKey = sectionPrefix + key
					const value = this.configurationStorage.get(fullKey)

					if (value !== undefined) {
						return {
							key: fullKey,
							globalValue: value as T,
							workspaceValue: value as T,
							workspaceFolderValue: value as T,
						}
					}
					return undefined
				},
			}
		},
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  WINDOW API                                                                                     │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	window: any // Will be set in constructor

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  COMMANDS API                                                                                   │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	commands = {
		registerCommand: (command: string, callback: (...args: any[]) => any): Disposable => {
			this.registeredCommands.set(command, callback)
			return new MockDisposable(() => {
				this.registeredCommands.delete(command)
			})
		},

		executeCommand: async <T = unknown>(command: string, ...rest: any[]): Promise<T> => {
			const handler = this.registeredCommands.get(command)

			if (handler) {
				this.utils.debug(`Executing command: ${command}`)
				return await Promise.resolve(handler(...rest)) as T
			}

			const error = this.utils.createError(`Command not found: ${command}`, 'CommandNotFound')

			this.utils.error(error)
			throw error
		},

		getCommands: async (_filterInternal: boolean = false): Promise<string[]> => {
			return Array.from(this.registeredCommands.keys())
		},
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  EXTENSIONS API                                                                                 │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	extensions = {
		getExtension: (extensionId: string): any | undefined => {
			return {
				id: extensionId,
				extensionPath: `/extensions/${extensionId}`,
				extensionUri: MockUri.file(`/extensions/${extensionId}`),
				isActive: true,
				packageJSON: {},
				exports: {},
			}
		},

		all: [],
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  ENV API                                                                                        │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	env = {
		appName: 'Mockly VSCode',
		appRoot: '/mockly',
		language: 'en',
		machineId: 'mockly-machine-id',
		sessionId: 'mockly-session-id',
		uiKind: 1,
		uriScheme: 'file',
		version: '1.0.0',
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  VSCODE TYPES                                                                                   │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	Uri = MockUri
	Position = MockPosition
	Range = MockRange
	Disposable = MockDisposable
	EventEmitter = MockEventEmitter

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  NODE UTILITIES                                                                                 │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	node = {
		path: {
			join: (...paths: string[]): string => {
				const joinedPath = path.join(...paths)

				// Normalize path to use forward slashes for consistency across platforms
				return joinedPath.replace(/\\/g, '/')
			},
			normalize: (pathStr: string): string => {
				const normalizedPath = path.normalize(pathStr)

				// Normalize path to use forward slashes for consistency across platforms
				return normalizedPath.replace(/\\/g, '/')
			},
			dirname: (pathStr: string): string => path.dirname(pathStr),
			basename: (pathStr: string, ext?: string): string => path.basename(pathStr, ext),
			extname: (pathStr: string): string => path.extname(pathStr),
			parse: (pathStr: string): any => path.parse(pathStr),
		},
		fs: {
			readFile: async (filePath: string, encoding?: string): Promise<string | Buffer> => {
				return await fs.readFile(filePath, encoding as any)
			},
			writeFile: async (filePath: string, data: string | Buffer): Promise<void> => {
				await fs.writeFile(filePath, data)
			},
			access: async (filePath: string): Promise<void> => {
				await fs.access(filePath)
			},
			stat: async (filePath: string): Promise<any> => {
				return await fs.stat(filePath)
			},
			readdir: async (dirPath: string): Promise<string[]> => {
				return await fs.readdir(dirPath)
			},
			mkdir: async (dirPath: string, options?: any): Promise<void> => {
				await fs.mkdir(dirPath, options)
			},
			rmdir: async (dirPath: string): Promise<void> => {
				await fs.rmdir(dirPath)
			},
			unlink: async (filePath: string): Promise<void> => {
				await fs.unlink(filePath)
			},
		},
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  VERSION & RESET                                                                                │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	version = '1.0.0'

	reset(): void {
		this.registeredCommands.clear()
		this.eventListeners.clear()
		this.mockFileSystem.clear()
		this.mockWindow.clear()
		this.configurationStorage.clear()
		this.registerDefaultCommands()
		this.utils.info('MocklyService reset')
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  PRIVATE METHODS                                                                                │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private getOrCreateEventEmitter<T>(eventName: string): MockEventEmitter<T> {
		if (!this.eventListeners.has(eventName)) {
			this.eventListeners.set(eventName, new MockEventEmitter<T>())
		}
		return this.eventListeners.get(eventName)!
	}

	private registerDefaultCommands(): void {
		this.commands.registerCommand('mockly.version', () => this.version)
		this.commands.registerCommand('mockly.reset', () => this.reset())
		this.commands.registerCommand('setContext', () => Promise.resolve())
		this.utils.debug('Default commands registered')
	}

}
