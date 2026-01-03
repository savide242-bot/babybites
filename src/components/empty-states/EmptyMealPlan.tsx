import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';

interface EmptyMealPlanProps {
  babyName?: string;
}

const EmptyMealPlan = ({ babyName }: EmptyMealPlanProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6"
    >
      {/* SVG Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-44 h-44 mx-auto mb-6"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <motion.rect
            x="30"
            y="40"
            width="140"
            height="130"
            rx="16"
            className="fill-primary/5 stroke-primary/20"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          
          {/* Calendar header */}
          <motion.rect
            x="30"
            y="40"
            width="140"
            height="30"
            rx="16"
            className="fill-primary/20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3 }}
          />
          
          {/* Calendar dots/days */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              [0, 1, 2].map((row) => (
                <motion.circle
                  key={`${col}-${row}`}
                  cx={50 + col * 18}
                  cy={90 + row * 25}
                  r="5"
                  className="fill-muted-foreground/20"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: (col + row) * 0.1
                  }}
                />
              ))
            ))}
          </motion.g>
          
          {/* Floating food icons */}
          <motion.g
            animate={{ y: [-3, 3, -3], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="160" cy="35" r="18" className="fill-accent/20" />
            <text x="160" y="42" textAnchor="middle" className="text-2xl">🥕</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [3, -3, 3], rotate: [5, -5, 5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <circle cx="40" cy="180" r="16" className="fill-mint/20" />
            <text x="40" y="186" textAnchor="middle" className="text-xl">🥦</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [-2, 4, -2] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <circle cx="175" cy="150" r="14" className="fill-sunshine/20" />
            <text x="175" y="155" textAnchor="middle" className="text-lg">🍌</text>
          </motion.g>
          
          {/* Plus icon in center */}
          <motion.g
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <circle cx="100" cy="115" r="20" className="fill-primary/10 stroke-primary/40" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="90" y1="115" x2="110" y2="115" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="105" x2="100" y2="125" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </svg>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-xl font-bold text-foreground">
          Plano de Refeições Vazio
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          Planeie as refeições da semana para {babyName || 'o bebé'} e nós lembramos quando é hora de cozinhar! 🍳
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Button asChild className="rounded-xl gap-2 bg-gradient-to-r from-primary to-secondary text-white">
          <Link to="/planner">
            <Calendar className="w-4 h-4" />
            Começar a Planear
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyMealPlan;
