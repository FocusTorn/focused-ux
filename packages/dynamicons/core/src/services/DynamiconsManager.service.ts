// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IDynamiconsManagerService, IDynamiconsDependencies } from '../_interfaces/IDynamiconsManagerService.js'
import type { Uri } from 'vscode'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const _LOG_PREFIX = `[${dynamiconsConstants.featureName} - DC_Manager]:`

type IconAssociationType = 'file' | 'folder' | 'language'

export class DynamiconsManagerService implements IDynamiconsManagerService {

    constructor(private readonly dependencies: IDynamiconsDependencies) {}

    public async assignIconToResource(
        resourceUris: Uri[],
        iconTypeScope?: 'file' | 'folder' | 'language',
    ): Promise<void> {
        try {
            // Validate input parameters
            this.validateResourceUris(resourceUris)
            
            if (!resourceUris || resourceUris.length === 0) {
                this.dependencies.window.showWarningMessage('No resources selected for icon assignment.')
                return
            }

            // Auto-detect resource type if not specified
            let finalIconTypeScope = iconTypeScope

            if (!finalIconTypeScope) {
                finalIconTypeScope = await this.detectResourceType(resourceUris)
            }

            // Convert language type to file type for icon picker (language icons are typically file icons)
            const pickerType = finalIconTypeScope === 'language' ? 'file' : finalIconTypeScope
            const selectedIcon = await this.showAvailableIconsQuickPick(pickerType)

            if (!selectedIcon) {
                return
            }

            await this.dependencies.configService.updateCustomMappings(async (mappings) => {
                for (const resourceUri of resourceUris) {
                    const resourceName = await this.getResourceName(resourceUri)

                    if (!resourceName)
                        continue

                    const associationKey = await this.getAssociationKey(resourceName, finalIconTypeScope || 'file')

                    mappings[associationKey] = selectedIcon
                }
                return mappings
            })

            await this.regenerateAndApplyTheme()
            this.dependencies.window.showInformationMessage(`Icon assigned to ${resourceUris.length} resource(s).`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${dynamiconsConstants.errorMessages.ICON_ASSIGNMENT_FAILED}: ${errorMessage}`)
        }
    }

    public async showAvailableIconsQuickPick(
        assignableToType?: 'file' | 'folder',
        currentFilter?: (iconName: string) => boolean,
    ): Promise<string | undefined> {
        try {
            return this.dependencies.iconPicker.showAvailableIconsQuickPick(assignableToType, currentFilter)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Show available icons failed: ${errorMessage}`)
        }
    }

    public async revertIconAssignment(resourceUris: Uri[]): Promise<void> {
        try {
            // Validate input parameters
            this.validateResourceUris(resourceUris)
            
            if (!resourceUris || resourceUris.length === 0) {
                this.dependencies.window.showWarningMessage('No resources selected for icon reversion.')
                return
            }

            await this.dependencies.configService.updateCustomMappings(async (mappings) => {
                for (const resourceUri of resourceUris) {
                    const resourceName = await this.getResourceName(resourceUri)

                    if (!resourceName)
                        continue

                    // Remove mappings for all types
                    for (const type of ['file', 'folder', 'language'] as const) {
                        const associationKey = await this.getAssociationKey(resourceName, type)

                        delete mappings[associationKey]
                    }
                }
                return mappings
            })

            await this.regenerateAndApplyTheme()
            this.dependencies.window.showInformationMessage(`Icon assignments reverted for ${resourceUris.length} resource(s).`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Revert icon assignment failed: ${errorMessage}`)
        }
    }

    public async showUserIconAssignments(type: 'file' | 'folder' | 'language'): Promise<void> {
        try {
            const mappings = await this.dependencies.configService.getCustomMappings()

            if (!mappings) {
                this.dependencies.window.showInformationMessage('No custom icon assignments found.')
                return
            }

            const prefix = dynamiconsConstants.associationKeyPrefixes[type]
            const relevantMappings = Object.entries(mappings)
                .filter(([key]) =>
                    key.startsWith(prefix))
                .map(([key, value]) =>
                    ({
                        resource: key.substring(prefix.length),
                        icon: value,
                    }))

            if (relevantMappings.length === 0) {
                this.dependencies.window.showInformationMessage(`No ${type} icon assignments found.`)
                return
            }

            const message = relevantMappings
                .map(m =>
                    `${m.resource} → ${m.icon}`)
                .join('\n')

            this.dependencies.window.showInformationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Icon Assignments:\n${message}`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Show user icon assignments failed: ${errorMessage}`)
        }
    }

    public async toggleExplorerArrows(): Promise<void> {
        try {
            const currentSetting = await this.dependencies.configService.getHideArrowsSetting()
            const newSetting = !currentSetting
            
            await this.dependencies.configService.updateHideArrowsSetting(newSetting)
            await this.regenerateAndApplyTheme()
            
            const status = newSetting ? 'hidden' : 'visible'

            this.dependencies.window.showInformationMessage(`Explorer arrows are now ${status}.`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Toggle explorer arrows failed: ${errorMessage}`)
        }
    }

    public async refreshIconTheme(): Promise<void> {
        try {
            await this.regenerateAndApplyTheme()
            this.dependencies.window.showInformationMessage('Icon theme refreshed successfully.')
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Refresh icon theme failed: ${errorMessage}`)
        }
    }

    // Complex orchestration methods
    public async assignIconWithValidation(
        resourceUris: Uri[], 
        iconTypeScope?: 'file' | 'folder' | 'language'
    ): Promise<{ assigned: boolean; resourceCount: number; iconName?: string }> {
        try {
            // Step 1: Validate input parameters
            this.validateResourceUris(resourceUris)
            
            const resourceCount = resourceUris.length
            if (resourceCount === 0) {
                this.dependencies.window.showWarningMessage('No resources selected for icon assignment.')
                return { assigned: false, resourceCount: 0 }
            }

            // Step 2: Auto-detect resource type if not specified
            let finalIconTypeScope = iconTypeScope
            if (!finalIconTypeScope) {
                finalIconTypeScope = await this.detectResourceType(resourceUris)
            }

            // Step 3: Show icon picker
            const pickerType = finalIconTypeScope === 'language' ? 'file' : finalIconTypeScope
            const selectedIcon = await this.showAvailableIconsQuickPick(pickerType)

            if (!selectedIcon) {
                return { assigned: false, resourceCount }
            }

            // Step 4: Update configuration
            await this.dependencies.configService.updateCustomMappings(async (mappings) => {
                for (const resourceUri of resourceUris) {
                    const resourceName = await this.getResourceName(resourceUri)

                    if (!resourceName)
                        continue

                    const associationKey = await this.getAssociationKey(resourceName, finalIconTypeScope || 'file')
                    mappings[associationKey] = selectedIcon
                }
                return mappings
            })

            // Step 5: Regenerate and apply theme
            await this.regenerateAndApplyTheme()
            this.dependencies.window.showInformationMessage(`Icon assigned to ${resourceCount} resource(s).`)

            return { assigned: true, resourceCount, iconName: selectedIcon }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Assign icon with validation failed: ${errorMessage}`)
        }
    }

    public async revertIconWithValidation(resourceUris: Uri[]): Promise<{ reverted: boolean; resourceCount: number }> {
        try {
            // Step 1: Validate input parameters
            this.validateResourceUris(resourceUris)
            
            const resourceCount = resourceUris.length
            if (resourceCount === 0) {
                this.dependencies.window.showWarningMessage('No resources selected for icon reversion.')
                return { reverted: false, resourceCount: 0 }
            }

            // Step 2: Update configuration to remove mappings
            await this.dependencies.configService.updateCustomMappings(async (mappings) => {
                for (const resourceUri of resourceUris) {
                    const resourceName = await this.getResourceName(resourceUri)

                    if (!resourceName)
                        continue

                    // Remove mappings for all types
                    for (const type of ['file', 'folder', 'language'] as const) {
                        const associationKey = await this.getAssociationKey(resourceName, type)
                        delete mappings[associationKey]
                    }
                }
                return mappings
            })

            // Step 3: Regenerate and apply theme
            await this.regenerateAndApplyTheme()
            this.dependencies.window.showInformationMessage(`Icon assignments reverted for ${resourceCount} resource(s).`)

            return { reverted: true, resourceCount }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Revert icon with validation failed: ${errorMessage}`)
        }
    }

    public async completeIconWorkflow(
        resourceUris: Uri[], 
        operation: 'assign' | 'revert', 
        iconTypeScope?: 'file' | 'folder' | 'language'
    ): Promise<{ success: boolean; operation: string; resourceCount: number }> {
        try {
            // Step 1: Validate input parameters
            this.validateResourceUris(resourceUris)
            
            const resourceCount = resourceUris.length
            if (resourceCount === 0) {
                this.dependencies.window.showWarningMessage(`No resources selected for ${operation} operation.`)
                return { success: false, operation, resourceCount: 0 }
            }

            // Step 2: Execute the appropriate operation
            let result: { success: boolean; resourceCount: number }
            
            if (operation === 'assign') {
                const assignResult = await this.assignIconWithValidation(resourceUris, iconTypeScope)
                result = { success: assignResult.assigned, resourceCount: assignResult.resourceCount }
            } else {
                const revertResult = await this.revertIconWithValidation(resourceUris)
                result = { success: revertResult.reverted, resourceCount: revertResult.resourceCount }
            }

            return { success: result.success, operation, resourceCount: result.resourceCount }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Complete icon workflow failed: ${errorMessage}`)
        }
    }

    // Private helper methods
    private async getResourceName(resourceUri: Uri): Promise<string | undefined> {
        try {
            const stat = await this.dependencies.fileSystem.stat(resourceUri)

            if (stat.isDirectory()) {
                return this.dependencies.path.basename(resourceUri.fsPath)
            }
            else if (stat.isFile()) {
                return this.dependencies.path.basename(resourceUri.fsPath)
            }
        }
        catch (error) {
            this.dependencies.commonUtils.errMsg(`Error getting resource stats for ${resourceUri.fsPath}`, error)
        }
        return undefined
    }

    private async getAssociationKey(name: string, type: IconAssociationType): Promise<string> {
        const prefix = dynamiconsConstants.associationKeyPrefixes[type]
        return `${prefix}${name}`
    }

    private async detectResourceType(resourceUris: Uri[]): Promise<IconAssociationType> {
        try {
            // Check the first resource to determine the type
            const firstResource = resourceUris[0]
            const stat = await this.dependencies.fileSystem.stat(firstResource)

            if (stat.isDirectory()) {
                return 'folder'
            }
            else if (stat.isFile()) {
                return 'file'
            }
        }
        catch (error) {
            this.dependencies.commonUtils.errMsg(`Error detecting resource type for ${resourceUris[0]?.fsPath}`, error)
        }

        // Default to file if detection fails
        return 'file'
    }

    private async getBaseThemePath(): Promise<string> {
        return this.dependencies.path.join(this.dependencies.context.extensionPath, 'assets', 'themes', 'base.theme.json')
    }

    private async getGeneratedThemeDir(): Promise<string> {
        return this.dependencies.path.join(this.dependencies.context.extensionPath, 'assets', 'themes')
    }

    private async regenerateAndApplyTheme(): Promise<void> {
        try {
            const baseThemePath = await this.getBaseThemePath()
            const generatedThemeDir = await this.getGeneratedThemeDir()
            const userIconsDir = await this.dependencies.configService.getUserIconsDirectory()
            const customMappings = await this.dependencies.configService.getCustomMappings()
            const hideArrows = await this.dependencies.configService.getHideArrowsSetting()

            const baseThemeUri = this.dependencies.uriFactory.file(baseThemePath)
            const generatedThemeDirUri = this.dependencies.uriFactory.file(generatedThemeDir)

            const manifest = await this.dependencies.iconThemeGenerator.generateIconThemeManifest(
                baseThemeUri,
                generatedThemeDirUri,
                userIconsDir,
                customMappings,
                hideArrows,
            )

            if (!manifest) {
                throw new Error('Failed to generate icon theme manifest')
            }

            const outputPath = this.dependencies.uriFactory.file(this.dependencies.path.join(generatedThemeDir, 'dynamicons.theme.json'))

            await this.dependencies.iconThemeGenerator.writeIconThemeFile(manifest, outputPath)

            // Use command execution for theme refresh
            await this.dependencies.commands.executeCommand('workbench.action.selectIconTheme', 'vs-seti-file-icons')
            // Use a Promise-based delay instead of setTimeout for better testability
            await new Promise<void>(resolve => {
                // Use setImmediate if available, otherwise setTimeout
                if (typeof setImmediate !== 'undefined') {
                    setImmediate(() => resolve())
                } else {
                    setTimeout(() => resolve(), 25)
                }
            })
            await this.dependencies.commands.executeCommand('workbench.action.selectIconTheme', 'dynamicons-theme')
        }
        catch (error) {
            this.dependencies.commonUtils.errMsg('Failed to regenerate icon theme', error)
            this.dependencies.window.showErrorMessage('Failed to regenerate icon theme. Check the console for details.')
        }
    }

    // Private validation methods
    private validateResourceUris(resourceUris: Uri[]): void {
        if (!resourceUris) {
            throw new Error(dynamiconsConstants.errorMessages.MISSING_REQUIRED_PARAMETER)
        }
        if (!Array.isArray(resourceUris)) {
            throw new Error(dynamiconsConstants.errorMessages.INVALID_INPUT)
        }
        if (resourceUris.length === 0) {
            throw new Error(dynamiconsConstants.errorMessages.NO_RESOURCES_SELECTED)
        }
        for (const uri of resourceUris) {
            if (!uri || !uri.fsPath) {
                throw new Error(dynamiconsConstants.errorMessages.INVALID_RESOURCE_URI)
            }
        }
    }
}
