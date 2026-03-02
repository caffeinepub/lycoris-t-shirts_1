// Auto-generated stub — replaced by bindgen in full build pipeline

export type backendInterface = {
  _initializeAccessControlWithSecret: (secret: string) => Promise<void>;
  getCallerUserRole: () => Promise<{ admin: null } | { user: null } | { anonymous: null }>;
  assignCallerUserRole: (user: unknown, role: unknown) => Promise<void>;
  isCallerAdmin: () => Promise<boolean>;
};

export type CreateActorOptions = {
  agentOptions?: Record<string, unknown>;
  agent?: unknown;
  processError?: (e: unknown) => never;
};

export declare class ExternalBlob {
  static fromURL(url: string): ExternalBlob;
  getBytes(): Promise<Uint8Array>;
  onProgress?: (progress: number) => void;
}

export declare function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): Promise<backendInterface>;
