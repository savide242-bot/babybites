import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BabyProfile, BabyAgeCategory, BabyProfileContextType } from "@/types/babyProfile";
import { toast } from "sonner";

const LOCAL_STORAGE_PREFIX = "babybites_babies_";
const ACTIVE_BABY_KEY_PREFIX = "babybites_active_baby_";

export const calculateMonthsFromBirthDate = (birthDateStr: string): number => {
  if (!birthDateStr) return 6;
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return 6;
    const now = new Date();
    const months = Math.floor((now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(60, months));
  } catch {
    return 6;
  }
};

export const getCategoryFromMonths = (months: number): BabyAgeCategory => {
  if (months <= 8) return "6-8 months";
  if (months <= 11) return "9-11 months";
  if (months <= 23) return "12-23 months";
  return "24+ months";
};

const BabyProfileContext = createContext<BabyProfileContextType | undefined>(undefined);

export const BabyProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load babies from Supabase profile and local cache
  const loadBabies = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUid = user?.id || "guest";
      setUserId(user?.id || null);

      const localListKey = `${LOCAL_STORAGE_PREFIX}${currentUid}`;
      const localActiveKey = `${ACTIVE_BABY_KEY_PREFIX}${currentUid}`;

      let loadedBabies: BabyProfile[] = [];
      let savedActiveId: string | null = null;

      // Try local storage first for instant render
      try {
        const rawLocal = localStorage.getItem(localListKey);
        if (rawLocal) loadedBabies = JSON.parse(rawLocal);
        savedActiveId = localStorage.getItem(localActiveKey);
      } catch (e) {
        console.warn("Failed reading local baby profiles:", e);
      }

      // If user is logged in, sync with Supabase profiles
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("baby_name, baby_birth_date, bio")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          // Check if bio contains structured JSON with babies array
          let cloudBabies: BabyProfile[] = [];
          let cloudActiveId: string | null = null;
          if (profile.bio) {
            try {
              const parsedBio = JSON.parse(profile.bio);
              if (Array.isArray(parsedBio.babies)) {
                cloudBabies = parsedBio.babies;
                cloudActiveId = parsedBio.activeBabyId || null;
              }
            } catch {
              // bio is plain text, ignore
            }
          }

          if (cloudBabies.length > 0) {
            loadedBabies = cloudBabies;
            if (cloudActiveId) savedActiveId = cloudActiveId;
          } else if (loadedBabies.length === 0) {
            // First time migration: if single baby exists in profiles, create primary baby
            const primaryName = profile.baby_name || "Meu Bebé";
            const primaryBirth = profile.baby_birth_date || new Date().toISOString().split("T")[0];
            loadedBabies = [
              {
                id: "baby-primary",
                name: primaryName,
                birthDate: primaryBirth,
                gender: "other",
                avatarEmoji: "👶",
                isDefault: true,
                createdAt: new Date().toISOString(),
              },
            ];
            savedActiveId = "baby-primary";
          }
        }
      }

      // Fallback if empty (e.g. guest or new user)
      if (loadedBabies.length === 0) {
        loadedBabies = [
          {
            id: "baby-default",
            name: "Meu Bebé",
            birthDate: new Date().toISOString().split("T")[0],
            avatarEmoji: "👶",
            isDefault: true,
            createdAt: new Date().toISOString(),
          },
        ];
        savedActiveId = "baby-default";
      }

      // Validate active id
      const validActiveId = loadedBabies.some((b) => b.id === savedActiveId)
        ? savedActiveId
        : loadedBabies[0]?.id || null;

      setBabies(loadedBabies);
      setActiveBabyId(validActiveId);

      // Save to localStorage
      try {
        localStorage.setItem(localListKey, JSON.stringify(loadedBabies));
        if (validActiveId) localStorage.setItem(localActiveKey, validActiveId);
      } catch {
        // Ignore
      }
    } catch (err) {
      console.error("Error loading baby profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBabies();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadBabies();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadBabies]);

  // Active Baby Derived State
  const activeBaby = useMemo(() => {
    return babies.find((b) => b.id === activeBabyId) || babies[0] || null;
  }, [babies, activeBabyId]);

  const activeBabyAgeMonths = useMemo(() => {
    if (!activeBaby?.birthDate) return 6;
    return calculateMonthsFromBirthDate(activeBaby.birthDate);
  }, [activeBaby]);

  const activeBabyAgeCategory = useMemo(() => {
    return getCategoryFromMonths(activeBabyAgeMonths);
  }, [activeBabyAgeMonths]);

  // Persist babies to Supabase bio + localStorage
  const persistBabies = async (
    updatedBabies: BabyProfile[],
    newActiveId: string | null
  ) => {
    const currentUid = userId || "guest";
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${currentUid}`, JSON.stringify(updatedBabies));
      if (newActiveId) {
        localStorage.setItem(`${ACTIVE_BABY_KEY_PREFIX}${currentUid}`, newActiveId);
      }
    } catch {
      // Ignore
    }

    if (userId) {
      try {
        const activeItem = updatedBabies.find((b) => b.id === newActiveId) || updatedBabies[0];
        const bioData = JSON.stringify({
          babies: updatedBabies,
          activeBabyId: newActiveId,
        });

        // Update profiles table: sync active baby name & birth_date so ALL legacy components update
        await supabase
          .from("profiles")
          .update({
            baby_name: activeItem?.name || null,
            baby_birth_date: activeItem?.birthDate || null,
            bio: bioData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch (err) {
        console.warn("Could not sync baby profiles to Supabase:", err);
      }
    }
  };

  // Switch Active Baby
  const selectBaby = async (id: string) => {
    const target = babies.find((b) => b.id === id);
    if (!target) return;

    setActiveBabyId(id);
    await persistBabies(babies, id);

    // Broadcast event across app
    window.dispatchEvent(
      new CustomEvent("babybites_baby_switched", {
        detail: { babyId: id, baby: target },
      })
    );

    toast.success(`✨ Perfil alternado para ${target.name}!`, {
      description: `Idade: ${calculateMonthsFromBirthDate(target.birthDate)} meses. Planos e refeições atualizados.`,
    });
  };

  // Add a new baby
  const addBaby = async (
    babyData: Omit<BabyProfile, "id" | "createdAt">
  ): Promise<BabyProfile> => {
    const newBaby: BabyProfile = {
      ...babyData,
      id: `baby-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedBabies = [...babies, newBaby];
    setBabies(updatedBabies);
    setActiveBabyId(newBaby.id);

    await persistBabies(updatedBabies, newBaby.id);

    window.dispatchEvent(
      new CustomEvent("babybites_baby_switched", {
        detail: { babyId: newBaby.id, baby: newBaby },
      })
    );

    toast.success(`👶 Bebé ${newBaby.name} cadastrado com sucesso!`, {
      description: "Agora podes alternar e gerar planos para este perfil.",
    });

    return newBaby;
  };

  // Update existing baby
  const updateBaby = async (id: string, updates: Partial<BabyProfile>) => {
    const updatedBabies = babies.map((b) => {
      if (b.id === id) {
        return { ...b, ...updates };
      }
      return b;
    });

    setBabies(updatedBabies);
    await persistBabies(updatedBabies, activeBabyId);
    toast.success("Perfil do bebé atualizado!");
  };

  // Delete baby
  const deleteBaby = async (id: string) => {
    if (babies.length <= 1) {
      toast.error("Você deve manter pelo menos um perfil de bebé.");
      return;
    }

    const updatedBabies = babies.filter((b) => b.id !== id);
    const nextActiveId = activeBabyId === id ? updatedBabies[0].id : activeBabyId;

    setBabies(updatedBabies);
    setActiveBabyId(nextActiveId);
    await persistBabies(updatedBabies, nextActiveId);

    toast.info("Perfil removido.");
  };

  return (
    <BabyProfileContext.Provider
      value={{
        babies,
        activeBaby,
        activeBabyId,
        activeBabyAgeMonths,
        activeBabyAgeCategory,
        isLoading,
        selectBaby,
        addBaby,
        updateBaby,
        deleteBaby,
        refreshBabies: loadBabies,
      }}
    >
      {children}
    </BabyProfileContext.Provider>
  );
};

export const useBabyProfiles = (): BabyProfileContextType => {
  const context = useContext(BabyProfileContext);
  if (!context) {
    throw new Error("useBabyProfiles must be used within a BabyProfileProvider");
  }
  return context;
};
