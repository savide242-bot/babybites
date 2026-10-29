import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby, Calendar, Heart, Sparkles, Check } from "lucide-react";
import { useBabyProfiles } from "@/hooks/useBabyProfiles";
import { toast } from "sonner";

interface AddBabyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMOJI_OPTIONS = ["👶", "🍼", "🧸", "🥑", "🥕", "🍓", "🐣", "🦁", "🐻", "👑", "🌈", "⭐"];

export const AddBabyModal: React.FC<AddBabyModalProps> = ({ open, onOpenChange }) => {
  const { addBaby } = useBabyProfiles();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "other">("other");
  const [avatarEmoji, setAvatarEmoji] = useState("👶");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the child's name");
      return;
    }
    if (!birthDate) {
      toast.error("Please select a birth date");
      return;
    }

    setIsSubmitting(true);
    try {
      await addBaby({
        name: name.trim(),
        birthDate,
        gender,
        avatarEmoji,
        allergies: [],
        dietaryPreferences: [],
        isDefault: false,
      });

      // Reset form
      setName("");
      setBirthDate("");
      setGender("other");
      setAvatarEmoji("👶");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Error adding child: " + (err.message || "Please try again"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#EBE8DF] rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E5E3A] flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <Baby className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-serif text-gray-900">
            Add New Child / Baby
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Register another child to manage their meals, recipes, and weekly meal plan independently within the same account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Baby Name */}
          <div className="space-y-1.5">
            <Label htmlFor="baby-name" className="text-xs font-semibold text-gray-700">
              Child's Name *
            </Label>
            <Input
              id="baby-name"
              placeholder="e.g. Lucas or Sophia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border-[#E8EDE4] focus:ring-2 focus:ring-[#1E5E3A]"
              required
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-1.5">
            <Label htmlFor="baby-birthdate" className="text-xs font-semibold text-gray-700">
              Birth Date *
            </Label>
            <div className="relative">
              <Input
                id="baby-birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-10 rounded-xl border-[#E8EDE4] focus:ring-2 focus:ring-[#1E5E3A] pr-10"
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <p className="text-[11px] text-gray-400">
              The app calculates age in months to tailor recipes and weekly meal plans.
            </p>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Gender</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setGender("boy"); setAvatarEmoji("👦"); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  gender === "boy"
                    ? "bg-[#EAF5EE] border-[#1E5E3A] text-[#1E5E3A] font-semibold"
                    : "border-[#E8EDE4] text-gray-600 hover:bg-gray-50"
                }`}
              >
                👦 Boy
              </button>
              <button
                type="button"
                onClick={() => { setGender("girl"); setAvatarEmoji("👧"); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  gender === "girl"
                    ? "bg-[#FFF0F5] border-[#D84B75] text-[#D84B75] font-semibold"
                    : "border-[#E8EDE4] text-gray-600 hover:bg-gray-50"
                }`}
              >
                👧 Girl
              </button>
              <button
                type="button"
                onClick={() => { setGender("other"); setAvatarEmoji("👶"); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  gender === "other"
                    ? "bg-[#FAF5E6] border-[#D4A373] text-[#78350F] font-semibold"
                    : "border-[#E8EDE4] text-gray-600 hover:bg-gray-50"
                }`}
              >
                👶 Other
              </button>
            </div>
          </div>

          {/* Avatar Icon Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Child Avatar / Icon</Label>
            <div className="flex flex-wrap gap-2 p-2 bg-[#FAF9F5] rounded-xl border border-[#E8EDE4]">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform ${
                    avatarEmoji === emoji
                      ? "bg-white border-2 border-[#1E5E3A] shadow-xs scale-110"
                      : "hover:bg-white/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#E8EDE4]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5E3A] hover:bg-[#1E5E3A]/90 text-white rounded-xl gap-1.5 font-medium shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Child Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
