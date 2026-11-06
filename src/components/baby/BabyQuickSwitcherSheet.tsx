import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, User, Sparkles, Heart, ArrowRight } from "lucide-react";
import { useBabyProfiles, calculateMonthsFromBirthDate, getCategoryFromMonths } from "@/hooks/useBabyProfiles";
import { AddBabyModal } from "./AddBabyModal";

interface BabyQuickSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BabyQuickSwitcherSheet: React.FC<BabyQuickSwitcherSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const { babies, activeBaby, selectBaby } = useBabyProfiles();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (babyId: string) => {
    selectBaby(babyId);
    onOpenChange(false);
  };

  const handleGoToProfile = () => {
    onOpenChange(false);
    navigate("/profile");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 bg-white dark:bg-[#161c18] border-t border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 max-h-[85vh] overflow-y-auto">
          {/* Subtle top grab handle */}
          <div className="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mb-4" />

          <SheetHeader className="text-left pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full mb-1.5">
                  <Sparkles className="w-3 h-3" /> Child Profiles
                </span>
                <SheetTitle className="font-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                  Switch Active Child
                </SheetTitle>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-stone-800 dark:to-stone-700 border border-amber-200/60 flex items-center justify-center text-2xl shadow-xs shrink-0">
                {activeBaby?.avatarEmoji || "👶"}
              </div>
            </div>
            <SheetDescription className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Recipes, portion sizes, and weekly meal plans adapt immediately to your selected child's age.
            </SheetDescription>
          </SheetHeader>

          {/* List of Registered Children */}
          <div className="py-4 space-y-2.5">
            {babies.map((baby) => {
              const months = calculateMonthsFromBirthDate(baby.birthDate);
              const category = getCategoryFromMonths(months);
              const isCurrent = baby.id === activeBaby?.id;

              return (
                <div
                  key={baby.id}
                  onClick={() => handleSelect(baby.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-[#1E5E3A] dark:border-emerald-500 shadow-xs"
                      : "bg-white dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border ${
                      isCurrent
                        ? "bg-white dark:bg-stone-800 border-emerald-300 dark:border-emerald-700"
                        : "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                    }`}>
                      {baby.avatarEmoji || "👶"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate">
                          {baby.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1E5E3A] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {months} {months === 1 ? "month" : "months"} • {category}
                      </p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0">
                      Select
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setAddModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-emerald-600/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 text-[#1E5E3A] dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register Another Child or Baby</span>
            </button>

            <Button
              onClick={handleGoToProfile}
              variant="outline"
              className="w-full rounded-2xl text-xs font-bold h-11 border-stone-200 dark:border-stone-700 gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>Open Full Mother Profile & Settings</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 ml-auto" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AddBabyModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </>
  );
};

export default BabyQuickSwitcherSheet;
