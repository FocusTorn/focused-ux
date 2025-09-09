import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { assetConstants } from '../_config/dynamicons.constants.js'

// Lazy imports to avoid loading heavy dependencies when not needed
let puppeteer: any = null
let sharp: any = null

const ICON_SIZE_FOR_PNG_CONVERSION = 16
const HTML_COLUMNS = 5
const CLEANUP_TEMP_FILES = true

const ansii = {
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
	green: '\x1B[38;5;35m',
}

export class PreviewProcessor {

	/**
	 * Generate preview images from SVG icons
	 */
	async process(verbose: boolean = false): Promise<boolean> {
		// Check if preview generation is needed
		const needsGeneration = await this.checkIfPreviewGenerationNeeded()
		
		if (!needsGeneration) {
			if (!verbose) {
				console.log('✅ Preview images already exist and up to date')
				console.log('📄 Existing files:')
				console.log('   • File_icons_preview.png')
				console.log('   • Folder_icons_preview.png')
				console.log('   • Folder_Open_icons_preview.png')
			}
			console.log('\x1B[32m🖼️  Previews: All preview images already exist\x1B[0m')
			return true
		}
		
		console.log('\nCREATE ICON PREVIEW IMAGES')
		console.log(`Source directories:`)
		console.log(`  File icons: ${assetConstants.paths.fileIconsDir}`)
		console.log(`  Folder icons: ${assetConstants.paths.folderIconsDir}`)
		console.log(`  Output: ${assetConstants.paths.distPreviewImagesDir}`)
		
		return await this.generatePreviews('all', verbose)
	}

	/**
	 * Check if preview generation is needed
	 */
	private async checkIfPreviewGenerationNeeded(): Promise<boolean> {
		try {
			// Check if all three preview images exist
			const expectedFiles = [
				'File_icons_preview.png',
				'Folder_icons_preview.png',
				'Folder_Open_icons_preview.png',
			]
			
			for (const file of expectedFiles) {
				try {
					await fs.access(path.join(assetConstants.paths.distPreviewImagesDir, file))
				} catch {
					return true // Preview file doesn't exist, generation needed
				}
			}
			
			return false // All preview files exist
		} catch (_error) {
			return true // If we can't determine, assume generation is needed
		}
	}

	/**
	 * Full preview generation implementation
	 */
	private async generatePreviews(
		previewType: 'all' | 'file' | 'folder' = 'all',
		silent: boolean = false,
	): Promise<boolean> {
		const FILE_ICONS_SVG_DIR_ABS = path.resolve(process.cwd(), assetConstants.paths.fileIconsDir)
		const FOLDER_ICONS_SVG_DIR_ABS = path.resolve(process.cwd(), assetConstants.paths.folderIconsDir)
		const PNG_TEMP_ROOT_DIR_ABS = path.resolve(process.cwd(), 'temp_previews')
		const FILE_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'file_icons_png')
		const FOLDER_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_icons_png')
		const FOLDER_OPEN_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_open_icons_png')
		const HTML_OUTPUT_DIR_ABS = PNG_TEMP_ROOT_DIR_ABS
		const FINAL_IMAGE_OUTPUT_DIR_ABS = path.resolve(process.cwd(), assetConstants.paths.distPreviewImagesDir)

		const tempDirs = [PNG_TEMP_ROOT_DIR_ABS, FILE_ICONS_PNG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS]

		if (!silent)
			console.log(`├─ ${ansii.gold}Preparing Temporary Directories${ansii.none}`)
		try {
			for (const dir of tempDirs) {
				if (fsSync.existsSync(dir))
					await fs.rm(dir, { recursive: true, force: true })
				await this.createDirectory(dir, silent)
			}
			await this.createDirectory(FINAL_IMAGE_OUTPUT_DIR_ABS, silent)
			if (!silent)
				console.log(`│  └─ ${ansii.green}Success:${ansii.none} Temporary directories prepared.`)
		}
		catch (error) {
			if (!silent)
				console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Preparing temporary directories:`, error)
			return false
		}

		if (!silent)
			console.log(`├─ ${ansii.gold}Converting SVGs to PNGs for Previews${ansii.none}`)

		let success = true
		let ranAnyConversion = false

		if (previewType === 'all' || previewType === 'file') {
			const fileConversionSuccess = await this.convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FILE_ICONS_SVG_DIR_ABS, FILE_ICONS_PNG_DIR_ABS, undefined, previewType === 'file', '│  ├─', silent)

			if (!fileConversionSuccess && fsSync.existsSync(FILE_ICONS_SVG_DIR_ABS))
				success = false // Only fail if source exists but conversion fails
			if (fsSync.existsSync(FILE_ICONS_SVG_DIR_ABS))
				ranAnyConversion = true
		}
		if (previewType === 'all' || previewType === 'folder') {
			const folderConversionSuccess = await this.convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, file => !file.endsWith('-open.svg'), false, '│  ├─', silent)

			if (!folderConversionSuccess && fsSync.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
				success = false
			if (fsSync.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
				ranAnyConversion = true

			const folderOpenConversionSuccess = await this.convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS, file => file.endsWith('-open.svg'), true, '│  ├─', silent)

			if (!folderOpenConversionSuccess && fsSync.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
				success = false
			// ranAnyConversion already true if folder icons exist
		}
		if (!ranAnyConversion && !silent) {
			console.log(`│  └─ ${ansii.yellow}No relevant SVG icon source directories found to convert.${ansii.none}`)
		}

		if (!silent)
			console.log(`├─ ${ansii.gold}Generating HTML & Capturing Screenshots${ansii.none}`)

		let browser: any = null

		try {
			await this.loadDependencies()
			browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

			const page = await browser.newPage()

			if (previewType === 'all' || previewType === 'file') {
				if (!await this.generateHtmlAndScreenshot(page, 'File', FILE_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, previewType === 'file', '│  ├─', silent))
					success = false
			}
			if (previewType === 'all' || previewType === 'folder') {
				if (!await this.generateHtmlAndScreenshot(page, 'Folder', FOLDER_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, false, '│  ├─', silent))
					success = false
				if (!await this.generateHtmlAndScreenshot(page, 'Folder_Open', FOLDER_OPEN_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, true, '│  ├─', silent))
					success = false
			}
		}
		catch (error) {
			if (!silent)
				console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Puppeteer process failed:`, error)
			success = false
		}
		finally {
			if (browser)
				await browser.close()
		}

		if (CLEANUP_TEMP_FILES) {
			if (!silent)
				console.log(`├─ ${ansii.gold}Cleaning up temporary files...${ansii.none}`)
			try {
				await fs.rm(PNG_TEMP_ROOT_DIR_ABS, { recursive: true, force: true })
				if (!silent)
					console.log(`│  └─ ${ansii.green}Success:${ansii.none} Temporary files cleaned up.`)
			}
			catch (error) {
				if (!silent)
					console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} cleaning temporary files:`, error)
				// Do not mark overall success as false for cleanup failure
			}
		}
		if (!silent)
			console.log(`└─ ICON PREVIEW GENERATION (${previewType.toUpperCase()}) ${success ? 'COMPLETE' : 'FAILED'}`)
		return success
	}

	private async loadDependencies(): Promise<void> {
		if (!puppeteer) {
			const puppeteerModule = await import('puppeteer')
			puppeteer = puppeteerModule.default
		}
		if (!sharp) {
			const sharpModule = await import('sharp')
			sharp = sharpModule.default
		}
	}

	private async createDirectory(directoryPath: string, silent: boolean = false): Promise<void> {
		try {
			await fs.mkdir(directoryPath, { recursive: true })
		}
		catch (err: unknown) {
			if (err && typeof err === 'object' && 'code' in err && err.code !== 'EEXIST') {
				if (!silent)
					console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} creating directory ${path.relative(process.cwd(), directoryPath)}:`, err)
				throw err
			}
		}
	}

	private async convertSvgToPng(
		size: number,
		svgFilePath: string,
		outputPngPath: string,
		silent: boolean = false,
	): Promise<void> {
		try {
			await this.loadDependencies()
			await sharp(svgFilePath)
				.resize(size, size)
				.png()
				.toFile(outputPngPath)
		}
		catch (error) {
			if (!silent)
				console.error(`│     └─ ${ansii.red}ERROR:${ansii.none} converting ${path.basename(svgFilePath)} to PNG at ${path.relative(process.cwd(), outputPngPath)}:`, error)
			throw error
		}
	}

	private async convertSvgsToPngs(
		size: number,
		svgIconsDirAbs: string,
		pngOutputDirAbs: string,
		filter: (filename: string) => boolean = () => true,
		isLastInSection: boolean = false,
		logPrefix: string = '│  ├─',
		silent: boolean = false,
	): Promise<boolean> {
		const effectiveLogPrefix = isLastInSection ? logPrefix.replace('├', '└') : logPrefix

		if (!silent) {
			console.log(
				`${effectiveLogPrefix} Converting SVGs from ${path.relative(process.cwd(), svgIconsDirAbs)} to PNGs in ${path.relative(process.cwd(), pngOutputDirAbs)}...`,
			)
		}

		if (!fsSync.existsSync(svgIconsDirAbs)) {
			if (!silent) {
				console.log(
					`│     └─ ${ansii.yellow}WARN:${ansii.none} Source SVG directory not found: ${path.relative(process.cwd(), svgIconsDirAbs)}. Skipping.`,
				)
			}
			return false
		}

		try {
			const iconFiles = fsSync.readdirSync(svgIconsDirAbs).filter(
				(file: string) => file.endsWith('.svg') && filter(file),
			)

			if (iconFiles.length === 0) {
				if (!silent) {
					console.log(
						`│     └─ ${ansii.yellow}No matching SVG files found in ${path.relative(process.cwd(), svgIconsDirAbs)}.${ansii.none}`,
					)
				}
				return false
			}
			await this.createDirectory(pngOutputDirAbs, silent)

			const convertPromises = iconFiles.map(async (file: string) => {
				const svgFilePath = path.join(svgIconsDirAbs, file)
				const pngFileName = `${path.parse(file).name}.png`
				const outputPngPath = path.join(pngOutputDirAbs, pngFileName)

				await this.convertSvgToPng(size, svgFilePath, outputPngPath, silent)
			})

			await Promise.all(convertPromises)
			if (!silent) {
				console.log(
					`│     └─ ${ansii.green}Success:${ansii.none} Finished converting ${iconFiles.length} icons.`,
				)
			}
			return true
		}
		catch (error) {
			if (!silent) {
				console.error(
					`│     └─ ${ansii.red}ERROR:${ansii.none} during SVG to PNG conversion for ${path.relative(process.cwd(), svgIconsDirAbs)}:`,
					error,
				)
			}
			return false
		}
	}

	private generateIconCellHtml(
		_pageTitleType: string,
		pngIconsDirAbsForCell: string,
		file: string,
	): string {
		let iconName = path.parse(file).name

		iconName = iconName.replace(/-open$/, '').replace(/^folder-/, '')

		const absolutePngPath = path.join(pngIconsDirAbsForCell, file)
		const imgSrc = `file://${absolutePngPath.replace(/\\/g, '/')}`

		return `
      <td style="text-align: center; width: 40px;">
        <img src="${imgSrc}" alt="${iconName}" title="${iconName}">
      </td>
      <td style="text-align: left; vertical-align: middle; width: 100px;">${iconName}</td>
    `
	}

	private generateHtmlContent(
		pageTitleType: string,
		pngIconsDirAbs: string,
		silent: boolean = false,
	): string {
		let files: string[] = []

		try {
			if (fsSync.existsSync(pngIconsDirAbs)) {
				files = fsSync.readdirSync(pngIconsDirAbs).filter((f: string) => f.endsWith('.png'))
			}
			else if (!silent) {
				console.warn(
					`│     └─ ${ansii.yellow}WARN:${ansii.none} PNG directory not found for HTML generation: ${path.relative(process.cwd(), pngIconsDirAbs)}`,
				)
			}
		}
		catch (error) {
			if (!silent) {
				console.error(
					`│     └─ ${ansii.red}ERROR:${ansii.none} reading PNG directory ${path.relative(process.cwd(), pngIconsDirAbs)}:`,
					error,
				)
			}
		}

		const marPad = 10
		const columns = HTML_COLUMNS
		let htmlContent = `
    <!DOCTYPE html><html><head><title>${pageTitleType.replace('_', ' ')} Icons</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Hind&display=swap');
    body { background-color: #090a0c; margin: 0px; padding: 0; }
    .container { background-color: #090a0c; text-align: center; margin: ${marPad}px; width: fit-content; display: inline-block; }
    h1 { background-color: #090a0c; color: #EEEEEE; text-align: center; margin: 0 auto; padding: 0 0 10px 0; font-family: "Hind", sans-serif; }
    table { background-color: #090a0c; color: #EEEEEE; margin: 0 auto; border-collapse: collapse; }
    th, td { font-family: "Hind", sans-serif; font-weight: 400; font-style: normal; }
    th { font-size: 15px; font-weight: 600; } td { font-size: 12px; }
    th:nth-child(odd), td:nth-child(odd) { text-align: center; width: 40px; }
    th:nth-child(even), td:nth-child(even) { text-align: left; vertical-align: middle; width: 100px; }
    </style></head><body><div class="container"><h1>${pageTitleType.replace('_', ' ')} Icons</h1>
    <table><thead><tr>`

		for (let i = 0; i < columns; i++) htmlContent += `<th>Icon</th><th>Name</th>`
		htmlContent += `</tr></thead><tbody>`
		if (files.length === 0) {
			htmlContent += `<tr><td colspan="${columns * 2}">No PNG icons found in ${path.relative(process.cwd(), pngIconsDirAbs)}</td></tr>`
		}
		else {
			for (let i = 0; i < files.length; i += columns) {
				htmlContent += '<tr>'
				for (let j = 0; j < columns; j++) {
					if (i + j < files.length) {
						htmlContent += this.generateIconCellHtml(pageTitleType, pngIconsDirAbs, files[i + j])
					}
					else {
						htmlContent += '<td></td><td></td>'
					}
				}
				htmlContent += '</tr>'
			}
		}
		htmlContent += `</tbody></table></div></body></html>`
		return htmlContent
	}

	private async generateHtmlAndScreenshot(
		page: any,
		pageTitleType: string,
		pngIconsDirAbs: string,
		htmlOutputDirAbs: string,
		finalImageOutputDirAbs: string,
		isLastInSection: boolean = false,
		logPrefix: string = '│  ├─',
		silent: boolean = false,
	): Promise<boolean> {
		const htmlFilePath = path.join(htmlOutputDirAbs, `${pageTitleType}_icons.html`)
		const effectiveLogPrefix = isLastInSection ? logPrefix.replace('├', '└') : logPrefix

		try {
			if (!silent)
				console.log(`${effectiveLogPrefix} Generating HTML for ${pageTitleType} icons...`)

			const htmlContent = this.generateHtmlContent(pageTitleType, pngIconsDirAbs, silent)

			fsSync.writeFileSync(htmlFilePath, htmlContent)

			const pageUrl = `file://${htmlFilePath.replace(/\\/g, '/')}`

			if (!silent)
				console.log(`│  │  ├─ Navigating to HTML page: ${pageUrl}`)
			await page.goto(pageUrl, { waitUntil: 'load' })

			const containerElement = await page.$('.container')

			if (containerElement) {
				const outputPath = path.join(finalImageOutputDirAbs, `${pageTitleType}_icons_preview.png`)

				await containerElement.screenshot({ path: outputPath as `${string}.png` | `${string}.jpeg` | `${string}.webp` })
				if (!silent) {
					console.log(
						`│  │  └─ ${ansii.green}Success:${ansii.none} Screenshot saved: ${path.relative(process.cwd(), outputPath)}`,
					)
				}
				return true
			}
			else {
				if (!silent) {
					console.warn(
						`│  │  └─ ${ansii.yellow}WARN:${ansii.none} Could not find .container for screenshot: ${pageTitleType}`,
					)
				}
				return false
			}
		}
		catch (error) {
			if (!silent) {
				console.error(
					`│  │  └─ ${ansii.red}ERROR:${ansii.none} in generateHtmlAndScreenshot for ${pageTitleType}:`,
					error,
				)
			}
			return false
		}
	}

}
