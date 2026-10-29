export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // ISO string or YYYY-MM-DD
  gender?: "boy" | "girl" | "other";
  allergies?: string[];
  dietaryPreferences?: string[];
  avatarEmoji?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type BabyAgeCategory = "6-8 months" | "9-11 months" | "12-23 months" | "24+ months";

export interface BabyProfileContextType {
  babies: BabyProfile[];
  activeBaby: BabyProfile | null;
  activeBabyId: string | null;
  activeBabyAgeMonths: number;
  activeBabyAgeCategory: BabyAgeCategory;
  isLoading: boolean;
  selectBaby: (id: string) => Promise<void>;
  addBaby: (baby: Omit<BabyProfile, "id" | "createdAt">) => Promise<BabyProfile>;
  updateBaby: (id: string, updates: Partial<BabyProfile>) => Promise<void>;
  deleteBaby: (id: string) => Promise<void>;
  refreshBabies: () => Promise<void>;
}
