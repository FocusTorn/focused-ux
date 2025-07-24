export interface ICommands {
  executeCommand: (command: string, ...args: any[]) => Thenable<any>;
} 