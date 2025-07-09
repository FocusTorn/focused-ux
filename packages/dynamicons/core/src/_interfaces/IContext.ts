export interface IContext {
	extensionPath: string
	subscriptions: { dispose(): any }[]
}