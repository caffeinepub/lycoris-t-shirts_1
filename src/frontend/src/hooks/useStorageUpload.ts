import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useRef } from "react";
import { StorageClient } from "../utils/StorageClient";

const DEFAULT_STORAGE_GATEWAY_URL = "https://blob.caffeine.ai";
const DEFAULT_BUCKET_NAME = "default-bucket";

interface JsonConfig {
  backend_canister_id: string;
  project_id: string;
}

async function buildStorageClient(): Promise<StorageClient> {
  const backendCanisterId = process.env.CANISTER_ID_BACKEND as string;
  const envBaseUrl = process.env.BASE_URL || "/";
  const baseUrl = envBaseUrl.endsWith("/") ? envBaseUrl : `${envBaseUrl}/`;

  let canisterId = backendCanisterId;
  let projectId = "0000000-0000-0000-0000-000000000000";
  let storageGatewayUrl = DEFAULT_STORAGE_GATEWAY_URL;

  try {
    const response = await fetch(`${baseUrl}env.json`);
    const config = (await response.json()) as JsonConfig;
    if (
      config.backend_canister_id &&
      config.backend_canister_id !== "undefined"
    ) {
      canisterId = config.backend_canister_id;
    }
    if (config.project_id && config.project_id !== "undefined") {
      projectId = config.project_id;
    }
  } catch {
    // Use defaults
  }

  const overrideGateway = process.env.STORAGE_GATEWAY_URL;
  if (overrideGateway && overrideGateway !== "nogateway") {
    storageGatewayUrl = overrideGateway;
  }

  const agent = new HttpAgent({ verifyQuerySignatures: false });
  await agent.fetchRootKey().catch(() => {});

  return new StorageClient(
    DEFAULT_BUCKET_NAME,
    storageGatewayUrl,
    canisterId,
    projectId,
    agent,
  );
}

/**
 * Hook to upload images via Caffeine blob storage.
 * Returns an `uploadImage` function that takes a File and returns a public URL.
 */
export function useStorageUpload() {
  const clientRef = useRef<StorageClient | null>(null);
  const clientPromiseRef = useRef<Promise<StorageClient> | null>(null);

  const getClient = useCallback(async (): Promise<StorageClient> => {
    if (clientRef.current) return clientRef.current;
    if (!clientPromiseRef.current) {
      clientPromiseRef.current = buildStorageClient().then((c) => {
        clientRef.current = c;
        return c;
      });
    }
    return clientPromiseRef.current;
  }, []);

  /**
   * Upload a single File to blob storage and return a public HTTP URL.
   */
  const uploadImage = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
      const client = await getClient();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes, onProgress);
      const url = await client.getDirectURL(hash);
      return url;
    },
    [getClient],
  );

  return { uploadImage };
}
