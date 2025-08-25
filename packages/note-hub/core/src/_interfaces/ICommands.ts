export interface ICommands {
	executeCommand: (command: string, ...args: any[]) => Promise<any>
	registerCommand: (command: string, callback: (...args: any[]) => any) => { dispose: () => void }
}
