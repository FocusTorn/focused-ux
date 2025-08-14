// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import * as readline from 'node:readline'
import type { ReadStream, createReadStream as nodeCreateReadStreamType } from 'node:fs'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFrontmatterUtilsService } from '../_interfaces/IFrontmatterUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService } from '@fux/shared'

//--------------------------------------------------------------------------------------------------------------<<

export class FrontmatterUtilsService implements IFrontmatterUtilsService {

	constructor(
		private readonly iCommonUtils: ICommonUtilsService,
		private readonly iFsCreateReadStream: typeof nodeCreateReadStreamType,
	) {}

	public async getFrontmatter(
		filePath: string,
	): Promise<{ [key: string]: string } | undefined> {
		const fileStream = this.iFsCreateReadStream(filePath, { encoding: 'utf8' })
		const fileContent = (await this.getFrontmatter_extractContent(fileStream)) ?? ''

		if (!fileContent || !fileContent.trim()) {
			return undefined // No content extracted or only whitespace
		}

		return this.getFrontmatter_parseContent(fileContent)
	}

	public async getFrontmatter_extractContent(
		fileStream: ReadStream,
	): Promise<string | undefined> {
		return new Promise((resolve) => {
			const rl = readline.createInterface({
				input: fileStream,
				crlfDelay: Infinity,
			})

			let frontmatterContent = ''
			let frontmatterStarted = false
			let lineCount = 0
			const maxHeaderLines = 50 // Arbitrary limit to prevent reading huge files
			let resolved = false // Flag to track if promise has been resolved

			const cleanupAndResolve = (value: string | undefined) => {
				if (resolved)
					return
				resolved = true

				rl.close() // Ensure readline is closed
				if (!fileStream.destroyed) {
					fileStream.destroy() // Ensure stream is destroyed
				}
				resolve(value)
			}

			fileStream.on('error', (err) => {
				this.iCommonUtils.errMsg('File stream error in getFrontmatter_extractContent', err)
				cleanupAndResolve(undefined)
			})

			rl.on('line', (line) => {
				if (resolved)
					return

				lineCount++
				if (line.trim() === '---') {
					if (frontmatterStarted) { // End of frontmatter
						cleanupAndResolve(frontmatterContent.trimEnd())
						return
					}
					else { // Start of frontmatter
						frontmatterStarted = true
					}
				}
				else if (frontmatterStarted) {
					frontmatterContent += `${line}\n`
				}
				else if (line.trim() !== '' && lineCount > 1) {
					// Non-empty line before frontmatter started (and not the first line)
					cleanupAndResolve(undefined)
					return
				}

				if (lineCount > maxHeaderLines && frontmatterStarted) {
					console.warn(`[NoteHub] Max header lines (${maxHeaderLines}) reached while parsing frontmatter.`)
					cleanupAndResolve(undefined) // Likely not valid frontmatter or too large
				}
			})

			rl.on('close', () => {
				// EOF reached. If not already resolved, it means frontmatter wasn't properly terminated or found.
				if (!resolved) {
					cleanupAndResolve(undefined)
				}
			})
		})
	}

	public getFrontmatter_validateFrontmatter(
		fileContent: string,
	): boolean {
		if (!fileContent || typeof fileContent !== 'string') {
			return false
		}

		const lines = fileContent.split(/\r?\n/)

		// Frontmatter must start with '---' on the very first line.
		if (lines.length === 0 || lines[0].trim() !== '---') {
			return false
		}

		// If the file only contains "---", it's not valid frontmatter.
		// It needs at least a closing "---".
		if (lines.length < 2) {
			return false
		}

		// Search for the closing '---'
		let frontmatterEndFound = false

		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === '---') {
				frontmatterEndFound = true
				break
			}
		}
		return frontmatterEndFound
	}

	public getFrontmatter_parseContent(
		frontmatterContent: string,
	): { [key: string]: string } {
		const result: { [key: string]: string } = {}
		const lines = frontmatterContent.split('\n')

		for (const line of lines) {
			if (!line.trim())
				continue // Skip empty lines

			const separatorIndex = line.indexOf(':')

			if (separatorIndex !== -1) {
				const key = line.slice(0, separatorIndex).trim()
				const value = line.slice(separatorIndex + 1).trim()

				if (key) { // Ensure key is not empty
					result[key] = value
				}
			}
		}
		return result
	}

}
