import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// localStorage key
const LS_STOREFRONT = "lycoris_storefront";

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

function loadConfig(): HeroConfig {
  try {
    const raw = localStorage.getItem(LS_STOREFRONT);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<HeroConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: HeroConfig): void {
  localStorage.setItem(LS_STOREFRONT, JSON.stringify(config));
}

const HeroConfigContext = createContext<HeroConfigContextValue | null>(null);

export function HeroConfigProvider({ children }: { children: ReactNode }) {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadConfig();
    setHeroConfig(stored);
    setIsLoading(false);
  }, []);

  const updateHeroConfig = useCallback(
    async (partial: Partial<HeroConfig>): Promise<void> => {
      setHeroConfig((prev) => {
        const updated = { ...prev, ...partial };
        saveConfig(updated);
        return updated;
      });
    },
    [],
  );

  const resetToDefault = useCallback(async (): Promise<void> => {
    saveConfig(DEFAULT_CONFIG);
    setHeroConfig(DEFAULT_CONFIG);
  }, []);

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
