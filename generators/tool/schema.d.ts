export interface ToolGeneratorSchema {
  name: string;
  description: string;
  author?: string;
  version?: string;
  includeCli?: boolean;
  includeConfig?: boolean;
  includeTests?: boolean;
  dependencies?: string[];
}
