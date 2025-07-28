import type { ITokenizerService } from '../_interfaces/ITokenizerService.js'

export class TokenizerService implements ITokenizerService {

	public async calculateTokens(text: string): Promise<number> {
		if (!text) {
			return 0
		}
		try {
			const { encode } = await import('gpt-tokenizer')
			return encode(text).length
		}
		catch (_error) {
			console.error('[TokenizerService] Error using gpt-tokenizer:', _error)
			return Math.ceil(text.length / 4)
		}
	}

}
