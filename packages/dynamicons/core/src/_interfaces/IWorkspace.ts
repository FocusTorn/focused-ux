export interface IWorkspace {
	getConfiguration: (section?: string) => IConfiguration
	onDidChangeConfiguration: (listener: (e: any) => void) => { dispose: () => void }
}

export interface IConfiguration {
	get: <T>(key: string, defaultValue?: T) => T | undefined
	update: (key: string, value: any, isGlobal?: boolean) => Promise<void>
}
