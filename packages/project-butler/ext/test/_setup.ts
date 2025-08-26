import * as path from 'node:path'
import Mocha from 'mocha'
import { glob } from 'glob'

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 20000,
	})

	// After compilation, __dirname will be the root of the output directory (e.g., ./out-tsc)
	const testsRoot = __dirname

	console.log(`[Test Setup] Searching for test files in: ${testsRoot}`)

	return new Promise<void>((resolve, reject) => {
		// The glob pattern is relative to the testsRoot
		glob('suite/**/*.test.js', { cwd: testsRoot }).then((files: string[]) => {
			if (files.length === 0) {
				const searchPath = path.join(testsRoot, 'suite/**/*.test.js')

				console.error(`[Test Setup] Error: No test files found matching pattern: ${searchPath}`)
				return reject(new Error('No test files found. Check compile output and glob pattern.'))
			}

			console.log(`[Test Setup] Found ${files.length} test file(s):`)
			files.forEach(f => console.log(`  - ${f}`))

			// Add files to the test suite
			files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)))

			try {
				// Run the mocha test
				mocha.run((failures: number) => {
					if (failures > 0) {
						reject(new Error(`${failures} tests failed.`))
					}
					else {
						console.log('[Test Setup] All tests passed.')
						resolve()
					}
				})
			}
			catch (err) {
				console.error('[Test Setup] Error running Mocha.', err)
				reject(err)
			}
		}).catch((err: Error) => {
			console.error('[Test Setup] Error during glob search.', err)
			reject(err)
		})
	})
}
