#!/usr/bin/env node

/**
 * @fileoverview
 * Validates and re-orders the top-level keys of a package.json file according
 * to a master order defined in the project's `.FocusedUX` YAML config file.
 *
 * @description
 * This script enforces a consistent structure for package.json files within the monorepo.
 * It reads its configuration from `.FocusedUX` at the project root.
 *
 * It performs two main actions:
 * 1. Validation: It checks if all top-level keys in the target package.json file
 *    are present in the master ordering list from the config. If an unknown key
 *    is found, it throws a terminating error.
 * 2. Reordering: It rebuilds the package.json content, ordering the keys according
 *    to the master list.
 *
 * @requires js-yaml
 * This script requires the `js-yaml` package. Install it with `pnpm add -D -w js-yaml`.
 *
 * @example
 * // To run from the command line:
 * node ./_scripts/js/format-package-json.js ./packages/my-app/package.json
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { load as loadYaml } from 'js-yaml';
import process from "node:process"

/**
 * Reads the master key order from the `.FocusedUX` YAML file at the project root.
 * @returns {Promise<string[]>} A promise that resolves to the array of ordered keys.
 */
async function getMasterOrderFromConfig() {
    const configPath = resolve(process.cwd(), '.FocusedUX');
    let configFileContent;
    try {
        configFileContent = await readFile(configPath, 'utf-8');
    } catch (err) {
        throw new Error(`Configuration Error: Could not read '.FocusedUX' file at '${configPath}'.\n${err.message}`);
    }

    let config;
    try {
        config = loadYaml(configFileContent);
    } catch (err) {
        throw new Error(`Configuration Error: Failed to parse YAML from '.FocusedUX'.\n${err.message}`);
    }

    const order = config?.TerminalButler?.['packageJson-order'];

    if (!order) {
        throw new Error("Configuration Error: Key path 'TerminalButler.packageJson-order' not found in '.FocusedUX'.");
    }

    if (!Array.isArray(order)) {
        throw new Error("Configuration Error: 'TerminalButler.packageJson-order' must be an array in '.FocusedUX'.");
    }

    // The 'name' property is mandatory for any package.json.
    // We ensure it's always the first key, even if omitted from the config.
    if (!order.includes('name')) {
        order.unshift('name');
    }

    return order;
}


/**
 * Main function to execute the script logic.
 * @param {string} relativePath - The relative path to the package.json file.
 */
async function formatPackageJson(relativePath) {
    if (!relativePath) {
        throw new Error('Error: Path to package.json file is required.');
    }

    const masterOrder = await getMasterOrderFromConfig();
    const filePath = resolve(process.cwd(), relativePath);

    // --- Step 1: Read and Parse the package.json file ---
    let packageContent;
    try {
        packageContent = await readFile(filePath, 'utf-8');
    } catch (err) {
        throw new Error(`Error: Failed to read file at '${filePath}'.\n${err.message}`);
    }

    const packageData = JSON.parse(packageContent);
    const originalKeys = Object.keys(packageData);

    // --- Step 2: Validate that no unknown top-level keys exist ---
    const commentKeyRegex = /=.*=$/;
    for (const key of originalKeys) {
        if (commentKeyRegex.test(key)) {
            continue;
        }

        if (!masterOrder.includes(key)) {
            throw new Error(`Validation Failed: Found top-level key '${key}' in '${filePath}' which is not in the allowed ordering list defined in .FocusedUX.`);
        }
    }

    // --- Step 3: Re-order the keys into a new object ---
    const orderedPackage = {};
    for (const key of masterOrder) {
        if (Object.prototype.hasOwnProperty.call(packageData, key)) {
            orderedPackage[key] = packageData[key];
        }
    }

    for (const key of originalKeys) {
        if (commentKeyRegex.test(key)) {
            orderedPackage[key] = packageData[key];
        }
    }

    // --- Step 4: Convert back to a formatted JSON string and write to the file ---
    const newJsonContent = JSON.stringify(orderedPackage, null, 4) + '\n';

    try {
        await writeFile(filePath, newJsonContent, 'utf-8');
        console.log(`Successfully validated and re-ordered keys in '${filePath}' using order from .FocusedUX.`);
    } catch (err) {
        throw new Error(`Error: Failed to write updated content to '${filePath}'.\n${err.message}`);
    }
}

// --- Script Entry Point ---
(async () => {
    try {
        const filePathArg = process.argv[2];
        await formatPackageJson(filePathArg);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
})();


// #!/usr/bin/env node

// /**
//  * @fileoverview
//  * Validates and re-orders the top-level keys of a package.json file according
//  * to a predefined master order.
//  *
//  * @description
//  * This script enforces a consistent structure for package.json files within the monorepo.
//  * It performs two main actions:
//  * 1. Validation: It checks if all top-level keys in the target package.json file
//  *    are present in a master ordering list. If an unknown key is found, it throws
//  *    a terminating error. This check ignores special "comment" keys (e.g., "====...").
//  * 2. Reordering: It rebuilds the package.json content, ordering the keys according
//  *    to the master list, and then appends any comment keys.
//  *
//  * This ensures that all package manifests are predictable and easy to read.
//  *
//  * @example
//  * // To run from the command line:
//  * node ./_scripts/js/format-package-json.js ./packages/my-app/package.json
//  */

// import { readFile, writeFile } from 'fs/promises'
// import { resolve } from 'path'
// import process from "node:process"

// const MASTER_ORDER = [ //>
//     'name',
//     'displayName',
//     'description',
//     'publisher',
//     'repository',
//     'version',
//     'sideEffects',
//     'dependencies',
//     'devDependencies',
//     'peerDependencies',
//     'contributes',
//     'activationEvents',
//     'icon',
//     'categories',
//     'keywords',
//     'private',
//     'type',
//     'main',
//     'module',
//     'types',
//     'engines',
//     'exports',
//     'bin',
//     'scripts',
// ] //<

// /**
//  * Main function to execute the script logic.
//  * @param {string} relativePath - The relative path to the package.json file.
//  */
// async function formatPackageJson(relativePath) { //>
//     if (!relativePath) {
//         throw new Error('Error: Path to package.json file is required.')
//     }

//     const filePath = resolve(process.cwd(), relativePath)

//     // --- Step 1: Read and Parse the package.json file ---
//     let packageContent
//     try {
//         packageContent = await readFile(filePath, 'utf-8')
//     } catch (err) {
//         throw new Error(`Error: Failed to read file at '${filePath}'.\n${err.message}`)
//     }

//     const packageData = JSON.parse(packageContent)
//     const originalKeys = Object.keys(packageData)

//     // --- Step 2: Validate that no unknown top-level keys exist ---
//     const commentKeyRegex = /=.*=$/
//     for (const key of originalKeys) {
//         // Ignore special comment-like keys during validation.
//         if (commentKeyRegex.test(key)) {
//             continue
//         }

//         if (!MASTER_ORDER.includes(key)) {
//             throw new Error(
//                 `Validation Failed: Found top-level key '${key}' in '${filePath}' which is not in the allowed ordering list.`
//             )
//         }
//     }

//     // --- Step 3: Re-order the keys into a new object ---
//     const orderedPackage = {}
//     for (const key of MASTER_ORDER) {
//         // Check if the key exists in the original object before adding it.
//         if (Object.prototype.hasOwnProperty.call(packageData, key)) {
//             orderedPackage[key] = packageData[key]
//         }
//     }

//     // Add back any comment-like keys that were ignored during validation.
//     for (const key of originalKeys) {
//         if (commentKeyRegex.test(key)) {
//             orderedPackage[key] = packageData[key]
//         }
//     }

//     // --- Step 4: Convert back to a formatted JSON string and write to the file ---
//     // Using 4 spaces for indentation to match project standards.
//     const newJsonContent = JSON.stringify(orderedPackage, null, 4) + '\n'

//     try {
//         await writeFile(filePath, newJsonContent, 'utf-8')
//         console.log(`Successfully validated and re-ordered keys in '${filePath}'.`)
//     } catch (err) {
//         throw new Error(`Error: Failed to write updated content to '${filePath}'.\n${err.message}`)
//     }
// } //<

// ;(async () => {
//     try {
//         const filePathArg = process.argv[2]
//         await formatPackageJson(filePathArg)
//     } catch (error) {
//         console.error(error.message)
//         process.exit(1)
//     }
// })()


