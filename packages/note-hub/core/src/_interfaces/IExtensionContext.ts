export interface IExtensionContext {
	subscriptions: Array<{ dispose: () => void }>
	globalState: {
		get: <T>(key: string, defaultValue?: T) => T
		update: (key: string, value: any) => Promise<void>
	}
	workspaceState: {
		get: <T>(key: string, defaultValue?: T) => T
		update: (key: string, value: any) => Promise<void>
	}
}
