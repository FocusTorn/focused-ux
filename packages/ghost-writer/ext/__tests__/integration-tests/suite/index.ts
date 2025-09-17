import * as mocha from 'mocha'

// Global test setup for Ghost Writer integration tests
export const mochaHooks = {
    beforeAll() {
        console.log('Ghost Writer integration tests starting...')
    },
    afterAll() {
        console.log('Ghost Writer integration tests completed.')
    }
}
