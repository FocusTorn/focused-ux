import type { MessageItem, MessageOptions } from 'vscode'

export interface IWindow {
	showInformationMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showWarningMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showErrorMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showTimedInformationMessage: (message: string, duration?: number) => Promise<void>
}
