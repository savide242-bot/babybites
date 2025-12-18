import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Calendar, ChefHat } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface WeekCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onGenerateNewWeek: () => void;
  completedMeals: number;
  weekNumber: number;
}

export const WeekCompletionModal = ({
  open,
  onClose,
  onGenerateNewWeek,
  completedMeals,
  weekNumber,
}: WeekCompletionModalProps) => {
  useEffect(() => {
    if (open) {
      // Celebrate with confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [open]);

  const handleGenerateNew = () => {
    onGenerateNewWeek();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center animate-bounce">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            🎉 Semana Completa!
          </DialogTitle>
          <DialogDescription className="text-base mt-4 space-y-3">
            <p>
              Parabéns! Você preparou todas as <strong>{completedMeals} refeições</strong> da semana {weekNumber}!
            </p>
            <p className="text-muted-foreground">
              Seu bebé está a ter uma alimentação equilibrada e nutritiva graças ao seu esforço! 💪
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-sm">Nova Semana, Novas Receitas!</h4>
              <p className="text-xs text-muted-foreground">
                Vamos gerar um plano fresco com receitas diferentes para a próxima semana?
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={handleGenerateNew} className="w-full gap-2">
            <ChefHat className="h-4 w-4" />
            Gerar Novo Plano Semanal
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Continuar com o Plano Atual
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
