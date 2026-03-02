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

export class ExternalBlob {
  static fromURL(_url: string): ExternalBlob {
    return new ExternalBlob();
  }
  async getBytes(): Promise<Uint8Array> {
    return new Uint8Array();
  }
  onProgress?: (_progress: number) => void;
}

export function createActor(
  _canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  _options?: CreateActorOptions,
): Promise<backendInterface> {
  throw new Error("Backend not available in frontend-only mode");
}
