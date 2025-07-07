import type { WebviewViewProvider, WebviewView, CancellationToken } from 'vscode'
import type { IQuickSettingsService } from '@fux/context-cherry-picker-core'

function getNonce(): string {
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

export class QuickSettingsViewProvider implements WebviewViewProvider {

	private _view?: WebviewView

	constructor(private readonly service: IQuickSettingsService) {}

	public async resolveWebviewView(webviewView: WebviewView, _context: any, _token: CancellationToken) {
		this._view = webviewView

		webviewView.webview.options = {
			enableScripts: true,
		}

		webviewView.webview.onDidReceiveMessage(async (data) => {
			if (data.command === 'updateSetting') {
				await this.service.updateSettingState(data.settingId, data.value)
			}
		})

		this.service.onDidUpdateSetting(async () => {
			if (this._view) {
				this._view.webview.html = await this.service.getHtml(this._view.webview.cspSource, getNonce())
			}
		})

		webviewView.webview.html = await this.service.getHtml(webviewView.webview.cspSource, getNonce())
	}

}
