import type * as vscode from 'vscode'
import type { IUriHandler, IUri } from '../../_interfaces/IVSCode.js'
import { UriAdapter } from './Uri.adapter.js'

export class UriHandlerAdapter implements IUriHandler {

	constructor(private handler: vscode.UriHandler) {}

	async handleUri(uri: IUri): Promise<void> {
		const vscodeUri = (uri as UriAdapter).uri

		await this.handler.handleUri(vscodeUri)
	}

	static create(handler: IUriHandler): vscode.UriHandler {
		return {
			handleUri: async (uri: vscode.Uri) => {
				const adapter = new UriAdapter(uri)

				await handler.handleUri(adapter)
			},
		}
	}

}
