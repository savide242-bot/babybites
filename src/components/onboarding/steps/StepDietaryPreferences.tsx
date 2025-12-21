import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Utensils, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DietaryTag } from "@/hooks/useDietaryPreferences";

interface StepDietaryPreferencesProps {
  value: DietaryTag[];
  babyName: string;
  onChange: (value: DietaryTag[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DIETARY_OPTIONS: { value: DietaryTag; label: string; emoji: string; description: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬', description: 'No meat or fish' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱', description: 'No animal products' },
  { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛', description: 'No milk or dairy' },
  { value: 'nut-free', label: 'Nut-Free', emoji: '🥜', description: 'No nuts or peanuts' },
  { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾', description: 'No wheat, rye, barley' },
];

const StepDietaryPreferences = ({ value, babyName, onChange, onNext, onBack }: StepDietaryPreferencesProps) => {
  const togglePreference = (pref: DietaryTag) => {
    if (value.includes(pref)) {
      onChange(value.filter(p => p !== pref));
    } else {
      onChange([...value, pref]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-400 mb-4">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Does {babyName} have allergies?
        </h2>
        <p className="text-muted-foreground">
          Select all that apply (optional)
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium">
          Dietary preferences
        </Label>
        <div className="grid gap-3">
          {DIETARY_OPTIONS.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => togglePreference(option.value)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            {value.length > 0 ? `Continue (${value.length})` : "None, continue"}
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </form>
  );
};

export default StepDietaryPreferences;
