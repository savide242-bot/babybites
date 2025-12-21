import { X, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialTooltipProps {
  title: string;
  description: string;
  onDismiss: () => void;
  onAction?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  step?: number;
  totalSteps?: number;
}

const TutorialTooltip = ({
  title,
  description,
  onDismiss,
  onAction,
  position = 'bottom',
  step,
  totalSteps
}: TutorialTooltipProps) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div 
      className={cn(
        "absolute z-50 w-64 animate-fade-in",
        positionClasses[position]
      )}
    >
      <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-lg relative">
        {/* Arrow */}
        <div 
          className={cn(
            "absolute w-3 h-3 bg-primary transform rotate-45",
            position === 'bottom' && "-top-1.5 left-6",
            position === 'top' && "-bottom-1.5 left-6",
            position === 'left' && "-right-1.5 top-4",
            position === 'right' && "-left-1.5 top-4"
          )}
        />
        
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-2 mb-2">
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs opacity-90 mt-1">{description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {step && totalSteps && (
            <span className="text-xs opacity-70">
              {step} of {totalSteps}
            </span>
          )}
          {onAction && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onAction}
              className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
            >
              Got it
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;
