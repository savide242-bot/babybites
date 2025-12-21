import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Baby } from "lucide-react";

interface StepBabyNameProps {
  value: string;
  motherName: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepBabyName = ({ value, motherName, onChange, onNext, onBack }: StepBabyNameProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-mint to-cyan-400 mb-4">
          <Baby className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Hi, {motherName}! 👋
        </h2>
        <p className="text-muted-foreground">
          What's your baby's name?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="babyName" className="text-foreground font-medium">
          Baby's name
        </Label>
        <Input
          id="babyName"
          type="text"
          placeholder="e.g. Oliver, Emma, Noah..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-2 focus:border-primary transition-colors text-lg py-6"
          autoFocus
          required
        />
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
          disabled={!value.trim()}
        >
          <span className="flex items-center gap-2">
            Continue
            <ArrowRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </form>
  );
};

export default StepBabyName;
