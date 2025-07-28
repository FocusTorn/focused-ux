export interface IWindow {
  showInformationMessage: (message: string, ...items: string[]) => Promise<string | undefined>;
  showWarningMessage: (message: string, options?: { modal?: boolean }, ...items: any[]) => Promise<any>;
  showErrorMessage: (message: string, ...items: string[]) => Promise<string | undefined>;
  showInputBox: (options: any) => Promise<string | undefined>;
  showTextDocument: (doc: any) => Promise<any>;
  createTreeView: (viewId: string, options: any) => any;
  withProgress: (options: any, task: () => Promise<any>) => Promise<any>;
} 