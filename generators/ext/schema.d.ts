export interface ExtensionPackageGeneratorSchema {
  name: string;
  displayName: string;
  description: string;
  corePackage: string;
  directory?: string;
} 