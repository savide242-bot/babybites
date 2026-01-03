import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyFavoritesProps {
  babyName?: string;
}

const EmptyFavorites = ({ babyName }: EmptyFavoritesProps) => {
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
          {/* Background circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            className="fill-primary/5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          />
          
          {/* Floating hearts */}
          <motion.g
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M60 80C60 72 52 64 42 64C32 64 24 72 24 82C24 102 60 120 60 120C60 120 96 102 96 82C96 72 88 64 78 64C68 64 60 72 60 80Z"
              className="fill-primary/20 stroke-primary"
              strokeWidth="2"
            />
          </motion.g>
          
          <motion.g
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <path
              d="M140 60C140 54 134 48 126 48C118 48 112 54 112 62C112 78 140 92 140 92C140 92 168 78 168 62C168 54 162 48 154 48C146 48 140 54 140 60Z"
              className="fill-accent/30 stroke-accent"
              strokeWidth="2"
            />
          </motion.g>
          
          <motion.g
            animate={{ y: [-2, 4, -2] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <path
              d="M110 130C110 125 105 120 98 120C91 120 86 125 86 132C86 145 110 156 110 156C110 156 134 145 134 132C134 125 129 120 122 120C115 120 110 125 110 130Z"
              className="fill-secondary/30 stroke-secondary"
              strokeWidth="2"
            />
          </motion.g>
          
          {/* Small decorative hearts */}
          <motion.circle
            cx="30"
            cy="140"
            r="4"
            className="fill-primary/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="170"
            cy="100"
            r="3"
            className="fill-accent/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="45"
            cy="50"
            r="5"
            className="fill-secondary/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ainda Sem Favoritos
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Explore as nossas 200+ receitas e guarde as suas favoritas tocando no coração ❤️
          {babyName && (
            <span className="block mt-2 text-sm">
              Perfeitas para o crescimento saudável de {babyName}!
            </span>
          )}
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Button asChild className="rounded-full px-8 py-6 text-lg shadow-elegant hover:shadow-glow transition-all">
          <Link to="/recipes">
            🍳 Explorar Receitas
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyFavorites;
