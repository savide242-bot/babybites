import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Calendar, Cake } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface StepBirthDateProps {
  value: Date | undefined;
  babyName: string;
  onChange: (value: Date | undefined) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepBirthDate = ({ value, babyName, onChange, onNext, onBack }: StepBirthDateProps) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      onNext();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const babyAgeMonths = value ? differenceInMonths(new Date(), value) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 mb-4">
          <Cake className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          When was {babyName} born?
        </h2>
        <p className="text-muted-foreground">
          This helps us suggest age-appropriate recipes
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium">
          Birth date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal py-6 text-lg border-2",
                !value && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-5 w-5" />
              {value ? format(value, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date > new Date() || date < new Date("2020-01-01")
              }
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {babyAgeMonths !== null && babyAgeMonths >= 0 && (
        <div className="bg-primary/10 rounded-lg p-4 text-center animate-fade-in">
          <p className="text-foreground font-medium">
            🎂 {babyName} is {babyAgeMonths} {babyAgeMonths === 1 ? "month" : "months"} old!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            We'll recommend perfect recipes for this age
          </p>
        </div>
      )}

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
          disabled={!value}
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

export default StepBirthDate;
