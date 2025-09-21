import { EventEmitter } from 'vscode'
import type { IEventEmitter } from '../../_interfaces/IVSCode.js'

export class EventEmitterAdapter<T = any> implements IEventEmitter<T> {

	private emitter: EventEmitter<T>

	constructor() {
		this.emitter = new EventEmitter<T>()
	}

	get event(): any {
		return this.emitter.event
	}

	fire(data: T): void {
		this.emitter.fire(data)
	}

	dispose(): void {
		this.emitter.dispose()
	}

	// Factory method to create from VSCode EventEmitter
	static fromVSCode<T>(vscodeEmitter: EventEmitter<T>): EventEmitterAdapter<T> {
		const adapter = new EventEmitterAdapter<T>()

		adapter.emitter = vscodeEmitter
		return adapter
	}

}
