// ESLint & Imports -->>

import type { IFileUtilsService } from '../_interfaces/IFileUtilsService.js'

//--------------------------------------------------------------------------------------------------------------<<

export class FileUtilsService implements IFileUtilsService {
	public formatFileSize(bytes: number): string {
		if (bytes < 1024)
			return `${bytes} B`

		const kb = bytes / 1024
		if (kb < 1024)
			return `${kb.toFixed(2)} KB`

		return `${(kb / 1024).toFixed(2)} MB`
	}
}