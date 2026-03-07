import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";

const messages = [
  "Selecting nutritious recipes... 🥦",
  "Balancing vitamins & proteins... 🥩",
  "Matching your baby's age group... 👶",
  "Creating the perfect weekly plan... 📋",
  "Almost ready... ✨",
];

interface PlanGeneratingOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  babyAgeMonths: number;
}

const PlanGeneratingOverlay = ({ isVisible, onComplete, babyAgeMonths }: PlanGeneratingOverlayProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      setProgress(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= messages.length - 1) return prev;
        return prev + 1;
      });
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 60);

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm text-center">
        {/* Animated cooking icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
            <ChefHat className="h-12 w-12 text-primary animate-bounce" />
          </div>
          {/* Floating steam particles */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/40"
                style={{
                  animation: `float-up 1.5s ease-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Creating a personalized plan for your little one 🍼
          </h2>
          <p className="text-sm text-muted-foreground">
            Tailored for your {babyAgeMonths}-month-old baby
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cycling message */}
        <p className="text-sm font-medium text-primary min-h-[1.5rem] transition-opacity duration-300">
          {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default PlanGeneratingOverlay;
