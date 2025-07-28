// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface ITokenizerService {
	calculateTokens: (text: string) => Promise<number>
}
