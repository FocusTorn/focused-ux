export interface IWindow {
	showInformationMessage: (message: string, ...args: (string | boolean)[]) => Promise<string | undefined>
	showWarningMessage: (message: string, ...args: (string | boolean)[]) => Promise<string | undefined>
	showErrorMessage: (message: string, ...args: (string | boolean)[]) => Promise<string | undefined>
	showInputBox: (options?: {
		prompt?: string
		placeHolder?: string
		value?: string
		password?: boolean
	}) => Promise<string | undefined>
	showTextDocument: (document: any, options?: any) => Promise<any>
	withProgress: <R>(options: any, task: (progress: any, token: any) => Promise<R>) => Promise<R>
	registerTreeDataProvider: (viewId: string, provider: any) => { dispose: () => void }
}
