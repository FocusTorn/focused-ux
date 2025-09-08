/**
 * Tree formatter utility for displaying structured data
 */
export class TreeFormatter {

	/**
	 * Display structured errors in a tree format
	 */
	static displayStructuredErrors(errors: string[], title: string = 'Errors'): void {
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

}
