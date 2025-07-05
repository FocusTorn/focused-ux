// ESLint & Imports -->>

//= AWILIX ====================================================================================================
import { asClass, asValue } from 'awilix'
import type { AwilixContainer } from 'awilix'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, FileType, Uri, extensions as VsCodeExtensions } from 'vscode'

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs'
import * as nodeFs from 'node:fs'
import * as nodeFsPromises from 'node:fs/promises'
import * as nodeOs from 'node:os'
import * as nodePath from 'node:path'

//= VSCODE ADAPTERS ===========================================================================================
import { CommandsAdapter } from './_vscode_adapters/Commands.adapter.js'
import { EnvAdapter } from './_vscode_adapters/Env.adapter.js'
import { WindowAdapter } from './_vscode_adapters/Window.adapter.js'
import { WorkspaceAdapter } from './_vscode_adapters/Workspace.adapter.js'

//--------------------------------------------------------------------------------------------------------------<<

/**
 * Registers foundational dependencies for a VS Code extension container.
 * This includes low-level VS Code API adapters and Node.js primitives,
 * but intentionally excludes high-level utility services.
 *
 * Utility services (`CommonUtilsService`, `FileUtilsService`, etc.) should be
 * registered explicitly by the consuming extension's own DI container setup.
 * This practice ensures that each extension has a clear and self-contained
 * dependency graph.
 *
 * @param container The awilix container to register dependencies with.
 * @param context The VS Code extension context.
 */
export function registerSharedDependencies(container: AwilixContainer, context: ExtensionContext): void { //>
	container.register({
		// VSCode API Adapters
		iCommands: asClass(CommandsAdapter).singleton(),
		iEnv: asClass(EnvAdapter).singleton(),
		iWindow: asClass(WindowAdapter).singleton(),
		iWorkspace: asClass(WorkspaceAdapter).singleton(),

		// VSCode Primitives
		extensionContext: asValue(context),
		iContext: asValue(context), // Alias for CCP
		iExtensions: asValue(VsCodeExtensions),
		vscodeUri: asValue(Uri),
		vscodeConfigurationTarget: asValue(ConfigurationTarget),
		vscodeFileType: asValue(FileType),

		// Node.js Primitives
		iFsCreateReadStream: asValue(nodeFsCreateReadStreamFunction),
		iFsReadFileSync: asValue(nodeFs.readFileSync),
		iFspStat: asValue(nodeFsPromises.stat),
		iFspReadFile: asValue(nodeFsPromises.readFile),
		iFspWriteFile: asValue(nodeFsPromises.writeFile),
		iFspReaddir: asValue(nodeFsPromises.readdir),
		iFspCopyFile: asValue(nodeFsPromises.copyFile),
		iFspAccess: asValue(nodeFsPromises.access),
		iFspMkdir: asValue(nodeFsPromises.mkdir),
		iFspRename: asValue(nodeFsPromises.rename),
		iPathDirname: asValue(nodePath.dirname),
		iPathJoin: asValue(nodePath.join),
		iPathBasename: asValue(nodePath.basename),
		iPathIsAbsolute: asValue(nodePath.isAbsolute),
		iPathResolve: asValue(nodePath.resolve),
		iPathNormalize: asValue(nodePath.normalize),
		iPathRelative: asValue(nodePath.relative),
		iPathParse: asValue(nodePath.parse),
		iPathExtname: asValue(nodePath.extname),
		iOsHomedir: asValue(nodeOs.homedir),
	})
} //<
