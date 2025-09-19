import { CONFIG_FILE_NAME, ERROR_MESSAGES } from "../_config/constants.js"
class PackageJsonFormattingService {

    constructor(fileSystem, yaml) {
        this.fileSystem = fileSystem
        this.yaml = yaml
    }
    async formatPackageJson(packageJsonPath, workspaceRoot) {
        const configPath = `${workspaceRoot}/${CONFIG_FILE_NAME}`
        let configContent

        try {
            configContent = await this.fileSystem.readFile(configPath)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error"

            throw new Error(`${ERROR_MESSAGES.CONFIG_FILE_NOT_FOUND}: ${errorMessage}`)
        }

        let config

        try {
            config = this.yaml.load(configContent)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error"

            throw new Error(`${ERROR_MESSAGES.CONFIG_PARSE_ERROR}: ${errorMessage}`)
        }

        const order = config?.ProjectButler?.["packageJson-order"]

        if (!order || !Array.isArray(order)) {
            throw new Error("Configuration Error: 'ProjectButler.packageJson-order' not found or invalid in '.FocusedUX'.")
        }

        const masterOrder = order.includes("name") ? order : ["name", ...order]
        let packageContent

        try {
            packageContent = await this.fileSystem.readFile(packageJsonPath)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error"

            throw new Error(`${ERROR_MESSAGES.PACKAGE_JSON_NOT_FOUND}: ${errorMessage}`)
        }

        let packageData

        try {
            packageData = JSON.parse(packageContent)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error"

            throw new Error(`${ERROR_MESSAGES.PACKAGE_JSON_PARSE_ERROR}: ${errorMessage}`)
        }

        const originalKeys = Object.keys(packageData)
        const commentKeyRegex = /=.*=$/
        const unknownKeys = []

        for (const key of originalKeys) {
            if (commentKeyRegex.test(key)) {
                continue
            }
            if (!masterOrder.includes(key)) {
                unknownKeys.push(key)
            }
        }

        const orderedPackage = {}

        for (const key of masterOrder) {
            if (Object.prototype.hasOwnProperty.call(packageData, key)) {
                orderedPackage[key] = packageData[key]
            }
        }
        for (const key of unknownKeys) {
            orderedPackage[key] = packageData[key]
        }
        for (const key of originalKeys) {
            if (commentKeyRegex.test(key)) {
                orderedPackage[key] = packageData[key]
            }
        }

        const newJsonContent = `${JSON.stringify(orderedPackage, null, 4)}
`

        try {
            await this.fileSystem.writeFile(packageJsonPath, newJsonContent)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error"

            throw new Error(`Failed to write updated package.json: ${errorMessage}`)
        }
    }
    getUnknownKeys(packageData, masterOrder) {
        const commentKeyRegex = /=.*=$/
        const unknownKeys = []

        for (const key of Object.keys(packageData)) {
            if (commentKeyRegex.test(key)) {
                continue
            }
            if (!masterOrder.includes(key)) {
                unknownKeys.push(key)
            }
        }
        return unknownKeys
    }

}
export {
    PackageJsonFormattingService
}
