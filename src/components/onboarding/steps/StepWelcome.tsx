import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ChefHat, Calendar, Heart } from "lucide-react";
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
    // Trigger confetti on mount
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181']
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const getAgeBasedMessage = () => {
    if (babyAgeMonths < 6) {
      return "Perfeito para começar a introdução alimentar!";
    } else if (babyAgeMonths < 9) {
      return "Fase ideal para explorar novos sabores e texturas!";
    } else if (babyAgeMonths < 12) {
      return "Pronto para receitas mais complexas e finger foods!";
    } else {
      return "Altura perfeita para refeições em família!";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary via-mint to-cyan-400 mb-4 animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          🎉 Tudo pronto, {motherName}!
        </h2>
        <p className="text-lg text-muted-foreground">
          Bem-vinda ao BabyBites
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary/10 via-mint/10 to-cyan-100/30 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-center">
          O que preparámos para o {babyName}:
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">+300 Receitas Personalizadas</p>
              <p className="text-sm text-muted-foreground">Adaptadas para {babyAgeMonths} meses</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="font-medium text-foreground">Plano Semanal Gerado</p>
              <p className="text-sm text-muted-foreground">{getAgeBasedMessage()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-pink-400/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Dicas Diárias</p>
              <p className="text-sm text-muted-foreground">Conselhos de nutrição infantil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 py-6"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              A guardar...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Começar a explorar!
              <Sparkles className="w-5 h-5" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepWelcome;
