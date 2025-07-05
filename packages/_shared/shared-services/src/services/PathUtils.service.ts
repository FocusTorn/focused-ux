// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import type * as nodePath from 'node:path'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IPathUtilsService } from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class PathUtilsService implements IPathUtilsService {

	private readonly _iPathJoin: typeof nodePath.join
	private readonly _iPathBasename: typeof nodePath.basename
	private readonly _iPathDirname: typeof nodePath.dirname

	constructor(
		private readonly iPathNormalize: typeof nodePath.normalize,
		private readonly iPathIsAbsolute: typeof nodePath.isAbsolute,
		private readonly iPathResolve: typeof nodePath.resolve,
		iPathDirname: typeof nodePath.dirname,
		private readonly iPathRelative: typeof nodePath.relative,
		iPathBasename: typeof nodePath.basename,
		iPathJoin: typeof nodePath.join,
		private readonly iPathExtname: typeof nodePath.extname,
	) {
		this._iPathDirname = iPathDirname
		this._iPathBasename = iPathBasename
		this._iPathJoin = iPathJoin
	}

	public santizePath( //>
		uncleanPath: string,
	): string {
		const normalPath = this.iPathNormalize(uncleanPath)
		let cleanPath = normalPath.replace(/\\/g, '/')

		cleanPath = cleanPath.replace(/\/+/g, '/')
		cleanPath = cleanPath.replace(/\/+$/, '')
		return cleanPath
	} //<

	public getNormalizedDirectory( //>
		filePath: string,
	): string {
		const isAbsolute = this.iPathIsAbsolute(filePath)
		const resolvedPath = isAbsolute ? filePath : this.iPathResolve(filePath)
		const posixPath = resolvedPath.replace(/\\/g, '/')
		const normalPath = this.iPathNormalize(posixPath)

		// Heuristic: if it has an extension, it's a file, so return its directory.
		// Otherwise, assume it's a directory. This avoids a direct file system read.
		if (this.iPathExtname(normalPath)) {
			return this._iPathDirname(normalPath)
		}

		return normalPath
	} //<

	public getDottedPath( //>
		targetPath: string,
		pointingPath: string,
	): string | null {
		try {
			const targetDirNormal = this.getNormalizedDirectory(targetPath)
			const pointingDirNormal = this.getNormalizedDirectory(pointingPath)

			let relativeDirPath = this.iPathRelative(pointingDirNormal, targetDirNormal)

			relativeDirPath = relativeDirPath.replace(/\\/g, '/')

			let finalPath: string

			// Heuristic: if the original path ends with a slash, treat it as a directory.
			const isTargetDirectoryLike = targetPath.replace(/\\/g, '/').endsWith('/')

			if (isTargetDirectoryLike) {
				if (relativeDirPath === '') {
					finalPath = './'
				}
				else {
					finalPath = relativeDirPath.endsWith('/') ? relativeDirPath : `${relativeDirPath}/`
					if (!finalPath.startsWith('.') && !finalPath.startsWith('/')) {
						finalPath = `./${finalPath}`
					}
				}
			}
			else {
				const targetBasename = this._iPathBasename(targetPath)

				if (relativeDirPath === '') {
					finalPath = `./${targetBasename}`
				}
				else {
					finalPath = this._iPathJoin(relativeDirPath, targetBasename).replace(/\\/g, '/')
					if (!finalPath.startsWith('.') && !finalPath.startsWith('/')) {
						finalPath = `./${finalPath}`
					}
				}
			}
			return finalPath
		}
		catch (error) {
			// Throw the error to be handled by the calling service.
			throw new Error(
				`Error in getDottedPath for target '${targetPath}' from '${pointingPath}': ${error}`,
			)
		}
	} //<

	public iPathJoin( //>
		...paths: string[]
	): string {
		return this._iPathJoin(...paths)
	} //<

	public iPathBasename(p: string, ext?: string): string {
		return this._iPathBasename(p, ext)
	}

	public iPathDirname(p: string): string {
		return this._iPathDirname(p)
	}

}
