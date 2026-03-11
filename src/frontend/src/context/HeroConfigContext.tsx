import { useActor } from "@/hooks/useActor";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { BackendHeroConfig } from "@/types/backend-types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface HeroConfig {
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroBgImage: string;
  logoImage: string;
}

const DEFAULT_CONFIG: HeroConfig = {
  heroBadgeText: "New Collection 2026",
  heroTitle: "Wear the\nBloom",
  heroSubtitle:
    "Premium tees inspired by the ephemeral beauty of the lycoris flower.",
  heroCtaLabel: "Shop Now",
  heroBgImage: "",
  logoImage: "",
};

interface HeroConfigContextValue {
  heroConfig: HeroConfig;
  isLoading: boolean;
  updateHeroConfig: (partial: Partial<HeroConfig>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

type BackendActor = {
  getHeroConfig: () => Promise<BackendHeroConfig>;
  setHeroConfig: (
    heroBadgeText: string,
    heroTitle: string,
    heroSubtitle: string,
    heroCtaLabel: string,
    heroBgImage: string,
    logoImage: string,
  ) => Promise<void>;
};

const HeroConfigContext = createContext<HeroConfigContextValue | null>(null);

export function HeroConfigProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor();
  const { uploadBase64Image } = useImageUpload();
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    const backendActor = actor as unknown as BackendActor;
    backendActor
      .getHeroConfig()
      .then((cfg) => {
        setHeroConfig({
          heroBadgeText: cfg.heroBadgeText || DEFAULT_CONFIG.heroBadgeText,
          heroTitle: cfg.heroTitle || DEFAULT_CONFIG.heroTitle,
          heroSubtitle: cfg.heroSubtitle || DEFAULT_CONFIG.heroSubtitle,
          heroCtaLabel: cfg.heroCtaLabel || DEFAULT_CONFIG.heroCtaLabel,
          heroBgImage: cfg.heroBgImage || "",
          logoImage: cfg.logoImage || "",
        });
      })
      .catch((err) => console.warn("[HeroConfigContext] fetch failed:", err))
      .finally(() => setIsLoading(false));
  }, [actor, isFetching]);

  const updateHeroConfig = useCallback(
    async (partial: Partial<HeroConfig>): Promise<void> => {
      if (!actor) return;
      const backendActor = actor as unknown as BackendActor;
      const merged = { ...heroConfig, ...partial };

      // Upload any base64 images to blob storage before saving
      const heroBgImage = await uploadBase64Image(merged.heroBgImage);
      const logoImage = await uploadBase64Image(merged.logoImage);
      const updated = { ...merged, heroBgImage, logoImage };

      await backendActor.setHeroConfig(
        updated.heroBadgeText,
        updated.heroTitle,
        updated.heroSubtitle,
        updated.heroCtaLabel,
        updated.heroBgImage,
        updated.logoImage,
      );
      setHeroConfig(updated);
    },
    [actor, heroConfig, uploadBase64Image],
  );

  const resetToDefault = useCallback(async (): Promise<void> => {
    if (!actor) return;
    const backendActor = actor as unknown as BackendActor;
    await backendActor.setHeroConfig(
      DEFAULT_CONFIG.heroBadgeText,
      DEFAULT_CONFIG.heroTitle,
      DEFAULT_CONFIG.heroSubtitle,
      DEFAULT_CONFIG.heroCtaLabel,
      DEFAULT_CONFIG.heroBgImage,
      DEFAULT_CONFIG.logoImage,
    );
    setHeroConfig(DEFAULT_CONFIG);
  }, [actor]);

  return (
    <HeroConfigContext.Provider
      value={{ heroConfig, isLoading, updateHeroConfig, resetToDefault }}
    >
      {children}
    </HeroConfigContext.Provider>
  );
}

export function useHeroConfig() {
  const ctx = useContext(HeroConfigContext);
  if (!ctx)
    throw new Error("useHeroConfig must be used within HeroConfigProvider");
  return ctx;
}
