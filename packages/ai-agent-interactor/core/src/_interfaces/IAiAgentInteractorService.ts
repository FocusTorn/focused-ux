export interface AiAgentData {
	code: string
	path: string
	elementChain: string[]
}

export interface IAiAgentInteractorService {
	serialize: (data: AiAgentData) => string
	deserialize: (payload: string) => AiAgentData | undefined
}
