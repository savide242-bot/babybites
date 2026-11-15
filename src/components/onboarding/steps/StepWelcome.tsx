import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChefHat, Calendar, Heart, Loader2 } from "lucide-react";
import { differenceInMonths } from "date-fns";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface StepWelcomeProps {
  motherName: string;
  babyName: string;
  birthDate: Date | undefined;
  isLoading: boolean;
  onComplete: () => void;
  onBack: () => void;
}

const StepWelcome = ({ motherName, babyName, birthDate, isLoading, onComplete, onBack }: StepWelcomeProps) => {
  const babyAgeMonths = birthDate ? differenceInMonths(new Date(), birthDate) : 6;

  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#48B774', '#1E5E3A', '#86efac', '#d1fae5', '#FFE66D'],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getAgeBasedMessage = () => {
    if (babyAgeMonths < 6) return "Starting the weaning journey!";
    if (babyAgeMonths < 9) return "Exploring new flavors and textures!";
    if (babyAgeMonths < 12) return "Ready for more complex recipes and finger foods!";
    return "Perfect time for family meals together!";
  };

  const features = [
    {
      icon: <ChefHat className="w-5 h-5" style={{ color: '#1E5E3A' }} />,
      bg: '#1E5E3A',
      title: '340+ Personalized Recipes',
      subtitle: `Tailored for ${babyAgeMonths} months`,
    },
    {
      icon: <Calendar className="w-5 h-5" style={{ color: '#1E5E3A' }} />,
      bg: '#1E5E3A',
      title: 'Weekly Meal Plans',
      subtitle: getAgeBasedMessage(),
    },
    {
      icon: <Heart className="w-5 h-5" style={{ color: '#be185d' }} />,
      bg: '#be185d',
      title: 'Daily Nutrition Tips',
      subtitle: 'Expert baby nutrition advice',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ background: 'linear-gradient(135deg, #1E5E3A, #48B774)' }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-serif font-bold" style={{ color: '#111827' }}>
          🎉 All set, {motherName || 'there'}!
        </h2>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Welcome to <span style={{ color: '#1E5E3A', fontWeight: 600 }}>BabyBites</span>
        </p>
      </div>

      {/* Features card */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
      >
        <p className="text-xs font-semibold text-center uppercase tracking-wide" style={{ color: '#16a34a' }}>
          Ready for {babyName || 'your baby'}
        </p>
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#ffffff' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${f.bg}18` }}
            >
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{f.title}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{f.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 rounded-full border-stone-200 text-stone-600 hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1 rounded-full font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1E5E3A, #48B774)' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Let's go!
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepWelcome;
