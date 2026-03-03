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

const STORAGE_KEY = "lycoris_hero_config";

function loadConfig(): HeroConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<HeroConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

interface HeroConfigContextValue {
  heroConfig: HeroConfig;
  updateHeroConfig: (partial: Partial<HeroConfig>) => void;
  resetToDefault: () => void;
}

const HeroConfigContext = createContext<HeroConfigContextValue | null>(null);

export function HeroConfigProvider({ children }: { children: ReactNode }) {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(loadConfig);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(heroConfig));
    } catch {
      // ignore
    }
  }, [heroConfig]);

  const updateHeroConfig = useCallback((partial: Partial<HeroConfig>) => {
    setHeroConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetToDefault = useCallback(() => {
    setHeroConfig(DEFAULT_CONFIG);
  }, []);

  return (
    <HeroConfigContext.Provider
      value={{ heroConfig, updateHeroConfig, resetToDefault }}
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
