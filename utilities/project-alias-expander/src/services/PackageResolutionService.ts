import type { AliasConfig, PackageDefinition } from '../_types/config.types.js'

export interface PackageResolution {
    packageName: string
    alias: string
    variant?: string
    fullName: string
}

export class PackageResolutionService {
    private packageMap: Map<string, PackageDefinition> = new Map()
    private aliasMap: Map<string, string> = new Map()

    constructor(config: AliasConfig) {
        this.buildMaps(config)
    }

    resolvePackage(alias: string): PackageResolution {
        const packageName = this.aliasMap.get(alias)
        if (!packageName) {
            throw new Error(`Unknown alias: ${alias}`)
        }

        const packageDef = this.packageMap.get(packageName)

        // If packageDef is not found, this means packageName is a direct string reference (like tools)
        if (!packageDef) {
            // For direct string references, return the package name as the full name
            return {
                packageName: packageName,
                alias,
                variant: undefined,
                fullName: packageName,
            }
        }

        const variant = this.determineVariant(alias, packageDef)
        const fullName = this.buildFullName(packageName, packageDef, variant)

        return {
            packageName,
            alias,
            variant,
            fullName,
        }
    }

    private buildMaps(config: AliasConfig): void {
        Object.entries(config.nxPackages || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && 'aliases' in value) {
                // New package definition format
                const packageDef = value as PackageDefinition
                this.packageMap.set(key, packageDef)

                // Build alias mappings
                packageDef.aliases.forEach((alias) => {
                    this.aliasMap.set(alias, key)
                })

                // Build variant mappings
                Object.entries(packageDef.variants).forEach(([variant, alias]) => {
                    this.aliasMap.set(alias, key)
                })
            } else if (typeof value === 'string') {
                // Direct string reference (tools)
                this.aliasMap.set(key, value)
            } else if (typeof value === 'object' && value !== null) {
                // Handle nested object with string values (like tools section)
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (typeof subValue === 'string') {
                        this.aliasMap.set(subKey, subValue)
                    } else {
                        throw new Error(
                            `Invalid package definition format for '${key}.${subKey}'. Expected string.`
                        )
                    }
                })
            } else {
                throw new Error(
                    `Invalid package definition format for '${key}'. Expected PackageDefinition object, string, or object with string values.`
                )
            }
        })
    }

    private determineVariant(alias: string, packageDef: PackageDefinition): string | undefined {
        // Check if alias is a variant alias
        for (const [variant, variantAlias] of Object.entries(packageDef.variants)) {
            if (variantAlias === alias) {
                return variant
            }
        }

        // If not a variant alias, return the default variant
        return packageDef.default
    }

    private buildFullName(
        packageName: string,
        packageDef: PackageDefinition,
        variant?: string
    ): string {
        if (variant) {
            return `@fux/${packageName}-${variant}`
        }
        return `@fux/${packageName}`
    }

    /**
     * Validates package structure
     */
    validatePackageStructure(config: AliasConfig): string[] {
        const errors: string[] = []

        Object.entries(config.nxPackages || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && 'aliases' in value) {
                const packageDef = value as PackageDefinition

                // Validate required fields
                if (!packageDef.aliases || !Array.isArray(packageDef.aliases)) {
                    errors.push(`Package '${key}' must have aliases array`)
                }

                if (!packageDef.variants || typeof packageDef.variants !== 'object') {
                    errors.push(`Package '${key}' must have variants object`)
                }

                // Validate aliases are not empty
                if (packageDef.aliases?.length === 0) {
                    errors.push(`Package '${key}' must have at least one alias`)
                }

                // Validate variants are not empty
                if (Object.keys(packageDef.variants || {}).length === 0) {
                    errors.push(`Package '${key}' must have at least one variant`)
                }
            }
        })

        return errors
    }
}
