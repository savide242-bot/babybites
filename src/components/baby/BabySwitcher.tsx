import React, { useState } from "react";
import { useBabyProfiles, calculateMonthsFromBirthDate, getCategoryFromMonths } from "@/hooks/useBabyProfiles";
import { AddBabyModal } from "./AddBabyModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, Check, Baby, Sparkles } from "lucide-react";

export const BabySwitcher: React.FC<{ variant?: "header" | "banner" | "minimal" }> = ({
  variant = "header",
}) => {
  const { babies, activeBaby, selectBaby } = useBabyProfiles();
  const [addModalOpen, setAddModalOpen] = useState(false);

  if (!activeBaby) return null;

  const activeMonths = calculateMonthsFromBirthDate(activeBaby.birthDate);
  const activeCategory = getCategoryFromMonths(activeMonths);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "header" ? (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#EBE8DF] hover:border-[#CCE0D2] hover:bg-[#F4F8F4] transition-all text-gray-700 shadow-xs text-xs font-medium cursor-pointer"
              title="Switch active child profile"
            >
              <span className="text-sm">{activeBaby.avatarEmoji || "👶"}</span>
              <span className="font-semibold text-gray-800 max-w-[85px] truncate">
                {activeBaby.name}
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#EAF5EE] text-[#1E5E3A] font-medium">
                {activeMonths}m
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          ) : variant === "banner" ? (
            <button className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-[#EBE8DF] shadow-xs hover:border-[#1E5E3A]/40 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF5EE] text-xl flex items-center justify-center border border-[#CCE0D2]">
                  {activeBaby.avatarEmoji || "👶"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">{activeBaby.name}</h4>
                    <Badge variant="outline" className="bg-[#EAF5EE] text-[#1E5E3A] border-none text-[10px] font-semibold">
                      {activeMonths} {activeMonths === 1 ? "month" : "months"} ({activeCategory})
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tap to switch child profile or view meal plan for another child
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#1E5E3A] bg-[#FAF9F5] px-2.5 py-1.5 rounded-xl border border-[#E8EDE4]">
                <span>Switch</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-forest">
              <span>{activeBaby.avatarEmoji || "👶"}</span>
              <span className="font-bold underline">{activeBaby.name} ({activeMonths}m)</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 bg-white rounded-2xl p-2 shadow-xl border border-[#EBE8DF]"
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-serif text-gray-900">
                Registered Children ({babies.length})
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400">
                1 Account
              </span>
            </div>
            <p className="text-[11px] font-normal text-gray-500 mt-0.5">
              Select a child to view recipes and meal plans tailored to their age.
            </p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-[#EBE8DF] my-1" />

          {/* List of Babies */}
          <div className="space-y-1">
            {babies.map((baby) => {
              const months = calculateMonthsFromBirthDate(baby.birthDate);
              const category = getCategoryFromMonths(months);
              const isCurrent = baby.id === activeBaby.id;

              return (
                <DropdownMenuItem
                  key={baby.id}
                  onClick={() => selectBaby(baby.id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-[#EAF5EE] text-[#1E5E3A] font-semibold"
                      : "hover:bg-[#FAF9F5] text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{baby.avatarEmoji || "👶"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-gray-900">{baby.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {months} {months === 1 ? "month" : "months"} • {category}
                      </p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="bg-[#EBE8DF] my-1.5" />

          {/* Add Another Baby CTA */}
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-[#CCE0D2] bg-[#F4F8F4] hover:bg-[#EAF5EE] text-[#1E5E3A] text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Another Child / Baby</span>
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddBabyModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </>
  );
};
