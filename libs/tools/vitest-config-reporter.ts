import type { Reporter } from 'vitest'

export class ConfigReporter implements Reporter {
	onInit(ctx: any) {
		console.log('\n🔍 Vitest Configuration Summary:')
		console.log('================================')
		console.log(`📁 Working Directory: ${process.cwd()}`)
		console.log(`⚙️  Config Files Loaded:`)
		
		// This will be populated by the console.log statements in config files
		// The actual config loading happens before this reporter is initialized
		console.log('   - Check console output above for loaded config files')
		console.log('================================\n')
	}

	onFinished() {
		// Optional: Add any cleanup or final reporting here
	}
}
