import { color } from './helpers.js'

// Error collection for grouping -------------------------->>
export interface ErrorGroup { //>
	[key: string]: string[]
} //<

export const errors: ErrorGroup = {}

export function addError(category: string, message: string) { //>
	if (!errors[category]) {
		errors[category] = []
	}
	errors[category].push(message)
} //<

export function printGroupedErrors() { //>
	const sectionTitle = 179
	const filePath = 38
	const parentheses = 37

	if (Object.keys(errors).length === 0) {
		console.log(`${color(40)}Feature structure audit passed.\x1B[0m`)
		return
	}

	// Define priority order for error categories
	const priorityOrder = [
		'Unused Dependency',
		'Missing Runtime Dependency',
		'Incorrect Runtime Dependency Placement',
		'Missing Dependency',
		'Incorrect Dependency Placement',
		'Forbidden dependency',
		'Missing required file',
		'Disallowed dynamic import',
		'Invalid Externals',
		'Inconsistent Externals',
		'Missing Target',
		'Obsolete Target',
		'Incorrect Command',
		'Target extends',
		'Invalid executor',
		'Missing build target',
		'Missing targets',
		'Incorrect tsconfig.lib.json paths',
		'Invalid tsconfig.json',
		'Invalid tsconfig structure',
		'Invalid tsconfig references',
		'Missing \'composite: true\'',
		'Missing tsconfig.json',
		'Missing VSCode engine',
		'Invalid VSCode engine version',
		'Outdated VSCode engine version',
		'Missing version',
		'Improper semver format',
		'JSON Read Error'
	]

	// Get all categories and sort them by priority
	const allCategories = Object.keys(errors)
	const sortedCategories = allCategories.sort((a, b) => {
		const aIndex = priorityOrder.indexOf(a)
		const bIndex = priorityOrder.indexOf(b)
		
		// If both are in priority order, sort by their position
		if (aIndex !== -1 && bIndex !== -1) {
			return aIndex - bIndex
		}
		
		// If only one is in priority order, prioritize it
		if (aIndex !== -1) return -1
		if (bIndex !== -1) return 1
		
		// If neither is in priority order, sort alphabetically
		return a.localeCompare(b)
	})

	for (const category of sortedCategories) {
		const messages = errors[category]
		console.log(`${color(sectionTitle)}${category}:\x1B[0m`)
		for (const message of messages) {
			// Colorize file paths in specific blue and make parentheses brighter
			let colorizedMessage = message.replace(/([a-zA-Z0-9\/\\\-_\.]+\.(json|ts|js|md))/g, `${color(filePath)}$1\x1B[0m`)

			// Make parentheses brighter (light gray)
			colorizedMessage = colorizedMessage.replace(/(\([^)]+\))/g, `\x1B[${parentheses}m$1\x1B[0m`)
			console.log(`    ${colorizedMessage}`)
		}
		console.log()
	}
} //<