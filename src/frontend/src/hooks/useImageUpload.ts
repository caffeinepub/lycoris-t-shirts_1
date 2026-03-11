import { loadConfig } from "@/config";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback } from "react";

/**
 * Hook that provides an uploadImages function.
 * Converts base64 data URLs to blob-storage URLs before saving to backend.
 * Non-base64 strings (already URLs) are passed through unchanged.
 * If upload fails for any image, it returns an empty string for that image
 * so the rest of the product save can proceed.
 */
export function useImageUpload() {
  const uploadBase64Image = useCallback(
    async (src: string): Promise<string> => {
      // If not a data URL, it's already a remote URL — pass through
      if (!src || !src.startsWith("data:")) return src;

      try {
        const config = await loadConfig();

        // If storage gateway is not configured, skip upload
        if (
          !config.storage_gateway_url ||
          config.storage_gateway_url === "nogateway"
        ) {
          console.warn(
            "[ImageUpload] No storage gateway configured, skipping image upload",
          );
          return "";
        }

        const agent = new HttpAgent({ host: config.backend_host });
        const client = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );

        // data:<mime>;base64,<data>
        const commaIdx = src.indexOf(",");
        const base64Data = commaIdx >= 0 ? src.slice(commaIdx + 1) : src;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { hash } = await client.putFile(bytes);
        return client.getDirectURL(hash);
      } catch (err) {
        console.error("[ImageUpload] Failed to upload image, skipping:", err);
        return ""; // Return empty string so product save can still proceed
      }
    },
    [],
  );

  const uploadImages = useCallback(
    async (images: string[]): Promise<string[]> => {
      const results = await Promise.all(images.map(uploadBase64Image));
      // Filter out empty strings from failed uploads
      return results.filter((url) => url !== "");
    },
    [uploadBase64Image],
  );

  return { uploadImages, uploadBase64Image };
}
