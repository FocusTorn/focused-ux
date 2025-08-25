export interface IEnv {
	machineId: string
	sessionId: string
	language: string
	appName: string
	appRoot: string
	appHost: string
	uiKind: number
	clipboard: {
		readText: () => Promise<string>
		writeText: (value: string) => Promise<void>
	}
}
