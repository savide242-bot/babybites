import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface PlanMealsPromptProps {
  hasMealsPlanned: boolean;
}

const PlanMealsPrompt = ({ hasMealsPlanned }: PlanMealsPromptProps) => {
  const navigate = useNavigate();

  if (hasMealsPlanned) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-peach/10 border border-primary/20 p-4 space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">A personalized plan for your baby</p>
          <p className="text-xs text-muted-foreground mt-0.5">Balanced, nutritious meals tailored to your baby's age and needs — ready in seconds.</p>
        </div>
      </div>
      <button
        onClick={() => navigate("/planner")}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Create Personalized Plan
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default PlanMealsPrompt;
