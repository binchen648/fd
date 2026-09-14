export interface ReferenceLock {
  repository: string;
  commit: string;
  requiredFiles: string[];
}

export interface VerifiedReference {
  repository: string;
  commit: string;
  requiredFiles: string[];
  inputDigests: Record<string, string>;
}
