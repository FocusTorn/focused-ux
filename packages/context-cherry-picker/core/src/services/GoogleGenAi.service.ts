// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IGoogleGenAiService, IGoogleGenAiCountTokensResult } from '../_interfaces/IGoogleGenAiService.js'
import { constants } from '../_config/constants.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'

//--------------------------------------------------------------------------------------------------------------<<

const GOOGLE_API_BASE_URL = 'https://generativelanguage.googleapis.com'
const COUNT_TOKENS_MODEL = 'gemini-pro'

interface GoogleApiErrorDetail {
	code: number
	message: string
	status: string
	details?: any[]
}

interface GoogleApiErrorResponse {
	error: GoogleApiErrorDetail
}

interface GoogleApiCountTokensSuccessResponse {
	totalTokens: number
}

export class GoogleGenAiService implements IGoogleGenAiService {

	constructor(
		private readonly workspace: IWorkspace,
	) {}

	async countTokens(
		text: string,
	): Promise<IGoogleGenAiCountTokensResult> {
		const apiKey = this.workspace.get(constants.extension.configKey, constants.configKeys.GOOGLE_API_KEY.substring(constants.extension.configKey.length + 1))

		if (!apiKey) {
			const apiKeyPath = constants.configKeys.GOOGLE_API_KEY

			console.warn(`[${constants.extension.nickName}] Google API Key not configured for token counting.`)
			return {
				tokens: -1,
				error: 'API_KEY_MISSING',
				errorMessage: `Google API Key not found. Please configure it in VS Code settings under '${apiKeyPath}'.`,
			}
		}

		const endpoint = `${GOOGLE_API_BASE_URL}/v1beta/models/${COUNT_TOKENS_MODEL}:countTokens?key=${apiKey}`
		const requestBody = {
			contents: [{
				parts: [{ text }],
			}],
		}

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			if (!response.ok) {
				let errorData: GoogleApiErrorResponse | undefined

				try {
					errorData = await response.json() as GoogleApiErrorResponse
				}
				catch (_e) { /* ignore */ }

				const detailedMessage = errorData?.error?.message || ''
				const errorMessage = `[${constants.extension.nickName}] Google API Error: ${response.status} ${response.statusText}. ${detailedMessage}`

				console.error(errorMessage, errorData)
				return { tokens: -1, error: 'API_ERROR', errorMessage }
			}

			const data = await response.json() as GoogleApiCountTokensSuccessResponse

			if (typeof data.totalTokens === 'number') {
				return { tokens: data.totalTokens }
			}
			else {
				const errorMessage = `[${constants.extension.nickName}] Google API Error: totalTokens not found or not a number.`

				console.error(errorMessage, data)
				return { tokens: -1, error: 'API_ERROR', errorMessage }
			}
		}
		catch (error) {
			let errorMessage = `[${constants.extension.nickName}] Network error or unexpected issue calling Google API.`

			if (error instanceof Error) {
				errorMessage += ` Details: ${error.message}`
			}
			console.error(errorMessage, error)
			return { tokens: -1, error: 'NETWORK_ERROR', errorMessage }
		}
	}

}
