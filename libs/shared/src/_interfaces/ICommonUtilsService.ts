export interface ICommonUtilsService {
  errMsg: (message: string, error?: any) => void;
  delay: (ms: number) => Promise<void>;
} 