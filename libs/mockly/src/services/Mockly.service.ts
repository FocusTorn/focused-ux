import type { IMocklyService } from '../_interfaces/IMocklyService.js'
import type { Uri, Disposable } from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { CoreUtilitiesService } from './CoreUtilities.service.js'
import { Position as MockPosition, Range as MockRange, Disposable as MockDisposable, EventEmitter as MockEventEmitter } from '../_vscCore/vscClasses.js'
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
		return new MockUri('file', '', path, '', '')
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

		return new MockUri('file', '', joinedPath, '', '')
	}

	static from(uri: Uri): Uri {
		return new MockUri(uri.scheme, uri.authority, uri.path, uri.query, uri.fragment)
	}

}

export class MocklyService implements IMocklyService {

	private registeredCommands = new Map<string, (...args: any[]) => any>()
	private eventListeners = new Map<string, MockEventEmitter<any>>()
	private fileSystem = new Map<string, { content: Uint8Array, type: 'file' | 'directory' }>()
	private utils: CoreUtilitiesService

	// Private configuration storage
	private configurationStorage = new Map<string, any>()

	constructor() {
		this.utils = new CoreUtilitiesService()
		// Initialize with some default commands
		this.registerDefaultCommands()
		this.utils.info('MocklyService initialized')
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │  WORKSPACE API                                                                                  │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	workspace = {
		fs: {
			stat: async (uri: Uri): Promise<any> => {
				const path = uri.fsPath
				const item = this.fileSystem.get(path)

				if (!item) {
					throw new Error(`File not found: ${path}`)
				}
				return {
					type: item.type,
					ctime: Date.now(),
					mtime: Date.now(),
					size: item.content?.length || 0,
				}
			},

			readFile: async (uri: Uri): Promise<Uint8Array> => {
				const path = uri.fsPath
				const item = this.fileSystem.get(path)

				if (!item || item.type !== 'file') {
					throw new Error(`File not found: ${path}`)
				}
				return item.content
			},

			writeFile: async (uri: Uri, content: Uint8Array): Promise<void> => {
				const path = uri.fsPath

				this.fileSystem.set(path, { content, type: 'file' })
			},

			createDirectory: async (uri: Uri): Promise<void> => {
				const path = uri.fsPath

				this.fileSystem.set(path, { content: new Uint8Array(), type: 'directory' })
			},

			readDirectory: async (uri: Uri): Promise<[string, number][]> => {
				const path = uri.fsPath
				const results: [string, number][] = []
				
				for (const [filePath, item] of this.fileSystem.entries()) {
					if (filePath.startsWith(path) && filePath !== path) {
						const relativePath = filePath.substring(path.length + 1)
						const parts = relativePath.split('/')

						if (parts.length === 1) {
							results.push([parts[0], item.type === 'file' ? 1 : 2])
						}
					}
				}
				
				return results
			},

			delete: async (uri: Uri, _options?: { recursive?: boolean, useTrash?: boolean }): Promise<void> => {
				const path = uri.fsPath

				if (!this.fileSystem.has(path)) {
					throw new Error(`File not found: ${path}`)
				}
				this.fileSystem.delete(path)
			},

			copy: async (source: Uri, target: Uri, _options?: { overwrite?: boolean }): Promise<void> => {
				const sourceItem = this.fileSystem.get(source.fsPath)

				if (!sourceItem) {
					throw new Error(`Source file not found: ${source.fsPath}`)
				}
				this.fileSystem.set(target.fsPath, sourceItem)
			},

			rename: async (source: Uri, target: Uri, _options?: { overwrite?: boolean }): Promise<void> => {
				const sourceItem = this.fileSystem.get(source.fsPath)

				if (!sourceItem) {
					throw new Error(`Source file not found: ${source.fsPath}`)
				}
				this.fileSystem.delete(source.fsPath)
				this.fileSystem.set(target.fsPath, sourceItem)
			},
		},

		workspaceFolders: [{ uri: MockUri.file('/workspace') }],

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
			const content = await this.workspace.fs.readFile(uri)

			return {
				uri,
				fileName: uri.fsPath,
				languageId: 'typescript',
				version: 1,
				isDirty: false,
				isUntitled: false,
				getText: () => new TextDecoder().decode(content),
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

	window = {
		activeTextEditor: undefined,

		showErrorMessage: (message: string): void => {
			this.utils.error(`Window Error: ${message}`)
		},

		showInformationMessage: async (message: string, ...items: string[]): Promise<string | undefined> => {
			this.utils.info(`Window Info: ${message}`)
			return items[0]
		},

		showWarningMessage: async (message: string, options?: { modal?: boolean }, ...items: any[]): Promise<any> => {
			this.utils.warn(`Window Warning: ${message}`)
			return items[0]
		},

		showInputBox: async (options: any): Promise<string | undefined> => {
			this.utils.info(`Input Box: ${options?.prompt || 'Enter value'}`)
			return options?.value || ''
		},

		showTextDocument: async (doc: any): Promise<any> => {
			this.utils.info(`Show Document: ${doc.uri?.fsPath}`)
			return {
				document: doc,
				selection: new MockRange(0, 0, 0, 0),
			}
		},

		createTreeView: (_viewId: string, _options: any): any => {
			return {
				onDidChangeSelection: this.getOrCreateEventEmitter('treeViewSelection').event,
				onDidChangeVisibility: this.getOrCreateEventEmitter('treeViewVisibility').event,
				dispose: () => {
					// Clean up tree view
				},
			}
		},

		registerTreeDataProvider: (_viewId: string, _provider: any): any => {
			return {
				dispose: () => {
					// Clean up provider
				},
			}
		},

		withProgress: async (options: any, task: () => Promise<any>): Promise<any> => {
			this.utils.info(`Progress: ${options?.title || 'Processing...'}`)
			return await task()
		},
	}

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
			join: (...paths: string[]): string => path.join(...paths),
			normalize: (pathStr: string): string => path.normalize(pathStr),
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
		this.fileSystem.clear()
		this.registerDefaultCommands()
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
		this.utils.debug('Default commands registered')
	}

}
