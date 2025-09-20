import type { StoredFragment } from '../_interfaces/IClipboardService.js'
import type { IImportGeneratorService } from '../_interfaces/IImportGeneratorService.js'
import type { IPathUtilsService, ICommonUtilsService } from '../_interfaces/IUtilServices.js'

export class ImportGeneratorService implements IImportGeneratorService {

    constructor(
        private readonly pathUtils: IPathUtilsService,
        private readonly commonUtils: ICommonUtilsService,
    ) {}

    public generate(currentFilePath: string, fragment: StoredFragment): string | undefined {
        const { text: name, sourceFilePath } = fragment
        const relativePath = this.pathUtils.getDottedPath(sourceFilePath, currentFilePath)

        if (!relativePath) {
            this.commonUtils.errMsg('Could not determine relative path for import.')
            return undefined
        }

        const pathWithoutExt = relativePath.replace(/\.[^/.]+$/, '')

        return `import { ${name} } from '${pathWithoutExt}.js'\n`
    }

}
