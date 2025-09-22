// ESLint & Imports -->>

import type { IEvent, Event } from './ILocalTypes.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IQuickSettingsService { //>
	onDidUpdateSetting: Event<{ settingId: string, value: any }>

	refresh: () => Promise<void>
	updateSettingState: (settingId: string, newState: any) => Promise<void>
	getSettingState: (settingId: string) => Promise<any>
	getHtml: (cspSource: string, nonce: string) => Promise<string>
} //<
