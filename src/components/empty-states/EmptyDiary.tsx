import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

interface EmptyDiaryProps {
  babyName?: string;
  onAddEntry?: () => void;
}

const EmptyDiary = ({ babyName, onAddEntry }: EmptyDiaryProps) => {
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
          {/* Book base */}
          <motion.rect
            x="35"
            y="50"
            width="130"
            height="120"
            rx="8"
            className="fill-primary/5 stroke-primary/20"
            strokeWidth="2"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.1 }}
          />
          
          {/* Book spine */}
          <motion.rect
            x="35"
            y="50"
            width="15"
            height="120"
            rx="4"
            className="fill-primary/20"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 }}
          />
          
          {/* Page lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.rect
                key={i}
                x="60"
                y={75 + i * 18}
                width={90 - i * 5}
                height="4"
                rx="2"
                className="fill-muted-foreground/15"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
          </motion.g>
          
          {/* Floating food emojis with reactions */}
          <motion.g
            animate={{ y: [-4, 4, -4], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="170" cy="45" r="18" className="fill-mint/20" />
            <text x="170" y="52" textAnchor="middle" className="text-xl">😋</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <circle cx="25" cy="100" r="14" className="fill-accent/20" />
            <text x="25" y="106" textAnchor="middle" className="text-base">🥣</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [-3, 3, -3], x: [-2, 2, -2] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <circle cx="175" cy="140" r="12" className="fill-sunshine/20" />
            <text x="175" y="145" textAnchor="middle" className="text-sm">🍎</text>
          </motion.g>
          
          {/* Pencil */}
          <motion.g
            animate={{ rotate: [-5, 5, -5], x: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect
              x="130"
              y="165"
              width="50"
              height="10"
              rx="2"
              transform="rotate(-45 130 165)"
              className="fill-accent"
            />
            <polygon
              points="95,195 100,180 110,190"
              className="fill-accent-foreground"
            />
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
          Empty Food Diary
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
          Start recording {babyName || 'baby'}'s reactions to foods.
          <br />
          <span className="text-primary/70">It's a great way to detect allergies!</span>
        </p>
      </motion.div>

      {/* CTA Button */}
      {onAddEntry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Button 
            onClick={onAddEntry}
            className="rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Entry
          </Button>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-primary/5 rounded-xl text-xs text-muted-foreground max-w-xs mx-auto"
      >
        <p className="font-medium text-foreground mb-1">💡 Tip</p>
        <p>Record each new food and wait 3-5 days before introducing another.</p>
      </motion.div>
    </motion.div>
  );
};

export default EmptyDiary;
