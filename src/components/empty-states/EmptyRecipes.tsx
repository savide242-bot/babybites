import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface EmptyRecipesProps {
  onClearFilters?: () => void;
}

const EmptyRecipes = ({ onClearFilters }: EmptyRecipesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6"
    >
      {/* SVG Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-48 h-48 mx-auto mb-6"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Magnifying glass body */}
          <motion.circle
            cx="85"
            cy="85"
            r="45"
            className="fill-primary/5 stroke-primary/30"
            strokeWidth="6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          
          {/* Magnifying glass handle */}
          <motion.line
            x1="118"
            y1="118"
            x2="160"
            y2="160"
            className="stroke-primary/40"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
          
          {/* Question mark inside */}
          <motion.text
            x="85"
            y="100"
            textAnchor="middle"
            className="text-4xl fill-muted-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            ?
          </motion.text>
          
          {/* Floating food items looking "lost" */}
          <motion.g
            animate={{ x: [-5, 5, -5], y: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="160" cy="40" r="16" className="fill-accent/10" />
            <text x="160" y="46" textAnchor="middle" className="text-lg">🍎</text>
          </motion.g>
          
          <motion.g
            animate={{ x: [5, -5, 5], y: [3, -3, 3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <circle cx="30" cy="130" r="14" className="fill-mint/10" />
            <text x="30" y="135" textAnchor="middle" className="text-base">🥗</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <circle cx="175" cy="120" r="12" className="fill-sunshine/10" />
            <text x="175" y="125" textAnchor="middle" className="text-sm">🍐</text>
          </motion.g>
          
          {/* Sparkles to indicate searching */}
          <motion.circle
            cx="50"
            cy="60"
            r="3"
            className="fill-primary/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="115"
            cy="50"
            r="2"
            className="fill-accent/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
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
          No Recipes Found
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          We couldn't find recipes with the current filters. Try adjusting your search or clearing filters.
        </p>
      </motion.div>

      {/* CTA Button */}
      {onClearFilters && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="rounded-full gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-xs text-muted-foreground"
      >
        <p>💡 Try: "banana", "puree" or filter by age</p>
      </motion.div>
    </motion.div>
  );
};

export default EmptyRecipes;
