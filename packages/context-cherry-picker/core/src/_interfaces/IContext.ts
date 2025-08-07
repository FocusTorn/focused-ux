// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IContext {
	globalStorageUri: string
	extensionUri: string
	subscriptions: { dispose: () => any }[]
}
