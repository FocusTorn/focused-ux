import * as path from 'node:path'
import Mocha from 'mocha'
import { glob } from 'glob'

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 15000, // Increased timeout for integration tests
		reporter: 'spec', // Use spec reporter for better output
	})

	const testsRoot = __dirname

	return new Promise((c, e) => {
		glob('*.test.js', { cwd: testsRoot })
			.then((files) => {
				console.log('Found test files:', files)
				// Add files to the test suite
				files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)))

				try {
					// Run the mocha test
					mocha.run((failures: number) => {
						console.log(`Mocha run completed with ${failures} failures`)
						if (failures > 0) {
							e(new Error(`${failures} tests failed.`))
						}
						else {
							c()
						}
					})
				}
				catch (err) {
					console.error('Error in mocha.run:', err)
					e(err)
				}
			})
			.catch((err) => {
				console.error('Error in glob:', err)
				e(err)
			})
	})
}
