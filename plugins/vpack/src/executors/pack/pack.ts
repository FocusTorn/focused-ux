import { PromiseExecutor } from '@nx/devkit'
import { PackExecutorSchema } from './schema'

const runExecutor: PromiseExecutor<PackExecutorSchema> = async (options) => {
    console.log('Executor ran for Pack', options)
    return {
        success: true,
    }
}

export default runExecutor
