import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface PlanMealsPromptProps {
  hasMealsPlanned: boolean;
}

const PlanMealsPrompt = ({ hasMealsPlanned }: PlanMealsPromptProps) => {
  const navigate = useNavigate();

  if (hasMealsPlanned) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/planner")}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-peach/10 border border-primary/20 hover:border-primary/40 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">Plan today's meals</p>
          <p className="text-xs text-muted-foreground">Tap to create your meal plan</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </motion.button>
  );
};

export default PlanMealsPrompt;
