#!/usr/bin/env node

import { runChangeDetection } from './change-detector'

// Simple wrapper to run change detection
async function main() {
	try {
		await runChangeDetection()
	} catch (error) {
		console.error('Change detection failed:', error)
		process.exit(1)
	}
}

main()
