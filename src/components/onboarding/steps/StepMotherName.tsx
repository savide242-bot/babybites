import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";

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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-primary mb-2">
          <Heart className="w-9 h-9 text-white fill-white/30" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Welcome, mama!</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We're so glad you're here. Let's start by getting to know you — what should we call you?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motherName" className="text-foreground font-medium">
          Your first name
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
        className="w-full bg-gradient-to-r from-primary to-pink-400 text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
        disabled={!value.trim()}
      >
        <span className="flex items-center gap-2">
          That's me!
          <ArrowRight className="w-5 h-5" />
        </span>
      </Button>
    </form>
  );
};

export default StepMotherName;
