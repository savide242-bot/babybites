import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Baby, Calendar, Heart, Sparkles } from "lucide-react";
import { differenceInMonths } from "date-fns";

interface StepProfileBasicsProps {
  motherName: string;
  babyName: string;
  birthDate: string; // ISO date YYYY-MM-DD
  onMotherNameChange: (val: string) => void;
  onBabyNameChange: (val: string) => void;
  onBirthDateChange: (val: string) => void;
  onNext: () => void;
}

export const StepProfileBasics: React.FC<StepProfileBasicsProps> = ({
  motherName,
  babyName,
  birthDate,
  onMotherNameChange,
  onBabyNameChange,
  onBirthDateChange,
  onNext,
}) => {
  const getBabyStage = () => {
    if (!birthDate) return null;
    const months = differenceInMonths(new Date(), new Date(birthDate));
    if (months < 6) return "🍼 Pre-feeding preparation (< 6 months)";
    if (months <= 8) return "🥑 6–8 Months • First Purees & Soft Finger Foods";
    if (months <= 11) return "🥦 9–11 Months • Expanding Textures & Variety";
    if (months <= 23) return "🍓 12–23 Months • Toddler Meals & Finger Foods";
    return "🍽️ 24+ Months • Family Table Foods";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motherName.trim() && babyName.trim() && birthDate) {
      onNext();
    }
  };

  const isComplete = motherName.trim() !== "" && babyName.trim() !== "" && Boolean(birthDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1.5 mb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E5E3A]/10 text-[#1E5E3A] mb-1">
          <Heart className="w-7 h-7 text-[#1E5E3A] fill-[#1E5E3A]/20" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">
          Tell us about your family
        </h2>
        <p className="text-stone-500 text-xs max-w-sm mx-auto">
          We customize all recipe textures, portion sizes, and weekly meal plans based on these details.
        </p>
      </div>

      <div className="space-y-4">
        {/* Mother / Parent's Name */}
        <div className="space-y-1.5">
          <Label htmlFor="motherName" className="text-xs font-semibold text-stone-700">
            Your Name (Parent)
          </Label>
          <Input
            id="motherName"
            type="text"
            placeholder="e.g. Sarah Jenkins"
            value={motherName}
            onChange={(e) => onMotherNameChange(e.target.value)}
            className="rounded-xl border-stone-200 bg-stone-50/50 text-sm h-11 focus-visible:ring-[#1E5E3A]"
            required
            autoFocus
          />
        </div>

        {/* Baby's Name */}
        <div className="space-y-1.5">
          <Label htmlFor="babyName" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Baby className="w-3.5 h-3.5 text-[#1E5E3A]" />
            Baby's Name or Nickname
          </Label>
          <Input
            id="babyName"
            type="text"
            placeholder="e.g. Oliver"
            value={babyName}
            onChange={(e) => onBabyNameChange(e.target.value)}
            className="rounded-xl border-stone-200 bg-stone-50/50 text-sm h-11 focus-visible:ring-[#1E5E3A]"
            required
          />
        </div>

        {/* Baby's Birth Date */}
        <div className="space-y-1.5">
          <Label htmlFor="birthDate" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1E5E3A]" />
            Baby's Date of Birth
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => onBirthDateChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="rounded-xl border-stone-200 bg-stone-50/50 text-sm h-11 focus-visible:ring-[#1E5E3A]"
            required
          />
          {birthDate && (
            <div className="p-2.5 rounded-xl bg-[#1E5E3A]/5 border border-[#1E5E3A]/15 text-xs text-[#1E5E3A] font-medium flex items-center gap-2 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-[#48B774] shrink-0" />
              <span>{getBabyStage()}</span>
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isComplete}
        className="w-full h-12 rounded-full font-semibold bg-[#1E5E3A] hover:bg-[#16472c] text-white shadow-sm mt-4 text-sm"
      >
        <span className="flex items-center gap-2">
          Continue to Preferences
          <ArrowRight className="w-4 h-4" />
        </span>
      </Button>
    </form>
  );
};

export default StepProfileBasics;
