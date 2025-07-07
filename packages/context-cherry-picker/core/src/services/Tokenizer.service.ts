import { encode } from 'gpt-tokenizer'
import type { ITokenizerService } from '../_interfaces/ITokenizerService.js'

export class TokenizerService implements ITokenizerService {

	public calculateTokens(text: string): number {
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
