import type { Event } from '../_interfaces/IEvent.js'

export class EventEmitterAdapter<T> {

	private listeners: Array<(e: T) => void> = []

	get event(): Event<T> {
		return (listener: (e: T) => void) => {
			this.listeners.push(listener)
			return {
				dispose: () => {
					const index = this.listeners.indexOf(listener)

					if (index > -1) {
						this.listeners.splice(index, 1)
					}
				},
			}
		}
	}

	fire(e: T): void {
		this.listeners.forEach(listener => listener(e))
	}

	dispose(): void {
		this.listeners = []
	}

}
