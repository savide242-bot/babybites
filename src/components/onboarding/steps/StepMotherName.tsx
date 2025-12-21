import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, User } from "lucide-react";

interface StepMotherNameProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

const StepMotherName = ({ value, onChange, onNext }: StepMotherNameProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-mint mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Hi there! What's your name?</h2>
        <p className="text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motherName" className="text-foreground font-medium">
          Your name
        </Label>
        <Input
          id="motherName"
          type="text"
          placeholder="e.g. Sarah, Emily, Jessica..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-2 focus:border-primary transition-colors text-lg py-6"
          autoFocus
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
        disabled={!value.trim()}
      >
        <span className="flex items-center gap-2">
          Continue
          <ArrowRight className="w-5 h-5" />
        </span>
      </Button>
    </form>
  );
};

export default StepMotherName;
