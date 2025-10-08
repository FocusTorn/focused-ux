import process from 'node:process'
// import chalk from 'chalk'
import ora from 'ora'

const spinner = ora({ //>
    discardStdin: false,
    text: 'Loading unicorns, not discarding stdin',
    spinner: process.argv[2],
}) //<
const spinnerDiscardingStdin = ora({ //>
    text: 'Loading unicorns',
    spinner: process.argv[2],
}) //<

setTimeout(() => {

    spinnerDiscardingStdin.start()
    spinnerDiscardingStdin.succeed("Immediate Success!")

}, 1000)

setTimeout(() => {

    spinnerDiscardingStdin.start()

}, 2000)

setTimeout(() => {

    spinnerDiscardingStdin.succeed("2 second success")
    spinner.start()

}, 4000)

setTimeout(() => {

    spinner.spinner = 'dots2'
    spinner.text = 'dots2 used'
    
}, 7000)

setTimeout(() => {

    spinner.indent = 0
    spinner.spinner = 'dotsCircle'
    spinner.text = 'dotsCircle used'

}, 10000)

// setTimeout(() => {

//     spinner.indent = 0
//     spinner.spinner = 'dots2'
//     spinner.text = 'dots2 used'

// }, 9000)

// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.indent = 0
//     spinner.spinner = 'dots2'
//     spinner.text = 'dots2 used'

// }, 3000)
// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.indent = 0
//     spinner.spinner = 'dots2'
//     spinner.text = 'dots2 used'

// }, 3000)

// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.color = 'yellow'
//     spinner.text = `Loading ${chalk.red('rainbows')}`

// }, 3000)

// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.prefixText = chalk.dim('[info]')
//     spinner.spinner = 'dots'
//     spinner.text = 'Loading with prefix text'

// }, 3000)
// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.prefixText = ''
//     spinner.suffixText = chalk.dim('[info]')
//     spinner.text = 'Loading with suffix text'

// }, 3000)
// await new Promise(resolve => setTimeout(resolve, 2000))

// setTimeout(() => {

//     spinner.prefixText = chalk.dim('[info]')
//     spinner.suffixText = chalk.dim('[info]')
//     spinner.text = 'Loading with prefix and suffix text'

// }, 3000)

// setTimeout(() => {

//     spinner.color = 'green'
//     spinner.indent = 2
//     spinner.text = 'Loading with indent'

// }, 3000)

// await new Promise(resolve => setTimeout(resolve, 2000))
