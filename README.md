# F-UX: Ghost Writer

Dynamically generate frequently used code snippets and statements to accelerate your development workflow.

## Features

- **Store & Import**: Select a piece of code (like a class or function name), store it, and later generate a relative import statement for it in another file.
- **Dynamic Console Logs**: Select a variable and instantly generate a detailed `console.log` statement that includes the variable's name and, optionally, its enclosing class and function name.

### Commands

- **[F-UX] Ghost Writer: Store Code Fragment**: Stores the selected text and its source file path.
- **[F-UX] Ghost Writer: Insert Import Statement**: Inserts an import statement for the stored fragment.
- **[F-UX] Ghost Writer: Log Selected Variable**: Generates a `console.log` for the selected variable.

## Configuration

- `fux-ghost-writer.consoleLogger.includeClassName`: Include the enclosing class name in the log message. (Default: `true`)
- `fux-ghost-writer.consoleLogger.includeFunctionName`: Include the enclosing function name in the log message. (Default: `true`)

## License

This project is licensed under the MIT License.
