import * as vscode from 'vscode'
import type { IEventEmitter } from '../../_interfaces/IVSCode.js'

export class EventEmitterAdapter<T = any> implements IEventEmitter<T> {

	private emitter: vscode.EventEmitter<T>

	constructor() {
		this.emitter = new vscode.EventEmitter<T>()
	}

	get event(): vscode.Event<T> {
		return this.emitter.event
	}

	fire(data: T): void {
		this.emitter.fire(data)
	}

	dispose(): void {
		this.emitter.dispose()
	}

}
