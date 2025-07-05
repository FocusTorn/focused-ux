import type { IPathUtilsService, ICommonUtilsService } from '@fux/shared-services'
import type { StoredFragment } from '../../clipboard/_interfaces/IClipboardService.js'
import type { IImportGeneratorService } from '../_interfaces/IImportGeneratorService.js'

export class ImportGeneratorService implements IImportGeneratorService {

	private readonly deps: {
		pathUtils: IPathUtilsService
		commonUtils: ICommonUtilsService
	}

	constructor(
		deps: {
			pathUtils: IPathUtilsService
			commonUtils: ICommonUtilsService
		},
	) {
		this.deps = deps
	}

	public generate(currentFilePath: string, fragment: StoredFragment): string | undefined {
		const { text: name, sourceFilePath } = fragment
		const relativePath = this.deps.pathUtils.getDottedPath(sourceFilePath, currentFilePath)

		if (!relativePath) {
			this.deps.commonUtils.errMsg('Could not determine relative path for import.')
			return undefined
		}

		const pathWithoutExt = relativePath.replace(/\.[^/.]+$/, '')

		return `import { ${name} } from '${pathWithoutExt}.js'\n`
	}

}
