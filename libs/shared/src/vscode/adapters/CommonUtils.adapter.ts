import type { ICommonUtilsService } from '../../_interfaces/IUtilServices.js'

export class CommonUtilsAdapter implements ICommonUtilsService {

	constructor(private readonly window: any) {}

	public errMsg(message: string, _error?: any): void {
		const safeMessage = this.ensureStringAndSanitize(message)

		this.window.showErrorMessage(safeMessage)
	}

	public async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	private ensureStringAndSanitize(input: any): string { //>
		// Ensure the input is a string. If it's null/undefined, convert to empty string.
		let result = String(input ?? '')

		// Replace common non-printable ASCII characters (control characters, delete)
		// eslint-disable-next-line no-control-regex
		result = result.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

		// Normalize whitespace and newlines
		result = result.replace(/(\r\n|\n|\r)/gm, ' ')
		result = result.replace(/\s+/g, ' ')

		result = result.trim()

		return result.length > 0 ? result : 'Unknown error'
	} //<

}
