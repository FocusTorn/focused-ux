export interface IWindow {
	showInformationMessage: (message: string, ...items: string[]) => Promise<string | undefined>
	showErrorMessage: (message: string, ...items: string[]) => Promise<string | undefined>
	showWarningMessage: (message: string, options?: any, ...items: string[]) => Promise<string | undefined>
	showInputBox: (options?: {
		prompt?: string
		placeHolder?: string
		value?: string
		password?: boolean
	}) => Promise<string | undefined>
	showTextDocument: (document: any) => Promise<any>
	withProgress: <R>(options: any, task: (progress: any, token: any) => Promise<R>) => Promise<R>
	registerTreeDataProvider: (viewId: string, provider: any) => { dispose: () => void }
}
