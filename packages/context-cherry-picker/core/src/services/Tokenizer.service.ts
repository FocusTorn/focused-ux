import type { ITokenizerService } from '../_interfaces/ITokenizerService.js'
import { encode } from 'gpt-tokenizer'

export class TokenizerService implements ITokenizerService {

	public async calculateTokens(text: string): Promise<number> {
		if (!text) {
			return 0
		}
		try {
			return encode(text).length
		}
		catch (_error) {
			console.error('[TokenizerService] Error using gpt-tokenizer:', _error)
			return Math.ceil(text.length / 4)
		}
	}

}
