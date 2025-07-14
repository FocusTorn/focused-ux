import type { AiAgentData, IAiAgentInteractorService } from '../_interfaces/IAiAgentInteractorService.js'

const SEPARATOR = '---FUX_AI_AGENT_SEPARATOR---'

export class AiAgentInteractorService implements IAiAgentInteractorService {

	/**
	 * Serializes the AI data into a single string for transport.
	 * Format: path 🔸 element1 ► element2<SEPARATOR>code
	 */
	public serialize(data: AiAgentData): string {
		const breadcrumb = `${data.path} 🔸 ${data.elementChain.join(' ► ')}`

		return `${breadcrumb}${SEPARATOR}${data.code}`
	}

	/**
	 * Deserializes a payload string back into structured AI data.
	 */
	public deserialize(payload: string): AiAgentData | undefined {
		const parts = payload.split(SEPARATOR)

		if (parts.length !== 2) {
			return undefined // Invalid format
		}

		const breadcrumb = parts[0].trim()
		const code = parts[1].trim()

		const crumbSplitterPos = breadcrumb.indexOf('🔸')
		const path = (crumbSplitterPos !== -1 ? breadcrumb.substring(0, crumbSplitterPos) : breadcrumb).trim()

		let elementChain: string[] = []

		if (crumbSplitterPos !== -1) {
			const elementStr = breadcrumb.substring(crumbSplitterPos + 1).trim()

			if (elementStr) {
				elementChain = elementStr.split('►').map(el => el.trim()).filter(Boolean)
			}
		}

		return {
			path,
			elementChain,
			code,
		}
	}

}
