export interface TypecheckExecutorSchema {
  /**
   * File patterns to type check
   */
  files?: string[];
  
  /**
   * Enable strict type checking
   */
  strict?: boolean;
  
  /**
   * TypeScript compilation target
   */
  target?: string;
  
  /**
   * Module resolution strategy
   */
  moduleResolution?: string;
  
  /**
   * Skip type checking of declaration files
   */
  skipLibCheck?: boolean;
  
  /**
   * Enable noImplicitAny
   */
  noImplicitAny?: boolean;
  
  /**
   * Enable noImplicitReturns
   */
  noImplicitReturns?: boolean;
  
  /**
   * Enable noImplicitThis
   */
  noImplicitThis?: boolean;
  
  /**
   * Enable noUnusedLocals
   */
  noUnusedLocals?: boolean;
  
  /**
   * Enable noUnusedParameters
   */
  noUnusedParameters?: boolean;
  
  /**
   * Enable exactOptionalPropertyTypes
   */
  exactOptionalPropertyTypes?: boolean;
  
  /**
   * Path to error message override config file
   */
  configFile?: string;
}
