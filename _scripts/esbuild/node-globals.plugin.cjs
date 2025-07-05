const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill')

module.exports = NodeGlobalsPolyfillPlugin({
    process: true,
    buffer: true,
})
