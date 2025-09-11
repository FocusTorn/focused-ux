/**
 * Tree formatter utility for displaying structured data
 */
export class TreeFormatter {

	/**
	 * Display simple structured errors in a tree format
	 */
	static displaySimpleErrors(errors: string[], title: string = 'Errors'): void {
		if (errors.length === 0) {
			console.log(`✅ ${title}: No errors found`)
			return
		}

		console.log(`\n❌ ${title}:`)
		console.log('─'.repeat(50))
		
		errors.forEach((error, index) => {
			const isLast = index === errors.length - 1
			const prefix = isLast ? '└── ' : '├── '

			console.log(`${prefix}${error}`)
		})
		
		console.log('─'.repeat(50))
	}

	/**
	 * Display structured warnings in a tree format
	 */
	static displayStructuredWarnings(warnings: string[], title: string = 'Warnings'): void {
		if (warnings.length === 0) {
			return
		}

		console.log(`\n⚠️  ${title}:`)
		console.log('─'.repeat(50))
		
		warnings.forEach((warning, index) => {
			const isLast = index === warnings.length - 1
			const prefix = isLast ? '└── ' : '├── '

			console.log(`${prefix}${warning}`)
		})
		
		console.log('─'.repeat(50))
	}

	/**
	 * Display structured success messages in a tree format
	 */
	static displayStructuredSuccess(messages: string[], title: string = 'Success'): void {
		if (messages.length === 0) {
			return
		}

		console.log(`\n✅ ${title}:`)
		console.log('─'.repeat(50))
		
		messages.forEach((message, index) => {
			const isLast = index === messages.length - 1
			const prefix = isLast ? '└── ' : '├── '

			console.log(`${prefix}${message}`)
		})
		
		console.log('─'.repeat(50))
	}

	/**
	 * Display file tree structure
	 */
	static displayFileTree(files: string[], title: string = 'Files'): void {
		if (files.length === 0) {
			console.log(`📁 ${title}: No files found`)
			return
		}

		console.log(`\n📁 ${title}:`)
		console.log('─'.repeat(50))
		
		files.forEach((file, index) => {
			const isLast = index === files.length - 1
			const prefix = isLast ? '└── ' : '├── '

			console.log(`${prefix}${file}`)
		})
		
		console.log('─'.repeat(50))
	}

	/**
	 * Display statistics in a structured format
	 */
	static displayStatistics(stats: Record<string, number>, title: string = 'Statistics'): void {
		console.log(`\n📊 ${title}:`)
		console.log('─'.repeat(50))
		
		const entries = Object.entries(stats)

		entries.forEach(([key, value], index) => {
			const isLast = index === entries.length - 1
			const prefix = isLast ? '└── ' : '├── '

			console.log(`${prefix}${key}: ${value}`)
		})
		
		console.log('─'.repeat(50))
	}

	/**
	 * Display structured errors with detailed categorization (compatible with original audit scripts)
	 */
	static displayStructuredErrors(
		themeErrors: string[],
		orphanedFileIcons: string[],
		orphanedFolderIcons: string[],
		orphanedLanguageIcons: string[],
		duplicateFileIcons: string[],
		duplicateFolderIcons: string[],
		duplicateLanguageIcons: string[],
		duplicateFileAssignments: string[],
		duplicateFolderAssignments: string[],
		orphanedFileAssignments: string[],
		orphanedFolderAssignments: string[],
		orphanedLanguageAssignments: string[],
		invalidLanguageIds: string[],
		errorTitle: string = 'MODEL ERRORS',
		sectionTitles?: {
			assignedIconNotFound: string
			duplicateAssignment: string
			unassignedIcon: string
			duplicateAssignmentId: string
		},
	): void {
		// Display theme errors (if any)
		if (themeErrors.length > 0) {
			console.log(`\n❌ THEME ERRORS (${themeErrors.length}):`)
			themeErrors.forEach((error, index) => {
				const prefix = index === themeErrors.length - 1 ? '└─' : '├─'
				console.log(`   ${prefix} ${error}`)
			})
		}

		// Calculate total model errors
		const totalModelErrors = orphanedFileIcons.length + orphanedFolderIcons.length
			+ duplicateFileIcons.length + duplicateFolderIcons.length
			+ duplicateLanguageIcons.length + duplicateFileAssignments.length + duplicateFolderAssignments.length
			+ orphanedFileAssignments.length + orphanedFolderAssignments.length
			+ orphanedLanguageAssignments.length + invalidLanguageIds.length
		

		if (totalModelErrors > 0) {
			// Create tree structure with all error categories as branches
			this.displayErrorTree(
				orphanedFileIcons,
				orphanedFolderIcons,
				orphanedLanguageIcons,
				duplicateFileIcons,
				duplicateFolderIcons,
				duplicateLanguageIcons,
				duplicateFileAssignments,
				duplicateFolderAssignments,
				orphanedFileAssignments,
				orphanedFolderAssignments,
				orphanedLanguageAssignments,
				invalidLanguageIds,
				errorTitle,
				sectionTitles
			)
		}
	}

	/**
	 * Display a category of errors
	 */
	private static displayErrorCategory(errors: string[], title: string): void {
		if (errors.length === 0) return

		console.log(`\n   ${title} (${errors.length}):`)
		errors.forEach((error, index) => {
			const prefix = index === errors.length - 1 ? '└─' : '├─'
			console.log(`      ${prefix} ${error}`)
		})
	}

	/**
	 * Display error tree with proper structure and descriptions
	 */
	private static displayErrorTree(
		orphanedFileIcons: string[],
		orphanedFolderIcons: string[],
		orphanedLanguageIcons: string[],
		duplicateFileIcons: string[],
		duplicateFolderIcons: string[],
		duplicateLanguageIcons: string[],
		duplicateFileAssignments: string[],
		duplicateFolderAssignments: string[],
		orphanedFileAssignments: string[],
		orphanedFolderAssignments: string[],
		orphanedLanguageAssignments: string[],
		invalidLanguageIds: string[],
		errorTitle: string,
		sectionTitles?: {
			assignedIconNotFound: string
			duplicateAssignment: string
			unassignedIcon: string
			duplicateAssignmentId: string
		},
	): void {
		// Calculate total errors
		const totalErrors = orphanedFileIcons.length + orphanedFolderIcons.length
			+ duplicateFileIcons.length + duplicateFolderIcons.length
			+ duplicateLanguageIcons.length + duplicateFileAssignments.length + duplicateFolderAssignments.length
			+ orphanedFileAssignments.length + orphanedFolderAssignments.length
			+ orphanedLanguageAssignments.length + invalidLanguageIds.length

		// Header
		console.log(`\n❌ ${errorTitle} (${totalErrors})`)

		// Build error categories with descriptions in the specified order
		const errorCategories = [
			{
				items: orphanedFileIcons,
				title: 'FILE ICONS: UNUSED ICON',
				description: 'File icon file with no assignment',
				hasItems: orphanedFileIcons.length > 0
			},
			{
				items: duplicateFileIcons,
				title: 'FILE ICONS: DUPLICATE ASSIGNMENT',
				description: 'File icon is used multiple times in model',
				hasItems: duplicateFileIcons.length > 0
			},
			{
				items: duplicateFileAssignments,
				title: 'FILE ICONS: DUPLICATE ASSIGNMENT',
				description: 'File assignment is used multiple times in model',
				hasItems: duplicateFileAssignments.length > 0
			},
			{
				items: orphanedFileAssignments,
				title: 'FILE ICONS: NO ASSIGNMENT',
				description: 'File icon in model but file does not exist',
				hasItems: orphanedFileAssignments.length > 0
			},
			{
				items: orphanedFolderIcons,
				title: 'FOLDER ICONS: UNUSED ICON',
				description: 'Folder icon file with no assignment',
				hasItems: orphanedFolderIcons.length > 0
			},
			{
				items: duplicateFolderIcons,
				title: 'FOLDER ICONS: DUPLICATE ASSIGNMENT',
				description: 'Folder icon is used multiple times in model',
				hasItems: duplicateFolderIcons.length > 0
			},
			{
				items: duplicateFolderAssignments,
				title: 'FOLDER ICONS: DUPLICATE ASSIGNMENT',
				description: 'Folder assignment is used multiple times in model',
				hasItems: duplicateFolderAssignments.length > 0
			},
			{
				items: orphanedFolderAssignments,
				title: 'FOLDER ICONS: NO ASSIGNMENT',
				description: 'Folder icon in model but file does not exist',
				hasItems: orphanedFolderAssignments.length > 0
			},
			{
				items: duplicateLanguageIcons,
				title: 'LANGUAGE ICONS: DUPLICATE ID',
				description: 'Language ID is used multiple times in model',
				hasItems: duplicateLanguageIcons.length > 0
			},
			{
				items: orphanedLanguageAssignments,
				title: 'LANGUAGE ICONS: NO ASSIGNMENT',
				description: 'Language icon in model but file does not exist',
				hasItems: orphanedLanguageAssignments.length > 0
			}
		]

		// Filter out empty categories
		const nonEmptyCategories = errorCategories.filter(category => category.hasItems)

		// Display tree structure
		nonEmptyCategories.forEach((category, categoryIndex) => {
			const isLastCategory = categoryIndex === nonEmptyCategories.length - 1
			const categoryPrefix = isLastCategory ? '└── ' : '├── '
			
			// Display category header with description (if provided)
			const categoryHeader = category.description 
				? `${category.title} (${category.items.length}) - ${category.description}`
				: `${category.title} (${category.items.length})`
			console.log(`${categoryPrefix}${categoryHeader}`)
			
			// Display items under category
			category.items.forEach((item, itemIndex) => {
				const isLastItem = itemIndex === category.items.length - 1
				const itemPrefix = isLastCategory 
					? (isLastItem ? '    └── ' : '    ├── ')
					: (isLastItem ? '│   └── ' : '│   ├── ')
				
				console.log(`${itemPrefix}${item}`)
			})
		})
	}

}
